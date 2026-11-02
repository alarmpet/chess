// Village game rules (docs/plans/2026-10-31-crown-island-plan.md). Pure: time is passed in, nothing touches the DOM.
// Every number here is a prototype guess, not a measured balance.
import { replayGame, growVillage, emptyVillage } from './roster.js';

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
  games: 0
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
function harvest(v, mvp, trees) {
  const got = { grain: 0, bread: 0, coins: 0, hearts: 0, sold: 0 };
  const working = (kind) => v.built.filter((b) => b.kind === kind && b.ready && b.tenant);
  const lit = working('power').length;
  const output = (b) => (b.level || 0) + influenceBonus(v, b) + lit;
  const milled = working('mill').length > 0;
  for (const b of working('field')) got.grain += add(v, 'grain', 2 + output(b), GRAIN_MAX);
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
export function settleGame(v, { moves, color, result, rivalId = null, gameId = null }) {
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
  const harvested = harvest(v, mvp, added.trees.length);
  const opened = v.built.filter((b) => !b.ready).map((b) => b.kind);
  for (const b of v.built) b.ready = true;
  v.quest = nextQuest(v);
  return { coins, mvp, hearts: MVP_HEARTS, added, harvest: harvested, opened, quest };
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
