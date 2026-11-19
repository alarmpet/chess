// Cards caught in a game join the album only when the game ends, exactly once, and never change the odds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCollection, awardCard, consolationCard, newPouch, withPouch, commitPouch, sanitizePouch, sanitizeCollection, cardId, RARE } from '../src/cards/economy.js';
import { newVillage, settleGame } from '../src/village/economy.js';
import { Chess } from 'chess.js';

const rolls = [0.95, 0.2, 0.5, 0.01, 0.7, 0.33, 0.88, 0.12, 0.4, 0.66, 0.05, 0.99, 0.25];
const types = ['pawn', 'knight', 'pawn', 'bishop', 'rook', 'pawn', 'queen', 'pawn', 'pawn', 'knight', 'pawn', 'pawn', 'pawn'];

test('a pouch confirmed at the end gives the same album and guarantees as paying at once', () => {
  const direct = newCollection();
  for (let i = 0; i < rolls.length; i++) awardCard(direct, types[i], rolls[i]);
  consolationCard(direct, 0.4);

  const col = newCollection();
  const pouch = newPouch(5);
  for (let i = 0; i < rolls.length; i++) pouch.cards.push(awardCard(withPouch(col, pouch), types[i], rolls[i]));
  pouch.cards.push(consolationCard(withPouch(col, pouch), 0.4));
  assert.deepEqual(col.cards, {});                       // nothing lands during the game
  assert.ok(commitPouch(col, pouch));
  assert.deepEqual(col.cards, direct.cards);
  assert.equal(col.sinceRare, direct.sinceRare);
  assert.equal(col.sinceHero, direct.sinceHero);
  assert.equal(col.firstDone, direct.firstDone);
});

test('the first card is still rare after a comfort card, and a game settles only once', () => {
  const col = newCollection();
  const comfort = newPouch(1);
  comfort.cards.push(consolationCard(withPouch(col, comfort), 0.1));
  commitPouch(col, comfort);
  assert.equal(col.firstDone, false);
  const next = newPouch(2);
  next.cards.push(awardCard(withPouch(col, next), 'pawn', 0.01));
  assert.ok(next.cards[0].rarity >= RARE);
  assert.ok(commitPouch(col, next));
  const before = JSON.stringify(col);
  assert.equal(commitPouch(col, next), false);
  assert.equal(JSON.stringify(col), before);
});

test('a discarded pouch leaves the collection and its guarantees untouched', () => {
  const col = newCollection();
  const pouch = newPouch(9);
  for (let i = 0; i < 9; i++) pouch.cards.push(awardCard(withPouch(col, pouch), 'pawn', 0.5));
  assert.equal(col.sinceRare, 0);
  assert.deepEqual(col.cards, {});
});

test('stored pouches and settled lists are checked on load', () => {
  assert.equal(sanitizePouch(null), null);
  const p = sanitizePouch({ v: 1, gameId: 3, cards: [{ id: cardId('panda', 1), animal: 'panda', rarity: 1 }, { id: 'lion_9', animal: 'lion', rarity: 9 }, { id: 'x', animal: 'panda', rarity: 0 }] });
  assert.equal(p.cards.length, 1);
  assert.deepEqual(sanitizeCollection({ v: 1, cards: {}, settled: [1, 'a', 2] }).settled, [1, 2]);
});

test('the island pays a game once even if its end is reported twice', () => {
  const chess = new Chess();
  for (const san of ['f3', 'e5', 'g4', 'Qh4#']) chess.move(san);
  const v = newVillage();
  const detail = { moves: chess.history({ verbose: true }), color: 'w', result: 'loss', gameId: 42 };
  assert.ok(settleGame(v, detail));
  const coins = v.coins;
  assert.equal(settleGame(v, detail), null);
  assert.equal(v.coins, coins);
  assert.equal(v.games, 1);
});

// 11-18: 왕관 계약전 판도 주머니를 도감에 넣는다. 판 수는 보통 체스만 올린다.
test('closePouch: 계약전 판(countGame=false)은 카드만 넣고 판 수는 그대로, 같은 판은 두 번 넣지 않는다', async () => {
  const { closePouch } = await import('../src/cards/economy.js');
  const col = newCollection();
  const pouch = newPouch(77);
  pouch.cards.push(awardCard(withPouch(col, pouch), 'pawn', 0.5));
  pouch.cards.push(awardCard(withPouch(col, pouch), 'knight', 0.5));
  const count = () => Object.values(col.cards).reduce((s, n) => s + n, 0);
  const closed = closePouch(col, pouch, 77, false);
  assert.ok(closed);
  const held = count();
  assert.ok(held >= 2, '주머니의 카드가 도감에 들어간다');
  assert.equal(col.games, 0);
  assert.ok(col.settled.includes(77));
  assert.equal(closePouch(col, pouch, 77, false), null);
  assert.equal(count(), held);
  // 보통 판은 판 수가 오른다. 다른 판의 주머니는 넣지 않지만 그 판은 정산한 것으로 적는다.
  const other = newPouch(5);
  other.cards.push(consolationCard(withPouch(col, other), 0.3));
  assert.ok(closePouch(col, other, 78, true));
  assert.equal(col.games, 1);
  assert.equal(count(), held);
  assert.ok(col.settled.includes(78));
});
