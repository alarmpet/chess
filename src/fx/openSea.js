// The board's island in open ocean: a real sea floor running from beach through a bright lagoon and reef shelf down to the deep,
// clear water over it, and a sky with clouds. Water colour and clarity come from the depth of that same floor, worked out
// from the shape of the island, so there is no depth pass and the water still costs one quad.
import * as THREE from 'three';

/** How far the beach reaches past the board's rim. */
const BEACH = 0.26;
const CORNER = 0.35;
const SKY_RADIUS = 58;

// The island's outline and the sea floor exist twice, here and in SHAPE_GLSL, and must stay the same.
export function islandEdge(x, z, half) {
  const qx = Math.abs(x) - (half - CORNER);
  const qz = Math.abs(z) - (half - CORNER);
  const box = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - CORNER;
  const a = Math.atan2(z, x);
  return box + 0.07 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 7 + 4) + 0.03 * Math.sin(a * 13);
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Depth below the waterline at `e` world units past the shore; negative is dry beach. */
export function seaDepth(e) {
  return -0.05 + 0.5 * smooth(0, 0.6, e) + 0.15 * smooth(0.6, 2.2, e) + 2.6 * smooth(2.2, 4.4, e) + 2 * smooth(4.4, 10, e);
}

const SHAPE_GLSL = `
uniform float uHalf, uScale;
float islandEdge(vec2 p) {
  vec2 q = abs(p) - vec2(uHalf - ${CORNER.toFixed(2)});
  float box = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - ${CORNER.toFixed(2)};
  float a = atan(p.y, p.x);
  return box + 0.07 * sin(a * 3.0 + 1.0) + 0.05 * sin(a * 7.0 + 4.0) + 0.03 * sin(a * 13.0);
}
float seaDepth(float e) {
  return -0.05 + 0.5 * smoothstep(0.0, 0.6, e) + 0.15 * smoothstep(0.6, 2.2, e) + 2.6 * smoothstep(2.2, 4.4, e) + 2.0 * smoothstep(4.4, 10.0, e);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
// The reef's outer edge wanders; close to shore the outline stays true.
float wander(vec2 p, float e) {
  return (noise(p * 0.7) + 0.5 * noise(p * 1.9) - 0.75) * 1.5 * smoothstep(0.8, 2.2, e);
}`;

