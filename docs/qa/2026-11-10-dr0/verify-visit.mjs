// DR-0c 화면 확인: 판 4번이 지난 마을을 열면 라이벌이 들러 도토리 대신 소품을 두고 간다.
// dev 서버(3000)에서: node docs/qa/2026-11-10-dr0/verify-visit.mjs
// 임시 프로필 헤드리스 Chrome(사용자 브라우저 저장은 건드리지 않는다). 960×640 과 390×844 두 번.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { newVillage } from '../../../src/village/economy.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };

const v = newVillage();
v.built.push({ id: 90, kind: 'shelter', sq: 'c3', tenant: null, level: 0, ready: true });
v.games = 8;
v.coins = 50;
v.visits = { picnic: 1_790_000_000_000 };   // 예전 저장의 시각 값 — 첫 열기에는 아무도 안 온다
const save = JSON.stringify(v);

for (const [port, name, mobile] of [[9441, 'wide', false], [9442, 'phone', true]]) {
  const dir = `${process.env.TEMP}/wc-dr0-${name}`;
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
  const rivals = await ev('JSON.stringify(window.wizardChess.getVillageRivals().map((r) => [r.id, r.visitsFor]))');
  const openVillage = async () => {
    await ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); document.getElementById('btn-village').click(); return 1; })()`);
    await sleep(3500);
  };
  const cardText = () => ev(`(() => { const t = document.body.innerText; const i = t.indexOf('다녀감'); return i < 0 ? null : t.slice(Math.max(0, i - 40), i + 60).replace(/\\s+/g, ' '); })()`);
  const village = () => ev(`(() => { const v = JSON.parse(localStorage.getItem('wildcrown.village.v1')); return { coins: v.coins, stash: v.stash, visits: v.visits, games: v.games }; })()`);
  const closeVillage = () => ev(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /닫기|✕|×/.test(x.textContent || '') && x.closest('[class*=village]')); if (b) b.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return 1; })()`);

  await openVillage();
  const first = { card: await cardText(), v: await village() };
  check(`${name} 첫 열기(예전 시각 값)`, '손님 없음 · visits 가 판 수 8 로 바뀜 · 도토리 50 그대로', JSON.stringify({ rivals, ...first }),
    first.card === null && first.v.coins === 50 && Object.values(first.v.visits).every((x) => x === 8));
  // 판 4번 더 둔 것으로 하고 다시 연다
  await closeVillage();
  await sleep(1200);
  await ev(`(() => { const v = JSON.parse(localStorage.getItem('wildcrown.village.v1')); v.games = 12; localStorage.setItem('wildcrown.village.v1', JSON.stringify(v)); return 1; })()`);
  await ev('location.reload(), 1').catch(() => null);
  await sleep(1500);
  await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
  await sleep(800);
  await openVillage();
  const second = { card: await cardText(), v: await village() };
  check(`${name} 판 4번 뒤 열기`, '「다녀감, 선물 🌷/🪑/🪧」 · 도토리 50 그대로 · 소품 1개', JSON.stringify(second),
    /다녀감, 선물 (🌷|🪑|🪧)/.test(second.card || '') && second.v.coins === 50 && Object.values(second.v.stash).reduce((a, b) => a + b, 0) === 1);
  await shot(`visit-${name}.jpg`);
  ws.close();
  chrome.kill();
}
writeFileSync(new URL('result-visit.json', OUT), JSON.stringify({ at: new Date().toISOString(), pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
