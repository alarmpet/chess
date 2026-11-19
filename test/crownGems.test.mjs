// 왕관 보석(IR-2): 기보에서 보석을 세는 순서와 나는 자세.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { GEM_FLY_SEC, GEM_POP_SEC, crownGemList, gemFlight, gemPop } from '../src/fx/crownGems.js';
import { contractById, contractProgress } from '../src/rules/contractSets.js';

const play = (sans) => { const c = new Chess(); for (const s of sans) c.move(s); return c.history({ verbose: true }); };

test('보석은 목표를 채운 순서대로, 채운 수의 칸과 반수를 달고 선다', () => {
  const set = contractById('p2nb');
  // 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.Nf3 Bg4 5.h3 Bxf3 6.Qxf3 c6 7.Qxf7+
  const moves = play(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'Nf3', 'Bg4', 'h3', 'Bxf3', 'Qxf3', 'c6', 'Qxf7+']);
  assert.deepEqual(crownGemList(set, moves.slice(0, 9)), { w: [], b: [] });                       // 폰 하나씩 — 아직 보석 없음
  assert.deepEqual(crownGemList(set, moves.slice(0, 10)).b, [{ type: 'n', goal: 1, ply: 10, at: 'f3' }]);
  const at12 = crownGemList(set, moves.slice(0, 12));
  assert.deepEqual(at12.w, [{ type: 'b', goal: 2, ply: 11, at: 'f3' }]);
  const end = crownGemList(set, moves);
  // 백은 비숍을 먼저, 폰 둘을 나중에 채웠다 — 세트 순서(폰·나이트·비숍)가 아니라 채운 순서
  assert.deepEqual(end.w.map((g) => g.type), ['b', 'p']);
  assert.deepEqual(end.w[1], { type: 'p', goal: 0, ply: 13, at: 'f7' });
  // 보석 수는 늘 진도의 채운 목표 수와 같다
  for (let n = 0; n <= moves.length; n++) {
    const list = crownGemList(set, moves.slice(0, n));
    const prog = contractProgress(set, moves.slice(0, n));
    assert.equal(list.w.length, prog.w.done);
    assert.equal(list.b.length, prog.b.done);
  }
});

test('왕관이 완성된 뒤의 잡기는 보석이 되지 않고, 세트가 없으면 빈 목록', () => {
  const set = contractById('p2nb');
  const moves = play(['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'Nf3', 'Bg4', 'h3', 'Bxf3', 'Qxf3', 'c6', 'Qxf7+', 'Kd8', 'Qxf8+', 'Kc7', 'Qxg7', 'Qxa2']);
  const list = crownGemList(set, moves);
  assert.equal(list.w.length, 2);
  assert.equal(list.b.length, 1);      // …Qxa2 는 흑의 두 번째 폰이지만 판은 13반수에 끝났다
  assert.deepEqual(crownGemList(null, moves), { w: [], b: [] });
});

test('나는 보석: 잡은 자리에서 떠서 왕관에 닿고, 박힌 뒤 한 번 튀고 제 크기로', () => {
  assert.deepEqual(gemFlight(0), { mix: 0, lift: 0, scale: 1 });
  const mid = gemFlight(0.5);
  assert.equal(mid.mix, 0.5);
  assert.ok(mid.lift > 0.99 && mid.scale > 1.5);
  const end = gemFlight(1);
  assert.equal(end.mix, 1);
  assert.ok(Math.abs(end.lift) < 1e-9);
  assert.equal(gemFlight(2).mix, 1);                 // 넘쳐도 왕관에 선다
  assert.equal(gemPop(0), 1);
  assert.ok(gemPop(GEM_POP_SEC * 0.4) > 1.2);
  assert.equal(gemPop(GEM_POP_SEC), 1);
  assert.ok(GEM_FLY_SEC <= 1);                        // 다음 수를 오래 막지 않는다
});
