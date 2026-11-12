// A reloaded game must come back move for move, so cards and the island settle it as if it never stopped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { resumeRecord, sanitizeResume, replayResume, takebackEntry } from '../src/rules/resume.js';
import { replayGame } from '../src/village/roster.js';

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function playRandom(seed, plies) {
  const chess = new Chess();
  const r = rng(seed);
  for (let i = 0; i < plies && !chess.isGameOver(); i++) {
    const moves = chess.moves({ verbose: true });
    const capture = moves.find((m) => m.captured);
    const m = capture && r() < 0.5 ? capture : moves[Math.floor(r() * moves.length)];
    chess.move(m);
  }
  return chess;
}

test('a stored game replays to the same position and history', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const live = playRandom(seed, 30 + seed);
    if (live.isGameOver()) continue;
    const record = sanitizeResume(JSON.parse(JSON.stringify(resumeRecord({ gameId: seed, color: 'w', history: live.history({ verbose: true }) }))));
    assert.ok(record, `seed ${seed}`);
    const back = replayResume(record);
    assert.equal(back.chess.fen(), live.fen());
    assert.equal(back.turn, live.turn());
    assert.equal(back.before.length, live.history().length);
    // The island reads the referee history: it must settle the same game.
    assert.deepEqual(replayGame(back.chess.history({ verbose: true })), replayGame(live.history({ verbose: true })));
  }
});

test('castling, en passant and promotion survive the round trip', () => {
  const chess = new Chess();
  for (const san of ['e4', 'd5', 'e5', 'f5', 'exf6', 'Nc6', 'fxg7', 'Bd7', 'gxh8=N', 'e6', 'Nf3', 'Qe7', 'Bc4', 'O-O-O', 'O-O']) chess.move(san);
  const back = replayResume(resumeRecord({ gameId: 7, color: 'b', history: chess.history({ verbose: true }) }));
  assert.equal(back.chess.fen(), chess.fen());
  assert.equal(back.cells[0][7]?.type, 'knight');               // h8 promoted to a knight
  assert.equal(back.cells[7][5]?.type, 'rook');                 // f1 rook after castling
  assert.equal(back.cells[7][5].hasMoved, true);
  assert.equal(back.cells[6][0].hasMoved, false);               // a2 pawn never moved
  assert.equal(back.capturedByWhite, 3);
  assert.equal(back.capturedByBlack, 0);
});

test('takeback entries hold the board before each move', () => {
  const chess = new Chess();
  for (const san of ['e4', 'e5', 'Nf3']) chess.move(san);
  const back = replayResume(resumeRecord({ gameId: 1, color: 'w', history: chess.history({ verbose: true }) }));
  const first = takebackEntry(back.before[0]);
  assert.equal(first.snapshot.currentTurn, 'w');
  assert.equal(first.snapshot.cells[6][4]?.type, 'pawn');       // e2 pawn still home
  assert.deepEqual([first.move.fromR, first.move.fromC, first.move.toR, first.move.toC], [6, 4, 4, 4]);
  assert.equal(takebackEntry(back.before[2]).snapshot.fen, back.before[2].fen);
});

test('nothing to resume: empty, broken, illegal or finished games', () => {
  assert.equal(sanitizeResume(null), null);
  assert.equal(sanitizeResume({ v: 1, moves: [] }), null);
  assert.equal(sanitizeResume({ v: 2, moves: [{ from: 'e2', to: 'e4' }] }), null);
  assert.equal(sanitizeResume({ v: 1, moves: [{ from: 'e2', to: 'e5' }] }), null);
  const mate = new Chess();
  for (const san of ['f3', 'e5', 'g4', 'Qh4#']) mate.move(san);
  assert.equal(sanitizeResume(resumeRecord({ gameId: 1, color: 'w', history: mate.history({ verbose: true }) })), null);
});
