// 랭크 남용 시험(계획서 §4.2 R-4 · 기획서 §12.6): 로컬 Worker 에 남용 보고를 보내 각각 막히는지 본다.
//   npx wrangler@4 d1 migrations apply wildcrown-rank --local
//   npx wrangler@4 dev --port 8787 --ip 127.0.0.1 --var ABANDON_WAIT_MS:5000
//   node docs/qa/2026-11-09-rank-abuse/api-abuse.mjs
// 이탈 몰수 기다림만 5초로 줄였다(배포는 3분). 기기 신분은 시나리오마다 새로 만들어 같은 상대 상한이 섞이지 않게 한다.
import { writeFileSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { plyText, signReport } from '../../../src/rank/report.js';
import { RANK_BUILD } from '../../../src/rank/abuse.js';

const API = process.env.RANK_URL || 'http://127.0.0.1:8787';
const WAIT = Number(process.env.WAIT_MS || 5000);
const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const post = async (body) => (await fetch(`${API}/api/rank/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
const player = async (id, vs) => (await fetch(`${API}/api/rank/player?id=${id}${vs ? `&vs=${vs}` : ''}`)).json();
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const ids = async () => ({ w: await loadIdentity(mem()), b: await loadIdentity(mem()) });
const roomCode = () => 'AB' + Math.random().toString(36).slice(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
const LINE = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'g8f6', 'd2d3', 'f8c5', 'c2c3', 'd7d6', 'b1d2', 'c8g4'];
const metaFor = (plies, mine, over = {}) => {
  const now = Date.now();
  return { build: RANK_BUILD, start: now - 90_000, end: now - 1000, think: Array.from({ length: mine }, (_, i) => 1200 + i * 300), ...over };
};
const myPlies = (n, white) => (white ? Math.ceil(n / 2) : Math.floor(n / 2));
const rows = [];
const row = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };

// 두 사람이 같은 판을 보고한다. over 로 한쪽만 바꿀 수 있다.
async function both(p, m, { overW = {}, overB = {}, metaW = {}, metaB = {} } = {}) {
  const n = m.moves.length;
  const rw = await post(await signReport({ ...m, ...overW }, p.w, metaFor(n, myPlies(n, true), metaW)));
  const rb = await post(await signReport({ ...m, ...overB }, p.b, metaFor(n, myPlies(n, false), metaB)));
  return { rw, rb };
}

// 1. 불법 수
{
  const p = await ids();
  const r = await post(await signReport({ room: roomCode(), game: 1, white: p.w.id, black: p.b.id, moves: ['e2e5'], result: '1-0', reason: 'resign' }, p.w, metaFor(1, 1)));
  row('불법 수 전송', 'rejected illegal', `${r.status} ${r.error}`, r.status === 'rejected' && r.error === 'illegal');
}
// 2. 두 결과 불일치
{
  const p = await ids();
  const m = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id, moves: LINE.slice(0, 4), result: '1-0', reason: 'resign' };
  const { rb } = await both(p, m, { overB: { result: '0-1' } });
  row('결과 불일치(서로 이겼다고)', 'mismatch, 점수 그대로', `${rb.status} · 백 판수 ${(await player(p.w.id)).games}`, rb.status === 'mismatch' && (await player(p.w.id)).games === 0);
}
// 3. 첫 수 전에 끝냄(1수 뒤 기권) → 무효
{
  const p = await ids();
  const m = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id, moves: ['e2e4'], result: '1-0', reason: 'resign' };
  const { rb } = await both(p, m);
  const w = await player(p.w.id);
  row('첫 수 전 끝남(1수)', 'counted · outcome void · 실력·사다리 그대로', `${rb.outcome} · rating ${w.rating} · points ${w.ladder.points} · games ${w.games}`, rb.outcome === 'void' && w.rating === 1500 && w.ladder.points === 0 && w.games === 0);
}
// 4. 같은 상대 하루 4번째 판 → 상한
{
  const p = await ids();
  const room = roomCode();
  const outs = [];
  for (let g = 1; g <= 4; g++) {
    const { rb } = await both(p, { room, game: g, white: p.w.id, black: p.b.id, moves: LINE.slice(0, 4), result: '1-0', reason: 'resign' });
    outs.push(rb.outcome);
  }
  const w = await player(p.w.id, p.b.id);
  const ok = outs.join(',') === 'counted,counted,counted,capped' && w.games === 3 && w.pair?.capped === true && w.pair.today === 3;
  row('같은 상대 하루 4번째 판', '앞 3판 counted · 4번째 capped · 판수 3 · pair.capped', `${outs.join(',')} · games ${w.games} · pair ${JSON.stringify(w.pair)}`, ok);
  // 다른 친구와는 그대로 점수에 든다
  const c = await loadIdentity(mem());
  const { rb } = await both({ w: p.w, b: c }, { room, game: 9, white: p.w.id, black: c.id, moves: LINE.slice(0, 4), result: '1-0', reason: 'resign' });
  row('같은 날 다른 친구', 'counted', rb.outcome, rb.outcome === 'counted');
}
// 5. 사람이 낼 수 없는 시간 → 거부(기기 표시는 D1 flags 로 따로 본다)
{
  const p = await ids();
  const m = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id, moves: LINE, result: '1-0', reason: 'resign' };
  const r = await post(await signReport(m, p.w, metaFor(12, 6, { think: [40, 30, 60, 20, 50, 70] })));
  row('수마다 0.1초 미만 5번 연속', 'rejected inhuman', `${r.status} ${r.error}`, r.error === 'inhuman');
  const now = Date.now();
  const r2 = await post(await signReport(m, p.w, metaFor(12, 6, { start: now - 400, end: now - 100 })));
  row('12수를 0.3초에', 'rejected inhuman', `${r2.status} ${r2.error}`, r2.error === 'inhuman');
  rows.at(-1).signer = p.w.id;
}
// 6. 옛 빌드·시간 없음·오래된 보고·서명 밖에서 시간을 바꿈
{
  const p = await ids();
  const m = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id, moves: LINE.slice(0, 4), result: '1-0', reason: 'resign' };
  const r = await post(await signReport(m, p.w, metaFor(4, 2, { build: 0 })));
  row('옛 빌드', 'rejected old-build', `${r.status} ${r.error}`, r.error === 'old-build');
  const r2 = await post(await signReport(m, p.w, null));
  row('시간 기록 없음(v1 클라이언트 흉내)', 'rejected old-build', `${r2.status} ${r2.error}`, r2.error === 'old-build');
  const r3 = await post(await signReport(m, p.w, metaFor(4, 2, { start: Date.now() - 3 * 86400e3, end: Date.now() - 2 * 86400e3 })));
  row('이틀 지난 보고', 'rejected stale', `${r3.status} ${r3.error}`, r3.error === 'stale');
  const signed = await signReport(m, p.w, metaFor(4, 2));
  const r4 = await post({ ...signed, meta: { ...signed.meta, think: [5000, 5000] } });
  row('서명 뒤 시간 기록만 고침', 'rejected signature', `${r4.status} ${r4.error}`, r4.error === 'signature');
}
// 7. 이탈 몰수: 흑이 4수째 뒤 사라짐. 백이 흑 영수증으로 혼자 보고 → 기다림 → 반영
{
  const p = await ids();
  const room = roomCode();
  const base = { room, game: 1, white: p.w.id, black: p.b.id };
  const moves = LINE.slice(0, 5);   // 흑 4수째 뒤 백이 한 수 더 두고, 흑이 안 돌아옴
  const receipt = { seq: 4, sig: await p.b.sign(plyText({ ...base, moves: moves.slice(0, 4) })), pub: { x: p.b.pub.x, y: p.b.pub.y } };
  const claim = await signReport({ ...base, moves, result: '1-0', reason: 'abandon' }, p.w, metaFor(5, 3), receipt);
  const first = await post(claim);
  row('이탈 몰수 청함(바로)', 'waiting + abandonAt', `${first.status} · ${first.abandonAt ? `${Math.round((first.abandonAt - Date.now()) / 1000)}s 뒤` : '-'}`, first.status === 'waiting' && first.abandonAt > Date.now());
  await sleep(WAIT + 500);
  const second = await post(claim);
  const w = await player(p.w.id), b = await player(p.b.id);
  row('기다림 뒤 다시 보냄', 'counted · 백 1승 · 흑 1패', `${second.status} ${second.outcome} · ${w.wins}승 / ${b.losses}패`, second.outcome === 'counted' && w.wins === 1 && b.losses === 1);
}
// 7b. 창을 닫았어도: 기다림 뒤 내 랭크를 읽기만 하면 들어간다
{
  const p = await ids();
  const base = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id };
  const moves = LINE.slice(0, 4);
  const receipt = { seq: 4, sig: await p.b.sign(plyText({ ...base, moves })), pub: p.b.pub };
  await post(await signReport({ ...base, moves, result: '1-0', reason: 'abandon' }, p.w, metaFor(4, 2), receipt));
  await sleep(WAIT + 500);
  const w = await player(p.w.id);
  row('몰수 청한 뒤 창 닫음 → 다음에 랭크 읽기', '1승 반영', `${w.wins}승 · ${w.games}판`, w.wins === 1);
}
// 8. 거짓 몰수: 상대 영수증 없이·내 키로 만든 영수증
{
  const p = await ids();
  const base = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id };
  const moves = LINE.slice(0, 4);
  const fake = { seq: 4, sig: await p.w.sign(plyText({ ...base, moves })), pub: p.w.pub };
  const r = await post(await signReport({ ...base, moves, result: '1-0', reason: 'abandon' }, p.w, metaFor(4, 2), fake));
  row('내 키로 만든 상대 영수증', 'rejected receipt-key', `${r.status} ${r.error}`, r.error === 'receipt-key');
  const r2 = await post(await signReport({ ...base, moves, result: '1-0', reason: 'abandon' }, p.w, metaFor(4, 2), null));
  row('영수증 없는 몰수', 'rejected receipt', `${r2.status} ${r2.error}`, r2.error === 'receipt');
  await sleep(WAIT + 500);
  const w = await player(p.w.id);
  row('… 기다림 뒤에도', '0판', `${w.games}판`, w.games === 0);
}
// 9. 서로 「상대가 나갔다」(연결이 갈라짐) → 둘 다 들어가지 않음
{
  const p = await ids();
  const base = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id };
  const moves = LINE.slice(0, 4);
  const rcB = { seq: 4, sig: await p.b.sign(plyText({ ...base, moves })), pub: p.b.pub };
  const rcW = { seq: 3, sig: await p.w.sign(plyText({ ...base, moves: moves.slice(0, 3) })), pub: p.w.pub };
  await post(await signReport({ ...base, moves, result: '1-0', reason: 'abandon' }, p.w, metaFor(4, 2), rcB));
  const r = await post(await signReport({ ...base, moves, result: '0-1', reason: 'abandon' }, p.b, metaFor(4, 2), rcW));
  await sleep(WAIT + 500);
  const w = await player(p.w.id), b = await player(p.b.id);
  row('둘 다 몰수를 청함', 'mismatch · 둘 다 0판', `${r.status} · ${w.games}/${b.games}판`, r.status === 'mismatch' && w.games === 0 && b.games === 0);
}
// 10. 사라졌던 쪽이 돌아와 진 판을 같이 보고 → 기다리지 않고 반영
{
  const p = await ids();
  const base = { room: roomCode(), game: 1, white: p.w.id, black: p.b.id };
  const moves = LINE.slice(0, 4);
  const rcB = { seq: 4, sig: await p.b.sign(plyText({ ...base, moves })), pub: p.b.pub };
  const m = { ...base, moves, result: '1-0', reason: 'abandon' };
  await post(await signReport(m, p.w, metaFor(4, 2), rcB));
  const r = await post(await signReport(m, p.b, metaFor(4, 2)));
  row('나갔던 쪽이 돌아와 진 판 보고', '바로 counted', `${r.status} ${r.outcome}`, r.outcome === 'counted');
}

const pass = rows.filter((r) => r.ok).length;
console.log(`${pass}/${rows.length}`);
writeFileSync(new URL('./api-abuse.json', import.meta.url), JSON.stringify({ at: new Date().toISOString(), waitMs: WAIT, pass, total: rows.length, rows }, null, 1));
