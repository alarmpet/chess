// 한 방 퍼즐 생성기(IR-3, 직관성 계획 §0.2 ④). 봇끼리 계약전을 두게 하고 「한 수로 왕관 완성」 국면을 모은다.
//   node tools/crown_puzzles.mjs [판 수=200] [시드=4100] [담을 문제 수=30]
// 대국: 짝수 판은 계약을 아는 쉬움 봇끼리, 홀수 판은 계약을 모르는 쉬움 봇(초보 대역) 대 아는 쉬움 봇. 세트는 풀에서 번갈아.
// 후보: 둘 쪽에게 결정타가 하나라도 있는 모든 차례(실제로 그 수를 뒀든 아니든).
// 쓸 만한 문제: 결정타가 꼭 한 수 · 체크 아님 · 앙파상·승급 아님 · 완성하지 않는 다른 잡기가 하나 이상(고를 것이 있다) · 같은 국면 중복 없음.
// 쉬운 순(다른 잡기가 적은 순 → 짧은 판 순)으로 놓고, 색·보석 종류가 고르게 담기도록 돌아가며 뽑는다.
// 산출: src/rules/crownPuzzleData.js(문제) · docs/research/2026-11-11-slot-chess/puzzles/yield.json(수율).
import { Chess } from 'chess.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { CONTRACT_SETS, contractProgress } from '../src/rules/contractSets.js';
import { contractAiState, contractVerdict } from '../src/rules/contractGame.js';
import { finishers } from '../src/rules/contractGuard.js';
import { moveText, puzzleProblem } from '../src/rules/crownPuzzles.js';

const [nArg = '200', seedArg = '4100', keepArg = '30'] = process.argv.slice(2);
const N = Number(nArg), SEED = Number(seedArg), KEEP = Number(keepArg);
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };

const stats = { games: 0, candidates: 0, gamesWith: 0, unique: 0, inCheck: 0, special: 0, noChoice: 0, duplicate: 0, usable: 0, pieces: [], plies: [], others: [], finHist: {}, targetHist: {}, gemKinds: {}, mateToo: 0 };
const seen = new Set();
const pool = [];

function playGame(i) {
  const set = CONTRACT_SETS[i % CONTRACT_SETS.length];
  const plain = i % 2 === 1 ? (i % 4 === 1 ? 'w' : 'b') : null;   // 계약을 모르는 쪽(초보 대역)
  const rand = mulberry32(SEED + i * 7919);
  const chess = new Chess();
  const keys = [];
  let had = false;
  for (;;) {
    const hist = chess.history({ verbose: true });
    const side = chess.turn();
    const progress = contractProgress(set, hist);
    const fin = finishers(chess, set, progress);
    if (fin.length) {
      had = true;
      stats.candidates += 1;
      const captures = chess.moves({ verbose: true }).filter((m) => m.captured);
      const others = captures.length - fin.length;
      const special = fin.some((m) => m.promotion || m.target !== m.to);
      const key = chess.fen().split(' ').slice(0, 4).join(' ') + '|' + set.id + '|' + progress.w.counts + '|' + progress.b.counts;
      if (fin.length === 1) stats.unique += 1;
      const targets = new Set(fin.map((m) => m.target)).size;
      stats.finHist[Math.min(fin.length, 6)] = (stats.finHist[Math.min(fin.length, 6)] || 0) + 1;
      stats.targetHist[Math.min(targets, 6)] = (stats.targetHist[Math.min(targets, 6)] || 0) + 1;
      stats.gemKinds[new Set(fin.map((m) => m.captured)).size] = (stats.gemKinds[new Set(fin.map((m) => m.captured)).size] || 0) + 1;
      if (fin.length !== 1) { /* 답이 여럿 */ }
      else if (chess.inCheck()) stats.inCheck += 1;
      else if (special) stats.special += 1;
      else if (others < 1) stats.noChoice += 1;
      else if (seen.has(key)) stats.duplicate += 1;
      else {
        seen.add(key);
        const def = { set: set.id, color: side, moves: hist.map(moveText).join(' '), answer: moveText(fin[0]), gem: fin[0].captured };
        const problem = puzzleProblem(def);
        if (problem && problem !== '답이 메이트이기도 하다') throw new Error(`검사에 걸린 문제(${problem}): ${JSON.stringify(def)}`);
        const pieces = chess.board().flat().filter(Boolean).length;
        if (problem) stats.mateToo += 1;
        else {
          stats.usable += 1; stats.pieces.push(pieces); stats.plies.push(hist.length); stats.others.push(others);
          pool.push({ ...def, others, plies: hist.length, pieces });
        }
      }
    }
    const aware = side !== plain;
    const pick = chooseMove(chess.fen(), { level: 'easy', history: keys, rand, contract: aware ? contractAiState(set, hist) : undefined });
    if (!pick) break;
    const m = chess.move(pick);
    keys.push(positionKey(m.after));
    const v = contractVerdict(set, chess.history({ verbose: true }), {
      checkmate: chess.isCheckmate(), stalemate: chess.isStalemate(), threefold: chess.isThreefoldRepetition(),
      fifty: chess.isDrawByFiftyMoves ? chess.isDrawByFiftyMoves() : false, kingsOnly: chess.board().flat().filter(Boolean).length <= 2
    });
    if (v.over) break;
  }
  stats.games += 1;
  if (had) stats.gamesWith += 1;
}

