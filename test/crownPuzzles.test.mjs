// 한 방 퍼즐(IR-3): 만든 문제 전부가 검사를 통과하는가, 검사가 틀린 문제를 잡는가, 놓친 왕관을 기보에서 찾는가.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { CROWN_PUZZLES } from '../src/rules/crownPuzzleData.js';
import { missedCrown, moveText, parseMoves, practiceSet, puzzlePosition, puzzleProblem, solves } from '../src/rules/crownPuzzles.js';
import { emptyContractStore, sanitizeContractStore, addContractResult } from '../src/rules/contractGame.js';

test('만든 문제는 모두 검사를 통과한다 — 답이 꼭 하나, 체크 아님, 고를 다른 잡기가 있다', () => {
  assert.ok(CROWN_PUZZLES.length >= 12, `문제 수 ${CROWN_PUZZLES.length}`);
  const ids = new Set();
  for (const p of CROWN_PUZZLES) {
    assert.equal(puzzleProblem(p), null, `${p.id}: ${puzzleProblem(p)}`);
    assert.ok(!ids.has(p.id), `같은 이름 ${p.id}`);
    ids.add(p.id);
    const pos = puzzlePosition(p);
    const captures = pos.chess.moves({ verbose: true }).filter((m) => m.captured);
    assert.ok(captures.length >= 2, `${p.id}: 잡기가 답 하나뿐이면 고를 것이 없다`);
    // 답을 두면 그 색의 계약이 완성된다
    assert.ok(solves(pos.answers, p.answer.slice(0, 2), p.answer.slice(2, 4)));
  }
});

test('첫 연습 세 문제 — 백이 두고, 보석 종류가 폰·나이트·비숍으로 서로 다르다', () => {
  const three = practiceSet(CROWN_PUZZLES);
  assert.equal(three.length, 3);
  assert.deepEqual(three.map((p) => p.color), ['w', 'w', 'w']);
  assert.deepEqual(three.map((p) => p.gem), ['p', 'n', 'b']);
  assert.equal(new Set(three.map((p) => p.id)).size, 3);
  // 문제가 모자라면 있는 만큼만
  assert.equal(practiceSet(CROWN_PUZZLES.filter((p) => p.color === 'w').slice(0, 2)).length, 2);
  assert.equal(practiceSet([]).length, 0);
});

test('검사는 틀린 문제를 잡는다', () => {
  const good = CROWN_PUZZLES[0];
  assert.equal(puzzleProblem({ ...good, color: good.color === 'w' ? 'b' : 'w' }), '둘 차례가 적힌 색과 다르다');
  assert.equal(puzzleProblem({ ...good, answer: 'a1a2' }), '적힌 답이 결정타가 아니다');
  assert.equal(puzzleProblem({ ...good, gem: good.gem === 'p' ? 'n' : 'p' }), '적힌 보석 종류가 다르다');
  assert.equal(puzzleProblem({ ...good, set: 'nope' }), '세트가 없거나 기보를 둘 수 없다');
  assert.equal(puzzleProblem({ ...good, moves: 'e2e5' }), '세트가 없거나 기보를 둘 수 없다');
  // 결정타가 없는 국면(첫 수 직후)
  assert.match(puzzleProblem({ set: 'p2nb', color: 'b', moves: 'e2e4', answer: 'e7e5', gem: 'p' }), /0개/);
  // 답을 이미 둔 국면은 끝난 판이다
  assert.equal(puzzleProblem({ ...good, moves: `${good.moves} ${good.answer}` }), '이미 계약이 완성된 국면');
});

test('기보 글자 — 모양이 틀리면 null, 승급 글자를 읽는다', () => {
  assert.deepEqual(parseMoves('e2e4 e7e8q'), [{ from: 'e2', to: 'e4' }, { from: 'e7', to: 'e8', promotion: 'q' }]);
  assert.deepEqual(parseMoves(''), []);
  assert.equal(parseMoves('e2e9'), null);
  assert.equal(parseMoves('e2-e4'), null);
  assert.equal(parseMoves(null), null);
  assert.equal(moveText({ from: 'a7', to: 'a8', promotion: 'n' }), 'a7a8n');
});

test('놓친 왕관 — 결정타가 있었는데 다른 수를 둔 마지막 차례를 찾는다', () => {
  const p = CROWN_PUZZLES.find((x) => x.color === 'w');
  const pos = puzzlePosition(p);
  const chess = pos.chess;
  const other = chess.moves({ verbose: true }).find((m) => !solves(pos.answers, m.from, m.to) && !m.captured);
  chess.move(other);
  const before = chess.history({ verbose: true }).length - 1;
  // 결정타를 지나친 직후: 그 차례가 잡힌다
  let found = missedCrown(p.set, chess.history({ verbose: true }), 'w');
  assert.equal(found.ply, before);
  assert.equal(found.moves, p.moves);
  assert.deepEqual(found.answers, [p.answer]);
  assert.equal(found.color, 'w');
  // 돌려받은 국면은 그대로 열린다 — 답이 같다
  assert.deepEqual(puzzlePosition(found).answers.map(moveText), [p.answer]);
  // 결정타를 뒀으면 그 차례는 놓친 것이 아니다 — 그 앞의 기보에서 찾은 것과 같다(봇 판이라 더 앞에서 지나친 적이 있을 수 있다)
  const took = new Chess();
  for (const m of parseMoves(`${p.moves} ${p.answer}`)) took.move(m);
  const earlier = missedCrown(p.set, took.history({ verbose: true }).slice(0, before), 'w');
  assert.deepEqual(missedCrown(p.set, took.history({ verbose: true }), 'w'), earlier);
  assert.ok(!earlier || earlier.ply < before);
  // 상대 색의 차례는 세지 않는다
  assert.notEqual(missedCrown(p.set, chess.history({ verbose: true }), 'b')?.ply, before);
  // 결정타가 없던 판 · 모르는 세트
  const plain = new Chess();
  for (const san of ['e4', 'e5', 'Nf3', 'Nc6']) plain.move(san);
  assert.equal(missedCrown('p2nb', plain.history({ verbose: true }), 'w'), null);
  assert.equal(missedCrown('nope', plain.history({ verbose: true }), 'w'), null);
});

test('연습 표시는 전용 기록에 남고, 판 결과를 더해도 지워지지 않는다', () => {
  assert.equal(emptyContractStore().practice, 0);
  assert.equal(sanitizeContractStore({ v: 1, practice: 1 }).practice, 1);
  assert.equal(sanitizeContractStore({ v: 1, practice: 'yes' }).practice, 1);
  assert.equal(sanitizeContractStore({ v: 1 }).practice, 0);
  const after = addContractResult({ ...emptyContractStore(), practice: 1 }, { set: 'p2nb', result: 'loss', reason: 'contract', plies: 20 });
  assert.equal(after.practice, 1);
  assert.equal(after.games, 1);
});
