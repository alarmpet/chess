// WG-P1 화면 보정(2026-11-19): 켠 것과 끈 것의 GPU ms · 드로우콜 · 같은 자리 캡처.
// 크롬을 그래픽 카드(ANGLE D3D11)로 띄워 엔진의 GPU 타이머(debugGpuMs)로 잰다 — SwiftShader(소프트웨어)로 재면 GPU 몫이 아니다.
// dev 서버(3000): node docs/qa/2026-11-19-post-fx/measure-post.mjs [회차=3]   (빌드판: WC_URL=http://localhost:4173/)
// 한 회차 = 새 프로필로 열기 → 판이 뜨고 8초 → 보정 끔/켬(FXAA, 기본)/켬(MSAA)을 4초씩 GPU 표본 → 각 상태의 캡처.
// 상태 순서는 회차마다 돌린다(첫 상태가 판이 뜬 직후의 움직임을 떠안지 않게).
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RUNS = Number(process.argv[2] || 3);
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const W = 'window.wizardChess';
const median = (xs) => (xs.length ? +[...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)].toFixed(2) : null);
const p90 = (xs) => (xs.length ? +[...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(xs.length * 0.9))].toFixed(2) : null);
mkdirSync(new URL('./shots/', OUT), { recursive: true });
const rows = [];

for (const [name, w, h, touch] of [['desk', 1280, 800, false], ['phone', 390, 844, true]]) {
  for (let run = 1; run <= RUNS; run++) {
    const port = 9700 + run + (touch ? 10 : 0);
    const dir = `${process.env.TEMP}/wc-post-${name}-${run}`;
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
    const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
      '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu', '--no-first-run', '--mute-audio', `--window-size=${w},${h}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
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
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
    if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    // 보통 체스로 연다(슬롯머신·연습이 화면을 가리지 않게). 카메라는 기본 자리 그대로.
    await send('Page.navigate', { url: `${BASE}?lab=classic` });
    const started = await until(`${W}?.isStarted?.() === true`);
    await sleep(8000);
    const gpu = await ev(`(() => { const gl = ${W}.debugRenderer().getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); })()`);
    const row = { name, run, started, gpu, timer: await ev(`Boolean(${W}.gpuTimerAvailable)`), states: {} };
    const STATES = [['off', `${W}.setPost(false)`], ['fxaa', `(${W}.setPost(true), ${W}.setPostSamples(0))`], ['msaa', `(${W}.setPost(true), ${W}.setPostSamples(4))`]];
    for (const [state, setup] of [...STATES.slice((run - 1) % 3), ...STATES.slice(0, (run - 1) % 3)]) {
      await ev(setup);
      await sleep(1500);
      await ev(`${W}.debugGpuMs()`);   // 앞 상태의 표본을 버린다
      const calls = [];
      const t0 = Date.now();
      while (Date.now() - t0 < 4000) { calls.push(await ev(`${W}.debugRenderCalls()`)); await sleep(200); }
      const ms = (await ev(`${W}.debugGpuMs()`)) || [];
      const post = await ev(`${W}.debugPost()`);
      row.states[state] = { gpuMedian: median(ms), gpuP90: p90(ms), samples: ms.length, calls: Math.max(...calls), on: post.on, samplesMsaa: post.samples, size: post.size, failure: post.failure };
      if (run === 1) await shot(`${name}-${state}.jpg`);
    }
    row.errors = errors.slice(0, 3);
    console.log(JSON.stringify(row));
    rows.push(row);
    ws.close(); chrome.kill();
    await sleep(600);
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  }
}
const sum = {};
for (const r of rows) for (const [s, v] of Object.entries(r.states)) {
  const k = `${r.name}-${s}`;
  (sum[k] ||= []).push(v.gpuMedian);
}
const summary = Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, { medianOfRuns: median(v.filter((x) => x !== null)), runs: v }]));
writeFileSync(new URL('./result-measure.json', OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, summary, rows }, null, 1));
console.log(JSON.stringify(summary));
