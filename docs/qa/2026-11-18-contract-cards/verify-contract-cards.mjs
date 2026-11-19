// 계약전 판에도 카드 주머니(2026-11-18): 계약전 한 판이 끝나면 주머니가 도감에 들어가는가.
// 판 수(games)는 그대로인가 · 진 판도 빈손이 아닌가 · 같은 끝 사건이 두 번 와도 한 번만 넣는가 · 연습 문제는 카드를 주지 않는가 · 주머니 상자가 화면 안인가.
// dev 서버(3000): node docs/qa/2026-11-18-contract-cards/verify-contract-cards.mjs   (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-build.json)
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { contractById, contractProgress } from '../../../src/rules/contractSets.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-contract-cards.json';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', typeof got === 'string' ? got : JSON.stringify(got)); };
const W = 'window.wizardChess';
const mv = (s) => s.split(' ').map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4) }));
// verify-contract.mjs 와 같은 줄: 흑이 나이트를 채움, 백 차례
const LINE_MATCH = mv('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 g1f3 c8g4 h2h3 g4f3');
// 백도 비숍을 채움(1 대 1). 7.Qxf7+ 가 백의 두 번째 폰 = 왕관 완성
const LINE_FINAL = [...LINE_MATCH, ...mv('d1f3 c7c6')];

