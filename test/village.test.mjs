// Village rules: a finished game always pays, absence never costs, and nothing here reaches the chess rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { newVillage, sanitizeVillage, settleGame, startBuild, buildBlocked, tickVillage, pet, stageForHearts, pickMvp, routeOf, moveIn, moveOut, tenantBlocked, reconcileTenants, influenceSquares, influenceBonus, islandDone, startNewIsland, nightOpen, nextQuest, BUILDINGS, KIND_ORDER, COINS, PET_DAILY_CAP, VISIT_GIFT, GRAIN_MAX, BONUS_MAX } from '../src/village/economy.js';
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

const finish = (v, result = 'win', color = 'b') => settleGame(v, { moves: line(FOOLS), color, result });
const staff = (v, kind, sq, card = 'meerkat_0') => {
  v.coins += BUILDINGS[kind].cost;
  assert.ok(startBuild(v, kind, sq));
  const b = v.built[v.built.length - 1];
  b.ready = true;
  b.tenant = card;
  return b;
};

test('a building is paid up front and opens when the next game ends, whatever the clock says', () => {
  const v = newVillage();
  v.coins = 100;
  assert.equal(buildBlocked(v, 'field', 'g7'), 'taken');
  assert.ok(startBuild(v, 'field', 'c3'));
  assert.equal(v.coins, 100 - BUILDINGS.field.cost);
  assert.equal(buildBlocked(v, 'mill', 'c4'), 'busy');
  tickVillage(v, [], 10 ** 13);
  assert.equal(v.built[0].ready, false, 'a year away builds nothing');
  const r = finish(v);
  assert.deepEqual(r.opened, ['field']);
  assert.equal(v.built[0].ready, true);
  assert.equal(buildBlocked(v, 'field', 'c4'), 'owned');
  v.coins = 0;
  assert.equal(buildBlocked(v, 'stage', 'a1'), 'coins');
});

test('an empty building makes nothing; a resident makes it work', () => {
  const v = newVillage();
  const field = staff(v, 'field', 'c3');
  field.tenant = null;
  assert.equal(finish(v).harvest.grain, 0);
  field.tenant = 'meerkat_0';
  assert.equal(finish(v).harvest.grain, 2);
});

test('the chain runs field, bakery, market in one game, and half the grain with a mill', () => {
  const v = newVillage();
  staff(v, 'field', 'a1');
  staff(v, 'bakery', 'h8', 'panda_1');
  v.grain = 4;
  const r = finish(v);
  assert.equal(r.harvest.grain, 2);
  assert.equal(r.harvest.bread, 1);
  assert.equal(v.grain, 4);
  staff(v, 'mill', 'a8');
  const r2 = finish(v);
  assert.equal(r2.harvest.bread, 2);
  assert.equal(v.grain, 4);
  const coins = v.coins;
  staff(v, 'market', 'h1');
  const r3 = finish(v);
  assert.ok(r3.harvest.coins > 0);
  assert.equal(v.coins, coins + COINS.win + r3.harvest.coins);
});

test('a full barn stops the field and throws nothing away', () => {
  const v = newVillage();
  staff(v, 'field', 'c3');
  v.grain = GRAIN_MAX - 1;
  assert.equal(finish(v).harvest.grain, 1);
  assert.equal(finish(v).harvest.grain, 0);
  assert.equal(v.grain, GRAIN_MAX);
});

test('splitting play into sessions changes nothing: opening the village never pays or costs', () => {
  const play = (visits) => {
    const v = newVillage();
    staff(v, 'field', 'c3');
    staff(v, 'bakery', 'd4', 'panda_1');
    staff(v, 'market', 'e5');
    for (let i = 0; i < 12; i++) {
      finish(v, i % 3 ? 'win' : 'loss');
      for (let k = 0; k < visits; k++) tickVillage(v, [], 10 ** 12 + i * k);
    }
    return { coins: v.coins, grain: v.grain, bread: v.bread, hearts: v.hearts };
  };
  assert.deepEqual(play(0), play(5));
});

