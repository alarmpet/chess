// FN-5 확인 2: AI 가 작업자 스레드에서 생각하는 도중 새 판을 열면, 늦게 온 답이 새 판에 두어지지 않는다. 그 뒤에도 AI 는 답한다.
// dev 서버(3000)에서: node docs/qa/2026-11-11-fn5/verify-cancel.mjs
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };
const port = 9491;
const dir = `${process.env.TEMP}/wc-fn5-cancel`;
try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
  '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill(); } catch { /* */ } });
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
const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(20); } return false; };

await until('Boolean(window.wizardChess)');
await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
  localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: true, cards: false, dive: false, quests: false, blitz: false }));
  localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1600, games: 30, mode: 'fixed', step: 7, hold: 0, change: null }));
  localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
await ev('location.reload(), 1').catch(() => null);
await sleep(1500);
await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
await sleep(1200);

// 1) e2e4 → AI 가 생각하기 시작하면(바쁨이지만 연출 아님, 수 1개) 곧바로 새 판
await ev('window.wizardChess.executeChessMove(6, 4, 4, 4), 1');
const thinking = await until(`(() => { const w = window.wizardChess; return w.debugHistory().length === 1 && w.debugBusy() && !w.debugMoveState().animating; })()`, 15000);
const mode = await ev('window.wizardChess.debugAiWorker()');
await ev(`document.getElementById('btn-checkmate-newgame').click(), 1`);
await sleep(3000);
const after = await ev(`(() => { const w = window.wizardChess; return { n: w.debugHistory().length, busy: w.debugBusy() }; })()`);
check('생각 도중 새 판', '작업자 · 새 판 수 0 · 바쁨 아님(늦은 답 버림)', JSON.stringify({ thinking, mode, after }), thinking && mode === 'worker' && after.n === 0 && after.busy === false);

// 2) 새 판에서도 AI 가 답한다
await ev('window.wizardChess.executeChessMove(6, 3, 4, 3), 1');
const replied = await until(`(() => { const w = window.wizardChess; return w.debugHistory().length >= 2 && !w.debugBusy(); })()`, 20000);
const h = await ev('window.wizardChess.debugHistory().map((m) => m.san)');
check('새 판에서 AI 답', 'd4 뒤 흑이 둠', JSON.stringify({ replied, h }), replied && h[0] === 'd4' && h.length === 2);

// 3) 생각 도중 판을 누르면 아무것도 안 고른다(입력 막힘)
await ev('window.wizardChess.executeChessMove(7, 6, 5, 5), 1');
await until(`(() => { const w = window.wizardChess; return w.debugHistory().length === 3 && w.debugBusy() && !w.debugMoveState().animating; })()`, 15000);
const sq = await ev('window.wizardChess.debugSquareClient(1, 0)');
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sq.x, y: sq.y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sq.x, y: sq.y, button: 'left', clickCount: 1 });
await sleep(60);
const sel = await ev('JSON.stringify(window.wizardChess.debugSelected())');
await until(`(() => { const w = window.wizardChess; return w.debugHistory().length >= 4 && !w.debugBusy(); })()`, 20000);
check('생각 도중 흑 폰 클릭', '선택 없음', sel, sel === 'null');

writeFileSync(new URL('result-cancel.json', OUT), JSON.stringify({ at: new Date().toISOString(), pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
