// 랭크 남용 막기 (계획서 §4.2 R-4, 기획서 §12.6). 순수 함수라 Worker 와 화면, 시뮬이 같이 쓴다.
//   ① 같은 두 사람은 하루(한국 시각) 랭크 3판, 지난 7일 10판까지만 점수에 들어간다. 넘는 판은 기록만 남고 실력·사다리가 그대로다.
//      3 은 추정값이다(계획서). 짜고 올리기를 늦추고, 부모가 아이만 이겨 오르는 것도 늦춘다.
//   ② 두 사람 모두 첫 수를 두기 전에 끝난 판(2수 미만)은 무효 — 점수 없음(§12.6 「첫 수 60초 미착수 → 무효」).
//   ③ 사람이 낼 수 없는 기록: 내 수를 0.1초 안에 연달아 둠 → 거부하고 기기에 표시를 남긴다.
//   ④ 판 시간과 빌드 번호를 대조한다.
export const PAIR_DAILY_CAP = 3;
/** 지난 7일(오늘 포함) 같은 두 사람 상한. */
export const PAIR_WEEKLY_CAP = 10;
export const MIN_PLIES = 2;
/** 랭크 판 규칙(보고서 모양·검사)이 바뀌면 올린다. Worker 의 MIN_BUILD 보다 낮으면 거부. */
export const RANK_BUILD = 1;
export const FAST_MS = 100;
export const FAST_RUN = 5;
/** 보고가 이보다 늦으면 거부(판이 끝난 지 하루). */
export const STALE_MS = 24 * 3600 * 1000;
/** 기기 시계가 서버보다 이만큼까지 앞서도 받아 준다. */
export const SKEW_MS = 10 * 60 * 1000;
/** 혼자 낸 이탈 몰수는 이만큼 기다렸다가 넣는다. 그 사이 상대가 다른 보고를 내면 두 보고를 맞춰 본다. */
export const ABANDON_WAIT_MS = 3 * 60 * 1000;

const KST = 9 * 3600 * 1000;
/** 한국 시각 날짜 번호(자정에 바뀜). */
export const dayOf = (ms) => Math.floor((ms + KST) / 86400000);
/** 그날의 시작(UTC ms). */
export const dayStart = (ms) => dayOf(ms) * 86400000 - KST;

/** 같은 두 사람이 오늘·지난 7일(오늘 포함) 이미 점수에 넣은 판 수로 이 판이 상한에 걸리는지. */
export const pairCapped = (countedToday, countedWeek = 0) => countedToday >= PAIR_DAILY_CAP || countedWeek >= PAIR_WEEKLY_CAP;

/**
 * 한 사람의 시간 기록을 검사한다. meta = { build, start, end, think: [내 수마다 걸린 ms] }.
 * 맞으면 null, 아니면 이유: old-build · time · stale · inhuman.
 */
export function metaError(meta, { plies, myPlies, now, minBuild = RANK_BUILD }) {
  if (!meta || !Number.isInteger(meta.build) || meta.build < minBuild) return 'old-build';
  const { start, end, think } = meta;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || !Array.isArray(think) || think.length > myPlies) return 'time';
  if (!think.every((t) => Number.isFinite(t) && t >= 0 && t <= 24 * 3600 * 1000)) return 'time';
  if (end > now + SKEW_MS) return 'time';
  if (now - end > STALE_MS) return 'stale';
  // 판 전체가 한 수에 0.05초도 안 걸렸다면 사람 판이 아니다(재 보지 않은 경계, 넉넉히 잡음).
  if (plies >= 10 && end - start < plies * 50) return 'inhuman';
  let run = 0;
  for (const t of think) { run = t < FAST_MS ? run + 1 : 0; if (run >= FAST_RUN) return 'inhuman'; }
  return null;
}
