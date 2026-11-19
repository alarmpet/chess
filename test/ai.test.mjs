// The opponent must take free material, see mate, avoid hanging its queen, and finish a won ending.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';

const fixed = () => 0.5;

test('takes a free queen', () => {
  // The black queen on h4 stands where the white knight on f3 can take it, and nothing guards it.
  const fen = 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
  assert.equal(new Chess(fen).get('h4')?.type, 'q');
  const m = chooseMove(fen, { rand: fixed, slip: 0 });
  assert.deepEqual([m.from, m.to], ['f3', 'h4']);
});

test('plays mate in one', () => {
  const m = chooseMove('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', { rand: fixed, slip: 0 });
  assert.deepEqual([m.from, m.to], ['a1', 'a8']);
});

test('moves an attacked queen instead of leaving it', () => {
  // The white queen on d5 is attacked by the pawn on e6.
  const fen = 'rnbqkbnr/ppp2ppp/4p3/3Q4/8/8/PPPP1PPP/RNB1KBNR w KQkq - 0 4';
  const m = chooseMove(fen, { rand: fixed, slip: 0 });
  assert.equal(m.from, 'd5');
});

test('every level always returns a legal move', () => {
  const chess = new Chess();
  for (let i = 0; i < 40 && !chess.isGameOver(); i++) {
    const m = chooseMove(chess.fen(), { level: ['easy', 'normal'][i % 2] });
    assert.ok(chess.move(m), `ply ${i}`);
  }
});

test('wins king and queen against a lone king', () => {
  const chess = new Chess('8/8/8/4k3/8/8/8/3QK3 w - - 0 1');
  const keys = [];
  for (let i = 0; i < 80 && !chess.isGameOver(); i++) {
    const m = chess.turn() === 'w' ? chooseMove(chess.fen(), { history: keys, slip: 0 }) : chess.moves({ verbose: true })[0];
    chess.move(m);
    keys.push(positionKey(chess.fen()));
  }
  assert.ok(chess.isCheckmate(), chess.fen());
});
