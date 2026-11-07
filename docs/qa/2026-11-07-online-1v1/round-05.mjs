// 새 방: 방장이 지금 방을 나가고 다시 백으로 방을 만든다. 창은 친구가 들어오면 저절로 닫혀야 한다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const task = await taskSpace('online 1v1 check');
const page = task.page('p1');
await page.goto('http://127.0.0.1:3000/', { timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ timeout: 60000 });
await page.waitForFunction(() => Boolean(window.wizardChess?.startOnline), undefined, { timeout: 90000 });
await page.waitForTimeout(2500);
await page.click('#btn-online', { label: 'Open play a friend' });
await page.click('#online-pick-w', { label: 'Pick white' });
await page.click('#online-create', { label: 'Make room' });
await page.waitForSelector('#online-bigcode', { timeout: 15000 });
await page.waitForTimeout(2000);
const code = await page.evaluate(() => document.querySelector('#online-bigcode')?.textContent);
await fs.writeFile(DIR + 'code.txt', code || '');
console.log(code);
