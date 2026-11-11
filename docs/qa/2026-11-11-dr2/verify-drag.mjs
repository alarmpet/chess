// DR-2b 확인: 내 말에서 시작한 끌기는 말을 옮기고 카메라는 그대로, 빈 곳에서 시작한 끌기는 예전처럼 카메라를 돌린다.
// 휴대폰 폭 칸 크기도 잰다(먼 줄 8 · 가까운 줄 1 칸의 화면 폭).
// dev 서버(3000)에서: node docs/qa/2026-11-11-dr2/verify-drag.mjs   (빌드판: WC_URL=http://localhost:4173/)
// 임시 프로필 헤드리스 Chrome. 960×640 마우스 · 375×812 터치(모바일 흉내) 두 번.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const sizes = {};
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };
const W = 'window.wizardChess';

for (const [port, name, phone] of [[9496, 'mouse', false], [9497, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-dr2-drag-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
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
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
  if (phone) {
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
  const at = (r, c) => ev(`${W}.debugSquareClient(${r}, ${c})`);
  // 누르고 → 10걸음에 걸쳐 옮기고 → 뗀다. 터치는 touch 이벤트(포인터 종류 touch), 마우스는 mouse 이벤트.
  const drag = async (a, b) => {
    const steps = 10;
    const pt = (k) => ({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps });
    if (phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
      for (let k = 1; k <= steps; k++) { await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(k)] }); await sleep(16); }
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: a.x, y: a.y, button: 'left', buttons: 1, clickCount: 1 });
      for (let k = 1; k <= steps; k++) { const p = pt(k); await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, button: 'left', buttons: 1 }); await sleep(16); }
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b.x, y: b.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(80);
  };
  const cam = () => ev(`(() => { const p = ${W}.debugCamera().position; return [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)]; })()`);
  const sans = () => ev(`${W}.debugHistory().map((m) => m.san)`);

  await until('Boolean(window.wizardChess)');
  await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }));
    localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
    localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
  await ev('location.reload(), 1').catch(() => null);
  await sleep(1500);
  await until(`(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`, 90000);
  await sleep(1500);
  const w0 = await ev('innerWidth');

  // 칸 크기: 먼 줄(8)·가까운 줄(1)에서 이웃 칸 중심 거리(가로)와 7·2 줄까지 거리(세로), CSS px
  const d = (p, q) => Math.round(Math.hypot(p.x - q.x, p.y - q.y));
  sizes[name] = { width: w0, far: { across: d(await at(0, 3), await at(0, 4)), deep: d(await at(0, 3), await at(1, 3)) }, near: { across: d(await at(7, 3), await at(7, 4)), deep: d(await at(7, 3), await at(6, 3)) } };
  console.log(name, '칸 크기(px)', JSON.stringify(sizes[name]));

  // 1) 내 말 끌기: e2 → e4. 카메라는 그대로, 수가 둬진다.
  const c0 = await cam();
  await drag(await at(6, 4), await at(4, 4));
  const c1 = await cam();
  await until(`${W}.debugHistory().length >= 1`, 3000);
  const h1 = await sans();
  const st1 = await ev(`${W}.debugDrag()`);
  check(`${name} 내 말 끌기 e2→e4`, '수 e4 · 카메라 그대로 · 끌기 뒤 카메라 조작 다시 켜짐', JSON.stringify({ w0, h1, c0, c1, st1 }),
    w0 > 0 && h1[0] === 'e4' && JSON.stringify(c0) === JSON.stringify(c1) && st1.moved >= 1 && st1.orbit === true);
  await until(`(() => { const w = ${W}; return w.debugHistory().length === 2 && !w.debugBusy(); })()`, 30000);

  // 2) 미리 두기도 끌기로: d2→d4 를 둔 직후(연출 중) g1→f3 을 끈다
  await ev(`${W}.executeChessMove(6, 3, 4, 3), 1`);
  await until(`${W}.debugMoveState().animating`, 5000);
  await drag(await at(7, 6), await at(5, 5));
  const pm2 = await ev(`${W}.debugPremove()`);
  await shot(`premove-${name}.jpg`);
  await until(`(() => { const w = ${W}; return w.debugHistory().length >= 5 && !w.debugBusy(); })()`, 30000);
  const h2 = await sans();
  check(`${name} 끌어서 미리 두기 g1→f3`, '연출 중 끌기 → 미리 둔 수 g1-f3 → 흑 뒤 5번째 수 Nf3', JSON.stringify({ premove: pm2.premove && [pm2.premove.fromR, pm2.premove.fromC, pm2.premove.toR, pm2.premove.toC], h2 }),
    pm2.premove?.toR === 5 && pm2.premove?.toC === 5 && h2[4] === 'Nf3');

  // 3) 판 밖(8줄 너머 바다 — 폰에서는 a4 왼쪽이 화면 밖이다)에서 시작한 끌기는 카메라를 돌린다, 수는 없다. AI 의 답(6번째 수)까지 기다린 뒤 — debugBusy 는 AI 의 쉼을 안 센다.
  //    (판 위 빈 칸이라도 앞줄 말의 몸이 덮고 있으면 그 말을 집는다 — 의도된 규칙이라 시작점을 판 밖으로 둔다.)
  await until(`(() => { const w = ${W}; return w.debugHistory().length === 6 && !w.debugBusy(); })()`, 30000);
  await sleep(1500);
  const n3 = (await sans()).length;
  const c2 = await cam();
  const e8 = await at(0, 4), e7 = await at(1, 4);
  const sea = { x: e8.x, y: e8.y - 1.6 * (e7.y - e8.y) };
  const hitCanvas = await ev(`document.elementFromPoint(${sea.x}, ${sea.y})?.tagName`);
  const before3 = await ev(`${W}.debugDrag()`);
  await drag(sea, { x: sea.x + 120, y: sea.y + 10 });
  await sleep(600);
  const c3 = await cam();
  const n3b = (await sans()).length;
  const after3 = await ev(`${W}.debugDrag()`);
  check(`${name} 판 밖 끌기 = 카메라`, '카메라 위치가 바뀜 · 수 그대로 · 말 안 집음', JSON.stringify({ hitCanvas, sea: [Math.round(sea.x), Math.round(sea.y)], c2, c3, n: [n3, n3b], started: [before3.started, after3.started] }),
    hitCanvas === 'CANVAS' && JSON.stringify(c2) !== JSON.stringify(c3) && n3 === n3b && after3.started === before3.started);
  ws.close();
  chrome.kill();
}
writeFileSync(new URL('result-drag.json', OUT), JSON.stringify({ at: new Date().toISOString(), url: BASE, pass: rows.filter((r) => r.ok).length, total: rows.length, sizes, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
