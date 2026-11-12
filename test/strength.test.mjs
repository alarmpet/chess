// 딱 맞는 AI(DR-M1): 7단계 표 · 실력 점수 · 한 칸씩 · 되돌리기 · 고정 · 사람 같은 못 보기.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AIM, HOLD_GAMES, STEPS, STEP_COUNT, afterGame, changeLine, expectedScore, freePlayOf, loadSkill, newSkill, pickStep,
  ratingOfStep, recommendStep, sanitizeSkill, saveSkill, setAuto, stepLabel, undoChange
} from '../src/rules/strength.js';
import { chooseMove, hardToSee } from '../src/rules/ai.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('seven steps, each stronger, in the engine shape', () => {
  assert.equal(STEP_COUNT, 7);
  for (let i = 1; i < STEPS.length; i++) assert.ok(ratingOfStep(i + 1) > ratingOfStep(i));
  assert.deepEqual(freePlayOf(1), { search: 'easy', mistake: STEPS[0].slip, blind: STEPS[0].blind, stage: 'easy', step: 1 });
  assert.equal(freePlayOf(99).step, 7);
  assert.equal(freePlayOf(7).search, 'hard');
  assert.equal(stepLabel(3), `${STEPS[2].icon} ${STEPS[2].ko} · 3/7`);
});

test('the recommended step is the one you beat a little more than half the time', () => {
  for (const s of STEPS) assert.equal(recommendStep(ratingOfStep(s.step) + 35), s.step);
  assert.ok(Math.abs(expectedScore(ratingOfStep(4) + 35, ratingOfStep(4)) - AIM) < 0.01);
});

test('auto moves one step a game at most, says so, and undo holds it', () => {
  let s = newSkill();
  assert.equal(s.step, 2);
  let prev = s.step;
  for (let i = 0; i < 8; i++) {
    s = afterGame(s, { result: 'win', step: s.step });
    assert.ok(s.step - prev <= 1, 'never two steps at once');
    prev = s.step;
  }
  assert.ok(s.step > 2, 'wins climb');
  let t = newSkill();
  while (!t.change) t = afterGame(t, { result: 'win', step: t.step });
  assert.match(changeLine(t.change), /실력이 늘었어요/);
  const u = undoChange(t);
  assert.equal(u.step, t.change.from);
  assert.equal(u.hold, HOLD_GAMES);
  let w = u;
  for (let i = 0; i < HOLD_GAMES - 1; i++) {
    w = afterGame(w, { result: 'win', step: w.step });
    assert.equal(w.step, u.step, 'held after undo');
  }
  let d = { ...newSkill(), step: 5, rating: ratingOfStep(5) + 35, hold: 2 };
  d = afterGame(d, { result: 'loss', step: 5 });
  d = afterGame(d, { result: 'loss', step: d.step });
  assert.ok(d.step < 5, 'losses walk it down even while held');
  assert.match(changeLine({ from: 5, to: 4 }), /쉬운 상대/);
});

test('a chosen step stays put, auto comes back, saves survive and bad saves reset', () => {
  let s = pickStep(newSkill(), 6);
  assert.equal(s.mode, 'fixed');
  for (let i = 0; i < 5; i++) s = afterGame(s, { result: 'loss', step: 6 });
  assert.equal(s.step, 6);
  s = setAuto(s, true);
  assert.equal(s.mode, 'auto');
  const st = mem();
  saveSkill(st, s);
  assert.deepEqual(loadSkill(st), sanitizeSkill(s));
  st.setItem('wildcrown.skill.v1', '{bad');
  assert.deepEqual(loadSkill(st), newSkill());
  assert.equal(sanitizeSkill({ v: 1, step: 42, rating: 'x' }).step, 7);
});

test('hard-to-see replies: long slides and backward moves, never pawns or kings', () => {
  // 0x88: a1 = 0x70, h8 = 0x07, row 0 is rank 8.
  assert.equal(hardToSee({ piece: 'b', color: 'w', from: 0x72, to: 0x36 }), true, 'c1 to g5, four diagonal steps');
  assert.equal(hardToSee({ piece: 'b', color: 'w', from: 0x72, to: 0x54 }), false, 'c1 to e3, two steps');
  assert.equal(hardToSee({ piece: 'n', color: 'w', from: 0x44, to: 0x63 }), true, 'a white knight going back');
  assert.equal(hardToSee({ piece: 'n', color: 'b', from: 0x44, to: 0x23 }), true, 'a black knight going back');
  assert.equal(hardToSee({ piece: 'p', color: 'w', from: 0x64, to: 0x44 }), false);
  assert.equal(hardToSee({ piece: 'k', color: 'w', from: 0x74, to: 0x64 }), false);
});

test('blind 0 plays exactly as before, and a blind AI still always moves', () => {
  const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';
  let seed = 1;
  const r1 = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  seed = 7; const a = chooseMove(fen, { level: 'normal', rand: r1 });
  seed = 7; const b = chooseMove(fen, { level: 'normal', rand: r1, blind: 0 });
  assert.deepEqual(a, b, 'blind 0 is the old AI');
  for (let i = 0; i < 20; i++) assert.ok(chooseMove(fen, { level: 'easy', blind: 1, rand: Math.random }), 'still finds a legal move');
});