const t0 = Date.now();
for (let i = 0; i < N; i++) playGame(i);

// 쉬운 순으로 놓고, (색 × 보석 종류) 묶음을 돌아가며 하나씩 뽑는다.
pool.sort((a, b) => a.others - b.others || a.plies - b.plies);
const groups = new Map();
for (const p of pool) { const k = p.color + p.gem; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
const order = ['wp', 'wn', 'wb', 'bp', 'bn', 'bb'].filter((k) => groups.has(k));
const picked = [];
while (picked.length < KEEP && order.some((k) => groups.get(k).length)) {
  for (const k of order) { const p = groups.get(k).shift(); if (p && picked.length < KEEP) picked.push(p); }
}
const data = picked.map((p, i) => ({ id: `cp${String(i + 1).padStart(2, '0')}`, set: p.set, color: p.color, moves: p.moves, answer: p.answer, gem: p.gem }));

const body = `// 만든 파일 — 손으로 고치지 않는다. node tools/crown_puzzles.mjs ${N} ${SEED} ${KEEP}
// 봇 계약전 ${N}판에서 뽑은 「한 수로 왕관 완성」 국면 ${data.length}개. 쉬운 순(고를 잡기가 적은 순), 색·보석 종류를 돌아가며.
// 검사: src/rules/crownPuzzles.js 의 puzzleProblem (test/crownPuzzles.test.mjs 가 전부 다시 본다).
export const CROWN_PUZZLES = [
${data.map((d) => '  ' + JSON.stringify(d)).join(',\n')}
];
`;
writeFileSync(new URL('../src/rules/crownPuzzleData.js', import.meta.url), body);

const byGroup = Object.fromEntries([...new Set(pool.map((p) => p.color + p.gem))].sort().map((k) => [k, pool.filter((p) => p.color + p.gem === k).length]));
const out = {
  at: new Date().toISOString(), games: N, seed: SEED, seconds: Math.round((Date.now() - t0) / 1000),
  candidates: stats.candidates, candidatesPerGame: +(stats.candidates / N).toFixed(2), gamesWithCandidate: stats.gamesWith,
  uniqueAnswer: stats.unique, uniqueRatio: +(stats.unique / Math.max(1, stats.candidates)).toFixed(3),
  dropped: { inCheck: stats.inCheck, enPassantOrPromotion: stats.special, noOtherCapture: stats.noChoice, duplicate: stats.duplicate, answerIsMate: stats.mateToo },
  answersHistogram: stats.finHist, targetsHistogram: stats.targetHist, gemKindsHistogram: stats.gemKinds,
  usable: stats.usable, usablePerGame: +(stats.usable / N).toFixed(2),
  usableByColorGem: byGroup,
  pieces: { median: median(stats.pieces), min: Math.min(...stats.pieces), max: Math.max(...stats.pieces), atMost12: stats.pieces.filter((x) => x <= 12).length },
  plies: { median: median(stats.plies), min: Math.min(...stats.plies), max: Math.max(...stats.plies) },
  otherCaptures: { median: median(stats.others), max: Math.max(...stats.others) },
  kept: data.length
};
mkdirSync(new URL('../docs/research/2026-11-11-slot-chess/puzzles/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/research/2026-11-11-slot-chess/puzzles/yield.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
