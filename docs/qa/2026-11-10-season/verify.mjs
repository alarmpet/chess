// L-4 시즌 확인: 로컬 Worker 를 두 번 띄운다 — 지금(시즌 1) 한 번, 시계를 28일 민 뒤(시즌 2) 한 번.
//   npm run build → npx wrangler@4 d1 migrations apply wildcrown-rank --local
//   1) npx wrangler@4 dev --port 8787 --ip 127.0.0.1                                   → node docs/qa/2026-11-10-season/verify.mjs 1
//   2) npx wrangler@4 dev --port 8787 --ip 127.0.0.1 --var NOW_SHIFT_MS:2419200000      → node docs/qa/2026-11-10-season/verify.mjs 2
// 시험 기기 키(비밀 키 포함, 버리는 것)는 커밋하지 않도록 %TEMP% 에 둔다.
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { signReport } from '../../../src/rank/report.js';
import { RANK_BUILD } from '../../../src/rank/abuse.js';
import { circleText } from '../../../src/rank/circle.js';
import { seasonOf } from '../../../src/rank/season.js';

const PHASE = Number(process.argv[2] || 1);
// 3 = 2단계 뒤 화면만 다시 본다(서버는 계속 28일 밈). 무대가 시계 어긋남으로 거부될 때의 문구.
const SHIFT = PHASE >= 2 ? 28 * 86400e3 : 0;
const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });
const KEYS = `${process.env.TEMP}/wc-season-keys.json`;
const BASE = process.env.WC_URL || 'http://127.0.0.1:8787/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const procs = {};
process.on('exit', () => { for (const c of Object.values(procs)) { try { c.kill(); } catch { /* */ } } });
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };

