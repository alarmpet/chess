// Capture cards: the published odds and guarantees must hold, because the game shows them to the player.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIMALS, COMMON, DROP_TABLE, HERO, HERO_GUARANTEE, MERGE_COST, RARE, RARE_GUARANTEE,
  awardCard, canMerge, cardId, consolationCard, mergeCard, mergeList, newCollection,
  rarityFromRoll, sanitizeCollection, seededRoll, sparesOf,
  DUST_HERO, DUST_RARE, RARE_KEEP, SHELF_BASE, SHELF_MAX, buyShelfSlot, convertOverflow, shelfPrice, toggleShelf
} from '../src/cards/economy.js';
import { advanceMission, missionChoices, MISSIONS } from '../src/cards/missions.js';

const done = () => ({ ...newCollection(), firstDone: true });

test('every drop table adds up to 100 percent', () => {
  for (const [type, row] of Object.entries(DROP_TABLE)) {
    assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 100) < 1e-9, type);
  }
});

test('a roll lands in the published bands', () => {
  assert.equal(rarityFromRoll('pawn', 0), 0);
  assert.equal(rarityFromRoll('pawn', 0.8999), 0);
  assert.equal(rarityFromRoll('pawn', 0.95), 1);
  assert.equal(rarityFromRoll('pawn', 0.995), 2);
  assert.equal(rarityFromRoll('pawn', 0.9995), 3);
  assert.equal(rarityFromRoll('king', 0), 1);
});

test('seeded rolls repeat for the same move and spread evenly', () => {
  assert.equal(seededRoll(5, 'capture', 7), seededRoll(5, 'capture', 7));
  assert.notEqual(seededRoll(5, 'capture', 7), seededRoll(5, 'capture', 8));
  let sum = 0;
  let rare = 0;
  const n = 200000;
  for (let i = 0; i < n; i++) {
    const r = seededRoll(i * 31, 'capture', i % 90);
    sum += r;
    if (rarityFromRoll('queen', r) === HERO) rare += 1;
  }
  assert.ok(Math.abs(sum / n - 0.5) < 0.01);
  assert.ok(Math.abs(rare / n - 0.05) < 0.005);
});

test('the very first card is rare or better', () => {
  const col = newCollection();
  assert.ok(awardCard(col, 'pawn', 0).rarity >= RARE);
  assert.ok(awardCard(col, 'pawn', 0).rarity === COMMON);
});

test('the tenth card without a rare is guaranteed rare', () => {
  const col = done();
  for (let i = 1; i < RARE_GUARANTEE; i++) assert.equal(awardCard(col, 'pawn', 0).rarity, COMMON, i);
  assert.ok(awardCard(col, 'pawn', 0).rarity >= RARE);
  assert.equal(col.sinceRare, 0);
});

test('the sixtieth card without a hero is a hero, and a hero resets both counters', () => {
  const col = done();
  let last;
  for (let i = 0; i < HERO_GUARANTEE; i++) last = awardCard(col, 'pawn', 0);
  assert.equal(last.rarity, HERO);
  assert.equal(col.sinceHero, 0);
  assert.equal(col.sinceRare, 0);
});

test('a guaranteed hero becomes a missing animal only when this one is already owned', () => {
  const col = done();
  col.sinceHero = HERO_GUARANTEE - 1;
  assert.equal(awardCard(col, 'pawn', 0.5).animal, 'meerkat');
  col.sinceHero = HERO_GUARANTEE - 1;
  const next = awardCard(col, 'pawn', 0.5);
  assert.notEqual(next.animal, 'meerkat');
  assert.equal(next.fresh, true);
  for (const a of ANIMALS) col.cards[cardId(a, HERO)] = 1;
  col.sinceHero = HERO_GUARANTEE - 1;
  assert.equal(awardCard(col, 'pawn', 0.5).animal, 'meerkat');
});

test('a natural hero keeps the captured animal', () => {
  const col = done();
  col.cards[cardId('tiger', HERO)] = 1;
  assert.equal(awardCard(col, 'queen', 0.99).animal, 'tiger');
});

test('a losing game still pays one common card and it counts towards the guarantees', () => {
  const col = done();
  const card = consolationCard(col, 0.2);
  assert.equal(card.rarity, COMMON);
  assert.equal(col.sinceHero, 1);
});

test('three spares merge into the next rarity and the album copy stays', () => {
  const col = done();
  const id = cardId('panda', COMMON);
  col.cards[id] = MERGE_COST;
  assert.equal(canMerge(col, 'panda', COMMON), false);
  col.cards[id] = MERGE_COST + 1;
  assert.deepEqual(mergeList(col), [{ animal: 'panda', rarity: COMMON }]);
  const made = mergeCard(col, 'panda', COMMON);
  assert.equal(made.rarity, 1);
  assert.equal(made.fresh, true);
  assert.equal(col.cards[id], 1);
  assert.equal(sparesOf(col, 'panda', COMMON), 0);
});

test('merging stops at rare, so a hero is never made for free', () => {
  const col = done();
  col.cards[cardId('lion', RARE)] = 50;
  assert.equal(canMerge(col, 'lion', RARE), false);
  assert.equal(mergeCard(col, 'lion', RARE), null);
});

test('merging does not move the guarantees', () => {
  const col = done();
  col.cards[cardId('lion', COMMON)] = 9;
  col.sinceRare = 4;
  mergeCard(col, 'lion', COMMON);
  assert.equal(col.sinceRare, 4);
});

