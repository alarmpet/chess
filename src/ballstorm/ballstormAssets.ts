/**
 * ballstormAssets.ts — Ball Storm Chaos: 3D PBR Assets & Procedural Textures
 *
 * Re-uses the Aramith billiard ball texture pipeline + adds:
 *  - Neon Cyberpunk Arena environment map (PMREM-baked)
 *  - Per-tier procedural ball textures (solid / stripe)
 *  - Crystal shard geometry for merge explosion fx
 *  - Neon trail particle system
 *  - Holographic powerup card mesh
 */

import * as THREE from 'three';
import { BALL_TIERS, type BallTier } from './ballstormPhysics.ts';

// ─────────────────────────────────────────────────────────────────
// 1. PMREM Neon Cyber Arena Environment Map
// ─────────────────────────────────────────────────────────────────
export function createCyberArenaEnvMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x050014);

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const addLightPanel = (colorHex: number, intensity: number, pos: number[], scl: number[]) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(intensity)
    });
    const m = new THREE.Mesh(boxGeo, mat);
    m.position.fromArray(pos);
    m.scale.fromArray(scl);
    envScene.add(m);
  };

  // Neon light panels baked into reflections
  addLightPanel(0x7b2fff, 4.0, [0, 6, 0], [4, 0.4, 4]);
  addLightPanel(0x00eeff, 3.5, [-6, 3, 0], [0.4, 2, 6]);
  addLightPanel(0xff007f, 3.5, [ 6, 3, 0], [0.4, 2, 6]);
  addLightPanel(0xffaa00, 2.5, [0, 4, -6], [6, 2, 0.4]);
  addLightPanel(0x38bdf8, 2.0, [0, -3, 0], [8, 0.5, 8]);

  const envMap = pmrem.fromScene(envScene, 0.04).texture;
  boxGeo.dispose();
  pmrem.dispose();
  return envMap;
}

