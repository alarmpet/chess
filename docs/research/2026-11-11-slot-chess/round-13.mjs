const task=await taskSpace(77);const page=task.page('p1');const fs=await import('node:fs/promises');
await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='그냥 보기').click());
await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='4배').click());
await page.evaluate(()=>[...document.querySelectorAll('main button')].find(b=>b.innerText.startsWith('역전 기회 ·')).click());
await page.waitForFunction(()=>!document.querySelector('main')?.innerText.includes('아직 끝난 게임이 없습니다'),undefined,{timeout:25000});
console.log(await page.evaluate(()=>document.querySelector('main').innerText.split('이걸 AI로')[0]));
await fs.writeFile('D:/chess/docs/research/2026-11-11-slot-chess/win-chance-test.txt',await page.evaluate(()=>document.querySelector('main').innerText.split('이걸 AI로')[0]));
await page.click('button[aria-label="닫기"]');
console.log(await page.screenshot({path:'D:/chess/docs/research/2026-11-11-slot-chess/win-chance-test.png'}));
for(const name of ['fire-spread','turn-order','wayfinding']){
 await page.goto('https://game.bobthief.com/'+name);
 const data=await page.evaluate(()=>({title:document.title,text:document.querySelector('main')?.innerText||''}));
 await fs.writeFile('D:/chess/docs/research/2026-11-11-slot-chess/'+name+'.json',JSON.stringify(data,null,2));
 console.log({name,text:data.text.slice(0,3900)});
}
