// 한 방 퍼즐 (직관성 계획 2026-11-12 §0.2 ④, IR-3): 「한 수로 왕관 완성」 국면.
// 국면은 손으로 만들지 않는다 — 봇 판에서 뽑는다(tools/crown_puzzles.mjs → crownPuzzleData.js).
// 퍼즐 하나는 처음부터의 기보다: { id, set, color, moves: 'e2e4 e7e5 …', answer: 'd1f3', gem: 'b' }.
// 기보로 두는 까닭: 진도·보석·딱지가 모두 기보에서 다시 세어진다 — 이어 하기와 같은 배관을 그대로 쓴다.
// 순수 함수(DOM·three 없음). 시험 스위치(?lab=contract) 뒤에서만 쓴다.
import { Chess } from 'chess.js';
import { contractById, contractProgress } from './contractSets.js';
import { CONTRACT_PLY_LIMIT } from './contractGame.js';
import { finishers } from './contractGuard.js';

/** 'e2e4 e7e8q' → [{ from, to, promotion? }]. 모양이 틀리면 null. */
export function parseMoves(text) {
  if (typeof text !== 'string') return null;
  const out = [];
  for (const t of text.split(' ').filter(Boolean)) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(t)) return null;
    out.push(t.length === 5 ? { from: t.slice(0, 2), to: t.slice(2, 4), promotion: t[4] } : { from: t.slice(0, 2), to: t.slice(2, 4) });
  }
  return out;
}
export const moveText = (m) => m.from + m.to + (m.promotion || '');

/** 기보를 처음부터 다시 둔다. 둘 수 없는 수가 있으면 null. */
function replay(steps) {
  const chess = new Chess();
  try { for (const s of steps) chess.move(s); } catch { return null; }
  return chess;
}

/**
 * 퍼즐의 국면: { set, chess, progress, answers } — `answers` 는 지금 둘 쪽의 결정타들(contractGuard.finishers).
 * 세트가 없거나 기보가 안 두어지면 null.
 */
export function puzzlePosition(def) {
  const set = contractById(def?.set);
  const steps = Array.isArray(def?.moves) ? def.moves : parseMoves(def?.moves);
  if (!set || !steps) return null;
  const chess = replay(steps);
  if (!chess) return null;
  const progress = contractProgress(set, chess.history({ verbose: true }));
  return { set, steps, chess, progress, answers: finishers(chess, set, progress) };
}

/**
 * 퍼즐 검사. 맞으면 null, 아니면 이유.
 *   판이 아직 안 끝났고 · 적힌 색이 둘 차례이고 · 체크가 아니고 · 왕관을 완성하는 수가 꼭 하나이고 · 그 수가 적힌 답이고 · 그 수가 메이트는 아니다.
 */
export function puzzleProblem(def) {
  const pos = puzzlePosition(def);
  if (!pos) return '세트가 없거나 기보를 둘 수 없다';
  const { chess, progress, answers, steps } = pos;
  if (progress.winner) return '이미 계약이 완성된 국면';
  if (chess.isGameOver()) return '이미 끝난 국면';
  if (steps.length >= CONTRACT_PLY_LIMIT) return '차례 상한을 넘은 국면';
  if (chess.turn() !== def.color) return '둘 차례가 적힌 색과 다르다';
  if (chess.inCheck()) return '체크 중인 국면';
  if (answers.length !== 1) return `왕관을 완성하는 수가 ${answers.length}개`;
  if (moveText(answers[0]) !== def.answer) return '적힌 답이 결정타가 아니다';
  if (answers[0].captured !== def.gem) return '적힌 보석 종류가 다르다';
  chess.move(answers[0]);
  if (chess.isCheckmate()) return '답이 메이트이기도 하다';   // 계약이 아니라 메이트로 끝난다 — 가르칠 것이 섞인다
  return null;
}

/** 그 수가 이 퍼즐을 푸는가(왕관을 완성하는 잡기인가). */
export function solves(answers, from, to) {
  return answers.some((m) => m.from === from && m.to === to);
}

/**
 * 첫 연습 세 문제: 백이 두는 문제 가운데 보석 종류가 서로 다른 셋(폰 → 나이트 → 비숍 순). 모자라면 있는 만큼.
 * `data` 는 쉬운 순으로 놓여 있다(생성기가 고를 것이 적은 국면부터 적는다).
 */
export function practiceSet(data, order = ['p', 'n', 'b']) {
  const out = [];
  for (const gem of order) {
    const hit = data.find((d) => d.color === 'w' && d.gem === gem && !out.includes(d));
    if (hit) out.push(hit);
  }
  for (const d of data) { if (out.length >= 3) break; if (d.color === 'w' && !out.includes(d)) out.push(d); }
  return out.slice(0, 3);
}

/**
 * 놓친 왕관: 내 판에서 실제로 지나친 결정타. `moves` 는 chess.js verbose 기보, `color` 는 내 색.
 * 결정타가 있었는데 다른 수를 둔 마지막 차례를 돌려준다 — { ply(그 수 앞까지 둔 반수), moves(그 앞까지의 기보 글자), answers } 또는 null.
 */
export function missedCrown(setId, moves, color) {
  const set = contractById(setId);
  if (!set || !Array.isArray(moves)) return null;
  const chess = new Chess();
  let found = null;
  try {
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      if (chess.turn() === color) {
        const progress = contractProgress(set, moves.slice(0, i));
        if (progress.winner) break;
        const answers = finishers(chess, set, progress);
        if (answers.length && !solves(answers, m.from, m.to)) found = { ply: i, answers };
      }
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
  } catch { return null; }
  if (!found) return null;
  return { ply: found.ply, set: setId, color, moves: moves.slice(0, found.ply).map(moveText).join(' '), answers: found.answers.map(moveText) };
}
