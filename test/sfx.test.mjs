import test from 'node:test';
import assert from 'node:assert/strict';
import { IMPACT_SOUNDS, SOUNDS, STEPS, VOICES, pickTake, readMuted, recipeLength, stepTimes, writeMuted } from '../src/audio/recipes.js';

const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

function memoryStore() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}

test('every role has a footstep and at least three voice takes', () => {
  for (const role of ROLES) {
    assert.ok(VOICES[role].length >= 3, role);
    assert.ok(STEPS[role].tones.length > 0, role);
  }
});

test('voices stay short enough to hear forty times a game', () => {
  for (const role of ROLES) for (const take of VOICES[role]) assert.ok(recipeLength(take) <= 0.55, role);
});

test('all recipes are valid for Web Audio exponential ramps', () => {
  const all = [...Object.values(VOICES).flat(), ...Object.values(STEPS).map((s) => s.tones), ...Object.values(IMPACT_SOUNDS), ...Object.values(SOUNDS)];
  for (const tones of all) {
    for (const t of tones) {
      assert.ok(t.dur > 0 && t.gain > 0 && t.gain <= 1);
      if (t.wave !== 'noise') assert.ok(t.f.every((f) => f > 0));
      if (t.filter) assert.ok(t.filter.f.every((f) => f > 0));
    }
  }
});

test('a take never repeats twice in a row', () => {
  for (let last = 0; last < 3; last++) {
    for (const r of [0, 0.34, 0.5, 0.67, 0.99]) {
      const take = pickTake(3, last, () => r);
      assert.notEqual(take, last);
      assert.ok(take >= 0 && take < 3);
    }
  }
  assert.equal(pickTake(3, -1, () => 0.99), 2);
});

test('footsteps fit inside the move, and leaps make one sound', () => {
  assert.deepEqual(stepTimes('knight', 1.2), [0]);
  const steps = stepTimes('pawn', 0.64);
  assert.ok(steps.length >= 4 && steps.at(-1) < 0.64);
  assert.ok(stepTimes('pawn', 30).length <= 10);
});

test('the mute choice survives a reload and bad saved data does not silence the game', () => {
  const store = memoryStore();
  assert.equal(readMuted(store), false);
  writeMuted(store, true);
  assert.equal(readMuted(store), true);
  store.setItem('wildcrown.sound.v1', '{broken');
  assert.equal(readMuted(store), false);
});
