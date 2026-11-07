// Soft toy water around the village island: ripples, shoreline foam and the land's own shadow, all from the distance
// to a square island. No reflection pass, so it costs one quad.
import * as THREE from 'three';

const VERT = `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = `
uniform float uTime, uGlow, uScale, uFadeFrom, uFadeTo;
uniform vec3 uDeep, uShallow, uFoam, uHorizon;
varying vec3 vWorld;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float box(vec2 p, float r) { vec2 q = abs(p) - vec2(r); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
void main() {
  vec2 p = vWorld.xz * uScale;
  float t = uTime;
  float d = box(p, 4.0);
  float n = noise(p * 0.7 + t * vec2(0.06, 0.04)) + 0.5 * noise(p * 1.9 - t * vec2(0.09, 0.05));
  vec3 col = mix(uShallow, uDeep, smoothstep(0.2, 5.0, d + (n - 0.75) * 0.9));
  float bands = smoothstep(0.035, 0.0, abs(fract(n * 3.2 + t * 0.03) - 0.5)) * smoothstep(0.5, 2.5, d);
  col += uFoam * bands * 0.05;
  float shore = sin(d * 7.0 - t * 1.1 + n * 4.0) * 0.5 + 0.5;
  float foam = smoothstep(0.86, 0.97, shore) * smoothstep(0.7, 0.08, d);
  foam = max(foam, smoothstep(0.14, 0.02, d + (n - 0.75) * 0.14));
  col = mix(col, uFoam, foam * 0.7);
  float shadow = smoothstep(1.0, -0.3, box(p - vec2(0.75, 0.75), 4.0));
  col *= 1.0 - shadow * 0.34;
  col += vec3(1.0, 0.72, 0.32) * uGlow * smoothstep(2.4, 0.0, d) * (0.1 + 0.08 * noise(p * 3.0 + t * 0.3));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  // After tone mapping, because the sky behind the horizon is not tone mapped either.
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uHorizon, smoothstep(uFadeFrom, uFadeTo, length(vWorld.xz)));
  #include <colorspace_fragment>
}`;

/** `islandHalf` is half the island's width in world units; the pattern is drawn as if that were 4. */
export function createWater({ islandHalf = 4, size = 140, fadeFrom = 1000, fadeTo = 2000 } = {}) {
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uGlow: { value: 0 },
      uScale: { value: 4 / islandHalf },
      uFadeFrom: { value: fadeFrom },
      uFadeTo: { value: fadeTo },
      uDeep: { value: new THREE.Color() },
      uShallow: { value: new THREE.Color() },
      uFoam: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() }
    }
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  return { mesh, material };
}
