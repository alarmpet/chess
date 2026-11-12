// CX-2 확인: 잡힌 동물 5종의 퇴장을 페이지 안에서 매 프레임 기록하고(debugFading), 시계를 0.25배로 늦춰
// 잡힌 말 화면 위치 둘레를 연속 캡처한다. 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/cx0-20261108/';
const lines = JSON.parse(await fs.readFile('D:/chess/docs/qa/2026-11-08-cx0-captures/lines.json', 'utf8'));
const KEYS = ['rook>pawn', 'queen>knight', 'queen>bishop', 'bishop>rook', 'rook>queen'];
const task = await taskSpace('cx2 trace');
const page = task.page('p1');
const out = {};
await page.goto('http://127.0.0.1:3000/', { timeout: 90000 });
for (const key of KEYS) {
  const L = lines.find((l) => l.key === key);
  await page.evaluate((L) => {
    localStorage.clear();
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
    localStorage.setItem('wildcrown.resume.v1', JSON.stringify({ v: 1, gameId: 777, color: L.color, rivalId: null, moves: L.moves }));
  }, L);
  await page.reload({ timeout: 90000 });
  await page.waitForFunction(() => { const s = window.wizardChess?.getHandBrainState?.(); return window.wizardChess?.isStarted?.() && s && s.ready && s.turn === s.playerColor && !window.wizardChess.debugBusy?.(); }, undefined, { timeout: 120000 });
  await page.waitForTimeout(3500);
  await page.evaluate(() => document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click()));
  await page.evaluate(() => {
    const real = performance.now.bind(performance);
    const base = real();
    performance.now = () => base + (real() - base) * 0.25;
    window.__trace = [];
    const tick = () => { const f = window.wizardChess.debugFading(); if (f.length) window.__trace.push(f[0]); window.__traceRaf = requestAnimationFrame(tick); };
    tick();
  });
  await page.evaluate((L) => window.wizardChess.executeChessMove(L.last.from[0], L.last.from[1], L.last.to[0], L.last.to[1], L.last.promotion ? { promotion: L.last.promotion } : {}), L);
  await page.waitForFunction(() => window.wizardChess.debugFading().length > 0, undefined, { timeout: 60000, polling: 20 });
  const shots = [];
  for (let i = 0; i < 14; i++) {
    const f = await page.evaluate(() => window.wizardChess.debugFading()[0] || null);
    if (!f) break;
    const name = `tr-${key.replace('>', '-x-')}-${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: DIR + name });
    shots.push({ name, age: +f.age.toFixed(3), x: Math.round(f.x), y: Math.round(f.y), up: +f.up.toFixed(2), back: +f.back.toFixed(2), lean: Math.round(f.leanDeg) });
  }
  await page.waitForFunction(() => window.wizardChess.debugFading().length === 0, undefined, { timeout: 60000 });
  const trace = await page.evaluate(() => { cancelAnimationFrame(window.__traceRaf); return window.__trace; });
  const max = (k) => Math.max(...trace.map((t) => t[k]));
  const react = trace.filter((t) => t.age <= 0.55);
  out[key] = { frames: trace.length, maxUp: +max('up').toFixed(2), maxLean: Math.round(max('leanDeg')), backAtReactEnd: +(react.at(-1)?.back ?? 0).toFixed(2), maxLeanInReact: Math.round(Math.max(...react.map((t) => t.leanDeg))), shots };
  console.log(key, JSON.stringify({ ...out[key], shots: shots.length }));
}
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await fs.writeFile(DIR + 'result-trace.json', JSON.stringify(out, null, 1));
await task.finish({ keep: [] });
