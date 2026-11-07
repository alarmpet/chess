// 라이벌 = 난이도(재미 계획서 FN-2, 2026-11-07). 새 숫자 대신 라이벌을 고르면 단계가 정해지고, 라이벌 카드에 단계와 성격 한 줄이 보인다.
// 숨긴 고무줄은 없다(계획서 §3): 판 중에는 세기가 바뀌지 않고, 바꿀 때는 묻는다.
//  - 첫 판들: 라이벌 없는 자유 대국이 처음 FIRST_EASY_GAMES 판은 쉬움, 화면에 그렇다고 쓴다.
//  - 연패: STREAK 판 연속 지면 한 단계 쉬운 라이벌을 권한다(누르면 바뀜, 아니면 그대로).
//  - 쉬움에서 이기면 한 단계 위 라이벌을 권한다.
// 화면 없이 순수 함수. 세기 값은 tools/rival_ladder.mjs 측정으로 고른다(docs/perf/2026-11-07-rival-ladder.txt).

export const STAGES = ['easy', 'normal', 'hard'];
export const STAGE_NAME = { easy: { ko: '쉬움', en: 'Easy' }, normal: { ko: '보통', en: 'Normal' }, hard: { ko: '어려움', en: 'Hard' } };
export const FIRST_EASY_GAMES = 3;
export const STREAK = 3;

/**
 * 자유 대국의 AI 세기. 첫 판들은 쉬움, 그 뒤 보통. 값은 팩 라이벌의 같은 단계와 같다(측정 2026-11-07, 후보당 40판):
 * 약한 플레이어(쉬움 봇) 승률 — 쉬움(d1·실수 0.3) 33% · 보통(d1·실수 0.1) 20% · 어려움(d2·실수 0.1) 3%.
 * 대등한 플레이어(보통 봇) — 95% · 75% · 38%. 예전 자유 대국(d2·실수 0.1)은 이제 「어려움」(도토리 궁정)이다.
 */
export const FREE_PLAY = {
  easy: { search: 'easy', mistake: 0.3, stage: 'easy' },
  normal: { search: 'easy', mistake: 0.1, stage: 'normal' }
};

/** 끝낸 판 수(카드 도감의 games)로 자유 대국 세기를 고른다. */
export function freePlayFor(gamesDone) {
  return (Number(gamesDone) || 0) < FIRST_EASY_GAMES ? FREE_PLAY.easy : FREE_PLAY.normal;
}

/** 무료 되감기(FN-3): 첫 FREE_REWIND_GAMES 판과 연습 단계(쉬움)에서는 판마다 되감기 1번. */
export const FREE_REWIND_GAMES = 5;
export function freeRewind(gamesDone, stage) {
  return (Number(gamesDone) || 0) < FREE_REWIND_GAMES || stage === 'easy';
}

/** 이번 판 상대의 단계: 라이벌이면 그 단계, 아니면 자유 대국(판 수로). 연습 단계 = 'easy'. */
export function opponentStage(gamesDone, rival) {
  return rival ? rival.stage || 'normal' : freePlayFor(gamesDone).stage;
}

const rank = (stage) => Math.max(0, STAGES.indexOf(stage));

/** 판 기록에서 끝에 이어진 패배 수(기권 포함). 무승부·승리에서 끊긴다. */
export function lossStreak(log) {
  let n = 0;
  const games = (Array.isArray(log) ? log : []).filter((e) => e && e.type === 'game');
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i].result !== 'loss') break;
    n++;
  }
  return n;
}

/**
 * 판이 끝난 뒤 권할 상대. `stage` 는 방금 둔 상대의 단계, `rivals` 는 [{id, stage}].
 * 연패 STREAK 이상 → 더 쉬운 라이벌 중 가장 센 것(없으면 null). 쉬움 단계에서 이김 → 한 단계 위 라이벌 중 가장 쉬운 것.
 */
export function suggestAfter({ result, streak = 0, stage = 'normal', rivalId = null, rivals = [] }) {
  const staged = rivals.filter((r) => r && r.id && STAGES.includes(r.stage) && r.id !== rivalId);
  if (result === 'loss' && streak >= STREAK) {
    const easier = staged.filter((r) => rank(r.stage) < rank(stage)).sort((a, b) => rank(b.stage) - rank(a.stage));
    return easier.length ? { kind: 'easier', rivalId: easier[0].id, stage: easier[0].stage } : null;
  }
  if (result === 'win' && stage === 'easy') {
    const up = staged.filter((r) => rank(r.stage) === rank(stage) + 1);
    return up.length ? { kind: 'harder', rivalId: up[0].id, stage: up[0].stage } : null;
  }
  return null;
}
