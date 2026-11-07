// Resuming an unfinished game after a reload (docs/plans/2026-11-02-island-economy-plan.md §2).
// Only the move list is stored. Replaying it on a fresh referee rebuilds the board, the takeback snapshots and
// the full history the village settles from, so a resumed game ends exactly as an unbroken one. Pure: no DOM.
import { Chess } from 'chess.js';
import { TYPE_FROM_LETTER, squareRC } from './referee.js';

export const RESUME_KEY = 'wildcrown.resume.v1';
export const RESUME_MAX_PLIES = 600;

function cellsOf(chess, moved) {
  return chess.board().map((row) =>
    row.map((p) => (p ? { type: TYPE_FROM_LETTER[p.type], color: p.color, hasMoved: moved.has(p.square) } : null))
  );
}

/** What gets stored: enough to replay, nothing about cards or the island. */
export function resumeRecord({ gameId, color, rivalId = null, history }) {
  return {
    v: 1,
    gameId: gameId >>> 0,
    color: color === 'b' ? 'b' : 'w',
    rivalId: rivalId || null,
    moves: history.map((m) => (m.promotion ? { from: m.from, to: m.to, promotion: m.promotion } : { from: m.from, to: m.to }))
  };
}

/** A stored record, checked by replaying it. Null when there is nothing worth resuming or it no longer replays. */
export function sanitizeResume(raw) {
  if (!raw || raw.v !== 1 || !Array.isArray(raw.moves) || raw.moves.length === 0 || raw.moves.length > RESUME_MAX_PLIES) return null;
  const record = {
    v: 1,
    gameId: Number(raw.gameId) >>> 0,
    color: raw.color === 'b' ? 'b' : 'w',
    rivalId: typeof raw.rivalId === 'string' ? raw.rivalId : null,
    moves: raw.moves
  };
  return replayResume(record) ? record : null;
}

/**
 * Plays the stored moves on a fresh board. Returns the final board in the engine's cell grid, one snapshot per ply
 * (the board before that move, for takeback), the capture counts and the replayed chess.js game.
 * Null if any move is illegal or the game is already over.
 */
export function replayResume(record) {
  const chess = new Chess();
  const moved = new Set();
  const before = [];
  let capturedByWhite = 0;
  let capturedByBlack = 0;
  for (const step of record.moves) {
    if (!step || typeof step.from !== 'string' || typeof step.to !== 'string') return null;
    const cells = cellsOf(chess, moved);
    let m = null;
    try {
      m = chess.move({ from: step.from, to: step.to, promotion: step.promotion });
    } catch (e) {
      m = null;
    }
    if (!m) return null;
    before.push({ cells, turn: m.color, capturedByWhite, capturedByBlack, fen: m.before, move: m });
    if (m.captured) {
      if (m.color === 'w') capturedByWhite += 1;
      else capturedByBlack += 1;
    }
    moved.add(m.to);
    if (m.isKingsideCastle()) moved.add(`f${m.from[1]}`);
    if (m.isQueensideCastle()) moved.add(`d${m.from[1]}`);
  }
  if (chess.isGameOver()) return null;
  return { chess, cells: cellsOf(chess, moved), turn: chess.turn(), capturedByWhite, capturedByBlack, before };
}

/** The engine's takeback entry for one replayed ply. */
export function takebackEntry(step) {
  const from = squareRC(step.move.from);
  const to = squareRC(step.move.to);
  return {
    snapshot: {
      fen: step.fen,
      currentTurn: step.turn,
      gameOver: false,
      capturedByWhite: step.capturedByWhite,
      capturedByBlack: step.capturedByBlack,
      scriptCursor: 0,
      scriptedGameActive: false,
      scriptDeviated: false,
      cells: step.cells
    },
    move: {
      color: step.move.color,
      pieceType: TYPE_FROM_LETTER[step.move.piece],
      fromR: from.r,
      fromC: from.c,
      toR: to.r,
      toC: to.c,
      capture: Boolean(step.move.captured),
      promotion: step.move.promotion ? TYPE_FROM_LETTER[step.move.promotion] : 'queen'
    }
  };
}
