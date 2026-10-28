import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {
  validatePackManifest,
  resolveClipName,
  toAttackProfile,
  normalizePromotion,
  modelNameFor,
  PIECE_ROLES,
  REQUIRED_CLIP_ROLES
} from '../src/packs/packManifest.js';

const ROOT = process.cwd();
const PACKS_DIR = path.join(ROOT, 'public/packs');
const GLB_DIR = path.join(ROOT, 'public/assets/glb');

function readGlbJson(baseName, dir = GLB_DIR) {
  const b64Path = path.join(dir, `${baseName}.glb.gz.b64`);
  const rawPath = path.join(dir, `${baseName}.glb`);
  let glb;
  if (fs.existsSync(b64Path)) {
    glb = zlib.gunzipSync(Buffer.from(fs.readFileSync(b64Path, 'utf-8').trim(), 'base64'));
  } else if (fs.existsSync(rawPath)) {
    glb = fs.readFileSync(rawPath);
  } else {
    return null;
  }
  assert.equal(glb.toString('ascii', 0, 4), 'glTF', `${baseName}: not a GLB`);
  const jsonLen = glb.readUInt32LE(12);
  return JSON.parse(glb.toString('utf-8', 20, 20 + jsonLen));
}

const packIds = fs.existsSync(PACKS_DIR)
  ? fs.readdirSync(PACKS_DIR).filter((d) => fs.existsSync(path.join(PACKS_DIR, d, 'pack.json')))
  : [];

test('at least the cathedral pack exists', () => {
  assert.ok(packIds.includes('cathedral'), 'public/packs/cathedral/pack.json missing');
});

for (const packId of packIds) {
  const manifest = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, packId, 'pack.json'), 'utf-8'));

  test(`pack "${packId}" manifest validates`, () => {
    const { ok, errors } = validatePackManifest(manifest);
    assert.ok(ok, `manifest errors:\n - ${errors.join('\n - ')}`);
    assert.equal(manifest.id, packId, 'manifest.id must equal its folder name');
  });

  test(`pack "${packId}": every model file exists and declared clips are present in the GLB`, () => {
    const assetDir = manifest.assetBase
      ? path.join(ROOT, 'public', manifest.assetBase.replace(/^\.\//, ''))
      : GLB_DIR;
    if (manifest.environment.type !== 'procedural') {
      const envJson = readGlbJson(manifest.environment.model, assetDir);
      assert.ok(envJson, `environment model ${manifest.environment.model} not found in ${assetDir}`);
    }

    for (const role of PIECE_ROLES) {
      const def = manifest.pieces[role];
      for (const color of ['w', 'b']) {
        const modelName = modelNameFor(def, color);
        const json = readGlbJson(modelName, assetDir);
        assert.ok(json, `${role}/${color}: model ${modelName} not found in ${assetDir}`);
        const names = (json.animations || []).map((a) => a.name);
        for (const clipRole of REQUIRED_CLIP_ROLES) {
          const resolved = resolveClipName(def, clipRole, names);
          assert.ok(resolved, `${role}/${color}: clip role "${clipRole}" resolves to nothing in ${modelName} (has: ${names.join(', ')})`);
        }
      }
    }
  });
}

test('validator rejects a manifest with a missing required clip role and a dropRate field', () => {
  const base = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, 'cathedral', 'pack.json'), 'utf-8'));
  delete base.pieces.king.clips.attack;
  base.pieces.pawn.dropRate = 0.1;
  const { ok, errors } = validatePackManifest(base);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes('pieces.king.clips.attack')), errors.join('\n'));
  assert.ok(errors.some((e) => e.includes('dropRate')), errors.join('\n'));
});

test('resolveClipName: exact, case-insensitive, then substring fallback', () => {
  const def = { clips: { idle: ['Idle_2', 'Idle'], attack: 'Attack' } };
  assert.equal(resolveClipName(def, 'idle', ['Idle', 'Attack']), 'Idle');
  assert.equal(resolveClipName(def, 'idle', ['idle_2', 'Attack']), 'idle_2');
  assert.equal(resolveClipName(def, 'shatter', ['Shatter_Burst']), 'Shatter_Burst');
  assert.equal(resolveClipName(def, 'kneel', ['Idle']), null);
});

test('toAttackProfile maps *Sec keys to the engine profile and fills defaults', () => {
  const p = toAttackProfile({ timeScale: 1.2, contactSec: 0.5 });
  assert.equal(p.timeScale, 1.2);
  assert.equal(p.contactClip, 0.5);
  assert.equal(typeof p.blowClip, 'number');
  assert.equal(typeof p.maxLunge, 'number');
});

test('normalizePromotion accepts SAN letters and names, defaults to queen', () => {
  assert.equal(normalizePromotion('n'), 'knight');
  assert.equal(normalizePromotion('Rook'), 'rook');
  assert.equal(normalizePromotion(undefined), 'queen');
  assert.equal(normalizePromotion('king'), 'queen');
});
