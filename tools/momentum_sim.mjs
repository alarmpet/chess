// 흐름 음 계단(DR-1a) 측정: 봇끼리 판을 두며 잡기·체크 소리가 몇 번 「올라간 음」으로 나는지 센다.
// 오른 음 = 그 수에서 momentumSteps ≥ 2(한쪽이 잡기·체크를 이어 감). 폰끼리 잡기 계단(CX-4)과 겹친 것도 따로 센다.
//   node tools/momentum_sim.mjs [판 수=40]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { countPawnTrades, momentumSteps } from '../src/fx/captureSpecial.js';

const N = Number(process.argv[2] || 40);
let seed = 4242;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const PAIRS = { '보통 대 보통': ['normal', 'normal'], '쉬움 대 보통': ['easy', 'normal'] };
for (const [name, [a, b]] of Object.entries(PAIRS)) {
  let events = 0, raised = 0, pawnOnly = 0, top = 0, plies = 0;
  const perGame = [];
  for (let g = 0; g < N; g++) {
    const c = new Chess();
    const hist = [];
    let raisedHere = 0;
    for (let ply = 0; ply < 240 && !c.isGameOver(); ply++) {
      const side = c.turn() === 'w' ? (g % 2 ? b : a) : (g % 2 ? a : b);
      const mv = chooseMove(c.fen(), { level: side, history: hist, rand });
      if (!mv) break;
      c.move(mv);
      hist.push(positionKey(c.fen()));
      const h = c.history({ verbose: true });
      const last = h[h.length - 1];
      if (!(last.captured || /[+#]$/.test(last.san))) continue;
      events++;
      const s = momentumSteps(h, last.color);
      const pawnN = last.piece === 'p' && last.captured === 'p' ? countPawnTrades(h) : 0;
      if (s >= 2) { raised++; raisedHere++; top = Math.max(top, s); }
      else if (pawnN >= 2) pawnOnly++;
    }
    plies += c.history().length;
    perGame.push(raisedHere);
  }
  perGame.sort((x, y) => x - y);
  console.log(`${name} ${N}판: 잡기·체크 ${events}번 중 오른 음 ${raised}번(${Math.round((100 * raised) / Math.max(1, events))}%) · 판당 중앙값 ${perGame[Math.floor(N / 2)]}번 · 가장 높은 계단 ${top} · 폰 계단만 오른 것 ${pawnOnly}번 · 평균 ${Math.round(plies / N)}반수`);
}
