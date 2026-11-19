// 끝까지 키우기 시뮬(2026-11-16): 아틀란티스 섬과 캐릭터(말의 외형·카드)가 「끝」에 닿는 데 몇 판이 드는가.
// island_sim.mjs 와 같은 판(실제 chess.js, 무작위·잡기 선호 봇) → 카드(src/cards/economy.js) → 섬 정산(src/village/economy.js) 그대로.
// 사람이 아니라 봇이다. 사람은 이기는 판이 다르고, 쓰다듬기·소품 놓기를 덜 할 수도 더 할 수도 있다 — 경제의 모양을 잰다.
//   node tools/endgame_sim.mjs [회 수=20] [판 수=500] [strong|even|weak] [--days N(하루에 두는 판, 기본 4)] [--json out.json] [--save save.json]
// 봇이 하는 일(판마다): 건물 짓기 · 주민 넣기 · 공방 받기와 만들기 · 매대 · 소품 놓기 · 판 · 정산 · 손님 선물 받기 ·
// 하루가 바뀌면 쓰다듬기 10번(다음 외형 단계가 가장 가까운 역할부터) · 섬이 끝나면 새 섬.
// 잴 것(처음 닿은 판): 섬 쪽 — 첫 섬 완성, 한 섬의 8채 모두 3단계, 매대 Lv5, 꾸밈 점수 Lv5, 손님 6종, 공방 소품 7종 다 만들어 봄.
//                     캐릭터 쪽 — 내 편 여섯 역할 각각 「별빛」(가장 아끼는 말 하트 60), 여섯 역할 모두 별빛, 16마리 모두 별빛,
//                                  카드 도감 24/24, 영웅 카드 6/6.
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { ANIMALS, albumProgress, awardCard, cardId, consolationCard, convertOverflow, mergeCard, mergeList, newCollection } from '../src/cards/economy.js';
import {
  BUILDINGS, KIND_ORDER, LEVEL_MAX, PROPS, PROP_PRICE, buildBlocked, buyProp, collectGifts, decorScore, earnedLooks, islandDone, moveIn, newVillage, pet,
  placeProp, reconcileTenants, buildingCost, scoreLevel, settleGame, shelfLevel, squareTaken, startBuild, startNewIsland, tenantBlocked, tenantRarity, tickVillage, GUESTS
} from '../src/village/economy.js';
import { claimWorkshop, craftCost, craftProp, workshopOffered } from '../src/village/workshop.js';
import { THEMES, finishArch, nextChoices } from '../src/village/archipelago.js';

const args = process.argv.slice(2);
const nums = args.filter((a) => /^\d+$/.test(a)).map(Number);
const RUNS = nums[0] || 20;
const GAMES = nums[1] || 500;
const PROFILE = ['strong', 'even', 'weak'].find((p) => args.includes(p)) || 'even';
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PER_DAY = Number(opt('--days', 4));
// 군도(AR-1 ~ AR-3, 2026-11-16): --arch 면 섬이 끝나는 대로 다음 섬(값 곡선·섬 규칙·특산물은 게임 코드 그대로 — economy.js · archipelago.js).
// 설계 때는 「--arch <배율>」로 값 곡선을 바꿔 가며 쟀다(0 · 0.15 · 0.3, 결과 arch-even-*.json). 이제 배율은 ARCH_COST_STEP 하나다.
// --no-gifts 는 특산물을 끈다(AR-3 의 효과를 따로 보려고). 봇은 고를 수 있는 섬 가운데 가진 카드가 가장 많은 동물의 섬을 고른다.
const ARCH = args.includes('--arch') ? true : null;
if (args.includes('--no-gifts')) for (const t of Object.values(THEMES)) t.gift = null;
const setCosts = () => {};
const SKILL = { strong: [0.8, 0.3], even: [0.5, 0.5], weak: [0.25, 0.7] }[PROFILE];
const TYPE = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen' };
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const SQUARES = ['c3', 'f3', 'c6', 'f6', 'd4', 'e5', 'b5', 'g4'];
const RIVALS = [{ id: 'picnic', visitsFor: 'shelter' }, { id: 'bamboo_band', visitsFor: 'market' }, { id: 'acorn_court', visitsFor: 'spring' }];
const FREE = [];
for (const f of 'abcdefgh') for (let r = 1; r <= 8; r++) FREE.push(`${f}${r}`);
const ROLES = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
const SLOTS = [];
for (const f of 'abcdefgh') SLOTS.push(`w_${f}1`, `w_${f}2`);
const CRAFTABLE = Object.keys(PROPS).filter((k) => craftCost(k));
const DAY = 86400000;

