// The reef under the clear water: corals on the shelf, fish in small schools and turtles and a manta circling the island.
// Every kind is one instanced mesh, swimming is a bend in its vertex shader, and nothing here touches the game.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Which way each model faced out of TRELLIS, as a turn about Y that brings its nose to +X, and its length in world units.
const TURN = Math.PI / 2;
const WEEDS = 60;
const SWIMMERS = {
  butterfly: { yaw: 0, size: 0.24, bend: 'fish' },
  reeffish: { yaw: TURN, size: 0.22, bend: 'fish' },
  angelfish: { yaw: TURN, size: 0.28, bend: 'fish' },
  parrotfish: { yaw: 0, size: 0.28, bend: 'fish' },
  turtle: { yaw: -TURN, size: 0.72, bend: 'flipper' },
  manta: { yaw: TURN, size: 1.7, bend: 'wing' }
};
const CORALS = { brain: [10, 0.3, 0.55], staghorn: [12, 0.34, 0.6], fan: [10, 0.34, 0.6], tube: [9, 0.26, 0.46] };
const SCHOOLS = [
  ['butterfly', 8, [-2.45, -0.6], 0.5, 0.42],
  ['butterfly', 6, [1.1, -2.5], 0.45, 0.4],
  ['angelfish', 5, [2.5, -0.9], 0.55, 0.32],
  ['angelfish', 4, [-1.4, 2.6], 0.5, 0.3],
  ['parrotfish', 5, [2.45, 1.3], 0.6, 0.36],
  ['parrotfish', 4, [-1.5, -2.5], 0.55, 0.34],
  ['reeffish', 2, [-2.5, 0.9], 0.16, 0.8],
  ['reeffish', 2, [0.6, 2.55], 0.16, 0.8],
  ['reeffish', 2, [2.55, -2.2], 0.16, 0.8]
];
const CRUISERS = [
  ['turtle', 1.0, -0.2, 0.05, 0],
  ['turtle', 1.5, -0.24, -0.038, 2.4],
  ['manta', 2.9, -0.55, 0.022, 4.2]
];

const BENDS = {
  // Tail sways more the further back it is.
  fish: `float back = smoothstep(0.15, -0.5, position.x);
    transformed.z += sin(uSwim * 8.0 + position.x * 6.0 + float(gl_InstanceID) * 1.7) * 0.2 * back * back;`,
  // The flippers row; the shell stays still.
  flipper: `float out_ = smoothstep(0.16, 0.42, abs(position.z));
    transformed.y += sin(uSwim * 1.7 + float(gl_InstanceID) * 2.0 + position.x) * 0.18 * out_;`,
  // A slow wave runs back along the wings.
  wing: `float tip = abs(position.z) * 2.0;
    transformed.y += sin(uSwim * 1.25 + position.x * 2.0) * 0.14 * tip * tip;`,
  // Rooted at the sea floor, loosest at the tip.
  weed: `float high = position.y * position.y;
    transformed.x += sin(uSwim * 1.1 + position.y * 3.0 + float(gl_InstanceID)) * 0.26 * high;
    transformed.z += cos(uSwim * 0.8 + position.y * 2.4 + float(gl_InstanceID) * 1.3) * 0.16 * high;`,
  // Each tentacle leans with the swell, the tips first.
  tentacle: `float loose = smoothstep(0.1, 0.8, position.y);
    transformed.x += sin(uSwim * 1.5 + position.z * 5.0 + float(gl_InstanceID) * 2.0) * 0.07 * loose;
    transformed.z += cos(uSwim * 1.2 + position.x * 5.0 + float(gl_InstanceID)) * 0.07 * loose;`
};

const swimTime = { value: 0 };

// Lit a little from within, so a colour survives the water over it.
function glowing(material) {
  const m = material.clone();
  m.emissive = new THREE.Color('#ffffff');
  m.emissiveMap = m.map;
  m.emissiveIntensity = 0.42;
  return m;
}

function bendable(material, bend) {
  const m = glowing(material);
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSwim = swimTime;
    shader.vertexShader = `uniform float uSwim;\n${shader.vertexShader}`.replace('#include <begin_vertex>', `#include <begin_vertex>\n${BENDS[bend]}`);
  };
  m.customProgramCacheKey = () => bend;
  return m;
}

