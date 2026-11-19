// 사람 같은 실수 측정(DR-M1 m3, 2026-11-10): 약한 AI 가 큰 실수(탐색 2수 기준 150점 이상 잃음)를 했을 때,
// 그 실수를 응징하는 상대의 최선 수가 「보기 어려운 수」(4칸 이상 미끄러짐·뒤로 가는 수, ai.js hardToSee)인 비율을 센다.
// 예전 방식(무작위로 둘째·셋째 수: slip)과 새 방식(못 보기: blind)을 같은 상대(4단계 판다)와 두게 해서 비교한다.
// 사람 기보와의 비교는 하지 않았다 — 「사람이 이런 수를 놓친다」는 조사 E(A3·Maia)의 서술을 따른 정의다.
//   node tools/mistake_types.mjs [판 수=12] [--json out.json]
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove, hardToSee, positionKey, rootScores } from '../src/rules/ai.js';

const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a)) || 12);
const jsonAt = args.indexOf('--json');
let seed = 2468;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const idx = (sq) => (8 - Number(sq[1])) * 16 + (sq.charCodeAt(0) - 97);
const OPP = { level: 'easy', slip: 0, blind: 0 };
const KINDS = {
  '예전: 무작위 실수(쉬움 · slip 0.3)': { level: 'easy', slip: 0.3, blind: 0 },
  '새: 못 보기(1단계 · slip 0.4 · blind 0.6)': { level: 'easy', slip: 0.4, blind: 0.6 },
  '새: 못 보기만(slip 0 · blind 0.6)': { level: 'easy', slip: 0, blind: 0.6 }
};
const out = { n: N, rows: [] };
for (const [name, weak] of Object.entries(KINDS)) {
  let blunders = 0, hard = 0, moves = 0;
  const loss = [];
  for (let g = 0; g < N; g++) {
    const c = new Chess();
    const hist = [];
    const weakColor = g % 2 ? 'b' : 'w';
    for (let ply = 0; ply < 160 && !c.isGameOver(); ply++) {
      const me = c.turn() === weakColor ? weak : OPP;
      const fen = c.fen();
      const mv = chooseMove(fen, { ...me, history: hist, rand });
      if (!mv) break;
      if (c.turn() === weakColor) {
        moves++;
        const scores = rootScores(fen, { depth: 2 });
        const best = scores[0].score;
        const mine = scores.find((s) => s.from === mv.from && s.to === mv.to)?.score ?? best;
        if (best - mine >= 150 && best < 50000) {
          blunders++;
          loss.push(best - mine);
          const after = new Chess(fen);
          after.move(mv);
          const reply = rootScores(after.fen(), { depth: 2 })[0];
          if (reply) {
            const p = after.get(reply.from);
            if (p && hardToSee({ piece: p.type, color: p.color, from: idx(reply.from), to: idx(reply.to) })) hard++;
          }
        }
      }
      c.move(mv);
      hist.push(positionKey(c.fen()));
    }
  }
  loss.sort((a, b) => a - b);
  const row = { kind: name, moves, blunders, blunderRate: +(blunders / Math.max(1, moves)).toFixed(3), hardRefutation: +(hard / Math.max(1, blunders)).toFixed(2), medianLoss: loss[Math.floor(loss.length / 2)] ?? null };
  out.rows.push(row);
  console.log(`${name}: 수 ${moves} · 큰 실수 ${blunders}(${(100 * row.blunderRate).toFixed(1)}%) · 응징 수가 보기 어려운 수 ${Math.round(100 * row.hardRefutation)}% · 잃은 점수 중앙값 ${row.medianLoss}`);
}
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(out, null, 1));
