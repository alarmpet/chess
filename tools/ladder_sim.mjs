// 왕관 사다리 시뮬(계획서 §4.4 L-1 측정). 실력이 다른 가상 선수들이 친구 무리 안에서 랭크 판을 두고,
// Glicko-2(실력) · 사다리(보이는 랭크)가 어떻게 움직이는지 잰다.
//   node tools/ladder_sim.mjs [--json out.json] [--seed 7]
// 판 결과는 「진짜 실력」(Elo 식 기대 승률) + 무승부 6%(FN-측 봇 보통 대 보통 6%)로 뽑는다. 사람 판 분포와 같다는 근거는 없다.
import { writeFileSync } from 'node:fs';
import { START, rateGame } from '../src/rank/glicko2.js';
import { RULES, START_LADDER, TIER_START, applyGame, placeOf, targetOf } from '../src/rank/ladder.js';
import { PAIR_DAILY_CAP, PAIR_WEEKLY_CAP } from '../src/rank/abuse.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
let seed = Number(arg('--seed', 7));
// 비교용: --noloss 200 --floors alpha,crown
if (arg('--noloss', null) != null) RULES.noLossBelow = Number(arg('--noloss'));
if (arg('--minwin', null) != null) RULES.minWin = Number(arg('--minwin'));
if (arg('--floors', null) != null) RULES.floorTiers = arg('--floors').split(',').filter(Boolean);
// R-4 이전 식과 비교: --old  (목표 위에서도 🔥·최소 승 3·감속 −8)
if (process.argv.includes('--old')) Object.assign(RULES, { minWinAbove: RULES.minWin, adjMin: -8, streakBelowOnly: false });
const CAP = Number(arg('--cap', PAIR_DAILY_CAP));
const WEEK_CAP = Number(arg('--weekcap', PAIR_WEEKLY_CAP));
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const DRAW = 0.06;
const BANDS = [['약함 <1300', 0, 1300], ['보통 1300~1600', 1300, 1600], ['강함 1600~1900', 1600, 1900], ['아주 강함 ≥1900', 1900, 9999]];

function play(a, b) {
  const pa = 1 / (1 + 10 ** ((b.skill - a.skill) / 400));
  const r = rand();
  if (r < DRAW) return 0.5;
  return rand() < pa ? 1 : 0;
}

function game(a, b, forced = null) {
  const score = forced ?? play(a, b);
  const ra = a.glicko.rating, rb = b.glicko.rating;
  const la = applyGame(a.ladder, { score, me: ra, opp: rb });
  const lb = applyGame(b.ladder, { score: 1 - score, me: rb, opp: ra });
  const g = rateGame(a.glicko, b.glicko, score);
  for (const [p, l, s] of [[a, la, score], [b, lb, 1 - score]]) {
    p.games++;
    p.ladder = l.state;
    if (s === 0) { p.losses++; if (l.floored) p.floored++; if (l.delta === 0) p.freeLoss++; }
    p.deltas.push(l.delta);
    for (const t of ['adult', 'alpha', 'crown']) if (p.reach[t] == null && l.state.points >= TIER_START[t]) p.reach[t] = p.games;
    p.maxPoints = Math.max(p.maxPoints, l.state.points);
  }
  a.glicko = g.white; b.glicko = g.black;
}

const mk = (skill) => ({ skill, glicko: { ...START }, ladder: { ...START_LADDER }, games: 0, losses: 0, floored: 0, freeLoss: 0, deltas: [], reach: {}, maxPoints: 0 });

