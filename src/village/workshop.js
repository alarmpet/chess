// 공방 (슬롯 체스·공방 계획 2026-11-11 §5.1 · §7.2, 첫 조각 WS-1 · 2026-11-16).
// 판이 「작업 진도」를 주고, 마을은 곡물을 써서 부품을 만들고, 부품과 도토리로 소품을 골라 만든다.
//   · 공방은 하나, 무료로 받는다(두 판을 끝낸 뒤). 기본 일꾼이 딸려 와서 카드를 놓지 않아도 일한다. 곡물 3 을 같이 준다.
//   · 진도: 일반 판 1일 · 계약전 0.5일(기권한 판은 0). 소수는 버리지 않고 쌓는다.
//   · 생산식: 진도 ≥ 1일 · 곡물 ≥ 1 이면 진도 1일과 곡물 1 을 써서 부품 2 를 만든다. 곡물이 없으면 진도는 기다린다.
//   · 쓰는 곳: 소품을 골라 만든다(매대는 무작위, 공방은 고른다). 도토리는 매대보다 적게 들고 부품이 든다.
// 이 파일은 순수 함수다(DOM·three 없음). 마을 장면·화면은 v.workshop 을 읽기만 한다.
import { PROPS, PROP_PRICE } from './economy.js';

export const WORKSHOP_AFTER_GAMES = 2;      // 이만큼 끝낸 뒤 받을 수 있다(첫 판들은 판에만 집중)
export const WORKSHOP_GIFT_GRAIN = 3;
export const WORK_PER_GAME = { normal: 1, contract: 0.5 };
export const PARTS_PER_DAY = 2;
export const PARTS_MAX = 24;                // 선반이 차면 진도는 기다린다(버리지 않는다)
export const WORK_MAX = 10;                 // 쌓이는 진도의 끝(곡물을 오래 안 주면 여기서 멈춘다)
export const GRAIN_BUY_PRICE = 3;           // 장터가 곡물을 2 에 사 간다 — 사서 되팔아 남지 않게
// 소품 만들기: 값의 대부분이 부품이고 도토리는 조금. 왕관 동상(4단계)은 만들 수 없다.
// 첫 값(도토리 10 · 20 · 40 + 부품 2 · 4 · 6)에서는 섬을 짓는 20판 동안 봇이 하나도 못 만들었다 — 도토리가 다음 건물 몫으로 묶이고
// 부품은 20판째 끝(24)까지 찼다(island_sim workshop, 2026-11-16). 둘째 값(5 · 12 · 25 + 3 · 6 · 10)에서도 보통·약한 봇은 0개였다 —
// 건물을 짓자마자 도토리가 다음 건물 몫 아래로 떨어진다. 그래서 흔한 소품은 부품만으로 만든다.
export const CRAFT_COINS = [0, 0, 10, 25];
export const CRAFT_PARTS = [0, 4, 8, 12];
// 공방이 놓일 칸: 건물 자리(가운데)와 집(g7)을 피해 앞줄부터
const SPOTS = ['e2', 'd2', 'f2', 'c2', 'b2', 'g2', 'e3', 'd3', 'b3', 'g3', 'a2', 'h2', 'a1', 'h1'];

const round1 = (x) => Math.round(x * 10) / 10;

export const emptyWorkshop = () => null;

/** 저장에서 읽은 공방을 바로잡는다. 없거나 깨졌으면 null(아직 안 받음). */
export function sanitizeWorkshop(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.sq !== 'string' || !/^[a-h][1-8]$/.test(raw.sq)) return null;
  const n = (x, max) => (Number.isFinite(x) && x >= 0 ? Math.min(max, x) : 0);
  return { sq: raw.sq, work: round1(n(raw.work, WORK_MAX)), parts: Math.floor(n(raw.parts, PARTS_MAX)), made: Math.floor(n(raw.made, 1e6)), crafted: Math.floor(n(raw.crafted, 1e6)) };
}

/** 받을 수 있는가: 아직 없고, 판을 충분히 끝냈다. */
export const workshopOffered = (v) => !v.workshop && (v.games || 0) >= WORKSHOP_AFTER_GAMES;

/** 비어 있는 공방 자리. `taken(sq)` 은 그 칸이 차 있는가. */
export function workshopSpot(taken) {
  return SPOTS.find((sq) => !taken(sq)) || null;
}

/** 공방을 받는다: 빈 칸에 놓고 곡물 3 을 준다. 받았으면 null, 아니면 까닭('owned' · 'early' · 'room'). */
export function claimWorkshop(v, taken) {
  if (v.workshop) return 'owned';
  if ((v.games || 0) < WORKSHOP_AFTER_GAMES) return 'early';
  const sq = workshopSpot(taken);
  if (!sq) return 'room';
  v.workshop = { sq, work: 0, parts: 0, made: 0, crafted: 0 };
  v.grain = (v.grain || 0) + WORKSHOP_GIFT_GRAIN;
  return null;
}

/** 진도를 더한다. 공방이 없으면 쌓지 않는다. 더한 양을 돌려준다. */
export function addWork(v, days) {
  const w = v.workshop;
  if (!w || !(days > 0)) return 0;
  const before = w.work;
  w.work = round1(Math.min(WORK_MAX, w.work + days));
  return round1(w.work - before);
}

/** 생산식: 진도 1일 + 곡물 1 → 부품 2. 선반이 차면 멈춘다. 만든 부품 수를 돌려준다. */
export function produceParts(v) {
  const w = v.workshop;
  if (!w) return 0;
  let made = 0;
  while (w.work >= 1 && (v.grain || 0) >= 1 && w.parts + PARTS_PER_DAY <= PARTS_MAX) {
    w.work = round1(w.work - 1);
    v.grain -= 1;
    w.parts += PARTS_PER_DAY;
    made += PARTS_PER_DAY;
  }
  w.made += made;
  return made;
}

/** 곡물을 산다(도토리 3). 샀으면 null, 아니면 까닭. `reserve` 는 남겨 둘 도토리(다음 건물 몫). */
export function buyGrain(v, { reserve = 0, max = 20 } = {}) {
  if (!v.workshop) return 'none';
  if ((v.grain || 0) >= max) return 'full';
  if (v.coins < GRAIN_BUY_PRICE) return 'coins';
  if (v.coins - GRAIN_BUY_PRICE < reserve) return 'reserve';
  v.coins -= GRAIN_BUY_PRICE;
  v.grain = (v.grain || 0) + 1;
  return null;
}

/** 이 소품을 만드는 값. 만들 수 없는 종류면 null. */
export function craftCost(kind) {
  const tier = PROPS[kind]?.tier;
  if (!tier || !CRAFT_PARTS[tier]) return null;
  return { coins: CRAFT_COINS[tier], parts: CRAFT_PARTS[tier], shop: PROP_PRICE[tier] };
}

/** 소품을 만들어 보관함에 넣는다. 만들었으면 null, 아니면 까닭('none' · 'kind' · 'parts' · 'coins' · 'reserve'). */
export function craftProp(v, kind, { reserve = 0 } = {}) {
  const w = v.workshop;
  if (!w) return 'none';
  const cost = craftCost(kind);
  if (!cost) return 'kind';
  if (w.parts < cost.parts) return 'parts';
  if (v.coins < cost.coins) return 'coins';
  if (cost.coins > 0 && v.coins - cost.coins < reserve) return 'reserve';   // 도토리가 안 드는 것은 몫과 상관없다
  v.coins -= cost.coins;
  w.parts -= cost.parts;
  w.crafted += 1;
  v.stash[kind] = (v.stash[kind] || 0) + 1;
  return null;
}
