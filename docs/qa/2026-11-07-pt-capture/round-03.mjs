// round-01 과 같지만 캡처가 느려(장당 0.6~1.5초) 페이지 시계를 0.15배로 늦춰 연출을 천천히 돌린다. 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/pt-capture-20261107/';
const task = await taskSpace('pt capture recheck');
const page = task.page('p1');
const wait = (ms) => page.waitForTimeout(ms);
const ready = () => page.waitForFunction(() => { const s = window.wizardChess?.getHandBrainState?.(); return s && s.ready && s.turn === s.playerColor; }, undefined, { timeout: 90000 }).catch(() => null);
const moves = [['e2','e4'],['e7','e5'],['f1','c4'],['b8','c6'],['d1','h5'],['g8','f6']].map(([from,to]) => ({ from, to }));
await page.goto('http://127.0.0.1:3000/', { timeout: 60000 });
await page.evaluate((moves) => {
  localStorage.clear();
  localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
  localStorage.setItem('wildcrown.resume.v1', JSON.stringify({ v: 1, gameId: 777, color: 'w', rivalId: null, moves }));
}, moves);
await page.reload({ timeout: 60000 });
await ready();
await wait(4000);
const SLOW = 0.15;
await page.evaluate((slow) => {
  const real = performance.now.bind(performance);
  const base = real();
  performance.now = () => base + (real() - base) * slow;
  window.__gameMs = () => performance.now() - base;
}, SLOW);
await page.evaluate(() => window.wizardChess.executeChessMove(3, 7, 1, 5));
const shots = [];
const t0 = Date.now();
for (let i = 0; i < 60 && Date.now() - t0 < 50000; i++) {
  const gms = Math.round(await page.evaluate(() => window.__gameMs()));
  const name = `s${String(i).padStart(2, '0')}-${gms}.png`;
  await page.screenshot({ path: DIR + name });
  shots.push(name);
}
const out = { shots };
out.after = await page.evaluate(() => ({ ply: window.wizardChess.getHandBrainState().history.length, banner: Boolean(document.querySelector('.checkmate-banner')) }));
await page.evaluate(() => localStorage.clear());
await fs.writeFile(DIR + 'result-03.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await task.finish({ keep: [] });
