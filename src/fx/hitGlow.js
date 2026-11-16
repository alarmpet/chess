// 겹친 타격 불빛 (그래픽 계획 GX-3, 2026-11-15).
// 맞은 자리에 빛 세 겹이 한꺼번에 난다: 흰 심(번쩍) → 왕국색 네 갈래 별 → 때린 방향으로 튀는 불똥.
// 전부 InstancedMesh 하나(드로우콜 1, 쉴 때는 0)이고 텍스처가 없다 — 모양은 조각 셰이더가 그린다. 더하기 합성이라 겹칠수록 밝다.
// 늦게 받는 묶음이다: 첫 화면에 필요 없다.
import * as THREE from 'three';
import { GLOW_TIERS } from './impactTier.js';

const CAP = 96;
const GRAVITY = 2.4;

export function createHitGlow(scene, { square = 0.34 } = {}) {
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const aShape = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 4), 4).setUsage(THREE.DynamicDrawUsage);   // 크기, 회전, 종류(0 심 · 1 별 · 2 불똥), 밝기
  const aTint = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', aPos);
  geo.setAttribute('aShape', aShape);
  geo.setAttribute('aTint', aTint);
  geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `
      attribute vec3 aPos; attribute vec4 aShape; attribute vec3 aTint;
      varying vec2 vUv; varying float vKind; varying float vGain; varying vec3 vTint;
      void main() {
        vUv = uv * 2.0 - 1.0; vKind = aShape.z; vGain = aShape.w; vTint = aTint;
        float c = cos(aShape.y), s = sin(aShape.y);
        vec2 corner = vec2(position.x * c - position.y * s, position.x * s + position.y * c) * aShape.x;
        vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
        mv.xy += corner;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec2 vUv; varying float vKind; varying float vGain; varying vec3 vTint;
      void main() {
        float r = length(vUv);
        float a;
        if (vKind < 0.5) { a = smoothstep(1.0, 0.0, r); a *= a; }                                   // 심: 부드러운 원
        else if (vKind < 1.5) {                                                                    // 별: 네 갈래
          vec2 q = abs(vUv);
          float arm = max(0.0, 1.0 - (q.x * q.y) * 60.0) * smoothstep(1.0, 0.1, r);
          a = arm * arm * arm + smoothstep(0.3, 0.0, r) * 0.5;
        } else { a = smoothstep(1.0, 0.2, r); }                                                    // 불똥: 작은 점
        a *= vGain;
        if (a < 0.004) discard;
        gl_FragColor = vec4(mix(vTint, vec3(1.0), smoothstep(0.55, 0.0, r) * 0.7) * a, a);
      }`
  });
  mat.userData = { outlineParameters: { visible: false } };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'hit-glow';
  mesh.frustumCulled = false;
  mesh.renderOrder = 18;
  mesh.visible = false;
  scene.add(mesh);

  const live = [];
  const tint = new THREE.Color();
  let hits = 0;
  const add = (o) => { if (live.length >= CAP) live.shift(); live.push(o); };

  /** pos: 맞은 자리(판 위), dir: 때린 방향(x, z — 없으면 사방), tierId: small|medium|big, color: 왕국색 */
  function hit(pos, dir, tierId, color) {
    const tier = GLOW_TIERS[tierId] || GLOW_TIERS.small;
    const k = tier.scale * square;
    tint.set(color);
    const y = pos.y + square * 0.55;
    hits += 1;
    add({ x: pos.x, y, z: pos.z, vx: 0, vy: 0, vz: 0, kind: 0, size: k * 1.1, grow: 1.5, rot: 0, spin: 0, life: 0.1, total: 0.1, r: 1, g: 1, b: 1, gain: 0.7 });
    add({ x: pos.x, y, z: pos.z, vx: 0, vy: 0, vz: 0, kind: 1, size: k * 3.2, grow: 1.45, rot: Math.random() * 1.5, spin: 2.2, life: 0.24, total: 0.24, r: tint.r, g: tint.g, b: tint.b, gain: 1 });
    const len = dir ? Math.hypot(dir.x, dir.z) : 0;
    for (let i = 0; i < tier.sparks; i++) {
      // 때린 방향을 중심으로 부채꼴(±50도), 방향이 없으면 사방
      const base = len > 1e-4 ? Math.atan2(dir.z, dir.x) : Math.random() * Math.PI * 2;
      const a = base + (len > 1e-4 ? (Math.random() - 0.5) * 1.75 : 0);
      const sp = (1.1 + Math.random() * 1.5) * square * 3;
      const life = 0.22 + Math.random() * 0.2;
      add({ x: pos.x, y, z: pos.z, vx: Math.cos(a) * sp, vy: (0.5 + Math.random() * 1.1) * square * 3, vz: Math.sin(a) * sp, kind: 2,
        size: k * (0.16 + Math.random() * 0.14), grow: 0.4, rot: 0, spin: 0, life, total: life, r: tint.r, g: tint.g, b: tint.b, gain: 1 });
    }
    mesh.visible = true;
  }

  /** 실제 시간으로 돈다: 멈춤(히트스톱) 동안에도 빛은 퍼진다. */
  function update(dt) {
    if (!live.length) { if (mesh.visible) { mesh.visible = false; geo.instanceCount = 0; } return; }
    let n = 0;
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      p.life -= dt;
      if (p.life <= 0) { live.splice(i, 1); continue; }
      if (p.kind === 2) { p.vy -= GRAVITY * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
      p.rot += p.spin * dt;
    }
    for (const p of live) {
      const u = 1 - p.life / p.total;                    // 0 → 1
      const ease = 1 - (1 - u) ** 3;
      aPos.setXYZ(n, p.x, p.y, p.z);
      aShape.setXYZW(n, p.size * (1 + (p.grow - 1) * ease), p.rot, p.kind, p.gain * (1 - u) ** (p.kind === 0 ? 1 : 1.6));
      aTint.setXYZ(n, p.r, p.g, p.b);
      n += 1;
    }
    geo.instanceCount = n;
    aPos.needsUpdate = aShape.needsUpdate = aTint.needsUpdate = true;
    if (!n) mesh.visible = false;
  }

  return { hit, update, state: () => ({ hits, live: live.length, visible: mesh.visible }) };
}
