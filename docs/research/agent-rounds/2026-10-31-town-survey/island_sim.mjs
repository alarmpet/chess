// Island pacing with the shipped rules: real chess.js games, src/cards/economy.js drops and src/village/economy.js settlement.
// The players are bots, so this measures the economy's shape, not how people play.
//   node docs/research/agent-rounds/2026-10-31-town-survey/island_sim.mjs [runs] [none|spare|greedy]
// The shelf policy: none never buys; spare buys only coins left over after the next building's cost; greedy buys every prop it can before building.
import { Chess } from 'chess.js';
import { awardCard, consolationCard, convertOverflow, mergeCard, mergeList, newCollection } from '../../../../src/cards/economy.js';
import { BUILDINGS, KIND_ORDER, PROPS, PROP_PRICE, buildBlocked, buyProp, moveIn, newVillage, reconcileTenants, settleGame, startBuild, tenantBlocked, tenantRarity } from '../../../../src/village/economy.js';

const RUNS = Number(process.argv[2] || 150);
const GAMES = 45;
const SHOP = process.argv[3] || 'none';
const TYPE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen' };
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const SQUARES = ['c3', 'f3', 'c6', 'f6', 'd4', 'e5', 'b5', 'g4'];

// `skill` is the chance of taking the best capture or mate on offer; otherwise the move is random.
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
    if (white && m.captured) {
      awardCard(col, TYPE[m.captured], Math.random());
      got += 1;
    }
  }
  const won = chess.isCheckmate() && chess.turn() === 'b';
  const lost = chess.isCheckmate() && chess.turn() === 'w';
  if (won) awardCard(col, 'king', Math.random());
  else if (!got) consolationCard(col, Math.random());
  while (mergeList(col).length) {
    const { animal, rarity } = mergeList(col)[0];
    mergeCard(col, animal, rarity);
  }
  convertOverflow(col);
  col.games += 1;
  return { moves, result: won ? 'win' : lost ? 'loss' : 'draw', captures: got };
}

// Props stay in the stash, so they never take a building's square.
function shop(v, reserve) {
  let spent = 0;
  for (let i = 0; i < v.shelf.slots.length; i++) {
    const slot = v.shelf.slots[i];
    const price = PROP_PRICE[PROPS[slot.kind]?.tier] ?? Infinity;
    while (slot.stock > 0 && v.coins - price >= reserve && !buyProp(v, i)) spent += price;
  }
  return spent;
}

function nextCost(v) {
  const kind = KIND_ORDER.find((k) => !v.built.some((b) => b.kind === k));
  return kind ? BUILDINGS[kind].cost : 0;
}

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

function run(mine, theirs) {
  const v = newVillage();
  const col = newCollection();
  const at = {};
  let idle = 0;
  let quests = 0;
  let kept = 0;
  let cards = 0;
  let spent = 0;
  for (let g = 1; g <= GAMES; g++) {
    if (SHOP === 'greedy') spent += shop(v, 0);
    tidy(v, col);
    if (SHOP === 'spare') spent += shop(v, nextCost(v));
    const { moves, result, captures } = playGame(mine, theirs, col);
    cards += captures;
    const r = settleGame(v, { moves, color: 'w', result });
    if (r.quest) { quests += 1; kept += r.quest.done ? 1 : 0; }
    for (const k of r.opened) at[k] = g;
    if (g <= 24 && !r.opened.length && !r.harvest.coins && !r.harvest.bread && !r.harvest.hearts) idle += 1;
    if (Object.keys(at).length === KIND_ORDER.length) { at.done = g; break; }
  }
  return { at, idle, quests, kept, cards, spent, props: Object.values(v.stash).reduce((a, b) => a + b, 0), coins: v.coins, games: at.done || GAMES };
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const p90 = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length * 0.9)];
for (const [label, mine, theirs] of [['strong', 0.8, 0.3], ['even', 0.5, 0.5], ['weak', 0.25, 0.7]]) {
  const rows = Array.from({ length: RUNS }, () => run(mine, theirs));
  console.log(`\n${label} (bot skill ${mine} vs ${theirs}, ${RUNS} runs, shelf ${SHOP})`);
  for (const k of [...KIND_ORDER, 'done']) {
    const xs = rows.map((r) => r.at[k] ?? GAMES + 1);
    console.log(`  ${k.padEnd(8)} median ${String(median(xs)).padStart(3)}  p90 ${String(p90(xs)).padStart(3)}${xs.filter((x) => x > GAMES).length ? `  unfinished ${xs.filter((x) => x > GAMES).length}` : ''}`);
  }
  const sum = (f) => rows.reduce((a, r) => a + f(r), 0);
  console.log(`  captures per game ${(sum((r) => r.cards) / sum((r) => r.games)).toFixed(1)}  idle games in first 24: ${(sum((r) => r.idle) / RUNS).toFixed(1)}  quests kept ${sum((r) => r.kept)}/${sum((r) => r.quests)}  coins left ${median(rows.map((r) => r.coins))}  props bought ${median(rows.map((r) => r.props))} for ${median(rows.map((r) => r.spent))}`);
}
