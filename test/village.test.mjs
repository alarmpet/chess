// Village rules: a finished game always pays, absence never costs, and nothing here reaches the chess rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { newVillage, sanitizeVillage, settleGame, startBuild, buildBlocked, tickVillage, pet, stageForHearts, pickMvp, routeOf, moveIn, moveOut, tenantBlocked, reconcileTenants, influenceSquares, influenceBonus, islandDone, startNewIsland, nightOpen, nextQuest, loopStep, dewReady, dayIndex, weekIndex, weekDue, rollWeek, weekPick, PROPS, PROP_PRICE, PROP_STOCK, SHELF_ODDS, SHELF_XP, growShelf, stockShelf, buyProp, placeProp, storeProp, DEW_GRAIN, BUILDINGS, KIND_ORDER, COINS, PET_DAILY_CAP, VISIT_GIFT, GRAIN_MAX, BONUS_MAX, shelfReserve } from '../src/village/economy.js';
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

test('the lord certificate shows the island record and nothing the player typed (desire plan D5)', async () => {
  const { certificateLines } = await import('../src/village/certificate.js');
  const { newCollection } = await import('../src/cards/economy.js');
  const v = newVillage();
  v.island = 2;
  v.games = 17;
  v.names = { w_e1: '우리집 민수' };
  v.built = [{ kind: KIND_ORDER[0], ready: true }, { kind: KIND_ORDER[1], ready: false }];
  const col = newCollection();
  const rivals = [{ id: 'picnic', name: { ko: '소풍 나온 미어캣단' }, wins: 2, complete: true, flag: '#f4a63a' }, { id: 'x', name: { ko: '대숲 밴드' }, wins: 0 }];
  const c = certificateLines(v, col, rivals, new Date(2026, 10, 3));
  assert.equal(c.island, '2번째 섬');
  assert.deepEqual(c.rows, [`🏠 건물 1/${KIND_ORDER.length}`, '🃏 도감 0/24', '♟ 17판']);
  assert.deepEqual(c.flags, [{ name: '소풍 나온 미어캣단', wins: 2, complete: true, color: '#f4a63a' }]);
  assert.equal(c.date, '2026.11.03');
  assert.ok(!JSON.stringify(c).includes('민수'), 'piece names stay out of the picture');
});

test('marks money cannot buy each say how to get them (desire plan D6)', async () => {
  const { earnedMarks } = await import('../src/village/marks.js');
  const { newCollection } = await import('../src/cards/economy.js');
  const v = newVillage();
  v.hearts = { w_d1: 64, w_e2: 25, b_g8: 40 };
  const rivals = [
    { id: 'picnic', name: { ko: '소풍 나온 미어캣단' }, owned: 2, total: 2 },
    { id: 'court', name: { ko: '도토리 궁정' }, owned: 1, total: 3 }
  ];
  const marks = earnedMarks({ rivals, v, col: newCollection(), photos: [] });
  const by = Object.fromEntries(marks.map((m) => [m.id, m]));
  assert.equal(by['sweep-picnic'].earned, true);
  assert.equal(by['sweep-court'].earned, false);
  assert.equal(by['sweep-court'].have, 1);
  assert.equal(by['gold-frame'].earned, true, 'the queen reached the starlit look');
  assert.equal(by['gold-frame'].have, 1);
  assert.match(by['gold-frame'].how, /캥거루 40\/60/, 'the closest role is named with its hearts');
  assert.equal(by.album.earned, false);
  assert.match(by['island-photo'].how, /0\/8/);
  assert.ok(marks.every((m) => m.how), 'every mark says how to get it');
  assert.deepEqual(marks.slice(0, 2).map((m) => m.earned), [true, true], 'earned marks first');
});

