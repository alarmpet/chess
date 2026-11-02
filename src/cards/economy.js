// Capture cards: the rules of drops, guarantees and merging. No DOM and no chess in here, so the odds can be tested alone.
// Every number is a starting value (docs/plans/2026-10-31-capture-card-plan.md).
export const CARDS_KEY = 'wildcrown.cards.v1';
export const POUCH_KEY = 'wildcrown.pouch.v1';
export const SETTLED_MAX = 20;      // finished games remembered, so a repeated end event never pays twice

export const RARITIES = ['common', 'uncommon', 'rare', 'hero'];
export const COMMON = 0;
export const RARE = 2;
export const HERO = 3;
export const RARE_GUARANTEE = 10;
export const HERO_GUARANTEE = 60;
export const MERGE_COST = 3;
export const UNLOCK_GAMES = 5;      // the first games show only capturing and merging
export const SHELF_BASE = 3;
export const SHELF_MAX = 6;
export const DUST_RARE = 5;
export const DUST_HERO = 20;
export const RARE_KEEP = 3;         // rare spares kept for a future use before they turn to stardust

export const ANIMAL_OF = { pawn: 'meerkat', knight: 'kangaroo', bishop: 'panda', rook: 'rhino', queen: 'tiger', king: 'lion' };
export const ANIMALS = ['meerkat', 'kangaroo', 'panda', 'rhino', 'tiger', 'lion'];

// Percent chance of common, uncommon, rare, hero. The king cannot be captured, so checkmate pays the lion card.
export const DROP_TABLE = {
  pawn: [90, 9, 0.9, 0.1],
  knight: [50, 40, 9.5, 0.5],
  bishop: [50, 40, 9.5, 0.5],
  rook: [40, 40, 18, 2],
  queen: [20, 40, 35, 5],
  king: [0, 50, 40, 10]
};

export const cardId = (animal, rarity) => `${animal}_${rarity}`;

export function newCollection() {
  return { v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: false, games: 0, dust: 0, shelf: [], shelfSlots: SHELF_BASE, settled: [] };
}

export function sanitizeCollection(raw) {
  const base = newCollection();
  if (!raw || raw.v !== 1 || typeof raw.cards !== 'object' || raw.cards === null) return base;
  for (const animal of ANIMALS) {
    for (let r = 0; r < RARITIES.length; r++) {
      const n = raw.cards[cardId(animal, r)];
      if (Number.isInteger(n) && n > 0) base.cards[cardId(animal, r)] = n;
    }
  }
  base.sinceRare = Math.max(0, Number(raw.sinceRare) || 0);
  base.sinceHero = Math.max(0, Number(raw.sinceHero) || 0);
  base.firstDone = raw.firstDone === true;
  base.games = Math.max(0, Math.floor(Number(raw.games)) || 0);
  base.dust = Math.max(0, Math.floor(Number(raw.dust)) || 0);
  base.shelfSlots = Math.min(SHELF_MAX, Math.max(SHELF_BASE, Math.floor(Number(raw.shelfSlots)) || SHELF_BASE));
  base.shelf = (Array.isArray(raw.shelf) ? raw.shelf : []).filter((id) => base.cards[id]).slice(0, base.shelfSlots);
  base.settled = (Array.isArray(raw.settled) ? raw.settled : []).filter(Number.isInteger).slice(-SETTLED_MAX);
  return base;
}

