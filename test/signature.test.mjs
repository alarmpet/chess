// Signature captures (DY-1): every animal has its own word, effect and hit, all short, and the capture's timing is unchanged.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIGNATURE_SECONDS, SIGNATURE_WORD } from '../src/fx/signatureFx.js';
import { SIGNATURE_SOUNDS, recipeLength } from '../src/audio/recipes.js';
import { IMPACT_TIERS, impactExtraSeconds } from '../src/fx/impactTier.js';

const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

test('six animals, six different words, effects and hits', () => {
  assert.equal(new Set(ROLES.map((r) => SIGNATURE_WORD[r])).size, 6);
  for (const r of ROLES) {
    assert.ok(SIGNATURE_SECONDS[r] > 0 && SIGNATURE_SECONDS[r] <= 0.9, `${r} effect ends within 0.9 s`);
    assert.ok(recipeLength(SIGNATURE_SOUNDS[r]) <= 0.35, `${r} hit is short`);
  }
  assert.equal(new Set(ROLES.map((r) => JSON.stringify(SIGNATURE_SOUNDS[r]))).size, 6);
});

test('the capture still takes the same time (the plan keeps 0.3 s per capture at most)', () => {
  // The signature runs alongside; it reads the tiers and never changes them.
  assert.deepEqual(Object.keys(IMPACT_TIERS), ['small', 'medium', 'big']);
  assert.equal(+impactExtraSeconds('small').toFixed(3), 0.05);
  assert.equal(+impactExtraSeconds('medium').toFixed(3), 0.07);
  assert.ok(impactExtraSeconds('big') <= 0.3);
});
