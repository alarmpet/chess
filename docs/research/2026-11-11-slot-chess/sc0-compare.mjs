// SC-0 규칙 비교: 계약을 아는 AI 끼리, 색은 같은 AI 라 백·흑 차이가 곧 선공 편향이다.
//   node docs/research/2026-11-11-slot-chess/sc0-compare.mjs <세트id> <규칙> <판수> <단계> [시드=7000]
//   규칙: base  = 지금 규칙(먼저 둘을 채우면 그 자리에서 이긴다)
//         reply = 같은 차례 규칙 후보 — 백이 먼저 채우면 흑에게 한 수가 더 있고, 흑도 그 수로 채우면 비긴다(공동 완성)
// 엔진과 같은 AI(src/rules/ai.js)·판정(src/rules/contractGame.js)을 쓴다. 고정 시드. 결과는 sc0/<세트>-<규칙>-<단계>.json
// 한계: reply 규칙에서도 백 AI 는 「채우면 이긴다」고 믿고 둔다(흑의 마지막 한 수를 셈하지 않는다).
import { Chess } from 'chess.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseMove, positionKey } from '../../../src/rules/ai.js';
import { CONTRACT_NEED, contractProblem } from '../../../src/rules/contractSets.js';
import { CONTRACT_PLY_LIMIT, contractAiState, contractVerdict } from '../../../src/rules/contractGame.js';

export const CANDIDATES = {
  p2nb: [{ type: 'p', count: 2 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }],
  p2nr: [{ type: 'p', count: 2 }, { type: 'n', count: 1 }, { type: 'r', count: 1 }],
  p3nb: [{ type: 'p', count: 3 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }],
  p2bn2: [{ type: 'p', count: 2 }, { type: 'b', count: 1 }, { type: 'n', count: 2 }],
  pnb: [{ type: 'p', count: 1 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }],
  pnr: [{ type: 'p', count: 1 }, { type: 'n', count: 1 }, { type: 'r', count: 1 }]
};

const [id = 'p2nb', rule = 'base', nArg = '60', level = 'normal', seedArg = '7000'] = process.argv.slice(2);
const SEED = Number(seedArg);
const set = { id, goals: CANDIDATES[id] };
if (!set.goals || contractProblem(set)) throw new Error(`세트가 틀렸다: ${id} ${contractProblem(set) || ''}`);
const N = Number(nArg);

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };
const p90 = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]; };

/** 승자에서 끊지 않고 센 진도: 색마다 채운 목표와 둘째를 채운 반수. */
function fullProgress(moves) {
  const counts = { w: set.goals.map(() => 0), b: set.goals.map(() => 0) };
  const done = { w: 0, b: 0 }, at = { w: null, b: null };
  moves.forEach((m, i) => {
    const gi = m.captured ? set.goals.findIndex((g) => g.type === m.captured) : -1;
    if (gi < 0 || counts[m.color][gi] >= set.goals[gi].count) return;
    counts[m.color][gi] += 1;
    if (counts[m.color][gi] === set.goals[gi].count) { done[m.color] += 1; if (done[m.color] === CONTRACT_NEED) at[m.color] = i + 1; }
  });
  return { counts, done, at };
}

function judge(moves, standard) {
  const base = contractVerdict(set, moves, standard);
  if (rule === 'base' || standard.checkmate) return base;
  const fp = fullProgress(moves);
  if (fp.at.b !== null && (fp.at.w === null || fp.at.b < fp.at.w)) return { ...base, over: true, winner: 'b', reason: 'contract' };
  if (fp.at.w !== null) {
    if (moves.length === fp.at.w) {   // 흑의 마지막 한 수를 기다린다 — 둘 수가 없으면 백 승
      if (standard.stalemate) return { ...base, over: true, winner: 'w', reason: 'contract' };
      return { ...base, over: false, winner: null, reason: null };
    }
    return fp.at.b === fp.at.w + 1 ? { ...base, over: true, winner: null, reason: 'tie' } : { ...base, over: true, winner: 'w', reason: 'contract' };
  }
  return base.reason === 'contract' ? { ...base, over: false } : base;
}

