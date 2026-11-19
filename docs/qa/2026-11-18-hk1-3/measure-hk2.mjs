// HK-2(2026-11-18): 처음 온 사람이 「릴 → 표적 딱지 → 첫 보석」을 몇 초 만에 보는가.
// 새 프로필(저장 없음)로 ?lab=contract 를 연다. 수는 대역이 둔다(표적을 잡을 수 있으면 잡는 한 수 앞 보기) — 생각하는 시간 0 의 하한이다.
// dev 서버(3000): node docs/qa/2026-11-18-hk1-3/measure-hk2.mjs [결과 파일=result-hk2.json] [캡처 폴더=hk2] [회차=2]
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { contractById, contractProgress } from '../../../src/rules/contractSets.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const QUERY = process.env.WC_QUERY ?? '?lab=contract';
const RESULT = process.argv[2] || 'result-hk2.json';
const SHOTS = process.argv[3] || 'hk2';
const RUNS = Number(process.argv[4] || 2);
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const W = 'window.wizardChess';
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const OPENING = ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'f1c4', 'c1f4', 'e1g1'];
const runs = [];

// 한 수 앞 보기: 표적(폰·나이트·비숍)을 잡는 수에 큰 점수, 두고 나서 잃을 수 있는 내 말 값을 뺀다.
function pick(game, goals) {
  let best = null;
  for (const m of game.moves({ verbose: true })) {
    if (m.promotion) continue;
    let s = 0;
    if (m.captured) s += VALUE[m.captured] + (goals.includes(m.captured) ? 6 : 0);
    game.move(m);
    if (game.isCheckmate()) s += 100;
    let loss = 0;
    for (const r of game.moves({ verbose: true })) if (r.captured) loss = Math.max(loss, VALUE[r.captured] + (goals.includes(r.captured) ? 3 : 0));
    game.undo();
    s -= loss * 0.9;
    const open = OPENING.indexOf(m.from + m.to);
    if (open >= 0) s += 0.5 - open * 0.05;
    if (!best || s > best.s) best = { s, m };
  }
  return best?.m || null;
}