test('an influence is the way that chess piece moves', () => {
  assert.deepEqual(influenceSquares('meerkat', 'e4'), ['e5']);
  assert.equal(influenceSquares('meerkat', 'e8').length, 0);
  assert.equal(influenceSquares('kangaroo', 'd4').length, 8);
  assert.deepEqual(influenceSquares('kangaroo', 'a1').sort(), ['b3', 'c2']);
  assert.ok(influenceSquares('panda', 'd4').includes('f6'));
  assert.ok(!influenceSquares('panda', 'd4').includes('d6'));
  assert.ok(influenceSquares('rhino', 'd4').includes('d6'));
  assert.ok(!influenceSquares('rhino', 'd4').includes('e5'));
  assert.equal(influenceSquares('lion', 'd4').length, 8);
  assert.ok(influenceSquares('tiger', 'd4').includes('f6') && influenceSquares('tiger', 'd4').includes('d6'));
});

test('influence only adds, a better card touches harder, and it has a ceiling', () => {
  const v = newVillage();
  const field = staff(v, 'field', 'd4');
  staff(v, 'shelter', 'd3', 'meerkat_0');
  assert.equal(influenceBonus(v, field), 1);
  staff(v, 'mill', 'f6', 'panda_1');
  assert.equal(influenceBonus(v, field), 3);
  staff(v, 'market', 'd6', 'rhino_2');
  assert.equal(influenceBonus(v, field), BONUS_MAX);
  assert.equal(finish(v).harvest.grain, 2 + BONUS_MAX);
});

test('the firefly station adds one everywhere and opens the night', () => {
  const v = newVillage();
  staff(v, 'field', 'a1');
  assert.equal(nightOpen(v), false);
  staff(v, 'power', 'h8', 'lion_1');
  assert.equal(nightOpen(v), true);
  assert.equal(finish(v).harvest.grain, 3);
});

test('a card lives in one building per copy, and any animal of the rarity will do', () => {
  const col = { cards: { meerkat_0: 1, tiger_1: 1 } };
  const v = newVillage();
  const field = staff(v, 'field', 'a1', null);
  const mill = staff(v, 'mill', 'b1', null);
  const bakery = staff(v, 'bakery', 'c1', null);
  assert.equal(tenantBlocked(v, col, bakery.id, 'meerkat_0'), 'rarity');
  assert.ok(moveIn(v, col, bakery.id, 'tiger_1'));
  assert.ok(moveIn(v, col, field.id, 'meerkat_0'));
  assert.equal(moveIn(v, col, mill.id, 'meerkat_0'), false);
  assert.ok(moveOut(v, field.id));
  assert.ok(moveIn(v, col, mill.id, 'meerkat_0'));
  assert.equal(col.cards.meerkat_0, 1, 'moving in spends no card');
});

test('a merged-away card sends only that resident home', () => {
  const v = newVillage();
  const a = staff(v, 'field', 'a1', 'meerkat_0');
  const b = staff(v, 'mill', 'b1', 'meerkat_0');
  reconcileTenants(v, { cards: { meerkat_0: 1 } });
  assert.equal(a.tenant, 'meerkat_0');
  assert.equal(b.tenant, null);
});

test('a quest asks from game six on, grows its building, and missing it costs nothing', () => {
  const v = newVillage();
  const field = staff(v, 'field', 'a1');
  assert.equal(nextQuest(v), null);
  v.games = 5;
  const q = nextQuest(v);
  assert.equal(q.buildingId, field.id);
  v.quest = { buildingId: field.id, piece: 'pawn' };
  const coins = v.coins;
  const r = settleGame(v, { moves: line(['e4', 'd5', 'exd5']), color: 'w', result: 'draw' });
  assert.equal(r.quest.done, true);
  assert.equal(field.level, 1);
  assert.equal(r.harvest.grain, 3);
  v.quest = { buildingId: field.id, piece: 'queen' };
  const miss = finish(v);
  assert.equal(miss.quest.done, false);
  assert.equal(field.level, 1);
  assert.equal(v.coins, coins + COINS.draw + COINS.win);
});

