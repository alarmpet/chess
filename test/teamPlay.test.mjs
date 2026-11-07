// 둘이 한 왕국(CO-1): 역할 교대·종류 잠금·필터. 엔진의 클릭과 executeChessMove 가 같은 kindAllows 를 쓴다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HANDOVER_S, brainSeat, kindAllows, lockKind, ownMoveIndex } from '../src/cards/teamPlay.js';

test('own move index comes from the full-move number, for both colors', () => {
  assert.equal(ownMoveIndex('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'), 0);
  assert.equal(ownMoveIndex('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1'), 0);
  assert.equal(ownMoveIndex('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'), 2);
  assert.equal(ownMoveIndex('garbage'), 0);
});

test('roles swap every own move by default, or every game', () => {
  assert.deepEqual([0, 1, 2, 3].map((i) => brainSeat(i)), [0, 1, 0, 1]);
  assert.deepEqual([0, 1, 2, 3].map((i) => brainSeat(i, 'game', 4)), [0, 0, 0, 0]);
  assert.deepEqual([0, 1, 2].map((g) => brainSeat(7, 'game', g)), [0, 1, 0]);
});

test('the brain cannot change the kind once named; a new turn or a handover clears it', () => {
  assert.equal(lockKind('', 'knight'), 'knight');
  assert.equal(lockKind('knight', 'pawn'), 'knight', 'a different kind is refused');
  assert.equal(lockKind('knight', 'knight'), 'knight');
  assert.equal(lockKind('knight', ''), '', 'new turn');
  assert.equal(lockKind('knight', null), null, 'handover or off');
  assert.equal(lockKind(null, 'pawn'), 'pawn');
});

test('the filter lets only the named kind through; nothing before the brain names one', () => {
  assert.equal(kindAllows(null, 'queen'), true);
  assert.equal(kindAllows('', 'pawn'), false);
  assert.equal(kindAllows('pawn', 'pawn'), true);
  assert.equal(kindAllows('pawn', 'knight'), false);
  assert.equal(HANDOVER_S, 20);
});

test('the play log keeps the roles and counts handovers, oops and high fives per game', async () => {
  const { startEntry, storyOf } = await import('../src/cards/sessionLog.js');
  const s = startEntry({ gameId: 7, color: 'white' }, { at: '2026-11-07T10:00:00Z', handBrain: 'family', roles: 'move' });
  assert.equal(s.roles, 'move');
  assert.equal(startEntry({ gameId: 8 }, { handBrain: 'off', roles: 'move' }).roles, undefined, 'no roles outside a team game');
  const log = [s,
    { type: 'coop', kind: 'handover', gameId: 7, ply: 4 },
    { type: 'coop', kind: 'highfive', gameId: 7, ply: 5 },
    { type: 'coop', kind: 'highfive', gameId: 7, ply: 9 },
    { type: 'coop', kind: 'nonsense', gameId: 7, ply: 9 },
    { type: 'game', at: '2026-11-07T10:10:00Z', gameId: 7, result: 'win', plies: 30 }];
  const g = storyOf(log).games[0];
  assert.equal(g.roles, 'move');
  assert.deepEqual(g.coop, { handover: 1, oops: 0, highfive: 2 });
});
