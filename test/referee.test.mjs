import test from 'node:test';
import assert from 'node:assert/strict';
import { Referee, fenFromCells, squareName, squareRC } from '../src/rules/referee.js';

const START_CELLS = () => {
  const back = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const cells = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    cells[7][c] = { type: back[c], color: 'w', hasMoved: false };
    cells[6][c] = { type: 'pawn', color: 'w', hasMoved: false };
    cells[1][c] = { type: 'pawn', color: 'b', hasMoved: false };
    cells[0][c] = { type: back[c], color: 'b', hasMoved: false };
  }
  return cells;
};

test('square mapping: engine rows are ranks 8..1, white on r=6/7', () => {
  assert.equal(squareName(7, 4), 'e1');
  assert.equal(squareName(0, 0), 'a8');
  assert.equal(squareName(6, 4), 'e2');
  assert.deepEqual(squareRC('e2'), { r: 6, c: 4 });
  assert.deepEqual(squareRC('h8'), { r: 0, c: 7 });
});

test('fenFromCells reproduces the start position with full castling rights', () => {
  assert.equal(fenFromCells(START_CELLS(), 'w'), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const cells = START_CELLS();
  cells[7][4].hasMoved = true;
  assert.equal(fenFromCells(cells, 'b').split(' ')[2], 'kq');
});

test('legal moves: e2 pawn has e3/e4, blocked rook has none', () => {
  const ref = new Referee();
  const e2 = ref.legalMovesFor(6, 4).map((m) => `${m.r},${m.c}`).sort();
  assert.deepEqual(e2, ['4,4', '5,4']);
  assert.deepEqual(ref.legalMovesFor(7, 0), []);
  assert.equal(ref.allLegalMoves('w').length, 20);
  // Side not on move can still be queried.
  assert.equal(ref.allLegalMoves('b').length, 20);
});

test('en passant is generated and reports the victim square', () => {
  const ref = new Referee('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
  const moves = ref.legalMovesFor(3, 4); // white pawn on e5
  const ep = moves.find((m) => m.enPassant);
  assert.ok(ep, 'no en passant move generated');
  assert.deepEqual([ep.r, ep.c], [2, 3]); // d6
  const done = ref.move({ fromR: 3, fromC: 4, toR: 2, toC: 3 });
  assert.ok(done && done.enPassant);
  assert.deepEqual(done.enPassantVictim, { r: 3, c: 3 }); // the d5 pawn
  assert.equal(done.captured, 'pawn');
});

test('castling moves carry rook columns; king-side castle commits', () => {
  const ref = new Referee('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  const king = ref.legalMovesFor(7, 4);
  const ks = king.find((m) => m.castle === 'k');
  const qs = king.find((m) => m.castle === 'q');
  assert.deepEqual([ks.c, ks.rookFromC, ks.rookToC], [6, 7, 5]);
  assert.deepEqual([qs.c, qs.rookFromC, qs.rookToC], [2, 0, 3]);
  assert.ok(ref.move({ fromR: 7, fromC: 4, toR: 7, toC: 6 }));
  assert.equal(ref.fen().split(' ')[0], 'r3k2r/8/8/8/8/8/8/R4RK1');
});

test('under-promotion is honoured and illegal moves are rejected', () => {
  const ref = new Referee('8/P7/8/8/8/8/8/k6K w - - 0 1');
  const m = ref.move({ fromR: 1, fromC: 0, toR: 0, toC: 0, promotion: 'knight' });
  assert.equal(m.promotion, 'knight');
  assert.equal(ref.fen().split(' ')[0], 'N7/8/8/8/8/8/8/k6K');
  assert.equal(ref.move({ fromR: 7, fromC: 7, toR: 5, toC: 7 }), null); // king cannot jump
});

test('game end reasons: checkmate, stalemate, insufficient material', () => {
  const mate = new Referee('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
  assert.equal(mate.gameOverReason(), 'checkmate');
  assert.ok(mate.inCheck('w'));
  const stale = new Referee('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(stale.gameOverReason(), 'stalemate');
  const bare = new Referee('8/8/8/4k3/8/8/8/4K3 w - - 0 1');
  assert.equal(bare.gameOverReason(), 'insufficient');
  assert.equal(new Referee().gameOverReason(), null);
});

test('loadCells + undo round trip', () => {
  const ref = new Referee();
  ref.loadCells(START_CELLS(), 'w');
  assert.equal(ref.fen(), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  ref.move({ fromR: 6, fromC: 4, toR: 4, toC: 4 });
  assert.equal(ref.turn(), 'b');
  ref.undo();
  assert.equal(ref.turn(), 'w');
});
