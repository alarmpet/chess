// 왕관 계약 세트: 세트 검사, 시드로 고르기, 기보에서 진도 다시 세기.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import {
  CONTRACT_NEED, CONTRACT_SETS, FIRST_GAMES, FIRST_GAMES_SET,
  contractById, contractProblem, contractProgress, pickContract
} from '../src/rules/contractSets.js';

const play = (sans) => { const g = new Chess(); return sans.map((s) => g.move(s)); };

test('풀의 세트는 모두 규칙에 맞는다', () => {
  for (const set of CONTRACT_SETS) assert.equal(contractProblem(set), null, set.id);
  assert.equal(new Set(CONTRACT_SETS.map((s) => s.id)).size, CONTRACT_SETS.length);
});

test('잘못된 세트는 이유와 함께 걸러진다', () => {
  const g = (type, count = 1) => ({ type, count });
  assert.match(contractProblem({ goals: [g('p'), g('n')] }), /셋/);
  assert.match(contractProblem({ goals: [g('p'), g('n'), g('k')] }), /종류/);
  assert.match(contractProblem({ goals: [g('q'), g('n'), g('q')] }), /두 번/);
  assert.match(contractProblem({ goals: [g('q', 2), g('n'), g('p')] }), /수량/);
  assert.match(contractProblem({ goals: [g('p', 9), g('n'), g('b')] }), /수량/);
  assert.match(contractProblem({ goals: [g('p', 0), g('n'), g('b')] }), /수량/);
});

test('첫 두 판은 고정 세트, 그 뒤는 시드 하나로 정해진다', () => {
  for (const roll of [0, 0.4, 0.99]) for (let n = 0; n < FIRST_GAMES; n++) assert.equal(pickContract(roll, n).id, FIRST_GAMES_SET);
  for (const roll of [0, 0.123, 0.5, 0.77, 0.999999]) assert.equal(pickContract(roll, 5).id, pickContract(roll, 9).id);
  // 가중치 2:1:1 — 구간 경계
  assert.equal(pickContract(0, 5).id, 'p2nb');
  assert.equal(pickContract(0.49, 5).id, 'p2nb');
  assert.equal(pickContract(0.5, 5).id, 'pnb');
  assert.equal(pickContract(0.75, 5).id, 'pnr');
  assert.equal(pickContract(1, 5).id, 'pnr');     // 범위를 벗어난 값도 세트 하나를 준다
  assert.equal(pickContract(-1, 5).id, 'p2nb');
});

test('폰×2 는 두 마리를 잡아야 한 칸이고, 더 잡아도 늘지 않는다', () => {
  const set = contractById('p2nb');
  // 백이 폰 셋을 잡는다: exd5, dxc6, cxb7
  const moves = play(['e4', 'd5', 'exd5', 'c6', 'dxc6', 'a6', 'cxb7']);
  const one = contractProgress(set, moves.slice(0, 3));
  assert.deepEqual(one.w.counts, [1, 0, 0]);
  assert.equal(one.w.done, 0);
  assert.equal(one.matchPoint.w, false);
  const two = contractProgress(set, moves.slice(0, 5));
  assert.deepEqual(two.w.counts, [2, 0, 0]);
  assert.equal(two.w.done, 1);
  assert.equal(two.matchPoint.w, true);
  const three = contractProgress(set, moves);
  assert.deepEqual(three.w.counts, [2, 0, 0]);
  assert.equal(three.winner, null);
});

test('목표 둘을 먼저 채운 쪽이 이기고, 그 뒤의 수는 세지 않는다', () => {
  const set = contractById('pnb');
  // 1.e4 d5 2.exd5(폰) Nf6 3.Bb5+ c6 4.dxc6 Nxc6 5.Bxc6+(나이트) — 백이 폰·나이트로 둘
  const moves = play(['e4', 'd5', 'exd5', 'Nf6', 'Bb5+', 'c6', 'dxc6', 'Nxc6', 'Bxc6+', 'bxc6']);
  const p = contractProgress(set, moves);
  assert.equal(p.winner, 'w');
  assert.equal(p.ply, 9);
  assert.equal(p.w.done, CONTRACT_NEED);
  // 흑의 9...bxc6(비숍 잡기)는 끝난 뒤라 세지 않는다. 그 전에 흑은 8...Nxc6 으로 폰 하나.
  assert.deepEqual(p.b.counts, [1, 0, 0]);
});

