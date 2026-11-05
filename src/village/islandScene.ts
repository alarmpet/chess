// The village as a tabletop diorama on water (docs/plans/2026-10-31-crown-island-plan.md §7). Everything three.js lives here;
// VillageView only passes saves in and hears about taps. Its own scene, so the chess engine stays untouched while this is open.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createUndersea, SEABED_Y, RIPPLE_GLSL } from './undersea';
import { BUILDINGS, stageForHearts, tenantAnimal, tenantRarity } from './economy.js';
import { villageTiles } from './roster.js';
import { ZONES, zoneOf } from './zones.js';

const FILES = 'abcdefgh';
const SPECIES: Record<string, string> = { king: 'lion', queen: 'tiger', rook: 'rhino', bishop: 'panda', knight: 'kangaroo', pawn: 'meerkat' };
const ROLE_OF: Record<string, string> = { a: 'rook', b: 'knight', c: 'bishop', d: 'queen', e: 'king', f: 'bishop', g: 'knight', h: 'rook' };
export const slotRole = (slot: string) => (slot[3] === '2' || slot[3] === '7' ? 'pawn' : ROLE_OF[slot[2]]);
const squareXZ = (sq: string): [number, number] => [FILES.indexOf(sq[0]) - 3.5, 4.5 - Number(sq[1])];

const INK = [0.17, 0.1, 0.06];              // the outline colour joins the board to the comic ink cards
const NO_OUTLINE = { outlineParameters: { visible: false } };
const DOME_CUT = 0.36;                      // how far up the firefly station's height its brass base reaches
const TILE_TOP = 0.095;                     // the height things stand on

// Yaw turns each model's door towards the opening camera; size is the width it fills on its tile.
const FRONT = Math.PI;                      // TRELLIS leaves the door on the far side of the opening camera
const LOOKS: Record<string, { size: number; yaw: number; hub?: { angle: number; y: number; out: number } }> = {
  house: { size: 1.0, yaw: FRONT },
  bakery: { size: 1.04, yaw: FRONT },
  mill: { size: 0.86, yaw: FRONT, hub: { angle: 0.5, y: 0.8, out: 0.3 } },
  market: { size: 1.02, yaw: FRONT },
  shelter: { size: 1.0, yaw: FRONT },
  power: { size: 0.86, yaw: FRONT },
  spring: { size: 1.02, yaw: FRONT },
  stage: { size: 1.02, yaw: FRONT },
  gate: { size: 1.7, yaw: 0 },
  dock: { size: 1.5, yaw: 0 }
};

const PALETTES = {
  // Shade is lit by the sky part only, so a lavender sky gives shadows a colour of their own and the sunny side stays warm;
  // faces turned down catch the sand and grass under them (folio-2025 shadowColor and light bounce, done with the lights
  // so every material, the TRELLIS models too, gets it at no cost).
  // Under the dome (atlantis plan §3): light comes down through the water, so the sky part is a pale sea green and the sun a soft cyan-white.
  day: { hemiSky: 0xb8ecf0, hemiGround: 0xc2b071, hemi: 1.5, sun: 0xfff0d0, sunPower: 2.4, exposure: 1, glow: 0 },
  night: { hemiSky: 0x3f5fa8, hemiGround: 0x24345a, hemi: 1.25, sun: 0x9db8ff, sunPower: 0.7, exposure: 1.15, glow: 1 }
};

// Stable per-square dither, so a tile keeps its pebbles from one opening to the next.
function seeded(text: string) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
}

const toon = (color: number, roughness = 0.85) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
function mesh(geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, toon(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// How bare each tile level is (villageTiles: grass, worn, path, meadow). It sets how much of the dirt shows through.
const WEAR = [0.06, 0.3, 1, 0];
const BLADES = [60, 20, 0, 45];                  // grass blades per tile at each level, in clumps of five

// Noise shared by the tile tops and the grass, so a blade never grows out of a bare patch.
const GROUND_NOISE = `
float gHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gHash(i), gHash(i + vec2(1, 0)), f.x), mix(gHash(i + vec2(0, 1)), gHash(i + vec2(1, 1)), f.x), f.y);
}
float gBare(vec2 p, float wear) {
  float earth = gNoise(p * 2.3 + 3.0) * 0.7 + gNoise(p * 6.1 + 11.0) * 0.3;
  return smoothstep(0.66 - wear * 0.5, 0.76 - wear * 0.5, earth);
}`;

// The tile tops after three-stylized's terrain and folio-2025's floor (docs/research/2026-11-03-village-detail-rea):
// soft light and dark patches in the grass, bare earth that grows with wear, and flagstones where the path is worn through.
// The noise runs in island space, so patches carry across tile edges and the checker colours still show under them.
function groundShader(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.uWind = grassWind;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
attribute float aWear;
varying float vWear;
varying float vUp;
varying vec2 vGround;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
vWear = aWear;
vUp = normal.y;
vGround = (instanceMatrix * vec4(transformed, 1.0)).xz;`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
varying float vWear;
varying float vUp;
varying vec2 vGround;
uniform float uWind;
${GROUND_NOISE}
${RIPPLE_GLSL}
// Distance to the nearest edge between stones, and which stone this is.
vec2 gStones(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = vec2(x, y);
    vec2 o = c + 0.15 + 0.7 * vec2(gHash(i + c), gHash(i + c + 17.0)) - f;
    float d = dot(o, o);
    if (d < d1) { d2 = d1; d1 = d; id = gHash(i + c + 5.0); } else if (d < d2) d2 = d;
  }
  return vec2(sqrt(d2) - sqrt(d1), id);
}`)
    .replace('#include <color_fragment>', `#include <color_fragment>
{
  float top = smoothstep(0.6, 0.9, vUp);
  float mottle = gNoise(vGround * 1.7) * 0.65 + gNoise(vGround * 4.3 + 7.0) * 0.35;
  vec3 col = diffuseColor.rgb * (0.91 + 0.18 * mottle);
  float bare = gBare(vGround, vWear);
  vec3 dirt = mix(vec3(0.40, 0.25, 0.10), vec3(0.58, 0.38, 0.16), gNoise(vGround * 9.0));
  col = mix(col, dirt, bare * 0.75 * top);
  if (vWear > 0.9) {
    vec2 s = gStones(vGround * 3.4);
    vec3 stone = diffuseColor.rgb * (0.86 + 0.2 * s.y);
    col = mix(col, stone, top * 0.9);
    col = mix(col, diffuseColor.rgb * 0.62, smoothstep(0.08, 0.02, s.x) * top);
  }
  diffuseColor.rgb = col;
}`)
    // Light through the dome glass ripples over the island (atlantis plan §3.2): this file's own noise, not the sea's caustic.
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(0.5, 0.85, 1.0) * uRipple(vGround * 0.9, uWind) * 0.16 * smoothstep(0.6, 0.9, vUp);`);
}

// Grass blades after three-stylized (GrassLayer, shaders.ts): one instanced mesh, two crossing sines for wind with the
// tip moving most, light taken as if every blade faced up so they do not flicker, dark at the root and bright at the tip.
const grassWind = { value: 0 };
const GRASS_DARK = 0.72;
function grassShader(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.uWind = grassWind;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform float uWind;
attribute float aWear;
varying float vTip;
${GROUND_NOISE}`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
vTip = position.y;
vec2 root = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz;
// A blade standing in bare earth on the tile below is not drawn.
transformed *= step(gBare(root, aWear), 0.25);
float bend = position.y * position.y * length(instanceMatrix[1].xyz);
vec2 dir = vec2(0.85, 0.53);
float sway = sin(dot(root, dir) * 3.0 + uWind * 1.1) * 0.22 + sin(dot(root, vec2(-dir.y, dir.x)) * 5.1 + uWind * 0.8) * 0.12;`)
    // Wind pushes in island space, after the blade is placed and turned.
    .replace('#include <project_vertex>', `vec4 mvPosition = instanceMatrix * vec4(transformed, 1.0);
mvPosition.xz += dir * (sway + 0.035) * bend;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
varying float vTip;`)
    .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb *= mix(${GRASS_DARK.toFixed(2)}, 1.12, smoothstep(0.05, 1.0, vTip));`);
}

