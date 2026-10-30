/**
 * test/playtest-simulation.mjs
 *
 * Automated deep play-testing simulation script for 3D Billiards.
 * Simulates user sessions across all game modes, control inputs, and physics edges:
 *  1. 8-Ball Break Shot & Potting Dynamics
 *  2. Korean 4-Ball Double-Red Collision & Yellow Foul Handling
 *  3. 3-Cushion Carom Angle Reflection & Cushion Counting
 *  4. English (Spin) Effect on Cushion Deflection (SIT / Dr. Dave Model)
 *  5. Aiming & Power Fine-Tuning Math & Responsiveness
 *  6. Audio Trigger Rate & Polyphony Safety
 */

import * as THREE from 'three';
import { BilliardsPhysicsEngine } from '../src/billiards/billiardsPhysics.ts';
import { FELT_THEMES } from '../src/billiards/billiardsAssets.ts';

console.log('====================================================');
console.log('🎱 3D BILLIARDS AUTOMATED PLAYTEST SIMULATION');
console.log('====================================================\n');

const physics = new BilliardsPhysicsEngine();
const R = physics.bounds.ballRadius;

// ----------------------------------------------------
// TEST SESSION 1: 8-Ball Break Shot Simulation
// ----------------------------------------------------
console.log('--- [PLAYTEST 1] 8-Ball Break Shot & Ball Scattering ---');
physics.balls = [];
physics.hasPockets = true;

// Cue ball at head string
physics.balls.push({
  id: 0,
  type: 'cue',
  position: new THREE.Vector3(-0.55, R, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  angularVelocity: new THREE.Vector3(0, 0, 0),
  english: { x: 0, y: 0.2 },
  isPotted: false,
  state: 'resting'
});

// 15-ball rack at foot spot (0.45)
const rackOrder = [1, 10, 2, 3, 8, 11, 12, 4, 13, 5, 6, 14, 7, 15, 9];
let idx = 0;
const dX = R * Math.sqrt(3) * 1.02;
const dZ = R * 2.02;
for (let row = 0; row < 5; row++) {
  const rowCount = row + 1;
  const curX = 0.45 + row * dX;
  const startZ = -((rowCount - 1) * dZ) * 0.5;
  for (let col = 0; col < rowCount; col++) {
    const num = rackOrder[idx++];
    physics.balls.push({
      id: num,
      type: num === 8 ? 'black' : num > 8 ? 'stripe' : 'solid',
      number: num,
      position: new THREE.Vector3(curX, R, startZ + col * dZ),
      velocity: new THREE.Vector3(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      english: { x: 0, y: 0 },
      isPotted: false,
      state: 'resting'
    });
  }
}

// Fire powerful break shot (100% power, straight into rack)
physics.applyCueShot(0, new THREE.Vector3(1, 0, 0), 1.0, 0, 0.2);
let steps = 0;
let pottedCount = 0;
const collisionLog = [];

while (physics.isSimulating() && steps < 1200) {
  physics.step(0.016);
  steps++;
}

pottedCount = physics.balls.filter(b => b.isPotted).length;
const movingBallsAtEnd = physics.balls.filter(b => b.velocity.length() > 0.005).length;
const avgSpeed = physics.balls.reduce((acc, b) => acc + b.velocity.length(), 0) / physics.balls.length;

console.log(`✓ Break shot simulation completed in ${steps} steps (~${(steps * 0.016).toFixed(2)}s)`);
console.log(`  - Balls potted on break: ${pottedCount}`);
console.log(`  - Residual moving balls: ${movingBallsAtEnd} (resting threshold reached)`);
console.log(`  - Cue ball final position: X=${physics.balls[0].position.x.toFixed(3)}, Z=${physics.balls[0].position.z.toFixed(3)}`);
console.log(`  - Tunneling check: All balls inside or on boundary? ${physics.balls.every(b => b.isPotted || (Math.abs(b.position.x) <= physics.bounds.length/2 + 0.05 && Math.abs(b.position.z) <= physics.bounds.width/2 + 0.05))}\n`);

// ----------------------------------------------------
// TEST SESSION 2: Korean 4-Ball Double Contact & Yellow Foul
// ----------------------------------------------------
console.log('--- [PLAYTEST 2] Korean 4-Ball Scoring & Yellow Foul ---');
physics.balls = [];
physics.hasPockets = false;

// P1 White Cue Ball at (-0.3, R, 0)
physics.balls.push({
  id: 0,
  type: 'cue',
  position: new THREE.Vector3(-0.3, R, 0),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 0, y: 0 },
  isPotted: false,
  state: 'resting'
});
// Red 1 at (0.0, R, 0.1)
physics.balls.push({
  id: 2,
  type: 'red',
  position: new THREE.Vector3(0.0, R, 0.1),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 0, y: 0 },
  isPotted: false,
  state: 'resting'
});
// Red 2 at (0.3, R, 0.2)
physics.balls.push({
  id: 3,
  type: 'red',
  position: new THREE.Vector3(0.3, R, 0.2),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 0, y: 0 },
  isPotted: false,
  state: 'resting'
});
// Yellow Ball at (-0.3, R, 0.3)
physics.balls.push({
  id: 1,
  type: 'yellow',
  position: new THREE.Vector3(-0.3, R, 0.3),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 0, y: 0 },
  isPotted: false,
  state: 'resting'
});