const WORLD_VERT = `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FLOOR_FRAG = `
uniform float uTime;
uniform vec3 uSand, uLagoon, uReef, uDeep, uCaustic, uSun;
varying vec3 vWorld;
${SHAPE_GLSL}
// Light net on the sea floor, after Dave Hoskins' water turbulence.
float caustic(vec2 uv, float t) {
  vec2 p = mod(uv * 6.2832, 6.2832) - 250.0;
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 3; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c = 1.17 - pow(c / 3.0, 1.4);
  return pow(abs(c), 8.0);
}
void main() {
  vec2 p = vWorld.xz / uScale;
  float e = islandEdge(p);
  float depth = seaDepth(e + wander(p, e));
  float grain = noise(p * 14.0) * 0.5 + noise(p * 4.0) * 0.5;
  vec3 col = uSand * (0.93 + 0.1 * grain);
  // Wet sand, then rippled lagoon floor, then patches of reef rock, then blue.
  col = mix(col, col * vec3(0.82, 0.74, 0.6), smoothstep(0.14, 0.0, abs(e - 0.13)));
  col = mix(col, uLagoon * (0.94 + 0.12 * grain), smoothstep(0.14, 0.62, e));
  col *= 1.0 + 0.07 * sin((p.x + p.y * 0.6) * 15.0 + noise(p * 2.0) * 7.0) * smoothstep(0.2, 0.7, e);
  float rock = smoothstep(0.42, 0.68, noise(p * 1.6 + 7.0)) * smoothstep(0.35, 0.9, e);
  col = mix(col, uReef, rock * 0.8);
  col = mix(col, uDeep, smoothstep(0.5, 2.4, depth));
  if (e > 0.0) {
    float light = caustic(p * 0.42, uTime * 0.55);
    col += uCaustic * min(light, 1.6) * 1.3 * exp(-depth * 0.9) * smoothstep(0.12, 0.3, e);
  }
  // The board's shadow on the beach, which this unlit floor would otherwise miss.
  vec2 off = p + uSun.xz * 0.16;
  vec2 q = abs(off) - vec2(uHalf - ${BEACH.toFixed(2)});
  float shade = 1.0 - 0.3 * smoothstep(0.22, -0.04, max(q.x, q.y));
  gl_FragColor = vec4(col * shade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const WATER_FRAG = `
uniform float uTime, uFadeFrom, uFadeTo;
uniform vec3 uDeep, uShallow, uFoam, uHorizon, uSky, uSun;
varying vec3 vWorld;
${SHAPE_GLSL}
// The sea looked like still glass from the player camera (user, 2026-11-05: 「파도도 안 치고 너무 잔잔해」). Longer
// swells weigh more than the ripples, rolling crests run in toward the island, and the open sea gets whitecaps.
// All in this fragment: the water stays one quad (mission round: none of three models wanted vertex displacement).
float swell(vec2 p, float t) {
  return noise(p * 1.15 + t * vec2(0.16, 0.09)) + 0.45 * noise(p * 5.1 - t * vec2(0.3, 0.2)) + 0.12 * noise(p * 11.0 + t * vec2(0.1, -0.45));
}
const vec2 ROLL_DIR = vec2(0.42, 0.91);   // crests travel toward the island from the far side of the player camera
float roll(vec2 p, float t, float h) { return sin(dot(p, ROLL_DIR) * 1.7 + t * 1.35 + h * 1.4); }
void main() {
  vec2 p = vWorld.xz / uScale;
  float t = uTime;
  float e = islandEdge(p);
  float h = swell(p, t);
  float r = roll(p, t, h);
  // Open water only: by the beach the shore foam and the shallows do the moving.
  float far = smoothstep(0.7, 2.6, e);
  vec2 slope = vec2(h - swell(p + vec2(0.18, 0.0), t), h - swell(p + vec2(0.0, 0.18), t)) * 1.4;
  slope -= ROLL_DIR * cos(dot(p, ROLL_DIR) * 1.7 + t * 1.35 + h * 1.4) * 0.4 * far;
  vec3 N = normalize(vec3(slope.x, 1.0, slope.y));
  vec3 V = normalize(cameraPosition - vWorld);
  float depth = max(seaDepth(e + wander(p, e)), 0.0);
  float clear = exp(-depth * 0.72);
  vec3 col = mix(uDeep, uShallow, exp(-depth * 0.85));
  // Shadows of clouds crossing the sea.
  col *= 1.0 - 0.2 * smoothstep(0.5, 0.78, noise(p * 0.11 + t * vec2(0.012, 0.007)));
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
  col = mix(col, uSky, fresnel * 0.75);
  float glint = pow(max(dot(reflect(-V, N), uSun), 0.0), 260.0) * 1.6;
  float alpha = clamp(1.0 - clear * 0.9 + fresnel * 0.5, 0.08, 0.97);
  float wave = sin(e * 15.0 - t * 1.15 + h * 3.0) * 0.5 + 0.5;
  float foam = smoothstep(0.84, 0.98, wave) * smoothstep(0.42, 0.14, e) * smoothstep(0.3, 0.62, noise(p * 7.0 + t * 0.2));
  foam = max(foam, smoothstep(0.17, 0.12, e + (h - 0.9) * 0.18));
  // Crests catch the light a shade paler; the highest of them break into whitecaps here and there.
  col = mix(col, mix(uShallow, uFoam, 0.4), smoothstep(0.55, 1.0, r) * 0.28 * far);
  float caps = smoothstep(0.8, 0.97, r) * smoothstep(0.58, 0.82, noise(p * 3.1 - t * vec2(0.35, 0.2))) * far;
  foam = max(foam, caps * 0.7);
  col = mix(col, uFoam, foam);
  col += vec3(1.0, 0.96, 0.85) * glint;
  gl_FragColor = vec4(col, max(max(alpha, foam * 0.92), min(glint, 1.0)));
  #include <tonemapping_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uHorizon, smoothstep(uFadeFrom, uFadeTo, length(p)));
  #include <colorspace_fragment>
}`;

const SKY_FRAG = `
uniform vec3 uHorizon, uZenith, uSun;
varying vec3 vWorld;
void main() {
  vec3 dir = normalize(vWorld - cameraPosition);
  vec3 col = mix(uHorizon, uZenith, pow(max(dir.y, 0.0), 0.6));
  float sun = max(dot(dir, uSun), 0.0);
  col += vec3(1.0, 0.92, 0.75) * (pow(sun, 8.0) * 0.16 + pow(sun, 400.0));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

// Rings packed tightly at the shoreline, where the outline has to be exact, and wide apart out at sea.
function floorGeometry(half, spokes = 280) {
  const radii = [];
  for (let r = half - 0.5; r < 34; r *= r < half + 1 ? 1.016 : 1.11) radii.push(r);
  const pos = [];
  const index = [];
  for (const r of radii) {
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      // A circle's radius stretched by the square's, so rings follow the coast rather than crossing it.
      const reach = r / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))) ** 0.6;
      const x = Math.cos(a) * reach;
      const z = Math.sin(a) * reach;
      pos.push(x, -seaDepth(islandEdge(x, z, half)), z);
    }
  }
  for (let j = 0; j < radii.length - 1; j++) {
    for (let i = 0; i < spokes; i++) {
      const a = j * spokes + i;
      const b = j * spokes + ((i + 1) % spokes);
      const c = a + spokes;
      const d = b + spokes;
      index.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  return g;
}

function makeClouds(group, rand) {
  const puffs = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 2),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#cfe4f2', emissiveIntensity: 0.55, fog: false }),
    96
  );
  const at = new THREE.Object3D();
  // A few low ones pass through the frame beside the island; the rest stand on the horizon.
  const spots = [[-5.2, 2.0, -1.2, 0.5], [5.6, 2.2, -2.4, 0.55], [-3.4, 2.5, -5.4, 0.6], [4.2, 2.6, -6.2, 0.7],
    [-16, 6, -24, 2.4], [14, 7, -28, 2.8], [-30, 8, -8, 3], [30, 7, 6, 2.6], [-8, 5, 30, 2.4], [22, 8, 24, 2.8], [0, 9, -34, 3.2], [-26, 6, 22, 2.4]];
  let n = 0;
  for (const [x, y, z, size] of spots) {
    for (let i = 0; i < 8; i++) {
      const across = (i / 7 - 0.5) * 2;
      const r = size * (0.55 + (1 - Math.abs(across)) * 0.5 + rand() * 0.15);
      at.position.set(x + across * size * 1.5, y + r * 0.25, z + (rand() - 0.5) * size * 0.8);
      at.scale.set(r, r * 0.68, r);
      at.updateMatrix();
      puffs.setMatrixAt(n, at.matrix);
      n += 1;
    }
  }
  puffs.frustumCulled = false;
  group.add(puffs);
  return puffs;
}

/**
 * Sea floor, water, sky and clouds around an island whose beach sits at `waterY`. Returns the per-frame update.
 * `scale` is the scale of `group`, for a scene drawn bigger than the board (the village); the sea keeps its proportions.
 */
export function createOpenSea(group, env, { islandHalf, waterY, rand, scale = 1, sky: withSky = true }) {
  const sea = env.sea;
  const half = islandHalf + BEACH;
  const sun = new THREE.Vector3(3.8, 8.5, 4.2).normalize();
  const horizon = new THREE.Color(env.background);
  const color = (hex) => new THREE.Color(hex);
  const shared = { uTime: { value: 0 }, uHalf: { value: half }, uScale: { value: scale }, uSun: { value: sun } };

  const floor = new THREE.Mesh(floorGeometry(half), new THREE.ShaderMaterial({
    vertexShader: WORLD_VERT,
    fragmentShader: FLOOR_FRAG,
    uniforms: {
      ...shared,
      uSand: { value: color(sea.sand) },
      uLagoon: { value: color(sea.lagoon) },
      uReef: { value: color(sea.reef) },
      uDeep: { value: color(sea.floor) },
      uCaustic: { value: color(sea.caustic) }
    }
  }));
  floor.position.y = waterY;
  floor.frustumCulled = false;
  group.add(floor);

  const water = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShaderMaterial({
    vertexShader: WORLD_VERT,
    fragmentShader: WATER_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      uDeep: { value: color(sea.deep) },
      uShallow: { value: color(sea.shallow) },
      uFoam: { value: color(sea.foam) },
      uHorizon: { value: horizon },
      uSky: { value: color(sea.sky) },
      uFadeFrom: { value: sea.fadeFrom ?? 16 },
      uFadeTo: { value: sea.fadeTo ?? 46 }
    }
  }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = waterY;
  water.renderOrder = 2;
  group.add(water);

  let skyUniforms = null;
  if (withSky) {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, 32, 16), new THREE.ShaderMaterial({
      vertexShader: WORLD_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uHorizon: { value: horizon }, uZenith: { value: color(sea.zenith) }, uSun: { value: sun } }
    }));
    sky.renderOrder = -1;
    group.add(sky);
    skyUniforms = sky.material.uniforms;
  }

  const clouds = makeClouds(group, rand);

  return {
    /** The live colour uniforms, for a scene that changes its light (the village at night). */
    floor: floor.material.uniforms,
    water: water.material.uniforms,
    /** 하늘 색 유니폼(하늘을 그리지 않으면 null) — 매치 포인트 무대가 한 톤 낮춘다. uHorizon 은 물과 같은 색 객체다. */
    sky: skyUniforms,
    waterY,
    /** Height of the sea floor under a point, for anything standing on it. */
    floorY: (x, z) => waterY - seaDepth(islandEdge(x, z, half)),
    edge: (x, z) => islandEdge(x, z, half),
    tick(t) {
      shared.uTime.value = t;
      clouds.position.x = Math.sin(t * 0.03) * 0.5;
    }
  };
}
