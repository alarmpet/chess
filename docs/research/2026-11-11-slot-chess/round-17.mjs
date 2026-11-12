const task=await taskSpace(77);const page=task.page('p1');
await page.click('button[aria-label="닫기"]');
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/npc-bench-final.png'}));
await task.finish({keep:[]});
