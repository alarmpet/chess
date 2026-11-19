// 기록 보강(FN-0): 판 기록이 판 하나씩 시작부터 다음 판까지 다시 그려지는가.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NEXT_GAP_S, startEntry, storyOf } from '../src/cards/sessionLog.js';

const t = (s) => new Date(Date.UTC(2026, 10, 7, 10, 0, s)).toISOString();

test('startEntry 는 사건 내용과 설정을 한 줄로 만든다', () => {
  const e = startEntry({ gameId: 7, rivalId: 'bamboo', color: 'w' }, { at: t(0), handBrain: 'adviser', blitz: true });
  assert.deepEqual(e, { type: 'start', at: t(0), gameId: 7, resumed: 0, rivalId: 'bamboo', color: 'w', handBrain: 'adviser', blitz: true });
});

test('시작 → 창 닫음 → 이어 하기 → 되감기 → 끝 → 다음 판 이 한 판으로 묶인다', () => {
  const log = [
    startEntry({ gameId: 1, color: 'w' }, { at: t(0) }),
    { type: 'leave', at: t(60), gameId: 1, ply: 9 },
    startEntry({ gameId: 1, resumed: 9, color: 'w' }, { at: t(90) }),
    { type: 'skill', at: t(120), kind: 'rewind', gameId: 1, ply: 14 },
    { type: 'game', at: t(300), gameId: 1, result: 'loss', resigned: false, plies: 40, seconds: 300 },
    { type: 'pace', at: t(300), gameId: 1, mode: 'normal', think: { 0: 900, 2: 1200 } },
    startEntry({ gameId: 2, color: 'w' }, { at: t(320) }),
    { type: 'game', at: t(600), gameId: 2, result: 'win', plies: 30 }
  ];
  const s = storyOf(log);
  assert.equal(s.games.length, 2);
  const [g] = s.games;
  assert.equal(g.resumes, 1);
  assert.deepEqual(g.leaves, [{ at: t(60), ply: 9 }]);
  assert.deepEqual(g.skills, [{ kind: 'rewind', ply: 14 }]);
  assert.equal(g.end.result, 'loss');
  assert.equal(g.pace.moves, 2);
  assert.deepEqual(g.next, { gameId: 2, gapS: 20 });
  assert.equal(s.summary.nextAfter.loss.next, 1);
  assert.equal(s.games[1].next, null);
  assert.deepEqual(s.summary.nextAfter.win, { n: 1, next: 0 });
});

test('열자마자 버린 판은 셈에서 빠지고, 수가 있는데 끝나지 않은 판은 이탈', () => {
  const log = [
    startEntry({ gameId: 1 }, { at: t(0) }),          // 한 수도 안 둠
    startEntry({ gameId: 2 }, { at: t(5) }),
    { type: 'leave', at: t(50), gameId: 2, ply: 6 },  // 6반수 두고 떠남, 다시 안 옴
    startEntry({ gameId: 3 }, { at: t(4000) })
  ];
  const s = storyOf(log);
  assert.equal(s.summary.started, 3);
  assert.equal(s.summary.played, 1);
  assert.equal(s.summary.abandoned, 1);
  assert.equal(s.games[0].gameId, 2);
});

test('끝나지 않은 판을 두고 새 판(quit)은 「새 판으로 버림」으로 센다', () => {
  const log = [
    startEntry({ gameId: 1 }, { at: t(0) }),
    { type: 'quit', at: t(30), gameId: 1, ply: 2 },
    startEntry({ gameId: 2 }, { at: t(30) })
  ];
  const s = storyOf(log);
  assert.equal(s.summary.played, 1);
  assert.equal(s.summary.quits, 1);
  assert.deepEqual(s.games[0].quit, { at: t(30), ply: 2 });
  assert.equal(s.games[0].abandoned, true);
});

test('기권은 따로 세고, 너무 늦은 다음 판은 「한 판 더」가 아니다', () => {
  const log = [
    startEntry({ gameId: 1 }, { at: t(0) }),
    { type: 'game', at: t(100), gameId: 1, result: 'loss', resigned: true, plies: 12 },
    startEntry({ gameId: 2 }, { at: t(100 + NEXT_GAP_S + 1) }),
    { type: 'game', at: t(2000), gameId: 2, result: 'draw', plies: 80 }
  ];
  const s = storyOf(log);
  assert.deepEqual(s.summary.nextAfter.resign, { n: 1, next: 0 });
  assert.equal(s.games[0].next.gapS, NEXT_GAP_S + 1);
});

test('기록이 잘려 시작 줄이 없는 판 기록·이상한 줄은 무시한다', () => {
  const s = storyOf([null, 3, { type: 'game', at: t(0), gameId: 99, result: 'win' }, { type: 'book', at: t(1) }]);
  assert.equal(s.summary.started, 0);
  assert.deepEqual(storyOf('x').games, []);
});
