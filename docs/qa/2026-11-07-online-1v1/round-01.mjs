// 친구와 두기: 방장(ego-browser p1)이 백으로 방을 만들고 코드를 낸다. 손님은 앱 안 브라우저에서 들어온다.
// 시작 전 localStorage 를 떠 둔다(끝 라운드에서 되돌린다).
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const task = await taskSpace('online 1v1 check');
console.log('space', task.spaceId);
const page = task.page('p1');
await page.goto('http://127.0.0.1:3000/', { timeout: 60000 });
const backup = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]))));
await fs.writeFile(DIR + 'ls-backup.json', backup);
await page.evaluate(() => {
  localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
});
await page.reload({ timeout: 60000 });
await page.waitForFunction(() => Boolean(window.wizardChess?.startOnline), undefined, { timeout: 90000 });
await page.waitForTimeout(3000);
await page.click('#btn-online', { label: 'Open play a friend' });
await page.waitForSelector('#online-create', { timeout: 10000 });
await page.screenshot({ path: DIR + 'a1-panel.png' });
await page.click('#online-pick-w', { label: 'Pick white' });
await page.click('#online-create', { label: 'Make room' });
await page.waitForSelector('#online-bigcode', { timeout: 15000 });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => ({
  code: document.querySelector('#online-bigcode')?.textContent,
  url: location.href,
  bar: document.querySelector('#online-bar')?.innerText,
  online: window.wizardChess.isOnline(),
  color: window.wizardChess.getHandBrainState().playerColor
}));
console.log(JSON.stringify(info));
await page.screenshot({ path: DIR + 'a2-room.png' });
await fs.writeFile(DIR + 'code.txt', info.code || '');
