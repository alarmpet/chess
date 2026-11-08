// Capture feel: size follows the moment, and the pace stays inside the plan's limit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA_LEAN, IMPACT_TIERS, impactTier, impactExtraSeconds, PIECE_SPARK } from '../src/fx/impactTier.js';

test('small captures stay small, the big moments are big', () => {
  assert.equal(impactTier('pawn', 'exd5'), 'small');
  assert.equal(impactTier('pawn', 'exd5+'), 'medium');
  assert.equal(impactTier('knight', 'Bxc6'), 'medium');
  assert.equal(impactTier('rook', 'Qxa8'), 'medium');
  assert.equal(impactTier('queen', 'Nxd5'), 'big');
  assert.equal(impactTier('pawn', 'Qxf7#'), 'big');
});

test('no capture adds more than 0.3 seconds', () => {
  for (const id of Object.keys(IMPACT_TIERS)) assert.ok(impactExtraSeconds(id) <= 0.3 + 1e-9, id);
});

test('only the bigger moments shake, and every role has spark colours', () => {
  assert.equal(IMPACT_TIERS.small.shake, 0);
  for (const r of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) assert.ok(PIECE_SPARK[r].length >= 2);
});

test('the camera only leans in for captures that matter, and never far', () => {
  assert.equal(CAMERA_LEAN.small, 0);
  assert.ok(CAMERA_LEAN.medium > 0 && CAMERA_LEAN.big > CAMERA_LEAN.medium && CAMERA_LEAN.big < 0.5);
});

test('capture words stay a modest share of the screen', () => {
  const sizes = ['small', 'medium', 'big'].map((t) => IMPACT_TIERS[t].wordSize);
  assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b));
  assert.ok(sizes[2] <= 0.15);
});

// CX-1 (docs/plans/2026-11-08-capture-matchup-plan.md): all 30 attacker x captured cells, with and without check.
import { attackerFromSan, isUpset, impactExtraSeconds as extra } from '../src/fx/impactTier.js';
const SAN_OF = { pawn: 'exd5', knight: 'Nxd5', bishop: 'Bxd5', rook: 'Rxd5', queen: 'Qxd5', king: 'Kxd5' };
const UPSETS = new Set(['pawn>rook', 'pawn>queen', 'knight>queen', 'bishop>queen', 'rook>queen']);
const EXPECT = {
  pawn: { pawn: 'small', knight: 'medium', bishop: 'medium', rook: 'big', queen: 'big' },
  knight: { pawn: 'small', knight: 'medium', bishop: 'medium', rook: 'medium', queen: 'big' },
  bishop: { pawn: 'small', knight: 'medium', bishop: 'medium', rook: 'medium', queen: 'big' },
  rook: { pawn: 'small', knight: 'medium', bishop: 'medium', rook: 'medium', queen: 'big' },
  queen: { pawn: 'small', knight: 'medium', bishop: 'medium', rook: 'medium', queen: 'big' },
  king: { pawn: 'small', knight: 'medium', bishop: 'medium', rook: 'medium', queen: 'big' }
};
const before = (v, san) => (san.endsWith('#') || v === 'queen' ? 'big' : san.endsWith('+') || v !== 'pawn' ? 'medium' : 'small');

test('the attacker is read from the move notation, promotions included', () => {
  assert.equal(attackerFromSan('bxa1=Q'), 'pawn');
  assert.equal(attackerFromSan('exd5+'), 'pawn');
  assert.equal(attackerFromSan('Kxh1'), 'king');
  assert.equal(attackerFromSan('O-O'), null);
});

test('all 30 matchups: upsets are exactly the five where the taker is 3+ points smaller', () => {
  for (const a of Object.keys(EXPECT)) for (const v of Object.keys(EXPECT[a])) {
    const san = SAN_OF[a];
    assert.equal(isUpset(v, san), UPSETS.has(`${a}>${v}`), `${a}>${v}`);
    assert.equal(impactTier(v, san), EXPECT[a][v], `${a}>${v}`);
    assert.equal(impactTier(v, san + '+'), EXPECT[a][v] === 'small' ? 'medium' : EXPECT[a][v], `${a}>${v}+`);
    assert.equal(impactTier(v, san + '#'), 'big', `${a}>${v}#`);
  }
});

test('only pawn-takes-rook gets slower than before, and by under 0.3 s', () => {
  const slower = [];
  for (const a of Object.keys(EXPECT)) for (const v of Object.keys(EXPECT[a])) for (const end of ['', '+']) {
    const san = SAN_OF[a] + end;
    const d = extra(impactTier(v, san)) - extra(before(v, san));
    if (d > 1e-9) slower.push(`${a}>${v}${end}`);
    assert.ok(d <= 0.3, `${a}>${v}${end}`);
  }
  assert.deepEqual(slower, ['pawn>rook', 'pawn>rook+']);
});
