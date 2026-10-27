import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('Arcane Engine & Audio modules exist and export expected functions', () => {
  const arcaneEnginePath = path.join(ROOT, 'src/arcaneEngine.ts');
  const arcaneAudioPath = path.join(ROOT, 'src/arcaneAudio.ts');

  assert.ok(fs.existsSync(arcaneEnginePath), 'Missing src/arcaneEngine.ts');
  assert.ok(fs.existsSync(arcaneAudioPath), 'Missing src/arcaneAudio.ts');

  const engineCode = fs.readFileSync(arcaneEnginePath, 'utf-8');
  assert.ok(engineCode.includes('export const SPELL_POOL'), 'SPELL_POOL missing from arcaneEngine');
  assert.ok(engineCode.includes('lightning'), 'lightning spell missing');
  assert.ok(engineCode.includes('teleport'), 'teleport spell missing');
  assert.ok(engineCode.includes('shield'), 'shield spell missing');
  assert.ok(engineCode.includes('meteor'), 'meteor spell missing');
  assert.ok(engineCode.includes('ascend'), 'ascend spell missing');
  assert.ok(engineCode.includes('handleTileClick'), 'handleTileClick missing from arcaneEngine');

  const audioCode = fs.readFileSync(arcaneAudioPath, 'utf-8');
  assert.ok(audioCode.includes('playLightning'), 'playLightning missing from arcaneAudio');
  assert.ok(audioCode.includes('playTeleport'), 'playTeleport missing from arcaneAudio');
  assert.ok(audioCode.includes('playShield'), 'playShield missing from arcaneAudio');
  assert.ok(audioCode.includes('playFireball'), 'playFireball missing from arcaneAudio');
  assert.ok(audioCode.includes('playAscend'), 'playAscend missing from arcaneAudio');
});

test('App.tsx integrates Arcane Mana bar and Spell Cards dock', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');

  assert.ok(appTsx.includes('mana-pill'), 'Missing mana-pill in App.tsx');
  assert.ok(appTsx.includes('arcane-dock'), 'Missing arcane-dock in App.tsx');
  assert.ok(appTsx.includes('btn-audio-toggle'), 'Missing btn-audio-toggle in App.tsx');
  assert.ok(appTsx.includes('arcaneEngine.selectCard'), 'Missing card click handler in App.tsx');
});
