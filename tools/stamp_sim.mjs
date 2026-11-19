// 기술 도장 발생률(목표 층 OL-2, 2026-11-06): 봇 대 봇 판에서 각 도장이 「한 판에 한 번이라도」 나온 비율(색별).
// 판정은 게임과 같은 src/cards/stamps.js. 사람 판이 아니라 봇 판이므로 「사람이 처음 받기까지 몇 판」의 대략만 준다.
//   node tools/stamp_sim.mjs [판 수=1000] [짝=easy-easy] [최대 ply=160]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { STAMPS, stampsOf } from '../src/cards/stamps.js';

const GAMES = Number(process.argv[2] || 1000);
const [W, B] = (process.argv[3] || 'easy-easy').split('-');
const MAX_PLY = Number(process.argv[4] || 160);
let seed = 4242;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const hits = Object.fromEntries(STAMPS.map((s) => [s.id, { w: 0, b: 0 }]));
const t0 = Date.now();
for (let g = 0; g < GAMES; g++) {
  const chess = new Chess();
  const history = [];
  const seen = { w: new Set(), b: new Set() };
  for (let ply = 0; ply < MAX_PLY && !chess.isGameOver(); ply++) {
    const color = chess.turn();
    const mv = chooseMove(chess.fen(), { level: color === 'w' ? W : B, history, rand });
    if (!mv) break;
    chess.move(mv);
    history.push(positionKey(chess.fen()));
    for (const id of stampsOf(chess.history({ verbose: true }).at(-1))) seen[color].add(id);
  }
  for (const c of ['w', 'b']) for (const id of seen[c]) hits[id][c]++;
  if ((g + 1) % 100 === 0) console.log(`${g + 1} 판, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
const table = Object.fromEntries(Object.entries(hits).map(([id, h]) => [id, { white: +(h.w / GAMES).toFixed(3), black: +(h.b / GAMES).toFixed(3) }]));
console.log(JSON.stringify({ games: GAMES, pair: `${W}-${B}`, maxPly: MAX_PLY, perGame: table }, null, 1));