let port = 9640;
for (const [name, w, h, touch] of [['desk', 1280, 800, false], ['phone', 390, 844, true]]) {
  for (let run = 1; run <= RUNS; run++) {
    port += 1;
    const dir = `${process.env.TEMP}/wc-hk2-${name}-${run}`;
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
    const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
      '--no-first-run', '--mute-audio', `--window-size=${w},${h}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
    let wsUrl = null;
    for (let i = 0; i < 60 && !wsUrl; i++) {
      try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
      if (!wsUrl) await sleep(500);
    }
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = new Map(); const errors = [];
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description?.slice(0, 160)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
    await new Promise((ok) => { ws.onopen = ok; });
    const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
    // 슬롯머신(11-18): 레버를 기다리지 않고 바로 당기는 사람 흉내 — 문서가 열릴 때마다 심는다
    await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: 'setInterval(() => { try { window.wizardChess?.pullLever?.(); } catch (e) {} }, 120);' });
    const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
    const until = async (expr, ms = 60000, step = 50) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
    const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); try { writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), Buffer.from(s.result.data, 'base64')); } catch (e) { console.log('⚠️ 캡처를 못 씀', String(e.code || e)); } };
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
    if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
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
    const rc = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];

    const t0 = Date.now();
    const at = () => +((Date.now() - t0) / 1000).toFixed(1);
    const row = { name, run, query: QUERY, t: {}, moves: [], note: [] };
    await send('Page.navigate', { url: BASE + QUERY });
    await until(`${W}?.isStarted?.()`, 120000); row.t.started = at();
    if (await until(`${W}.debugReel().active === true`, 30000)) row.t.reelStart = at(); else row.note.push('릴이 돌지 않음');
    if (await until(`(() => { const r = ${W}.debugReel(); return r.stopped.length === 3 && r.stopped.every(Boolean); })()`, 30000)) row.t.reelStop = at();
    if (await until(`${W}.debugContract().revealed.every(Boolean) && ${W}.debugContract().tags > 0`, 20000)) row.t.tags = at();
    await shot(`${name}-${run}-reel.jpg`);
    await until(`!${W}.debugBusy() && ${W}.debugReel().active === false`, 30000); row.t.canMove = at();
    row.goals = (await ev(`${W}.debugReel().goals`)) || [];
    const goalTypes = row.goals.map((g) => g[0]);

    // WC_PATH=practice: 보통 판 대신 아래 「1분 연습」 권유를 눌러 첫 문제(한 수로 왕관 완성)를 푼다.
    if (process.env.WC_PATH === 'practice' || process.env.WC_PATH === 'auto') {
      // auto: 누르지 않는다 — 첫 계약전 판은 릴 뒤에 연습 1번이 스스로 열린다(11-18 기본 켬)
      const offer = process.env.WC_PATH === 'auto' ? null : await until(`document.querySelector('#puzzle-offer.on .po-go') !== null`, 10000);
      if (offer !== null) { row.t.offer = at(); await ev(`document.querySelector('#puzzle-offer .po-go')?.click()`); }
      await until(`${W}.debugPuzzle().puzzle && !${W}.debugBusy() && ${W}.debugHistory().length > 0`, 30000); row.t.puzzleOpen = at();
      await shot(`${name}-${run}-puzzle.jpg`);
      const hist = await ev(`${W}.debugHistory().map((m) => m.san || m)`);
      const game = new Chess();
      for (const san of hist) game.move(san);
      const set = contractById(await ev(`${W}.debugReel().contract`));
      const before = game.history({ verbose: true });
      const answer = game.moves({ verbose: true }).find((m) => { game.move(m); const win = contractProgress(set, game.history({ verbose: true })).winner; game.undo(); return win === game.turn(); });
      row.offer = offer; row.answer = answer?.san || null; row.puzzlePly = before.length;
      if (answer) {
        for (let k = 0; k < 3; k++) { await tap(...rc(answer.from)); await tap(...rc(answer.to)); if (await until(`${W}.debugPuzzle().puzzle?.solved === true`, 4000)) break; }
        if (await ev(`${W}.debugPuzzle().puzzle?.solved === true`)) row.t.firstGem = at();
      }
      await sleep(1800);
      await shot(`${name}-${run}-gem.jpg`);
      row.bar = await ev(`document.getElementById('puzzle-bar')?.innerText`);
      row.end = { puzzle: (await ev(`${W}.debugPuzzle()`)).stats, on: await ev(`${W}.isContractOn()`), saved: await ev(`localStorage.getItem('wildcrown.contract.v1')`), crown: (await ev(`${W}.debugContract()`)).crown };
      console.log(JSON.stringify(row));
      runs.push(row);
      ws.close(); chrome.kill();
      await sleep(500);
      try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
      continue;
    }

    for (let turn = 0; turn < 40; turn++) {
      const hist = await ev(`${W}.debugHistory().map((m) => m.san || m)`);
      const game = new Chess();
      for (const san of hist) game.move(san);
      const c = await ev(`${W}.debugContract()`);
      if (c.progress?.w?.done >= 1 && !row.t.firstGem) { row.t.firstGem = at(); row.gemPly = hist.length; }
      if (c.gameOver || row.t.firstGem) break;
      if (game.turn() !== 'w') { await sleep(300); continue; }
      const m = pick(game, goalTypes);
      if (!m) break;
      let ok = false;
      for (let k = 0; k < 3 && !ok; k++) { await tap(...rc(m.from)); await tap(...rc(m.to)); ok = await until(`${W}.debugHistory().length > ${hist.length}`, 3000); }
      if (!ok) { row.note.push(`누르기가 안 먹음: ${m.san}`); await shot(`${name}-${run}-stuck.jpg`); break; }
      row.moves.push(m.san);
      if (m.captured && !row.t.firstCapture) row.t.firstCapture = at();
      await until(`${W}.debugContract().gameOver || (${W}.debugHistory().length >= ${hist.length + 2} && !${W}.debugBusy())`, 60000);
    }
    const end = await ev(`${W}.debugContract()`);
    if (end.progress?.w?.done >= 1 && !row.t.firstGem) { row.t.firstGem = at(); row.gemPly = (await ev(`${W}.debugHistory().length`)); }
    await sleep(1500);
    await shot(`${name}-${run}-gem.jpg`);
    row.end = { progress: end.progress, gameOver: end.gameOver, crown: end.crown, rung: end.rungName };
    row.errors = errors.slice(0, 3);
    console.log(JSON.stringify(row));
    runs.push(row);
    ws.close(); chrome.kill();
    await sleep(500);
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, query: QUERY, runs }, null, 1));
