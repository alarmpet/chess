// 공유 미션 후보 측정(2026-11-05, 미션 라운드): 봇 대 봇으로 각 후보가 판 안에서 얼마나 자주 「닫히는지」(누군가 먼저 달성),
// 닫힌 판에서 백이 먼저인 비율, 처음 닫히는 수(ply)를 잰다. AI 는 미션을 모른다(가산 0) — 실제 게임과 같다.
//   node tools/mission_sim.mjs [판 수=100] [최대 ply=160]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { RACES } from '../src/cards/missions.js';

const GAMES = Number(process.argv[2] || 100);
const MAX_PLY = Number(process.argv[3] || 160);
// 후보는 게임이 쓰는 정의 그대로(src/cards/missions.js RACES) — 시뮬과 게임이 갈라지지 않게.
const CENTER = new Set(['d4', 'e4', 'd5', 'e5']);
const CANDIDATES = Object.fromEntries(RACES.map((r) => [r.id, r.hit]));
// 게임 풀에 없는 비교용 후보: 가운데 네 칸에 먼저 서기(agy 안), 승급(codex 안)
CANDIDATES.center = (m) => !'kqr'.includes(m.piece) && CENTER.has(m.to);
CANDIDATES.promote = (m) => Boolean(m.promotion);

let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

function play(levels) {
  const chess = new Chess();
  const history = [];
  const first = {};
  for (let ply = 0; ply < MAX_PLY && !chess.isGameOver(); ply++) {
    const color = chess.turn();
    const mv = chooseMove(chess.fen(), { level: levels[color], history, rand });
    if (!mv) break;
    const m = chess.move(mv);
    history.push(positionKey(chess.fen()));
    for (const [id, test] of Object.entries(CANDIDATES)) if (!first[id] && test(m)) first[id] = { color, ply: ply + 1 };
  }
  return { first, plies: chess.history().length };
}

const PAIRS = [['easy', 'easy'], ['normal', 'normal'], ['normal', 'easy'], ['easy', 'normal']];
const out = {};
const t0 = Date.now();
for (const [w, b] of PAIRS) {
  const key = `${w}-${b}`;
  const rows = {};
  let plies = 0;
  for (let g = 0; g < GAMES; g++) {
    const { first, plies: n } = play({ w, b });
    plies += n;
    for (const id of Object.keys(CANDIDATES)) {
      const r = (rows[id] ||= { closed: 0, white: 0, plySum: 0 });
      if (first[id]) { r.closed++; r.plySum += first[id].ply; if (first[id].color === 'w') r.white++; }
    }
  }
  out[key] = { games: GAMES, avgPlies: +(plies / GAMES).toFixed(1), rows: Object.fromEntries(Object.entries(rows).map(([id, r]) => [id, {
    closed: +(r.closed / GAMES).toFixed(2), whiteFirst: r.closed ? +(r.white / r.closed).toFixed(2) : null, meanPly: r.closed ? Math.round(r.plySum / r.closed) : null
  }])) };
  console.log(`${key}: ${((Date.now() - t0) / 1000).toFixed(0)}s, 평균 ${out[key].avgPlies} ply`);
}
console.log(JSON.stringify(out, null, 1));
