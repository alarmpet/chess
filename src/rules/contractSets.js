// 왕관 계약 세트 (슬롯 체스 계획서 2026-11-11 §2.1·§2.3·§3.2, SC-1 의 첫 조각).
// 한 판의 계약은 「잡을 종류 × 수량」 목표 셋이다. 셋 가운데 NEED 개를 먼저 채운 쪽이 계약으로 이긴다.
// 릴 셋을 따로 굴리지 않는다 — 검증된 세트 하나를 고르고 그 세 목표를 릴 셋이 하나씩 공개한다
// (중복·없는 말·채울 수 없는 수량이 나오지 않게, §2.3).
//
// 이 파일은 순수 함수다(DOM·three 없음). 판정은 contractGame.js, 계약을 아는 AI 는 ai.js, 연출은 src/fx/ 가 이 진도를 읽는다.
// 전부 시험 스위치(?lab=contract) 뒤에서만 돈다.

/** 계약에 쓸 수 있는 종류(chess.js 글자). 킹은 목표가 되지 않는다(§3.2-4). */
export const CONTRACT_TYPES = ['p', 'n', 'b', 'r', 'q'];
/** 판을 시작할 때 한쪽이 가진 수 — 수량은 이보다 클 수 없다. */
export const START_COUNT = { p: 8, n: 2, b: 2, r: 2, q: 1 };
/** 셋 가운데 이만큼을 먼저 채우면 계약 승리. */
export const CONTRACT_NEED = 2;

