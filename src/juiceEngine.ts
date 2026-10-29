/**
 * juiceEngine.ts — Game Feel & Addiction Loop Feedback System
 *
 * Inspired by: Balatro sequential scoring, Hearthstone card feel,
 * Slay the Spire snap-to, Hades multikill, Vampire Survivors particle loot.
 *
 * Provides:
 *  - Floating damage / reward numbers (floating-number DOM nodes)
 *  - Screen flash (hit-flash-overlay)
 *  - Currency bounce animations (coin-bounce class toggling)
 *  - Multikill / combo banner
 *  - Card deal animation trigger
 *  - XP bar management
 *  - Daily quest state & tracking
 *  - Win streak counter
 *  - Harvest coin particle burst
 */

// ─────────────────────────────────────────────────────────────────────────────
// Floating Number Popups
// ─────────────────────────────────────────────────────────────────────────────

export type FloatType =
  | 'gold' | 'damage' | 'critical' | 'ash' | 'marble'
  | 'xp' | 'combo' | 'stun' | 'checkmate';

/**
 * Spawn a floating text label at screen coordinates.
 * Adds a small random horizontal jitter so stacked labels spread.
 */
export function spawnFloatingNumber(
  text: string,
  screenX: number,
  screenY: number,
  type: FloatType = 'gold',
  jitter = true
): void {
  const el = document.createElement('div');
  el.className = `floating-number ${type}`;
  el.textContent = text;

  const jX = jitter ? (Math.random() - 0.5) * 52 : 0;
  const jY = jitter ? (Math.random() - 0.5) * 16 : 0;

  el.style.left = `${screenX + jX}px`;
  el.style.top = `${screenY + jY}px`;
  el.style.transform = 'translate(-50%, -50%)';

  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

/**
 * Spawn a floating label at the center of a chess tile (col, row) using the
 * global wizardChess boardToWorld helper already exposed on window.
 */
export function spawnFloatingAtTile(
  text: string,
  col: number,
  row: number,
  type: FloatType = 'gold'
): void {
  const win = window as unknown as {
    wizardChess?: {
      boardToWorld?: (c: number, r: number) => { x: number; y: number; z: number };
      camera?: { projectionMatrix: unknown };
    };
    __juiceCamera?: { projectionMatrix: unknown };
  };

  // Try to project 3D world position → screen space
  const bToW = win.wizardChess?.boardToWorld;
  if (!bToW) {
    // Fallback: center of viewport
    spawnFloatingNumber(text, window.innerWidth / 2, window.innerHeight / 2, type);
    return;
  }

  // Use the helper if available, otherwise approximate
  const worldPos = bToW(col, row);
  const sx = window.innerWidth / 2 + (worldPos.x / 5) * window.innerWidth * 0.28;
  const sy = window.innerHeight / 2 - (worldPos.z / 5) * window.innerHeight * 0.28;
  spawnFloatingNumber(text, sx, sy, type);
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen Flash Overlay
// ─────────────────────────────────────────────────────────────────────────────

let flashOverlay: HTMLElement | null = null;

function getFlashOverlay(): HTMLElement {
  if (!flashOverlay) {
    flashOverlay = document.createElement('div');
    flashOverlay.id = 'hit-flash-overlay';
    document.body.appendChild(flashOverlay);
  }
  return flashOverlay;
}

export type FlashType = 'white' | 'gold' | 'red' | 'purple';

/**
 * Trigger a brief full-screen color flash.
 * white  = minor impact  |  gold  = reward / brilliant
 * red    = danger / check |  purple = spell / arcane
 */
export function screenFlash(type: FlashType = 'white'): void {
  const overlay = getFlashOverlay();
  overlay.className = '';
  // Force reflow to restart animation
  void overlay.offsetWidth;
  overlay.className = `flash-${type}`;
  overlay.addEventListener('animationend', () => { overlay.className = ''; }, { once: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Currency Bounce Animation
// ─────────────────────────────────────────────────────────────────────────────

const BOUNCE_DURATION_MS = 500;
const bounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Temporarily add a bounce CSS class to the currency pill icon.
 * currency: 'gold' | 'gems' | 'ash' | 'marble'
 */
export function bounceCurrency(currency: 'gold' | 'gems' | 'ash' | 'marble'): void {
  const pill = document.getElementById('farm-currency-pill');
  if (!pill) return;

  const cls = `${currency}-changed`;
  pill.classList.add(cls);

  clearTimeout(bounceTimers[currency]);
  bounceTimers[currency] = setTimeout(() => {
    pill.classList.remove(cls);
  }, BOUNCE_DURATION_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// Multikill / Combo Banner
// ─────────────────────────────────────────────────────────────────────────────

let multikillTimeout: ReturnType<typeof setTimeout> | null = null;

export type MultikillType = 'double' | 'triple' | 'epic' | 'brazier' | 'stun';

export function showMultikillBanner(
  label: string,
  type: MultikillType = 'double'
): void {
  // Remove previous if exists
  const existing = document.getElementById('multikill-banner');
  if (existing) existing.remove();
  if (multikillTimeout) clearTimeout(multikillTimeout);

  const el = document.createElement('div');
  el.id = 'multikill-banner';
  el.className = `multikill-banner ${type}`;
  el.textContent = label;
  document.body.appendChild(el);

  multikillTimeout = setTimeout(() => el.remove(), 1700);
}

// Combo counter state
let comboCount = 0;
let comboResetTimer: ReturnType<typeof setTimeout> | null = null;
const COMBO_RESET_MS = 8000; // reset after 8s of no captures

/**
 * Call on every chess capture. Increments internal combo counter,
 * shows escalating multikill banners.
 */
export function registerCapture(
  pieceType: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'brazier_kill' | 'pillar_stun'
): void {
  comboCount++;

  if (comboResetTimer) clearTimeout(comboResetTimer);
  comboResetTimer = setTimeout(() => { comboCount = 0; }, COMBO_RESET_MS);

  // Floating label intensity based on piece value
  const pieceScore: Record<string, number> = {
    pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9,
    brazier_kill: 10, pillar_stun: 5
  };
  const score = pieceScore[pieceType] ?? 1;

  if (pieceType === 'brazier_kill') {
    showMultikillBanner('🔥 BRAZIER KILL!', 'brazier');
    screenFlash('gold');
  } else if (pieceType === 'pillar_stun') {
    showMultikillBanner('🏛️ STUN!', 'stun');
    screenFlash('purple');
  } else if (pieceType === 'queen') {
    showMultikillBanner('♛ QUEEN SLAIN!', 'epic');
    screenFlash('gold');
  } else if (comboCount === 2) {
    showMultikillBanner('⚔️ DOUBLE!', 'double');
    screenFlash('white');
  } else if (comboCount === 3) {
    showMultikillBanner('💥 TRIPLE!', 'triple');
    screenFlash('gold');
  } else if (comboCount >= 4) {
    showMultikillBanner(`🌟 ${comboCount}x RAMPAGE!`, 'epic');
    screenFlash('gold');
  }

  return void score; // suppress lint
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Deal Animation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trigger the fan-in deal animation on all current arcane cards.
 * Call after a new hand is dealt (turn start / refill).
 */
export function triggerCardDealAnimation(): void {
  const cards = document.querySelectorAll<HTMLElement>('.arcane-card');
  cards.forEach((card, i) => {
    card.classList.remove('dealing');
    void card.offsetWidth; // reflow
    card.style.setProperty('--deal-x', `${(Math.random() - 0.5) * 30}px`);
    card.style.setProperty('--deal-rot', `${(Math.random() - 0.5) * 12}deg`);
    card.classList.add('dealing');
    setTimeout(() => card.classList.remove('dealing'), 600 + i * 80);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Tilt (3D Hologram Effect)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attach 3D mouse-tracking tilt to a card element.
 * Call once per card after it mounts.
 */
export function attachCardTilt(card: HTMLElement): () => void {
  const onMove = (e: MouseEvent) => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const tiltX = ((e.clientX - cx) / (rect.width / 2)) * 14;  // max ±14°
    const tiltY = -((e.clientY - cy) / (rect.height / 2)) * 9; // max ±9°

    card.style.transform =
      `perspective(700px) rotateX(${tiltY}deg) rotateY(${tiltX}deg) translateY(-10px) scale(1.06)`;
  };

  const onLeave = () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1)';
    setTimeout(() => { card.style.transition = ''; }, 380);
  };

  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', onLeave);

  // Return cleanup
  return () => {
    card.removeEventListener('mousemove', onMove);
    card.removeEventListener('mouseleave', onLeave);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// XP / Progress System
// ─────────────────────────────────────────────────────────────────────────────

const XP_KEY = 'sanctuary_xp';
const LEVEL_KEY = 'sanctuary_level';
const STREAK_KEY = 'sanctuary_streak';

function xpToNextLevel(level: number): number {
  // Goal-Gradient: curve designed to feel "almost there" often
  return Math.floor(80 * Math.pow(1.18, level - 1));
}

export interface XPState {
  level: number;
  xp: number;
  xpToNext: number;
  winStreak: number;
  fillPercent: number; // 0–100 (pre-seeded at 15% floor so bar never empty)
}

function loadXPState(): XPState {
  const level = Math.max(1, parseInt(localStorage.getItem(LEVEL_KEY) ?? '1', 10));
  const xp = Math.max(0, parseInt(localStorage.getItem(XP_KEY) ?? '0', 10));
  const winStreak = Math.max(0, parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10));
  const xpToNext = xpToNextLevel(level);
  // Pre-seed floor at 15% so bar is never empty (Goal-Gradient psychology)
  const rawFill = xp / xpToNext;
  const fillPercent = Math.min(100, Math.round(15 + rawFill * 85));
  return { level, xp, xpToNext, winStreak, fillPercent };
}

function saveXPState(state: XPState): void {
  localStorage.setItem(LEVEL_KEY, String(state.level));
  localStorage.setItem(XP_KEY, String(state.xp));
  localStorage.setItem(STREAK_KEY, String(state.winStreak));
}

export type XPListener = (state: XPState) => void;
const xpListeners: XPListener[] = [];
export let xpState: XPState = loadXPState();

export function subscribeXP(fn: XPListener): () => void {
  xpListeners.push(fn);
  return () => { const i = xpListeners.indexOf(fn); if (i >= 0) xpListeners.splice(i, 1); };
}

function notifyXP(): void {
  xpListeners.forEach(fn => fn(xpState));
}

/**
 * Award XP; handles level-ups automatically.
 * Returns true if a level-up occurred.
 */
export function awardXP(amount: number): boolean {
  xpState.xp += amount;
  let leveledUp = false;

  while (xpState.xp >= xpState.xpToNext) {
    xpState.xp -= xpState.xpToNext;
    xpState.level++;
    xpState.xpToNext = xpToNextLevel(xpState.level);
    leveledUp = true;
  }

  const rawFill = xpState.xp / xpState.xpToNext;
  xpState.fillPercent = Math.min(100, Math.round(15 + rawFill * 85));

  if (leveledUp) {
    // Trigger visual levelup burst
    const pill = document.getElementById('xp-bar-pill');
    pill?.classList.remove('level-up');
    void pill?.offsetWidth;
    pill?.classList.add('level-up');
    setTimeout(() => pill?.classList.remove('level-up'), 700);

    spawnFloatingNumber(`⬆ LEVEL UP! Lv.${xpState.level}`, window.innerWidth / 2, window.innerHeight * 0.35, 'checkmate', false);
    screenFlash('purple');
  }

  saveXPState(xpState);
  notifyXP();
  return leveledUp;
}

/** Register a win, increment streak. */
export function registerWin(): void {
  xpState.winStreak++;
  saveXPState(xpState);
  notifyXP();

  // XP for winning scales with streak
  const xpGain = 40 + Math.min(xpState.winStreak * 8, 60);
  awardXP(xpGain);
  spawnFloatingNumber(`+${xpGain} XP`, window.innerWidth / 2, window.innerHeight * 0.45, 'xp', false);
}

/** Register a loss — streak resets but player gets consolation XP */
export function registerLoss(): void {
  xpState.winStreak = 0;
  saveXPState(xpState);
  notifyXP();
  awardXP(12); // Always earn something (Vampire Survivors principle)
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Quest System
// ─────────────────────────────────────────────────────────────────────────────

const QUESTS_KEY = 'sanctuary_quests';
const QUEST_DATE_KEY = 'sanctuary_quest_date';

export interface DailyQuest {
  id: string;
  icon: string;
  title: string;
  progress: number;
  target: number;
  reward: { gold?: number; gems?: number; ash?: number; marble?: number; xp?: number };
  isCompleted: boolean;
}

const QUEST_POOL: Omit<DailyQuest, 'progress' | 'isCompleted'>[] = [
  { id: 'q_brazier',   icon: '🔥', title: '화로 소각 처형 달성',    target: 2, reward: { ash: 3, xp: 30 } },
  { id: 'q_pillar',    icon: '🏛️', title: '기둥 격돌 충돌',         target: 2, reward: { marble: 3, xp: 25 } },
  { id: 'q_shove',     icon: '💨', title: '충격파 주문 사용',        target: 3, reward: { gold: 20, xp: 20 } },
  { id: 'q_harvest',   icon: '🌾', title: '성소 정원 수확',          target: 3, reward: { gold: 30, xp: 25 } },
  { id: 'q_checkmate', icon: '♟️', title: '체크메이트로 승리',       target: 1, reward: { gems: 2, xp: 50 } },
  { id: 'q_spell',     icon: '⚡', title: '주문 카드 5번 사용',      target: 5, reward: { gold: 25, xp: 20 } },
  { id: 'q_capture',   icon: '⚔️', title: '기물 5개 포획',          target: 5, reward: { gold: 15, xp: 20 } },
  { id: 'q_seed',      icon: '🌱', title: '씨앗 심기 (2곳)',         target: 2, reward: { gold: 20, xp: 15 } },
  { id: 'q_restore',   icon: '🏰', title: '수도원 구역 복원',        target: 1, reward: { gems: 3, xp: 60 } },
];

function pickDailyQuests(seed: number): DailyQuest[] {
  // Deterministic daily selection via date-based seed
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) % 97);
    const hb = ((seed * 31 + b.id.charCodeAt(0)) % 97);
    return ha - hb;
  });
  return shuffled.slice(0, 3).map(q => ({ ...q, progress: 0, isCompleted: false }));
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export type QuestListener = (quests: DailyQuest[]) => void;
const questListeners: QuestListener[] = [];
export let dailyQuests: DailyQuest[] = [];

export function subscribeQuests(fn: QuestListener): () => void {
  questListeners.push(fn);
  return () => { const i = questListeners.indexOf(fn); if (i >= 0) questListeners.splice(i, 1); };
}

function notifyQuests(): void {
  questListeners.forEach(fn => fn(dailyQuests));
}

export function initDailyQuests(): void {
  const today = getTodayKey();
  const savedDate = localStorage.getItem(QUEST_DATE_KEY);

  if (savedDate === today) {
    try {
      dailyQuests = JSON.parse(localStorage.getItem(QUESTS_KEY) ?? '[]');
      if (dailyQuests.length === 3) { notifyQuests(); return; }
    } catch { /* fallthrough */ }
  }

  // New day — generate fresh quests
  const seed = new Date().getDate() * 7 + new Date().getMonth() * 31;
  dailyQuests = pickDailyQuests(seed);
  localStorage.setItem(QUEST_DATE_KEY, today);
  localStorage.setItem(QUESTS_KEY, JSON.stringify(dailyQuests));
  notifyQuests();
}

function saveQuests(): void {
  localStorage.setItem(QUESTS_KEY, JSON.stringify(dailyQuests));
}

/**
 * Increment progress on all quests matching the given event ID.
 * e.g. progressQuest('q_brazier') after a brazier kill.
 */
export function progressQuest(questId: string, amount = 1): void {
  let changed = false;
  dailyQuests.forEach(q => {
    if (q.id === questId && !q.isCompleted) {
      q.progress = Math.min(q.target, q.progress + amount);
      if (q.progress >= q.target && !q.isCompleted) {
        q.isCompleted = true;
        changed = true;
        // Award quest rewards
        _awardQuestReward(q);
      } else {
        changed = true;
      }
    }
  });
  if (changed) {
    saveQuests();
    notifyQuests();
  }
}

function _awardQuestReward(q: DailyQuest): void {
  const r = q.reward;
  const parts: string[] = [];
  if (r.gold)   parts.push(`+${r.gold}G`);
  if (r.gems)   parts.push(`+${r.gems}💎`);
  if (r.ash)    parts.push(`+${r.ash}🔥`);
  if (r.marble) parts.push(`+${r.marble}🏛️`);
  if (r.xp)     parts.push(`+${r.xp} XP`);

  // Show toast
  const label = `${q.icon} 임무 완료! ${parts.join(' ')}`;
  spawnFloatingNumber(label, window.innerWidth / 2, window.innerHeight * 0.3, 'xp', false);
  screenFlash('gold');

  // Award XP portion through XP engine
  if (r.xp) awardXP(r.xp);

  // Dispatch custom event so farmEngine can pick up gold/gems/relics
  window.dispatchEvent(new CustomEvent('quest-reward', { detail: r }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Harvest Coin Particle Burst
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Spawn 6–10 golden coin particles that fly from a world position toward the
 * HUD currency pill, giving the Vampire Survivors item collection feel.
 */
export function spawnHarvestCoins(
  fromX: number,
  fromY: number,
  count = 7
): void {
  const pill = document.getElementById('farm-currency-pill');
  const targetX = pill ? pill.getBoundingClientRect().left + pill.offsetWidth / 2 : window.innerWidth / 2;
  const targetY = pill ? pill.getBoundingClientRect().top + pill.offsetHeight / 2 : 60;

  for (let i = 0; i < count; i++) {
    const delay = i * 55;
    setTimeout(() => {
      const coin = document.createElement('div');
      coin.className = 'harvest-coin';
      const startX = fromX + (Math.random() - 0.5) * 60;
      const startY = fromY + (Math.random() - 0.5) * 40;
      coin.style.left = `${startX}px`;
      coin.style.top = `${startY}px`;
      coin.style.setProperty('--coin-tx', `${targetX - startX}px`);
      coin.style.setProperty('--coin-ty', `${targetY - startY}px`);
      document.body.appendChild(coin);
      coin.addEventListener('animationend', () => {
        coin.remove();
        bounceCurrency('gold'); // bounce the gold icon on arrival
      }, { once: true });
    }, delay);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Danger Vignette (In-Check Warning)
// ─────────────────────────────────────────────────────────────────────────────

let vignetteEl: HTMLElement | null = null;

function getVignette(): HTMLElement {
  if (!vignetteEl) {
    vignetteEl = document.createElement('div');
    vignetteEl.id = 'danger-vignette';
    document.body.appendChild(vignetteEl);
  }
  return vignetteEl;
}

export function setDangerVignette(active: boolean): void {
  const v = getVignette();
  if (active) {
    v.classList.add('in-check');
  } else {
    v.classList.remove('in-check');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rolling Counter Animation (Balatro-style number tick-up)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Animate a DOM element's text content from `from` to `to` over `durationMs`.
 * Optional `suffix` (e.g. 'G', '💎') appended to the number.
 */
export function animateCounter(
  el: HTMLElement,
  from: number,
  to: number,
  durationMs = 700,
  suffix = ''
): void {
  const startTime = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - startTime) / durationMs, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = `${current}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ─────────────────────────────────────────────────────────────────────────────
// Harvest-Ready Pulse on Garden Button
// ─────────────────────────────────────────────────────────────────────────────

export function setHarvestReady(ready: boolean): void {
  const btn = document.getElementById('btn-farm-view');
  if (!btn) return;
  if (ready) {
    btn.classList.add('harvest-ready');
  } else {
    btn.classList.remove('harvest-ready');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Init — call once on app boot
// ─────────────────────────────────────────────────────────────────────────────

export function initJuiceEngine(): void {
  // Ensure flash overlay exists in DOM
  getFlashOverlay();
  getVignette();
  initDailyQuests();

  // Listen for quest rewards to forward to farmEngine
  window.addEventListener('quest-reward', (e: Event) => {
    const detail = (e as CustomEvent<DailyQuest['reward']>).detail;
    const fe = (window as unknown as { __farmEngine?: {
      addGold?: (n: number) => void;
      addGems?: (n: number) => void;
      addAsh?: (n: number) => void;
      addMarble?: (n: number) => void;
    } }).__farmEngine;
    if (!fe) return;
    if (detail.gold)   fe.addGold?.(detail.gold);
    if (detail.gems)   fe.addGems?.(detail.gems);
    if (detail.ash)    fe.addAsh?.(detail.ash);
    if (detail.marble) fe.addMarble?.(detail.marble);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton export
// ─────────────────────────────────────────────────────────────────────────────

export const juiceEngine = {
  spawnFloatingNumber,
  spawnFloatingAtTile,
  screenFlash,
  bounceCurrency,
  showMultikillBanner,
  registerCapture,
  triggerCardDealAnimation,
  attachCardTilt,
  awardXP,
  registerWin,
  registerLoss,
  progressQuest,
  spawnHarvestCoins,
  setDangerVignette,
  setHarvestReady,
  animateCounter,
  initJuiceEngine,
  getXPState: () => xpState,
  getQuests: () => dailyQuests,
  subscribeXP,
  subscribeQuests,
};

if (typeof window !== 'undefined') {
  (window as any).__juiceEngine = juiceEngine;
}

