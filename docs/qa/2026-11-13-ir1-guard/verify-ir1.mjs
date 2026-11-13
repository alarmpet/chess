// IR-1 지기 전에 보이게: 상대 사다리(입문·초급·정식), 금빛 결정타·위험 방패, 아차 방지.
// 시험 스위치(?lab=contract) 뒤. dev 서버(3000): node docs/qa/2026-11-13-ir1-guard/verify-ir1.mjs (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-ir1-build.json)
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-ir1.json';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', typeof got === 'string' ? got : JSON.stringify(got)); };
const W = 'window.wizardChess';
const measured = {};
const mv = (s) => s.split(' ').map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4) }));
// 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.Nf3 Bg4 5.h3 Bxf3 — 흑이 나이트를 채움(흑 1 · 백 0), 백 차례
const LINE_MATCH = mv('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 g1f3 c8g4 h2h3 g4f3');
// … 6.Qxf3 c6 — 백도 비숍을 채움(1 대 1), 백 차례. 7.Qxf7+ 가 백의 두 번째 폰 = 계약 완성
const LINE_FINAL = [...LINE_MATCH, ...mv('d1f3 c7c6')];
// 1.Nc3 d5 2.Nb5 Bd7 3.Nd4 e5 4.Nb3 Ba4 5.d3 Bxb3 — 흑이 나이트를 채움, 폰은 아무도 안 잡음. 6.axb3 뒤에 흑이 한 수로 끝낼 길이 없다
const LINE_QUIET = mv('b1c3 d7d5 c3b5 c8d7 b5d4 e7e5 d4b3 d7a4 d2d3 a4b3');

