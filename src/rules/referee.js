// Rules referee — chess.js 1.4.0 is the single authority for legality, check, mate, draws and PGN
// (PLAN.md §4.5, Phase 0b). The 3D engine keeps its own boardState for rendering and mirrors every
// committed move into this referee. Pure module: no DOM, no three.js.
import { Chess } from 'chess.js';

export const TYPE_FROM_LETTER = { p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' };
export const LETTER_FROM_TYPE = { pawn: 'p', rook: 'r', knight: 'n', bishop: 'b', queen: 'q', king: 'k' };

/** Engine board (r 0..7 top→bottom, c 0..7 left→right, white on r=6/7) → algebraic square. */
export function squareName(r, c) {
  return 'abcdefgh'[c] + String(8 - r);
}

/** Algebraic square → engine { r, c }. */
export function squareRC(sq) {
  return { r: 8 - Number(sq[1]), c: sq.charCodeAt(0) - 97 };
}

/**
 * Build a FEN from the engine's cell grid (`{ type, color, hasMoved }` or null). Castling rights come
 * from `hasMoved`; en-passant is unknown from a bare board and is written as '-'.
 */
export function fenFromCells(cells, turn = 'w', { halfmove = 0, fullmove = 1 } = {}) {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = cells[r][c];
      if (!p) {
        empty++;
        continue;
      }
      if (empty) {
        row += empty;
        empty = 0;
      }
      const l = LETTER_FROM_TYPE[p.type];
      row += p.color === 'w' ? l.toUpperCase() : l;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  const unmoved = (r, c, type, color) => {
    const p = cells[r][c];
    return Boolean(p && p.type === type && p.color === color && !p.hasMoved);
  };
  let castling = '';
  if (unmoved(7, 4, 'king', 'w')) {
    if (unmoved(7, 7, 'rook', 'w')) castling += 'K';
    if (unmoved(7, 0, 'rook', 'w')) castling += 'Q';
  }
  if (unmoved(0, 4, 'king', 'b')) {
    if (unmoved(0, 7, 'rook', 'b')) castling += 'k';
    if (unmoved(0, 0, 'rook', 'b')) castling += 'q';
  }
  return `${rows.join('/')} ${turn} ${castling || '-'} - ${halfmove} ${fullmove}`;
}

function withTurn(fen, color) {
  const parts = fen.split(' ');
  parts[1] = color;
  parts[3] = '-';
  return parts.join(' ');
}

function toEngineMove(m) {
  const from = squareRC(m.from);
  const to = squareRC(m.to);
  return {
    r: to.r,
    c: to.c,
    fromR: from.r,
    fromC: from.c,
    capture: m.flags.includes('c') || m.flags.includes('e'),
    enPassant: m.flags.includes('e'),
    castle: m.flags.includes('k') ? 'k' : m.flags.includes('q') ? 'q' : null,
    promotion: m.promotion ? TYPE_FROM_LETTER[m.promotion] : null,
    san: m.san
  };
}

export class Referee {
  constructor(fen) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  reset() {
    this.chess.reset();
  }

  load(fen) {
    this.chess.load(fen);
  }

  /** Mirror an arbitrary engine board (custom scenarios, demos). */
  loadCells(cells, turn = 'w', opts) {
    this.chess.load(fenFromCells(cells, turn, opts));
  }

  fen() {
    return this.chess.fen();
  }

  turn() {
    return this.chess.turn();
  }

  pgn() {
    return this.chess.pgn();
  }

  history() {
    return this.chess.history({ verbose: true });
  }

  /** A view of the position with `color` to move (for queries about the side not on move). */
  _view(color) {
    if (!color || color === this.chess.turn()) return this.chess;
    try {
      return new Chess(withTurn(this.chess.fen(), color));
    } catch (e) {
      return null;
    }
  }

  /** Legal destinations for the piece on (r, c). Castling moves carry the rook columns. */
  legalMovesFor(r, c) {
    const sq = squareName(r, c);
    const piece = this.chess.get(sq);
    if (!piece) return [];
    const view = this._view(piece.color);
    if (!view) return [];
    const seen = new Set();
    const out = [];
    for (const m of view.moves({ square: sq, verbose: true })) {
      if (seen.has(m.to)) continue; // promotion variants collapse to one destination
      seen.add(m.to);
      const em = toEngineMove(m);
      if (em.castle) {
        em.rookFromC = em.castle === 'k' ? 7 : 0;
        em.rookToC = em.castle === 'k' ? 5 : 3;
      }
      out.push(em);
    }
    return out;
  }

  /** Every legal move for `color` as engine coordinates. */
  allLegalMoves(color) {
    const view = this._view(color);
    if (!view) return [];
    const seen = new Set();
    const out = [];
    for (const m of view.moves({ verbose: true })) {
      const key = m.from + m.to;
      if (seen.has(key)) continue;
      seen.add(key);
      const em = toEngineMove(m);
      out.push({ fromR: em.fromR, fromC: em.fromC, toR: em.r, toC: em.c, capture: em.capture, enPassant: em.enPassant });
    }
    return out;
  }

  inCheck(color) {
    const view = this._view(color);
    return view ? view.inCheck() : false;
  }

  isCheckmate() {
    return this.chess.isCheckmate();
  }

  isStalemate() {
    return this.chess.isStalemate();
  }

  isDraw() {
    return this.chess.isDraw();
  }

  /** 'checkmate' | 'stalemate' | 'threefold' | 'insufficient' | 'fifty' | null */
  gameOverReason() {
    const c = this.chess;
    if (c.isCheckmate()) return 'checkmate';
    if (c.isStalemate()) return 'stalemate';
    if (c.isThreefoldRepetition()) return 'threefold';
    if (c.isInsufficientMaterial()) return 'insufficient';
    if (c.isDrawByFiftyMoves ? c.isDrawByFiftyMoves() : c.isDraw()) return 'fifty';
    return null;
  }

  /**
   * Commit a move. Returns the engine-shaped move (with `enPassantVictim` when a pawn was taken en
   * passant) or null when the move is illegal in the current position.
   */
  move({ fromR, fromC, toR, toC, promotion }) {
    const from = squareName(fromR, fromC);
    const to = squareName(toR, toC);
    const piece = this.chess.get(from);
    const isPromo = piece && piece.type === 'p' && (toR === 0 || toR === 7);
    let m = null;
    try {
      m = this.chess.move({ from, to, promotion: isPromo ? LETTER_FROM_TYPE[promotion || 'queen'] : undefined });
    } catch (e) {
      m = null;
    }
    if (!m) return null;
    const em = toEngineMove(m);
    em.enPassantVictim = em.enPassant ? { r: fromR, c: toC } : null;
    em.captured = m.captured ? TYPE_FROM_LETTER[m.captured] : null;
    return em;
  }

  undo() {
    return this.chess.undo();
  }
}
