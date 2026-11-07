// A soft dark spot under every piece, so it sits on the board instead of hovering over it. The spot stays on the ground
// and shrinks as a piece leaves it, which is most of what makes a hop read as weight. One draw call for all of them.
import * as THREE from 'three';

const MAX_SPOTS = 40;
const HEIGHT_FADE = 2.4;
const SMALLEST = 0.55;

function spotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const fade = g.createRadialGradient(64, 64, 8, 64, 64, 64);
  fade.addColorStop(0, 'rgba(255,255,255,1)');
  fade.addColorStop(0.55, 'rgba(255,255,255,0.72)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = fade;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createContactShadows(scene, { surfaceY, size, opacity = 0.42 }) {
  const material = new THREE.MeshBasicMaterial({
    alphaMap: spotTexture(), color: 0x1c130a, transparent: true, opacity, depthWrite: false, fog: false, toneMapped: false
  });
  const spots = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), material, MAX_SPOTS);
  spots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  spots.frustumCulled = false;
  spots.count = 0;
  scene.add(spots);
  const m = new THREE.Matrix4();

  /** `meshes` are the piece roots; `unit` is their scale when standing normally. */
  function update(meshes, unit) {
    let n = 0;
    for (const mesh of meshes) {
      if (n >= MAX_SPOTS) break;
      const lift = Math.max(0, mesh.position.y - surfaceY);
      const s = size * Math.max(SMALLEST, 1 - lift * HEIGHT_FADE) * (mesh.scale.y / unit);
      m.makeScale(s, 1, s).setPosition(mesh.position.x, surfaceY + 0.003, mesh.position.z);
      spots.setMatrixAt(n, m);
      n += 1;
    }
    spots.count = n;
    spots.instanceMatrix.needsUpdate = true;
  }

  return { update };
}