test('the three-step loop names one thing to do: build, then a resident, then the game that grows it (garden-short G1)', () => {
  const v = newVillage();
  assert.equal(loopStep(v).next, 'build');
  assert.ok(startBuild(v, 'field', 'c3'));
  assert.deepEqual(loopStep(v), { next: 'play', working: 0, waiting: 1, empty: 0 });
  finish(v);
  assert.deepEqual(loopStep(v), { next: 'resident', working: 0, waiting: 0, empty: 1 });
  v.built[0].tenant = 'meerkat_0';
  assert.deepEqual(loopStep(v), { next: 'play', working: 1, waiting: 0, empty: 0 });
  const grain = v.grain;
  finish(v);
  assert.ok(v.grain > grain, 'the game is what makes the planted field give');
});

test('overnight dew: the first game of a new day gives each working field a little more, once, and never piles up (garden-short G2)', () => {
  const day = (d, h = 9) => new Date(2026, 10, d, h).getTime();
  const v = newVillage();
  assert.equal(dewReady(v, day(4)), false, 'no field, no dew to show');
  staff(v, 'field', 'c3');
  assert.equal(dewReady(v, day(4)), true);
  const plain = newVillage();
  staff(plain, 'field', 'c3');
  const without = settleGame(plain, { moves: line(FOOLS), color: 'b', result: 'win' });
  const first = settleGame(v, { moves: line(FOOLS), color: 'b', result: 'win', now: day(4) });
  assert.equal(first.dew, true);
  assert.equal(first.harvest.grain, without.harvest.grain + DEW_GRAIN);
  const second = settleGame(v, { moves: line(FOOLS), color: 'b', result: 'win', now: day(4, 21) });
  assert.equal(second.dew, false, 'the second game of the same day has none');
  assert.equal(dewReady(v, day(3)), false, 'setting the clock back brings no dew');
  assert.equal(dewReady(v, day(9)), true, 'five missed days are still one dew');
  assert.equal(settleGame(v, { moves: line(FOOLS), color: 'b', result: 'win', now: day(9) }).dew, true);
  assert.equal(dewReady(v, day(9, 23)), false);
  v.grain = GRAIN_MAX;
  assert.equal(dewReady(v, day(10)), false, 'a full barn would waste it, so it waits');
});

test('a game reported without a time settles as before, with no dew', () => {
  const v = newVillage();
  staff(v, 'field', 'c3');
  assert.equal(finish(v).dew, false);
  assert.equal(v.dewDay, '');
});

test('calendar weeks start on Monday and run straight through a year end and a leap day (garden-short G3)', () => {
  const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();
  const week = (y, m, d, h) => weekIndex(dayIndex(at(y, m, d, h)));
  assert.equal(dayIndex(at(1970, 1, 1, 0)), 0);
  assert.equal(dayIndex(at(1970, 1, 1, 23)), 0, 'the whole local day is one day');
  assert.equal(week(2026, 11, 2), week(2026, 11, 8, 23), 'Monday to Sunday is one week');
  assert.equal(week(2026, 11, 9, 0), week(2026, 11, 8, 23) + 1, 'Monday midnight starts the next');
  assert.equal(week(2026, 12, 28), week(2027, 1, 3), 'a week that crosses New Year stays one week');
  assert.equal(week(2027, 1, 4), week(2027, 1, 3) + 1);
  assert.equal(dayIndex(at(2028, 3, 1)) - dayIndex(at(2028, 2, 28)), 2, 'a leap day is a day');
  assert.equal(week(2028, 2, 28), week(2028, 3, 5), 'the leap week is still Monday to Sunday');
});

