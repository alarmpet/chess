// 딱 맞는 상대 추천 측정(DR-M1 m2, 2026-11-10). 실력이 다른 가상 선수들이 자동 맞춤으로 판을 둔다.
// 판 결과는 선수의 「진짜 실력」과 단계 점수(STEP_RATING)의 Elo 기대 승률로 뽑는다(무승부 10%). 봇 대국이 아니라 규칙만 잰다.
// 잴 것: 20판 안에 「맞는 단계」(진짜 기대 승률 0.45~0.60, 범위 밖이면 가장 가까운 단계)에 닿는 비율 · 닿기까지 판 수 ·
//        단계가 오르내린 횟수(흔들림) · 20판 동안 실제 승률.
//   node tools/coach_sim.mjs [선수 수=200] [--json out.json]
import { writeFileSync } from 'node:fs';
import { STEPS, STEP_RATING, afterGame, expectedScore, newSkill, ratingOfStep, tuneCoach } from '../src/rules/strength.js';
const bandAt = process.argv.indexOf('--band');
if (bandAt > 0) tuneCoach({ band: process.argv[bandAt + 1].split(',').map(Number) });

const args = process.argv.slice(2);
const P = Number(args.find((a) => /^\d+$/.test(a)) || 200);
const jsonAt = args.indexOf('--json');
let seed = 1357;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const GAMES = 20, DRAW = 0.1;
const lo = STEP_RATING[0] - 100, hi = STEP_RATING[STEP_RATING.length - 1] + 50;   // 7단계보다 센 선수는 7단계가 답이라 범위를 단계 안쪽으로

const fits = (truth) => {
  const ok = STEPS.filter((s) => { const e = expectedScore(truth, ratingOfStep(s.step)); return e >= 0.45 && e <= 0.6; }).map((s) => s.step);
  if (ok.length) return ok;
  let best = 1, gap = Infinity;
  for (const s of STEPS) { const g = Math.abs(expectedScore(truth, ratingOfStep(s.step)) - 0.55); if (g < gap) { gap = g; best = s.step; } }
  return [best];
};
const rows = [];
for (let p = 0; p < P; p++) {
  const truth = lo + (hi - lo) * (p + 0.5) / P;
  const good = fits(truth);
  let s = newSkill();
  let reachedAt = null, swings = 0, score = 0, lastDir = 0;
  for (let g = 1; g <= GAMES; g++) {
    const e = expectedScore(truth, ratingOfStep(s.step));
    const r = rand();
    const result = r < DRAW ? 'draw' : rand() < (e - DRAW / 2) / (1 - DRAW) ? 'win' : 'loss';
    score += result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
    s = afterGame(s, { result, step: s.step });
    if (s.change) { const dir = Math.sign(s.change.to - s.change.from); if (lastDir && dir !== lastDir) swings += 1; lastDir = dir; }
    if (reachedAt === null && good.includes(s.step)) reachedAt = g;
  }
  rows.push({ truth: Math.round(truth), good, final: s.step, reachedAt, endsGood: good.includes(s.step), swings, winRate: +(score / GAMES).toFixed(2) });
}
const med = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };
const share = (f) => +(rows.filter(f).length / rows.length).toFixed(2);
const out = {
  players: P, games: GAMES, stepRating: STEP_RATING,
  reached20: share((r) => r.reachedAt !== null), endsGood: share((r) => r.endsGood), medianReachedAt: med(rows.map((r) => r.reachedAt)),
  medianSwings: med(rows.map((r) => r.swings)), swings3plus: share((r) => r.swings >= 3),
  winRateMedian: med(rows.map((r) => r.winRate)),
  byBand: [[0, 0.33], [0.33, 0.66], [0.66, 1.01]].map(([a, b]) => {
    const rs = rows.filter((r) => (r.truth - lo) / (hi - lo) >= a && (r.truth - lo) / (hi - lo) < b);
    return { band: `${Math.round(lo + (hi - lo) * a)}~${Math.round(lo + (hi - lo) * b)}`, n: rs.length, endsGood: +(rs.filter((r) => r.endsGood).length / rs.length).toFixed(2), medianReachedAt: med(rs.map((r) => r.reachedAt)), winRateMedian: med(rs.map((r) => r.winRate)) };
  })
};
console.log(JSON.stringify(out, null, 1));
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify({ ...out, rows }, null, 1));
