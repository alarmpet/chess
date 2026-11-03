// The village as a tabletop diorama on water (docs/plans/2026-10-31-crown-island-plan.md §7). Everything three.js lives here;
// VillageView only passes saves in and hears about taps. Its own scene, so the chess engine stays untouched while this is open.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildSeaBiome } from '../fx/seaBiome.js';
import { stageForHearts, tenantAnimal, tenantRarity } from './economy.js';
import { villageTiles } from './roster.js';

const FILES = 'abcdefgh';
const SPECIES: Record<string, string> = { king: 'lion', queen: 'tiger', rook: 'rhino', bishop: 'panda', knight: 'kangaroo', pawn: 'meerkat' };
const ROLE_OF: Record<string, string> = { a: 'rook', b: 'knight', c: 'bishop', d: 'queen', e: 'king', f: 'bishop', g: 'knight', h: 'rook' };
export const slotRole = (slot: string) => (slot[3] === '2' || slot[3] === '7' ? 'pawn' : ROLE_OF[slot[2]]);
const squareXZ = (sq: string): [number, number] => [FILES.indexOf(sq[0]) - 3.5, 4.5 - Number(sq[1])];

const INK = [0.17, 0.1, 0.06];              // the outline colour joins the board to the comic ink cards
const NO_OUTLINE = { outlineParameters: { visible: false } };
const DOME_CUT = 0.3;                       // how far up the firefly station's height its brass base reaches
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
  day: { hemiSky: 0xfff0d8, hemiGround: 0x7f8fb8, hemi: 1.4, sun: 0xffdca8, sunPower: 2.6, deep: 0x0c6a80, shallow: 0x2aa9a6, foam: 0xd8fff0, exposure: 1, glow: 0 },
  night: { hemiSky: 0x3f5fa8, hemiGround: 0x24345a, hemi: 1.25, sun: 0x9db8ff, sunPower: 0.7, deep: 0x07233f, shallow: 0x0f6a78, foam: 0x9fd8ff, exposure: 1.15, glow: 1 }
};

