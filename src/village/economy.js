// Village game rules (docs/plans/2026-10-30-crown-village-plan.md). Pure: time is passed in, nothing touches the DOM.
// Every number here is a prototype guess, not a measured balance.
import { replayGame, growVillage, emptyVillage } from './roster.js';

export const VILLAGE_KEY = 'wildcrown.village.v1';
export const COINS = { win: 30, draw: 20, loss: 15 };
export const PET_DAILY_CAP = 10;            // Pokémon GO buddy: a daily heart cap ends the session kindly
export const MVP_HEARTS = 5;
export const HEART_STAGES = [[60, 'starlit'], [30, 'adult'], [10, 'grown'], [0, 'baby']];
export const VISIT_GAP_MS = 4 * 3600 * 1000;
export const VISIT_GIFT = 10;
const MIN = 60 * 1000;

// One builder (Clash of Clans' builder limit, reduced to one so there is nothing to juggle).
export const BUILDINGS = {
  bench: { ko: '벤치', en: 'Bench', cost: 20, ms: 1 * MIN, icon: '🪑' },
  stage: { ko: '작은 무대', en: 'Little stage', cost: 40, ms: 10 * MIN, icon: '🎵' },
  house: { ko: '말의 집', en: 'Piece house', cost: 60, ms: 30 * MIN, icon: '🏠' },
  fountain: { ko: '분수', en: 'Fountain', cost: 120, ms: 120 * MIN, icon: '⛲' }
};

export function newVillage() {
  return {
    v: 1,
    coins: 30,
    map: emptyVillage(),
    hearts: {},
    names: {},
    built: [{ kind: 'house', sq: 'd4' }],
    build: null,
    walk: null,
    petDay: '',
    petCount: 0,
    rivals: {},
    visits: {},
    gifts: [],
    lastSeen: 0,
    games: 0
  };
}

export function sanitizeVillage(raw) {
  const base = newVillage();
  if (!raw || typeof raw !== 'object' || raw.v !== 1) return base;
  return { ...base, ...raw, map: { ...base.map, ...raw.map } };
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

/** Pay out one finished game. `result` is the player's: win, draw or loss. Losing never takes anything away. */
export function settleGame(v, { moves, color, result, rivalId = null }) {
  const game = replayGame(moves);
  const coins = COINS[result] ?? 0;
  const mvp = pickMvp(game, color);
  v.coins += coins;
  v.games += 1;
  v.hearts[mvp] = (v.hearts[mvp] || 0) + MVP_HEARTS;
  const added = growVillage(v.map, game, moves, color);
  v.walk = { slot: mvp, route: routeOf(moves, mvp) };
  if (rivalId) v.rivals[rivalId] = { result, mvp, plies: game.plies };
  return { coins, mvp, hearts: MVP_HEARTS, added };
}

export function buildBlocked(v, kind, sq) {
  const b = BUILDINGS[kind];
  if (!b) return 'unknown';
  if (v.build) return 'busy';
  if (v.coins < b.cost) return 'coins';
  if (v.built.some((x) => x.sq === sq)) return 'taken';
  return null;
}

export function startBuild(v, kind, sq, now) {
  if (buildBlocked(v, kind, sq)) return false;
  v.coins -= BUILDINGS[kind].cost;
  v.build = { kind, sq, done: now + BUILDINGS[kind].ms };
  return true;
}

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

/** Catch up with elapsed time. Absence only ever adds: finished buildings and visitor gifts. Returns what happened. */
export function tickVillage(v, rivals, now) {
  const events = [];
  if (v.build && v.build.done <= now) {
    v.built.push({ kind: v.build.kind, sq: v.build.sq });
    events.push({ type: 'built', kind: v.build.kind });
    v.build = null;
  }
  for (const r of rivals || []) {
    if (!r.visitsFor || !v.built.some((b) => b.kind === r.visitsFor)) continue;
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