// Drawn here rather than modelled: TRELLIS cannot unwrap this many fingers, and these move with the water.
function anemoneGeometry(rand) {
  const parts = [];
  const colors = [new THREE.Color('#37c9bd'), new THREE.Color('#ff5f9e')];
  const at = new THREE.Object3D();
  for (let i = 0; i < 70; i++) {
    const a = i * 2.39996;
    const lean = Math.sqrt((i + 0.5) / 70) * 1.25;   // spread evenly over a dome
    const dir = new THREE.Vector3(Math.sin(lean) * Math.cos(a), Math.cos(lean), Math.sin(lean) * Math.sin(a));
    const length = 0.26 + rand() * 0.12;
    const finger = new THREE.CapsuleGeometry(0.062, length, 3, 7);
    at.position.copy(dir).multiplyScalar(0.3 + length / 2).setY(dir.y * (0.22 + length / 2) + 0.12);
    at.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    at.scale.setScalar(1);
    at.updateMatrix();
    finger.applyMatrix4(at.matrix);
    const color = colors[rand() < 0.62 ? 0 : 1];
    const paint = new Float32Array(finger.attributes.position.count * 3);
    for (let v = 0; v < paint.length; v += 3) color.toArray(paint, v);
    finger.setAttribute('color', new THREE.BufferAttribute(paint, 3));
    parts.push(finger);
  }
  return mergeGeometries(parts);
}

// One mesh out of the GLB, centred on its base or middle and one unit long.
function unitMesh(gltf, yaw, onFloor) {
  let found = null;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((o) => { if (o.isMesh && !found) found = o; });
  if (!found) return null;
  const geometry = found.geometry.clone().applyMatrix4(found.matrixWorld).rotateY(yaw);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const size = box.getSize(new THREE.Vector3());
  const c = box.getCenter(new THREE.Vector3());
  geometry.translate(-c.x, onFloor ? -box.min.y : -c.y, -c.z);
  geometry.scale(...Array(3).fill(1 / Math.max(size.x, size.y, size.z)));
  return { geometry, material: found.material };
}

// A closed line a set distance off the shore, for anything that circles the island.
function shoreRing(ocean, e) {
  const pts = [];
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * Math.PI * 2;
    let lo = 0.5;
    let hi = 12;
    for (let k = 0; k < 18; k++) {
      const mid = (lo + hi) / 2;
      if (ocean.edge(Math.cos(a) * mid, Math.sin(a) * mid) < e) lo = mid;
      else hi = mid;
    }
    pts.push([Math.cos(a) * lo, Math.sin(a) * lo]);
  }
  return pts;
}

