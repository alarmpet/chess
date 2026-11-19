// 왕관 사다리 서버 확인: 같은 두 기기가 로컬 Worker 에 랭크 판 18개를 보고한다(앞 14판 A 승, 뒤 4판 B 승).
// 사다리 점수·연승 보너스·칸 오름·새끼 무손실·바닥이 서버 기록에 그대로 나오는지 본다.
//   node docs/qa/2026-11-09-ladder/api-ladder.mjs   (wrangler dev 127.0.0.1:8787)
import { writeFileSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { signReport } from '../../../src/rank/report.js';

const API = process.env.RANK_URL || 'http://127.0.0.1:8787';
const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const post = async (body) => (await fetch(`${API}/api/rank/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
const a = await loadIdentity(mem());
const b = await loadIdentity(mem());
const room = 'LAD' + Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
const rows = [];
for (let g = 1; g <= 18; g++) {
  const aWins = g <= 14;
  const m = { room, game: g, white: a.id, black: b.id, moves: ['e2e4'], reason: 'resign', result: aWins ? '1-0' : '0-1' };
  await post(await signReport(m, a));
  const r = await post(await signReport(m, b));
  const la = r.white.ladder, lb = r.black.ladder;
  rows.push({ g, winner: aWins ? 'A' : 'B', A: `${la.before}→${la.after} (${la.delta >= 0 ? '+' : ''}${la.delta})${la.streakBonus ? ' 🔥' : ''}${la.tierUp ? ' ⬆등급' : la.stepUp ? ' ⬆칸' : ''}${la.floored ? ' 🛡️' : ''}`, B: `${lb.before}→${lb.after} (${lb.delta >= 0 ? '+' : ''}${lb.delta})${lb.floored ? ' 🛡️' : ''}`, Aplace: `${la.place.tier} ${la.place.step ?? ''}` });
}
const player = async (id) => (await fetch(`${API}/api/rank/player?id=${id}`)).json();
const out = { rows, A: await player(a.id), B: await player(b.id) };
for (const r of rows) console.log(r.g, r.winner, 'A', r.A, r.Aplace, '| B', r.B);
console.log(JSON.stringify({ A: out.A.ladder, B: out.B.ladder, Arating: out.A.rating, Brating: out.B.rating }));
writeFileSync(new URL('./api-ladder.json', import.meta.url), JSON.stringify(out, null, 1));
