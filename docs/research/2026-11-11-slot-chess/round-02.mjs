const task = await taskSpace(77);
const page = task.page('p1');
const fs = await import('node:fs/promises');
for (const name of ['procedural-quest','win-chance','smart-object','game-juice','utility-ai']) {
  await page.goto('https://game.bobthief.com/'+name);
  const data=await page.evaluate(()=>({title:document.title,text:document.querySelector('main')?.innerText||document.body.innerText,links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.innerText,url:a.href})).filter(a=>/youtu|play|reference|source/.test(a.url))}));
  await fs.writeFile('D:/chess/docs/research/2026-11-11-slot-chess/'+name+'.json',JSON.stringify(data,null,2));
  console.log(JSON.stringify({name,...data}));
}