test('a new week replaces the pick once, never for a clock set back, and missed weeks are one week (garden-short G3)', () => {
  const at = (m, d) => new Date(2026, m - 1, d, 12).getTime();
  const pool = [{ id: 'a', line: { ko: '가' } }, { id: 'b', line: { ko: '나' } }, { id: 'c', line: { ko: '다' } }];
  const v = newVillage();
  assert.equal(rollWeek(v, [], at(11, 4)), null, 'a pack with no weekly list never turns the week');
  assert.deepEqual(v.week, { w: -1, n: 0, pick: null });
  const first = rollWeek(v, pool, at(11, 4), () => 7);
  assert.ok(first && pool.includes(first));
  assert.equal(v.seed, 7, 'the seed is made once, when the island first needs it');
  assert.equal(weekPick(v, pool), first);
  assert.equal(rollWeek(v, pool, at(11, 8)), null, 'the rest of the week keeps it');
  assert.equal(weekDue(v, at(10, 20)), false, 'setting the clock back brings nothing');
  assert.equal(rollWeek(v, pool, at(10, 20)), null);
  const later = rollWeek(v, pool, at(12, 30));
  assert.ok(later);
  assert.equal(v.week.n, 2, 'eight missed weeks are one new pick');
  assert.equal(v.week.w, weekIndex(dayIndex(at(12, 30))));
});

test('the weekly pick follows a counter, not the date, so the same island always draws the same sequence (garden-short G3)', () => {
  const pool = 'abcdefgh'.split('').map((id) => ({ id, line: { ko: id } }));
  const draw = (startDay, gap) => {
    const v = newVillage();
    v.seed = 12345;
    const out = [];
    for (let i = 0; i < 6; i++) out.push(rollWeek(v, pool, new Date(2026, 0, startDay + i * gap, 12).getTime()).id);
    return out;
  };
  assert.deepEqual(draw(5, 7), draw(12, 21), 'skipping weeks or starting later does not change which picks come');
  const other = newVillage();
  other.seed = 999;
  rollWeek(other, pool, new Date(2026, 0, 5).getTime());
  assert.ok(sanitizeVillage(JSON.parse(JSON.stringify(other))).week.n === 1, 'the week survives a save');
  const old = sanitizeVillage({ v: 2, coins: 5 });
  assert.deepEqual(old.week, { w: -1, n: 0, pick: null }, 'an older save starts with no week yet');
  assert.equal(weekPick(other, []), null, 'a pack that lost the entry shows nothing');
});

test('the shelf draws three props once per game, the same on every reopening, and again when a game ends (garden-short G4)', () => {
  const v = newVillage();
  v.seed = 4242;
  assert.equal(stockShelf(v), true);
  assert.equal(v.shelf.slots.length, 3);
  const first = JSON.stringify(v.shelf.slots);
  assert.equal(stockShelf(v), false, 'reopening between games draws nothing new');
  assert.equal(JSON.stringify(v.shelf.slots), first);
  for (const s of v.shelf.slots) assert.equal(s.stock, PROP_STOCK[PROPS[s.kind].tier]);
  const twin = newVillage();
  twin.seed = 4242;
  stockShelf(twin);
  assert.equal(JSON.stringify(twin.shelf.slots), first, 'the same island seed draws the same shelf');
  settleGame(v, { moves: line(FOOLS), color: 'b', result: 'win' });
  assert.equal(v.shelf.g, v.games, 'a finished game restocks the shelf');
  assert.equal(v.shelf.n, 2);
});

test('shelf tiers follow the level odds: a level-1 shelf never shows a legend (garden-short G4)', () => {
  const count = (lv) => {
    const seen = [0, 0, 0, 0, 0];
    for (let seed = 1; seed <= 400; seed++) {
      const v = newVillage();
      v.seed = seed;
      v.shelf.lv = lv;
      stockShelf(v);
      for (const s of v.shelf.slots) seen[PROPS[s.kind].tier] += 1;
    }
    return seen;
  };
  const one = count(1);
  assert.equal(one[4], 0, 'the level-1 weight for legends is 0');
  assert.ok(one[1] > one[2] && one[2] > one[3], `common > fine > rare at level 1: ${one}`);
  const five = count(5);
  assert.ok(five[4] > five[1], `legends lead at level 5: ${five}`);
  assert.deepEqual(SHELF_ODDS[0], [70, 20, 10, 0]);
});

