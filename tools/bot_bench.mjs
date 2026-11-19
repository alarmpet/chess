// 봇 측정 묶음(2026-11-06): STATUS §2 의 남은 봇 측정을 한 도구로.
//   node tools/bot_bench.mjs blunders [판 수=20]  — AI 의 세기별 블런더율(PLAN-0b 「난이도 1·5·10」 대신 우리 단계·라이벌)
//   node tools/bot_bench.mjs draws [판 수=100]    — 보통 대 보통 무승부율(FN-150, 기준 5% 미만)
//   node tools/bot_bench.mjs pace [판 수=60]      — 판당 반수·잡기 수(CI-176 판당 카드·대국 시간의 재료)
// 블런더 = 손실(그 국면 최선 − 둔 수, 탐색 2수) ≥ 200, tools/blunder_rate.mjs 와 같은 자.
import { Chess } from 'chess.js';
import { chooseMove, positionKey, rootScores } from '../src/rules/ai.js';

const [, , what = 'blunders', nArg] = process.argv;
let seed = 2468;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// 엔진이 고르는 것과 같게(wizardChessEngine.js chooseSmartAIMove): 라이벌은 실수 0.3 이상이면 쉬움 탐색, 아니면 보통, slip = 실수.
const AIS = {
  'normal(라이벌 없음)': { level: 'normal' },
  'picnic(실수 0.4)': { level: 'easy', slip: 0.4 },
  'bamboo_band(0.2)': { level: 'normal', slip: 0.2 },
  'acorn_court(0.05)': { level: 'normal', slip: 0.05 },
  'easy(참고)': { level: 'easy' },
  'hard(참고, 게임에서 안 씀)': { level: 'hard' }
};

function playGame(white, black, maxPlies = 200, onMove) {
  const c = new Chess();
  const history = [];
  for (let ply = 0; ply < maxPlies && !c.isGameOver(); ply++) {
    const side = c.turn() === 'w' ? white : black;
    const fen = c.fen();
    const mv = chooseMove(fen, { ...side, history, rand });
    if (!mv) break;
    const m = c.move(mv);
    history.push(positionKey(c.fen()));
    onMove?.(fen, m, c.turn() === 'w' ? 'b' : 'w');
  }
  const result = c.isCheckmate() ? (c.turn() === 'w' ? 'black' : 'white')
    : c.isGameOver() ? 'draw' : 'unfinished';
  const why = c.isCheckmate() ? 'mate' : c.isStalemate() ? 'stalemate' : c.isThreefoldRepetition() ? 'repetition'
    : c.isInsufficientMaterial() ? 'material' : c.isDraw() ? '50-move' : c.isGameOver() ? 'other' : 'cap';
  return { result, why, plies: c.history().length, caps: c.history({ verbose: true }).filter((m) => m.captured) };
}

const t0 = Date.now();
const out = { what, at: new Date().toISOString() };
if (what === 'blunders') {
  const n = Number(nArg || 20);
  out.games = n;
  out.rows = {};
  for (const [name, ai] of Object.entries(AIS)) {
    let moves = 0, blunders = 0;
    for (let g = 0; g < n; g++) {
      // AI 는 흑, 상대(백)는 보통. AI 의 수만 잰다.
      playGame({ level: 'normal' }, ai, 120, (fen, m, mover) => {
        if (mover !== 'b') return;
        const scores = rootScores(fen);
        const played = scores.find((x) => x.from === m.from && x.to === m.to && (x.promotion || null) === (m.promotion || null));
        moves++;
        if (played && scores[0].score - played.score >= 200) blunders++;
      });
    }
    out.rows[name] = { moves, blunders, rate: +(blunders / Math.max(1, moves)).toFixed(3) };
    console.log(name, out.rows[name], `${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
} else if (what === 'draws') {
  const n = Number(nArg || 100);
  const tally = { white: 0, black: 0, draw: 0, unfinished: 0 };
  const why = {};
  let plies = 0;
  for (let g = 0; g < n; g++) {
    const r = playGame({ level: 'normal' }, { level: 'normal' }, 300);
    tally[r.result]++;
    if (r.result !== 'white' && r.result !== 'black') why[r.why] = (why[r.why] || 0) + 1;
    plies += r.plies;
    if ((g + 1) % 20 === 0) console.log(g + 1, tally, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  Object.assign(out, { games: n, tally, drawWhy: why, drawRate: +((tally.draw + tally.unfinished) / n).toFixed(3), avgPlies: Math.round(plies / n) });
} else if (what === 'pace') {
  const n = Number(nArg || 60);
  out.games = n;
  out.rows = {};
  // 플레이어(백) 세 프로필 대 기본 AI(보통): 판당 반수, 플레이어가 잡은 수(잡기 카드 = 잡을 때마다 한 장).
  for (const [name, me] of Object.entries({ '약함(쉬움)': { level: 'easy' }, '대등(보통)': { level: 'normal' }, '강함(어려움)': { level: 'hard' } })) {
    const rows = [];
    for (let g = 0; g < n; g++) rows.push(playGame(me, { level: 'normal' }, 300));
    const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const mine = rows.map((r) => r.caps.filter((m) => m.color === 'w').length);
    out.rows[name] = {
      win: rows.filter((r) => r.result === 'white').length, loss: rows.filter((r) => r.result === 'black').length,
      pliesMedian: med(rows.map((r) => r.plies)), playerCapturesMedian: med(mine), playerCapturesAvg: +(mine.reduce((a, b) => a + b, 0) / n).toFixed(1)
    };
    console.log(name, out.rows[name], `${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
}
out.seconds = Math.round((Date.now() - t0) / 1000);
console.log(JSON.stringify(out, null, 1));
