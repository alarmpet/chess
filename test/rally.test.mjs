// Comeback goals (objective-layer OL-6 ③): only when well behind, only for the player, done to be paid, at most three.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { RALLY_MAX, materialGap, newRally, rallyStep } from '../src/cards/rally.js';

// Black has just moved; `after` is the position the player now faces.
const theirMove = (after) => ({ color: 'b', piece: 'p', from: 'h7', to: 'h6', san: 'h6', after });

test('material gap counts from the given side', () => {
  assert.equal(materialGap(new Chess().fen(), 'w'), 0);
  const qDown = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3';
  assert.equal(materialGap(qDown, 'w'), -9);
  assert.equal(materialGap(qDown, 'b'), 9);
});

test('a goal shows only when the player is well behind, on their turn', () => {
  const even = rallyStep(newRally(), theirMove(new Chess().fen()), 'w');
  assert.equal(even.offered, null);
  const qDown = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3';
  const once = rallyStep(newRally(), theirMove(qDown), 'w');
  assert.equal(once.offered, null, 'one turn behind may be the middle of an exchange');
  assert.equal(rallyStep(once.state, theirMove(new Chess().fen()), 'w').state.behind, 0, 'taken back: the count starts over');
  const r = rallyStep(once.state, theirMove(qDown), 'w');
  assert.equal(r.offered.id, 'retake');
  const ahead = rallyStep(newRally(), theirMove(qDown), 'b');
  assert.equal(ahead.offered, null, 'the side ahead gets nothing');
  // The player's own move never offers one.
  assert.equal(rallyStep(newRally(), { ...theirMove(qDown), color: 'w' }, 'w').offered, null);
});

test('the goal is paid when done, then the next one, at most three a game', () => {
  const qDown = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3';
  let s = rallyStep(rallyStep(newRally(), theirMove(qDown), 'w').state, theirMove(qDown), 'w').state;
  let r = rallyStep(s, { color: 'w', piece: 'n', san: 'Nf3', after: qDown }, 'w');
  assert.equal(r.done, null, 'a quiet move takes nothing');
  r = rallyStep(r.state, { color: 'w', piece: 'n', san: 'Nxe5', captured: 'p', after: qDown }, 'w');
  assert.equal(r.done.id, 'retake');
  const ids = ['retake'];
  s = r.state;
  for (let i = 0; i < 5; i++) {
    const o = rallyStep(s, theirMove(qDown), 'w');
    s = o.state;
    if (o.offered) {
      ids.push(o.offered.id);
      s = rallyStep(s, { color: 'w', piece: 'p', from: 'e5', to: 'e6', captured: 'p', san: 'exd6+', after: qDown }, 'w').state;
    }
  }
  assert.deepEqual(ids, ['retake', 'check', 'pawn_far']);
  assert.equal(s.offered, RALLY_MAX);
  assert.equal(s.done, 3);
});

test('the meerkat goal is skipped when no meerkat has the walk ahead', () => {
  // White: king and a pawn already on f7; black has a queen.
  const fen = '4k3/5P2/8/8/8/8/8/q3K3 w - - 0 1';
  const s = { active: null, offered: 2, done: 2, behind: 1 };
  const r = rallyStep(s, theirMove(fen), 'w');
  assert.equal(r.offered.id, 'retake', 'pawn_far was next in turn but no meerkat can still reach the sixth rank');
});
