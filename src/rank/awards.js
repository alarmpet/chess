// 친구 무대 시즌 상(랭커 보상 RW-3)과 과정 도장(RW-4). 순수 함수라 서버(시즌 넘길 때·판 넣을 때)와 화면이 같이 쓴다.
//   RW-3: 시즌이 끝나면 「내 무대」(그 시즌 나와 둔 친구들 + 나) 안에서
//     🏆 무대 1등 — 그 시즌 최고 사다리 점수가 가장 높은 사람(같으면 함께).
//     🌱 가장 많이 오른 — 시즌 첫 판 전 → 마지막 판 뒤 점수 차이가 가장 큰 사람(0 보다 커야). 1등이 혼자면 그 사람은 빼고 다음 사람에게.
//     조건: 나는 그 시즌 SEASON_MIN_GAMES 판 이상, 무대는 STAGE_MIN 명 이상(나 포함).
//     상은 글자 기록뿐이다(재화 없음). 두 기기로 가짜 친구를 만들 수 있어서다(R-4 남은 구멍).
//   RW-4: 끝까지 둔 랭크 판 10·30·100, 나보다 높은 등급 친구에게 첫 승·첫 무승부. 줄지 않는다. 도토리 없음.
import { TIERS, placeOf } from './ladder.js';
import { SEASON_MIN_GAMES } from './season.js';

export const STAGE_MIN = 3;
export const PLAYED_STEPS = [10, 30, 100];

/**
 * 한 시즌 판 기록 → 사람마다 { games, peak, start, end, gain }.
 * @param {{white:string, black:string, at:number, ladder:{white:{before:number, after:number}, black:{before:number, after:number}}}[]} rows  점수에 든 판(counted)만
 */
export function seasonStats(rows) {
  const out = new Map();
  const sorted = [...(rows || [])].filter((r) => r?.ladder).sort((a, b) => a.at - b.at);
  for (const r of sorted) {
    for (const side of ['white', 'black']) {
      const id = r[side];
      const l = r.ladder[side];
      if (!id || !l) continue;
      const s = out.get(id) || { games: 0, peak: 0, start: l.before, end: l.after };
      s.games++;
      s.peak = Math.max(s.peak, l.before, l.after);
      s.end = l.after;
      out.set(id, s);
    }
  }
  for (const s of out.values()) s.gain = s.end - s.start;
  return out;
}

/**
 * 내 무대에서 내가 받는 상. 무대 = 나 + 그 시즌 나와 둔 사람.
 * @returns {{kind:'top'|'rise', size:number}[]}
 */
export function stageAwards(meId, rows, { minGames = SEASON_MIN_GAMES, minPeople = STAGE_MIN } = {}) {
  const stats = seasonStats(rows);
  const me = stats.get(meId);
  if (!me || me.games < minGames) return [];
  const circle = new Set([meId]);
  for (const r of rows || []) if (r.white === meId) circle.add(r.black); else if (r.black === meId) circle.add(r.white);
  if (circle.size < minPeople) return [];
  const people = [...circle].map((id) => ({ id, ...(stats.get(id) || { peak: 0, gain: 0 }) }));
  const out = [];
  const maxPeak = Math.max(...people.map((p) => p.peak));
  const tops = people.filter((p) => p.peak === maxPeak);
  if (me.peak === maxPeak) out.push({ kind: 'top', size: circle.size });
  const risers = people.filter((p) => p.gain > 0 && !(tops.length === 1 && p.id === tops[0].id));
  if (risers.length) {
    const best = Math.max(...risers.map((p) => p.gain));
    if (risers.some((p) => p.id === meId && p.gain === best)) out.push({ kind: 'rise', size: circle.size });
  }
  return out;
}

/** 상 글자: 「🏆 시즌 2 무대 1등 · 4명」, 「🌱 시즌 2 가장 많이 오름 · 4명」. */
export function awardText(a, en = false) {
  if (a.kind === 'top') return en ? `🏆 Season ${a.season} stage #1 · ${a.size}` : `🏆 시즌 ${a.season} 무대 1등 · ${a.size}명`;
  return en ? `🌱 Season ${a.season} most improved · ${a.size}` : `🌱 시즌 ${a.season} 가장 많이 오름 · ${a.size}명`;
}

/** 판 하나의 과정 도장: 판 전 등급이 나보다 높은 상대를 이기면 'upset-win', 비기면 'upset-draw'. */
export function upsetFeat(myPoints, oppPoints, score) {
  if (TIERS.indexOf(placeOf(oppPoints).tier) <= TIERS.indexOf(placeOf(myPoints).tier)) return null;
  return score === 1 ? 'upset-win' : score === 0.5 ? 'upset-draw' : null;
}

const FEAT = {
  'upset-win': ['🦁 더 높은 등급 친구에게 첫 승', '🦁 First win over a higher tier', '나보다 높은 등급 친구를 이기면', 'Beat a friend in a higher tier'],
  'upset-draw': ['🤝 더 높은 등급 친구와 첫 무승부', '🤝 First draw with a higher tier', '나보다 높은 등급 친구와 비기면', 'Draw with a friend in a higher tier']
};

/** 과정 도장 목록(받은 것·받는 법). games 는 점수에 든 랭크 판 수, feats 는 서버 firsts 의 kind 들. */
export function processStamps(games, feats, en = false) {
  const have = new Set(feats || []);
  const played = PLAYED_STEPS.map((n) => ({
    key: `played-${n}`, got: (games || 0) >= n,
    name: en ? `♟️ ${n} ranked games to the end` : `♟️ 끝까지 둔 랭크 판 ${n}`,
    how: en ? `${Math.max(0, n - (games || 0))} more` : `${Math.max(0, n - (games || 0))}판 남음`
  }));
  const feats2 = Object.entries(FEAT).map(([k, t]) => ({ key: k, got: have.has(k), name: en ? t[1] : t[0], how: en ? t[3] : t[2] }));
  return [...played, ...feats2];
}

/** 판 뒤 한 줄용. */
export function featLine(feat, en = false) {
  if (!FEAT[feat]) return null;
  return en ? `${FEAT[feat][1]}! Stamp earned` : `${FEAT[feat][0]}! 도장을 받았어요`;
}
