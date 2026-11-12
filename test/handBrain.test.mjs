// Hand and brain (objective-layer OL-4): the brain's buttons, the AI adviser, the hand kept to one kind, the family quest.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { chooseMove } from '../src/rules/ai.js';
import { FAMILY_QUESTS, adviseKind, familyStep, movableKinds, refreshFamily, sanitizeFamily, weekOf } from '../src/cards/handBrain.js';

const START = new Chess().fen();

test('at the start only meerkats and kangaroos can move', () => {
  assert.deepEqual(movableKinds(START), ['p', 'n']);
});

test('the hand moves only the kind the brain named', () => {
  for (const kind of ['p', 'n']) {
    for (let i = 0; i < 5; i++) {
      const mv = chooseMove(START, { level: 'easy', only: kind, rand: () => i / 5 });
      assert.equal(new Chess(START).get(mv.from).type, kind);
    }
  }
  assert.equal(chooseMove(START, { only: 'q' }), null, 'a kind with no move gives no move');
});

test('the adviser names the kind of a winning move', () => {
  // White to move: Qh5xf7 is mate (scholar's mate), so the adviser says "tiger".
  const fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
  assert.equal(adviseKind(fen, { rand: () => 0.5 }), 'q');
  // A free queen for the kangaroo: Nxd5 (no other piece reaches d5).
  const fen2 = '4k3/8/8/3q4/8/4N3/8/4K3 w - - 0 1';
  assert.equal(adviseKind(fen2, { rand: () => 0.5 }), 'n');
});

test('weeks start on Monday', () => {
  const day = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  assert.equal(weekOf(day(2026, 11, 2)), weekOf(day(2026, 11, 8)), 'Monday to Sunday');
  assert.equal(weekOf(day(2026, 11, 9)) - weekOf(day(2026, 11, 8)), 1, 'next Monday is a new week');
});

test('the family quest fills over the week, pays once, then turns over', () => {
  const w = 2970;
  let s = refreshFamily(null, w);
  assert.ok(FAMILY_QUESTS.some((q) => q.id === s.id));
  assert.equal(refreshFamily(s, w), s, 'same week keeps it');
  s = { ...s, id: 'together_games_3' };
  let finished = false;
  for (let i = 0; i < 3; i++) ({ state: s, finished } = familyStep(s, { kind: 'end', result: 'loss' }));
  assert.equal(finished, true, 'a loss counts too — finishing together is the goal');
  assert.equal(familyStep(s, { kind: 'end', result: 'win' }).finished, false, 'it pays once');
  const next = refreshFamily(s, w + 1);
  assert.notEqual(next.id, s.id);
  assert.equal(next.have, 0);
  assert.equal(sanitizeFamily({ v: 1, week: w, id: 'nope', have: 1 }), null);
  assert.deepEqual(sanitizeFamily({ v: 1, week: w, id: 'together_caps_10', have: 99, done: true }), { v: 1, week: w, id: 'together_caps_10', have: 10, done: true });
});
