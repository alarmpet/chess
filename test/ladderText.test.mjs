// 왕관 사다리 화면 글자(L-2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ladderLine, placeChip, placeName, stakesLine, toNext } from '../src/rank/ladderText.js';
import { applyGame, placeOf, preview } from '../src/rank/ladder.js';

test('place names and chips', () => {
  assert.equal(placeName(placeOf(437)), '🐾 성체 II');
  assert.equal(placeName(placeOf(950), true), '👑 Crown');
  assert.equal(placeChip(placeOf(437)), '🐾II 437');
  assert.equal(toNext(placeOf(437)), '다음 칸까지 63점');
  assert.equal(toNext(placeOf(950)), null);
});

test('stakes before a game: a cub hears it cannot drop', () => {
  assert.equal(stakesLine({ win: 28, loss: 0, streakBonus: false }), '이기면 +28 · 져도 그대로');
  assert.equal(stakesLine({ win: 30, loss: 12, streakBonus: true }), '이기면 +30 🔥 · 지면 −12');
  const pv = preview({ points: 50, floor: 0, streak: 0 }, 1500, 1500);
  assert.match(stakesLine(pv), /져도 그대로/);
});

test('after-game line: step up, streak, floor, praise after a loss', () => {
  const up = applyGame({ points: 290, floor: 0, streak: 2 }, { score: 1, me: 1600, opp: 1500 });
  assert.match(ladderLine({ ...up, place: up.after, streak: up.state.streak }), /^\+\d+ 🔥3연승 · ⬆ 🐾 성체 III!$/);
  const held = applyGame({ points: 305, floor: 300, streak: 0 }, { score: 0, me: 1500, opp: 1500 });
  assert.equal(ladderLine({ ...held, place: held.after, streak: 0 }), '−5 · 🐾 성체 III · 🛡️ 바닥 지킴 · 끝까지 잘 뒀어요');
  const cub = applyGame({ points: 40, floor: 0, streak: 0 }, { score: 0, me: 1500, opp: 1500 });
  assert.equal(ladderLine({ ...cub, place: cub.after, streak: 0 }), '±0 · 🍼 새끼 III · 새끼 칸은 안 잃어요 · 끝까지 잘 뒀어요');
});
