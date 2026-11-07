// 층 판 수 · 곡물 상한 측정(2026-11-06, STATUS §2 DS-D7b · IE-130). 봇 판을 게임과 같은 정산 함수(village/economy.js
// settleGame)에 차례로 넣어, 몇 판째에 각 층이 열리는지 잰다.
//   외형 단계 — 한 역할의 가장 사랑받은 말이 하트 10(자람)·30(어른)·60(별빛 = 금테 표식). 여섯 역할 모두 별빛까지도.
//   섬 — 8채 모두 열림(섬 완성 사진). 건물은 「돈이 되면 다음 것」(KIND_ORDER 순, 한 번에 하나, 다음 판 끝에 열림),
//         **주민은 늘 있다고 가정**(카드 희귀도 조건 무시) — 하한이다.
//   라이벌 소품 — 라이벌별 승률(같은 봇 판)과 소품 수(이길 때마다 하나)로 기대 판 수.
//   곡물 — 판 끝마다 곡물이 상한 20 에 닿아 있던 판의 비율, 처음 닿은 판.
// 목표 층 도토리(미션·현상금·도장·퀘스트·반격·번개)는 넣지 않았다 — 정산 기본값만. 그래서 섬 판 수는 길게 나온다.
// 봇 판은 프로필마다 UNIQUE 판을 두고 정산 순서로 되풀이해 N 판을 만든다(어려움 탐색이 느려서).
//   node tools/layers_sim.mjs [정산 판 수=150] [라이벌 승률 판 수=20] [프로필 이름 일부(없으면 셋 다)] [고유 판 수=40]
import { Chess } from 'chess.js';
import { chooseMove, positionKey } from '../src/rules/ai.js';
import { BUILDINGS, GRAIN_MAX, KIND_ORDER, earnedLooks, islandDone, newVillage, settleGame, startBuild } from '../src/village/economy.js';
import { readFileSync } from 'node:fs';

const N = Number(process.argv[2] || 150);
const RIVAL_GAMES = Number(process.argv[3] || 20);
const ONLY = process.argv[4] || '';
const UNIQUE = Number(process.argv[5] || 40);
let seed = 8642;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const PROFILES = { '약함(쉬움)': { level: 'easy' }, '대등(보통)': { level: 'normal' }, '강함(어려움)': { level: 'hard' } };
const pack = JSON.parse(readFileSync(new URL('../public/packs/legend/pack.json', import.meta.url), 'utf8'));

function game(me, ai) {
  const c = new Chess();
  const history = [];
  for (let ply = 0; ply < 240 && !c.isGameOver(); ply++) {
    const mv = chooseMove(c.fen(), { ...(c.turn() === 'w' ? me : ai), history, rand });
    if (!mv) break;
    c.move(mv);
    history.push(positionKey(c.fen()));
  }
  const result = c.isCheckmate() ? (c.turn() === 'b' ? 'win' : 'loss') : 'draw';
  return { moves: c.history({ verbose: true }), result };
}

const SQUARES = [];
for (const r of [3, 4, 5, 2, 6, 1]) for (const f of 'cdefbgah') SQUARES.push(f + r);

const t0 = Date.now();
const out = { games: N, rivalGames: RIVAL_GAMES, profiles: {} };
for (const [name, me] of Object.entries(PROFILES)) {
  if (ONLY && !name.includes(ONLY)) continue;
  const pool = [];
  for (let i = 0; i < Math.min(UNIQUE, N); i++) pool.push(game(me, { level: 'normal' }));
  const v = newVillage();
  const firsts = {};
  let grainFull = 0;
  let wins = 0;
  for (let g = 1; g <= N; g++) {
    const { moves, result } = pool[(g - 1) % pool.length];
    if (result === 'win') wins++;
    settleGame(v, { moves, color: 'w', result, gameId: g, now: Date.UTC(2026, 10, 1) + g * 86400000 });
    // 주민은 늘 있다고 본다(하한).
    for (const b of v.built) if (b.ready && !b.tenant) b.tenant = `meerkat_${BUILDINGS[b.kind].minRarity}`;
    if (v.grain >= GRAIN_MAX) { grainFull++; firsts.grainFull ??= g; }
    const looks = earnedLooks(v.hearts).w;
    const stages = Object.values(looks).map((x) => x.stage);
    if (stages.includes('grown') || stages.includes('adult') || stages.includes('starlit')) firsts.grown ??= g;
    if (stages.includes('adult') || stages.includes('starlit')) firsts.adult ??= g;
    if (stages.includes('starlit')) firsts.starlitOne ??= g;
    if (stages.every((s) => s === 'starlit')) firsts.starlitAll ??= g;
    if (islandDone(v)) firsts.island ??= g;
    // 다음 건물: 돈이 되면 하나(게임처럼 한 번에 하나).
    const next = KIND_ORDER.find((k) => !v.built.some((b) => b.kind === k));
    if (next && v.coins >= BUILDINGS[next].cost) startBuild(v, next, SQUARES.find((sq) => !v.built.some((b) => b.sq === sq) && sq !== 'g7'));
  }
  // 라이벌 승률(같은 프로필 대 라이벌 설정, 엔진과 같은 수준 고르기).
  const rivals = {};
  for (const r of pack.rivals) {
    const ai = { level: r.search || (r.mistake >= 0.3 ? 'easy' : 'normal'), slip: r.mistake };   // 엔진과 같은 규칙(FN-2)
    let w = 0;
    for (let i = 0; i < RIVAL_GAMES; i++) if (game(me, ai).result === 'win') w++;
    const rate = w / RIVAL_GAMES;
    rivals[r.id] = { items: r.rewards.length, winRate: +rate.toFixed(2), gamesForAll: rate ? Math.ceil(r.rewards.length / rate) : null };
  }
  out.profiles[name] = { uniqueGames: pool.length, winRate: +(wins / N).toFixed(2), firsts, grainFullShare: +(grainFull / N).toFixed(2), coinsLeft: v.coins, built: v.built.length, rivals };
  console.log(name, JSON.stringify(out.profiles[name]), `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
out.seconds = Math.round((Date.now() - t0) / 1000);
console.log(JSON.stringify(out, null, 1));
