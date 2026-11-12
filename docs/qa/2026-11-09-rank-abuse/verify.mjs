// R-4 화면 확인: 서로 다른 프로필(= 다른 기기 신분)의 헤드리스 Chrome 둘이 🏆 랭크 방에서 만난다. 방장 960×600, 손님 390×844(휴대폰 흉내).
//   wrangler dev --port 8787 --ip 127.0.0.1 --var ABANDON_WAIT_MS:5000 (빌드한 dist + /api/rank + 로컬 D1) 를 띄운 뒤
//   node docs/qa/2026-11-09-rank-abuse/verify.mjs
// 보는 것:
//   1판: 첫 수 없이 60초 → 두 화면에 「판 무효로 하기」 → 누르면 「판 무효 · 첫 수 없음」, 점수에 안 듦.
//   2판: 세 수 뒤 손님 Chrome 을 꺼 버림 → 60초 뒤 방장에게 「이긴 판으로 끝내기」 → 누르면 몰수 승, 서버 기다림(시험 5초) 뒤 사다리 한 줄.
//   새 방: 같은 두 기기가 오늘 3판을 채운 뒤(2판 + 노드에서 손님·방장 키로 2판 더 보고) 판 전 칩이 「오늘 이 친구와 … 다 뒀어요」, 판 뒤 「점수는 그대로」.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { signReport } from '../../../src/rank/report.js';
import { RANK_BUILD } from '../../../src/rank/abuse.js';

const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });
const BASE = process.env.WC_URL || 'http://127.0.0.1:8787/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const procs = {};
process.on('exit', () => { for (const c of Object.values(procs)) { try { c.kill(); } catch { /* */ } } });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function browser(port, name, url, { keep = false } = {}) {
  const dir = `${process.env.TEMP}/wc-ab-${name}`;
  if (!keep) { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }
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
  return { ev, until, shot, send, close: () => ws.close(), kill: () => { ws.close(); procs[name].kill(); } };
}

const prep = `(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); return 1; })()`;
const ready = '(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()';
const bar = (b) => b.ev(`(() => ({ text: document.getElementById('online-bar')?.innerText.replace(/\\s+/g, ' ') || null,
  stakes: document.getElementById('online-stakes')?.textContent || null, end: document.getElementById('online-end')?.textContent || null,
  note: document.getElementById('online-rank-note')?.textContent || null, abandon: document.getElementById('online-abandon')?.textContent || null,
  void: document.getElementById('online-void')?.textContent || null, plies: window.wizardChess.debugHistory().length }))()`);
const move = async (who, others, n, [a, b, c, d]) => {
  await who.until('!window.wizardChess.debugBusy()', 30000);
  await who.ev(`window.wizardChess.executeChessMove(${a}, ${b}, ${c}, ${d})`);
  for (const o of [who, ...others]) await o.until(`window.wizardChess.debugHistory().length === ${n}`, 30000);
};
const E2E4 = [6, 4, 4, 4], E7E5 = [1, 4, 3, 4], G1F3 = [7, 6, 5, 5];

