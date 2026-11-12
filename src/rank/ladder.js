// 왕관 사다리 (계획서 §4.4 L-1, 조사 docs/research/2026-11-09-ranking-psychology). 보이는 랭크.
// 실력 점수(Glicko-2, glicko2.js)는 공정성 계산에만 쓰고, 화면에는 매 판 오르내리는 이 사다리를 보여 준다.
//   칸: 새끼 III·II·I → 성체 III·II·I → 우두머리 III·II·I → 왕관(점수만). 칸마다 100점. 승급전 없음.
//   매 판: 이기면 +, 지면 −. 사다리가 실력 목표보다 낮으면 이길 때 더·질 때 덜(따라가기).
//   새끼 등급에서는 지지 않는다. 큰 등급에 한 번 닿으면 이번 시즌 그 아래로 안 떨어진다(바닥).
//   3연승부터 이긴 점수 +50%. 판 전에 「이기면 +a · 지면 −b」 를 보여 준다.
// 순수 함수라 화면(예고)과 서버(확정)가 같이 쓴다. 값은 tools/ladder_sim.mjs 로 정했다.

export const STEP = 100;
export const TIERS = ['cub', 'adult', 'alpha', 'crown'];
export const TIER_START = { cub: 0, adult: 300, alpha: 600, crown: 900 };
export const START_LADDER = { points: 0, floor: 0, streak: 0 };
/** 조정 값(시뮬로 고름, tools/ladder_sim.mjs). noLossBelow: 이 점수 아래에선 져도 안 잃음. floorTiers: 바닥이 생기는 큰 등급. */
export const RULES = { noLossBelow: 200, floorTiers: ['adult', 'alpha', 'crown'], minWin: 3, minWinAbove: 1, adjMin: -16, streakBelowOnly: true };
// R-4(11-09): 실력 목표보다 위에 있으면 🔥 를 끄고 최소 승점을 1 로, 감속을 −16 까지 넓힌다.
//   예전 식은 강한 쪽이 약한 친구만 이겨도 목표 위로 계속 올랐다(부모 대 아이 60일 1459점, 목표 794). 시뮬: tools/ladder_sim.mjs

/** 실력 → 사다리가 따라갈 목표 점수. 1500(새내기 기본) = 성체 II 근처. */
export const TARGET = { base: 1200, scale: 1.5, max: 1500 };
export function targetOf(rating) {
  return Math.max(0, Math.min(TARGET.max, Math.round((rating - TARGET.base) * TARGET.scale)));
}

/** 점수 → 칸. step 은 III=3·II=2·I=1, 왕관은 null. into 는 이 칸 안에서 몇 점, pct 는 다음 칸까지 진행 비율. */
export function placeOf(points) {
  const p = Math.max(0, Math.floor(points));
  if (p >= TIER_START.crown) return { tier: 'crown', step: null, into: p - TIER_START.crown, pct: null, points: p };
  const tierIdx = Math.floor(p / (STEP * 3));
  const into = p % STEP;
  const step = 3 - Math.floor((p % (STEP * 3)) / STEP);
  return { tier: TIERS[tierIdx], step, into, pct: into / STEP, points: p };
}

/** 이 점수에서 생기는 바닥(큰 등급 시작점). */
export const floorFor = (points) => {
  let f = 0;
  for (const t of RULES.floorTiers) if (points >= TIER_START[t]) f = Math.max(f, TIER_START[t]);
  return f;
};

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const expected = (me, opp) => 1 / (1 + 10 ** ((opp - me) / 400));

/**
 * 판 전 예고. me/opp 는 판 전 실력(Glicko rating). state 는 내 사다리.
 * @returns {{win:number, loss:number, draw:number, streakBonus:boolean, rawLoss:number, inCub:boolean}}  loss·draw 는 실제로 깎이는 양(바닥·새끼 반영, 0 이상이면 양수=감소)
 */
export function preview(state, me, opp) {
  const s = { ...START_LADDER, ...state };
  const E = expected(me, opp);
  const above = s.points > targetOf(me);
  const adj = clamp((targetOf(me) - s.points) / 20, RULES.adjMin, 8);   // 실력보다 낮으면 +, 높으면 −
  let win = clamp(Math.round(20 * (1.5 - E) + adj), above ? RULES.minWinAbove : RULES.minWin, 40);
  const streakBonus = s.streak >= 2 && !(RULES.streakBelowOnly && above);
  if (streakBonus) win = Math.round(win * 1.5);
  const rawLoss = clamp(Math.round(20 * (0.5 + E) - adj), 4, 35);
  let loss = rawLoss;
  let draw = clamp(Math.round((E - 0.5) * 20 - adj / 2), -10, 10);   // 양수 = 감소
  const inCub = s.points < RULES.noLossBelow;
  const floor = Math.max(s.floor || 0, floorFor(s.points));
  const room = Math.max(0, s.points - floor);
  loss = inCub ? 0 : Math.min(loss, room);
  if (draw > 0) draw = inCub ? 0 : Math.min(draw, room);
  return { win, loss, draw, streakBonus, rawLoss, inCub };
}

/**
 * 한 판 반영. score: 이김 1 · 비김 0.5 · 짐 0.
 * @returns {{state, delta, before, after, floored, streakBonus, tierUp, stepUp}}
 */
export function applyGame(state, { score, me, opp }) {
  const s = { ...START_LADDER, ...state };
  const pv = preview(s, me, opp);
  const before = placeOf(s.points);
  const delta = (score === 1 ? pv.win : score === 0 ? -pv.loss : -pv.draw) || 0;   // -0 을 0 으로
  const points = Math.max(0, s.points + delta);
  const floor = Math.max(s.floor || 0, floorFor(points));
  const after = placeOf(points);
  // 바닥에 막혔는가: 졌는데 바닥 때문에 원래 감소보다 덜 깎였을 때(새끼 등급의 「안 잃음」은 따로).
  const floored = score === 0 && !pv.inCub && pv.loss < pv.rawLoss;
  return {
    state: { points, floor, streak: score === 1 ? s.streak + 1 : 0 },
    delta, before, after, floored,
    streakBonus: score === 1 && pv.streakBonus,
    tierUp: TIERS.indexOf(after.tier) > TIERS.indexOf(before.tier),
    stepUp: after.tier === before.tier && after.step !== null && before.step !== null && after.step < before.step
  };
}

// 시즌 초기화는 season.js(L-4).
