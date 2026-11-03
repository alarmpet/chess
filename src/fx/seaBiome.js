// The board as an island: a slice of ground under the squares, the same water as the village, and small islets out to sea.
// Turned on by a pack's `environment.sea`, so packs with their own biome are untouched.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createOpenSea } from './openSea.js';
import { populateReef } from './reefLife.js';

const material = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });

// The pale water and ring of surf around an islet, which is what makes it sit in the sea rather than on it.
function shallowsTexture(shallow) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const fade = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  fade.addColorStop(0.3, 'rgba(255,255,255,0.9)');
  fade.addColorStop(0.38, shallow);
  fade.addColorStop(1, 'rgba(70,226,210,0)');
  g.fillStyle = fade;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeIslet(rand, leaves, trunk, sand, shallows) {
  const g = new THREE.Group();
  const w = 0.5 + rand() * 0.7;
  const halo = new THREE.Mesh(new THREE.CircleGeometry(w * 3, 40).rotateX(-Math.PI / 2), shallows);
  halo.position.y = 0.012;
  halo.renderOrder = 3;
  const beach = new THREE.Mesh(new THREE.SphereGeometry(w * 1.12, 28, 12), material(sand));
  beach.scale.y = 0.15;
  const grass = new THREE.Mesh(new THREE.SphereGeometry(w * 0.74, 24, 10), material('#8cc44e'));
  grass.scale.y = 0.22;
  grass.position.y = 0.05;
  grass.receiveShadow = true;
  g.add(halo, beach, grass);
  const ball = new THREE.IcosahedronGeometry(1, 2);
  const count = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < count; i++) {
    const tree = new THREE.Group();
    const a = rand() * Math.PI * 2;
    const r = rand() * w * 0.5;
    tree.position.set(Math.cos(a) * r, 0.14, Math.sin(a) * r);
    const h = 0.26 + rand() * 0.2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, h, 7), trunk);
    stem.position.y = h / 2;
    tree.add(stem);
    const leaf = leaves[Math.floor(rand() * leaves.length)];
    for (const [x, y, z, s] of [[0, h + 0.14, 0, 0.2], [0.13, h + 0.08, 0.05, 0.13], [-0.12, h + 0.09, -0.05, 0.14]]) {
      const blob = new THREE.Mesh(ball, leaf);
      blob.position.set(x, y, z);
      blob.scale.setScalar(s);
      blob.castShadow = true;
      tree.add(blob);
    }
    g.add(tree);
  }
  return g;
}

/** Soft outdoor reflections in place of the cathedral's: open sky above, sea below, and the sun's side a little warmer. */
export function daylightEnvironment(renderer, env) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Scene();
  room.background = new THREE.Color(env.background);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const panel = (color, strength, pos, size) => {
    const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength) }));
    m.position.fromArray(pos);
    m.scale.fromArray(size);
    room.add(m);
  };
  panel('#d8c79c', 0.8, [0, -6, 0], [60, 1, 60]);
  panel(env.sun?.color || '#fff4de', 5, [8, 14, 9], [12, 1, 12]);
  const texture = pmrem.fromScene(room, 0.04).texture;
  box.dispose();
  pmrem.dispose();
  return texture;
}

/**
 * Fills `group`. `tick` is the per-frame update; `populate` brings in the models, which can arrive after the game has started.
 * The village draws its own island, so it passes `ground: false`, and `scale` (the group's) with `sky: false` and a smaller `lifeSize`.
 */
export function buildSeaBiome(group, env, { halfBoard, surfaceY, rand, ground = true, scale = 1, sky = true, lifeSize = 1 }) {
  const sea = env.sea;
  const depth = sea.depth ?? 0.34;
  const waterY = surfaceY - depth;
  if (ground) addGround(group, { halfBoard, surfaceY, depth, waterY, rand });   // first, so the board's seeded layout is as it was
  const ocean = createOpenSea(group, env, { islandHalf: halfBoard + 0.07, waterY, rand, scale, sky });

  const leaves = (env.trees?.canopy || ['#6fa83f']).map((c) => material(c, 0.85));
  const trunk = material(env.trees?.trunk || '#8a5a33');
  const shallows = new THREE.MeshBasicMaterial({ map: shallowsTexture(sea.shallow), transparent: true, depthWrite: false, fog: false });
  const palms = [[-1.62, -1.44, 1], [1.62, -1.38, 0.95], [-1.64, 1.44, 0.7], [1.66, 1.4, 0.75]].map(([x, z, size]) => [x, waterY + 0.04, z, size]);
  const islets = sea.islets ?? 9;
  for (let i = 0; i < islets; i++) {
    const islet = makeIslet(rand, leaves, trunk, sea.sand, shallows);
    const a = (i / islets) * Math.PI * 2 + rand() * 0.4;
    const r = 7 + rand() * 9;
    islet.position.set(Math.cos(a) * r, waterY, Math.sin(a) * r);
    islet.scale.setScalar(0.8 + rand() * 0.9);
    group.add(islet);
    palms.push([islet.position.x + 0.2, waterY + 0.1, islet.position.z, islet.scale.x * 0.8]);
  }

  let life = null;
  return {
    ocean,
    tick(t) {
      ocean.tick(t);
      life?.(t);
    },
    async populate(load) {
      life = await populateReef(group, ocean, load, rand, { palms, size: lifeSize });
    }
  };
}

// The slice of ground under the board, and stones on its cut face and along the waterline, as on the village island.
function addGround(group, { halfBoard, surfaceY, depth, waterY, rand }) {
  const soil = new THREE.Mesh(new RoundedBoxGeometry(halfBoard * 2 + 0.14, depth + 0.1, halfBoard * 2 + 0.14, 3, 0.03), material('#9a6438', 1));
  soil.position.y = surfaceY - 0.05 - (depth + 0.1) / 2;
  soil.castShadow = true;
  soil.receiveShadow = true;
  group.add(soil);

  // Stones on the cut face and along the waterline, as on the village island.
  const stones = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), material('#ffffff', 1), 96);
  const at = new THREE.Object3D();
  const tint = new THREE.Color();
  const edge = halfBoard + 0.07;
  for (let i = 0; i < stones.count; i++) {
    const side = i % 4;
    const along = (rand() * 2 - 1) * edge;
    const low = i % 3 === 0;
    const out = edge + rand() * 0.012;
    at.position.set(side < 2 ? along : side === 2 ? out : -out, low ? waterY + 0.01 : surfaceY - 0.09 - rand() * (depth - 0.12), side < 2 ? (side === 0 ? out : -out) : along);
    const s = low ? 0.03 + rand() * 0.035 : 0.012 + rand() * 0.02;
    at.scale.set(s * 1.3, s, s);
    at.rotation.set(rand() * 3, rand() * 3, 0);
    at.updateMatrix();
    stones.setMatrixAt(i, at.matrix);
    stones.setColorAt(i, tint.set(low ? '#8f8a80' : '#6e4a2c').offsetHSL(0, 0, (rand() - 0.5) * 0.08));
  }
  group.add(stones);
}
