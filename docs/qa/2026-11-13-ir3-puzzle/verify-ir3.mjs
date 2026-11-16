// IR-3 한 방 퍼즐: 연습 권유 → 세 문제(틀리면 귀띔, 맞으면 왕관 완성) → 첫 판, 진 뒤의 「놓친 왕관」.
// 시험 스위치(?lab=contract) 뒤. dev 서버(3000): node docs/qa/2026-11-13-ir3-puzzle/verify-ir3.mjs (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-ir3-build.json)
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { CROWN_PUZZLES } from '../../../src/rules/crownPuzzleData.js';
import { parseMoves, practiceSet, puzzlePosition, solves } from '../../../src/rules/crownPuzzles.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-ir3.json';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', typeof got === 'string' ? got : JSON.stringify(got)); };
const W = 'window.wizardChess';
const rc = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];

// 연습 세 문제와, 문제마다 「왕관을 완성하지 않는 합법 수」 하나(틀린 수)
const THREE = practiceSet(CROWN_PUZZLES).map((p) => {
  const pos = puzzlePosition(p);
  const wrong = pos.chess.moves({ verbose: true }).find((m) => !m.captured && !m.promotion && !solves(pos.answers, m.from, m.to));
  return { ...p, plies: pos.steps.length, wrong: { from: wrong.from, to: wrong.to } };
});
// 놓친 왕관용 판: 백 문제(백이 9수 이상 둔 것) + 백이 결정타를 지나치는 수 + 흑의 조용한 수 → 백이 기권(10수 이상이라 패배로 남는다)
const MISSED = (() => {
  for (const p of CROWN_PUZZLES.filter((x) => x.color === 'w')) {
    const pos = puzzlePosition(p);
    if (pos.steps.length < 18) continue;
    const chess = pos.chess;
    for (const other of chess.moves({ verbose: true }).filter((m) => !m.captured && !m.promotion)) {
      chess.move(other);
      const reply = chess.moves({ verbose: true }).find((m) => !m.captured && !m.promotion && !m.san.includes('+') && !m.san.includes('#'));
      if (reply) {
        chess.move(reply);
        const over = chess.isGameOver();
        const line = chess.history({ verbose: true }).map((m) => ({ from: m.from, to: m.to }));
        chess.undo(); chess.undo();
        if (!over) return { ...p, plies: pos.steps.length, line };
      } else chess.undo();
    }
  }
  return null;
})();
if (THREE.length !== 3 || !MISSED) { console.error('문제가 모자란다', THREE.length, Boolean(MISSED)); process.exit(2); }
// 이긴 판(IR-2 의 줄): 7.Qxf7+ 로 백이 왕관 완성 — 놓친 왕관 단추가 없어야 한다
const LINE_FINAL = parseMoves('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 g1f3 c8g4 h2h3 g4f3 d1f3 c7c6');

