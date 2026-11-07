// 위기 알림(FN-3): 큰 말이 싼 말에게 노려지거나 지킴 없이 노려질 때만, 새로 위험해진 말만.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bigThreats, threatNote } from '../src/cards/threatNote.js';

test('미어캣(폰)이 호랑이를 노리면 지켜져 있어도 위험', () => {
  // 백 퀸 d5, 흑 폰 e6 이 노림, 백 폰 e4 가 퀸을 지킴.
  const fen = '4k3/8/4p3/3Q4/4P3/8/8/4K3 w - - 0 1';
  assert.deepEqual(bigThreats(fen, 'w'), [{ square: 'd5', type: 'q' }]);
});

test('같은 값 말이 노리고 지켜져 있으면 위험이 아니다', () => {
  // 백 룩 a1 을 흑 룩 a8 이 노림, 백 킹 b1 이 지킴.
  const fen = 'r3k3/8/8/8/8/8/8/RK6 w - - 0 1';
  assert.deepEqual(bigThreats(fen, 'w'), []);
});

test('지킴 없이 노려지면 위험', () => {
  const fen = 'r3k3/8/8/8/8/8/8/R5K1 w - - 0 1';
  assert.deepEqual(bigThreats(fen, 'w'), [{ square: 'a1', type: 'r' }]);
});

test('알림은 새로 위험해진 말 하나, 같은 말은 다시 말하지 않는다', () => {
  const fen = '4k3/8/4p3/3Q4/4P3/8/8/4K3 w - - 0 1';
  const a = threatNote(fen, 'w', []);
  assert.equal(a.text.ko, '호랑이가 노려지고 있어요');
  assert.deepEqual(a.said, ['d5']);
  const b = threatNote(fen, 'w', a.said);
  assert.equal(b.text, null);
  const start = threatNote('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'w', []);
  assert.equal(start.text, null);
});

test('호랑이와 코뿔소가 함께 새로 위험하면 호랑이부터', () => {
  // 백 퀸 d5(흑 룩 a5 가 노림)·룩 h4(흑 룩 h8 이 노림), 둘 다 지킴 없음.
  const fen = '4k2r/8/8/r2Q4/7R/8/8/K7 w - - 0 1';
  const n = threatNote(fen, 'w', []);
  assert.equal(n.square, 'd5');
  assert.ok(n.said.includes('h4'));
});
