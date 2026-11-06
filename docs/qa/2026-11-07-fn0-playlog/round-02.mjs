// FN-0 기록 보강 확인 2: 판 A 를 잡기 위주로 11수 이상 두며 정찰·되감기 버튼이 뜨면 누르고, 중간에 새로고침(창 닫음 → 이어 하기),
// 10수 넘어 기권(판 끝 기록) → 다음 판 한 수 → 이른 새 판(이탈). 판 기록을 꺼내 저장한다. 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const { Chess } = await import('file:///D:/chess/node_modules/chess.js/dist/esm/chess.js');
const DIR = 'C:/Users/petbl/ego/fn0-log-20261107/';
const task = await taskSpace('fn0 log check 2');
const page = task.page('p1');
const wait = (ms) => page.waitForTimeout(ms);
const ready = () => page.waitForFunction(() => { const s = window.wizardChess?.getHandBrainState?.(); return s && s.ready && s.turn === s.playerColor; }, undefined, { timeout: 90000 }).catch(() => null);
const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
async function playOne() {
  await ready();
  const fen = await page.evaluate(() => window.wizardChess.getHandBrainState().fen);
  const c = new Chess(fen);
  const ms = c.moves({ verbose: true }).filter((m) => !m.promotion || m.promotion === 'q');
  ms.sort((a, b) => (VAL[b.captured] || 0) - (VAL[a.captured] || 0) || Math.random() - 0.5);
  const m = ms[0];
  const rc = (sq) => [8 - Number(sq[1]), 'abcdefgh'.indexOf(sq[0])];
  const [fr, fc] = rc(m.from); const [tr, tc] = rc(m.to);
  await page.evaluate(([a, b, x, d]) => window.wizardChess.executeChessMove(a, b, x, d), [fr, fc, tr, tc]);
  await wait(400);
  return m.san;
}
const out = { moves: [], clicked: [] };
const pressSkills = async () => {
  for (const id of ['skill-scout', 'skill-rewind']) {
    await ready();
    const ok = await page.evaluate((id) => { const b = document.getElementById(id); if (!b) return false; b.click(); return true; }, id);
    if (ok) { out.clicked.push(id); await wait(2500); }
  }
};

await page.goto('http://127.0.0.1:3000/', { timeout: 60000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 5, dust: 0, shelf: [], shelfSlots: 3 })); });
await page.reload({ timeout: 60000 });
await ready(); await wait(3000);
for (let i = 0; i < 6; i++) { out.moves.push(await playOne()); await pressSkills(); }
await ready();
out.beforeReload = await page.evaluate(() => window.wizardChess.getHandBrainState().history.length);
await page.reload({ timeout: 60000 });
await ready(); await wait(3000);
for (let i = 0; i < 8; i++) { out.moves.push(await playOne()); await pressSkills(); if (await page.evaluate(() => window.wizardChess.getHandBrainState().history.length) >= 24) break; }
await ready();
out.beforeResign = await page.evaluate(() => window.wizardChess.getHandBrainState().history.length);
out.resign = await page.evaluate(() => window.wizardChess.quitNow('resign'));
await wait(5000);
await page.evaluate(() => window.wizardChess.quitNow('new'));
await ready(); await wait(2500);
out.moves.push(await playOne());
await ready();
await page.evaluate(() => window.wizardChess.quitNow('new'));
await ready(); await wait(2000);
out.playlog = await page.evaluate(() => JSON.parse(localStorage.getItem('wildcrown.playlog.v1') || '[]'));
await page.evaluate(() => localStorage.clear());
await fs.writeFile(DIR + 'playlog.json', JSON.stringify(out.playlog, null, 1));
await fs.writeFile(DIR + 'result.json', JSON.stringify({ ...out, playlog: undefined }, null, 1));
console.log(JSON.stringify({ ...out, playlog: out.playlog.map((e) => e.type + (e.gameId ? ':' + String(e.gameId).slice(-3) : '') + (e.kind ? '/' + e.kind : '') + (e.ply ? '@' + e.ply : '') + (e.resumed ? '<' + e.resumed : '') + (e.result ? '=' + e.result : '')) }, null, 1));
await task.finish({ keep: [] });
