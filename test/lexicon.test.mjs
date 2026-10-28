import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

test('Lexicon dataset, engine, and TTS modules exist and have valid structure', () => {
  const dataPath = path.join(ROOT, 'src/lexiconData.ts');
  const enginePath = path.join(ROOT, 'src/lexiconEngine.ts');
  const ttsPath = path.join(ROOT, 'src/lexiconTTS.ts');

  assert.ok(fs.existsSync(dataPath), 'Missing src/lexiconData.ts');
  assert.ok(fs.existsSync(enginePath), 'Missing src/lexiconEngine.ts');
  assert.ok(fs.existsSync(ttsPath), 'Missing src/lexiconTTS.ts');

  const dataCode = fs.readFileSync(dataPath, 'utf-8');
  assert.ok(dataCode.includes('TELEPORT'), 'Missing TELEPORT in lexiconData');
  assert.ok(dataCode.includes('PETRIFY'), 'Missing PETRIFY in lexiconData');
  assert.ok(dataCode.includes('SANCTUARY'), 'Missing SANCTUARY in lexiconData');
  assert.ok(dataCode.includes('CATACLYSM'), 'Missing CATACLYSM in lexiconData');
  assert.ok(dataCode.includes('etymologyStory'), 'Missing etymologyStory in lexiconData');

  const engineCode = fs.readFileSync(enginePath, 'utf-8');
  assert.ok(engineCode.includes('triggerDuel'), 'Missing triggerDuel in lexiconEngine');
  assert.ok(engineCode.includes('answerDuel'), 'Missing answerDuel in lexiconEngine');
  assert.ok(engineCode.includes('toggleGrimoire'), 'Missing toggleGrimoire in lexiconEngine');

  const ttsCode = fs.readFileSync(ttsPath, 'utf-8');
  assert.ok(ttsCode.includes('SpeechSynthesisUtterance'), 'Missing Web Speech API in lexiconTTS');
  assert.ok(ttsCode.includes('speak'), 'Missing speak method in lexiconTTS');
});

test('App.tsx integrates Lexicon Word Mastery, Duel Modal, and Grimoire Codex', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');

  assert.ok(appTsx.includes('btn-lexicon-pill'), 'Missing btn-lexicon-pill in App.tsx');
  assert.ok(appTsx.includes('btn-trigger-duel'), 'Missing btn-trigger-duel in App.tsx');
  assert.ok(appTsx.includes('btn-tts-toggle'), 'Missing btn-tts-toggle in App.tsx');
  assert.ok(appTsx.includes('word-duel-modal'), 'Missing word-duel-modal in App.tsx');
  assert.ok(appTsx.includes('grimoire-modal'), 'Missing grimoire-modal in App.tsx');
});
