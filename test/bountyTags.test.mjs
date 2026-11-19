// 현상 딱지(PP-1 ②)의 자세 곡선: 통 튀어나오고, 노릴 때만 흔들리고, 매치 포인트의 빛은 느리게 숨쉰다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GLOW_PULSE_HZ, TAG_HOT_SCALE, TAG_POP_SEC, TAG_WOBBLE_HZ, TAG_WOBBLE_RAD, tagPose } from '../src/fx/bountyTags.js';

test('붙을 때 0에서 튀어나와 1로 앉는다', () => {
  assert.equal(tagPose(0, 0, 0).scale, 0);
  assert.ok(tagPose(TAG_POP_SEC * 0.7, 0, 0).scale > 1);          // 살짝 넘쳤다가
  assert.equal(tagPose(TAG_POP_SEC, 0, 0).scale, 1);               // 제 크기
  assert.equal(tagPose(5, 0, 3.3).scale, 1);
});

test('노리지 않으면 가만히 있고, 노릴 때만 흔들리며 조금 커진다', () => {
  for (const t of [0, 0.1, 0.37, 2.2]) assert.equal(Math.abs(tagPose(1, 0, t).roll), 0);
  let max = 0;
  for (let t = 0; t < 1; t += 0.01) max = Math.max(max, Math.abs(tagPose(1, 1, t).roll));
  assert.ok(Math.abs(max - TAG_WOBBLE_RAD) < 0.01);
  assert.ok(Math.abs(tagPose(1, 1, 0).scale - TAG_HOT_SCALE) < 1e-9);
  // 번쩍임이 아니다: 초당 3번 넘게 왕복하지 않는다(광과민 기준 아래)
  assert.ok(TAG_WOBBLE_HZ <= 3);
});

test('매치 포인트의 빛은 평소에는 없고, 켜지면 느리게 숨쉬며 꺼지지 않는다', () => {
  assert.equal(tagPose(1, 0, 0.4, 0).halo, 0);
  let lo = 1, hi = 0;
  for (let t = 0; t < 1 / GLOW_PULSE_HZ; t += 0.02) { const h = tagPose(1, 0, t, 1).halo; lo = Math.min(lo, h); hi = Math.max(hi, h); }
  assert.ok(lo >= 0.4 && hi <= 0.8 && hi - lo > 0.2);
  assert.ok(GLOW_PULSE_HZ < 1);
});
