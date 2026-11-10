// DR-0b 확인: 접미사 없는 GLB 37개를 뺀 빌드(dist)로 게임·잡기·마을·외형 단계를 열어 /packs/ 요청 중 실패가 없는지 본다.
//   npm run build → npx vite preview --port 4173 → node docs/qa/2026-11-10-dr0/verify-prune.mjs
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { newVillage } from '../../../src/village/economy.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:4173/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const port = 9451;
const dir = `${process.env.TEMP}/wc-dr0-prune`;
try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
  '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill(); } catch { /* */ } });
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
  if (!wsUrl) await sleep(500);
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
const reqs = new Map(); const fails = []; const loaded = new Set();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Network.requestWillBeSent') reqs.set(m.params.requestId, m.params.request.url);
  if (m.method === 'Network.responseReceived') {
    const u = m.params.response.url;
    if (/\/packs\/|\/assets\/glb\//.test(u)) { if (m.params.response.status >= 400) fails.push(`${m.params.response.status} ${u}`); else loaded.add(u.replace(/^.*\/(packs|assets)\//, '$1/')); }
  }
  if (m.method === 'Network.loadingFailed') { const u = reqs.get(m.params.requestId) || '?'; if (/\/packs\/|\/assets\/glb\//.test(u)) fails.push(`failed ${u}`); }
};
await new Promise((ok) => { ws.onopen = ok; });
const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
const until = async (expr, ms = 90000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(200); } return false; };
await send('Network.enable');
await send('Page.navigate', { url: BASE });
await until('Boolean(window.wizardChess)');
// 주민이 사는 섬(카드 주민 → 외형 단계 GLB), 판 수 많은 카드 저장(외형 단계가 열림)
const v = newVillage();
v.built.push({ id: 90, kind: 'field', sq: 'c3', tenant: 'lion_2', level: 0, ready: true }, { id: 91, kind: 'shelter', sq: 'e3', tenant: 'meerkat_1', level: 0, ready: true });
v.hearts = { w_e1: 70, w_d1: 35, w_e2: 12 };
v.games = 30;
await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: { lion_2: 1, meerkat_1: 1 }, sinceRare: 0, sinceHero: 0, firstDone: true, games: 30, dust: 0, shelf: [], shelfSlots: 3 }));
  localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: true, dive: false, quests: true, blitz: false }));
  localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(JSON.stringify(v))}); return 1; })()`);
await send('Page.reload');
await sleep(1500);
const started = await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()');
// 잡기 한 번(e4 d5 exd5)
for (const [a, b, c, d] of [[6, 4, 4, 4], [1, 3, 3, 3], [4, 4, 3, 3]]) {
  await until('!window.wizardChess.debugBusy()', 20000);
  await ev(`window.wizardChess.executeChessMove(${a}, ${b}, ${c}, ${d})`);
  await sleep(300);
}
await until('!window.wizardChess.debugBusy()', 20000);
await sleep(1500);
await ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); document.getElementById('btn-village').click(); return 1; })()`);
await sleep(8000);
const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
writeFileSync(new URL('prune-village.jpg', OUT), Buffer.from(shot.result.data, 'base64'));
const glbs = [...loaded].filter((u) => u.endsWith('.glb')).sort();
const result = { at: new Date().toISOString(), base: BASE, started, fails, glbLoaded: glbs.length, noSuffixLoaded: glbs.filter((u) => /packs\/legend\/[^/]+\.glb$/.test(u) && !/_[wb]\.glb$/.test(u)), sample: glbs.slice(0, 40) };
writeFileSync(new URL('result-prune.json', OUT), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ started, fails, glbLoaded: glbs.length, noSuffixLoaded: result.noSuffixLoaded }, null, 1));
console.log(fails.length === 0 && started ? 'PASS' : 'FAIL');
process.exit(0);
