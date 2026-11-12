// 랭커 보상 LA-RW1 확인(RW-1 왕관 도장 · RW-2 친구 테두리). 로컬 Worker 를 두 번 띄운다 — 지금(1단계), 시계를 28일 민 뒤(2단계).
//   npm run build → npx wrangler@4 d1 migrations apply wildcrown-rank --local
//   1) npx wrangler@4 dev --port 8787 --ip 127.0.0.1                                → node docs/qa/2026-11-10-rank-marks/verify.mjs 1
//   2) npx wrangler@4 dev --port 8787 --ip 127.0.0.1 --var NOW_SHIFT_MS:2419200000   → node docs/qa/2026-11-10-rank-marks/verify.mjs 2
// 시험 기기 키(비밀 키 포함, 버리는 것)는 %TEMP% 에 둔다(커밋하지 않음). 화면은 2단계에서 헤드리스 Chrome 둘(나 960×600, O0 390×844).
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { signReport } from '../../../src/rank/report.js';
import { RANK_BUILD } from '../../../src/rank/abuse.js';
import { circleText } from '../../../src/rank/circle.js';

const PHASE = Number(process.argv[2] || 1);
const SHIFT = PHASE === 2 ? 28 * 86400e3 : 0;
const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });
const KEYS = `${process.env.TEMP}/wc-rankmarks-keys.json`;
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
  const m = { room: `M${PHASE}${String(++roomN).padStart(6, '0')}`, game: 1, white: w.id, black: b.id, moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], result, reason: 'resign' };
  await post('result', await signReport(m, w, meta(2)));
  return (await post('result', await signReport(m, b, meta(2)))).body;
};
const myLadder = (res, id) => (res.white?.id === id ? res.white : res.black)?.ladder;