for (const [port, name, phone] of [[9496, 'mouse', false], [9497, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-ir1-${name}`;
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
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
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
  const con = () => ev(`${W}.debugContract()`);
  const sans = () => ev(`${W}.debugHistory().map((m) => m.san)`);
  const ready = `(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`;
  const listen = () => ev(`(() => { if (window.__ends) return 1; window.__ends = { game: 0, contract: [] };
    window.addEventListener('gamefinished', () => { window.__ends.game += 1; });
    window.addEventListener('contractfinished', (e) => { window.__ends.contract.push(e.detail); }); return 1; })()`);
  // 저장을 깨끗이 하고(전용 기록 포함) 원하는 이어 하기 기록으로 연다
  const open = async ({ moves = null, contract = null, quick = false, query = '?lab=contract', keepStore = false } = {}) => {
    await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: ${quick}, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
      ${keepStore ? '' : "localStorage.removeItem('wildcrown.contract.v1');"}
      ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves, ...(contract ? { contract } : {}) }))});` : "localStorage.removeItem('wildcrown.resume.v1');"}
      return 1; })()`);
    await send('Page.navigate', { url: BASE + query });
    await sleep(1500);
    await until(`${ready} && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, 90000);
    await listen();
  };
  await until('Boolean(window.wizardChess)');

  const seed = (rung) => ev(`(localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, games: 5, win: 3, loss: 2, draw: 0, byReason: {}, last: null, rung: ${rung}, lossRun: 0 })), 1)`);
  const note = () => ev(`document.querySelector('.card-note')?.textContent || null`);

  // 1) 처음 하는 사람: 상대는 「입문」 — 계약을 모른다. 화면에 이름으로 적힌다.
  await open({ moves: LINE_FINAL, contract: 'p2nb' });
  await sleep(1200);
  const a = await con();
  check(`${name} 입문 상대`, '사다리 0 · HUD 에 「입문」 · AI 에게 계약을 넘기지 않음', { rung: a.rung, name: a.rungName, rival: a.hud?.rival, ai: a.aiContract }, a.rung === 0 && a.hud?.rival === '입문' && a.aiContract === null);

  // 2) 금빛 결정타와 위험 방패: 7.Qxf7+ 로 끝낼 수 있는 f7 폰은 금빛, 흑 퀸이 노리는 a2 폰은 방패
  await shot(`gold-shield-${name}.jpg`);
  const calls = await ev(`${W}.debugRenderCalls()`);
  check(`${name} 금빛·방패`, '금빛 1 이상 · 방패 1 이상 · 딱지 메시 ≤ 6 · 드로우콜 ≤ 100', { gold: a.gold, shield: a.shield, goldPieces: a.goldPieces, dangerPieces: a.dangerPieces, draws: a.draws, calls },
    a.gold >= 1 && a.shield >= 1 && a.goldPieces === a.gold && a.dangerPieces === a.shield && a.draws <= 6 && calls <= 100);

  // 3) 결정타를 두면 이기고, 다음 상대가 한 칸 오른다
  await tap(await at(5, 5));
  await tap(await at(1, 5));
  await until(`${W}.debugContract().gameOver === true`, 15000);
  await sleep(2500);
  const b = await con();
  await shot(`rung-up-${name}.jpg`);
  check(`${name} 사다리 오름`, '승 · 기록의 사다리 1 · 결과에 「다음 상대는 한 단계 위 「초급」이에요.」 · 금빛·방패 걷힘', { end: b.end, storeRung: b.storeRung, note: b.hud?.ended?.note, gold: b.gold, shield: b.shield },
    b.end?.result === 'win' && b.storeRung === 1 && b.hud?.ended?.note === '다음 상대는 한 단계 위 「초급」이에요.' && b.gold === 0 && b.shield === 0);
  await ev(`document.getElementById('btn-checkmate-newgame').click()`);
  await until(`${W}.debugContract().hud?.on === true && ${W}.debugHistory().length === 0`, 15000);
  const c = await con();
  check(`${name} 초급 상대`, '새 판 사다리 1 · 「초급」 · AI 는 제 색(흑)만 센다', { rung: c.rung, rival: c.hud?.rival, only: c.aiContract?.only }, c.rung === 1 && c.hud?.rival === '초급' && c.aiContract?.only === 'b');

  // 4) 아차 방지: 5…Bxb3 뒤(흑은 나이트를 채웠다) 6.Bg5 는 Qxg5 로 비숍을 내줘 계약을 끝내 준다 — 놓기 전에 한 번 알린다
  await seed(0);
  await open({ moves: LINE_QUIET, contract: 'p2nb', keepStore: true });
  await sleep(1000);
  await tap(await at(7, 2));
  await tap(await at(3, 6));
  await sleep(700);
  const d = await con();
  const dNote = await note();
  await shot(`oops-${name}.jpg`);
  check(`${name} 아차 알림`, '수가 놓이지 않음(10반수 그대로) · 알림 글 · 경고 1번 · 걸린 비숍에 방패', { plies: (await sans()).length, note: dNote, oops: d.oops, shield: d.shield },
    (await sans()).length === 10 && /목표를 다 채워요/.test(dNote || '') && d.oops.warned === 1 && d.oops.last?.threats.includes('Qxg5') && d.shield >= 1);
  // 다른 수(6.axb3)는 그냥 놓인다
  await tap(await at(6, 0));
  await tap(await at(5, 1));
  await until(`${W}.debugHistory().length >= 11`, 8000);
  const e = await con();
  check(`${name} 다른 수는 그냥`, '6.axb3 가 바로 놓임 · 경고는 그대로 1번', { san: (await sans())[10], warned: e.oops.warned, played: e.oops.played }, (await sans())[10] === 'axb3' && e.oops.warned === 1 && e.oops.played === 0);

  // 5) 같은 수를 한 번 더 누르면 그대로 둔다
  await open({ moves: LINE_QUIET, contract: 'p2nb', keepStore: true });
  await sleep(1000);
  for (let k = 0; k < 2; k++) { await tap(await at(7, 2)); await tap(await at(3, 6)); await sleep(500); }
  await until(`${W}.debugHistory().length >= 11`, 8000);
  const f = await con();
  check(`${name} 한 번 더 누르면 둔다`, '6.Bg5 가 놓임 · 경고 뒤 그대로 둔 수 1', { san: (await sans())[10], oops: f.oops }, (await sans())[10] === 'Bg5' && f.oops.played >= 1);

  // 6) 정식 상대에서는 알리지 않는다
  await seed(2);
  await open({ moves: LINE_QUIET, contract: 'p2nb', keepStore: true });
  await sleep(1000);
  const before = (await con()).oops.warned;
  await tap(await at(7, 2));
  await tap(await at(3, 6));
  await until(`${W}.debugHistory().length >= 11`, 8000);
  const h = await con();
  check(`${name} 정식은 알림 없음`, '사다리 2 · 6.Bg5 가 바로 놓임 · 경고 수 그대로 · AI 는 전부 안다', { rung: h.rung, san: (await sans())[10], warned: [before, h.oops.warned], only: h.aiContract?.only ?? null }, h.rung === 2 && (await sans())[10] === 'Bg5' && h.oops.warned === before && h.hud?.rival === '정식');

  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);
  ws.close(); chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