const store = (v = null) => { const m = new Map(v ? [['wildcrown.identity.v1', v]] : []); return { getItem: (k) => m.get(k) ?? null, setItem: (k, x) => m.set(k, x), raw: m }; };
const person = async (saved = null) => { const s = store(saved); const id = await loadIdentity(s); return { ...id, saved: s.raw.get('wildcrown.identity.v1') }; };
const post = async (path, body) => { const r = await fetch(`${BASE}api/rank/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return { code: r.status, body: await r.json() }; };
const get = async (id) => (await fetch(`${BASE}api/rank/player?id=${id}`)).json();
const meta = (mine) => { const now = Date.now() + SHIFT; return { build: RANK_BUILD, start: now - 90_000, end: now - 1000, think: Array.from({ length: mine }, (_, i) => 1500 + i * 400) }; };
let roomN = Math.floor(Math.random() * 1e6);
const play = async (w, b, result) => {
  const m = { room: `S${PHASE}${String(++roomN).padStart(6, '0')}`, game: 1, white: w.id, black: b.id, moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], result, reason: 'resign' };
  await post('result', await signReport(m, w, meta(2)));
  return (await post('result', await signReport(m, b, meta(2)))).body;
};

let ME, OPP;
if (PHASE === 1) {
  ME = await person();
  OPP = [];
  for (let i = 0; i < 9; i++) OPP.push(await person());
  writeFileSync(KEYS, JSON.stringify({ me: ME.saved, opp: OPP.map((o) => o.saved) }));
  const outs = [];
  for (const o of OPP) for (let k = 0; k < 3; k++) outs.push(await play(ME, o, '1-0'));   // 같은 상대 하루 3판까지
  check('시즌 1 판 넣기', 'counted ×27', outs.filter((o) => o.status === 'counted').length, outs.every((o) => o.status === 'counted'));
  const p = await get(ME.id);
  check('시즌 1 나', `시즌 ${seasonOf(Date.now())} · 27판 · 우두머리 이상`, JSON.stringify({ season: p.season, points: p.ladder.points, tier: p.ladder.place.tier, trophies: p.trophies }),
    p.season.n === seasonOf(Date.now()) && p.season.games === 27 && p.season.peak === p.ladder.points && ['alpha', 'crown'].includes(p.ladder.place.tier) && p.trophies.length === 0);
  const o = await get(OPP[0].id);
  check('시즌 1 상대(3패)', '3판 · 새끼', JSON.stringify({ season: o.season, points: o.ladder.points }), o.season.games === 3 && o.ladder.place.tier === 'cub');
  writeFileSync(new URL('phase1.json', OUT), JSON.stringify({ me: p, opp0: o }, null, 2));
} else {
  const k = JSON.parse(readFileSync(KEYS, 'utf8'));
  ME = await person(k.me);
  OPP = await Promise.all(k.opp.map((s) => person(s)));
  const before = JSON.parse(readFileSync(new URL('phase1.json', OUT), 'utf8'));
  // 친구 무대는 아직 안 넘긴 사람을 읽기만 넘긴 점수로 보여 준다(OPP[1] 은 아직 아무도 안 읽음).
  if (PHASE === 2) {
  const circle = (await post('circle', { id: ME.id, pub: { x: ME.pub.x, y: ME.pub.y }, at: Date.now() + SHIFT, sig: await ME.sign(circleText(ME.id, Date.now() + SHIFT)) })).body.circle;
  const meC = circle.find((c) => c.me);
  check('시즌 2 무대(나는 아직 안 넘겨짐)', `${before.me.ladder.points} − 300`, meC.points, meC.points === before.me.ladder.points - 300);
  }
  if (PHASE === 2) {
  const p = await get(ME.id);
  const want = before.me.ladder.points - 300;
  check('시즌 2 나', `시즌 ${before.me.season.n + 1} · ${want}점 · 바닥·연승 0 · 테두리 1`, JSON.stringify({ season: p.season, ladder: p.ladder, trophies: p.trophies, rating: p.rating }),
    p.season.n === before.me.season.n + 1 && p.ladder.points === want && p.ladder.floor === 0 && p.ladder.streak === 0 && p.season.games === 0 &&
    p.trophies.length === 1 && p.trophies[0].season === before.me.season.n && p.trophies[0].tier === before.me.ladder.place.tier && p.rating === before.me.rating);
  const again = await get(ME.id);
  check('다시 읽어도 한 번만', `${want}점 · 테두리 1`, `${again.ladder.points} · ${again.trophies.length}`, again.ladder.points === want && again.trophies.length === 1);
  const o = await get(OPP[0].id);
  check('3판 둔 상대', '새끼 그대로 · 테두리 없음(5판 미만)', JSON.stringify({ points: o.ladder.points, trophies: o.trophies }), o.ladder.points === before.opp0.ladder.points && o.trophies.length === 0);
  }

  // ── 화면: 새 시즌 첫 판 전(새 시즌 알림·테두리), 넓은 화면과 휴대폰 폭 ──
  async function browser(port, name, url) {
    const dir = `${process.env.TEMP}/wc-l4-${name}`;
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
    procs[name] = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
      '--no-first-run', '--mute-audio', '--window-size=960,600', `--user-data-dir=${dir}`, url], { stdio: 'ignore' });
    let wsUrl = null;
    for (let i = 0; i < 60 && !wsUrl; i++) {
      try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
      if (!wsUrl) await sleep(500);
    }
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = new Map();
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    await new Promise((ok) => { ws.onopen = ok; });
    const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
    const until = async (expr, ms = 90000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return; await sleep(250); } throw new Error(`${name} timeout ${expr}`); };
    const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
    return { ev, until, shot, send };
  }
  const ready = '(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()';
  const seed = `(() => { localStorage.setItem('wildcrown.identity.v1', ${JSON.stringify(ME.saved)});
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); return 1; })()`;
  const panelOf = (b) => b.ev(`(() => { const el = document.getElementById('online-myrank'); return { cls: el?.className, season: document.getElementById('online-season')?.textContent || null,
    fresh: document.getElementById('online-season-new')?.textContent || null, trophies: document.getElementById('online-trophies')?.textContent || null, border: el ? getComputedStyle(el).borderTopColor : null }; })()`);
  const shots = [];
  for (const [port, name, mobile] of (PHASE === 3 ? [[9391, 'wide', false]] : [[9391, 'wide', false], [9392, 'phone', true]])) {
    const b = await browser(port, name, BASE);
    if (mobile) await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await b.until('Boolean(window.wizardChess)');
    await b.ev(seed);
    await b.ev('location.reload(), 1').catch(() => null);
    await sleep(1500);
    await b.until(ready);
    await b.ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); document.getElementById('btn-online').click(); return 1; })()`);
    if (PHASE === 2) {
      await b.until(`Boolean(document.getElementById('online-season-new'))`, 20000);
      await sleep(500);
      shots.push({ name, ...(await panelOf(b)) });
      await b.shot(`${mobile ? 2 : 1}-${name}-new-season.jpg`);
    }
    // 기기 시계가 서버와 11분 넘게 다르면(여기선 서버만 28일 밀림) 무대는 거부된다 → 「불러오지 못했어요」.
    if (!mobile) {
      await b.until(`/불러오지 못했어요/.test(document.getElementById('online-circle')?.textContent || '')`, 15000).catch(() => null);
      const t = await b.ev(`document.getElementById('online-circle')?.textContent || ''`);
      check('시계가 어긋난 기기의 무대', '「불러오지 못했어요」(멈춘 「불러오는 중」 아님)', t.slice(0, 80), /불러오지 못했어요/.test(t));
      if (PHASE === 3) await b.shot('3-wide-clock-off.jpg');
    }
  }
  if (PHASE === 2) {
  const w = shots[0];
  check('친구 창(넓은 화면)', `테두리 frame-${before.me.ladder.place.tier} · 「시즌 2 · n일 남음 · 테두리까지 5판」 · 새 시즌 알림`, JSON.stringify(w),
    w.cls.includes(`frame-${before.me.ladder.place.tier}`) && /시즌 \d+ · \d+일 남음 · 테두리까지 5판/.test(w.season || '') && /끝! .* 테두리를 받았어요/.test(w.fresh || '') && /🏅 시즌 \d+/.test(w.trophies || ''));
  check('친구 창(휴대폰 폭)', '같은 글자', JSON.stringify(shots[1]), shots[1].fresh === w.fresh && shots[1].season === w.season);

  // 새 시즌 첫 판 → 알림 사라짐, 시즌 판 수 1
  const r = await play(ME, OPP[1], '1-0');
  const p2 = await get(ME.id);
  check('새 시즌 첫 판', 'counted · 시즌 판 1 · 테두리 1', JSON.stringify({ status: r.status, games: p2.season.games, trophies: p2.trophies.length }), r.status === 'counted' && p2.season.games === 1 && p2.trophies.length === 1);
  }
}

writeFileSync(new URL(`result-phase${PHASE}.json`, OUT), JSON.stringify({ at: new Date().toISOString(), phase: PHASE, shiftMs: SHIFT, pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
