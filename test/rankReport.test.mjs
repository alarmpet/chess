// 랭크 판 결과 보고 (LA-R R-2): 서명·다시 두기·두 보고 일치. 거부 규칙마다 하나씩.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadIdentity } from '../src/net/identity.js';
import { agree, buildMatch, checkReport, resultFor, signReport } from '../src/rank/report.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const FOOL = ['f2f3', 'e7e5', 'g2g4', 'd8h4'];   // 바보 메이트: 흑 승

async function pair() {
  const w = await loadIdentity(mem());
  const b = await loadIdentity(mem());
  return { w, b };
}
const matchOf = (w, b, over = {}) => ({ room: 'BJ8GK3', game: 1, white: w.id, black: b.id, moves: FOOL, result: '0-1', reason: 'checkmate', ...over });

test('a real checkmate signed by both sides is accepted with the right score', async () => {
  const { w, b } = await pair();
  const m = matchOf(w, b);
  const ra = await checkReport(await signReport(m, w));
  const rb = await checkReport(await signReport(m, b));
  assert.ok(ra.ok && rb.ok, JSON.stringify([ra, rb]));
  const both = agree({ ...ra, signer: w.id, match: m }, { ...rb, signer: b.id, match: m });
  assert.deepEqual(both, { ok: true, whiteScore: 0 });
});

test('the screen builds the same record from either side', async () => {
  const { w, b } = await pair();
  const fromWhite = buildMatch({ room: 'BJ8GK3', game: 1, myColor: 'w', myKey: w.id, peerKey: b.id, moves: FOOL, ended: { result: 'loss', reason: 'checkmate' } });
  const fromBlack = buildMatch({ room: 'BJ8GK3', game: 1, myColor: 'b', myKey: b.id, peerKey: w.id, moves: FOOL, ended: { result: 'win', reason: 'checkmate' } });
  assert.deepEqual(fromWhite, fromBlack);
  assert.equal(resultFor('w', { result: 'draw' }), '1/2-1/2');
  assert.equal(buildMatch({ room: 'X', game: 1, myColor: 'w', myKey: w.id, peerKey: null, moves: [], ended: { result: 'win', reason: 'resign' } }), null);
});

test('each refusal rule', async () => {
  const { w, b } = await pair();
  const cases = [
    ['illegal', matchOf(w, b, { moves: ['e2e5'] })],
    ['not-over', matchOf(w, b, { moves: ['e2e4'] })],
    ['result', matchOf(w, b, { result: '1-0' })],                                 // 메이트 당한 쪽이 이겼다고
    ['reason', matchOf(w, b, { reason: 'stalemate', result: '1/2-1/2' })],
    ['resign-after-end', matchOf(w, b, { reason: 'resign' })],
    ['result', matchOf(w, b, { moves: ['e2e4'], reason: 'resign', result: '1/2-1/2' })],
    ['players', matchOf(w, b, { black: w.id })],
    ['moves', matchOf(w, b, { moves: ['e2e4; drop table'] })]
  ];
  for (const [want, m] of cases) {
    const r = await checkReport(await signReport(m, w));
    assert.equal(r.error, want, `${want}: ${JSON.stringify(m.moves)} ${m.result} ${m.reason}`);
  }
  // 기권은 판이 끝나기 전에 승패로 받는다
  assert.equal((await checkReport(await signReport(matchOf(w, b, { moves: ['e2e4'], reason: 'resign', result: '1-0' }), b))).ok, true);
});

test('forged signatures and swapped keys are refused', async () => {
  const { w, b } = await pair();
  const m = matchOf(w, b);
  const good = await signReport(m, w);
  assert.equal((await checkReport({ ...good, sig: (await signReport(m, b)).sig })).error, 'signature', 'someone else signed');
  assert.equal((await checkReport({ ...good, pub: b.pub })).error, 'key', 'key does not match the signer id');
  assert.equal((await checkReport({ ...good, match: { ...m, result: '1-0' } })).error, 'signature', 'result changed after signing');
  const outsider = await loadIdentity(mem());
  assert.equal((await checkReport(await signReport(m, outsider))).error, 'signer', 'not one of the two players');
});

test('two reports that disagree, or two from the same player, do not count', async () => {
  const { w, b } = await pair();
  const m1 = matchOf(w, b, { moves: ['e2e4'], reason: 'resign', result: '1-0' });
  const m2 = matchOf(w, b, { moves: ['e2e4'], reason: 'resign', result: '0-1' });
  const a = await checkReport(await signReport(m1, w));
  const c = await checkReport(await signReport(m2, b));
  assert.equal(agree({ ...a, signer: w.id, match: m1 }, { ...c, signer: b.id, match: m2 }).error, 'mismatch');
  assert.equal(agree({ ...a, signer: w.id, match: m1 }, { ...a, signer: w.id, match: m1 }).error, 'same-signer');
});
