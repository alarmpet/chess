// CX-3: 잡는 동물의 공격 동작 6종 — 양 끝은 중립, 끊김 없음, 타격 때 가장 세고, 여섯이 서로 다르다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ATTACK_TYPES, attackStyle } from '../src/fx/attackStyle.js';

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
// 실제 값: 타격까지 약 0.71초 + 타격 뒤 0.48초 → 타격 지점은 공격 구간의 약 0.6 (ATTACK_SYNC_PROFILES).
const CONTACTS = [0.5, 0.6, 0.7];

test('all six attackers have a style; unknown kinds stay neutral', () => {
  assert.deepEqual([...ATTACK_TYPES].sort(), ['bishop', 'king', 'knight', 'pawn', 'queen', 'rook']);
  assert.deepEqual(attackStyle('dragon', 0.5), { lift: 0, forward: 0, pitch: 0, roll: 0, yaw: 0, stretch: 1 });
});

test('neutral at both ends, so the approach and the walk-in join without a jump', () => {
  for (const t of ATTACK_TYPES) for (const c of CONTACTS) for (const u of [0, 1]) {
    const p = attackStyle(t, u, c);
    for (const k of ['lift', 'forward', 'roll', 'yaw']) assert.ok(Math.abs(p[k]) < 1e-6, `${t} ${k} u=${u}`);
    assert.ok(Math.abs(wrap(p.pitch)) < 1e-6, `${t} pitch u=${u}`);
    assert.ok(Math.abs(p.stretch - 1) < 1e-6, `${t} stretch u=${u}`);
  }
});

test('no jumps between 60 fps frames (strike window about 1.2 s)', () => {
  const n = 72;
  for (const t of ATTACK_TYPES) for (const c of CONTACTS) {
    let prev = attackStyle(t, 0, c);
    for (let i = 1; i <= n; i++) {
      const p = attackStyle(t, i / n, c);
      // 판다 구르기가 가장 빠르다(한 프레임 약 0.05, 칸의 15%).
      for (const k of ['lift', 'forward']) assert.ok(Math.abs(p[k] - prev[k]) < 0.07, `${t} ${k} @${i}`);
      assert.ok(Math.abs(p.stretch - prev.stretch) < 0.12, `${t} stretch @${i}`);
      for (const k of ['pitch', 'roll', 'yaw']) assert.ok(Math.abs(wrap(p[k] - prev[k])) < 0.8, `${t} ${k} @${i}`);
      prev = p;
    }
  }
});

test('stays small enough not to walk into the piece it hits', () => {
  for (const t of ATTACK_TYPES) for (let i = 0; i <= 100; i++) {
    const p = attackStyle(t, i / 100, 0.55);
    assert.ok(Math.abs(p.forward) <= 0.21 && p.lift >= -1e-9 && p.lift <= 0.41, t);
    assert.ok(p.stretch > 0.8 && p.stretch < 1.25, t);
  }
});

test('the six attacks look different at the moment of the blow', () => {
  const at = Object.fromEntries(ATTACK_TYPES.map((t) => [t, attackStyle(t, 0.55, 0.55)]));
  // 박치기·들이받기는 앞으로 숙이고, 캥거루 발차기는 뒤로 젖힌다.
  assert.ok(at.pawn.pitch > 0.4 && at.rook.pitch > 0.3);
  assert.ok(at.knight.pitch < -0.4 && at.knight.lift > 0.05);
  // 호랑이만 몸을 비튼다.
  assert.ok(at.queen.roll > 0.2 && ATTACK_TYPES.filter((t) => t !== 'queen').every((t) => Math.abs(at[t].roll) < 1e-9));
  // 사자가 가장 크게 가슴을 편다.
  assert.ok(ATTACK_TYPES.every((t) => t === 'king' || at[t].stretch < at.king.stretch));
  const sig = ATTACK_TYPES.map((t) => ['pitch', 'roll', 'stretch', 'lift'].map((k) => at[t][k].toFixed(2)).join());
  assert.equal(new Set(sig).size, 6);
  // 판다는 타격까지 한 바퀴를 구른다(중간에 거꾸로 선다).
  assert.ok(Math.abs(wrap(attackStyle('bishop', 0.275, 0.55).pitch)) > 3);
  // 사자는 타격 뒤 갈기를 흔든다.
  assert.ok(Math.abs(attackStyle('king', 0.62, 0.55).yaw) > 0.1);
});
