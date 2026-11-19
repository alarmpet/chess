// 위기 알림(재미 계획서 FN-3, 2026-11-07): 연습 단계(쉬움)에서 내 큰 말(호랑이·코뿔소)이 진짜로 위험하면 한 줄로 알린다.
// 「진짜로 위험」= 더 싼 말이 노리거나, 지켜 주는 말이 없는데 노려짐. 사실만 말하고 수는 알려 주지 않는다.
// 같은 말이 계속 노려지면 다시 말하지 않는다(새로 노려진 말만). 화면 없이 순수 함수.
import { Chess } from 'chess.js';

const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
export const BIG = ['q', 'r'];
export const ANIMAL_KO = { q: '호랑이', r: '코뿔소' };
export const ANIMAL_EN = { q: 'tiger', r: 'rhino' };

/** `color` 쪽 큰 말 중 진짜로 위험한 칸들. [{square, type}] */
export function bigThreats(fen, color) {
  const c = new Chess(fen);
  const enemy = color === 'w' ? 'b' : 'w';
  const out = [];
  for (const row of c.board()) {
    for (const p of row) {
      if (!p || p.color !== color || !BIG.includes(p.type)) continue;
      const attackers = c.attackers(p.square, enemy);
      if (!attackers.length) continue;
      const cheaper = attackers.some((sq) => VALUE[c.get(sq).type] < VALUE[p.type]);
      const guarded = c.isAttacked(p.square, color);
      if (cheaper || !guarded) out.push({ square: p.square, type: p.type });
    }
  }
  return out;
}

/** 지난번에 말한 칸들(`said`)과 비교해 새로 위험해진 말 하나에 대한 알림. 없으면 text null. */
export function threatNote(fen, color, said = []) {
  const now = bigThreats(fen, color);
  const fresh = now.filter((t) => !said.includes(t.square));
  const pick = fresh.sort((a, b) => VALUE[b.type] - VALUE[a.type])[0];
  return {
    said: now.map((t) => t.square),
    text: pick ? { ko: `${ANIMAL_KO[pick.type]}가 노려지고 있어요`, en: `Your ${ANIMAL_EN[pick.type]} is under attack` } : null,
    square: pick?.square || null
  };
}
