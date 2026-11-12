// Comeback goals 🔥 (objective-layer plan ③, OL-6, 2026-11-06). When the player is well behind on material, a small
// goal appears for them alone — give a check, take a piece back, walk a meerkat to the sixth rank — worth acorns.
// From the plan's sources: r/gamedesign "the time after you can no longer win is wasted" and "a blue shell is given,
// a Dota bounty is earned when behind" — so the goal has to be done, and the AI and the result stay as they are.
// Pokémon UNITE hid the score so players behind would not quit: the strip never says how far behind.
// LoL turns a losing team's shutdowns down while objective bounties are on (plan N5): the strip shows 🔥 or 💰,
// not both. Pure: no DOM.
import { Chess } from 'chess.js';

export const RALLY_GAP = -5;        // material (meerkat 1, kangaroo/panda 3, rhino 5, tiger 9) behind before a goal shows
export const RALLY_MAX = 3;         // goals per game
export const RALLY_ACORNS = 5;
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Material of `color` minus the other side's, read from a FEN. */
export function materialGap(fen, color) {
  let gap = 0;
  for (const row of new Chess(fen).board()) {
    for (const sq of row) if (sq) gap += (sq.color === color ? 1 : -1) * VALUE[sq.type];
  }
  return gap;
}

const sixth = (color) => (color === 'w' ? '6' : '3');
// Order: the first goal is the one most players reach. Unchased by an easy bot behind a normal one (tools/rally_sim.mjs,
// 120 games, 2026-11-06) a take-back was done 90% of the time, a check 35%, the meerkat walk 29%; check came first then.
export const RALLY_GOALS = [
  { id: 'retake', ko: '말 하나 되찾기', en: 'Take a piece back', hit: (m) => Boolean(m.captured) },
  { id: 'check', ko: '체크 한 번', en: 'Give a check', hit: (m) => /[+#]$/.test(m.san || '') },
  { id: 'pawn_far', ko: '미어캣 하나 6줄까지', en: 'A meerkat to the sixth rank', hit: (m) => m.piece === 'p' && m.to[1] === sixth(m.color),
    // Only offered while a meerkat still has that walk ahead of it.
    can: (fen, color) => new Chess(fen).board().some((row, r) => row.some((sq) => sq && sq.type === 'p' && sq.color === color &&
      (color === 'w' ? 8 - r < 6 : 8 - r > 3))) }
];
export const rallyGoalById = (id) => RALLY_GOALS.find((g) => g.id === id) || null;

// `behind` counts the player's turns in a row spent well behind. A goal waits for the second, so the middle of an
// exchange (a rook taken, about to be taken back) does not hand out a goal the next move pays for: in equal bot games
// with no wait, the median goal was done one move after it showed (tools/rally_sim.mjs, 2026-11-06).
export const RALLY_WAIT = 2;
export const newRally = () => ({ active: null, offered: 0, done: 0, behind: 0 });

/**
 * One landed move. `color` is the player's side. Returns { state, offered, done }: `done` is the goal the player's
 * move just finished, `offered` the goal that just appeared (on the player's turn, after the other side moved).
 */
export function rallyStep(state, move, color) {
  let s = state;
  let done = null;
  let offered = null;
  if (move.color === color) {
    const g = s.active && rallyGoalById(s.active);
    if (g && g.hit(move)) { done = g; s = { ...s, active: null, done: s.done + 1 }; }
    return { state: s, offered, done };
  }
  s = { ...s, behind: materialGap(move.after, color) <= RALLY_GAP ? (s.behind || 0) + 1 : 0 };
  if (!s.active && s.offered < RALLY_MAX && s.behind >= RALLY_WAIT) {
    for (let i = 0; i < RALLY_GOALS.length; i++) {
      const g = RALLY_GOALS[(s.offered + i) % RALLY_GOALS.length];
      if (g.can && !g.can(move.after, color)) continue;
      offered = g;
      s = { ...s, active: g.id, offered: s.offered + 1 };
      break;
    }
  }
  return { state: s, offered, done };
}
