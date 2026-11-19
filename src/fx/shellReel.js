// 소라 릴 (슬롯 체스 계획서 2026-11-11 §2.3 · §4-2.3 ①, PP-1).
// 판 너머 바다에서 큰 소라 셋이 물기둥과 함께 솟아 돌다가 「쿵·쿵·쾅」 하나씩 멈추며 이번 판의 계약 목표 셋을 공개한다.
// 연출만 한다: 계약은 이미 정해져 있고(src/rules/contractSets.js `pickContract`), 누른다고 바뀌지 않는다.
// 누르면 바로 끝까지 간다(건너뛰기). 입력을 막지 않는다 — 도는 동안에도 말을 고르고 둘 수 있다.
// 쉬는 동안은 전부 숨겨 드로우콜 0, 도는 동안은 소라 3 + 글자판 3 + 물방울 1 = 7.
import * as THREE from 'three';

/** 시간표(초). 마지막 멈춤이 1.3초 — 계획서의 「총 1.2~1.8초」 안. 그 뒤 목표를 잠깐 보여 주고 가라앉는다. */
export const REEL_RISE = 0.35;          // 한 소라가 솟는 데 걸리는 시간
export const REEL_STAGGER = 0.08;       // 소라 사이 솟는 시간차
export const REEL_STOPS = [0.7, 1.0, 1.3];
export const REEL_HOLD = 1.3;           // 마지막 멈춤 뒤 목표를 보여 주는 시간
export const REEL_HOLD_SKIPPED = 0.45;  // 건너뛴 뒤에는 짧게
export const REEL_SINK = 0.4;
export const REEL_SQUASH_SEC = 0.22;    // 멈출 때 눌렸다 펴지는 시간
export const REEL_TOTAL = REEL_STOPS[2] + REEL_HOLD + REEL_SINK;

/** 파도타기: 한 번 폴짝의 높이 곡선(0→1→0)과, 멈춘 소라에서 먼 말일수록 늦게 뛰는 시간차. */
export const WAVE_HOP_SEC = 0.24;
export const WAVE_SPEED = 9;            // 초당 칸 — 판 끝(약 9칸)까지 1초 안
export const hopHeight = (u) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));
export const waveDelay = (squares) => Math.max(0, squares) / WAVE_SPEED;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOutBack = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/**
 * 소라 i(0~2)의 자세. t 는 릴 시작부터의 초, sinkAt 은 가라앉기 시작하는 때.
 *   rise    0(물속)~1(다 솟음), 살짝 넘쳤다 돌아온다
 *   spinning 도는 중인가(멈추면 목표를 보여 준다)
 *   squash  멈춘 직후 눌림 0~1
 */
export function reelPose(i, t, sinkAt = REEL_STOPS[2] + REEL_HOLD) {
  const up = clamp01((t - i * REEL_STAGGER) / REEL_RISE);
  const down = clamp01((t - sinkAt) / REEL_SINK);
  const since = t - REEL_STOPS[i];
  return {
    rise: (up > 0 ? easeOutBack(up) : 0) * (1 - down * down),
    spinning: since < 0,
    squash: since >= 0 && since < REEL_SQUASH_SEC ? Math.sin(Math.PI * (since / REEL_SQUASH_SEC)) : 0
  };
}

export const REEL_NAMES = { p: '미어캣', n: '캥거루', b: '판다', r: '코뿔소', q: '호랑이' };
export const REEL_GLYPHS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
const SPIN_ORDER = ['p', 'n', 'b', 'r', 'q'];
const SPIN_FLIP_SEC = 0.07;

// 소라: 선반 깎기(Lathe)로 만든 터번 모양에 나선 골을 얹는다. 위로 갈수록 크림색.
function shellGeometry() {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const h = i / 14;
    const r = 0.5 * Math.sin(Math.PI * Math.pow(h, 0.75)) * (1 - 0.45 * h) + 0.02;
    pts.push(new THREE.Vector2(r, h));
  }
  const geo = new THREE.LatheGeometry(pts, 28);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(0xf7a98b);
  const tip = new THREE.Color(0xfff3dc);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const ridge = 1 + 0.15 * Math.sin(ang + y * 15);      // 나선 골
    pos.setXYZ(i, x * ridge, y, z * ridge);
    c.copy(base).lerp(tip, y).multiplyScalar(0.78 + 0.22 * Math.sin(ang + y * 15));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// 글자판: 체스 기호 + 동물 이름 + 수량. 도는 동안은 기호만 빠르게 바뀐다.
