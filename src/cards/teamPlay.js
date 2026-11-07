// 둘이 한 왕국(협동 계획서 CO-1, 2026-11-07): 둘이 한 편이 돼 AI 와 둔다. 뇌가 말 종류를 부르고 손이 그 종류로 둔다.
// 엔진과 화면이 함께 쓰는 순수 함수 — DOM·three 없음. 근거: docs/plans/2026-11-07-coop-multiplayer-plan.md §4.1.

/** 뇌가 이 초 동안 말을 부르지 않으면 손이 아무 말이나 둘 수 있게 연다(시간패 없음). grok 안. */
export const HANDOVER_S = 20;

/** 역할 바꾸기: 'move' = 자기 편 수마다 뇌·손 교대(기본, coop_sim B 48% vs 고정 38%), 'game' = 판마다 교대. */
export const ROLE_SWAPS = ['move', 'game'];

/** FEN 의 수 번호로 이 판에서 내 편이 몇 번째 수를 두는지(0부터). 흑·백 모두 첫 수가 0. */
export function ownMoveIndex(fen) {
  const full = Number(String(fen || '').trim().split(/\s+/)[5]);
  return Number.isInteger(full) && full > 0 ? full - 1 : 0;
}

/** 이번 수에 뇌인 자리(0 또는 1). 손은 그 반대. */
export function brainSeat(ownIndex, swap = 'move', gameSeq = 0) {
  const n = swap === 'game' ? gameSeq : ownIndex;
  return ((Math.floor(n) % 2) + 2) % 2;
}

/**
 * 종류 잠금: 뇌가 한 번 부르면 손이 둘 때까지 다른 종류로 바꿀 수 없다.
 * `null`(끔·인계)과 `''`(새 차례, 아직 안 부름)은 언제나 받는다. 같은 종류를 다시 부르는 것도 받는다.
 */
export function lockKind(current, want) {
  if (want === null || want === undefined) return null;
  const w = String(want);
  if (w === '' || current === null || current === undefined || current === '') return w;
  return current;   // 다른 종류는 거부, 같은 종류는 그대로
}

/** 이 종류의 말을 집어 둘 수 있는가. `null` 은 손과 뇌가 꺼졌거나 인계된 상태. `''` 은 뇌가 아직 안 부름. */
export function kindAllows(kind, pieceType) {
  if (kind === null || kind === undefined) return true;
  return kind !== '' && pieceType === kind;
}
