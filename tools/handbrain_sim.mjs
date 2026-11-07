// 손과 뇌 측정(목표 층 OL-4, 2026-11-06): 약한 손(쉬움 봇)이 혼자 둘 때와, 뇌가 말 종류를 불러 줄 때를 비교한다.
//   solo      — 손 혼자(쉬움) 대 AI(보통)
//   adviser   — AI 조언자(보통 탐색의 최선 수의 말 종류)가 부르고 손(쉬움)이 그 종류 안에서 둔다
//   random    — 뇌가 둘 수 있는 종류 중 아무거나(서툰 뇌의 하한)
// 함께 재는 것: 손이 조언자 자신의 수와 같은 수를 둔 비율(힌트가 수를 대신 두지 않는가), 조언 한 번의 시간,
// 판당 잡기·체크(가족 퀘스트가 몇 판에 차는가).
//   node tools/handbrain_sim.mjs [판 수=60]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { FAMILY_QUESTS, adviseKind, movableKinds } from '../src/cards/handBrain.js';

const GAMES = Number(process.argv[2] || 60);
let seed = 4242;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

function game(mode) {
  const chess = new Chess();
  const history = [];
  const events = [];
  let same = 0, mine = 0, adviseMs = 0, advises = 0;
  for (let ply = 0; ply < 160 && !chess.isGameOver(); ply++) {
    const fen = chess.fen();
    let mv;
    if (chess.turn() === 'b') mv = chooseMove(fen, { level: 'normal', history, rand });
    else if (mode === 'solo') mv = chooseMove(fen, { level: 'easy', history, rand });
    else {
      let kind;
      if (mode === 'adviser') {
        const t = performance.now();
        kind = adviseKind(fen, { history, rand });
        adviseMs += performance.now() - t; advises++;
      } else {
        const kinds = movableKinds(fen);
        kind = kinds[Math.floor(rand() * kinds.length)];
      }
      mv = chooseMove(fen, { level: 'easy', history, rand, only: kind });
      if (mode === 'adviser') {
        const best = chooseMove(fen, { level: 'normal', history, rand, slip: 0 });
        mine++; if (best && best.from === mv.from && best.to === mv.to) same++;
      }
    }
    if (!mv) break;
    chess.move(mv);
    history.push(positionKey(chess.fen()));
    if (chess.turn() === 'b') events.push({ kind: 'move', move: chess.history({ verbose: true }).at(-1) });
  }
  const result = chess.isCheckmate() ? (chess.turn() === 'b' ? 'win' : 'loss') : 'draw';
  events.push({ kind: 'end', result });
  return { result, plies: chess.history().length, events, same, mine, adviseMs, advises };
}

const out = {};
const t0 = Date.now();
for (const mode of ['solo', 'adviser', 'random']) {
  const rows = [];
  for (let g = 0; g < GAMES; g++) rows.push(game(mode));
  const n = (r) => rows.filter((x) => x.result === r).length;
  const caps = rows.map((x) => x.events.filter((e) => e.kind === 'move' && e.move.captured).length);
  const checks = rows.map((x) => x.events.filter((e) => e.kind === 'move' && /[+#]$/.test(e.move.san)).length);
  // 가족 퀘스트: 연속한 판을 차례로 이어 붙여 몇 판째에 차는가(중앙값).
  const family = {};
  for (const q of FAMILY_QUESTS) {
    const need = [];
    let have = 0, start = 0;
    rows.forEach((x, i) => {
      have += x.events.reduce((s, e) => s + q.count(e), 0);
      if (have >= q.need) { need.push(i - start + 1); have = 0; start = i + 1; }
    });
    need.sort((a, b) => a - b);
    family[q.id] = need.length ? need[Math.floor(need.length / 2)] : null;
  }
  const sum = (k) => rows.reduce((s, x) => s + x[k], 0);
  out[mode] = {
    win: +(n('win') / GAMES).toFixed(2), draw: +(n('draw') / GAMES).toFixed(2), loss: +(n('loss') / GAMES).toFixed(2),
    plies: Math.round(sum('plies') / GAMES),
    capsPerGame: +(caps.reduce((a, b) => a + b, 0) / GAMES).toFixed(1),
    checksPerGame: +(checks.reduce((a, b) => a + b, 0) / GAMES).toFixed(1),
    familyGamesMedian: family,
    ...(mode === 'adviser' ? { handPlaysAdviserMove: +(sum('same') / sum('mine')).toFixed(2), adviseMsAvg: +(sum('adviseMs') / sum('advises')).toFixed(1) } : {})
  };
  console.log(mode, `${((Date.now() - t0) / 1000).toFixed(0)}s`, JSON.stringify(out[mode]));
}
console.log(JSON.stringify({ games: GAMES, hand: 'easy', opponent: 'normal', out }, null, 1));
