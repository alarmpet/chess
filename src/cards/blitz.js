// The lightning board ⚡ (dynamic-chess plan DY-3, 2026-11-06). An opt-in mode: on the player's turn an hourglass of
// 30 seconds stands by the board, and a move inside 10 seconds earns an acorn on the spot, at most 10 a game.
// When the sand runs out nothing happens — no move is made for the player, no loss, no card difference, no streak
// multiplier, no flashing (desire plan §7, the dark-pattern line). Acorns only: they buy island looks, not chess
// strength, so "fast is better" is never what the game says. The AI thinks as it always does. Pure: no DOM.
export const BLITZ_SAND_MS = 30000;
export const BLITZ_FAST_MS = 10000;
export const BLITZ_CAP = 10;

export const newBlitz = () => ({ acorns: 0, fast: 0, moves: 0 });

/** One player move after `thinkMs` of thinking. Returns { state, earned } (earned is 0 or 1). */
export function blitzStep(state, thinkMs) {
  const fast = Number.isFinite(thinkMs) && thinkMs >= 0 && thinkMs <= BLITZ_FAST_MS;
  const earned = fast && state.acorns < BLITZ_CAP ? 1 : 0;
  return { state: { acorns: state.acorns + earned, fast: state.fast + (fast ? 1 : 0), moves: state.moves + 1 }, earned };
}

/** What the hourglass shows after `ms` of the player's turn: sand left (0..1) and whether a move now still pays. */
export function sandAt(ms) {
  const left = Math.max(0, 1 - ms / BLITZ_SAND_MS);
  return { left, pays: ms <= BLITZ_FAST_MS, done: ms >= BLITZ_SAND_MS };
}
