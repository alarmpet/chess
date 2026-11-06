// The opponent's thinking. A short alpha-beta search, so the AI sees a threat to its own pieces, takes what is left
// hanging, and in the ending drives the king to the edge and mates instead of shuffling.
// The search walks chess.js's internal move list (_moves/_makeMove/_undoMove, chess.js 1.4): the public API writes
// notation for every move and was about 20 times slower. The chosen move is checked with the public API before it
// is returned. Pure: no DOM, no three.js.
import { Chess } from 'chess.js';

const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const CAPTURE = 2;
const PROMOTION = 16;

// Piece-square bonuses from white's side (rank 8 first), small enough that material always wins.
const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 12, 14, 20, 28, 28, 20, 14, 12, 6, 8, 12, 24, 24, 12, 8, 6,
    2, 4, 8, 20, 20, 8, 4, 2, 4, 2, 0, 4, 4, 0, 2, 4, 4, 8, 8, -16, -16, 8, 8, 4, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-40, -28, -20, -20, -20, -20, -28, -40, -28, -10, 0, 4, 4, 0, -10, -28, -20, 4, 12, 16, 16, 12, 4, -20, -20, 6, 16, 20, 20, 16, 6, -20,
    -20, 2, 16, 20, 20, 16, 2, -20, -20, 6, 12, 14, 14, 12, 6, -20, -28, -10, 0, 6, 6, 0, -10, -28, -40, -24, -20, -20, -20, -20, -24, -40],
  b: [-16, -8, -8, -8, -8, -8, -8, -16, -8, 0, 0, 0, 0, 0, 0, -8, -8, 0, 6, 10, 10, 6, 0, -8, -8, 6, 6, 10, 10, 6, 6, -8,
    -8, 0, 10, 10, 10, 10, 0, -8, -8, 10, 10, 10, 10, 10, 10, -8, -8, 6, 0, 0, 0, 0, 6, -8, -16, -8, -10, -8, -8, -10, -8, -16],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 6, 12, 12, 12, 12, 12, 12, 6, -4, 0, 0, 0, 0, 0, 0, -4, -4, 0, 0, 0, 0, 0, 0, -4,
    -4, 0, 0, 0, 0, 0, 0, -4, -4, 0, 0, 0, 0, 0, 0, -4, -4, 0, 0, 0, 0, 0, 0, -4, 0, 0, 2, 6, 6, 2, 0, 0],
  q: [-16, -8, -8, -4, -4, -8, -8, -16, -8, 0, 0, 0, 0, 0, 0, -8, -8, 0, 4, 4, 4, 4, 0, -8, -4, 0, 4, 4, 4, 4, 0, -4,
    0, 0, 4, 4, 4, 4, 0, -4, -8, 4, 4, 4, 4, 4, 0, -8, -8, 0, 4, 0, 0, 0, 0, -8, -16, -8, -8, -4, -4, -8, -8, -16],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 16, 16, 0, 0, 0, 0, 16, 16, 16, 24, 10, 0, 0, 10, 24, 16]
};

/** How each level plays: search depth and how often it settles for its second or third choice. */
export const LEVELS = {
  easy: { depth: 1, slip: 0.3 },
  normal: { depth: 2, slip: 0.1 },
  hard: { depth: 3, slip: 0 }
};

const MATE = 100000;
const QUIET_DEPTH = 4;

const square = (i) => 'abcdefgh'[i & 15] + String(8 - (i >> 4));

/** Score for the side to move. Material and placement; in an ending, push the losing king to the edge and close in. */
export function evaluate(chess) {
  const board = chess._board;
  let score = 0;
  let material = 0;
  let nonPawn = 0;
  const kings = {};
  let kingSafety = 0;
  for (let i = 0; i < 128; i++) {
    if (i & 0x88) {
      i += 7;
      continue;
    }
    const p = board[i];
    if (!p) continue;
    const row = i >> 4;
    const file = i & 15;
    const at = p.color === 'w' ? row * 8 + file : (7 - row) * 8 + file;
    const sign = p.color === 'w' ? 1 : -1;
    if (p.type === 'k') kingSafety += sign * PST.k[at];
    else score += sign * (VALUE[p.type] + PST[p.type][at]);
    material += sign * VALUE[p.type];
    if (p.type === 'k') kings[p.color] = i;
    else if (p.type !== 'p') nonPawn += VALUE[p.type];
  }
  // The king table rewards hiding behind pawns; in an ending it would keep the king in its corner, so it only counts
  // while there is enough material on the board to attack a king.
  if (nonPawn > 1800) score += kingSafety;
  // Mop-up: the side ahead wants the other king in a corner and its own king near it.
  if (nonPawn <= 1800 && Math.abs(material) >= 300 && kings.w !== undefined && kings.b !== undefined) {
    const ahead = material > 0 ? 'w' : 'b';
    const loser = kings[ahead === 'w' ? 'b' : 'w'];
    const lf = loser & 15;
    const lr = loser >> 4;
    const edge = Math.max(3 - lf, lf - 4) + Math.max(3 - lr, lr - 4);
    const wf = kings[ahead] & 15;
    const wr = kings[ahead] >> 4;
    const near = 14 - (Math.abs(wf - lf) + Math.abs(wr - lr));
    score += (ahead === 'w' ? 1 : -1) * (edge * 18 + near * 8);
  }
  return chess._turn === 'w' ? score : -score;
}

