// 랭크 남용 막기 (계획서 §4.2 R-4): 같은 상대 상한·시간 기록·이탈 몰수 영수증.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAIR_DAILY_CAP, PAIR_WEEKLY_CAP, dayOf, dayStart, metaError, pairCapped, RANK_BUILD } from '../src/rank/abuse.js';
import { loadIdentity } from '../src/net/identity.js';
import { checkAbandon, checkReport, plyText, signReport } from '../src/rank/report.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('the day turns at midnight in Korea, and the pair caps are 3 a day and 10 a week', () => {
  const kstMidnight = Date.UTC(2026, 10, 9, 15, 0, 0);   // 11-10 00:00 KST
  assert.equal(dayOf(kstMidnight - 1) + 1, dayOf(kstMidnight));
  assert.equal(dayStart(kstMidnight + 5 * 3600e3), kstMidnight);
  assert.equal(PAIR_DAILY_CAP, 3);
  assert.equal(PAIR_WEEKLY_CAP, 10);
  assert.equal(pairCapped(2, 9), false);
  assert.equal(pairCapped(3, 3), true, 'three counted today');
  assert.equal(pairCapped(0, 10), true, 'ten counted this week');
});

test('time records a person could not make are refused', () => {
  const now = 1_800_000_000_000;
  const ok = { build: RANK_BUILD, start: now - 600e3, end: now - 1000, think: [3000, 800, 12000, 50, 70, 4000] };
  const ctx = { plies: 12, myPlies: 6, now };
  assert.equal(metaError(ok, ctx), null);
  assert.equal(metaError(null, ctx), 'old-build');
  assert.equal(metaError({ ...ok, build: RANK_BUILD - 1 }, ctx), 'old-build');
  assert.equal(metaError({ ...ok, end: ok.start - 1 }, ctx), 'time');
  assert.equal(metaError({ ...ok, think: [1, 2, 3, 4, 5, 6, 7] }, ctx), 'time', 'more think times than my moves');
  assert.equal(metaError({ ...ok, end: now + 3600e3 }, ctx), 'time', 'ends in the future');
  assert.equal(metaError({ ...ok, start: now - 3 * 86400e3, end: now - 2 * 86400e3 }, ctx), 'stale');
  assert.equal(metaError({ ...ok, think: [30, 40, 20, 90, 10, 500] }, ctx), 'inhuman', 'five moves in a row under 0.1 s');
  assert.equal(metaError({ ...ok, think: [30, 40, 20, 90, 500, 10] }, ctx), null, 'four fast moves are fine (premoves, forced replies)');
  assert.equal(metaError({ ...ok, start: now - 500, end: now - 100 }, ctx), 'inhuman', 'twelve plies in 0.4 s');
});

test('an abandon claim needs the leaver’s own receipt, right after their move', async () => {
  const w = await loadIdentity(mem()), b = await loadIdentity(mem());
  const moves = ['e2e4', 'e7e5', 'g1f3'];
  const base = { room: 'BJ8GK3', game: 1, white: w.id, black: b.id };
  const blackReceipt = { seq: 2, sig: await b.sign(plyText({ ...base, moves: moves.slice(0, 2) })), pub: b.pub };
  const claim = async (over = {}, receipt = blackReceipt, by = w) => signReport({ ...base, moves, result: '1-0', reason: 'abandon', ...over }, by, null, receipt);
  assert.equal((await checkAbandon(await claim())).ok, true);
  assert.equal((await checkReport(await claim())).ok, true, 'abandon is read like a resignation');
  assert.equal((await checkAbandon(await claim({ result: '0-1' }))).error, 'abandon-signer', 'the claimant must be the winner');
  assert.equal((await checkAbandon(await claim({}, { ...blackReceipt, pub: w.pub }))).error, 'receipt-key', 'my own key cannot stand in');
  assert.equal((await checkAbandon(await claim({}, { ...blackReceipt, sig: await w.sign(plyText({ ...base, moves: moves.slice(0, 2) })) }))).error, 'receipt-signature');
  assert.equal((await checkAbandon(await claim({}, { ...blackReceipt, seq: 1 }))).error, 'receipt', 'seq 1 is a white move, not black’s');
  assert.equal((await checkAbandon(await claim({ moves: [...moves, 'b8c6', 'f1c4'] }))).error, 'receipt', 'too old: the game went on after it');
  assert.equal((await checkAbandon(await claim({}, null))).error, 'receipt');
});
