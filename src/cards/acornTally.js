// 판 끝 「하나씩 세기」(방향 계획서 DR-1b, 2026-11-10). 이번 판에 번 도토리를 항목별로 줄 세운다.
// 근거: Balatro 개발자 — 점수가 하나씩 세어지는 것을 「지켜보는」 재미(조사 A §3). 세는 것은 **이미 번 것**만이다.
// 뽑기·상자에는 쓰지 않는다(조사 A (다) 1). 순수 함수라 화면 없이 테스트한다.
import { COINS } from '../village/economy.js';

const LABEL = {
  win: ['승리', 'Win'], draw: ['무승부', 'Draw'], loss: ['끝까지 둠', 'Played to the end'],
  mission: ['🎯 미션', '🎯 Mission'], bounty: ['💰 현상금', '💰 Bounty'], stamps: ['🏅 기술 도장', '🏅 Technique'],
  quests: ['📋 퀘스트', '📋 Quests'], rally: ['🔥 반격', '🔥 Comeback']
};

/**
 * @param {{ result: string, mission?: number, bounty?: number, stamps?: number, quests?: number, rally?: number }} g
 * @returns {{ items: { key: string, n: number, ko: string, en: string }[], total: number }}
 */
export function acornTally(g) {
  const items = [];
  const base = COINS[g?.result] ?? 0;
  if (base) items.push({ key: g.result, n: base, ko: LABEL[g.result][0], en: LABEL[g.result][1] });
  for (const key of ['mission', 'bounty', 'stamps', 'quests', 'rally']) {
    const n = Math.max(0, Math.floor(Number(g?.[key]) || 0));
    if (n) items.push({ key, n, ko: LABEL[key][0], en: LABEL[key][1] });
  }
  return { items, total: items.reduce((s, x) => s + x.n, 0) };
}

/** 몇 번째 항목까지 보이는지에 따른 누적 합(세는 동안의 큰 숫자). */
export const runningTotal = (items, shown) => items.slice(0, Math.max(0, shown)).reduce((s, x) => s + x.n, 0);

/** 항목 사이 간격(ms)과 음 계단 — n번째 항목은 반음 n-1 위, 한 옥타브 안. */
export const TALLY_STEP_MS = 320;
export const tallyPitch = (i) => 2 ** (Math.min(7, Math.max(0, i)) / 12);
