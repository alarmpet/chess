const task=await taskSpace(77); const page=task.page('p1');
await page.goto('https://game.bobthief.com/procedural-quest/play');
console.log(await page.snapshot({scope:'full_page'}));
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/quest-start.png'}));
