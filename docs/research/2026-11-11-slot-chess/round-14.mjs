const task=await taskSpace(77);const page=task.page('p1');
await page.goto('https://game.bobthief.com/smart-object/play');
await page.waitForFunction(()=>document.querySelector('main')?.innerText.includes('마을 기분'),undefined,{timeout:20000});
await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.innerText.startsWith('벤치\n')).click());
await page.click('button[aria-label="닫기"]');
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/npc-place-ready.png'}));