function plateTexture(type, count) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = count ? '#fff8e7' : '#e9f6ff';
  g.strokeStyle = count ? '#d9912b' : '#7fb9d9';
  g.lineWidth = 12;
  g.beginPath();
  g.roundRect(14, 14, 228, 228, 44);
  g.fill();
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#3a2a1a';
  g.font = '132px serif';
  g.fillText(REEL_GLYPHS[type], 128, count ? 96 : 128);
  if (count) {
    g.font = 'bold 44px system-ui, sans-serif';
    g.fillText(`${REEL_NAMES[type]} ×${count}`, 128, 198);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const MAX_DROPS = 64;
const GRAVITY = 3.2;

export function createShellReel(scene, { surfaceY, square }) {
  const geo = shellGeometry();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.05 });
  mat.userData = { outlineParameters: { visible: false } };
  const SHELL_H = square * 1.5;                 // 소라 높이(판 한 칸 반)
  const GAP = square * 2.3;                     // 소라 사이
  const FAR = square * 4 + square * 2.2;        // 판 가운데에서 소라 줄까지
  const LOW = surfaceY - SHELL_H * 1.25;        // 물속
  const HIGH = surfaceY - square * 0.25;        // 다 솟았을 때 바닥
  const textures = new Map();
  const tex = (type, count = 0) => {
    const key = `${type}${count}`;
    if (!textures.has(key)) textures.set(key, plateTexture(type, count));
    return textures.get(key);
  };

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const shells = [0, 1, 2].map((i) => {
    const mesh = new THREE.Mesh(geo, mat);
    const plateMat = new THREE.SpriteMaterial({ map: tex('p'), transparent: true, depthWrite: false });
    plateMat.userData = { outlineParameters: { visible: false } };
    const plate = new THREE.Sprite(plateMat);
    plate.scale.setScalar(square * 1.55);
    plate.renderOrder = 20;
    group.add(mesh, plate);
    return { mesh, plate, x: (i - 1) * GAP, stopped: false };
  });
  const dropMat = new THREE.MeshBasicMaterial({ color: 0xcdf3ff, transparent: true, opacity: 0.9 });
  dropMat.userData = { outlineParameters: { visible: false } };
  const drops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), dropMat, MAX_DROPS);
  drops.frustumCulled = false;
  drops.count = 0;
  group.add(drops);
  const live = [];     // { x, y, z, vx, vy, vz, age, life, size }
  const m4 = new THREE.Matrix4();
  const q0 = new THREE.Quaternion();
  const v3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();

  let t = -1;          // -1 이면 쉬는 중
  let zSide = -1;      // 소라가 서는 쪽(z 부호) — 내 카메라의 건너편
  let goals = [];
  let layout = 'far';  // 글자판 자리: 'far' 소라 위(세로 화면) · 'center' 판 가운데 위(가로 화면)
  let sinkAt = REEL_STOPS[2] + REEL_HOLD;
  let skipped = false;
  let onStop = null;
  let plays = 0;

  function spray(x, z, n, power) {
    for (let k = 0; k < n && live.length < MAX_DROPS; k++) {
      const a = (k / n) * Math.PI * 2 + Math.random() * 0.5;
      const out = (0.25 + Math.random() * 0.55) * power;
      live.push({ x, y: surfaceY - square * 0.2, z, vx: Math.cos(a) * out, vy: (1.5 + Math.random() * 1.1) * power, vz: Math.sin(a) * out, age: 0, life: 0.55 + Math.random() * 0.3, size: square * (0.05 + Math.random() * 0.05) });
    }
  }

  /** 릴을 돌린다. `set` 은 계약 세트, `side` 는 내 카메라가 선 쪽('w' | 'b'), `stop(i, pos, goal)` 은 멈출 때마다 불린다. */
  function play(set, side = 'w', stop = null, where = 'far') {
    layout = where === 'center' ? 'center' : 'far';
    for (const s of shells) s.plate.material.depthTest = layout !== 'center';
    goals = set.goals.slice(0, 3);
    zSide = side === 'b' ? 1 : -1;
    onStop = stop;
    t = 0;
    skipped = false;
    sinkAt = REEL_STOPS[2] + REEL_HOLD;
    live.length = 0;
    plays += 1;
    for (const [i, s] of shells.entries()) {
      s.stopped = false;
      s.mesh.rotation.y = i * 2.1;
      s.plate.material.map = tex(SPIN_ORDER[i]);
      spray(s.x, zSide * FAR, 7, 1);
    }
    group.visible = true;
    place();
    return true;
  }

  /** 누르면 바로: 아직 안 멈춘 소라를 지금 다 멈추고 목표를 잠깐 보여 준 뒤 가라앉힌다. 결과는 같다. */
  function skip() {
    if (t < 0 || skipped) return false;
    skipped = true;
    if (t < REEL_STOPS[2]) t = REEL_STOPS[2];
    sinkAt = Math.min(sinkAt, t + REEL_HOLD_SKIPPED);
    return true;
  }

  function place() {
    for (const [i, s] of shells.entries()) {
      const pose = reelPose(i, t, sinkAt);
      const z = zSide * FAR;
      const y = LOW + (HIGH - LOW) * pose.rise;
      const wide = 1 + 0.22 * pose.squash;
      s.mesh.position.set(s.x, y, z);
      s.mesh.scale.set(SHELL_H * 0.9 * wide, SHELL_H * (1 - 0.3 * pose.squash), SHELL_H * 0.9 * wide);
      // 글자판: 세로 화면은 소라 위에 뜬다. 가로 화면은 판 너머가 화면 위로 잘려 안 보이므로, 소라에서 튀어나와
      // 판 가운데 빈 줄 위에 뜬다(판을 시작할 때 가운데 네 줄은 비어 있다).
      const k = clamp01(pose.rise);
      if (layout === 'center') {
        s.plate.position.set(s.x * 0.95, surfaceY + square * (0.45 + 0.45 * k), z + (zSide * square * -0.2 - z) * k);
      } else {
        s.plate.position.set(s.x, y + SHELL_H * (1 - 0.3 * pose.squash) + square * 0.75, z);
      }
      s.plate.material.opacity = clamp01(pose.rise * 1.6);
      if (pose.spinning) {
        s.plate.material.map = tex(SPIN_ORDER[(Math.floor(t / SPIN_FLIP_SEC) + i * 2) % SPIN_ORDER.length]);
      } else if (!s.stopped) {
        s.stopped = true;
        s.plate.material.map = tex(goals[i].type, goals[i].count);
        s.mesh.rotation.y = 0;
        spray(s.x, z, i === 2 ? 22 : 9, i === 2 ? 1.35 : 0.9);
        if (onStop) onStop(i, v3.set(s.x, surfaceY, z).clone(), goals[i]);
      }
    }
  }

  function update(dt) {
    if (t < 0) return;
    t += dt;
    for (const s of shells) if (!s.stopped) s.mesh.rotation.y += dt * 22;
    place();
    let n = 0;
    for (let k = live.length - 1; k >= 0; k--) {
      const d = live[k];
      d.age += dt;
      if (d.age >= d.life) { live.splice(k, 1); continue; }
      d.vy -= GRAVITY * dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
    }
    for (const d of live) {
      const size = d.size * (1 - d.age / d.life * 0.6);
      m4.compose(v3.set(d.x, d.y, d.z), q0, s3.setScalar(size));
      drops.setMatrixAt(n++, m4);
    }
    drops.count = n;
    drops.instanceMatrix.needsUpdate = true;
    if (t >= sinkAt + REEL_SINK) {
      t = -1;
      group.visible = false;
      live.length = 0;
      drops.count = 0;
    }
  }

  return {
    play, skip, update,
    active: () => t >= 0,
    /** 아직 목표를 다 공개하지 않았는가(건너뛰기가 뜻이 있는 동안). */
    revealing: () => t >= 0 && t < REEL_STOPS[2],
    state: () => ({ active: t >= 0, t: t < 0 ? null : +t.toFixed(3), skipped, plays, stopped: shells.map((s) => s.stopped), goals: goals.map((g) => `${g.type}${g.count}`), side: zSide, layout }),
    shellSpots: () => shells.map((s) => ({ x: s.x, z: zSide * FAR }))
  };
}