// The chess board's sea (legend pack.json `environment`), so the village sits in the same water with the same reef and fish.
// That sea is laid out around the 8-square board; the village's island is SEA_SCALE times wider, so the sea is drawn that much bigger.
const SEA_ENV = {
  background: '#a9def0',
  sea: {
    depth: 0.34, deep: '#0a4c92', shallow: '#46e2d2', foam: '#f2fff8', sand: '#f0cf85', lagoon: '#a2efe2', reef: '#9fb7a4',
    floor: '#2f8fa8', caustic: '#cffff2', sky: '#bfe8fb', zenith: '#3f9fe8', islets: 9, fadeFrom: 9, fadeTo: 24
  },
  trees: { canopy: ['#7fb648', '#6aa84f', '#8cc44e', '#94ad54'], trunk: '#8a5a33' }
};
const BOARD_HALF = 4 * 0.34;                  // the chess engine's BOARD_SQ_SIZE
const SEA_SCALE = 4.05 / (BOARD_HALF + 0.07); // our island's rim over the board's
const WATER_Y = -0.82;
const SEA_NIGHT = { lagoon: 0x1d5f6a, sand: 0x6f6a5a, reef: 0x3c5a5a, floor: 0x10405a, caustic: 0x5f9fc0, sky: 0x2a3f6a };

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
${GROUND_NOISE}
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
}`);
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

export type IslandEvents = {
  onTile: (sq: string) => void;
  onBuilding: (id: number) => void;
  onActor: (slot: string | null, animal: string) => void;
};

export function createIsland(host: HTMLElement, events: IslandEvents) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;      // only small animals move: every third frame is enough, and it was the costliest pass
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.NeutralToneMapping;   // AgX washed the toy colours out, this keeps them
  host.appendChild(renderer.domElement);
  const outline = new OutlineEffect(renderer, { defaultThickness: 0.0024, defaultColor: INK, defaultAlpha: 1, defaultKeepAlive: true });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, host.clientWidth / host.clientHeight, 1, 120);
  let azimuth = Math.PI / 4;
  let azimuthGoal = azimuth;
  const placeCamera = () => {
    const aspect = host.clientWidth / host.clientHeight;
    const halfH = THREE.MathUtils.degToRad(camera.fov / 2);
    const fit = Math.max(6.7 / Math.tan(halfH), 7.2 / (Math.tan(halfH) * aspect));   // the whole island fits, whatever the window
    const pitch = 0.74;
    camera.position.set(Math.sin(azimuth) * Math.cos(pitch) * fit, Math.sin(pitch) * fit, Math.cos(azimuth) * Math.cos(pitch) * fit);
    camera.lookAt(0, -0.85, 0);
  };
  placeCamera();

  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(-6, 11, 5);
  sun.castShadow = true;
  sun.shadow.camera.left = sun.shadow.camera.bottom = -8;
  sun.shadow.camera.right = sun.shadow.camera.top = 8;
  sun.shadow.camera.far = 30;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);

  const seaGroup = new THREE.Group();
  seaGroup.scale.setScalar(SEA_SCALE);
  scene.add(seaGroup);
  const biome = buildSeaBiome(seaGroup, SEA_ENV, {
    halfBoard: BOARD_HALF, surfaceY: WATER_Y / SEA_SCALE + SEA_ENV.sea.depth, rand: seeded('sea'), ground: false, scale: SEA_SCALE, sky: false, lifeSize: 0.55
  });
  const seaDay = {
    floor: Object.fromEntries(['uSand', 'uLagoon', 'uReef', 'uDeep', 'uCaustic'].map((k) => [k, biome.ocean.floor[k].value.clone()])),
    water: Object.fromEntries(['uDeep', 'uShallow', 'uFoam', 'uSky', 'uHorizon'].map((k) => [k, biome.ocean.water[k].value.clone()]))
  };
  // The sea is drawn by its own shaders, which the ink outline must not copy.
  const noInk = () => seaGroup.traverse((o: any) => {
    for (const m of [o.material].flat()) if (m) m.userData = NO_OUTLINE;
  });
  noInk();

  const island = new THREE.Group();
  scene.add(island);

  // Land: grass caps over soil blocks. One draw each, and instance colours carry the worn paths.
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
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
  const rootMat = toon(0x5a3a22, 1);
  rootMat.userData = NO_OUTLINE;
  for (let i = 0; i < 16; i++) {
    const side = i % 4;
    const along = -3.6 + rimRnd() * 7.2;
    const pts: THREE.Vector3[] = [];
    let drift = 0;
    for (let k = 0; k < 4; k++) {
      drift += (rimRnd() - 0.5) * 0.2;
      const a = along + drift;
      const o = 4.0;
      pts.push(new THREE.Vector3(side < 2 ? a : side === 2 ? o : -o, -0.1 - k * 0.2, side < 2 ? (side === 0 ? o : -o) : a));
    }
    island.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.022, 5), rootMat));
  }

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
  const loadGltf = (url: string) => {
    if (!gltfs.has(url)) gltfs.set(url, new Promise((ok, no) => loader.load(url, ok, undefined, no)));
    return gltfs.get(url)!;
  };
  biome.populate((name: string) => loadGltf(`./packs/legend/sea/${name}.glb`)).then(() => {
    noInk();
    renderer.shadowMap.needsUpdate = true;
  });

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
          o.material.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), TILE_TOP + dome)];
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

  function makeField(level: number, grain: number) {
    const g = new THREE.Group();
    const bed = new RoundedBoxGeometry(0.26, 0.09, 0.8, 2, 0.035);
    const stem = new THREE.ConeGeometry(0.035, 0.2, 5);
    const leaf = new THREE.SphereGeometry(0.05, 6, 5);
    const rnd = seeded(`field${level}`);
    for (const x of [-0.29, 0, 0.29]) {
      g.add(mesh(bed, 0x7a4a29, x, 0.045, 0));
      for (const z of [-0.27, 0, 0.27]) {
        const ripe = grain > 0;
        const h = 0.75 + rnd() * 0.4 + level * 0.15;
        const plant = mesh(stem, ripe ? 0xe6bb45 : 0x79b84a, x, 0.15 * h + 0.06, z);
        plant.scale.y = h;
        const tip = mesh(leaf, ripe ? 0xf2d060 : 0x8fce5a, x, 0.26 * h + 0.08, z);
        g.add(plant, tip);
      }
    }
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

  function makeTree(rnd: () => number, leaf: number) {
    const g = new THREE.Group();
    const h = 0.2 + rnd() * 0.08;
    const trunk = mesh(new THREE.CylinderGeometry(0.035, 0.06, h, 7), 0x8a5a33, 0, h / 2, 0);
    g.add(trunk);
    const ball = new THREE.IcosahedronGeometry(1, 2);
    const blobs: [number, number, number, number][] = [[0, h + 0.13, 0, 0.17], [0.11, h + 0.08, 0.04, 0.11], [-0.1, h + 0.09, -0.04, 0.12]];
    for (const [x, y, z, r] of blobs) {
      const b = mesh(ball, leaf, x, y, z);
      b.scale.setScalar(r * (0.92 + rnd() * 0.2));
      g.add(b);
    }
    return g;
  }

  function makeFlag(game: number) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.58, 6), 0x8a5a33, 0, 0.29, 0));
    const cloth = new THREE.Shape();
    cloth.moveTo(0, 0);
    cloth.lineTo(0.24, -0.07);
    cloth.lineTo(0, -0.15);
    const flag = mesh(new THREE.ShapeGeometry(cloth), game % 2 ? 0xffc23d : 0xf0606a, 0.012, 0.56, 0);
    (flag.material as THREE.Material).side = THREE.DoubleSide;
    g.add(flag);
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
      if (b.kind === 'mill' && b.tenant) {
        const sails = makeSails();
        const hub = LOOKS.mill.hub!;
        sails.position.set(Math.sin(hub.angle) * hub.out, hub.y, Math.cos(hub.angle) * hub.out);
        sails.rotation.y = hub.angle;
        at.add(sails);
        spinners.push(sails);
      }
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
    drawGround(v);
    const occupied = new Set([...v.built.map((b: any) => b.sq), ...v.decor.map((d: any) => d.sq)]);
    const LEAVES: Record<string, number> = { w: 0x7fb648, b: 0x6aa84f };
    for (const tree of v.map.trees.slice(-24)) {
      const rnd = seeded(`${tree.sq}${tree.slot}${tree.game}`);
      const m = makeTree(rnd, LEAVES[tree.slot[0]] ?? 0x7fb648);
      const [x, z] = squareXZ(tree.sq);
      const inset = occupied.has(tree.sq) ? 0.44 : 0.26;
      m.position.set(x + (rnd() < 0.5 ? inset : -inset), TILE_TOP, z + (rnd() < 0.5 ? inset : -inset));
      m.scale.setScalar(occupied.has(tree.sq) ? 0.6 : 1);
      marks.add(m);
    }
    drawNature(v, occupied);
    for (const b of v.built) placeBuilding(b, v);
    for (const d of v.decor) {
      const at = new THREE.Group();
      const [x, z] = squareXZ(d.sq);
      at.position.set(x, TILE_TOP, z);
      if (LOOKS[d.kind]) addBuildingModel(d.kind, at, false);
      else at.add(makeOldDecor(d.kind));
      marks.add(at);
    }
    for (const f of v.flags.slice(-12)) {
      const m = makeFlag(f.game);
      const [x, z] = squareXZ(f.sq);
      m.position.set(x - 0.3, TILE_TOP, z + 0.3);
      marks.add(m);
    }
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
    const dock = new THREE.Group();
    dock.position.set(-1.6, -0.78, 5.35);   // past the beach the sea brings in, so it stands in the water
    addBuildingModel('dock', dock, false);
    marks.add(dock);
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

  // Cards the player chose stand on a raft beside the island, turned to face whoever is looking.
  const raft = new THREE.Group();
  raft.position.set(5.0, -0.78, 2.4);
  raft.add(mesh(new RoundedBoxGeometry(1.2, 0.14, 1.6, 2, 0.06), 0x8a5a33));
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
    const { floor, water } = biome.ocean;
    for (const [k, c] of Object.entries(seaDay.floor)) floor[k].value.copy(c);
    for (const [k, c] of Object.entries(seaDay.water)) water[k].value.copy(c);
    if (name === 'night') {
      floor.uSand.value.setHex(SEA_NIGHT.sand);
      floor.uLagoon.value.setHex(SEA_NIGHT.lagoon);
      floor.uReef.value.setHex(SEA_NIGHT.reef);
      floor.uDeep.value.setHex(SEA_NIGHT.floor);
      floor.uCaustic.value.setHex(SEA_NIGHT.caustic);
      water.uDeep.value.setHex(p.deep);
      water.uShallow.value.setHex(p.shallow);
      water.uFoam.value.setHex(p.foam);
      water.uSky.value.setHex(SEA_NIGHT.sky);
      water.uHorizon.value.setHex(p.deep);
    }
    renderer.toneMappingExposure = p.exposure;
    scene.background = name === 'night' ? new THREE.Color(p.deep) : new THREE.Color(SEA_ENV.background);
    flies.visible = name === 'night';
    for (const g of glows) g.visible = name === 'night';
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
    aim(e);
    if (!picking) {
      const body = ray.intersectObject(actorRoots, true)[0];
      const key = body?.object.userData.actorKey;
      const a = key && actors.find((x) => x.key === key);
      if (a) {
        a.path = [];
        a.play('Cheer');
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

  const clock = new THREE.Clock();
  let raf = 0;
  let frame = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    biome.tick(t);
    grassWind.value = t;
    island.position.y = Math.sin(t * 0.7) * 0.012;
    if (Math.abs(azimuthGoal - azimuth) > 0.001) {
      azimuth += (azimuthGoal - azimuth) * Math.min(1, dt * 6);
      placeCamera();
    }
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
    frame += 1;
    if (frame % 3 === 0) renderer.shadowMap.needsUpdate = true;
    outline.render(scene, camera);
  };
  loop();

  const onResize = () => {
    camera.aspect = host.clientWidth / host.clientHeight;
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
    setNight(on: boolean) {
      night = on;
      applyPalette(on ? 'night' : 'day');
    },
    /** A small picture of the island for the album. */
    photo(w = 480) {
      outline.render(scene, camera);
      const small = document.createElement('canvas');
      small.width = w;
      small.height = Math.round((w * host.clientHeight) / host.clientWidth);
      small.getContext('2d')!.drawImage(renderer.domElement, 0, 0, small.width, small.height);
      return small.toDataURL('image/jpeg', 0.72);
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      scene.traverse((o: any) => {
        o.geometry?.dispose?.();
        for (const m of [o.material].flat()) m?.dispose?.();
      });
      renderer.dispose();
      host.innerHTML = '';
    }
  };
}
