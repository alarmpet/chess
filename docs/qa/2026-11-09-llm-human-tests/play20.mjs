// 사람 시험 B 대역(CX-6): 봇이 양쪽을 두는 스무 판을 실제 속도로 돌리며, 잡기마다 조합·대기 시간을 남긴다.
// 사람 쪽 수는 엔진의 triggerAIMoveNow(같은 AI)로 둔다. 헤드리스 Chrome 을 CDP 로 직접 말한다(의존성 없음).
//   node docs/qa/2026-11-09-llm-human-tests/play20.mjs            # 떠 있는 dev 서버(3000) 사용
//   GAMES=20 MAX_PLY=160 WC_URL=http://localhost:3000/ CHROME=<경로>
import { spawn } from 'node:child_process';
import { appendFileSync, writeFileSync, mkdirSync } from 'node:fs';

const URL_ = process.env.WC_URL || 'http://localhost:3000/';
const GAMES = Number(process.env.GAMES || 20);
const MAX_PLY = Number(process.env.MAX_PLY || 160);
const OUT = new URL('./play20/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const LOG = new URL(`games${process.env.TAG || ''}.ndjson`, OUT);
const log = (m) => console.log(`[play20] ${m}`);

const chromePath = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = Number(process.env.CDP_PORT || 9341);
const profile = `${process.env.TEMP || '/tmp'}/wc-play20-profile${process.env.TAG || ''}`;
const ch = spawn(chromePath, [`--remote-debugging-port=${port}`, '--headless=new', '--no-first-run', '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  '--window-size=960,600', `--user-data-dir=${profile}`, URL_], { stdio: 'ignore' });
process.on('exit', () => { try { ch.kill(); } catch { /* */ } });

let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); wsUrl = l.find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
  if (!wsUrl) await new Promise((ok) => setTimeout(ok, 500));
}
if (!wsUrl) throw new Error('Chrome DevTools 연결 실패');
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise((ok) => { ws.onopen = ok; });
const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300));
  return r.result?.result?.value;
};
const waitFor = (cond, ms = 120000) => ev(`new Promise((ok, no) => { const t0 = performance.now(); const t = setInterval(() => { try { if (${cond}) { clearInterval(t); ok(true); } } catch (e) {} if (performance.now() - t0 > ${ms}) { clearInterval(t); no(new Error('timeout: ${cond.replace(/'/g, '')}')); } }, 200); })`);

await waitFor('window.wizardChess?.debugHistory', 90000);
const view = await ev('[innerWidth, innerHeight]');
log(`창 ${view}`);
if (!view[0]) throw new Error('창 크기 0 — 카메라가 NaN 이 된다');

for (let g = 1; g <= GAMES; g++) {
  await ev(`(() => { localStorage.clear(); localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); location.reload(); return true; })()`).catch(() => null);
  await new Promise((ok) => setTimeout(ok, 2000));
  await waitFor('(() => { const w = window.wizardChess; const s = w?.getHandBrainState?.(); return w?.isStarted?.() && s && s.ready && !w.debugBusy(); })()', 120000);
  await new Promise((ok) => setTimeout(ok, 2500));
  const fps = await ev('new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => (++n >= 30 ? ok(Math.round(30000 / (performance.now() - t0))) : requestAnimationFrame(f)); requestAnimationFrame(f); })');
  const res = await ev(`new Promise((ok) => {
    const w = window.wizardChess; const rows = []; let cur = null; const t0 = performance.now();
    const close = () => document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click());
    const t = setInterval(() => {
      close();
      const st = w.debugMoveState(); const busy = w.debugBusy();
      if (busy && !cur) cur = { start: performance.now() };
      if (!busy && cur) {
        const h = w.debugHistory(); const m = h.at(-1) || {};
        const row = { ply: h.length, san: m.san, color: m.color, piece: m.piece, captured: m.captured || null, total: st.clock && st.clock.total, wallMs: Math.round(performance.now() - cur.start) };
        if (m.captured) { row.upset = w.debugLastUpset(); const sp = w.debugSpecial(); row.mirror = sp.mirror; row.comboN = sp.comboN; row.swayed = sp.swayed; }
        rows.push(row); cur = null;
      }
      if (!busy && !cur) {
        const h = w.debugHistory(); const s = w.getHandBrainState();
        if (st.gameOver || h.length >= ${MAX_PLY} || performance.now() - t0 > 30 * 60000) { clearInterval(t); ok({ rows, over: st.gameOver, plies: h.length, ms: Math.round(performance.now() - t0) }); return; }
        if (s.turn === s.playerColor && !st.aiTimer) w.triggerAIMoveNow();
      }
    }, 40);
  })`);
  const caps = res.rows.filter((r) => r.captured);
  const line = { game: g, fps, over: res.over, plies: res.plies, minutes: +(res.ms / 60000).toFixed(1), captures: caps.length, rows: res.rows };
  appendFileSync(LOG, JSON.stringify(line) + '\n');
  log(`판 ${g}: ${res.plies}수 · 잡기 ${caps.length} · ${line.minutes}분 · fps ${fps} · 끝남 ${res.over}`);
}
await ev('(() => { localStorage.clear(); sessionStorage.clear(); return true; })()');
writeFileSync(new URL('done.txt', OUT), new Date().toISOString());
ws.close();
process.exit(0);
