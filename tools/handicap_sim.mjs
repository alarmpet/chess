// 핸디캡(말 떼기) 측정 — 방향 계획서 §4.5 M3 (2026-11-10).
// 센 쪽이 말을 떼고 시작하면 약한 쪽 승률이 얼마나 오르는가. 「부모 대 아이」 친구 판에 권할 핸디캡 단계를 고르는 근거.
//   node tools/handicap_sim.mjs [짝당 판 수=30] [--json out.json]
// 약한 쪽 = 쉬움 봇(d1·실수 0.3), 센 쪽 = 보통(d2·실수 0.1) · 어려움(d3·실수 0). 판마다 색을 바꾼다. 봇이지 사람이 아니다.
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';

const N = Number(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 30);
const jsonAt = process.argv.indexOf('--json');
let seed = 13579;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// 센 쪽이 백일 때의 시작 국면(백 말을 뗀다). 센 쪽이 흑이면 위아래를 뒤집어 흑 말을 뗀다.
const ODDS = {
  '없음': { w: 'RNBQKBNR', pw: 'PPPPPPPP', castle: 'KQ' },
  '폰 하나(f)': { w: 'RNBQKBNR', pw: 'PPPPP1PP', castle: 'KQ' },
  '나이트(b)': { w: 'R1BQKBNR', pw: 'PPPPPPPP', castle: 'KQ' },
  '룩(a)': { w: '1NBQKBNR', pw: 'PPPPPPPP', castle: 'K' },
  '퀸': { w: 'RNB1KBNR', pw: 'PPPPPPPP', castle: 'KQ' },
  '퀸 + 룩(a)': { w: '1NB1KBNR', pw: 'PPPPPPPP', castle: 'K' }
};
function startFen(odds, strongIsWhite) {
  const o = ODDS[odds];
  if (strongIsWhite) return `rnbqkbnr/pppppppp/8/8/8/8/${o.pw}/${o.w} w ${o.castle}kq - 0 1`;
  return `${o.w.toLowerCase()}/${o.pw.toLowerCase()}/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ${o.castle.toLowerCase()} - 0 1`;
}
function play(fen, white, black) {
  const c = new Chess(fen);
  const history = [];
  let plies = 0;
  for (; plies < 240 && !c.isGameOver(); plies++) {
    const mv = chooseMove(c.fen(), { ...(c.turn() === 'w' ? white : black), history, rand });
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
  }
  return { result: c.isCheckmate() ? (c.turn() === 'b' ? 'w' : 'b') : 'draw', plies };
}

const WEAK = { level: 'easy', slip: 0.3 };
const STRONG = { '보통(d2·실수 0.1)': { level: 'normal', slip: 0.1 }, '어려움(d3·실수 0)': { level: 'hard', slip: 0 } };
const out = { n: N, weak: '쉬움(d1·실수 0.3)', rows: [] };
const t0 = Date.now();
for (const [sName, strong] of Object.entries(STRONG)) {
  console.log(`\n약한 쪽(쉬움 봇) 대 ${sName} — 짝당 ${N}판, 약한 쪽 기준`);
  for (const odds of Object.keys(ODDS)) {
    let w = 0, d = 0, l = 0, plies = 0;
    for (let i = 0; i < N; i++) {
      const strongWhite = i % 2 === 0;
      const fen = startFen(odds, strongWhite);
      const r = strongWhite ? play(fen, strong, WEAK) : play(fen, WEAK, strong);
      plies += r.plies;
      if (r.result === 'draw') d++;
      else if ((r.result === 'w') !== strongWhite) w++;
      else l++;
    }
    const row = { strong: sName, odds, win: +(w / N).toFixed(2), draw: +(d / N).toFixed(2), loss: +(l / N).toFixed(2), score: +((w + d / 2) / N).toFixed(2), meanPlies: Math.round(plies / N) };
    out.rows.push(row);
    console.log(`  ${odds.padEnd(12)} 승 ${String(Math.round(100 * row.win)).padStart(3)}% · 무 ${String(Math.round(100 * row.draw)).padStart(3)}% · 패 ${String(Math.round(100 * row.loss)).padStart(3)}% · 점수 ${row.score} · 평균 ${row.meanPlies}반수`);
  }
}
out.seconds = Math.round((Date.now() - t0) / 1000);
console.log(`\n${out.seconds}초`);
if (jsonAt > 0) writeFileSync(process.argv[jsonAt + 1], JSON.stringify(out, null, 1));
