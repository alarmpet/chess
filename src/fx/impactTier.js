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

// ── 사건 꾸러미 (그래픽 계획 GX-1, 2026-11-15) ─────────────────────────────────────────────
// 사건 하나가 내는 것들을 한 줄에 적는다: 별 뭉치 · 바닥 고리 · 낱말 · 화면 번쩍임 · 겹친 불빛.
// 엔진은 이 표를 읽어 낸다(playEvent). 소리는 사건마다 고르는 조건이 달라 엔진에 남겼다.
export const EVENT_FX = {
  castle: { burst: ['king', 'small'], ring: null, word: '짝!', wordSize: 0.09, flash: null, glow: null },
  promote: { burst: ['queen', 'big'], ring: 'big', word: '승급!', wordSize: 0.11, flash: { tone: 'side', alpha: 0.26, ms: 320 }, glow: 'big' },
  mate: { burst: ['king', 'big'], ring: 'big', word: '메이트!', wordSize: 0.14, flash: { tone: 'side', alpha: 0.42, ms: 520 }, glow: 'big' },
  check: { burst: null, ring: null, word: '체크!', wordSize: 0.09, flash: { tone: 'orange', alpha: 0.2, ms: 260 }, glow: null }
};

/** 화면 가장자리 번쩍임의 색(r, g, b). 내가 잘되면 금빛, 내가 당하면 붉은빛, 체크는 주황. */
export const FLASH_TONES = { gold: '255, 200, 70', red: '255, 86, 86', orange: '255, 150, 50' };
/** 잡기의 화면 번쩍임: 작은 잡기는 없다(한 판에 여러 번 나온다). */
export const CAPTURE_FLASH = { small: null, medium: { alpha: 0.16, ms: 200 }, big: { alpha: 0.3, ms: 320 } };

/**
 * 이 사건의 화면 번쩍임. `mine` 은 내게 좋은 일인가(true) · 나쁜 일인가(false) · 편이 없는가(null — 구경·둘이 두기).
 * 번쩍임이 없는 사건은 null.
 */
export function screenFlash(kind, { tierId = 'small', mine = null } = {}) {
  const side = mine === false ? 'red' : 'gold';
  if (kind === 'capture') {
    const f = CAPTURE_FLASH[tierId];
    return f ? { tone: side, rgb: FLASH_TONES[side], alpha: f.alpha, ms: f.ms } : null;
  }
  const f = EVENT_FX[kind]?.flash;
  if (!f) return null;
  const tone = f.tone === 'side' ? side : f.tone;
  return { tone, rgb: FLASH_TONES[tone], alpha: f.alpha, ms: f.ms };
}

/** 겹친 타격 불빛(GX-3)의 크기: 배율 · 불똥 수. 작은 잡기는 심과 별만 작게. */
export const GLOW_TIERS = { small: { scale: 0.6, sparks: 0 }, medium: { scale: 1, sparks: 8 }, big: { scale: 1.5, sparks: 16 } };
/** 때린 쪽 왕국의 빛(백: 금빛, 흑: 보랏빛) — 캐릭터 룩의 윤곽 색과 같은 계열. */
export const GLOW_COLOR = { w: 0xffc24a, b: 0xb98cff };
