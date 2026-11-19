// 위기 알림 측정(FN-3, 2026-11-07): 연습 단계 판(약한 플레이어 = 쉬움 봇, 상대 = 쉬움 라이벌 세기)에서
// 판당 알림 수(시끄럽지 않은가)와, 알림 받은 말을 플레이어가 무시하면 실제로 잃는 비율(사실인가)을 잰다.
// 「무시」: 알림 뒤 플레이어 수가 그 말을 움직이지 않음. 「잃음」: 바로 다음 상대 수가 그 칸을 잡음.
//   node tools/threat_sim.mjs [판 수=60]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { threatNote } from '../src/cards/threatNote.js';

const N = Number(process.argv[2] || 60);
let seed = 97531;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const ME = { level: 'easy', slip: 0.3 };
const AI = { level: 'easy', slip: 0.3 };

let alerts = 0, ignored = 0, lostIgnored = 0, moved = 0, lostMoved = 0;
const perGame = [];
for (let g = 0; g < N; g++) {
  const me = g % 2 === 0 ? 'w' : 'b';
  const c = new Chess();
  const history = [];
  let said = [];
  let n = 0;
  for (let ply = 0; ply < 200 && !c.isGameOver(); ply++) {
    const mine = c.turn() === me;
    let alert = null;
    if (mine) {
      const r = threatNote(c.fen(), me, said);
      said = r.said;
      if (r.text) { alert = r.square; alerts++; n++; }
    }
    const mv = chooseMove(c.fen(), { ...(mine ? ME : AI), history, rand });
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
    if (alert) {
      const fled = mv.from === alert;
      if (c.isGameOver()) { fled ? moved++ : ignored++; continue; }
      const reply = chooseMove(c.fen(), { ...AI, history, rand });
      const lost = !fled && reply && reply.to === alert;
      if (fled) { moved++; } else { ignored++; if (lost) lostIgnored++; }
      // 상대 수는 다음 반복에서 다시 고른다(같은 rand 흐름은 아님 — 비율만 본다).
    }
  }
  perGame.push(n);
}
perGame.sort((a, b) => a - b);
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '-');
console.log(`위기 알림 — 연습 단계 ${N}판(약한 플레이어 대 쉬움)`);
console.log(`판당 알림: 평균 ${(alerts / N).toFixed(1)} · 중앙값 ${perGame[Math.floor(N / 2)]} · 최대 ${perGame[N - 1]} · 0번인 판 ${pct(perGame.filter((x) => !x).length, N)}`);
console.log(`알림 뒤 그 말을 옮김 ${pct(moved, alerts)} · 안 옮김 ${pct(ignored, alerts)}`);
console.log(`안 옮겼을 때 바로 다음 상대 수가 그 말을 잡음: ${pct(lostIgnored, ignored)} (${lostIgnored}/${ignored})`);
