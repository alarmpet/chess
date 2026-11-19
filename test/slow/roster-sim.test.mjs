// Slow: 300 random games (about two minutes). Lives under test/slow/ so `npm test` stays quick; `npm run test:slow` and CI run it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { startSlots, stepRoster } from '../../src/village/roster.js';

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

test('every square keeps its true owner through 300 random games', () => {
  const seen = { e: 0, k: 0, q: 0, promo: 0, capture: 0 };
  for (let g = 0; g < 300; g++) {
    const c = new Chess();
    const rand = rng(g + 1);
    const at = startSlots();
    for (let ply = 0; ply < 300 && !c.isGameOver(); ply++) {
      const legal = c.moves({ verbose: true });
      const special = legal.filter((m) => m.flags.includes('e') || m.flags.includes('k') || m.flags.includes('q') || m.promotion);
      const m = c.move(special.length && rand() < 0.7 ? special[Math.floor(rand() * special.length)] : legal[Math.floor(rand() * legal.length)]);
      stepRoster(at, m);
      if (m.flags.includes('e')) seen.e++;
      if (m.flags.includes('k')) seen.k++;
      if (m.flags.includes('q')) seen.q++;
      if (m.promotion) seen.promo++;
      if (m.captured) seen.capture++;
      const board = c.board().flat().filter(Boolean);
      assert.equal(Object.keys(at).length, board.length, `game ${g} ply ${ply}: piece count`);
      for (const p of board) {
        const slot = at[p.square];
        assert.ok(slot, `game ${g} ply ${ply}: nobody tracked on ${p.square}`);
        assert.equal(slot[0], p.color, `game ${g} ply ${ply}: wrong side on ${p.square}`);
      }
    }
  }
  for (const [k, n] of Object.entries(seen)) assert.ok(n > 20, `the random games must really exercise ${k} (saw ${n})`);
});

