// 화면 보정 한 장 (그래픽 계획 2026-11-18 WG-P1, 11-19).
// 장면을 깊이와 함께 반정밀(HDR) 텍스처에 그린 뒤, 화면 한 장짜리 셰이더 하나로 마무리한다:
//   계단 지우기(FXAA, MSAA 를 못 쓸 때만) → 구석 그늘(깊이로 되살린 면의 방향을 보는 AO) → 빛 번짐(밝은 곳 둘레)
//   → 톤매핑 · sRGB(렌더러 설정 그대로) → 색 보정(채도 · 부드러운 대비 · 밝은 곳 따뜻하게/어두운 곳 차갑게) → 비네트 → 디더.
// 드로우콜은 장면 그대로에 +1(화면 사각형). 못 쓰는 기기(WebGL2 · 반정밀 렌더 타깃 없음)나 오류가 나면 스스로 꺼지고 보통 렌더로 돈다.
//
// Ironvale(SharpWizard/ironvale, 라이선스 없음)의 후처리를 읽고 구조만 배웠다 — 코드는 가져오지 않았다.
// AO 는 그쪽의 「마주 보는 깊이 쌍」 대신 깊이에서 시점 좌표와 면 방향을 되살려 반구 안의 가림을 센다(평평한 바닥이 스스로 가리지 않는다).
import * as THREE from 'three';

/** 보정 세기 기본값. `setParams` 로 바꾼다(시험·계획용). 11-19: 처음 값은 블라인드 비평가가 데스크에서 켠 것과 끈 것을 구별하지 못해 한 단계 올렸다. */
export const POST_DEFAULTS = Object.freeze({
  ao: 0.8,           // 구석 그늘 세기(0 끔)
  aoRadius: 0.2,     // 월드 단위(판 한 칸이 약 0.4)
  bloom: 0.4,        // 빛 번짐 세기(0 끔)
  bloomThreshold: 1.5, // 이보다 밝은(톤매핑 전 선형) 곳만 번진다 — 0.9 는 크림색 판 칸까지 번져 뿌옇다(11-19 캡처)
  bloomRadius: 9,    // 화면 높이 900px 기준 픽셀
  saturation: 1.14,
  contrast: 0.2,     // 0 이면 그대로, 1 이면 smoothstep 곡선
  warm: 0.035,       // 밝은 곳 따뜻하게 · 어두운 곳 차갑게
  vignette: 0.3,
  dither: 1.0        // 1/255 단위
});

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform mat4 uInvProj;
uniform float uProjScale;   // 시점 거리 1 에서 월드 1 이 몇 픽셀인가
uniform float uAO, uAORadius, uBloom, uThreshold, uBloomRadius;
uniform float uSat, uContrast, uWarm, uVignette, uDither, uTime;
uniform vec3 uTint, uLift;   // 판의 시간(src/fx/dayCycle.js): 장면에 곱하고 더하는 색
uniform float uKeep;         // 이보다 밝은(톤매핑 전) 곳은 시간 색을 덜 받는다 — 밤에 보석·섬광만 빛나게
varying vec2 vUv;