test('앙파상은 폰 한 마리, 승급한 말은 잡힌 순간의 종류로 센다', () => {
  const set = contractById('pnr');
  const ep = play(['e4', 'a6', 'e5', 'd5', 'exd6']);
  assert.equal(ep[4].flags.includes('e'), true);
  assert.deepEqual(contractProgress(set, ep).w.counts, [1, 0, 0]);
  // 흑 폰이 a1 에서 룩으로 승급한 뒤 잡히면 룩으로 센다
  const g = new Chess('4k3/8/8/8/8/8/p7/1R2K3 b - - 0 1');
  const promo = [g.move({ from: 'a2', to: 'a1', promotion: 'r' }), g.move('Rxa1')];
  assert.equal(promo[1].captured, 'r');
  assert.deepEqual(contractProgress(set, promo).w.counts, [0, 0, 1]);
});

test('목표가 아닌 종류와 잡기 없는 수는 진도를 바꾸지 않는다', () => {
  const set = contractById('pnb');
  const moves = play(['e4', 'e5', 'Qh5', 'Nc6', 'Qxf7+', 'Kxf7']);   // 흑이 퀸을 잡는다 — 목표가 아님
  const p = contractProgress(set, moves);
  assert.deepEqual(p.w.counts, [1, 0, 0]);
  assert.deepEqual(p.b.counts, [0, 0, 0]);
  assert.equal(p.winner, null);
});

// ── 현상 딱지·매치 포인트 무대(PP-1 ②·⑤)가 읽는 두 함수
test('열린 목표와 막: 채운 목표는 빠지고, 한쪽·양쪽·완성으로 막이 바뀌고, 되돌리면 되돌아간다', async () => {
  const { openGoals, contractStage } = await import('../src/rules/contractSets.js');
  const set = contractById('p2nb');
  const line = ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'Nf3', 'Bg4', 'h3', 'Bxf3', 'Qxf3', 'c6', 'Qxf7+'];
  const at = (n) => contractProgress(set, play(line.slice(0, n)));
  // 시작: 셋 다 열림
  assert.deepEqual(openGoals(set, at(0), 'w').map((g) => `${g.type}${g.left}@${g.index}`), ['p2@0', 'n1@1', 'b1@2']);
  assert.equal(contractStage(at(0)), 'open');
  // 폰 하나씩 잡음: 아직 열림, 폰은 하나 남음
  assert.equal(contractStage(at(4)), 'open');
  assert.equal(openGoals(set, at(4), 'w')[0].left, 1);
  // 흑이 나이트를 잡음 → 흑만 하나 남김
  assert.equal(contractStage(at(10)), 'matchPoint');
  assert.deepEqual(openGoals(set, at(10), 'b').map((g) => g.type), ['p', 'b']);
  // 백이 비숍을 잡음 → 양쪽 다 하나 남김(결승점), 백의 비숍 딱지는 사라진다
  assert.equal(contractStage(at(11)), 'finalPoint');
  assert.deepEqual(openGoals(set, at(11), 'w').map((g) => g.type), ['p', 'n']);
  // 되돌리면(기보가 짧아지면) 막도 되돌아간다
  assert.equal(contractStage(at(10)), 'matchPoint');
  // 백이 두 번째 폰을 잡음 → 계약 완성, 딱지는 모두 내려간다
  assert.equal(contractStage(at(13)), 'done');
  assert.equal(at(13).winner, 'w');
  assert.deepEqual(openGoals(set, at(13), 'w'), []);
  assert.deepEqual(openGoals(set, at(13), 'b'), []);
  assert.deepEqual(openGoals(set, null, 'w'), []);
  assert.equal(contractStage(null), 'open');
});
