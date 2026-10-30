// Capture effects: star burst, shock ring, comic word, white flash, squash, camera shake.
// The stars are one InstancedMesh, so a burst costs one draw call however many fly.
import * as THREE from 'three';
import { IMPACT_TIERS, PIECE_SPARK } from './impactTier.js';

const MAX_SPARKS = 160;
const GRAVITY = 1.6;
const FX_SETTINGS_KEY = 'wildcrown.fx.v1';

function starGeometry() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 1 : 0.5;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: false });
}

function wordTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.font = '900 96px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = 16;
  g.strokeStyle = '#5a2d0c';
  g.strokeText(text, 128, 66);
  g.fillStyle = '#ffe14d';
  g.fillText(text, 128, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function shakeAllowed() {
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    return JSON.parse(window.localStorage.getItem(FX_SETTINGS_KEY) || '{}').shake !== false;
  } catch (e) {
    return true;
  }
}

export function createImpactFx(scene) {
  const sparks = new THREE.InstancedMesh(starGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff }), MAX_SPARKS);
  sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  sparks.frustumCulled = false;
  sparks.count = 0;
  scene.add(sparks);
  const pool = [];
  let nextSlot = 0;

  const rings = [];
  const wordTex = {};
  const words = [];
  const squashes = [];
  const flashes = [];
  let shakeLeft = 0;
  let shakePower = 0;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const col = new THREE.Color();
  const shakeOffset = new THREE.Vector3();

  function burst(pos, type, tierId) {
    const tier = IMPACT_TIERS[tierId];
    const colors = PIECE_SPARK[type] || PIECE_SPARK.pawn;
    for (let i = 0; i < tier.particles; i++) {
      const slot = nextSlot;
      nextSlot = (nextSlot + 1) % MAX_SPARKS;
      const a = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 0.75;
      pool[slot] = {
        x: pos.x, y: pos.y + 0.12, z: pos.z,
        vx: Math.cos(a) * speed, vy: 0.5 + Math.random() * 1.1, vz: Math.sin(a) * speed,
        life: 0.45 + Math.random() * 0.35, total: 0.8,
        size: 0.03 + Math.random() * 0.03,
        spin: Math.random() * 8, angle: Math.random() * 6
      };
      sparks.setColorAt(slot, col.setHex(colors[i % colors.length]));
    }
    sparks.count = Math.max(sparks.count, Math.min(MAX_SPARKS, pool.length));
    if (sparks.instanceColor) sparks.instanceColor.needsUpdate = true;
  }

  function ring(pos, tierId) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1, 40),
      new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.012, pos.z);
    scene.add(mesh);
    rings.push({ mesh, age: 0, dur: 0.34, size: IMPACT_TIERS[tierId].ring });
  }

  function word(pos, tierId) {
    const tier = IMPACT_TIERS[tierId];
    wordTex[tier.word] ||= wordTexture(tier.word);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: wordTex[tier.word], transparent: true, depthTest: false }));
    sprite.position.set(pos.x, pos.y + 0.3, pos.z);
    sprite.renderOrder = 20;
    scene.add(sprite);
    words.push({ sprite, age: 0, dur: 0.62, size: tier.wordSize });
  }

  // Materials are shared between pieces of a role, so the flash works on this piece's own copies.
  function flash(root) {
    const mats = [];
    root.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      o.material = o.material.clone();
      o.material.emissive = new THREE.Color(0xffffff);
      o.material.emissiveMap = null;
      o.material.emissiveIntensity = 1.4;
      mats.push(o.material);
    });
    flashes.push({ mats, age: 0, dur: 0.16 });
  }

  function squash(root, base, amount, dur) {
    squashes.push({ root, base, amount, age: 0, dur });
  }

  function shake(power) {
    if (!power || !shakeAllowed()) return;
    shakePower = Math.max(shakePower, power);
    shakeLeft = 0.24;
  }

  /** Real time: sparks, rings and words keep flying during the freeze, which is what sells the hit. */
  function update(dt) {
    for (let i = 0; i < pool.length; i++) {
      const b = pool[i];
      if (!b) continue;
      b.life -= dt;
      if (b.life <= 0) {
        sparks.setMatrixAt(i, m.makeScale(0, 0, 0));
        pool[i] = null;
        continue;
      }
      b.vy -= GRAVITY * dt;
      b.x += b.vx * dt;
      b.y = Math.max(0.79, b.y + b.vy * dt);
      b.z += b.vz * dt;
      b.angle += b.spin * dt;
      const k = Math.min(1, b.life / 0.2);
      e.set(b.angle, b.angle * 0.7, 0);
      sparks.setMatrixAt(i, m.compose(p.set(b.x, b.y, b.z), q.setFromEuler(e), s.setScalar(b.size * k)));
    }
    sparks.instanceMatrix.needsUpdate = true;
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.age += dt;
      const u = Math.min(1, r.age / r.dur);
      r.mesh.scale.setScalar(r.size * (0.25 + 0.75 * (1 - (1 - u) ** 3)));
      r.mesh.material.opacity = 1 - u;
      if (u >= 1) {
        scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        rings.splice(i, 1);
      }
    }
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      w.age += dt;
      const u = Math.min(1, w.age / w.dur);
      const pop = u < 0.2 ? 0.4 + (u / 0.2) * 0.85 : 1.25 - Math.min(0.25, (u - 0.2) * 1.2);
      w.sprite.scale.set(w.size * 2 * pop, w.size * pop, 1);
      w.sprite.position.y += dt * 0.12;
      w.sprite.material.opacity = u > 0.7 ? (1 - u) / 0.3 : 1;
      if (u >= 1) {
        scene.remove(w.sprite);
        w.sprite.material.dispose();
        words.splice(i, 1);
      }
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.age += dt;
      const k = Math.max(0, 1 - f.age / f.dur);
      for (const mat of f.mats) mat.emissiveIntensity = 1.4 * k;
      if (k <= 0) flashes.splice(i, 1);
    }
    shakeLeft = Math.max(0, shakeLeft - dt);
    if (shakeLeft > 0) {
      const a = (shakeLeft / 0.24) * shakePower;
      shakeOffset.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
    } else {
      shakeOffset.set(0, 0, 0);
      shakePower = 0;
    }
  }

  /** Game time: the squash holds still during the freeze and springs back after it. */
  function updateGame(dt) {
    for (let i = squashes.length - 1; i >= 0; i--) {
      const q2 = squashes[i];
      q2.age += dt;
      const u = Math.min(1, q2.age / q2.dur);
      const wob = (1 - u) * Math.cos(u * Math.PI * 3) * q2.amount;
      q2.root.scale.set(q2.base * (1 + wob * 0.7), q2.base * (1 - wob), q2.base * (1 + wob * 0.7));
      if (u >= 1) squashes.splice(i, 1);
    }
  }

  return { burst, ring, word, flash, squash, shake, update, updateGame, shakeOffset };
}
