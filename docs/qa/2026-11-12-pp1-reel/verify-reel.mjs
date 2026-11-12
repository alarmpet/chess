// PP-1 소라 릴 확인: 시험 스위치(?lab=contract) 뒤에서만 돌고, 계약 목표 셋을 시간표대로 공개하고, 말들이 파도타기를 한 뒤
// 정확히 제자리로 돌아오고, 입력을 막지 않고(도는 중에 실제 클릭으로 수를 둔다), 누르면 건너뛰고, 쉬는 동안 드로우콜이 늘지 않는다.
// dev 서버(3000)에서: node docs/qa/2026-11-12-pp1-reel/verify-reel.mjs   (빌드판: WC_URL=http://localhost:4173/)
// 임시 프로필 헤드리스 Chrome. 960×640 마우스 · 375×812 터치(모바일 흉내) 두 번.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', typeof got === 'string' ? got : JSON.stringify(got)); };
const W = 'window.wizardChess';
const measured = {};

for (const [port, name, phone] of [[9486, 'mouse', false], [9487, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-pp1-reel-${name}`;
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
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
  if (phone) {
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
  const at = (r, c) => ev(`${W}.debugSquareClient(${r}, ${c})`);
  const tap = async (p) => {
    if (phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(60);
  };
  const reel = () => ev(`${W}.debugReel()`);
  const sans = () => ev(`${W}.debugHistory().map((m) => m.san)`);
  const prep = async (query) => {
    await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
      localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
    await send('Page.navigate', { url: BASE + query });
    await sleep(1500);
    await until(`(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`, 90000);
  };
  await until('Boolean(window.wizardChess)');
  await prep('');
  await sleep(2500);

  // 1) 스위치가 꺼져 있으면 새 판에도 릴이 안 돈다
  await ev(`${W}.resetChessBoard(true, false), 1`);
  await sleep(1200);
  const off = await reel();
  const idleCalls = await ev(`${W}.debugRenderCalls()`);
  check(`${name} 스위치 꺼짐 = 릴 없음`, '새 판을 열어도 안 돎', { lab: off.lab, plays: off.plays, active: off.active }, off.lab === false && off.plays === 0 && !off.active);

  // 2) 스위치를 켜고 연 판: 첫 판은 고정 세트(폰×2·나이트·비숍), 시간표대로 멈춘다
  await prep('?lab=contract');
  const started = await until(`${W}.debugReel().active`, 8000);
  // 판 위 말의 높이를 프레임마다 기록(파도타기)
  await ev(`(() => { const w = ${W}; window.__reel = { maxHop: 0, stops: [], calls: 0, frames: 0 }; const base = ${0.775}; const t0 = performance.now();
    const tick = () => { const s = w.debugReel(); const R = window.__reel; R.frames++; R.calls = Math.max(R.calls, w.debugRenderCalls());
      const n = s.stopped.filter(Boolean).length; while (R.stops.length < n) R.stops.push({ t: s.t, ms: Math.round(performance.now() - t0) });
      R.maxHop = Math.max(R.maxHop, w.debugReelHopMax ? w.debugReelHopMax() : 0);
      if (s.active || s.hops) requestAnimationFrame(tick); else R.done = true; };
    requestAnimationFrame(tick); return 1; })()`);
  await until('window.__reel.stops.length === 3', 10000);
  await sleep(250);
  await shot(`reel-${name}.jpg`);
  const mid = await reel();
  await until('window.__reel.done === true', 10000);
  const R = await ev('window.__reel');
  const end = await reel();
  measured[name] = { stops: R.stops, maxHopSquares: +R.maxHop.toFixed(3), callsIdle: idleCalls, callsDuring: R.calls, frames: R.frames };
  check(`${name} 새 판에 릴이 돈다`, '첫 판 고정 세트 p2·n1·b1', { started, contract: mid.contract, goals: mid.goals }, started && mid.contract === 'p2nb' && mid.goals.join() === 'p2,n1,b1');
  const ts = R.stops.map((s) => s.t);
  check(`${name} 쿵·쿵·쾅 시간표`, '0.7 · 1.0 · 1.3초(±0.12)', ts, ts.length === 3 && [0.7, 1.0, 1.3].every((want, i) => Math.abs(ts[i] - want) <= 0.12));
  check(`${name} 파도타기 뒤 제자리`, '말이 뜨고(>0.1칸) 끝나면 모두 제자리 · 릴 숨김', { maxHop: measured[name].maxHopSquares, hopsLeft: end.hops, active: end.active, offBase: await ev(`${W}.debugReelOffBase ? ${W}.debugReelOffBase() : -1`) },
    R.maxHop > 0.1 && end.hops === 0 && !end.active && (await ev(`${W}.debugReelOffBase()`)) === 0);
  const afterCalls = await ev(`${W}.debugRenderCalls()`);
  // 릴이 끝나면 릴 메시는 다 숨는다. 남는 것은 현상 딱지 메시 셋(목표 종류마다 하나, PP-1 ②)뿐이다.
  const tagDraws = await ev(`${W}.debugContract ? ${W}.debugContract().draws : 0`);
  check(`${name} 드로우콜`, '도는 동안 ≤ 100 · 끝나면 쉬는 값 + 딱지 메시(3)', { idle: idleCalls, during: R.calls, after: afterCalls, tagDraws }, R.calls <= 100 && tagDraws === 3 && afterCalls <= idleCalls + tagDraws);

  // 3) 입력을 막지 않는다: 릴이 도는 중(첫 멈춤 전)에 실제 클릭으로 e2 → e4
  await ev(`${W}.resetChessBoard(true, false), 1`);
  await until(`${W}.debugReel().active && ${W}.debugReel().t > 0.1`, 8000);
  const tBefore = (await reel()).t;
  await tap(await at(6, 4));
  await tap(await at(4, 4));
  const afterTap = await reel();
  await until(`${W}.debugHistory().length >= 1`, 5000);
  const h1 = await sans();
  await until(`!${W}.debugReel().active && !${W}.debugBusy()`, 15000);
  const offBase3 = await ev(`${W}.debugReelOffBase()`);
  check(`${name} 도는 중에 수 두기`, '릴 도는 중 e2→e4 가 둬지고 릴은 바로 공개 · 말은 제자리', { tBefore, skipped: afterTap.skipped, stopped: afterTap.stopped, h1, offBase: offBase3, contract: afterTap.contract },
    tBefore < 0.7 && afterTap.skipped === true && afterTap.stopped.every(Boolean) && h1[0] === 'e4' && offBase3 === 0 && afterTap.contract === 'p2nb');

  // 4) 건너뛰기: 누르면 가라앉기까지 짧다. 세 번째 판부터는 시드로 고른 세트(풀 안)
  await until(`!${W}.debugBusy()`, 20000);
  await ev(`${W}.resetChessBoard(true, false), 1`);
  await until(`${W}.debugReel().active && ${W}.debugReel().t > 0.05`, 8000);
  const t0 = Date.now();
  await ev(`${W}.skipReel()`);
  await until(`!${W}.debugReel().active`, 8000);
  const skipMs = Date.now() - t0;
  const third = await reel();
  measured[name].skipMs = skipMs;
  check(`${name} 건너뛰기`, '누른 뒤 1.2초 안에 끝 · 세 번째 판은 풀 안의 세트', { skipMs, contract: third.contract, games: third.games }, skipMs <= 1200 && ['p2nb', 'pnb', 'pnr'].includes(third.contract) && third.games === 3);

  // 5) 이어 하기로 판 중간에 돌아오면 릴이 안 돈다
  await tap(await at(6, 3));
  await tap(await at(4, 3));
  await until(`${W}.debugHistory().length >= 2 && !${W}.debugBusy()`, 30000);
  await send('Page.navigate', { url: BASE + '?lab=contract' });
  await sleep(1500);
  await until(`(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`, 90000);
  await sleep(1500);
  const resumed = await reel();
  const hist = await sans();
  check(`${name} 이어 하기 = 릴 없음`, '판 중간으로 돌아오면 안 돎', { moves: hist.length, plays: resumed.plays, active: resumed.active }, hist.length >= 2 && resumed.plays === 0 && !resumed.active);

  ws.close();
  chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
const pass = rows.filter((r) => r.ok).length;
writeFileSync(new URL('result-reel.json', OUT), JSON.stringify({ url: BASE, at: new Date().toISOString(), pass, total: rows.length, measured, rows }, null, 1));
console.log(`${pass}/${rows.length}`, JSON.stringify(measured));
process.exit(pass === rows.length ? 0 : 1);