test('a save survives a reload and bad saves fall back safely', () => {
  const col = done();
  awardCard(col, 'rook', 0.1);
  assert.deepEqual(sanitizeCollection(JSON.parse(JSON.stringify(col))), col);
  assert.deepEqual(sanitizeCollection(null), newCollection());
  assert.deepEqual(sanitizeCollection({ v: 9 }), newCollection());
  assert.equal(sanitizeCollection({ v: 1, cards: { meerkat_0: -3, junk_9: 4 } }).cards.meerkat_0, undefined);
  assert.equal(sanitizeCollection({ v: 1, cards: { junk_9: 4 } }).cards.junk_9, undefined);
});

test('the rules code knows nothing about cards', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  for (const f of await readdir(new URL('../src/rules/', import.meta.url))) {
    const text = await readFile(new URL(`../src/rules/${f}`, import.meta.url), 'utf8');
    assert.ok(!/cards\//.test(text), f);
  }
});

test('a floor lifts a drop and a boost raises it, but a boost alone never makes a hero', () => {
  const col = done();
  assert.equal(awardCard(col, 'pawn', 0, { floor: 1 }).rarity, 1);
  assert.equal(awardCard(col, 'pawn', 0, { boost: true }).rarity, 1);
  assert.equal(awardCard(col, 'queen', 0.5, { boost: true }).rarity, RARE);
  assert.equal(awardCard(col, 'queen', 0.8, { boost: true }).rarity, RARE);
});

test('overflow turns to stardust and never touches the album copy', () => {
  const col = done();
  col.cards[cardId('lion', RARE)] = 1 + RARE_KEEP + 2;
  col.cards[cardId('tiger', HERO)] = 3;
  col.cards[cardId('panda', COMMON)] = 40;
  assert.equal(convertOverflow(col), 2 * DUST_RARE + 2 * DUST_HERO);
  assert.equal(sparesOf(col, 'lion', RARE), RARE_KEEP);
  assert.equal(col.cards[cardId('tiger', HERO)], 1);
  assert.equal(col.cards[cardId('panda', COMMON)], 40);
  assert.equal(convertOverflow(col), 0);
});

test('the village shelf holds owned cards only, and more slots cost stardust', () => {
  const col = done();
  assert.equal(toggleShelf(col, 'lion_3'), false);
  for (const a of ANIMALS) col.cards[cardId(a, COMMON)] = 1;
  for (const a of ANIMALS.slice(0, SHELF_BASE)) assert.equal(toggleShelf(col, cardId(a, COMMON)), true);
  assert.equal(toggleShelf(col, cardId('lion', COMMON)), false);
  assert.equal(toggleShelf(col, cardId(ANIMALS[0], COMMON)), true);
  assert.equal(col.shelf.length, SHELF_BASE - 1);
  assert.equal(buyShelfSlot(col), false);
  col.dust = shelfPrice(col);
  assert.equal(buyShelfSlot(col), true);
  assert.equal(col.dust, 0);
  col.dust = 100000;
  while (buyShelfSlot(col));
  assert.equal(col.shelfSlots, SHELF_MAX);
  assert.equal(shelfPrice(col), null);
});

test('older saves keep their cards and gain the new fields', () => {
  const col = sanitizeCollection({ v: 1, cards: { lion_1: 2 }, sinceRare: 3, sinceHero: 4, firstDone: true });
  assert.equal(col.cards.lion_1, 2);
  assert.equal(col.dust, 0);
  assert.equal(col.shelfSlots, SHELF_BASE);
  assert.deepEqual(sanitizeCollection({ v: 1, cards: {}, shelf: ['lion_1'] }).shelf, []);
});

test('three different missions are offered, and the same roll offers the same ones', () => {
  const a = missionChoices(0.37);
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((m) => m.id)).size, 3);
  assert.deepEqual(a, missionChoices(0.37));
  for (let i = 0; i < 40; i++) assert.equal(new Set(missionChoices(i / 40).map((m) => m.id)).size, 3);
});

test('a race goes to whoever captures that animal first', () => {
  const race = MISSIONS.find((m) => m.kind === 'race' && m.target === 'bishop');
  assert.equal(advanceMission(race, { capture: { type: 'pawn', byPlayer: true } }), null);
  assert.equal(advanceMission(race, { capture: { type: 'bishop', byPlayer: true } }), 'done');
  assert.equal(advanceMission(race, { capture: { type: 'bishop', byPlayer: false } }), 'lost');
});

test('a piece mission needs that piece to make the capture', () => {
  const m = MISSIONS.find((x) => x.kind === 'with' && x.attacker === 'knight');
  assert.equal(advanceMission(m, { capture: { type: 'pawn', byPlayer: true, attackerType: 'rook' } }), null);
  assert.equal(advanceMission(m, { capture: { type: 'pawn', byPlayer: false, attackerType: 'knight' } }), null);
  assert.equal(advanceMission(m, { capture: { type: 'pawn', byPlayer: true, attackerType: 'knight' } }), 'done');
});

test('a safety mission fails on losing the piece and passes by surviving', () => {
  const m = MISSIONS.find((x) => x.kind === 'safe');
  assert.equal(advanceMission(m, { capture: { type: m.piece, byPlayer: false } }), 'lost');
  assert.equal(advanceMission(m, { capture: { type: m.piece, byPlayer: true } }), null);
  assert.equal(advanceMission(m, { ply: m.plies - 1 }), null);
  assert.equal(advanceMission(m, { ply: m.plies }), 'done');
});

test('threatened squares are read from the position', async () => {
  const { Referee } = await import('../src/rules/referee.js');
  const r = new Referee('4k3/8/8/4r3/8/8/8/R3K2R w - - 0 1');
  assert.deepEqual(r.threatened('w'), ['e1']);
});
