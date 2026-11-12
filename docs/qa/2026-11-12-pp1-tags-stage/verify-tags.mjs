// PP-1 현상 딱지·노림 불빛(②)과 매치 포인트 무대(⑤) 확인. 시험 스위치(?lab=contract) 뒤.
// 이어 하기 기록으로 정해진 국면을 만들고, 릴로 계약(p2nb)을 공개한 뒤 딱지·막·하늘·바다 시계·드로우콜을 잰다.
// dev 서버(3000)에서: node docs/qa/2026-11-12-pp1-tags-stage/verify-tags.mjs   (빌드판: WC_URL=http://localhost:4173/)
// 임시 프로필 헤드리스 Chrome. 960×640 마우스 · 375×812 터치(모바일 흉내) 두 번.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-tags.json';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', typeof got === 'string' ? got : JSON.stringify(got)); };
const W = 'window.wizardChess';
const measured = {};
const mv = (s) => s.split(' ').map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4) }));
// A: 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 — 백 차례. 백 비숍이 c6 나이트를, 백 나이트가 e5 폰을 공격 중(노림 둘)
const LINE_OPEN = mv('e2e4 e7e5 g1f3 b8c6 f1b5 a7a6');
// B: 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.Nf3 Bg4 5.h3 Bxf3 — 흑이 나이트를 잡아 흑만 하나 남김(매치 포인트), 백 차례
const LINE_MATCH = mv('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 g1f3 c8g4 h2h3 g4f3');
// C: … 6.Qxf3 c6 — 양쪽 다 하나 남김(결승점), 백 차례. 7.Qxf7+ 가 두 번째 폰 = 계약 완성
const LINE_FINAL = [...LINE_MATCH, ...mv('d1f3 c7c6')];

