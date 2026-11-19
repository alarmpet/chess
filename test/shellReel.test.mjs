// 소라 릴(PP-1)의 시간표와 파도타기 곡선.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REEL_HOLD, REEL_RISE, REEL_SINK, REEL_SQUASH_SEC, REEL_STAGGER, REEL_STOPS, REEL_TOTAL, WAVE_HOP_SEC,
  hopHeight, reelPose, waveDelay
} from '../src/fx/shellReel.js';

test('마지막 멈춤이 계획서의 1.2~1.8초 안이고, 멈춤은 쿵·쿵·쾅 차례다', () => {
  assert.ok(REEL_STOPS[2] >= 1.2 && REEL_STOPS[2] <= 1.8);
  assert.ok(REEL_STOPS[0] < REEL_STOPS[1] && REEL_STOPS[1] < REEL_STOPS[2]);
  // 세 소라가 다 솟은 뒤에 첫 멈춤이 온다
  assert.ok(2 * REEL_STAGGER + REEL_RISE <= REEL_STOPS[0]);
  assert.equal(REEL_TOTAL, REEL_STOPS[2] + REEL_HOLD + REEL_SINK);
});

test('소라는 물속에서 솟아 멈추고, 끝에는 다시 물속이다', () => {
  for (let i = 0; i < 3; i++) {
    assert.equal(reelPose(i, 0).rise, 0);
    assert.equal(reelPose(i, 0).spinning, true);
    assert.ok(Math.abs(reelPose(i, REEL_STOPS[i] - 0.01).rise - 1) < 0.02);
    assert.equal(reelPose(i, REEL_STOPS[i] - 0.001).spinning, true);
    assert.equal(reelPose(i, REEL_STOPS[i]).spinning, false);
    assert.ok(Math.abs(reelPose(i, REEL_TOTAL).rise) < 1e-9);
  }
  // 뒤 소라는 늦게 솟는다
  assert.ok(reelPose(0, 0.1).rise > reelPose(2, 0.1).rise);
});

test('멈춘 직후에만 눌렸다 펴진다', () => {
  assert.equal(reelPose(0, REEL_STOPS[0] - 0.01).squash, 0);
  assert.ok(reelPose(0, REEL_STOPS[0] + REEL_SQUASH_SEC / 2).squash > 0.99);
  assert.equal(reelPose(0, REEL_STOPS[0] + REEL_SQUASH_SEC + 0.01).squash, 0);
});

test('건너뛰면 가라앉기가 앞당겨진다', () => {
  const early = REEL_STOPS[2] + 0.45;
  assert.ok(Math.abs(reelPose(1, early + REEL_SINK, early).rise) < 1e-9);
  assert.ok(reelPose(1, early + REEL_SINK).rise > 0.9);   // 건너뛰지 않았으면 아직 떠 있다
});

test('폴짝은 0에서 올라갔다 0으로 돌아오고, 먼 말이 늦게 뛴다', () => {
  assert.equal(hopHeight(0), 0);
  assert.equal(hopHeight(1), 0);
  assert.equal(hopHeight(-0.5), 0);
  assert.equal(hopHeight(1.5), 0);
  assert.ok(Math.abs(hopHeight(0.5) - 1) < 1e-9);
  assert.equal(waveDelay(0), 0);
  assert.ok(waveDelay(8) > waveDelay(2));
  // 판 대각선 끝(약 11칸)의 말도 다음 멈춤(0.3초 뒤) 전에 뛰기 시작한다는 보장은 없다 — 대신 마지막 폴짝이 릴보다 먼저 끝난다
  assert.ok(waveDelay(12) + WAVE_HOP_SEC < REEL_HOLD + REEL_SINK);
});
