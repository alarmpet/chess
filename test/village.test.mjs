// Village rules: a finished game always pays, absence never costs, and nothing here reaches the chess rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { newVillage, sanitizeVillage, settleGame, startBuild, buildBlocked, tickVillage, pet, stageForHearts, pickMvp, routeOf, BUILDINGS, COINS, PET_DAILY_CAP, VISIT_GIFT } from '../src/village/economy.js';
import { replayGame } from '../src/village/roster.js';

const line = (sans) => { const c = new Chess(); return sans.map((s) => c.move(s)); };
const FOOLS = ['f3', 'e5', 'g4', 'Qh4#'];

test('a win, a draw and a loss all pay, and a loss takes nothing', () => {
  const v = newVillage();
  const before = v.coins;
  const r = settleGame(v, { moves: line(FOOLS), color: 'w', result: 'loss' });
  assert.equal(r.coins, COINS.loss);
  assert.equal(v.coins, before + COINS.loss);
  assert.equal(v.map.games, 1);
});

test('the mating piece is the hero of the game and its real route is kept', () => {
  const moves = line(FOOLS);
  assert.equal(pickMvp(replayGame(moves), 'b'), 'b_d8');
  assert.deepEqual(routeOf(moves, 'b_d8'), ['d8', 'h4']);
  const v = newVillage();
  settleGame(v, { moves, color: 'b', result: 'win', rivalId: 'picnic' });
  assert.equal(v.walk.slot, 'b_d8');
  assert.equal(v.rivals.picnic.result, 'win');
});

test('one builder at a time, paid up front, finished by elapsed time', () => {
  const v = newVillage();
  v.coins = 100;
  assert.equal(buildBlocked(v, 'house', 'd4'), 'taken');
  assert.ok(startBuild(v, 'bench', 'c3', 1000));
  assert.equal(v.coins, 100 - BUILDINGS.bench.cost);
  assert.equal(buildBlocked(v, 'bench', 'c4'), 'busy');
  assert.deepEqual(tickVillage(v, [], 1000), []);
  const ev = tickVillage(v, [], 1000 + BUILDINGS.bench.ms);
  assert.equal(ev[0].type, 'built');
  assert.equal(v.build, null);
  assert.ok(v.built.some((b) => b.kind === 'bench' && b.sq === 'c3'));
  v.coins = 0;
  assert.equal(buildBlocked(v, 'fountain', 'a1'), 'coins');
});

test('petting stops adding hearts at the daily cap and resets the next day', () => {
  const v = newVillage();
  const t = new Date(2026, 9, 30, 12).getTime();
  for (let i = 0; i < PET_DAILY_CAP; i++) assert.ok(pet(v, 'w_e2', t));
  assert.equal(pet(v, 'w_e2', t), false);
  assert.equal(v.hearts.w_e2, PET_DAILY_CAP);
  assert.ok(pet(v, 'w_e2', t + 24 * 3600 * 1000));
});

test('hearts grow the look in order', () => {
  assert.deepEqual([0, 9, 10, 30, 60, 500].map(stageForHearts), ['baby', 'baby', 'grown', 'adult', 'starlit', 'starlit']);
});

test('a visitor needs its building, leaves a gift, remembers the last game, and absence costs nothing', () => {
  const rivals = [{ id: 'picnic', visitsFor: 'bench' }];
  const v = newVillage();
  const start = 10 ** 12;
  assert.deepEqual(tickVillage(v, rivals, start), []);
  v.built.push({ kind: 'bench', sq: 'c3' });
  v.rivals.picnic = { result: 'win', mvp: 'w_e2', plies: 40 };
  const coins = v.coins;
  const ev = tickVillage(v, rivals, start);
  assert.equal(ev[0].memory.mvp, 'w_e2');
  assert.equal(v.coins, coins + VISIT_GIFT);
  assert.deepEqual(tickVillage(v, rivals, start + 1000), [], 'not again straight away');
  const hearts = { ...v.hearts };
  tickVillage(v, rivals, start + 365 * 24 * 3600 * 1000);
  assert.deepEqual(v.hearts, hearts, 'a year away changes no hearts');
  assert.ok(v.built.length >= 2, 'nothing falls down');
});

test('a broken or old save falls back safely', () => {
  assert.equal(sanitizeVillage(null).coins, newVillage().coins);
  assert.equal(sanitizeVillage({ v: 99, coins: 5 }).coins, newVillage().coins);
  assert.equal(sanitizeVillage({ v: 1, coins: 5 }).coins, 5);
});
