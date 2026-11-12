// 시즌 (계획서 §4.4 L-4, 조사 ⑦ 부드러운 초기화 · ⑪ 겉모습 보상). 순수 함수라 화면과 서버(worker)가 같이 쓴다.
//   · 시즌은 4주(28일). 한국 시각 월요일 0시에 바뀐다. 첫 시즌 시작은 SEASON_EPOCH.
//   · 바뀌면 사다리는 큰 등급 하나만큼 내려간다(RESET). 바닥·연승은 비운다. 실력(Glicko)은 그대로.
//   · 쉬어도 깎이지 않는다(조사 ⑪): 여러 시즌을 건너뛰어도 초기화는 한 번만.
//   · 보상은 겉모습뿐: 그 시즌에 닿은 가장 높은 등급의 「테두리」. 도토리·카드·코인 없음. 랭크 판 SEASON_MIN_GAMES 판 이상 둔 시즌만. RIBBON_MIN_GAMES 판이면 리본(rankMarks.js).
// 서버는 사람을 읽거나 판을 넣을 때 시즌이 지났으면 rollSeason 으로 그 자리에서 넘긴다(게으른 초기화 — 정해진 시각에 도는 작업이 없다).
import { STEP, TIERS, TIER_START, placeOf } from './ladder.js';

export const DAY_MS = 86400e3;
export const SEASON_DAYS = 28;
export const SEASON_EPOCH = Date.UTC(2026, 10, 1, 15, 0, 0);   // 2026-11-02(월) 00:00 KST
export const SEASON_MIN_GAMES = 5;     // 등급 테두리 문턱
/** 시즌 리본 문턱(랭커 보상 RW-1). 시뮬(tools/ladder_sim.mjs --per 30 --ribbon 3|5): 5판이면 적게 두는 사람 26% 가 6시즌 동안 아무것도 못 받았고, 3판이면 0%. */
export const RIBBON_MIN_GAMES = 3;
/** 초기화 방식(시뮬로 고름, tools/ladder_sim.mjs --reset): 'minus300' 큰 등급 하나만큼(300점) 빼기 · 'tierStart' 한 등급 아래 시작점 · 'none'. */
export const SEASON_RULES = { reset: 'minus300' };

/** 시각 → 시즌 번호(1부터). 첫 시즌 전은 1. */
export const seasonOf = (ms) => Math.max(1, Math.floor((ms - SEASON_EPOCH) / (SEASON_DAYS * DAY_MS)) + 1);
export const seasonStart = (n) => SEASON_EPOCH + (n - 1) * SEASON_DAYS * DAY_MS;
export const seasonEnd = (n) => seasonStart(n + 1);
/** 남은 날(올림). 마지막 날이면 1. */
export const daysLeft = (ms) => Math.max(1, Math.ceil((seasonEnd(seasonOf(ms)) - ms) / DAY_MS));

/** 시즌 초기화: 사다리 점수만 내린다. 새끼 등급은 그대로(이미 바닥). */
export function seasonReset(state, how = SEASON_RULES.reset) {
  const pts = Math.max(0, Math.floor(state.points || 0));
  let points = pts;
  if (how === 'minus300') points = pts >= TIER_START.adult ? pts - STEP * 3 : pts;
  else if (how === 'tierStart') {
    const idx = TIERS.indexOf(placeOf(pts).tier);
    points = idx <= 0 ? pts : TIER_START[TIERS[idx - 1]];
  }
  return { points, floor: 0, streak: 0 };
}

/** 지난 시즌 기록 → 시즌 기록(없으면 null). 3판 이상이면 리본, 5판 이상이면 그 시즌 최고 등급 테두리(frame). */
export function trophyOf({ season, peak = 0, games = 0 }) {
  if (games < RIBBON_MIN_GAMES) return null;
  return { season, tier: placeOf(peak).tier, peak, games, frame: games >= SEASON_MIN_GAMES };
}
/** 서버 줄(games 만 있는 것)에도 frame 을 붙인다. games 가 없던 옛 줄은 테두리로 본다. */
export const withFrame = (t) => (t ? { ...t, frame: t.frame ?? (t.games == null || t.games >= SEASON_MIN_GAMES) } : t);

/**
 * 사람 한 명을 지금 시즌으로 넘긴다.
 * @param {{points:number, floor:number, streak:number, season?:number, peak?:number, sgames?:number}} row
 * @param {number} current 지금 시즌 번호
 * @returns {{row: object, rolled: boolean, trophy: null | {season:number, tier:string, peak:number}}}
 */
export function rollSeason(row, current) {
  const season = Number(row.season) || current;
  if (season >= current) return { row: { ...row, season, peak: Math.max(row.peak || 0, row.points || 0), sgames: row.sgames || 0 }, rolled: false, trophy: null };
  const trophy = trophyOf({ season, peak: Math.max(row.peak || 0, row.points || 0), games: row.sgames || 0 });
  const next = seasonReset(row);
  return { row: { ...row, ...next, season: current, peak: next.points, sgames: 0 }, rolled: true, trophy };
}

/** 가장 좋은 테두리(등급이 높고, 같으면 최근 시즌). */
export function bestTrophy(trophies) {
  let best = null;
  for (const raw of trophies || []) {
    const t = withFrame(raw);
    if (!t || !t.frame) continue;
    const r = TIERS.indexOf(t.tier), br = best ? TIERS.indexOf(best.tier) : -1;
    if (r > br || (r === br && t.season > best.season)) best = t;
  }
  return best;
}
