import test from 'node:test';
import assert from 'node:assert/strict';
import { readFxSettings, writeFxSettings } from '../src/fx/settings.js';
import { SOUNDS } from '../src/audio/recipes.js';

function memoryStore() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
}

test('shake is on and quick games off until the player says otherwise', () => {
  assert.deepEqual(readFxSettings(memoryStore()), { shake: true, quick: false, cards: true, dive: true, quests: true, blitz: false, post: true });
});

test('choices survive a reload, and older saves with only shake still load', () => {
  const store = memoryStore();
  writeFxSettings(store, { shake: false, quick: true, cards: false, dive: false, quests: false, blitz: true, post: false });
  assert.deepEqual(readFxSettings(store), { shake: false, quick: true, cards: false, dive: false, quests: false, blitz: true, post: false });
  store.setItem('wildcrown.fx.v1', '{"shake":false}');
  assert.deepEqual(readFxSettings(store), { shake: false, quick: false, cards: true, dive: true, quests: true, blitz: false, post: true });
  store.setItem('wildcrown.fx.v1', '{broken');
  assert.deepEqual(readFxSettings(store), { shake: true, quick: false, cards: true, dive: true, quests: true, blitz: false, post: true });
});

test('castling has its own sound', () => {
  assert.ok(SOUNDS.clap.length > 0);
});

// 화면 보정(WG-P1, 11-19): 기본은 켬, 끈 것만 저장에 남는다. 셰이더 문자열은 모듈에 있고 브라우저에서 확인한다.
test('화면 보정 기본값과 세기 범위', async () => {
  const { POST_DEFAULTS } = await import('../src/fx/postFx.js');
  assert.equal(readFxSettings(memoryStore()).post, true);
  for (const [k, v] of Object.entries(POST_DEFAULTS)) assert.ok(Number.isFinite(v) && v >= 0, k);
  assert.ok(POST_DEFAULTS.ao <= 1 && POST_DEFAULTS.bloom <= 1 && POST_DEFAULTS.vignette < 0.5, '은은하게: 그늘·번짐·비네트가 과하지 않다');
  assert.ok(Math.abs(POST_DEFAULTS.saturation - 1) <= 0.15, '채도는 15% 안에서만 만진다');
});
