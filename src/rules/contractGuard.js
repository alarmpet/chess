// 지기 전에 보인다 (직관성 계획 2026-11-12 §0.2 ③, IR-1). 전부 심판이 확인하는 사실이다 — 「좋은 수」를 고르지 않는다.
//   금빛 결정타: 지금 둘 쪽이 한 수로 계약을 완성하는 잡기
//   위험 방패 : 지금 차례가 상대였다면 한 수로 계약을 완성당할 내 말
//   아차 방지 : 내가 두려는 수 뒤에 상대에게 결정타가 생기는데, 그걸 막는 다른 수가 있다
// 순수 함수(DOM·three 없음). 국면은 FEN 으로 받고, 진도는 contractProgress 의 결과를 받는다.
import { Chess } from 'chess.js';
import { CONTRACT_NEED } from './contractSets.js';

/** 그 색이 `type` 을 하나 더 잡으면 계약이 완성되는가. */
function completes(set, side, type) {
  // 그 종류의 목표 가운데 덜 찬 첫 칸(잭팟 세트는 같은 종류가 셋이다 — contractProgress 와 같은 규칙)
  const gi = set.goals.findIndex((g, k) => g.type === type && side.counts[k] < g.count);
  if (gi < 0) return false;
  return side.counts[gi] + 1 === set.goals[gi].count && side.done + 1 >= CONTRACT_NEED;
}

/** 지금 둘 쪽의 결정타들: [{ from, to, san, captured, target }] — `target` 은 잡히는 말이 선 칸(앙파상은 옆 칸). */
export function finishers(chess, set, progress) {
  if (!set || !progress || progress.winner) return [];
  const me = chess.turn();
  const out = [];
  for (const m of chess.moves({ verbose: true })) {
    if (!m.captured || !completes(set, progress[me], m.captured)) continue;
    const target = m.flags.includes('e') ? m.to[0] + m.from[1] : m.to;
    out.push({ from: m.from, to: m.to, san: m.san, captured: m.captured, target, ...(m.promotion ? { promotion: m.promotion } : {}) });
  }
  return out;
}

/** FEN 으로 묻는 결정타(엔진용). */
export function finishersAt(fen, set, progress) {
  try { return finishers(new Chess(fen), set, progress); } catch { return []; }
}

/** 차례를 넘긴 국면(상대가 지금 둔다면). 앙파상 칸은 지운다. 만들 수 없으면 null. */
function passed(fen) {
  const f = fen.split(' ');
  f[1] = f[1] === 'w' ? 'b' : 'w';
  f[3] = '-';
  try { return new Chess(f.join(' ')); } catch { return null; }
}

/** 내 차례에 걸려 있는 위험: 상대가 지금 한 수로 계약을 완성할 수 있는 내 말의 칸들(중복 없음). */
export function dangerSquares(fen, set, progress) {
  const other = passed(fen);
  if (!other) return [];
  return [...new Set(finishers(other, set, progress).map((m) => m.target))];
}

/**
 * 아차 검사: 지금 둘 쪽이 `move`({ from, to, promotion })를 두면 상대에게 결정타가 생기는가.
 *   { oops, avoidable, threats } — `threats` 는 그 수 뒤 상대의 결정타들, `avoidable` 은 결정타를 남기지 않는 다른 합법 수가 있는가.
 * 그 수로 내가 이기면(메이트·계약 완성) 아차가 아니다. `progressAfter(move)` 는 그 수까지 센 진도를 돌려준다.
 */
export function oopsCheck(fen, set, move, progressAfter) {
  const chess = new Chess(fen);
  const after = (m) => {
    const made = chess.move(m);
    const progress = progressAfter(made);
    const threats = chess.isCheckmate() || progress.winner ? [] : finishers(chess, set, progress);
    chess.undo();
    return threats;
  };
  let threats;
  try { threats = after({ from: move.from, to: move.to, promotion: move.promotion }); } catch { return { oops: false, avoidable: false, threats: [] }; }
  if (!threats.length) return { oops: false, avoidable: false, threats };
  const avoidable = chess.moves({ verbose: true }).some((m) => !(m.from === move.from && m.to === move.to) && !after(m).length);
  return { oops: true, avoidable, threats };
}
