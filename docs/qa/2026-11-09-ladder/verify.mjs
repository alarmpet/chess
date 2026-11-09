// 왕관 사다리 L-1·L-2 확인(R-3 스크립트를 이어 씀): 사다리 칸·판 전 예고·판 뒤 한 줄·친구 창 막대 · 휴대폰 폭: 서로 다른 프로필(= 다른 기기 신분)의 헤드리스 Chrome 둘이 🏆 랭크 방에서 만난다.
//   node docs/qa/2026-11-09-ranked-r1/verify.mjs   (떠 있는 dev 서버 3000 사용, 중계는 .env.local 설정)
// 보는 것: 랭크 표시 · 상대 기기 키 교환 · 「AI 수」·「색 바꾸기」 숨김과 클릭 무시 · 「새 판」 막힘 · 판이 끝나면 풀림.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { identityIdOf } from '../../../src/net/identity.js';

const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });
const BASE = process.env.WC_URL || 'http://127.0.0.1:8787/';   // wrangler dev: 빌드한 dist + /api/rank + 로컬 D1
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const chromes = [];
process.on('exit', () => { for (const c of chromes) { try { c.kill(); } catch { /* */ } } });

async function browser(port, name, url) {
  const dir = `${process.env.TEMP}/wc-ld-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  chromes.push(spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--window-size=960,600', `--user-data-dir=${dir}`, url], { stdio: 'ignore' }));
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
  const until = async (expr, ms = 90000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return; await sleep(200); } throw new Error(`${name} timeout ${expr}`); };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
  return { ev, until, shot, send, close: () => ws.close() };
}

const prep = `(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); return 1; })()`;
const ready = '(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()';
const state = `(() => {
  const ai = document.getElementById('btn-ai-move'); const side = document.getElementById('btn-side-toggle'); const reset = document.getElementById('btn-reset');
  const id = JSON.parse(localStorage.getItem('wildcrown.identity.v1') || 'null');
  return { ranked: document.getElementById('online-ranked')?.textContent || null, peer: document.getElementById('online-peer')?.textContent,
    aiShown: ai ? getComputedStyle(ai).display !== 'none' : null, sideShown: side ? getComputedStyle(side).display !== 'none' : null,
    resetDisabled: reset ? reset.disabled : null, bodyRanked: document.body.classList.contains('ranked-game'),
    plies: window.wizardChess.debugHistory().length, hasKey: Boolean(id?.pub?.x), end: document.getElementById('online-end')?.textContent || null };
})()`;

const host = await browser(9361, 'host', BASE);
await host.until('Boolean(window.wizardChess)');
await host.ev(prep);
await host.ev('location.reload(), 1').catch(() => null);
await sleep(1500);
await host.until(ready);
await sleep(1500);
await host.ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click()); document.getElementById('btn-online').click(); return 1; })()`);
await host.until(`Boolean(document.getElementById('online-kind-ranked'))`);
await host.ev(`(() => { document.getElementById('online-kind-ranked').click(); document.getElementById('online-pick-w').click(); return 1; })()`);
await sleep(300);
await host.until(`/사다리|닿지/.test(document.getElementById('online-myrank')?.textContent || '')`, 20000);
const rule = await host.ev(`document.getElementById('online-ranked-rule')?.textContent`);
const myRankLine = await host.ev(`document.getElementById('online-myrank')?.textContent`);
await host.shot('0-panel-myrank.jpg');
await host.ev(`document.getElementById('online-create').click(), 1`);
await host.until(`Boolean(document.getElementById('online-bigcode')?.textContent)`);
const code = await host.ev(`document.getElementById('online-bigcode').textContent`);
await host.ev(`document.querySelectorAll('.panel-overlay').forEach((o) => o.click()), 1`);

const guest = await browser(9362, 'guest', `${BASE}?room=${code}`);
await guest.until('Boolean(window.wizardChess)');
if (process.env.PHONE !== '0') await guest.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await guest.ev(prep);
await guest.ev('location.reload(), 1').catch(() => null);
await sleep(1500);
await guest.until(ready);
await host.until(`/연결됨|connected/i.test(document.getElementById('online-peer')?.textContent || '')`, 60000);
await guest.until(`Boolean(document.getElementById('online-ranked'))`, 30000);
await sleep(1000);
const keys = {
  host: await host.ev(`JSON.parse(localStorage.getItem('wildcrown.identity.v1')).pub.x`),
  guest: await guest.ev(`JSON.parse(localStorage.getItem('wildcrown.identity.v1')).pub.x`)
};
const before = { host: await host.ev(state), guest: await guest.ev(state) };

// 「AI 수」 단추를 숨겨도 스크립트로 눌러 본다 → 수가 생기면 안 된다. 「새 판」도 눌러 본다 → 창이 열리면 안 된다.
await host.ev(`(() => { document.getElementById('btn-ai-move')?.click(); document.getElementById('btn-reset').click(); document.getElementById('btn-reset').dispatchEvent(new MouseEvent('click', { bubbles: true })); return 1; })()`);
await sleep(2500);
const afterClicks = { host: await host.ev(state), panelOpen: await host.ev(`Boolean(document.querySelector('.online-panel'))`) };

