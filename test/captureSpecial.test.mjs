// CX-4 맞대결 특례: 거울 대결·사자 포효·폰 콤보.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBO_MAX_STEPS, MIRROR_SHARE, MIRROR_TYPES, ROAR_REACH, ROAR_SEC, ROAR_TILT,
  countPawnTrades, isMirror, mirrorPose, momentumSteps, pawnComboPitch, roarSway
} from '../src/fx/captureSpecial.js';
import { attackWindPose } from '../src/fx/attackStyle.js';

const ATTACKERS = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const VICTIMS = ['pawn', 'knight', 'bishop', 'rook', 'queen'];

test('거울 대결은 30칸 중 4칸(나이트·비숍·룩·퀸 같은 종끼리)뿐이다', () => {
  const cells = [];
  for (const a of ATTACKERS) for (const v of VICTIMS) if (isMirror(a, v)) cells.push(`${a}>${v}`);
  assert.deepEqual(cells, ['knight>knight', 'bishop>bishop', 'rook>rook', 'queen>queen']);
});

test('따라 하기는 0에서 시작해 타격 지점 전에 중립으로 풀리고, 끊기지 않는다', () => {
  for (const type of MIRROR_TYPES) {
    for (const contact of [0.5, 0.6, 0.7]) {
      const at = (u) => mirrorPose(type, u, contact);
      assert.ok(Math.abs(at(contact).stretch - 1) < 1e-9, `${type} stretch 타격 때 원래 크기`);
      for (const key of ['lift', 'pitch', 'roll', 'yaw']) {
        assert.ok(Math.abs(at(0)[key]) < 1e-9, `${type} ${key} 시작`);
        assert.ok(Math.abs(at(contact)[key]) < 1e-9, `${type} ${key} 타격 때 중립`);
        assert.ok(Math.abs(at(1)[key]) < 1e-9, `${type} ${key} 끝`);
      }
      const n = 72;
      for (let i = 1; i <= n; i++) {
        const a = at((i - 1) / n);
        const b = at(i / n);
        for (const key of ['pitch', 'roll', 'yaw']) assert.ok(Math.abs(b[key] - a[key]) < 0.08, `${type} ${key} 프레임 ${i}`);
        assert.ok(Math.abs(b.lift - a.lift) < 0.01, `${type} lift 프레임 ${i}`);
      }
    }
  }
});

test('따라 하기는 공격자 준비 자세의 절반이고, 판다는 앞으로 숙이는 시늉이다', () => {
  const c = 0.6;
  const windEnd = c * 0.7;
  for (const type of ['knight', 'rook', 'queen']) {
    const w = attackWindPose(type, 0.5);
    const m = mirrorPose(type, windEnd * 0.5, c);
    assert.ok(Math.abs(m.pitch - w.pitch * MIRROR_SHARE) < 1e-9, type);
  }
  const panda = mirrorPose('bishop', windEnd, c);
  assert.ok(panda.pitch > 0.3 && panda.pitch < 0.4, `판다 숙임 ${panda.pitch}`);
  // 같은 종이 아니면 아무 자세도 없다
  assert.deepEqual(mirrorPose('pawn', 0.3, c), { lift: 0, pitch: 0, roll: 0, yaw: 0, stretch: 1 });
});

test('포효 흔들림: 0에서 시작해 0으로 끝나고, 가까울수록 크며, 두 칸 밖은 없다', () => {
  for (const d of [1, 2]) {
    assert.equal(roarSway(d, 0), 0);
    assert.equal(roarSway(d, ROAR_SEC), 0);
    let peak = 0;
    let prev = 0;
    for (let i = 1; i < 200; i++) {
      const v = roarSway(d, (i / 200) * ROAR_SEC);
      peak = Math.max(peak, Math.abs(v));
      assert.ok(Math.abs(v - prev) < 0.02, `거리 ${d} 프레임 ${i}`);
      prev = v;
    }
    assert.ok(peak <= ROAR_TILT / d + 1e-9 && peak > ROAR_TILT / d * 0.4, `거리 ${d} 최대 ${peak}`);
  }
  assert.ok(Math.abs(roarSway(1, 0.08)) > Math.abs(roarSway(2, 0.08)));
  assert.equal(roarSway(0, 0.1), 0, '잡힌 칸 자체는 흔들지 않는다');
  assert.equal(roarSway(ROAR_REACH + 1, 0.1), 0);
  assert.ok(ROAR_SEC <= 0.48, '공격이 끝나기 전에 멈춘다(시간을 늘리지 않음)');
});

test('폰 콤보: 첫 번째는 원래 음, 반음씩 올라 7반음에서 멈춘다', () => {
  assert.equal(pawnComboPitch(1), 1);
  assert.ok(Math.abs(pawnComboPitch(2) - 2 ** (1 / 12)) < 1e-12);
  for (let n = 2; n <= COMBO_MAX_STEPS + 1; n++) assert.ok(pawnComboPitch(n) > pawnComboPitch(n - 1));
  assert.equal(pawnComboPitch(20), pawnComboPitch(COMBO_MAX_STEPS + 1));
  assert.ok(pawnComboPitch(20) < 1.5);
});

test('폰끼리 잡기 세기: 다른 잡기와 조용한 수는 세지 않는다', () => {
  const h = [
    { piece: 'p', san: 'e4' },
    { piece: 'p', san: 'd5' },
    { piece: 'p', captured: 'p', san: 'exd5' },
    { piece: 'q', captured: 'p', san: 'Qxd5' },
    { piece: 'p', captured: 'n', san: 'bxc3' },
    { piece: 'p', captured: 'p', san: 'exd6', flags: 'e' }
  ];
  assert.equal(countPawnTrades(h), 2);
  assert.equal(countPawnTrades([]), 0);
});

test('momentum ladder: a side climbs while it keeps capturing or checking, a quiet move resets it (DR-1a)', () => {
  const w = (san, captured) => ({ color: 'w', san, captured });
  const b = (san, captured) => ({ color: 'b', san, captured });
  assert.equal(momentumSteps([], 'w'), 0);
  assert.equal(momentumSteps([w('e4'), b('d5')], 'w'), 0, 'last own move quiet');
  assert.equal(momentumSteps([w('e4'), b('d5'), w('exd5', 'p')], 'w'), 1);
  assert.equal(momentumSteps([w('exd5', 'p'), b('Nf6'), w('Bb5+'), b('c6'), w('dxc6', 'p')], 'w'), 3, 'capture, check, capture — the other side is skipped');
  assert.equal(momentumSteps([w('Qxf7#', 'p')], 'w'), 1, 'mate counts as a check too');
  assert.equal(momentumSteps([w('exd5', 'p'), b('Nf6'), w('Nc3'), b('a6'), w('Bxa6', 'p')], 'w'), 1, 'a quiet move in between starts over');
  assert.equal(momentumSteps([w('exd5', 'p'), b('Qxd5', 'p')], 'b'), 1, 'each side keeps its own ladder');
  assert.equal(pawnComboPitch(momentumSteps([w('exd5', 'p'), b('a6'), w('Bb5+')], 'w')), 2 ** (1 / 12), 'the second step is a semitone up');
});
