// 반격 목표 측정(목표 층 OL-6 ③, 2026-11-06): 플레이어(백) 대 AI(흑) 봇 판에서 반격 목표가 뜬 판의 비율,
// 뜬 목표를 해낸 비율(목표별), 처음 뜬 수, 뜬 뒤 해낼 때까지 걸린 플레이어 수. 봇은 목표를 쫓지 않는다 —
// 「그냥 두는데도 해낼 수 있는 크기인가」를 본다.
//   node tools/rally_sim.mjs [판 수=200] [플레이어=easy] [AI=normal]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { RALLY_GOALS, newRally, rallyStep } from '../src/cards/rally.js';

const GAMES = Number(process.argv[2] || 200);
const ME = process.argv[3] || 'easy';
const AI = process.argv[4] || 'normal';
let seed = 7171;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const stat = { games: 0, withGoal: 0, firstPly: [], offered: {}, done: {}, wait: [], perGame: [], result: { win: 0, draw: 0, loss: 0 }, resultWithGoal: { win: 0, draw: 0, loss: 0 } };
for (const g of RALLY_GOALS) { stat.offered[g.id] = 0; stat.done[g.id] = 0; }
const t0 = Date.now();
for (let n = 0; n < GAMES; n++) {
  const chess = new Chess();
  const history = [];
  let rally = newRally();
  let since = 0;
  let first = null;
  for (let ply = 0; ply < 200 && !chess.isGameOver(); ply++) {
    const color = chess.turn();
    const mv = chooseMove(chess.fen(), { level: color === 'w' ? ME : AI, history, rand });
    if (!mv) break;
    chess.move(mv);
    history.push(positionKey(chess.fen()));
    const m = chess.history({ verbose: true }).at(-1);
    const r = rallyStep(rally, m, 'w');
    rally = r.state;
    if (rally.active && color === 'w') since++;
    if (r.offered) { stat.offered[r.offered.id]++; since = 0; if (first === null) first = ply + 1; }
    if (r.done) { stat.done[r.done.id]++; stat.wait.push(since + 1); }
  }
  const result = chess.isCheckmate() ? (chess.turn() === 'b' ? 'win' : 'loss') : 'draw';
  stat.games++;
  stat.result[result]++;
  stat.perGame.push(rally.done);
  if (first !== null) { stat.withGoal++; stat.firstPly.push(first); stat.resultWithGoal[result]++; }
  if ((n + 1) % 50 === 0) console.log(`${n + 1} 판 ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
const med = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
console.log(JSON.stringify({
  games: GAMES, player: ME, ai: AI,
  gamesWithGoal: +(stat.withGoal / GAMES).toFixed(2),
  firstGoalPlyMedian: med(stat.firstPly),
  doneRate: Object.fromEntries(RALLY_GOALS.map((g) => [g.id, stat.offered[g.id] ? `${stat.done[g.id]}/${stat.offered[g.id]} = ${(stat.done[g.id] / stat.offered[g.id]).toFixed(2)}` : '0/0'])),
  playerMovesToDoneMedian: med(stat.wait),
  acornsPerGoalGame: +(stat.perGame.reduce((a, b) => a + b, 0) * 5 / Math.max(1, stat.withGoal)).toFixed(1),
  result: stat.result, resultInGoalGames: stat.resultWithGoal
}, null, 1));
