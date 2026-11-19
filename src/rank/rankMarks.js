// 왕관 도장 (랭커 보상 계획서 RW-1, 조사 docs/research/2026-11-10-ranker-rewards). 순수 함수라 화면과 서버가 같이 쓴다.
//   · 첫 도달 도장: 🐾 성체 · ⭐ 우두머리 · 👑 왕관에 처음 닿으면 한 번, 영원히(Brawl Stars 등급 첫 도달 기념). 시즌 초기화로 내려가도 남는다.
//   · 시즌 리본: 그 시즌 점수에 든 랭크 판 3판이면(RIBBON_MIN_GAMES, 시뮬로 정함) 등급과 무관하게(Hearthstone 「아무 등급 5승 카드 뒷면」). 이번 시즌 것은 5판째에 바로 보인다.
//   · 도토리·카드·코인은 붙이지 않는다(계획서 §3). 받는 법은 늘 적어 둔다(marks.js 와 같은 원칙).
import { TIER_START, placeOf } from './ladder.js';
import { RIBBON_MIN_GAMES } from './season.js';

export const FIRST_TIERS = ['adult', 'alpha', 'crown'];

/** 이번 점수로 새로 생기는 첫 도달(이미 가진 것 빼고, 낮은 것부터). */
export function newFirsts(have, points) {
  const got = new Set(have || []);
  return FIRST_TIERS.filter((t) => points >= TIER_START[t] && !got.has(t));
}

const FIRST_KO = { adult: '🐾 성체', alpha: '⭐ 우두머리', crown: '👑 왕관' };
const FIRST_EN = { adult: '🐾 Adult', alpha: '⭐ Alpha', crown: '👑 Crown' };

/** 첫 도달 도장 이름·받는 법. */
export function firstStamp(tier, en = false) {
  const name = en ? `${FIRST_EN[tier]} — first time` : `${FIRST_KO[tier]} 첫 도달`;
  const how = en ? `Reach ${TIER_START[tier]} ladder points once` : `사다리 ${TIER_START[tier]}점에 한 번 닿으면`;
  return { name, how };
}

/** 판 뒤 한 줄에 덧붙일 말: 「🎉 처음으로 ⭐ 우두머리! 도장을 받았어요」. */
export function firstLine(tier, en = false) {
  if (!tier) return null;
  return en ? `🎉 First time ${FIRST_EN[tier]}! Stamp earned` : `🎉 처음으로 ${FIRST_KO[tier]}! 도장을 받았어요`;
}

/**
 * 도장첩에 그릴 것.
 * @param {{ firsts?: {tier:string, season:number, at:number}[], trophies?: {season:number, tier:string}[], season?: {n:number, games:number, peak:number, minGames?:number} }} r  서버 /player 응답
 */
export function rankMarks(r) {
  const have = new Map((r?.firsts || []).map((f) => [f.tier, f]));
  const firsts = FIRST_TIERS.map((tier) => ({ tier, got: have.has(tier), season: have.get(tier)?.season ?? null }));
  const ribbons = (r?.trophies || []).map((t) => ({ season: t.season, tier: t.tier, current: false }));
  const s = r?.season;
  if (s && s.games >= (s.ribbonGames ?? RIBBON_MIN_GAMES) && !ribbons.some((x) => x.season === s.n)) {
    ribbons.unshift({ season: s.n, tier: placeOf(s.peak || 0).tier, current: true });
  }
  ribbons.sort((a, b) => b.season - a.season);
  return { firsts, ribbons, got: firsts.filter((f) => f.got).length + ribbons.length };
}

/** 리본 글자: 「🎀 시즌 3 함께 둠」(이번 시즌이면 「· 이번 시즌」). */
export function ribbonText(rb, en = false) {
  const base = en ? `🎀 Season ${rb.season} — played` : `🎀 시즌 ${rb.season} 함께 둠`;
  return rb.current ? `${base}${en ? ' · this season' : ' · 이번 시즌'}` : base;
}

/** 이번 시즌 리본까지 남은 판(받았으면 0). */
export function ribbonLeft(season) {
  if (!season) return null;
  return Math.max(0, (season.ribbonGames ?? RIBBON_MIN_GAMES) - (season.games || 0));
}
