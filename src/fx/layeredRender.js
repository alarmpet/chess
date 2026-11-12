// 계층 렌더 실험 (2026-11-05, 사용자 요청 ①: 「UI 가 얼마나 자주 바뀌는지에 따라 캔버스를 나누고 전후 성능 비교」).
// 자주 안 바뀌는 층(바다·섬·보드·대성당 = STATIC_LAYER)은 오프스크린 렌더 타깃에 카메라가 움직였을 때와 staticHz 마다만 그리고,
// 자주 바뀌는 층(말·받침·하이라이트·효과 = 기본 층 0)은 매 프레임 그 위에 그린다.
// 캔버스를 DOM 에서 둘로 나누는 것과 같은 효과를 한 WebGL 컨텍스트 안에서 낸다 — 두 캔버스는 PMREM 환경맵·텍스처를 컨텍스트마다
// 다시 올려야 하고, 위 캔버스가 포인터 이벤트를 가로챈다. 기본은 꺼져 있고 `?layers=1&hz=12` 또는 wizardChess.setLayered 로 켠다.
//
// 알려진 차이(실험 중):
//  - 정적 패스는 그림자 맵을 갱신하지 않는다. 섬의 나무·흙이 스스로 드리우던 그림자는 사라지고, 말 그림자는 동적 패스가 만든 맵을
//    정적 패스가 다음에 그릴 때 보드에 찍히므로 최대 1/staticHz 만큼 늦다.
//  - 동적 물체는 늘 정적 물체 위에 그려진다(깊이를 넘기지 않는다). 말은 보드 위에 있으니 체스에는 영향이 없고, 대성당 기둥 뒤로
//    카메라를 돌렸을 때만 다르다.
import * as THREE from 'three';

export const STATIC_LAYER = 1;

const BLIT_VERT = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`;
// 렌더 타깃에는 톤매핑·sRGB 변환이 적용되지 않으므로 화면에 올릴 때 여기서 한다(OutputPass 와 같은 방식).
const BLIT_FRAG = `uniform sampler2D tMap;
varying vec2 vUv;
void main() {
  gl_FragColor = texture2D(tMap, vUv);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @param {{ staticRoots: () => (THREE.Object3D | null | undefined)[], hz?: number }} opts
 */
export function createLayeredRender(renderer, scene, camera, { staticRoots, hz = 12 }) {
  let enabled = false;
  let staticHz = hz;
  let dirty = true;
  let lastStatic = -1;
  let rt = null;
  const size = new THREE.Vector2();
  const prevView = new THREE.Matrix4();
  const prevProj = new THREE.Matrix4();
  const stats = { frames: 0, staticFrames: 0 };

  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const blitMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: null } }, vertexShader: BLIT_VERT, fragmentShader: BLIT_FRAG, depthTest: false, depthWrite: false });
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blitMat));

  function ensureTarget() {
    renderer.getDrawingBufferSize(size);
    if (rt && rt.width === size.x && rt.height === size.y) return;
    rt?.dispose();
    rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true });
    blitMat.uniforms.tMap.value = rt.texture;
    dirty = true;
  }

  // 정적 뿌리 아래 전부를 정적 층으로, 빛은 두 층 모두에.
  function markLayers() {
    for (const root of staticRoots()) root?.traverse((o) => o.layers.set(STATIC_LAYER));
    scene.traverse((o) => { if (o.isLight) o.layers.enableAll(); });
  }

  /** 한 프레임. 꺼져 있으면 보통 렌더와 같다. */
  function render() {
    stats.frames += 1;
    if (!enabled) {
      renderer.render(scene, camera);
      return false;
    }
    ensureTarget();
    camera.updateMatrixWorld();
    const moved = !prevView.equals(camera.matrixWorldInverse) || !prevProj.equals(camera.projectionMatrix);
    const now = performance.now() / 1000;
    const due = staticHz > 0 && now - lastStatic >= 1 / staticHz;
    const shadowRequested = renderer.shadowMap.needsUpdate;
    let drewStatic = false;
    if (dirty || moved || due) {
      if (dirty) markLayers();
      camera.layers.set(STATIC_LAYER);
      renderer.shadowMap.needsUpdate = false;
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      prevView.copy(camera.matrixWorldInverse);
      prevProj.copy(camera.projectionMatrix);
      lastStatic = now;
      dirty = false;
      drewStatic = true;
      stats.staticFrames += 1;
    }
    // 정적 층을 화면에 깔고(색·깊이 지움), 그 위에 동적 층을 깊이만 새로 지우고 그린다. 배경은 정적 층에 이미 들어 있다.
    const background = scene.background;
    scene.background = null;
    renderer.autoClear = true;
    renderer.render(quadScene, quadCam);
    renderer.autoClear = false;
    renderer.clearDepth();
    camera.layers.set(0);
    renderer.shadowMap.needsUpdate = shadowRequested;
    renderer.render(scene, camera);
    renderer.autoClear = true;
    scene.background = background;
    camera.layers.enableAll();
    return drewStatic;
  }

  return {
    render,
    /** 켜고 끈다. 끄면 다음 프레임부터 보통 렌더. */
    setEnabled(on, nextHz) {
      enabled = Boolean(on);
      if (typeof nextHz === 'number') staticHz = nextHz;
      dirty = true;
      if (!enabled) camera.layers.enableAll();
    },
    isEnabled: () => enabled,
    /** 정적 물체가 바뀌었을 때(팩·팔레트·모델 로드) 부른다. */
    markDirty() { dirty = true; },
    setHz(v) { staticHz = v; },
    stats: () => ({ ...stats, enabled, hz: staticHz })
  };
}

/**
 * GPU 시간 탐침: EXT_disjoint_timer_query_webgl2 가 있으면 begin()…end() 사이의 GPU ms 를 모은다(없으면 null).
 * 같은 프레임의 질의가 다음 프레임들에 걸쳐 돌아오므로 결과는 몇 프레임 늦게 쌓인다.
 */
export function createGpuTimer(renderer) {
  const gl = renderer.getContext();
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const pending = [];
  const samples = [];
  let active = null;
  return {
    available: Boolean(ext),
    begin() {
      if (!ext || active) return;
      active = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, active);
    },
    end() {
      if (!ext || !active) return;
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      pending.push(active);
      active = null;
      for (let i = pending.length - 1; i >= 0; i--) {
        const q = pending[i];
        if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) continue;
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) samples.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
        gl.deleteQuery(q);
        pending.splice(i, 1);
      }
      if (samples.length > 600) samples.splice(0, samples.length - 600);
    },
    /** 모은 표본을 비우고 돌려준다. */
    take() {
      const out = samples.slice();
      samples.length = 0;
      return out;
    }
  };
}
