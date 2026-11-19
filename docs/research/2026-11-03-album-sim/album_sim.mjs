// Desire plan D7, step 2: how many games until the 24-slot album is full? Each simulated player replays games drawn at
// random from the bot games of one profile and is paid exactly as CardLayer pays: a card per capture into the pouch, the
// lion card for a mate, one comfort card when a game gave none, then the pouch joins the album and overflow turns to dust.
// The player merges every time a merge is possible (the fastest a player can go). Missions are left out, so a real
// player who completes missions is a little faster than this.
// Usage: node album_sim.mjs [runs] [now | before | win-lion]   (reads games-*.jsonl beside this file)
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newCollection, awardCard, checkCard, consolationCard, mergeList, mergeCard, convertOverflow, albumProgress, ANIMALS, RARITIES, cardId } from '../../../src/cards/economy.js';

const here = dirname(fileURLToPath(import.meta.url));
const runs = Number(process.argv[2] || 2000);
const MAX_GAMES = 2000;
const MARKS = [12, 18, 23, 24];

// Rule variants for the lion common slot, which no capture and no merge can give:
//   before     — the rules before D7 (only a game with no card at all pays a random common, the lion one time in six)
//   now        — the game's rule since D7: a game in which the player gave check pays the lion common (economy.js checkCard)
//   win-lion   — the rejected alternative: a won game pays the lion common card as well as the mate drop
const RULE = process.argv[3] || 'now';
function giveLionCommon(col) {
  const id = cardId('lion', 0);
  col.cards[id] = (col.cards[id] || 0) + 1;
  col.firstDone = true;
  col.sinceRare += 1;
  col.sinceHero += 1;
}

function playerRun(games, merges = true) {
  let col = newCollection();
  const at = {};
  let last = null;
  for (let g = 1; g <= MAX_GAMES; g++) {
    const game = games[Math.floor(Math.random() * games.length)];
    const work = JSON.parse(JSON.stringify(col));
    let got = 0;
    for (const type of game.captures) { awardCard(work, type, Math.random()); got++; }
    if (game.result === 'win') { awardCard(work, 'king', Math.random()); got++; }
    if (RULE === 'now' && game.checks > 0) { checkCard(work); got++; }
    if (RULE === 'win-lion' && game.result === 'win') { giveLionCommon(work); got++; }
    if (!got) consolationCard(work, Math.random());
    col = work;
    col.games += 1;
    convertOverflow(col);
    if (merges) {
      for (let m = mergeList(col)[0]; m; m = mergeList(col)[0]) mergeCard(col, m.animal, m.rarity);
    }
    const owned = albumProgress(col).owned;
    if (owned === 23 && !last) {
      for (const a of ANIMALS) for (let r = 0; r < RARITIES.length; r++) if (!col.cards[cardId(a, r)]) last = `${a}_${RARITIES[r]}`;
    }
    for (const n of MARKS) if (owned >= n && !at[n]) at[n] = g;
    if (owned === 24) return { at, last };
  }
  return { at, last };
}

const q = (xs, p) => xs[Math.min(xs.length - 1, Math.floor(p * xs.length))];
for (const file of readdirSync(here).filter((f) => /^games-.*\.jsonl$/.test(f)).sort()) {
  const games = readFileSync(join(here, file), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const wins = games.filter((g) => g.result === 'win').length;
  const caps = games.reduce((n, g) => n + g.captures.length, 0) / games.length;
  const checked = games.filter((g) => g.checks > 0).length;
  console.log(`\n## ${file} [${RULE}]: ${games.length} games, player wins ${wins}, gave check in ${checked}, ${caps.toFixed(1)} captures per game`);
  for (const merges of [true, false]) {
    const res = Array.from({ length: runs }, () => playerRun(games, merges));
    const line = MARKS.map((n) => {
      const xs = res.map((r) => r.at[n] ?? Infinity).sort((a, b) => a - b);
      return `${n}/24: median ${q(xs, 0.5)} (p10 ${q(xs, 0.1)}, p90 ${q(xs, 0.9)})`;
    }).join(' · ');
    console.log(`${merges ? 'merging' : 'no merges'} — ${line}`);
    if (merges) {
      const lastCount = {};
      for (const r of res) if (r.last) lastCount[r.last] = (lastCount[r.last] || 0) + 1;
      const top = Object.entries(lastCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round((100 * v) / runs)}%`);
      console.log(`last slot: ${top.join(', ')}`);
    }
  }
}
