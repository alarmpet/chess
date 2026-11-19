// 봇끼리 둔 판에서 「누가 누구를 잡는지」 30가지 조합이 얼마나 자주 나오는지 센다.
// 같은 시드면 같은 결과. 실행: node docs/research/2026-11-08-capture-pairs/pair_sim.mjs [판 수]
import { Chess } from 'chess.js';
import { chooseMove } from '../../../src/rules/ai.js';
const N = Number(process.argv[2] || 100);
let seed = 20261108;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const pairs = {}; const first = {}; let caps = 0, plies = 0, checkCaps = 0, mateCaps = 0;
for (let g = 0; g < N; g++) {
  const c = new Chess();
  const levels = ['easy', 'normal'];
  while (!c.isGameOver() && c.history().length < 200) {
    const fen = c.fen();
    const mv = chooseMove(fen, { level: levels[(g + c.history().length) % 2], history: c.history(), rand });
    const m = c.move(mv);
    plies++;
    if (m.captured) {
      caps++;
      const k = `${NAME[m.piece]}>${NAME[m.captured]}`;
      pairs[k] = (pairs[k] || 0) + 1;
      if (m.san.endsWith('#')) mateCaps++; else if (m.san.endsWith('+')) checkCaps++;
      if (!first[k] || c.history().length < first[k].length) first[k] = c.history();
    }
  }
}
const rows = [];
for (const a of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) for (const v of ['pawn', 'knight', 'bishop', 'rook', 'queen']) rows.push([`${a}>${v}`, pairs[`${a}>${v}`] || 0]);
rows.sort((x, y) => y[1] - x[1]);
const out = { games: N, plies, captures: caps, perGame: +(caps / N).toFixed(1), checkCaps, mateCaps, seen: rows.filter((r) => r[1]).length, rows: rows.map(([k, n]) => ({ pair: k, n, pct: +(100 * n / caps).toFixed(1) })), shortest: Object.fromEntries(Object.entries(first).map(([k, h]) => [k, h.join(' ')])) };
console.log(JSON.stringify(out, null, 1));
