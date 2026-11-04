// Village game rules (docs/plans/2026-10-31-crown-island-plan.md). Pure: time is passed in, nothing touches the DOM.
// Every number here is a prototype guess, not a measured balance.
import { replayGame, growVillage, emptyVillage } from './roster.js';
import { seededRoll } from '../cards/economy.js';

export const VILLAGE_KEY = 'wildcrown.village.v1';
export const COINS = { win: 30, draw: 20, loss: 15 };
export const PET_DAILY_CAP = 10;            // Pokémon GO buddy: a daily heart cap ends the session kindly
export const MVP_HEARTS = 5;
export const HEART_STAGES = [[60, 'starlit'], [30, 'adult'], [10, 'grown'], [0, 'baby']];
export const VISIT_GAP_MS = 4 * 3600 * 1000;
export const VISIT_GIFT = 10;
export const GRAIN_MAX = 20;                // a full barn stops the field, nothing is thrown away
export const BREAD_MAX = 10;
export const GRAIN_PRICE = 2;
export const BREAD_PRICE = 8;
export const BONUS_MAX = 3;
export const LEVEL_MAX = 3;
export const QUEST_FROM_GAME = 5;           // the first games show only capturing and building
export const DEW_GRAIN = 1;                 // garden-short G2: a starting guess, to be compared on and off in play tests

// The chess game is the clock: a building placed now opens when the next game ends, and nothing runs on real time.
// minRarity is the resident a building needs to work: any animal of that rarity or better, never one named card.
export const BUILDINGS = {
  field: { ko: '밭', en: 'Field', cost: 20, minRarity: 0, icon: '🌾', effect: '판이 끝나면 곡물이 자랍니다' },
  shelter: { ko: '숲 쉼터', en: 'Grove hut', cost: 30, minRarity: 0, icon: '🌳', effect: '이번 판 나무만큼 하트가 모입니다' },
  mill: { ko: '풍차', en: 'Windmill', cost: 40, minRarity: 0, icon: '🌬️', effect: '빵집이 곡물을 절반만 씁니다' },
  market: { ko: '장터', en: 'Market', cost: 60, minRarity: 0, icon: '🧺', effect: '남은 곡물과 빵을 도토리로 팝니다' },
  bakery: { ko: '빵집', en: 'Bakery', cost: 80, minRarity: 1, icon: '🥖', effect: '곡물로 빵을 굽습니다' },
  power: { ko: '반딧불 발전소', en: 'Firefly station', cost: 120, minRarity: 1, icon: '✨', effect: '섬에 밤이 오고 모든 건물이 +1' },
  spring: { ko: '온천', en: 'Hot spring', cost: 160, minRarity: 1, icon: '♨️', effect: '빵 하나가 하트 셋이 됩니다' },
  stage: { ko: '축제 무대', en: 'Festival stage', cost: 240, minRarity: 2, icon: '🎪', effect: '의뢰를 해내면 그 동물의 축제가 열립니다' }
};
export const KIND_ORDER = Object.keys(BUILDINGS);

const FILES = 'abcdefgh';
const RAY = 3;                              // sliders stop here: a full chess line would cover the whole island
const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const SHAPES = {
  meerkat: { steps: [[0, 1]] },
  kangaroo: { steps: KNIGHT },
  panda: { rays: DIAG },
  rhino: { rays: ORTHO },
  tiger: { rays: [...ORTHO, ...DIAG], reach: 2 },
  lion: { steps: [...ORTHO, ...DIAG] }
};

/** Squares a resident of this animal touches from `sq`: the way that chess piece moves, kept on the island. */
export function influenceSquares(animal, sq) {
  const shape = SHAPES[animal];
  if (!shape) return [];
  const f = FILES.indexOf(sq[0]);
  const r = Number(sq[1]);
  const out = [];
  const add = (df, dr) => {
    const nf = f + df;
    const nr = r + dr;
    if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) out.push(`${FILES[nf]}${nr}`);
  };
  for (const [df, dr] of shape.steps || []) add(df, dr);
  for (const [df, dr] of shape.rays || []) for (let i = 1; i <= (shape.reach || RAY); i++) add(df * i, dr * i);
  return out;
}

export const tenantAnimal = (id) => id.split('_')[0];
export const tenantRarity = (id) => Number(id.split('_')[1]);

