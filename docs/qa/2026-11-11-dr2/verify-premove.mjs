// DR-2a 확인: AI 차례·연출 중에 미리 두기 1수. 내 차례가 오는 순간 합법이면 두고, 아니면 조용히 버린다.
// dev 서버(3000)에서: node docs/qa/2026-11-11-dr2/verify-premove.mjs   (빌드판: WC_URL=http://localhost:4173/)
// 임시 프로필 헤드리스 Chrome(사용자 브라우저 저장은 건드리지 않는다).
// 칸 좌표: r 0 = 8줄, c 0 = a줄. e2 = (6,4), g1 = (7,6), f3 = (5,5).
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };
const port = 9495;
const dir = `${process.env.TEMP}/wc-dr2-premove`;
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
const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(15); } return false; };
const click = async (r, c) => {
  const sq = await ev(`window.wizardChess.debugSquareClient(${r}, ${c})`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sq.x, y: sq.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sq.x, y: sq.y, button: 'left', clickCount: 1 });
  await sleep(40);
};
const W = 'window.wizardChess';
const pm = () => ev(`${W}.debugPremove()`);
const sans = () => ev(`${W}.debugHistory().map((m) => m.san)`);
const idle = (n) => until(`(() => { const w = ${W}; return w.debugHistory().length === ${n} && !w.debugBusy(); })()`, 30000);
const newGame = async () => { await ev(`document.getElementById('btn-checkmate-newgame').click(), 1`); await sleep(2500); await until(`!${W}.debugBusy()`, 20000); };

await until('Boolean(window.wizardChess)');
await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
  localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }));
  localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
  localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
await ev('location.reload(), 1').catch(() => null);
await sleep(1500);
await until(`(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`, 90000);
await sleep(1200);

// 1) 실제 마우스: e4 가 걸어가는 동안 g1 → f3 을 누른다. 흑이 둔 뒤 곧바로 Nf3.
await ev(`${W}.executeChessMove(6, 4, 4, 4), 1`);
await until(`${W}.debugMoveState().animating`, 5000);
await click(7, 6);
const picked = await pm();
await click(5, 5);
const set = await pm();
const t0 = Date.now();
await idle(3);
const h1 = await sans();
const after1 = await pm();
check('연출 중 실제 클릭으로 미리 두기', 'g1 고르면 보라 표시(고른 칸+후보 3: e4 뒤라 Ne2 도) · f3 누르면 미리 둔 수 · 흑 뒤 3번째 수 Nf3 · 표시 지움',
  JSON.stringify({ picked: picked.preSel, pickedMarks: picked.marks, set: set.premove && [set.premove.fromR, set.premove.fromC, set.premove.toR, set.premove.toC], marks: set.marks, h1, after: after1, ms: Date.now() - t0 }),
  picked.preSel?.n === 3 && picked.marks === 4 && set.premove?.toR === 5 && set.premove?.toC === 5 && set.marks === 2 && h1[2] === 'Nf3' && after1.played === 1 && after1.marks === 0);

// 2) 내 말을 다시 누르면 미리 두기 취소, 상대 말·빈 칸을 누르면 취소
await idle(3);
await ev(`${W}.executeChessMove(7, 5, 4, 2), 1`);   // Bc4
await until(`${W}.debugMoveState().animating`, 5000);
await ev(`${W}.tapSquare(6, 3), 1`);                // d2 고름
const sel2 = await pm();
await ev(`${W}.tapSquare(6, 3), 1`);                // 다시 누름 → 내려놓음
const off2 = await pm();
await ev(`${W}.tapSquare(6, 3), 1`);
await ev(`${W}.tapSquare(4, 3), 1`);                // d4 로 미리 둠
await ev(`${W}.tapSquare(3, 7), 1`);                // 빈 칸(h5) → 취소
const off3 = await pm();
check('다시 누르기·빈 칸 누르기로 취소', '고름 → 같은 말 다시 누르면 없음 · 미리 둔 뒤 빈 칸 누르면 없음',
  JSON.stringify({ sel2: sel2.preSel, off2: [off2.preSel, off2.premove, off2.marks], off3: [off3.preSel, off3.premove, off3.marks] }),
  sel2.preSel?.r === 6 && !off2.preSel && !off2.premove && off2.marks === 0 && !off3.premove && !off3.preSel && off3.marks === 0);
