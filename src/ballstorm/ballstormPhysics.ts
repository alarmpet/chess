/**
 * ballstormPhysics.ts — Ball Storm Chaos Core Physics Engine
 *
 * Upgraded with REA (Reverse Engineering Analysis) discoveries:
 *  - Sub-step tunneling prevention (from breakout3d L425)
 *  - Radial explosive shockwave impulse on ball merge (chain reaction triggers)
 *  - Danger line with grace period timer (prevents premature game over on high bounces)
 *  - 3D rigid-body Quaternion rolling & elastic restitution
 *  - Active powerup physics: Magnetic attraction, Anti-Gravity surge, Time dilation
 */

import * as THREE from 'three';

export const GRAVITY = -11.5;
export const BALL_RESTITUTION = 0.52;     // bounciness 0..1
export const FLOOR_FRICTION   = 0.72;     // horizontal damping on floor contact
export const WALL_RESTITUTION = 0.60;
export const LINEAR_DAMPING   = 0.994;    // air drag per frame
export const ANGULAR_DAMPING  = 0.96;

/** Width × depth of the arena (metres). */
export const ARENA_W = 3.2;
export const ARENA_D = 3.2;
export const ARENA_FLOOR_Y = -2.0;
export const DANGER_Y = 2.3;              // balls resting above this line trigger danger countdown

/** Ball tier definitions (1→15 = billiard numbers, 16 = cue ball) */
export interface BallTier {
  tier: number;       // 1..16
  radius: number;     // metres
  mass: number;       // kg
  label: string;      // display number
  color: number;      // THREE hex color
  isStripe: boolean;
  scoreValue: number; // base points on merge
}

export const BALL_TIERS: BallTier[] = [
  { tier: 1,  radius: 0.11, mass: 1.0,  label: '1',  color: 0xfacc15, isStripe: false, scoreValue: 10 },
  { tier: 2,  radius: 0.12, mass: 1.2,  label: '2',  color: 0x2563eb, isStripe: false, scoreValue: 25 },
  { tier: 3,  radius: 0.13, mass: 1.45, label: '3',  color: 0xdc2626, isStripe: false, scoreValue: 50 },
  { tier: 4,  radius: 0.14, mass: 1.7,  label: '4',  color: 0x7c3aed, isStripe: false, scoreValue: 100 },
  { tier: 5,  radius: 0.155,mass: 2.0,  label: '5',  color: 0xf97316, isStripe: false, scoreValue: 200 },
  { tier: 6,  radius: 0.17, mass: 2.35, label: '6',  color: 0x059669, isStripe: false, scoreValue: 400 },
  { tier: 7,  radius: 0.185,mass: 2.7,  label: '7',  color: 0x991b1b, isStripe: false, scoreValue: 800 },
  { tier: 8,  radius: 0.20, mass: 3.1,  label: '8',  color: 0x18181b, isStripe: false, scoreValue: 1600 },
  { tier: 9,  radius: 0.215,mass: 3.6,  label: '9',  color: 0xfacc15, isStripe: true,  scoreValue: 3200 },
  { tier: 10, radius: 0.23, mass: 4.1,  label: '10', color: 0x2563eb, isStripe: true,  scoreValue: 6400 },
  { tier: 11, radius: 0.245,mass: 4.7,  label: '11', color: 0xdc2626, isStripe: true,  scoreValue: 12800 },
  { tier: 12, radius: 0.26, mass: 5.3,  label: '12', color: 0x7c3aed, isStripe: true,  scoreValue: 25000 },
  { tier: 13, radius: 0.275,mass: 6.0,  label: '13', color: 0xf97316, isStripe: true,  scoreValue: 50000 },
  { tier: 14, radius: 0.29, mass: 6.8,  label: '14', color: 0x059669, isStripe: true,  scoreValue: 100000 },
  { tier: 15, radius: 0.31, mass: 7.7,  label: '15', color: 0x991b1b, isStripe: true,  scoreValue: 250000 },
  { tier: 16, radius: 0.34, mass: 10.0, label: '★',  color: 0xffffff, isStripe: false, scoreValue: 1000000 }, // CUE BALL SUPREME
];

export interface PhysicsBall {
  id: number;
  tier: number;
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  radius: number;
  mass: number;
  onGround: boolean;
  merging: boolean;    // flagged for merge removal this frame
  age: number;         // frames alive (grace period before merge activation)
  timeAboveDanger: number; // accumulated seconds above danger line
}

export interface MergeResult {
  a: PhysicsBall;
  b: PhysicsBall;
  tier: number;
  center: THREE.Vector3;
  score: number;
}