test('the shelf level grows only with games: a point every second game, 3·4·5·6 points, up to 5 (garden-short G4)', () => {
  const v = newVillage();
  const levelAt = [];
  for (let g = 1; g <= 60; g++) {
    v.games = g;
    growShelf(v);
    levelAt[g] = v.shelf.lv;
  }
  assert.equal(levelAt[5], 1);
  assert.equal(levelAt[6], 2, 'three points by game 6');
  assert.equal(levelAt[14], 3, 'four more by game 14');
  assert.equal(levelAt[24], 4);
  assert.equal(levelAt[36], 5);
  assert.equal(levelAt[60], 5, 'it stops at 5');
  assert.equal(SHELF_XP.length, 4);
});

test('the shelf leaves the cheapest unstarted building its acorns (garden-short G4 pace)', () => {
  const v = newVillage();
  v.shelf.slots = [{ kind: 'bench', stock: 3 }];
  assert.deepEqual(shelfReserve(v), { kind: 'field', cost: BUILDINGS.field.cost });
  v.coins = PROP_PRICE[1] + BUILDINGS.field.cost - 1;
  assert.equal(buyProp(v, 0), 'reserve', 'one acorn short of keeping the field');
  assert.equal(v.coins, PROP_PRICE[1] + BUILDINGS.field.cost - 1, 'a refusal spends nothing');
  v.coins += 1;
  assert.equal(buyProp(v, 0), null);
  v.coins = 500;
  assert.equal(startBuild(v, 'field', 'c3'), true);
  assert.equal(shelfReserve(v).kind, 'shelter', 'a started building no longer counts');
  for (const k of KIND_ORDER) if (!v.built.some((b) => b.kind === k)) v.built.push({ id: v.nextId++, kind: k, sq: 'a1', tenant: null, level: 0, ready: true });
  assert.equal(shelfReserve(v), null);
  v.coins = PROP_PRICE[1];
  assert.equal(buyProp(v, 0), null, 'with every building started, every acorn is free');
});

test('buying spends acorns and stock, an empty slot refuses, and props go on free squares and back (garden-short G4)', () => {
  const v = newVillage();
  v.shelf.slots = [{ kind: 'bench', stock: 1 }, { kind: 'statue', stock: 1 }];
  v.coins = PROP_PRICE[1] + BUILDINGS.field.cost;
  assert.equal(buyProp(v, 1), 'coins');
  assert.equal(buyProp(v, 0), null);
  assert.equal(v.coins, BUILDINGS.field.cost);
  assert.equal(v.stash.bench, 1);
  v.coins = 500;
  assert.equal(buyProp(v, 0), 'empty', 'sold out until the next game');
  assert.equal(buyProp(v, 7), 'gone');
  assert.equal(placeProp(v, 'bench', 'g7'), 'blocked', 'the starting house stands there');
  assert.equal(placeProp(v, 'bench', 'z9'), 'bounds');
  assert.equal(placeProp(v, 'bench', 'c4'), null);
  assert.equal(v.stash.bench, undefined);
  assert.equal(placeProp(v, 'bench', 'c5'), 'none');
  assert.equal(startBuild(v, 'field', 'c4'), false, 'a prop takes its square');
  assert.equal(storeProp(v, 'g7'), false, 'old buildings kept as decoration are not props');
  assert.equal(storeProp(v, 'c4'), true);
  assert.equal(v.stash.bench, 1);
});

test('bought props move to the next island in the stash (garden-short G4)', () => {
  const v = newVillage();
  v.stash = { lantern: 1 };
  placeProp(v, 'lantern', 'b2');
  for (const [i, kind] of KIND_ORDER.entries()) v.built.push({ id: i + 1, kind, sq: `${'abcdefgh'[i]}5`, ready: true });
  assert.equal(startNewIsland(v), true);
  assert.deepEqual(v.decor, []);
  assert.equal(v.stash.lantern, 1);
});
