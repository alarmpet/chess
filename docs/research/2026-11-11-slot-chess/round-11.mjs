const task=await taskSpace(77);const page=task.page('p1');const fs=await import('node:fs/promises');
console.log(await page.evaluate(()=>({text:document.querySelector('main').innerText.split('이걸 AI로')[0],buttons:[...document.querySelectorAll('main button')].map(b=>({text:b.innerText,role:b.getAttribute('role')}))})));
await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='8배').click());
await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='정오').click());
await page.click('button[aria-label="닫기"]');
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/npc-noon.png'}));
await page.goto('https://game.bobthief.com/game-juice/play');
console.log(await page.evaluate(()=>({text:document.querySelector('main').innerText.split('이걸 AI로')[0],buttons:[...document.querySelectorAll('main button')].map(b=>({text:b.innerText,role:b.getAttribute('role')}))})));
