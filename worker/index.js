// WILD CROWN Worker (LA-R R-2): 정적 파일(dist)은 그대로 두고 /api/rank/* 만 여기서 받는다.
// 랭크 판이 끝나면 두 사람이 각자 서명한 보고서를 보낸다. 둘 다 오고, 서명·글·다시 두기가 맞을 때만 Glicko-2 를 갱신한다.
// 저장은 D1(binding RANK, worker/migrations). Supabase 무료 정지를 피하려고 랭크 기록은 Cloudflare 에 둔다(계획서 §4.2).
//   POST /api/rank/result   body = src/rank/report.js 의 보고서 → { status: waiting | counted | mismatch | rejected, outcome?, ... }
//   GET  /api/rank/player?id=<기기 id>[&vs=<상대 id>] → { id, rating, rd, games, wins, losses, draws, badge, ladder, season, trophies, firsts, pair? }
// RW-1·RW-2(랭커 보상, src/rank/rankMarks.js): 첫 도달 도장(firsts 표, counted 응답의 ladder.first), 친구 무대 줄에 친구 테두리(frame).
// L-4(시즌, src/rank/season.js): 4주마다 사다리 300점 내림. 정해진 시각에 도는 작업 없이, 사람을 읽거나 판을 넣을 때 넘긴다(player()).
// R-4(남용 막기, src/rank/abuse.js):
//   · 같은 두 사람은 하루 3판·7일 10판까지만 점수에 든다. 넘으면 기록만(outcome 'capped').
//   · 두 수 미만으로 끝난 판은 무효(outcome 'void').
//   · 보고서의 시간 기록이 사람이 낼 수 없으면 거부하고 flags 에 남긴다. 빌드 번호가 MIN_BUILD 보다 낮으면 거부.
//   · 이탈 몰수(reason 'abandon')는 남은 사람 혼자 보고한다. 상대 영수증을 검사하고 ABANDON_WAIT_MS 뒤에 넣는다.
// L-3(친구 무대, src/rank/circle.js):
//   POST /api/rank/circle   body = { id, pub, at, sig }  sig = circleText(id, at) 서명 → { circle: [{ id, me?, rank, points, place, wins?, losses?, draws?, games?, last? }] }
//   자기 서명이 있어야 답한다(남의 친구 목록은 못 읽는다). 이름은 서버에 없다.
import { checkReport, checkAbandon, agree } from '../src/rank/report.js';
import { START, rateGame, badgeOf } from '../src/rank/glicko2.js';
import { START_LADDER, applyGame, placeOf } from '../src/rank/ladder.js';
import { RIBBON_MIN_GAMES, SEASON_MIN_GAMES, bestTrophy, daysLeft, rollSeason, seasonEnd, seasonOf } from '../src/rank/season.js';
import { newFirsts } from '../src/rank/rankMarks.js';
import { CIRCLE_MAX, circleOf, circleRequestError, circleText } from '../src/rank/circle.js';
import { identityIdOf, verifySignature } from '../src/net/identity.js';
import { ABANDON_WAIT_MS, MIN_PLIES, PAIR_DAILY_CAP, PAIR_WEEKLY_CAP, RANK_BUILD, dayOf, metaError, pairCapped } from '../src/rank/abuse.js';

const MAX_BODY = 32 * 1024;
const ID_RE = /^[A-Za-z0-9_-]{16}$/;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS } });

/** 한 사람을 읽는다. 시즌이 지났으면(L-4) 그 자리에서 넘기고 지난 시즌 테두리를 남긴다. */
async function player(db, id, now = Date.now()) {
  const p = await db.prepare('SELECT * FROM players WHERE id = ?').bind(id).first();
  if (!p) return p;
  const cur = seasonOf(now);
  const r = rollSeason(p, cur);
  if (!r.rolled) return r.row;
  const n = r.row;
  const writes = [db.prepare('UPDATE players SET points = ?, floor = ?, streak = ?, season = ?, peak = ?, sgames = 0 WHERE id = ? AND season < ?')
    .bind(n.points, n.floor, n.streak, cur, n.peak, id, cur)];
  if (r.trophy) writes.push(db.prepare('INSERT OR IGNORE INTO trophies (id, season, tier, peak, games, at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, r.trophy.season, r.trophy.tier, r.trophy.peak, p.sgames || 0, now));
  await db.batch(writes);
  return n;
}
const seasonView = (p, now) => {
  const n = seasonOf(now);
  return { n, endsAt: seasonEnd(n), daysLeft: daysLeft(now), games: p.sgames || 0, peak: Math.max(p.peak || 0, p.points || 0), minGames: SEASON_MIN_GAMES, ribbonGames: RIBBON_MIN_GAMES };
};
const publicView = (p, now = Date.now()) => p && ({
  id: p.id, rating: Math.round(p.rating), rd: Math.round(p.rd), games: p.games, wins: p.wins, losses: p.losses, draws: p.draws, badge: badgeOf(p.rating, p.games),
  ladder: { points: p.points || 0, floor: p.floor || 0, streak: p.streak || 0, place: placeOf(p.points || 0) },
  season: seasonView(p, now)
});
const ladderOf = (p) => ({ points: p.points || 0, floor: p.floor || 0, streak: p.streak || 0 });
/** 화면에 보낼 사다리 변화 한 사람 몫. */
const ladderView = (l, first = null) => ({ first, before: l.before.points, after: l.after.points, delta: l.delta, place: l.after, from: l.before, floored: l.floored, streakBonus: l.streakBonus, tierUp: l.tierUp, stepUp: l.stepUp, streak: l.state.streak });
const pairOf = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
const myPliesOf = (m, signer) => (signer === m.white ? Math.ceil(m.moves.length / 2) : Math.floor(m.moves.length / 2));

async function counted(db, matchId) {
  const m = await db.prepare('SELECT * FROM matches WHERE match_id = ?').bind(matchId).first();
  if (!m) return null;
  let ladder = null;
  try { ladder = m.ladder ? JSON.parse(m.ladder) : null; } catch (e) { ladder = null; }
  return {
    status: 'counted', outcome: m.status || 'counted', matchId, result: m.result, reason: m.reason,
    white: { id: m.white, before: Math.round(m.white_before), after: Math.round(m.white_after), ladder: ladder?.white ?? null },
    black: { id: m.black, before: Math.round(m.black_before), after: Math.round(m.black_after), ladder: ladder?.black ?? null }
  };
}

/** 같은 두 사람이 오늘·지난 7일 점수에 넣은 판 수. */
async function pairCounts(db, a, b, now) {
  const day = dayOf(now);
  const row = await db.prepare(`SELECT
      SUM(CASE WHEN day = ? THEN 1 ELSE 0 END) AS today, COUNT(*) AS week
    FROM matches WHERE pair = ? AND status = 'counted' AND day > ?`).bind(day, pairOf(a, b), day - 7).first();
  return { today: row?.today || 0, week: row?.week || 0 };
}

/** 판 하나를 넣는다(두 사람 보고가 맞았거나, 혼자 낸 이탈 몰수가 기다림을 지났을 때). */
async function commit(db, matchId, m, whiteScore, pubOf, now) {
  const counts = await pairCounts(db, m.white, m.black, now);
  const status = m.moves.length < MIN_PLIES ? 'void' : pairCapped(counts.today, counts.week) ? 'capped' : 'counted';
  const w = (await player(db, m.white, now)) || { id: m.white, ...START, ...START_LADDER, games: 0, wins: 0, losses: 0, draws: 0, created: now };
  const b = (await player(db, m.black, now)) || { id: m.black, ...START, ...START_LADDER, games: 0, wins: 0, losses: 0, draws: 0, created: now };
  const insertMatch = (wAfter, bAfter, ladderJson) => db.prepare(`INSERT INTO matches (match_id, white, black, result, reason, plies, at, white_before, white_after, black_before, black_after, ladder, status, day, pair)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(matchId, m.white, m.black, m.result, m.reason, m.moves.length, now, w.rating, wAfter, b.rating, bAfter, ladderJson, status, dayOf(now), pairOf(m.white, m.black));
  const dropReports = db.prepare('DELETE FROM reports WHERE match_id = ?').bind(matchId);
  let batch;
  if (status !== 'counted') {
    // 상한·무효: 판은 남기되 실력·사다리·승패는 그대로.
    batch = [insertMatch(w.rating, b.rating, null), dropReports];
  } else {
    const next = rateGame(w, b, whiteScore);
    // 사다리는 판 전 실력으로 계산한다(판 전 예고와 같은 값).
    const lw = applyGame(ladderOf(w), { score: whiteScore, me: w.rating, opp: b.rating });
    const lb = applyGame(ladderOf(b), { score: 1 - whiteScore, me: b.rating, opp: w.rating });
    // 첫 도달 도장(RW-1): 이번 판으로 처음 닿은 큰 등급. 이미 가진 것은 빼고, INSERT OR IGNORE 라 두 번 들어가지 않는다.
    const firstsOf = async (id) => ((await db.prepare('SELECT tier FROM firsts WHERE id = ?').bind(id).all())?.results || []).map((r) => r.tier);
    const fw = newFirsts(await firstsOf(w.id), lw.state.points);
    const fb = newFirsts(await firstsOf(b.id), lb.state.points);
    const firstRows = [...fw.map((t) => [w.id, t]), ...fb.map((t) => [b.id, t])]
      .map(([id, t]) => db.prepare('INSERT OR IGNORE INTO firsts (id, tier, season, at) VALUES (?, ?, ?, ?)').bind(id, t, seasonOf(now), now));
    const tally = (p, score) => ({ wins: p.wins + (score === 1 ? 1 : 0), losses: p.losses + (score === 0 ? 1 : 0), draws: p.draws + (score === 0.5 ? 1 : 0) });
    const upsert = (p, n, score, l) => {
      const t = tally(p, score);
      // 시즌(L-4): player() 가 이미 이번 시즌으로 넘겼다. 처음 보는 사람은 이번 시즌에서 시작.
      return db.prepare(`INSERT INTO players (id, pub, rating, rd, vol, games, wins, losses, draws, created, updated, points, floor, streak, season, peak, sgames) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET rating = excluded.rating, rd = excluded.rd, vol = excluded.vol, games = excluded.games,
        wins = excluded.wins, losses = excluded.losses, draws = excluded.draws, updated = excluded.updated,
        points = excluded.points, floor = excluded.floor, streak = excluded.streak, season = excluded.season, peak = excluded.peak, sgames = excluded.sgames`)
        .bind(p.id, JSON.stringify({ x: pubOf[p.id].x, y: pubOf[p.id].y }), n.rating, n.rd, n.vol, p.games + 1, t.wins, t.losses, t.draws, p.created, now, l.state.points, l.state.floor, l.state.streak,
          seasonOf(now), Math.max(p.peak || 0, l.state.points), (p.sgames || 0) + 1);
    };
    batch = [
      insertMatch(next.white.rating, next.black.rating, JSON.stringify({ white: ladderView(lw, fw.at(-1) || null), black: ladderView(lb, fb.at(-1) || null) })),
      upsert(w, next.white, whiteScore, lw),
      upsert(b, next.black, 1 - whiteScore, lb),
      ...firstRows,
      dropReports
    ];
  }
  try {
    // 판 기록을 먼저 넣는다. 같은 판이 동시에 두 번 오면 둘째 묶음은 여기서 실패해 통째로 취소된다.
    await db.batch(batch);
  } catch (e) {
    const again = await counted(db, matchId);
    if (again) return again;
    throw e;
  }
  return counted(db, matchId);
}

/** 로컬 시험에서만 줄인다(wrangler dev --var ABANDON_WAIT_MS:5000). 배포 설정에는 넣지 않는다. */
const waitOf = (env) => Number(env.ABANDON_WAIT_MS) || ABANDON_WAIT_MS;
const scoreOf = (result) => (result === '1-0' ? 1 : result === '0-1' ? 0 : 0.5);

/** 혼자 낸 이탈 몰수가 기다림을 지났고 상대 보고가 없으면 넣는다. 아니면 null. */
async function settleAbandon(db, matchId, signer, now, wait = ABANDON_WAIT_MS) {
  const row = await db.prepare("SELECT body, at FROM reports WHERE match_id = ? AND signer = ? AND kind = 'abandon'").bind(matchId, signer).first();
  if (!row || now - row.at < wait) return null;
  const others = await db.prepare('SELECT COUNT(*) AS n FROM reports WHERE match_id = ? AND signer != ?').bind(matchId, signer).first();
  if (others?.n) return null;
  const report = JSON.parse(row.body);
  const mine = await checkReport(report);
  const ab = mine.ok ? await checkAbandon(report) : { ok: false };
  if (!ab.ok) return null;
  return commit(db, matchId, mine.match, scoreOf(mine.match.result), { [signer]: report.pub, [ab.peer]: ab.peerPub }, now);
}

async function postResult(request, env, now) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ status: 'rejected', error: 'too-big' }, 413);
  let report;
  try { report = JSON.parse(raw); } catch (e) { return json({ status: 'rejected', error: 'json' }, 400); }
  const mine = await checkReport(report);
  if (!mine.ok) return json({ status: 'rejected', error: mine.error }, 400);
  const db = env.RANK;
  const m = mine.match;
  const minBuild = Number(env.MIN_BUILD) || RANK_BUILD;
  const wait = waitOf(env);
  const bad = metaError(mine.meta, { plies: m.moves.length, myPlies: myPliesOf(m, mine.signer), now, minBuild });
  if (bad) {
    if (bad === 'inhuman') await db.prepare('INSERT INTO flags (signer, reason, match_id, at) VALUES (?, ?, ?, ?)').bind(mine.signer, bad, mine.id, now).run();
    return json({ status: 'rejected', error: bad }, 400);
  }
  const done = await counted(db, mine.id);
  if (done) return json(done);

  let kind = 'pair';
  if (m.reason === 'abandon') {
    const ab = await checkAbandon(report);
    // 진 쪽(사라졌다 돌아온 사람)이 낸 abandon 보고는 영수증이 없다 — 두 사람 보고로 맞춘다.
    if (ab.ok) kind = 'abandon';
    else if (ab.error !== 'abandon-signer') return json({ status: 'rejected', error: ab.error }, 400);
  }
  await db.prepare('INSERT OR IGNORE INTO reports (match_id, signer, text, body, at, kind) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(mine.id, mine.signer, mine.text, raw, now, kind).run();
  const otherRow = await db.prepare('SELECT body FROM reports WHERE match_id = ? AND signer != ?').bind(mine.id, mine.signer).first();
  if (!otherRow) {
    if (kind === 'abandon') {
      const settled = await settleAbandon(db, mine.id, mine.signer, now, wait);
      if (settled) return json(settled);
      const first = await db.prepare('SELECT at FROM reports WHERE match_id = ? AND signer = ?').bind(mine.id, mine.signer).first();
      return json({ status: 'waiting', matchId: mine.id, abandonAt: (first?.at ?? now) + wait });
    }
    return json({ status: 'waiting', matchId: mine.id });
  }
  const other = await checkReport(JSON.parse(otherRow.body));
  if (!other.ok) return json({ status: 'rejected', error: `peer-${other.error}` }, 400);
  const both = agree(mine, other);
  if (!both.ok) return json({ status: 'mismatch', matchId: mine.id, error: both.error }, 409);
  // 두 사람의 공개 키는 각자 보고서에서 온다.
  const pubOf = { [mine.signer]: report.pub, [other.signer]: JSON.parse(otherRow.body).pub };
  return json(await commit(db, mine.id, m, both.whiteScore, pubOf, now));
}

async function getPlayer(url, env, now) {
  const id = url.searchParams.get('id') || '';
  if (!ID_RE.test(id)) return json({ error: 'id' }, 400);
  const db = env.RANK;
  // 이 사람이 혼자 낸 이탈 몰수 중 기다림이 지난 것을 마저 넣는다(창을 닫았어도 다음에 열면 들어간다).
  const wait = waitOf(env);
  const due = await db.prepare("SELECT match_id FROM reports WHERE signer = ? AND kind = 'abandon' AND at <= ? LIMIT 5").bind(id, now - wait).all();
  for (const r of due?.results || []) await settleAbandon(db, r.match_id, id, now, wait).catch(() => null);
  const p = await player(db, id, now);
  const out = publicView(p, now) || publicView({ id, ...START, ...START_LADDER, games: 0, wins: 0, losses: 0, draws: 0 }, now);
  // 지난 시즌 테두리(최근 6개).
  out.trophies = ((await db.prepare('SELECT season, tier, peak, games FROM trophies WHERE id = ? ORDER BY season DESC LIMIT 12').bind(id).all())?.results || [])
    .map((t) => ({ ...t, frame: t.games >= SEASON_MIN_GAMES }));
  // 첫 도달 도장(RW-1).
  out.firsts = ((await db.prepare('SELECT tier, season, at FROM firsts WHERE id = ?').bind(id).all())?.results || []);
  const vs = url.searchParams.get('vs');
  if (vs && ID_RE.test(vs) && vs !== id) {
    const c = await pairCounts(db, id, vs, now);
    out.pair = { today: c.today, week: c.week, dayCap: PAIR_DAILY_CAP, weekCap: PAIR_WEEKLY_CAP, capped: pairCapped(c.today, c.week) };
  }
  return json(out);
}

async function postCircle(request, env, now) {
  const text = await request.text();
  if (text.length > 4096) return json({ error: 'body' }, 413);
  let body = null;
  try { body = JSON.parse(text); } catch (e) { return json({ error: 'body' }, 400); }
  const bad = circleRequestError(body, now);
  if (bad) return json({ error: bad }, 400);
  if ((await identityIdOf(body.pub)) !== body.id) return json({ error: 'pub' }, 403);
  if (!(await verifySignature({ kty: 'EC', crv: 'P-256', x: body.pub.x, y: body.pub.y }, circleText(body.id, body.at), body.sig))) return json({ error: 'signature' }, 403);
  const db = env.RANK;
  const id = body.id;
  const rows = (await db.prepare("SELECT white, black, result, status, at FROM matches WHERE (white = ? OR black = ?) AND status != 'void' ORDER BY at DESC LIMIT 500").bind(id, id).all())?.results || [];
  const ids = [...new Set(rows.flatMap((r) => [r.white, r.black]))].slice(0, CIRCLE_MAX + 1);
  const pointsOf = {};
  if (ids.length) {
    const ps = await db.prepare(`SELECT id, points, floor, streak, season, peak, sgames FROM players WHERE id IN (${ids.map(() => '?').join(', ')})`).bind(...ids).all();
    // 시즌이 지난 친구는 읽기만 넘긴 점수로(쓰기는 그 사람이 열 때).
    const cur = seasonOf(now);
    for (const p of ps?.results || []) pointsOf[p.id] = { points: rollSeason(p, cur).row.points || 0 };
  }
  // 친구의 가장 높은 지난 시즌 테두리(RW-2) — 무대 줄에 같이 그린다.
  const frameOf = {};
  if (ids.length) {
    const ts = await db.prepare(`SELECT id, season, tier, games FROM trophies WHERE id IN (${ids.map(() => '?').join(', ')})`).bind(...ids).all();
    const by = {};
    for (const t of ts?.results || []) (by[t.id] ||= []).push(t);
    for (const [k, v] of Object.entries(by)) frameOf[k] = bestTrophy(v)?.tier || null;
  }
  return json({ circle: circleOf(id, rows, pointsOf).map((p) => ({ ...p, frame: frameOf[p.id] || null })) });
}

/** 로컬 시험에서만 시계를 민다(wrangler dev --var NOW_SHIFT_MS:2419200000 = 28일 뒤, 시즌 경계 확인). 배포 설정에는 넣지 않는다. */
const nowOf = (env) => Date.now() + (Number(env.NOW_SHIFT_MS) || 0);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/rank/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('not found', { status: 404 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      const now = nowOf(env);
      if (url.pathname === '/api/rank/result' && request.method === 'POST') return await postResult(request, env, now);
      if (url.pathname === '/api/rank/circle' && request.method === 'POST') return await postCircle(request, env, now);
      if (url.pathname === '/api/rank/player' && request.method === 'GET') return await getPlayer(url, env, now);
      return json({ error: 'route' }, 404);
    } catch (e) {
      return json({ error: 'server' }, 500);
    }
  }
};
