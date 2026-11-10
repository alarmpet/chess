// 루즈함 분해(방향 계획서 DR-0a, 2026-11-10): 실제 엔진에서 한 판을 두며 한 수 순환을 네 조각으로 잰다.
//   ① 내 수 연출(내가 둔 뒤 말이 멈출 때까지) ② AI 대기(고정 지연 540ms + 탐색 계산) ③ AI 수 연출 ④ 그동안 입력이 막힌 시간
// 「AI 수 시작 → 다시 말을 집을 수 있을 때」 = ②+③ 이 아니라 ③ 만이 아니다 — 엔진은 ② 동안 aiTimer 가, ③ 동안 isAnimatingMove 가
// 입력을 막는다(src/wizardChessEngine.js pointerup). 그래서 「내가 둔 순간 → 다시 둘 수 있을 때」 전체를 막힌 시간으로 본다.
// 내 쪽 수는 Node 에서 같은 AI(src/rules/ai.js, 보통)로 고른다 — 사람의 생각 시간은 재지 않는다(0 으로 둔다).
//   dev 서버(3000)가 떠 있을 때: node tools/tempo_probe.mjs [판 수=2] [--quick] [--json out.json]
// 헤드리스 Chrome 하나를 임시 프로필로 띄운다(사용자 브라우저 저장은 건드리지 않는다).
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';

const args = process.argv.slice(2);
const GAMES = Number(args.find((a) => /^\d+$/.test(a)) || 2);
const QUICK = args.includes('--quick');
const jsonAt = args.indexOf('--json');
const URL = process.env.TEMPO_URL || 'http://localhost:3000/';
const PORT = 9431 + (QUICK ? 1 : 0);
const MAX_PLIES = 160;
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
let seed = 97531;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const dir = `${process.env.TEMP}/wc-tempo-${QUICK ? 'quick' : 'normal'}`;
try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${PORT}`, '--headless=new',
  '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, URL], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill(); } catch { /* */ } });
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
  if (!wsUrl) await sleep(500);
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise((ok) => { ws.onopen = ok; });
const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(40); } return false; };

// 첫 판 안내·카드 소개를 건너뛰는 저장(판 수 10), 연출 설정. 판마다 새 판으로 시작한다.
const prep = `(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
  localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: ${QUICK}, cards: true, dive: true, quests: true, blitz: false })); localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`;
await until('Boolean(window.wizardChess)');
await ev(prep);
await ev('location.reload(), 1').catch(() => null);
await sleep(1500);
await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
await sleep(1500);

// 페이지 안 표본기: 4ms 마다 바쁨·수 번호가 바뀐 시각만 남긴다.
await ev(`(() => { if (window.__tl) return 1; const w = window.wizardChess; window.__tl = []; let lb = null, ln = -1;
  setInterval(() => { const b = w.debugBusy(); const n = w.debugHistory().length; if (b !== lb || n !== ln) { window.__tl.push({ t: performance.now(), b, n }); lb = b; ln = n; } }, 4); return 1; })()`);

const rc = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];
const rows = [];
const games = [];
for (let g = 0; g < GAMES; g++) {
  if (g > 0) {
    await ev(`(() => { localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
    await ev('location.reload(), 1').catch(() => null);
    await sleep(1500);
    await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
    await sleep(1200);
    await ev(`(() => { const w = window.wizardChess; window.__tl = []; let lb = null, ln = -1;
      setInterval(() => { const b = w.debugBusy(); const n = w.debugHistory().length; if (b !== lb || n !== ln) { window.__tl.push({ t: performance.now(), b, n }); lb = b; ln = n; } }, 4); return 1; })()`);
  }
  const startHist = await ev('window.wizardChess.debugHistory().length');
  if (startHist !== 0) console.log(`판 ${g + 1}: 시작 수 ${startHist} (이어 하기가 남아 있음)`);
  const gameStart = Date.now();
  let plies = 0, ended = 'cap';
  const history = [];
  while (plies < MAX_PLIES) {
    const state = await ev(`(() => { const w = window.wizardChess; const h = w.debugHistory(); return { n: h.length, fen: h.length ? h[h.length - 1].after : null, over: w.isGameOver ? w.isGameOver() : null }; })()`);
    const chess = new Chess(state.fen || undefined);
    if (chess.isGameOver()) { ended = chess.isCheckmate() ? 'mate' : 'draw'; break; }
    if (chess.turn() !== 'w') { await sleep(60); continue; }
    const pick = chooseMove(chess.fen(), { level: 'normal', history, rand });
    if (!pick) break;
    const [fr, fc] = rc(pick.from), [tr, tc] = rc(pick.to);
    const capture = Boolean(chess.get(pick.to)) || (chess.get(pick.from)?.type === 'p' && pick.from[0] !== pick.to[0]);
    const n0 = state.n;
    const t0 = await ev(`(() => { const t = performance.now(); window.wizardChess.executeChessMove(${fr}, ${fc}, ${tr}, ${tc}${pick.promotion ? `, { promotion: '${{ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[pick.promotion]}' }` : ''}); return t; })()`);
    // AI 가 답하고 연출이 끝날 때까지(또는 판 끝)
    const ok = await until(`(() => { const w = window.wizardChess; const h = w.debugHistory(); if (h.length >= ${n0 + 2} && !w.debugBusy()) return true; if (h.length === ${n0 + 1} && !w.debugBusy()) { const c = h[h.length - 1]; return /#/.test(c.san || '') ; } return false; })()`, 90000);
    await sleep(30);
    const tl = await ev(`window.__tl.filter((x) => x.t >= ${t0 - 1})`);
    const tEnd = await ev('performance.now()');
    // 조각 찾기: 내 수 연출 끝 = n0+1 이고 바쁨 false 가 된 첫 시각, AI 시작 = 그 뒤 바쁨 true 첫 시각, AI 끝 = n0+2 이고 바쁨 false 첫 시각
    const myEnd = tl.find((x) => x.n >= n0 + 1 && !x.b)?.t ?? null;
    const aiStart = myEnd != null ? tl.find((x) => x.t > myEnd && x.b)?.t ?? null : null;
    const aiEnd = aiStart != null ? tl.find((x) => x.t > aiStart && x.n >= n0 + 2 && !x.b)?.t ?? null : null;
    const replyCapture = await ev(`(() => { const h = window.wizardChess.debugHistory(); const m = h[${n0 + 1}]; return m ? Boolean(m.captured) : null; })()`);
    rows.push({
      game: g + 1, ply: n0 + 1, san: pick.san || `${pick.from}${pick.to}`, capture, replyCapture, ok,
      myAnim: myEnd != null ? Math.round(myEnd - t0) : null,
      aiWait: aiStart != null && myEnd != null ? Math.round(aiStart - myEnd) : null,
      aiAnim: aiEnd != null && aiStart != null ? Math.round(aiEnd - aiStart) : null,
      blocked: aiEnd != null ? Math.round(aiEnd - t0) : Math.round(tEnd - t0)
    });
    const st2 = await ev(`(() => { const h = window.wizardChess.debugHistory(); return h.map((m) => m.after); })()`);
    history.length = 0;
    for (const f of st2) history.push(positionKey(f));
    plies = st2.length;
    if (!ok) { ended = 'stuck'; break; }
  }
  games.push({ game: g + 1, plies, ended, seconds: Math.round((Date.now() - gameStart) / 1000) });
  console.log(`판 ${g + 1}: ${plies}반수 · ${ended} · ${Math.round((Date.now() - gameStart) / 1000)}초`);
}

