const task=await taskSpace(77); const page=task.page('p1');
console.log((await page.snapshot({scope:'full_page'})).split('\n').filter(l=> !/anchor|url=|text "쇼츠|text "게임 AI/.test(l)).slice(155,310).join('\n'));
