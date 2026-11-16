// 사건 꾸러미(그래픽 계획 GX-1 · GX-2 · GX-3): 사건마다 무엇이 나가는지가 표 한 줄이다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPTURE_FLASH, EVENT_FX, FLASH_TONES, GLOW_COLOR, GLOW_TIERS, IMPACT_TIERS, screenFlash } from '../src/fx/impactTier.js';

test('작은 잡기는 화면이 번쩍이지 않고, 큰 잡기가 가장 세다', () => {
  assert.equal(screenFlash('capture', { tierId: 'small', mine: true }), null);
  const m = screenFlash('capture', { tierId: 'medium', mine: true });
  const b = screenFlash('capture', { tierId: 'big', mine: true });
  assert.ok(m.alpha < b.alpha && m.ms <= b.ms);
});

test('번쩍임의 색은 누구에게 좋은 일인가를 따른다', () => {
  assert.equal(screenFlash('capture', { tierId: 'big', mine: true }).tone, 'gold');
  assert.equal(screenFlash('capture', { tierId: 'big', mine: false }).tone, 'red');
  assert.equal(screenFlash('capture', { tierId: 'big', mine: null }).tone, 'gold');
  assert.equal(screenFlash('mate', { mine: false }).tone, 'red');
  assert.equal(screenFlash('mate', { mine: true }).tone, 'gold');
  assert.equal(screenFlash('check', { mine: false }).tone, 'orange');
  assert.equal(screenFlash('check', { mine: true }).tone, 'orange');
  assert.equal(screenFlash('castle', { mine: true }), null);
  assert.equal(screenFlash('없는 사건'), null);
});

test('번쩍임은 옅고 짧다 — 판을 가리지 않는다', () => {
  const all = [...Object.values(CAPTURE_FLASH), ...Object.values(EVENT_FX).map((e) => e.flash)].filter(Boolean);
  for (const f of all) assert.ok(f.alpha <= 0.45 && f.ms <= 600, JSON.stringify(f));
  for (const rgb of Object.values(FLASH_TONES)) assert.match(rgb, /^\d+, \d+, \d+$/);
});

test('사건 표의 값은 단계 표 안에 있다', () => {
  for (const [kind, e] of Object.entries(EVENT_FX)) {
    if (e.burst) assert.ok(IMPACT_TIERS[e.burst[1]], kind);
    if (e.ring) assert.ok(IMPACT_TIERS[e.ring], kind);
    if (e.glow) assert.ok(GLOW_TIERS[e.glow], kind);
    assert.ok(e.word && e.wordSize > 0 && e.wordSize <= 0.14, kind);
  }
});

test('겹친 불빛은 단계마다 커지고, 작은 잡기에는 불똥이 없다', () => {
  assert.equal(GLOW_TIERS.small.sparks, 0);
  assert.ok(GLOW_TIERS.small.scale < GLOW_TIERS.medium.scale && GLOW_TIERS.medium.scale < GLOW_TIERS.big.scale);
  assert.ok(GLOW_TIERS.medium.sparks < GLOW_TIERS.big.sparks && GLOW_TIERS.big.sparks <= 20);
  assert.notEqual(GLOW_COLOR.w, GLOW_COLOR.b);
});

// ── 계약전 보상(SC-2)
import { CONTRACT_COINS, contractCoins, emptyContractStore, sanitizeContractStore } from '../src/rules/contractGame.js';
import { COINS, settleContract } from '../src/village/economy.js';

test('계약전 보상은 일반 판보다 적고, 기권한 판은 받지 않는다', () => {
  for (const r of ['win', 'draw', 'loss']) assert.ok(CONTRACT_COINS[r] > 0 && CONTRACT_COINS[r] < COINS[r], r);
  assert.ok(CONTRACT_COINS.win > CONTRACT_COINS.draw && CONTRACT_COINS.draw > CONTRACT_COINS.loss);
  assert.equal(contractCoins('win', 'contract'), 18);
  assert.equal(contractCoins('loss', 'mate'), 10);
  assert.equal(contractCoins('loss', 'resign'), 0);
  assert.equal(contractCoins('이상한 값', 'contract'), 0);
});

test('계약전 한 판은 한 번만 주고, 마을의 판 수는 올리지 않는다', () => {
  const v = { coins: 5, games: 3, settled: [] };
  assert.deepEqual(settleContract(v, { gameId: 77, coins: 18 }), { coins: 18, work: 0, parts: 0, gifts: [] });
  assert.equal(settleContract(v, { gameId: 77, coins: 18 }), null);
  assert.equal(v.coins, 23);
  assert.equal(v.games, 3);
  assert.deepEqual(settleContract(v, { gameId: 78, coins: -4 }), { coins: 0, work: 0, parts: 0, gifts: [] });
  assert.equal(v.coins, 23);
});

test('계약전 켜 둠은 저장에 남고, 없으면 꺼져 있다', () => {
  assert.equal(emptyContractStore().on, false);
  assert.equal(sanitizeContractStore({ v: 1, on: true }).on, true);
  assert.equal(sanitizeContractStore({ v: 1, on: 'yes' }).on, false);
  assert.equal(sanitizeContractStore({ v: 1 }).on, false);
});
