// Footprint village (docs/plans/2026-10-30-footprint-village-plan.md): who did what in a finished game.
// A piece's identity is its start square ("w_e2"). The engine makes a new object on promotion, so identity is rebuilt
// from the move list, never from meshes. Pure functions: no DOM, no three, no storage.

const FILES = 'abcdefgh';

/** All 32 slots in the start position, keyed by square. */
export function startSlots() {
  const at = {};
  for (const f of FILES) {
    for (const [rank, color] of [[1, 'w'], [2, 'w'], [7, 'b'], [8, 'b']]) at[`${f}${rank}`] = `${color}_${f}${rank}`;
  }
  return at;
}

/** Advance the square→slot map by one verbose chess.js move. Returns who moved and who fell, and where. */
export function stepRoster(at, m) {
  const slot = at[m.from];
  if (!slot) throw new Error(`no piece tracked on ${m.from}`);
  let fallen = null;
  let fallSquare = null;
  if (m.captured) {
    fallSquare = m.flags.includes('e') ? `${m.to[0]}${m.from[1]}` : m.to;
    fallen = at[fallSquare];
    if (!fallen) throw new Error(`no captured piece tracked on ${fallSquare}`);
    delete at[fallSquare];
  }
  delete at[m.from];
  at[m.to] = slot;
  let rook = null;
  if (m.flags.includes('k') || m.flags.includes('q')) {
    const rank = m.from[1];
    const [rookFrom, rookTo] = m.flags.includes('k') ? [`h${rank}`, `f${rank}`] : [`a${rank}`, `d${rank}`];
    rook = at[rookFrom];
    if (!rook) throw new Error(`no rook tracked on ${rookFrom}`);
    delete at[rookFrom];
    at[rookTo] = rook;
  }
  return { slot, fallen, fallSquare, rook };
}

/** Summarise one game: per-slot events and per-square marks, for both sides. */
export function replayGame(moves) {
  const at = startSlots();
  const slots = {};
  const squares = {};
  const slotOf = (id) => (slots[id] ||= { moves: 0, captures: 0, fellOn: null, fellAt: null, promotedTo: null, castled: false, mated: false });
  const squareOf = (sq) => (squares[sq] ||= { w: 0, b: 0, falls: [] });
  moves.forEach((m, ply) => {
    const { slot, fallen, fallSquare, rook } = stepRoster(at, m);
    const s = slotOf(slot);
    s.moves += 1;
    squareOf(m.to)[m.color] += 1;
    if (fallen) {
      s.captures += 1;
      const f = slotOf(fallen);
      f.fellOn = fallSquare;
      f.fellAt = ply;
      squareOf(fallSquare).falls.push(fallen);
    }
    if (m.promotion) s.promotedTo = m.promotion;
    if (rook) {
      s.castled = true;
      slotOf(rook).castled = true;
    }
    if (m.san?.endsWith('#')) s.mated = true;
  });
  return { plies: moves.length, slots, squares, survivors: Object.values(at) };
}

// ---- Village growth ------------------------------------------------------------------------------------------
export const TILE_MAX = 3;                  // dirt → path → paved → flowers
const TILE_STEPS = [1, 3, 6];               // footsteps a tile needs for each level

export function emptyVillage() {
  return { steps: {}, trees: [], gates: [], houses: [], games: 0 };
}

function tileLevel(steps) {
  return TILE_STEPS.filter((n) => steps >= n).length;
}

/** Tile level per square, 0..TILE_MAX. */
export function villageTiles(village) {
  const out = {};
  for (const [sq, n] of Object.entries(village.steps)) out[sq] = tileLevel(n);
  return out;
}

function neighbours(sq) {
  const f = FILES.indexOf(sq[0]);
  const r = Number(sq[1]);
  const out = [];
  for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const nf = f + df;
    const nr = r + dr;
    if (nf >= 0 && nf < 8 && nr >= 1 && nr <= 8) out.push(`${FILES[nf]}${nr}`);
  }
  return out;
}

// A full tile passes the step on to its emptiest neighbour, so busy centre squares feed the empty edge of the map.
function addStep(village, sq) {
  const seen = new Set();
  let at = sq;
  while (tileLevel(village.steps[at] || 0) >= TILE_MAX && !seen.has(at)) {
    seen.add(at);
    at = neighbours(at).filter((n) => !seen.has(n)).sort((a, b) => (village.steps[a] || 0) - (village.steps[b] || 0) || (a < b ? -1 : 1))[0] || at;
  }
  village.steps[at] = (village.steps[at] || 0) + 1;
}

/** Add one finished game to the village of `color`. Wins and losses count the same. Returns the new marks. */
export function growVillage(village, game, moves, color) {
  const added = { trees: [], gates: 0, houses: [] };
  for (const m of moves) if (m.color === color) addStep(village, m.to);
  for (const [sq, mark] of Object.entries(game.squares)) {
    for (const slot of mark.falls) {
      if (slot.startsWith(`${color}_`)) {
        village.trees.push({ sq, slot, game: village.games });
        added.trees.push({ sq, slot });
      }
    }
  }
  for (const [slot, s] of Object.entries(game.slots)) {
    if (!slot.startsWith(`${color}_`)) continue;
    if (s.promotedTo) {
      village.houses.push({ slot, game: village.games });
      added.houses.push(slot);
    }
    if (s.castled && slot.includes('_e') && !village.gates.includes(slot)) {
      village.gates.push(slot);
      added.gates += 1;
    }
  }
  village.games += 1;
  return added;
}
