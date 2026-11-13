// 왕관 보석 (직관성 계획 2026-11-12 §0.2 ①, IR-2).
// 목표 하나를 채우면 그 잡기가 보석이 되어 내 왕의 왕관 위 자리에 박힌다. 자리는 둘 — 둘이 차면 왕관 완성(= 계약 승리).
// 점수가 HUD 가 아니라 판 위의 왕에 있다: 양쪽 왕 머리 위에 빈 자리(고리) 둘이 늘 보이고, 찬 만큼 보석이 선다.
// 판 위에서 읽는 것은 「몇 개인가」(자리와 보석의 수)다 — 색은 어느 목표였는지를 덧붙일 뿐이고, 종류 기호는 HUD 머리줄이 함께 적는다.
// 드로우콜: 고리 인스턴스 하나 + 보석 인스턴스 하나(보석이 있을 때만) = 많아야 2.
import * as THREE from 'three';
import { CONTRACT_NEED } from '../rules/contractSets.js';

export const GEM_FLY_SEC = 0.85;     // 잡은 자리에서 왕관까지
export const GEM_POP_SEC = 0.35;     // 박힐 때 통 튀는 시간
export const GEM_COLORS = { p: '#ffc233', n: '#35d6b8', b: '#a877ff', r: '#ff7a5c', q: '#ff7ec0' };

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/**
 * 기보에서 왕관의 보석을 센다: 색마다 채운 목표를 **채운 순서대로**.
 *   { w: [{ type, goal(세트 안 자리), ply(채운 반수, 1부터), at(잡힌 칸) }], b: [...] }
 * 계약이 끝난 뒤의 수는 세지 않는다(contractProgress 와 같은 규칙). 많아야 NEED 개.
 */
export function crownGemList(set, moves = []) {
  const out = { w: [], b: [] };
  if (!set) return out;
  const counts = { w: set.goals.map(() => 0), b: set.goals.map(() => 0) };
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    if (!m?.captured || !counts[m.color]) continue;
    const gi = set.goals.findIndex((g) => g.type === m.captured);
    if (gi < 0 || counts[m.color][gi] >= set.goals[gi].count) continue;
    counts[m.color][gi] += 1;
    if (counts[m.color][gi] < set.goals[gi].count) continue;
    out[m.color].push({ type: m.captured, goal: gi, ply: i + 1, at: m.to });
    if (out[m.color].length >= CONTRACT_NEED) break;
  }
  return out;
}

/**
 * 날아가는 보석의 자세. `u` 는 0(잡은 자리)~1(왕관).
 *   mix 자리 섞기(느리게 떠서 빠르게 꽂힌다) · lift 포물선 높이 0~1 · scale 크기 배율(날 때 크고, 꽂히며 제 크기)
 */
export function gemFlight(u) {
  const x = clamp01(u);
  return { mix: x * x * (3 - 2 * x), lift: Math.sin(Math.PI * x), scale: 1 + 0.8 * Math.sin(Math.PI * Math.min(1, x * 1.15)) };
}

/** 박힌 뒤의 통 튐: `age` 는 박힌 뒤의 초. 1 로 가라앉는다. */
export function gemPop(age) {
  if (age >= GEM_POP_SEC) return 1;
  const x = clamp01(age / GEM_POP_SEC);
  return 1 + 0.45 * Math.sin(Math.PI * x) * (1 - x);
}

const SIDES = ['w', 'b'];

