/**
 * test/playtest-ballstorm.mjs — Headless simulation of user playtest
 */

import * as THREE from 'three';
import {
  BALL_TIERS,
  createPhysicsBall,
  stepPhysics,
  ARENA_W,
  ARENA_FLOOR_Y,
  DANGER_Y
} from '../src/ballstorm/ballstormPhysics.ts';

console.log('=== BALL STORM PLAYTEST SIMULATION ===');

// 1. Create a dummy scene
const balls = [];

function dropBall(tier, x) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_TIERS[tier - 1].radius), new THREE.MeshBasicMaterial());
  mesh.position.set(x, DANGER_Y + 0.35, 0);
  const pBall = createPhysicsBall(tier, mesh.position, mesh);
  pBall.vel.set(0, -2.0, 0);
  balls.push(pBall);
  console.log(`[DROP] Ball ID=${pBall.id}, Tier=${tier}, X=${x.toFixed(2)}, Y=${pBall.pos.y.toFixed(2)}`);
  return pBall;
}

// Drop first ball (Tier 1 at X=0)
dropBall(1, 0);

// Step 60 frames (1 second)
console.log('\n--- Stepping 60 frames ---');
for (let f = 0; f < 60; f++) {
  const { merges, dangerActive } = stepPhysics(balls, 0.016);
  if (f % 20 === 0) {
    console.log(`Frame ${f}: Ball 1 pos=(${balls[0].pos.x.toFixed(2)}, ${balls[0].pos.y.toFixed(2)}), vel=(${balls[0].vel.x.toFixed(2)}, ${balls[0].vel.y.toFixed(2)})`);
  }
}

// Drop second ball (Tier 1 at same X=0)
console.log('\n--- Dropping second ball at X=0 ---');
dropBall(1, 0);

let merged = false;
for (let f = 60; f < 240; f++) {
  const { merges, dangerActive } = stepPhysics(balls, 0.016);
  if (merges.length > 0) {
    console.log(`[MERGE!] Frame ${f}: ${merges.length} merge(s) detected!`);
    merges.forEach(m => {
      console.log(`  Merged Tier ${m.a.tier} + Tier ${m.b.tier} -> Tier ${m.tier} at (${m.center.x.toFixed(2)}, ${m.center.y.toFixed(2)})`);
    });
    merged = true;
    break;
  }
  if (f % 30 === 0) {
    console.log(`Frame ${f}: Ball count=${balls.length}, B1 Y=${balls[0].pos.y.toFixed(2)}, B2 Y=${balls[1]?.pos.y.toFixed(2)}`);
  }
}

console.log('\n=== PLAYTEST RESULT: Merged?', merged);
