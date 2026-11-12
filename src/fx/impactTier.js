// How big a capture should feel. Shaking on every capture wears out by the third minute, so size follows the moment.
// Numbers are starting values to tune by eye (docs/plans/2026-10-30-animal-feel-plan.md §5). wordSize is a share of the screen's height.
export const IMPACT_TIERS = {
  small: { stopSec: 0.05, particles: 18, ring: 0.28, shake: 0, slowSec: 0, word: '뾱!', wordSize: 0.07 },
  medium: { stopSec: 0.07, particles: 36, ring: 0.42, shake: 0.012, slowSec: 0, word: '콩!', wordSize: 0.1 },
  big: { stopSec: 0.11, particles: 70, ring: 0.62, shake: 0.028, slowSec: 0.29, word: '쾅!', wordSize: 0.14 }
};

export const SLOW_FACTOR = 0.35;

/** Share of the way the camera leans toward a capture. Small ones leave it alone. */
export const CAMERA_LEAN = { small: 0, medium: 0.16, big: 0.3 };

/** Points per piece for the size of an upset (the king never counts as an underdog: the lion is the strongest animal). */
export const PIECE_POINTS = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };
/** How many points smaller the attacker has to be for a capture to count as an upset ("역전!"). */
export const UPSET_GAP = 3;
export const UPSET_WORD = '역전!';
const SAN_PIECE = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight' };

/** Which kind of piece made the move, read from its notation ("bxa1=Q" is a pawn). */
export function attackerFromSan(san = '') {
  return SAN_PIECE[san[0]] || (/^[a-h]/.test(san) ? 'pawn' : null);
}

/**
 * A small animal taking a much bigger one: pawn takes rook or queen; knight, bishop or rook takes queen
 * (docs/plans/2026-11-08-capture-matchup-plan.md CX-1). These are rare (about 5% of captures in bot games), so they get the big moment.
 */
export function isUpset(capturedType, san = '') {
  const a = PIECE_POINTS[attackerFromSan(san)];
  const v = PIECE_POINTS[capturedType];
  return a != null && v != null && v - a >= UPSET_GAP;
}

/** `san` is the move in chess notation: it ends in + for check and # for mate. */
export function impactTier(capturedType, san = '') {
  if (san.endsWith('#') || capturedType === 'queen' || isUpset(capturedType, san)) return 'big';
  if (san.endsWith('+') || capturedType !== 'pawn') return 'medium';
  return 'small';
}

/** Extra seconds one capture adds to a game, so the pace can be checked against the plan's 0.3 s limit. */
export function impactExtraSeconds(tier) {
  const t = IMPACT_TIERS[tier];
  return t.stopSec + t.slowSec * (1 - SLOW_FACTOR);
}

export const PIECE_SPARK = {
  pawn: [0xffe08a, 0xfff4cc],
  knight: [0xf0b878, 0xffe0b0],
  bishop: [0x8fe0c0, 0xffffff],
  rook: [0xb8c4e8, 0xe8ecff],
  queen: [0xff9fb8, 0xffd27a],
  king: [0xffd24a, 0xff8a5a]
};
