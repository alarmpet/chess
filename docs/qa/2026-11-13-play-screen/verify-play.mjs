// 플레이 화면 개편 1차(2026-11-13): 세로 구도 · 낮은 가로 화면 HUD · 차례 판.
// dev 서버(3000): node docs/qa/2026-11-13-play-screen/verify-play.mjs [결과 파일=result-play.json] [캡처 폴더=after]
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const CLASSIC = `${BASE}?lab=classic`;   // 보통 체스로 연다 — 계약전이 기본이 된 뒤(11-18)에도 이 검증은 보통 판을 본다
const RESULT = process.argv[2] || 'result-play.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const measured = {};
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';

for (const [port, name, w, h, touch] of [[9531, 'desk', 1280, 800, false], [9532, 'phone', 390, 844, true], [9533, 'land', 844, 390, true], [9534, 'small', 360, 640, true]]) {
  const dir = `${process.env.TEMP}/wc-play-${name}`;
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
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(50); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1200);
  // 느린 PC 에서는 이때 아직 about:blank 다(저장을 못 쓴다) — 게임 문서가 뜬 것을 보고 심는다.
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);
  await ev(`(localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })),
    localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null })),
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false })), localStorage.removeItem('wildcrown.resume.v1'), 1)`);
  await send('Page.navigate', { url: CLASSIC });
  await sleep(1500);
  await until(`${W}?.isStarted?.() && !${W}.debugBusy()`, 90000);
  await sleep(2500);
  const tap = async (p) => {
    if (touch) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(80);
  };

  // 구도: 64칸 가운데 화면 안(가장자리 12px 안쪽)에 든 칸 수, 칸의 세로 길이(누를 자리), 끝 줄의 가로 자리
  const geo = await ev(`(() => { const P = (r, c) => ${W}.debugSquareClient(r, c); let inside = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = P(r, c); if (p.x >= 12 && p.x <= innerWidth - 12 && p.y >= 12 && p.y <= innerHeight - 12) inside += 1; }
    return { inside, nearRowPx: Math.round(Math.abs(P(7, 3).y - P(6, 3).y)), farRowPx: Math.round(Math.abs(P(1, 3).y - P(0, 3).y)),
      nearColPx: Math.round(Math.abs(P(7, 4).x - P(7, 3).x)), farColPx: Math.round(Math.abs(P(0, 4).x - P(0, 3).x)),
      a1: Math.round(P(7, 0).x), h1: Math.round(P(7, 7).x), top: Math.round(P(0, 3).y), bottom: Math.round(P(7, 3).y), vw: innerWidth, vh: innerHeight }; })()`);
  // HUD 가 덮는 칸: 늘 떠 있는 것(왼쪽 위 · 빠른 단추 · 아래 줄 가운데 보이는 것)의 상자 안에 가운데가 든 칸 수
  const hud = await ev(`(() => { const shown = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05 && r.width > 0; };
    const boxes = [...document.querySelectorAll('#hud-left > *, #hud-quick > *, #hud-bottom > *')].filter(shown).map((e) => e.getBoundingClientRect());
    let covered = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = ${W}.debugSquareClient(r, c); if (boxes.some((b) => p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom)) covered += 1; }
    // 말의 머리: 시작 국면의 말 32개마다, 칸 가운데에서 그 자리의 칸 세로 길이의 1.5배 위(말 키 어림)
    let heads = 0; for (const r of [0, 1, 6, 7]) for (let c = 0; c < 8; c++) { const p = ${W}.debugSquareClient(r, c); const q = ${W}.debugSquareClient(r === 0 ? 1 : r - 1, c); const y = p.y - 1.5 * Math.abs(p.y - q.y);
      if (boxes.some((b) => p.x > b.left && p.x < b.right && y > b.top && y < b.bottom)) heads += 1; }
    const quick = [...document.querySelectorAll('#hud-quick .hud-btn')].filter(shown).map((b) => b.getBoundingClientRect());
    return { boxes: boxes.length, covered, heads, hintShown: shown(document.getElementById('controls-hint')), rows: new Set(quick.map((q) => Math.round(q.top))).size,
      minBtn: Math.round(Math.min(...quick.map((q) => Math.min(q.width, q.height)))), bg: getComputedStyle(document.getElementById('status-pill')).backgroundColor }; })()`);
  const turn0 = await ev(`({ text: document.getElementById('turn-text').textContent, mine: document.body.classList.contains('my-turn') })`);
  measured[name] = { geo, hud };
  await shot(`${name}-play.jpg`);
  // 캐릭터 룩 A(11-14): 채도·윤곽 셰이더가 걸려 있다(등 표식 B 는 넣었다가 뺐다)
  const look = await ev(`({ look: ${W}.debugAnimalLook(), calls: ${W}.debugRenderCalls() })`);
  check(`${name} 캐릭터 룩`, '채도 > 1 · 윤곽 > 0 · 드로우콜 ≤ 100', look, look.look.sat > 1 && look.look.rim > 0 && look.calls <= 100);
  check(`${name} 구도`, '64칸이 모두 화면 안(가장자리 12px 안쪽)', geo, geo.inside === 64);
  check(`${name} HUD 가 판을 덮지 않음`, '늘 떠 있는 HUD 가 덮는 칸 0 · 덮는 말 머리 0 · 빠른 단추 한 줄 · 단추 한 변 ≥ 36px', hud, hud.covered === 0 && hud.heads === 0 && hud.rows === 1 && hud.minBtn >= 36);
  if (touch) check(`${name} 조작법 줄`, '터치 화면에서는 마우스 안내가 없다', { hintShown: hud.hintShown }, hud.hintShown === false);
  check(`${name} 차례 판`, '「내 차례」 · 내 차례 표시', turn0, turn0.text === '내 차례' && turn0.mine === true);

  // e2 → e4 를 실제로 눌러 둔다: 수가 놓이고, 상대 차례로 바뀐다
  await tap(await ev(`${W}.debugSquareClient(6, 4)`));
  await sleep(450);
  await shot(`${name}-select.jpg`);
  // 고른 말·갈 칸 표시(2차): 고른 칸 1 · 갈 칸 점 2(e3, e4) · 머리 위 화살표 · 표시가 더하는 드로우콜 ≤ 4 · 낱개 메시 0
  const marks = await ev(`(() => { const st = ${W}.getState(); return { ...st.moveMarks, loose: st.highlightMeshCount, calls: ${W}.debugRenderCalls() }; })()`);
  check(`${name} 고른 말 표시`, '고른 칸 · 점 2 · 화살표 · 표시 드로우콜 ≤ 4 · 낱개 메시 0 · 전체 ≤ 100', marks, marks.selected === true && marks.dots === 2 && marks.rings === 0 && marks.arrow === true && marks.draws <= 4 && marks.loose === 0 && marks.calls <= 100);
  await tap(await ev(`${W}.debugSquareClient(4, 4)`));
  const moved = await until(`${W}.debugHistory().length >= 1`, 8000);
  // 차례 판은 수의 연출이 끝난 뒤에 바뀐다 — 그때까지 기다린다(상대가 두기 전에 한 번은 「상대 차례」가 보여야 한다)
  const sawTheirs = await until(`/상대/.test(document.getElementById('turn-text').textContent) && !document.body.classList.contains('my-turn')`, 6000);
  const turn1 = await ev(`({ text: document.getElementById('turn-text').textContent, mine: document.body.classList.contains('my-turn'), first: ${W}.debugHistory()[0]?.san })`);
  check(`${name} 누르기`, 'e4 가 놓임 · 차례 판이 상대 차례로', { moved, sawTheirs, turn1 }, moved && sawTheirs && turn1.first === 'e4' && /상대/.test(turn1.text) && turn1.mine === false);
  await until(`${W}.debugHistory().length >= 2 && !${W}.debugBusy()`, 30000);
  await sleep(1200);
  const marksAfter = await ev(`${W}.getState().moveMarks`);
  check(`${name} 표시 걷힘`, '수를 둔 뒤 표시가 남지 않는다', marksAfter, marksAfter.selected === false && marksAfter.dots === 0 && marksAfter.arrow === false && marksAfter.draws === 0);
  const turn2 = await ev(`({ text: document.getElementById('turn-text').textContent, mine: document.body.classList.contains('my-turn'), calls: ${W}.debugRenderCalls() })`);
  await shot(`${name}-reply.jpg`);
  check(`${name} 돌아온 차례`, '상대가 둔 뒤 다시 「내 차례」 · 드로우콜 ≤ 100', turn2, /^내 차례/.test(turn2.text) && turn2.mine === true && turn2.calls <= 100);

  // 3차: 1.e4 d5 2.d4 에서 이어 한다(상대가 e5 를 둔 것으로) — 잡을 말이 있는 국면에서 고리 · 퀸의 여러 점 · 위험 표시를 본다
  await ev(`(localStorage.setItem('wildcrown.resume.v1', JSON.stringify({ v: 1, gameId: 77, color: 'w', rivalId: null, moves: [['e2','e4'],['d7','d5'],['d2','d4'],['e7','e5']].map(([from, to]) => ({ from, to })) })), 1)`);
  await send('Page.navigate', { url: CLASSIC });
  await sleep(1500);
  await until(`${W}?.isStarted?.() && !${W}.debugBusy() && ${W}.debugHistory().length === 4`, 90000);
  await sleep(2500);
  await tap(await ev(`${W}.debugSquareClient(4, 4)`));   // e4 폰: 앞은 막혔고 d5 를 잡을 수 있다
  await sleep(450);
  const cap = await ev(`(() => { const st = ${W}.getState(); return { ...st.moveMarks, loose: st.highlightMeshCount, calls: ${W}.debugRenderCalls() }; })()`);
  await shot(`${name}-capture.jpg`);
  check(`${name} 잡기 고리`, 'e4 폰: 점 0 · 고리 1(d5) · 화살표 · 낱개 메시 0', cap, cap.selected === true && cap.dots === 0 && cap.rings === 1 && cap.arrow === true && cap.loose === 0 && cap.calls <= 100);
  await tap(await ev(`${W}.debugSquareClient(7, 3)`));   // 퀸: d2 d3 · e2 f3 g4 h5
  await sleep(450);
  const queen = await ev(`(() => { const st = ${W}.getState(); return { ...st.moveMarks, sel: ${W}.debugSelected(), calls: ${W}.debugRenderCalls() }; })()`);
  await shot(`${name}-queen.jpg`);
  check(`${name} 퀸의 갈 칸`, '점 6 · 고리 0 · 표시 드로우콜 ≤ 5 · 전체 ≤ 100', queen, queen.dots === 6 && queen.rings === 0 && queen.draws <= 5 && queen.calls <= 100);
  const nThreat = await ev(`${W}.showThreats()`);
  await sleep(450);
  const threat = await ev(`(() => { const st = ${W}.getState(); return { n: ${nThreat}, ...st.moveMarks, loose: st.highlightMeshCount, calls: ${W}.debugRenderCalls() }; })()`);
  await shot(`${name}-threat.jpg`);
  check(`${name} 위험 표시`, '위험한 말 2(d4 · e4) · 고른 표시는 걷힘 · 낱개 메시 0', threat, threat.n === 2 && threat.threats === 2 && threat.selected === false && threat.loose === 0 && threat.calls <= 100);

  // 4차: 체크메이트 고리 — 1.f3 e5 2.g4 에서 흑으로 이어 해 Qh4# 를 실제로 눌러 둔다
  await ev(`(localStorage.setItem('wildcrown.resume.v1', JSON.stringify({ v: 1, gameId: 78, color: 'b', rivalId: null, moves: [['f2','f3'],['e7','e5'],['g2','g4']].map(([from, to]) => ({ from, to })) })), 1)`);
  await send('Page.navigate', { url: CLASSIC });
  await sleep(1500);
  await until(`${W}?.isStarted?.() && !${W}.debugBusy() && ${W}.debugHistory().length === 3`, 90000);
  await sleep(2500);
  await tap(await ev(`${W}.debugSquareClient(0, 3)`));   // d8 퀸
  await sleep(450);
  await tap(await ev(`${W}.debugSquareClient(4, 7)`));   // h4
  const mated = await until(`${W}.debugHistory().at(-1)?.san === 'Qh4#' && ${W}.getState().moveMarks.threats === 1`, 20000);
  await sleep(1200);
  const mate = await ev(`(() => { const st = ${W}.getState(); return { san: ${W}.debugHistory().at(-1)?.san, ...st.moveMarks, loose: st.highlightMeshCount }; })()`);
  await shot(`${name}-mate.jpg`);
  check(`${name} 체크메이트 고리`, 'Qh4# · 왕의 칸에 주황 고리 1 + 붉은 칸 1 · 낱개 메시 0', { mated, ...mate }, mated && mate.threats === 1 && mate.rings === 1 && mate.loose === 0);

  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.cards.v1'), localStorage.removeItem('wildcrown.skill.v1'), localStorage.removeItem('wildcrown.fx.v1'), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, measured, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