await idle(6);

// 3) 내 차례가 왔을 때 불법이면 조용히 버린다: 1.e4 e5 2.d4 (연출 중 Nf3 미리 둠) …Bb4+ → Nf3 는 체크를 못 막는다
await newGame();
await ev(`${W}.executeChessMove(6, 4, 4, 4), 1`);
await until(`(() => { const w = ${W}; return w.debugHistory().length === 1 && !w.debugMoveState().animating; })()`, 15000);
const e5 = await ev(`${W}.executeChessMove(1, 4, 3, 4)`);           // 흑 e5 (AI 의 0.25초 쉼보다 먼저)
await idle(2);
await ev(`${W}.executeChessMove(6, 3, 4, 3), 1`);                 // d4
await until(`${W}.debugMoveState().animating`, 5000);
await ev(`${W}.tapSquare(7, 6), 1`);
await ev(`${W}.tapSquare(5, 5), 1`);
const set3 = await pm();
await until(`(() => { const w = ${W}; return w.debugHistory().length === 3 && !w.debugMoveState().animating; })()`, 15000);
const bb4 = await ev(`${W}.executeChessMove(0, 5, 4, 1)`);          // 흑 Bb4+
await until(`(() => { const w = ${W}; return !w.debugMoveState().animating && w.debugHistory().length === 4; })()`, 15000);
await sleep(400);
const h3 = await sans();
const after3 = await pm();
check('불법이 된 미리 두기는 버림', 'e4 e5 d4 Bb4+ 뒤 Nf3 안 둠 · 버림 1 · 표시 지움 · 오류 없음',
  JSON.stringify({ e5, bb4, set: Boolean(set3.premove), h3, after: after3 }),
  e5 && bb4 && set3.premove && h3.length === 4 && h3[3] === 'Bb4+' && after3.dropped === 1 && after3.marks === 0 && !after3.premove);

// 4) 새 판을 열면 미리 둔 수도 사라진다
await newGame();
await ev(`${W}.executeChessMove(6, 4, 4, 4), 1`);
await until(`${W}.debugMoveState().animating`, 5000);
await ev(`${W}.tapSquare(7, 6), 1`);
await ev(`${W}.tapSquare(5, 5), 1`);
const set4 = await pm();
await newGame();
const after4 = { pm: await pm(), n: (await sans()).length };
check('새 판에서 미리 두기 지움', '미리 둠 → 새 판 → 수 0 · 미리 둔 수 없음 · 표시 0',
  JSON.stringify({ set: Boolean(set4.premove), after: after4 }), set4.premove && after4.n === 0 && !after4.pm.premove && after4.pm.marks === 0);

// 5) 내 차례의 보통 선택은 그대로(실제 클릭): e2 를 누르면 고른 칸이 생기고 미리 두기는 아님
await click(6, 4);
const normal = { sel: await ev(`JSON.stringify(${W}.debugSelected())`), pm: await pm() };
check('내 차례 보통 선택', '선택 e2 · 미리 두기 아님', JSON.stringify(normal), /"r":6/.test(normal.sel) && !normal.pm.preSel && !normal.pm.premove);

// 6) 연출 중 빈 칸을 누르면 예전처럼 건너뛰기(DR-1c)
await click(4, 4);
await ev(`${W}.tapSquare(6, 4), 1`);
await ev(`${W}.tapSquare(4, 4), 1`);
await until(`${W}.debugMoveState().animating`, 5000);
const s0 = Date.now();
await ev(`${W}.tapSquare(3, 0), 1`);   // a5, 빈 칸
const pm6 = await pm();
await until(`!${W}.debugMoveState().animating`, 10000);
check('연출 중 빈 칸 = 건너뛰기', '미리 두기 없음 · 연출이 끝남', JSON.stringify({ pm: [pm6.preSel, pm6.premove], ms: Date.now() - s0 }), !pm6.preSel && !pm6.premove);

writeFileSync(new URL('result-premove.json', OUT), JSON.stringify({ at: new Date().toISOString(), url: BASE, pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
