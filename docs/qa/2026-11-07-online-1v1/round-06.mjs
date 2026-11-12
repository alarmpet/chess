// 방장: 친구가 들어오면 창이 닫혔는지 보고 e4. 손님이 e5 를 두고 새로고침한 뒤(__ 신호 없이 ply 로 기다림) Nf3.
// 그다음 손님 Nc6 을 기다렸다가 기권 → 손님이 「한 판 더」를 청하면 받아들인다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const task = await taskSpace('online 1v1 check');
const page = task.page('p1');
const ply = (n, t = 120000) => page.waitForFunction((n) => window.wizardChess.getHandBrainState().history.length >= n, n, { timeout: t });
const out = {};
await page.waitForFunction(() => /친구 연결됨/.test(document.querySelector('#online-bar')?.innerText || ''), undefined, { timeout: 60000 });
await page.waitForTimeout(800);
out.panelClosed = await page.evaluate(() => !document.querySelector('.online-panel'));
await page.screenshot({ path: DIR + 'd1-host-joined.png' });
out.e4 = await page.evaluate(() => window.wizardChess.executeChessMove(6, 4, 4, 4));
await ply(2);
// 손님이 새로고침하는 동안 기다렸다가 Nf3 (손님이 다시 들어온 뒤 받는지)
await page.waitForTimeout(15000);
out.peerAfterReload = await page.evaluate(() => document.querySelector('#online-peer')?.innerText);
out.nf3 = await page.evaluate(() => window.wizardChess.executeChessMove(7, 6, 5, 5));
await ply(4);
await page.waitForTimeout(2500);
await page.click('#online-resign', { label: 'Resign' });
await page.click('#online-resign-yes', { label: 'Confirm resign' });
await page.waitForTimeout(1500);
out.endHost = await page.evaluate(() => document.querySelector('#online-end')?.innerText);
await page.screenshot({ path: DIR + 'd2-host-resigned.png' });
await page.waitForFunction(() => /한 판 더! 두기/.test(document.querySelector('#online-rematch')?.innerText || ''), undefined, { timeout: 90000 });
await page.screenshot({ path: DIR + 'd3-host-rematch-ask.png' });
await page.click('#online-rematch', { label: 'Accept rematch' });
await page.waitForTimeout(3000);
out.game2 = await page.evaluate(() => ({ bar: document.querySelector('#online-bar')?.innerText, color: window.wizardChess.getHandBrainState().playerColor, ply: window.wizardChess.getHandBrainState().history.length }));
await page.screenshot({ path: DIR + 'd4-host-game2.png' });
console.log(JSON.stringify(out));
await fs.writeFile(DIR + 'result-06.json', JSON.stringify(out, null, 1));