float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
// 깊이 → 시점 공간 좌표(카메라 앞이 -z)
vec3 viewPos(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  vec4 p = uInvProj * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0);
  return p.xyz / p.w;
}
// 화면 좌표에서 생기는 결 없는 잡음(0..1)
float noise2(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

#ifdef USE_FXAA
// 휘도의 흐름 방향으로 이웃을 섞는 가벼운 계단 지우기(톤매핑 전 HDR 이라 휘도는 l/(1+l) 로 눌러 쓴다)
vec3 fxaa(vec2 uv) {
  vec3 m = texture2D(tColor, uv).rgb;
  float lm = lum(m); lm /= 1.0 + lm;
  float a = lum(texture2D(tColor, uv + vec2(-1.0, -1.0) * uTexel).rgb); a /= 1.0 + a;
  float b = lum(texture2D(tColor, uv + vec2( 1.0, -1.0) * uTexel).rgb); b /= 1.0 + b;
  float c = lum(texture2D(tColor, uv + vec2(-1.0,  1.0) * uTexel).rgb); c /= 1.0 + c;
  float d = lum(texture2D(tColor, uv + vec2( 1.0,  1.0) * uTexel).rgb); d /= 1.0 + d;
  float lo = min(lm, min(min(a, b), min(c, d)));
  float hi = max(lm, max(max(a, b), max(c, d)));
  if (hi - lo < max(0.04, hi * 0.12)) return m;
  vec2 dir = vec2((c + d) - (a + b), (a + c) - (b + d));
  float k = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((a + b + c + d) * 0.03, 0.008));
  dir = clamp(dir * k, -6.0, 6.0) * uTexel;
  vec3 near = 0.5 * (texture2D(tColor, uv - dir * 0.17).rgb + texture2D(tColor, uv + dir * 0.17).rgb);
  vec3 far = 0.5 * near + 0.25 * (texture2D(tColor, uv - dir * 0.5).rgb + texture2D(tColor, uv + dir * 0.5).rgb);
  float lf = lum(far); lf /= 1.0 + lf;
  return (lf < lo || lf > hi) ? near : far;
}
#endif

void main() {
#ifdef USE_FXAA
  vec3 col = fxaa(vUv);
#else
  vec3 col = texture2D(tColor, vUv).rgb;
#endif
  float rawDepth = texture2D(tDepth, vUv).x;
  bool sky = rawDepth >= 0.99999;

  // ── 구석 그늘: 이웃 깊이로 면 방향을 되살리고, 반구 안에 솟은 이웃만큼 어둡게 ──
  if (uAO > 0.0 && !sky) {
    vec3 p = viewPos(vUv);
    // 좌우·위아래 중 더 가까운 쪽 차이로 면을 만든다(가장자리에서 뒤의 물체를 끌어오지 않게)
    vec3 pr = viewPos(vUv + vec2(uTexel.x, 0.0)), pl = viewPos(vUv - vec2(uTexel.x, 0.0));
    vec3 pu = viewPos(vUv + vec2(0.0, uTexel.y)), pd = viewPos(vUv - vec2(0.0, uTexel.y));
    vec3 dx = abs(pr.z - p.z) < abs(p.z - pl.z) ? pr - p : p - pl;
    vec3 dy = abs(pu.z - p.z) < abs(p.z - pd.z) ? pu - p : p - pd;
    vec3 n = normalize(cross(dx, dy));
    float px = clamp(uAORadius * uProjScale / max(-p.z, 0.05), 3.0, 48.0);   // 월드 반지름을 화면 픽셀로
    // 표본 방향은 고정한다 — 픽셀마다 돌리면 흐리기 패스 없이 털·갈기 위에 자글자글한 점이 남는다(11-19 캡처)
    float spin = 0.0;
    float occ = 0.0;
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float r = px * (0.25 + 0.75 * fract(fi * 0.618034 + 0.31));
      float ang = spin + fi * 2.3999632;
      vec3 q = viewPos(vUv + vec2(cos(ang), sin(ang)) * r * uTexel);
      vec3 v = q - p;
      float dist = length(v);
      float facing = max(dot(n, v / max(dist, 1e-4)) - 0.12, 0.0);
      occ += facing * (1.0 - smoothstep(uAORadius * 0.6, uAORadius * 1.6, dist));
    }
    col *= 1.0 - clamp(occ / 8.0 * 1.6, 0.0, 1.0) * uAO;
  }

  // ── 빛 번짐: 둘레의 밝은 곳(문턱 넘는 만큼)을 나선으로 모아 더한다 ──
  if (uBloom > 0.0) {
    vec3 glow = vec3(0.0);
    float wsum = 0.0;
    float rad = uBloomRadius / (900.0 * uTexel.y);
    float spin = noise2(gl_FragCoord.yx + 17.0) * 6.2831853;
    for (int i = 0; i < 12; i++) {
      float fi = float(i);
      float t = (fi + 0.5) / 12.0;
      float ang = spin + fi * 2.3999632;
      vec3 s = texture2D(tColor, vUv + vec2(cos(ang), sin(ang)) * sqrt(t) * rad * uTexel).rgb;
      float w = 1.0 - t * 0.7;
      glow += max(s - vec3(uThreshold), 0.0) * w;
      wsum += w;
    }
    col += glow / wsum * uBloom * 2.0;
  }

  // ── 판의 시간: 장면 전체에 곱하고(밤은 라벤더) 바닥을 살짝 띄운다. 아주 밝은 곳은 덜 곱한다 ──
  float keep = smoothstep(uKeep, uKeep * 2.2, lum(col));
  col = mix(col * uTint, col, keep * 0.5) + uLift;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>

  // ── 색 보정(화면 색 공간 0..1) ──
  vec3 c = gl_FragColor.rgb;
  float l = lum(c);
  // 밤처럼 색을 곱해 어두워지면 채도도 빠진다 — 어두워진 만큼 채도를 돌려준다(장난감 색이 회색으로 바래지 않게)
  float dim = clamp(1.0 - dot(uTint, vec3(0.2126, 0.7152, 0.0722)), 0.0, 0.6);
  c = mix(vec3(l), c, uSat + dim * 0.6);
  c = mix(c, c * c * (3.0 - 2.0 * c), uContrast);
  c += vec3(1.0, 0.45, -0.6) * uWarm * smoothstep(0.45, 1.0, l) + vec3(-0.5, 0.0, 0.8) * uWarm * (1.0 - smoothstep(0.0, 0.35, l));
  vec2 q = vUv - 0.5;
  c *= 1.0 - uVignette * smoothstep(0.18, 0.75, dot(q, q) * 2.0);
  c += (noise2(gl_FragCoord.xy + uTime * 61.0) - 0.5) * uDither / 255.0;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

