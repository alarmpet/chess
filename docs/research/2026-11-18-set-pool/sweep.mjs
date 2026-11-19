// 계약 세트 풀 늘리기(2026-11-18, 사용자: 「뽑히는 세트 최대로」 · 「셋이 다 같은 말이면 메리트」).
// 만들 수 있는 세트를 전부 만들어 계약을 아는 AI 끼리(보통 단계) 두게 하고, 길이 · 선공 편향 · 목표별 쓰임을 잰다.
//   node docs/research/2026-11-18-set-pool/sweep.mjs <조각 번호> <조각 수> [판수=100] [시드=7000] [단계=normal] [세트 id 들(쉼표)]
// 조각마다 result-<시드>-<단계>-<조각>.json 을 쓴다. 판정·AI 는 게임과 같은 코드(src/rules).
import { Chess } from 'chess.js';
import { writeFileSync } from 'node:fs';
import { chooseMove, positionKey } from '../../../src/rules/ai.js';
import { contractProblem } from '../../../src/rules/contractSets.js';
import { contractAiState, contractVerdict } from '../../../src/rules/contractGame.js';

const [shard = '0', shards = '1', games = '100', seed0 = '7000', level = 'normal', only = ''] = process.argv.slice(2);
const N = Number(games);
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };
const p90 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]; };

// 후보: 서로 다른 종류 셋 × 수량(미어캣 1~4 · 캥거루·판다·코뿔소 1~2 · 호랑이 1) + 잭팟(같은 종류 셋)
const COUNTS = { p: [1, 2, 3, 4], n: [1, 2], b: [1, 2], r: [1, 2], q: [1] };
const TYPES = ['p', 'n', 'b', 'r', 'q'];
export const idOf = (goals) => goals.map((g) => g.type + (g.count > 1 ? g.count : '')).join('');
export function candidates() {
  const out = [];
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) for (let c = b + 1; c < 5; c++) {
    for (const x of COUNTS[TYPES[a]]) for (const y of COUNTS[TYPES[b]]) for (const z of COUNTS[TYPES[c]]) {
      out.push({ goals: [{ type: TYPES[a], count: x }, { type: TYPES[b], count: y }, { type: TYPES[c], count: z }] });
    }
  }
  for (const [type, counts] of [['p', [1, 2, 3, 4]], ['n', [1]], ['b', [1]], ['r', [1]]]) for (const count of counts) out.push({ goals: [0, 1, 2].map(() => ({ type, count })), jackpot: true });
  // 미어캣 3마리 사냥: 칸을 ×1 · ×2 로 채운다(셋째 칸은 쓰이지 않는다) — 둘(12수)과 넷(36수) 사이
  out.push({ goals: [{ type: 'p', count: 1 }, { type: 'p', count: 2 }, { type: 'p', count: 1 }], jackpot: true, id: 'j-p12' });
  // 조커 잭팟(사용자 제안): 첫 칸은 조커가 채운다 — 「먼저 하나(또는 둘)만 잡으면 승리」
  for (const [type, count] of [['n', 1], ['b', 1], ['r', 1], ['q', 1], ['p', 1], ['p', 2], ['n', 2], ['b', 2], ['r', 2]]) out.push({ goals: [0, 1, 2].map(() => ({ type, count })), jackpot: true, joker: true, id: `jk-${type}${count > 1 ? count : ''}` });
  return out.map((s) => ({ ...s, id: s.id || (s.jackpot ? 'j-' : '') + idOf(s.jackpot ? s.goals.slice(0, 1) : s.goals) })).filter((s) => !contractProblem(s));
}

function playGame(set, seed) {
  const chess = new Chess();
  const rand = mulberry32(seed);
  const keys = [];
  let verdict = null;
  for (;;) {
    const moves = chess.history({ verbose: true });
    const pick = chooseMove(chess.fen(), { level, history: keys, rand, contract: contractAiState(set, moves) });
    if (!pick) break;
    const m = chess.move(pick);
    keys.push(positionKey(m.after));
    verdict = contractVerdict(set, chess.history({ verbose: true }), {
      checkmate: chess.isCheckmate(), stalemate: chess.isStalemate(), threefold: chess.isThreefoldRepetition(),
      fifty: chess.isDrawByFiftyMoves ? chess.isDrawByFiftyMoves() : false, kingsOnly: chess.board().flat().filter(Boolean).length <= 2
    });
    if (verdict.over) break;
  }
  const all = chess.history({ verbose: true });
  const used = verdict?.winner && verdict.reason === 'contract' ? set.goals.map((g, i) => verdict.progress[verdict.winner].counts[i] >= g.count) : null;
  return { plies: all.length, reason: verdict?.reason || 'none', winner: verdict?.winner || null, captures: all.filter((m) => m.captured).length, used };
}

if (process.argv[1] && process.argv[1].endsWith('sweep.mjs')) {
  const all = candidates().filter((s) => !only || only.split(',').includes(s.id));
  const mine = all.filter((_, i) => i % Number(shards) === Number(shard));
  const rows = [];
  for (const set of mine) {
    const t0 = Date.now();
    const gs = [];
    for (let i = 0; i < N; i++) gs.push(playGame(set, Number(seed0) + i * 7919));
    const decided = gs.filter((g) => g.winner);
    const byContract = gs.filter((g) => g.used);
    const white = gs.filter((g) => g.winner === 'w').length;
    const reasons = gs.reduce((o, g) => { o[g.reason] = (o[g.reason] || 0) + 1; return o; }, {});
    const row = {
      id: set.id, jackpot: Boolean(set.jackpot), goals: set.goals, games: N, white, black: gs.filter((g) => g.winner === 'b').length, draw: gs.filter((g) => !g.winner).length,
      whiteShare: decided.length ? +(white / decided.length).toFixed(3) : null, reasons, contractShare: +((reasons.contract || 0) / N).toFixed(2),
      plies: { median: median(gs.map((g) => g.plies)), p90: p90(gs.map((g) => g.plies)) }, captures: median(gs.map((g) => g.captures)),
      use: set.goals.map((_, i) => (byContract.length ? +(byContract.filter((g) => g.used[i]).length / byContract.length).toFixed(2) : 0)), sec: Math.round((Date.now() - t0) / 1000)
    };
    rows.push(row);
    console.log(JSON.stringify(row));
    writeFileSync(new URL(`./result-${seed0}-${level}-${process.env.SWEEP_TAG || shard}.json`, import.meta.url), JSON.stringify({ seed: Number(seed0), level, games: N, rows }, null, 1));
  }
}
