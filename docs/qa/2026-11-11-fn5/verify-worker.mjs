// FN-5 확인: 7단계(사자 왕, 3수 탐색)로 고정한 판에서 AI 가 생각하는 동안 화면 스레드가 멈춘 시간을 잰다.
// 같은 조건으로 두 번: ?aisync=1(예전처럼 화면 스레드에서 생각) · 기본(작업자 스레드).
// 잴 것: 「긴 작업」(PerformanceObserver longtask, 50ms 넘게 화면 스레드를 붙든 일)의 가장 긴 것·합, rAF 프레임 간격의 가장 긴 것,
//        AI 가 생각한 시간(내 수가 내려앉은 뒤 → AI 수가 움직이기 시작할 때까지), 둔 수가 합법이었는지.
// dev 서버(3000)에서: node docs/qa/2026-11-11-fn5/verify-worker.mjs [내 수=8] — 임시 프로필 헤드리스 Chrome.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove } from '../../../src/rules/ai.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const MOVES = Number(process.argv[2] || 8);
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rc = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];
const results = {};

for (const [mode, port, query] of [['sync', 9481, '?aisync=1'], ['worker', 9482, '']]) {
  const dir = `${process.env.TEMP}/wc-fn5-${mode}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, BASE + query], { stdio: 'ignore' });
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
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(60); } return false; };

  await until('Boolean(window.wizardChess)');
  await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: true, cards: false, dive: false, quests: false, blitz: false }));
    localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1600, games: 30, mode: 'fixed', step: 7, hold: 0, change: null }));
    localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
  await ev('location.reload(), 1').catch(() => null);
  await sleep(1500);
  await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
  await sleep(1500);
  const step = await ev('window.wizardChess.getRivalCatalog().freePlay.step');
  // 긴 작업과 프레임 간격을 페이지 안에서 모은다. AI 가 생각하는 구간(사이에 바쁨 · 수 번호)은 4ms 표본기로.
  await ev(`(() => {
    window.__lt = []; window.__gaps = []; window.__tl = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ t: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: false });
    let last = performance.now(); const f = (now) => { window.__gaps.push({ t: now, d: now - last }); last = now; requestAnimationFrame(f); }; requestAnimationFrame(f);
    const w = window.wizardChess; let lb = null, ln = -1;
    setInterval(() => { const b = w.debugMoveState().animating; const n = w.debugHistory().length; if (b !== lb || n !== ln) { window.__tl.push({ t: performance.now(), b, n }); lb = b; ln = n; } }, 4);
    return 1; })()`);
  const turns = [];
  for (let k = 0; k < MOVES; k++) {
    const st = await ev(`(() => { const h = window.wizardChess.debugHistory(); return { n: h.length, fen: h.length ? h[h.length - 1].after : null }; })()`);
    const c = new Chess(st.fen || undefined);
    if (c.isGameOver() || c.turn() !== 'w') break;
    const pick = chooseMove(c.fen(), { level: 'easy', slip: 0.2 });
    const [fr, fc] = rc(pick.from), [tr, tc] = rc(pick.to);
    const t0 = await ev(`(() => { const t = performance.now(); window.wizardChess.executeChessMove(${fr}, ${fc}, ${tr}, ${tc}${pick.promotion ? `, { promotion: '${{ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[pick.promotion]}' }` : ''}); return t; })()`);
    const ok = await until(`(() => { const w = window.wizardChess; return w.debugHistory().length >= ${st.n + 2} && !w.debugBusy(); })()`, 30000);
    const data = await ev(`(() => ({ tl: window.__tl.filter((x) => x.t >= ${t0}), lt: window.__lt.filter((x) => x.t >= ${t0}), gaps: window.__gaps.filter((x) => x.t >= ${t0}) }))()`);
    const myEnd = data.tl.find((x) => x.n >= st.n + 1 && !x.b)?.t ?? null;
    const aiStart = myEnd != null ? data.tl.find((x) => x.t > myEnd && x.n >= st.n + 2)?.t ?? null : null;
    const inThink = (x) => myEnd != null && aiStart != null && x.t >= myEnd && x.t <= aiStart + 5;
    const lts = data.lt.filter((x) => inThink(x) || (x.t + x.d >= myEnd && x.t <= aiStart));
    const gaps = data.gaps.filter(inThink);
    const legal = await ev(`(() => { const h = window.wizardChess.debugHistory(); const m = h[${st.n + 1}]; return Boolean(m && m.san); })()`);
    turns.push({ ok, legal, thinkMs: myEnd != null && aiStart != null ? Math.round(aiStart - myEnd) : null,
      longestTask: lts.length ? Math.round(Math.max(...lts.map((x) => x.d))) : 0, taskSum: Math.round(lts.reduce((a, x) => a + x.d, 0)),
      longestFrameGap: gaps.length ? Math.round(Math.max(...gaps.map((x) => x.d))) : null, frames: gaps.length });
    if (!ok) break;
  }
  const mode2 = await ev('window.wizardChess.debugAiWorker()');   // 첫 AI 차례 뒤에 읽는다(그 전에는 아직 안 만들어 unset)
  const max = (k) => Math.max(...turns.map((t) => t[k] ?? 0));
  const med = (k) => { const v = turns.map((t) => t[k]).filter((x) => x != null).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] ?? null; };
  results[mode] = { aiMode: mode2, step, turns: turns.length, allLegal: turns.every((t) => t.legal), thinkMsMedian: med('thinkMs'), thinkMsMax: max('thinkMs'),
    longestTaskMax: max('longestTask'), longestTaskMedian: med('longestTask'), longestFrameGapMax: max('longestFrameGap'), longestFrameGapMedian: med('longestFrameGap'), rows: turns };
  console.log(mode, JSON.stringify({ ...results[mode], rows: undefined }));
  ws.close();
  chrome.kill();
}
writeFileSync(new URL('result-worker.json', OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, ...results }, null, 2));
