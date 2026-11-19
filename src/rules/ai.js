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

// ── 계약전(슬롯 체스 계획서 §3.3, SC-1) ─────────────────────────────────────────────────────────────
// 계약이 걸린 판에서는 같은 국면이라도 지난 포획에 따라 다른 게임이다. 그래서 탐색이 수를 놓고 무를 때마다
// 양쪽 진도와 남은 차례를 함께 놓고 무른다. `ctx` 가 null 이면(일반 판) 아래 함수들은 예전과 똑같이 움직인다.
//   ctx = { goals:[{type,count}], need, counts:{w:[],b:[]}, done:{w,b}, left, index:{p:0,…}, undo:[], only }
//   `only`(색)가 있으면 그 색의 목표만 센다 — 「노리기만 하고 지키지 않는」 초급 상대(IR-1).
let ctx = null;
const GOAL_VALUE = 300;        // 목표 하나를 다 채운 값(작은 말 하나쯤). 채우는 중이면 비례
const MATCH_POINT_VALUE = 150; // 하나만 남긴 쪽의 덤 — 남은 표적을 지키고 노리게 한다
function contractContext(c) {
  if (!c || !Array.isArray(c.goals) || !c.counts) return null;
  const index = {};
  c.goals.forEach((g, i) => { index[g.type] = i; });
  const doneOf = (side) => c.goals.reduce((n, g, i) => n + ((c.counts[side]?.[i] || 0) >= g.count ? 1 : 0), 0);
  return {
    goals: c.goals, need: c.need || 2, index, undo: [], only: c.only === 'w' || c.only === 'b' ? c.only : null,
    counts: { w: c.goals.map((_, i) => c.counts.w?.[i] || 0), b: c.goals.map((_, i) => c.counts.b?.[i] || 0) },
    done: { w: doneOf('w'), b: doneOf('b') },
    left: Number.isFinite(c.left) ? c.left : Infinity
  };
}
/** 그 색이 그 종류를 잡으면 차는 목표 칸: 그 종류의 목표 가운데 덜 찬 첫 칸(잭팟 세트는 같은 종류가 셋). 없으면 -1. */
function goalAt(color, type) {
  const goals = ctx.goals;
  const counts = ctx.counts[color];
  for (let i = 0; i < goals.length; i++) if (goals[i].type === type && counts[i] < goals[i].count) return i;
  return -1;
}
/** 이 수가 둔 쪽의 계약을 완성하는가(= 판이 끝나는 잡기). */
function completesContract(m) {
  if (!ctx || !m.captured || (ctx.only && m.color !== ctx.only)) return false;
  const gi = goalAt(m.color, m.captured);
  if (gi < 0) return false;
  const have = ctx.counts[m.color][gi];
  return have + 1 === ctx.goals[gi].count && ctx.done[m.color] + 1 >= ctx.need;
}
/** 수를 놓는다. 둔 쪽이 이 수로 계약을 완성했으면 true. */
function make(chess, m) {
  chess._makeMove(m);
  if (!ctx) return false;
  let gi = -1;
  let filled = 0;
  if (m.captured && (!ctx.only || m.color === ctx.only)) {
    const at = goalAt(m.color, m.captured);
    if (at >= 0) {
      gi = at;
      ctx.counts[m.color][gi] += 1;
      if (ctx.counts[m.color][gi] === ctx.goals[gi].count) { ctx.done[m.color] += 1; filled = 1; }
    }
  }
  ctx.left -= 1;
  ctx.undo.push(m.color, gi, filled);
  return ctx.done[m.color] >= ctx.need;
}
function unmake(chess) {
  chess._undoMove();
  if (!ctx) return;
  const filled = ctx.undo.pop();
  const gi = ctx.undo.pop();
  const color = ctx.undo.pop();
  ctx.left += 1;
  if (gi >= 0) {
    ctx.counts[color][gi] -= 1;
    if (filled) ctx.done[color] -= 1;
  }
}
function contractValue(side) {
  if (ctx.only && side !== ctx.only) return 0;
  let v = 0;
  for (let i = 0; i < ctx.goals.length; i++) v += (ctx.counts[side][i] / ctx.goals[i].count) * GOAL_VALUE;
  return v + (ctx.done[side] >= ctx.need - 1 ? MATCH_POINT_VALUE : 0);
}
/** 차는 쪽에서 본 점수. 계약이 걸렸으면 진도 차이를 더한다. */
function score(chess) {
  const base = evaluate(chess);
  if (!ctx) return base;
  const me = chess._turn;
  return base + contractValue(me) - contractValue(me === 'w' ? 'b' : 'w');
}
/** 차례 상한에 닿았을 때(방금 `mover` 가 마지막 수를 뒀다) 둔 쪽에서 본 값. 메이트가 먼저다(§3.2-1). */
function limitValue(chess, mover, ply) {
  if (!chess._moves({ legal: true }).length && chess.inCheck()) return MATE - ply;
  const other = mover === 'w' ? 'b' : 'w';
  const d = ctx.done[mover] - ctx.done[other];
  return d > 0 ? MATE - ply - 1 : d < 0 ? -(MATE - ply - 1) : 0;
}

// Captures first, biggest prize with the smallest piece; that is what makes alpha-beta cut early.
const orderKey = (m) => (m.flags & CAPTURE ? 10 * VALUE[m.captured || 'p'] - VALUE[m.piece] : 0) + (m.flags & PROMOTION ? 800 : 0);
function ordered(chess) {
  return chess._moves({ legal: true }).sort((a, b) => orderKey(b) - orderKey(a));
}

