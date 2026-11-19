// 반격 목표 질문용 국면 6개: 봇 판(백 쉬움 대 흑 보통)에서 반격 목표가 뜨는 순간(재료 −5 이하 두 번 연속)의 백 차례 국면.
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../../../../src/rules/ai.js';
import { newRally, rallyStep, materialGap } from '../../../../src/cards/rally.js';
let seed = 97531;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const out = [];
for (let g = 0; out.length < 6 && g < 40; g++) {
  const c = new Chess();
  const history = [];
  let rally = newRally();
  for (let ply = 0; ply < 160 && !c.isGameOver(); ply++) {
    const mv = chooseMove(c.fen(), { level: c.turn() === 'w' ? 'easy' : 'normal', history, rand });
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
    const m = c.history({ verbose: true }).at(-1);
    const r = rallyStep(rally, m, 'w');
    rally = r.state;
    if (r.offered) { out.push({ game: g, ply: c.history().length, fen: c.fen(), gap: materialGap(c.fen(), 'w'), goal: r.offered.id }); break; }
  }
}
writeFileSync('positions.json', JSON.stringify(out, null, 1));
console.log(out.map((p) => `${p.game} ${p.ply} ${p.gap} ${p.goal}`).join('\n'));
