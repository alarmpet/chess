// Glicko-2 (LA-R R-2): Glickman 2012 논문의 예제 값과 맞는지, 한 판 갱신이 대칭이고 상식대로 움직이는지.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { START, rate, rateGame, badgeOf, RD_MIN } from '../src/rank/glicko2.js';

test('matches the worked example in Glickman’s Glicko-2 paper', () => {
  // 1500/200/0.06 이 1400/30 에 이기고, 1550/100·1700/300 에 진다. τ = 0.5.
  // 논문 값: r' = 1464.06, RD' = 151.52, σ' = 0.05999
  const r = rate({ rating: 1500, rd: 200, vol: 0.06 }, [
    { rating: 1400, rd: 30, score: 1 },
    { rating: 1550, rd: 100, score: 0 },
    { rating: 1700, rd: 300, score: 0 }
  ], 0.5);
  assert.ok(Math.abs(r.rating - 1464.06) < 0.05, `rating ${r.rating}`);
  assert.ok(Math.abs(r.rd - 151.52) < 0.05, `rd ${r.rd}`);
  assert.ok(Math.abs(r.vol - 0.05999) < 0.00001, `vol ${r.vol}`);
});

test('one game between newcomers: winner up, loser down by the same amount, both less uncertain', () => {
  const { white, black } = rateGame(START, START, 1);
  assert.ok(white.rating > 1500 && black.rating < 1500);
  assert.ok(Math.abs((white.rating - 1500) - (1500 - black.rating)) < 1e-6);
  assert.ok(white.rd < 350 && black.rd < 350);
  const draw = rateGame(START, START, 0.5);
  assert.ok(Math.abs(draw.white.rating - 1500) < 1e-6 && Math.abs(draw.black.rating - 1500) < 1e-6);
});

test('beating a much stronger player moves more than beating a weaker one, and RD never drops below the floor', () => {
  const me = { rating: 1500, rd: 80, vol: 0.06 };
  const upset = rateGame(me, { rating: 1900, rd: 80, vol: 0.06 }, 1).white.rating - 1500;
  const easy = rateGame(me, { rating: 1100, rd: 80, vol: 0.06 }, 1).white.rating - 1500;
  assert.ok(upset > easy * 3, `upset ${upset} vs easy ${easy}`);
  let p = { ...START };
  const q = { ...START };
  for (let i = 0; i < 300; i++) p = rateGame(p, q, 0.5).white;
  assert.ok(p.rd >= RD_MIN);
});

test('badge needs five games first', () => {
  assert.equal(badgeOf(2100, 4), 'cub');
  assert.equal(badgeOf(1500, 5), 'adult');
  assert.equal(badgeOf(1800, 9), 'alpha');
  assert.equal(badgeOf(2050, 9), 'crown');
});