/** Loads what it can and returns the per-frame update; a model that fails to load just leaves that kind out. */
export async function populateReef(group, ocean, load, rand, { palms = [] } = {}) {
  const models = {};
  const names = [...Object.keys(SWIMMERS), ...Object.keys(CORALS), 'palm'];
  await Promise.all(names.map(async (name) => {
    const swimmer = SWIMMERS[name];
    try {
      const made = unitMesh(await load(name), swimmer?.yaw || 0, !swimmer);
      if (made) models[name] = made;
    } catch (e) {
      console.warn('reef model missing', name);
    }
  }));

  const at = new THREE.Object3D();
  const tint = new THREE.Color();

  const shelf = [];
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2;
    const r = 2.2 + rand() * 1.5;
    shelf.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (const [name, [count, small, big]] of Object.entries(CORALS)) {
    if (!models[name]) continue;
    const mesh = new THREE.InstancedMesh(models[name].geometry, glowing(models[name].material), count * 2);
    let n = 0;
    for (let tries = 0; tries < 400 && n < count * 2; tries++) {
      const [cx, cz] = shelf[Math.floor(rand() * shelf.length)];
      const x = cx + (rand() - 0.5) * 0.9;
      const z = cz + (rand() - 0.5) * 0.9;
      const e = ocean.edge(x, z);
      if (e < 0.42 || e > 2.0) continue;
      at.position.set(x, ocean.floorY(x, z) - 0.02, z);
      at.rotation.set(0, rand() * Math.PI * 2, 0);
      at.scale.setScalar(small + rand() * (big - small));
      at.updateMatrix();
      mesh.setMatrixAt(n, at.matrix);
      mesh.setColorAt(n, tint.setHSL(0, 0, 0.88 + rand() * 0.12));
      n += 1;
    }
    mesh.count = n;
    group.add(mesh);
  }

  if (models.palm && palms.length) {
    const mesh = new THREE.InstancedMesh(models.palm.geometry, models.palm.material, palms.length);
    palms.forEach(([x, y, z, size], i) => {
      at.position.set(x, y, z);
      at.rotation.set(0, Math.atan2(z, -x), 0);   // the model leans toward -X, and every palm leans out over the water
      at.scale.setScalar(size);
      at.updateMatrix();
      mesh.setMatrixAt(i, at.matrix);
    });
    mesh.castShadow = true;
    group.add(mesh);
  }

  // Clownfish stay at home: each pair circles its own anemone.
  const homes = SCHOOLS.filter(([name]) => name === 'reeffish').map((school) => school[2]);
  const anemones = new THREE.InstancedMesh(
    anemoneGeometry(rand),
    bendable(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65 }), 'tentacle'),
    homes.length
  );
  anemones.material.emissive.set('#123c3a');
  anemones.material.emissiveMap = null;
  anemones.material.emissiveIntensity = 1;
  homes.forEach(([x, z], i) => {
    at.position.set(x, ocean.floorY(x, z) - 0.02, z);
    at.rotation.set(0, rand() * 6, 0);
    at.scale.setScalar(0.34);
    at.updateMatrix();
    anemones.setMatrixAt(i, at.matrix);
  });
  group.add(anemones);

  // Blades taper to a point; a plain strip reads as a ribbon.
  const blade = new THREE.PlaneGeometry(0.07, 1, 1, 7).translate(0, 0.5, 0);
  const edge = blade.attributes.position;
  for (let i = 0; i < edge.count; i++) edge.setX(i, edge.getX(i) * (1 - edge.getY(i) ** 2));
  const weed = new THREE.InstancedMesh(
    blade,
    bendable(new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.8 }), 'weed'),
    WEEDS
  );
  weed.material.emissive.set('#0c3a24');
  weed.material.emissiveMap = null;
  weed.material.emissiveIntensity = 1;
  let blades = 0;
  for (let i = 0; i < WEEDS * 2 && blades < WEEDS; i++) {
    const [cx, cz] = shelf[i % shelf.length];
    const x = cx + (rand() - 0.5) * 0.7;
    const z = cz + (rand() - 0.5) * 0.7;
    if (ocean.edge(x, z) < 0.5) continue;
    at.position.set(x, ocean.floorY(x, z), z);
    at.rotation.set(0, rand() * Math.PI, 0);
    at.scale.setScalar(0.26 + rand() * 0.26);
    at.updateMatrix();
    weed.setMatrixAt(blades, at.matrix);
    weed.setColorAt(blades, tint.setHSL(0.27 + rand() * 0.12, 0.62, 0.26 + rand() * 0.12));
    blades += 1;
  }
  weed.count = blades;
  group.add(weed);

  // Swimmers, grouped so each kind is a single mesh.
  const movers = {};
  const addMover = (name, step) => {
    if (!models[name]) return;
    movers[name] ||= { list: [] };
    movers[name].list.push(step);
  };
  for (const [name, count, [cx, cz], reach, speed] of SCHOOLS) {
    const y0 = ocean.waterY - 0.16 - rand() * 0.14;
    const start = rand() * 7;
    const flip = rand() < 0.5 ? -1 : 1;
    for (let i = 0; i < count; i++) {
      // Each keeps its own place in the school, so it reads as a shoal and not a line.
      const lag = i * 0.42 + rand() * 0.2;
      const off = rand() * 7;
      const beside = (rand() - 0.5) * 0.34;
      const under = (rand() - 0.5) * 0.1;
      addMover(name, (t, p) => {
        const a = (t * speed + start - lag) * flip;
        p.set(
          cx + Math.cos(a) * (reach + beside) + Math.sin(t * 0.9 + off) * 0.06,
          y0 + under + Math.sin(t * 0.7 + off) * 0.035,
          cz + Math.sin(a * 0.8) * (reach + beside) * 0.8 + Math.cos(t * 0.7 + off) * 0.06
        );
      });
    }
  }
  for (const [name, e, dip, speed, start] of CRUISERS) {
    const ring = shoreRing(ocean, e);
    addMover(name, (t, p) => {
      const u = (((t * speed + start) / (Math.PI * 2)) % 1 + 1) % 1 * ring.length;
      const i = Math.floor(u);
      const f = u - i;
      const [ax, az] = ring[i];
      const [bx, bz] = ring[(i + 1) % ring.length];
      p.set(ax + (bx - ax) * f, ocean.waterY + dip + Math.sin(t * 0.3 + start) * 0.05, az + (bz - az) * f);
    });
  }

  const p = new THREE.Vector3();
  const last = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.Matrix4();
  const s = new THREE.Vector3();
  for (const [name, mover] of Object.entries(movers)) {
    const spec = SWIMMERS[name];
    mover.mesh = new THREE.InstancedMesh(models[name].geometry, bendable(models[name].material, spec.bend), mover.list.length);
    mover.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mover.mesh.frustumCulled = false;
    mover.size = spec.size;
    group.add(mover.mesh);
  }

  return (t) => {
    swimTime.value = t;
    for (const mover of Object.values(movers)) {
      mover.list.forEach((step, i) => {
        step(t - 0.05, last);
        step(t, p);
        q.setFromAxisAngle(up, Math.atan2(last.z - p.z, p.x - last.x));
        mover.mesh.setMatrixAt(i, m.compose(p, q, s.setScalar(mover.size)));
      });
      mover.mesh.instanceMatrix.needsUpdate = true;
    }
  };
}