const med = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
const p90 = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length * 0.9)] : null; };
const sum = (xs) => xs.filter((x) => x != null).reduce((a, b) => a + b, 0);
const part = (k, f = () => true) => ({ median: med(rows.filter(f).map((r) => r[k])), p90: p90(rows.filter(f).map((r) => r[k])), totalSec: +(sum(rows.filter(f).map((r) => r[k])) / 1000).toFixed(1) });
const out = {
  at: new Date().toISOString(), url: URL, quick: QUICK, games, cycles: rows.length,
  note: '내 쪽 생각 시간 0(봇). 한 순환 = 내 수 → AI 답 → 다시 둘 수 있을 때. AI 대기 = 고정 540ms + 탐색 계산.',
  myAnim: part('myAnim'), myAnimQuiet: part('myAnim', (r) => !r.capture), myAnimCapture: part('myAnim', (r) => r.capture),
  aiWait: part('aiWait'), aiAnim: part('aiAnim'), aiAnimCapture: part('aiAnim', (r) => r.replyCapture),
  blocked: part('blocked'),
  perGameBlockedSec: games.map((g) => +(sum(rows.filter((r) => r.game === g.game).map((r) => r.blocked)) / 1000).toFixed(1)),
  rows
};
console.log(JSON.stringify({ quick: out.quick, games: out.games, myAnim: out.myAnim, myAnimQuiet: out.myAnimQuiet, myAnimCapture: out.myAnimCapture, aiWait: out.aiWait, aiAnim: out.aiAnim, aiAnimCapture: out.aiAnimCapture, blocked: out.blocked, perGameBlockedSec: out.perGameBlockedSec }, null, 1));
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(out, null, 1));
process.exit(0);
