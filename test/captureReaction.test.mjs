// CX-2: 잡힌 동물 반응 5종 — 길이는 예전 퇴장과 같고, 자세는 이어지고, 다섯이 서로 다르다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REACTION_TOTAL, REACT_SEC, REACTION_TYPES, reactionPose } from '../src/fx/captureReaction.js';

const KEYS = ['back', 'up', 'tilt', 'roll', 'spin', 'toStorage', 'scale'];
const sample = (type, n = 250) => Array.from({ length: n + 1 }, (_, i) => reactionPose(type, (i / n) * REACTION_TOTAL));

test('takes no longer than the old exit, and starts where the piece stood', () => {
  assert.equal(REACTION_TOTAL, 1.25);
  assert.ok(REACT_SEC < REACTION_TOTAL / 2);
  for (const type of REACTION_TYPES) {
    const p = reactionPose(type, 0);
    for (const k of ['back', 'up', 'tilt', 'roll', 'spin', 'toStorage']) assert.ok(Math.abs(p[k]) < 1e-9, `${type}.${k}`);
    assert.equal(p.scale, 1);
    const last = reactionPose(type, REACTION_TOTAL);
    assert.equal(last.toStorage, 1);
    assert.ok(Math.abs(last.scale) < 1e-9, type);
  }
});

test('no jumps: every frame moves a little (60 fps steps)', () => {
  for (const type of REACTION_TYPES) {
    const s = sample(type, 75);
    for (let i = 1; i < s.length; i++) {
      // 한 프레임에 0.2칸 이하(미어캣이 가장 빨리 뜬다: 약 0.13칸).
      for (const k of ['back', 'up', 'toStorage']) assert.ok(Math.abs(s[i][k] - s[i - 1][k]) < 0.2, `${type} ${k} @${i}`);
      // 회전은 한 프레임에 1/4 바퀴를 넘지 않는다. 각도는 한 바퀴 단위로 같은 자세라 그 차이로 잰다.
      for (const k of ['tilt', 'roll', 'spin']) {
        const d = s[i][k] - s[i - 1][k];
        assert.ok(Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) < Math.PI / 2, `${type} ${k} @${i}`);
      }
    }
  }
});

test('stays near its square while reacting (at most a square and a bit)', () => {
  for (const type of REACTION_TYPES) for (const p of sample(type)) {
    assert.ok(p.back >= -0.01 && p.back <= 1.2, type);
    assert.ok(p.up >= -1e-9 && p.up <= 1.2, type);
  }
});

test('the five animals react differently: weight shows in how far and how high', () => {
  const sig = Object.fromEntries(REACTION_TYPES.map((t) => {
    const r = sample(t).filter((_, i, a) => i <= a.length * (REACT_SEC / REACTION_TOTAL));
    const max = (k) => Math.max(...r.map((p) => Math.abs(p[k])));
    return [t, { back: r.at(-1).back, up: max('up'), tilt: max('tilt'), roll: max('roll'), spin: max('spin') }];
  }));
  // 가벼운 미어캣이 가장 멀리·높이, 무거운 코뿔소가 가장 덜 밀린다.
  assert.ok(sig.pawn.back > sig.knight.back && sig.pawn.back > sig.rook.back);
  assert.ok(sig.pawn.up >= Math.max(sig.knight.up, sig.bishop.up, sig.rook.up, sig.queen.up));
  assert.ok(sig.rook.back < 0.25 && sig.rook.up === 0 && sig.rook.roll > 1.4);
  // 미어캣만 팽이처럼 돌고, 판다는 바닥에서 두 바퀴, 호랑이는 공중에서 한 바퀴.
  assert.ok(sig.pawn.spin > 10 && sig.bishop.spin === 0 && sig.queen.spin === 0);
  assert.ok(sig.bishop.tilt > 12 && sig.bishop.up < 0.35);
  assert.ok(sig.queen.tilt > 6 && sig.queen.tilt < 7 && sig.queen.up > 0.7);
  // 서로 같은 서명이 없다.
  const keys = Object.values(sig).map((s) => KEYS.filter((k) => k in s).map((k) => s[k].toFixed(2)).join());
  assert.equal(new Set(keys).size, REACTION_TYPES.length);
});

test('every capturable kind has its own reaction; the king falls back to the pawn one', () => {
  assert.deepEqual([...REACTION_TYPES].sort(), ['bishop', 'knight', 'pawn', 'queen', 'rook']);
  assert.deepEqual(reactionPose('king', 0.3), reactionPose('pawn', 0.3));
});

test('a fallen rhino slides out lying down; the others are upright again as they leave', () => {
  const mid = REACT_SEC + (REACTION_TOTAL - REACT_SEC) * 0.5;
  assert.ok(reactionPose('rook', mid).roll > 1.4);
  for (const t of ['pawn', 'knight', 'bishop', 'queen']) {
    const p = reactionPose(t, mid);
    assert.ok(Math.abs(p.tilt) < 1e-9 && Math.abs(p.roll) < 1e-9, t);
  }
});