/** 이 기기에서 쓸 수 있는가: WebGL2 · 반정밀 색 렌더 타깃 · 깊이 텍스처. 못 쓰면 까닭을 돌려준다. */
export function postSupport(renderer) {
  const caps = renderer?.capabilities;
  if (!caps?.isWebGL2) return 'webgl1';
  const gl = renderer.getContext();
  if (!gl.getExtension('EXT_color_buffer_half_float') && !gl.getExtension('EXT_color_buffer_float')) return 'no-half-float-target';
  return null;
}

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @param {{ msaa?: number }} [opts] msaa: 장면 렌더 타깃의 표본 수(0 이면 셰이더 FXAA)
 */
export function createPostFx(renderer, scene, camera, { msaa = 4 } = {}) {
  const why = postSupport(renderer);
  let usable = why === null;
  let enabled = usable;
  let failure = why;
  let samples = msaa;
  let rt = null;
  const size = new THREE.Vector2();
  const params = { ...POST_DEFAULTS };
  const stats = { frames: 0, post: 0 };

  const uniforms = {
    tColor: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2(1, 1) },
    uInvProj: { value: new THREE.Matrix4() }, uProjScale: { value: 1 },
    uAO: { value: 0 }, uAORadius: { value: 0 }, uBloom: { value: 0 }, uThreshold: { value: 1 }, uBloomRadius: { value: 1 },
    uSat: { value: 1 }, uContrast: { value: 0 }, uWarm: { value: 0 }, uVignette: { value: 0 }, uDither: { value: 0 }, uTime: { value: 0 },
    uTint: { value: new THREE.Vector3(1, 1, 1) }, uLift: { value: new THREE.Vector3(0, 0, 0) }, uKeep: { value: 1.15 }
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
  material.userData = { outlineParameters: { visible: false } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function applyAA() {
    const fxaa = samples === 0;
    if (Boolean(material.defines.USE_FXAA) !== fxaa) {
      if (fxaa) material.defines.USE_FXAA = ''; else delete material.defines.USE_FXAA;
      material.needsUpdate = true;
    }
  }
  applyAA();

  function ensureTarget() {
    renderer.getDrawingBufferSize(size);
    const w = Math.max(2, Math.floor(size.x));
    const h = Math.max(2, Math.floor(size.y));
    if (rt && rt.width === w && rt.height === h && rt.samples === samples) return;
    rt?.dispose();
    const depthTexture = new THREE.DepthTexture(w, h);
    depthTexture.type = THREE.UnsignedIntType;
    rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples, depthBuffer: true, depthTexture });
    uniforms.tColor.value = rt.texture;
    uniforms.tDepth.value = rt.depthTexture;
    uniforms.uTexel.value.set(1 / w, 1 / h);
  }

  function syncUniforms(time) {
    uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
    // 시점 거리 1 에서 월드 1 이 몇 픽셀인가 = (화면 높이 / 2) / tan(fov/2)
    uniforms.uProjScale.value = (size.y * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);
    uniforms.uAO.value = params.ao;
    uniforms.uAORadius.value = params.aoRadius;
    uniforms.uBloom.value = params.bloom;
    uniforms.uThreshold.value = params.bloomThreshold;
    uniforms.uBloomRadius.value = params.bloomRadius;
    uniforms.uSat.value = params.saturation;
    uniforms.uContrast.value = params.contrast;
    uniforms.uWarm.value = params.warm;
    uniforms.uVignette.value = params.vignette;
    uniforms.uDither.value = params.dither;
    uniforms.uTime.value = time % 100;
  }

  /** 한 프레임. 꺼졌거나 못 쓰면 보통 렌더와 같다. 보정을 거쳤는지 돌려준다. */
  function render(time = performance.now() / 1000) {
    stats.frames += 1;
    if (!enabled || !usable) {
      renderer.render(scene, camera);
      return false;
    }
    try {
      ensureTarget();
      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      syncUniforms(time);
      // 드로우콜 셈: three 는 render 마다 셈을 비우고(그림자 패스는 비우기 전에 그려 빠진다), 보정 사각형은 장면 셈에 더한다
      // — 그래서 프레임의 셈 = 장면(그림자 빼고) + 1. 프레임 단위로 비우면 그림자 패스 37콜이 섞여 잡기 순간 77 → 114 로 보였다(11-19).
      const autoReset = renderer.info.autoReset;
      renderer.info.autoReset = false;
      renderer.render(quadScene, quadCam);
      renderer.info.autoReset = autoReset;
      stats.post += 1;
      return true;
    } catch (e) {
      // 다시 켜지 않는다 — 이 기기에서는 보통 렌더로 돈다
      usable = false;
      failure = `error: ${String(e?.message || e).slice(0, 160)}`;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return false;
    }
  }

  return {
    render,
    setEnabled(on) { enabled = Boolean(on); return enabled && usable; },
    isOn: () => enabled && usable,
    /** 장면 렌더 타깃의 표본 수(0 이면 셰이더 FXAA). */
    setSamples(n) { samples = Math.max(0, Math.min(8, Math.floor(n) || 0)); applyAA(); },
    /** 판의 시간 색(dayCycle.js 의 dayLook). 보정이 꺼져 있으면 아무 일도 없다. */
    setTint(tint, lift) {
      if (Array.isArray(tint)) uniforms.uTint.value.set(tint[0], tint[1], tint[2]);
      if (Array.isArray(lift)) uniforms.uLift.value.set(lift[0], lift[1], lift[2]);
    },
    setParams(next) { for (const k of Object.keys(next || {})) if (k in params && Number.isFinite(next[k])) params[k] = next[k]; return { ...params }; },
    state: () => ({ on: enabled && usable, enabled, usable, failure, samples, params: { ...params }, size: rt ? [rt.width, rt.height] : null, ...stats }),
    dispose() { rt?.dispose(); material.dispose(); quad.geometry.dispose(); }
  };
}
