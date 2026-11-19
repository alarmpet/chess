// CX-3 확인: 잡는 동물 6종의 공격 자세를 페이지 안에서 매 프레임 기록하고(debugAttackPose), 시계를 0.2배로 늦춰
// 공격하는 말 둘레를 연속 캡처한다. 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/cx0-20261108/';
const lines = JSON.parse(await fs.readFile('D:/chess/docs/qa/2026-11-08-cx0-captures/lines.json', 'utf8'));
const KEYS = ['pawn>pawn', 'knight>pawn', 'bishop>knight', 'rook>rook', 'queen>knight', 'king>bishop'];
const task = await taskSpace('cx3 trace');
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
    performance.now = () => base + (real() - base) * 0.2;
    window.__trace = [];
    let last = null;
    const tick = () => { const p = window.wizardChess.debugAttackPose(); if (p && p.u !== last) { window.__trace.push(p); last = p.u; } window.__traceRaf = requestAnimationFrame(tick); };
    tick();
  });
  await page.evaluate((L) => window.wizardChess.executeChessMove(L.last.from[0], L.last.from[1], L.last.to[0], L.last.to[1], L.last.promotion ? { promotion: L.last.promotion } : {}), L);
  await page.waitForFunction(() => (window.__trace.at(-1)?.u ?? -1) >= 0, undefined, { timeout: 60000, polling: 20 });
  const shots = [];
  for (let i = 0; i < 14; i++) {
    const p = await page.evaluate(() => window.__trace.at(-1));
    if (!p || p.u > 1) break;
    const name = `ta-${key.replace('>', '-x-')}-${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: DIR + name });
    shots.push({ name, u: +p.u.toFixed(2), x: Math.round(p.x), y: Math.round(p.y), pitch: +p.pitch.toFixed(2) });
  }
  await page.waitForFunction(() => !window.wizardChess.debugBusy?.(), undefined, { timeout: 90000 });
  // 상대 응수가 잡기면 그 공격도 기록되므로 이 칸의 공격자 종류만 남긴다.
  const atkType = key.split('>')[0];
  const tr = await page.evaluate((t) => { cancelAnimationFrame(window.__traceRaf); return window.__trace.filter((p) => p.type === t && p.u >= 0 && p.u <= 1.001); }, atkType);
  const ext = (k, f) => +f(...tr.map((p) => p[k])).toFixed(2);
  out[key] = { frames: tr.length, pitch: [ext('pitch', Math.min), ext('pitch', Math.max)], liftMax: ext('lift', Math.max), rollMax: ext('roll', Math.max), yawAbs: +Math.max(...tr.map((p) => Math.abs(p.yaw))).toFixed(2), stretch: [ext('stretch', Math.min), ext('stretch', Math.max)], shots };
  console.log(key, JSON.stringify({ ...out[key], shots: shots.length }));
}
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await fs.writeFile(DIR + 'result-trace-atk.json', JSON.stringify(out, null, 1));
await task.finish({ keep: [] });