/** Extra output a building gets from the residents whose shape reaches it. Better cards touch twice as hard. */
export function influenceBonus(v, building) {
  let bonus = 0;
  for (const b of v.built) {
    if (b === building || !b.tenant || !b.ready) continue;
    if (influenceSquares(tenantAnimal(b.tenant), b.sq).includes(building.sq)) bonus += tenantRarity(b.tenant) >= 1 ? 2 : 1;
  }
  return Math.min(BONUS_MAX, bonus);
}

const blank = () => ({
  v: 2,
  coins: 30,
  grain: 0,
  bread: 0,
  map: emptyVillage(),
  hearts: {},
  names: {},
  built: [],
  decor: [{ kind: 'house', sq: 'g7' }],
  flags: [],
  nextId: 1,
  night: false,
  quest: null,
  festival: null,
  island: 1,
  walk: null,
  petDay: '',
  petCount: 0,
  rivals: {},
  visits: {},
  gifts: [],
  lastSeen: 0,
  games: 0,
  dewDay: '',
  dewAt: 0,
  seed: 0,
  week: { w: -1, n: 0, pick: null },
  shelf: { g: -1, n: 0, lv: 1, xp: 0, slots: [] },
  stash: {}
});

export const newVillage = blank;

// The first village built on real time: what stood there stays as decoration, and what was still being built is finished.
function fromV1(raw) {
  const decor = (raw.built || []).map((b) => ({ kind: b.kind, sq: b.sq }));
  if (raw.build) decor.push({ kind: raw.build.kind, sq: raw.build.sq });
  const { build, ...rest } = raw;
  return { ...rest, v: 2, built: [], decor };
}

export function sanitizeVillage(raw) {
  const base = blank();
  if (!raw || typeof raw !== 'object') return base;
  const v2 = raw.v === 1 ? fromV1(raw) : raw;
  if (v2.v !== 2) return base;
  return { ...base, ...v2, map: { ...base.map, ...v2.map } };
}

export function stageForHearts(hearts = 0) {
  return HEART_STAGES.find(([n]) => hearts >= n)[1];
}

/** Look stages from the smallest up: baby, grown, adult, starlit. */
export const STAGE_ORDER = HEART_STAGES.map(([, id]) => id).reverse();

/** The role of a start square id such as `w_e2` (desire plan D1 groups hearts by role). */
export function roleOfSlot(id) {
  if (id[3] === '2' || id[3] === '7') return 'pawn';
  return { a: 'rook', b: 'knight', c: 'bishop', d: 'queen', e: 'king', f: 'bishop', g: 'knight', h: 'rook' }[id[2]];
}

/**
 * The look stages a side has earned, role by role: the most grown piece of that role sets how far the appearance panel
 * opens. Each role also says the next stage and how many more hearts its most loved piece needs (null at the top).
 * Shape: { w: { pawn: { stage, hearts, next: { stage, need } | null } … }, b: … }.
 */
