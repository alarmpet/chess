// How big a capture should feel. Shaking on every capture wears out by the third minute, so size follows the moment.
// Numbers are starting values to tune by eye (docs/plans/2026-10-30-animal-feel-plan.md §5).
export const IMPACT_TIERS = {
  small: { stopSec: 0.05, particles: 18, ring: 0.28, shake: 0, slowSec: 0, word: '뾱!', wordSize: 0.1 },
  medium: { stopSec: 0.07, particles: 36, ring: 0.42, shake: 0.012, slowSec: 0, word: '콩!', wordSize: 0.14 },
  big: { stopSec: 0.11, particles: 70, ring: 0.62, shake: 0.028, slowSec: 0.29, word: '쾅!', wordSize: 0.19 }
};

export const SLOW_FACTOR = 0.35;

/** `san` is the move in chess notation: it ends in + for check and # for mate. */
export function impactTier(capturedType, san = '') {
  if (san.endsWith('#') || capturedType === 'queen') return 'big';
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
