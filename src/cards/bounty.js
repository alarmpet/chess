// Bounty pieces (objective-layer plan OL-1, 2026-11-06). The shape is Brawl Stars' Bounty mode: every takedown raises
// the taker's bounty, and whoever takes that piece cashes it in. Here a piece that has made BOUNTY_FROM captures this
// game wears a 💰; capturing it pays acorns to the player's side only. Board result, rules and AI stay as they are —
// the AI does not know about bounties. Each step reads one chess.js verbose move.
export const BOUNTY_FROM = 2;
export const BOUNTY_MAX = 5;
/** Acorns for taking a piece with `captures` captures: 4 for two, 2 more for each after, capped at 10. */
export const bountyAcorns = (captures) => (captures < BOUNTY_FROM ? 0 : Math.min(10, 2 * Math.min(captures, BOUNTY_MAX)));

/** Captures made so far by the piece standing on each square. */
export const newBounty = () => ({ on: {} });

const CASTLE_ROOK = { g1: ['h1', 'f1'], c1: ['a1', 'd1'], g8: ['h8', 'f8'], c8: ['a8', 'd8'] };

/**
 * Moves the counts along with one move. Returns what happened: `claimed` when a piece with a bounty was taken
 * ({ by, captures, acorns, sq }), and `marked` when the mover just reached a bounty ({ sq, captures }).
 */
export function bountyStep(state, m) {
  const on = state.on;
  let claimed = null;
  if (m.captured) {
    // En passant takes the pawn beside the target square, not on it.
    const victimSq = m.flags?.includes('e') ? m.to[0] + m.from[1] : m.to;
    const n = on[victimSq] || 0;
    if (n >= BOUNTY_FROM) claimed = { by: m.color, captures: n, acorns: bountyAcorns(n), sq: victimSq };
    delete on[victimSq];
  }
  const mine = (on[m.from] || 0) + (m.captured ? 1 : 0);
  delete on[m.from];
  if (mine) on[m.to] = mine;
  if (/[kq]/.test(m.flags || '')) {
    const [from, to] = CASTLE_ROOK[m.to] || [];
    if (from && on[from]) { on[to] = on[from]; delete on[from]; }
  }
  const marked = m.captured && mine === BOUNTY_FROM ? { sq: m.to, captures: mine } : null;
  return { claimed, marked };
}

/** Squares wearing a bounty now, for the board marks. */
export const bountyMarks = (state) => Object.entries(state.on).filter(([, n]) => n >= BOUNTY_FROM).map(([sq, n]) => ({ sq, captures: n }));

/** A whole game's bounties: what each colour cashed in. */
export function bountyOver(moves) {
  const s = newBounty();
  const won = { w: 0, b: 0, claims: [] };
  for (const m of moves || []) {
    const { claimed } = bountyStep(s, m);
    if (claimed) { won[claimed.by] += claimed.acorns; won.claims.push(claimed); }
  }
  return won;
}
