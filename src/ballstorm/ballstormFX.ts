/**
 * ballstormFX.ts — High-Performance Screen Juice & Camera FX
 *
 * Implements the bypass-state pattern reverse-engineered from pong3d (fx.js):
 *  - Screen shake with high-frequency harmonic decay
 *  - Chromatic flash & screen pulse
 *  - Slow-motion timescale multiplier
 *  - Direct per-frame camera manipulation without React state re-rendering
 */

import * as THREE from 'three';

export interface FXState {
  shake: number;         // 0..1 current shake energy
  flash: number;         // 0..1 screen flash intensity
  pulse: number;         // 0..1 FOV shockwave punch
  slowUntil: number;     // timestamp ms
  slowFactor: number;    // 0..1
}

export const fx: FXState = {
  shake: 0,
  flash: 0,
  pulse: 0,
  slowUntil: 0,
  slowFactor: 1.0,
};

/**
 * Add shake energy (additive up to 1.0)
 */
export function kickShake(amount: number): void {
  fx.shake = Math.min(1.2, fx.shake + amount);
}

/**
 * Trigger a screen flash pulse
 */
export function kickFlash(amount: number = 0.8): void {
  fx.flash = Math.min(1.0, fx.flash + amount);
}

/**
 * Trigger a camera FOV recoil punch (hits in and eases back)
 */
export function kickPunch(amount: number = 0.5): void {
  fx.pulse = Math.min(1.0, fx.pulse + amount);
}

/**
 * Trigger dynamic slow-motion (e.g. for high-tier merges or fever finish)
 */
export function triggerSlowMo(durationMs: number = 600, factor: number = 0.35): void {
  fx.slowUntil = performance.now() + durationMs;
  fx.slowFactor = factor;
}

/**
 * Apply per-frame camera shake and FOV adjustment, then decay energies
 */
export function updateFX(
  camera: THREE.PerspectiveCamera,
  basePos: THREE.Vector3,
  baseFov: number,
  dt: number,
): void {
  const now = performance.now();

  // 1. Camera Shake (using harmonic sine + noise from REA breakout3d L383)
  if (fx.shake > 0.005) {
    const t = now * 0.035;
    const offsetMag = fx.shake * 0.16;
    camera.position.x = basePos.x + (Math.sin(t * 1.7) * 0.7 + (Math.random() - 0.5) * 0.6) * offsetMag;
    camera.position.y = basePos.y + (Math.cos(t * 1.3) * 0.7 + (Math.random() - 0.5) * 0.6) * offsetMag;
    camera.position.z = basePos.z + (Math.sin(t * 2.1) * 0.4) * offsetMag;

    // Decay shake energy smoothly
    fx.shake = Math.max(0, fx.shake - dt * 3.2);
  } else {
    camera.position.lerp(basePos, Math.min(1, dt * 10));
    fx.shake = 0;
  }

  // 2. FOV Punch
  if (fx.pulse > 0.01) {
    camera.fov = baseFov - fx.pulse * 5.0;
    camera.updateProjectionMatrix();
    fx.pulse = Math.max(0, fx.pulse - dt * 4.5);
  } else if (camera.fov !== baseFov) {
    camera.fov = baseFov;
    camera.updateProjectionMatrix();
  }

  // 3. Screen Flash decay
  if (fx.flash > 0.01) {
    fx.flash = Math.max(0, fx.flash - dt * 2.8);
  } else {
    fx.flash = 0;
  }

  // 4. Slow motion decay check
  if (now > fx.slowUntil) {
    fx.slowFactor = 1.0;
  }
}
