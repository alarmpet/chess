// 친구 초대 1:1 대전의 규칙 층: 방장·손님 두 상태 기계를 메모리 버스로 잇고, 유실·역순·위조·재연결·재대국을 본다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CODE_LEN, RESEND_MS, createMatchCore, newRoomCode, parseRoomCode } from '../src/net/matchCore.js';

function room({ drop = () => false } = {}) {
  let t = 1000;
  const now = () => t;
  const peers = [];
  const sent = [];
  const bus = (msg) => { sent.push(msg); if (drop(msg)) return; for (const p of peers) p.core.receive(structuredClone(msg)); };
  const add = (id, opts = {}) => {
    const applied = [];
    const p = { id, applied, failNext: false };
    p.core = createMatchCore({ id, now, send: bus, apply: async (mv) => { if (p.failNext) { p.failNext = typeof p.failNext === 'number' ? p.failNext - 1 : false; return false; } applied.push(mv); return true; }, ...opts });
    peers.push(p);
    return p;
  };
  const settle = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r)); };
  return { add, settle, sent, peers, advance: (ms) => { t += ms; }, remove: (p) => peers.splice(peers.indexOf(p), 1) };
}

test('room codes are 6 safe characters and can be read back from an invite link', () => {
  const code = newRoomCode(() => 0.5);
  assert.equal(code.length, CODE_LEN);
  assert.equal(parseRoomCode(`https://x.pages.dev/?room=${code.toLowerCase()}`), code);
  assert.equal(parseRoomCode(` ${code} `), code);
  assert.equal(parseRoomCode('ABC'), null);
  assert.equal(parseRoomCode('ABCDE0'), null, '0 is not used (looks like O)');
});

test('the guest gets the other color and both sides see each move once', async () => {
  const r = room();
  const host = r.add('h', { host: true, hostColor: 'w' });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  assert.equal(guest.core.view().myColor, 'b');
  assert.deepEqual(guest.core.takeReset(), { color: 'b', game: 1, moves: [] });
  await r.settle();
  assert.ok(host.core.local({ from: 'e2', to: 'e4' }));
  await r.settle();
  assert.deepEqual(guest.applied, [{ from: 'e2', to: 'e4', promotion: undefined }]);
  assert.equal(host.core.view().waitingAck, 0, 'the guest acked');
  assert.equal(guest.core.local({ from: 'e2', to: 'e4' }), false, 'not the guest’s color');
  assert.ok(guest.core.local({ from: 'e7', to: 'e5' }));
  await r.settle();
  assert.equal(host.applied.length, 1);
  assert.equal(host.core.view().plies, 2);
  assert.equal(guest.core.view().plies, 2);
});

test('a lost move is sent again until acked, and a duplicate is not applied twice', async () => {
  let dropped = 0;
  const r = room({ drop: (m) => m.t === 'move' && dropped++ === 0 });
  const host = r.add('h', { host: true });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  host.core.local({ from: 'd2', to: 'd4' });
  await r.settle();
  assert.equal(guest.applied.length, 0, 'first send lost');
  r.advance(RESEND_MS);
  host.core.tick();
  await r.settle();
  assert.equal(guest.applied.length, 1);
  guest.core.receive({ t: 'move', seq: 1, uci: 'd2d4', from: 'h' });
  await r.settle();
  assert.equal(guest.applied.length, 1, 'duplicate ignored');
});

test('forged, out-of-order and failed moves never advance the count', async () => {
  const r = room();
  const host = r.add('h', { host: true });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  host.core.local({ from: 'e2', to: 'e4' });
  await r.settle();
  // 손님이 흑 차례에 불법 수(퀸 점프)를 보낸 척
  host.core.receive({ t: 'move', seq: 2, uci: 'd8h4', from: 'g' });
  await r.settle();
  assert.equal(host.core.view().plies, 1);
  // 번호를 건너뛴 수
  host.core.receive({ t: 'move', seq: 3, uci: 'e7e5', from: 'g' });
  await r.settle();
  assert.equal(host.core.view().plies, 1);
  // 엔진이 적용에 실패하면 번호를 올리지 않는다(옛 수신 큐의 결함)
  host.failNext = true;
  host.core.receive({ t: 'move', seq: 2, uci: 'e7e5', from: 'g' });
  await r.settle();
  assert.equal(host.core.view().plies, 1);
  host.core.receive({ t: 'move', seq: 2, uci: 'e7e5', from: 'g' });
  await r.settle();
  assert.equal(host.core.view().plies, 2);
});

test('a third person is told the room is full', async () => {
  const r = room();
  r.add('h', { host: true });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  const third = r.add('x', { host: false });
  third.core.join();
  await r.settle();
  assert.equal(third.core.view().full, true);
  assert.equal(third.core.view().myColor, null);
});