// 풀(11-18 전수 시뮬, docs/research/2026-11-18-set-pool/): 만들 수 있는 세트 92개 + 잭팟 후보 8개를 계약을 아는 AI 끼리
// 보통 단계로 100판씩 두고, 합격한 것을 다른 시드로 100판 더 두어 두 번 다 합격한 것만 넣었다.
//   기준: 반수 중앙 15~34 · p90 ≤ 46 · 결정 판의 백 비율 0.38~0.62 · 계약으로 끝난 비율 ≥ 0.85 · 목표별 쓰임 ≥ 0.25
//   p2nb 18~19수 ← 첫 판 세트 · p3nb 23~24 · pn2b 18 · p2n2b 26 · pbr 23 · p2br 26 · pbq 24~27 · p2bq 23~24 · nbr 23~25
// 한 번만 합격해 뺀 것: p2n2b2 · p2n2q · p3br · p3n2b · p3nq (둘째 시드에서 48수 제한까지 가는 판이 많았다).
// 나머지 78개는 길거나(70) 계약으로 안 끝나거나(66) 장식 목표가 있거나(39) 기울거나(7) 짧았다(6) — TABLE-7000-normal.md.
// 잭팟(세 칸이 다 같은 말): 「미어캣 3마리를 먼저」(칸 ×1 · ×2 를 차례로 채운다)만 판이 됐다 — 22~23수, 백 0.48~0.52, 무승부 0.
//   캥거루·판다·코뿔소 둘 잡기는 32~62% 가 무승부, 미어캣 둘은 12수에 흑으로 기울고(0.36), 넷은 48수 제한에 걸린다.
const NORMAL_WEIGHT = 6;
export const CONTRACT_SETS = [
  { id: 'p2nb', goals: [{ type: 'p', count: 2 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'p3nb', goals: [{ type: 'p', count: 3 }, { type: 'n', count: 1 }, { type: 'b', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'pn2b', goals: [{ type: 'p', count: 1 }, { type: 'n', count: 2 }, { type: 'b', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'p2n2b', goals: [{ type: 'p', count: 2 }, { type: 'n', count: 2 }, { type: 'b', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'pbr', goals: [{ type: 'p', count: 1 }, { type: 'b', count: 1 }, { type: 'r', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'p2br', goals: [{ type: 'p', count: 2 }, { type: 'b', count: 1 }, { type: 'r', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'pbq', goals: [{ type: 'p', count: 1 }, { type: 'b', count: 1 }, { type: 'q', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'p2bq', goals: [{ type: 'p', count: 2 }, { type: 'b', count: 1 }, { type: 'q', count: 1 }], weight: NORMAL_WEIGHT },
  { id: 'nbr', goals: [{ type: 'n', count: 1 }, { type: 'b', count: 1 }, { type: 'r', count: 1 }], weight: NORMAL_WEIGHT },
  // 잭팟 다섯: 여덟 판에 한 판쯤(가중치 8/62 ≈ 13%). 보상은 contractGame.js 의 JACKPOT_COIN_MULT 와 카드 층.
  { id: 'j-p3', goals: [{ type: 'p', count: 1 }, { type: 'p', count: 2 }, { type: 'p', count: 1 }], weight: 2 },
  // 조커 잭팟(사용자 제안): 왕관의 첫 보석은 조커 ★ 가 채워 준다 — 그 동물 하나만 먼저 잡으면 왕관 완성.
  //   두 시드 100판씩: 캥거루 13수 · 백 0.60~0.67(먼저 두는 쪽이 유리) · 계약 종료 0.95~0.98 / 판다 25~28수 · 백 0.42~0.46 · 계약 종료 0.85~0.88.
  { id: 'j-n', joker: true, goals: [{ type: 'n', count: 1 }, { type: 'n', count: 1 }, { type: 'n', count: 1 }], weight: 2 },
  { id: 'j-b', joker: true, goals: [{ type: 'b', count: 1 }, { type: 'b', count: 1 }, { type: 'b', count: 1 }], weight: 2 },
  // 코뿔소 · 호랑이 잭팟(사용자 결정, 11-18 밤): 합격선 밖인 줄 알고 넣었다 — 계약을 아는 AI 끼리는 코뿔소 44% · 호랑이 62% 가
  // 48수 제한까지 가서 비긴다(AI 가 지켜 낸다). 그래서 다른 잭팟의 절반만 나온다(각 1/62 ≈ 1.6%). 호랑이는 판에 하나뿐이라 조커가 꼭 있어야 한다.
  { id: 'j-r', joker: true, goals: [{ type: 'r', count: 1 }, { type: 'r', count: 1 }, { type: 'r', count: 1 }], weight: 1 },
  { id: 'j-q', joker: true, goals: [{ type: 'q', count: 1 }, { type: 'q', count: 1 }, { type: 'q', count: 1 }], weight: 1 }
];
/** 첫 두 판은 이 세트로 고정해 규칙을 익힌다(§2.3). */
export const FIRST_GAMES_SET = 'p2nb';
export const FIRST_GAMES = 2;

export const contractById = (id) => CONTRACT_SETS.find((s) => s.id === id) || null;

/** 잭팟 세트: 세 칸이 다 같은 종류(11-18). 그 종류를 먼저 두 칸만큼 잡는 사냥 판이다. */
export const isJackpot = (set) => Boolean(set?.goals?.length === 3 && set.goals.every((g) => g.type === set.goals[0].type));

/**
 * 세트가 규칙에 맞는가: 목표 셋, 킹 없음, 수량이 시작 수 이하, 종류는 셋 다 다르거나 셋 다 같다(잭팟).
 * 잭팟은 두 칸을 채울 만큼의 말이 판에 있어야 한다. 맞으면 null, 아니면 이유.
 */
export function contractProblem(set) {
  const goals = set?.goals;
  if (!Array.isArray(goals) || goals.length !== 3) return '목표는 셋이어야 한다';
  const jackpot = isJackpot(set);
  const seen = new Set();
  for (const g of goals) {
    if (!CONTRACT_TYPES.includes(g.type)) return `목표가 될 수 없는 종류: ${g.type}`;
    if (seen.has(g.type) && !jackpot) return `같은 종류가 두 번: ${g.type}`;
    seen.add(g.type);
    if (!Number.isInteger(g.count) || g.count < 1 || g.count > START_COUNT[g.type]) return `채울 수 없는 수량: ${g.type}×${g.count}`;
  }
  if (set.joker && !jackpot) return '조커는 잭팟 세트에만 쓴다';
  if (set.joker) return null;   // 조커가 첫 칸을 채운다 — 둘째 칸 하나만 채우면 되고, 그 수량은 위에서 봤다
  // 잭팟은 앞의 두 칸을 차례로 채운다 — 그만큼의 말이 판에 있어야 한다
  if (jackpot && goals[0].count + goals[1].count > START_COUNT[goals[0].type]) return `잭팟을 채울 만큼의 말이 없다: ${goals[0].type}×${goals[0].count + goals[1].count}`;
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

/**
 * 진도: 색마다 목표별로 잡은 수(요구 수량에서 멈춘다)와 채운 목표 수.
 * 조커 세트(`joker`, 11-18)는 양쪽 다 첫 칸이 조커 보석으로 미리 차 있다 — 하나만 더 채우면 왕관이 완성된다(「먼저 하나만 잡으면 승리」).
 */
const emptySide = (set) => (set.joker
  ? { counts: set.goals.map((g, i) => (i === 0 ? g.count : 0)), done: 1 }
  : { counts: set.goals.map(() => 0), done: 0 });

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
    const side = sides[m.color];
    // 그 종류의 목표 가운데 아직 덜 찬 첫 칸에 센다. 잭팟 세트(같은 종류 셋)는 칸을 차례로 채운다.
    // 다 찼으면 더 잡아도 늘지 않는다(§2.1).
    const gi = set.goals.findIndex((g, k) => g.type === m.captured && side.counts[k] < g.count);
    if (gi < 0) continue;
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
