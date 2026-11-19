// IR-1 측정: 「상대가 함께 자란다」 사다리와 「지기 전에 보인다」 경고가 초보 대역의 승률을 얼마나 바꾸는가.
//   node docs/research/2026-11-11-slot-chess/rung-ladder.mjs <사다리 0|1|2> <경고 off|on> <판수> [세트=p2nb] [시드=11000]
// 초보 대역 = 쉬움 단계, 계약을 모르는 AI(규칙을 아직 못 읽은 사람의 대역). 상대 = 쉬움 단계, 사다리 칸만큼 계약을 안다.
// 경고 on: 초보 대역이 화면의 경고를 「따른다」 — 금빛 결정타가 있으면 그 수를 두고, 아차 수는 다른 수로 바꾼다(다시 고르기 6번, 그래도 아차면 안전한 수 아무거나).
// 사람이 아니다. 경고를 늘 따르는 것도 사람과 다르다(위쪽 한계). 색은 판마다 교대.
import { Chess } from 'chess.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseMove, positionKey } from '../../../src/rules/ai.js';
import { contractProgress } from '../../../src/rules/contractSets.js';
import { contractAiState, contractVerdict, RUNG_NAMES } from '../../../src/rules/contractGame.js';
import { finishers, oopsCheck } from '../../../src/rules/contractGuard.js';
import { CANDIDATES } from './sc0-sets.mjs';

const [rungArg = '0', guardArg = 'off', nArg = '100', setId = 'p2nb', seedArg = '11000'] = process.argv.slice(2);
const RUNG = Number(rungArg), GUARD = guardArg === 'on', N = Number(nArg), SEED = Number(seedArg);
const set = { id: setId, goals: CANDIDATES[setId] };
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) / 2)]; };

function playGame(seed, novice) {
  const chess = new Chess();
  const rand = mulberry32(seed);
  const keys = [];
  let v = null;
  const g = { gold: 0, oops: 0, swapped: 0 };
  for (;;) {
    const moves = chess.history({ verbose: true });
    const side = chess.turn();
    let pick;
    if (side === novice) {
      const progress = contractProgress(set, moves);
      const fin = GUARD ? finishers(chess, set, progress) : [];
      if (fin.length) { pick = fin[0]; g.gold += 1; }
      else {
        pick = chooseMove(chess.fen(), { level: 'easy', history: keys, rand });
        if (pick && GUARD) {
          const after = (m) => contractProgress(set, [...moves, m]);
          let check = oopsCheck(chess.fen(), set, pick, after);
          if (check.oops && check.avoidable) {
            g.oops += 1;
            for (let k = 0; k < 6 && check.oops; k++) { pick = chooseMove(chess.fen(), { level: 'easy', history: keys, rand, slip: 0.9 }); check = oopsCheck(chess.fen(), set, pick, after); }
            if (check.oops) {
              const safe = chess.moves({ verbose: true }).filter((m) => !oopsCheck(chess.fen(), set, m, after).oops);
              if (safe.length) pick = safe[Math.floor(rand() * safe.length)];
            }
            g.swapped += 1;
          }
        }
      }
    } else {
      pick = chooseMove(chess.fen(), { level: 'easy', history: keys, rand, contract: contractAiState(set, moves, undefined, RUNG, side) });
    }
    if (!pick) break;
    const m = chess.move({ from: pick.from, to: pick.to, promotion: pick.promotion });
    keys.push(positionKey(m.after));
    v = contractVerdict(set, chess.history({ verbose: true }), {
      checkmate: chess.isCheckmate(), stalemate: chess.isStalemate(), threefold: chess.isThreefoldRepetition(),
      fifty: chess.isDrawByFiftyMoves ? chess.isDrawByFiftyMoves() : false, kingsOnly: chess.board().flat().filter(Boolean).length <= 2
    });
    if (v.over) break;
  }
  return { result: !v?.winner ? 'draw' : v.winner === novice ? 'win' : 'loss', reason: v?.reason, plies: chess.history().length, ...g };
}

const t0 = Date.now();
const games = [];
for (let i = 0; i < N; i++) games.push(playGame(SEED + i * 7919, i % 2 === 0 ? 'w' : 'b'));
const count = (f) => games.filter(f).length;
const by = (key) => games.reduce((o, x) => { o[x[key]] = (o[x[key]] || 0) + 1; return o; }, {});
const out = {
  at: new Date().toISOString(), rung: RUNG, rungName: RUNG_NAMES[RUNG], guard: GUARD, set: setId, games: N, seed: SEED, seconds: Math.round((Date.now() - t0) / 1000),
  win: count((x) => x.result === 'win'), loss: count((x) => x.result === 'loss'), draw: count((x) => x.result === 'draw'), reasons: by('reason'),
  plies: { median: median(games.map((x) => x.plies)), min: Math.min(...games.map((x) => x.plies)) },
  goldUsed: { total: games.reduce((a, x) => a + x.gold, 0), gamesWith: count((x) => x.gold > 0) },
  oopsWarned: { total: games.reduce((a, x) => a + x.oops, 0), gamesWith: count((x) => x.oops > 0), perGameMax: Math.max(...games.map((x) => x.oops)) }
};
mkdirSync(new URL('./rung/', import.meta.url), { recursive: true });
writeFileSync(new URL(`./rung/${setId}-rung${RUNG}-guard-${guardArg}.json`, import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
