// 판의 시간 · 밀물 (그래픽 계획 2026-11-18 WG-4 · WG-5, 11-19).
// 한 판이 하루다: 판을 열면 아침, 수가 쌓이며 한낮 → 금빛 오후 → 노을 → 밤. 밤은 검정이 아니라 옅은 라벤더다.
// 화면 보정(src/fx/postFx.js)이 장면 전체에 이 색을 곱하고, 톤매핑 전에 아주 밝은 것(보석 · 섬광 · 등불)은 덜 곱해 밤에 그것만 빛난다
// (Lumen 의 「판 전체 덧칠 한 장, 빛나는 것만 그 위에」를 읽고 같은 생각을 우리 셰이더로 했다).
// 왕관 계약전에서는 48반수 제한이 밀물이다: 남은 차례가 줄수록 물이 해변을 덮어 오고, 제한에 닿으면 판 가장자리까지 찬다.
// 순수 함수(DOM · three 없음).

/** 보통 체스 한 판의 「하루」 길이(반수). 이보다 길게 두면 밤에 머문다. */
export const CLASSIC_DAY_PLIES = 80;

/** 시간 이름과 그때의 색. `tint` 는 선형 색에 곱하고 `lift` 는 더한다(밤의 어둠이 검정이 아니라 라벤더가 되게). */
export const DAY_KEYS = Object.freeze([
  { at: 0.0, name: '아침', tint: [1.0, 0.95, 0.86], lift: [0, 0, 0] },
  { at: 0.3, name: '한낮', tint: [1.0, 1.0, 1.0], lift: [0, 0, 0] },
  { at: 0.58, name: '오후', tint: [1.1, 0.94, 0.72], lift: [0, 0, 0] },
  { at: 0.8, name: '노을', tint: [1.08, 0.66, 0.6], lift: [0.006, 0.0, 0.01] },
  { at: 1.0, name: '밤', tint: [0.5, 0.52, 0.9], lift: [0.014, 0.012, 0.036] }
]);

const clamp01 = (x) => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));
const ease = (t) => t * t * (3 - 2 * t);

/** 0(아침) ~ 1(밤) 의 시간에서 색. 키 사이는 부드럽게 섞는다. */
export function dayLook(u) {
  const t = clamp01(u);
  let i = 0;
  while (i < DAY_KEYS.length - 2 && t > DAY_KEYS[i + 1].at) i += 1;
  const a = DAY_KEYS[i];
  const b = DAY_KEYS[i + 1];
  const k = ease(clamp01((t - a.at) / (b.at - a.at)));
  const mix = (x, y) => x.map((v, j) => +(v + (y[j] - v) * k).toFixed(4));
  return { u: +t.toFixed(4), name: k < 0.5 ? a.name : b.name, tint: mix(a.tint, b.tint), lift: mix(a.lift, b.lift) };
}

/**
 * 지금 판의 시간(0 ~ 1). 계약전은 48반수 제한에 맞춰 하루가 흐르고, 보통 체스는 CLASSIC_DAY_PLIES 에 맞춘다.
 * 연습 문제는 한낮에 머문다(문제를 푸는 동안 어두워지지 않게).
 */
export function dayPhase({ plies = 0, limit = 0, puzzle = false } = {}) {
  if (puzzle) return DAY_KEYS[1].at;
  const len = limit > 0 ? limit : CLASSIC_DAY_PLIES;
  return clamp01(plies / len);
}

/**
 * 밀물(0 ~ 1): 계약전에서만. 남은 반수가 줄수록 차오르고, 처음 몇 수는 그대로다 — 숫자를 읽지 않아도 바다가 「얼마 남았나」를 말한다.
 * 0 이면 평소 해변, 1 이면 판 가장자리까지 물.
 */
export function tideLevel({ pliesLeft = 0, limit = 0, puzzle = false } = {}) {
  if (puzzle || !(limit > 0)) return 0;
  const used = clamp01(1 - pliesLeft / limit);
  return +ease(clamp01((used - 0.15) / 0.85)).toFixed(4);
}

/** 화면 값을 목표로 부드럽게 옮긴다(초당 `rate` 만큼의 비율). 수를 두면 1~2초에 걸쳐 바뀐다. */
export function approach(now, target, dt, rate = 1.4) {
  if (!Number.isFinite(now)) return target;
  const k = 1 - Math.exp(-Math.max(0, dt) * rate);
  const next = now + (target - now) * k;
  return Math.abs(target - next) < 1e-4 ? target : next;
}
