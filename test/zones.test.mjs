import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES, zoneOf } from '../src/village/zones.js';

test('the four centre squares are the plaza, the rest of the board splits into four zones of 15 squares', () => {
  const counts = {};
  for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) {
    const z = zoneOf(`${f}${r}`);
    assert.ok(ZONES[z], `${f}${r} has a zone`);
    counts[z] = (counts[z] || 0) + 1;
  }
  assert.deepEqual(counts, { plaza: 4, farm: 15, village: 15, market: 15, workshop: 15 });
  assert.equal(zoneOf('a1'), 'farm');
  assert.equal(zoneOf('h1'), 'village');
  assert.equal(zoneOf('a8'), 'market');
  assert.equal(zoneOf('h8'), 'workshop');
  assert.equal(zoneOf('e4'), 'plaza');
});

test('anything that is not a square has no zone', () => {
  for (const bad of ['', 'i1', 'a0', 'a9', null, undefined]) assert.equal(zoneOf(bad), null);
});
