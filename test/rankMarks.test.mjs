// 왕관 도장 (랭커 보상 계획서 RW-1): 첫 도달 도장 · 시즌 리본.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_TIERS, firstLine, firstStamp, newFirsts, rankMarks, ribbonLeft, ribbonText } from '../src/rank/rankMarks.js';

test('first-reach stamps come once per big tier, lowest first, and never twice', () => {
  assert.deepEqual(FIRST_TIERS, ['adult', 'alpha', 'crown']);
  assert.deepEqual(newFirsts([], 299), []);
  assert.deepEqual(newFirsts([], 300), ['adult']);
  assert.deepEqual(newFirsts([], 905), ['adult', 'alpha', 'crown'], 'a jump past two tiers gives both');
  assert.deepEqual(newFirsts(['adult'], 650), ['alpha']);
  assert.deepEqual(newFirsts(['adult', 'alpha'], 480), [], 'falling back after a season reset takes nothing away and adds nothing');
});

test('stamp names always say how to get them', () => {
  assert.deepEqual(firstStamp('alpha'), { name: '⭐ 우두머리 첫 도달', how: '사다리 600점에 한 번 닿으면' });
  assert.equal(firstStamp('crown', true).how, 'Reach 900 ladder points once');
  assert.equal(firstLine('adult'), '🎉 처음으로 🐾 성체! 도장을 받았어요');
  assert.equal(firstLine(null), null);
});

test('ribbons: one per past season with three games or more, plus this season once three games are in', () => {
  const r = {
    firsts: [{ tier: 'adult', season: 1, at: 1 }],
    trophies: [{ season: 1, tier: 'cub', peak: 120, games: 3 }, { season: 2, tier: 'adult', peak: 410, games: 9 }],
    season: { n: 3, games: 3, peak: 250, minGames: 5, ribbonGames: 3 }
  };
  const m = rankMarks(r);
  assert.deepEqual(m.firsts.map((f) => [f.tier, f.got]), [['adult', true], ['alpha', false], ['crown', false]]);
  assert.deepEqual(m.ribbons.map((x) => [x.season, x.tier, x.current]), [[3, 'cub', true], [2, 'adult', false], [1, 'cub', false]]);
  assert.equal(m.got, 4);
  assert.equal(ribbonText(m.ribbons[0]), '🎀 시즌 3 함께 둠 · 이번 시즌');
  assert.equal(ribbonText(m.ribbons[1], true), '🎀 Season 2 — played');
  const two = rankMarks({ ...r, season: { n: 3, games: 2, peak: 250, minGames: 5, ribbonGames: 3 } });
  assert.equal(two.ribbons.length, 2, 'two games: no ribbon yet');
  assert.equal(ribbonLeft({ games: 2 }), 1, 'three games for a ribbon');
  assert.equal(ribbonLeft({ games: 9 }), 0);
  assert.deepEqual(rankMarks(null).ribbons, []);
});
