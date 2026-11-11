// 섬 페이스 시뮬 (원본 docs/research/agent-rounds/2026-10-31-town-survey/island_sim.mjs 를 DR-3 에 맞춰 옮김, 2026-11-11).
// 실제 chess.js 판(무작위·잡기 선호 봇) → 카드(src/cards/economy.js) → 섬 정산(src/village/economy.js settleGame) 그대로.
// 봇이 사람은 아니다 — 경제의 모양을 잰다.
//   node tools/island_sim.mjs [회 수=60] [base|decor] [--json out.json]
//   base  = 소품을 사도 놓지 않는다(손님 없음, DR-3 전과 같은 흐름)
//   decor = 산 소품·라이벌 방문 선물 소품을 빈 칸에 놓고, 판마다 섬에 들러 손님 선물을 모아 받는다(DR-3)
// 매대 정책은 spare(다음 건물 값을 남기고 남는 도토리로만 산다 — shelfReserve 와 같은 뜻).
// 잴 것: 8채 완성 판 수(중앙값·p90), 도토리 수입 중 손님 선물 몫, 20판째 꾸밈 점수·매대 레벨·놓인 소품, 손님 도감 종류 수.
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { awardCard, consolationCard, convertOverflow, mergeCard, mergeList, newCollection } from '../src/cards/economy.js';
import {
  BUILDINGS, KIND_ORDER, PROPS, PROP_PRICE, buildBlocked, buyProp, collectGifts, decorScore, moveIn, newVillage, placeProp,
  reconcileTenants, settleGame, shelfLevel, startBuild, tenantBlocked, tenantRarity, tickVillage
} from '../src/village/economy.js';

const args = process.argv.slice(2);
const RUNS = Number(args.find((a) => /^\d+$/.test(a)) || 60);
const MODE = args.includes('decor') ? 'decor' : 'base';
const jsonAt = args.indexOf('--json');
const GAMES = 45;
const TYPE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen' };
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const SQUARES = ['c3', 'f3', 'c6', 'f6', 'd4', 'e5', 'b5', 'g4'];
const RIVALS = [{ id: 'picnic', visitsFor: 'shelter' }, { id: 'bamboo_band', visitsFor: 'market' }, { id: 'acorn_court', visitsFor: 'spring' }];
const FREE = [];
for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) FREE.push(`${f}${r}`);

function choose(chess, skill) {
  const moves = chess.moves({ verbose: true });
  if (Math.random() < skill) {
    let best = null;
    let top = 0;
    for (const m of moves) {
      const s = (m.san.endsWith('#') ? 100 : 0) + (m.captured ? VALUE[m.captured] : 0);
      if (s > top) { top = s; best = m; }
    }
    if (best) return best;
  }
  return moves[Math.floor(Math.random() * moves.length)];
}
function playGame(mine, theirs, col) {
  const chess = new Chess();
  const moves = [];
  let got = 0;
  while (!chess.isGameOver() && moves.length < 160) {
    const white = chess.turn() === 'w';
    const m = chess.move(choose(chess, white ? mine : theirs));
    moves.push(m);
    if (white && m.captured) { awardCard(col, TYPE[m.captured], Math.random()); got += 1; }
  }
  const won = chess.isCheckmate() && chess.turn() === 'b';
  const lost = chess.isCheckmate() && chess.turn() === 'w';
  if (won) awardCard(col, 'king', Math.random());
  else if (!got) consolationCard(col, Math.random());
  while (mergeList(col).length) { const { animal, rarity } = mergeList(col)[0]; mergeCard(col, animal, rarity); }
  convertOverflow(col);
  col.games += 1;
  return { moves, result: won ? 'win' : lost ? 'loss' : 'draw' };
}
function shop(v, reserve) {
  for (let i = 0; i < v.shelf.slots.length; i++) {
    const slot = v.shelf.slots[i];
    const price = PROP_PRICE[PROPS[slot.kind]?.tier] ?? Infinity;
    while (slot.stock > 0 && v.coins - price >= reserve && !buyProp(v, i)) { /* bought one */ }
  }
}
const nextCost = (v) => { const k = KIND_ORDER.find((x) => !v.built.some((b) => b.kind === x)); return k ? BUILDINGS[k].cost : 0; };
function tidy(v, col) {
  reconcileTenants(v, col);
  for (const b of [...v.built].sort((a, c) => BUILDINGS[c.kind].minRarity - BUILDINGS[a.kind].minRarity)) {
    if (b.tenant) continue;
    const ids = Object.keys(col.cards).filter((id) => col.cards[id] > 0).sort((a, c) => tenantRarity(a) - tenantRarity(c));
    const id = ids.find((x) => !tenantBlocked(v, col, b.id, x));
    if (id) moveIn(v, col, b.id, id);
  }
  const kind = KIND_ORDER.find((k) => !v.built.some((b) => b.kind === k));
  if (kind && !buildBlocked(v, kind, SQUARES[v.built.length])) startBuild(v, kind, SQUARES[v.built.length]);
}
// Props go on free squares away from the building plots (the bot keeps its eight plots clear).
function placeAll(v) {
  for (const kind of Object.keys(v.stash)) {
    while (v.stash[kind] > 0) {
      const sq = FREE.find((s) => !SQUARES.includes(s) && !v.built.some((b) => b.sq === s) && !v.decor.some((d) => d.sq === s));
      if (!sq || placeProp(v, kind, sq)) break;
    }
  }
}

