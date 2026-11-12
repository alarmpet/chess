// Desire plan D7, step 1: what does a player actually capture in a game? Bot games with the player as White.
// Profiles: beginner = the one-ply greedy rule against the normal AI; even = normal against normal;
// strong = normal against the careless rival (easy search, slip 0.4, as the Picnic Gang plays).
// Usage: node games.mjs <profile> <games>  → one JSON line per game: { profile, result, captures: ['pawn', …] }
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../../../src/rules/ai.js';

const V = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const TYPE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen' };

// The same greedy rule as docs/research/agent-rounds/2026-11-02-fun/ai_sim.mjs.
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

const PROFILES = {
  beginner: { w: { kind: 'greedy' }, b: { level: 'normal' } },
  even: { w: { level: 'normal' }, b: { level: 'normal' } },
  strong: { w: { level: 'normal' }, b: { level: 'easy', slip: 0.4 } }
};

function play(profile, maxPlies = 300) {
  const chess = new Chess();
  const keys = [];
  const captures = [];
  let checks = 0;
  while (!chess.isGameOver() && chess.history().length < maxPlies) {
    const side = PROFILES[profile][chess.turn()];
    const m = side.kind === 'greedy' ? greedy(chess) : chooseMove(chess.fen(), { level: side.level, history: keys, slip: side.slip });
    const done = chess.move(m);
    if (done.color === 'w' && done.captured) captures.push(TYPE[done.captured]);
    if (done.color === 'w' && chess.inCheck()) checks++;
    keys.push(positionKey(chess.fen()));
  }
  const result = chess.isCheckmate() ? (chess.turn() === 'b' ? 'win' : 'loss') : 'draw';
  return { profile, result, plies: chess.history().length, captures, checks };
}

const [profile, n] = [process.argv[2], Number(process.argv[3] || 10)];
if (!PROFILES[profile]) throw new Error(`profile: ${Object.keys(PROFILES).join(' | ')}`);
for (let i = 0; i < n; i++) console.log(JSON.stringify(play(profile)));
