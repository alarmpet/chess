// 계약전 한 판의 판정 (슬롯 체스 계획서 2026-11-11 §3.1 · §3.2, SC-1).
// 표준 합법 행마는 그대로 두고, 「언제·누가 이겨서 끝나는가」만 다시 정한다. 순수 함수(DOM·three·chess.js 없음).
import { CONTRACT_NEED, contractById, contractProgress, isJackpot } from './contractSets.js';

/** 길이 상한: 양쪽 24차례씩(§3.1). 흑의 24번째 수까지 둔 뒤에 판정한다. */
export const CONTRACT_PLY_LIMIT = 48;

/**
 * 방금 수까지의 판정. `moves` 는 chess.js verbose 기보, `standard` 는 지금 국면의 표준 종료 사실:
 *   { checkmate, stalemate, threefold, fifty, kingsOnly }
 * 순서(§3.2-1): 체크메이트 → 계약 2개 → 스테일메이트 → 3회 반복 → 50수 → 킹만 남음 → 차례 상한.
 * 기물 부족 무승부는 「킹만 남음」 말고는 쓰지 않는다 — 메이트가 안 돼도 목표 포획으로 이길 수 있다(§3.2-5).
 * 돌려주는 값: { over, winner('w'|'b'|null), reason, progress, pliesLeft }
 *   reason: 'checkmate' | 'contract' | 'stalemate' | 'threefold' | 'fifty' | 'kings' | 'limit' | null
 */
export function contractVerdict(set, moves = [], standard = {}, limit = CONTRACT_PLY_LIMIT) {
  const progress = contractProgress(set, moves);
  const pliesLeft = Math.max(0, limit - moves.length);
  const end = (winner, reason) => ({ over: true, winner, reason, progress, pliesLeft });
  if (standard.checkmate) return end(moves.length ? moves[moves.length - 1].color : null, 'checkmate');
  if (progress.winner) return end(progress.winner, 'contract');
  if (standard.stalemate) return end(null, 'stalemate');
  if (standard.threefold) return end(null, 'threefold');
  if (standard.fifty) return end(null, 'fifty');
  if (standard.kingsOnly) return end(null, 'kings');
  if (moves.length >= limit) {
    const w = progress.w.done, b = progress.b.done;
    return end(w > b ? 'w' : b > w ? 'b' : null, 'limit');
  }
  return { over: false, winner: null, reason: null, progress, pliesLeft };
}

// ── 상대가 함께 자란다(직관성 계획 §0.2 ②, IR-1): AI 가 「계약을 아는 정도」가 계약전의 첫 난이도다.
//   0 입문 — 계약을 모른다 · 1 초급 — 제 목표를 노리기만 하고 내 표적은 지키지 않는다 · 2 정식 — 다 안다
// 이기면 한 칸 오르고, 두 판을 내리 지면 한 칸 내려온다. 판 사이에만 바뀌고 화면에 이름으로 적는다.
export const RUNG_NOVICE = 0;
export const RUNG_ATTACK = 1;
export const RUNG_FULL = 2;
export const RUNG_NAMES = ['입문', '초급', '정식'];
export const RUNG_DROP_AFTER = 2;
export function nextRung(rung, lossRun, result) {
  if (result === 'win') return { rung: Math.min(RUNG_FULL, rung + 1), lossRun: 0 };
  if (result !== 'loss') return { rung, lossRun };
  return lossRun + 1 >= RUNG_DROP_AFTER ? { rung: Math.max(RUNG_NOVICE, rung - 1), lossRun: 0 } : { rung, lossRun: lossRun + 1 };
}

/** AI 에게 넘기는 계약 상태(평범한 데이터 — 작업자 스레드로 건너간다). */
export function contractAiState(set, moves = [], limit = CONTRACT_PLY_LIMIT, rung = RUNG_FULL, aiColor = null) {
  if (rung <= RUNG_NOVICE) return undefined;   // 입문: 상대는 계약을 모른다 — 일반 체스처럼 둔다
  const progress = contractProgress(set, moves);
  return {
    ...(rung === RUNG_ATTACK && aiColor ? { only: aiColor } : {}),
    goals: set.goals.map((g) => ({ type: g.type, count: g.count })),
    need: CONTRACT_NEED,
    counts: { w: progress.w.counts.slice(), b: progress.b.counts.slice() },
    left: Math.max(0, limit - moves.length)
  };
}

// ── 보상(SC-2, 계획서 §7.2): 짧은 판이라 일반 판(30/20/15)보다 적다. 기권한 판은 받지 않는다(끝까지 둔 판만).
// 잭팟 판(세 칸이 다 같은 말, 11-18)은 이기든 지든 두 배다.
export const CONTRACT_COINS = { win: 18, draw: 12, loss: 10 };
export const JACKPOT_COIN_MULT = 2;
export function contractCoins(result, reason, setId = null) {
  if (reason === 'resign') return 0;
  return (CONTRACT_COINS[result] ?? 0) * (isJackpot(contractById(setId)) ? JACKPOT_COIN_MULT : 1);
}

// ── 전용 기록(§3.1 「계약전과 일반 체스의 결과를 분리」). 일반 판의 실력 점수·카드·마을 정산과 섞지 않는다.
export const CONTRACT_STORE_KEY = 'wildcrown.contract.v1';
export const emptyContractStore = () => ({ v: 1, on: true, games: 0, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: RUNG_NOVICE, lossRun: 0, practice: 0 });

export function sanitizeContractStore(raw) {
  const base = emptyContractStore();
  if (!raw || raw.v !== 1) return base;
  const n = (x) => (Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
  const byReason = {};
  for (const [k, v] of Object.entries(raw.byReason || {})) if (typeof k === 'string' && k.length < 20) byReason[k] = n(v);
  const last = raw.last && contractById(raw.last.set) ? { set: raw.last.set, result: String(raw.last.result), reason: String(raw.last.reason), plies: n(raw.last.plies) } : null;
  return { v: 1, on: raw.on !== false, games: n(raw.games), win: n(raw.win), loss: n(raw.loss), draw: n(raw.draw), byReason, last, rung: Math.min(RUNG_FULL, n(raw.rung)), lossRun: Math.min(RUNG_DROP_AFTER, n(raw.lossRun)), practice: raw.practice ? 1 : 0 };
}

/** 끝난 판 하나를 기록에 더한다. `result` 는 내 쪽에서 본 'win' | 'loss' | 'draw'. */
export function addContractResult(store, { set, result, reason, plies }) {
  const next = sanitizeContractStore(store);
  if (!['win', 'loss', 'draw'].includes(result)) return next;
  next.games += 1;
  next[result] += 1;
  next.byReason[reason] = (next.byReason[reason] || 0) + 1;
  next.last = { set, result, reason, plies };
  Object.assign(next, nextRung(next.rung, next.lossRun, result));
  return next;
}