function choose(chess, skill) {
  const moves = chess.moves({ verbose: true });
  if (Math.random() < skill) {
    let best = null; let top = 0;
    for (const m of moves) { const s = (m.san.endsWith('#') ? 100 : 0) + (m.captured ? VALUE[m.captured] : 0); if (s > top) { top = s; best = m; } }
    if (best) return best;
  }
  return moves[Math.floor(Math.random() * moves.length)];
}
function playGame(col) {
  const chess = new Chess();
  const moves = [];
  let got = 0;
  while (!chess.isGameOver() && moves.length < 160) {
    const white = chess.turn() === 'w';
    const m = chess.move(choose(chess, white ? SKILL[0] : SKILL[1]));
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
  return { moves, result: won ? 'win' : lost ? 'loss' : 'draw', plies: moves.length };
}
const nextCost = (v) => { const k = KIND_ORDER.find((x) => !v.built.some((b) => b.kind === x)); return k ? buildingCost(v, k) : 0; };
// 고를 섬: 가진 카드(주민)가 가장 많은 동물의 섬
const pickTheme = (v, col) => nextChoices(v.arch).sort((a, b) => count(col, THEMES[b].animal) - count(col, THEMES[a].animal))[0];
const count = (col, animal) => Object.entries(col.cards).filter(([id, n]) => id.startsWith(animal + '_') && n > 0).length;
function tidy(v, col) {
  reconcileTenants(v, col);
  for (const b of [...v.built].sort((a, c) => BUILDINGS[c.kind].minRarity - BUILDINGS[a.kind].minRarity)) {
    if (b.tenant) continue;
    const ids = Object.keys(col.cards).filter((id) => col.cards[id] > 0).sort((a, c) => tenantRarity(c) - tenantRarity(a));
    const id = ids.find((x) => !tenantBlocked(v, col, b.id, x));
    if (id) moveIn(v, col, b.id, id);
  }
  const kind = KIND_ORDER.find((k) => !v.built.some((b) => b.kind === k));
  if (kind && !buildBlocked(v, kind, SQUARES[v.built.length])) startBuild(v, kind, SQUARES[v.built.length]);
}
function shop(v) {
  for (let i = 0; i < v.shelf.slots.length; i++) {
    const slot = v.shelf.slots[i];
    const price = PROP_PRICE[PROPS[slot.kind]?.tier] ?? Infinity;
    while (slot.stock > 0 && v.coins - price >= nextCost(v) && !buyProp(v, i)) { /* bought */ }
  }
}
function placeAll(v) {
  for (const kind of Object.keys(v.stash)) {
    while (v.stash[kind] > 0) {
      const sq = FREE.find((s) => !SQUARES.includes(s) && !squareTaken(v, s));
      if (!sq || placeProp(v, kind, sq)) break;
    }
  }
}
// 쓰다듬기: 다음 외형 단계까지 가장 적게 남은 역할의, 그 역할에서 가장 아끼는 말
function petDay(v, now) {
  for (let n = 0; n < 10; n++) {
    const looks = earnedLooks(v.hearts).w;
    const role = ROLES.filter((r) => looks[r].next).sort((a, b) => looks[a].next.need - looks[b].next.need)[0];
    const pool = role ? SLOTS.filter((s) => roleOf(s) === role) : SLOTS.filter((s) => (v.hearts[s] || 0) < 60);
    if (!pool.length) return;
    const slot = pool.sort((a, b) => (v.hearts[b] || 0) - (v.hearts[a] || 0))[0];
    if (!pet(v, slot, now)) return;
  }
}
const roleOf = (slot) => (slot[3] === '2' ? 'pawn' : { a: 'rook', b: 'knight', c: 'bishop', d: 'queen', e: 'king', f: 'bishop', g: 'knight', h: 'rook' }[slot[2]]);

function run() {
  setCosts(1);
  const v = newVillage();
  const col = newCollection();
  const hit = {};
  const mark = (key, g) => { if (hit[key] == null) hit[key] = g; };
  const craftedKinds = new Set();
  let plies = 0; let wins = 0; let islands = 1; let lv3Island = false;
  const t0 = Date.UTC(2026, 10, 16, 9);
  let day = -1;
  for (let g = 1; g <= GAMES; g++) {
    const now = t0 + Math.floor((g - 1) / PER_DAY) * DAY + ((g - 1) % PER_DAY) * 600000;
    const today = Math.floor((g - 1) / PER_DAY);
    if (today !== day) { day = today; petDay(v, now); }
    if (ARCH !== null) {
      if (islandDone(v) && nextChoices(v.arch).length) { startNewIsland(v, pickTheme(v, col)); islands += 1; }
      else if (islandDone(v) && finishArch(v.arch, v)) mark('archDone', g);
    }
    else if (islandDone(v) && v.built.every((b) => (b.level || 0) >= LEVEL_MAX)) { startNewIsland(v); islands += 1; }
    else if (ARCH === null && islandDone(v) && g - (hit[`island${islands}`] ?? g) > 30) { startNewIsland(v); islands += 1; }   // 3단계를 기다리다 30판이 지나면 다음 섬
    tidy(v, col);
    if (workshopOffered(v)) claimWorkshop(v, (sq) => squareTaken(v, sq) || SQUARES.includes(sq));
    if (v.workshop) {
      // 모으는 사람처럼: 아직 안 만들어 본 것만, 싼 것부터 하나씩. 다 만들어 본 뒤에는 부품이 되는 만큼 아무거나.
      // (첫 판은 만들어 본 흔한 것을 판마다 또 만들어 부품을 다 써 버려서, 희귀(부품 12)를 500판 동안 한 번도 못 만들었다 — 봇의 결함)
      const fresh = CRAFTABLE.filter((k) => !craftedKinds.has(k)).sort((a, b) => craftCost(a).parts - craftCost(b).parts);
      if (fresh.length) { if (!craftProp(v, fresh[0], { reserve: nextCost(v) })) craftedKinds.add(fresh[0]); }
      else for (const kind of CRAFTABLE) while (!craftProp(v, kind, { reserve: nextCost(v) })) { /* made one */ }
    }
    shop(v);
    placeAll(v);
    const { moves, result, plies: p } = playGame(col);
    plies += p; if (result === 'win') wins += 1;
    settleGame(v, { moves, color: 'w', result, now });
    tickVillage(v, RIVALS, now);
    collectGifts(v);
    placeAll(v);
    // 섬 쪽
    if (islandDone(v)) mark(`island${islands}`, g);
    if (islandDone(v) && v.built.every((b) => (b.level || 0) >= LEVEL_MAX)) { mark('islandMax', g); lv3Island = true; }
    if (shelfLevel(v) >= 5) mark('shelf5', g);
    if (scoreLevel(decorScore(v)) >= 5) mark('decor5', g);
    if (Object.keys(v.guestBook || {}).length >= Object.keys(GUESTS).length) mark('guests6', g);
    if (craftedKinds.size >= CRAFTABLE.length) mark('craftAll', g);
    // 캐릭터 쪽
    const looks = earnedLooks(v.hearts).w;
    for (const r of ROLES) if (looks[r].stage === 'starlit') mark(`starlit_${r}`, g);
    if (ROLES.every((r) => looks[r].stage === 'starlit')) mark('roles6', g);
    if (SLOTS.every((s) => (v.hearts[s] || 0) >= 60)) mark('all16', g);
    if (albumProgress(col).owned >= albumProgress(col).total) mark('album24', g);
    if (ANIMALS.every((a) => col.cards[cardId(a, 3)])) mark('hero6', g);
  }
  return { hit, islands, plies: plies / GAMES, winRate: wins / GAMES, lv3Island, v, col };
}

const median = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const p90 = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length * 0.9)] : null; };
const rows = Array.from({ length: RUNS }, run);
const KEYS = ['island1', 'island2', 'island3', 'island4', 'island5', 'island6', 'island7', 'archDone', 'islandMax', 'shelf5', 'decor5', 'guests6', 'craftAll',
  ...ROLES.map((r) => `starlit_${r}`), 'roles6', 'all16', 'album24', 'hero6'];