// Captures only, so a search never stops in the middle of an exchange.
function quiesce(chess, alpha, beta, depth) {
  const stand = score(chess);
  if (stand >= beta || depth === 0 || (ctx && ctx.left <= 0)) return stand;
  if (stand > alpha) alpha = stand;
  for (const m of ordered(chess)) {
    if (!(m.flags & (CAPTURE | PROMOTION))) continue;
    const won = make(chess, m);
    const value = won ? MATE - 50 : -quiesce(chess, -beta, -alpha, depth - 1);
    unmake(chess);
    if (value >= beta) return value;
    if (value > alpha) alpha = value;
  }
  return alpha;
}

function search(chess, depth, alpha, beta, ply) {
  const moves = ordered(chess);
  if (!moves.length) return chess.inCheck() ? -MATE + ply : 0;
  if (depth === 0) return quiesce(chess, alpha, beta, QUIET_DEPTH);
  let best = -Infinity;
  for (const m of moves) {
    const won = make(chess, m);
    const value = won ? MATE - ply : ctx && ctx.left <= 0 ? limitValue(chess, m.color, ply) : -search(chess, depth - 1, -beta, -alpha, ply + 1);
    unmake(chess);
    if (value > best) best = value;
    if (value > alpha) alpha = value;
    if (alpha >= beta) break;
  }
  return best;
}

// Human-like blind spots (direction plan DR-M1 m3, 2026-11-10). Weak human players rarely miss a piece attacked next
// to it; they miss the long diagonal, the rook from across the board and the piece that steps backwards to take
// (players' complaint about bots: their mistakes are random, not human — research E A3). With `blind`, a reply of that
// kind is unseen with that chance when the AI checks what its candidate moves allow. The choice is made once per reply
// square pair for one decision, so a blind spot stays the same blind spot while it thinks.
const SLIDERS = new Set(['b', 'r', 'q']);
/** A reply a weak player tends not to see: a slide of four squares or more, or any backward move. */
export function hardToSee(m) {
  const fr = m.from >> 4, ff = m.from & 15, tr = m.to >> 4, tf = m.to & 15;
  if (SLIDERS.has(m.piece) && Math.max(Math.abs(fr - tr), Math.abs(ff - tf)) >= 4) return true;
  if (m.piece === 'p' || m.piece === 'k') return false;
  return m.color === 'w' ? tr > fr : tr < fr;   // row 0 is rank 8: white going down the board goes backwards
}

// The opponent's replies, minus the ones this decision does not see.
function seenReplies(chess, seen, capturesOnly) {
  // 약한 단계도 「무엇으로 지는지」는 안다: 상대의 계약을 끝내는 잡기는 사각이어도 본다(§3.3).
  return ordered(chess).filter((m) => (!capturesOnly || m.flags & (CAPTURE | PROMOTION)) && (seen(m) || completesContract(m)));
}
function quiesceSeen(chess, alpha, beta, seen) {
  const stand = score(chess);
  if (stand >= beta || (ctx && ctx.left <= 0)) return stand;
  if (stand > alpha) alpha = stand;
  for (const m of seenReplies(chess, seen, true)) {
    const won = make(chess, m);
    const value = won ? MATE - 50 : -quiesce(chess, -beta, -alpha, QUIET_DEPTH - 1);
    unmake(chess);
    if (value >= beta) return value;
    if (value > alpha) alpha = value;
  }
  return alpha;
}
function searchSeen(chess, depth, seen) {
  if (depth <= 0) return quiesceSeen(chess, -Infinity, Infinity, seen);
  const all = chess._moves({ legal: true });
  if (!all.length) return chess.inCheck() ? -MATE + 1 : 0;
  const moves = seenReplies(chess, seen, false);
  if (!moves.length) return score(chess);
  let best = -Infinity;
  let alpha = -Infinity;
  for (const m of moves) {
    const won = make(chess, m);
    const value = won ? MATE - 1 : ctx && ctx.left <= 0 ? limitValue(chess, m.color, 1) : -search(chess, depth - 1, -Infinity, -alpha, 2);
    unmake(chess);
    if (value > best) best = value;
    if (value > alpha) alpha = value;
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
 * `blind` (0..1) gives the AI a weak human's blind spots instead of random slips (see hardToSee).
 * `contract` (src/rules/contractGame.js `contractAiState`) makes it play the contract game: completing two goals
 * wins like a mate, the opponent's finishing capture is always seen, and the turn limit is scored by goals done.
 * Returns { from, to, promotion } in algebraic squares, or null when there is no legal move.
 */
export function chooseMove(fen, opts = {}) {
  ctx = contractContext(opts.contract);
  try {
    return pickMove(fen, opts);
  } finally {
    ctx = null;
  }
}
function pickMove(fen, { level = 'normal', history = [], rand = Math.random, slip, only, blind = 0 } = {}) {
  const chess = new Chess(fen);
  const root = only ? ordered(chess).filter((m) => m.piece === only) : ordered(chess);
  if (!root.length) return null;
  const { depth, slip: baseSlip } = LEVELS[level] || LEVELS.normal;
  const chance = slip ?? baseSlip;
  const recent = new Set(history.slice(-10));
  // `blind` (0..1): the chance a hard-to-see reply goes unseen. Decided once per reply squares for this decision.
  const unseen = new Map();
  const seen = (m) => {
    if (!(blind > 0) || !hardToSee(m)) return true;
    const key = m.from * 128 + m.to;
    if (!unseen.has(key)) unseen.set(key, rand() < blind);
    return !unseen.get(key);
  };
  const scored = root.map((m) => {
    const won = make(chess, m);
    let score = won ? MATE : ctx && ctx.left <= 0 ? limitValue(chess, m.color, 0)
      : blind > 0 ? -searchSeen(chess, depth - 1, seen) : -search(chess, depth - 1, -Infinity, Infinity, 1);
    const repeats = recent.has(positionKey(chess.fen()));
    unmake(chess);
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
