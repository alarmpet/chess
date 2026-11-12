// DR-3 순환: 놓은 소품이 손님을 부르고, 선물은 모아 받을 때까지 기다리고, 꾸밈 점수가 매대를 연다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DECOR_POINTS, GUESTS, GUESTS_PER_GAME, PROPS, PROP_GUESTS, SCORE_LEVELS, SHELF_LEVEL_MAX,
  collectGifts, decorScore, guestsVisit, newVillage, nextScoreLevel, sanitizeVillage, scoreLevel, settleGame, shelfLevel, stockShelf
} from '../src/village/economy.js';

const withProps = (n, kind = 'bench') => {
  const v = newVillage();
  v.seed = 12345;
  const sqs = ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];
  for (let i = 0; i < n; i++) v.decor.push({ kind, sq: sqs[i] });
  return v;
};

test('every prop names guests that exist', () => {
  for (const k of Object.keys(PROPS)) {
    assert.ok(PROP_GUESTS[k], k);
    for (const g of PROP_GUESTS[k]) assert.ok(GUESTS[g], `${k} → ${g}`);
  }
});

test('no props, no guests; guests only come from placed props and at most two a game', () => {
  const empty = newVillage();
  empty.seed = 1;
  assert.deepEqual(guestsVisit(empty), []);
  let most = 0;
  let total = 0;
  for (let g = 0; g < 200; g++) {
    const v = withProps(6);
    v.games = g;
    const came = guestsVisit(v);
    most = Math.max(most, came.length);
    total += came.length;
    for (const c of came) {
      assert.ok(v.decor.some((d) => d.sq === c.sq), 'the guest stands on a prop');
      assert.ok(PROP_GUESTS.bench.includes(c.guest));
    }
  }
  assert.ok(most <= GUESTS_PER_GAME);
  assert.ok(total > 100, `about one or two a game with six props (${total} in 200)`);
});

test('the same game on the same island brings the same guests (seeded), and the book counts them', () => {
  const a = withProps(3); a.games = 7;
  const b = withProps(3); b.games = 7;
  assert.deepEqual(guestsVisit(a), guestsVisit(b));
  const v = withProps(4);
  let first = null;
  for (let g = 0; g < 40 && !first; g++) { v.games = g; first = guestsVisit(v).find((x) => x.fresh) || null; }
  assert.ok(first, 'a first visit is marked fresh');
  assert.ok(v.guestBook[first.guest] >= 1);
});

test('gifts wait, are never lost, and are collected all at once', () => {
  const v = withProps(5);
  let waiting = 0;
  for (let g = 0; g < 10; g++) { v.games = g; waiting += guestsVisit(v).reduce((n, c) => n + c.acorns, 0); }
  assert.equal(v.pending.reduce((n, p) => n + p.acorns, 0), waiting, 'everything still waits');
  const coins = v.coins;
  const got = collectGifts(v);
  assert.equal(got.acorns, waiting);
  assert.equal(v.coins, coins + waiting);
  assert.deepEqual(v.pending, []);
  assert.equal(collectGifts(v).acorns, 0);
});

test('settling a game brings guests too, and old saves get the new fields', () => {
  const v = withProps(6);
  const moves = [];
  const r = settleGame(v, { moves, color: 'w', result: 'win', gameId: 1, now: 1_800_000_000_000 });
  assert.ok(Array.isArray(r.guests));
  const old = sanitizeVillage({ ...newVillage(), pending: undefined, guestBook: undefined });
  assert.deepEqual(old.pending, []);
  assert.deepEqual(old.guestBook, {});
});

test('decor score opens shelf levels; the games-grown level still counts', () => {
  const v = newVillage();
  assert.equal(decorScore(v), 0);
  assert.equal(scoreLevel(0), 1);
  v.built.push({ kind: 'field', sq: 'c3', ready: true, level: 1 }, { kind: 'mill', sq: 'c4', ready: false });
  v.decor.push({ kind: 'fountain', sq: 'a1' }, { kind: 'bench', sq: 'b1' }, { kind: 'house', sq: 'g7' });
  assert.equal(decorScore(v), 15 + DECOR_POINTS[3] + DECOR_POINTS[1], 'ready building 10+5, fountain, bench; unfinished and old houses do not count');
  assert.equal(scoreLevel(SCORE_LEVELS[2]), 3);
  assert.equal(scoreLevel(99999), SHELF_LEVEL_MAX);
  const lv = scoreLevel(decorScore(v));
  assert.deepEqual(nextScoreLevel(v), { level: lv + 1, need: SCORE_LEVELS[lv] - decorScore(v) });
  v.shelf.lv = 4;
  assert.equal(shelfLevel(v), 4, 'the higher of the two');
  v.shelf.lv = 1;
  for (let i = 0; i < 6; i++) v.decor.push({ kind: 'statue', sq: `h${i + 1}` });
  assert.ok(shelfLevel(v) >= 4, 'decorating raises the shelf');
  v.seed = 99; v.games = 3;
  assert.ok(stockShelf(v));
});
