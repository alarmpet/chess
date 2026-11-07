// 레딧이 막혀 공개 기록 저장소(arctic-shift) API 로 글·댓글을 받는다. 읽기만.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/coop-mp-20261107/';
const ids = ['mv92wx','1awlyqr','53al17','9lppar','1kjeaai','kcho48',
  '1bfmuko','1kout0w','n1iw42','1r7944a','1xmusba','1of4y3c','18qzdhz','g2hj7n','1fsrlg9','vvb5yd','qzgix8','t8kwyo','1karfq8'];
const out = {};
for (const id of ids) {
  try {
    const p = await (await fetch(`https://arctic-shift.photon-reddit.com/api/posts/ids?ids=${id}`)).json();
    const c = await (await fetch(`https://arctic-shift.photon-reddit.com/api/comments/search?link_id=${id}&limit=100`)).json();
    const post = p.data?.[0] || {};
    const comments = (c.data || []).filter((x) => x.parent_id?.startsWith('t3_')).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 15).map((x) => ({ score: x.score, body: (x.body || '').slice(0, 800) }));
    const all = (c.data || []).map((x) => x.body || '');
    out[id] = { title: post.title, sub: post.subreddit, date: post.created_utc ? new Date(post.created_utc * 1000).toISOString().slice(0, 10) : null, score: post.score, body: (post.selftext || '').slice(0, 1500), comments, allText: all.join('\n---\n').slice(0, 60000) };
    console.log('ok', id, post.title?.slice(0, 70), (c.data || []).length);
  } catch (e) { out[id] = { error: String(e).slice(0, 200) }; console.log('err', id, String(e).slice(0, 120)); }
}
await fs.writeFile(DIR + 'arctic.json', JSON.stringify(out, null, 1));
