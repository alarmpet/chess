// 현상 딱지와 노림 불빛 (슬롯 체스 계획서 2026-11-11 §4-2.3 ②, PP-1).
// 계약의 표적이 된 종류의 상대 말 머리 위에 작은 딱지가 붙는다(색 + 무늬 + 체스 기호 — 색만으로 구분하지 않는다).
// 내 말이 그 말을 실제로 공격하고 있으면 딱지가 흔들린다(노림 불빛). 매치 포인트에서는 남은 딱지 뒤에 은은한 빛이 깔린다.
// 보여 주기만 한다: 수를 추천하지 않고, 번쩍이지 않는다(§9).
// 드로우콜: 목표 자리마다 인스턴스 하나(최대 3) + 빛 하나. 딱지가 없으면 전부 숨겨 0.
import * as THREE from 'three';

export const TAG_POP_SEC = 0.26;       // 붙을 때 통 튀어나오는 시간
export const TAG_WOBBLE_HZ = 2.6;      // 노릴 때 흔들림(초당 왕복)
export const TAG_WOBBLE_RAD = 0.3;     // 흔들림 폭(약 17도)
export const TAG_HOT_SCALE = 1.2;      // 노릴 때 조금 커진다
export const GLOW_PULSE_HZ = 0.45;     // 매치 포인트의 빛 숨쉬기 — 느리게(번쩍임 아님)

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeOutBack = (x) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/**
 * 딱지 하나의 자세. `age` 붙은 뒤의 초, `hot` 노림 0~1, `t` 흐른 초, `glow` 매치 포인트 0~1.
 *   scale 크기 배율 · roll 화면 축 회전(라디안) · halo 뒤 빛의 세기 0~1
 */
export function tagPose(age, hot, t, glow = 0) {
  const pop = age <= 0 ? 0 : age >= TAG_POP_SEC ? 1 : easeOutBack(age / TAG_POP_SEC);
  const breathe = 0.5 + 0.5 * Math.sin(2 * Math.PI * GLOW_PULSE_HZ * t);
  return {
    scale: pop * (1 + (TAG_HOT_SCALE - 1) * hot) * (1 + 0.05 * glow * breathe),
    roll: hot * TAG_WOBBLE_RAD * Math.sin(2 * Math.PI * TAG_WOBBLE_HZ * t),
    halo: clamp01(glow * (0.45 + 0.3 * breathe))
  };
}

const GLYPHS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
// 종류마다 색과 무늬가 다르다: 폰 점 · 나이트 가로줄 · 비숍 빗금 · 룩 바둑판 · 퀸 별.
const STYLE = {
  p: { fill: '#ffd166', edge: '#b9770e', pattern: 'dots' },
  n: { fill: '#7fe3d0', edge: '#1c8f7c', pattern: 'bars' },
  b: { fill: '#c9a8ff', edge: '#6b3fc4', pattern: 'slash' },
  r: { fill: '#ff9e8a', edge: '#b53a22', pattern: 'checks' },
  q: { fill: '#ffb3d9', edge: '#b8327a', pattern: 'stars' }
};

