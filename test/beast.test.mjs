import test from 'node:test';
import assert from 'node:assert/strict';
import { createBeastMesh } from '../src/beastModels.ts';

const PIECE_TYPES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
const COLORS = ['w', 'b'];

test('Sanctuary Beasts Engine creates valid 3D models for all 6 piece types in both colors', () => {
  for (const type of PIECE_TYPES) {
    for (const color of COLORS) {
      const beast = createBeastMesh(type, color);
      assert.ok(beast, `Failed to create beast for ${type}_${color}`);
      assert.ok(beast.children.length > 0, `Beast ${type}_${color} has no 3D meshes`);
      assert.equal(beast.userData.isSanctuaryBeast, true);
      assert.equal(beast.userData.beastType, type);
      assert.equal(beast.userData.beastColor, color);
    }
  }
});
