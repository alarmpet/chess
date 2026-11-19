// 군도 (군도 설계 2026-11-16, docs/plans/2026-11-16-archipelago-plan.md · AR-1 ~ AR-3).
// 섬은 일곱 개에서 끝난다: 해초 섬(첫 섬) → 동물 다섯의 섬(순서는 플레이어가 고른다) → 왕관 섬.
//   · AR-1 끝낸 섬은 지워지지 않고 기록으로 남는다(건물·소품 배치, 끝낸 판, 그 섬의 이름) — 바다 지도에서 다시 본다.
//   · AR-2 k 번째 섬의 건물 값 = 처음 값 × (1 + 0.15 × (k − 1)) · 섬마다 그 동물 주민의 영향권이 넓어진다.
//   · AR-3 끝낸 섬은 판이 끝날 때마다 그 섬의 특산물을 하나씩 보낸다.
// 순수 함수다(DOM·three 없음). 영향권 모양은 economy.js 가, 화면은 VillageView 가 이 파일을 읽는다.

/** 섬 일곱. `boost` 는 그 섬에서 넓어지는 동물의 영향권, `gift` 는 끝낸 뒤 판마다 보내는 것. */
export const THEMES = {
  kelp: { ko: '해초 섬', en: 'Kelp Isle', icon: '🌿', animal: 'meerkat', boost: null, rule: '배우는 섬 — 특별한 규칙이 없어요', gift: { kind: 'grain', n: 1, ko: '곡물 1' }, landmark: '해초 등대' },
  kangaroo: { ko: '캥거루 섬', en: 'Kangaroo Isle', icon: '🦘', animal: 'kangaroo', boost: 'kangaroo', rule: '캥거루 주민이 두 번 뛴 L자까지 닿아요', gift: { kind: 'coins', n: 2, ko: '도토리 2' }, landmark: '캥거루 석상' },
  panda: { ko: '판다 섬', en: 'Panda Isle', icon: '🐼', animal: 'panda', boost: 'panda', rule: '판다 주민의 대각선이 섬 끝까지 닿아요', gift: { kind: 'hearts', n: 1, ko: '하트 1' }, landmark: '판다 석상' },
  rhino: { ko: '코뿔소 섬', en: 'Rhino Isle', icon: '🦏', animal: 'rhino', boost: 'rhino', rule: '코뿔소 주민의 십자가 섬 끝까지 닿아요', gift: { kind: 'parts', n: 1, ko: '부품 1' }, landmark: '코뿔소 석상' },
  tiger: { ko: '호랑이 섬', en: 'Tiger Isle', icon: '🐯', animal: 'tiger', boost: 'tiger', rule: '호랑이 주민이 세 칸까지 닿아요', gift: { kind: 'work', n: 0.5, ko: '공방 진도 0.5일' }, landmark: '호랑이 석상' },
  lion: { ko: '사자 섬', en: 'Lion Isle', icon: '🦁', animal: 'lion', boost: 'lion', rule: '사자 주민이 둘레 두 칸까지 닿아요', gift: { kind: 'coins', n: 3, ko: '도토리 3' }, landmark: '사자 석상' },
  crown: { ko: '왕관 섬', en: 'Crown Isle', icon: '👑', animal: 'lion', boost: 'all', rule: '여섯 섬의 규칙이 모두 켜져요', gift: null, landmark: '왕관 탑' }
};
export const FIRST_THEME = 'kelp';
export const MIDDLE_THEMES = ['kangaroo', 'panda', 'rhino', 'tiger', 'lion'];
export const LAST_THEME = 'crown';
export const ISLANDS_TOTAL = 1 + MIDDLE_THEMES.length + 1;   // 7
/** 섬마다 건물 값이 오르는 비율(봇으로 골랐다: 0 이면 뒤 섬이 오히려 빨라지고 0.3 이면 마지막 섬 하나에 52판). */
export const ARCH_COST_STEP = 0.15;

// seed: 첫 해초 섬의 모양을 플레이어마다 다르게(절차적 섬 PI-1). 동물 섬은 모두 같은 모양이다.
const newSeed = () => 1 + Math.floor(Math.random() * 0x7ffffffe);
export const emptyArch = () => ({ current: FIRST_THEME, done: [], seed: newSeed() });

/** 저장에서 읽은 군도를 바로잡는다. 없으면 해초 섬에서 시작(옛 저장의 지난 섬들은 사진첩에만 남는다). */
export function sanitizeArch(raw) {
  if (!raw || typeof raw !== 'object' || !THEMES[raw.current]) return emptyArch();
  const seed = Number.isInteger(raw.seed) && raw.seed > 0 ? raw.seed : newSeed();
  const seen = new Set();
  const done = (Array.isArray(raw.done) ? raw.done : []).filter((d) => d && THEMES[d.theme] && !seen.has(d.theme) && seen.add(d.theme)).map((d) => ({
    theme: d.theme,
    island: Number.isFinite(d.island) ? d.island : 0,
    games: Number.isFinite(d.games) ? d.games : 0,
    built: (Array.isArray(d.built) ? d.built : []).filter((b) => b && typeof b.kind === 'string' && /^[a-h][1-8]$/.test(b.sq)).map((b) => ({ kind: b.kind, sq: b.sq, level: Number(b.level) || 0, tenant: typeof b.tenant === 'string' ? b.tenant : null })),
    decor: (Array.isArray(d.decor) ? d.decor : []).filter((x) => x && typeof x.kind === 'string' && /^[a-h][1-8]$/.test(x.sq)).map((x) => ({ kind: x.kind, sq: x.sq }))
  }));
  return { current: raw.current, done, finished: raw.finished === true, seed };
}

