// 왕관 슬롯머신(2026-11-18)의 시간표와 그림 띠 곡선.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SLOT_DECEL, SLOT_HOLD, SLOT_LEAVE, SLOT_ORDER, SLOT_SPEED, SLOT_STOPS, SLOT_TOTAL, slotBounce, slotRemaining, slotTarget } from '../src/fx/slotMachine.js';

test('릴은 쿵 · 쿵 · … 쾅 차례로 멈추고, 마지막은 뜸을 들인다', () => {
  assert.ok(SLOT_STOPS[0] < SLOT_STOPS[1] && SLOT_STOPS[1] < SLOT_STOPS[2]);
  assert.ok(SLOT_STOPS[2] - SLOT_STOPS[1] > SLOT_STOPS[1] - SLOT_STOPS[0], '셋째 릴이 가장 오래 끈다');
  assert.ok(SLOT_DECEL[2] > SLOT_DECEL[0] * 2, '셋째 릴은 천천히 선다');
  // 「너무 짧다」에 대한 답: 당긴 뒤 마지막 멈춤까지 3초 이상, 다 합쳐 7초 안
  assert.ok(SLOT_STOPS[2] >= 3 && SLOT_TOTAL <= 7);
  assert.equal(SLOT_TOTAL, SLOT_STOPS[2] + SLOT_HOLD + SLOT_LEAVE);
});

test('그림 띠는 등속으로 돌다가 끊김 없이 느려져 멈출 자리에 정확히 선다', () => {
  for (let i = 0; i < 3; i++) {
    let prev = slotRemaining(i, 0);
    assert.ok(prev > 8, '시작할 때 여러 바퀴가 남아 있다');
    for (let t = 0.01; t <= SLOT_STOPS[i] + 0.2; t += 0.01) {
      const left = slotRemaining(i, t);
      assert.ok(left <= prev + 1e-9, '거꾸로 돌지 않는다');
      assert.ok(prev - left <= SLOT_SPEED * 0.01 + 1e-6, '한 프레임에 가장 빠른 속도보다 더 가지 않는다(튀지 않는다)');
      prev = left;
    }
    assert.equal(slotRemaining(i, SLOT_STOPS[i]), 0);
    assert.equal(slotRemaining(i, SLOT_STOPS[i] + 5), 0);
    // 감속 구간의 시작에서 값이 이어진다
    const edge = SLOT_STOPS[i] - SLOT_DECEL[i];
    assert.ok(Math.abs(slotRemaining(i, edge - 1e-6) - slotRemaining(i, edge + 1e-6)) < 1e-3);
  }
});

test('멈출 자리는 그 종류의 그림이고, 되튐은 작고 곧 가라앉는다', () => {
  for (const type of SLOT_ORDER) {
    const at = slotTarget(type);
    assert.ok(Number.isInteger(at));
    assert.equal(SLOT_ORDER[at % SLOT_ORDER.length], type);
  }
  assert.equal(slotBounce(0), 0);
  assert.equal(slotBounce(0.6), 0);
  for (let u = 0.01; u < 0.45; u += 0.01) assert.ok(Math.abs(slotBounce(u)) < 0.2, '그림 반 칸도 넘지 않는다');
});