/** The same game, kind and move always give the same roll, so card rolls never disturb the AI's random numbers. */
export function seededRoll(seed, kind, ply) {
  let h = 2166136261 ^ (seed >>> 0);
  for (const ch of `${kind}:${ply}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h = Math.imul(h ^ (h >>> 15), h | 1);
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

export function rarityFromRoll(type, roll) {
  const table = DROP_TABLE[type] || DROP_TABLE.pawn;
  let at = roll * 100;
  for (let r = 0; r < table.length; r++) {
    at -= table[r];
    if (at < 0) return r;
  }
  return COMMON;
}

function missingHeroAnimal(col, animal, roll) {
  if (!col.cards[cardId(animal, HERO)]) return animal;
  const missing = ANIMALS.filter((a) => !col.cards[cardId(a, HERO)]);
  return missing.length ? missing[Math.floor(roll * missing.length)] : animal;
}

/**
 * Applies one drop to the collection and says what happened. `roll` picks the rarity.
 * `floor` is the lowest rarity allowed; `boost` raises this card one step, but never into a hero.
 */
export function awardCard(col, type, roll, { floor = COMMON, boost = false } = {}) {
  let animal = ANIMAL_OF[type] || 'meerkat';
  let rarity = rarityFromRoll(type, roll);
  if (boost && rarity < RARE) rarity += 1;
  rarity = Math.max(rarity, floor);
  if (!col.firstDone) rarity = Math.max(rarity, RARE);
  if (col.sinceRare + 1 >= RARE_GUARANTEE) rarity = Math.max(rarity, RARE);
  const heroDue = col.sinceHero + 1 >= HERO_GUARANTEE;
  if (heroDue) {
    rarity = HERO;
    animal = missingHeroAnimal(col, animal, roll);
  }

  const card = { id: cardId(animal, rarity), animal, rarity, fresh: !col.cards[cardId(animal, rarity)] };
  addCard(col, card);
  return card;
}

/** Puts one card in the collection and moves the guarantees on, the same way for a drop and for a confirmed pouch. */
function addCard(col, card) {
  col.cards[card.id] = (col.cards[card.id] || 0) + 1;
  if (!card.comfort) col.firstDone = true;
  col.sinceRare = card.rarity >= RARE ? 0 : col.sinceRare + 1;
  col.sinceHero = card.rarity === HERO ? 0 : col.sinceHero + 1;
  if (card.rarity === HERO) col.sinceRare = 0;
}

/** A game with no card at all still pays one common card: beginners lose often and should not leave empty-handed. */
export function consolationCard(col, roll) {
  const animal = ANIMALS[Math.floor(roll * ANIMALS.length)];
  const card = { id: cardId(animal, COMMON), animal, rarity: COMMON, fresh: !col.cards[cardId(animal, COMMON)], comfort: true };
  addCard(col, card);
  return card;
}

// ---- This game's pouch (docs/plans/2026-11-02-island-economy-plan.md §2) ----------------------------------
// Cards caught during a game wait here and join the collection only when the game ends. A game left unfinished
// loses its pouch, but a reload resumes the game, so only quitting on purpose costs anything.

export function newPouch(gameId) {
  return { v: 1, gameId: gameId >>> 0, cards: [] };
}

export function sanitizePouch(raw) {
  if (!raw || raw.v !== 1 || !Array.isArray(raw.cards)) return null;
  const cards = raw.cards.filter((c) => c && typeof c.id === 'string' && ANIMALS.includes(c.animal) && Number.isInteger(c.rarity) && c.rarity >= 0 && c.rarity < RARITIES.length && c.id === cardId(c.animal, c.rarity));
  return { v: 1, gameId: Number(raw.gameId) >>> 0, cards };
}

/** The collection as it will be once the pouch is confirmed. Drops during the game roll against this, so guarantees still count up inside one game. */
export function withPouch(col, pouch) {
  const out = sanitizeCollection(JSON.parse(JSON.stringify(col)));
  for (const card of pouch?.cards || []) addCard(out, card);
  return out;
}

/** Confirms a finished game's pouch. Returns false, changing nothing, if this game was already settled. */
export function commitPouch(col, pouch) {
  if (col.settled.includes(pouch.gameId)) return false;
  for (const card of pouch.cards) addCard(col, card);
  col.settled = [...col.settled, pouch.gameId].slice(-SETTLED_MAX);
  return true;
}

/** Spare copies beyond the one that fills the album slot. */
export const sparesOf = (col, animal, rarity) => Math.max(0, (col.cards[cardId(animal, rarity)] || 0) - 1);

export function canMerge(col, animal, rarity) {
  return rarity < RARE && sparesOf(col, animal, rarity) >= MERGE_COST;
}

export function mergeList(col) {
  const out = [];
  for (const animal of ANIMALS) {
    for (let r = 0; r < RARE; r++) {
      if (canMerge(col, animal, r)) out.push({ animal, rarity: r });
    }
  }
  return out;
}

/** Three spares become one card of the next rarity. It always works, and the album copy is never spent. */
export function mergeCard(col, animal, rarity) {
  if (!canMerge(col, animal, rarity)) return null;
  col.cards[cardId(animal, rarity)] -= MERGE_COST;
  const id = cardId(animal, rarity + 1);
  const fresh = !col.cards[id];
  col.cards[id] = (col.cards[id] || 0) + 1;
  return { id, animal, rarity: rarity + 1, fresh };
}

export function albumProgress(col) {
  const owned = ANIMALS.reduce((n, a) => n + RARITIES.filter((_, r) => col.cards[cardId(a, r)]).length, 0);
  return { owned, total: ANIMALS.length * RARITIES.length };
}

/** Extra rares and repeat heroes cannot merge, so they turn into stardust instead of piling up. Nothing is asked of the player. */
export function convertOverflow(col) {
  let gained = 0;
  for (const animal of ANIMALS) {
    const rare = cardId(animal, RARE);
    const extra = sparesOf(col, animal, RARE) - RARE_KEEP;
    if (extra > 0) {
      col.cards[rare] -= extra;
      gained += extra * DUST_RARE;
    }
    const hero = cardId(animal, HERO);
    const repeats = sparesOf(col, animal, HERO);
    if (repeats > 0) {
      col.cards[hero] -= repeats;
      gained += repeats * DUST_HERO;
    }
  }
  col.dust += gained;
  return gained;
}

export function toggleShelf(col, id) {
  if (!col.cards[id]) return false;
  const at = col.shelf.indexOf(id);
  if (at >= 0) {
    col.shelf.splice(at, 1);
    return true;
  }
  if (col.shelf.length >= col.shelfSlots) return false;
  col.shelf.push(id);
  return true;
}

export const shelfPrice = (col) => (col.shelfSlots >= SHELF_MAX ? null : 40 * 2 ** (col.shelfSlots - SHELF_BASE));

export function buyShelfSlot(col) {
  const price = shelfPrice(col);
  if (price === null || col.dust < price) return false;
  col.dust -= price;
  col.shelfSlots += 1;
  return true;
}
