// 딱 맞는 AI (방향 계획서 DR-M1, 2026-11-10). 자유 대국의 AI 세기를 7단계로 나누고, 이 기기 안의 실력 점수로
// 다음 판 단계를 권한다. 순수 함수 — 화면(StrengthCoach.tsx)과 시뮬(tools/step_ladder.mjs)이 같은 표를 쓴다.
//   · 단계마다 탐색 깊이(ai.js LEVELS) · 실수(slip: 둘째·셋째 수) · 못 보기(blind: 사람이 놓치는 수, ai.js hardToSee).
//     약한 단계는 무작위 실수 대신 사람 같은 못 보기를 쓴다(m3, 조사 E A3·Maia).
//   · 단계 점수(STEP_RATING)는 이웃 단계끼리 봇 대국 점수에서 Elo 차로 이어 붙였다(tools/step_ladder.mjs, docs/perf/).
//   · 실력 점수는 판 사이에만 바뀌고, 단계가 바뀌면 화면이 알린다(숨은 고무줄 금지 — Hunicke 2005, 조사 E A8).
//   · 숫자는 화면에 보이지 않는다. 단계 이름과 동물 얼굴만(봇에 숫자를 붙이면 사람 레이팅과 비교돼 불만 — 조사 E A2).

export const STEPS = [
  { step: 1, search: 'easy', slip: 0.4, blind: 0.6, icon: '🐣', ko: '아기 미어캣', en: 'Baby meerkat' },
  { step: 2, search: 'easy', slip: 0.2, blind: 0.3, icon: '🐿️', ko: '다람쥐', en: 'Squirrel' },
  { step: 3, search: 'easy', slip: 0.04, blind: 0.05, icon: '🦊', ko: '여우', en: 'Fox' },
  { step: 4, search: 'easy', slip: 0, blind: 0, icon: '🐼', ko: '판다', en: 'Panda' },
  { step: 5, search: 'normal', slip: 0.08, blind: 0.1, icon: '🦏', ko: '코뿔소', en: 'Rhino' },
  { step: 6, search: 'normal', slip: 0.05, blind: 0, icon: '🐯', ko: '호랑이', en: 'Tiger' },
  { step: 7, search: 'hard', slip: 0, blind: 0, icon: '🦁', ko: '사자 왕', en: 'Lion king' }
];
export const STEP_COUNT = STEPS.length;
export const stepOf = (n) => STEPS[Math.min(STEP_COUNT, Math.max(1, Math.round(Number(n) || 1))) - 1];

/** 엔진 setFreePlay 에 넘길 모양. */
export const freePlayOf = (n) => {
  const s = stepOf(n);
  return { search: s.search, mistake: s.slip, blind: s.blind, stage: s.step <= 2 ? 'easy' : s.step <= 5 ? 'normal' : 'hard', step: s.step };
};

// ── 실력 점수와 추천(m2) ──
/** 단계마다의 점수(Elo 척도). tools/step_ladder.mjs 의 이웃 단계 점수를 Elo 차로 바꿔 1단계 = 600 에서 이어 붙인다. */
export const STEP_RATING = [600, 720, 780, 990, 1160, 1350, 1540];   // 이웃 단계 Elo 차 120·58·211·172·191·191 (step-ladder v3 24판, 6-7 은 v2 16판)
export const ratingOfStep = (n) => STEP_RATING[stepOf(n).step - 1];
/** 맞춰 줄 승률(사용자 결정 대기 §7-7 — 첫 값 「10판에 5~6판」). */
export const AIM = 0.55;
export const HOLD_GAMES = 3;          // 되돌리기 뒤 이만큼은 올리지 않는다
/** 자동 맞춤이 움직이는 여유 구간과 점수 변화 크기(첫 판들은 크게). tools/coach_sim.mjs 로 고른다. */
export let BAND = [0.37, 0.65];   // coach_sim 300명: 오르내림 3번+ 16%, 20판 안 도달 81%, 승률 중앙값 0.65
export let K_SCHEDULE = [[5, 150], [15, 80], [Infinity, 40]];
/** 시뮬 전용: 후보 값을 바꿔 본다. 게임 코드는 부르지 않는다. */
export function tuneCoach({ band, k } = {}) { if (band) BAND = band; if (k) K_SCHEDULE = k; }
export const SKILL_KEY = 'wildcrown.skill.v1';
export const START_STEP = 2;

export const expectedScore = (me, opp) => 1 / (1 + 10 ** ((opp - me) / 400));

/** 이 실력에서 AIM 에 가장 가까운 단계. */
export function recommendStep(rating, aim = AIM) {
  let best = 1;
  let gap = Infinity;
  for (const s of STEPS) {
    const g = Math.abs(expectedScore(rating, ratingOfStep(s.step)) - aim);
    if (g < gap - 1e-9) { gap = g; best = s.step; }
  }
  return best;
}

