// Capture feel: size follows the moment, and the pace stays inside the plan's limit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IMPACT_TIERS, impactTier, impactExtraSeconds, PIECE_SPARK } from '../src/fx/impactTier.js';

test('small captures stay small, the big moments are big', () => {
  assert.equal(impactTier('pawn', 'exd5'), 'small');
  assert.equal(impactTier('pawn', 'exd5+'), 'medium');
  assert.equal(impactTier('knight', 'Bxc6'), 'medium');
  assert.equal(impactTier('rook', 'Qxa8'), 'medium');
  assert.equal(impactTier('queen', 'Nxd5'), 'big');
  assert.equal(impactTier('pawn', 'Qxf7#'), 'big');
});

test('no capture adds more than 0.3 seconds', () => {
  for (const id of Object.keys(IMPACT_TIERS)) assert.ok(impactExtraSeconds(id) <= 0.3 + 1e-9, id);
});

test('only the bigger moments shake, and every role has spark colours', () => {
  assert.equal(IMPACT_TIERS.small.shake, 0);
  for (const r of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) assert.ok(PIECE_SPARK[r].length >= 2);
});
