// 왕관 슬롯머신(2026-11-18) 눈으로 보기: 기다림 → 레버 → 도는 중 → 첫 멈춤 → 둘째 멈춤 → 마지막(터짐) → 빠지는 중 → 빠진 뒤.
// dev 서버(3000): node docs/qa/2026-11-18-slot-machine/shoot-slot.mjs   (WC_URL 로 다른 주소)
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const ONLY = process.argv[2] || '';
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const W = 'window.wizardChess';
const log = [];

for (const [port, name, w, h, touch] of [[9680, 'desk', 1280, 800, false], [9681, 'phone', 390, 844, true]]) {
  if (ONLY && ONLY !== name) continue;
  const dir = `${process.env.TEMP}/wc-slot-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', `--window-size=${w},${h}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
    if (!wsUrl) await sleep(500);
  }
  const ws = new WebSocket(wsUrl);
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await new Promise((ok) => { ws.onopen = ok; });
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const until = async (expr, ms = 60000, step = 30) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 }); writeFileSync(new URL(`./${name}-${file}.jpg`, OUT), Buffer.from(s.result.data, 'base64')); };
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: BASE });
  await until(`${W}?.isStarted?.()`, 120000);
  const waited = await until(`${W}.debugReel().waiting === true`, 30000);
  await sleep(900);
  await shot('1-wait');
  const box = await ev(`(() => { const r = document.querySelector('#slot-machine .sm-cab').getBoundingClientRect(); const l = document.getElementById('slot-lever').getBoundingClientRect(); return { cab: [r.left, r.top, r.right, r.bottom].map(Math.round), lever: [l.left, l.top, l.right, l.bottom].map(Math.round), vw: innerWidth, vh: innerHeight }; })()`);
  // 진짜 누르기로 레버를 당긴다
  const p = await ev(`(() => { const r = document.getElementById('slot-lever').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.3 }; })()`);
  if (touch) { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  else { await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 }); }
  const t0 = Date.now();
  const pulled = await until(`${W}.debugReel().active === true`, 3000);
  await sleep(300);
  await shot('2-spin');
  await until(`${W}.debugReel().stopped[0] === true`, 20000); await sleep(120); await shot('3-stop1');
  await until(`${W}.debugReel().stopped[1] === true`, 20000); await sleep(120); await shot('4-stop2');
  await until(`${W}.debugReel().stopped[2] === true`, 20000);
  const stopSec = +((Date.now() - t0) / 1000).toFixed(1);
  await sleep(350); await shot('5-win');
  await sleep(700); await shot('6-win-late');
  await until(`${W}.debugReel().phase === 'leave'`, 20000); await sleep(200); await shot('7-leave');
  await until(`${W}.debugReel().active === false`, 20000);
  const goneSec = +((Date.now() - t0) / 1000).toFixed(1);
  await sleep(400); await shot('8-after');
  const row = { name, waited, pulled, box, stopSec, goneSec, reel: await ev(`${W}.debugReel()`), tags: (await ev(`${W}.debugContract()`)).tags, errors: errors.slice(0, 3) };
  log.push(row);
  console.log(JSON.stringify(row));
  ws.close(); chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL('./result-shoot.json', OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, log }, null, 1));