await host.until(`/[0-9]/.test(document.getElementById('online-scores')?.textContent || '')`, 20000);
await guest.until(`/[0-9]/.test(document.getElementById('online-scores')?.textContent || '')`, 20000);
const stakesBefore = { host: await host.ev(`document.getElementById('online-stakes')?.textContent`), guest: await guest.ev(`document.getElementById('online-stakes')?.textContent`) };
const scoresBefore = { host: await host.ev(`document.getElementById('online-scores')?.textContent`), guest: await guest.ev(`document.getElementById('online-scores')?.textContent`) };
await guest.shot('1-phone-before.jpg');
const barBox = await guest.ev(`(() => { const r = document.getElementById('online-bar').getBoundingClientRect(); return { left: r.left, right: r.right, width: innerWidth, height: r.height }; })()`);
// 바보 메이트(f3 e5 g4 Qh4#): 흑(손님) 승. 각 수가 상대 화면에 도착한 뒤 다음 수.
const plays = [[host, [6, 5, 5, 5]], [guest, [1, 4, 3, 4]], [host, [6, 6, 4, 6]], [guest, [0, 3, 4, 7]]];
for (let i = 0; i < plays.length; i++) {
  const [who, [a, b, c, d]] = plays[i];
  await who.until('!window.wizardChess.debugBusy()', 30000);
  await who.ev(`window.wizardChess.executeChessMove(${a}, ${b}, ${c}, ${d})`);
  await host.until(`window.wizardChess.debugHistory().length === ${i + 1}`, 30000);
  await guest.until(`window.wizardChess.debugHistory().length === ${i + 1}`, 30000);
}
await host.until(`/[+−±]/.test(document.getElementById('online-rank-note')?.textContent || '')`, 60000);
await guest.until(`/[+−±]/.test(document.getElementById('online-rank-note')?.textContent || '')`, 60000);
await sleep(4000);
await host.shot('2-host-mated.jpg');
await guest.shot('3-phone-won.jpg');
const overlap = (b) => b.ev(`(() => {
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) } : null; };
  const bar = box(document.getElementById('online-bar'));
  const hit = (o) => Boolean(bar && o && !(o.bottom <= bar.top || o.top >= bar.bottom || o.right <= bar.left || o.left >= bar.right));
  const card = box(document.querySelector('#checkmate-overlay .checkmate-banner'));
  const tray = box(document.getElementById('captured-tray'));
  const hint = box(document.getElementById('controls-hint'));
  return { w: innerWidth, h: innerHeight, bar, card, tray, hitsCard: hit(card), hitsTray: hit(tray), hint, hitsHint: hit(hint), rankedChipShown: getComputedStyle(document.getElementById('online-ranked')).display !== 'none' };
})()`);
const endLayout = { host: await overlap(host), guest: await overlap(guest) };
const scoresAfter = { host: await host.ev(`document.getElementById('online-scores')?.textContent`), guest: await guest.ev(`document.getElementById('online-scores')?.textContent`) };
const note = async (b) => ({ note: await b.ev(`document.getElementById('online-rank-note')?.textContent`), end: await b.ev(`document.getElementById('online-end')?.textContent`), id: await identityIdOf(JSON.parse(await b.ev(`localStorage.getItem('wildcrown.identity.v1')`)).pub) });
const game1 = { host: await note(host), guest: await note(guest) };
const api = async (id) => (await fetch(`${BASE}api/rank/player?id=${id}`)).json();
const server1 = { host: await api(game1.host.id), guest: await api(game1.guest.id) };

// 둘째 판: 다시 두기(색 바뀜 → 손님이 백) 뒤 방장이 기권 → 손님 또 승.
await host.ev(`document.getElementById('online-rematch').click(), 1`);
await guest.until(`Boolean(document.getElementById('online-rematch'))`);
await guest.ev(`document.getElementById('online-rematch').click(), 1`);
await host.until(`!document.getElementById('online-end')`, 30000);
await guest.until(`!document.getElementById('online-end')`, 30000);
await sleep(1500);
await guest.until('!window.wizardChess.debugBusy()', 30000);
await guest.ev(`window.wizardChess.executeChessMove(6, 4, 4, 4)`);   // 손님(백) e4
await host.until('window.wizardChess.debugHistory().length === 1', 30000);
await host.ev(`document.getElementById('online-resign').click(), 1`);
await host.until(`Boolean(document.getElementById('online-resign-yes'))`);
await host.ev(`document.getElementById('online-resign-yes').click(), 1`);
await host.until(`/[+−±]/.test(document.getElementById('online-rank-note')?.textContent || '')`, 60000);
await guest.until(`/[+−±]/.test(document.getElementById('online-rank-note')?.textContent || '')`, 60000);
await sleep(1500);
await guest.shot('4-phone-game2.jpg');
const game2 = { host: await note(host), guest: await note(guest) };
const server2 = { host: await api(game1.host.id), guest: await api(game1.guest.id) };

// 끝난 뒤 친구 창을 다시 열면 내 랭크가 새 값인지.
await host.ev(`(() => { document.getElementById('online-leave').click(); return 1; })()`);
await sleep(800);
await host.ev(`document.getElementById('btn-online').click(), 1`);
await host.until(`/사다리/.test(document.getElementById('online-myrank')?.textContent || '')`, 20000);
await sleep(600);
const myRankAfter = await host.ev(`document.getElementById('online-myrank')?.textContent`);
await host.shot('5-panel-after.jpg');
const panelBar = await host.ev(`(() => { const b = document.querySelector('#ladder-bar i'); return b ? b.style.width : null; })()`);
const result = { stakesBefore, panelBar, endLayout, code, rule, myRankLine, scoresBefore, barBox, scoresAfter, myRankAfter, keysDiffer: keys.host !== keys.guest, game1, server1, game2, server2 };
console.log(JSON.stringify(result, null, 1));
writeFileSync(new URL('result.json', OUT), JSON.stringify(result, null, 1));
for (const b of [host, guest]) { await b.ev('(() => { localStorage.clear(); sessionStorage.clear(); return 1; })()').catch(() => null); b.close(); }
process.exit(0);
