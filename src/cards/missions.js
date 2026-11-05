// Shared race missions (mission round 2026-11-05, docs/research/agent-rounds/2026-11-05-shared-mission). One mission a
// game, the same for both colours, nothing to pick: whoever does it first takes it. The AI does not chase it — its
// search has no mission term, so a race is decided by what happens on the board anyway (no hidden rubber band).
// Each `hit` reads one chess.js verbose move; tools/mission_sim.mjs plays bot games over the same tests.
export const RACES = [
  { id: 'first_capture', hit: (m) => Boolean(m.captured), ko: '먼저 한 마리 잡기', en: 'First to capture' },
  { id: 'race_knight', hit: (m) => m.captured === 'n', ko: '캥거루를 먼저 잡기', en: 'First to capture a kangaroo' },
  { id: 'race_bishop', hit: (m) => m.captured === 'b', ko: '판다를 먼저 잡기', en: 'First to capture a panda' },
  { id: 'race_rook', hit: (m) => m.captured === 'r', ko: '코뿔소를 먼저 잡기', en: 'First to capture a rhino' },
  { id: 'race_queen', hit: (m) => m.captured === 'q', ko: '호랑이를 먼저 잡기', en: 'First to capture a tiger' },
  { id: 'first_check', hit: (m) => /[+#]$/.test(m.san || ''), ko: '사자에게 먼저 체크', en: 'First to check the lion' },
  { id: 'castle', hit: (m) => /[kq]/.test(m.flags || ''), ko: '사자 성 먼저 쌓기(캐슬링)', en: 'First to castle' },
  { id: 'knight_capture', hit: (m) => m.piece === 'n' && Boolean(m.captured), ko: '캥거루로 먼저 잡기', en: 'First capture with a kangaroo' },
  { id: 'bishop_capture', hit: (m) => m.piece === 'b' && Boolean(m.captured), ko: '판다로 먼저 잡기', en: 'First capture with a panda' }
];

// The pool games draw from (tools/mission_sim.mjs, 60 bot games for each of easy/normal pairings, 2026-11-05): kept
// when someone took it in at least 40% of games and white was first at most 70% between equal bots. Out: the first
// capture (always settled by ply 11), castling (white 71% between easy bots), promotion (taken in 33~42%).
export const SHARED_POOL = ['race_knight', 'race_bishop', 'race_rook', 'race_queen', 'first_check', 'knight_capture', 'bishop_capture'];

/** Acorns for the side that takes the mission first, paid with the game (a start value under the 15 between a win and a loss). */
export const MISSION_ACORNS = 8;

export const raceById = (id) => RACES.find((r) => r.id === id) || null;

/** This game's mission from one seeded roll (0..1). */
export function sharedMission(roll, pool = SHARED_POOL) {
  return raceById(pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))]);
}

/** The colour ('w' | 'b') that takes the mission with this move, or null. */
export function raceStep(mission, move) {
  // A village request rides in the same chip and has no `hit`: it is settled by the capture listener instead.
  return mission?.hit && move && mission.hit(move) ? move.color : null;
}

/** The colour that took the mission first over a whole game's moves, or null if nobody did. */
export function raceWinner(mission, moves) {
  for (const m of moves || []) {
    const won = raceStep(mission, m);
    if (won) return won;
  }
  return null;
}
