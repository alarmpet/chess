// 방장: 열린 창이 있으면 닫고, 손님의 「한 판 더」를 받아들인다(색이 바뀌어 방장이 흑).
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const task = await taskSpace('online 1v1 check');
const page = task.page('p1');
const out = {};
out.state0 = await page.evaluate(() => ({ bar: document.querySelector('#online-bar')?.innerText, panel: Boolean(document.querySelector('.online-panel')), ply: window.wizardChess.getHandBrainState().history.length }));
if (out.state0.panel) await page.evaluate(() => document.querySelector('.online-panel .panel-close')?.click());
await page.waitForTimeout(800);
await page.screenshot({ path: DIR + 'c1-host-asked.png' });
await page.click('#online-rematch', { label: 'Accept rematch' });
await page.waitForTimeout(3000);
out.after = await page.evaluate(() => ({ bar: document.querySelector('#online-bar')?.innerText, color: window.wizardChess.getHandBrainState().playerColor, ply: window.wizardChess.getHandBrainState().history.length }));
console.log(JSON.stringify(out));
await fs.writeFile(DIR + 'result-04.json', JSON.stringify(out, null, 1));
