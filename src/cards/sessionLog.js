// 기록 보강(재미 계획서 FN-0, 2026-11-07): 한 판이 시작부터 다음 판까지 판 기록(`wildcrown.playlog.v1`)으로 다시 그려지게 한다.
// 판 기록에 새로 남기는 것: start(판 시작·이어 하기, 라이벌·진영·손과 뇌·번개 판), skill(정찰·되감기를 쓴 수), leave(판 도중 창을 닫음),
// quit(끝나지 않은 판을 두고 새 판 — 새 판 단추·이른 기권·진영 바꾸기·라이벌 고르기).
// 이미 있는 것: game(판 끝), pace(수·생각 시간). 이 파일은 그것들을 판 하나씩 묶어 「이야기」로 만든다 — 화면 없이 순수 함수.

/** 판이 끝나고 이 시간(초) 안에 다음 판을 시작해 한 수라도 두면 「한 판 더」로 센다. */
export const NEXT_GAP_S = 600;

/**
 * start 기록 한 줄. `d` 는 엔진의 gamestarted 사건 내용.
 * @param {any} d
 * @param {{ at?: string, handBrain?: string, blitz?: boolean, roles?: string | null }} [opts]
 */
export function startEntry(d, { at = new Date().toISOString(), handBrain = 'off', blitz = false, roles = null } = {}) {
  const e = { type: 'start', at, gameId: d.gameId, resumed: d.resumed || 0, rivalId: d.rivalId || null, color: d.color || null, handBrain, blitz: Boolean(blitz) };
  // 둘이 한 왕국(CO-1): 사람 둘이 뇌·손을 나눈 판이면 역할 바꾸기 방식('move' | 'game').
  if (handBrain === 'family' && roles) e.roles = roles;
  return e;
}

const sec = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 1000);

/**
 * 판 기록을 판 하나씩 묶는다. 판마다: 시작·이어 하기 횟수·창 닫음·기술 사용·끝(결과·기권·반수)·다음 판까지 간격.
 * `played` 는 플레이어가 한 수라도 둔 판(끝났거나, 이어 하기·창 닫음·기술 기록에 수가 있거나) — 열자마자 버린 판은 셈에서 뺀다.
 */
export function storyOf(log) {
  const games = [];
  const byId = new Map();
  const open = (e) => {
    const g = { gameId: e.gameId, at: e.at, rivalId: e.rivalId ?? null, color: e.color ?? null, handBrain: e.handBrain ?? null, blitz: e.blitz ?? null,
      roles: e.roles ?? null, coop: { handover: 0, oops: 0, highfive: 0 },
      resumes: 0, leaves: [], skills: [], quit: null, end: null, pace: null, maxPly: e.resumed || 0 };
    games.push(g);
    byId.set(e.gameId, g);
    return g;
  };
  for (const e of Array.isArray(log) ? log : []) {
    if (!e || typeof e !== 'object') continue;
    if (e.type === 'start') {
      const g = byId.get(e.gameId);
      if (g && e.resumed) { g.resumes += 1; g.maxPly = Math.max(g.maxPly, e.resumed); continue; }
      open(e);
      continue;
    }
    const g = e.gameId != null ? byId.get(e.gameId) : null;
    if (!g) continue;
    if (e.type === 'leave') { g.leaves.push({ at: e.at, ply: e.ply || 0 }); g.maxPly = Math.max(g.maxPly, e.ply || 0); }
    else if (e.type === 'quit') { g.quit = { at: e.at, ply: e.ply || 0 }; g.maxPly = Math.max(g.maxPly, e.ply || 0); }
    else if (e.type === 'coop') { if (e.kind in g.coop) g.coop[e.kind] += 1; }
    else if (e.type === 'skill') { g.skills.push({ kind: e.kind, ply: e.ply || 0 }); g.maxPly = Math.max(g.maxPly, e.ply || 0); }
    else if (e.type === 'game') {
      g.end = { at: e.at, result: e.result ?? null, resigned: Boolean(e.resigned), plies: e.plies || 0, seconds: e.seconds ?? null };
      g.maxPly = Math.max(g.maxPly, e.plies || 0);
    } else if (e.type === 'pace') g.pace = { mode: e.mode, moves: Object.keys(e.think || {}).length };
  }
  for (const g of games) {
    g.played = Boolean(g.end) || g.maxPly > 0;
    g.abandoned = g.played && !g.end;
  }
  for (const [i, g] of games.entries()) {
    // 다음 판: 이 판 뒤에 처음으로 플레이어가 수를 둔 판(끝난 판에서만 잰다).
    g.next = null;
    if (g.end) {
      const n = games.slice(i + 1).find((x) => x.played);
      if (n) g.next = { gameId: n.gameId, gapS: sec(g.end.at, n.at) };
    }
  }
  const played = games.filter((g) => g.played);
  const after = {};
  for (const g of played.filter((x) => x.end)) {
    const k = g.end.resigned ? 'resign' : g.end.result || 'none';
    after[k] = after[k] || { n: 0, next: 0 };
    after[k].n += 1;
    if (g.next && g.next.gapS <= NEXT_GAP_S) after[k].next += 1;
  }
  return {
    games: played,
    summary: {
      started: games.length, played: played.length, finished: played.filter((g) => g.end).length, abandoned: played.filter((g) => g.abandoned).length,
      leaves: played.reduce((s, g) => s + g.leaves.length, 0), quits: played.filter((g) => g.quit).length, resumes: played.reduce((s, g) => s + g.resumes, 0),
      skills: played.reduce((s, g) => s + g.skills.length, 0), nextAfter: after
    }
  };
}
