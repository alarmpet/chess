// 절차적 섬 (계획 docs/plans/2026-11-16-procedural-islands-plan.md · PI-1, 2026-11-17).
// 시드 하나 → 높이 지도 한 장 → 섬의 모양. 같은 시드면 같은 섬이다.
//   ① 큰 모양: 펄린 노이즈(격자 점마다 기울기, 사이는 부드럽게 섞기)
//   ② 작은 굴곡: 옥타브(무늬 크기 ½ · 세기 ½ 를 여러 장 겹치기)
//   ③ 가장자리 낮추기: 폴오프(가장자리로 갈수록 더 깎기) + 높이 곡선(완만·가파름·계단)
// 기법은 널리 알려진 것이고 코드는 이 저장소에서 새로 짰다(영상·원전의 코드를 가져오지 않았다).
// 같은 높이 지도를 군도 지도(2D 그림)와 체스 판 화면의 해안선(3D)이 함께 쓴다.

/** 섬마다의 설정: 노이즈 크기 · 옥타브 · 폴오프 세기 · 높이 곡선 · 물 높이 · 색표. 시드는 테마마다 고정(모두 같은 섬), 해초 섬만 플레이어마다. */
export const ISLAND_LOOKS = {
  kelp: { seed: 42, scale: 3.2, octaves: 4, falloff: 2.6, curve: 'gentle', sea: 0.31, palette: 'lagoon' },
  kangaroo: { seed: 1107, scale: 3.8, octaves: 4, falloff: 2.2, curve: 'plain', sea: 0.33, palette: 'outback' },
  panda: { seed: 2203, scale: 3.4, octaves: 5, falloff: 2.4, curve: 'normal', sea: 0.3, palette: 'bamboo' },
  rhino: { seed: 3301, scale: 3.0, octaves: 4, falloff: 2.8, curve: 'terrace', sea: 0.29, palette: 'rock' },
  tiger: { seed: 4409, scale: 4.2, octaves: 5, falloff: 2.0, curve: 'steep', sea: 0.34, palette: 'jungle' },
  lion: { seed: 5507, scale: 2.6, octaves: 4, falloff: 3.0, curve: 'peak', sea: 0.28, palette: 'savanna' },
  crown: { seed: 7777, scale: 3.6, octaves: 5, falloff: 2.4, curve: 'terrace', sea: 0.3, palette: 'royal' }
};

/** 높이 → 지형 색표(깊은 바다 · 얕은 바다 · 모래 · 풀 · 숲 · 바위 · 꼭대기). 문턱은 물 높이 위로의 비율. */
export const PALETTES = {
  lagoon: ['#1d5f8a', '#3fb6c9', '#f2dfa0', '#8fd16a', '#4e9a43', '#8a7d6b', '#ffffff'],
  outback: ['#1d5f8a', '#46b8c4', '#f3c89a', '#e09a5c', '#c0602a', '#8a3a20', '#f2c08a'],   // 캥거루: 붉은 사막(사자 섬과 헷갈렸다 — 4차 블라인드)
  bamboo: ['#1d5f8a', '#41b5c8', '#efe1a8', '#b9e08c', '#6fb36a', '#e8eee4', '#ffffff'],   // 판다: 연둣빛 대숲과 흰 바위
  rock: ['#1d5f8a', '#3fa9c2', '#e6d9b0', '#9cc27a', '#7d8a72', '#6e6a66', '#d9d6d0'],
  jungle: ['#1a5a86', '#36b0c2', '#f0dc98', '#4f9a3a', '#2c5f26', '#d9761c', '#ffb04a'],   // 호랑이: 짙은 밀림과 주황 바위(판다와 헷갈렸다 — 3차 블라인드)
  savanna: ['#1d5f8a', '#47b9c6', '#f6e2a0', '#c9d46a', '#7fa04a', '#e0b84a', '#fff3b0'],   // 사자: 노란 풀과 올리브 덤불, 금빛 바위
  royal: ['#1b4f86', '#4fb2d6', '#f5e6b0', '#a3d67a', '#5aa057', '#8b7aa8', '#ffe57a']
};
/** 섬마다의 하늘 빛(판 화면의 하늘 꼭대기·수평선을 이쪽으로 조금). 해초 섬은 null — 처음 모습 그대로. */
export const ISLAND_SKY = { kelp: null, kangaroo: '#ff9a52', panda: '#e6f6ff', rhino: '#8f9db0', tiger: '#2f8f5a', lion: '#ffc23a', crown: '#a77bff' };
export const BAND_EDGES = [0, 0.09, 0.22, 0.48, 0.72, 0.9];   // 물 위 높이를 0~1 로 볼 때 모래·풀·숲·바위·꼭대기가 시작하는 곳