for (const [port, name, phone] of [[9508, 'mouse', false], [9509, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-ir3-${name}`;
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
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(file, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  if (phone) {
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
  const at = (sq) => ev(`${W}.debugSquareClient(${rc(sq)[0]}, ${rc(sq)[1]})`);
  const tap = async (p) => {
    if (phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(80);
  };
  // 화면의 단추를 실제로 누른다(가운데 좌표). 가려져 있으면 그 자리의 맨 위 요소가 단추가 아니다 → false.
  const press = async (selector) => {
    const p = await ev(`(() => { const b = document.querySelector(${JSON.stringify(selector)}); if (!b) return null; const r = b.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2; const top = document.elementFromPoint(x, y);
      return { x, y, w: Math.round(r.width), h: Math.round(r.height), hit: top === b || b.contains(top) }; })()`);
    if (!p || !p.hit) return p || false;
    await tap(p);
    return p;
  };
  const move = async (m) => { await tap(await at(m.from)); await tap(await at(m.to)); };
  const con = () => ev(`${W}.debugContract()`);
  const pz = () => ev(`${W}.debugPuzzle()`);
  const plies = () => ev(`${W}.debugHistory().length`);
  const store = () => ev(`JSON.parse(localStorage.getItem('wildcrown.contract.v1') || 'null')`);
  const overlay = () => ev(`document.getElementById('checkmate-overlay').classList.contains('visible')`);
  const ready = `(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`;
  const listen = () => ev(`(() => { if (window.__ends) return 1; window.__ends = { game: 0, contract: [], solved: [] };
    window.addEventListener('gamefinished', () => { window.__ends.game += 1; });
    window.addEventListener('contractfinished', (e) => { window.__ends.contract.push(e.detail); });
    window.addEventListener('puzzlesolved', (e) => { window.__ends.solved.push(e.detail); }); return 1; })()`);
  const ends = () => ev('window.__ends');
  const inView = (r) => r && r.x >= 0 && r.y >= 0 && r.x + r.w <= (phone ? 375 : 960) + 1 && r.y + r.h <= (phone ? 812 : 640) + 1;
  // 줄이 판의 말이나 HUD 를 덮는가: 줄 상자와 HUD 상자, 줄 상자와 판(64칸의 화면 좌표) 겹침
  const overlap = () => ev(`(() => { const a = (document.querySelector('#puzzle-bar.on') || document.querySelector('#puzzle-offer.on'))?.getBoundingClientRect(); if (!a) return null;
    const hud = document.getElementById('contract-hud')?.getBoundingClientRect();
    const hits = (b) => Boolean(b && b.width && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
    let squares = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = ${W}.debugSquareClient(r, c); if (p.x > a.left && p.x < a.right && p.y > a.top && p.y < a.bottom) squares += 1; }
    return { hud: hits(hud), squares }; })()`);
  const open = async ({ moves = null, contract = null, query = '?lab=contract', storeJson = null } = {}) => {
    // 앞 판의 문서가 아직 살아 있으면(AI 가 두는 중 등) 심은 이어 하기 기록을 덮어쓴다 — 다른 판이 열리면 다시 심는다(11-15).
    for (let tries = 0; tries < 3; tries++) {
    await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
      ${storeJson ? `localStorage.setItem('wildcrown.contract.v1', ${JSON.stringify(JSON.stringify(storeJson))});` : "localStorage.removeItem('wildcrown.contract.v1');"}
      ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves, ...(contract ? { contract } : {}) }))});` : "localStorage.removeItem('wildcrown.resume.v1');"}
      return 1; })()`);
    await send('Page.navigate', { url: BASE + query });
    await sleep(1500);
    if (await until(`${ready} && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, tries < 2 ? 45000 : 90000)) break;
    console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1, JSON.stringify(await ev(`${W}?.debugHistory?.().length`)));
    }
    await listen();
  };
  await until('Boolean(window.wizardChess)');

  // 1) 첫 판을 열면 연습 권유가 뜬다 — 화면 안, HUD·판을 덮지 않는다
  await open();
  await until(`${W}.debugPuzzle().bar?.offer === true`, 20000);
  await until(`${W}.debugContract().revealed.every(Boolean)`, 20000);
  await sleep(500);
  const a = await pz();
  const aOver = await overlap();
  await shot(`offer-${name}.jpg`);
  check(`${name} 연습 권유`, '문제 12개 이상 받음 · 권유가 뜸 · 화면 안 · HUD 와 겹치지 않음 · 판의 칸을 덮지 않음', { count: a.count, bar: a.bar, over: aOver },
    a.loaded && a.count >= 12 && a.bar.offer && !a.bar.on && inView(a.bar.rect) && aOver && !aOver.hud && aOver.squares === 0);

  // 2) 「연습」을 누르면 첫 문제가 열린다: 판 중간 국면, 금빛 귀띔 없음, 이어 하기 기록 없음
  const p1 = THREE[0];
  const hit = await press('#puzzle-offer .po-go');
  await until(`${W}.debugPuzzle().puzzle?.index === 0 && ${W}.debugHistory().length === ${p1.plies}`, 20000);
  await until(ready, 20000);
  await sleep(900);
  const b = await pz();
  const bCon = await con();
  const bOver = await overlap();
  const calls = await ev(`${W}.debugRenderCalls()`);
  await shot(`puzzle-ask-${name}.jpg`);
  check(`${name} 첫 문제`, '단추가 눌림 · 연습 1/3 · 권유 닫힘 · 금빛 0 · 방패 0 · 세트 같음 · 이어 하기 기록 없음 · 줄이 화면 안, HUD·판과 겹치지 않음 · 드로우콜 ≤ 100',
    { hit, puzzle: b.puzzle, bar: b.bar, gold: bCon.goldPieces, danger: bCon.dangerPieces, set: bCon.set, resume: b.resume, over: bOver, calls },
    Boolean(hit) && b.puzzle?.kind === 'practice' && b.bar.on && !b.bar.offer && b.bar.tag === '연습 1/3' && b.bar.state === 'ask' && b.bar.next === null && bCon.goldPieces === 0 && bCon.dangerPieces === 0
    && bCon.set === p1.set && b.resume === false && inView(b.bar.rect) && !bOver.hud && bOver.squares === 0 && calls <= 100);

  // 3) 왕관을 완성하지 않는 수는 놓이지 않는다 — 귀띔 글과 금빛 딱지가 켜진다
  await move(p1.wrong);
  await sleep(500);
  const c = await pz();
  const cCon = await con();
  await shot(`puzzle-hint-${name}.jpg`);
  check(`${name} 틀린 수`, '수가 놓이지 않음 · 시도 1 · 귀띔 글 · 금빛 딱지 1 이상 · 상대는 두지 않음', { plies: await plies(), puzzle: c.puzzle, bar: c.bar.line, gold: cCon.goldPieces },
    (await plies()) === p1.plies && c.puzzle.tries === 1 && c.puzzle.hint === true && c.bar.state === 'wrong' && /금빛 왕관/.test(c.bar.line) && cCon.goldPieces >= 1);

  // 4) 답을 두면 왕관 완성: 보석 둘, 종료 배너 없음, 전용 기록에 판이 남지 않음
  await move({ from: p1.answer.slice(0, 2), to: p1.answer.slice(2, 4) });
  await until(`${W}.debugPuzzle().puzzle?.solved === true`, 20000);
  await until(`${W}.debugContract().crown.w.length === 2 && ${W}.debugContract().crown.flying === 0`, 10000);
  await sleep(900);
  const d = await pz();
  const dCon = await con();
  const dEnds = await ends();
  await shot(`puzzle-solved-${name}.jpg`);
  check(`${name} 왕관 완성`, '풀림 · 내 왕관 보석 둘 · 「다음 문제」 단추 · 종료 배너 없음 · 계약전 기록 0판 · 정산 사건 0 · 풀이 사건 1(시도 1)',
    { puzzle: d.puzzle, crown: dCon.crown.w, bar: d.bar, overlay: await overlay(), store: await store(), ends: dEnds },
    d.puzzle.solved && d.puzzle.ms > 0 && dCon.crown.w.length === 2 && dCon.crown.w[1] === p1.gem && d.bar.state === 'solved' && d.bar.next === '다음 문제' && !(await overlay())
    && ((await store())?.games || 0) === 0 && dEnds.contract.length === 0 && dEnds.game === 0 && dEnds.solved.length === 1 && dEnds.solved[0].tries === 1 && inView(d.bar.rect));

  // 5) 둘째·셋째 문제: 한 번에 푼다. 셋째 뒤에는 「이제 첫 판!」, 연습 표시가 저장된다
  const firstTry = [];
  for (const i of [1, 2]) {
    await press('#puzzle-bar .pb-go');
    await until(`${W}.debugPuzzle().puzzle?.index === ${i} && ${W}.debugHistory().length === ${THREE[i].plies}`, 20000);
    await until(ready, 20000);
    await sleep(700);
    const before = await con();
    await move({ from: THREE[i].answer.slice(0, 2), to: THREE[i].answer.slice(2, 4) });
    await until(`${W}.debugPuzzle().puzzle?.solved === true`, 20000);
    await sleep(700);
    const after = await pz();
    firstTry.push({ i, goldBefore: before.goldPieces, tries: after.puzzle.tries, tag: after.bar.tag, next: after.bar.next });
  }
  await sleep(600);
  const e = await pz();
  await shot(`practice-done-${name}.jpg`);
  check(`${name} 세 문제 끝`, '둘째·셋째는 귀띔 없이 한 번에 · 「연습 3/3」 · 단추 「이제 첫 판!」 · 연습 표시 저장 · 풀이 사건 3 · 기록 0판', { firstTry, practiceDone: e.practiceDone, store: await store(), solved: (await ends()).solved.length },
    firstTry.every((f) => f.goldBefore === 0 && f.tries === 0) && firstTry[1].tag === '연습 3/3' && firstTry[1].next === '이제 첫 판!' && firstTry[0].next === '다음 문제'
    && e.practiceDone === true && (await store())?.practice === 1 && ((await store())?.games || 0) === 0 && (await ends()).solved.length === 3);

  // 6) 「이제 첫 판!」: 전체 말로 새 판, 줄이 걷히고 권유는 다시 뜨지 않는다
  await press('#puzzle-bar .pb-go');
  await until(`${W}.debugPuzzle().puzzle === null && ${W}.debugHistory().length === 0 && ${W}.debugContract().revealed.every(Boolean)`, 25000);
  await sleep(700);
  const f = await pz();
  const fCon = await con();
  check(`${name} 첫 판으로`, '퍼즐 없음 · 줄·권유 없음 · 0수 · 계약 판 · 보석 0', { puzzle: f.puzzle, bar: f.bar, set: fCon.set, gems: fCon.crown.gems, pieces: await ev(`${W}.debugPieces ? ${W}.debugPieces().length : null`) },
    f.puzzle === null && !f.bar.on && !f.bar.offer && fCon.set !== null && fCon.crown.gems === 0 && fCon.gameOver === false);

  // 7) 「그만」: 문제를 풀다 말고 닫으면 새 판이고, 연습 표시는 남지 않는다 → 권유가 다시 뜬다. ✕ 는 권유를 치운다
  await open();
  await until(`${W}.debugPuzzle().bar?.offer === true`, 20000);
  await press('#puzzle-offer .po-go');
  await until(`${W}.debugPuzzle().puzzle?.index === 0 && ${ready}`, 20000);
  await sleep(500);
  await press('#puzzle-bar .pb-quit');
  await until(`${W}.debugPuzzle().puzzle === null && ${W}.debugHistory().length === 0`, 20000);
  await until(`${W}.debugPuzzle().bar?.offer === true`, 20000);
  const g = await pz();
  await press('#puzzle-offer .po-no');
  await sleep(300);
  const g2 = await pz();
  check(`${name} 그만 · 넘기기`, '그만 → 새 판·권유 다시 · ✕ → 권유 닫힘·연습 표시 저장', { quit: { puzzle: g.puzzle, offer: g.bar.offer, done: g.practiceDone }, skip: { offer: g2.bar.offer, done: g2.practiceDone } },
    g.puzzle === null && g.bar.offer && g.practiceDone === false && !g2.bar.offer && g2.practiceDone === true);

  // 8) 놓친 왕관: 결정타를 지나치고 진 판 → 결과 화면에 단추 → 그 국면이 연습으로 열린다 → 풀면 「새 판」. 기록은 진 판 하나 그대로
  await open({ moves: MISSED.line, contract: MISSED.set, storeJson: { v: 1, games: 3, win: 1, loss: 2, draw: 0, byReason: {}, last: null, rung: 0, lossRun: 0, practice: 1 } });
  await sleep(800);
  await ev(`${W}.quitNow('resign')`);
  await until(`${W}.debugContract().hud?.resultIn === true`, 15000);
  await sleep(700);
  const h = await pz();
  const hBtn = await ev(`(() => { const b = document.querySelector('#contract-result .cr-missed'); if (!b) return null; const r = b.getBoundingClientRect();
    return { text: b.textContent, inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, h: Math.round(r.height) }; })()`);
  await shot(`missed-offer-${name}.jpg`);
  check(`${name} 놓친 왕관 단추`, '진 판(기권) · 지나친 차례 = 문제 국면 · 답 같음 · 결과 안에 단추(화면 안, 높이 ≥ 40)', { missed: h.missed, want: { ply: MISSED.plies, answer: MISSED.answer }, btn: hBtn, end: (await con()).end },
    h.missed?.ply === MISSED.plies && h.missed.answers.join() === MISSED.answer && hBtn?.inView && hBtn.h >= 40 && /놓친 왕관/.test(hBtn.text) && (await con()).end?.result === 'loss');
  const hHit = await press('#contract-result .cr-missed');
  await until(`${W}.debugPuzzle().puzzle?.kind === 'missed' && ${W}.debugHistory().length === ${MISSED.plies}`, 20000);
  await until(ready, 20000);
  await sleep(900);
  const i1 = await pz();
  await shot(`missed-ask-${name}.jpg`);
  await move({ from: MISSED.answer.slice(0, 2), to: MISSED.answer.slice(2, 4) });
  await until(`${W}.debugPuzzle().puzzle?.solved === true`, 20000);
  await sleep(900);
  const i2 = await pz();
  const iStore = await store();
  await shot(`missed-solved-${name}.jpg`);
  check(`${name} 놓친 왕관 풀기`, '단추가 눌림 · 종료 배너 닫힘 · 「놓친 왕관 · 연습」 · 풀면 「새 판」 · 기록은 4판(진 판 하나만 더해짐) · 사다리 그대로',
    { hit: Boolean(hHit), ask: { tag: i1.bar.tag, line: i1.bar.line, on: i1.bar.on }, solved: { state: i2.bar.state, next: i2.bar.next }, overlay: await overlay(), store: iStore },
    Boolean(hHit) && i1.bar.on && i1.bar.tag === '놓친 왕관 · 연습' && i2.bar.state === 'solved' && i2.bar.next === '새 판' && !(await overlay()) && iStore.games === 4 && iStore.loss === 3 && iStore.win === 1);
  await press('#puzzle-bar .pb-go');
  await until(`${W}.debugPuzzle().puzzle === null && ${W}.debugHistory().length === 0`, 20000);

  // 9) 이긴 판에는 놓친 왕관 단추가 없다
  await open({ moves: LINE_FINAL, contract: 'p2nb', storeJson: { v: 1, games: 3, win: 1, loss: 2, draw: 0, byReason: {}, last: null, rung: 0, lossRun: 0, practice: 1 } });
  await sleep(800);
  await move({ from: 'f3', to: 'f7' });
  await until(`${W}.debugContract().hud?.resultIn === true`, 20000);
  await sleep(500);
  const j = await pz();
  check(`${name} 이긴 판`, '놓친 왕관 없음 · 단추 없음', { missed: j.missed, btn: await ev(`Boolean(document.querySelector('#contract-result .cr-missed'))`), end: (await con()).end?.result },
    j.missed === null && !(await ev(`Boolean(document.querySelector('#contract-result .cr-missed'))`)) && (await con()).end?.result === 'win');

  // 10) 스위치가 꺼져 있으면 퍼즐 묶음을 받지 않는다
  await open({ query: '' });
  await sleep(800);
  const k = await pz();
  check(`${name} 스위치 꺼짐`, '퍼즐 모듈 없음 · 줄 없음', { loaded: k.loaded, bar: k.bar, dom: await ev(`Boolean(document.getElementById('puzzle-bar'))`) }, k.loaded === false && k.bar === null && !(await ev(`Boolean(document.getElementById('puzzle-bar'))`)));

  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);
  ws.close(); chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, practice: THREE.map((p) => p.id), missed: MISSED.id, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
