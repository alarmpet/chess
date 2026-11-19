// Bounty pieces (objective-layer OL-1): the count follows the piece, the claim pays whoever takes it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { BOUNTY_FROM, bountyAcorns, bountyMarks, bountyOver, bountyStep, newBounty } from '../src/cards/bounty.js';

const play = (...sans) => {
  const chess = new Chess();
  for (const san of sans) chess.move(san);
  return chess.history({ verbose: true });
};

test('acorns grow with the captures and stop at ten', () => {
  assert.equal(bountyAcorns(1), 0);
  assert.equal(bountyAcorns(BOUNTY_FROM), 4);
  assert.equal(bountyAcorns(3), 6);
  assert.equal(bountyAcorns(9), 10);
});

test('a piece wears a bounty after its second capture, and taking it pays the taker', () => {
  // Knights trade on e5: each side made one capture, so nobody wears a bounty.
  const moves = play('e4', 'e5', 'Nf3', 'Nc6', 'Nxe5', 'Nxe5', 'd4', 'Nc6', 'd5', 'Nb8', 'Bc4', 'Nf6');
  const s = newBounty();
  for (const m of moves) bountyStep(s, m);
  assert.deepEqual(bountyMarks(s), [], 'one capture each is no bounty yet');

  const more = play('e4', 'e5', 'Nf3', 'd6', 'Nxe5', 'dxe5', 'd4', 'exd4', 'Qxd4', 'Qxd4');
  const t = newBounty();
  const steps = more.map((m) => bountyStep(t, m));
  // Black's pawn took on e5 then on d4: that pawn wore the bounty, and white's queen took it.
  assert.deepEqual(steps[7].marked, { sq: 'd4', captures: 2 });
  assert.deepEqual(steps[8].claimed, { by: 'w', captures: 2, acorns: 4, sq: 'd4' });
  // Black's queen took the queen: one capture, no bounty.
  assert.equal(steps[9].claimed, null);
  assert.deepEqual(bountyOver(more), { w: 4, b: 0, claims: [steps[8].claimed] });
});

test('the count rides along through en passant and castling', () => {
  // White's e-pawn takes on d5, then takes c5 en passant: its second capture, with the count moved along.
  const ep = play('e4', 'd5', 'exd5', 'c5', 'dxc6');
  const s = newBounty();
  const last = ep.map((m) => bountyStep(s, m)).at(-1);
  assert.deepEqual(last.marked, { sq: 'c6', captures: 2 }, 'en passant counts as the second capture');

  const castle = play('e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O');
  const c = newBounty();
  c.on.h1 = 3;   // a rook that had made captures (set by hand: castling never follows a rook capture this early)
  for (const m of castle) bountyStep(c, m);
  assert.equal(c.on.f1, 3);
  assert.equal(c.on.h1, undefined);
});
