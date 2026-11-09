// 왕관 사다리(L-1): 칸 계산, 승급전 없음, 새끼 등급 무손실, 큰 등급 바닥, 3연승 보너스, 실력 따라가기, 약자 보상, 시즌 초기화.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START_LADDER, TIER_START, applyGame, placeOf, preview, seasonReset, targetOf } from '../src/rank/ladder.js';

test('places: 100 points a step, III→II→I, crown has no step', () => {
  assert.deepEqual([placeOf(0).tier, placeOf(0).step], ['cub', 3]);
  assert.deepEqual([placeOf(199).tier, placeOf(199).step, placeOf(199).into], ['cub', 2, 99]);
  assert.deepEqual([placeOf(300).tier, placeOf(300).step], ['adult', 3]);
  assert.deepEqual([placeOf(899).tier, placeOf(899).step], ['alpha', 1]);
  assert.deepEqual([placeOf(950).tier, placeOf(950).step, placeOf(950).into], ['crown', null, 50]);
  assert.equal(placeOf(250).pct, 0.5);
});

test('no promotion series: crossing 300 moves up at once and sets the floor', () => {
  const r = applyGame({ points: 290, floor: 0, streak: 0 }, { score: 1, me: 1500, opp: 1500 });
  assert.ok(r.after.tier === 'adult' && r.tierUp);
  assert.equal(r.state.floor, TIER_START.adult);
});

test('a cub never loses points; above cub a loss costs points but never below the tier floor', () => {
  const cub = applyGame({ points: 120, floor: 0, streak: 3 }, { score: 0, me: 1500, opp: 1500 });
  assert.equal(cub.delta, 0);
  assert.equal(cub.state.streak, 0, 'a loss ends the streak');
  const near = applyGame({ points: 305, floor: 300, streak: 0 }, { score: 0, me: 1500, opp: 1500 });
  assert.equal(near.state.points, 300);
  assert.equal(near.floored, true);
  const free = applyGame({ points: 400, floor: 300, streak: 0 }, { score: 0, me: 1500, opp: 1500 });
  assert.ok(free.delta < 0 && free.floored === false);
});

test('third win in a row gets +50%', () => {
  const s = { points: 400, floor: 300, streak: 0 };
  const plain = preview(s, 1500, 1500).win;
  const hot = preview({ ...s, streak: 2 }, 1500, 1500);
  assert.equal(hot.streakBonus, true);
  assert.equal(hot.win, Math.round(plain * 1.5));
});

test('the ladder follows skill: under-ranked wins more and loses less, over-ranked the opposite', () => {
  const me = 1700;   // 목표 750
  const low = preview({ points: 350, floor: 300, streak: 0 }, me, me);
  const high = preview({ points: 1100, floor: 900, streak: 0 }, me, me);
  assert.ok(low.win > high.win, `${low.win} > ${high.win}`);
  assert.ok(low.rawLoss < high.rawLoss);
  assert.equal(targetOf(1500), 450);
});

test('the underdog risks little and gains a lot (parent vs child)', () => {
  const s = { points: 400, floor: 300, streak: 0 };
  const child = preview(s, 1600, 2100);   // 둘 다 실력 목표 아래(따라가기 +8 같음) — 기대 승률 차이만 본다
  const parent = preview(s, 2100, 1600);
  assert.ok(child.win > parent.win && child.rawLoss < parent.rawLoss, JSON.stringify({ child, parent }));
});

test('season reset drops one big tier and clears floor and streak', () => {
  assert.deepEqual(seasonReset({ points: 780, floor: 600, streak: 4 }), { points: 300, floor: 0, streak: 0 });
  assert.deepEqual(seasonReset({ points: 1200, floor: 900, streak: 0 }), { points: 600, floor: 0, streak: 0 });
  assert.deepEqual(seasonReset({ points: 250, floor: 0, streak: 1 }), { points: 100, floor: 0, streak: 0 });
  assert.deepEqual(START_LADDER, { points: 0, floor: 0, streak: 0 });
});
