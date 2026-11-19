// HK-3(2026-11-18): 링크 미리보기 그림 public/og.jpg (1200×630).
// 「왕관 슬롯머신이 이번 판의 표적 셋을 뽑은 순간」(동전이 터질 때)을 새 프로필로 찍고, 왼쪽에 한 줄을 얹는다. 화면 단추·HUD 는 숨긴다.
// (11-18 저녁: 소라 릴 → 슬롯머신 기계로 바뀌어 다시 찍었다.)
// dev 서버(3000): node docs/qa/2026-11-18-hk1-3/make-og.mjs [출력=public/og.jpg]
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../../', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const OUT = new URL(process.argv[2] || 'public/og.jpg', ROOT);
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const W = 'window.wizardChess';
const port = 9660;
const dir = `${process.env.TEMP}/wc-og`;
try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
  '--no-first-run', '--mute-audio', '--window-size=1200,630', `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
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
const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
const until = async (expr, ms = 60000, step = 50) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `${BASE}?lab=contract` });
await until(`${W}?.isStarted?.()`, 120000);
// 기계를 오른쪽으로 밀고 글자를 미리 얹어 둔 뒤 레버를 당긴다
await until(`${W}.debugReel().waiting === true`, 40000);
// 화면 글자는 숨기고(게임의 영상용 숨김), 한 줄을 얹는다
await ev(`(() => {
  document.body.classList.add('cinematic-ui-hidden');
  const hide = document.createElement('style');
  hide.textContent = '#root > *:not(canvas):not(:has(canvas)) { visibility: hidden !important; } #contract-hud, #puzzle-offer, #puzzle-bar { display: none !important; } #slot-machine { justify-content: flex-end !important; padding-right: 96px; } #slot-machine .sm-cab { --w: 440px !important; } #slot-machine .sm-rays { left: 72% !important; }';
  document.head.appendChild(hide);
  const band = document.createElement('div');
  band.id = 'og-band';
  band.style.cssText = 'position:fixed;left:0;top:0;bottom:0;width:600px;z-index:99999;padding:0 0 0 56px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(to right, rgba(8,12,30,0.9), rgba(8,12,30,0.55) 70%, rgba(8,12,30,0));color:#fff8e7;font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;visibility:visible';
  band.innerHTML = '<div style="font-size:30px;font-weight:800;letter-spacing:6px;color:#ffd24a">WILD CROWN</div><div style="font-size:52px;font-weight:800;line-height:1.25;margin-top:14px">슬롯이 이번 판에<br>잡을 말 셋을 뽑는다</div><div style="font-size:32px;font-weight:700;margin-top:18px;color:#ffe9b0">먼저 둘을 잡아<br>왕관을 채우면 승리</div>';
  document.body.appendChild(band);
  return 1;
})()`);
await sleep(400);
await ev(`${W}.pullLever()`);
const stopped = await until(`(() => { const r = ${W}.debugReel(); return r.stopped.length === 3 && r.stopped.every(Boolean); })()`, 40000);
await sleep(420);
const state = await ev(`${W}.debugReel()`);
const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
const buf = Buffer.from(s.result.data, 'base64');
writeFileSync(OUT, buf);
console.log(JSON.stringify({ stopped, goals: state.goals, active: state.active, kb: Math.round(buf.length / 1024) }));
ws.close(); chrome.kill();
await sleep(400);
try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
