// 랭커 보상 LA-RW2 확인(RW-3 친구 무대 시즌 상 · RW-4 과정 도장). 로컬 Worker 두 번 — 지금(1단계), 시계 28일 민 뒤(2단계).
//   npm run build → npx wrangler@4 d1 migrations apply wildcrown-rank --local
//   1) npx wrangler@4 dev --port 8787 --ip 127.0.0.1                                → node docs/qa/2026-11-10-stage-awards/verify.mjs 1
//   2) npx wrangler@4 dev --port 8787 --ip 127.0.0.1 --var NOW_SHIFT_MS:2419200000   → node docs/qa/2026-11-10-stage-awards/verify.mjs 2
// 1단계 무대: 부모 P · 아이 K · 친구 F. P 는 K·F 를 3번씩 이김(1등), K 는 F 를 3번 이김(가장 많이 오름), F 는 6패(새끼라 안 잃음).
//   따로: H 가 5명을 3번씩 이겨 성체 이상 → 새 기기 U 가 H 를 이기고(위 등급 첫 승) 비긴다(위 등급 첫 무승부).
// 시험 기기 키(비밀 키 포함, 버리는 것)는 %TEMP% 에 둔다(커밋하지 않음).
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { signReport } from '../../../src/rank/report.js';
import { RANK_BUILD } from '../../../src/rank/abuse.js';

const PHASE = Number(process.argv[2] || 1);
const SHIFT = PHASE === 2 ? 28 * 86400e3 : 0;
const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });
const KEYS = `${process.env.TEMP}/wc-stageawards-keys.json`;
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
  const m = { room: `A${PHASE}${String(++roomN).padStart(6, '0')}`, game: 1, white: w.id, black: b.id, moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], result, reason: 'resign' };
  if (result === '1/2-1/2') { m.moves = ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8']; m.reason = 'repetition'; }
  const n = m.moves.length;
  await post('result', await signReport(m, w, meta(Math.ceil(n / 2))));
  return (await post('result', await signReport(m, b, meta(Math.floor(n / 2))))).body;
};
const side = (res, id) => (res.white?.id === id ? res.white : res.black);

