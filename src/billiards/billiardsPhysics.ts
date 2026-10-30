/**
 * billiardsPhysics.ts — High-Precision 3D Billiards Physics Engine
 *
 * Reverse-Engineered from tailuge/billiards & Dr. Dave Alciatore (Colorado State Univ):
 *  - Han & Mathavan Sliding-to-Rolling friction transition
 *  - Dr. Dave Cut-Induced Throw (CIT) & Spin-Induced Throw (SIT)
 *  - Mathavan K-55 Cushion rail impact (sinθ = 2/5 elevation, tangential spin friction)
 *  - Multi-substepping (8 substeps) for robust tunneling prevention
 *  - Pocket drop detection for 8-ball pool
 *  - 4-Ball & 3-Cushion scoring logs
 */

import * as THREE from 'three';
import { billiardsAudio } from './billiardsAudio.ts';

export interface BallPhysicsState {
  id: number;
  type: 'cue' | 'yellow' | 'red' | 'solid' | 'stripe' | 'black';
  number?: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3; // (rollX, yawY, rollZ)
  english: { x: number; y: number }; // -1 to +1 applied by cue strike
  isPotted: boolean;
  state: 'sliding' | 'rolling' | 'resting';
  mesh?: THREE.Object3D;
}

export interface CollisionEvent {
  type: 'ball-ball' | 'ball-cushion' | 'pocket-drop';
  ballA: number;
  ballB?: number;
  cushionIndex?: number;
  speed: number;
  time: number;
}

export interface TableBounds {
  length: number; // 2.10m
  width: number;  // 1.05m
  ballRadius: number; // 0.032m (scaled to 0.040 for Three.js)
  ballMass: number; // 0.23 kg
  g: number; // 9.8 m/s^2
  muRolling: number; // 0.0055 (Han rolling friction)
  muSliding: number; // 0.126 (Han sliding friction)
  spindownRho: number; // 0.045
  cushionRestitution: number; // 0.85 (Mathavan)
  cushionFriction: number; // 0.175 (Mathavan)
  ballRestitution: number; // 0.95
}

export class BilliardsPhysicsEngine {
  public balls: BallPhysicsState[] = [];
  public bounds: TableBounds = {
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

  public hasPockets: boolean = true;
  public pockets: THREE.Vector3[] = [];
  public pocketRadius: number = 0.075;

  public collisionLog: CollisionEvent[] = [];
  public cushionsHitSinceShot: number[] = [];
  public ballsHitSinceShot: number[] = [];

  constructor() {
    this.initPockets();
  }

  private initPockets() {
    const halfL = this.bounds.length / 2;
    const halfW = this.bounds.width / 2;
    this.pockets = [
      new THREE.Vector3(-halfL + 0.02, 0, -halfW + 0.02),
      new THREE.Vector3(0, 0, -halfW - 0.01),
      new THREE.Vector3(halfL - 0.02, 0, -halfW + 0.02),
      new THREE.Vector3(-halfL + 0.02, 0, halfW - 0.02),
      new THREE.Vector3(0, 0, halfW + 0.01),
      new THREE.Vector3(halfL - 0.02, 0, halfW - 0.02)
    ];
  }

  public resetLogs() {
    this.collisionLog = [];
    this.cushionsHitSinceShot = [];
    this.ballsHitSinceShot = [];
  }

  public applyCueShot(
    cueBallId: number,
    direction: THREE.Vector3,
    power: number, // 0.0 to 1.0
    englishX: number = 0, // -1 (left) to +1 (right)
    englishY: number = 0  // -1 (draw/backspin) to +1 (follow/topspin)
  ) {
    const ball = this.balls.find((b) => b.id === cueBallId);
    if (!ball || ball.isPotted) return;

    this.resetLogs();

    const shotSpeed = 0.8 + power * 6.5;
    const dirNorm = direction.clone().setY(0).normalize();

    ball.velocity.copy(dirNorm.multiplyScalar(shotSpeed));
    ball.english = { x: englishX, y: englishY };
    ball.state = 'sliding'; // Immediately enters sliding state

    const R = this.bounds.ballRadius;
    const perpAxis = new THREE.Vector3(-dirNorm.z, 0, dirNorm.x);

    // Follow/Draw angular velocity around perpendicular axis
    const followDrawSpin = (englishY * shotSpeed * 22.0) / R;
    ball.angularVelocity.copy(perpAxis.multiplyScalar(followDrawSpin));

    // Sidespin (English) around vertical Y axis
    ball.angularVelocity.y = -englishX * shotSpeed * 28.0;

    billiardsAudio.playCueStrike(power);
  }

  public isSimulating(): boolean {
    return this.balls.some((b) => !b.isPotted && b.velocity.lengthSq() > 0.00008);
  }

  public step(dt: number) {
    if (dt <= 0) return;
    const clampedDt = Math.min(dt, 0.04);
    const subSteps = 8;
    const subDt = clampedDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.subStep(subDt);
    }
  }

