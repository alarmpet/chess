// 폰 시험 1단계(PC 방장): 배포 주소에서 백으로 방을 만들고 코드를 낸다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const task = await taskSpace('online phone check');
console.log('space', task.spaceId);
const page = task.page('p1');
await page.goto('https://wildcrown.yonghane.workers.dev/', { timeout: 90000 }).catch(() => null);
await page.waitForFunction(() => Boolean(window.wizardChess?.startOnline), undefined, { timeout: 120000 });
await page.waitForFunction(() => { const o = document.querySelector('#loading-overlay'); return !o || getComputedStyle(o).pointerEvents === 'none' || getComputedStyle(o).display === 'none' || getComputedStyle(o).opacity === '0'; }, undefined, { timeout: 180000 });
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click()));
await page.click('#btn-online', { label: 'Open play a friend' });
await page.click('#online-pick-w', { label: 'Pick white' });
await page.click('#online-create', { label: 'Make room' });
await page.waitForSelector('#online-bigcode', { timeout: 15000 });
await page.waitForTimeout(2000);
const code = await page.evaluate(() => document.querySelector('#online-bigcode')?.textContent);
await fs.writeFile(DIR + 'code.txt', code || '');
console.log(code);
