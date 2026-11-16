// 군도(AR-1 ~ AR-3): 섬 일곱에서 끝나고, 끝낸 섬은 남고, 섬마다 값이 오르고 영향권이 넓어지고, 특산물이 온다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, KIND_ORDER, buildingCost, influenceBonus, influenceSquares, islandDone, newVillage, sanitizeVillage, settleContract, shelfReserve, startNewIsland } from '../src/village/economy.js';
import { ARCH_COST_STEP, ISLANDS_TOTAL, LAST_THEME, MIDDLE_THEMES, THEMES, archFinished, finishArch, giveSpecialties, islandIndex, nextChoices, sanitizeArch } from '../src/village/archipelago.js';

const finishIsland = (v) => { v.built = KIND_ORDER.map((kind, i) => ({ id: i + 1, kind, sq: ['c3', 'f3', 'c6', 'f6', 'd4', 'e5', 'b5', 'g4'][i], tenant: null, level: 1, ready: true })); v.decor = [{ kind: 'bench', sq: 'a1' }]; };

test('섬은 일곱: 해초 섬 → 동물 다섯(고른 순서) → 왕관 섬, 그 뒤에는 새 섬이 없다', () => {
  assert.equal(ISLANDS_TOTAL, 7);
  const v = newVillage();
  assert.equal(v.arch.current, 'kelp');
  const order = ['rhino', 'panda', 'lion', 'kangaroo', 'tiger'];
  for (const theme of order) {
    finishIsland(v);
    assert.ok(nextChoices(v.arch).includes(theme));
    assert.ok(!nextChoices(v.arch).includes(LAST_THEME), '동물 섬이 남아 있으면 왕관 섬은 아직');
    assert.equal(startNewIsland(v, theme), true);
    assert.equal(v.arch.current, theme);
  }
  finishIsland(v);
  assert.deepEqual(nextChoices(v.arch), [LAST_THEME]);
  assert.equal(startNewIsland(v, 'rhino'), false, '끝낸 섬은 다시 못 고른다');
  assert.equal(startNewIsland(v, LAST_THEME), true);
  finishIsland(v);
  assert.deepEqual(nextChoices(v.arch), []);
  assert.equal(startNewIsland(v), false);
  assert.equal(islandDone(v), true, '왕관 섬은 그대로 남는다');
  assert.equal(finishArch(v.arch, v), true);
  assert.equal(finishArch(v.arch, v), false, '끝은 한 번만');
  assert.equal(archFinished(v.arch), true);
  assert.deepEqual(v.arch.done.map((d) => d.theme), ['kelp', ...order, LAST_THEME]);
});

test('끝낸 섬은 건물·소품 배치와 함께 남는다', () => {
  const v = newVillage();
  v.games = 21;
  finishIsland(v);
  startNewIsland(v, 'panda');
  const rec = v.arch.done[0];
  assert.equal(rec.theme, 'kelp');
  assert.equal(rec.games, 21);
  assert.equal(rec.built.length, 8);
  assert.deepEqual(rec.decor, [{ kind: 'bench', sq: 'a1' }]);
  assert.ok(JSON.stringify(rec).length < 3000, '섬 하나의 기록은 3KB 안');
  assert.equal(v.built.length, 0, '새 섬은 빈 땅');
});

test('섬마다 건물 값이 15% 씩 오른다', () => {
  assert.equal(ARCH_COST_STEP, 0.15);
  const v = newVillage();
  assert.equal(buildingCost(v, 'field'), BUILDINGS.field.cost);
  finishIsland(v); startNewIsland(v, 'tiger');
  assert.equal(islandIndex(v.arch), 2);
  assert.equal(buildingCost(v, 'stage'), Math.round(BUILDINGS.stage.cost * 1.15));
  assert.equal(shelfReserve(v).cost, Math.round(BUILDINGS.field.cost * 1.15));
});

test('그 동물의 섬에서는 영향권이 넓어진다', () => {
  for (const animal of ['kangaroo', 'panda', 'rhino', 'tiger', 'lion']) {
    const a = influenceSquares(animal, 'd4');
    const b = influenceSquares(animal, 'd4', true);
    assert.ok(b.length > a.length, animal);
    for (const sq of a) assert.ok(b.includes(sq), `${animal} 넓어진 모양은 원래 모양을 품는다`);
  }
  assert.deepEqual(influenceSquares('meerkat', 'd4', true), influenceSquares('meerkat', 'd4'));
  // 판다 섬: 대각선 끝(h8)의 건물이 a1 판다에게서 영향을 받는다
  const v = newVillage();
  v.built = [{ id: 1, kind: 'field', sq: 'a1', tenant: 'panda_0', level: 0, ready: true }, { id: 2, kind: 'market', sq: 'h8', tenant: null, level: 0, ready: true }];
  assert.equal(influenceBonus(v, v.built[1]), 0);
  v.arch.current = 'panda';
  assert.equal(influenceBonus(v, v.built[1]), 1);
});

test('끝낸 섬은 판마다 특산물을 보낸다, 상한이 있다', () => {
  const v = newVillage();
  v.grain = 0; v.coins = 0;
  v.arch.done = [{ theme: 'kelp', built: [], decor: [] }, { theme: 'kangaroo', built: [], decor: [] }, { theme: 'panda', built: [], decor: [] }];
  const got = giveSpecialties(v, v.arch, { mvp: 'w_e2', limits: { grain: 1 } });
  assert.deepEqual(got.map((g) => g.theme), ['kelp', 'kangaroo', 'panda']);
  assert.deepEqual([v.grain, v.coins, v.hearts.w_e2], [1, 2, 1]);
  giveSpecialties(v, v.arch, { mvp: 'w_e2', limits: { grain: 1 } });
  assert.equal(v.grain, 1, '곡물 상한');
  // 공방이 없으면 부품·진도 특산물은 오지 않는다
  v.arch.done.push({ theme: 'rhino', built: [], decor: [] });
  assert.ok(!giveSpecialties(v, v.arch, {}).some((g) => g.theme === 'rhino'));
  // 계약전 판에서도 온다, 기권은 아니다
  assert.equal(settleContract(v, { gameId: 1, coins: 18, reason: 'contract' }).gifts.length > 0, true);
  assert.equal(settleContract(v, { gameId: 2, coins: 0, reason: 'resign' }).gifts.length, 0);
  for (const t of MIDDLE_THEMES) assert.ok(THEMES[t].gift && THEMES[t].rule, t);
});

test('저장을 바로잡는다: 옛 저장은 해초 섬, 같은 섬은 한 번만', () => {
  assert.deepEqual(sanitizeArch(null), { current: 'kelp', done: [] });
  const a = sanitizeArch({ current: 'panda', done: [{ theme: 'kelp', built: [{ kind: 'field', sq: 'c3' }, { kind: 'x', sq: 'z9' }] }, { theme: 'kelp' }, { theme: 'nope' }] });
  assert.equal(a.current, 'panda');
  assert.equal(a.done.length, 1);
  assert.equal(a.done[0].built.length, 1);
  assert.equal(sanitizeVillage({ ...newVillage(), arch: undefined }).arch.current, 'kelp');
});