// ─────────────────────────────────────────────────────────────────
// 2. Procedural Ball Texture (2048×1024, Aramith style)
// ─────────────────────────────────────────────────────────────────
function createBallCanvas(td: BallTier): HTMLCanvasElement {
  const W = 1024, H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const r = (td.color >> 16) & 0xff;
  const g = (td.color >> 8)  & 0xff;
  const b = td.color          & 0xff;
  const colorStr = `rgb(${r},${g},${b})`;

  if (td.isStripe) {
    // Stripe: white base with coloured band in middle 30%
    ctx.fillStyle = '#f5f0e0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, H * 0.35, W, H * 0.30);
  } else {
    // Solid: full colour base
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgba(255,255,255,0.18)`);
    bg.addColorStop(0.4, colorStr);
    bg.addColorStop(1, `rgba(0,0,0,0.35)`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // White circle badge in centre
  const cx = W / 2, cy = H / 2, rad = H * 0.22;
  const grd = ctx.createRadialGradient(cx - rad * 0.2, cy - rad * 0.2, rad * 0.05, cx, cy, rad);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.7, '#f0ece0');
  grd.addColorStop(1, '#c8c4b8');
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // Gold ring border
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#c9a227';
  ctx.stroke();

  // Number label
  ctx.font = `bold ${Math.round(rad * 1.05)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = td.tier === 16 ? '#f0ece0' : '#1a1208';
  ctx.fillText(td.label, cx, cy + 2);

  // Specular highlight
  const hl = ctx.createRadialGradient(cx + W * 0.15, cy - H * 0.18, 0, cx + W * 0.15, cy - H * 0.18, rad * 1.4);
  hl.addColorStop(0, 'rgba(255,255,255,0.32)');
  hl.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, W, H);

  return canvas;
}

export const ballTextureCache = new Map<number, THREE.CanvasTexture>();

export function getBallTexture(tier: number): THREE.CanvasTexture {
  if (ballTextureCache.has(tier)) return ballTextureCache.get(tier)!;
  const td = BALL_TIERS[tier - 1];
  const tex = new THREE.CanvasTexture(createBallCanvas(td));
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  ballTextureCache.set(tier, tex);
  return tex;
}

// ─────────────────────────────────────────────────────────────────
// 3. Ball Mesh Factory (PBR MeshPhysicalMaterial)
// ─────────────────────────────────────────────────────────────────
const ballGeomCache = new Map<number, THREE.SphereGeometry>();

export function createBallMesh(tier: number, envMap: THREE.Texture): THREE.Mesh {
  const td = BALL_TIERS[tier - 1];

  if (!ballGeomCache.has(tier)) {
    ballGeomCache.set(tier, new THREE.SphereGeometry(td.radius, 48, 48));
  }
  const geom = ballGeomCache.get(tier)!;

  const mat = new THREE.MeshPhysicalMaterial({
    map: getBallTexture(tier),
    envMap,
    envMapIntensity: 1.1,
    roughness: 0.08,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
    ior: 1.55,
  });

  // CUE BALL special: glowing white crystal
  if (tier === 16) {
    mat.emissive = new THREE.Color(0x7b2fff);
    mat.emissiveIntensity = 0.4;
    mat.transmission = 0.25;
    mat.thickness = 0.08;
    mat.clearcoat = 1.0;
    mat.roughness = 0.02;
  }

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ─────────────────────────────────────────────────────────────────
// 4. Neon Arena Room & Table
// ─────────────────────────────────────────────────────────────────
export function buildCyberArena(scene: THREE.Scene, envMap: THREE.Texture): void {
  // Floor — dark glossy grid
  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512; floorCanvas.height = 512;
  const fctx = floorCanvas.getContext('2d')!;
  fctx.fillStyle = '#050010';
  fctx.fillRect(0, 0, 512, 512);
  fctx.strokeStyle = 'rgba(120,0,255,0.35)';
  fctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += 32) {
    fctx.beginPath(); fctx.moveTo(i, 0); fctx.lineTo(i, 512); fctx.stroke();
    fctx.beginPath(); fctx.moveTo(0, i); fctx.lineTo(512, i); fctx.stroke();
  }
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(4, 4);
  const floorMat = new THREE.MeshPhysicalMaterial({
    map: floorTex, envMap,
    roughness: 0.1, metalness: 0.3, reflectivity: 0.8, color: 0x110022,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.0;
  floor.receiveShadow = true;
  scene.add(floor);

  // Arena container walls (transparent neon glass)
  const wallMat = new THREE.MeshPhysicalMaterial({
    color: 0x7b2fff, envMap,
    transmission: 0.82, roughness: 0.0, metalness: 0.0,
    thickness: 0.05, ior: 1.45, side: THREE.BackSide,
    emissive: new THREE.Color(0x3300ff), emissiveIntensity: 0.15,
  });

  const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.06, 5.0, 3.2), wallMat.clone());
  wallW.position.set(-1.6, 0.5, 0); scene.add(wallW);
  const wallE = wallW.clone(); wallE.position.set( 1.6, 0.5, 0); scene.add(wallE);
  const wallN = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.0, 0.06), wallMat.clone());
  wallN.position.set(0, 0.5, -1.6); scene.add(wallN);
  const wallS = wallN.clone(); wallS.position.set(0, 0.5, 1.6); scene.add(wallS);

  // Neon edge glow strips
  const edgeGeo = new THREE.BoxGeometry(3.2, 0.04, 0.04);
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00eeff });
  [-1.6, 1.6].forEach(z => {
    const e = new THREE.Mesh(edgeGeo, edgeMat);
    e.position.set(0, -2.0, z);
    scene.add(e);
    const el = new THREE.PointLight(0x00eeff, 8, 3);
    el.position.set(0, -1.9, z);
    scene.add(el);
  });

  // Overhead spotlight
  const spotlight = new THREE.SpotLight(0xffffff, 80, 12, Math.PI / 4, 0.3, 1.5);
  spotlight.position.set(0, 6, 0);
  spotlight.target.position.set(0, 0, 0);
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.set(2048, 2048);
  spotlight.shadow.normalBias = 0.02;
  spotlight.shadow.bias = -0.0001;
  spotlight.shadow.radius = 2;
  scene.add(spotlight);
  scene.add(spotlight.target);

  // Ambient purple fill
  scene.add(new THREE.AmbientLight(0x150030, 3.5));

  // Side neon point lights
  [
    { color: 0x7b2fff, pos: [-4, 2, 0] },
    { color: 0x00eeff, pos: [ 4, 2, 0] },
    { color: 0xff007f, pos: [ 0, 2, 4] },
    { color: 0xffaa00, pos: [ 0, 2,-4] },
  ].forEach(({ color, pos }) => {
    const l = new THREE.PointLight(color, 15, 8);
    l.position.set(...pos as [number, number, number]);
    scene.add(l);
  });
}

