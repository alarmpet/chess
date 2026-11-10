// 라이벌 방문 누수 측정(방향 계획서 DR-0c, 2026-11-10). 예전 규칙(4시간마다 도토리 10)과 새 규칙(판 4번마다 꾸미기 소품)을
// 같은 생활 습관으로 비교한다: 14일 동안 하루에 판을 g 번 두고, 마을은 하루 o 번 연다. 라이벌 3명(pack.json 의 visitsFor:
// shelter·market·spring)의 건물이 다 서 있다고 둔다. 판 수입은 승 30 · 무 20 · 패 15 의 평균 22 로 어림한다.
//   node tools/visit_sim.mjs
import { newVillage, tickVillage, VISIT_EVERY_GAMES } from '../src/village/economy.js';

const RIVALS = [{ id: 'a', visitsFor: 'shelter' }, { id: 'b', visitsFor: 'market' }, { id: 'c', visitsFor: 'spring' }];
const DAYS = 14, PER_GAME = 22, OLD_GAP = 4 * 3600e3, OLD_GIFT = 10;
const HABITS = [
  { name: '판 안 두고 하루 6번 열기', games: 0, opens: 6 },
  { name: '하루 1판 · 2번 열기', games: 1, opens: 2 },
  { name: '하루 3판 · 3번 열기', games: 3, opens: 3 },
  { name: '하루 8판 · 4번 열기', games: 8, opens: 4 }
];

function oldRule(h) {
  const last = {}; let acorns = 0;
  for (let d = 0; d < DAYS; d++) for (let k = 0; k < h.opens; k++) {
    const now = d * 86400e3 + (k * 86400e3) / h.opens;
    for (const r of RIVALS) if (now - (last[r.id] ?? -Infinity) >= OLD_GAP) { last[r.id] = now; acorns += OLD_GIFT; }
  }
  return acorns;
}
function newRule(h) {
  const v = newVillage();
  for (const r of RIVALS) v.built.push({ kind: r.visitsFor, sq: 'a1', ready: true });
  let props = 0;
  for (let d = 0; d < DAYS; d++) for (let k = 0; k < h.opens; k++) {
    v.games += Math.round(h.games / h.opens * (k + 1)) - Math.round(h.games / h.opens * k);
    props += tickVillage(v, RIVALS, d * 86400e3 + k).length;
  }
  return props;
}

console.log(`14일 · 라이벌 3명 · 새 규칙은 판 ${VISIT_EVERY_GAMES}번마다 방문`);
console.log('습관'.padEnd(22), '판 수입(도토리)', '예전 방문 도토리', '예전 방문 몫', '새 방문 소품');
for (const h of HABITS) {
  const play = h.games * DAYS * PER_GAME;
  const old = oldRule(h);
  const share = play + old ? Math.round((100 * old) / (play + old)) : 100;
  console.log(h.name.padEnd(22), String(play).padStart(10), String(old).padStart(14), `${share}%`.padStart(10), String(newRule(h)).padStart(10));
}