test('a guest that reloads gets the whole game back from the host', async () => {
  const r = room();
  const host = r.add('h', { host: true, hostColor: 'b' });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  guest.core.local({ from: 'g1', to: 'f3' });
  await r.settle();
  host.core.local({ from: 'g8', to: 'f6' });
  await r.settle();
  r.remove(guest);
  const again = r.add('g', { host: false });
  again.core.join();
  await r.settle();
  const reset = again.core.takeReset();
  assert.equal(reset.color, 'w');
  assert.equal(reset.moves.length, 2);
  await r.settle();
  assert.equal(again.core.view().plies, 2);
  assert.ok(again.core.local({ from: 'e2', to: 'e4' }), 'white to move after the reload');
});

test('resign ends both sides; a rematch swaps the colors', async () => {
  const r = room();
  const host = r.add('h', { host: true, hostColor: 'w' });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  guest.core.resign();
  await r.settle();
  assert.deepEqual(host.core.view().ended, { result: 'win', reason: 'resign' });
  assert.deepEqual(guest.core.view().ended, { result: 'loss', reason: 'resign' });
  guest.core.rematch();
  await r.settle();
  assert.equal(host.core.view().rematch, 'peer');
  host.core.rematch();
  await r.settle();
  assert.equal(host.core.takeReset().color, 'b');
  assert.equal(guest.core.takeReset().color, 'w');
  await r.settle();
  assert.equal(guest.core.view().ended, null);
  assert.equal(guest.core.view().game, 2);
});

test('checkmate is seen on both sides from their own color', async () => {
  const r = room();
  const host = r.add('h', { host: true, hostColor: 'w' });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  const line = [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']];
  for (const [i, [from, to]] of line.entries()) {
    (i % 2 ? guest : host).core.local({ from, to });
    await r.settle();
  }
  assert.deepEqual(host.core.view().ended, { result: 'loss', reason: 'checkmate' });
  assert.deepEqual(guest.core.view().ended, { result: 'win', reason: 'checkmate' });
});

test('when both sides asked for a rematch (one request was lost), the game starts without a third click', async () => {
  let lost = 0;
  const r = room({ drop: (m) => m.t === 'rematch' && lost++ === 0 });
  const host = r.add('h', { host: true, hostColor: 'w' });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  host.core.resign();
  await r.settle();
  guest.core.rematch();   // lost on the way
  await r.settle();
  assert.equal(host.core.view().rematch, null);
  host.core.rematch();
  await r.settle();
  assert.equal(host.core.view().game, 2);
  assert.equal(guest.core.view().game, 2);
  assert.equal(guest.core.view().myColor, 'w');
});

test('a late, shorter state from the host does not wipe a move of mine that is still on its way', async () => {
  const r = room();
  const host = r.add('h', { host: true, hostColor: 'w' });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  host.core.local({ from: 'e2', to: 'e4' });
  await r.settle();
  guest.core.local({ from: 'e7', to: 'e5' });
  await r.settle();
  guest.core.receive({ t: 'state', from: 'h', hostColor: 'w', game: 1, moves: ['e2e4'], ended: null });
  await r.settle();
  assert.equal(guest.core.view().reset, null, 'no redraw');
  assert.equal(guest.core.view().plies, 2);
  assert.equal(guest.core.view().turn, 'w');
});

test('when the engine cannot take a catch-up move, the whole game is redrawn from the host', async () => {
  const r = room();
  const host = r.add('h', { host: true, hostColor: 'w' });
  const guest = r.add('g', { host: false });
  guest.core.join();
  await r.settle();
  guest.core.takeReset();
  await r.settle();
  guest.failNext = 2;
  host.core.local({ from: 'e2', to: 'e4' });   // the guest engine refuses twice → guest asks again → state → catch-up
  await r.settle();
  const reset = guest.core.view().reset;
  assert.ok(reset, 'redraw requested');
  assert.equal(reset.moves.length, 1);
});

test('a ranked room: the host decides, the guest follows, and each side learns the other’s device key (LA-R R-1)', async () => {
  const r = room();
  const host = r.add('h', { host: true, ranked: true, key: 'HOSTKEY_abc123' });
  const guest = r.add('g', { host: false, ranked: false, key: 'GUESTKEY-xyz789' });
  assert.equal(guest.core.view().ranked, false, 'a guest cannot make a room ranked by itself');
  guest.core.join();
  await r.settle();
  assert.equal(host.core.view().ranked, true);
  assert.equal(guest.core.view().ranked, true, 'taken from the host’s state');
  assert.equal(host.core.view().peerKey, 'GUESTKEY-xyz789');
  assert.equal(guest.core.view().peerKey, 'HOSTKEY_abc123');
  // 다시 두기도 랭크 그대로
  guest.core.takeReset();
  await r.settle();
  host.core.resign();
  await r.settle();
  guest.core.rematch();
  host.core.rematch();
  await r.settle();
  assert.equal(host.core.view().game, 2);
  assert.equal(guest.core.view().ranked, true);
});

test('a friendly room stays unranked, and a malformed key is ignored', async () => {
  const r = room();
  const host = r.add('h', { host: true, key: 'bad key with spaces' });
  const guest = r.add('g', { host: false, key: '<script>' });
  guest.core.join();
  await r.settle();
  assert.equal(guest.core.view().ranked, false);
  assert.equal(host.core.view().peerKey, null);
  assert.equal(guest.core.view().peerKey, null);
});