function run(mine, theirs) {
  const v = newVillage();
  const col = newCollection();
  let play = 0, guest = 0, at20 = null, done = null;
  for (let g = 1; g <= GAMES; g++) {
    tidy(v, col);
    shop(v, nextCost(v));
    if (MODE === 'decor') placeAll(v);
    const { moves, result } = playGame(mine, theirs, col);
    const before = v.coins;
    settleGame(v, { moves, color: 'w', result });
    play += v.coins - before;
    // Opening the island after the game: visitors (one prop every few games), and gifts collected.
    tickVillage(v, RIVALS, g);
    if (MODE === 'decor') { const c = collectGifts(v); guest += c.acorns; placeAll(v); }
    if (g === 20) at20 = { score: decorScore(v), shelf: shelfLevel(v), props: v.decor.filter((d) => PROPS[d.kind]).length, kinds: Object.keys(v.guestBook || {}).length };
    if (!done && KIND_ORDER.every((k) => v.built.some((b) => b.kind === k && b.ready))) done = g;
  }
  return { done: done ?? GAMES + 1, guestShare: play + guest ? guest / (play + guest) : 0, guestPerGame: guest / GAMES, at20 };
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const p90 = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.9)];
const out = { runs: RUNS, mode: MODE, profiles: [] };
for (const [label, mine, theirs] of [['strong', 0.8, 0.3], ['even', 0.5, 0.5], ['weak', 0.25, 0.7]]) {
  const rows = Array.from({ length: RUNS }, () => run(mine, theirs));
  const a20 = rows.map((r) => r.at20).filter(Boolean);
  const prof = {
    label, done: { median: median(rows.map((r) => r.done)), p90: p90(rows.map((r) => r.done)), unfinished: rows.filter((r) => r.done > GAMES).length },
    guestShare: +median(rows.map((r) => r.guestShare)).toFixed(3), guestPerGame: +median(rows.map((r) => r.guestPerGame)).toFixed(2),
    at20: { score: median(a20.map((x) => x.score)), shelf: median(a20.map((x) => x.shelf)), props: median(a20.map((x) => x.props)), guestKinds: median(a20.map((x) => x.kinds)) }
  };
  out.profiles.push(prof);
  console.log(`${label} (${mine} vs ${theirs}, ${RUNS}회, ${MODE}): 8채 완성 중앙값 ${prof.done.median}판 · p90 ${prof.done.p90}${prof.done.unfinished ? ` · 못 끝냄 ${prof.done.unfinished}` : ''} · 손님 몫 ${(100 * prof.guestShare).toFixed(1)}% · 판당 손님 도토리 ${prof.guestPerGame} · 20판째 점수 ${prof.at20.score} 매대 Lv${prof.at20.shelf} 소품 ${prof.at20.props} 손님 종류 ${prof.at20.guestKinds}`);
}
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(out, null, 1));
