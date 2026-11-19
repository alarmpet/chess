// grok 이 낸 레딧 글을 기록 저장소에서 받는다(인용 대조용). 읽기만.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/coop-mp-20261107/';
const prev = JSON.parse(await fs.readFile(DIR + 'arctic.json', 'utf8'));
const ids = ['ucdev2','ik4ent','mrp6gf','kflifx','1am783g','11ewfz0','1n1t8cg','1onla12','1me9rnb','1pokzye','1gzq4o6','1rp9nqb','1lyj3c8','1m4kgm9','1lukiem','1lq2u9a','1ki5bt6','1ho8rg5','es7st6','fw1mtv','10caxu6','1kny5id','1383jf7','1q8ies1','1hqbt86'];
for (const id of ids) {
  try {
    const p = await (await fetch(`https://arctic-shift.photon-reddit.com/api/posts/ids?ids=${id}`)).json();
    const c = await (await fetch(`https://arctic-shift.photon-reddit.com/api/comments/search?link_id=${id}&limit=100`)).json();
    const post = p.data?.[0] || {};
    prev[id] = { title: post.title, sub: post.subreddit, date: post.created_utc ? new Date(post.created_utc * 1000).toISOString().slice(0, 10) : null, score: post.score, body: (post.selftext || '').slice(0, 3000), comments: [], allText: (c.data || []).map((x) => x.body || '').join('\n---\n').slice(0, 80000) };
    console.log('ok', id, (post.title || '').slice(0, 60), (c.data || []).length);
  } catch (e) { console.log('err', id, String(e).slice(0, 100)); }
}
await fs.writeFile(DIR + 'arctic.json', JSON.stringify(prev, null, 1));
