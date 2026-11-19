// 판 끝 하나씩 세기(DR-1b).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acornTally, runningTotal, tallyPitch } from '../src/cards/acornTally.js';
import { COINS } from '../src/village/economy.js';

test('the tally lists what this game already paid, base first, empty lines left out', () => {
  const t = acornTally({ result: 'win', mission: 8, bounty: 6, stamps: 0, quests: 15, rally: 0 });
  assert.deepEqual(t.items.map((x) => [x.key, x.n]), [['win', COINS.win], ['mission', 8], ['bounty', 6], ['quests', 15]]);
  assert.equal(t.total, COINS.win + 29);
  assert.equal(acornTally({ result: 'loss' }).items[0].ko, '끝까지 둠', 'a loss still counts the game played');
  assert.deepEqual(acornTally({ result: 'aborted' }).items, []);
  assert.equal(acornTally({ result: 'draw', bounty: -3, stamps: 2.7 }).total, COINS.draw + 2, 'no negatives, whole acorns');
});

test('running total and the pitch ladder', () => {
  const { items } = acornTally({ result: 'win', mission: 8, bounty: 6 });
  assert.deepEqual([0, 1, 2, 3, 9].map((k) => runningTotal(items, k)), [0, 30, 38, 44, 44]);
  assert.equal(tallyPitch(0), 1);
  assert.equal(tallyPitch(1), 2 ** (1 / 12));
  assert.equal(tallyPitch(20), 2 ** (7 / 12), 'stops within the octave');
});