const out = { runs: RUNS, games: GAMES, profile: PROFILE, perDay: PER_DAY, plies: +median(rows.map((r) => r.plies)).toFixed(1), winRate: +median(rows.map((r) => r.winRate)).toFixed(2), islandsAtEnd: median(rows.map((r) => r.islands)), milestones: {} };
for (const k of KEYS) {
  const xs = rows.map((r) => r.hit[k] ?? null);
  out.milestones[k] = { median: median(xs), p90: p90(xs), reached: xs.filter((x) => x != null).length };
}
console.log(`${PROFILE} · ${RUNS}회 × ${GAMES}판 · 하루 ${PER_DAY}판 · 반수 중앙 ${out.plies} · 승률 ${out.winRate} · 끝에 섬 ${out.islandsAtEnd}개`);
for (const k of KEYS) { const m = out.milestones[k]; console.log(`  ${k.padEnd(16)} 중앙 ${m.median ?? '—'}판 · p90 ${m.p90 ?? '—'} · 닿은 회 ${m.reached}/${RUNS}`); }
const ji = args.indexOf('--json'); if (ji >= 0) writeFileSync(args[ji + 1], JSON.stringify(out, null, 1));
// 끝 상태 한 벌(중앙에 가까운 회)을 게임 저장 모양으로 남긴다 — 화면에 심어 「끝의 모습」을 찍는다
const si = args.indexOf('--save');
if (si >= 0) {
  const pick = rows.slice().sort((a, b) => (a.hit.roles6 ?? 1e9) - (b.hit.roles6 ?? 1e9))[Math.floor(rows.length / 2)];
  writeFileSync(args[si + 1], JSON.stringify({ village: pick.v, cards: pick.col }, null, 1));
}
