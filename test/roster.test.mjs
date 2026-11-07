// Slot tracking must survive everything chess can do: captures, en passant, castling, promotion (plan §4).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { startSlots, stepRoster, replayGame, emptyVillage, growVillage, villageTiles, TILE_MAX } from '../src/village/roster.js';

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function playRandom(seed, maxPlies = 400) {
  const rand = rng(seed);
  const c = new Chess();
  const moves = [];
  while (!c.isGameOver() && moves.length < maxPlies) {
    const legal = c.moves({ verbose: true });
    const pick = legal.find((m) => m.flags.includes('e') || m.flags.includes('k') || m.flags.includes('q') || m.promotion) || legal[Math.floor(rand() * legal.length)];
    moves.push(c.move(pick));
  }
  return { c, moves };
}

test('en passant fells the right pawn on the right square', () => {
  const c = new Chess();
  const moves = ['e4', 'a6', 'e5', 'd5', 'exd6'].map((san) => c.move(san));
  const g = replayGame(moves);
  assert.equal(g.slots.b_d7.fellOn, 'd5');
  assert.equal(g.slots.w_e2.captures, 1);
  assert.deepEqual(g.squares.d5.falls, ['b_d7']);
});

test('a promoted pawn stays the same individual and castling names both pieces', () => {
  const c = new Chess('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1');
  const short = new Chess();
  const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O'].map((san) => short.move(san));
  const g = replayGame(moves);
  assert.ok(g.slots.w_e1.castled && g.slots.w_h1.castled);
  assert.ok(c);
  const p = new Chess();
  const line = ['a4', 'b5', 'axb5', 'a6', 'bxa6', 'Bb7', 'axb7', 'Nc6', 'bxa8=Q'].map((san) => p.move(san));
  const pg = replayGame(line);
  assert.equal(pg.slots.w_a2.promotedTo, 'q');
  assert.equal(pg.slots.w_a2.moves, 5);
});

test('the mating piece is recorded', () => {
  const c = new Chess();
  const g = replayGame(['f3', 'e5', 'g4', 'Qh4#'].map((san) => c.move(san)));
  assert.equal(g.slots.b_d8.mated, true);
});

test('villages grow from either result, tiles cap, and overflow reaches other squares', () => {
  const v = emptyVillage();
  for (let i = 0; i < 40; i++) {
    const { moves } = playRandom(i + 7, 120);
    growVillage(v, replayGame(moves), moves, 'w');
  }
  const tiles = villageTiles(v);
  assert.equal(v.games, 40);
  assert.ok(Object.values(tiles).every((n) => n >= 0 && n <= TILE_MAX));
  assert.ok(Object.keys(tiles).length >= 32, 'a busy village spreads over the board');
  assert.ok(v.trees.length > 0, 'fallen pieces leave trees');
  assert.ok(v.trees.every((t) => t.slot.startsWith('w_')), 'only my side plants in my village');
});
