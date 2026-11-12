// 번개 판 블런더율(역동적 체스 DY-3, 2026-11-06): 판 기록의 `pace` 항목(수 목록·생각 시간·모드)을 읽어
// 플레이어 수마다 손실(그 국면 최선 점수 − 둔 수 점수, 탐색 2수)을 재고, 손실 ≥ 200(미어캣 두 개)이면 블런더로 센다.
// 모드별(번개/보통) 블런더율과 생각 시간 구간별 비율을 낸다. 계획서: 번개가 보통의 1.5배를 넘으면 10초를 15초로.
//   node tools/blunder_rate.mjs <판 기록 JSON 파일>     # 게임의 「기록 복사」로 받은 wildcrown.playlog.v1
//   node tools/blunder_rate.mjs --bots [판 수=20]        # 도구 점검: 봇 쉬움(블런더 많음)과 어려움을 같은 자로 잰다
import { readFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove, positionKey, rootScores } from '../src/rules/ai.js';

const BLUNDER = 200;

function review(entry) {
  const chess = new Chess();
  const rows = [];
  for (const [ply, san] of (entry.san || []).entries()) {
    const fen = chess.fen();
    const turn = chess.turn();
    const m = chess.move(san);
    if (!m) break;
    if (turn !== entry.color) continue;
    const scores = rootScores(fen);
    const played = scores.find((x) => x.from === m.from && x.to === m.to && (x.promotion || null) === (m.promotion || null));
    const loss = played ? scores[0].score - played.score : 0;
    rows.push({ loss, blunder: loss >= BLUNDER, thinkMs: entry.think?.[ply] ?? null });
  }
  return rows;
}

function summarise(entries) {
  const by = {};
  for (const e of entries) {
    const rows = review(e);
    const k = e.mode || 'normal';
    by[k] ||= { games: 0, moves: 0, blunders: 0, byThink: {} };
    by[k].games++;
    for (const r of rows) {
      by[k].moves++;
      if (r.blunder) by[k].blunders++;
      const band = r.thinkMs == null ? '?' : r.thinkMs <= 10000 ? '≤10초' : r.thinkMs <= 30000 ? '10~30초' : '30초+';
      by[k].byThink[band] ||= { moves: 0, blunders: 0 };
      by[k].byThink[band].moves++;
      if (r.blunder) by[k].byThink[band].blunders++;
    }
  }
  for (const v of Object.values(by)) v.rate = +(v.blunders / Math.max(1, v.moves)).toFixed(3);
  const ratio = by.blitz && by.normal ? +(by.blitz.rate / Math.max(0.001, by.normal.rate)).toFixed(2) : null;
  return { by, blitzOverNormal: ratio, verdict: ratio == null ? '두 모드 기록이 다 있어야 비교' : ratio > 1.5 ? '번개 10초 → 15초로' : '10초 유지' };
}

if (process.argv[2] === '--bots') {
  const n = Number(process.argv[3] || 20);
  let seed = 3131;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const entries = [];
  for (const [mode, level] of [['blitz', 'easy'], ['normal', 'hard']]) {
    for (let g = 0; g < n; g++) {
      const c = new Chess();
      const history = [];
      for (let ply = 0; ply < 80 && !c.isGameOver(); ply++) {
        const mv = chooseMove(c.fen(), { level: c.turn() === 'w' ? level : 'normal', history, rand });
        if (!mv) break;
        c.move(mv);
        history.push(positionKey(c.fen()));
      }
      entries.push({ type: 'pace', mode, color: 'w', san: c.history() });
    }
  }
  console.log(JSON.stringify({ note: '도구 점검: 「blitz」=봇 쉬움, 「normal」=봇 어려움(백만 잰다)', ...summarise(entries) }, null, 1));
} else {
  const log = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  console.log(JSON.stringify(summarise(log.filter((e) => e.type === 'pace')), null, 1));
}
