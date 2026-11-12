// 새 레딧 검색: 검색어별 글 제목·주소를 모은다(로그인 없이, 읽기만).
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/coop-mp-20261107/';
const task = await taskSpace('coop multiplayer research');
const page = task.page('p1');
const queries = [
  'chess with girlfriend', 'chess with my wife', 'couples chess game', 'hand and brain chess fun', 'bughouse chess fun',
  '2v2 chess', 'team chess friends', 'cooperative chess vs computer', 'consultation chess', 'co-op games for couples',
  'quarterbacking co-op games', 'co-op game partner different skill', 'chess party variant friends', 'tandem chess alternate moves',
  'four player chess teams', 'it takes two why fun', 'the crew card game communication', 'TFT double up fun',
  'co-op vs AI mode', 'chess with kids together team'
];
const out = {};
for (const q of queries) {
  await page.goto('https://www.reddit.com/search/?q=' + encodeURIComponent(q) + '&type=posts', { timeout: 60000 });
  await page.waitForTimeout(3500);
  out[q] = await page.evaluate(() => {
    const seen = new Map();
    for (const a of document.querySelectorAll('a[href*="/comments/"]')) {
      const h = a.href.split('?')[0];
      const t = a.innerText.trim();
      if (!t || seen.has(h)) continue;
      seen.set(h, t.slice(0, 140));
    }
    return [...seen].slice(0, 12).map(([h, t]) => ({ h, t }));
  });
  console.log('##', q, out[q].length);
  for (const p of out[q]) console.log('  ', p.t.slice(0, 100), '|', p.h.replace('https://www.reddit.com', ''));
}
await fs.writeFile(DIR + 'reddit-search.json', JSON.stringify(out, null, 1));
