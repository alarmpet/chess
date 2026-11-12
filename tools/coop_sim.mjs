// 협동·팀 멀티 측정(2026-11-07, 협동 라운드): 커뮤니티에서 나온 두 방식을 봇으로 잰다.
//  A. 돌려 두기 — 둘이 맞두다가 N수마다 진영을 바꾼다(레딧 커플·가족 집안 규칙 4건). 판이 끝날 때 이긴 색을 쥔 사람이 이긴다.
//     약한 사람(초보 봇)이 이기는 비율이 무교대보다 50% 쪽으로 오는가.
//  B. 둘 대 AI 손과 뇌 — 뇌는 자기가 둘 수의 말 종류를 부르고, 손은 그 종류 안에서 자기 세기로 둔다.
//     숙련 뇌+초보 손 / 초보 뇌+숙련 손 / 매 수 역할 교대 / 혼자 두기를 같은 AI 상대로 비교.
// 사람 세기: 초보 = 쉬움 탐색·실수 0.3, 숙련 = 보통 탐색·실수 0.1. AI 상대 = 자유 대국 「보통」(쉬움 탐색·실수 0.1).
//   node tools/coop_sim.mjs [방식당 판 수=40] [방식 이름들, 쉼표로 — 예: A0,A5,B교대 · 없으면 전부]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';

const N = Number(process.argv[2] || 40);
const ONLY = process.argv[3] ? new Set(process.argv[3].split(',')) : null;
const want = (key) => !ONLY || ONLY.has(key);
const MAX_PLY = 200;
let seed = 97531;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const NOVICE = { level: 'easy', slip: 0.3 };
const SKILLED = { level: 'normal', slip: 0.1 };
const AI = { level: 'easy', slip: 0.1 };

function result(c) {
  return c.isCheckmate() ? (c.turn() === 'b' ? 'w' : 'b') : 'draw';
}

// A. 돌려 두기. `swapEvery` 는 한 사람이 둔 수 기준(0 = 바꾸지 않음). 처음 백은 i 에 따라 번갈아.
function swapGame(swapEvery, noviceStartsWhite) {
  const c = new Chess();
  const history = [];
  let noviceColor = noviceStartsWhite ? 'w' : 'b';
  let swaps = 0;
  for (let ply = 0; ply < MAX_PLY && !c.isGameOver(); ply++) {
    if (swapEvery && ply > 0 && ply % (2 * swapEvery) === 0) { noviceColor = noviceColor === 'w' ? 'b' : 'w'; swaps++; }
    const who = c.turn() === noviceColor ? NOVICE : SKILLED;
    const mv = chooseMove(c.fen(), { ...who, history, rand });
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
  }
  const r = result(c);
  return { r: r === 'draw' ? 'draw' : r === noviceColor ? 'novice' : 'skilled', plies: c.history().length, swaps };
}

// B. 둘 대 AI. `roles(ownMove)` 가 그 수의 { brain, hand } 를 준다.
function teamGame(teamWhite, roles) {
  const c = new Chess();
  const history = [];
  const team = teamWhite ? 'w' : 'b';
  let own = 0;
  for (let ply = 0; ply < MAX_PLY && !c.isGameOver(); ply++) {
    const fen = c.fen();
    let mv;
    if (c.turn() !== team) mv = chooseMove(fen, { ...AI, history, rand });
    else {
      const r = roles(own++);
      if (r.solo) mv = chooseMove(fen, { ...r.solo, history, rand });
      else {
        const idea = chooseMove(fen, { ...r.brain, history, rand });
        const kind = idea ? new Chess(fen).get(idea.from)?.type : null;
        mv = chooseMove(fen, { ...r.hand, history, rand, only: kind || undefined });
      }
    }
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
  }
  const r = result(c);
  return { r: r === 'draw' ? 'draw' : r === team ? 'win' : 'loss', plies: c.history().length };
}

const pct = (n) => String(Math.round((100 * n) / N)).padStart(3) + '%';
const t0 = Date.now();

console.log(`A. 돌려 두기 — 초보 봇 대 숙련 봇, 방식당 ${N}판(처음 색 번갈아). 판 끝에 이긴 색을 쥔 사람이 승.`);
for (const every of [0, 8, 5, 3]) {
  if (!want('A' + every)) continue;
  let nov = 0, sk = 0, d = 0, plies = 0;
  for (let i = 0; i < N; i++) {
    const g = swapGame(every, i % 2 === 0);
    if (g.r === 'novice') nov++; else if (g.r === 'skilled') sk++; else d++;
    plies += g.plies;
  }
  const name = every ? `${every}수마다 교대` : '교대 없음';
  console.log(`  ${name.padEnd(10)} 초보 승 ${pct(nov)} · 무 ${pct(d)} · 숙련 승 ${pct(sk)}  평균 ${Math.round(plies / N)}반수  (${nov}/${d}/${sk})`);
}

console.log(`\nB. 둘 대 AI(보통) 손과 뇌 — 방식당 ${N}판(팀 색 번갈아). 팀 기준 승·무·패.`);
const MODES = {
  '초보 혼자': () => ({ solo: NOVICE }),
  '숙련 혼자': () => ({ solo: SKILLED }),
  '숙련 뇌 + 초보 손': () => ({ brain: SKILLED, hand: NOVICE }),
  '초보 뇌 + 숙련 손': () => ({ brain: NOVICE, hand: SKILLED }),
  '매 수 역할 교대': (k) => (k % 2 === 0 ? { brain: SKILLED, hand: NOVICE } : { brain: NOVICE, hand: SKILLED })
};
for (const [name, roles] of Object.entries(MODES)) {
  if (!want('B' + Object.keys(MODES).indexOf(name))) continue;
  let w = 0, d = 0, l = 0, plies = 0;
  for (let i = 0; i < N; i++) {
    const g = teamGame(i % 2 === 0, roles);
    if (g.r === 'win') w++; else if (g.r === 'loss') l++; else d++;
    plies += g.plies;
  }
  console.log(`  ${name.padEnd(12)} 승 ${pct(w)} · 무 ${pct(d)} · 패 ${pct(l)}  평균 ${Math.round(plies / N)}반수  (${w}/${d}/${l})`);
}
console.log(`\n${Math.round((Date.now() - t0) / 1000)}초`);
