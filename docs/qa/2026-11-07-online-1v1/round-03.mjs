// 방장: 손님의 「한 판 더」를 받아들인다 → 색이 바뀌어 방장이 흑. 손님(백)이 e4 를 두고 새로고침한 뒤에도 판이 이어지는지,
// 방장의 e5 가 새로고침한 손님에게 가는지 본다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const task = await taskSpace('online 1v1 check');
const page = task.page('p1');
const out = {};
out.ask = await page.evaluate(() => document.querySelector('#online-rematch')?.innerText);
await page.screenshot({ path: DIR + 'c1-host-asked.png' });
await page.click('#online-rematch', { label: 'Accept rematch' });
await page.waitForTimeout(3000);
out.after = await page.evaluate(() => ({ bar: document.querySelector('#online-bar')?.innerText, color: window.wizardChess.getHandBrainState().playerColor, ply: window.wizardChess.getHandBrainState().history.length }));
// 손님 e4 → 손님 새로고침 → 방장 e5
await page.waitForFunction(() => window.wizardChess.getHandBrainState().history.length >= 1, undefined, { timeout: 180000 });
out.gotE4 = Date.now();
await page.waitForFunction(() => Boolean(window.__goE5), undefined, { timeout: 180000 }).catch(() => null);
await page.waitForTimeout(500);
out.e5 = await page.evaluate(() => window.wizardChess.executeChessMove(1, 4, 3, 4));
out.sentE5 = Date.now();
await page.waitForTimeout(4000);
out.bar2 = await page.evaluate(() => document.querySelector('#online-bar')?.innerText);
await page.screenshot({ path: DIR + 'c2-host-game2.png' });
console.log(JSON.stringify(out));
await fs.writeFile(DIR + 'result-03.json', JSON.stringify(out, null, 1));
