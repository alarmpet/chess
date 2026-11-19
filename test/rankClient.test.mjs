// 랭크 화면 쪽(LA-R R-2·R-3): 서버 주소 고르기, 다시 보내기, 내 변화 읽기, 레이팅 읽기, 판 뒤 한 줄.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changeLine, fetchPlayer, myChange, rankApiBase, sendRankReport } from '../src/rank/client.js';
import { badgeLabel } from '../src/rank/glicko2.js';
import { loadIdentity } from '../src/net/identity.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const res = (body, ok = true) => ({ ok, json: async () => body });

test('server address: explicit env wins, built app uses its own origin, dev server sends nothing', () => {
  assert.equal(rankApiBase({ VITE_WC_RANK_URL: 'http://127.0.0.1:8787/' }), 'http://127.0.0.1:8787');
  assert.equal(rankApiBase({ PROD: true }), '');
  assert.equal(rankApiBase({ DEV: true }), null);
});

test('a waiting answer is sent again until counted, and the change is read from my side', async () => {
  const me = await loadIdentity(mem());
  const peer = await loadIdentity(mem());
  const answers = [{ status: 'waiting' }, { status: 'waiting' }, { status: 'counted', white: { id: me.id, before: 1500, after: 1662 }, black: { id: peer.id, before: 1500, after: 1338 } }];
  let calls = 0;
  const out = await sendRankReport({
    base: '', identity: me, room: 'ABCDEF', game: 1, myColor: 'w', peerKey: peer.id, moves: ['e2e4'], ended: { result: 'win', reason: 'resign' },
    fetchFn: async () => res(answers[calls++]), sleep: async () => {}
  });
  assert.equal(calls, 3);
  assert.deepEqual(myChange(out, me.id), { before: 1500, after: 1662 });
  assert.equal(myChange(out, 'someone-else-id'), null);
  assert.deepEqual(await sendRankReport({ base: null, identity: me }), { status: 'off' });
});

test('reading a player survives a missing server, and the line names a new badge', async () => {
  assert.equal(await fetchPlayer(null, 'x'), null);
  assert.equal(await fetchPlayer('', 'abc', async () => { throw new Error('offline'); }), null);
  assert.equal((await fetchPlayer('', 'abc', async () => res({ rating: 1600, badge: 'adult' }))).rating, 1600);
  const label = (b) => badgeLabel(b);
  assert.equal(changeLine({ before: 1500, after: 1662 }, 'cub', 'cub', label), '🏆 1500 → 1662 (+162)');
  assert.equal(changeLine({ before: 1690, after: 1712 }, 'adult', 'alpha', label), '🏆 1690 → 1712 (+22) · ⭐ 우두머리!');
  assert.equal(badgeLabel('nope', true).name, 'Cub');
});
