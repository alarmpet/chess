// 계약을 아는 AI 로 계약전을 실제로 둔다(SC-1 의 측정, SC-0·PP-0 「계약을 아는 AI 로 다시 재기」의 첫 판).
//   node docs/research/2026-11-11-slot-chess/contract-ai.mjs [판수=60]
// 엔진과 같은 판정(src/rules/contractGame.js)과 같은 AI(src/rules/ai.js)를 쓴다. 고정 시드. 사람 생각 시간·연출은 없다.
//   A. 아는 AI 끼리(쉬움·보통): 어떻게 끝나는가, 길이, 잡기 수, 백 승 비율, 어느 목표로 끝났는가
//   B. 아는 AI 대 모르는 AI(보통, 색 교대): 「무엇으로 지는지 아는가」
import { Chess } from 'chess.js';
import { writeFileSync } from 'node:fs';
import { chooseMove, positionKey } from '../../../src/rules/ai.js';
import { CONTRACT_SETS, contractById } from '../../../src/rules/contractSets.js';
import { contractAiState, contractVerdict } from '../../../src/rules/contractGame.js';

const N = Number(process.argv[2]) || 60;
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };
const p90 = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]; };

function playGame(set, seed, level, aware) {
  const chess = new Chess();
  const rand = mulberry32(seed);
  const keys = [];
  let verdict = null;
  let matchPointAt = null;
  let firstCapture = null;
  for (;;) {
    const moves = chess.history({ verbose: true });
    const side = chess.turn();
    const contract = aware[side] ? contractAiState(set, moves) : undefined;
    const pick = chooseMove(chess.fen(), { level, history: keys, rand, contract });
    if (!pick) break;
    const m = chess.move(pick);
    keys.push(positionKey(m.after));
    const all = chess.history({ verbose: true });
    if (m.captured && firstCapture === null) firstCapture = all.length;
    verdict = contractVerdict(set, all, {
      checkmate: chess.isCheckmate(), stalemate: chess.isStalemate(), threefold: chess.isThreefoldRepetition(),
      fifty: chess.isDrawByFiftyMoves ? chess.isDrawByFiftyMoves() : false, kingsOnly: chess.board().flat().filter(Boolean).length <= 2
    });
    if (matchPointAt === null && (verdict.progress.matchPoint.w || verdict.progress.matchPoint.b || verdict.progress.winner)) matchPointAt = all.length;
    if (verdict.over) break;
  }
  const all = chess.history({ verbose: true });
  const winGoals = verdict?.winner && verdict.reason === 'contract'
    ? set.goals.filter((g, i) => verdict.progress[verdict.winner].counts[i] >= g.count).map((g) => g.type).join('+') : null;
  return {
    plies: all.length, reason: verdict?.reason || 'none', winner: verdict?.winner || null, captures: all.filter((m) => m.captured).length,
    firstCapture, matchPointPlies: matchPointAt === null ? 0 : all.length - matchPointAt, winGoals,
    done: verdict ? { w: verdict.progress.w.done, b: verdict.progress.b.done } : null
  };
}

function summary(games) {
  const count = (f) => games.filter(f).length;
  const by = (key) => games.reduce((o, g) => { const k = g[key] ?? '-'; o[k] = (o[k] || 0) + 1; return o; }, {});
  const decided = games.filter((g) => g.winner);
  return {
    games: games.length, reasons: by('reason'),
    white: count((g) => g.winner === 'w'), black: count((g) => g.winner === 'b'), draw: count((g) => !g.winner),
    whiteShareOfDecided: decided.length ? +(count((g) => g.winner === 'w') / decided.length).toFixed(3) : null,
    plies: { median: median(games.map((g) => g.plies)), p90: p90(games.map((g) => g.plies)) },
    captures: { median: median(games.map((g) => g.captures)), p90: p90(games.map((g) => g.captures)), min: Math.min(...games.map((g) => g.captures)) },
    firstCapture: median(games.filter((g) => g.firstCapture !== null).map((g) => g.firstCapture)),
    matchPointPlies: { median: median(games.map((g) => g.matchPointPlies)), p90: p90(games.map((g) => g.matchPointPlies)) },
    winGoals: by('winGoals')
  };
}

const out = { at: new Date().toISOString(), n: N, note: '계약을 아는 AI(src/rules/ai.js contract), 판정 src/rules/contractGame.js, 고정 시드', aware: {}, awareVsPlain: {} };
const t0 = Date.now();
// A. 아는 AI 끼리
for (const level of ['easy', 'normal']) {
  for (const set of CONTRACT_SETS) {
    const n = set.id === 'p2nb' ? N : Math.floor(N / 2);
    const games = [];
    for (let i = 0; i < n; i++) games.push(playGame(set, 1000 + i * 7919 + (level === 'easy' ? 0 : 500000), level, { w: true, b: true }));
    out.aware[`${level}:${set.id}`] = summary(games);
    console.log(`[아는 AI 끼리] ${level} ${set.id}`, JSON.stringify(out.aware[`${level}:${set.id}`]), `${Math.round((Date.now() - t0) / 1000)}s`);
  }
}
// B. 아는 AI 대 모르는 AI — 색 교대
{
  const set = contractById('p2nb');
  const games = [];
  let awareWin = 0, plainWin = 0, draws = 0;
  for (let i = 0; i < N; i++) {
    const awareIsWhite = i % 2 === 0;
    const g = playGame(set, 900000 + i * 104729, 'normal', { w: awareIsWhite, b: !awareIsWhite });
    games.push(g);
    if (!g.winner) draws += 1;
    else if ((g.winner === 'w') === awareIsWhite) awareWin += 1;
    else plainWin += 1;
  }
  out.awareVsPlain['normal:p2nb'] = { games: N, awareWin, plainWin, draws, ...summary(games) };
  console.log('[아는 AI 대 모르는 AI] normal p2nb', JSON.stringify({ awareWin, plainWin, draws }), `${Math.round((Date.now() - t0) / 1000)}s`);
}
out.seconds = Math.round((Date.now() - t0) / 1000);
writeFileSync(new URL('./contract-ai.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('저장: contract-ai.json', `${out.seconds}s`);