for (const [port, name, phone] of [[9488, 'mouse', false], [9489, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-pp1-tags-${name}`;
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
  const calls = async (ms = 600) => { let max = 0; const t0 = Date.now(); while (Date.now() - t0 < ms) { max = Math.max(max, await ev(`${W}.debugRenderCalls()`)); await sleep(30); } return max; };
  // 이어 하기 기록으로 국면을 만들고 릴(p2nb)로 계약을 공개한다
  const open = async (moves) => {
    await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
      localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 777, color: 'w', rivalId: null, moves }))}); return 1; })()`);
    await send('Page.navigate', { url: BASE + '?lab=contract' });
    await sleep(1500);
    await until(`(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy() && w.debugHistory().length === ${moves.length}; })()`, 90000);
    await sleep(2500);
    // 바다 생물 모델이 다 뜬 뒤의 드로우콜을 기준으로 삼는다: 두 번 연달아 같은 값이 나올 때까지(최대 12초)
    let prev = await calls(700);
    for (let i = 0; i < 14; i++) { const now = await calls(700); if (now === prev) break; prev = now; }
    return prev;
  };
  const reveal = async () => {
    await ev(`${W}.playReel('p2nb').then(() => 1)`);
    await until(`${W}.debugContract().revealed.every(Boolean)`, 8000);
    await until(`!${W}.debugReel().active`, 8000);
  };
  await until('Boolean(window.wizardChess)');

  // 1) 열린 국면: 릴 전에는 딱지 없음 → 공개 뒤 표적 종류의 상대 말 전부에 딱지, 내가 공격 중인 둘만 흔들림
  const idleCalls = await open(LINE_OPEN);
  const before = await con();
  await reveal();
  await sleep(500);
  const a = await con();
  const aCalls = await calls();
  await shot(`tags-open-${name}.jpg`);
  check(`${name} 릴 전에는 딱지 없음`, '딱지 0 · 막 open', { tags: before.tags, stage: before.stage }, before.tags === 0 && before.stage === 'open');
  check(`${name} 공개 뒤 딱지`, '흑 폰 8 + 나이트 2 + 비숍 2 = 12 · 종류 p·n·b', { tags: a.tags, types: a.types }, a.tags === 12 && a.types.join() === 'p,n,b');
  check(`${name} 노림 불빛`, '내가 공격 중인 셋(b5 비숍 → c6 나이트·a6 폰, f3 나이트 → e5 폰)만 흔들림 · 빛 없음', { hot: a.hot, halos: a.halos, stage: a.stage, mix: a.mix }, a.hot === 3 && a.halos === 0 && a.stage === 'open' && a.mix === 0);
  check(`${name} 딱지 드로우콜`, '딱지가 그리는 메시 3(종류마다 하나) · 전체 ≤ 100', { draws: a.draws, idle: idleCalls, calls: aCalls }, a.draws === 3 && aCalls <= 100);
  const zenithBase = a.zenith;
  const shallowBase = a.shallow;

  // 2) 매치 포인트: 하늘이 낮아지고, 바다 시계가 느려지고, 남은 딱지 뒤에 빛
  const idleMatch = await open(LINE_MATCH);
  await reveal();
  const reached = await until(`${W}.debugContract().mix >= 0.999`, 5000);
  const b = await con();
  const s0 = b.seaTime; const w0 = Date.now();
  await sleep(1000);
  const b2 = await con();
  const seaRate = +((b2.seaTime - s0) / ((Date.now() - w0) / 1000)).toFixed(2);
  const bCalls = await calls();
  await shot(`stage-match-${name}.jpg`);
  const lum = (hex) => parseInt(hex.slice(0, 2), 16) + parseInt(hex.slice(2, 4), 16) + parseInt(hex.slice(4, 6), 16);
  measured[name] = { idleCalls, tagCalls: aCalls, idleMatch, stageCalls: bCalls, zenithBase, zenithMatch: b.zenith, shallowBase, shallowMatch: b.shallow, seaRate };
  check(`${name} 매치 포인트 막`, '흑이 하나 남김 → matchPoint · 무대 1.0', { stage: b.stage, mix: b.mix, reached, mp: b.progress.matchPoint }, b.stage === 'matchPoint' && reached && b.progress.matchPoint.b === true && b.progress.matchPoint.w === false);
  check(`${name} 하늘 한 톤`, '하늘 천정과 얕은 바다 색이 평소보다 어둡다(화면 값으로 8~30%)', { zenith: [zenithBase, b.zenith, +(lum(b.zenith) / lum(zenithBase)).toFixed(2)], shallow: [shallowBase, b.shallow, +(lum(b.shallow) / lum(shallowBase)).toFixed(2)] },
    [lum(b.zenith) / lum(zenithBase), lum(b.shallow) / lum(shallowBase)].every((r) => r > 0.7 && r < 0.92));
  check(`${name} 바다 잔잔`, '바다 시계가 0.4배(±0.08)', { seaRate }, Math.abs(seaRate - 0.4) <= 0.08);
  check(`${name} 남은 딱지의 빛`, '딱지마다 빛 하나 · 그리는 메시 4(딱지 3 + 빛 1) · 전체 ≤ 100', { tags: b.tags, halos: b.halos, draws: b.draws, idle: idleMatch, calls: bCalls }, b.tags > 0 && b.halos === b.tags && b.draws === 4 && bCalls <= 100);

  // 3) 실제 클릭으로 6.Qxf3(비숍 잡기) → 양쪽 다 하나 남김: 「결승점」 한 번, 비숍 딱지는 내려간다
  await tap(await at(7, 3));
  await tap(await at(5, 5));
  await until(`${W}.debugHistory().length >= 11`, 5000);
  const landed = await until(`${W}.debugContract().stage === 'finalPoint'`, 15000);
  const c = await con();
  const snd = await ev(`${W}.debugSounds().recent`);
  await sleep(250);
  await shot(`stage-final-${name}.jpg`);
  check(`${name} 결승점`, 'Qxf3 뒤 finalPoint · 글자 한 번 · 심장 박자 · 비숍 딱지 없음', { h: (await sans()).slice(10, 11), stage: c.stage, finalShown: c.finalShown, types: c.types, beat: snd.filter((n) => n.startsWith('heartBeat')).length },
    landed && c.finalShown === true && !c.types.includes('b') && snd.some((n) => n.startsWith('heartBeat')));

  // 4) 되돌리기: 막이 기보대로 되돌아간다(AI 가 답한 뒤 두 수를 무른다)
  await until(`${W}.debugHistory().length >= 12 && !${W}.debugBusy()`, 40000);
  const took = await ev(`${W}.takeBackMove()`);
  await sleep(400);
  const d = await con();
  check(`${name} 되돌리기`, '두 수를 무르면 matchPoint 로 · 비숍 딱지 다시', { took, plies: (await sans()).length, stage: d.stage, types: d.types }, took === true && d.stage === 'matchPoint' && d.types.includes('b'));

  // 5) 계약 완성: 7.Qxf7+ 로 두 번째 폰 → 딱지가 모두 내려가고 무대가 돌아온다
  await open(LINE_FINAL);
  await reveal();
  await until(`${W}.debugContract().mix >= 0.999`, 5000);
  const e0 = await con();
  await tap(await at(5, 5));
  await tap(await at(1, 5));
  const done = await until(`${W}.debugContract().stage === 'done'`, 15000);
  const back = await until(`${W}.debugContract().mix === 0`, 6000);
  const e = await con();
  await sleep(300);
  const eCalls = await calls(400);
  check(`${name} 계약 완성`, 'Qxf7+ 뒤 done · 딱지 0 · 무대 0 · 하늘 원래 색', { from: e0.stage, stage: e.stage, winner: e.progress?.winner, tags: e.tags, mix: e.mix, zenith: e.zenith },
    e0.stage === 'finalPoint' && done && back && e.progress.winner === 'w' && e.tags === 0 && e.draws === 0 && e.zenith === zenithBase);
  measured[name].doneCalls = eCalls;

  // 6) 스위치 없이 같은 국면: 딱지도 무대도 없다
  await ev(`localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 778, color: 'w', rivalId: null, moves: LINE_MATCH }))}), 1`);
  await send('Page.navigate', { url: BASE });
  await sleep(1500);
  await until(`(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`, 90000);
  await sleep(1500);
  const off = await con();
  check(`${name} 스위치 꺼짐`, '딱지 0 · 무대 0 · 막 open', { tags: off.tags, mix: off.mix, stage: off.stage, zenith: off.zenith }, off.tags === 0 && off.draws === 0 && off.mix === 0 && off.stage === 'open' && off.zenith === zenithBase);
  await ev(`localStorage.removeItem('wildcrown.resume.v1'), 1`);

  ws.close();
  chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
const pass = rows.filter((r) => r.ok).length;
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ url: BASE, at: new Date().toISOString(), pass, total: rows.length, measured, rows }, null, 1));
console.log(`${pass}/${rows.length}`, JSON.stringify(measured));
process.exit(pass === rows.length ? 0 : 1);
