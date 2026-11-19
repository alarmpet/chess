// 사람 시험 B 대역 집계: play20/games*.ndjson 에서 잡기 조합별 횟수·대기 시간을 센다.
//   node docs/qa/2026-11-09-llm-human-tests/score-b.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const DIR = new URL('./play20/', import.meta.url);
const P = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const games = readdirSync(DIR).filter((f) => f.endsWith('.ndjson'))
  .flatMap((f) => readFileSync(new URL(f, DIR), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)));
const cells = {};
let moves = 0, quietSec = 0, capSec = 0, caps = 0, plies = 0;
for (const g of games) {
  plies += g.plies;
  for (const r of g.rows) {
    moves++;
    if (!r.captured) { quietSec += r.total || 0; continue; }
    caps++; capSec += r.total || 0;
    const k = `${P[r.piece]}>${P[r.captured]}`;
    const c = (cells[k] ||= { n: 0, sec: 0, max: 0, upset: 0, mirror: 0, combo: 0, roar: 0, games: new Set() });
    c.n++; c.sec += r.total || 0; c.max = Math.max(c.max, r.total || 0); c.games.add(g.game + (g.tag || ''));
    if (r.upset) c.upset++; if (r.mirror) c.mirror++; if (r.comboN > 1) c.combo++; if (r.swayed) c.roar++;
  }
}
const rows = Object.entries(cells).map(([k, c]) => ({ cell: k, n: c.n, share: +(100 * c.n / caps).toFixed(1), avgSec: +(c.sec / c.n).toFixed(2), maxSec: +c.max.toFixed(2), totalSec: +c.sec.toFixed(1), upset: c.upset, mirror: c.mirror, combo: c.combo, roar: c.roar }))
  .sort((a, b) => b.totalSec - a.totalSec);
const summary = {
  games: games.length, finished: games.filter((g) => g.over).length, plies, moves, captures: caps,
  avgQuietSec: +(quietSec / (moves - caps)).toFixed(2), avgCaptureSec: +(capSec / caps).toFixed(2),
  captureShareOfWait: +(100 * capSec / (capSec + quietSec)).toFixed(1), unseen: 30 - rows.length
};
console.log(JSON.stringify(summary));
console.log('조합            횟수  비율%  평균초  최대초  합계초');
for (const r of rows) console.log(`${r.cell.padEnd(15)} ${String(r.n).padStart(4)} ${String(r.share).padStart(6)} ${String(r.avgSec).padStart(7)} ${String(r.maxSec).padStart(7)} ${String(r.totalSec).padStart(7)}`);
writeFileSync(new URL('./score-b.json', import.meta.url), JSON.stringify({ summary, rows }, null, 1));