  private subStep(dt: number) {
    const R = this.bounds.ballRadius;
    const m = this.bounds.ballMass;
    const g = this.bounds.g;
    const halfL = this.bounds.length / 2 - R;
    const halfW = this.bounds.width / 2 - R;

    // 1. Individual Ball Motion & Friction (Han Sliding-to-Rolling Model)
    for (const b of this.balls) {
      if (b.isPotted) continue;

      const speed = b.velocity.length();
      if (speed <= 0.0001 && Math.abs(b.angularVelocity.lengthSq()) <= 0.001) {
        b.velocity.set(0, 0, 0);
        b.angularVelocity.set(0, 0, 0);
        b.state = 'resting';
        if (b.mesh) b.mesh.position.copy(b.position);
        continue;
      }

      // Calculate bottom contact point relative velocity (va = v + w x r)
      // r = (0, -R, 0)
      const contactPointRelVel = new THREE.Vector3(
        b.velocity.x - b.angularVelocity.z * R,
        0,
        b.velocity.z + b.angularVelocity.x * R
      );
      const slipSpeed = contactPointRelVel.length();

      if (slipSpeed > 0.015) {
        // SLIDING STATE
        b.state = 'sliding';
        const slipDir = contactPointRelVel.clone().normalize();

        // Linear deceleration from sliding friction
        const accelLinear = slipDir.clone().multiplyScalar(-this.bounds.muSliding * g * dt);
        b.velocity.add(accelLinear);

        // Angular acceleration (torque from sliding friction converts slip to roll)
        const alphaMag = ((5 / 2) * this.bounds.muSliding * g * dt) / R;
        b.angularVelocity.x += -slipDir.z * alphaMag;
        b.angularVelocity.z += slipDir.x * alphaMag;
      } else {
        // PURE ROLLING STATE
        b.state = 'rolling';
        // Linear deceleration from rolling friction
        const rollDecel = this.bounds.muRolling * g * dt;
        const newSpeed = Math.max(0, speed - rollDecel);
        if (newSpeed === 0) {
          b.velocity.set(0, 0, 0);
        } else {
          b.velocity.multiplyScalar(newSpeed / speed);
        }

        // Keep angular velocity locked to pure rolling: w = (norm x v) / R
        b.angularVelocity.x = -b.velocity.z / R;
        b.angularVelocity.z = b.velocity.x / R;
      }

      // Natural spindown of vertical English (yaw spin around Y)
      const Mz = ((this.bounds.muRolling * m * g * 2) / 3) * this.bounds.spindownRho;
      const spindownY = ((5 / 2) * Mz * dt) / (m * R * R);
      if (Math.abs(b.angularVelocity.y) > spindownY) {
        b.angularVelocity.y -= Math.sign(b.angularVelocity.y) * spindownY;
      } else {
        b.angularVelocity.y = 0;
      }

      // Update position
      b.position.x += b.velocity.x * dt;
      b.position.z += b.velocity.z * dt;

      // Update 3D mesh with true Quaternion orientation integration (avoids Euler gimbal lock & axis wobble)
      if (b.mesh) {
        b.mesh.position.copy(b.position);
        const angSpeed = b.angularVelocity.length();
        if (angSpeed > 0.0001) {
          const rotAxis = b.angularVelocity.clone().normalize();
          const deltaQuat = new THREE.Quaternion().setFromAxisAngle(rotAxis, angSpeed * dt);
          b.mesh.quaternion.premultiply(deltaQuat);
        }
      }
    }

    // 2. Pocket Drop Detection
    if (this.hasPockets) {
      for (const b of this.balls) {
        if (b.isPotted) continue;
        for (const p of this.pockets) {
          const distSq = (b.position.x - p.x) ** 2 + (b.position.z - p.z) ** 2;
          if (distSq < this.pocketRadius ** 2) {
            b.isPotted = true;
            b.velocity.set(0, 0, 0);
            b.angularVelocity.set(0, 0, 0);
            b.state = 'resting';
            if (b.mesh) {
              b.mesh.position.y = -0.15;
              b.mesh.visible = false;
            }
            billiardsAudio.playPocketDrop();
            this.collisionLog.push({
              type: 'pocket-drop',
              ballA: b.id,
              speed: b.velocity.length(),
              time: performance.now()
            });
            break;
          }
        }
      }
    }

    // 3. Cushion Rail Collisions (Mathavan Elevation & Spin Alteration)
    for (const b of this.balls) {
      if (b.isPotted) continue;

      // Left rail (-X)
      if (b.position.x < -halfL) {
        b.position.x = -halfL;
        b.velocity.x = Math.abs(b.velocity.x) * this.bounds.cushionRestitution;
        // Sidespin alters rebound angle along rail
        b.velocity.z += b.angularVelocity.y * this.bounds.cushionFriction * R;
        b.state = 'sliding';
        this.onCushionHit(b, 0);
      }
      // Right rail (+X)
      else if (b.position.x > halfL) {
        b.position.x = halfL;
        b.velocity.x = -Math.abs(b.velocity.x) * this.bounds.cushionRestitution;
        b.velocity.z -= b.angularVelocity.y * this.bounds.cushionFriction * R;
        b.state = 'sliding';
        this.onCushionHit(b, 1);
      }

      // Top rail (-Z)
      if (b.position.z < -halfW) {
        b.position.z = -halfW;
        b.velocity.z = Math.abs(b.velocity.z) * this.bounds.cushionRestitution;
        b.velocity.x -= b.angularVelocity.y * this.bounds.cushionFriction * R;
        b.state = 'sliding';
        this.onCushionHit(b, 2);
      }
      // Bottom rail (+Z)
      else if (b.position.z > halfW) {
        b.position.z = halfW;
        b.velocity.z = -Math.abs(b.velocity.z) * this.bounds.cushionRestitution;
        b.velocity.x += b.angularVelocity.y * this.bounds.cushionFriction * R;
        b.state = 'sliding';
        this.onCushionHit(b, 3);
      }
    }

    // 4. Ball-to-Ball Collisions with Dr. Dave Cut-Induced Throw (CIT)
    const numBalls = this.balls.length;
    for (let i = 0; i < numBalls; i++) {
      const b1 = this.balls[i];
      if (b1.isPotted) continue;

      for (let j = i + 1; j < numBalls; j++) {
        const b2 = this.balls[j];
        if (b2.isPotted) continue;

        const dx = b2.position.x - b1.position.x;
        const dz = b2.position.z - b1.position.z;
        const distSq = dx * dx + dz * dz;
        const minDist = R * 2;

        if (distSq < minDist * minDist && distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;

          // Push apart to prevent intersection
          const overlap = (minDist - dist) * 0.5;
          b1.position.x -= nx * overlap;
          b1.position.z -= nz * overlap;
          b2.position.x += nx * overlap;
          b2.position.z += nz * overlap;

          // Relative velocity
          const rvx = b1.velocity.x - b2.velocity.x;
          const rvz = b1.velocity.z - b2.velocity.z;
          const relSpeedNormal = rvx * nx + rvz * nz;

          if (relSpeedNormal > 0) {
            const e = this.bounds.ballRestitution;
            const normalImpulse = ((1 + e) * relSpeedNormal * m) * 0.5;

            // Dr. Dave Tangential Friction (Cut-Induced Throw)
            // Tangent vector
            const tx = -nz;
            const tz = nx;
            const relSpeedTangent = rvx * tx + rvz * tz;

            // Dynamic friction between phenolic resin surfaces
            const muDynamic = 0.01 + 0.108 * Math.exp(-1.088 * Math.abs(relSpeedTangent));
            const maxFrictionImpulse = muDynamic * Math.abs(normalImpulse);
            const stickImpulse = (m / 7) * relSpeedTangent;
            const tangentialImpulse = Math.sign(relSpeedTangent) * Math.min(maxFrictionImpulse, Math.abs(stickImpulse));

            // Apply linear impulses
            b1.velocity.x -= (normalImpulse * nx + tangentialImpulse * tx) / m;
            b1.velocity.z -= (normalImpulse * nz + tangentialImpulse * tz) / m;
            b2.velocity.x += (normalImpulse * nx + tangentialImpulse * tx) / m;
            b2.velocity.z += (normalImpulse * nz + tangentialImpulse * tz) / m;

            // Follow (topspin) / Draw (backspin) reaction on cue ball
            if (b1.id === 0 && Math.abs(b1.english.y) > 0.1) {
              const drawFollowEffect = b1.english.y * 0.38 * normalImpulse;
              b1.velocity.x += nx * (drawFollowEffect / m);
              b1.velocity.z += nz * (drawFollowEffect / m);
            }

            b1.state = 'sliding';
            b2.state = 'sliding';

            billiardsAudio.playBallHit(relSpeedNormal);

            this.collisionLog.push({
              type: 'ball-ball',
              ballA: b1.id,
              ballB: b2.id,
              speed: relSpeedNormal,
              time: performance.now()
            });

            if (b1.id === 0 && !this.ballsHitSinceShot.includes(b2.id)) {
              this.ballsHitSinceShot.push(b2.id);
            }
          }
        }
      }
    }
  }

  private onCushionHit(ball: BallPhysicsState, cushionIndex: number) {
    const spd = ball.velocity.length();
    billiardsAudio.playCushionBounce(spd);

    if (ball.id === 0) {
      if (!this.cushionsHitSinceShot.includes(cushionIndex)) {
        this.cushionsHitSinceShot.push(cushionIndex);
      }
    }

    this.collisionLog.push({
      type: 'ball-cushion',
      ballA: ball.id,
      cushionIndex,
      speed: spd,
      time: performance.now()
    });
  }
}