// ── 펄린 노이즈(2D) ─────────────────────────────────────────────────────────────
/** 시드 난수(mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** 시드로 섞은 순열 표와 격자 점의 기울기. 반환한 함수는 (x, y) → 약 −1 ~ 1. */
export function perlin(seed) {
  const r = rng(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  // 격자 점마다 오르막 방향(단위 벡터 여덟 가지 가운데 하나)
  const GX = [1, -1, 0, 0, 0.7071, -0.7071, 0.7071, -0.7071];
  const GY = [0, 0, 1, -1, 0.7071, 0.7071, -0.7071, -0.7071];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const dot = (h, x, y) => GX[h & 7] * x + GY[h & 7] * y;
  return (x, y) => {
    const xi = Math.floor(x); const yi = Math.floor(y);
    const xf = x - xi; const yf = y - yi;
    const X = xi & 255; const Y = yi & 255;
    const aa = perm[perm[X] + Y]; const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y]; const bb = perm[perm[X + 1] + Y + 1];
    const u = fade(xf); const v = fade(yf);
    const x1 = dot(aa, xf, yf) + u * (dot(ba, xf - 1, yf) - dot(aa, xf, yf));
    const x2 = dot(ab, xf, yf - 1) + u * (dot(bb, xf - 1, yf - 1) - dot(ab, xf, yf - 1));
    return (x1 + v * (x2 - x1)) * 1.41;
  };
}

/** 옥타브: 무늬 크기 ½(주파수 ×2) · 세기 ½ 로 `octaves` 장을 겹친다. 0 ~ 1 로 돌려준다. */
export function fbm(noise, x, y, octaves = 4) {
  let sum = 0; let amp = 1; let freq = 1; let norm = 0;
  for (let i = 0; i < octaves; i++) { sum += noise(x * freq, y * freq) * amp; norm += amp; amp *= 0.5; freq *= 2; }
  return Math.min(1, Math.max(0, sum / norm * 0.5 + 0.5));
}

/** 폴오프: 가운데 0, 가장자리 1 에 가까운 깎는 양. `a` 가 클수록 가운데가 넓다. */
export function falloff(nx, ny, a = 2.6) {
  const v = Math.max(Math.abs(nx), Math.abs(ny)) * 0.6 + Math.hypot(nx, ny) * 0.4;   // 사각과 원 사이
  const t = Math.min(1, v);
  return t ** a / (t ** a + (2.2 - 2.2 * t) ** a);
}

/** 높이 곡선: 물 위 높이(0~1)를 다듬는다. */
export function heightCurve(h, kind) {
  if (kind === 'gentle') return h ** 1.6;                         // 낮고 넓은 모래톱
  if (kind === 'plain') return h ** 1.3 * 0.85;                   // 평평한 들
  if (kind === 'steep') return h ** 2.4 * 1.15;                   // 낮은 땅은 완만, 높은 땅은 가파르게
  if (kind === 'peak') return Math.min(1, h ** 2.8 * 1.4);         // 한가운데 큰 봉우리
  if (kind === 'terrace') return Math.round(h ** 1.4 * 4) / 4;     // 계단 → 층층 고원
  return h ** 1.8;
}

/** 이 섬의 시드: 테마 시드, 해초 섬만 플레이어 시드(군도 기록의 seed)를 섞는다. */
export function islandSeed(theme, playerSeed = 0) {
  const base = ISLAND_LOOKS[theme]?.seed ?? 42;
  return theme === 'kelp' && playerSeed ? (base * 31 + (playerSeed >>> 0)) >>> 0 : base;
}

