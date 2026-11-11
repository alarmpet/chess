// DR-3 화면 확인: 놓은 소품에 손님이 오고(판 끝), 섬 위에 서 있고, 「모아 받기」 한 번에 도토리가 들어오고, 꾸밈 점수가 매대 레벨을 올린다.
// dev 서버(3000)에서: node docs/qa/2026-11-11-dr3/verify-guests.mjs
// 임시 프로필 헤드리스 Chrome(사용자 브라우저 저장은 건드리지 않는다). 960×640 과 390×844 두 번.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { newVillage, decorScore, shelfLevel } from '../../../src/village/economy.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };

// 건물 3채 + 소품 6개 놓인 섬. 판 수 7 — 다음 판 끝(games 8)에 손님이 온다(시드 고정).
const v = newVillage();
v.seed = 424242;
v.games = 7;
v.coins = 20;
v.shelf.lv = 1;
v.built.push({ id: 90, kind: 'field', sq: 'c3', tenant: null, level: 0, ready: true },
  { id: 91, kind: 'shelter', sq: 'f3', tenant: null, level: 0, ready: true },
  { id: 92, kind: 'mill', sq: 'c6', tenant: null, level: 1, ready: true });
for (const [kind, sq] of [['fountain', 'a2'], ['bench', 'b2'], ['flowerbed', 'g2'], ['lantern', 'h2'], ['signpost', 'a7'], ['birdhouse', 'h7']]) v.decor.push({ kind, sq });
const save = JSON.stringify(v);
console.log('꾸밈 점수', decorScore(v), '매대', shelfLevel(v));

for (const [port, name, mobile] of [[9451, 'wide', false], [9452, 'phone', true]]) {
  const dir = `${process.env.TEMP}/wc-dr3-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
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
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(200); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
  if (mobile) await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  await until('Boolean(window.wizardChess)');
  await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: true, dive: false, quests: true, blitz: false }));
    localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(save)}); return 1; })()`);
  await ev('location.reload(), 1').catch(() => null);
  await sleep(1500);
  await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
  await sleep(800);
  const village = () => ev(`(() => { const v = JSON.parse(localStorage.getItem('wildcrown.village.v1')); return { coins: v.coins, pending: v.pending, book: v.guestBook, games: v.games }; })()`);

  // 판 하나가 끝난 것으로(앱이 받는 것과 같은 gamefinished 이벤트)
  await ev(`(window.dispatchEvent(new CustomEvent('gamefinished', { detail: { moves: [], color: 'w', result: 'draw', rivalId: null, gameId: 777 } })), 1)`);
  await sleep(500);
  const after = await village();
  const gifts = (after.pending || []).reduce((n, g) => n + g.acorns, 0);
  check(`${name} 판 끝 손님`, '선물 1~2개가 기다림 · 도감에 기록', JSON.stringify({ pending: after.pending, book: after.book }),
    after.pending.length >= 1 && after.pending.length <= 2 && Object.keys(after.book).length >= 1);

  await ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); document.getElementById('btn-village').click(); return 1; })()`);
  await sleep(4000);
  const ui = await ev(`(() => ({
    line: document.getElementById('village-guest-line')?.innerText || null,
    btn: document.getElementById('village-collect')?.innerText || null,
    decor: document.getElementById('village-decor')?.innerText || null,
    guests: document.getElementById('village-guests')?.innerText || null,
    overflow: document.documentElement.scrollWidth > innerWidth,
    w: innerWidth
  }))()`);
  check(`${name} 판 끝 알림·단추·알약`, '「…놀러 왔어요」 · 「🧺 모아 받기 · 🎁 n · 🌰 선물합」 · ✨ 꾸밈 · 🐠 손님 k/6 · 가로 넘침 없음', JSON.stringify(ui),
    /놀러 왔어요/.test(ui.line || '') && (ui.btn || '').includes(`🌰 ${gifts}`) && /✨ 꾸밈 \d+/.test(ui.decor || '') && /손님 \d\/6/.test(ui.guests || '') && !ui.overflow && ui.w > 0);
  await shot(`guests-${name}.jpg`);

  const coins0 = after.coins;
  await ev(`(document.getElementById('village-collect').click(), 1)`);
  await sleep(1200);
  const got = await village();
  const ui2 = await ev(`(() => ({ btn: Boolean(document.getElementById('village-collect')), note: [...document.querySelectorAll('div')].map((d) => d.innerText).find((t) => /손님 선물 \\d+개/.test(t) && t.length < 80) || null }))()`);
  check(`${name} 모아 받기`, `도토리 ${coins0} → ${coins0 + gifts} · 기다림 0 · 단추 사라짐 · 「🧺 손님 선물 n개」`, JSON.stringify({ coins: got.coins, pending: got.pending.length, ...ui2 }),
    got.coins === coins0 + gifts && got.pending.length === 0 && !ui2.btn && Boolean(ui2.note));
  await shot(`collected-${name}.jpg`);

  const shelf = await ev(`(() => { document.getElementById('village-shelf').click(); return new Promise((ok) => setTimeout(() => ok([...document.querySelectorAll('.panel-title')].map((x) => x.innerText).find((t) => /매대 Lv/.test(t)) || null), 600)); })()`);
  check(`${name} 매대 레벨`, `꾸밈 점수로 Lv.${shelfLevel(v)}(판 수로는 Lv.1)`, String(shelf), (shelf || '').includes(`Lv.${shelfLevel(v)}`));
  await shot(`shelf-${name}.jpg`);
  ws.close();
  chrome.kill();
}
writeFileSync(new URL('result-guests.json', OUT), JSON.stringify({ at: new Date().toISOString(), pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