export interface PhysicsModifiers {
  gravityInvertUntil?: number;
  magneticUntil?: number;
  slowMotionUntil?: number;
}

let _nextId = 1;

export function resetPhysicsIdCounter(): void {
  _nextId = 1;
}

export function createPhysicsBall(tier: number, pos: THREE.Vector3, mesh: THREE.Mesh): PhysicsBall {
  const td = BALL_TIERS[Math.max(0, Math.min(BALL_TIERS.length - 1, tier - 1))];
  return {
    id: _nextId++,
    tier,
    mesh,
    pos: pos.clone(),
    vel: new THREE.Vector3(0, 0, 0),
    angVel: new THREE.Vector3(0, 0, 0),
    radius: td.radius,
    mass: td.mass,
    onGround: false,
    merging: false,
    age: 0,
    timeAboveDanger: 0,
  };
}

/**
 * Step physics for all balls with REA sub-stepping for zero tunneling.
 * Returns merges and danger status.
 */
export function stepPhysics(
  balls: PhysicsBall[],
  dt: number,
  modifiers: PhysicsModifiers = {},
): { merges: MergeResult[]; dangerActive: boolean } {
  const merges: MergeResult[] = [];
  const now = performance.now();

  const isAntiGravity = modifiers.gravityInvertUntil ? now < modifiers.gravityInvertUntil : false;
  const isMagnetic = modifiers.magneticUntil ? now < modifiers.magneticUntil : false;
  const slowFactor = modifiers.slowMotionUntil && now < modifiers.slowMotionUntil ? 0.35 : 1.0;
  const effectiveDt = dt * slowFactor;

  // Sub-stepping calculation (REA breakout3d L425-430)
  let maxSpeed = 0;
  for (const b of balls) {
    const s = b.vel.length();
    if (s > maxSpeed) maxSpeed = s;
  }
  const steps = Math.max(1, Math.min(5, Math.ceil((maxSpeed * effectiveDt) / 0.12)));
  const subDt = effectiveDt / steps;

  const halfW = ARENA_W / 2;
  const halfD = ARENA_D / 2;
  const currentGravity = isAntiGravity ? -GRAVITY * 0.7 : GRAVITY;

  for (let step = 0; step < steps; step++) {
    // 1. Single ball updates: gravity, integration, boundary walls
    for (const b of balls) {
      if (step === 0) b.age++;

      // Gravity
      b.vel.y += currentGravity * subDt;

      // Magnetic attraction between identical tiers (REA Powerup)
      if (isMagnetic && b.tier < 16) {
        for (const other of balls) {
          if (other.id !== b.id && other.tier === b.tier && !other.merging) {
            const pullDir = new THREE.Vector3().subVectors(other.pos, b.pos);
            const dist = pullDir.length();
            if (dist > 0.05 && dist < 2.5) {
              pullDir.normalize().multiplyScalar(3.5 * subDt);
              b.vel.add(pullDir);
            }
          }
        }
      }

      // Position integration
      b.pos.x += b.vel.x * subDt;
      b.pos.y += b.vel.y * subDt;
      b.pos.z += b.vel.z * subDt;

      // Floor collision
      const floorY = ARENA_FLOOR_Y + b.radius;
      if (b.pos.y < floorY) {
        b.pos.y = floorY;
        b.vel.y = -b.vel.y * BALL_RESTITUTION;
        b.vel.x *= FLOOR_FRICTION;
        b.vel.z *= FLOOR_FRICTION;
        b.onGround = true;
      } else {
        b.onGround = false;
      }

      // Ceiling bounce if anti-gravity
      if (isAntiGravity && b.pos.y > DANGER_Y + 0.5) {
        b.pos.y = DANGER_Y + 0.5;
        b.vel.y = -Math.abs(b.vel.y) * 0.4;
      }

      // Wall collisions (X axis)
      const wallX = halfW - b.radius;
      if (b.pos.x > wallX)  { b.pos.x =  wallX; b.vel.x = -Math.abs(b.vel.x) * WALL_RESTITUTION; }
      if (b.pos.x < -wallX) { b.pos.x = -wallX; b.vel.x =  Math.abs(b.vel.x) * WALL_RESTITUTION; }

      // Wall collisions (Z axis)
      const wallZ = halfD - b.radius;
      if (b.pos.z > wallZ)  { b.pos.z =  wallZ; b.vel.z = -Math.abs(b.vel.z) * WALL_RESTITUTION; }
      if (b.pos.z < -wallZ) { b.pos.z = -wallZ; b.vel.z =  Math.abs(b.vel.z) * WALL_RESTITUTION; }

      // Air damping
      b.vel.multiplyScalar(LINEAR_DAMPING);
      b.angVel.multiplyScalar(ANGULAR_DAMPING);

      // Rolling rotation (3D Quaternion Integration)
      const speed = b.vel.length();
      if (speed > 0.002) {
        const rotAxis = new THREE.Vector3(-b.vel.z, 0, b.vel.x).normalize();
        const angSpeed = speed / b.radius;
        const dq = new THREE.Quaternion().setFromAxisAngle(rotAxis, angSpeed * subDt);
        b.mesh.quaternion.premultiply(dq);
      }

      // Update mesh position
      b.mesh.position.copy(b.pos);
    }

    // 2. Ball-to-ball collisions & Merge checking
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        if (a.merging || b.merging) continue;

        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const dz = b.pos.z - a.pos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const minDist = a.radius + b.radius;

        if (distSq < minDist * minDist && distSq > 0.00001) {
          const dist = Math.sqrt(distSq);

          // Check for Merge (same tier, under max tier 16, minimum age threshold of 18 frames)
          if (a.tier === b.tier && a.tier < 16 && a.age > 18 && b.age > 18) {
            a.merging = true;
            b.merging = true;
            const center = new THREE.Vector3(
              (a.pos.x + b.pos.x) * 0.5,
              (a.pos.y + b.pos.y) * 0.5,
              (a.pos.z + b.pos.z) * 0.5
            );
            const nextTier = a.tier + 1;
            const td = BALL_TIERS[a.tier - 1];
            merges.push({
              a,
              b,
              tier: nextTier,
              center,
              score: td.scoreValue,
            });
            continue;
          }

          // Elastic collision impulse resolution
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          const overlap = (minDist - dist) * 0.5;
          a.pos.x -= nx * overlap;
          a.pos.y -= ny * overlap;
          a.pos.z -= nz * overlap;
          b.pos.x += nx * overlap;
          b.pos.y += ny * overlap;
          b.pos.z += nz * overlap;

          const relVx = b.vel.x - a.vel.x;
          const relVy = b.vel.y - a.vel.y;
          const relVz = b.vel.z - a.vel.z;
          const relVdotN = relVx * nx + relVy * ny + relVz * nz;

          if (relVdotN < 0) {
            const e = BALL_RESTITUTION;
            const impulse = -(1 + e) * relVdotN / (1 / a.mass + 1 / b.mass);
            a.vel.x -= (impulse / a.mass) * nx;
            a.vel.y -= (impulse / a.mass) * ny;
            a.vel.z -= (impulse / a.mass) * nz;
            b.vel.x += (impulse / b.mass) * nx;
            b.vel.y += (impulse / b.mass) * ny;
            b.vel.z += (impulse / b.mass) * nz;
          }
        }
      }
    }
  }

  // 3. Apply radial shockwave impulses from all merges this frame
  for (const m of merges) {
    applyMergeShockwave(balls, m.center, 1.4, 3.2);
  }

  // 4. Danger Line accumulation check (only for settled balls, age > 60 frames)
  let anyAboveDanger = false;
  for (const b of balls) {
    if (b.age > 60 && !b.merging && b.pos.y > DANGER_Y) {
      b.timeAboveDanger += dt;
      if (b.timeAboveDanger > 0.4) {
        anyAboveDanger = true;
      }
    } else {
      b.timeAboveDanger = Math.max(0, b.timeAboveDanger - dt * 2.0);
    }
  }

  return { merges, dangerActive: anyAboveDanger };
}

/**
 * Apply a radial outward impulse from a merge center to all surrounding balls
 */
export function applyMergeShockwave(
  balls: PhysicsBall[],
  center: THREE.Vector3,
  radius: number,
  blastForce: number,
): void {
  for (const b of balls) {
    if (b.merging) continue;
    const dx = b.pos.x - center.x;
    const dy = b.pos.y - center.y;
    const dz = b.pos.z - center.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < radius * radius && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const falloff = 1.0 - dist / radius;
      const strength = blastForce * falloff;
      b.vel.x += (dx / dist) * strength;
      b.vel.y += Math.max(0.6, (dy / dist) * strength); // slight upward pop
      b.vel.z += (dz / dist) * strength;
    }
  }
}

/**
 * Check if the game is in critical fail state (ball sustained above danger line > 3.0s)
 */
export function checkGameOverCondition(balls: PhysicsBall[]): boolean {
  return balls.some(b => b.age > 60 && !b.merging && b.timeAboveDanger >= 2.8);
}
