// 방장(백) 쪽: f3 · g4 를 두고, 손님(흑)의 e5 · Qh4# 가 오기를 기다린다. 손님 쪽은 앱 안 브라우저에서 둔다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const task = await taskSpace('online 1v1 check');
const page = task.page('p1');
const ply = (n) => page.waitForFunction((n) => window.wizardChess.getHandBrainState().history.length >= n, n, { timeout: 180000 });
const out = {};
out.bar0 = await page.evaluate(() => document.querySelector('#online-bar')?.innerText);
await page.screenshot({ path: DIR + 'b1-host-connected.png' });
// 차례가 아닌 수는 안 된다: 흑 말을 움직여 보기
out.wrongColor = await page.evaluate(() => window.wizardChess.executeChessMove(1, 4, 3, 4));
out.sent1 = Date.now();
out.m1 = await page.evaluate(() => window.wizardChess.executeChessMove(6, 5, 5, 5));   // f2-f3
await ply(2);
out.got2 = Date.now();
await page.waitForTimeout(1500);
out.sent3 = Date.now();
out.m3 = await page.evaluate(() => window.wizardChess.executeChessMove(6, 6, 4, 6));   // g2-g4
await ply(4);
out.got4 = Date.now();
await page.waitForFunction(() => Boolean(document.querySelector('#online-end')), undefined, { timeout: 20000 });
await page.waitForTimeout(6000);
out.bar1 = await page.evaluate(() => document.querySelector('#online-bar')?.innerText);
await page.screenshot({ path: DIR + 'b2-host-mated.png' });
console.log(JSON.stringify(out));
await fs.writeFile(DIR + 'result-02.json', JSON.stringify(out, null, 1));