/**
 * 높이 지도: size × size 칸, 값은 −1(깊은 바다) ~ 1(꼭대기). 물 높이(`sea`)보다 낮으면 바다(음수), 높으면 땅(양수, 높이 곡선을 거친 값).
 * @returns {{ size: number, h: Float32Array, theme: string, seed: number }}
 */
export function islandHeightmap(theme, { size = 48, playerSeed = 0, octaves = null } = {}) {
  const look = ISLAND_LOOKS[theme] || ISLAND_LOOKS.kelp;
  const seed = islandSeed(theme, playerSeed);
  const noise = perlin(seed);
  const h = new Float32Array(size * size);
  const oct = octaves ?? look.octaves;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / (size - 1)) * 2 - 1;
      const ny = (y / (size - 1)) * 2 - 1;
      // 노이즈의 대비를 키우고(2.2배) 폴오프는 0.9 만 — 폴오프가 세면 섬마다 같은 감자 모양이 된다(일곱 섬 겹침 0.88 → 0.65, 2026-11-17)
      let v = 0.5 + (fbm(noise, (x / size) * look.scale + 17.3, (y / size) * look.scale + 9.1, oct) - 0.5) * 2.2;
      v -= falloff(nx, ny, look.falloff) * 0.9;
      v = Math.max(-1, v);
      h[y * size + x] = v < look.sea ? Math.max(-1, (v - look.sea) / (look.sea + 1)) : heightCurve((v - look.sea) / (1 - look.sea), look.curve);
    }
  }
  return { size, h, theme, seed };
}

/** 땅 칸의 비율. */
export function landRatio(map) {
  let n = 0;
  for (const v of map.h) if (v >= 0) n += 1;
  return n / map.h.length;
}

/** 해안선 길이: 땅 칸과 물 칸이 맞닿은 변의 수(지도 크기로 나눈 값). */
export function coastLength(map) {
  const { size, h } = map;
  let n = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const land = h[y * size + x] >= 0;
    if (x + 1 < size && land !== (h[y * size + x + 1] >= 0)) n += 1;
    if (y + 1 < size && land !== (h[(y + 1) * size + x] >= 0)) n += 1;
  }
  return n / size;
}

/** 두 섬의 땅이 겹치는 비율(Jaccard). 1 이면 같은 모양. */
export function overlap(a, b) {
  let both = 0; let either = 0;
  for (let i = 0; i < a.h.length; i++) { const p = a.h[i] >= 0; const q = b.h[i] >= 0; if (p && q) both += 1; if (p || q) either += 1; }
  return either ? both / either : 1;
}

/**
 * 해안선 윤곽(PI-3): 가운데에서 바깥으로 각도마다 마지막 땅 칸까지의 거리를 재서, 평균에서 얼마나 나오고 들어갔는지를 −1 ~ 1 로.
 * 체스 판 화면의 섬 둘레가 이 윤곽을 따른다 — 지도의 섬과 판 화면의 섬이 같은 모양이 된다.
 */
export function coastProfile(map, samples = 64) {
  const { size, h } = map;
  const c = (size - 1) / 2;
  const reach = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * Math.PI * 2;
    let last = 0;
    for (let r = 0; r < c; r += 0.5) {
      const x = Math.round(c + Math.cos(a) * r); const y = Math.round(c + Math.sin(a) * r);
      if (h[y * size + x] >= 0) last = r;
    }
    reach[i] = last;
  }
  // 이웃 셋으로 부드럽게, 평균을 빼고 가장 큰 쪽으로 나눈다
  const smooth = reach.map((_, i) => (reach[(i + samples - 1) % samples] + reach[i] * 2 + reach[(i + 1) % samples]) / 4);
  const mean = smooth.reduce((s, v) => s + v, 0) / samples;
  const dev = Math.max(1e-6, ...smooth.map((v) => Math.abs(v - mean)));
  return Array.from(smooth, (v) => +((v - mean) / dev).toFixed(3));
}

/** 높이 → 색표의 색(hex 문자열). */
export function heightColor(v, palette) {
  const p = PALETTES[palette] || PALETTES.lagoon;
  if (v < -0.35) return p[0];
  if (v < 0) return p[1];
  let band = 2;
  for (let i = 1; i < BAND_EDGES.length; i++) if (v >= BAND_EDGES[i]) band = 2 + i;
  return p[Math.min(p.length - 1, band)];
}
