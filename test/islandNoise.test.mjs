// 절차적 섬(PI-1): 시드 하나 → 높이 지도 한 장. 같은 시드면 같은 섬, 일곱 섬은 서로 다른 모양.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ISLAND_LOOKS, PALETTES, coastProfile, falloff, heightColor, heightCurve, islandHeightmap, islandSeed, landRatio, overlap, perlin } from '../src/village/islandNoise.js';

const THEMES = Object.keys(ISLAND_LOOKS);

test('같은 시드면 같은 섬, 다른 시드면 다른 섬', () => {
  const a = islandHeightmap('panda'); const b = islandHeightmap('panda');
  assert.deepEqual(Array.from(a.h), Array.from(b.h));
  assert.notEqual(islandSeed('kelp', 1), islandSeed('kelp', 2), '해초 섬은 플레이어마다');
  assert.equal(islandSeed('panda', 1), islandSeed('panda', 2), '동물 섬은 모두 같게');
  assert.ok(overlap(islandHeightmap('kelp', { playerSeed: 11 }), islandHeightmap('kelp', { playerSeed: 99 })) < 0.9);
});

test('섬은 바다로 둘러싸인다(지도 가장자리는 모두 물)', () => {
  for (const t of THEMES) {
    const m = islandHeightmap(t);
    for (let i = 0; i < m.size; i++) for (const k of [i, (m.size - 1) * m.size + i, i * m.size, i * m.size + m.size - 1]) assert.ok(m.h[k] < 0, `${t} 가장자리 ${k}`);
  }
});

test('땅은 지도의 15 ~ 45%, 일곱 섬의 땅이 서로 70% 넘게 겹치지 않는다', () => {
  const maps = THEMES.map((t) => islandHeightmap(t));
  for (const m of maps) { const r = landRatio(m); assert.ok(r >= 0.15 && r <= 0.45, `${m.theme} ${r}`); }
  for (let i = 0; i < maps.length; i++) for (let j = i + 1; j < maps.length; j++) assert.ok(overlap(maps[i], maps[j]) <= 0.7, `${maps[i].theme}/${maps[j].theme}`);
});

test('옥타브를 겹치면 모양이 달라진다(한 장과 같지 않다)', () => {
  for (const t of THEMES) assert.ok(overlap(islandHeightmap(t), islandHeightmap(t, { octaves: 1 })) < 0.95, t);
});

test('펄린 노이즈는 이웃끼리 부드럽게 이어진다', () => {
  const n = perlin(7);
  let jump = 0;
  for (let i = 0; i < 200; i++) { const x = i * 0.05; jump = Math.max(jump, Math.abs(n(x, 1.3) - n(x + 0.05, 1.3))); }
  assert.ok(jump < 0.2, `이웃 칸 차이 ${jump}`);
});

test('폴오프는 가운데 0, 가장자리 1 · 계단 높이 곡선은 층이 진다', () => {
  assert.ok(falloff(0, 0) < 0.01 && falloff(1, 1) > 0.99);
  const steps = new Set(Array.from({ length: 50 }, (_, i) => heightCurve(i / 49, 'terrace')));
  assert.ok(steps.size <= 5, `계단 ${steps.size}`);
});

test('해안선 윤곽은 −1 ~ 1 의 64 개 값', () => {
  const p = coastProfile(islandHeightmap('tiger'));
  assert.equal(p.length, 64);
  assert.ok(p.every((v) => v >= -1 && v <= 1) && p.some((v) => Math.abs(v) > 0.9));
});

test('색표: 바다 둘, 땅은 높이 순서대로', () => {
  for (const name of Object.keys(PALETTES)) {
    assert.equal(heightColor(-0.9, name), PALETTES[name][0]);
    assert.equal(heightColor(-0.1, name), PALETTES[name][1]);
    assert.equal(heightColor(0.05, name), PALETTES[name][2]);
    assert.equal(heightColor(1, name), PALETTES[name][6]);
  }
});
