// The game notes wait in line instead of replacing each other (2026-11-06).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noteQueue } from '../src/cards/noteQueue.js';

// A fake clock: timers run when `run(ms)` passes them.
function clock() {
  let now = 0;
  let timers = [];
  return {
    wait: (fn, ms) => timers.push({ at: now + ms, fn }),
    run(ms) {
      const end = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const t = timers[0];
        if (!t || t.at > end) break;
        timers.shift();
        now = t.at;
        t.fn();
      }
      now = end;
    }
  };
}

test('notes of one move all show, one after another', () => {
  const c = clock();
  const shown = [];
  const q = noteQueue({ show: (t) => shown.push(t), wait: c.wait });
  q.say('🎯 mission', 3000);
  q.say('💰 bounty', 2800);
  q.say('🔥 comeback', 3000);
  assert.deepEqual(shown, ['🎯 mission']);
  c.run(1800);
  assert.deepEqual(shown, ['🎯 mission', '💰 bounty'], 'the first gives way early when others wait');
  c.run(1800);
  assert.equal(shown.at(-1), '🔥 comeback');
  c.run(1800);
  assert.equal(shown.at(-1), '🔥 comeback', 'the last one has its full time');
  c.run(1200);
  assert.equal(shown.at(-1), '');
});

test('a lone note keeps its full time, the same text is not queued twice, and the line is short', () => {
  const c = clock();
  const shown = [];
  const q = noteQueue({ show: (t) => shown.push(t), wait: c.wait, max: 2 });
  q.say('a', 3000);
  c.run(2900);
  assert.deepEqual(shown, ['a']);
  c.run(100);
  assert.deepEqual(shown, ['a', '']);
  q.say('b'); q.say('b'); q.say('c'); q.say('d'); q.say('e');
  assert.equal(q.waiting(), 2, 'b shows, c gave way, d and e wait');
  c.run(20000);
  assert.deepEqual(shown.slice(2), ['b', 'd', 'e', '']);
});
