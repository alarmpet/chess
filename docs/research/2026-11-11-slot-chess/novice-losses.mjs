// 초보 대역이 계약전에서 「어떻게」 지는가 — 직관성 계획서(2026-11-12, 11-13 갱신)의 「위험 알림·아차 방지·놓친 왕관」이 쓸모 있는지 재는 측정.
//   node docs/research/2026-11-11-slot-chess/novice-losses.mjs <초보:plain|aware> <상대 단계:easy|normal> <판수> [시드=9000]
// 초보 대역 = 쉬움 단계 AI. plain 이면 계약을 모른다(목표를 지키지도 노리지도 않는다 — 규칙을 아직 못 읽은 사람의 대역).
// 상대 = 계약을 아는 AI. 색은 판마다 교대. 세트 p2nb. 사람이 아니다 — 사람 시험을 대신하지 못한다.
// 세는 것(모두 심판이 확인할 수 있는 사실):
//   아차   : 초보가 방금 둔 수 때문에 상대가 「다음 한 수로 계약을 완성」할 수 있게 됐고, 그걸 막는 다른 수가 있었다
//   막을 수 없음 : 어떤 수를 둬도 상대가 다음 수에 완성한다
//   놓친 왕관 : 초보에게 계약을 완성하는 잡기가 있었는데 다른 수를 뒀다
import { Chess } from 'chess.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseMove, positionKey } from '../../../src/rules/ai.js';
import { contractById, contractProgress } from '../../../src/rules/contractSets.js';
import { contractAiState, contractVerdict } from '../../../src/rules/contractGame.js';

const [noviceKind = 'plain', rivalLevel = 'easy', nArg = '100', seedArg = '9000'] = process.argv.slice(2);
const N = Number(nArg), SEED = Number(seedArg);
const set = contractById('p2nb');
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };

/** 지금 둘 색이 한 수로 계약을 완성하는 잡기들. */
function finishers(chess) {
  const hist = chess.history({ verbose: true });
  const me = chess.turn();
  return chess.moves({ verbose: true }).filter((m) => m.captured && contractProgress(set, [...hist, m]).winner === me);
}
/** 지금 둘 색(초보)의 각 수 뒤에 상대에게 완성 잡기가 생기는가 → { safe, unsafe } 수의 SAN. */
function exposure(chess) {
  const safe = [], unsafe = [];
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const over = chess.isCheckmate() || contractProgress(set, chess.history({ verbose: true })).winner;
    (!over && finishers(chess).length ? unsafe : safe).push(m.san);
    chess.undo();
  }
  return { safe, unsafe };
}

function playGame(seed, novice) {
  const chess = new Chess();
  const rand = mulberry32(seed);
  const keys = [];
  let v = null;
  const g = { oops: 0, oopsPlies: [], forced: 0, missed: 0, lastWasOops: false, lastWasForced: false };
  for (;;) {
    const moves = chess.history({ verbose: true });
    const side = chess.turn();
    const isNovice = side === novice;
    let exp = null, fin = null;
    if (isNovice) { fin = finishers(chess); exp = exposure(chess); }
    const aware = !isNovice || noviceKind === 'aware';
    const pick = chooseMove(chess.fen(), { level: isNovice ? 'easy' : rivalLevel, history: keys, rand, contract: aware ? contractAiState(set, moves) : undefined });
    if (!pick) break;
    const m = chess.move(pick);
    keys.push(positionKey(m.after));
    if (isNovice) {
      const won = contractProgress(set, chess.history({ verbose: true })).winner === novice || chess.isCheckmate();
      if (fin.length && !won) g.missed += 1;
      const oops = exp.unsafe.includes(m.san) && exp.safe.length > 0;
      const forced = exp.unsafe.includes(m.san) && exp.safe.length === 0;
      if (oops) { g.oops += 1; g.oopsPlies.push(moves.length + 1); }
      if (forced) g.forced += 1;
      g.lastWasOops = oops; g.lastWasForced = forced;
    }
    const all = chess.history({ verbose: true });
    v = contractVerdict(set, all, {
      checkmate: chess.isCheckmate(), stalemate: chess.isStalemate(), threefold: chess.isThreefoldRepetition(),
      fifty: chess.isDrawByFiftyMoves ? chess.isDrawByFiftyMoves() : false, kingsOnly: chess.board().flat().filter(Boolean).length <= 2
    });
    if (v.over) break;
  }
  const result = !v?.winner ? 'draw' : v.winner === novice ? 'win' : 'loss';
  return { result, reason: v?.reason, plies: chess.history().length, ...g, lostByContract: result === 'loss' && v.reason === 'contract' };
}

const t0 = Date.now();
const games = [];
for (let i = 0; i < N; i++) games.push(playGame(SEED + i * 7919, i % 2 === 0 ? 'w' : 'b'));
const count = (f) => games.filter(f).length;
const lost = games.filter((g) => g.lostByContract);
const out = {
  at: new Date().toISOString(), novice: noviceKind, rivalLevel, set: set.id, games: N, seed: SEED, seconds: Math.round((Date.now() - t0) / 1000),
  win: count((g) => g.result === 'win'), loss: count((g) => g.result === 'loss'), draw: count((g) => g.result === 'draw'),
  lostByContract: lost.length,
  // 진 판의 마지막 초보 수: 막을 수 있었나
  lastMoveOops: lost.filter((g) => g.lastWasOops).length, lastMoveForced: lost.filter((g) => g.lastWasForced).length,
  lastMoveOther: lost.filter((g) => !g.lastWasOops && !g.lastWasForced).length,
  oopsPerGame: { median: median(games.map((g) => g.oops)), max: Math.max(...games.map((g) => g.oops)), total: games.reduce((s, g) => s + g.oops, 0), gamesWith: count((g) => g.oops > 0) },
  firstOopsPly: median(games.filter((g) => g.oopsPlies.length).map((g) => g.oopsPlies[0])),
  missed: { total: games.reduce((s, g) => s + g.missed, 0), gamesWith: count((g) => g.missed > 0), thenLost: count((g) => g.missed > 0 && g.result === 'loss') },
  plies: median(games.map((g) => g.plies))
};
mkdirSync(new URL('./novice/', import.meta.url), { recursive: true });
writeFileSync(new URL(`./novice/${noviceKind}-vs-${rivalLevel}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
