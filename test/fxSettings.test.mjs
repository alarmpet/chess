import test from 'node:test';
import assert from 'node:assert/strict';
import { readFxSettings, writeFxSettings } from '../src/fx/settings.js';
import { SOUNDS } from '../src/audio/recipes.js';

function memoryStore() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}

test('shake is on and quick games off until the player says otherwise', () => {
  assert.deepEqual(readFxSettings(memoryStore()), { shake: true, quick: false, cards: true });
});

test('choices survive a reload, and older saves with only shake still load', () => {
  const store = memoryStore();
  writeFxSettings(store, { shake: false, quick: true, cards: false });
  assert.deepEqual(readFxSettings(store), { shake: false, quick: true, cards: false });
  store.setItem('wildcrown.fx.v1', '{"shake":false}');
  assert.deepEqual(readFxSettings(store), { shake: false, quick: false, cards: true });
  store.setItem('wildcrown.fx.v1', '{broken');
  assert.deepEqual(readFxSettings(store), { shake: true, quick: false, cards: true });
});

test('castling has its own sound', () => {
  assert.ok(SOUNDS.clap.length > 0);
});