function grassBlade() {
  const geo = new THREE.PlaneGeometry(1, 1, 1, 4).translate(0, 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setX(i, pos.getX(i) * Math.pow(1 - pos.getY(i), 1.2));
  const up = geo.attributes.normal;
  for (let i = 0; i < up.count; i++) up.setXYZ(i, 0, 1, 0);
  return geo;
}

// Wildflowers after three-stylized (Wildflowers.ts, flowerShapes.ts): crossed cards cut from a small drawn atlas whose
// channels are petal, centre and stem, so one texture gives every colour; the petal colour comes from the instance.
// Three shapes side by side: a daisy, a cluster of little bells and a cup.
function flowerAtlas() {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 64;
  const g = c.getContext('2d')!;
  const stem = (x: number, top: number) => {
    g.strokeStyle = '#0000ff';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x, 64);
    g.quadraticCurveTo(x - 3, 44, x, top);
    g.stroke();
    g.fillStyle = '#0000ff';
    g.beginPath();
    g.ellipse(x + 7, 50, 7, 3, -0.6, 0, Math.PI * 2);
    g.fill();
  };
  const blob = (x: number, y: number, r: number, color: string) => {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  // Big heads on short stems: the island camera looks down on them from far off.
  stem(32, 30);
  for (let k = 0; k < 6; k++) blob(32 + Math.cos(k * 1.047) * 13, 22 + Math.sin(k * 1.047) * 10, 10, '#ff0000');
  blob(32, 22, 7, '#00ff00');
  stem(96, 34);
  for (const [dx, dy, r] of [[-13, 28, 10], [12, 26, 10], [0, 14, 12], [-10, 6, 8], [12, 9, 8]]) blob(96 + dx, dy, r, '#ff0000');
  stem(160, 32);
  g.fillStyle = '#ff0000';
  g.beginPath();
  g.moveTo(141, 6);
  g.lineTo(149, 14);
  g.lineTo(160, 2);
  g.lineTo(171, 14);
  g.lineTo(179, 6);
  g.quadraticCurveTo(181, 36, 160, 38);
  g.quadraticCurveTo(139, 36, 141, 6);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

const FLOWER_CENTRE = '0.95, 0.72, 0.12';
const FLOWER_STEM = '0.26, 0.5, 0.12';
function flowerShader(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.uWind = grassWind;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform float uWind;
attribute float aWear;
attribute float aShape;
${GROUND_NOISE}`)
    .replace('#include <uv_vertex>', `#include <uv_vertex>
vMapUv.x = (vMapUv.x + aShape) / 3.0;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
vec2 root = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xz;
transformed *= step(gBare(root, aWear), 0.25);
float bend = position.y * position.y * length(instanceMatrix[1].xyz);
vec2 dir = vec2(0.85, 0.53);
float sway = (sin(dot(root, dir) * 3.0 + uWind * 1.1) * 0.22 + sin(dot(root, vec2(-dir.y, dir.x)) * 5.1 + uWind * 0.8) * 0.12) * 0.45;`)
    .replace('#include <project_vertex>', `vec4 mvPosition = instanceMatrix * vec4(transformed, 1.0);
mvPosition.xz += dir * (sway + 0.02) * bend;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <map_fragment>', `vec4 petals = texture2D(map, vMapUv);
float cover = petals.r + petals.g + petals.b;
if (cover < 0.5) discard;
diffuseColor.rgb = (vColor * petals.r + vec3(${FLOWER_CENTRE}) * petals.g + vec3(${FLOWER_STEM}) * petals.b) / cover;`)
    .replace('#include <color_fragment>', '')
    // A little light of their own, so a head seen edge-on or in a building's shadow still shows its colour.
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * 0.4 * (petals.r + petals.g) / cover;`);
}

function flowerCard() {
  const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const b = a.clone().rotateY(Math.PI / 2);
  const geo = mergeGeometries([a, b]);
  const up = geo.attributes.normal;
  for (let i = 0; i < up.count; i++) up.setXYZ(i, 0, 1, 0);
  return geo;
}

// A bush as one soft blob: a few balls merged, then every normal bent 85% towards the middle so it shades as one
// rounded mass and not as a pile of balls (folio-2025 Foliage.js:72).
function bushGeometry() {
  const parts = [[0, 0.09, 0, 0.11], [0.09, 0.06, 0.03, 0.08], [-0.08, 0.06, -0.03, 0.085], [0.02, 0.06, -0.08, 0.075]].map(([x, y, z, r]) =>
    new THREE.IcosahedronGeometry(r, 2).translate(x, y, z));
  const geo = mergeGeometries(parts);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const n = new THREE.Vector3();
  const out = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    out.set(pos.getX(i), pos.getY(i) - 0.05, pos.getZ(i)).normalize();
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).lerp(out, 0.85).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

// Wild corners grow in clumps (hexcastle NatureGenerator: a seed square, neighbours joining with less chance the
// further they are, and more when a neighbour already belongs). Bushes and stones keep to the tile edges so the
// middle of every square stays clear to build on and walk across, and a square that gets built on simply loses them.
const NATURE = { clumps: 3, size: 5, bushes: [1, 3], stones: [0, 3] };
export function natureSquares(free: Set<string>, seed: string) {
  const rnd = seeded(seed);
  const near = (sq: string) => {
    const f = FILES.indexOf(sq[0]);
    const r = Number(sq[1]);
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([df, dr]) => `${FILES[f + df] ?? ''}${r + dr}`).filter((n) => free.has(n));
  };
  const rim = [...free].filter((sq) => /[ah]/.test(sq[0]) || /[18]/.test(sq[1]));
  const picked = new Set<string>();
  for (let c = 0; c < NATURE.clumps; c++) {
    const pool = (rim.length ? rim : [...free]).filter((sq) => !picked.has(sq));
    if (!pool.length) break;
    const start = pool[Math.floor(rnd() * pool.length)];
    const clump = [start];
    picked.add(start);
    for (let tries = 0; tries < NATURE.size * 5 && clump.length < NATURE.size; tries++) {
      const from = clump[Math.floor(rnd() * clump.length)];
      const options = near(from).filter((n) => !picked.has(n));
      if (!options.length) continue;
      const weights = options.map((n) => 1 + 0.5 * near(n).filter((m) => picked.has(m)).length);
      let roll = rnd() * weights.reduce((a, b) => a + b, 0);
      const next = options.find((_, i) => (roll -= weights[i]) <= 0) ?? options[0];
      const away = Math.abs(FILES.indexOf(next[0]) - FILES.indexOf(start[0])) + Math.abs(Number(next[1]) - Number(start[1]));
      if (rnd() < Math.max(0.1, 1 - away / NATURE.size)) {
        clump.push(next);
        picked.add(next);
      }
    }
  }
  return [...picked];
}

// Leafy crowns after folio-2025 (Foliage.js:36-87): small leaf cards scattered through a ball, thicker towards the
// middle, each card's normal bent 85% outwards so the crown shades as one soft ball while its edge stays ragged.
// A plain ball inside fills the gaps so it never looks see-through. Only the trees earned in games use it (at most 24).
function leafTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  for (const [x, y, a, s] of [[22, 24, -0.6, 1], [42, 22, 0.5, 0.9], [32, 42, 0.1, 1.1], [16, 44, -1.1, 0.8], [48, 42, 1.0, 0.8]]) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.scale(s, s);
    g.beginPath();
    g.moveTo(0, -13);
    g.quadraticCurveTo(10, 0, 0, 13);
    g.quadraticCurveTo(-10, 0, 0, -13);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crownGeometry(rnd: () => number, cards = 46) {
  const parts: THREE.BufferGeometry[] = [];
  const at = new THREE.Object3D();
  const out = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < cards; i++) {
    const r = 1 - Math.pow(rnd(), 3) * 0.55;          // most cards near the surface, a few deeper in
    out.randomDirection();
    if (out.y < -0.4) out.y = -out.y * 0.5;          // few hang under the crown
    out.normalize();
    at.position.copy(out).multiplyScalar(r);
    at.lookAt(out.clone().multiplyScalar(2));
    at.rotateZ(rnd() * Math.PI * 2);
    at.scale.setScalar(0.55 + rnd() * 0.3);
    at.updateMatrix();
    const card = new THREE.PlaneGeometry(1, 1).applyMatrix4(at.matrix);
    const pos = card.attributes.position;
    const nor = card.attributes.normal;
    for (let k = 0; k < pos.count; k++) {
      n.set(nor.getX(k), nor.getY(k), nor.getZ(k)).lerp(out.set(pos.getX(k), pos.getY(k), pos.getZ(k)).normalize(), 0.85).normalize();
      nor.setXYZ(k, n.x, n.y, n.z);
    }
    parts.push(card);
  }
  return mergeGeometries(parts);
}

const leafSway = (shader: THREE.WebGLProgramParametersWithUniforms) => {
  shader.uniforms.uWind = grassWind;
  shader.vertexShader = `uniform float uWind;
${shader.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>
transformed += normal * sin(uWind * 2.1 + position.x * 7.0 + position.y * 5.0) * 0.035;`);
};

export type IslandEvents = {
  onTile: (sq: string) => void;
  onBuilding: (id: number) => void;
  onActor: (slot: string | null, animal: string) => void;
};

