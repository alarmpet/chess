// How each animal crosses the board, by whole-body motion alone: no new clips, so nothing needs re-rigging.
// moveStyle() is the pose at u (0 to 1 along the move). The pose is neutral at both ends, so a piece always lands
// exactly on its square, upright, whatever happened on the way. Move times do not change; only the shape does.
// Numbers are starting values to tune by eye (docs/plans/2026-10-30-animal-feel-plan.md §3).

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => x * x * (3 - 2 * x);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const pose = (fields) => ({ lift: 0, forward: 0, pitch: 0, roll: 0, yaw: 0, stretch: 1, ...fields });

/** Roughly the middle of a chibi body above its feet; a roll turns around this point, not around the feet. */
export const ROLL_PIVOT = 0.2;

const STYLES = {
  // Pitter-patter hops; the two-square opening push is two clear bounces.
  pawn(u, squares) {
    const double = squares >= 1.9;
    const hops = double ? 2 : 3;
    const lift = Math.abs(Math.sin(Math.PI * hops * u)) * (double ? 0.06 : 0.022);
    return pose({ progress: easeInOutCubic(u), lift, roll: Math.sin(Math.PI * hops * u) * 0.1, stretch: 1 + lift * 0.9 });
  },
  // One big bound: leans back going up, forward coming down.
  knight(u) {
    const arc = Math.sin(Math.PI * u);
    return pose({ progress: 0.5 * u + 0.5 * smooth(u), lift: arc * 0.13, pitch: -0.24 * Math.sin(2 * Math.PI * u), stretch: 1 + 0.16 * arc });
  },
  // Tumbles head over heels around the belly; long slides get a second turn.
  bishop(u, squares) {
    const angle = Math.PI * 2 * (squares >= 3 ? 2 : 1) * smooth(u);
    return pose({
      progress: smooth(u),
      pitch: angle,
      lift: ROLL_PIVOT * (1 - Math.cos(angle)),
      forward: -ROLL_PIVOT * Math.sin(angle)
    });
  },
  // Head down, picks up speed, then skids to a stop leaning back.
  rook(u) {
    const charging = u < 0.72;
    const release = smooth(clamp01((u - 0.72) / 0.28));
    const down = smooth(clamp01(u / 0.15));
    return pose({
      progress: charging ? 0.9 * (u / 0.72) ** 2 : 0.9 + 0.1 * easeOutCubic((u - 0.72) / 0.28),
      pitch: 0.26 * down * (1 - release) - 0.1 * Math.sin(Math.PI * release),
      lift: Math.abs(Math.sin(Math.PI * 4 * u)) * 0.012 * (1 - release)
    });
  },
  // Slinks low, then a short light pounce onto the square.
  queen(u) {
    const t = clamp01((u - 0.68) / 0.32);
    const arc = Math.sin(Math.PI * t);
    const crouch = smooth(clamp01(u / 0.2)) * (1 - smooth(clamp01(t / 0.3)));
    return pose({
      progress: u < 0.68 ? 0.5 * (u / 0.68) : 0.5 + 0.5 * smooth(t),
      lift: arc * 0.09,
      pitch: 0.12 * crouch - 0.18 * Math.sin(2 * Math.PI * t),
      stretch: 1 - 0.16 * crouch + 0.12 * arc
    });
  },
  // Slow, heavy steps with a sway, and a shake of the mane on arrival.
  king(u, squares) {
    const steps = Math.max(2, Math.ceil(squares * 2));
    const t = clamp01((u - 0.8) / 0.2);
    return pose({
      progress: smooth(u),
      lift: Math.abs(Math.sin(Math.PI * steps * u)) * 0.012,
      roll: Math.sin(Math.PI * steps * u) * 0.055,
      yaw: Math.sin(Math.PI * 4 * t) * (1 - t) * 0.3
    });
  }
};

export function moveStyle(type, u, squares) {
  const style = STYLES[type];
  return style ? style(clamp01(u), squares) : pose({ progress: easeInOutCubic(clamp01(u)) });
}

/** How hard the piece squashes as it arrives. Everything else about the landing is already neutral. */
export const LANDING_SQUASH = { pawn: 0, knight: 0.16, bishop: 0.1, rook: 0.1, queen: 0.12, king: 0.06 };