async function browser(port, name, url) {
  const dir = `${process.env.TEMP}/wc-rw2-${name}`;
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

if (PHASE === 1) {
  const [P, K, F, H, U] = [await person(), await person(), await person(), await person(), await person()];
  const O = []; for (let i = 0; i < 5; i++) O.push(await person());
  writeFileSync(KEYS, JSON.stringify({ P: P.saved, K: K.saved, F: F.saved, H: H.saved, U: U.saved }));
  const res = [];
  for (let i = 0; i < 3; i++) res.push(await play(P, K, '1-0'));
  for (let i = 0; i < 3; i++) res.push(await play(F, P, '0-1'));
  for (let i = 0; i < 3; i++) res.push(await play(K, F, '1-0'));
  check('무대 판 9개', 'counted ×9', res.map((r) => r.status).join(','), res.every((r) => r.status === 'counted'));
  for (const o of O) for (let i = 0; i < 3; i++) await play(H, o, '1-0');
  const h = await get(H.id);
  check('H 성체 이상', '≥ 300', h.ladder.points, h.ladder.points >= 300);
  const w1 = await play(U, H, '1-0');
  check('U 가 H 를 이김 → 위 등급 첫 승', "ladder.feat 'upset-win'", JSON.stringify(side(w1, U.id)?.ladder?.feat), side(w1, U.id)?.ladder?.feat === 'upset-win');
  const d1 = await play(H, U, '1/2-1/2');
  check('U 와 H 무승부 → 위 등급 첫 무승부', "ladder.feat 'upset-draw'", JSON.stringify({ status: d1.status, feat: side(d1, U.id)?.ladder?.feat }), side(d1, U.id)?.ladder?.feat === 'upset-draw');
  const w2 = await play(U, H, '1-0');
  check('두 번째 승리', '도장 다시 안 줌(feat null)', JSON.stringify(side(w2, U.id)?.ladder?.feat ?? null), (side(w2, U.id)?.ladder?.feat ?? null) === null);
  const u = await get(U.id);
  check('U /player firsts', 'upset-win · upset-draw', JSON.stringify(u.firsts.map((f) => f.tier)), ['upset-draw', 'upset-win'].every((k) => u.firsts.some((f) => f.tier === k)));
  const snap = {};
  for (const [n, x] of Object.entries({ P, K, F })) { const p = await get(x.id); snap[n] = { points: p.ladder.points, games: p.season.games, peak: p.season.peak, awards: p.awards }; }
  check('시즌 1 무대 판 수', 'P 6 · K 6 · F 6 · 상 아직 없음', JSON.stringify(snap), snap.P.games === 6 && snap.K.games === 6 && snap.F.games === 6 && snap.K.awards.length === 0);
  writeFileSync(new URL('phase1.json', OUT), JSON.stringify(snap, null, 2));
} else {
  const k = JSON.parse(readFileSync(KEYS, 'utf8'));
  const P = await person(k.P), K = await person(k.K), F = await person(k.F), U = await person(k.U);
  const p = await get(P.id), kk = await get(K.id), f = await get(F.id);
  const sh = (x) => JSON.stringify(x.awards);
  check('P(부모)', '[{season 1, top, size 3}]', sh(p), p.awards.length === 1 && p.awards[0].kind === 'top' && p.awards[0].size === 3);
  check('K(아이)', '[{season 1, rise, size 3}]', sh(kk), kk.awards.length === 1 && kk.awards[0].kind === 'rise');
  check('F(6패, 새끼라 안 잃음)', '상 없음', sh(f), f.awards.length === 0);
  const again = await get(K.id);
  check('다시 읽기', '상 1개 그대로', sh(again), again.awards.length === 1);

  // ── 화면 ──
  const ready = '(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()';
  const seed = (saved) => `(() => { localStorage.setItem('wildcrown.identity.v1', ${JSON.stringify(saved)});
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); return 1; })()`;
  const shiftClock = `(() => { const real = Date.now.bind(Date); Date.now = () => real() + ${SHIFT}; return 1; })()`;
  const boot = async (b, saved) => {
    await b.until('Boolean(window.wizardChess)');
    await b.ev(seed(saved));
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: shiftClock });
    await b.ev('location.reload(), 1').catch(() => null);
    await sleep(1500); await b.until(ready); await sleep(800);
  };
  const openPanel = (b) => b.ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); document.getElementById('btn-online').click(); return 1; })()`);
  const view = (b) => b.ev(`(() => ({ awards: [...document.querySelectorAll('#online-rankmarks .rank-award')].map((x) => x.textContent),
    got: [...document.querySelectorAll('#rankmarks-got .rank-stamp')].map((x) => x.textContent),
    todo: [...document.querySelectorAll('#rankmarks-todo .rank-stamp')].map((x) => x.textContent),
    summary: document.querySelector('#rankmarks-todo summary')?.textContent || null, folded: document.getElementById('rankmarks-todo')?.open === false }))()`);
  for (const [port, name, who, mobile, file] of [[9411, 'k', K, false, '1-child-award.jpg'], [9412, 'u', U, true, '2-phone-upset-stamps.jpg']]) {
    const b = await browser(port, name, BASE);
    if (mobile) await b.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await boot(b, who.saved);
    await openPanel(b);
    await b.until(`document.querySelectorAll('#online-rankmarks .rank-stamp').length === 8`, 20000);
    await sleep(600);
    const v = await view(b);
    await b.ev(`document.getElementById('online-rankmarks').scrollIntoView({ block: 'start' }), 1`);
    await sleep(300);
    await b.shot(file);
    if (name === 'k') {
      check('K 친구 창', '「🌱 시즌 1 가장 많이 오름 · 3명」 · 받은 도장 0 · 「받을 수 있는 도장 8개」 접힘', JSON.stringify(v),
        v.awards.some((x) => /시즌 1 가장 많이 오름 · 3명/.test(x)) && v.got.length === 0 && v.todo.length === 8 && v.summary === '받을 수 있는 도장 8개' && v.folded);
    } else {
      check('U 친구 창(휴대폰)', '받은 도장 = 위 등급 첫 승·첫 무승부 · 접힌 6개 안에 「7판 남음」', JSON.stringify(v),
        v.got.length === 2 && v.got.every((x) => /더 높은 등급/.test(x)) && v.todo.length === 6 && v.todo.some((x) => /7판 남음/.test(x)) && v.folded);
      // 접힌 칸을 열어 본 모습도 남긴다
      await b.ev(`(document.getElementById('rankmarks-todo').open = true, 1)`);
      await sleep(300);
      await b.shot('3-phone-todo-open.jpg');
    }
  }
}

writeFileSync(new URL(`result-phase${PHASE}.json`, OUT), JSON.stringify({ at: new Date().toISOString(), phase: PHASE, shiftMs: SHIFT, pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
