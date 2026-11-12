const task=await taskSpace(77);const page=task.page('p1');
await page.mouse.click(1019,790,{label:'select a new bench'});
await page.mouse.click(1350,660,{label:'place bench near square'});
await page.mouse.click(1490,210,{label:'inspect village simulation settings'});
console.log(await page.evaluate(()=>document.querySelector('main').innerText.split('이걸 AI로')[0]));
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/npc-bench-placed.png'}));
