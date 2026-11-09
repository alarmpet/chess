// 왕관 사다리 화면 글자 (계획서 §4.4 L-2). 순수 함수라 테스트한다.
// 원칙(조사 ⑪): 진 판은 감소보다 「끝까지 둠」을 먼저, 칭찬은 과정에. 「한 판 더」를 밀지 않는다.
import { badgeLabel } from './glicko2.js';

const ROMAN = { 3: 'III', 2: 'II', 1: 'I' };

/** 칸 이름: 「🐾 성체 II」, 왕관은 「👑 왕관」. */
export function placeName(place, en = false) {
  const b = badgeLabel(place?.tier || 'cub', en);
  return place?.step ? `${b.icon} ${b.name} ${ROMAN[place.step]}` : `${b.icon} ${b.name}`;
}

/** 짧은 칩: 「🐾II 437」. */
export function placeChip(place) {
  const b = badgeLabel(place?.tier || 'cub');
  return `${b.icon}${place?.step ? ROMAN[place.step] : ''} ${place?.points ?? 0}`;
}

/** 다음 칸까지: 「다음 칸까지 36점」(왕관이면 null). */
export function toNext(place, en = false) {
  if (!place || place.step == null) return null;
  const left = 100 - place.into;
  return en ? `${left} to the next step` : `다음 칸까지 ${left}점`;
}

/** 판 전 예고: 「이기면 +28 · 지면 −12」(새끼 칸이면 「지면 0」 대신 「져도 그대로」). */
export function stakesLine(pv, en = false) {
  if (!pv) return '';
  const win = `${en ? 'Win' : '이기면'} +${pv.win}${pv.streakBonus ? ' 🔥' : ''}`;
  const lose = pv.loss === 0 ? (en ? 'lose: no drop' : '져도 그대로') : `${en ? 'lose' : '지면'} −${pv.loss}`;
  return `${win} · ${lose}`;
}

/** 판 뒤 한 줄(내 사다리 변화). */
export function ladderLine(l, en = false) {
  if (!l) return '';
  const parts = [];
  if (l.delta > 0) parts.push(`+${l.delta}${l.streakBonus ? ` 🔥${l.streak}${en ? ' in a row' : '연승'}` : ''}`);
  else if (l.delta < 0) parts.push(`−${-l.delta}`);
  else parts.push('±0');
  if (l.tierUp || l.stepUp) parts.push(`⬆ ${placeName(l.place, en)}!`);
  else parts.push(placeName(l.place, en));
  if (l.floored) parts.push(en ? '🛡️ floor held' : '🛡️ 바닥 지킴');
  else if (l.delta === 0 && l.place?.tier === 'cub') parts.push(en ? 'Cub steps never drop' : '새끼 칸은 안 잃어요');
  if (l.delta <= 0) parts.push(en ? 'You played it to the end' : '끝까지 잘 뒀어요');
  return parts.join(' · ');
}

/** 같은 상대 상한(R-4) 예고: 상한에 걸리면 판 전에 미리 알린다. 아직이면 null. */
export function pairLine(pair, en = false) {
  if (!pair?.capped) return null;
  const why = pair.today >= pair.dayCap
    ? (en ? `${pair.dayCap} ranked games with this friend today` : `오늘 이 친구와 랭크 ${pair.dayCap}판을 다 뒀어요`)
    : (en ? `${pair.weekCap} ranked games with this friend this week` : `이번 주 이 친구와 랭크 ${pair.weekCap}판을 다 뒀어요`);
  return `${why} · ${en ? 'this game won’t change scores' : '이 판은 점수가 그대로예요'}`;
}

/** 점수에 안 든 판(R-4)의 판 뒤 한 줄. counted 면 null. */
export function outcomeLine(outcome, en = false) {
  if (outcome === 'capped') return en ? 'Played for fun — the daily limit with this friend is reached, scores stay' : '같은 친구와 둔 판 수가 다 차서 점수는 그대로예요';
  if (outcome === 'void') return en ? 'No first moves — this game doesn’t count' : '첫 수 전에 끝난 판이라 점수에 넣지 않아요';
  return null;
}
