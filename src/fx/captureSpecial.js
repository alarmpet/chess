// 맞대결 특례 3종 (docs/plans/2026-11-08-capture-matchup-plan.md CX-4, 층 3).
// 공격 6 × 반응 5 조립 위에, 이야기가 있는 칸에만 얹는다. 셋 다 대국 시간을 늘리지 않는다.
//
//   거울 대결  같은 동물끼리(나이트·비숍·룩·퀸). 잡히는 쪽이 공격자의 준비 동작을 반쯤 따라 하다가
//              타격 전에 풀린다. 그 뒤는 CX-2 반응이 그대로 이어진다.
//   사자 포효  킹이 잡을 때. 잡힌 칸 둘레 두 칸 안의 말이 바람에 밀리듯 바깥쪽으로 살짝 흔들린다.
//   폰 콤보    폰이 폰을 잡을 때. 그 판에서 몇 번째 폰끼리 잡기인지에 따라 타격음이 반음씩 오른다.

import { attackWindPose } from './attackStyle.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => x * x * (3 - 2 * x);

/** 거울 대결이 되는 동물. 폰끼리는 너무 흔해(잡기의 약 9%) 빼고, 킹은 잡히지 않는다. */
export const MIRROR_TYPES = ['knight', 'bishop', 'rook', 'queen'];
/** 따라 하는 세기(공격자 준비 동작 대비). */
export const MIRROR_SHARE = 0.5;
/** 준비 동작이 공격 구간에서 차지하는 몫. attackStyle 의 WIND_SHARE 와 같다. */
const WIND_SHARE = 0.7;

export function isMirror(attackerType, capturedType) {
  return attackerType === capturedType && MIRROR_TYPES.includes(attackerType);
}

/**
 * 잡히는 쪽의 따라 하기 자세. attackStyle 과 같은 u·contact 를 받는다.
 * 준비 구간에서 공격자 준비 자세의 절반을 따라 하고, 준비가 끝나면 타격 지점까지 중립으로 풀린다.
 * 위치 필드(forward)는 쓰지 않는다 — 잡히는 말은 엔진이 자리를 잡아 준다.
 */
export function mirrorPose(type, u, contact = 0.6) {
  const neutral = { lift: 0, pitch: 0, roll: 0, yaw: 0, stretch: 1 };
  if (!MIRROR_TYPES.includes(type)) return neutral;
  const c = Math.min(0.95, Math.max(0.05, contact));
  const x = clamp01(u);
  const windEnd = c * WIND_SHARE;
  let w;
  let k;
  if (x <= windEnd) {
    w = x / windEnd;
    k = MIRROR_SHARE;
  } else {
    w = 1;
    k = x >= c ? 0 : MIRROR_SHARE * (1 - smooth((x - windEnd) / (c - windEnd)));
  }
  const p = attackWindPose(type, w);
  // 판다는 준비 자세가 없다(한 바퀴 구르기가 곧 공격). 따라 하기는 앞으로 몸을 숙여 구를 듯한 시늉.
  const pitch = type === 'bishop' ? 0.7 * smooth(w) : p.pitch;
  return { lift: p.lift * k, pitch: pitch * k, roll: p.roll * k, yaw: p.yaw * k, stretch: 1 + (p.stretch - 1) * k };
}

/** 포효가 닿는 거리(칸, 체비셰프). */
export const ROAR_REACH = 2;
/** 흔들림 길이(초). 공격이 끝나는 tStrikeDone(타격 뒤 0.48초)과 맞춰 다음 수를 막지 않는다. */
export const ROAR_SEC = 0.48;
/** 바로 옆 칸이 바깥쪽으로 젖혀지는 최대 각(라디안). */
export const ROAR_TILT = 0.2;

/**
 * 포효에 흔들리는 각. `dist` 는 잡힌 칸에서 체비셰프 거리(1~2), `t` 는 타격 뒤 초.
 * 0에서 시작해 0으로 끝나는 감쇠 흔들림이라 말이 원래 자세로 돌아온다. 범위 밖은 0.
 */
export function roarSway(dist, t) {
  if (!(dist >= 1 && dist <= ROAR_REACH) || !(t > 0) || t >= ROAR_SEC) return 0;
  const amp = ROAR_TILT / dist;
  const k = t / ROAR_SEC;
  return amp * Math.sin(Math.PI * 2.5 * k) * (1 - k) * (1 - k);
}

/** 콤보 음높이가 오르는 최대 반음 수(한 옥타브 안에서 멈춘다). */
export const COMBO_MAX_STEPS = 7;

/** `n` 번째 폰끼리 잡기의 음높이 배율. 첫 번째는 1, 이후 반음씩, 7반음에서 멈춘다. */
export function pawnComboPitch(n) {
  const steps = Math.min(COMBO_MAX_STEPS, Math.max(0, Math.floor(n) - 1));
  return 2 ** (steps / 12);
}

/**
 * 흐름 음 계단(방향 계획서 DR-1a, 2026-11-10): 한쪽이 잡기나 체크를 이어 간 횟수. 상대 수는 건너뛰고 그쪽의 수만 거꾸로 센다.
 * 조용한 수(잡기도 체크도 아님)를 두면 끊긴다. 마지막 수가 조용하면 0. 음높이는 pawnComboPitch(n) 과 같은 계단(반음, 7까지).
 * @param {{color: string, san?: string, captured?: string}[]} history chess.js 자세한 기록
 */
export function momentumSteps(history = [], color) {
  let n = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.color !== color) continue;
    if (m.captured || /[+#]$/.test(m.san || '')) n += 1;
    else break;
  }
  return n;
}

/** chess.js 자세한 기록(verbose history)에서 폰이 폰을 잡은 수를 센다. 앙파상도 폰끼리라 센다. */
export function countPawnTrades(history = []) {
  let n = 0;
  for (const m of history) if (m && m.piece === 'p' && m.captured === 'p') n += 1;
  return n;
}
