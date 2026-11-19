const task=await taskSpace(77); const page=task.page('p1');const fs=await import('node:fs/promises');
await page.click('@185'); await page.click('@175'); await page.click('@179'); await page.click('@176');
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/quest-fixed.png'}));
await fs.writeFile('D:/chess/docs/research/2026-11-11-slot-chess/quest-fixed.txt',await page.evaluate(()=>document.querySelector('main').innerText));
console.log((await page.snapshot({scope:'full_page'})).split('\n').slice(170,320).join('\n'));