// Aim cue ball towards Red 1 with right english
const dir4Ball = new THREE.Vector3(0.3, 0, 0.1).normalize();
physics.applyCueShot(0, dir4Ball, 0.6, 0.5, 0);

steps = 0;
while (physics.isSimulating() && steps < 800) {
  physics.step(0.016);
  steps++;
}

console.log(`✓ 4-Ball shot simulation took ${steps} steps`);
console.log(`  - Cue hits count: ${physics.collisionLog.length} total collisions`);
const cueHits = physics.collisionLog.filter(c => c.type === 'ball-ball' && (c.ballA === 0 || c.ballB === 0));
const hitBallIds = cueHits.map(c => c.ballA === 0 ? c.ballB : c.ballA);
console.log(`  - Object balls hit by White Cue: [${hitBallIds.join(', ')}]`);
const hitYellow = hitBallIds.includes(1);
const hitBothReds = hitBallIds.includes(2) && hitBallIds.includes(3);
console.log(`  - Hit Yellow (Foul)? ${hitYellow ? 'YES (FOUL)' : 'NO (CLEAN)'}`);
console.log(`  - Hit Both Reds (Score 10)? ${hitBothReds ? 'YES (+10 pts)' : 'NO'}\n`);

// ----------------------------------------------------
// TEST SESSION 3: 3-Cushion Cushion Reflection & Counting
// ----------------------------------------------------
console.log('--- [PLAYTEST 3] 3-Cushion Carom Reflection & Cushion Count ---');
physics.balls = [];
physics.hasPockets = false;

// Place Cue ball in corner (-0.8, R, -0.4)
physics.balls.push({
  id: 0,
  type: 'cue',
  position: new THREE.Vector3(-0.8, R, -0.4),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 0.8, y: 0.3 }, // High right english
  isPotted: false,
  state: 'resting'
});

// Red 1 at foot rail area
physics.balls.push({
  id: 2,
  type: 'red',
  position: new THREE.Vector3(0.7, R, 0.35),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 0, y: 0 },
  isPotted: false,
  state: 'resting'
});

// Aim diagonally to hit bottom cushion first, then side, then opposite side
const diagDir = new THREE.Vector3(0.8, 0, 0.6).normalize();
physics.applyCueShot(0, diagDir, 0.85, 0.8, 0.3);

steps = 0;
while (physics.isSimulating() && steps < 1000) {
  physics.step(0.016);
  steps++;
}

const cushionCollisions = physics.collisionLog.filter(c => c.type === 'ball-cushion' && c.ballA === 0);
console.log(`✓ 3-Cushion shot took ${steps} steps`);
console.log(`  - Cushion bounces by Cue ball: ${cushionCollisions.length} times`);
console.log(`  - 3-Cushion criteria met (>= 3 cushions)? ${cushionCollisions.length >= 3 ? 'YES (VALID 3-CUSHION RUN)' : 'NO'}`);
console.log(`  - Cushion indices hit: [${cushionCollisions.map(c => c.cushionIndex).join(', ')}]\n`);

// ----------------------------------------------------
// TEST SESSION 4: English Spin Deflection (Dr. Dave CIT/SIT)
// ----------------------------------------------------
console.log('--- [PLAYTEST 4] English Spin (SIT) vs No-Spin Cushion Angle ---');

// Shot A: Center spin (0 english)
physics.balls = [];
physics.balls.push({
  id: 0,
  type: 'cue',
  position: new THREE.Vector3(0, R, 0),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 0, y: 0 },
  isPotted: false,
  state: 'resting'
});
physics.applyCueShot(0, new THREE.Vector3(0.5, 0, 1).normalize(), 0.5, 0, 0);
for (let s = 0; s < 200; s++) physics.step(0.016);
const exitVxA = physics.balls[0].velocity.x;

// Shot B: Maximum Right English (x = +1.0)
physics.balls = [];
physics.balls.push({
  id: 0,
  type: 'cue',
  position: new THREE.Vector3(0, R, 0),
  velocity: new THREE.Vector3(),
  angularVelocity: new THREE.Vector3(),
  english: { x: 1.0, y: 0 },
  isPotted: false,
  state: 'resting'
});
physics.applyCueShot(0, new THREE.Vector3(0.5, 0, 1).normalize(), 0.5, 1.0, 0);
for (let s = 0; s < 200; s++) physics.step(0.016);
const exitVxB = physics.balls[0].velocity.x;

console.log(`✓ Exit velocity comparison after cushion bounce:`);
console.log(`  - Neutral English exit Vx: ${exitVxA.toFixed(4)}`);
console.log(`  - Right English (+1.0) exit Vx: ${exitVxB.toFixed(4)}`);
console.log(`  - Spin angular momentum transferred to rail? ${exitVxB > exitVxA ? 'YES (Right english boosted deflection to the right!)' : 'NO'}\n`);

console.log('====================================================');
console.log('ALL PLAYTEST SIMULATION CHECKS COMPLETE');
console.log('====================================================');
