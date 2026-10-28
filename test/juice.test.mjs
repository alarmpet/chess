import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('Juice Engine module exists and exports expected game feel functions', () => {
  const juiceEnginePath = path.join(ROOT, 'src/juiceEngine.ts');
  assert.ok(fs.existsSync(juiceEnginePath), 'Missing src/juiceEngine.ts');

  const code = fs.readFileSync(juiceEnginePath, 'utf-8');
  assert.ok(code.includes('spawnFloatingNumber'), 'spawnFloatingNumber missing');
  assert.ok(code.includes('spawnFloatingAtTile'), 'spawnFloatingAtTile missing');
  assert.ok(code.includes('screenFlash'), 'screenFlash missing');
  assert.ok(code.includes('bounceCurrency'), 'bounceCurrency missing');
  assert.ok(code.includes('showMultikillBanner'), 'showMultikillBanner missing');
  assert.ok(code.includes('registerCapture'), 'registerCapture missing');
  assert.ok(code.includes('awardXP'), 'awardXP missing');
  assert.ok(code.includes('registerWin'), 'registerWin missing');
  assert.ok(code.includes('registerLoss'), 'registerLoss missing');
  assert.ok(code.includes('progressQuest'), 'progressQuest missing');
  assert.ok(code.includes('spawnHarvestCoins'), 'spawnHarvestCoins missing');
  assert.ok(code.includes('attachCardTilt'), 'attachCardTilt missing');
});

test('App.tsx and styles.css integrate Game Feel Juice layer and Quests', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');
  const stylesCss = fs.readFileSync(path.join(ROOT, 'src/styles.css'), 'utf-8');

  // App.tsx UI elements
  assert.ok(appTsx.includes('xp-bar-pill'), 'Missing xp-bar-pill in App.tsx');
  assert.ok(appTsx.includes('daily-quest-pill'), 'Missing daily-quest-pill in App.tsx');
  assert.ok(appTsx.includes('win-streak-pill'), 'Missing win-streak-pill in App.tsx');
  assert.ok(appTsx.includes('quest-panel-overlay'), 'Missing quest-panel-overlay in App.tsx');
  assert.ok(appTsx.includes('checkmate-reward-row'), 'Missing checkmate-reward-row in App.tsx');

  // styles.css Juice v2 rules
  assert.ok(stylesCss.includes('floating-number'), 'Missing floating-number in styles.css');
  assert.ok(stylesCss.includes('hit-flash-overlay'), 'Missing hit-flash-overlay in styles.css');
  assert.ok(stylesCss.includes('multikill-banner'), 'Missing multikill-banner in styles.css');
  assert.ok(stylesCss.includes('harvest-coin'), 'Missing harvest-coin in styles.css');
});
