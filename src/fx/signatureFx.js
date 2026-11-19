// Signature captures (dynamic-chess plan DY-1 §4.1, 2026-11-06): each animal takes in its own way, so a player sees
// who took as well as what was taken. Meerkat — two big stars pop up; kangaroo — a dust arc kicked along its path;
// panda — bamboo leaves drift down; rhino — the ground cracks and shakes; tiger — three claw streaks; lion — roar
// rings. Looks only: the capture's timing (impactTier.js IMPACT_TIERS) is not touched, everything runs alongside it.
// Each kind is hidden while idle, so the board's draw calls (gate ≤ 100) do not change between captures.
import * as THREE from 'three';

/** The comic word each attacker shouts, at the size of the capture's tier. */
export const SIGNATURE_WORD = { pawn: '뽁!', knight: '퍽!', bishop: '쿵!', rook: '쾅!', queen: '샤악!', king: '어흥!' };
/** Seconds each signature stays on screen (real time). All end within 0.9 s, inside the capture's own clip. */
export const SIGNATURE_SECONDS = { pawn: 0.7, knight: 0.6, bishop: 0.9, rook: 0.5, queen: 0.35, king: 0.6 };

function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.quadraticCurveTo(0.55, 0, 0, 1);
  s.quadraticCurveTo(-0.55, 0, 0, -1);
  return new THREE.ShapeGeometry(s, 4);
}

function crackTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(70, 44, 20, 0.9)';
  g.lineCap = 'round';
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 7; i++) {
    let a = (i / 7) * Math.PI * 2 + rnd() * 0.5;
    let x = 128;
    let y = 128;
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      a += (rnd() - 0.5) * 0.9;
      const len = 14 + rnd() * 14;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      g.lineTo(x, y);
      g.lineWidth = Math.max(2, 9 - k * 1.6);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A small instanced particle kind: one draw call while any are alive, none while idle. */
function particleKind(scene, geometry, material, max) {
  const mesh = new THREE.InstancedMesh(geometry, material, max);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.count = max;
  scene.add(mesh);
  const live = new Array(max).fill(null);
  let next = 0;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (let i = 0; i < max; i++) mesh.setMatrixAt(i, m.makeScale(0, 0, 0));
  return {
    add(b) { live[next] = b; next = (next + 1) % max; mesh.visible = true; },
    update(dt) {
      let any = false;
      for (let i = 0; i < max; i++) {
        const b = live[i];
        if (!b) continue;
        b.age += dt;
        if (b.age >= b.life) { live[i] = null; mesh.setMatrixAt(i, m.makeScale(0, 0, 0)); continue; }
        any = true;
        b.vy -= b.gravity * dt;
        b.x += b.vx * dt; b.y = Math.max(b.floor, b.y + b.vy * dt); b.z += b.vz * dt;
        if (b.sway) b.x += Math.sin(b.age * 7 + b.phase) * b.sway * dt;
        b.spin += b.spinV * dt;
        const k = Math.min(1, (b.life - b.age) / 0.18) * Math.min(1, b.age / 0.05 + 0.3);
        e.set(b.tilt, b.spin, b.spin * 0.6);
        mesh.setMatrixAt(i, m.compose(p.set(b.x, b.y, b.z), q.setFromEuler(e), s.set(b.size * k, b.size * k, b.size * k * (b.flat ?? 1))));
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = any;
    },
    mesh
  };
}

/**
 * `fx` is the impact effects (ring, label, shake, sparks colours come from there). `surfaceY` is the board top.
 * Returns { play(pos, attackerType, tierId, from), update(dt), enabled }.
 */
export function createSignatureFx(scene, fx, { surfaceY, square }) {
  const starGeo = new THREE.OctahedronGeometry(1, 0);
  const stars = particleKind(scene, starGeo, new THREE.MeshBasicMaterial({ color: 0xffe14d }), 8);
  const dust = particleKind(scene, new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: 0xd9c08f, transparent: true, opacity: 0.85 }), 24);
  const leaves = particleKind(scene, leafGeometry(), new THREE.MeshBasicMaterial({ color: 0x6cc24a, side: THREE.DoubleSide }), 16);

  const crack = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: crackTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  crack.rotation.x = -Math.PI / 2;
  crack.visible = false;
  crack.renderOrder = 2;
  scene.add(crack);
  let crackAge = -1;

  const claws = new THREE.Group();
  const clawMat = new THREE.MeshBasicMaterial({ color: 0xfff1f5, transparent: true, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.055, 1), clawMat);
    streak.position.x = (i - 1) * 0.14;
    streak.rotation.z = -0.5;
    claws.add(streak);
  }
  claws.visible = false;
  claws.renderOrder = 21;
  scene.add(claws);
  let clawAge = -1;

  // The board's outline pass would draw these a second time; they are effects, not pieces.
  for (const mat of [stars.mesh.material, dust.mesh.material, leaves.mesh.material, crack.material, clawMat]) {
    mat.userData = { outlineParameters: { visible: false } };
  }
  const roars = [];   // pending roar rings: { at, pos }
  let enabled = true;

  function play(pos, attackerType, tierId, from) {
    if (!enabled) return false;
    const x = pos.x, z = pos.z, y = surfaceY;
    const rnd = Math.random;
    if (attackerType === 'pawn') {
      for (let i = 0; i < 2; i++) {
        stars.add({ x: x + (i ? 0.06 : -0.06), y: y + 0.32, z, vx: (i ? 0.25 : -0.25), vy: 1.25, vz: 0, gravity: 2.6, floor: y + 0.05,
          size: 0.055, spin: 0, spinV: 7, tilt: 0, age: 0, life: 0.7 });
      }
    } else if (attackerType === 'knight') {
      // A fan of dust thrown forward along the kangaroo's path.
      const dx = from ? x - from.x : 0, dz = from ? z - from.z : 1;
      const len = Math.hypot(dx, dz) || 1;
      const base = Math.atan2(dz / len, dx / len);
      for (let i = 0; i < 14; i++) {
        const a = base + (i / 13 - 0.5) * 1.6;
        const sp = 0.7 + rnd() * 0.5;
        dust.add({ x, y: y + 0.04, z, vx: Math.cos(a) * sp, vy: 0.35 + rnd() * 0.3, vz: Math.sin(a) * sp, gravity: 1.4, floor: y + 0.02,
          size: 0.03 + rnd() * 0.025, spin: rnd() * 6, spinV: 2, tilt: 0, age: 0, life: 0.45 + rnd() * 0.15 });
      }
    } else if (attackerType === 'bishop') {
      for (let i = 0; i < 12; i++) {
        const a = rnd() * Math.PI * 2;
        leaves.add({ x: x + Math.cos(a) * 0.1, y: y + 0.45 + rnd() * 0.2, z: z + Math.sin(a) * 0.1, vx: Math.cos(a) * 0.25, vy: 0.25, vz: Math.sin(a) * 0.25,
          gravity: 0.7, floor: y + 0.02, sway: 0.5, phase: rnd() * 6, size: 0.045, flat: 1, spin: rnd() * 6, spinV: 4 + rnd() * 3,
          tilt: 0.6, age: 0, life: 0.75 + rnd() * 0.15 });
      }
    } else if (attackerType === 'rook') {
      // Above the shock ring's height (+0.012) so the board top does not hide it; wider than the piece's base disc.
      crack.position.set(x, y + 0.016, z);
      crack.scale.setScalar(square * 1.6);
      crack.rotation.z = rnd() * Math.PI * 2;
      crack.material.opacity = 1;
      crack.visible = true;
      crackAge = 0;
      fx.shake(tierId === 'small' ? 0.014 : 0.02);
    } else if (attackerType === 'queen') {
      claws.position.set(x, y + 0.32, z);
      claws.children.forEach((c) => { c.scale.y = 0.01; });
      claws.visible = true;
      clawAge = 0;
    } else if (attackerType === 'king') {
      for (let i = 0; i < 3; i++) roars.push({ at: i * 0.12, pos: new THREE.Vector3(x, y, z) });
    }
    return true;
  }

  function update(dt, camera) {
    stars.update(dt);
    dust.update(dt);
    leaves.update(dt);
    if (crackAge >= 0) {
      crackAge += dt;
      const u = crackAge / 0.5;
      crack.material.opacity = u < 0.6 ? 1 : Math.max(0, (1 - u) / 0.4);
      if (u >= 1) { crack.visible = false; crackAge = -1; }
    }
    if (clawAge >= 0) {
      clawAge += dt;
      if (camera) claws.quaternion.copy(camera.quaternion);   // the streaks face the player
      claws.children.forEach((c, i) => {
        const u = Math.min(1, Math.max(0, (clawAge - i * 0.05) / 0.12));
        c.scale.y = 0.01 + u * 0.62;
      });
      clawMat.opacity = clawAge < 0.22 ? 1 : Math.max(0, 1 - (clawAge - 0.22) / 0.13);
      if (clawAge >= 0.35) { claws.visible = false; clawAge = -1; }
    }
    for (let i = roars.length - 1; i >= 0; i--) {
      roars[i].at -= dt;
      if (roars[i].at <= 0) { fx.ring(roars[i].pos, 'medium'); roars.splice(i, 1); }
    }
  }

  return {
    play,
    update,
    setEnabled: (on) => { enabled = Boolean(on); },
    isEnabled: () => enabled
  };
}
