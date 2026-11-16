// 타격 1(그래픽 계획 GX-1 · GX-2 · GX-3, 2026-11-15): 사건 꾸러미 · 화면 번쩍임 · 겹친 타격 불빛.
// dev 서버(3000): node docs/qa/2026-11-15-hit1/verify-hit1.mjs [결과 파일=result-hit1.json] [캡처 폴더=after]
// 이어 하기 기록으로 국면을 열고 실제로 눌러 잡는다. 불빛이 떠 있는 순간을 찍고, 번쩍임의 색·세기를 엔진에서 읽는다.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.argv[2] || 'result-hit1.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const measured = {};
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';
const mv = (list) => list.map(([from, to]) => ({ from, to }));

for (const [port, name, w, h, touch] of [[9551, 'desk', 1280, 800, false], [9552, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-hit1-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', `--window-size=${w},${h}`, `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
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
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1200);
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);
  const tap = async (r, c) => {
    const p = await ev(`${W}.debugSquareClient(${r}, ${c})`);
    if (touch) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(120);
  };
  // 두 번 눌러 수를 둔다. 느린 PC 에서는 첫 누르기가 먹지 않을 때가 있어, 기보가 안 늘면 다시 누른다.
  const play = async (r1, c1, r2, c2) => {
    const n = await ev(`${W}.debugHistory().length`);
    for (let i = 0; i < 3; i++) {
      await tap(r1, c1); await tap(r2, c2);
      if (await until(`${W}.debugHistory().length > ${n}`, 2500)) return true;
      console.log('⚠️ 누르기가 안 먹음 — 다시 누른다', i + 1);
      await sleep(800);
    }
    return false;
  };
  // 심은 판이 안 열리면 다시 심는다(앞 판의 문서가 기록을 덮어쓰는 일이 있다)
  const open = async (moves, color = 'w', shake = true) => {
    for (let tries = 0; tries < 3; tries++) {
      await ev(`(localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })),
        localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null })),
        localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: ${shake}, quick: false, cards: false, dive: false, quests: false, blitz: false })),
        localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 91, color, rivalId: null, moves }))}), 1)`);
      await send('Page.navigate', { url: BASE });
      await sleep(1500);
      if (await until(`${W}?.isStarted?.() && !${W}.debugBusy() && ${W}.debugHistory().slice(0, ${moves.length}).map((m) => m.from + m.to).join() === ${JSON.stringify(moves.map((m) => m.from + m.to).join())}`, tries < 2 ? 45000 : 90000)) break;
      console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1);
    }
    await until(`Boolean(${W}.debugHitFx().glow)`, 20000);
    await sleep(1500);
  };
  const fx = () => ev(`${W}.debugHitFx()`);
  // 불빛이 떠 있는 순간을 잡아 찍는다. 그동안의 드로우콜 최댓값도 잰다.
  const watchHit = async (file, hitsBefore, ms = 12000) => {
    let maxCalls = 0; let shotAt = null; const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      const s = await ev(`({ g: ${W}.debugHitFx().glow, calls: ${W}.debugRenderCalls() })`);
      if (s.calls > maxCalls) maxCalls = s.calls;
      if (!shotAt && s.g.hits > hitsBefore && s.g.live > 0) { await shot(file); shotAt = { live: s.g.live, ms: Date.now() - t0 }; }
      if (shotAt && s.g.live === 0) break;
      await sleep(15);
    }
    return { shotAt, maxCalls };
  };

  // 1) 큰 잡기(비숍이 퀸을): 금빛 번쩍임 + 겹친 불빛(불똥 16)
  await open(mv([['d2', 'd4'], ['e7', 'e5'], ['d4', 'e5'], ['d8', 'g5']]));
  let before = await fx();
  await play(7, 2, 3, 6);
  const big = await watchHit(`${name}-big.jpg`, before.glow.hits);
  let after = await fx();
  measured[`${name}-big`] = { ...big, flash: after.flash };
  check(`${name} 큰 잡기`, '번쩍임: capture · 금빛 · 0.3 · 320ms / 불빛이 떴다 사라진다 / 드로우콜 ≤ 80', { flash: after.flash, glow: after.glow, ...big },
    after.flash?.kind === 'capture' && after.flash.tone === 'gold' && after.flash.alpha === 0.3 && after.flash.ms === 320 && after.glow.hits === before.glow.hits + 1 && big.shotAt && big.maxCalls <= 80);
  const gone = await until(`${W}.debugHitFx().glow.live === 0 && ${W}.debugHitFx().glow.visible === false`, 5000);
  check(`${name} 불빛이 남지 않는다`, '끝나면 조각 0 · 메시 숨김', await fx(), gone);

  // 2) 작은 잡기(폰이 폰을): 화면 번쩍임 없음, 불빛은 심 + 별만(조각 ≤ 2)
  await open(mv([['e2', 'e4'], ['d7', 'd5']]));
  before = await fx();
  await play(4, 4, 3, 3);
  const small = await watchHit(`${name}-small.jpg`, before.glow.hits);
  after = await fx();
  check(`${name} 작은 잡기`, '화면 번쩍임 0번 · 불빛 조각 ≤ 2', { flashes: [before.flashes, after.flashes], glow: after.glow, ...small },
    after.flashes === before.flashes && after.glow.hits === before.glow.hits + 1 && small.shotAt && small.shotAt.live <= 2);

  // 3) 잡으며 체크(Qxf7+): 잡기 금빛 → 체크 주황, 두 번
  await open(mv([['e2', 'e4'], ['e7', 'e5'], ['d1', 'h5'], ['b8', 'c6']]));
  before = await fx();
  await play(3, 7, 1, 5);
  await until(`${W}.debugHitFx().flashes >= ${before.flashes + 2}`, 12000);
  after = await fx();
  check(`${name} 잡으며 체크`, '번쩍임 2번(잡기 → 체크), 마지막은 주황', { flashes: [before.flashes, after.flashes], flash: after.flash, hist: await ev(`${W}.debugHistory().map((m) => m.san)`) },
    after.flashes === before.flashes + 2 && after.flash?.kind === 'check' && after.flash.tone === 'orange');

  // 4) 내 말이 잡힌다(흑으로, 퀸을 내준 국면에서 AI 차례): 붉은 번쩍임
  await open(mv([['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['d8', 'g5']]), 'b');
  const lost = await until(`${W}.debugHitFx().flash?.kind === 'capture'`, 30000);
  const lostShot = lost ? await shot(`${name}-lost.jpg`) : null;
  after = await fx();
  const hist = await ev(`${W}.debugHistory().map((m) => m.san)`);
  check(`${name} 내 말이 잡힘`, 'AI 가 퀸을 잡으면 붉은 번쩍임', { lost, flash: after.flash, last: hist.at(-1) }, lost && after.flash.tone === 'red' && /x/.test(hist.at(-1) || ''));
  void lostShot;

  // 5) 「화면 흔들림」을 끄면 화면 번쩍임도 없다(불빛은 난다)
  await open(mv([['d2', 'd4'], ['e7', 'e5'], ['d4', 'e5'], ['d8', 'g5']]), 'w', false);
  before = await fx();
  await play(7, 2, 3, 6);
  await until(`${W}.debugHitFx().glow.hits > ${before.glow.hits}`, 12000);
  await sleep(600);
  after = await fx();
  check(`${name} 흔들림 끔`, '화면 번쩍임 0번 · 불빛은 1번', { flashes: [before.flashes, after.flashes], hits: [before.glow.hits, after.glow.hits] }, after.flashes === before.flashes && after.glow.hits === before.glow.hits + 1);

  // 6) 모양 보기: 효과를 0.1배로 느리게 돌려, 겹친 불빛과 화면 번쩍임이 한창일 때를 찍는다(확인용 스위치 — 게임에서는 1배)
  await open(mv([['d2', 'd4'], ['e7', 'e5'], ['d4', 'e5'], ['d8', 'g5']]));
  await ev(`${W}.debugHitFx({ slow: 0.1 })`);
  before = await fx();
  await play(7, 2, 3, 6);
  await until(`${W}.debugHitFx().glow.hits > ${before.glow.hits}`, 12000, 15);
  await sleep(350);
  const look = await ev(`({ live: ${W}.debugHitFx().glow.live, opacity: Number(getComputedStyle(document.getElementById('hit-flash')).opacity), calls: ${W}.debugRenderCalls() })`);
  await shot(`${name}-look-a.jpg`);
  await sleep(700);
  await shot(`${name}-look-b.jpg`);
  check(`${name} 모양(느리게)`, '불빛 조각이 떠 있고 화면 가장자리가 물들어 있다', look, look.live >= 3 && look.opacity > 0.02);
  await ev(`${W}.debugHitFx({ slow: 1 })`);

  await ev(`(['wildcrown.cards.v1', 'wildcrown.skill.v1', 'wildcrown.fx.v1', 'wildcrown.resume.v1'].forEach((k) => localStorage.removeItem(k)), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, measured, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
