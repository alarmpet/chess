// 왕관 계약 세트 (슬롯 체스 계획서 2026-11-11 §2.1·§2.3·§3.2, SC-1 의 첫 조각).
// 한 판의 계약은 「잡을 종류 × 수량」 목표 셋이다. 셋 가운데 NEED 개를 먼저 채운 쪽이 계약으로 이긴다.
// 릴 셋을 따로 굴리지 않는다 — 검증된 세트 하나를 고르고 그 세 목표를 릴 셋이 하나씩 공개한다
// (중복·없는 말·채울 수 없는 수량이 나오지 않게, §2.3).
//
// 이 파일은 순수 함수다(DOM·three 없음). 지금 쓰는 곳은 소라 릴 연출(src/fx/shellReel.js)과 시험 스위치뿐이고,
// **판을 계약으로 끝내는 일과 계약을 아는 AI 는 아직 없다**(SC-1 의 나머지).

/** 계약에 쓸 수 있는 종류(chess.js 글자). 킹은 목표가 되지 않는다(§3.2-4). */
export const CONTRACT_TYPES = ['p', 'n', 'b', 'r', 'q'];
/** 판을 시작할 때 한쪽이 가진 수 — 수량은 이보다 클 수 없다. */
export const START_COUNT = { p: 8, n: 2, b: 2, r: 2, q: 1 };
/** 셋 가운데 이만큼을 먼저 채우면 계약 승리. */
export const CONTRACT_NEED = 2;

// 풀: 기존 AI 기보 120판 후향 분석으로 잰 세 후보(docs/research/2026-11-11-slot-chess/fx-density.json).
// 계약을 모르는 AI 의 기보라 공정성 검증이 아니다 — SC-0 에서 계약을 아는 AI 로 다시 재고 풀을 고친다.
//   p2nb   멈춤 중앙 21반수 · 계약 종료 중 백 28/59·27/57  ← 첫 시제품 후보
//   pnb    16반수 · 백 33/60·38/60
//   pnr    16~20반수 · 백 34/60·35/58
export const CONTRACT_SETS = [
  { id: 'p2nb', goals: [{ type: 'p', count: 2 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }], weight: 2 },
  { id: 'pnb', goals: [{ type: 'p', count: 1 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }], weight: 1 },
  { id: 'pnr', goals: [{ type: 'p', count: 1 }, { type: 'n', count: 1 }, { type: 'r', count: 1 }], weight: 1 }
];
/** 첫 두 판은 이 세트로 고정해 규칙을 익힌다(§2.3). */
export const FIRST_GAMES_SET = 'p2nb';
export const FIRST_GAMES = 2;

export const contractById = (id) => CONTRACT_SETS.find((s) => s.id === id) || null;

/** 세트가 규칙에 맞는가: 목표 셋, 서로 다른 종류, 킹 없음, 수량이 시작 수 이하. 맞으면 null, 아니면 이유. */
export function contractProblem(set) {
  const goals = set?.goals;
  if (!Array.isArray(goals) || goals.length !== 3) return '목표는 셋이어야 한다';
  const seen = new Set();
  for (const g of goals) {
    if (!CONTRACT_TYPES.includes(g.type)) return `목표가 될 수 없는 종류: ${g.type}`;
    if (seen.has(g.type)) return `같은 종류가 두 번: ${g.type}`;
    seen.add(g.type);
    if (!Number.isInteger(g.count) || g.count < 1 || g.count > START_COUNT[g.type]) return `채울 수 없는 수량: ${g.type}×${g.count}`;
  }
  return null;
}

/**
 * 이번 판의 계약. `roll` 은 0 이상 1 미만의 시드 값 하나, `gamesPlayed` 는 지금까지 끝낸 계약전 판 수.
 * 같은 roll 은 늘 같은 세트를 준다(두 사람·재접속에 같은 계약, §2.3).
 */
export function pickContract(roll, gamesPlayed = FIRST_GAMES, sets = CONTRACT_SETS) {
  if (gamesPlayed < FIRST_GAMES) return contractById(FIRST_GAMES_SET);
  const total = sets.reduce((s, x) => s + (x.weight || 1), 0);
  let at = Math.min(Math.max(roll, 0), 0.999999) * total;
  for (const set of sets) {
    at -= set.weight || 1;
    if (at < 0) return set;
  }
  return sets[sets.length - 1];
}

/** 진도: 색마다 목표별로 잡은 수(요구 수량에서 멈춘다)와 채운 목표 수. */
const emptySide = (set) => ({ counts: set.goals.map(() => 0), done: 0 });

/**
 * 기보(chess.js verbose 수들)에서 계약 진도를 다시 센다(§10 「진도는 기보에서 재계산해 검증한다」).
 * 잡힌 순간의 종류로 센다 — 승급한 폰을 잡으면 그 순간의 종류, 앙파상은 폰 한 마리(§3.2-3).
 * `winner` 는 NEED 개를 먼저 채운 색이고, 그 뒤의 수는 세지 않는다. `ply` 는 채운 반수(1부터).
 */
export function contractProgress(set, moves = []) {
  const sides = { w: emptySide(set), b: emptySide(set) };
  let winner = null;
  let ply = null;
  for (let i = 0; i < moves.length && !winner; i++) {
    const m = moves[i];
    if (!m?.captured) continue;
    const gi = set.goals.findIndex((g) => g.type === m.captured);
    if (gi < 0) continue;
    const side = sides[m.color];
    if (side.counts[gi] >= set.goals[gi].count) continue;   // 이미 채운 목표는 더 잡아도 늘지 않는다(§2.1)
    side.counts[gi] += 1;
    if (side.counts[gi] === set.goals[gi].count) side.done += 1;
    if (side.done >= CONTRACT_NEED) { winner = m.color; ply = i + 1; }
  }
  return { w: sides.w, b: sides.b, winner, ply, matchPoint: { w: sides.w.done === CONTRACT_NEED - 1, b: sides.b.done === CONTRACT_NEED - 1 } };
}

/**
 * 그 색에게 아직 열린 목표(= 현상 딱지가 붙을 상대 말의 종류). 승자가 정해졌으면 빈 배열.
 * `index` 는 세트 안의 자리(릴 소라 번호), `left` 는 더 잡아야 할 수.
 */
export function openGoals(set, progress, color) {
  if (!set || !progress || progress.winner || !progress[color]) return [];
  return set.goals
    .map((g, index) => ({ type: g.type, count: g.count, index, left: g.count - progress[color].counts[index] }))
    .filter((g) => g.left > 0);
}

/**
 * 판의 막(§4-2.2): 'open' 아직 · 'matchPoint' 한쪽이 하나 남김 · 'finalPoint' 양쪽 다 하나 남김(결승점) · 'done' 계약 완성.
 */
export function contractStage(progress) {
  if (!progress) return 'open';
  if (progress.winner) return 'done';
  const { w, b } = progress.matchPoint;
  return w && b ? 'finalPoint' : w || b ? 'matchPoint' : 'open';
}