export function earnedLooks(hearts = {}) {
  const out = { w: {}, b: {} };
  for (const color of ['w', 'b']) {
    for (const role of ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']) out[color][role] = 0;
  }
  for (const [slot, n] of Object.entries(hearts || {})) {
    const color = slot[0];
    const role = out[color] && roleOfSlot(slot);
    if (!role || !Number.isFinite(n)) continue;
    out[color][role] = Math.max(out[color][role], n);
  }
  const thresholds = HEART_STAGES.map(([n]) => n).reverse();
  for (const color of ['w', 'b']) {
    for (const [role, best] of Object.entries(out[color])) {
      const stage = stageForHearts(best);
      const i = STAGE_ORDER.indexOf(stage);
      const next = i + 1 < STAGE_ORDER.length ? { stage: STAGE_ORDER[i + 1], need: thresholds[i + 1] - best } : null;
      out[color][role] = { stage, hearts: best, next };
    }
  }
  return out;
}

/** The piece of `color` that did most this game: the mating piece first, then promotions, captures and moves. */
export function pickMvp(game, color) {
  const mine = Object.entries(game.slots).filter(([id]) => id.startsWith(`${color}_`));
  const score = (s) => (s.mated ? 1000 : 0) + (s.promotedTo ? 100 : 0) + s.captures * 10 + s.moves;
  mine.sort((a, b) => score(b[1]) - score(a[1]) || (a[0] < b[0] ? -1 : 1));
  return mine[0]?.[0] || `${color}_e1`;
}

/** Squares one piece walked this game, start square first. */
export function routeOf(moves, slot) {
  const route = [slot.slice(2)];
  for (const m of moves) if (m.from === route[route.length - 1]) route.push(m.to);
  return route;
}

const add = (v, key, n, max) => {
  const room = Math.max(0, Math.min(n, max - v[key]));
  v[key] += room;
  return room;
};

// One pass through the buildings, farm to market, so grain made this game can already become bread and acorns.
function harvest(v, mvp, trees, dew = false) {
  const got = { grain: 0, bread: 0, coins: 0, hearts: 0, sold: 0 };
  const working = (kind) => v.built.filter((b) => b.kind === kind && b.ready && b.tenant);
  const lit = working('power').length;
  const output = (b) => (b.level || 0) + influenceBonus(v, b) + lit;
  const milled = working('mill').length > 0;
  for (const b of working('field')) got.grain += add(v, 'grain', 2 + output(b) + (dew ? DEW_GRAIN : 0), GRAIN_MAX);
  for (const b of working('bakery')) {
    const want = 1 + output(b) + (milled ? 1 : 0);
    const cost = milled ? 1 : 2;
    const made = Math.min(want, Math.floor(v.grain / cost), BREAD_MAX - v.bread);
    v.grain -= made * cost;
    v.bread += made;
    got.bread += made;
  }
  for (const b of working('shelter')) got.hearts += Math.min(trees, 2 + output(b));
  for (const b of working('spring')) {
    const soaks = Math.min(1 + output(b), v.bread);
    v.bread -= soaks;
    got.hearts += soaks * 3;
  }
  for (const b of working('market')) {
    const reach = 3 + output(b);
    const grain = Math.min(reach, v.grain);
    const bread = Math.min(Math.max(1, Math.floor(reach / 2)), v.bread);
    v.grain -= grain;
    v.bread -= bread;
    got.coins += grain * GRAIN_PRICE + bread * BREAD_PRICE;
    got.sold += grain + bread;
  }
  v.coins += got.coins;
  if (got.hearts) v.hearts[mvp] = (v.hearts[mvp] || 0) + got.hearts;
  return got;
}

const QUEST_PIECES = ['pawn', 'knight', 'bishop', 'rook', 'queen'];

/** A resident asks for one capture in the next game. It rotates with the game count, so the same save always asks the same thing. */
export function nextQuest(v) {
  const homes = v.built.filter((b) => b.ready && b.tenant);
  if (v.games < QUEST_FROM_GAME || !homes.length) return null;
  const b = homes[v.games % homes.length];
  return { buildingId: b.id, piece: QUEST_PIECES[(v.games * 3) % QUEST_PIECES.length] };
}

/**
 * The island's three-step loop, plant → one game → harvest (garden-short plan G1), read from the save.
 * `next` is the one thing to do now: build somewhere, give a building a resident, or play the game that grows it.
 */
export function loopStep(v) {
  const working = v.built.filter((b) => b.ready && b.tenant).length;
  const waiting = v.built.filter((b) => !b.ready).length;
  const empty = v.built.filter((b) => b.ready && !b.tenant).length;
  const next = empty ? 'resident' : working || waiting ? 'play' : 'build';
  return { next, working, waiting, empty };
}

function settleQuest(v, moves, color) {
  const q = v.quest;
  if (!q) return null;
  const b = v.built.find((x) => x.id === q.buildingId);
  const letter = q.piece === 'knight' ? 'n' : q.piece[0];
  if (!b || !moves.some((m) => m.color === color && m.captured === letter)) return { ...q, done: false };
  b.level = Math.min(LEVEL_MAX, (b.level || 0) + 1);
  const festival = b.tenant && v.built.some((x) => x.kind === 'stage' && x.ready && x.tenant) ? tenantAnimal(b.tenant) : null;
  v.festival = festival;
  return { ...q, done: true, festival };
}

/** Pay out one finished game. `result` is the player's: win, draw or loss. Losing never takes anything away. */
export function settleGame(v, { moves, color, result, rivalId = null, gameId = null, now = null }) {
  // A game is paid once, even if its end is reported again (a resumed game, a second listener).
  if (gameId !== null) {
    if ((v.settled || []).includes(gameId)) return null;
    v.settled = [...(v.settled || []), gameId].slice(-20);
  }
  const game = replayGame(moves);
  const coins = COINS[result] ?? 0;
  const mvp = pickMvp(game, color);
  v.coins += coins;
  v.games += 1;
  v.hearts[mvp] = (v.hearts[mvp] || 0) + MVP_HEARTS;
  const added = growVillage(v.map, game, moves, color);
  v.walk = { slot: mvp, route: routeOf(moves, mvp) };
  if (rivalId) v.rivals[rivalId] = { result, mvp, plies: game.plies };
  const last = moves[moves.length - 1];
  if (last?.san?.endsWith('#') && last.color === color) v.flags.push({ sq: last.to, game: v.games });
  v.festival = null;
  const quest = settleQuest(v, moves, color);
  const dew = dewReady(v, now);
  if (dew) {
    v.dewDay = dayKey(now);
    v.dewAt = now;
  }
  const harvested = harvest(v, mvp, added.trees.length, dew);
  const opened = v.built.filter((b) => !b.ready).map((b) => b.kind);
  for (const b of v.built) b.ready = true;
  v.quest = nextQuest(v);
  const shelfUp = growShelf(v);
  stockShelf(v);
  return { coins, mvp, hearts: MVP_HEARTS, added, harvest: harvested, opened, quest, dew, shelfUp };
}

const taken = (v, sq) => v.built.some((b) => b.sq === sq) || v.decor.some((d) => d.sq === sq);

export function buildBlocked(v, kind, sq) {
  const b = BUILDINGS[kind];
  if (!b) return 'unknown';
  if (v.built.some((x) => !x.ready)) return 'busy';
  if (v.built.some((x) => x.kind === kind)) return 'owned';
  if (v.coins < b.cost) return 'coins';
  if (sq && taken(v, sq)) return 'taken';
  return null;
}

export function startBuild(v, kind, sq) {
  if (!sq || buildBlocked(v, kind, sq)) return false;
  v.coins -= BUILDINGS[kind].cost;
  v.built.push({ id: v.nextId, kind, sq, tenant: null, level: 0, ready: false });
  v.nextId += 1;
  return true;
}

/** Why this card cannot live here, or null. A card never leaves the album: one copy is one resident. */
export function tenantBlocked(v, col, buildingId, card) {
  const b = v.built.find((x) => x.id === buildingId);
  if (!b) return 'unknown';
  if (tenantRarity(card) < BUILDINGS[b.kind].minRarity) return 'rarity';
  const used = v.built.filter((x) => x !== b && x.tenant === card).length;
  if (used >= (col.cards[card] || 0)) return 'busy';
  return null;
}

export function moveIn(v, col, buildingId, card) {
  if (tenantBlocked(v, col, buildingId, card)) return false;
  v.built.find((x) => x.id === buildingId).tenant = card;
  return true;
}

export function moveOut(v, buildingId) {
  const b = v.built.find((x) => x.id === buildingId);
  if (b) b.tenant = null;
  return Boolean(b);
}

/** Merging can spend a copy that was living somewhere: that resident goes home, nothing else changes. */
export function reconcileTenants(v, col) {
  const used = {};
  for (const b of v.built) {
    if (!b.tenant) continue;
    used[b.tenant] = (used[b.tenant] || 0) + 1;
    if (used[b.tenant] > (col.cards[b.tenant] || 0)) b.tenant = null;
  }
  return v;
}

export const islandDone = (v) => KIND_ORDER.every((k) => v.built.some((b) => b.kind === k && b.ready));

/** A finished island goes into the album. Residents, hearts and acorns carry over; the land starts again. */
export function startNewIsland(v) {
  if (!islandDone(v)) return false;
  const next = blank();
  v.island += 1;
  v.map = next.map;
  v.built = [];
  // Bought props travel to the new island in the stash; the old buildings left standing as decoration do not.
  for (const d of v.decor) if (PROPS[d.kind]) v.stash[d.kind] = (v.stash[d.kind] || 0) + 1;
  v.decor = [];
  v.flags = [];
  v.night = false;
  v.quest = null;
  v.festival = null;
  v.grain = 0;
  v.bread = 0;
  return true;
}

export const nightOpen = (v) => v.built.some((b) => b.kind === 'power' && b.ready && b.tenant);

function dayKey(now) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Overnight dew (garden-short G2): on a new day, the first finished game gives each working field a little more.
 * It never piles up over missed days and missing it takes nothing away. A clock set back earlier than the last dew
 * brings none, so a day can be had once. It only shows where it can land: a working field with room in the barn.
 */
export function dewReady(v, now) {
  if (!Number.isFinite(now) || now < (v.dewAt || 0) || v.dewDay === dayKey(now)) return false;
  return v.grain < GRAIN_MAX && v.built.some((b) => b.kind === 'field' && b.ready && b.tenant);
}

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 of the device's local date (harvest-hollow calendar.js dayIndex, read in the device's zone). */
export function dayIndex(now) {
  const d = new Date(now);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** The Monday-start week of a day index. 1970-01-01 was a Thursday. */
export const weekIndex = (day) => Math.floor((day + 3) / 7);

/** True when the island's week is behind the calendar. A clock set back never rolls it again. */
export function weekDue(v, now) {
  return Number.isFinite(now) && (v.week?.w ?? -1) < weekIndex(dayIndex(now));
}

/**
 * The calendar week (garden-short G3, reverse-engineering report 2nd ed.). A new week replaces last week's pick whole,
 * and only the current week is filled, however many were missed. The pick is keyed by a counter, never by the date,
 * so moving the clock can only bring the next pick sooner, not choose one. Returns the new pick, or null.
 */
export function rollWeek(v, pool, now, newSeed = () => Math.floor(Math.random() * 0x7ffffffe) + 1) {
  const list = (pool || []).filter((x) => x && typeof x.id === 'string');
  if (!list.length || !weekDue(v, now)) return null;
  if (!v.seed) v.seed = newSeed();
  const n = v.week?.n || 0;
  const pick = list[Math.floor(seededRoll(v.seed, 'week', n) * list.length)];
  v.week = { w: weekIndex(dayIndex(now)), n: n + 1, pick: pick.id };
  return pick;
}

/** This week's entry from the pack's weekly list, or null when there is none or the pack changed. */
export const weekPick = (v, pool) => (pool || []).find((x) => x && x.id === v.week?.pick) || null;

// The island shelf (garden-short G4, reverse-engineering report 2nd ed. G4 table). Three slots of island props.
// Each slot draws a tier by the shelf level's weights, then a prop of that tier evenly, and slots may repeat
// (SNKRX buy_screen.lua:351-355). The level grows by itself, one point every second game, needing 3, 4, 5, 6 points,
// up to 5 (arena.lua:979-991); acorns never buy points, rerolls or a lower level. Each slot keeps a stock count and an
// empty one refuses the sale (SS14 vending, Eject.cs:153-168). All three slots are drawn again when a game ends
// (set_cards clears them all), keyed by the island seed and a counter, so reopening between games shows the same shelf.
export const PROPS = {
  flowerbed: { ko: '꽃밭', icon: '🌷', tier: 1 },
  bench: { ko: '벤치', icon: '🪑', tier: 1 },
  signpost: { ko: '표지판', icon: '🪧', tier: 1 },
  lantern: { ko: '등불', icon: '🏮', tier: 2 },
  birdhouse: { ko: '새집', icon: '🐦', tier: 2 },
  fountain: { ko: '분수', icon: '⛲', tier: 3 },
  arch: { ko: '꽃 아치', icon: '🌸', tier: 3 },
  statue: { ko: '왕관 동상', icon: '👑', tier: 4 }
};
export const TIER_KO = ['', '흔함', '고급', '희귀', '전설'];
export const PROP_PRICE = [0, 15, 30, 60, 120];   // starting guesses
export const PROP_STOCK = [0, 3, 2, 1, 1];
export const SHELF_ODDS = [[70, 20, 10, 0], [50, 30, 15, 5], [25, 45, 20, 10], [10, 25, 45, 20], [5, 15, 30, 50]];
export const SHELF_XP = [3, 4, 5, 6];
export const SHELF_SLOTS = 3;
export const SHELF_LEVEL_MAX = SHELF_ODDS.length;

const ensureSeed = (v, newSeed) => {
  if (!v.seed) v.seed = newSeed();
  return v.seed;
};
const anySeed = () => Math.floor(Math.random() * 0x7ffffffe) + 1;

/** Index of the weight a roll in [0, 1) lands on; a zero weight is never picked. */
function weightedIndex(weights, roll) {
  let at = roll * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) {
    if (at < weights[i]) return i;
    at -= weights[i];
  }
  return weights.findLastIndex((w) => w > 0);
}

