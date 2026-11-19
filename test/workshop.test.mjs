// 공방(WS-1): 판이 진도를 주고, 마을이 곡물로 부품을 만들고, 부품과 도토리로 소품을 골라 만든다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { PROPS, PROP_PRICE, GRAIN_PRICE, newVillage, sanitizeVillage, settleContract, settleGame, squareTaken } from '../src/village/economy.js';
import {
  CRAFT_COINS, CRAFT_PARTS, GRAIN_BUY_PRICE, PARTS_MAX, WORKSHOP_AFTER_GAMES, WORKSHOP_GIFT_GRAIN, WORK_MAX,
  addWork, buyGrain, claimWorkshop, craftCost, craftProp, produceParts, sanitizeWorkshop, workshopOffered
} from '../src/village/workshop.js';

const fresh = (games = 5) => { const v = newVillage(); v.games = games; return v; };
const taken = (v) => (sq) => squareTaken(v, sq);
const shortGame = () => { const c = new Chess(); for (const m of ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#']) c.move(m); return c.history({ verbose: true }); };

test('공방은 두 판 뒤에 무료로 받고, 곡물 3 이 같이 온다', () => {
  const v = fresh(WORKSHOP_AFTER_GAMES - 1);
  assert.equal(workshopOffered(v), false);
  assert.equal(claimWorkshop(v, taken(v)), 'early');
  v.games = WORKSHOP_AFTER_GAMES;
  assert.equal(workshopOffered(v), true);
  const coins = v.coins;
  assert.equal(claimWorkshop(v, taken(v)), null);
  assert.equal(v.coins, coins);
  assert.equal(v.grain, WORKSHOP_GIFT_GRAIN);
  assert.match(v.workshop.sq, /^[a-h][1-8]$/);
  assert.equal(claimWorkshop(v, taken(v)), 'owned');
  assert.equal(workshopOffered(v), false);
});

test('공방 자리는 비어 있는 칸이고, 그 칸에는 건물·소품을 놓지 못한다', () => {
  const v = fresh();
  v.decor.push({ kind: 'bench', sq: 'e2' });
  claimWorkshop(v, taken(v));
  assert.notEqual(v.workshop.sq, 'e2');
  assert.equal(squareTaken(v, v.workshop.sq), true);
});

test('생산식: 진도 1일 + 곡물 1 → 부품 2, 곡물이 없으면 진도는 기다린다', () => {
  const v = fresh();
  claimWorkshop(v, taken(v));
  v.grain = 1;
  addWork(v, 2.5);
  assert.equal(produceParts(v), 2);
  assert.deepEqual([v.workshop.work, v.grain, v.workshop.parts], [1.5, 0, 2]);
  assert.equal(produceParts(v), 0);
  v.grain = 5;
  assert.equal(produceParts(v), 2);
  assert.deepEqual([v.workshop.work, v.grain, v.workshop.parts, v.workshop.made], [0.5, 4, 4, 4]);
});

test('진도와 부품은 끝이 있다 — 넘치면 버리지 않고 기다린다', () => {
  const v = fresh();
  claimWorkshop(v, taken(v));
  addWork(v, 99);
  assert.equal(v.workshop.work, WORK_MAX);
  v.grain = 99;
  produceParts(v);
  assert.ok(v.workshop.parts <= PARTS_MAX);
  assert.equal(v.workshop.parts, Math.min(PARTS_MAX, WORK_MAX * 2));
});

test('공방이 없으면 진도가 쌓이지 않는다', () => {
  const v = fresh();
  assert.equal(addWork(v, 1), 0);
  assert.equal(produceParts(v), 0);
});

test('일반 판은 1일, 계약전은 0.5일, 기권한 계약전은 0', () => {
  const v = fresh();
  claimWorkshop(v, taken(v));
  v.grain = 0;
  const s = settleGame(v, { moves: shortGame(), color: 'w', result: 'win', gameId: 1 });
  assert.equal(s.work, 1);
  const c = settleContract(v, { gameId: 2, coins: 18, reason: 'contract' });
  assert.equal(c.work, 0.5);
  const r = settleContract(v, { gameId: 3, coins: 0, reason: 'resign' });
  assert.equal(r.work, 0);
});

test('곡물을 사서 장터에 되팔아도 남지 않는다', () => {
  assert.ok(GRAIN_BUY_PRICE > GRAIN_PRICE);
  const v = fresh();
  assert.equal(buyGrain(v), 'none');
  claimWorkshop(v, taken(v));
  v.coins = 10;
  const g = v.grain;
  assert.equal(buyGrain(v), null);
  assert.deepEqual([v.coins, v.grain], [10 - GRAIN_BUY_PRICE, g + 1]);
  assert.equal(buyGrain(v, { reserve: 6 }), 'reserve');
  v.coins = 1;
  assert.equal(buyGrain(v), 'coins');
});

test('만들기는 매대보다 도토리가 적게 들고 부품이 든다, 왕관 동상은 못 만든다', () => {
  for (const [kind, p] of Object.entries(PROPS)) {
    const c = craftCost(kind);
    if (p.tier === 4) { assert.equal(c, null, kind); continue; }
    assert.ok(c.coins < PROP_PRICE[p.tier] && c.parts > 0, kind);
    if (p.tier === 1) assert.equal(c.coins, 0, kind);
  }
  assert.ok(CRAFT_COINS[1] < CRAFT_COINS[2] && CRAFT_PARTS[1] < CRAFT_PARTS[3]);
});

test('만들면 보관함에 들어가고, 모자라면 까닭을 말한다', () => {
  const v = fresh();
  assert.equal(craftProp(v, 'bench'), 'none');
  claimWorkshop(v, taken(v));
  assert.equal(craftProp(v, 'statue'), 'kind');
  assert.equal(craftProp(v, 'bench'), 'parts');
  v.workshop.parts = CRAFT_PARTS[2];
  v.coins = CRAFT_COINS[2] - 1;
  assert.equal(craftProp(v, 'lantern'), 'coins');
  v.coins = 30;
  assert.equal(craftProp(v, 'lantern', { reserve: 30 - CRAFT_COINS[2] + 1 }), 'reserve');
  assert.equal(craftProp(v, 'lantern'), null);
  assert.deepEqual([v.coins, v.workshop.parts, v.stash.lantern, v.workshop.crafted], [30 - CRAFT_COINS[2], 0, 1, 1]);
  // 흔한 소품은 부품만 든다 — 도토리가 다음 건물 몫에 묶여 있어도 만든다
  v.workshop.parts = CRAFT_PARTS[1];
  v.coins = 0;
  assert.equal(craftProp(v, 'bench', { reserve: 999 }), null);
  assert.equal(v.stash.bench, 1);
});

test('저장을 읽을 때 공방을 바로잡는다', () => {
  assert.equal(sanitizeWorkshop(null), null);
  assert.equal(sanitizeWorkshop({ sq: 'z9' }), null);
  assert.deepEqual(sanitizeWorkshop({ sq: 'e2', work: 1.26, parts: -3, made: 'x' }), { sq: 'e2', work: 1.3, parts: 0, made: 0, crafted: 0 });
  assert.equal(sanitizeVillage({ ...newVillage(), workshop: { sq: 'e2', work: 2, parts: 4 } }).workshop.parts, 4);
  assert.equal(sanitizeVillage({ ...newVillage(), workshop: undefined }).workshop, null);
});
