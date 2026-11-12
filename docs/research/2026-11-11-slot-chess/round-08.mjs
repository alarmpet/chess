const task=await taskSpace(77); const page=task.page('p1');
console.log((await page.snapshot({scope:'full_page'})).split('\n').slice(200,395).join('\n'));
