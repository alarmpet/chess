// 친구 무대 (계획서 §4.4 L-3): 친구별 전적·친구들 사이 순위·기기 안 이름·서명 요청.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCLE_MAX, FRIENDS_KEY, circleOf, circleRequestError, circleText, cleanName, defaultFriendName, friendName,
  headToHead, loadFriendNames, recordText, saveFriendName, standingLine
} from '../src/rank/circle.js';
import { fetchCircle } from '../src/rank/client.js';
import { loadIdentity, publicPart, verifySignature } from '../src/net/identity.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const ME = 'meeeeeeeeeeeeeee';
const A = 'aaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbb';
const C = 'cccccccccccccccc';
const row = (white, black, result, at, status = 'counted') => ({ white, black, result, at, status });

test('head-to-head counts wins, losses and draws from my side; void games drop out, capped games stay', () => {
  const rows = [
    row(ME, A, '1-0', 1), row(A, ME, '1-0', 2), row(A, ME, '0-1', 3), row(ME, A, '1/2-1/2', 4),
    row(ME, A, '1-0', 5, 'capped'), row(ME, A, '0-1', 6, 'void'),
    row(B, ME, '1-0', 7), row(A, B, '1-0', 8)            // 남의 판은 무시
  ];
  const h = headToHead(ME, rows);
  assert.deepEqual(h.get(A), { id: A, wins: 3, losses: 1, draws: 1, games: 5, last: 5 });
  assert.deepEqual(h.get(B), { id: B, wins: 0, losses: 1, draws: 0, games: 1, last: 7 });
  assert.equal(h.size, 2);
  assert.equal(recordText(h.get(A)), '3승 1패 1무');
  assert.equal(recordText(h.get(B), true), '0W 1L');
});

test('the circle lines me up with friends by ladder points; ties share a rank', () => {
  const rows = [row(ME, A, '1-0', 10), row(B, ME, '1-0', 20), row(ME, C, '0-1', 30)];
  const pts = { [ME]: { points: 250 }, [A]: { points: 410 }, [B]: { points: 250 } };
  const c = circleOf(ME, rows, pts);
  assert.deepEqual(c.map((p) => [p.id, p.rank, p.points]), [[A, 1, 410], [ME, 2, 250], [B, 2, 250], [C, 4, 0]]);
  assert.equal(c.find((p) => p.me).place.tier, 'cub');
  assert.equal(c[0].place.tier, 'adult');
  assert.equal(c[0].wins, 1);
  assert.equal(standingLine(c), '친구들과 4명 중 2등');
  assert.equal(standingLine(c, true), '#2 of 4 with your friends');
  assert.equal(standingLine(circleOf(ME, [], {})), null, 'no friends yet → no line');
});

test('the circle keeps only the 30 friends played most recently', () => {
  const rows = Array.from({ length: 40 }, (_, i) => row(ME, `f${String(i).padStart(15, '0')}`, '1-0', i));
  const c = circleOf(ME, rows, {});
  assert.equal(c.length, CIRCLE_MAX + 1);
  assert.ok(!c.some((p) => p.id === `f${String(5).padStart(15, '0')}`), 'an old friend fell off');
  assert.ok(c.some((p) => p.id === `f${String(39).padStart(15, '0')}`));
});

test('friend names live only on this device; the default is an animal fixed by the id', () => {
  const s = mem();
  assert.equal(defaultFriendName(A), defaultFriendName(A), 'same id, same name');
  assert.match(defaultFriendName(A), / 친구 AA$/);
  assert.match(defaultFriendName(A, true), / friend AA$/);
  assert.deepEqual(loadFriendNames(s), {});
  saveFriendName(s, A, '  우리   아빠\n ');
  assert.equal(friendName(loadFriendNames(s), A), '우리 아빠');
  assert.equal(friendName(loadFriendNames(s), B), defaultFriendName(B));
  assert.equal(cleanName('가'.repeat(30)).length, 12);
  assert.equal(cleanName('   '), null);
  saveFriendName(s, A, '');
  assert.deepEqual(loadFriendNames(s), {}, 'empty name goes back to the default');
  s.setItem(FRIENDS_KEY, '{broken');
  assert.deepEqual(loadFriendNames(s), {});
});

test('the circle request is signed by me; the server checks shape and time', async () => {
  const me = await loadIdentity(mem());
  const now = 1_800_000_000_000;
  let sent = null;
  const fake = async (url, init) => { sent = { url, body: JSON.parse(init.body) }; return { ok: true, json: async () => ({ circle: [{ id: me.id, me: true, rank: 1, points: 0 }] }) }; };
  const c = await fetchCircle('', me, fake, now);
  assert.equal(sent.url, '/api/rank/circle');
  assert.equal(c.length, 1);
  assert.equal(circleRequestError(sent.body, now), null);
  assert.ok(await verifySignature(publicPart(sent.body.pub), circleText(me.id, now), sent.body.sig));
  assert.equal(await verifySignature(publicPart(sent.body.pub), circleText(A, now), sent.body.sig), false, 'the signature does not fit another id');
  assert.equal(circleRequestError({ ...sent.body, at: now - 11 * 60e3 }, now), 'time');
  assert.equal(circleRequestError({ ...sent.body, id: 'x' }, now), 'id');
  assert.equal(await fetchCircle(null, me, fake, now), null, 'no server in this build');
});
