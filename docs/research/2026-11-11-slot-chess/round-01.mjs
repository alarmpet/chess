const task = await taskSpace('slot-chess-research-20261111');
const page = task.page('p1');
await page.goto('https://game.bobthief.com/');
console.log({spaceId:task.spaceId});
console.log(await page.snapshot({scope:'full_page'}));
