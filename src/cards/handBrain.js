// Hand and brain (objective-layer plan OL-4, 2026-11-06). Two players share one side: the brain names a piece kind,
// the hand moves a piece of that kind. chess.com's glossary: players of different strength on the same ground; an
// r/chess parent: playing on the same side as dad gave the child confidence. The brain is a person (a parent or a
// friend) or the AI adviser, which names only the kind of its best move, so the hand still finds the move.
// Plus the family quest (plan N2, after Duolingo's Friends Quest): one small goal a week, filled only by hand-and-brain
// games with a person as the brain. Small on purpose, so nobody is to blame for a missed week. Pure: no DOM.
import { Chess } from 'chess.js';
import { chooseMove } from '../rules/ai.js';

/** Piece kinds in the order the brain's buttons show them. */
export const HB_KINDS = ['p', 'n', 'b', 'r', 'q', 'k'];
export const HB_NAMES = {
  p: { ko: '미어캣', en: 'Meerkat', icon: '♟' },
  n: { ko: '캥거루', en: 'Kangaroo', icon: '♞' },
  b: { ko: '판다', en: 'Panda', icon: '♝' },
  r: { ko: '코뿔소', en: 'Rhino', icon: '♜' },
  q: { ko: '호랑이', en: 'Tiger', icon: '♛' },
  k: { ko: '사자', en: 'Lion', icon: '♚' }
};

/** Kinds that have at least one legal move for the side to move; the brain's other buttons are off. */
export function movableKinds(fen) {
  const kinds = new Set();
  for (const m of new Chess(fen).moves({ verbose: true })) kinds.add(m.piece);
  return HB_KINDS.filter((k) => kinds.has(k));
}

/** The AI adviser: the piece kind of the move it would play itself, or null when there is no move. */
export function adviseKind(fen, { level = 'normal', history = [], rand = Math.random } = {}) {
  const pick = chooseMove(fen, { level, history, rand, slip: 0 });
  if (!pick) return null;
  return new Chess(fen).get(pick.from)?.type || null;
}

// ── Family quest ────────────────────────────────────────────────────────────────────────────────────────────────
export const FAMILY_ACORNS = 20;
// Sized from tools/handbrain_sim.mjs (2026-11-06): with a poor brain (any movable kind) a game had 2 captures and 0.2
// checks, so 12 captures and 4 checks were cut to 10 and 3; with the AI adviser a game had 7.5 and 1.
export const FAMILY_QUESTS = [
  { id: 'together_games_3', need: 3, ko: '손과 뇌로 3판 끝까지 두기', en: 'Finish 3 hand-and-brain games', count: (e) => (e.kind === 'end' ? 1 : 0) },
  { id: 'together_caps_10', need: 10, ko: '손과 뇌로 말 10마리 잡기', en: 'Capture 10 pieces in hand and brain', count: (e) => (e.kind === 'move' && e.move.captured ? 1 : 0) },
  { id: 'together_checks_3', need: 3, ko: '손과 뇌로 체크 3번', en: 'Give 3 checks in hand and brain', count: (e) => (e.kind === 'move' && /[+#]$/.test(e.move.san || '') ? 1 : 0) }
];
const familyById = Object.fromEntries(FAMILY_QUESTS.map((q) => [q.id, q]));
export const familyQuestById = (id) => familyById[id] || null;

/** Week number from a day number (quests.js `dayNumber`); weeks start on Monday (day 0, 1970-01-01, was a Thursday). */
export const weekOf = (day) => Math.floor((day + 3) / 7);

/** This week's family quest: kept with its progress during the week, a new one (in turn) each week. */
export function refreshFamily(state, week) {
  if (state && state.week === week && familyById[state.id]) return state;
  return { v: 1, week, id: FAMILY_QUESTS[((week % FAMILY_QUESTS.length) + FAMILY_QUESTS.length) % FAMILY_QUESTS.length].id, have: 0, done: false };
}

/** Adds one event of a hand-and-brain game with a person as the brain. Returns { state, finished }. */
export function familyStep(state, event) {
  if (state.done) return { state, finished: false };
  const q = familyById[state.id];
  const have = Math.min(q.need, state.have + q.count(event));
  if (have === state.have) return { state, finished: false };
  const next = { ...state, have, done: have >= q.need };
  return { state: next, finished: next.done };
}

export function sanitizeFamily(raw) {
  if (!raw || raw.v !== 1 || !familyById[raw.id] || !Number.isInteger(raw.week)) return null;
  const need = familyById[raw.id].need;
  const have = Math.max(0, Math.min(need, Math.floor(Number(raw.have)) || 0));
  return { v: 1, week: raw.week, id: raw.id, have, done: raw.done === true && have >= need };
}
