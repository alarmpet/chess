/**
 * test/ballstorm.test.mjs — Ball Storm Chaos Physics & Engine Unit Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  BALL_TIERS,
  createPhysicsBall,
  stepPhysics,
  applyMergeShockwave,
  checkGameOverCondition,
  ARENA_FLOOR_Y,
  DANGER_Y
} from '../src/ballstorm/ballstormPhysics.ts';
import { ALL_CARD_UPGRADES } from '../src/ballstorm/ballstormEngine.ts';

test('BALL_TIERS defines complete 16-tier progression up to Cue Ball Supreme', () => {
  assert.equal(BALL_TIERS.length, 16, 'Must define 16 distinct ball tiers');

  for (let i = 0; i < 15; i++) {
    assert.equal(BALL_TIERS[i].tier, i + 1);
    assert.ok(BALL_TIERS[i].radius < BALL_TIERS[i + 1].radius, `Tier ${i + 1} radius must scale up`);
    assert.ok(BALL_TIERS[i].mass < BALL_TIERS[i + 1].mass, `Tier ${i + 1} mass must scale up`);
    assert.ok(BALL_TIERS[i].scoreValue < BALL_TIERS[i + 1].scoreValue, `Tier ${i + 1} score must scale up`);
  }

  const finalTier = BALL_TIERS[15];
  assert.equal(finalTier.tier, 16);
  assert.equal(finalTier.label, '★');
  assert.equal(finalTier.scoreValue, 1000000, 'Final Cue Ball must give 1,000,000 points');
});

test('Physics engine integrates gravity, floor collision, and ball rolling', () => {
  const dummyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial());
  const initialPos = new THREE.Vector3(0, 0, 0);
  const ball = createPhysicsBall(1, initialPos, dummyMesh);

  assert.equal(ball.pos.y, 0);
  assert.equal(ball.onGround, false);

  // Step 20 frames
  for (let f = 0; f < 20; f++) {
    stepPhysics([ball], 0.016);
  }

  // Ball should have fallen due to gravity
  assert.ok(ball.pos.y < 0, 'Ball should fall under gravity');
  assert.ok(ball.vel.y !== 0, 'Ball should have vertical velocity');

  // Step until it hits the floor
  for (let f = 0; f < 120; f++) {
    stepPhysics([ball], 0.016);
  }

  const expectedFloorY = ARENA_FLOOR_Y + ball.radius;
  assert.ok(
    Math.abs(ball.pos.y - expectedFloorY) < 0.05,
    `Ball should rest near floor ${expectedFloorY}, actual: ${ball.pos.y}`
  );
  assert.equal(ball.onGround, true, 'Ball should be on ground');
});

test('Ball merge mechanism triggers on same-tier collision and produces shockwave', () => {
  const dummyMesh1 = new THREE.Mesh(new THREE.SphereGeometry(0.11), new THREE.MeshBasicMaterial());
  const dummyMesh2 = new THREE.Mesh(new THREE.SphereGeometry(0.11), new THREE.MeshBasicMaterial());

  const b1 = createPhysicsBall(1, new THREE.Vector3(-0.08, -1.8, 0), dummyMesh1);
  const b2 = createPhysicsBall(1, new THREE.Vector3( 0.08, -1.8, 0), dummyMesh2);

  // Age threshold must pass for merge (grace period)
  b1.age = 25;
  b2.age = 25;

  b1.vel.set( 1.5, 0, 0);
  b2.vel.set(-1.5, 0, 0);

  const { merges } = stepPhysics([b1, b2], 0.016);

  assert.equal(merges.length, 1, 'Should trigger 1 merge pair');
  assert.equal(merges[0].tier, 2, 'Merge of Tier 1 + Tier 1 should yield Tier 2');
  assert.ok(merges[0].score > 0, 'Merge should award points');
  assert.ok(Math.abs(merges[0].center.x) < 0.1, 'Merge center should be midpoint between balls');
});

test('Radial shockwave scatters surrounding balls', () => {
  const dummyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshBasicMaterial());
  const bystander = createPhysicsBall(2, new THREE.Vector3(0.5, -1.5, 0), dummyMesh);
  bystander.vel.set(0, 0, 0);

  const blastCenter = new THREE.Vector3(0, -1.5, 0);
  applyMergeShockwave([bystander], blastCenter, 1.5, 5.0);

  assert.ok(bystander.vel.x > 0, 'Bystander should be blasted outward along +X');
  assert.ok(bystander.vel.y > 0, 'Bystander should receive an upward pop');
});

test('Danger line condition correctly detects game over state', () => {
  const dummyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial());
  const normalBall = createPhysicsBall(3, new THREE.Vector3(0, 0, 0), dummyMesh);
  assert.equal(checkGameOverCondition([normalBall]), false);

  const highBall = createPhysicsBall(4, new THREE.Vector3(0, DANGER_Y + 0.2, 0), dummyMesh);
  highBall.age = 100;
  highBall.timeAboveDanger = 3.0; // Exceeded danger threshold

  assert.equal(checkGameOverCondition([highBall]), true, 'Should trigger game over');
});

test('Roguelike Upgrade cards define all 6 strategic powers', () => {
  assert.equal(ALL_CARD_UPGRADES.length, 6, 'Must define 6 Roguelike powerup cards');
  const cardIds = ALL_CARD_UPGRADES.map(c => c.id);
  assert.ok(cardIds.includes('multiball'));
  assert.ok(cardIds.includes('magnetic'));
  assert.ok(cardIds.includes('zero_g'));
  assert.ok(cardIds.includes('mega_bomb'));
  assert.ok(cardIds.includes('chrono_slow'));
  assert.ok(cardIds.includes('danger_purge'));
});
