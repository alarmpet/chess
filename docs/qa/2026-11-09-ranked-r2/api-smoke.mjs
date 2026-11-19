// LA-R R-2 서버 확인: 로컬 wrangler dev(127.0.0.1:8787, 로컬 D1)에 보고서를 실제로 보낸다.
//   node docs/qa/2026-11-09-ranked-r2/api-smoke.mjs
// 보는 것: 한쪽만 → waiting · 둘 다 → counted(레이팅 변화) · 같은 것 다시 → 두 번 세지 않음 · 결과가 다른 둘 → mismatch ·
//          위조 서명·불법 수·안 끝난 판 → rejected · player 조회.
import { writeFileSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { signReport } from '../../../src/rank/report.js';

const API = process.env.RANK_URL || 'http://127.0.0.1:8787';
const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const post = async (body) => { const r = await fetch(`${API}/api/rank/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return { http: r.status, ...(await r.json()) }; };
const get = async (id) => (await fetch(`${API}/api/rank/player?id=${id}`)).json();

const w = await loadIdentity(mem());
const b = await loadIdentity(mem());
const room = 'SMK' + Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
const fool = { room, game: 1, white: w.id, black: b.id, moves: ['f2f3', 'e7e5', 'g2g4', 'd8h4'], result: '0-1', reason: 'checkmate' };
const out = {};
out.firstOnly = await post(await signReport(fool, w));
out.second = await post(await signReport(fool, b));
out.again = await post(await signReport(fool, w));
out.whiteAfter = await get(w.id);
out.blackAfter = await get(b.id);

const g2 = { ...fool, game: 2, moves: ['e2e4'], reason: 'resign', result: '1-0' };
out.mismatchA = await post(await signReport(g2, w));
out.mismatchB = await post(await signReport({ ...g2, result: '0-1' }, b));

const g3 = { ...fool, game: 3 };
const forged = await signReport(g3, w);
out.forged = await post({ ...forged, sig: (await signReport(g3, b)).sig });
out.illegal = await post(await signReport({ ...fool, game: 4, moves: ['e2e5'] }, w));
out.notOver = await post(await signReport({ ...fool, game: 5, moves: ['e2e4', 'e7e5'] }, w));
out.badJson = await (await fetch(`${API}/api/rank/result`, { method: 'POST', body: '{' })).status;
out.assetStillServed = (await fetch(`${API}/`)).status;

const checks = {
  waitingFirst: out.firstOnly.status === 'waiting',
  countedSecond: out.second.status === 'counted' && out.second.black.after > 1500 && out.second.white.after < 1500,
  notTwice: out.again.status === 'counted' && out.whiteAfter.games === 1 && out.blackAfter.games === 1,
  mismatch: out.mismatchB.status === 'mismatch',
  forged: out.forged.error === 'signature',
  illegal: out.illegal.error === 'illegal',
  notOver: out.notOver.error === 'not-over',
  badJson: out.badJson === 400,
  assets: out.assetStillServed === 200
};
const result = { api: API, out, checks, allOk: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 1));
writeFileSync(new URL('./api-smoke.json', import.meta.url), JSON.stringify(result, null, 1));
