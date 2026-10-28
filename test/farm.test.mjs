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
  assert.ok(dataCode.includes('SPECIAL_RESOURCES'), 'Missing SPECIAL_RESOURCES in farmData');
  assert.ok(dataCode.includes('sacredAsh'), 'Missing sacredAsh in farmData');
  assert.ok(dataCode.includes('marbleDust'), 'Missing marbleDust in farmData');
  assert.ok(dataCode.includes('RESTORATION_ZONES'), 'Missing RESTORATION_ZONES in farmData');
  assert.ok(dataCode.includes('cloister_walkway'), 'Missing cloister_walkway in farmData');
  assert.ok(dataCode.includes('high_altar'), 'Missing high_altar in farmData');

  const engineCode = fs.readFileSync(enginePath, 'utf-8');
  assert.ok(engineCode.includes('plantSeed'), 'Missing plantSeed in farmEngine');
  assert.ok(engineCode.includes('waterPlot'), 'Missing waterPlot in farmEngine');
  assert.ok(engineCode.includes('harvestPlot'), 'Missing harvestPlot in farmEngine');
  assert.ok(engineCode.includes('awardChessPieceCapture'), 'Missing awardChessPieceCapture in farmEngine');
  assert.ok(engineCode.includes('awardHazardKill'), 'Missing awardHazardKill in farmEngine');
  assert.ok(engineCode.includes('restoreZone'), 'Missing restoreZone in farmEngine');
  assert.ok(engineCode.includes('restorations'), 'Missing restorations in farmEngine');
  assert.ok(engineCode.includes('sacredAsh'), 'Missing sacredAsh in farmEngine');
  assert.ok(engineCode.includes('marbleDust'), 'Missing marbleDust in farmEngine');

  const threeCode = fs.readFileSync(threePath, 'utf-8');
  assert.ok(threeCode.includes('SanctuaryGarden3D'), 'Missing SanctuaryGarden3D class');
  assert.ok(threeCode.includes('buildHarvestableCropMesh'), 'Missing crop mesh builder');
  assert.ok(threeCode.includes('updateRestoration'), 'Missing updateRestoration in farm3D');
  assert.ok(threeCode.includes('__updateRestoration3D'), 'Missing __updateRestoration3D in farm3D');

  const chessCode = fs.readFileSync(path.join(ROOT, 'src/wizardChessEngine.js'), 'utf-8');
  assert.ok(chessCode.includes('startCheckmateBrazierExecution'), 'Missing checkmate execution cutscene in wizardChessEngine');
  assert.ok(chessCode.includes('spawnBrazierIncineration'), 'Missing brazier incineration effect in wizardChessEngine');
  assert.ok(chessCode.includes('setupHazardTiles'), 'Missing setupHazardTiles in wizardChessEngine');
  assert.ok(chessCode.includes('hazardTilesGroup'), 'Missing hazardTilesGroup in wizardChessEngine');
  assert.ok(chessCode.includes('isPillarObstacle'), 'Missing isPillarObstacle in wizardChessEngine');
  assert.ok(chessCode.includes('GARDEN VIEW INTERACTION (Priority #1'), 'Missing Priority #1 garden interaction in pointerup');
  assert.ok(chessCode.includes('isGardenPlot'), 'Missing isGardenPlot raycast check in wizardChessEngine');
});

test('App.tsx integrates Farm View Toggle, Currency Pill, Shop, and Barn', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');

  assert.ok(appTsx.includes('btn-farm-view'), 'Missing btn-farm-view in App.tsx');
  assert.ok(appTsx.includes('farm-currency-pill'), 'Missing farm-currency-pill in App.tsx');
  assert.ok(appTsx.includes('farm-ash-item'), 'Missing farm-ash-item in App.tsx');
  assert.ok(appTsx.includes('farm-marble-item'), 'Missing farm-marble-item in App.tsx');
  assert.ok(appTsx.includes('btn-open-shop'), 'Missing btn-open-shop in App.tsx');
  assert.ok(appTsx.includes('btn-open-barn'), 'Missing btn-open-barn in App.tsx');
  assert.ok(appTsx.includes('garden-dock'), 'Missing garden-dock in App.tsx');
  assert.ok(appTsx.includes('btn-checkmate-garden'), 'Missing btn-checkmate-garden in App.tsx');
  assert.ok(appTsx.includes('hazard-legend-pill'), 'Missing hazard-legend-pill in App.tsx');
  assert.ok(appTsx.includes('btn-open-restoration'), 'Missing btn-open-restoration in App.tsx');
});