async function openHost(h, pick = 'w') {
  await h.ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click()); document.getElementById('btn-online').click(); return 1; })()`);
  await h.until(`Boolean(document.getElementById('online-kind-ranked'))`);
  await h.ev(`(() => { document.getElementById('online-kind-ranked').click(); document.getElementById('online-pick-${pick}').click(); return 1; })()`);
  await sleep(300);
  await h.ev(`document.getElementById('online-create').click(), 1`);
  await h.until(`Boolean(document.getElementById('online-bigcode')?.textContent)`);
  const code = await h.ev(`document.getElementById('online-bigcode').textContent`);
  await h.ev(`document.querySelectorAll('.panel-overlay').forEach((o) => o.click()), 1`);
  return code;
}
async function openGuest(code, keep) {
  const g = await browser(9372, 'guest', `${BASE}?room=${code}`, { keep });
  await g.until('Boolean(window.wizardChess)');
  await g.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  if (!keep) await g.ev(prep);
  await g.ev('location.reload(), 1').catch(() => null);
  await sleep(1500);
  await g.until(ready);
  return g;
}

const result = {};
const host = await browser(9371, 'host', BASE);
await host.until('Boolean(window.wizardChess)');
await host.ev(prep);
await host.ev('location.reload(), 1').catch(() => null);
await sleep(1500);
await host.until(ready);
await sleep(1000);
const code1 = await openHost(host, 'w');
let guest = await openGuest(code1, false);
await host.until(`/연결됨|connected/i.test(document.getElementById('online-peer')?.textContent || '')`, 60000);
await guest.until(`Boolean(document.getElementById('online-ranked'))`, 30000);
const t0 = Date.now();
log('1판 시작, 첫 수 없이 기다림');
result.voidAt59 = { host: await (async () => { await sleep(Math.max(0, 58000 - (Date.now() - t0))); return bar(host); })() };
await host.until(`Boolean(document.getElementById('online-void'))`, 15000);
await guest.until(`Boolean(document.getElementById('online-void'))`, 15000);
result.voidShownAfterMs = Date.now() - t0;
await guest.shot('1-phone-void-button.jpg');
await host.ev(`document.getElementById('online-void').click(), 1`);
await host.until(`/무효/.test(document.getElementById('online-end')?.textContent || '')`, 10000);
await guest.until(`/무효/.test(document.getElementById('online-end')?.textContent || '')`, 10000);
await host.until(`Boolean(document.getElementById('online-rank-note'))`, 10000);
await sleep(1000);
result.game1 = { host: await bar(host), guest: await bar(guest) };
await host.shot('2-host-void.jpg');
log('1판', JSON.stringify(result.game1));

// 2판: 색 바뀜(손님 백). e4 e5 Nf3 뒤 손님 Chrome 을 끈다.
await host.ev(`document.getElementById('online-rematch').click(), 1`);
await guest.until(`Boolean(document.getElementById('online-rematch'))`);
await guest.ev(`document.getElementById('online-rematch').click(), 1`);
await host.until(`!document.getElementById('online-end')`, 30000);
await guest.until(`!document.getElementById('online-end')`, 30000);
await sleep(1500);
await host.until(`/[0-9]/.test(document.getElementById('online-stakes')?.textContent || '')`, 20000);
result.game2Stakes = await bar(host);
await move(guest, [host], 1, E2E4);
await move(host, [guest], 2, E7E5);
await move(guest, [host], 3, G1F3);
await sleep(2500);   // 손님 영수증(3수째)이 방장에게 닿을 시간
const guestIdentity = await guest.ev(`localStorage.getItem('wildcrown.identity.v1')`);
const hostIdentity = await host.ev(`localStorage.getItem('wildcrown.identity.v1')`);
guest.kill();
const gone = Date.now();
log('손님 Chrome 끔 — 방장에게 몰수 단추가 뜨기를 기다림');
await host.until(`Boolean(document.getElementById('online-abandon'))`, 120000);
result.abandonShownAfterMs = Date.now() - gone;
result.abandonBar = await bar(host);
await host.shot('3-host-abandon-button.jpg');
await host.ev(`document.getElementById('online-abandon').click(), 1`);
await host.until(`/나갔어요/.test(document.getElementById('online-rank-note')?.textContent || '')`, 10000);
result.abandonWaiting = await bar(host);
await host.shot('4-host-abandon-waiting.jpg');
await host.until(`/^[+−±]/.test(document.getElementById('online-rank-note')?.textContent || '')`, 60000);
result.abandonCounted = await bar(host);
await host.shot('5-host-abandon-counted.jpg');
log('몰수', JSON.stringify(result.abandonCounted));

// 오늘 이 두 기기가 3판을 채우게 노드에서 2판 더 보고한다(두 기기의 키로 서명 — 화면 밖에서 판을 둔 셈).
const mem = (v) => { const m = new Map([['wildcrown.identity.v1', v]]); return { getItem: (k) => m.get(k) ?? null, setItem: (k, x) => m.set(k, x) }; };
const H = await loadIdentity(mem(hostIdentity)), G = await loadIdentity(mem(guestIdentity));
const post = async (body) => (await fetch(`${BASE}api/rank/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
const seeded = [];
for (let g = 1; g <= 2; g++) {
  const m = { room: 'SEED' + g + 'X', game: 1, white: H.id, black: G.id, moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], result: '0-1', reason: 'resign' };
  const meta = (n) => ({ build: RANK_BUILD, start: Date.now() - 60000, end: Date.now() - 1000, think: Array(n).fill(2000) });
  await post(await signReport(m, H, meta(2)));
  seeded.push((await post(await signReport(m, G, meta(2)))).outcome);
}
result.seeded = seeded;

// 새 방: 방장이 나가 새 랭크 방을 만들고, 손님은 같은 프로필(같은 기기 신분)로 다시 들어온다.
await host.ev(`document.getElementById('online-leave').click(), 1`);
await sleep(800);
const code2 = await openHost(host, 'w');
guest = await openGuest(code2, true);
await host.until(`/연결됨|connected/i.test(document.getElementById('online-peer')?.textContent || '')`, 60000);
await guest.until(`/다 뒀어요/.test(document.getElementById('online-stakes')?.textContent || '')`, 30000);
await host.until(`/다 뒀어요/.test(document.getElementById('online-stakes')?.textContent || '')`, 30000);
result.cappedBefore = { host: await bar(host), guest: await bar(guest) };
await guest.shot('6-phone-capped-chip.jpg');
await move(host, [guest], 1, E2E4);
await move(guest, [host], 2, E7E5);
await host.ev(`document.getElementById('online-resign').click(), 1`);
await host.until(`Boolean(document.getElementById('online-resign-yes'))`);
await host.ev(`document.getElementById('online-resign-yes').click(), 1`);
await guest.until(`/그대로/.test(document.getElementById('online-rank-note')?.textContent || '')`, 60000);
await host.until(`/그대로/.test(document.getElementById('online-rank-note')?.textContent || '')`, 60000);
await sleep(1000);
result.cappedAfter = { host: await bar(host), guest: await bar(guest) };
await guest.shot('7-phone-capped-after.jpg');
const api = async (id, vs) => (await fetch(`${BASE}api/rank/player?id=${id}${vs ? `&vs=${vs}` : ''}`)).json();
result.server = { host: await api(H.id, G.id), guest: await api(G.id) };
log(JSON.stringify(result.cappedAfter));
writeFileSync(new URL('result.json', OUT), JSON.stringify(result, null, 1));
console.log(JSON.stringify(result, null, 1));
for (const b of [host, guest]) { await b.ev('(() => { localStorage.clear(); sessionStorage.clear(); return 1; })()').catch(() => null); b.close(); }
process.exit(0);
