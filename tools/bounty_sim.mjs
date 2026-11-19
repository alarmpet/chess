// 현상금 말 측정(목표 층 OL-1, 2026-11-06): 봇 대 봇으로 ⓐ 현상금이 한 번이라도 붙은 판 비율 ⓑ 붙은 현상금이 잡힌 비율
// ⓒ 현상금을 처음 붙인 색·잡은 색의 쏠림 ⓓ 판당 도토리. AI 는 현상금을 모른다(게임과 같다). 판정은 게임과 같은 src/cards/bounty.js.
//   node tools/bounty_sim.mjs [판 수=60] [최대 ply=160]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { bountyStep, newBounty } from '../src/cards/bounty.js';

const GAMES = Number(process.argv[2] || 60);
const MAX_PLY = Number(process.argv[3] || 160);
let seed = 777;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

function play(levels) {
  const chess = new Chess();
  const history = [];
  const s = newBounty();
  const r = { marked: 0, markedBy: { w: 0, b: 0 }, claimed: 0, claimedBy: { w: 0, b: 0 }, acorns: { w: 0, b: 0 }, firstMarkPly: null };
  for (let ply = 0; ply < MAX_PLY && !chess.isGameOver(); ply++) {
    const mv = chooseMove(chess.fen(), { level: levels[chess.turn()], history, rand });
    if (!mv) break;
    const m = chess.move(mv);
    history.push(positionKey(chess.fen()));
    const { claimed, marked } = bountyStep(s, m);
    if (marked) { r.marked++; r.markedBy[m.color]++; r.firstMarkPly ??= ply + 1; }
    if (claimed) { r.claimed++; r.claimedBy[claimed.by]++; r.acorns[claimed.by] += claimed.acorns; }
  }
  return r;
}

const PAIRS = [['easy', 'easy'], ['normal', 'normal'], ['normal', 'easy'], ['easy', 'normal']];
const out = {};
for (const [w, b] of PAIRS) {
  const t0 = Date.now();
  const rows = [];
  for (let g = 0; g < GAMES; g++) rows.push(play({ w, b }));
  const sum = (f) => rows.reduce((n, x) => n + f(x), 0);
  const marks = sum((x) => x.marked);
  const claims = sum((x) => x.claimed);
  out[`${w}-${b}`] = {
    games: GAMES,
    gamesWithBounty: +(rows.filter((x) => x.marked).length / GAMES).toFixed(2),
    marksPerGame: +(marks / GAMES).toFixed(2),
    markedWhite: marks ? +(sum((x) => x.markedBy.w) / marks).toFixed(2) : null,
    claimedShare: marks ? +(claims / marks).toFixed(2) : null,
    claimedByWhite: claims ? +(sum((x) => x.claimedBy.w) / claims).toFixed(2) : null,
    acornsPerGame: { w: +(sum((x) => x.acorns.w) / GAMES).toFixed(1), b: +(sum((x) => x.acorns.b) / GAMES).toFixed(1) },
    firstMarkPly: Math.round(sum((x) => x.firstMarkPly || 0) / Math.max(1, rows.filter((x) => x.firstMarkPly).length))
  };
  console.log(`${w}-${b}`, `${((Date.now() - t0) / 1000).toFixed(0)}s`, JSON.stringify(out[`${w}-${b}`]));
}
console.log(JSON.stringify(out, null, 1));
