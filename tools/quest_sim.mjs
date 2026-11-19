// 오늘의 퀘스트 달성률(목표 층 OL-3, 2026-11-06): 플레이어(백, 쉬움) 대 AI(흑, 보통) 봇 판에서 퀘스트마다
// 「하루에 k판 두면 끝내는 비율」(k = 1, 2, 3)을 잰다. 공유 미션·현상금·도장 사건도 게임과 같은 함수로 만든다.
//   node tools/quest_sim.mjs [판 수=120] [플레이어 수준=easy] [AI 수준=normal]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { TIERS, QUESTS } from '../src/cards/quests.js';
import { RACES, SHARED_POOL } from '../src/cards/missions.js';
import { bountyStep, newBounty } from '../src/cards/bounty.js';
import { stampsOf } from '../src/cards/stamps.js';

const GAMES = Number(process.argv[2] || 120);
const ME = process.argv[3] || 'easy';
const AI = process.argv[4] || 'normal';
let seed = 9090;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const ALL = TIERS.flatMap((t) => QUESTS[t]);

function game(g) {
  const chess = new Chess();
  const history = [];
  const mission = RACES.find((r) => r.id === SHARED_POOL[g % SHARED_POOL.length]);
  let missionTaken = false;
  const bounty = newBounty();
  const events = [];
  for (let ply = 0; ply < 160 && !chess.isGameOver(); ply++) {
    const color = chess.turn();
    const mv = chooseMove(chess.fen(), { level: color === 'w' ? ME : AI, history, rand });
    if (!mv) break;
    chess.move(mv);
    history.push(positionKey(chess.fen()));
    const m = chess.history({ verbose: true }).at(-1);
    const { claimed } = bountyStep(bounty, m);
    if (!missionTaken && mission.hit(m)) { missionTaken = true; if (color === 'w') events.push({ kind: 'mission' }); }
    if (color !== 'w') continue;
    events.push({ kind: 'move', move: m });
    if (claimed) events.push({ kind: 'bounty' });
    for (const id of stampsOf(m)) events.push({ kind: 'stamp', id });
  }
  const result = chess.isCheckmate() ? (chess.turn() === 'b' ? 'win' : 'loss') : 'draw';
  events.push({ kind: 'end', result });
  return Object.fromEntries(ALL.map((q) => [q.id, events.reduce((n, e) => n + q.count(e), 0)]));
}

const t0 = Date.now();
const per = [];
for (let g = 0; g < GAMES; g++) {
  per.push(game(g));
  if ((g + 1) % 20 === 0) console.log(`${g + 1} 판 ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
const out = {};
for (const q of ALL) {
  const row = {};
  for (const k of [1, 2, 3]) {
    let ok = 0, n = 0;
    for (let i = 0; i + k <= per.length; i += k) { n++; if (per.slice(i, i + k).reduce((s, x) => s + x[q.id], 0) >= q.need) ok++; }
    row[`${k}판`] = +(ok / n).toFixed(2);
  }
  out[q.id] = row;
}
console.log(JSON.stringify({ games: GAMES, player: ME, ai: AI, doneWithin: out }, null, 1));
