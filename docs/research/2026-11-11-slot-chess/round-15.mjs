const task=await taskSpace(77);const page=task.page('p1');
console.log(await page.evaluate(()=>[...document.querySelectorAll('main button')].map(b=>b.innerText)));
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/npc-place-ready.png'}));
