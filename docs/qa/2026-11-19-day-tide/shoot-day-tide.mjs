// WG-4 판의 시간 · WG-5 밀물(2026-11-19): 시간 다섯 · 밀물 셋의 캡처, 실제 수에서 값이 따라오는지, GPU ms.
// 크롬을 그래픽 카드(ANGLE D3D11)로 띄운다. dev 서버(3000): node docs/qa/2026-11-19-day-tide/shoot-day-tide.mjs   (WC_URL 로 빌드판)
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const W = 'window.wizardChess';
const median = (xs) => (xs.length ? +[...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)].toFixed(2) : null);
mkdirSync(new URL('./shots/', OUT), { recursive: true });
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };

// 잡기 · 체크 없이 n 반수를 두는 줄(같은 국면을 되풀이하지 않게 고른다) — 계약 진도가 0 인 채로 시간만 흐른다
function quietLine(n, seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let attempt = 0; attempt < 200; attempt++) {
    const g = new Chess(); const seen = new Set([g.fen().split(' ').slice(0, 4).join(' ')]); const out = [];
    while (out.length < n) {
      const ms = g.moves({ verbose: true }).filter((m) => !m.captured && !m.san.includes('+') && !m.promotion);
      const ok = ms.filter((m) => { g.move(m); const k = g.fen().split(' ').slice(0, 4).join(' '); const fresh = !seen.has(k) && g.moves({ verbose: true }).some((r) => !r.captured); g.undo(); return fresh; });
      if (!ok.length) break;
      const m = ok[Math.floor(rnd() * ok.length)]; g.move(m); seen.add(g.fen().split(' ').slice(0, 4).join(' ')); out.push({ from: m.from, to: m.to });
    }
    if (out.length === n) return out;
  }
  throw new Error('조용한 줄을 못 만듦');
}

for (const [port, name, w, h, touch] of [[9750, 'desk', 1280, 800, false], [9751, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-day-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-first-run', '--mute-audio', `--window-size=${w},${h}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
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
  const until = async (expr, ms = 120000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(250); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }); try { writeFileSync(new URL(`./shots/${file}`, OUT), Buffer.from(s.result.data, 'base64')); } catch (e) { console.log('⚠️ 캡처를 못 씀', String(e.code || e)); } };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'setInterval(() => { try { window.wizardChess?.pullLever?.(); } catch (e) {} }, 120);' });
  const open = async (moves = null) => {
    for (let tries = 0; tries < 3; tries++) {
      await send('Page.navigate', { url: BASE });
      await sleep(800);
      await ev(`(() => { localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, on: true, games: 1, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0, practice: 1 }));
        localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: true, cards: false, dive: false, quests: false, blitz: false, post: true }));
        ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 7171, color: 'w', rivalId: null, moves, contract: 'p2nb' }))});` : "localStorage.removeItem('wildcrown.resume.v1');"} return 1; })()`);
      await send('Page.navigate', { url: BASE });
      if (await until(`${W}?.isStarted?.() === true && !${W}.debugBusy() && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, 90000)) break;
    }
    await until(`${W}.debugReel().phase === 'idle' && (${W}.debugReel().plays >= 1 || ${W}.debugHistory().length > 0)`, 40000);
    await sleep(1500);
  };

  // 1) 새 계약전 판: 아침 · 밀물 0
  await open();
  await sleep(2500);
  const t0 = await ev(`${W}.debugTime()`);
  check(`${name} 새 판`, '아침(0) · 밀물 0', t0, t0.day === 0 && t0.tide === 0 && t0.name === '아침');

  // 2) 시간 다섯 · 밀물 셋 캡처(값을 바로 맞춘다)
  for (const [label, day, tide] of [['t0-morning', 0, 0], ['t1-noon', 0.3, 0], ['t2-afternoon', 0.58, 0], ['t3-dusk', 0.8, 0], ['t4-night', 1, 0], ['tide-0', 0.3, 0], ['tide-50', 0.3, 0.5], ['tide-100', 0.3, 1]]) {
    await ev(`${W}.setTimeOverride({ day: ${day}, tide: ${tide}, snap: true })`);
    await sleep(900);
    await shot(`${name}-${label}.jpg`);
  }

  // 3) GPU: 밀물 0 과 1(같은 한낮). 밀물은 물 셰이더에 가지 하나라 거의 같아야 한다
  const gpu = {};
  for (const [k, tide] of [['tide0', 0], ['tide1', 1]]) {
    await ev(`${W}.setTimeOverride({ day: 0.3, tide: ${tide}, snap: true })`);
    await sleep(1200); await ev(`${W}.debugGpuMs()`); await sleep(4000);
    gpu[k] = median((await ev(`${W}.debugGpuMs()`)) || []);
  }
  check(`${name} GPU`, '밀물 1 이 밀물 0 보다 1ms 넘게 비싸지 않다', gpu, gpu.tide0 !== null && gpu.tide1 - gpu.tide0 <= 1);
  await ev(`${W}.setTimeOverride(null)`);

  // 4) 실제 수: 잡기 없는 24반수를 둔 판으로 다시 열면 한낮을 지나 노을 쪽, 밀물이 차오른다
  const line = quietLine(24);
  await open(line);
  await sleep(4500);
  const t24 = await ev(`${W}.debugTime()`);
  const left = (await ev(`${W}.debugContract()`)).pliesLeft;
  await shot(`${name}-real-24.jpg`);
  check(`${name} 24반수 뒤`, '남은 24반수 · 시간 0.5(오후 쪽) · 밀물 0.2~0.5', { left, ...t24 }, left === 24 && Math.abs(t24.day - 0.5) < 0.03 && t24.tide > 0.2 && t24.tide < 0.5);
  check(`${name} 오류 없음`, '페이지 예외 0', errors.slice(0, 3), errors.length === 0);
  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);
  ws.close(); chrome.kill();
  await sleep(600);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
const pass = rows.filter((r) => r.ok).length;
writeFileSync(new URL('./result-shoot.json', OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, pass, total: rows.length, rows }, null, 1));
console.log(`${pass}/${rows.length}`);