for (const [port, name, phone] of [[9670, 'mouse', false], [9671, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-ccards-${name}`;
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
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(40); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); try { writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); } catch (e) { console.log('⚠️ 캡처를 못 씀', String(e.code || e)); } };
  if (phone) {
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
  const tap = async (r, c) => {
    const p = await ev(`${W}.debugSquareClient(${r}, ${c})`);
    if (phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(120);
  };
  const rc = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];
  const cards = () => ev(`(() => { const c = JSON.parse(localStorage.getItem('wildcrown.cards.v1') || 'null'); return c && { total: Object.values(c.cards || {}).reduce((s, n) => s + n, 0), ids: Object.keys(c.cards || {}), games: c.games, settled: c.settled || [] }; })()`);
  const pouch = () => ev(`JSON.parse(localStorage.getItem('wildcrown.pouch.v1') || 'null')`);
  const ready = `(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`;
  // 새로 온 사람의 저장(카드 0장 · 0판 · 카드 켬)으로 심은 계약전 판을 연다. practice=1 은 첫 연습이 스스로 열리지 않게 한다.
  const open = async ({ moves = null, practice = 1 } = {}) => {
    for (let tries = 0; tries < 3; tries++) {
      await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: false, games: 0, dust: 0, shelf: [], shelfSlots: 3 }));
        localStorage.removeItem('wildcrown.pouch.v1');
        localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: true, cards: true, dive: false, quests: false, blitz: false }));
        localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, on: true, games: 0, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0, practice: ${practice} }));
        ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves, contract: 'p2nb' }))});` : "localStorage.removeItem('wildcrown.resume.v1');"}
        return 1; })()`);
      await send('Page.navigate', { url: BASE });
      await sleep(1500);
      if (await until(`${ready} && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, tries < 2 ? 45000 : 90000)) break;
      console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1);
    }
    await ev(`(() => { window.__ends = { game: 0, contract: [] };
      window.addEventListener('gamefinished', () => { window.__ends.game += 1; });
      window.addEventListener('contractfinished', (e) => { window.__ends.contract.push(e.detail); }); return 1; })()`);
  };
  await until('Boolean(window.wizardChess)');

  // 1) 이긴 판: 7.Qxf7+ 로 왕관 완성 → 잡은 미어캣 카드 + 이긴 사자 카드가 도감에 들어간다
  await open({ moves: LINE_FINAL });
  const before = await cards();
  await tap(...rc('f3')); await tap(...rc('f7'));
  const ended = await until(`${W}.debugContract().gameOver === true`, 20000);
  await until(`document.getElementById('card-reveal') !== null`, 8000);
  await sleep(2600);
  const won = await cards();
  const ends = await ev('window.__ends');
  const box = await ev(`(() => { const el = document.getElementById('card-reveal'); if (!el) return null; const r = el.getBoundingClientRect(); const o = document.getElementById('checkmate-overlay')?.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight, title: el.querySelector('.card-reveal-title')?.textContent, tally: Boolean(document.getElementById('acorn-tally')),
      banner: document.getElementById('checkmate-title')?.textContent, bannerVisible: document.getElementById('checkmate-overlay')?.classList.contains('visible'), bannerRect: o && { y: Math.round(o.y), h: Math.round(o.height) } }; })()`);
  await shot(`win-${name}.jpg`);
  // 한 번에 하나(TA-6): 결과 창이 떠 있는 동안 주머니는 숨는다. 「닫기」를 누르면 주머니가 보인다.
  const hiddenUnder = await ev(`document.getElementById('card-reveal')?.getBoundingClientRect().height === 0`);
  await ev(`document.getElementById('btn-checkmate-dismiss').click()`);
  await sleep(1800);
  const after = await ev(`(() => { const el = document.getElementById('card-reveal'); if (!el) return null; const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vw: innerWidth, vh: innerHeight, faces: el.querySelectorAll('.card-reveal-card').length, goal: document.getElementById('card-reveal-goal')?.textContent }; })()`);
  await shot(`pouch-${name}.jpg`);
  check(`${name} 결과 창을 닫으면 주머니`, '결과 창 동안 숨음 · 닫으면 화면 안에 뜸 · 카드 3장 · 다음 목표 한 줄', { hiddenUnder, ...after },
    hiddenUnder === true && Boolean(after) && after.w > 100 && after.h > 100 && after.x >= 0 && after.y >= 0 && after.x + after.w <= after.vw + 1 && after.y + after.h <= after.vh + 1 && after.faces === 3 && Boolean(after.goal));
  check(`${name} 이긴 계약전 판의 카드`, '끝남 · 판 전 0장 → 2장 이상(미어캣 + 사자) · 주머니 비움 · 정산 기록에 4242', { ended, before: before?.total, after: won?.total, ids: won?.ids, pouch: await pouch(), settled: won?.settled },
    ended && before?.total === 0 && won?.total >= 2 && won.ids.some((i) => i.startsWith('meerkat')) && won.ids.some((i) => i.startsWith('lion')) && (await pouch()) === null && won.settled.includes(4242));
  check(`${name} 판 수와 사건`, '카드 판 수 0 그대로 · gamefinished 0번 · contractfinished 1번', { games: won?.games, game: ends.game, contract: ends.contract.length }, won?.games === 0 && ends.game === 0 && ends.contract.length === 1);
  check(`${name} 주머니 상자`, '상자가 만들어짐 · 제목에 장수 · 도토리 집계 줄 없음(결과 상자가 따로 적는다) · 「왕관 완성」 배너도 그대로', box,
    Boolean(box) && /주머니 · \d+장/.test(box.title || '') && box.tally === false && box.banner === '왕관 완성');

  // 2) 같은 끝 사건이 한 번 더 와도 다시 넣지 않는다
  await ev(`window.dispatchEvent(new CustomEvent('contractfinished', { detail: { ...window.__ends.contract[0], reply: {} } }))`);
  await sleep(500);
  const again = await cards();
  check(`${name} 두 번 넣지 않음`, `같은 판의 끝 사건을 다시 보내도 ${won?.total}장 그대로`, { total: again?.total, games: again?.games }, again?.total === won?.total && again?.games === 0);

  // 3) 진 판: 6.Qxf3 으로 비숍을 잡고 AI 가 왕관을 완성 → 잡은 판다 카드는 남는다
  await open({ moves: LINE_MATCH });
  await tap(...rc('d1')); await tap(...rc('f3'));
  const lost = await until(`${W}.debugContract().gameOver === true`, 45000);
  await until(`document.getElementById('card-reveal') !== null`, 8000);
  await sleep(2200);
  const l = await cards();
  const lEnd = (await ev(`${W}.debugContract()`)).end;
  await shot(`loss-${name}.jpg`);
  check(`${name} 진 계약전 판의 카드`, '패 · 1장 이상(판다) · 사자 카드 없음 · 판 수 0', { lost, result: lEnd?.result, total: l?.total, ids: l?.ids, games: l?.games },
    lost && lEnd?.result === 'loss' && l?.total >= 1 && l.ids.some((i) => i.startsWith('panda')) && !l.ids.some((i) => i.startsWith('lion')) && l.games === 0);

  // 4) 연습 문제: 잡아서 풀어도 카드는 날아가지 않고 주머니·도감에 아무것도 안 생긴다
  await open({});
  await until(`!${W}.debugReel().active`, 20000);
  await ev(`${W}.startPractice(0)`);
  await until(`${W}.debugPuzzle().puzzle && !${W}.debugBusy() && ${W}.debugHistory().length > 0`, 30000);
  const hist = await ev(`${W}.debugHistory().map((m) => m.san || m)`);
  const game = new Chess();
  for (const san of hist) game.move(san);
  const set = contractById(await ev(`${W}.debugReel().contract`));
  const answer = game.moves({ verbose: true }).find((m) => { game.move(m); const win = contractProgress(set, game.history({ verbose: true })).winner; game.undo(); return win === game.turn(); });
  let flies = 0;
  if (answer) {
    for (let k = 0; k < 3; k++) { await tap(...rc(answer.from)); await tap(...rc(answer.to)); if (await until(`${W}.debugPuzzle().puzzle?.solved === true`, 4000)) break; }
    for (let i = 0; i < 20; i++) { flies = Math.max(flies, await ev(`document.querySelectorAll('.card-fly').length`)); await sleep(100); }
  }
  const p = await cards();
  await shot(`practice-${name}.jpg`);
  check(`${name} 연습 문제는 카드 없음`, '잡는 수로 풂 · 날아가는 카드 0 · 주머니 없음 · 도감 0장 · 주머니 상자 없음', { answer: answer?.san, captured: answer?.captured || null, solved: await ev(`${W}.debugPuzzle().puzzle?.solved`), flies, pouch: await pouch(), total: p?.total, reveal: await ev(`Boolean(document.getElementById('card-reveal'))`), dock: await ev(`Boolean(document.getElementById('card-dock'))`) },
    Boolean(answer?.captured) && (await ev(`${W}.debugPuzzle().puzzle?.solved`)) === true && flies === 0 && (await pouch()) === null && p?.total === 0 && !(await ev(`Boolean(document.getElementById('card-reveal'))`)));

  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), localStorage.removeItem('wildcrown.cards.v1'), localStorage.removeItem('wildcrown.pouch.v1'), 1)`);
  ws.close();
  chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
const pass = rows.filter((r) => r.ok).length;
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ url: BASE, at: new Date().toISOString(), pass, total: rows.length, rows }, null, 1));
console.log(`${pass}/${rows.length}`);
process.exit(pass === rows.length ? 0 : 1);