export function newSkill() {
  return { v: 1, rating: ratingOfStep(START_STEP) + 35, games: 0, mode: 'auto', step: START_STEP, hold: 0, change: null };
}

export function sanitizeSkill(raw) {
  const base = newSkill();
  if (!raw || raw.v !== 1) return base;
  const ok = (c) => c && Number.isFinite(c.from) && Number.isFinite(c.to);
  return {
    v: 1,
    rating: Number.isFinite(raw.rating) ? Math.max(0, Math.min(3000, raw.rating)) : base.rating,
    games: Math.max(0, Math.floor(raw.games || 0)),
    mode: raw.mode === 'fixed' ? 'fixed' : 'auto',
    step: stepOf(raw.step).step,
    hold: Math.max(0, Math.floor(raw.hold || 0)),
    change: ok(raw.change) ? { from: raw.change.from, to: raw.change.to } : null
  };
}

/**
 * 자유 대국 한 판을 반영한다. result 는 내 쪽 'win' | 'draw' | 'loss'. 판 중에는 부르지 않는다.
 * 자동이면 추천 단계 쪽으로 한 칸만 옮기고, 옮겼으면 change 에 남긴다(화면이 알리고 되돌리기를 준다).
 */
export function afterGame(state, { result, step }) {
  const s = sanitizeSkill(state);
  const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : result === 'loss' ? 0 : null;
  if (score === null) return s;
  const opp = ratingOfStep(step ?? s.step);
  const k = s.games < K_SCHEDULE[0][0] ? K_SCHEDULE[0][1] : s.games < K_SCHEDULE[1][0] ? K_SCHEDULE[1][1] : K_SCHEDULE[2][1];
  s.rating = Math.round(s.rating + k * (score - expectedScore(s.rating, opp)));
  s.games += 1;
  s.change = null;
  if (s.hold > 0) s.hold -= 1;
  if (s.mode === 'auto') {
    // 여유 구간: 지금 단계의 기대 승률이 BAND 밖일 때만 한 칸(판마다 오르내리지 않게, coach_sim 측정).
    const e = expectedScore(s.rating, ratingOfStep(s.step));
    let next = s.step;
    if (e > BAND[1] && s.hold === 0 && s.step < STEP_COUNT) next = s.step + 1;
    else if (e < BAND[0] && s.step > 1) next = s.step - 1;
    if (next !== s.step) {
      s.change = { from: s.step, to: next };
      s.step = next;
    }
  }
  return s;
}

/** 방금 바뀐 단계를 되돌린다. 되돌린 뒤 HOLD_GAMES 판은 올리지 않는다. */
export function undoChange(state) {
  const s = sanitizeSkill(state);
  if (!s.change) return s;
  s.step = s.change.from;
  s.change = null;
  s.hold = HOLD_GAMES;
  return s;
}

/** 설정에서 직접 고르기: 고정. */
export function pickStep(state, step) {
  const s = sanitizeSkill(state);
  return { ...s, mode: 'fixed', step: stepOf(step).step, change: null };
}
/** 「자동 맞춤」 켜고 끄기. 켜면 지금 단계에서 다시 맞춘다. */
export function setAuto(state, on) {
  const s = sanitizeSkill(state);
  return { ...s, mode: on ? 'auto' : 'fixed', change: null, hold: 0 };
}

/** @param {Storage | null} storage */
export function loadSkill(storage) {
  try {
    return sanitizeSkill(JSON.parse(storage?.getItem(SKILL_KEY) || 'null'));
  } catch (e) {
    return newSkill();
  }
}
export function saveSkill(storage, s) {
  try { storage?.setItem(SKILL_KEY, JSON.stringify(s)); } catch (e) { /* 막힌 저장: 이번 실행만 */ }
}

/** 화면 글자: 「🦊 여우 · 3/7」. */
export const stepLabel = (n, en = false) => {
  const s = stepOf(n);
  return `${s.icon} ${en ? s.en : s.ko} · ${s.step}/${STEP_COUNT}`;
};

/** 바뀐 단계 알림 한 줄. */
export function changeLine(change, en = false) {
  if (!change) return null;
  const up = change.to > change.from;
  const to = stepOf(change.to);
  if (en) return `${up ? 'You are getting stronger' : 'A gentler opponent next'} — next: ${to.icon} ${to.en} (${to.step}/${STEP_COUNT})`;
  return `${up ? '지난 판들을 보니 실력이 늘었어요' : '조금 쉬운 상대로 바꿨어요'} — 다음 상대 ${to.icon} ${to.ko} (${to.step}/${STEP_COUNT})`;
}