export function createCrownGems(scene, { square }) {
  const R = square * 0.13;              // 보석 반지름
  const GAP = square * 0.19;            // 자리 사이 반 간격
  const RISE = square * 0.1;            // 머리 위로 뜨는 높이
  const group = new THREE.Group();
  scene.add(group);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.92, depthWrite: false, fog: false, toneMapped: false });
  ringMat.userData = { outlineParameters: { visible: false } };
  const rings = new THREE.InstancedMesh(new THREE.RingGeometry(0.6, 1, 24), ringMat, SIDES.length * CONTRACT_NEED);
  rings.frustumCulled = false;
  rings.count = 0;
  rings.visible = false;
  rings.renderOrder = 15;
  group.add(rings);

  const gemGeo = new THREE.OctahedronGeometry(1, 0);
  gemGeo.scale(0.78, 1, 0.78);
  const gemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.22, metalness: 0.05, emissive: 0x3a3a3a, fog: false });
  gemMat.userData = { outlineParameters: { visible: false } };
  const gems = new THREE.InstancedMesh(gemGeo, gemMat, SIDES.length * CONTRACT_NEED);
  gems.frustumCulled = false;
  gems.count = 0;
  gems.visible = false;
  gems.renderOrder = 16;
  group.add(gems);

  // 색마다 박힌(또는 날아오는) 보석: { type, key, fly(0~1 | null), pop(박힌 뒤 초), from: Vector3 | null }
  const held = { w: [], b: [] };
  let t = 0;
  let landed = 0;
  let onLand = null;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const spin = new THREE.Quaternion();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  const tint = new THREE.Color();

  /**
   * 기보에서 센 보석 목록으로 맞춘다. 새로 생긴 보석이 방금 둔 수(`plies`)에서 나왔고 `fly` 면 잡은 칸(`pos(square)`)에서 날아온다.
   * 목록에서 빠진 보석(되돌리기)은 바로 사라진다.
   */
  function set(lists, { fly = false, plies = 0, pos = null, land = null } = {}) {
    onLand = land;
    for (const side of SIDES) {
      const want = lists?.[side] || [];
      const have = held[side];
      const next = want.map((g) => {
        const key = `${g.goal}:${g.ply}`;
        const old = have.find((h) => h.key === key);
        if (old) return old;
        const from = fly && g.ply === plies && pos ? pos(g.at) : null;
        return { type: g.type, key, fly: from ? 0 : null, pop: from ? 0 : GEM_POP_SEC, from };
      });
      held[side] = next;
    }
  }

  /** 프레임마다. `kings` = { w: { x, y(머리 높이), z } | null, b: … }. 왕이 없으면 그 색은 그리지 않는다. */
  function update(dt, camera, kings) {
    t += dt;
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    let r = 0;
    let g = 0;
    for (const side of SIDES) {
      const k = kings?.[side];
      if (!k) continue;
      for (let i = 0; i < CONTRACT_NEED; i++) {
        const off = (i - (CONTRACT_NEED - 1) / 2) * 2 * GAP;
        const sx = k.x + right.x * off;
        const sy = k.y + RISE + R;
        const sz = k.z + right.z * off;
        const gem = held[side][i];
        // 빈 자리는 고리만, 찬 자리는 고리가 보석 받침이 된다
        m4.compose(p3.set(sx, sy, sz), camera.quaternion, s3.setScalar(R * (gem && gem.fly === null ? 1.35 : 1)));
        rings.setMatrixAt(r++, m4);
        if (!gem) continue;
        let scale = 1;
        if (gem.fly !== null) {
          gem.fly += dt / GEM_FLY_SEC;
          const f = gemFlight(gem.fly);
          p3.set(gem.from.x + (sx - gem.from.x) * f.mix, gem.from.y + (sy - gem.from.y) * f.mix + f.lift * square * 1.1, gem.from.z + (sz - gem.from.z) * f.mix);
          scale = f.scale;
          if (gem.fly >= 1) { gem.fly = null; gem.pop = 0; landed += 1; if (onLand) onLand(side, gem.type); }
        } else {
          gem.pop += dt;
          scale = gemPop(gem.pop);
          p3.set(sx, sy, sz);
        }
        spin.setFromAxisAngle(yAxis, t * 1.4 + i * 1.3);
        m4.compose(p3, q.copy(spin), s3.setScalar(R * scale));
        gems.setMatrixAt(g, m4);
        gems.setColorAt(g, tint.set(GEM_COLORS[gem.type] || '#ffffff'));
        g += 1;
      }
    }
    rings.count = r;
    rings.visible = r > 0;
    if (r) rings.instanceMatrix.needsUpdate = true;
    gems.count = g;
    gems.visible = g > 0;
    if (g) { gems.instanceMatrix.needsUpdate = true; if (gems.instanceColor) gems.instanceColor.needsUpdate = true; }
  }

  function clear() {
    held.w = [];
    held.b = [];
    rings.count = gems.count = 0;
    rings.visible = gems.visible = false;
  }

  return {
    set, update, clear,
    /** `draws` 는 지금 그려지는 메시 수(= 보석이 더하는 드로우콜). */
    state: () => ({
      sockets: rings.visible ? rings.count : 0, gems: gems.visible ? gems.count : 0,
      flying: SIDES.reduce((n, s) => n + held[s].filter((h) => h.fly !== null).length, 0), landed,
      w: held.w.map((h) => h.type), b: held.b.map((h) => h.type),
      draws: (rings.visible ? 1 : 0) + (gems.visible ? 1 : 0)
    })
  };
}
