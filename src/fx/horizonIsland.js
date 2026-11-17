// 이웃 섬(절차적 섬 PI-3 손질, 2026-11-17): 군도의 지금 섬의 높이 지도를 그대로 땅으로 올려, 체스 판 너머 바다 건너에 세운다.
// 판 둘레의 해안선만 바꿨을 때는 플레이어 카메라에서 섬이 구별되지 않았다(블라인드 짝짓기 0/7 · 1/7).
// 이 섬은 판 너머 수평선에 크게 걸려 「지금 어느 섬에 있나」를 보여 준다 — 군도 지도의 그 그림과 같은 모양 · 같은 색표다.
// 메시 하나(드로우콜 1), 정점 색, 그림자 없음.
import * as THREE from 'three';
import { heightColor } from '../village/islandNoise.js';

/** `at`: 놓을 자리(x, z), `width`: 섬의 너비(월드 단위), `height`: 꼭대기 높이. */
// 플레이어 카메라는 37° 내려다봐서 화면 위 끝이 판 너머 약 6.6 에서 수면에 닿는다(z = −15 에 두면 화면 밖이었다) — 판 너머 4 ~ 7 의 이웃 섬으로.
export function createHorizonIsland(group, { at = [0, -4.7], width = 4.6, height = 0.55, waterY = 0 } = {}) {
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  mat.userData = { outlineParameters: { visible: false } };
  let mesh = null;

  function set(map, palette) {
    if (mesh) { group.remove(mesh); mesh.geometry.dispose(); mesh = null; }
    if (!map) return;
    const n = map.size;
    const geo = new THREE.PlaneGeometry(width, width, n - 1, n - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const v = map.h[i];
      // 바다 칸은 물 아래로 내려 숨기고, 땅은 높이만큼 올린다. 모래톱이 물에서 바로 솟게 0.04 를 더한다.
      pos.setY(i, v < 0 ? -0.6 : 0.04 + v * height);
      c.set(heightColor(v < 0 ? 0.02 : v, palette)).convertSRGBToLinear();
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'horizon-island';
    mesh.position.set(at[0], waterY, at[1]);
    mesh.renderOrder = 1;
    group.add(mesh);
  }

  /** 카메라 반대편(판 너머)에 선다. 흑으로 두면 카메라가 반대쪽이라 섬도 반대쪽으로, 돌려서 지도의 위가 판 너머가 되게. */
  function face(cameraZ) {
    if (!mesh) return;
    const far = cameraZ >= 0 ? 1 : -1;
    mesh.position.z = at[1] * far;
    mesh.rotation.y = far > 0 ? 0 : Math.PI;
  }

  return { set, face, state: () => ({ shown: Boolean(mesh), triangles: mesh ? mesh.geometry.index.count / 3 : 0, z: mesh ? mesh.position.z : null }) };
}