// Captures first, biggest prize with the smallest piece; that is what makes alpha-beta cut early.
const orderKey = (m) => (m.flags & CAPTURE ? 10 * VALUE[m.captured || 'p'] - VALUE[m.piece] : 0) + (m.flags & PROMOTION ? 800 : 0);
function ordered(chess) {
  return chess._moves({ legal: true }).sort((a, b) => orderKey(b) - orderKey(a));
}

// Captures only, so a search never stops in the middle of an exchange.
function quiesce(chess, alpha, beta, depth) {
  const stand = evaluate(chess);
  if (stand >= beta || depth === 0) return stand;
  if (stand > alpha) alpha = stand;
  for (const m of ordered(chess)) {
    if (!(m.flags & (CAPTURE | PROMOTION))) continue;
    chess._makeMove(m);
    const score = -quiesce(chess, -beta, -alpha, depth - 1);
    chess._undoMove();
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function search(chess, depth, alpha, beta, ply) {
  const moves = ordered(chess);
  if (!moves.length) return chess.inCheck() ? -MATE + ply : 0;
  if (depth === 0) return quiesce(chess, alpha, beta, QUIET_DEPTH);
  let best = -Infinity;
  for (const m of moves) {
    chess._makeMove(m);
    const score = -search(chess, depth - 1, -beta, -alpha, ply + 1);
    chess._undoMove();
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

/** The position key the repetition check uses: board, turn, castling, en passant. */
export const positionKey = (fen) => fen.split(' ').slice(0, 4).join(' ');

/**
 * Every legal move in `fen` with its search score for the side to move (higher is better), best first. A review
 * tool (tools/blunder_rate.mjs) reads a played move's loss as the best score minus its own.
 */
export function rootScores(fen, { depth = 2 } = {}) {
  const chess = new Chess(fen);
  return ordered(chess).map((m) => {
    chess._makeMove(m);
    const score = -search(chess, depth - 1, -Infinity, Infinity, 1);
    chess._undoMove();
    return { from: square(m.from), to: square(m.to), promotion: m.promotion, score };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Picks a move for the side to move in `fen`. `history` holds position keys of the game so far, so a side that is
 * ahead does not walk into a repetition. `rand` is any 0..1 source.
 * `only` (a piece letter) keeps the choice to that piece kind — the hand in hand-and-brain mode.
 * Returns { from, to, promotion } in algebraic squares, or null when there is no legal move.
 */
export function chooseMove(fen, { level = 'normal', history = [], rand = Math.random, slip, only } = {}) {
  const chess = new Chess(fen);
  const root = only ? ordered(chess).filter((m) => m.piece === only) : ordered(chess);
  if (!root.length) return null;
  const { depth, slip: baseSlip } = LEVELS[level] || LEVELS.normal;
  const chance = slip ?? baseSlip;
  const recent = new Set(history.slice(-10));
  const scored = root.map((m) => {
    chess._makeMove(m);
    let score = -search(chess, depth - 1, -Infinity, Infinity, 1);
    const repeats = recent.has(positionKey(chess.fen()));
    chess._undoMove();
    // Repeating a position when ahead throws a win away; small noise keeps openings varied.
    if (repeats && score > 0) score -= 60;
    return { m, score: score + (rand() - 0.5) * 12 };
  });
  scored.sort((a, b) => b.score - a.score);
  let pick = scored[0];
  // A slip is the second or third choice, never a free gift of a queen.
  if (rand() < chance && scored.length > 1) {
    const pool = scored.slice(1, 4).filter((s) => s.score > scored[0].score - 250);
    if (pool.length) pick = pool[Math.floor(rand() * pool.length)];
  }
  const move = { from: square(pick.m.from), to: square(pick.m.to), promotion: pick.m.promotion };
  // Confirm through the public API: if the internals ever change shape, fail loudly instead of playing nonsense.
  if (!new Chess(fen).moves({ verbose: true }).some((x) => x.from === move.from && x.to === move.to)) return null;
  return move;
}
