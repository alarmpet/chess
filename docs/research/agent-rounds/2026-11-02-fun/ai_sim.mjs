// Bot matches: does the new AI finish games? Old = the one-ply greedy rule, rebuilt here on chess.js.
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../../../../src/rules/ai.js';
const V = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
function greedy(chess) {
  const moves = chess.moves({ verbose: true });
  let best = -Infinity, pick = [];
  for (const m of moves) {
    let s = 0;
    if (m.captured) s += V[m.captured] * 1.15 - V[m.piece] * 0.08;
    const f = m.to.charCodeAt(0) - 97, r = 8 - Number(m.to[1]);
    s += (7 - (Math.abs(3.5 - r) + Math.abs(3.5 - f))) * 8;
    if (m.piece === 'p') s += (m.color === 'w' ? Number(m.to[1]) - 2 : 7 - Number(m.to[1])) * 12;
    chess.move(m);
    if (chess.inCheck()) s += 45;
    if (chess.moves({ verbose: true }).some((x) => x.to === m.to)) s -= V[m.piece] * 0.75;
    chess.undo();
    s += (Math.random() - 0.5) * 14;
    if (s > best + 1) { best = s; pick = [m]; } else if (Math.abs(s - best) <= 1) pick.push(m);
  }
  return pick[Math.floor(Math.random() * pick.length)];
}
function game(white, black, maxPlies = 300) {
  const chess = new Chess();
  const keys = [];
  const t0 = Date.now();
  let think = 0, thinkN = 0;
  while (!chess.isGameOver() && chess.history().length < maxPlies) {
    const who = chess.turn() === 'w' ? white : black;
    const s = Date.now();
    const m = who === 'greedy' ? greedy(chess) : chooseMove(chess.fen(), { level: who, history: keys });
    if (!m) throw new Error('no move ' + chess.fen());
    if (who !== 'greedy') { think = Math.max(think, Date.now() - s); thinkN++; }
    chess.move(m);
    keys.push(positionKey(chess.fen()));
  }
  const plies = chess.history().length;
  const res = chess.isCheckmate() ? (chess.turn() === 'w' ? 'b' : 'w') : 'draw';
  return { res, plies, think, ms: Date.now() - t0 };
}
const [w, b, n] = [process.argv[2], process.argv[3], Number(process.argv[4] || 10)];
const out = { w: 0, b: 0, draw: 0, plies: [], think: 0 };
for (let i = 0; i < n; i++) {
  const g = game(w, b);
  out[g.res]++; out.plies.push(g.plies); out.think = Math.max(out.think, g.think);
}
out.plies.sort((a, b) => a - b);
console.log(`${w} vs ${b} x${n}: white ${out.w}, black ${out.b}, draw ${out.draw}, median plies ${out.plies[Math.floor(n / 2)]}, max think ${out.think} ms`);
