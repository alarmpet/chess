// Appearance stages and trinkets (PLAN §14.2 · §14.3): manifest rules and the saved-choice sanitiser.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validatePackManifest, sanitizeCosmetics, stageModelFor, slotsFor, stageIds, PIECE_ROLES } from '../src/packs/packManifest.js';

const legend = JSON.parse(readFileSync(new URL('../public/packs/legend/pack.json', import.meta.url), 'utf8'));

test('legend pack declares looks and validates', () => {
  assert.deepEqual(validatePackManifest(legend).errors, []);
  assert.ok(Array.isArray(legend.looks?.stages) && legend.looks.stages.length >= 2, 'looks.stages');
  assert.match(legend.looks.note.ko, /외형만/, 'first sentence says looks only (PLAN §14.0)');
});

test('every stage and item model file exists', () => {
  const base = new URL('../public/packs/legend/', import.meta.url);
  for (const role of PIECE_ROLES) {
    const def = legend.pieces[role];
    for (const id of stageIds(legend)) {
      for (const color of ['w', 'b']) {
        const name = stageModelFor(def, id, color);
        assert.ok(existsSync(new URL(`${name}.glb`, base)), `${role}/${id}/${color}: ${name}.glb`);
      }
    }
  }
  for (const [id, it] of Object.entries(legend.items || {})) {
    assert.ok(existsSync(new URL(`${it.model}.glb`, base)), `item ${id}: ${it.model}.glb`);
  }
});

test('strength words are rejected in stage and item names', () => {
  const bad = structuredClone(legend);
  bad.looks.stages[1].name = { ko: '전설', en: 'Legend' };
  assert.ok(validatePackManifest(bad).errors.some((e) => e.includes('strength word')));
  const bad2 = structuredClone(legend);
  bad2.items = { sword: { model: 'items/x', slot: 'head', name: { ko: '최강 모자' } } };
  assert.ok(validatePackManifest(bad2).errors.some((e) => e.includes('strength word')));
});

test('items cannot carry numbers or drop rates', () => {
  const bad = structuredClone(legend);
  bad.items = { hat: { model: 'items/x', slot: 'head', power: 2 } };
  assert.ok(validatePackManifest(bad).errors.some((e) => e.includes('items.hat.power is forbidden')));
  const bad2 = structuredClone(legend);
  bad2.items = { hat: { model: 'items/x', slot: 'hand' } };
  assert.ok(validatePackManifest(bad2).errors.some((e) => e.includes('items.hat.slot')));
});

test('sanitizeCosmetics drops unknown stages, items and slots', () => {
  const ids = stageIds(legend);
  const anyItem = Object.entries(legend.items)[0];
  const headItem = Object.entries(legend.items).find(([, it]) => it.slot === 'head');
  const out = sanitizeCosmetics(legend, {
    w: {
      pawn: { stage: ids[1], head: headItem?.[0], neck: headItem?.[0] },   // head item in the neck slot → dropped
      king: { stage: 'nope', head: headItem?.[0] }                         // king has no head slot (crown) → dropped
    },
    b: { rook: { stage: ids[ids.length - 1], neck: 'missing' } }
  });
  assert.equal(out.w.pawn.stage, ids[1]);
  assert.equal(out.w.pawn.head, headItem?.[0]);
  assert.equal(out.w.pawn.neck, undefined);
  assert.equal(out.w.king.stage, ids[0]);
  assert.equal(out.w.king.head, undefined);
  assert.equal(out.b.rook.neck, undefined);
  for (const color of ['w', 'b']) for (const role of PIECE_ROLES) assert.ok(out[color][role].stage, `${color}.${role} has a stage`);
  assert.ok(anyItem);
  assert.deepEqual(sanitizeCosmetics(legend, null).w.queen, { stage: ids[0] });
});

test('the king keeps his crown: no head slot', () => {
  assert.deepEqual(slotsFor(legend.pieces.king), ['neck']);
  assert.deepEqual(slotsFor(legend.pieces.pawn), ['head', 'neck']);
});

test('pedestal colours and sizes are validated', () => {
  assert.ok(legend.pedestal && legend.pedestal.w && legend.pedestal.b, 'legend has an ivory/ebony pedestal');
  const bad = structuredClone(legend);
  bad.pedestal = { w: 'white', b: '#000000', height: -1 };
  const errs = validatePackManifest(bad).errors;
  assert.ok(errs.some((e) => e.includes('pedestal.w')));
  assert.ok(errs.some((e) => e.includes('pedestal.height')));
});

test('role signatures stay visible: king, bishop and rook have no head slot', () => {
  for (const r of ['king', 'bishop', 'rook']) assert.deepEqual(slotsFor(legend.pieces[r]), ['neck'], r);
});
