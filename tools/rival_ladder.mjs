// 라이벌 사다리 측정(FN-2, 2026-11-07): AI 세기 후보마다 「약한 플레이어(쉬움 봇)」·「대등한 플레이어(보통 봇)」가 이기는 비율.
// 봇 측정(2026-11-06)에서 라이벌 세기가 실수 값(slip)과 반대로 나와서(실수는 블런더를 거의 안 만듦), 탐색 깊이와 실수를 섞은
// 후보를 같은 판 수로 비교해 「쉬움 → 보통 → 어려움」이 고르게 오르는 사다리를 고른다. 판마다 색을 바꾼다.
//   node tools/rival_ladder.mjs [후보당 판 수=40]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';

const N = Number(process.argv[2] || 40);
let seed = 24680;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const PLAYERS = { '약한 플레이어(쉬움 봇)': { level: 'easy' }, '대등한 플레이어(보통 봇)': { level: 'normal' } };
const CANDIDATES = {
  'd1 · 실수 0.3 (지금 피크닉)': { level: 'easy', slip: 0.3 },
  'd1 · 실수 0.1': { level: 'easy', slip: 0.1 },
  'd1 · 실수 0': { level: 'easy', slip: 0 },
  'd2 · 실수 0.3': { level: 'normal', slip: 0.3 },
  'd2 · 실수 0.1 (지금 자유 대국)': { level: 'normal', slip: 0.1 }
};

function play(white, black) {
  const c = new Chess();
  const history = [];
  for (let ply = 0; ply < 240 && !c.isGameOver(); ply++) {
    const mv = chooseMove(c.fen(), { ...(c.turn() === 'w' ? white : black), history, rand });
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
  }
  return c.isCheckmate() ? (c.turn() === 'b' ? 'w' : 'b') : 'draw';
}

const t0 = Date.now();
console.log(`라이벌 사다리 — 후보당 ${N}판(색 번갈아), 플레이어 기준 승·무·패`);
for (const [pName, p] of Object.entries(PLAYERS)) {
  console.log(`\n${pName}`);
  for (const [cName, ai] of Object.entries(CANDIDATES)) {
    let w = 0, d = 0, l = 0;
    for (let i = 0; i < N; i++) {
      const meWhite = i % 2 === 0;
      const r = meWhite ? play(p, ai) : play(ai, p);
      if (r === 'draw') d++;
      else if ((r === 'w') === meWhite) w++;
      else l++;
    }
    console.log(`  ${cName.padEnd(26)} 승 ${String(Math.round((100 * w) / N)).padStart(3)}% · 무 ${String(Math.round((100 * d) / N)).padStart(3)}% · 패 ${String(Math.round((100 * l) / N)).padStart(3)}%  (${w}/${d}/${l})`);
  }
}
console.log(`\n${Math.round((Date.now() - t0) / 1000)}초`);