/** 지금 몇 번째 섬인가(1부터). */
export const islandIndex = (arch) => (arch?.done?.length || 0) + 1;

/** k 번째 섬에서의 건물 값. */
export function archCost(base, index) {
  return Math.round(base * (1 + ARCH_COST_STEP * (Math.max(1, index) - 1)));
}

/** 다음에 고를 수 있는 섬. 다섯 동물 섬을 다 끝내야 왕관 섬, 왕관 섬을 끝내면 없다. */
export function nextChoices(arch) {
  const done = new Set((arch?.done || []).map((d) => d.theme));
  if (done.has(LAST_THEME)) return [];
  const left = MIDDLE_THEMES.filter((t) => !done.has(t) && t !== arch?.current);
  if (left.length) return left;
  return arch?.current === LAST_THEME ? [] : [LAST_THEME];
}

/** 끝낸 섬을 기록으로 옮긴다. 이미 있으면 아무것도 안 한다. */
export function archiveIsland(arch, v) {
  if (!arch || (arch.done || []).some((d) => d.theme === arch.current)) return null;
  const rec = {
    theme: arch.current,
    island: v.island || islandIndex(arch),
    games: v.games || 0,
    built: (v.built || []).map((b) => ({ kind: b.kind, sq: b.sq, level: b.level || 0, tenant: b.tenant || null })),
    decor: (v.decor || []).map((d) => ({ kind: d.kind, sq: d.sq }))
  };
  arch.done.push(rec);
  return rec;
}

/** 다음 섬으로: 지금 섬을 기록하고 고른 섬을 지금 섬으로. 고를 수 없는 섬이면 까닭을 돌려준다. */
export function advanceArch(arch, v, theme) {
  const choices = nextChoices(arch);
  if (!choices.length) return 'finished';
  if (!choices.includes(theme)) return 'choice';
  archiveIsland(arch, v);
  arch.current = theme;
  return null;
}

/** 왕관 섬까지 끝냈는가. */
export const archFinished = (arch) => (arch?.done || []).some((d) => d.theme === LAST_THEME);

/** 이 섬에서 넓어지는 동물들(영향권 계산이 읽는다). */
export function boostedAnimals(arch) {
  const b = THEMES[arch?.current]?.boost;
  if (!b) return [];
  return b === 'all' ? MIDDLE_THEMES.map((t) => THEMES[t].animal) : [b];
}

/**
 * 특산물(AR-3): 끝낸 섬마다 판이 끝날 때 하나씩. 받은 것을 돌려준다. `limits` 는 상한(곡물·부품·진도).
 * 하트는 그 판의 활약한 말(mvp)에게.
 */
export function giveSpecialties(v, arch, { mvp = null, limits = {} } = {}) {
  const got = [];
  for (const d of arch?.done || []) {
    const g = THEMES[d.theme]?.gift;
    if (!g) continue;
    if (g.kind === 'grain') { const before = v.grain || 0; v.grain = Math.min(limits.grain ?? Infinity, before + g.n); if (v.grain > before) got.push({ theme: d.theme, ...g }); }
    else if (g.kind === 'coins') { v.coins = (v.coins || 0) + g.n; got.push({ theme: d.theme, ...g }); }
    else if (g.kind === 'hearts' && mvp) { v.hearts[mvp] = (v.hearts[mvp] || 0) + g.n; got.push({ theme: d.theme, ...g }); }
    else if (g.kind === 'parts' && v.workshop) { const before = v.workshop.parts; v.workshop.parts = Math.min(limits.parts ?? Infinity, before + g.n); if (v.workshop.parts > before) got.push({ theme: d.theme, ...g }); }
    else if (g.kind === 'work' && v.workshop) { const before = v.workshop.work; v.workshop.work = Math.min(limits.work ?? Infinity, Math.round((before + g.n) * 10) / 10); if (v.workshop.work > before) got.push({ theme: d.theme, ...g }); }
  }
  return got;
}

/** 왕관 섬을 끝냈을 때: 그 섬도 기록으로 남기고 군도를 끝낸다(새 섬은 더 없다). 처음 끝낸 때만 true. */
export function finishArch(arch, v) {
  if (!arch || arch.current !== LAST_THEME || arch.finished) return false;
  archiveIsland(arch, v);
  arch.finished = true;
  return true;
}
