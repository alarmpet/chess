// Start-of-game missions. The AI does not chase them: a race is decided by what happens on the board anyway.
export const MISSIONS = [
  { id: 'race_bishop', kind: 'race', target: 'bishop', ko: '판다를 먼저 잡기', en: 'Capture a panda first' },
  { id: 'race_knight', kind: 'race', target: 'knight', ko: '캥거루를 먼저 잡기', en: 'Capture a kangaroo first' },
  { id: 'race_rook', kind: 'race', target: 'rook', ko: '코뿔소를 먼저 잡기', en: 'Capture a rhino first' },
  { id: 'with_knight', kind: 'with', attacker: 'knight', ko: '캥거루로 말 잡기', en: 'Capture with a kangaroo' },
  { id: 'with_bishop', kind: 'with', attacker: 'bishop', ko: '판다로 말 잡기', en: 'Capture with a panda' },
  { id: 'with_pawn', kind: 'with', attacker: 'pawn', ko: '미어캣으로 말 잡기', en: 'Capture with a meerkat' },
  { id: 'safe_queen', kind: 'safe', piece: 'queen', plies: 30, ko: '호랑이를 지키며 15수 버티기', en: 'Keep your tiger for 15 moves' }
];

/** Three different missions, picked by one seeded roll. */
export function missionChoices(roll) {
  const pool = [...MISSIONS];
  const out = [];
  let r = roll;
  for (let i = 0; i < 3; i++) {
    r = (r * pool.length) % 1;
    const at = Math.floor(((roll * 997 + i * 0.37 + r) % 1) * pool.length);
    out.push(pool.splice(at, 1)[0]);
  }
  return out;
}

/**
 * Feeds one board event to a mission. Returns 'done', 'lost', or null while it is still open.
 * @param {any} mission
 * @param {{ capture?: any, ply?: number }} event
 */
export function advanceMission(mission, { capture = null, ply = 0 }) {
  if (mission.kind === 'safe') {
    if (capture && !capture.byPlayer && capture.type === mission.piece) return 'lost';
    return ply >= mission.plies ? 'done' : null;
  }
  if (!capture) return null;
  if (mission.kind === 'race') {
    if (capture.type !== mission.target) return null;
    return capture.byPlayer ? 'done' : 'lost';
  }
  return capture.byPlayer && capture.attackerType === mission.attacker ? 'done' : null;
}
