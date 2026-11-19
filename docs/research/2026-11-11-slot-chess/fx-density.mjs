// 조사용 후향 분석 2 (2026-11-12). 계약전 한 판에 「터뜨릴 순간」이 몇 번 오는지 센다 — 연출 예산의 근거.
// mission-audit.mjs 와 같은 시드·같은 AI(계약을 모른다)·같은 기보. 제품 규칙은 바꾸지 않는다.
// 멈춤: 계약 2개 선착 / 메이트 등 표준 종료 / 48반수 상한 가운데 먼저 오는 것.
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../../../src/rules/ai.js';
import { writeFileSync } from 'node:fs';

// 계약 세트: 종류별 필요 수량. 세 목표 가운데 NEED 개를 먼저 채우면 끝.
const SETS = {
  pnr_x1: { p: 1, n: 1, r: 1 },
  pnb_x1: { p: 1, n: 1, b: 1 },
  p2nb: { p: 2, n: 1, b: 1 } // 계획서의 첫 시제품 후보. 11-11 분석에서 재지 않았던 것
};
const NEED = 2, CAP = 48, N = 60, MAX = 160;
const done = (set, counts) => Object.entries(set).filter(([t, n]) => (counts[t] || 0) >= n).length;

const rows = [];
for (const level of ['easy', 'normal']) {
  for (let g = 0; g < N; g++) {
    let seed = 78123 + g * 13;
    const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const chess = new Chess(), history = [], moves = [];
    for (let ply = 0; ply < MAX && !chess.isGameOver(); ply++) {
      const pick = chooseMove(chess.fen(), { level, history, rand });
      if (!pick) break;
      const m = chess.move(pick);
      history.push(positionKey(chess.fen()));
      moves.push({ color: m.color, captured: m.captured || null, check: chess.isCheck(), mate: chess.isCheckmate() });
    }
    const per = {};
    for (const [id, set] of Object.entries(SETS)) {
      const counts = { w: {}, b: {} };
      const r = { stopPly: 0, reason: 'cap', winner: null, captures: 0, checks: 0, matchPointPlies: 0, leadChanges: 0, firstCapturePly: null, gaps: [], doneW: 0, doneB: 0 };
      let lead = 0, lastCap = 0;
      for (let i = 0; i < moves.length && i < CAP; i++) {
        const m = moves[i];
        r.stopPly = i + 1;
        if (m.captured) {
          counts[m.color][m.captured] = (counts[m.color][m.captured] || 0) + 1;
          r.captures++;
          if (r.firstCapturePly === null) r.firstCapturePly = i + 1;
          r.gaps.push(i + 1 - lastCap);
          lastCap = i + 1;
        }
        if (m.check) r.checks++;
        const dw = done(set, counts.w), db = done(set, counts.b);
        const now = Math.sign(dw - db);
        if (now !== 0 && lead !== 0 && now !== lead) r.leadChanges++;
        if (now !== 0) lead = now;
        r.doneW = dw; r.doneB = db;
        if (m.mate) { r.reason = 'mate'; r.winner = m.color; break; }
        if ((m.color === 'w' ? dw : db) >= NEED) { r.reason = 'contract'; r.winner = m.color; break; }
        if (dw === NEED - 1 || db === NEED - 1) r.matchPointPlies++;
        if (i === moves.length - 1) r.reason = 'standard-end';
      }
      per[id] = r;
    }
    rows.push({ level, g, per });
  }
  console.log('finished ' + level);
}

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null; };
const summary = {};
for (const level of ['easy', 'normal']) {
  summary[level] = {};
  for (const id of Object.keys(SETS)) {
    const rs = rows.filter((r) => r.level === level).map((r) => r.per[id]);
    const by = (k) => rs.map((r) => r[k]);
    const contract = rs.filter((r) => r.reason === 'contract');
    summary[level][id] = {
      games: rs.length,
      endedBy: { contract: contract.length, mate: rs.filter((r) => r.reason === 'mate').length, cap: rs.filter((r) => r.reason === 'cap').length, standardEnd: rs.filter((r) => r.reason === 'standard-end').length },
      whiteContractWins: contract.filter((r) => r.winner === 'w').length,
      stopPly: { median: q(by('stopPly'), 0.5), p90: q(by('stopPly'), 0.9) },
      captures: { median: q(by('captures'), 0.5), p90: q(by('captures'), 0.9), min: Math.min(...by('captures')) },
      checks: { median: q(by('checks'), 0.5), p90: q(by('checks'), 0.9) },
      firstCapturePly: { median: q(by('firstCapturePly').filter((x) => x !== null), 0.5) },
      pliesBetweenCaptures: { median: q(rs.flatMap((r) => r.gaps), 0.5), p90: q(rs.flatMap((r) => r.gaps), 0.9) },
      matchPointPlies: { median: q(by('matchPointPlies'), 0.5), p90: q(by('matchPointPlies'), 0.9) },
      gamesWithLeadChange: rs.filter((r) => r.leadChanges > 0).length
    };
  }
}
const report = { method: '120 deterministic standard-chess self-play trajectories (same seeds as mission-audit); AI does not know the contract; stop at 2-of-3 contract, mate/standard end, or 48 plies; post-hoc only', summary, rows };
writeFileSync(new URL('./fx-density.json', import.meta.url), JSON.stringify(report, null, 1));
console.log(JSON.stringify(summary, null, 1));