export function createIsland(host: HTMLElement, events: IslandEvents) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(host.clientWidth, host.clientHeight);
  // No shadow map under the dome (atlantis plan AT-5): light in water is soft, and the pass cost a draw per caster.
  // Soft dark spots under buildings, trees and animals stand in for it (contactSpots below).
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.NeutralToneMapping;   // AgX washed the toy colours out, this keeps them
  host.appendChild(renderer.domElement);
  const outline = new OutlineEffect(renderer, { defaultThickness: 0.0024, defaultColor: INK, defaultAlpha: 1, defaultKeepAlive: true });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, host.clientWidth / host.clientHeight, 1, 200);
  let fitFog = (_dist: number) => { /* set once the undersea exists */ };
  let azimuth = Math.PI / 4;
  let azimuthGoal = azimuth;
  // Zoom 1 shows the whole island; ZOOM_MIN brings two or three squares across the screen. Pan moves the point looked at
  // over the island, and the further out the camera is the less room it has, so at zoom 1 it is always centred.
  const PITCH = 0.74;
  const ZOOM_MIN = 0.3;
  // The usual view is the village up close; zoom 1 is the whole dome. Arriving shows the dome first, then closes in
  // (user, 2026-11-05: 「처음 연출만 돔, 그다음 확대해서 마을만 크게」 — grok named 1 building of 8 at zoom 1).
  // A tall phone screen is narrow: closing in as far as on a desktop cut off the island's sides.
  const villageZoom = () => (host.clientWidth / host.clientHeight < 0.8 ? 0.84 : 0.74);
  let zoom = villageZoom();
  let zoomGoal = zoom;
  let usualZoom = zoom;   // the usual view's zoom for the screen shape seen last
  // Pixels of panels over the top of the view (loop strip, note card). On a tall screen the picture is moved down by
  // half of it so the island's far side does not sit under them (AT-9 follow-up, phone).
  let topInset = 0;
  let closeInAt = 0;
  // The dive (atlantis plan AT-2) starts the camera high and steep over the island and lets it settle to the usual view.
  let pitch = PITCH;
  let ease = 10;
  // On arrival the camera first looks up at the chess board's underside above the dome, then tips down onto the island
  // (AT-9 LLM round: all three read "under the board" as 2/5 because the board never showed after the dive).
  let lift = 0;
  const pan = new THREE.Vector2();
  const panGoal = new THREE.Vector2();
  const fitDistance = () => {
    const aspect = host.clientWidth / host.clientHeight;
    const halfH = THREE.MathUtils.degToRad(camera.fov / 2);
    return Math.max(6.7 / Math.tan(halfH), 7.2 / (Math.tan(halfH) * aspect));   // the whole island fits, whatever the window
  };
  const clampPan = (v: THREE.Vector2, z: number) => {
    const room = 4.2 * (1 - z) / (1 - ZOOM_MIN);
    return v.clampScalar(-room, room);
  };
  const placeCamera = () => {
    const dist = fitDistance() * zoom;
    camera.position.set(pan.x + Math.sin(azimuth) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, pan.y + Math.cos(azimuth) * Math.cos(pitch) * dist);
    camera.lookAt(pan.x, -0.85 + lift, pan.y);
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (topInset > 0 && w / h < 1) camera.setViewOffset(w, h, 0, -topInset / 2, w, h);
    else camera.clearViewOffset();
    fitFog(dist);
  };
  placeCamera();

  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(-6, 11, 5);
  scene.add(hemi, sun);

  // The sea around the island is now the deep water around a glass dome (src/village/undersea.ts).
  const undersea = createUndersea(scene, seeded('sea'));
  fitFog = (dist: number) => undersea.fitFog(dist, host.clientHeight * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
  placeCamera();

  const island = new THREE.Group();
  scene.add(island);

  // Land: grass caps over soil blocks. One draw each, and instance colours carry the worn paths.
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  const zoneTint = new THREE.Color();
  const capGeo = new RoundedBoxGeometry(0.985, 0.2, 0.985, 3, 0.07);
  const capWear = new THREE.InstancedBufferAttribute(new Float32Array(64), 1);
  capGeo.setAttribute('aWear', capWear);
  const capMat = toon(0xffffff, 0.95);
  capMat.userData = NO_OUTLINE;
  capMat.onBeforeCompile = groundShader;
  const bladeGeo = grassBlade();
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  bladeMat.userData = NO_OUTLINE;
  bladeMat.onBeforeCompile = grassShader;
  const bushGeo = bushGeometry();
  const bushMat = toon(0xffffff, 0.9);
  bushMat.userData = NO_OUTLINE;
  const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  const stoneMat = toon(0xffffff, 1);
  stoneMat.userData = NO_OUTLINE;
  const flowerGeo = flowerCard();
  const flowerMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: flowerAtlas(), side: THREE.DoubleSide });
  flowerMat.userData = NO_OUTLINE;
  flowerMat.onBeforeCompile = flowerShader;
  const caps = new THREE.InstancedMesh(capGeo, capMat, 64);
  caps.receiveShadow = true;
  caps.castShadow = true;
  const soilGeo = new RoundedBoxGeometry(0.97, 0.8, 0.97, 2, 0.06);
  const soilColors: number[] = [];
  const soilPos = soilGeo.attributes.position;
  for (let i = 0; i < soilPos.count; i++) {
    const k = THREE.MathUtils.mapLinear(soilPos.getY(i), -0.4, 0.4, 0.5, 1);
    soilColors.push(k, k, k);
  }
  soilGeo.setAttribute('color', new THREE.Float32BufferAttribute(soilColors, 3));
  const soilMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1 });
  soilMat.userData = NO_OUTLINE;
  const soil = new THREE.InstancedMesh(soilGeo, soilMat, 64);
  const squares: string[] = [];
  for (let f = 0; f < 8; f++) {
    for (let r = 1; r <= 8; r++) {
      const sq = `${FILES[f]}${r}`;
      const i = squares.length;
      squares.push(sq);
      const rnd = seeded(sq);
      const [x, z] = squareXZ(sq);
      dummy.position.set(x, -0.02 + rnd() * 0.03, z);
      dummy.updateMatrix();
      caps.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, -0.46 - rnd() * 0.05, z);
      dummy.updateMatrix();
      soil.setMatrixAt(i, dummy.matrix);
      soil.setColorAt(i, tint.setHex(0xa8703f).offsetHSL(0, 0, (rnd() - 0.5) * 0.05));
    }
  }
  island.add(soil, caps);

  // Stones and roots on the cut face sell the "slice of ground" look from the concept.
  const rimRnd = seeded('rim');
  const rockGeo = new THREE.DodecahedronGeometry(1, 1);
  const rockMat = toon(0xffffff, 1);
  rockMat.userData = NO_OUTLINE;
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 72);
  for (let i = 0; i < rocks.count; i++) {
    const side = i % 4;
    const along = rimRnd() * 7.8 - 3.9;
    const out = 4 - 0.02 + rimRnd() * 0.05;
    const low = i % 3 === 0;
    dummy.position.set(side === 0 ? along : side === 1 ? along : side === 2 ? out : -out, low ? -0.82 : -0.3 - rimRnd() * 0.4, side === 0 ? out : side === 1 ? -out : along);
    const s = low ? 0.1 + rimRnd() * 0.12 : 0.05 + rimRnd() * 0.07;
    dummy.scale.set(s * 1.3, s, s);
    dummy.rotation.set(rimRnd() * 3, rimRnd() * 3, 0);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, tint.setHex(low ? 0x8f8a80 : 0x6e4a2c).offsetHSL(0, 0, (rimRnd() - 0.5) * 0.08));
  }
  rocks.castShadow = true;
  island.add(rocks);
  // The roots that hung over the cut face were 16 draws (+16 outline) for a detail the island camera barely showed;
  // dropped in the draw-call cut (atlantis plan AT-1).

  // Everything the save decides lands in these groups and is redrawn together.
  const ground = new THREE.Group();
  const marks = new THREE.Group();
  island.add(ground, marks);
  const spinners: THREE.Object3D[] = [];
  const twirlers: THREE.Object3D[] = [];
  const puffs: { m: THREE.Mesh; base: THREE.Vector3; phase: number; rise: number }[] = [];
  const glows: THREE.Object3D[] = [];
  const hitBoxes: THREE.Object3D[] = [];

  const overlayGeo = new THREE.PlaneGeometry(0.92, 0.92);
  overlayGeo.rotateX(-Math.PI / 2);
  const overlayMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false });
  overlayMat.userData = NO_OUTLINE;
  const overlay = new THREE.InstancedMesh(overlayGeo, overlayMat, 64);
  overlay.setColorAt(63, tint.setHex(0xffffff));     // sizes the colour buffer: it is made once, from the count at this moment
  overlay.count = 0;
  overlay.renderOrder = 2;
  overlay.position.y = TILE_TOP + 0.03;
  island.add(overlay);

  const loader = new GLTFLoader();
  const gltfs = new Map<string, Promise<any>>();
  let pendingModels = 0;
  const loadGltf = (url: string) => {
    if (!gltfs.has(url)) {
      pendingModels += 1;
      const p = new Promise((ok, no) => loader.load(url, ok, undefined, no));
      p.finally(() => { pendingModels -= 1; }).catch(() => { /* reported by the caller */ });
      gltfs.set(url, p);
    }
    return gltfs.get(url)!;
  };
  undersea.populate((name: string) => loadGltf(`./packs/legend/sea/${name}.glb`)).catch(() => { /* the reef is scenery */ });

  // Contact spots in place of the shadow map (atlantis plan AT-5): one soft dark disc under every building, tree and animal, one draw.
  const spotCanvas = document.createElement('canvas');
  spotCanvas.width = spotCanvas.height = 64;
  {
    const g = spotCanvas.getContext('2d')!;
    const fade = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    fade.addColorStop(0, 'rgba(255,255,255,1)');
    fade.addColorStop(0.6, 'rgba(255,255,255,0.6)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 64, 64);
  }
  const spotMat = new THREE.MeshBasicMaterial({ alphaMap: new THREE.CanvasTexture(spotCanvas), color: 0x1c2a30, transparent: true, opacity: 0.42, depthWrite: false, toneMapped: false });
  spotMat.userData = NO_OUTLINE;
  const SPOT_MAX = 128;
  const spotMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), spotMat, SPOT_MAX);
  spotMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  spotMesh.frustumCulled = false;
  spotMesh.renderOrder = 1;
  spotMesh.count = 0;
  island.add(spotMesh);
  const staticSpots: [number, number, number][] = [];
  const spotM = new THREE.Matrix4();
  function layContactSpots() {
    let n = 0;
    const put = (x: number, z: number, size: number) => {
      if (n >= SPOT_MAX) return;
      spotM.makeScale(size, 1, size).setPosition(x, TILE_TOP + 0.004, z);
      spotMesh.setMatrixAt(n, spotM);
      n += 1;
    };
    for (const [x, z, size] of staticSpots) put(x, z, size);
    for (const a of actors) put(a.root.position.x, a.root.position.z, 0.42);
    spotMesh.count = n;
    spotMesh.instanceMatrix.needsUpdate = true;
  }

  function addBuildingModel(kind: string, at: THREE.Group, ghost: boolean, grown = 0) {
    const look = LOOKS[kind];
    const url = `./packs/legend/town/${kind}.glb`;
    loadGltf(url).then((gltf) => {
      const model = gltf.scene.clone(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const s = (look.size * (1 + grown * 0.05)) / Math.max(size.x, size.z);
      const dome = kind === 'power' ? (size.y * s * DOME_CUT) : 0;
      if (dome) at.add(makeGlassDome(dome));
      model.scale.setScalar(s);
      model.position.y = -box.min.y * s;
      model.rotation.y = look.yaw;
      model.traverse((o: any) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        o.material = o.material.clone();
        o.material.metalness = 0;
        o.material.roughness = 0.82;
        if (dome) {
          // Cut at the brass rim in the shader, not with three's clipping planes: with the shadow pass gone (atlantis AT-5)
          // the clipping uniform was uploaded before it was set on the first frame and threw once per opening.
          const cutY = { value: TILE_TOP + dome };
          o.material.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
            shader.uniforms.uCutY = cutY;
            shader.vertexShader = shader.vertexShader
              .replace('#include <common>', `#include <common>\nvarying float vCutY;`)
              .replace('#include <begin_vertex>', `#include <begin_vertex>\nvCutY = (modelMatrix * vec4(transformed, 1.0)).y;`);
            shader.fragmentShader = shader.fragmentShader
              .replace('#include <common>', `#include <common>\nuniform float uCutY;\nvarying float vCutY;`)
              .replace('void main() {', `void main() {\n  if (vCutY > uCutY) discard;`);
          };
          o.material.customProgramCacheKey = () => 'dome-cut';
          o.material.userData = NO_OUTLINE;
        }
        if (ghost) {
          o.material.transparent = true;
          o.material.opacity = 0.5;
        }
      });
      at.add(model);
    }).catch(() => { /* a missing model only leaves the plot marker */ });
  }

  // TRELLIS cannot make glass: it baked the station's dome solid brown. The model is cut at the brass rim and the dome is drawn here.
  function makeGlassDome(rim: number) {
    const g = new THREE.Group();
    g.position.y = rim;
    const glass = new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.24, roughness: 0.08, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
    glass.userData = { outlineParameters: { thickness: 0.0012 } };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), glass);
    dome.position.y = 0.16;
    dome.renderOrder = 3;
    g.add(dome, mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.05, 10), 0xb5763a, 0, 0.5, 0));
    const jar = new THREE.CapsuleGeometry(0.05, 0.07, 4, 10);
    const lit = new THREE.MeshBasicMaterial({ color: 0xd9ff5c, toneMapped: false });
    lit.userData = NO_OUTLINE;
    for (const [x, z] of [[0, 0], [0.13, 0.07], [-0.13, 0.07], [0.07, -0.13], [-0.07, -0.13]]) {
      const m = new THREE.Mesh(jar, lit);
      m.position.set(x, 0.08, z);
      g.add(m);
    }
    return g;
  }

  // The field as three instanced draws (beds, stems, tips) instead of 21 meshes drawn twice (atlantis plan AT-1).
  // The plants carry no ink outline: at that size the line swallowed the cone anyway.
  const fieldBedGeo = new RoundedBoxGeometry(0.26, 0.09, 0.8, 2, 0.035);
  const fieldStemGeo = new THREE.ConeGeometry(0.035, 0.2, 5);
  const fieldTipGeo = new THREE.SphereGeometry(0.05, 6, 5);
  const fieldBedMat = toon(0x7a4a29);
  const fieldPlantMat = toon(0xffffff);
  fieldPlantMat.userData = NO_OUTLINE;
  function makeField(level: number, grain: number) {
    const g = new THREE.Group();
    const beds = new THREE.InstancedMesh(fieldBedGeo, fieldBedMat, 3);
    const stems = new THREE.InstancedMesh(fieldStemGeo, fieldPlantMat, 9);
    const tips = new THREE.InstancedMesh(fieldTipGeo, fieldPlantMat, 9);
    const rnd = seeded(`field${level}`);
    const ripe = grain > 0;
    let n = 0;
    [-0.29, 0, 0.29].forEach((x, i) => {
      dummy.position.set(x, 0.045, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      beds.setMatrixAt(i, dummy.matrix);
      for (const z of [-0.27, 0, 0.27]) {
        const h = 0.75 + rnd() * 0.4 + level * 0.15;
        dummy.position.set(x, 0.15 * h + 0.06, z);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        stems.setMatrixAt(n, dummy.matrix);
        stems.setColorAt(n, tint.setHex(ripe ? 0xe6bb45 : 0x79b84a));
        dummy.position.set(x, 0.26 * h + 0.08, z);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        tips.setMatrixAt(n, dummy.matrix);
        tips.setColorAt(n, tint.setHex(ripe ? 0xf2d060 : 0x8fce5a));
        n += 1;
      }
    });
    for (const m of [beds, stems, tips]) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
    g.add(beds, stems, tips);
    return g;
  }

  function makeSails() {
    const g = new THREE.Group();
    const wood = new THREE.BoxGeometry(0.05, 0.62, 0.025);
    const cloth = new THREE.BoxGeometry(0.15, 0.46, 0.012);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group();
      arm.rotation.z = (i * Math.PI) / 2;
      arm.add(mesh(wood, 0x8a5a33, 0, 0.31, 0), mesh(cloth, 0xfff0d2, 0.09, 0.36, 0));
      g.add(arm);
    }
    g.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), 0x6e4524));
    return g;
  }

  // Every tree on the island is drawn in five instanced batches: trunks (with ink), crown cores and the three crown shapes
  // (atlantis plan AT-1: 24 trees were 64 draws plus outline). Leaf colour rides on the instance, so both kingdoms share them.
  const crowns = [0, 1, 2].map((i) => crownGeometry(seeded(`crown${i}`)));
  const crownCore = new THREE.IcosahedronGeometry(0.78, 2);
  const leafMap = leafTexture();
  const cardMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: leafMap, alphaTest: 0.5, side: THREE.DoubleSide });
  cardMat.userData = NO_OUTLINE;
  cardMat.onBeforeCompile = leafSway;
  const coreMat = new THREE.MeshLambertMaterial({ color: 0xd9d9d9 });
  coreMat.userData = NO_OUTLINE;
  const trunkGeo = new THREE.CylinderGeometry(0.035, 0.06, 1, 7).translate(0, 0.5, 0);
  const trunkMat = toon(0x8a5a33);
  const TREE_MAX = 24;
  const treeM = new THREE.Matrix4();
  const partM = new THREE.Matrix4();
  type TreeSpec = { rnd: () => number; leaf: number; x: number; z: number; scale: number };
  function makeTrees(specs: TreeSpec[]) {
    const g = new THREE.Group();
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, TREE_MAX);
    const cores = new THREE.InstancedMesh(crownCore, coreMat, TREE_MAX);
    const cards = crowns.map((geo) => new THREE.InstancedMesh(geo, cardMat, TREE_MAX));
    const cardCount = [0, 0, 0];
    specs.slice(0, TREE_MAX).forEach((t, i) => {
      const h = 0.2 + t.rnd() * 0.08;
      treeM.makeScale(t.scale, t.scale, t.scale).setPosition(t.x, TILE_TOP, t.z);
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, partM.multiplyMatrices(treeM, dummy.matrix));
      dummy.position.set(0, h + 0.17, 0);
      dummy.scale.set(0.28, 0.25, 0.28).multiplyScalar(0.92 + t.rnd() * 0.2);
      dummy.rotation.set(0, t.rnd() * Math.PI * 2, 0);
      dummy.updateMatrix();
      partM.multiplyMatrices(treeM, dummy.matrix);
      cores.setMatrixAt(i, partM);
      cores.setColorAt(i, tint.setHex(t.leaf));
      const shape = Math.floor(t.rnd() * crowns.length);
      cards[shape].setMatrixAt(cardCount[shape], partM);
      cards[shape].setColorAt(cardCount[shape], tint.setHex(t.leaf));
      cardCount[shape] += 1;
    });
    trunks.count = cores.count = Math.min(specs.length, TREE_MAX);
    cards.forEach((c, k) => { c.count = cardCount[k]; });
    for (const m of [trunks, cores, ...cards]) {
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      g.add(m);
    }
    return g;
  }

  // Mate flags, batched the same way: poles with ink, cloths coloured per game.
  const FLAG_MAX = 12;
  const poleGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.58, 6).translate(0, 0.29, 0);
  const poleMat = toon(0x8a5a33);
  const clothShape = new THREE.Shape();
  clothShape.moveTo(0, 0);
  clothShape.lineTo(0.24, -0.07);
  clothShape.lineTo(0, -0.15);
  const clothGeo = new THREE.ShapeGeometry(clothShape).translate(0.012, 0.56, 0);
  const clothMat = toon(0xffffff);
  clothMat.side = THREE.DoubleSide;
  function makeFlags(flags: { x: number; z: number; game: number }[]) {
    const g = new THREE.Group();
    const poles = new THREE.InstancedMesh(poleGeo, poleMat, FLAG_MAX);
    const cloths = new THREE.InstancedMesh(clothGeo, clothMat, FLAG_MAX);
    flags.slice(0, FLAG_MAX).forEach((f, i) => {
      dummy.position.set(f.x, TILE_TOP, f.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      poles.setMatrixAt(i, dummy.matrix);
      cloths.setMatrixAt(i, dummy.matrix);
      cloths.setColorAt(i, tint.setHex(f.game % 2 ? 0xffc23d : 0xf0606a));
    });
    poles.count = cloths.count = Math.min(flags.length, FLAG_MAX);
    for (const m of [poles, cloths]) {
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      g.add(m);
    }
    return g;
  }

  // Decorations left over from the first village, still standing on old saves.
  function makeOldDecor(kind: string) {
    const g = new THREE.Group();
    if (kind === 'bench') {
      g.add(mesh(new THREE.BoxGeometry(0.62, 0.06, 0.2), 0xc98f58, 0, 0.2, 0), mesh(new THREE.BoxGeometry(0.62, 0.2, 0.05), 0xc98f58, 0, 0.33, -0.09));
      for (const x of [-0.24, 0.24]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), 0x8a5a33, x, 0.1, 0));
    } else if (kind === 'fountain') {
      g.add(mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.16, 20), 0xd8dee8, 0, 0.08, 0), mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 20), 0x8fd3f4, 0, 0.17, 0), mesh(new THREE.SphereGeometry(0.13, 16, 12), 0xbfe8fb, 0, 0.32, 0));
    } else if (kind === 'flowerbed') {
      // Shelf props (garden-short G4): small shapes in the island's own style, no new models.
      g.add(mesh(new RoundedBoxGeometry(0.66, 0.1, 0.66, 2, 0.04), 0x8a5a3a, 0, 0.05, 0));
      const rnd = seeded('flowerbed');
      const petals = [0xff8fb1, 0xffd35c, 0xffffff, 0xc49bff];
      for (let i = 0; i < 9; i++) {
        const x = ((i % 3) - 1) * 0.19 + (rnd() - 0.5) * 0.06;
        const z = (Math.floor(i / 3) - 1) * 0.19 + (rnd() - 0.5) * 0.06;
        g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 5), 0x5f9e3c, x, 0.16, z), mesh(new THREE.SphereGeometry(0.06, 8, 6), petals[i % petals.length], x, 0.24, z));
      }
    } else if (kind === 'signpost') {
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.6, 8), 0x8a5a33, 0, 0.3, 0), mesh(new RoundedBoxGeometry(0.4, 0.16, 0.04, 2, 0.02), 0xd9a066, 0.08, 0.5, 0), mesh(new RoundedBoxGeometry(0.32, 0.13, 0.04, 2, 0.02), 0xc98f58, -0.06, 0.32, 0.01));
    } else if (kind === 'lantern') {
      const lamp = mesh(new RoundedBoxGeometry(0.16, 0.2, 0.16, 2, 0.03), 0xffc56b, 0, 0.66, 0);
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.56, 8), 0x3f4652, 0, 0.28, 0), lamp, mesh(new THREE.ConeGeometry(0.14, 0.1, 4), 0x3f4652, 0, 0.81, 0));
      addGlow(g, 0.66, 0xffb35c, 1.2);
    } else if (kind === 'birdhouse') {
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), 0x8a5a33, 0, 0.25, 0), mesh(new RoundedBoxGeometry(0.22, 0.2, 0.2, 2, 0.03), 0x6fb3d9, 0, 0.6, 0), mesh(new THREE.ConeGeometry(0.19, 0.14, 4), 0xe0645a, 0, 0.77, 0), mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), 0x2b2b33, 0, 0.62, 0.105));
      g.children[g.children.length - 1].rotation.x = Math.PI / 2;
      g.children[g.children.length - 2].rotation.y = Math.PI / 4;
    } else if (kind === 'arch') {
      const arc = mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 24, Math.PI), 0x6aa84f, 0, 0.42, 0);
      g.add(arc);
      for (const x of [-0.3, 0.3]) g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), 0x6aa84f, x, 0.21, 0));
      for (let i = 0; i <= 6; i++) {
        const a = (Math.PI * i) / 6;
        g.add(mesh(new THREE.SphereGeometry(0.05, 8, 6), i % 2 ? 0xff8fb1 : 0xffffff, Math.cos(a) * 0.3, 0.42 + Math.sin(a) * 0.3, 0.02));
      }
    } else if (kind === 'statue') {
      g.add(mesh(new RoundedBoxGeometry(0.42, 0.18, 0.42, 2, 0.04), 0xd8dee8, 0, 0.09, 0), mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.36, 12), 0xe8c25a, 0, 0.36, 0));
      const crown = new THREE.Group();
      crown.position.y = 0.58;
      crown.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16, 1, true), 0xf2d064, 0, 0, 0));
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5;
        crown.add(mesh(new THREE.ConeGeometry(0.04, 0.1, 6), 0xf2d064, Math.cos(a) * 0.14, 0.08, Math.sin(a) * 0.14));
      }
      g.add(crown);
      twirlers.push(crown);
    }
    return g;
  }

  function addPuffs(parent: THREE.Group, x: number, y: number, z: number, color: number, n: number) {
    const geo = new THREE.SphereGeometry(0.05, 8, 6);
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
      mat.userData = NO_OUTLINE;
      const m = new THREE.Mesh(geo, mat);
      parent.add(m);
      puffs.push({ m, base: new THREE.Vector3(x, y, z), phase: i / n, rise: 0.6 });
    }
  }

  function addGlow(parent: THREE.Group, y: number, color: number, power: number) {
    const light = new THREE.PointLight(color, power, 3.2, 1.8);
    light.position.y = y;
    parent.add(light);
    glows.push(light);
  }

  function placeBuilding(b: any, v: any) {
    const at = new THREE.Group();
    const [x, z] = squareXZ(b.sq);
    at.position.set(x, TILE_TOP, z);
    if (b.kind === 'field') {
      at.add(makeField(b.level || 0, v.grain));
    } else {
      addBuildingModel(b.kind, at, !b.ready, b.level || 0);
    }
    if (b.ready && b.tenant && tenantRarity(b.tenant) === 3) {
      const star = mesh(new THREE.OctahedronGeometry(0.1), 0xffd24a, 0, 1.05, 0);
      (star.material as THREE.MeshStandardMaterial).emissive.setHex(0xb07a10);
      at.add(star);
      twirlers.push(star);
    }
    if (!b.ready) {
      const post = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
      for (const [px, pz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) at.add(mesh(post, 0xc99a5c, px, 0.4, pz));
      at.add(mesh(new THREE.BoxGeometry(0.92, 0.03, 0.03), 0xc99a5c, 0, 0.72, 0.42), mesh(new THREE.BoxGeometry(0.92, 0.03, 0.03), 0xc99a5c, 0, 0.72, -0.42));
    } else {
      // The Atlantis water mill (AT-7) has its wheel in the model; a worked mill lets a thin stream of bubbles rise beside it.
      if (b.kind === 'mill' && b.tenant) addPuffs(at, 0.32, 0.3, 0.1, 0xd8f6ff, 5);
      if (b.kind === 'bakery') {
        addPuffs(at, 0.13, 0.86, -0.05, 0xfff4e4, 4);
        addGlow(at, 0.4, 0xffb45a, 2.4);
      }
      if (b.kind === 'spring') addPuffs(at, 0, 0.26, 0, 0xffffff, 6);
      if (b.kind === 'power') addGlow(at, 0.5, 0xc8ff5a, 5);
      if (b.kind === 'house' || b.kind === 'shelter' || b.kind === 'market' || b.kind === 'stage') addGlow(at, 0.4, 0xffb45a, 1.6);
    }
    // A plain invisible box: the tap should land on the building, not on whichever triangle TRELLIS made there.
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.9, 0.92), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.45;
    hit.userData.buildingId = b.id;
    at.add(hit);
    hitBoxes.push(hit);
    marks.add(at);
  }

  // Building badges (AT follow-up, 11-05): the three models told the teal-roofed bakery, coral hut, stage and hot spring
  // apart in 11 of 24 tries. Each building gets the round icon the build menu already shows, all in one Points draw.
  // The badges keep one size on screen, so they stay readable zoomed out and small zoomed in.
  // A phone shows the island small, so a desktop-sized badge hid the building under it: 4% of the short side, 18-30px.
  const badgeSize = () => Math.min(30, Math.max(18, Math.min(host.clientWidth, host.clientHeight) * 0.04)) * renderer.getPixelRatio();
  const badgeMat = new THREE.ShaderMaterial({
    uniforms: { uAtlas: { value: null }, uCells: { value: 1 }, uSize: { value: badgeSize() }, uShow: { value: 1 } },
    vertexShader: `attribute float aCell; varying float vCell; uniform float uSize;
      void main() { vCell = aCell; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize; }`,
    fragmentShader: `uniform sampler2D uAtlas; uniform float uCells; uniform float uShow; varying float vCell;
      void main() { vec2 uv = vec2((vCell + gl_PointCoord.x) / uCells, 1.0 - gl_PointCoord.y);
        vec4 c = texture2D(uAtlas, uv); if (c.a < 0.05) discard; gl_FragColor = vec4(c.rgb, c.a * uShow); }`,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  badgeMat.userData = NO_OUTLINE;
  function makeBadges(built: any[]) {
    const kinds = [...new Set(built.map((b) => b.kind))].filter((k) => (BUILDINGS as any)[k]);
    if (!kinds.length) return null;
    const C = 64;
    const canvas = document.createElement('canvas');
    canvas.width = C * kinds.length;
    canvas.height = C;
    const ctx = canvas.getContext('2d')!;
    kinds.forEach((k, i) => {
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.strokeStyle = '#2b5f7a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(i * C + C / 2, C / 2, C / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = '36px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((BUILDINGS as any)[k].icon, i * C + C / 2, C / 2 + 2);
    });
    const atlas = new THREE.CanvasTexture(canvas);
    atlas.colorSpace = THREE.SRGBColorSpace;
    (badgeMat.uniforms.uAtlas.value as THREE.Texture | null)?.dispose();
    badgeMat.uniforms.uAtlas.value = atlas;
    badgeMat.uniforms.uCells.value = kinds.length;
    const pos: number[] = [];
    const cell: number[] = [];
    for (const b of built) {
      const i = kinds.indexOf(b.kind);
      if (i < 0) continue;
      const [x, z] = squareXZ(b.sq);
      pos.push(x, TILE_TOP + (b.kind === 'field' ? 0.5 : 1.2), z);
      cell.push(i);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aCell', new THREE.Float32BufferAttribute(cell, 1));
    const pts = new THREE.Points(geo, badgeMat);
    pts.renderOrder = 10;
    pts.frustumCulled = false;
    return pts;
  }

  function drawGround(v: any) {
    ground.clear();
    const tiles = villageTiles(v.map) as Record<string, number>;
    const occupied = new Set([...v.built.map((b: any) => b.sq), ...v.decor.map((d: any) => d.sq)]);
    const pebbleGeo = new THREE.SphereGeometry(1, 8, 6);
    const pebbleMat = toon(0xffffff, 0.9);
    pebbleMat.userData = NO_OUTLINE;
    const pebbles = new THREE.InstancedMesh(pebbleGeo, pebbleMat, 64 * 22);
    pebbles.castShadow = false;
    pebbles.receiveShadow = true;
    let nP = 0;
    const flowers = new THREE.InstancedMesh(flowerGeo.clone(), flowerMat, 64 * 10);
    flowers.frustumCulled = false;
    flowers.receiveShadow = true;
    const flowerWear = new THREE.InstancedBufferAttribute(new Float32Array(flowers.count), 1);
    const flowerShape = new THREE.InstancedBufferAttribute(new Float32Array(flowers.count), 1);
    flowers.geometry.setAttribute('aWear', flowerWear);
    flowers.geometry.setAttribute('aShape', flowerShape);
    let nF = 0;
    const FLOWER = [0xff8fb0, 0xffd34d, 0xc79bff, 0xffffff, 0xff7a5c];
    const tufts = new THREE.InstancedMesh(bladeGeo, bladeMat, 64 * BLADES[0]);
    tufts.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    tufts.frustumCulled = false;
    tufts.receiveShadow = true;
    const tuftWear = new THREE.InstancedBufferAttribute(new Float32Array(tufts.count), 1);
    tufts.geometry = bladeGeo.clone();
    tufts.geometry.setAttribute('aWear', tuftWear);
    let nT = 0;

    squares.forEach((sq, i) => {
      const level = tiles[sq] || 0;
      const rnd = seeded(sq);
      const [x, z] = squareXZ(sq);
      const f = FILES.indexOf(sq[0]);
      const r = Number(sq[1]);
      const dark = (f + r) % 2 === 0;       // the board stays readable under the grass
      const base = level === 0 ? (dark ? 0x7f9c47 : 0x94ad54) : level === 1 ? (dark ? 0xa3a35a : 0xb3b166) : level === 2 ? (dark ? 0xb3a97a : 0xc2b888) : (dark ? 0x8fa850 : 0xa2b95c);
      caps.setColorAt(i, tint.setHex(base).offsetHSL((rnd() - 0.5) * 0.01, 0, (rnd() - 0.5) * 0.02));
      // The four quarters of the dome read by a faint tint, and the plaza under the light shafts by pale stone (atlantis AT-6).
      const zone = ZONES[zoneOf(sq) as keyof typeof ZONES];
      if (zone) caps.setColorAt(i, tint.lerp(zoneTint.setHex(zone.tint), zone.mix));
      capWear.setX(i, WEAR[level] ?? 0);
      if (occupied.has(sq)) return;
      const count = level === 0 ? 0 : level === 1 ? 7 : 20;
      for (let k = 0; k < count && nP < pebbles.count; k++) {
        const s = 0.04 + rnd() * 0.035;
        const a = rnd() * Math.PI * 2;
        dummy.position.set(x + (rnd() - 0.5) * 0.8, TILE_TOP + 0.012, z + (rnd() - 0.5) * 0.8);
        dummy.rotation.set(0, a, 0);
        dummy.scale.set(s * 1.25, s * 0.42, s);
        dummy.updateMatrix();
        pebbles.setMatrixAt(nP, dummy.matrix);
        pebbles.setColorAt(nP, tint.setHex(rnd() < 0.5 ? 0xd9c7a3 : 0xbfae90).offsetHSL(0, 0, (rnd() - 0.5) * 0.06));
        nP += 1;
      }
      // Flowers come in patches of one kind and colour, as they grow (folio-2025 Flowers.js: 3 to 10 around a point).
      const patches = level === 3 ? 2 : level === 0 && rnd() < 0.35 ? 1 : level === 1 && rnd() < 0.12 ? 1 : 0;
      for (let p = 0; p < patches; p++) {
        const cx = x + (rnd() - 0.5) * 0.6;
        const cz = z + (rnd() - 0.5) * 0.6;
        const kind = Math.floor(rnd() * 3);
        const hue = FLOWER[Math.floor(rnd() * FLOWER.length)];
        const many = level === 3 ? 5 + Math.floor(rnd() * 5) : 3 + Math.floor(rnd() * 3);
        for (let k = 0; k < many && nF < flowers.count; k++) {
          dummy.position.set(cx + (rnd() - 0.5) * 0.3, TILE_TOP - 0.01, cz + (rnd() - 0.5) * 0.3);
          dummy.rotation.set(0, rnd() * Math.PI, 0);
          const tall = 0.24 + rnd() * 0.1;
          dummy.scale.set(tall * 0.75, tall, tall * 0.75);
          dummy.updateMatrix();
          flowers.setMatrixAt(nF, dummy.matrix);
          flowers.setColorAt(nF, tint.setHex(hue).offsetHSL((rnd() - 0.5) * 0.06, 0, (rnd() - 0.5) * 0.08));
          flowerWear.setX(nF, WEAR[level] ?? 0);
          flowerShape.setX(nF, kind);
          nF += 1;
        }
      }
      // Clumps fan out from one root, which reads as grass from the island camera where single blades read as hatching.
      let cx = 0;
      let cz = 0;
      for (let k = 0; k < BLADES[level] && nT < tufts.count; k++) {
        if (k % 5 === 0) {
          cx = x + (rnd() - 0.5) * 0.86;
          cz = z + (rnd() - 0.5) * 0.86;
        }
        const turn = rnd() * Math.PI * 2;
        dummy.position.set(cx + Math.cos(turn) * 0.02, TILE_TOP - 0.01, cz + Math.sin(turn) * 0.02);
        dummy.rotation.set(0, 0, 0);
        dummy.rotateY(turn);
        dummy.rotateZ(-(0.15 + rnd() * 0.35));
        const tall = 0.1 + rnd() * 0.1;
        dummy.scale.set(0.05 + rnd() * 0.04, tall, 1);
        dummy.updateMatrix();
        tufts.setMatrixAt(nT, dummy.matrix);
        tufts.setColorAt(nT, tint.setHex(base).offsetHSL(0.01 + (rnd() - 0.5) * 0.03, 0.08, 0.04 + (rnd() - 0.5) * 0.06));
        tuftWear.setX(nT, WEAR[level] ?? 0);
        nT += 1;
      }
    });
    caps.instanceColor!.needsUpdate = true;
    capWear.needsUpdate = true;
    pebbles.count = nP;
    flowers.count = nF;
    flowerWear.needsUpdate = true;
    flowerShape.needsUpdate = true;
    tufts.count = nT;
    tuftWear.needsUpdate = true;
    for (const inst of [pebbles, flowers, tufts]) if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    ground.add(pebbles, flowers, tufts);
  }

  function drawNature(v: any, occupied: Set<string>) {
    const tiles = villageTiles(v.map) as Record<string, number>;
    const busy = new Set([...occupied, ...v.map.trees.map((t: any) => t.sq), ...v.flags.map((f: any) => f.sq)]);
    const free = new Set(squares.filter((sq) => !busy.has(sq) && tiles[sq] !== 2));
    const wild = natureSquares(free, `wild${v.island}`);
    const bushes = new THREE.InstancedMesh(bushGeo, bushMat, wild.length * NATURE.bushes[1]);
    const stones = new THREE.InstancedMesh(stoneGeo, stoneMat, wild.length * NATURE.stones[1]);
    bushes.castShadow = stones.castShadow = true;
    bushes.receiveShadow = stones.receiveShadow = true;
    let nb = 0;
    let ns = 0;
    // A spot along the tile's edge band, never in its middle.
    const edgeSpot = (rnd: () => number, x: number, z: number) => {
      const side = Math.floor(rnd() * 4);
      const along = (rnd() - 0.5) * 0.8;
      const out = 0.3 + rnd() * 0.12;
      return [x + (side < 2 ? along : side === 2 ? out : -out), z + (side < 2 ? (side === 0 ? out : -out) : along)];
    };
    for (const sq of wild) {
      const rnd = seeded(`wild${sq}${v.island}`);
      const [x, z] = squareXZ(sq);
      const nBush = NATURE.bushes[0] + Math.floor(rnd() * (NATURE.bushes[1] - NATURE.bushes[0] + 1));
      for (let k = 0; k < nBush; k++) {
        const [bx, bz] = edgeSpot(rnd, x, z);
        dummy.position.set(bx, TILE_TOP - 0.02, bz);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        dummy.scale.setScalar(0.8 + rnd() * 0.7);
        dummy.updateMatrix();
        bushes.setMatrixAt(nb, dummy.matrix);
        bushes.setColorAt(nb, tint.setHex(rnd() < 0.5 ? 0x6fa83f : 0x83b84a).offsetHSL((rnd() - 0.5) * 0.03, 0, (rnd() - 0.5) * 0.06));
        nb += 1;
      }
      const nStone = NATURE.stones[0] + Math.floor(rnd() * (NATURE.stones[1] - NATURE.stones[0] + 1));
      for (let k = 0; k < nStone; k++) {
        const [sx, sz] = edgeSpot(rnd, x, z);
        const size = 0.04 + rnd() * 0.05;
        dummy.position.set(sx, TILE_TOP + size * 0.3, sz);
        dummy.rotation.set(rnd() * 3, rnd() * 3, 0);
        dummy.scale.set(size * 1.3, size * 0.8, size);
        dummy.updateMatrix();
        stones.setMatrixAt(ns, dummy.matrix);
        stones.setColorAt(ns, tint.setHex(0x9a958a).offsetHSL(0, 0, (rnd() - 0.5) * 0.12));
        ns += 1;
      }
    }
    bushes.count = nb;
    stones.count = ns;
    for (const inst of [bushes, stones]) if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    marks.add(bushes, stones);
  }

  function draw(v: any) {
    marks.clear();
    spinners.length = 0;
    twirlers.length = 0;
    puffs.length = 0;
    glows.length = 0;
    hitBoxes.length = 0;
    staticSpots.length = 0;
    drawGround(v);
    const occupied = new Set([...v.built.map((b: any) => b.sq), ...v.decor.map((d: any) => d.sq)]);
    const LEAVES: Record<string, number> = { w: 0x7fb648, b: 0x6aa84f };
    const treeSpecs: TreeSpec[] = v.map.trees.slice(-TREE_MAX).map((tree: any) => {
      const rnd = seeded(`${tree.sq}${tree.slot}${tree.game}`);
      // The same draws from the seed as before the batching, so every tree keeps its height, crown and side of the square.
      const h = rnd();
      const k = rnd();
      const turn = rnd();
      const shape = rnd();
      const [x, z] = squareXZ(tree.sq);
      const inset = occupied.has(tree.sq) ? 0.44 : 0.26;
      const px = x + (rnd() < 0.5 ? inset : -inset);
      const pz = z + (rnd() < 0.5 ? inset : -inset);
      const replay = [h, k, turn, shape];
      let at = 0;
      return { rnd: () => replay[at++ % replay.length], leaf: LEAVES[tree.slot[0]] ?? 0x7fb648, x: px, z: pz, scale: occupied.has(tree.sq) ? 0.6 : 1 };
    });
    if (treeSpecs.length) marks.add(makeTrees(treeSpecs));
    for (const t of treeSpecs) staticSpots.push([t.x, t.z, 0.42 * t.scale]);
    drawNature(v, occupied);
    for (const b of v.built) {
      placeBuilding(b, v);
      const [bx, bz] = squareXZ(b.sq);
      staticSpots.push([bx, bz, 1.15]);
    }
    const badges = makeBadges(v.built);
    if (badges) marks.add(badges);
    for (const d of v.decor) {
      const at = new THREE.Group();
      const [x, z] = squareXZ(d.sq);
      at.position.set(x, TILE_TOP, z);
      if (LOOKS[d.kind]) addBuildingModel(d.kind, at, false);
      else at.add(makeOldDecor(d.kind));
      marks.add(at);
      staticSpots.push([x, z, LOOKS[d.kind] ? 1.1 : 0.8]);
    }
    const flagSpecs = v.flags.slice(-FLAG_MAX).map((f: any) => {
      const [x, z] = squareXZ(f.sq);
      return { x: x - 0.3, z: z + 0.3, game: f.game };
    });
    if (flagSpecs.length) marks.add(makeFlags(flagSpecs));
    // Promotions earn a house on the far rank of their file, castling a gate at the back of the island.
    for (const h of v.map.houses.slice(-8)) {
      const sq = `${h.slot[2]}8`;
      if (occupied.has(sq)) continue;
      occupied.add(sq);
      const at = new THREE.Group();
      const [x, z] = squareXZ(sq);
      at.position.set(x, TILE_TOP, z);
      addBuildingModel('house', at, false);
      marks.add(at);
      staticSpots.push([x, z, 1.1]);
    }
    if (v.map.gates.length) {
      const at = new THREE.Group();
      at.position.set(4.95, -0.74, -2);
      at.rotation.y = Math.PI / 2;
      at.add(mesh(new RoundedBoxGeometry(1.5, 0.36, 0.7, 2, 0.08), 0x8f8a80, 0, -0.04, 0));
      const top = new THREE.Group();
      top.position.y = 0.2;
      addBuildingModel('gate', top, false);
      at.add(top);
      marks.add(at);
    }
    // The dock stood in the sea; under the dome the way up is the bubble tube to the board (undersea.ts), so it is gone.
    confetti.visible = Boolean(v.festival);
    applyPalette(night ? 'night' : 'day');
  }

  // Residents and the hero of the last game walk tile to tile. Only free squares near home are stepped on.
  const mixers: THREE.AnimationMixer[] = [];
  const actors: any[] = [];
  const actorRoots = new THREE.Group();
  island.add(actorRoots);
  let freeSquare = (sq: string) => Boolean(sq);

  function neighbours(sq: string) {
    const f = FILES.indexOf(sq[0]);
    const r = Number(sq[1]);
    const out: string[] = [];
    for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nf = f + df;
      const nr = r + dr;
      if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) out.push(`${FILES[nf]}${nr}`);
    }
    return out;
  }

  function addActor(key: string, url: string, slot: string | null, animal: string, home: string, height: number, route: string[]) {
    const started = key;
    loadGltf(url).then((gltf) => {
      if (!actorKeys.has(started)) return;
      const model = cloneSkeleton(gltf.scene) as THREE.Object3D;
      const box = new THREE.Box3().setFromObject(model);
      const s = height / (box.max.y - box.min.y);
      model.scale.setScalar(s);
      model.position.y = -box.min.y * s;
      const root = new THREE.Group();
      root.add(model);
      const start = route[0] || home;
      const [x, z] = squareXZ(start);
      root.position.set(x, TILE_TOP, z);
      model.traverse((o: any) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.userData.actorKey = started;
        o.material.userData = { outlineParameters: { thickness: 0.0016 } };
      });
      actorRoots.add(root);
      const mixer = new THREE.AnimationMixer(model);
      mixers.push(mixer);
      const play = (name: string) => {
        const clip = gltf.animations.find((c: any) => c.name === name);
        if (!clip) return;
        mixer.stopAllAction();
        mixer.clipAction(clip).play();
      };
      play('Idle');
      const a = { key: started, slot, animal, home, at: start, root, play, path: route.slice(1).map(squareXZ), wait: 1 + Math.random() * 4, target: null as string | null, cheerUntil: 0 };
      if (a.path.length) play('Walk');
      actors.push(a);
    }).catch(() => { /* a missing stage model just leaves the square empty */ });
  }

  const actorKeys = new Set<string>();
  const STAGE_SUFFIX = ['', '_s2', '_s3', '_s4'];
  function syncActors(v: any) {
    const taken = new Set([...v.built.map((b: any) => b.sq), ...v.decor.map((d: any) => d.sq)]);
    freeSquare = (sq) => !taken.has(sq);
    const wanted = new Map<string, any>();
    for (const b of v.built) {
      if (!b.tenant || !b.ready) continue;
      const animal = tenantAnimal(b.tenant);
      const door = neighbours(b.sq).find(freeSquare) || b.sq;
      wanted.set(`b${b.id}:${b.tenant}`, { url: `./packs/legend/${animal}${STAGE_SUFFIX[tenantRarity(b.tenant)]}_w.glb`, slot: null, animal, home: door, height: 0.56, route: [] });
    }
    const hero = v.walk?.slot;
    if (hero) {
      const sp = SPECIES[slotRole(hero)];
      const st = stageForHearts(v.hearts[hero] || 0);
      const suffix = st === 'grown' ? '_s2' : st === 'adult' ? '_s3' : st === 'starlit' ? '_s4' : '';
      wanted.set(`hero:${hero}`, { url: `./packs/legend/${sp}${suffix}_${hero[0]}.glb`, slot: hero, animal: sp, home: v.walk.route[v.walk.route.length - 1], height: 0.66, route: v.walk.route });
    } else {
      wanted.set('hero:w_e2', { url: './packs/legend/meerkat_w.glb', slot: 'w_e2', animal: 'meerkat', home: 'e4', height: 0.6, route: [] });
    }
    for (let i = actors.length - 1; i >= 0; i--) {
      if (wanted.has(actors[i].key)) continue;
      actorRoots.remove(actors[i].root);
      actorKeys.delete(actors[i].key);
      actors.splice(i, 1);
    }
    for (const [key, w] of wanted) {
      if (actorKeys.has(key)) continue;
      actorKeys.add(key);
      addActor(key, w.url, w.slot, w.animal, w.home, w.height, w.route);
    }
  }

  function stepActor(a: any, dt: number, now: number) {
    if (a.path.length) {
      const [x, z] = a.path[0];
      const dx = x - a.root.position.x;
      const dz = z - a.root.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.04) {
        a.path.shift();
        if (!a.path.length) {
          a.at = a.target || a.at;
          a.target = null;
          a.play('Idle');
          a.wait = 2 + Math.random() * 5;
        }
        return;
      }
      const step = Math.min(d, dt * 0.62);
      a.root.position.x += (dx / d) * step;
      a.root.position.z += (dz / d) * step;
      const face = Math.atan2(dx, dz);
      let turn = face - a.root.rotation.y;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      a.root.rotation.y += turn * Math.min(1, dt * 8);
      return;
    }
    if (now < a.cheerUntil) return;
    a.wait -= dt;
    if (a.wait > 0) return;
    const homeF = FILES.indexOf(a.home[0]);
    const homeR = Number(a.home[1]);
    const near = neighbours(a.at).filter((sq) => freeSquare(sq) && Math.abs(FILES.indexOf(sq[0]) - homeF) + Math.abs(Number(sq[1]) - homeR) <= 3);
    if (!near.length) { a.wait = 4; return; }
    const next = near[Math.floor(Math.random() * near.length)];
    a.target = next;
    const [x, z] = squareXZ(next);
    a.path = [[x + (Math.random() - 0.5) * 0.3, z + (Math.random() - 0.5) * 0.3]];
    a.play('Walk');
  }

  // Cards the player chose stand on a scallop shell on the sea floor beside the island, turned to face whoever is looking.
  const raft = new THREE.Group();
  raft.position.set(5.0, SEABED_Y + 0.08, 2.4);
  const shell = mesh(new THREE.CylinderGeometry(0.98, 1.08, 0.16, 14), 0xf2cdb8);
  const lip = mesh(new THREE.TorusGeometry(1.02, 0.07, 6, 14), 0xe8a98f, 0, 0.08, 0);
  lip.rotation.x = Math.PI / 2;
  raft.add(shell, lip);
  scene.add(raft);
  const easels: THREE.Mesh[] = [];
  function drawShelf(shelf: string[]) {
    for (const e of easels) raft.remove(e);
    easels.length = 0;
    raft.visible = shelf.length > 0;
    shelf.slice(0, 6).forEach((id, i) => {
      const [animal, rarity] = id.split('_');
      const texture = new THREE.TextureLoader().load(`./packs/legend/cards/${animal}_${rarity}.webp`);
      texture.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.05, toneMapped: false });
      mat.userData = NO_OUTLINE;
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.73), mat);
      card.position.set(i % 2 ? 0.28 : -0.28, 0.42, 0.5 - Math.floor(i / 2) * 0.5);
      raft.add(card);
      easels.push(card);
      // Rare and hero cards stand in a glowing frame, blue and gold as in the pouch reveal (desire plan D6).
      const glow = Number(rarity) >= 3 ? 0xffc23d : Number(rarity) === 2 ? 0x5aa9ff : null;
      if (glow !== null) {
        const frameMat = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.85, toneMapped: false });
        frameMat.userData = NO_OUTLINE;
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.81), frameMat);
        frame.position.z = -0.006;   // a child of the card, so it turns with it towards the camera
        card.add(frame);
      }
    });
  }

  // Fireflies appear with the station, so the night has something moving in it.
  const flyCount = 70;
  const flyGeo = new THREE.BufferGeometry();
  const flyPos = new Float32Array(flyCount * 3);
  const flySeed: number[] = [];
  const flyRnd = seeded('flies');
  for (let i = 0; i < flyCount; i++) flySeed.push(flyRnd() * 8 - 4, 0.25 + flyRnd() * 0.9, flyRnd() * 8 - 4, flyRnd() * 6.28);
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flyMat = new THREE.PointsMaterial({ color: 0xe6ff7a, size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  flyMat.userData = NO_OUTLINE;
  const flies = new THREE.Points(flyGeo, flyMat);
  flies.visible = false;
  island.add(flies);

  // Overnight dew (garden-short G2): drops twinkle over the fields that the first game of the day will water.
  const dewCount = 22;
  const dewGeo = new THREE.BufferGeometry();
  const dewPos = new Float32Array(dewCount * 8 * 3);
  const dewSeed: number[] = [];
  const dewRnd = seeded('dew');
  for (let i = 0; i < dewCount * 8; i++) dewSeed.push(dewRnd() - 0.5, dewRnd() - 0.5, dewRnd() * 6.28);
  dewGeo.setAttribute('position', new THREE.BufferAttribute(dewPos, 3));
  const dewMat = new THREE.PointsMaterial({ color: 0x9fe8ff, size: 0.15, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  dewMat.userData = NO_OUTLINE;
  const dewDrops = new THREE.Points(dewGeo, dewMat);
  dewDrops.visible = false;
  island.add(dewDrops);
  function setDew(squares: string[]) {
    const fields = squares.slice(0, 8);
    dewDrops.visible = fields.length > 0;
    fields.forEach((sq, f) => {
      const [x, z] = squareXZ(sq);
      for (let i = 0; i < dewCount; i++) {
        const k = (f * dewCount + i) * 3;
        dewPos[k] = x + dewSeed[k] * 0.9;
        dewPos[k + 1] = TILE_TOP + 0.08 + (dewSeed[k + 2] / 6.28) * 0.12;
        dewPos[k + 2] = z + dewSeed[k + 1] * 0.9;
      }
    });
    dewGeo.setDrawRange(0, fields.length * dewCount);
    dewGeo.attributes.position.needsUpdate = true;
  }

  // A kept request with the festival stage open: paper rains over the island until the next game.
  const confettiCount = 90;
  const confGeo = new THREE.BufferGeometry();
  const confPos = new Float32Array(confettiCount * 3);
  const confCol = new Float32Array(confettiCount * 3);
  const confSeed: number[] = [];
  const confRnd = seeded('confetti');
  for (let i = 0; i < confettiCount; i++) {
    confSeed.push(confRnd() * 8 - 4, confRnd() * 2.4, confRnd() * 8 - 4);
    tint.setHSL(confRnd(), 0.8, 0.62).toArray(confCol, i * 3);
  }
  confGeo.setAttribute('position', new THREE.BufferAttribute(confPos, 3));
  confGeo.setAttribute('color', new THREE.BufferAttribute(confCol, 3));
  const confMat = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, toneMapped: false });
  confMat.userData = NO_OUTLINE;
  const confetti = new THREE.Points(confGeo, confMat);
  confetti.visible = false;
  island.add(confetti);

  let night = false;
  function applyPalette(name: 'day' | 'night') {
    const p = PALETTES[name];
    hemi.color.setHex(p.hemiSky);
    hemi.groundColor.setHex(p.hemiGround);
    hemi.intensity = p.hemi;
    sun.color.setHex(p.sun);
    sun.intensity = p.sunPower;
    undersea.setPalette(name);
    renderer.toneMappingExposure = p.exposure;
    flies.visible = name === 'night';
    for (const g of glows) g.visible = name === 'night';
  }

  // A tapped animal lets out a little burst of bubbles (atlantis AT-8): twelve spheres from one instanced mesh, gone in 1.4 s.
  const BURST = 12;
  const burstMat = new THREE.MeshStandardMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.55, roughness: 0.05, emissive: 0x6fd8ff, emissiveIntensity: 0.4, depthWrite: false });
  burstMat.userData = { outlineParameters: { thickness: 0.0014, color: [0.2, 0.45, 0.6] } };
  const burstMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), burstMat, BURST);
  burstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  burstMesh.frustumCulled = false;
  burstMesh.visible = false;
  island.add(burstMesh);
  const burstSeeds = Array.from({ length: BURST }, (_, i) => [Math.cos(i * 2.4) * (0.08 + (i % 3) * 0.06), Math.sin(i * 2.4) * (0.08 + (i % 3) * 0.06), 0.7 + (i % 4) * 0.25, 0.6 + (i % 5) * 0.2]);
  const burstAt = new THREE.Vector3();
  let burstStart = -10;
  function burstBubbles(at: THREE.Vector3) {
    burstAt.copy(at);
    burstStart = clock.elapsedTime;
    burstMesh.visible = true;
  }
  function stepBurst(t: number) {
    if (!burstMesh.visible) return;
    const k = (t - burstStart) / 1.4;
    if (k >= 1) {
      burstMesh.visible = false;
      return;
    }
    burstSeeds.forEach(([dx, dz, rise, size], i) => {
      const lag = Math.max(0, k - i * 0.03);
      dummy.position.set(burstAt.x + dx * (1 + lag * 2) + Math.sin(t * 6 + i) * 0.02, burstAt.y + 0.45 + lag * rise * 1.4, burstAt.z + dz * (1 + lag * 2));
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(size * (0.4 + lag) * (lag > 0.85 ? (1 - lag) / 0.15 : 1));
      dummy.updateMatrix();
      burstMesh.setMatrixAt(i, dummy.matrix);
    });
    burstMesh.instanceMatrix.needsUpdate = true;
  }

  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  const aim = (e: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
  };
  let picking = false;
  const onClick = (e: MouseEvent) => {
    if (dragged) {
      dragged = false;
      return;
    }
    aim(e);
    if (!picking) {
      const body = ray.intersectObject(actorRoots, true)[0];
      const key = body?.object.userData.actorKey;
      const a = key && actors.find((x) => x.key === key);
      if (a) {
        a.path = [];
        a.play('Cheer');
        burstBubbles(a.root.position);
        a.cheerUntil = clock.elapsedTime + 1.6;
        a.wait = 1.8;
        setTimeout(() => { if (a.cheerUntil && clock.elapsedTime >= a.cheerUntil - 0.05) a.play('Idle'); }, 1600);
        events.onActor(a.slot, a.animal);
        return;
      }
      const hit = ray.intersectObjects(hitBoxes)[0];
      if (hit) {
        events.onBuilding(hit.object.userData.buildingId);
        return;
      }
    }
    const tile = ray.intersectObject(caps)[0];
    if (tile?.instanceId !== undefined) events.onTile(squares[tile.instanceId]);
  };
  renderer.domElement.addEventListener('click', onClick);

  // Wheel and pinch zoom, drag to look around once zoomed in. A drag never counts as a tap on a square.
  const zoomTo = (next: number, x?: number, y?: number) => {
    next = THREE.MathUtils.clamp(next, ZOOM_MIN, 1);
    if (x !== undefined && y !== undefined && next < zoomGoal) {
      // Close in on the point under the finger or cursor, not on the middle of the screen.
      const rect = renderer.domElement.getBoundingClientRect();
      ptr.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const hit = ray.ray.intersectPlane(groundPlane, new THREE.Vector3());
      if (hit) panGoal.add(new THREE.Vector2(hit.x - panGoal.x, hit.z - panGoal.y).multiplyScalar(1 - next / zoomGoal));
    }
    zoomGoal = next;
    clampPan(panGoal, zoomGoal);
  };
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    zoomTo(zoomGoal * Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY);
  };
  const pointers = new Map<number, { x: number; y: number }>();
  let dragged = false;
  let travel = 0;
  let pinchFrom = 0;
  let pinchZoom = 1;
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const onDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      dragged = false;
      travel = 0;
    }
    if (pointers.size === 2) {
      pinchFrom = spread();
      pinchZoom = zoomGoal;
    }
  };
  const onMove = (e: PointerEvent) => {
    const was = pointers.get(e.pointerId);
    if (!was) return;
    const dx = e.clientX - was.x;
    const dy = e.clientY - was.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    travel += Math.hypot(dx, dy);
    if (travel > 6) dragged = true;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      if (pinchFrom > 0) zoomTo(pinchZoom * (pinchFrom / spread()), (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    if (!dragged || zoomGoal >= 0.999) return;
    // One screen pixel in island units at the distance looked at; the ground is foreshortened by the pitch.
    const unit = (2 * fitDistance() * zoom * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / host.clientHeight;
    const right = new THREE.Vector2(Math.cos(azimuth), -Math.sin(azimuth));
    const away = new THREE.Vector2(-Math.sin(azimuth), -Math.cos(azimuth));
    panGoal.addScaledVector(right, -dx * unit).addScaledVector(away, (dy * unit) / Math.sin(PITCH));
    clampPan(panGoal, zoomGoal);
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinchFrom = 0;
  };
  const canvas = renderer.domElement;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onUp);

  // 드로우콜 갈고리 (아틀란티스 계획서 §4.3 AT-0): OutlineEffect 는 renderer.render 를 두 번 부르므로 자동 리셋을 끄고
  // 프레임마다 손으로 지운다. 그래야 외곽선 패스까지 합친 수가 나온다. tools/drawcall_gate.mjs 가 DRAWCALL_SCENE=village 로 읽는다.
  renderer.info.autoReset = false;
  (window as any).wildcrownIsland = {
    renderCalls: () => renderer.info.render.calls,
    triangles: () => renderer.info.render.triangles,
    /** How many building models are still loading; the gate waits for zero. */
    pending: () => pendingModels,
    /** Read-only, for debugging in the browser console. */
    debugScene: () => scene,
    debugRenderer: () => renderer,
    debugCamera: () => camera
  };

  const clock = new THREE.Clock();
  let raf = 0;
  let frame = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    renderer.info.reset();
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    undersea.tick(t);
    grassWind.value = t;
    if (closeInAt && t >= closeInAt) {
      closeInAt = 0;
      zoomGoal = villageZoom();
      ease = 3.2;
    }
    if (Math.abs(azimuthGoal - azimuth) > 0.001 || Math.abs(zoomGoal - zoom) > 0.0005 || Math.abs(PITCH - pitch) > 0.0005 || lift > 0.001 || pan.distanceToSquared(panGoal) > 1e-6) {
      const k = Math.min(1, dt * 6);
      azimuth += (azimuthGoal - azimuth) * k;
      zoom += (zoomGoal - zoom) * Math.min(1, dt * ease);
      pitch += (PITCH - pitch) * Math.min(1, dt * ease);
      lift -= lift * Math.min(1, dt * ease);
      pan.lerp(panGoal, Math.min(1, dt * 10));
      if (Math.abs(zoomGoal - zoom) < 0.001 && Math.abs(PITCH - pitch) < 0.001 && lift < 0.001) {
        ease = 10;
        lift = 0;
      }
      placeCamera();
    }
    undersea.setCloseness((0.95 - zoom) / (0.95 - villageZoom()));
    mixers.forEach((m) => m.update(dt));
    for (const a of actors) stepActor(a, dt, t);
    for (const s of spinners) s.rotation.z -= dt * 0.8;
    for (const s of twirlers) s.rotation.y += dt * 1.4;
    if (confetti.visible) {
      for (let i = 0; i < confettiCount; i++) {
        const j = i * 3;
        confPos[j] = confSeed[j] + Math.sin(t * 2 + i) * 0.1;
        confPos[j + 1] = 2.4 - ((t * 0.5 + confSeed[j + 1]) % 2.4);
        confPos[j + 2] = confSeed[j + 2] + Math.cos(t * 1.6 + i) * 0.1;
      }
      confGeo.attributes.position.needsUpdate = true;
    }
    for (const p of puffs) {
      const k = (t * 0.28 + p.phase) % 1;
      p.m.position.set(p.base.x + Math.sin(k * 5 + p.phase * 6) * 0.05, p.base.y + k * p.rise, p.base.z);
      p.m.scale.setScalar(0.6 + k * 1.6);
      (p.m.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.55;
    }
    if (flies.visible) {
      for (let i = 0; i < flyCount; i++) {
        const j = i * 4;
        flyPos[i * 3] = flySeed[j] + Math.sin(t * 0.5 + flySeed[j + 3]) * 0.3;
        flyPos[i * 3 + 1] = flySeed[j + 1] + Math.sin(t * 0.9 + flySeed[j + 3]) * 0.12;
        flyPos[i * 3 + 2] = flySeed[j + 2] + Math.cos(t * 0.4 + flySeed[j + 3]) * 0.3;
      }
      flyGeo.attributes.position.needsUpdate = true;
    }
    for (const c of easels) c.rotation.y = azimuth;
    overlayMat.opacity = 0.34 + Math.sin(t * 3.2) * 0.1;
    if (dewDrops.visible) dewMat.opacity = 0.55 + Math.sin(t * 2.4) * 0.35;
    frame += 1;
    stepBurst(t);
    layContactSpots();
    outline.render(scene, camera);
  };
  loop();

  const onResize = () => {
    // Turning a phone sideways: the usual view follows the new shape unless the player had zoomed themself.
    camera.aspect = host.clientWidth / host.clientHeight;
    if (Math.abs(zoomGoal - usualZoom) < 1e-3) zoomGoal = villageZoom();
    badgeMat.uniforms.uSize.value = badgeSize();
    usualZoom = villageZoom();
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
    placeCamera();
  };
  window.addEventListener('resize', onResize);

  // Rival flags (desire plan D4): one tall flag per rival beaten at least once, on the island's corners, its cloth
  // showing the wins. A gold ball tops the pole once every trinket of that rival is won.
  const rivalFlags = new THREE.Group();
  island.add(rivalFlags);
  const CORNERS: [number, number][] = [[-3.82, 3.82], [3.82, 3.82], [-3.82, -3.82], [3.82, -3.82]];
  function drawRivalFlags(rivals: { id: string; wins: number; complete: boolean; flag?: string }[]) {
    rivalFlags.traverse((o: any) => {
      o.geometry?.dispose?.();
      o.material?.map?.dispose?.();
      o.material?.dispose?.();
    });
    rivalFlags.clear();
    rivals.forEach((r, i) => {
      if (!r.wins || i >= CORNERS.length) return;
      const g = new THREE.Group();
      g.name = `rival-flag-${r.id}`;
      g.add(mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.95, 8), 0x8a5a33, 0, 0.475, 0));
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = r.flag || '#f0606a';
        ctx.fillRect(0, 0, 128, 80);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 54px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(r.wins), 64, 44);
      }
      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      const clothMat = new THREE.MeshStandardMaterial({ map, roughness: 0.9, side: THREE.DoubleSide });
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), clothMat);
      cloth.position.set(0.21, 0.8, 0);
      cloth.castShadow = true;
      g.add(cloth);
      if (r.complete) g.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), 0xffc23d, 0, 0.97, 0));
      const [x, z] = CORNERS[i];
      g.position.set(x, TILE_TOP, z);
      g.rotation.y = x < 0 ? 0 : Math.PI;
      g.scale.setScalar(1.8);   // taller than the mate flags, so it reads from the opening camera
      rivalFlags.add(g);
    });
  }

  return {
    draw(v: any) {
      draw(v);
      syncActors(v);
    },
    drawShelf,
    drawRivalFlags,
    /** Dew drops over these field squares; an empty list clears them. */
    setDew,
    /** Tints squares: `cover` for reach, `strong` for reach that lands on a building, `origin` for the source. */
    setOverlay(cover: string[], strong: string[] = [], origin: string | null = null) {
      overlay.count = 0;
      const put = (sq: string, color: number) => {
        const i = overlay.count;
        if (i >= 64) return;
        const [x, z] = squareXZ(sq);
        dummy.position.set(x, 0, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        overlay.setMatrixAt(i, dummy.matrix);
        overlay.setColorAt(i, tint.setHex(color));
        overlay.count = i + 1;
      };
      for (const sq of cover) if (!strong.includes(sq)) put(sq, 0xffe27a);
      for (const sq of strong) put(sq, 0x7dffb0);
      if (origin) put(origin, 0xffffff);
      overlay.instanceMatrix.needsUpdate = true;
      if (overlay.instanceColor) overlay.instanceColor.needsUpdate = true;
    },
    setPicking(on: boolean) {
      picking = on;
    },
    rotate(dir: number) {
      azimuthGoal += (dir * Math.PI) / 2;
    },
    /** Arrive low, looking up at the board's underside above the dome, and tip down onto the island over about a second. */
    enter() {
      pitch = 0.32;
      zoom = 1.15;
      zoomGoal = 1;
      lift = 9;
      ease = 2.6;
      closeInAt = clock.elapsedTime + 1.15;
      placeCamera();
    },
    /** How far down the panels over the scene reach, in pixels; the scene keeps its middle below them on a tall screen. */
    setTopInset(px: number) {
      topInset = Math.max(0, px);
      placeCamera();
    },
    /** ➕ / ➖ buttons: the same steps as a few wheel notches, centred on the middle of the screen. */
    zoomStep(dir: number) {
      closeInAt = 0;
      zoomTo(zoomGoal * (dir > 0 ? 0.8 : 1.25));
    },
    setNight(on: boolean) {
      night = on;
      applyPalette(on ? 'night' : 'day');
    },
    /** A small picture of the island for the album. */
    photo(w = 480) {
      // Always the whole island, however far the player has zoomed in.
      const [z, px, pz] = [zoom, pan.x, pan.y];
      zoom = 1;
      pan.set(0, 0);
      placeCamera();
      undersea.setCloseness(0);
      outline.render(scene, camera);
      zoom = z;
      pan.set(px, pz);
      placeCamera();
      undersea.setCloseness((0.95 - zoom) / (0.95 - villageZoom()));
      const small = document.createElement('canvas');
      small.width = w;
      small.height = Math.round((w * host.clientHeight) / host.clientWidth);
      small.getContext('2d')!.drawImage(renderer.domElement, 0, 0, small.width, small.height);
      return small.toDataURL('image/jpeg', 0.72);
    },
    dispose() {
      cancelAnimationFrame(raf);
      delete (window as any).wildcrownIsland;
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onUp);
      scene.traverse((o: any) => {
        o.geometry?.dispose?.();
        for (const m of [o.material].flat()) m?.dispose?.();
      });
      renderer.dispose();
      host.innerHTML = '';
    }
  };
}