/** One point every second game, as SNKRX gives its shop one point every second round. */
export function growShelf(v) {
  const s = v.shelf;
  if (v.games % 2 !== 0 || s.lv >= SHELF_LEVEL_MAX) return false;
  s.xp += 1;
  if (s.xp < SHELF_XP[s.lv - 1]) return false;
  s.xp = 0;
  s.lv += 1;
  return true;
}

/** Draw all three slots for this game count, once. Returns true when it drew. */
export function stockShelf(v, newSeed = anySeed) {
  const s = v.shelf;
  if (s.g === v.games) return false;
  const seed = ensureSeed(v, newSeed);
  const odds = SHELF_ODDS[s.lv - 1];
  s.slots = [];
  for (let i = 0; i < SHELF_SLOTS; i++) {
    const tier = weightedIndex(odds, seededRoll(seed, `shelf:${s.n}:tier`, i)) + 1;
    const kinds = Object.keys(PROPS).filter((k) => PROPS[k].tier === tier);
    const kind = kinds[Math.floor(seededRoll(seed, `shelf:${s.n}:kind`, i) * kinds.length)];
    s.slots.push({ kind, stock: PROP_STOCK[tier] });
  }
  s.n += 1;
  s.g = v.games;
  return true;
}

/** Buy from a slot into the stash. Null when bought, else why not: 'gone', 'empty' or 'coins'. */
export function buyProp(v, i) {
  const slot = v.shelf.slots[i];
  if (!slot || !PROPS[slot.kind]) return 'gone';
  if (slot.stock <= 0) return 'empty';
  const price = PROP_PRICE[PROPS[slot.kind].tier];
  if (v.coins < price) return 'coins';
  v.coins -= price;
  slot.stock -= 1;
  v.stash[slot.kind] = (v.stash[slot.kind] || 0) + 1;
  return null;
}

