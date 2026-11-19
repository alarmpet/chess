// LA-R R-1 확인: 서로 다른 프로필(= 다른 기기 신분)의 헤드리스 Chrome 둘이 🏆 랭크 방에서 만난다.
//   node docs/qa/2026-11-09-ranked-r1/verify.mjs   (떠 있는 dev 서버 3000 사용, 중계는 .env.local 설정)
// 보는 것: 랭크 표시 · 상대 기기 키 교환 · 「AI 수」·「색 바꾸기」 숨김과 클릭 무시 · 「새 판」 막힘 · 판이 끝나면 풀림.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const chromes = [];
process.on('exit', () => { for (const c of chromes) { try { c.kill(); } catch { /* */ } } });

async function browser(port, name, url) {
  const dir = `${process.env.TEMP}/wc-r1-${name}`;
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
const rule = await host.ev(`document.getElementById('online-ranked-rule')?.textContent`);
await host.shot('1-create-panel.jpg');
await host.ev(`document.getElementById('online-create').click(), 1`);
await host.until(`Boolean(document.getElementById('online-bigcode')?.textContent)`);
const code = await host.ev(`document.getElementById('online-bigcode').textContent`);
await host.ev(`document.querySelectorAll('.panel-overlay').forEach((o) => o.click()), 1`);

const guest = await browser(9362, 'guest', `${BASE}?room=${code}`);
await guest.until('Boolean(window.wizardChess)');
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

// 사람 수 한 번(e2e4) → 손님 화면에 도착하는지.
await host.ev(`window.wizardChess.executeChessMove(6, 4, 4, 4)`);
await guest.until('window.wizardChess.debugHistory().length === 1', 30000);
await sleep(2500);
await host.shot('2-host-ranked.jpg');
await guest.shot('3-guest-ranked.jpg');
const mid = { host: await host.ev(state), guest: await guest.ev(state) };

// 기권 → 끝나면 「새 판」 풀림.
await guest.ev(`document.getElementById('online-resign').click(), 1`);
await guest.until(`Boolean(document.getElementById('online-resign-yes'))`);
await guest.ev(`document.getElementById('online-resign-yes').click(), 1`);
await host.until(`Boolean(document.getElementById('online-end'))`, 30000);
await sleep(800);
const ended = { host: await host.ev(state), guest: await guest.ev(state) };
await host.shot('4-host-ended.jpg');

const result = { code, rule, keysDiffer: keys.host !== keys.guest, before, afterClicks, mid, ended };
console.log(JSON.stringify(result, null, 1));
writeFileSync(new URL('result.json', OUT), JSON.stringify(result, null, 1));
for (const b of [host, guest]) { await b.ev('(() => { localStorage.clear(); sessionStorage.clear(); return 1; })()').catch(() => null); b.close(); }
process.exit(0);