function tagTexture(type) {
  const st = STYLE[type] || STYLE.p;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  // 딱지 꼴: 위가 둥글고 아래가 뾰족한 표(말 머리를 가리킨다)
  g.beginPath();
  g.moveTo(64, 124);
  g.lineTo(34, 92);
  g.arcTo(10, 92, 10, 60, 18);
  g.lineTo(10, 28);
  g.arcTo(10, 8, 30, 8, 18);
  g.lineTo(98, 8);
  g.arcTo(118, 8, 118, 28, 18);
  g.lineTo(118, 74);
  g.arcTo(118, 92, 94, 92, 18);
  g.closePath();
  g.fillStyle = st.fill;
  g.fill();
  g.save();
  g.clip();
  g.globalAlpha = 0.28;
  g.fillStyle = st.edge;
  g.strokeStyle = st.edge;
  g.lineWidth = 5;
  if (st.pattern === 'dots') {
    for (let y = 16; y < 96; y += 18) for (let x = 18 + ((y / 18) % 2) * 9; x < 118; x += 18) { g.beginPath(); g.arc(x, y, 3.4, 0, Math.PI * 2); g.fill(); }
  } else if (st.pattern === 'bars') {
    for (let y = 18; y < 96; y += 14) { g.beginPath(); g.moveTo(8, y); g.lineTo(120, y); g.stroke(); }
  } else if (st.pattern === 'slash') {
    for (let x = -80; x < 130; x += 16) { g.beginPath(); g.moveTo(x, 100); g.lineTo(x + 90, 6); g.stroke(); }
  } else if (st.pattern === 'checks') {
    for (let y = 8; y < 96; y += 16) for (let x = 8 + ((y / 16) % 2) * 16; x < 120; x += 32) g.fillRect(x, y, 16, 16);
  } else {
    for (const [x, y] of [[26, 24], [102, 24], [22, 70], [106, 70]]) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5; const r = k % 2 ? 4 : 9; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); }
  }
  g.restore();
  g.lineWidth = 7;
  g.strokeStyle = st.edge;
  g.stroke();
  g.fillStyle = '#2b1d10';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '74px serif';
  g.fillText(GLYPHS[type] || '?', 64, 52);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function haloTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,244,200,1)');
  grad.addColorStop(0.45, 'rgba(255,220,140,0.45)');
  grad.addColorStop(1, 'rgba(255,200,90,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

const PER_GOAL = 8;    // 한 종류는 많아야 폰 여덟
const SLOTS = 3;

export function createBountyTags(scene, { square }) {
  const SIZE = square * 0.5;
  const plane = new THREE.PlaneGeometry(1, 1);
  plane.translate(0, 0.5, 0);    // 아래 끝(뾰족한 곳)이 기준점 — 말 머리 바로 위에 선다
  const textures = new Map();
  const tex = (type) => { if (!textures.has(type)) textures.set(type, tagTexture(type)); return textures.get(type); };
  const group = new THREE.Group();
  scene.add(group);
  const slots = Array.from({ length: SLOTS }, () => {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false });
    mat.userData = { outlineParameters: { visible: false } };
    const mesh = new THREE.InstancedMesh(plane, mat, PER_GOAL);
    mesh.frustumCulled = false;
    mesh.count = 0;
    mesh.visible = false;
    mesh.renderOrder = 16;
    group.add(mesh);
    return { mesh, type: null };
  });
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending });
  haloMat.userData = { outlineParameters: { visible: false } };
  const halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), haloMat, PER_GOAL * SLOTS);
  halo.frustumCulled = false;
  halo.count = 0;
  halo.visible = false;
  halo.renderOrder = 15;
  group.add(halo);

  const ages = new Map();      // id → { age, hot }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const roll = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const p3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  const tint = new THREE.Color();
  let t = 0;
  let shown = 0;
  let hotShown = 0;
  let haloShown = 0;

  /**
   * 프레임마다. `items` 는 지금 딱지를 붙일 말들: { id, slot(0~2), type('p'…), x, y(머리 높이), z, hot(노림) }.
   * `glow` 는 매치 포인트 0~1. 목록에서 빠진 말의 딱지는 바로 사라진다(잡혔거나 목표가 찼다).
   */
  function update(dt, camera, items, glow = 0) {
    t += dt;
    const counts = [0, 0, 0];
    let h = 0;
    hotShown = 0;
    const seen = new Set();
    for (const it of items) {
      const slot = slots[it.slot];
      if (!slot || counts[it.slot] >= PER_GOAL) continue;
      if (slot.type !== it.type) { slot.type = it.type; slot.mesh.material.map = tex(it.type); slot.mesh.material.needsUpdate = true; }
      let a = ages.get(it.id);
      if (!a) { a = { age: 0, hot: 0 }; ages.set(it.id, a); }
      seen.add(it.id);
      a.age += dt;
      a.hot += ((it.hot ? 1 : 0) - a.hot) * Math.min(1, dt * 9);
      if (it.hot) hotShown += 1;
      const pose = tagPose(a.age, a.hot, t + (it.id % 7) * 0.13, glow);
      roll.setFromAxisAngle(zAxis, pose.roll);
      q.copy(camera.quaternion).multiply(roll);
      m4.compose(p3.set(it.x, it.y, it.z), q, s3.setScalar(SIZE * pose.scale));
      slot.mesh.setMatrixAt(counts[it.slot]++, m4);
      if (pose.halo > 0.01) {
        m4.compose(p3.set(it.x, it.y + SIZE * 0.5 * pose.scale, it.z), camera.quaternion, s3.setScalar(SIZE * 2.3 * pose.scale));
        halo.setMatrixAt(h, m4);
        halo.setColorAt(h, tint.setScalar(pose.halo));
        h += 1;
      }
    }
    for (const id of ages.keys()) if (!seen.has(id)) ages.delete(id);
    shown = 0;
    for (const [i, slot] of slots.entries()) {
      slot.mesh.count = counts[i];
      slot.mesh.visible = counts[i] > 0;
      if (counts[i]) slot.mesh.instanceMatrix.needsUpdate = true;
      shown += counts[i];
    }
    halo.count = h;
    halo.visible = h > 0;
    haloShown = h;
    if (h) { halo.instanceMatrix.needsUpdate = true; if (halo.instanceColor) halo.instanceColor.needsUpdate = true; }
  }

  function clear() {
    ages.clear();
    for (const slot of slots) { slot.mesh.count = 0; slot.mesh.visible = false; }
    halo.count = 0;
    halo.visible = false;
    shown = hotShown = haloShown = 0;
  }

  return {
    update, clear,
    /** `draws` 는 지금 그려지는 메시 수(= 딱지가 더하는 드로우콜). */
    state: () => ({ tags: shown, hot: hotShown, halos: haloShown, draws: slots.filter((s) => s.mesh.visible).length + (halo.visible ? 1 : 0), types: slots.map((s) => (s.mesh.visible ? s.type : null)) })
  };
}
