import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { BilliardsPhysicsEngine } from '../src/billiards/billiardsPhysics.ts';
import {
  buildBilliardsTable,
  buildCueStick,
  buildOverheadLamp,
  createBallTexture,
  createResinBallMaterial
} from '../src/billiards/billiardsAssets.ts';
import { billiardsAudio } from '../src/billiards/billiardsAudio.ts';

test('Billiards Physics Engine creates correct table bounds and sub-step simulation', () => {
  const physics = new BilliardsPhysicsEngine();
  assert.equal(physics.bounds.length, 2.10);
  assert.equal(physics.bounds.width, 1.05);
  assert.equal(physics.pockets.length, 6);

  // Add test ball
  const testBall = {
    id: 0,
    type: 'cue',
    position: new THREE.Vector3(0, physics.bounds.ballRadius, 0),
    velocity: new THREE.Vector3(1.0, 0, 0),
    angularVelocity: new THREE.Vector3(0, 0, 0),
    english: { x: 0, y: 0 },
    isPotted: false,
    state: 'sliding'
  };
  physics.balls.push(testBall);

  // Step physics
  assert.equal(physics.isSimulating(), true);
  physics.step(0.016);
  assert.ok(testBall.position.x > 0, 'Ball should have moved along +X');
});

test('Billiards Assets Module constructs 3D table, cue stick, and lamps', () => {
  const bounds = {
    length: 2.10,
    width: 1.05,
    ballRadius: 0.040,
    ballMass: 0.23,
    g: 9.8,
    muRolling: 0.0055,
    muSliding: 0.126,
    spindownRho: 0.045,
    cushionRestitution: 0.85,
    cushionFriction: 0.175,
    ballRestitution: 0.95
  };

  const table = buildBilliardsTable(bounds, true, 'tournamentBlue');
  assert.ok(table.tableGroup, 'Missing table group');
  assert.ok(table.feltMesh, 'Missing felt mesh');
  assert.equal(table.cushionMeshes.length, 4, 'Should have 4 cushion meshes');

  const cue = buildCueStick();
  assert.ok(cue.cueGroup, 'Missing cue group');
  assert.ok(cue.tipMesh, 'Missing cue tip');

  const lamp = buildOverheadLamp(bounds.length);
  assert.ok(lamp, 'Missing overhead lamp');
});

test('Billiards Audio Engine exports expected sound trigger methods', () => {
  assert.ok(typeof billiardsAudio.playBallHit === 'function');
  assert.ok(typeof billiardsAudio.playCueStrike === 'function');
  assert.ok(typeof billiardsAudio.playCushionBounce === 'function');
  assert.ok(typeof billiardsAudio.playPocketDrop === 'function');
  assert.ok(typeof billiardsAudio.playChalk === 'function');
});
