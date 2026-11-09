// WILD CROWN Worker (LA-R R-2): 정적 파일(dist)은 그대로 두고 /api/rank/* 만 여기서 받는다.
// 랭크 판이 끝나면 두 사람이 각자 서명한 보고서를 보낸다. 둘 다 오고, 서명·글·다시 두기가 맞을 때만 Glicko-2 를 갱신한다.
// 저장은 D1(binding RANK, worker/migrations). Supabase 무료 정지를 피하려고 랭크 기록은 Cloudflare 에 둔다(계획서 §4.2).
//   POST /api/rank/result   body = src/rank/report.js 의 보고서 → { status: waiting | counted | mismatch, ... }
//   GET  /api/rank/player?id=<기기 id> → { id, rating, rd, games, wins, losses, draws, badge }
import { checkReport, agree } from '../src/rank/report.js';
import { START, rateGame, badgeOf } from '../src/rank/glicko2.js';

const MAX_BODY = 32 * 1024;
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS } });

async function player(db, id) {
  return db.prepare('SELECT * FROM players WHERE id = ?').bind(id).first();
}
const publicView = (p) => p && ({
  id: p.id, rating: Math.round(p.rating), rd: Math.round(p.rd), games: p.games, wins: p.wins, losses: p.losses, draws: p.draws, badge: badgeOf(p.rating, p.games)
});

async function counted(db, matchId) {
  const m = await db.prepare('SELECT * FROM matches WHERE match_id = ?').bind(matchId).first();
  if (!m) return null;
  return {
    status: 'counted', matchId, result: m.result,
    white: { id: m.white, before: Math.round(m.white_before), after: Math.round(m.white_after) },
    black: { id: m.black, before: Math.round(m.black_before), after: Math.round(m.black_after) }
  };
}

async function postResult(request, env, now) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ status: 'rejected', error: 'too-big' }, 413);
  let report;
  try { report = JSON.parse(raw); } catch (e) { return json({ status: 'rejected', error: 'json' }, 400); }
  const mine = await checkReport(report);
  if (!mine.ok) return json({ status: 'rejected', error: mine.error }, 400);
  const db = env.RANK;
  const done = await counted(db, mine.id);
  if (done) return json(done);

  await db.prepare('INSERT OR IGNORE INTO reports (match_id, signer, text, body, at) VALUES (?, ?, ?, ?, ?)')
    .bind(mine.id, mine.signer, mine.text, raw, now).run();
  const otherRow = await db.prepare('SELECT body FROM reports WHERE match_id = ? AND signer != ?').bind(mine.id, mine.signer).first();
  if (!otherRow) return json({ status: 'waiting', matchId: mine.id });
  const other = await checkReport(JSON.parse(otherRow.body));
  if (!other.ok) return json({ status: 'rejected', error: `peer-${other.error}` }, 400);
  const both = agree(mine, other);
  if (!both.ok) return json({ status: 'mismatch', matchId: mine.id, error: both.error }, 409);

  // 두 사람의 공개 키는 각자 보고서에서 온다.
  const m = mine.match;
  const pubOf = { [mine.signer]: report.pub, [other.signer]: JSON.parse(otherRow.body).pub };
  const w = (await player(db, m.white)) || { id: m.white, ...START, games: 0, wins: 0, losses: 0, draws: 0, created: now, fresh: true };
  const b = (await player(db, m.black)) || { id: m.black, ...START, games: 0, wins: 0, losses: 0, draws: 0, created: now, fresh: true };
  const next = rateGame(w, b, both.whiteScore);
  const tally = (p, score) => ({ wins: p.wins + (score === 1 ? 1 : 0), losses: p.losses + (score === 0 ? 1 : 0), draws: p.draws + (score === 0.5 ? 1 : 0) });
  const upsert = (p, n, score) => {
    const t = tally(p, score);
    return db.prepare(`INSERT INTO players (id, pub, rating, rd, vol, games, wins, losses, draws, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET rating = excluded.rating, rd = excluded.rd, vol = excluded.vol, games = excluded.games,
      wins = excluded.wins, losses = excluded.losses, draws = excluded.draws, updated = excluded.updated`)
      .bind(p.id, JSON.stringify({ x: pubOf[p.id].x, y: pubOf[p.id].y }), n.rating, n.rd, n.vol, p.games + 1, t.wins, t.losses, t.draws, p.created, now);
  };
  try {
    // 판 기록을 먼저 넣는다. 같은 판이 동시에 두 번 오면 둘째 묶음은 여기서 실패해 통째로 취소된다.
    await db.batch([
      db.prepare(`INSERT INTO matches (match_id, white, black, result, reason, plies, at, white_before, white_after, black_before, black_after)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(mine.id, m.white, m.black, m.result, m.reason, m.moves.length, now, w.rating, next.white.rating, b.rating, next.black.rating),
      upsert(w, next.white, both.whiteScore),
      upsert(b, next.black, 1 - both.whiteScore),
      db.prepare('DELETE FROM reports WHERE match_id = ?').bind(mine.id)
    ]);
  } catch (e) {
    const again = await counted(db, mine.id);
    if (again) return json(again);
    throw e;
  }
  return json(await counted(db, mine.id));
}

async function getPlayer(url, env) {
  const id = url.searchParams.get('id') || '';
  if (!/^[A-Za-z0-9_-]{16}$/.test(id)) return json({ error: 'id' }, 400);
  const p = await player(env.RANK, id);
  return json(publicView(p) || { id, rating: START.rating, rd: START.rd, games: 0, wins: 0, losses: 0, draws: 0, badge: badgeOf(START.rating, 0) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/rank/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('not found', { status: 404 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (url.pathname === '/api/rank/result' && request.method === 'POST') return await postResult(request, env, Date.now());
      if (url.pathname === '/api/rank/player' && request.method === 'GET') return await getPlayer(url, env);
      return json({ error: 'route' }, 404);
    } catch (e) {
      return json({ error: 'server' }, 500);
    }
  }
};
