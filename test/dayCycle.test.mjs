// 판의 시간 · 밀물(WG-4 · WG-5, 2026-11-19).
import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSIC_DAY_PLIES, DAY_KEYS, approach, dayLook, dayPhase, tideLevel } from '../src/fx/dayCycle.js';

test('하루는 아침 → 한낮 → 오후 → 노을 → 밤, 밤은 어둡지만 검정이 아니라 푸르다', () => {
  assert.deepEqual(DAY_KEYS.map((k) => k.name), ['아침', '한낮', '오후', '노을', '밤']);
  assert.equal(dayLook(0).name, '아침');
  assert.deepEqual(dayLook(0.3).tint, [1, 1, 1]);
  assert.equal(dayLook(1).name, '밤');
  const night = dayLook(1);
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  assert.ok(lum(night.tint) < 0.6 && lum(night.tint) > 0.35, '밤은 절반쯤 어둡다');
  assert.ok(night.tint[2] > night.tint[0] + 0.25, '밤은 푸르다(라벤더)');
  assert.ok(night.lift.every((v) => v > 0), '밤의 바닥은 검정이 아니다');
  const dusk = dayLook(0.8);
  assert.ok(dusk.tint[0] > dusk.tint[2] + 0.2, '노을은 붉다');
  // 범위 밖도 안전하다
  assert.deepEqual(dayLook(-3), dayLook(0));
  assert.deepEqual(dayLook(9), dayLook(1));
  assert.deepEqual(dayLook(NaN), dayLook(0));
});

test('색은 시간을 따라 끊기지 않고 바뀐다', () => {
  let prev = dayLook(0);
  for (let u = 0.01; u <= 1.0001; u += 0.01) {
    const now = dayLook(u);
    for (let j = 0; j < 3; j++) assert.ok(Math.abs(now.tint[j] - prev.tint[j]) < 0.06, `u=${u.toFixed(2)} 에서 튄다`);
    prev = now;
  }
});

test('판의 시간: 계약전은 48반수, 보통 체스는 80반수, 연습은 한낮', () => {
  assert.equal(dayPhase({ plies: 0, limit: 48 }), 0);
  assert.equal(dayPhase({ plies: 24, limit: 48 }), 0.5);
  assert.equal(dayPhase({ plies: 48, limit: 48 }), 1);
  assert.equal(dayPhase({ plies: 60, limit: 48 }), 1);
  assert.equal(dayPhase({ plies: 40 }), 40 / CLASSIC_DAY_PLIES);
  assert.equal(dayPhase({ plies: 30, limit: 48, puzzle: true }), 0.3);
});

test('밀물: 계약전에서만, 처음 몇 수는 그대로, 남은 차례가 줄수록 차올라 제한에서 가득', () => {
  const at = (left) => tideLevel({ pliesLeft: left, limit: 48 });
  assert.equal(at(48), 0);
  assert.equal(at(42), 0, '처음 몇 수는 평소 해변');
  assert.ok(at(24) > 0.2 && at(24) < 0.5, '절반이면 반쯤 아래');
  assert.ok(at(8) > 0.8);
  assert.equal(at(0), 1);
  for (let left = 47; left >= 0; left--) assert.ok(at(left) >= at(left + 1), '물은 빠지지 않는다(되돌리기 전에는)');
  assert.equal(tideLevel({ pliesLeft: 10, limit: 0 }), 0, '보통 체스는 밀물 없음');
  assert.equal(tideLevel({ pliesLeft: 2, limit: 48, puzzle: true }), 0, '연습 문제는 밀물 없음');
});

test('화면 값은 목표로 부드럽게 다가가고, 멈추면 정확히 닿는다', () => {
  let v = 0;
  for (let i = 0; i < 30; i++) v = approach(v, 1, 1 / 60);
  assert.ok(v > 0.4 && v < 0.6, '반 초에 절반쯤');
  for (let i = 0; i < 600; i++) v = approach(v, 1, 1 / 60);
  assert.equal(v, 1);
  assert.equal(approach(NaN, 0.7, 0.1), 0.7);
});
