// Technique stamps (objective-layer OL-2): each stamp fires on its move and stays quiet on a near miss.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { STAMPS, stampById, stampsOf } from '../src/cards/stamps.js';

const last = (fen, ...sans) => {
  const chess = fen ? new Chess(fen) : new Chess();
  for (const san of sans) chess.move(san);
  return chess.history({ verbose: true }).at(-1);
};
const stamps = (fen, ...sans) => stampsOf(last(fen, ...sans));

test('every stamp has a name in both languages and a test', () => {
  assert.equal(STAMPS.length, 9);
  for (const s of STAMPS) assert.ok(s.ko && s.en && typeof s.hit === 'function' && stampById(s.id) === s);
});

test('en passant, underpromotion and castling with check', () => {
  assert.deepEqual(stamps(null, 'e4', 'Nf6', 'e5', 'd5', 'exd6'), ['en_passant']);
  assert.deepEqual(stamps(null, 'e4', 'd5', 'exd5'), [], 'a plain pawn capture');
  assert.deepEqual(stamps('8/P7/8/8/8/8/k7/4K3 w - - 0 1', 'a8=N'), ['underpromotion']);
  assert.deepEqual(stamps('8/P7/8/8/8/8/k7/4K3 w - - 0 1', 'a8=Q'), [], 'the tiger is the usual promotion');
  assert.deepEqual(stamps('5k2/8/8/8/8/8/8/4K2R w K - 0 1', 'O-O'), ['castle_check']);
  assert.deepEqual(stamps('6k1/8/8/8/8/8/8/4K2R w K - 0 1', 'O-O'), []);
});

test('double check and discovered check tell the moving piece apart', () => {
  // The kangaroo leaves the e-file: on d6 it checks too (double), on c5 only the rhino behind it checks (discovered).
  assert.deepEqual(stamps('4k3/8/8/8/4N3/8/8/K3R3 w - - 0 1', 'Nd6'), ['double_check']);
  assert.deepEqual(stamps('4k3/8/8/8/4N3/8/8/K3R3 w - - 0 1', 'Nc5'), ['discovered_check']);
});

test('a kangaroo fork needs two big pieces under attack', () => {
  assert.deepEqual(stamps('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', 'Nc7'), ['knight_fork']);
  assert.deepEqual(stamps('r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', 'Nd6'), [], 'only the king');
});

test('three mates by their shape', () => {
  assert.deepEqual(stamps('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', 'Ra8'), ['back_rank_mate']);
  assert.deepEqual(stamps('6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1', 'Nf7'), ['smothered_mate']);
  assert.deepEqual(stamps('7k/7p/6PK/8/2B5/8/8/8 w - - 0 1', 'g7'), ['pawn_mate']);
  assert.deepEqual(stamps('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', 'Ra7'), [], 'no mate');
});

test('the album keeps stamp counts and drops anything else', async () => {
  const { sanitizeCollection } = await import('../src/cards/economy.js');
  const col = sanitizeCollection({ v: 1, cards: {}, stamps: { knight_fork: 2, en_passant: 1, 'bad id!': 3, pawn_mate: -1, castle_check: 1.5 } });
  assert.deepEqual(col.stamps, { knight_fork: 2, en_passant: 1 });
  assert.deepEqual(sanitizeCollection({ v: 1, cards: {} }).stamps, {}, 'an old save has none');
});
