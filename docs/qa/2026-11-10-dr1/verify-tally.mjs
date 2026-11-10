// DR-1b 화면 확인: 판이 끝나면 주머니 화면에 도토리가 한 줄씩 더해지고(320ms 간격, 음이 한 칸씩 오름), 누르면 바로 끝난다.
// DR-1c 화면 확인: 연출 중 판을 누르면(실제 마우스 클릭) 그 수가 빨리 끝난다.
// dev 서버(3000)에서: node docs/qa/2026-11-10-dr1/verify-tally.mjs — 임시 프로필 헤드리스 Chrome, 960×640 과 390×844.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };

for (const [port, name, mobile] of [[9461, 'wide', false], [9462, 'phone', true]]) {
  const dir = `${process.env.TEMP}/wc-dr1-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--window-size=960,640', `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
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
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(100); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
  if (mobile) await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  await until('Boolean(window.wizardChess)');
  await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: true, dive: false, quests: true, blitz: false })); localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
  await ev('location.reload(), 1').catch(() => null);
  await sleep(1500);
  await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
  await sleep(800);
  // 소리 잠금 풀기(첫 사용자 입력과 같은 길)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 5, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 5, button: 'left', clickCount: 1 });

  // ── DR-1c: 실제 클릭으로 건너뛰기 ── e2e4 를 두고 바로 판 가운데를 누른다
  const center = await ev(`(() => { const r = window.wizardChess.debugSquareClient(4, 3); return r; })()`);
  const t0 = await ev(`(() => { window.__t0 = performance.now(); window.wizardChess.executeChessMove(6, 4, 4, 4); return window.__t0; })()`);
  await sleep(120);
  const cx = center?.x ?? 480, cy = center?.y ?? 320;
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
  await until('!window.wizardChess.debugBusy()', 10000);
  const myAnim = await ev('Math.round(performance.now() - window.__t0)');
  const selected = await ev('JSON.stringify(window.wizardChess.debugSelected())');
  check(`${name} 내 수 연출 중 판 클릭`, '조용한 수 0.80초(DR-0 중앙값)보다 짧게 끝남 · 아무것도 선택 안 됨', JSON.stringify({ myAnimMs: myAnim, selected }), myAnim < 650 && selected === 'null');

  // ── DR-1b: 판 끝 주머니의 하나씩 세기 ──
  const finish = (gid) => ev(`(() => { window.dispatchEvent(new CustomEvent('gamefinished', { detail: { gameId: ${gid}, result: 'win', color: 'w', moves: [], rivalId: null } })); return 1; })()`);
  await finish(900001);
  await until(`Boolean(document.getElementById('acorn-tally'))`, 8000);
  const read = () => ev(`(() => { const el = document.getElementById('acorn-tally'); return el ? { lines: [...el.querySelectorAll('.acorn-tally-line')].map((x) => x.textContent), total: el.querySelector('.acorn-tally-total b')?.textContent, done: el.classList.contains('done') } : null; })()`);
  const early = await read();
  await sleep(1200);
  const later = await read();
  await shot(`tally-${name}.jpg`);
  const sounds = await ev(`JSON.stringify(window.wizardChess.debugSounds().recent.filter((s) => /^button/.test(s)))`);
  check(`${name} 하나씩 세기`, '처음엔 0줄·🌰 0 → 1.2초 뒤 「승리 +30」·합계 30·끝', JSON.stringify({ early, later, sounds }),
    early && early.lines.length === 0 && later && later.lines.some((l) => /승리 \+30/.test(l)) && later.total === '30' && later.done);
  // 누르면 바로: 다음 판 끝을 하나 더 만들고 곧바로 누른다
  await ev(`(() => { document.querySelectorAll('.card-reveal-actions button.secondary').forEach((b) => b.click()); return 1; })()`);
  await sleep(300);
  await finish(900002);
  await until(`Boolean(document.getElementById('acorn-tally'))`, 8000);
  await ev(`document.getElementById('acorn-tally').click(), 1`);
  await sleep(80);
  const tapped = await read();
  check(`${name} 누르면 바로`, '80ms 안에 모든 줄·합계·끝', JSON.stringify(tapped), tapped && tapped.done && tapped.total === '30');
  ws.close();
  chrome.kill();
}
writeFileSync(new URL('result-tally.json', OUT), JSON.stringify({ at: new Date().toISOString(), pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