function spearman(xs, ys) {
  const rank = (v) => { const idx = v.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const r = Array(v.length); idx.forEach(([, i], k) => { r[i] = k; }); return r; };
  const rx = rank(xs), ry = rank(ys), n = xs.length;
  let d2 = 0; for (let i = 0; i < n; i++) d2 += (rx[i] - ry[i]) ** 2;
  return 1 - (6 * d2) / (n * (n * n - 1));
}
const median = (v) => { const s = v.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

// 1) 친구 무리 40개 × 6명, 실력 1000~2100 고르게. 무리마다 600번 짝 → 한 사람 약 200판.
const circles = [];
for (let c = 0; c < 40; c++) circles.push(Array.from({ length: 6 }, () => mk(1000 + rand() * 1100)));
for (const circle of circles) {
  for (let k = 0; k < 600; k++) {
    const i = Math.floor(rand() * 6);
    let j = Math.floor(rand() * 5); if (j >= i) j++;
    game(circle[i], circle[j]);
  }
}
const all = circles.flat();
const out = { rules: { ...RULES }, seed: Number(arg('--seed', 7)), players: all.length, gamesPerPlayer: Math.round(all.reduce((s, p) => s + p.games, 0) / all.length) };
out.spearmanSkillLadder = +spearman(all.map((p) => p.skill), all.map((p) => p.ladder.points)).toFixed(3);
out.spearmanSkillGlicko = +spearman(all.map((p) => p.skill), all.map((p) => p.glicko.rating)).toFixed(3);
out.meanGapLadderToTarget = Math.round(all.reduce((s, p) => s + Math.abs(p.ladder.points - targetOf(p.glicko.rating)), 0) / all.length);
out.bands = BANDS.map(([name, lo, hi]) => {
  const ps = all.filter((p) => p.skill >= lo && p.skill < hi);
  const tiers = { cub: 0, adult: 0, alpha: 0, crown: 0 };
  for (const p of ps) tiers[placeOf(p.ladder.points).tier]++;
  const losses = ps.reduce((s, p) => s + p.losses, 0);
  return {
    band: name, n: ps.length, tiers,
    medianPoints: median(ps.map((p) => p.ladder.points)),
    medianGamesTo: { adult: median(ps.map((p) => p.reach.adult)), alpha: median(ps.map((p) => p.reach.alpha)), crown: median(ps.map((p) => p.reach.crown)) },
    reached: { adult: ps.filter((p) => p.reach.adult).length, alpha: ps.filter((p) => p.reach.alpha).length, crown: ps.filter((p) => p.reach.crown).length },
    lossShare: { free: +(ps.reduce((s, p) => s + p.freeLoss, 0) / Math.max(1, losses)).toFixed(2), floored: +(ps.reduce((s, p) => s + p.floored, 0) / Math.max(1, losses)).toFixed(2) },
    meanWinDelta: Math.round(ps.flatMap((p) => p.deltas.filter((d) => d > 0)).reduce((s, d, _, a) => s + d / a.length, 0))
  };
});

// 2) 부모(1800) 대 아이(1150) 둘만. 하루 5판씩 20일 두는데, 같은 상대 하루 상한(R-4) 넘는 판은 점수에 안 들어간다.
const winsOf = (p) => p.deltas.filter((d) => d > 0).length;
function pair(days, perDay, cap, mkA, mkB, forced = null) {
  const a = mkA(), b = mkB();
  const counted = [];   // 날마다 점수에 들어간 판 수 — 지난 7일 합이 주간 상한을 넘으면 그날은 그만
  for (let d = 0; d < days; d++) {
    const week = counted.slice(-6).reduce((x, y) => x + y, 0);
    const n = Math.max(0, Math.min(perDay, cap, WEEK_CAP - week));
    for (let k = 0; k < n; k++) game(a, b, forced);
    counted.push(n);
  }
  return { a, b };
}
{
  const DAYS = Number(arg('--days', 20));
  const { a: parent, b: child } = pair(DAYS, 5, CAP, () => mk(1800), () => mk(1150));
  out.parentChild = {
    days: DAYS, perDay: 5, cap: CAP, weekCap: WEEK_CAP, counted: parent.games,
    childWins: winsOf(child), childPoints: child.ladder.points, childPlace: placeOf(child.ladder.points), childWinDeltas: child.deltas.filter((d) => d > 0),
    parentPoints: parent.ladder.points, parentPlace: placeOf(parent.ladder.points), parentTarget: targetOf(parent.glicko.rating), parentLossDeltas: parent.deltas.filter((d) => d < 0).slice(0, 6)
  };
}
// 3) 짜고 올리기: 같은 실력(1500) 두 기기에서 B 가 매번 진다. 하루 10판을 하려 해도 상한까지만 들어간다.
{
  const { a: booster, b: feeder } = pair(28, 10, CAP, () => mk(1500), () => mk(1500), 1);
  out.winTrading = { days: 28, tried: 280, counted: booster.games, boosterPoints: booster.ladder.points, boosterPlace: placeOf(booster.ladder.points), boosterRating: Math.round(booster.glicko.rating), feederRating: Math.round(feeder.glicko.rating) };
}

console.log(JSON.stringify(out, null, 1));
const file = arg('--json', null);
if (file) writeFileSync(file, JSON.stringify(out, null, 1));
