// 라이벌 = 난이도(FN-2): 첫 판 쉬움, 연패 제안, 쉬움에서 이기면 위 단계 제안. 팩의 단계 표시.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIRST_EASY_GAMES, FREE_PLAY, STREAK, freePlayFor, lossStreak, suggestAfter } from '../src/cards/rivalLadder.js';
import { LEVELS } from '../src/rules/ai.js';

const pack = JSON.parse(readFileSync(new URL('../public/packs/legend/pack.json', import.meta.url), 'utf8'));
const rivals = pack.rivals.map((r) => ({ id: r.id, stage: r.stage }));

test('첫 판들은 쉬움, 그 뒤 보통', () => {
  assert.equal(freePlayFor(0), FREE_PLAY.easy);
  assert.equal(freePlayFor(FIRST_EASY_GAMES - 1), FREE_PLAY.easy);
  assert.equal(freePlayFor(FIRST_EASY_GAMES), FREE_PLAY.normal);
  assert.equal(freePlayFor(undefined), FREE_PLAY.easy);
  for (const f of Object.values(FREE_PLAY)) assert.ok(LEVELS[f.search]);
});

test('연패는 끝에서부터 패배만 센다', () => {
  const g = (result) => ({ type: 'game', result });
  assert.equal(lossStreak([g('win'), g('loss'), { type: 'pace' }, g('loss'), g('loss')]), 3);
  assert.equal(lossStreak([g('loss'), g('draw')]), 0);
  assert.equal(lossStreak('x'), 0);
});

test('세 판 연속 지면 한 단계 쉬운 라이벌을, 쉬움에서는 아무것도 권하지 않는다', () => {
  const s = suggestAfter({ result: 'loss', streak: STREAK, stage: 'normal', rivals });
  assert.equal(s.kind, 'easier');
  assert.equal(s.stage, 'easy');
  assert.equal(suggestAfter({ result: 'loss', streak: STREAK - 1, stage: 'normal', rivals }), null);
  assert.equal(suggestAfter({ result: 'loss', streak: 9, stage: 'easy', rivals }), null);
  const hard = suggestAfter({ result: 'loss', streak: STREAK, stage: 'hard', rivals });
  assert.equal(hard.stage, 'normal');
});

test('쉬움에서 이기면 보통 라이벌을 권하고, 보통에서 이기면 권하지 않는다', () => {
  const s = suggestAfter({ result: 'win', stage: 'easy', rivals });
  assert.equal(s.kind, 'harder');
  assert.equal(s.stage, 'normal');
  assert.equal(suggestAfter({ result: 'win', stage: 'normal', rivals }), null);
  assert.equal(suggestAfter({ result: 'draw', stage: 'easy', rivals }), null);
});

test('팩의 라이벌 세 단계가 하나씩, 성격 한 줄과 탐색 단계가 있다', () => {
  assert.deepEqual(pack.rivals.map((r) => r.stage).sort(), ['easy', 'hard', 'normal']);
  for (const r of pack.rivals) {
    assert.ok(r.style?.ko && r.style?.en, `${r.id} 성격 한 줄`);
    assert.ok(LEVELS[r.search], `${r.id} 탐색 단계`);
  }
});
