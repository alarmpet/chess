// The lightning board (DY-3): an acorn for a move within 10 s, at most 10 a game, nothing taken away when time runs out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLITZ_CAP, blitzStep, newBlitz, sandAt } from '../src/cards/blitz.js';

test('a move within ten seconds earns one acorn, a slower one earns nothing and loses nothing', () => {
  let s = newBlitz();
  let r = blitzStep(s, 4200);
  assert.equal(r.earned, 1);
  r = blitzStep(r.state, 10000);
  assert.equal(r.earned, 1, 'ten seconds still counts');
  r = blitzStep(r.state, 10001);
  assert.equal(r.earned, 0);
  r = blitzStep(r.state, 95000);
  assert.equal(r.earned, 0, 'long past the sand: no penalty either');
  assert.deepEqual(r.state, { acorns: 2, fast: 2, moves: 4 });
  assert.equal(blitzStep(newBlitz(), NaN).earned, 0);
});

test('at most ten acorns a game', () => {
  let s = newBlitz();
  for (let i = 0; i < 25; i++) s = blitzStep(s, 1000).state;
  assert.equal(s.acorns, BLITZ_CAP);
  assert.equal(s.fast, 25, 'fast moves are still counted for the record');
});

test('the hourglass empties over thirty seconds and stops paying at ten', () => {
  assert.deepEqual(sandAt(0), { left: 1, pays: true, done: false });
  assert.equal(sandAt(15000).left, 0.5);
  assert.equal(sandAt(12000).pays, false);
  assert.equal(sandAt(31000).done, true);
  assert.equal(sandAt(31000).left, 0);
});
