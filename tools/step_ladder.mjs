// 7단계 사다리 측정(DR-M1 m1, 2026-11-10): 이웃 단계끼리 두어 약한 쪽 점수가 고르게 오르는지(목표 0.25~0.40) 본다.
// 점수 = 승 + 무/2. 판마다 색을 바꾼다. 결과로 단계 점수(Elo 차를 이어 붙임)를 낸다 → src/rules/strength.js STEP_RATING.
//   node tools/step_ladder.mjs [짝당 판 수=24] [--json out.json] [--pairs 1-2,2-3]
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { STEPS } from '../src/rules/strength.js';

const args = process.argv.slice(2);
const N = Number(args.find((a) => /^\d+$/.test(a)) || 24);
const jsonAt = args.indexOf('--json');
const pairsAt = args.indexOf('--pairs');
let seed = 86420;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const cfg = (s) => ({ level: s.search, slip: s.slip, blind: s.blind });

function play(white, black) {
  const c = new Chess();
  const history = [];
  for (let ply = 0; ply < 200 && !c.isGameOver(); ply++) {
    const mv = chooseMove(c.fen(), { ...(c.turn() === 'w' ? white : black), history, rand });
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
  }
  return { r: c.isCheckmate() ? (c.turn() === 'b' ? 'w' : 'b') : 'draw', plies: c.history().length };
}
const elo = (score) => { const s = Math.min(0.97, Math.max(0.03, score)); return Math.round(-400 * Math.log10(1 / s - 1)); };

const pairs = pairsAt >= 0 ? args[pairsAt + 1].split(',').map((p) => p.split('-').map(Number)) : STEPS.slice(0, -1).map((s) => [s.step, s.step + 1]);
const out = { n: N, steps: STEPS, pairs: [] };
const t0 = Date.now();
for (const [lo, hi] of pairs) {
  const a = STEPS[lo - 1], b = STEPS[hi - 1];
  let w = 0, d = 0, l = 0, plies = 0;
  const t1 = Date.now();
  for (let i = 0; i < N; i++) {
    const loWhite = i % 2 === 0;
    const g = loWhite ? play(cfg(a), cfg(b)) : play(cfg(b), cfg(a));
    plies += g.plies;
    if (g.r === 'draw') d++;
    else if ((g.r === 'w') === loWhite) w++;
    else l++;
  }
  const score = (w + d / 2) / N;
  const row = { lo, hi, win: w, draw: d, loss: l, score: +score.toFixed(2), eloGap: -elo(score), meanPlies: Math.round(plies / N), seconds: Math.round((Date.now() - t1) / 1000) };
  out.pairs.push(row);
  console.log(`${lo}단계 대 ${hi}단계: 약한 쪽 승 ${w} · 무 ${d} · 패 ${l} → 점수 ${row.score} (Elo 차 약 ${row.eloGap}) · 평균 ${row.meanPlies}반수 · ${row.seconds}초`);
}
out.seconds = Math.round((Date.now() - t0) / 1000);
console.log(`${out.seconds}초`);
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(out, null, 1));
