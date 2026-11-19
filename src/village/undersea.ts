// 아틀란티스 수중 마을의 바깥 세계 (docs/plans/2026-11-05-atlantis-village-plan.md §3, PR B · AT-3·4·5).
// 섬(8×8 칸)은 islandScene.ts 가 그대로 그리고, 이 파일은 그 둘레만 만든다: 물 색 그라디언트 · 거리 안개 · 빛줄기 · 부유 입자 · 거품 ·
// 해저 · 유리 돔(굴절 없는 싸구려 유리: 프레넬 테두리 + 흐르는 물결 무늬) · 청동 리브 · 기초 링 · 폐허 · 해파리 · 판 밑면 · 승강 거품관.
// 산호·물고기·해초는 체스판 바다의 populateReef 를 그대로 쓴다 — 그 함수는 ocean 의 edge·floorY·waterY 만 읽으므로 돔 둘레를 그 모양으로 흉내 낸다.
// 물결 무늬는 이 파일의 노이즈로 만든다(openSea.js 의 caustic() 은 출처 라이선스 확인 전이라 쓰지 않는다 — 계획서 §7-6).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { populateReef } from '../fx/reefLife.js';

const NO_OUTLINE = { outlineParameters: { visible: false } };
const quiet = <T extends THREE.Material>(m: T) => {
  m.userData = NO_OUTLINE;
  return m;
};

export const SEABED_Y = -0.95;
export const DOME_R = 6.4;
const DOME_TOP = SEABED_Y + DOME_R;
const BOARD_Y = 12.6;          // 체스판 섬 밑면의 높이: 기본 카메라 화면의 맨 위에 걸친다
const BOARD_R = 10.2;
const REEF_SCALE = 2.83;       // 체스판 바다를 마을 크기로 키우던 배율(예전 SEA_SCALE) — 물고기 떼의 위치가 그대로 맞는다
const REEF_LIFE = 0.55;

type Palette = { top: number; mid: number; deep: number; fog: number; sand: number; shaft: number; glass: number; jelly: number };
const PALETTES: Record<'day' | 'night', Palette> = {
  day: { top: 0x2fb4c4, mid: 0x0f5e8c, deep: 0x07294c, fog: 0x0e5a86, sand: 0x6f9a9c, shaft: 0.55, glass: 0x9fefff, jelly: 0.9 },
  night: { top: 0x123a6a, mid: 0x08214a, deep: 0x030c22, fog: 0x061a3a, sand: 0x2c3c52, shaft: 0.18, glass: 0x6fb8ff, jelly: 1.6 }
};

// 모든 셰이더가 같이 쓰는 노이즈와 물결 무늬. 두 노이즈의 차가 0 에 가까운 곳만 밝혀 가는 그물 선이 된다.
const NOISE = `
float uHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float uNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(uHash(i), uHash(i + vec2(1, 0)), f.x), mix(uHash(i + vec2(0, 1)), uHash(i + vec2(1, 1)), f.x), f.y);
}
float uRipple(vec2 p, float t) {
  float a = uNoise(p * 1.9 + vec2(t * 0.21, t * 0.13));
  float b = uNoise(p * 2.4 - vec2(t * 0.17, -t * 0.11));
  return pow(1.0 - abs(a - b), 14.0);
}`;
export const RIPPLE_GLSL = NOISE;

export type Undersea = ReturnType<typeof createUndersea>;

export function createUndersea(scene: THREE.Scene, rand: () => number) {
  const root = new THREE.Group();
  root.name = 'undersea';
  scene.add(root);
  const time = { value: 0 };
  const fog = new THREE.Fog(PALETTES.day.fog, 30, 70);
  scene.fog = fog;

  // ── 물 색: 위는 햇빛이 비치는 청록, 눈높이는 짙은 파랑, 아래는 거의 검은 남색. 안개를 받지 않는 큰 공 하나.
  const water = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() }, uTime: time },
    vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uTop, uMid, uDeep; uniform float uTime; varying vec3 vDir;
