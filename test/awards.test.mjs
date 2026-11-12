// 친구 무대 시즌 상(RW-3) · 과정 도장(RW-4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYED_STEPS, STAGE_MIN, awardText, featLine, processStamps, seasonStats, stageAwards, upsetFeat } from '../src/rank/awards.js';

const g = (white, black, at, wb, wa, bb, ba) => ({ white, black, at, ladder: { white: { before: wb, after: wa }, black: { before: bb, after: ba } } });
// 부모 P 가 늘 높고, 아이 K 는 많이 오르고, 친구 F 는 조금. 나 = K.
const rows = [
  g('P', 'K', 1, 700, 702, 50, 80), g('K', 'F', 2, 80, 110, 200, 190), g('P', 'K', 3, 702, 690, 110, 140),
  g('K', 'F', 4, 140, 170, 190, 180), g('F', 'P', 5, 180, 205, 690, 688), g('K', 'P', 6, 170, 200, 688, 690)
];

test('season stats follow each person through their own games', () => {
  const s = seasonStats(rows);
  assert.deepEqual(s.get('K'), { games: 5, peak: 200, start: 50, end: 200, gain: 150 });
  assert.equal(s.get('P').peak, 702);
  assert.equal(s.get('F').gain, 5);
});

test('stage awards: the top goes to the highest peak, most improved skips a lone top', () => {
  assert.deepEqual(stageAwards('K', rows), [{ kind: 'rise', size: 3 }], 'the child is most improved');
  assert.deepEqual(stageAwards('P', rows, { minGames: 3 }), [{ kind: 'top', size: 3 }], 'the parent is #1 but not also most improved');
  assert.deepEqual(stageAwards('F', rows, { minGames: 3 }), [], 'F neither');
  assert.deepEqual(stageAwards('K', rows.slice(0, 2), { minGames: 1 }), [{ kind: 'rise', size: 3 }]);
  assert.deepEqual(stageAwards('K', rows.filter((r) => r.white !== 'F' && r.black !== 'F'), { minGames: 1 }), [], `fewer than ${STAGE_MIN} people → no awards`);
  assert.deepEqual(stageAwards('K', rows.slice(0, 3)), [], 'fewer than five games of my own → no awards');
  // 함께 1등: 둘의 최고 점수가 같으면 둘 다
  const tie = [g('A', 'B', 1, 300, 330, 330, 300), g('B', 'C', 2, 300, 330, 100, 90), g('A', 'C', 3, 330, 320, 90, 95)];
  assert.ok(stageAwards('A', tie, { minGames: 1 }).some((a) => a.kind === 'top'));
  assert.ok(stageAwards('B', tie, { minGames: 1 }).some((a) => a.kind === 'top'));
});

test('award and stamp texts', () => {
  assert.equal(awardText({ season: 2, kind: 'top', size: 4 }), '🏆 시즌 2 무대 1등 · 4명');
  assert.equal(awardText({ season: 2, kind: 'rise', size: 4 }, true), '🌱 Season 2 most improved · 4');
  assert.equal(featLine('upset-win'), '🦁 더 높은 등급 친구에게 첫 승! 도장을 받았어요');
  assert.equal(featLine(null), null);
});

test('process stamps: games played to the end and first upsets, never taken away', () => {
  assert.equal(upsetFeat(150, 450, 1), 'upset-win', 'cub beats adult');
  assert.equal(upsetFeat(150, 450, 0.5), 'upset-draw');
  assert.equal(upsetFeat(150, 450, 0), null);
  assert.equal(upsetFeat(350, 450, 1), null, 'same tier is not an upset');
  assert.deepEqual(PLAYED_STEPS, [10, 30, 100]);
  const st = processStamps(31, ['adult', 'upset-draw']);
  assert.deepEqual(st.map((x) => [x.key, x.got]), [['played-10', true], ['played-30', true], ['played-100', false], ['upset-win', false], ['upset-draw', true]]);
  assert.equal(st[2].how, '69판 남음');
  assert.equal(st[3].how, '나보다 높은 등급 친구를 이기면');
});
