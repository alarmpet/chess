import { test } from 'node:test';
import assert from 'node:assert/strict';
import { islandEdge, seaDepth } from '../src/fx/openSea.js';

test('the sea floor runs from dry beach down to the deep without ever rising', () => {
  assert.ok(seaDepth(-0.2) < 0, 'beach stands above the water');
  assert.ok(seaDepth(0.5) > 0.2 && seaDepth(1.5) < 1, 'the reef shelf stays shallow enough to see');
  assert.ok(seaDepth(8) > 3, 'open water is deep');
  for (let e = -0.5; e < 12; e += 0.1) assert.ok(seaDepth(e + 0.1) >= seaDepth(e));
});

test('the island outline keeps the whole board on land', () => {
  const half = 1.69;
  for (let a = 0; a < 6.28; a += 0.05) {
    const r = 1.43 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    assert.ok(islandEdge(Math.cos(a) * r, Math.sin(a) * r, half) < 0, `board corner or edge in the water at ${a}`);
  }
});