${NOISE}
void main() {
  float h = vDir.y;
  vec3 col = mix(uMid, uTop, smoothstep(-0.05, 0.75, h));
  col = mix(col, uDeep, smoothstep(0.0, -0.6, h));
  col += uTop * 0.35 * smoothstep(0.55, 1.0, h) * (0.6 + 0.4 * uRipple(vDir.xz * 6.0, uTime));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), quiet(water));
  sky.renderOrder = -10;
  root.add(sky);

  // ── 해저: 모래 원판 위로 물결 빛이 흐르고, 돔 둘레는 돔이 드리운 그늘로 조금 어둡다.
  const seabedMat = quiet(new THREE.MeshStandardMaterial({ color: PALETTES.day.sand, roughness: 1, metalness: 0 }));
  seabedMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec2 vSeabed;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvSeabed = (modelMatrix * vec4(transformed, 1.0)).xz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nvarying vec2 vSeabed;\n${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float r = length(vSeabed);
  float dunes = uNoise(vSeabed * 0.35) * 0.6 + uNoise(vSeabed * 1.3) * 0.4;
  diffuseColor.rgb *= 0.82 + 0.3 * dunes;
  diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(${DOME_R.toFixed(1)} - 0.2, ${(DOME_R + 2.5).toFixed(1)}, r));
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(0.45, 0.85, 1.0) * uRipple(vSeabed * 0.45, uTime) * 0.45;`);
  };
  const seabed = new THREE.Mesh(new THREE.CircleGeometry(60, 72).rotateX(-Math.PI / 2), seabedMat);
  seabed.position.y = SEABED_Y;
  seabed.receiveShadow = false;
  root.add(seabed);

  // ── 유리 돔: 거의 투명하고, 가장자리로 갈수록(프레넬) 청록 빛이 차오르며, 표면 위로 물결 그물이 천천히 흐른다. 굴절 패스는 없다(1콜).
  const glassColor = { value: new THREE.Color(PALETTES.day.glass) };
  const glassFade = { value: 1 };   // 1 = 다 보임. 섬을 확대하면 돔이 흐려진다(setCloseness)
  const glass = new THREE.MeshStandardMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.06, roughness: 0.1, metalness: 0, depthWrite: false, side: THREE.FrontSide });
  glass.userData = NO_OUTLINE;
  glass.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uGlass = glassColor;
    shader.uniforms.uGlassFade = glassFade;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vGlassWorld;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvGlassWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform vec3 uGlass;\nuniform float uGlassFade;\nvarying vec3 vGlassWorld;\n${NOISE}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.6);
float web = uRipple(vGlassWorld.xz * 0.5 + vGlassWorld.y * 0.3, uTime * 0.6);
float crown = smoothstep(${(DOME_TOP - 2.2).toFixed(2)}, ${DOME_TOP.toFixed(2)}, vGlassWorld.y);
totalEmissiveRadiance += uGlass * (rim * 0.9 + web * 0.35 + crown * 0.25) * uGlassFade;
diffuseColor.a = clamp(diffuseColor.a + rim * 0.55 + web * 0.18 + crown * 0.1, 0.0, 0.85) * uGlassFade;`);
  };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(DOME_R, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  dome.position.y = SEABED_Y;
  dome.renderOrder = 5;
  root.add(dome);

  // 청동 리브: 경선 12줄(반원 6개) + 위선 2줄을 한 지오메트리로. 잉크 외곽선을 받아 카드 그림과 이어진다(1콜 + 외곽선 1).
  const ribs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const arc = new THREE.TorusGeometry(DOME_R + 0.02, 0.035, 6, 64, Math.PI);
    arc.rotateY((i * Math.PI) / 6);
    ribs.push(arc);
  }
  for (const h of [0.36, 0.72]) {
    const y = DOME_R * h;
    const r = Math.sqrt(DOME_R * DOME_R - y * y) + 0.02;
    ribs.push(new THREE.TorusGeometry(r, 0.04, 6, 72).rotateX(Math.PI / 2).translate(0, y, 0));
  }
  ribs.push(new THREE.CylinderGeometry(0.42, 0.5, 0.18, 20).translate(0, DOME_R, 0));
  const ribMat = new THREE.MeshStandardMaterial({ color: 0xc9944a, roughness: 0.4, metalness: 0.5, transparent: true });
  const ribMesh = new THREE.Mesh(mergeGeometries(ribs), ribMat);
  ribMesh.position.y = SEABED_Y;
  root.add(ribMesh);
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(DOME_R, 0.32, 10, 96).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd9d2bf, roughness: 0.9 })
  );
  baseRing.position.y = SEABED_Y + 0.05;
  root.add(baseRing);

  // ── 폐허: 돔 밖에 흩어진 기둥 · 아치 · 조각. 안개가 멀리 있는 것부터 물에 녹인다(3콜).
  const stone = quiet(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }));
  const column = mergeGeometries([
    new THREE.CylinderGeometry(0.28, 0.32, 1, 12).translate(0, 0.5, 0),
    new THREE.BoxGeometry(0.8, 0.16, 0.8).translate(0, 1.04, 0),
    new THREE.BoxGeometry(0.86, 0.14, 0.86).translate(0, 0.07, 0)
  ]);
  const arch = mergeGeometries([
    new THREE.BoxGeometry(0.5, 2.4, 0.5).translate(-1.1, 1.2, 0),
    new THREE.BoxGeometry(0.5, 2.4, 0.5).translate(1.1, 1.2, 0),
    new THREE.TorusGeometry(1.1, 0.25, 6, 16, Math.PI).translate(0, 2.4, 0)
  ]);
  const shard = new THREE.DodecahedronGeometry(0.4, 0);
  const at = new THREE.Object3D();
  const tint = new THREE.Color();
  const ring = (min: number, max: number) => {
    const a = rand() * Math.PI * 2;
    const r = min + rand() * (max - min);
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const stoneTint = () => tint.setHSL(0.52 + rand() * 0.06, 0.12 + rand() * 0.12, 0.62 + rand() * 0.14);
  const columns = new THREE.InstancedMesh(column, stone, 26);
  for (let i = 0; i < columns.count; i++) {
    const [x, z] = ring(8.5, 22);
    const broken = rand() < 0.45;
    at.position.set(x, SEABED_Y - 0.05, z);
    at.rotation.set(broken ? (rand() - 0.5) * 0.5 : 0, rand() * Math.PI, broken ? (rand() - 0.5) * 0.5 : 0);
    at.scale.set(1, broken ? 0.8 + rand() * 1.2 : 2.2 + rand() * 2.2, 1);
    at.updateMatrix();
    columns.setMatrixAt(i, at.matrix);
    columns.setColorAt(i, stoneTint());
  }
  const arches = new THREE.InstancedMesh(arch, stone, 6);
  for (let i = 0; i < arches.count; i++) {
    const [x, z] = ring(11, 20);
    at.position.set(x, SEABED_Y - 0.1, z);
    at.rotation.set(0, Math.atan2(x, z) + (rand() - 0.5) * 0.6, (rand() - 0.5) * 0.15);
    at.scale.setScalar(0.9 + rand() * 0.6);
    at.updateMatrix();
    arches.setMatrixAt(i, at.matrix);
    arches.setColorAt(i, stoneTint());
  }
  const shards = new THREE.InstancedMesh(shard, stone, 40);
  for (let i = 0; i < shards.count; i++) {
    const [x, z] = ring(7.2, 24);
    const s = 0.4 + rand() * 1.1;
    at.position.set(x, SEABED_Y + s * 0.12, z);
    at.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    at.scale.set(s * 1.4, s * 0.6, s);
    at.updateMatrix();
    shards.setMatrixAt(i, at.matrix);
    shards.setColorAt(i, stoneTint());
  }
  root.add(columns, arches, shards);

  // ── 빛줄기: 판 밑면 가장자리 틈에서 내려와 돔 중앙으로 모이는 여섯 가닥. 엇갈린 두 장(어느 방향에서 봐도 보인다), 가산 혼합(1콜).
  const shaftStrength = { value: PALETTES.day.shaft };
  const shaftGeo = mergeGeometries([
    new THREE.PlaneGeometry(1, 1, 1, 8).translate(0, -0.5, 0),
    new THREE.PlaneGeometry(1, 1, 1, 8).translate(0, -0.5, 0).rotateY(Math.PI / 2)
  ]);
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: { uTime: time, uStrength: shaftStrength },
    vertexShader: `uniform float uTime; varying vec2 vUv; varying float vId;
void main() {
  vUv = uv; vId = float(gl_InstanceID);
  vec3 p = position;
  p.x += sin(uTime * 0.35 + vId * 1.7) * 0.12 * (1.0 - uv.y);
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}`,
    fragmentShader: `uniform float uTime, uStrength; varying vec2 vUv; varying float vId;
void main() {
  float across = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 1.6);
  float along = smoothstep(0.0, 0.25, vUv.y) * (0.35 + 0.65 * vUv.y);
  float flicker = 0.75 + 0.25 * sin(uTime * 0.9 + vId * 2.3);
  gl_FragColor = vec4(vec3(0.75, 0.95, 1.0) * across * along * flicker * uStrength, 1.0);
}`
  });
  shaftMat.userData = NO_OUTLINE;
  const shafts = new THREE.InstancedMesh(shaftGeo, shaftMat, 6);
  const look = new THREE.Vector3();
  for (let i = 0; i < shafts.count; i++) {
    const a = (i / shafts.count) * Math.PI * 2 + 0.3;
    const top = new THREE.Vector3(Math.cos(a) * BOARD_R * 0.82, BOARD_Y - 0.6, Math.sin(a) * BOARD_R * 0.82);
    const foot = new THREE.Vector3(Math.cos(a) * 1.2, SEABED_Y + 0.4, Math.sin(a) * 1.2);
    const length = top.distanceTo(foot);
    at.position.copy(top);
    at.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), look.copy(foot).sub(top).normalize());
    at.scale.set(0.9 + rand() * 0.9, length, 0.9 + rand() * 0.9);
    at.updateMatrix();
    shafts.setMatrixAt(i, at.matrix);
  }
  shafts.frustumCulled = false;
  shafts.renderOrder = 6;
  root.add(shafts);

  // ── 체스판 섬의 밑면: 화면 맨 위에 걸친 어두운 흙판, 가장자리로 햇빛이 새어 든다. 「판 밑에 있다」가 읽히게 하는 물건(2콜).
  const underside = new THREE.Mesh(
    new THREE.CylinderGeometry(BOARD_R, BOARD_R * 0.86, 1.6, 64),
    quiet(new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 1, emissive: 0x0a1a24 }))
  );
  underside.position.y = BOARD_Y + 0.8;
  const leak = new THREE.Mesh(
    new THREE.TorusGeometry(BOARD_R + 0.1, 0.35, 8, 96).rotateX(Math.PI / 2),
    quiet(new THREE.MeshBasicMaterial({ color: 0xbff4ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))
  );
  leak.position.y = BOARD_Y + 0.05;
  root.add(underside, leak);

  // 승강 거품관: 돔 꼭대기에서 판 밑면 한가운데까지 — 「판으로 올라가는 길」. 돔과 같은 유리(1콜).
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, BOARD_Y - DOME_TOP, 20, 1, true), glass);
  tube.position.y = (BOARD_Y + DOME_TOP) / 2;
  tube.renderOrder = 5;
  root.add(tube);

  // ── 떠다니는 것: 부유 입자(바다 눈) 와 거품. 위치는 정점 셰이더가 시간으로 계산한다 — 매 프레임 CPU 갱신 없음(2콜).
  const drift = (count: number, spread: (i: number) => [number, number, number], rise: number, size: number, color: number, opacity: number) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set(spread(i), i * 3);
      seed[i] = rand();
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 5, 0), 40);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      uniforms: { uTime: time, uRise: { value: rise }, uSize: { value: size }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uScale: { value: 400 } },
      vertexShader: `uniform float uTime, uRise, uSize, uScale; attribute float aSeed; varying float vFade;
void main() {
  vec3 p = position;
  float span = ${(BOARD_Y - SEABED_Y).toFixed(1)};
  float y = mod(p.y - ${SEABED_Y.toFixed(2)} + uTime * uRise * (0.6 + aSeed), span);
  p.y = ${SEABED_Y.toFixed(2)} + y;
  p.x += sin(uTime * 0.4 + aSeed * 30.0) * 0.25;
  p.z += cos(uTime * 0.3 + aSeed * 20.0) * 0.25;
  vFade = smoothstep(0.0, 1.0, y) * (1.0 - smoothstep(span - 2.0, span, y));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.6 + aSeed) * uScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vFade;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float ring = smoothstep(0.5, 0.36, d) * (0.35 + 0.65 * smoothstep(0.2, 0.42, d));
  gl_FragColor = vec4(uColor, ring * vFade * uOpacity);
}`
    });
    mat.userData = NO_OUTLINE;
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    root.add(points);
    return mat;
  };
  const snow = drift(420, () => {
    const [x, z] = ring(0, 26);
    return [x, SEABED_Y + rand() * (BOARD_Y - SEABED_Y), z];
  }, 0.08, 0.05, 0xcff6ff, 0.55);
  const bubbles = drift(140, (i) => {
    if (i < 70) {
      const a = rand() * Math.PI * 2;
      return [Math.cos(a) * 0.2, DOME_TOP + rand() * (BOARD_Y - DOME_TOP), Math.sin(a) * 0.2];
    }
    const vent = i % 2 ? [9.5, -6] : [-11, 8];
    return [vent[0] + (rand() - 0.5) * 0.6, SEABED_Y + rand() * (BOARD_Y - SEABED_Y), vent[1] + (rand() - 0.5) * 0.6];
  }, 0.9, 0.16, 0xe8fcff, 0.85);

  // ── 해파리 여덟: 돔 밖을 천천히 오르내리며 숨 쉬듯 오므린다. 스스로 빛나는 재질이라 밤에 더 밝다(1콜).
  const bell = new THREE.SphereGeometry(0.42, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const tentacles: THREE.BufferGeometry[] = [bell];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    tentacles.push(new THREE.PlaneGeometry(0.05, 1.1, 1, 6).translate(Math.cos(a) * 0.22, -0.55, Math.sin(a) * 0.22).rotateY(-a));
  }
  const jellyGlow = { value: PALETTES.day.jelly };
  const jellyMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false, fog: false });
  jellyMat.userData = NO_OUTLINE;
  jellyMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.uniforms.uGlow = jellyGlow;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uTime;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