if (PHASE === 1) {
  const ME = await person();
  const OPP = [];
  for (let i = 0; i < 9; i++) OPP.push(await person());
  writeFileSync(KEYS, JSON.stringify({ me: ME.saved, opp: OPP.map((o) => o.saved) }));
  const firstsSeen = [];
  for (const o of OPP) for (let k = 0; k < 3; k++) {
    const r = await play(ME, o, '1-0');
    const l = myLadder(r, ME.id);
    if (l?.first) firstsSeen.push({ game: firstsSeen.length, first: l.first, after: l.after });
  }
  check('판 뒤 첫 도달 알림(counted 응답 ladder.first)', 'adult 한 번 · alpha 한 번', JSON.stringify(firstsSeen),
    firstsSeen.map((f) => f.first).join(',') === 'adult,alpha' && firstsSeen[0].after >= 300 && firstsSeen[1].after >= 600);
  const p = await get(ME.id);
  check('나 /player firsts', 'adult·alpha · 이번 시즌 27판', JSON.stringify({ firsts: p.firsts.map((f) => f.tier), points: p.ladder.points, games: p.season.games, ribbonGames: p.season.ribbonGames }),
    p.firsts.map((f) => f.tier).sort().join(',') === 'adult,alpha' && p.season.games === 27 && p.season.ribbonGames === 3);
  const o = await get(OPP[0].id);
  check('3패 상대 O0', 'firsts 없음 · 3판(이번 시즌 리본 조건)', JSON.stringify({ firsts: o.firsts, games: o.season.games }), o.firsts.length === 0 && o.season.games === 3);
  // 두 번 이겨도 첫 도달은 두 번 생기지 않는다(INSERT OR IGNORE + newFirsts)
  writeFileSync(new URL('phase1.json', OUT), JSON.stringify({ me: p, o0: o }, null, 2));
} else {
  const k = JSON.parse(readFileSync(KEYS, 'utf8'));
  const ME = await person(k.me);
  const O0 = await person(k.opp[0]);
  const before = JSON.parse(readFileSync(new URL('phase1.json', OUT), 'utf8'));
  const p = await get(ME.id);
  check('시즌 2 나: 300점 내려가도 첫 도달 그대로', `${before.me.ladder.points - 300}점 · firsts adult·alpha · 지난 시즌 테두리 alpha`,
    JSON.stringify({ points: p.ladder.points, firsts: p.firsts.map((f) => f.tier), trophies: p.trophies }),
    p.ladder.points === before.me.ladder.points - 300 && p.firsts.length === 2 && p.trophies[0]?.tier === 'alpha' && p.trophies[0]?.frame === true);
  const o = await get(O0.id);
  check('시즌 2 O0: 3판 → 리본만(테두리 없음)', 'trophies [시즌 1 · games 3 · frame false]', JSON.stringify(o.trophies),
    o.trophies.length === 1 && o.trophies[0].games === 3 && o.trophies[0].frame === false);
  const at = Date.now() + SHIFT;
  const circle = (await post('circle', { id: O0.id, pub: { x: O0.pub.x, y: O0.pub.y }, at, sig: await O0.sign(circleText(O0.id, at)) })).body.circle;
  const meRow = circle.find((c) => c.id === ME.id);
  check('O0 의 친구 무대에서 나의 테두리', 'frame alpha', JSON.stringify(meRow && { frame: meRow.frame, points: meRow.points }), meRow?.frame === 'alpha');
  check('O0 자기 줄', 'frame 없음(리본만)', JSON.stringify(circle.find((c) => c.me)?.frame), circle.find((c) => c.me)?.frame === null);

  // ── 화면 ──
  async function browser(port, name, url) {
    const dir = `${process.env.TEMP}/wc-rw1-${name}`;
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
  // 브라우저 시계는 그대로라 서버(28일 밈)와 어긋난다 → 서명 시각만 서버에 맞춰 Date.now 를 민다(이 시험 탭 안에서만).
  const seed = (saved) => `(() => { localStorage.setItem('wildcrown.identity.v1', ${JSON.stringify(saved)});
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); return 1; })()`;
  const shiftClock = `(() => { const real = Date.now.bind(Date); Date.now = () => real() + ${SHIFT}; return 1; })()`;
  const boot = async (b, saved) => {
    await b.until('Boolean(window.wizardChess)');
    await b.ev(seed(saved));
    await b.send('Page.enable');   // 없으면 아래 스크립트가 새 문서에 들어가지 않는다(1차 실행에서 시계가 안 밀려 무대가 400 time)
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: shiftClock });
    await b.ev('location.reload(), 1').catch(() => null);
    await sleep(1500); await b.until(ready); await sleep(800);
  };
  const openPanel = (b) => b.ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); document.getElementById('btn-online').click(); return 1; })()`);
  const marksOf = (b) => b.ev(`(() => ({ stamps: [...document.querySelectorAll('#online-rankmarks .rank-stamp')].map((x) => (x.classList.contains('got') ? '✔ ' : '· ') + x.textContent),
    ribbons: [...document.querySelectorAll('#online-rankmarks .rank-ribbon')].map((x) => x.textContent), left: document.getElementById('ribbon-left')?.textContent || null,
    rows: [...document.querySelectorAll('#online-circle li')].map((li) => ({ text: li.innerText.replace(/\\s+/g, ' ').trim(), frame: li.dataset.frame })) }))()`);

  const host = await browser(9401, 'me', BASE);
  await boot(host, ME.saved);
  await openPanel(host);
  await host.until(`document.querySelectorAll('#online-rankmarks .rank-stamp').length === 3`, 20000);
  await sleep(600);
  const hm = await marksOf(host);
  check('나 친구 창 왕관 도장', '성체·우두머리 받음 · 왕관 받는 법 · 리본 「시즌 1 함께 둠」 · 이번 시즌 리본까지 3판', JSON.stringify(hm),
    hm.stamps.filter((x) => x.startsWith('✔')).length === 2 && /900점/.test(hm.stamps[2]) && hm.ribbons.some((x) => /시즌 1 함께 둠/.test(x)) && /3판/.test(hm.left || ''));
  await host.shot('1-me-rankmarks.jpg');

  // 같은 랭크 방: 나(방장) · O0(휴대폰 폭)
  await host.ev(`(() => { document.getElementById('online-kind-ranked').click(); document.getElementById('online-pick-w').click(); return 1; })()`);
  await sleep(300);
  await host.ev(`document.getElementById('online-create').click(), 1`);
  await host.until(`Boolean(document.getElementById('online-bigcode')?.textContent)`);
  const code = await host.ev(`document.getElementById('online-bigcode').textContent`);
  await host.ev(`document.querySelectorAll('.panel-overlay').forEach((o) => o.click()), 1`);

  const guest = await browser(9402, 'o0', BASE);
  await guest.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await boot(guest, O0.saved);
  await openPanel(guest);
  await guest.until(`document.querySelectorAll('#online-circle li').length >= 2`, 20000);
  await sleep(600);
  const gm = await marksOf(guest);
  const gMe = gm.rows.find((r) => r.frame === 'alpha');
  check('O0 친구 창: 도장 0 · 리본 1 · 무대의 나 줄에 우두머리 테두리', 'stamps 미획득 3 · 리본 시즌 1 · frame alpha 줄', JSON.stringify(gm),
    gm.stamps.every((x) => x.startsWith('·')) && gm.ribbons.length === 1 && Boolean(gMe));
  await guest.shot('2-phone-o0-panel.jpg');
  await guest.ev(`(() => { location.href = ${JSON.stringify(`${BASE}?room=`)} + ${JSON.stringify(code)}; return 1; })()`).catch(() => null);
  await sleep(2000);
  await guest.until(ready, 60000);
  await guest.until(`Boolean(document.getElementById('online-peer-name'))`, 60000);
  await sleep(1500);
  const peer = await guest.ev(`(() => { const el = document.getElementById('online-peer-name'); return { cls: el.className, text: el.textContent, shadow: getComputedStyle(el).boxShadow, right: Math.round(document.getElementById('online-scores').getBoundingClientRect().right), vw: innerWidth }; })()`);
  check('O0 방 막대: 친구(나) 이름에 우두머리 테두리', 'frame-alpha · 넘침 없음', JSON.stringify(peer), /frame-alpha/.test(peer.cls) && peer.right <= peer.vw);
  await guest.shot('3-phone-bar-peer-frame.jpg');
  const hostPeer = await host.ev(`(() => document.getElementById('online-peer-name')?.className || null)()`);
  check('내 방 막대: 친구(O0) 이름', '테두리 없음(리본만)', hostPeer, hostPeer === 'peer-name');
}

writeFileSync(new URL(`result-phase${PHASE}.json`, OUT), JSON.stringify({ at: new Date().toISOString(), phase: PHASE, shiftMs: SHIFT, pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
