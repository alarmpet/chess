// Animal movement is decoration on top of the move: it must start and end exactly where the plain move does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LANDING_SQUASH, ROLL_PIVOT, moveStyle } from '../src/fx/moveStyle.js';

const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const SQUARES = [1, Math.SQRT2, 2, Math.hypot(1, 2), 5, 7 * Math.SQRT2];
const near = (a, b) => Math.abs(a - b) < 1e-9;

test('every style starts and lands neutral, so a piece ends upright on its square', () => {
  for (const role of ROLES) {
    for (const squares of SQUARES) {
      const a = moveStyle(role, 0, squares);
      const b = moveStyle(role, 1, squares);
      assert.ok(near(a.progress, 0) && near(b.progress, 1), role);
      for (const p of [a, b]) {
        assert.ok(near(p.lift, 0) && near(p.forward, 0) && near(p.roll, 0) && near(p.yaw, 0) && near(p.stretch, 1), role);
        assert.ok(near(Math.sin(p.pitch), 0) && near(Math.cos(p.pitch), 1), role);
      }
    }
  }
});

test('a piece never slides backwards or below the board', () => {
  for (const role of ROLES) {
    for (const squares of SQUARES) {
      let last = 0;
      for (let i = 0; i <= 200; i++) {
        const p = moveStyle(role, i / 200, squares);
        assert.ok(p.progress >= last - 1e-9 && p.progress <= 1 + 1e-9, role);
        assert.ok(p.lift >= -1e-9, role);
        last = p.progress;
      }
    }
  }
});

test('the roll turns around the belly: the body centre stays at one height', () => {
  for (let i = 0; i <= 40; i++) {
    const p = moveStyle('bishop', i / 40, 2);
    assert.ok(near(p.lift + ROLL_PIVOT * Math.cos(p.pitch), ROLL_PIVOT));
  }
});

test('the double pawn push bounces higher than a single step', () => {
  const peak = (squares) => Math.max(...Array.from({ length: 101 }, (_, i) => moveStyle('pawn', i / 100, squares).lift));
  assert.ok(peak(2) > peak(1) * 2);
});

test('an unknown piece falls back to a plain move, and every role has a landing', () => {
  assert.equal(moveStyle('dragon', 0.5, 1).lift, 0);
  for (const role of ROLES) assert.ok(LANDING_SQUASH[role] >= 0, role);
});