/** Put a stashed prop on a free square. Null when placed, else 'none', 'bounds' or 'blocked'. */
export function placeProp(v, kind, sq) {
  if (!PROPS[kind] || !(v.stash[kind] > 0)) return 'none';
  if (!/^[a-h][1-8]$/.test(sq)) return 'bounds';
  if (taken(v, sq)) return 'blocked';
  v.decor.push({ kind, sq });
  v.stash[kind] -= 1;
  if (!v.stash[kind]) delete v.stash[kind];
  return null;
}

/** Take a placed prop back into the stash. Old buildings kept as decoration stay where they are. */
export function storeProp(v, sq) {
  const i = v.decor.findIndex((d) => d.sq === sq && PROPS[d.kind]);
  if (i < 0) return false;
  const [d] = v.decor.splice(i, 1);
  v.stash[d.kind] = (v.stash[d.kind] || 0) + 1;
  return true;
}

/** Pet a piece. After the daily cap it still reacts, it just stops adding hearts. */
export function pet(v, slot, now) {
  const day = dayKey(now);
  if (v.petDay !== day) {
    v.petDay = day;
    v.petCount = 0;
  }
  if (v.petCount >= PET_DAILY_CAP) return false;
  v.petCount += 1;
  v.hearts[slot] = (v.hearts[slot] || 0) + 1;
  return true;
}

/** Catch up with elapsed time. Only visitors use the clock, and absence only ever adds. Returns what happened. */
export function tickVillage(v, rivals, now) {
  const events = [];
  for (const r of rivals || []) {
    if (!r.visitsFor || !v.built.some((b) => b.kind === r.visitsFor && b.ready)) continue;
    const last = v.visits[r.id] || 0;
    if (now - last >= VISIT_GAP_MS) {
      v.visits[r.id] = now;
      v.coins += VISIT_GIFT;
      const memory = v.rivals[r.id] || null;
      v.gifts.push({ rival: r.id, at: now, memory });
      events.push({ type: 'visit', rival: r.id, memory, coins: VISIT_GIFT });
    }
  }
  v.gifts = v.gifts.slice(-10);
  return events;
}
