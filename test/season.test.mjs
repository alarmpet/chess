// 시즌 (계획서 §4.4 L-4): 경계 시각 · 부드러운 초기화 · 쉬어도 한 번만 · 겉모습 보상.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAY_MS, SEASON_DAYS, SEASON_EPOCH, SEASON_MIN_GAMES, bestTrophy, daysLeft, rollSeason, seasonEnd, seasonOf, seasonReset, seasonStart, trophyOf
} from '../src/rank/season.js';
import { seasonLine, trophyLine, newSeasonLine } from '../src/rank/ladderText.js';

test('a season is 28 days and turns at Monday midnight in Korea', () => {
  assert.equal(SEASON_DAYS, 28);
  assert.equal(new Date(SEASON_EPOCH + 9 * 3600e3).getUTCDay(), 1, 'Monday in KST');
  assert.equal(new Date(SEASON_EPOCH + 9 * 3600e3).getUTCHours(), 0);
  assert.equal(seasonOf(SEASON_EPOCH - 1), 1, 'before the first season counts as season 1');
  assert.equal(seasonOf(SEASON_EPOCH), 1);
  assert.equal(seasonOf(seasonEnd(1) - 1), 1);
  assert.equal(seasonOf(seasonEnd(1)), 2);
  assert.equal(seasonStart(3), SEASON_EPOCH + 56 * DAY_MS);
  assert.equal(daysLeft(seasonStart(2)), 28);
  assert.equal(daysLeft(seasonEnd(2) - 1000), 1, 'last day still says 1');
});

test('the reset takes away one big tier of points, keeps cubs, clears floor and streak', () => {
  assert.deepEqual(seasonReset({ points: 780, floor: 600, streak: 4 }), { points: 480, floor: 0, streak: 0 });
  assert.deepEqual(seasonReset({ points: 1200, floor: 900, streak: 0 }), { points: 900, floor: 0, streak: 0 }, 'a crown 1200 stays a crown');
  assert.deepEqual(seasonReset({ points: 310, floor: 300, streak: 1 }), { points: 10, floor: 0, streak: 0 });
  assert.deepEqual(seasonReset({ points: 250, floor: 0, streak: 1 }), { points: 250, floor: 0, streak: 0 }, 'cubs keep their points');
  assert.deepEqual(seasonReset({ points: 780 }, 'tierStart'), { points: 300, floor: 0, streak: 0 });
  assert.deepEqual(seasonReset({ points: 780 }, 'none'), { points: 780, floor: 0, streak: 0 });
});

test('rolling a player: once per gap however many seasons passed, trophy from the peak', () => {
  const row = { points: 520, floor: 300, streak: 3, season: 1, peak: 640, sgames: 12 };
  const same = rollSeason(row, 1);
  assert.equal(same.rolled, false);
  assert.equal(same.row.points, 520);
  const r = rollSeason(row, 4);   // 세 시즌을 쉬었다
  assert.equal(r.rolled, true);
  assert.deepEqual({ points: r.row.points, floor: r.row.floor, streak: r.row.streak, season: r.row.season, peak: r.row.peak, sgames: r.row.sgames },
    { points: 220, floor: 0, streak: 0, season: 4, peak: 220, sgames: 0 }, 'one reset only');
  assert.deepEqual(r.trophy, { season: 1, tier: 'alpha', peak: 640 }, 'the frame follows the best point of the season');
  const few = rollSeason({ ...row, sgames: SEASON_MIN_GAMES - 1 }, 2);
  assert.equal(few.trophy, null, `fewer than ${SEASON_MIN_GAMES} games → no frame`);
  assert.equal(rollSeason({ points: 40, floor: 0, streak: 0 }, 3).rolled, false, 'a row with no season is taken as this season');
});

test('trophies and the season lines', () => {
  assert.equal(trophyOf({ season: 2, peak: 950, games: 5 }).tier, 'crown');
  assert.deepEqual(bestTrophy([{ season: 1, tier: 'alpha' }, { season: 2, tier: 'adult' }, { season: 3, tier: 'alpha' }]), { season: 3, tier: 'alpha' });
  assert.equal(bestTrophy([]), null);
  assert.equal(seasonLine({ n: 2, daysLeft: 12, games: 3, minGames: 5 }), '🗓️ 시즌 2 · 12일 남음 · 테두리까지 2판');
  assert.equal(seasonLine({ n: 2, daysLeft: 1, games: 7, minGames: 5 }), '🗓️ 시즌 2 · 오늘 끝나요');
  assert.equal(seasonLine({ n: 2, daysLeft: 12, games: 3, minGames: 5 }, true), '🗓️ Season 2 · 12 days left · 2 games to a frame');
  assert.equal(trophyLine({ season: 1, tier: 'alpha' }), '🏅 시즌 1 ⭐ 우두머리 테두리');
  assert.equal(newSeasonLine({ n: 2, games: 0 }, [{ season: 1, tier: 'adult' }]), '시즌 1 끝! 🐾 성체 테두리를 받았어요 · 새 시즌이 시작됐어요');
  assert.equal(newSeasonLine({ n: 2, games: 1 }, [{ season: 1, tier: 'adult' }]), null, 'gone after the first game of the new season');
  assert.equal(newSeasonLine({ n: 3, games: 0 }, [{ season: 1, tier: 'adult' }]), null, 'only the season just ended');
});
