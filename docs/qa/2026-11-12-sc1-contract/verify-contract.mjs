// SC-1 계약 규칙 확인: 계약으로 판이 끝나고, HUD 가 진도를 보여 주고, 이어 하기·되돌리기에 맞고, AI 와 한 판이 끝까지 간다.
// 시험 스위치(?lab=contract) 뒤. dev 서버(3000)에서: node docs/qa/2026-11-12-sc1-contract/verify-contract.mjs
// (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-contract-build.json)
// 임시 프로필 헤드리스 Chrome. 960×640 마우스 · 375×812 터치(모바일 흉내).
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-contract.json';
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

for (const [port, name, phone] of [[9490, 'mouse', false], [9491, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-sc1-${name}`;
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
  // 슬롯머신(11-18): 레버를 기다리지 않고 바로 당기는 사람 흉내 — 문서가 열릴 때마다 심는다
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'setInterval(() => { try { window.wizardChess?.pullLever?.(); } catch (e) {} }, 120);' });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(20); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(file, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
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
    // 앞 판의 문서가 아직 살아 있으면(AI 가 두는 중 등) 심은 이어 하기 기록을 덮어쓴다 — 다른 판이 열리면 다시 심는다(11-15).
    for (let tries = 0; tries < 3; tries++) {
    await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: ${quick}, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
      ${keepStore ? '' : "localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, games: 0, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0 }));"}   // IR-1 뒤: 상대는 「정식」(계약을 다 안다)으로 고정
      ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves, ...(contract ? { contract } : {}) }))});` : "localStorage.removeItem('wildcrown.resume.v1');"}
      return 1; })()`);
    await send('Page.navigate', { url: BASE + (query || '?lab=classic') });
    await sleep(1500);
    if (await until(`${ready} && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, tries < 2 ? 45000 : 90000)) break;
    console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1, JSON.stringify(await ev(`${W}?.debugHistory?.().length`)));
    }
    await listen();
  };
  await until('Boolean(window.wizardChess)');

  // 1) 새 판: 계약은 판을 여는 순간 정해져 있고, 릴이 멈출 때마다 HUD 칸이 드러나고, 규칙 한 줄이 잠깐 뜬다
  await open();
  const early = await con();
  await until(`${W}.debugContract().revealed.every(Boolean)`, 10000);
  await sleep(400);
  const a = await con();
  await until(`!${W}.debugReel().active`, 8000);
  await sleep(300);
  await shot(`hud-start-${name}.jpg`);
  const vw = await ev('({ w: innerWidth, h: innerHeight })');
  const inside = (r) => r.x >= 0 && r.y >= 0 && r.x + r.w <= vw.w + 1 && r.y + r.h <= vw.h + 1 && r.w > 0 && r.h > 0;
  check(`${name} 계약은 판을 열 때 정해진다`, '릴이 멈추기 전에도 세트 p2nb · 남은 48반수', { set: early.set, pliesLeft: early.pliesLeft, aiKnows: early.aiContract?.left }, early.set === 'p2nb' && early.pliesLeft === 48 && early.aiContract?.left === 48);
  check(`${name} HUD`, `세 칸 다 드러남 · 규칙 한 줄 · 남은 차례 24 · ${phone ? '세로(tall)' : '가로(wide)'} · 화면 안`, a.hud,
    a.hud?.on && a.hud.shown.every(Boolean) && a.hud.hint === true && a.hud.turnsLeft === 24 && a.hud.layout === (phone ? 'tall' : 'wide') && inside(a.hud.rect));

  // 2) 이어 하기: 같은 계약, 진도는 수에서 다시 세고, 릴은 다시 돌지 않는다
  await open({ moves: LINE_FINAL, contract: 'p2nb' });
  await sleep(1200);
  const b = await con();
  const reelB = await ev(`${W}.debugReel()`);
  await shot(`hud-resume-${name}.jpg`);
  check(`${name} 이어 하기`, '세트 p2nb · 릴 0번 · 나 [1,0,1] 상대 [1,1,0] · 막 finalPoint · 남은 차례 18 · 딱지 있음', { set: b.set, plays: reelB.plays, mine: b.hud?.mine, theirs: b.hud?.theirs, stage: b.stage, turnsLeft: b.hud?.turnsLeft, tags: b.tags },
    b.set === 'p2nb' && reelB.plays === 0 && b.hud?.mine.join() === '1,0,1' && b.hud?.theirs.join() === '1,1,0' && b.stage === 'finalPoint' && b.hud?.turnsLeft === 18 && b.tags > 0);

  // 3) 실제 클릭 7.Qxf7+ → 계약으로 판이 끝난다: AI 는 더 두지 않고, 전용 기록에만 남고, 이어 하기는 지워진다
  await tap(await at(5, 5));
  await tap(await at(1, 5));
  const ended = await until(`${W}.debugContract().gameOver === true`, 15000);
  await sleep(2500);
  const c = await con();
  const ends = await ev('window.__ends');
  const banner = await ev(`({ visible: document.getElementById('checkmate-overlay').classList.contains('visible'), title: document.getElementById('checkmate-title').textContent, sub: document.getElementById('checkmate-subtitle').textContent, turn: document.getElementById('turn-text').textContent })`);
  const resumeLeft = await ev(`localStorage.getItem('wildcrown.resume.v1')`);
  const stored = await ev(`JSON.parse(localStorage.getItem('wildcrown.contract.v1') || 'null')`);
  await shot(`end-contract-${name}.jpg`);
  check(`${name} 계약으로 종료`, 'Qxf7+ 에서 끝 · 승 · 사유 contract · 13반수 · AI 가 더 안 둠', { ended, end: c.end, plies: (await sans()).length }, ended && c.end?.result === 'win' && c.end?.reason === 'contract' && c.end?.plies === 13 && (await sans()).length === 13);
  check(`${name} 종료 화면`, '배너 「왕관 완성」 · 차례 글자에 사유', banner, banner.visible && banner.title === '왕관 완성' && /왕관 완성/.test(banner.turn));
  check(`${name} 전용 기록`, '계약 기록 1판 1승 · 일반 정산 사건(gamefinished) 0번 · contractfinished 1번 · 이어 하기 지워짐', { store: c.store, game: ends.game, contract: ends.contract.length, resumeLeft, last: stored?.last },
    c.store.games === 1 && c.store.win === 1 && ends.game === 0 && ends.contract.length === 1 && resumeLeft === null && stored?.last?.reason === 'contract');

  // 4) AI 도 같은 게임을 안다: 6.Qxf3 으로 비숍을 잡으면 흑(AI)이 a2 폰을 잡아 두 번째 계약을 끝낸다 — 내가 진다
  await open({ moves: LINE_MATCH, contract: 'p2nb' });
  await sleep(800);
  await tap(await at(7, 3));
  await tap(await at(5, 5));
  const aiEnded = await until(`${W}.debugContract().gameOver === true`, 40000);
  await sleep(1500);
  const k = await con();
  const kTitle = await ev(`document.getElementById('checkmate-title').textContent`);
  await shot(`end-ai-wins-${name}.jpg`);
  check(`${name} AI 가 계약으로 이긴다`, '6.Qxf3 뒤 AI 가 폰을 잡아 계약 완성 · 패 · 사유 contract · 12반수', { aiEnded, reply: (await sans()).slice(11, 12), end: k.end, theirs: k.hud?.theirs, title: kTitle },
    aiEnded && k.end?.result === 'loss' && k.end?.reason === 'contract' && k.end?.plies === 12 && k.hud?.theirsDone === 2 && kTitle === '왕관 완성');

  // 4-2) 되돌리기: 진도·HUD·남은 차례가 함께 되돌아간다
  await open({ moves: LINE_QUIET, contract: 'p2nb' });
  await sleep(800);
  const d0 = await con();
  await tap(await at(6, 0));
  await tap(await at(5, 1));
  await until(`${W}.debugHistory().length >= 12 && !${W}.debugBusy()`, 40000);
  const d1 = await con();
  const reply = (await sans()).slice(11, 12);
  const took = await ev(`${W}.takeBackMove()`);
  await sleep(500);
  const d2 = await con();
  check(`${name} 되돌리기`, '6.axb3 으로 비숍을 잡으면 나 [0,0,1] → 두 수 무르면 [0,0,0] · 남은 차례 19 로 · 막 matchPoint', { before: d0.hud?.mine, after: d1.hud?.mine, reply, took, back: d2.hud?.mine, turnsLeft: [d0.hud?.turnsLeft, d1.hud?.turnsLeft, d2.hud?.turnsLeft], over: d1.gameOver, stage: d2.stage },
    d0.hud?.mine.join() === '0,0,0' && d1.hud?.mine[2] === 1 && d1.gameOver === false && took === true && d2.hud?.mine.join() === '0,0,0' && d2.hud?.turnsLeft === 19 && d0.hud?.turnsLeft === 19 && d2.stage === 'matchPoint');

  // 5) 스위치 없이: 계약이 실린 이어 하기 기록도 일반 판으로 열린다(HUD·판정 없음)
  await open({ moves: LINE_FINAL, contract: 'p2nb', query: '' });
  await sleep(800);
  const off = await con();
  check(`${name} 스위치 꺼짐`, '세트 없음 · HUD 없음 · 딱지 0', { set: off.set, hud: off.hud, tags: off.tags }, off.set === null && off.hud === null && off.tags === 0);

  // 6) AI 와 한 판을 끝까지(가로 화면에서만): 내 쪽도 같은 AI 가 둔다. 48반수 안에 끝나야 한다.
  if (!phone) {
    await open({ quick: true });
    await until(`${W}.debugContract().revealed.every(Boolean)`, 10000);
    const t0 = Date.now();
    let maxCalls = 0;
    while (Date.now() - t0 < 420000) {
      const s = await ev(`(() => { const w = ${W}; const c = w.debugContract(); const st = w.debugMoveState(); return { over: c.gameOver || st.gameOver, busy: w.debugBusy(), plies: w.debugHistory().length, turn: w.debugHistory().length % 2 === 0 ? 'w' : 'b', calls: w.debugRenderCalls() }; })()`);
      maxCalls = Math.max(maxCalls, s.calls);
      if (s.over) break;
      if (!s.busy && s.turn === 'w') await ev(`${W}.triggerAIMoveNow()`);
      await sleep(120);
    }
    await sleep(2500);
    const g = await con();
    const st = await ev(`${W}.debugMoveState()`);
    const plies = (await sans()).length;
    const ends2 = await ev('window.__ends');
    const bannerOn = await ev(`document.getElementById('checkmate-overlay').classList.contains('visible')`);
    await shot('end-full-game.jpg');
    measured.fullGame = { seconds: Math.round((Date.now() - t0) / 1000), plies, end: g.end, progress: g.progress && { w: g.progress.w, b: g.progress.b }, maxCalls };
    check('한 판 완주', 'AI 대 AI 로 48반수 안에 종료 · 사유 기록 · 전용 기록 1판 · 배너 · 드로우콜 ≤ 100', { over: st.gameOver, plies, end: g.end, store: g.store, game: ends2.game, contract: ends2.contract.length, bannerOn, maxCalls },
      st.gameOver === true && plies <= 48 && plies > 0 && Boolean(g.end?.reason) && g.end.plies === plies && g.store.games === 1 && ends2.game === 0 && ends2.contract.length === 1 && bannerOn && maxCalls <= 100);
  }
  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);

  ws.close();
  chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
const pass = rows.filter((r) => r.ok).length;
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ url: BASE, at: new Date().toISOString(), pass, total: rows.length, measured, rows }, null, 1));
console.log(`${pass}/${rows.length}`, JSON.stringify(measured));
process.exit(pass === rows.length ? 0 : 1);
