// Today's quests (objective-layer OL-3): three tiers, progress over games, a missed day kept, one swap a day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTS, TIERS, dayNumber, questById, questStep, refreshQuests, sanitizeQuests, swapQuest } from '../src/cards/quests.js';

const DAY = 20400;
const first = () => 0;   // always the first quest of each tier's pool

test('a fresh day has one quest from each tier', () => {
  const s = refreshQuests(null, DAY, first);
  assert.deepEqual(s.slots.map((x) => questById(x.id).tier), TIERS);
  assert.deepEqual(s.slots.map((x) => x.id), TIERS.map((t) => QUESTS[t][0].id));
  assert.ok(s.slots.every((x) => x.day === DAY && x.have === 0 && !x.done));
});

test('progress adds up over events and finishes a quest once', () => {
  let s = refreshQuests(null, DAY, first);   // finish_game, knight_caps_2, captures_10
  const cap = { kind: 'move', move: { piece: 'n', captured: 'p', san: 'Nxe5', flags: 'c' } };
  let r = questStep(s, cap);
  assert.equal(r.finished.length, 0);
  assert.equal(r.state.slots[1].have, 1);
  r = questStep(r.state, cap);
  assert.deepEqual(r.finished.map((x) => x.id), ['knight_caps_2']);
  r = questStep(r.state, cap);
  assert.equal(r.finished.length, 0, 'a finished quest does not pay again');
  assert.equal(r.state.slots[2].have, 3, 'every capture counts toward ten');
  r = questStep(r.state, { kind: 'stamp', id: 'smothered_mate' });
  assert.equal(r.state.slots[2].have, 3, 'a stamp is not a capture');
  r = questStep(r.state, { kind: 'end', result: 'loss' });
  assert.deepEqual(r.finished.map((x) => x.id), ['finish_game']);
});

test('an unfinished quest stays one more day, then gives way', () => {
  let s = refreshQuests(null, DAY, first);
  s = questStep(s, { kind: 'end', result: 'loss' }).state;   // the easy one is done
  s = questStep(s, { kind: 'move', move: { piece: 'n', captured: 'p', san: 'Nxe5', flags: 'c' } }).state;
  const next = refreshQuests(s, DAY + 1, () => 0.99);
  assert.notEqual(next.slots[0].id, 'finish_game', 'a finished quest is replaced');
  assert.equal(next.slots[1].id, 'knight_caps_2', 'the unfinished one is kept');
  assert.equal(next.slots[1].have, 1, 'with its progress');
  const later = refreshQuests(next, DAY + 2, first);
  assert.equal(later.slots[1].day, DAY + 2, 'two days on it is gone');
});

test('one swap a day, never of a finished quest', () => {
  const s = refreshQuests(null, DAY, first);
  const swapped = swapQuest(s, 1, DAY, 0.99);
  assert.ok(swapped);
  assert.notEqual(swapped.slots[1].id, s.slots[1].id);
  assert.equal(questById(swapped.slots[1].id).tier, 'medium');
  assert.equal(swapQuest(swapped, 2, DAY, 0.5), null, 'already swapped today');
  assert.ok(swapQuest(swapped, 2, DAY + 1, 0.5), 'tomorrow again');
  const done = questStep(s, { kind: 'end', result: 'win' }).state;
  assert.equal(swapQuest(done, 0, DAY, 0.5), null, 'a finished quest stays');
});

test('a broken save starts a fresh day and local days count from midnight', () => {
  assert.equal(sanitizeQuests({ v: 1, slots: [{ id: 'nope', day: 1 }] }), null);
  assert.equal(sanitizeQuests(null), null);
  const ok = sanitizeQuests({ v: 1, slots: refreshQuests(null, DAY, first).slots, swapDay: DAY });
  assert.equal(ok.slots.length, 3);
  assert.equal(dayNumber(new Date(2026, 10, 6, 0, 1).getTime()), dayNumber(new Date(2026, 10, 6, 23, 59).getTime()));
  assert.equal(dayNumber(new Date(2026, 10, 7, 0, 1).getTime()) - dayNumber(new Date(2026, 10, 6, 23, 59).getTime()), 1);
});
