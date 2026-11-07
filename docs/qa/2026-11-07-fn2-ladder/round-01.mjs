// FN-2 라이벌 = 난이도 확인: ① 새 저장(0판) → 「첫 판이라 쉬운 상대예요」 알림 · 엔진 자유 대국 세기 easy ② 라이벌 창 단계·성격·자유 대국 줄
// ③ 판 기록에 패 3판을 심고 판 끝 사건 → 「더 쉬운 라이벌」 권하기 카드 → 누르면 그 라이벌로 시작 ④ 5판 저장에서 자유 대국 보통.
// 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/fn2-ladder-20261107/';
const task = await taskSpace('fn2 ladder check');
const page = task.page('p1');
const wait = (ms) => page.waitForTimeout(ms);
const out = {};
const boot = async (games) => {
  await page.evaluate((games) => {
    localStorage.clear();
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games, dust: 0, shelf: [], shelfSlots: 3 }));
  }, games);
  await page.reload({ timeout: 60000 });
  await page.waitForFunction(() => window.wizardChess?.getRivalCatalog, undefined, { timeout: 90000 }).catch(() => null);
};

await page.goto('http://127.0.0.1:3000/', { timeout: 60000 });
await boot(0);
// 첫 판 알림은 판이 열릴 때 뜬다 — 새 판을 한 번 열어 잡는다.
await wait(8000);
out.notes = await page.evaluate(async () => {
  const seen = [];
  new MutationObserver(() => { const t = document.querySelector('.card-note')?.innerText; if (t && seen.at(-1) !== t) seen.push(t); }).observe(document.body, { subtree: true, childList: true, characterData: true });
  window.wizardChess.quitNow('new');
  await new Promise((r) => setTimeout(r, 1500));
  return seen;
});
await page.screenshot({ path: DIR + 'first-game-note.png' });
out.freePlay0 = await page.evaluate(() => window.wizardChess.getRivalCatalog().freePlay);
await page.evaluate(() => document.getElementById('btn-rivals')?.click());
await wait(800);
out.panel = await page.evaluate(() => [...document.querySelectorAll('.rival-panel .rival-row, .rival-panel .rival-free')].map((r) => r.innerText.replace(/\n+/g, ' | ')));
await page.screenshot({ path: DIR + 'rival-panel.png' });
await page.evaluate(() => document.querySelector('.rival-panel .panel-close')?.click());
await wait(400);

// 쉬움(첫 판)에서 이김 → 보통 라이벌 권하기.
out.offerWin = await page.evaluate(async () => {
  const gid = window.wizardChess.getHandBrainState().gameId;
  window.dispatchEvent(new CustomEvent('gamefinished', { detail: { moves: [], color: 'w', result: 'win', rivalId: null, gameId: gid } }));
  await new Promise((r) => setTimeout(r, 1500));
  return document.getElementById('rival-offer')?.innerText || null;
});
await page.evaluate(() => document.getElementById('checkmate-overlay')?.classList.remove('visible'));
await page.evaluate(() => document.getElementById('card-reveal')?.remove());
await wait(300);
await page.screenshot({ path: DIR + 'offer-harder.png' });
// 연패 3판: 5판 끝낸 저장(자유 대국 보통)에서 판 기록에 패 3판을 심고 판 끝 사건.
await boot(5);
await wait(6000);
// 연패 3판: 판 기록에 패 2판을 심고, 지금 판을 기권한 것처럼 판 끝 사건 + 판 기록 1판.
out.offer = await page.evaluate(async () => {
  const log = [{ type: 'game', result: 'loss' }, { type: 'game', result: 'loss' }, { type: 'game', result: 'loss' }];
  localStorage.setItem('wildcrown.playlog.v1', JSON.stringify(log));
  const gid = window.wizardChess.getHandBrainState().gameId;
  window.dispatchEvent(new CustomEvent('gamefinished', { detail: { moves: [], color: 'w', result: 'loss', rivalId: null, gameId: gid } }));
  await new Promise((r) => setTimeout(r, 1500));
  return document.getElementById('rival-offer')?.innerText || null;
});
await page.evaluate(() => document.getElementById('checkmate-overlay')?.classList.remove('visible'));
await page.evaluate(() => document.getElementById('card-reveal')?.remove());
await wait(300);
await page.screenshot({ path: DIR + 'offer-easier.png' });
await page.evaluate(() => document.getElementById('rival-offer-go')?.click());
await wait(4000);
out.afterGo = await page.evaluate(() => ({ active: window.wizardChess.getRivalCatalog().active, offer: Boolean(document.getElementById('rival-offer')) }));

await boot(5);
await wait(4000);
out.freePlay5 = await page.evaluate(() => window.wizardChess.getRivalCatalog().freePlay);

await page.evaluate(() => localStorage.clear());
await fs.writeFile(DIR + 'result.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await task.finish({ keep: [] });