test('a finished island starts again and keeps residents hearts and acorns', () => {
  const v = newVillage();
  assert.equal(startNewIsland(v), false);
  KIND_ORDER.forEach((k, i) => staff(v, k, `${'abcdefgh'[i]}2`));
  assert.ok(islandDone(v));
  v.hearts.w_e2 = 12;
  v.coins = 77;
  assert.ok(startNewIsland(v));
  assert.equal(v.built.length, 0);
  assert.equal(v.island, 2);
  assert.equal(v.hearts.w_e2, 12);
  assert.equal(v.coins, 77);
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
  const rivals = [{ id: 'picnic', visitsFor: 'shelter' }];
  const v = newVillage();
  const start = 10 ** 12;
  assert.deepEqual(tickVillage(v, rivals, start), []);
  v.built.push({ kind: 'shelter', sq: 'c3', ready: true });
  v.rivals.picnic = { result: 'win', mvp: 'w_e2', plies: 40 };
  const coins = v.coins;
  const ev = tickVillage(v, rivals, start);
  assert.equal(ev[0].memory.mvp, 'w_e2');
  assert.equal(v.coins, coins + VISIT_GIFT);
  assert.deepEqual(tickVillage(v, rivals, start + 1000), [], 'not again straight away');
  const hearts = { ...v.hearts };
  tickVillage(v, rivals, start + 365 * 24 * 3600 * 1000);
  assert.deepEqual(v.hearts, hearts, 'a year away changes no hearts');
  assert.equal(v.built.length, 1, 'nothing falls down');
});

test('a broken or old save falls back safely', () => {
  assert.equal(sanitizeVillage(null).coins, newVillage().coins);
  assert.equal(sanitizeVillage({ v: 99, coins: 5 }).coins, newVillage().coins);
  assert.equal(sanitizeVillage({ v: 2, coins: 5 }).coins, 5);
});

test('an old save keeps its coins and hearts, and what stood or was being built stays as decoration', () => {
  const v = sanitizeVillage({ v: 1, coins: 5, hearts: { w_e2: 3 }, built: [{ kind: 'house', sq: 'd4' }], build: { kind: 'bench', sq: 'c3', done: 1 } });
  assert.equal(v.v, 2);
  assert.equal(v.coins, 5);
  assert.equal(v.hearts.w_e2, 3);
  assert.deepEqual(v.decor, [{ kind: 'house', sq: 'd4' }, { kind: 'bench', sq: 'c3' }]);
  assert.equal(v.build, undefined);
  v.coins = 100;
  assert.equal(buildBlocked(v, 'field', 'd4'), 'taken');
});

test('earned looks: the most loved piece of a role opens the panel and names the next stage', async () => {
  const { earnedLooks, roleOfSlot } = await import('../src/village/economy.js');
  assert.equal(roleOfSlot('w_e2'), 'pawn');
  assert.equal(roleOfSlot('b_d8'), 'queen');
  assert.equal(roleOfSlot('w_g1'), 'knight');
  const e = earnedLooks({ w_e2: 4, w_d2: 12, w_d1: 61, b_a8: 30 });
  assert.deepEqual(e.w.pawn, { stage: 'grown', hearts: 12, next: { stage: 'adult', need: 18 } });
  assert.deepEqual(e.w.queen, { stage: 'starlit', hearts: 61, next: null });
  assert.deepEqual(e.w.king, { stage: 'baby', hearts: 0, next: { stage: 'grown', need: 10 } });
  assert.equal(e.b.rook.stage, 'adult');
  assert.equal(earnedLooks(undefined).w.pawn.stage, 'baby');
});
