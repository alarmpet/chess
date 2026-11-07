// FN-3 확인: 새 저장(0판, 연습 단계) — ① 첫 판 되감기 단추 ② e4 → 상대 수 뒤 직전 수 칸 표시 ③ 되감기 누름 → 표시가 없어짐/앞 수로
// ④ 상대 수가 호랑이를 노리는 국면을 판 사건으로 보내 「호랑이가 노려지고 있어요」 ⑤ 6판 저장(보통) — 되감기 단추 없음, 같은 사건에 알림 없음.
// 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/fn3-practice-20261107/';
const task = await taskSpace('fn3 practice check');
const page = task.page('p1');
const wait = (ms) => page.waitForTimeout(ms);
const ready = () => page.waitForFunction(() => { const s = window.wizardChess?.getHandBrainState?.(); return s && s.ready && s.turn === s.playerColor; }, undefined, { timeout: 90000 }).catch(() => null);
const out = {};
const boot = async (games) => {
  await page.evaluate((games) => {
    localStorage.clear();
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games, dust: 0, shelf: [], shelfSlots: 3 }));
  }, games);
  await page.reload({ timeout: 60000 });
  await ready();
  await wait(2500);
};
// 백 퀸 d5 를 흑 폰 e6 이 노리는 국면(지켜져 있어도 싼 말이 노림).
const THREAT = '4k3/8/4p3/3Q4/4P3/8/8/4K3 w - - 0 1';
const fireThreat = () => page.evaluate(async (fen) => {
  const seen = [];
  new MutationObserver(() => { const t = document.querySelector('.card-note')?.innerText; if (t && seen.at(-1) !== t) seen.push(t); }).observe(document.body, { subtree: true, childList: true, characterData: true });
  const gid = window.wizardChess.getHandBrainState().gameId;
  window.dispatchEvent(new CustomEvent('movelanded', { detail: { gameId: gid, ply: 31, byPlayer: false, move: { color: 'b', piece: 'p', from: 'e7', to: 'e6', san: 'e6', after: fen } } }));
  await new Promise((r) => setTimeout(r, 900));
  return seen;
}, THREAT);

await page.goto('http://127.0.0.1:3000/', { timeout: 60000 });
await boot(0);
out.start = await page.evaluate(() => ({ rewind: Boolean(document.getElementById('skill-rewind')), mark: window.wizardChess.debugLastMoveMark() }));
await page.evaluate(() => window.wizardChess.executeChessMove(6, 4, 4, 4));
await wait(600);
out.afterMine = await page.evaluate(() => window.wizardChess.debugLastMoveMark());
await ready(); await wait(800);
out.afterReply = await page.evaluate(() => ({ mark: window.wizardChess.debugLastMoveMark(), last: window.wizardChess.getHandBrainState().history.length }));
await page.screenshot({ path: DIR + 'last-move.png' });
out.rewindClick = await page.evaluate(() => { const b = document.getElementById('skill-rewind'); if (!b) return false; b.click(); return true; });
await wait(1500);
out.afterRewind = await page.evaluate(() => ({ mark: window.wizardChess.debugLastMoveMark(), ply: window.wizardChess.getHandBrainState().history.length, button: Boolean(document.getElementById('skill-rewind')) }));
await wait(3500);
out.threatEasy = await fireThreat();
await page.screenshot({ path: DIR + 'threat-note.png' });

await boot(6);
out.normal = await page.evaluate(() => ({ rewind: Boolean(document.getElementById('skill-rewind')), stage: window.wizardChess.getRivalCatalog().freePlay.stage }));
await wait(3500);
out.threatNormal = await fireThreat();

await page.evaluate(() => localStorage.clear());
await fs.writeFile(DIR + 'result.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await task.finish({ keep: [] });
