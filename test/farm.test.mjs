import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('Farm Data, Audio, 3D, and Engine modules exist and have valid structure', () => {
  const dataPath = path.join(ROOT, 'src/farmData.ts');
  const enginePath = path.join(ROOT, 'src/farmEngine.ts');
  const audioPath = path.join(ROOT, 'src/farmAudio.ts');
  const threePath = path.join(ROOT, 'src/farm3D.ts');

  assert.ok(fs.existsSync(dataPath), 'Missing src/farmData.ts');
  assert.ok(fs.existsSync(enginePath), 'Missing src/farmEngine.ts');
  assert.ok(fs.existsSync(audioPath), 'Missing src/farmAudio.ts');
  assert.ok(fs.existsSync(threePath), 'Missing src/farm3D.ts');

  const dataCode = fs.readFileSync(dataPath, 'utf-8');
  assert.ok(dataCode.includes('mana_grape'), 'Missing mana_grape in farmData');
  assert.ok(dataCode.includes('golden_wheat'), 'Missing golden_wheat in farmData');
  assert.ok(dataCode.includes('flame_pepper'), 'Missing flame_pepper in farmData');
  assert.ok(dataCode.includes('sacred_herb'), 'Missing sacred_herb in farmData');
  assert.ok(dataCode.includes('CHESS_LOOT'), 'Missing CHESS_LOOT in farmData');

  const engineCode = fs.readFileSync(enginePath, 'utf-8');
  assert.ok(engineCode.includes('plantSeed'), 'Missing plantSeed in farmEngine');
  assert.ok(engineCode.includes('waterPlot'), 'Missing waterPlot in farmEngine');
  assert.ok(engineCode.includes('harvestPlot'), 'Missing harvestPlot in farmEngine');
  assert.ok(engineCode.includes('awardChessPieceCapture'), 'Missing awardChessPieceCapture in farmEngine');

  const threeCode = fs.readFileSync(threePath, 'utf-8');
  assert.ok(threeCode.includes('SanctuaryGarden3D'), 'Missing SanctuaryGarden3D class');
  assert.ok(threeCode.includes('buildHarvestableCropMesh'), 'Missing crop mesh builder');
});

test('App.tsx integrates Farm View Toggle, Currency Pill, Shop, and Barn', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');

  assert.ok(appTsx.includes('btn-farm-view'), 'Missing btn-farm-view in App.tsx');
  assert.ok(appTsx.includes('farm-currency-pill'), 'Missing farm-currency-pill in App.tsx');
  assert.ok(appTsx.includes('btn-open-shop'), 'Missing btn-open-shop in App.tsx');
  assert.ok(appTsx.includes('btn-open-barn'), 'Missing btn-open-barn in App.tsx');
  assert.ok(appTsx.includes('garden-dock'), 'Missing garden-dock in App.tsx');
});
