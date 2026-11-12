// Today's quests (objective-layer plan OL-3, 2026-11-06). Three a day — easy, medium, hard — filled over any games.
// From the plan's source table: Hearthstone and Duolingo give three, Hearthstone lets one be swapped a day, Chess.com
// keeps a missed daily for 48 hours, and VALORANT moved away from specific-action dailies (so most of ours are things
// any game does). Clash Royale removed its quests outright, which is why these can be switched off in the settings.
// Nothing here is lost for a missed day: an unfinished quest stays, with its progress, through the next day.
const isCheck = (m) => /[+#]$/.test(m.san || '');

/** count(event) → progress the event adds. Events: { kind: 'move', move } (the player's chess.js move), 'mission',
 *  'bounty', { kind: 'stamp', id }, { kind: 'end', result }. */
export const QUESTS = {
  easy: [
    { id: 'finish_game', need: 1, ko: '한 판 끝까지 두기', en: 'Finish a game', count: (e) => (e.kind === 'end' ? 1 : 0) },
    { id: 'captures_3', need: 3, ko: '말 3마리 잡기', en: 'Capture 3 pieces', count: (e) => (e.kind === 'move' && e.move.captured ? 1 : 0) },
    { id: 'check_1', need: 1, ko: '체크 1번', en: 'Give a check', count: (e) => (e.kind === 'move' && isCheck(e.move) ? 1 : 0) }
  ],
  medium: [
    { id: 'knight_caps_2', need: 2, ko: '캥거루로 2번 잡기', en: 'Capture twice with a kangaroo', count: (e) => (e.kind === 'move' && e.move.piece === 'n' && e.move.captured ? 1 : 0) },
    { id: 'bishop_caps_2', need: 2, ko: '판다로 2번 잡기', en: 'Capture twice with a panda', count: (e) => (e.kind === 'move' && e.move.piece === 'b' && e.move.captured ? 1 : 0) },
    { id: 'castle_1', need: 1, ko: '캐슬링 하기', en: 'Castle', count: (e) => (e.kind === 'move' && /[kq]/.test(e.move.flags || '') ? 1 : 0) },
    { id: 'mission_1', need: 1, ko: '공유 미션 먼저 해내기', en: 'Take a shared mission first', count: (e) => (e.kind === 'mission' ? 1 : 0) },
    { id: 'bounty_1', need: 1, ko: '💰 현상금 받기', en: 'Claim a 💰 bounty', count: (e) => (e.kind === 'bounty' ? 1 : 0) }
  ],
  // Hard is a day's effort over two or three games for any player. A stamp or a win was here first, but a weaker
  // player (easy bot against a normal one) made neither in three games out of 120 (tools/quest_sim.mjs, 2026-11-06).
  hard: [
    { id: 'captures_10', need: 10, ko: '말 10마리 잡기', en: 'Capture 10 pieces', count: (e) => (e.kind === 'move' && e.move.captured ? 1 : 0) },
    { id: 'check_3', need: 3, ko: '체크 3번', en: 'Give check 3 times', count: (e) => (e.kind === 'move' && isCheck(e.move) ? 1 : 0) },
    { id: 'bounty_2', need: 2, ko: '💰 현상금 2번 받기', en: 'Claim 2 💰 bounties', count: (e) => (e.kind === 'bounty' ? 1 : 0) }
  ]
};
export const TIERS = ['easy', 'medium', 'hard'];
export const QUEST_ACORNS = { easy: 5, medium: 10, hard: 15 };
const byId = Object.fromEntries(TIERS.flatMap((t) => QUESTS[t].map((q) => [q.id, { ...q, tier: t }])));
export const questById = (id) => byId[id] || null;

/** Days counted on the device's own calendar, so a quest day starts at local midnight. */
export function dayNumber(now = Date.now()) {
  const d = new Date(now);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

const pick = (tier, roll, avoid) => {
  const pool = QUESTS[tier].filter((q) => q.id !== avoid);
  return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))].id;
};

/**
 * Brings the three slots up to `today`. A slot from today stays; an unfinished slot from yesterday stays one more day
 * (with its progress); anything older or finished gives way to a new quest of the same tier. `roll(tier)` is 0..1.
 */
export function refreshQuests(state, today, roll) {
  const old = state && Array.isArray(state.slots) ? state.slots : [];
  const slots = TIERS.map((tier, i) => {
    const s = old[i];
    if (s && questById(s.id)?.tier === tier && (s.day === today || (!s.done && s.day === today - 1))) return s;
    return { id: pick(tier, roll(tier), s?.id), have: 0, done: false, day: today };
  });
  return { v: 1, slots, swapDay: state?.swapDay ?? null };
}

/** Adds one event's progress. Returns the new state and the slots it finished. */
export function questStep(state, event) {
  const finished = [];
  const slots = state.slots.map((s) => {
    if (s.done) return s;
    const q = questById(s.id);
    const have = Math.min(q.need, s.have + q.count(event));
    if (have === s.have) return s;
    const next = { ...s, have, done: have >= q.need };
    if (next.done) finished.push({ ...next, tier: q.tier });
    return next;
  });
  return { state: { ...state, slots }, finished };
}

/** Swaps one unfinished slot for another quest of its tier, once a day. Returns null when not allowed. */
export function swapQuest(state, index, today, roll) {
  const s = state.slots[index];
  if (!s || s.done || state.swapDay === today) return null;
  const slots = state.slots.slice();
  slots[index] = { id: pick(TIERS[index], roll, s.id), have: 0, done: false, day: today };
  return { ...state, slots, swapDay: today };
}

/** Keeps only well-formed slots from a save; anything else becomes a fresh day. */
export function sanitizeQuests(raw) {
  if (!raw || raw.v !== 1 || !Array.isArray(raw.slots)) return null;
  const slots = raw.slots.slice(0, 3).map((s) => (s && questById(s.id) && Number.isInteger(s.day)
    ? { id: s.id, have: Math.max(0, Math.min(questById(s.id).need, Math.floor(Number(s.have)) || 0)), done: s.done === true, day: s.day }
    : null));
  if (slots.some((s) => !s)) return null;
  return { v: 1, slots, swapDay: Number.isInteger(raw.swapDay) ? raw.swapDay : null };
}