float jid = float(gl_InstanceID);
float pulse = sin(uTime * 1.6 + jid * 1.9);
transformed.xz *= 1.0 + 0.12 * pulse * step(-0.01, transformed.y);
transformed.x += sin(uTime * 1.3 + transformed.y * 4.0 + jid) * 0.08 * step(transformed.y, -0.05);
transformed.y += sin(uTime * 0.45 + jid * 2.1) * 0.6;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform float uGlow;`)
      .replace('#include <color_fragment>', `#include <color_fragment>\ndiffuseColor.rgb *= uGlow;`);
  };
  jellyMat.customProgramCacheKey = () => 'atlantis-jelly';
  const jellies = new THREE.InstancedMesh(mergeGeometries(tentacles), jellyMat, 8);
  const jellyHues = [0xff7ad9, 0x7ff0ff, 0xc89bff, 0xff9fb8];
  for (let i = 0; i < jellies.count; i++) {
    const [x, z] = ring(9, 17);
    at.position.set(x, 3 + rand() * 5, z);
    at.rotation.set(0, rand() * 3, 0);
    at.scale.setScalar(0.5 + rand() * 0.45);
    at.updateMatrix();
    jellies.setMatrixAt(i, at.matrix);
    jellies.setColorAt(i, tint.setHex(jellyHues[i % jellyHues.length]));
  }
  jellies.frustumCulled = false;
  jellies.renderOrder = 4;
  root.add(jellies);

  // ── 산호·물고기·해초·말미잘: 체스판 바다의 populateReef. ocean 은 돔 둘레를 흉내 낸다 —
  // edge = 돔 밖으로 얼마나 나왔나(산호는 0.42~2.0, 해초는 0.5 넘는 곳에만 자란다), floorY = 평평한 해저, waterY = 물고기가 도는 높이.
  // 물고기 높이는 돔 가장자리(r≈5.9)에서도 돔 표면 위에 오도록 잡았다.
  const reef = new THREE.Group();
  reef.position.y = SEABED_Y;
  reef.scale.setScalar(REEF_SCALE);
  root.add(reef);
  const domeLocal = DOME_R / REEF_SCALE;
  const ocean = { edge: (x: number, z: number) => Math.hypot(x, z) - domeLocal, floorY: () => 0, waterY: 1.62 };
  let life: ((t: number) => void) | null = null;

  return {
    root,
    dome,
    /** 산호·물고기 GLB 를 읽어 들인다. 못 읽은 종류는 빠질 뿐이다. */
    async populate(load: (name: string) => Promise<any>) {
      life = await populateReef(reef, ocean, load, rand, { size: REEF_LIFE });
      reef.traverse((o: any) => {
        for (const m of [o.material].flat()) if (m) m.userData = NO_OUTLINE;
      });
    },
    /**
     * 0 = 돔 전체를 보는 거리, 1 = 마을을 크게 보는 거리. 가까울수록 리브·유리를 흐리게 해 건물을 가리지 않는다
     * (AT-9 LLM 라운드: 「돔 뼈대가 새장처럼 섬을 가린다」, codex·grok).
     */
    setCloseness(k: number) {
      const c = Math.min(1, Math.max(0, k));
      ribMat.opacity = 1 - 0.82 * c;
      ribMat.depthWrite = c < 0.05;
      ribMat.userData = { outlineParameters: { alpha: 1 - 0.9 * c, visible: c < 0.95 } };
      glassFade.value = 1 - 0.75 * c;
    },
    tick(t: number) {
      time.value = t;
      life?.(t);
    },
    /** 카메라 거리에 맞춰 안개를 민다: 섬은 맑게, 그 뒤 폐허부터 물에 녹는다. */
    fitFog(dist: number, pxPerUnit: number) {
      fog.near = dist - 4;
      fog.far = dist + 24;
      snow.uniforms.uScale.value = pxPerUnit;
      bubbles.uniforms.uScale.value = pxPerUnit;
    },
    setPalette(name: 'day' | 'night') {
      const p = PALETTES[name];
      water.uniforms.uTop.value.setHex(p.top);
      water.uniforms.uMid.value.setHex(p.mid);
      water.uniforms.uDeep.value.setHex(p.deep);
      fog.color.setHex(p.fog);
      seabedMat.color.setHex(p.sand);
      shaftStrength.value = p.shaft;
      glassColor.value.setHex(p.glass);
      jellyGlow.value = p.jelly;
      scene.background = new THREE.Color(p.deep);
    }
  };
}
