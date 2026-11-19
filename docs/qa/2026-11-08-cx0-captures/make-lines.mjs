// 시뮬이 찾은 칸별 가장 짧은 수순(SAN)을 이어 하기 기록(from/to)과 마지막 잡기 한 수로 바꾼다.
import { Chess } from 'chess.js';
import fs from 'node:fs';
const sim = JSON.parse(fs.readFileSync(new URL('../../research/2026-11-08-capture-pairs/pair_sim-60.json', import.meta.url)));
const out = [];
for (const a of ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king']) for (const v of ['pawn', 'knight', 'bishop', 'rook', 'queen']) {
  const key = `${a}>${v}`;
  const c = new Chess();
  const ms = sim.shortest[key].split(' ').map((s) => c.move(s));
  const last = ms.pop();
  const sq = (s) => [8 - Number(s[1]), s.charCodeAt(0) - 97];
  out.push({ key, color: last.color, san: last.san, moves: ms.map((m) => (m.promotion ? { from: m.from, to: m.to, promotion: m.promotion } : { from: m.from, to: m.to })), last: { from: sq(last.from), to: sq(last.to), promotion: last.promotion || null } });
}
fs.writeFileSync(new URL('./lines.json', import.meta.url), JSON.stringify(out));
console.log(out.length, out.map((o) => `${o.key}:${o.san}`).join(' '));