// ─────────────────────────────────────────────────────────────────
// 5. Merge Explosion — Crystal Shards
// ─────────────────────────────────────────────────────────────────
export interface Shard {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;       // 0..1, decreasing
}

export function createMergeExplosion(scene: THREE.Scene, pos: THREE.Vector3, color: number): Shard[] {
  const shards: Shard[] = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const size = 0.03 + Math.random() * 0.04;
    const geo = new THREE.TetrahedronGeometry(size, 0);
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: 2.5,
      roughness: 0.0,
      metalness: 0.1,
      transmission: 0.5,
      thickness: 0.01,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    // random explosion velocity
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      Math.random() * 5 + 2,
      (Math.random() - 0.5) * 6,
    );
    scene.add(mesh);
    shards.push({ mesh, vel, life: 1.0 });
  }
  return shards;
}

export function stepShards(shards: Shard[], scene: THREE.Scene, dt: number): Shard[] {
  return shards.filter(s => {
    s.life -= dt * 1.2;
    if (s.life <= 0) {
      scene.remove(s.mesh);
      (s.mesh.material as THREE.Material).dispose();
      return false;
    }
    s.vel.y -= 9.8 * dt;
    s.mesh.position.x += s.vel.x * dt;
    s.mesh.position.y += s.vel.y * dt;
    s.mesh.position.z += s.vel.z * dt;
    s.mesh.rotation.x += s.vel.x * dt;
    s.mesh.rotation.z += s.vel.z * dt;
    const m = s.mesh.material as THREE.MeshPhysicalMaterial;
    m.emissiveIntensity = s.life * 2.5;
    s.mesh.scale.setScalar(s.life * 0.9 + 0.1);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────
// 6. Neon Ball Trail
// ─────────────────────────────────────────────────────────────────
export interface TrailPoint { pos: THREE.Vector3; life: number; }

export function createTrailMesh(color: number): THREE.Points {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(30 * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size: 0.06,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

// ─────────────────────────────────────────────────────────────────
// 7. Drop Indicator Line
// ─────────────────────────────────────────────────────────────────
export function createDropIndicator(): THREE.Line {
  const pts = [new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -2, 0)];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({
    color: 0x00eeff,
    dashSize: 0.12,
    gapSize: 0.06,
    transparent: true,
    opacity: 0.55,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  return line;
}

// ─────────────────────────────────────────────────────────────────
// 8. Power-up Card 3D Visual (floating holographic)
// ─────────────────────────────────────────────────────────────────
export function createHolographicCard(label: string, color: number): THREE.Mesh {
  const geo = new THREE.BoxGeometry(0.6, 0.9, 0.02);
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grd = ctx.createLinearGradient(0, 0, 0, 384);
  const r2 = (color >> 16) & 0xff;
  const g2 = (color >> 8)  & 0xff;
  const b2 =  color         & 0xff;
  grd.addColorStop(0, `rgba(${r2},${g2},${b2},0.85)`);
  grd.addColorStop(1, `rgba(${Math.round(r2*0.3)},${Math.round(g2*0.3)},${Math.round(b2*0.3)},0.95)`);
  ctx.fillStyle = grd;
  ctx.roundRect(4, 4, 248, 376, 18);
  ctx.fill();

  // Neon border
  ctx.strokeStyle = `rgba(${r2},${g2},${b2},0.9)`;
  ctx.lineWidth = 4;
  ctx.roundRect(4, 4, 248, 376, 18);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 192);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex,
    transparent: true,
    opacity: 0.9,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide,
    roughness: 0.1,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  return mesh;
}