function playGame(seed) {
  const chess = new Chess();
  const rand = mulberry32(seed);
  const keys = [];
  let v = null, firstCapture = null;
  for (;;) {
    const moves = chess.history({ verbose: true });
    const pick = chooseMove(chess.fen(), { level, history: keys, rand, contract: contractAiState(set, moves) });
    if (!pick) break;
    const m = chess.move(pick);
    keys.push(positionKey(m.after));
    const all = chess.history({ verbose: true });
    if (m.captured && firstCapture === null) firstCapture = all.length;
    v = judge(all, {
      checkmate: chess.isCheckmate(), stalemate: chess.isStalemate(), threefold: chess.isThreefoldRepetition(),
      fifty: chess.isDrawByFiftyMoves ? chess.isDrawByFiftyMoves() : false, kingsOnly: chess.board().flat().filter(Boolean).length <= 2
    });
    if (v.over || all.length > CONTRACT_PLY_LIMIT + 1) break;
  }
  const all = chess.history({ verbose: true });
  const fp = fullProgress(all);
  const winGoals = v?.winner && v.reason === 'contract'
    ? set.goals.filter((g, i) => fp.counts[v.winner][i] >= g.count).map((g) => g.type + (g.count > 1 ? g.count : '')).join('+') : null;
  // 이긴 쪽이 계약 완성 한 수 전에 상대 표적을 하나 남겨 둔 채였나(= 매치 포인트를 지나 이겼나)
  return { plies: all.length, reason: v?.reason || 'none', winner: v?.winner || null, captures: all.filter((m) => m.captured).length, firstCapture, winGoals, loserDone: v?.winner ? fp.done[v.winner === 'w' ? 'b' : 'w'] : null };
}

const t0 = Date.now();
const games = [];
for (let i = 0; i < N; i++) games.push(playGame(SEED + i * 7919 + (level === 'easy' ? 0 : 500000)));
const count = (f) => games.filter(f).length;
const by = (key) => games.reduce((o, g) => { const k = g[key] ?? '-'; o[k] = (o[k] || 0) + 1; return o; }, {});
const decided = games.filter((g) => g.winner);
const white = count((g) => g.winner === 'w');
// 목표 종류마다 「이긴 쪽이 채운 판」 비중 — 셋 중 하나가 0 에 가까우면 그 목표는 장식이다
const goalUse = Object.fromEntries(set.goals.map((g) => {
  const key = g.type + (g.count > 1 ? g.count : '');
  return [key, +(count((x) => x.winGoals && x.winGoals.split('+').includes(key)) / Math.max(1, count((x) => x.winGoals))).toFixed(2)];
}));
const out = {
  at: new Date().toISOString(), set: id, goals: set.goals, rule, level, seed: SEED, games: N, seconds: Math.round((Date.now() - t0) / 1000),
  reasons: by('reason'), white, black: count((g) => g.winner === 'b'), draw: count((g) => !g.winner),
  whiteShareOfDecided: decided.length ? +(white / decided.length).toFixed(3) : null,
  plies: { median: median(games.map((g) => g.plies)), p90: p90(games.map((g) => g.plies)) },
  captures: { median: median(games.map((g) => g.captures)), min: Math.min(...games.map((g) => g.captures)) },
  firstCapture: median(games.filter((g) => g.firstCapture !== null).map((g) => g.firstCapture)),
  loserDoneOne: count((g) => g.loserDone === 1), winGoals: by('winGoals'), goalUse
};
mkdirSync(new URL('./sc0/', import.meta.url), { recursive: true });
writeFileSync(new URL(`./sc0/${id}-${rule}-${level}${SEED === 7000 ? "" : "-s" + SEED}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
