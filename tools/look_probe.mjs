// Repeatable look check, run inside ego-browser against the dev server: frame times, capture durations and stills.
//   echo before > .reports/look/label && bash <flow_run.sh> tools/look_probe.mjs 400
// ego-browser does not pass the environment on, so the run's name comes from that file.
// The first seconds after a load are shader compilation, so that window is thrown away; each number is a median of three.
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const LABEL = readFileSync('D:/chess/.reports/look/label', 'utf8').trim();
const OUT = `D:/chess/.reports/look/${LABEL}`;
mkdirSync(OUT, { recursive: true });
const say = (m) => { console.log(m); appendFileSync(`${OUT}/log.txt`, `${m}\n`); };
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const URL = 'http://localhost:3000/';
const SAVE = { v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 3, dust: 0, shelf: [], shelfSlots: 3 };

function piecesOf(fen) {
  const names = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  const out = [];
  fen.split(' ')[0].split('/').forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { c += Number(ch); continue; }
      out.push({ type: names[ch.toLowerCase()], color: ch === ch.toLowerCase() ? 'b' : 'w', r, c, hasMoved: true });
      c += 1;
    }
  });
  return out;
}
const at = (s) => [8 - Number(s[1]), s.charCodeAt(0) - 97];

// Crowded on purpose: the attacker and victim have pieces around them, as in a real middle game.
const SCENES = [
  { id: 'small', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/3PP3/2N2N2/PPP2PPP/R1BQKB1R w', from: 'd4', to: 'e5' },
  { id: 'medium', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w', from: 'c4', to: 'f7' },
  { id: 'big', fen: 'r1b1kbnr/pppp1ppp/2n5/4p3/3qP3/2N2N2/PPP2PPP/R1BQKB1R w', from: 'f3', to: 'd4' }
];

async function open(page, query = '') {
  await page.goto(URL + query);
  await page.evaluate((save) => {
    localStorage.clear();
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify(save));
  }, SAVE);
  await page.goto(URL + query);
  await page.waitForFunction(() => window.wizardChess?.getState, undefined, { timeout: 90000 });
  await page.waitForTimeout(12000);
}

const frameMs = (page) => page.evaluate(() => new Promise((ok) => {
  const gaps = [];
  let last = performance.now();
  const t0 = last;
  const f = (now) => {
    gaps.push(now - last);
    last = now;
    if (now - t0 > 5000) {
      gaps.sort((a, b) => a - b);
      ok({ median: gaps[Math.floor(gaps.length / 2)], p95: gaps[Math.floor(gaps.length * 0.95)] });
    } else requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}));

const setUp = (page, fen, turn = 'w') => page.evaluate(([p, t]) => window.wizardChess.setupCustomScenario(p, t), [piecesOf(fen), turn]);
const animating = (page) => page.evaluate(() => window.wizardChess.getState().isAnimatingMove);
const myTurn = (page) => page.evaluate(() => window.wizardChess.getState().currentTurn === 'w');
const move = (page, from, to) => page.evaluate(([f, t]) => window.wizardChess.executeChessMove(f[0], f[1], t[0], t[1], {}), [at(from), at(to)]);

const task = await taskSpace(`chess look ${LABEL}`);
try {
  const page = task.page('p1');
  const result = { label: LABEL, frames: [], captures: {} };

  for (let load = 0; load < 2; load++) {
    await open(page);
    for (let i = 0; i < 3; i++) result.frames.push(await frameMs(page));
  }
  result.fps = Math.round(1000 / median(result.frames.map((f) => f.median)));
  result.p95ms = Math.round(median(result.frames.map((f) => f.p95)));
  result.calls = await page.evaluate(() => window.wizardChess.debugRenderCalls());
  say(`frames ${result.frames.map((f) => Math.round(1000 / f.median)).join(' ')} -> ${result.fps} fps, p95 ${result.p95ms} ms, calls ${result.calls}`);
  await page.screenshot({ path: `${OUT}/opening.png` });

  // A player's click on one of their own pieces, wherever the camera has put it.
  const size = await page.evaluate(() => [innerWidth, innerHeight]);
  await page.evaluate(() => document.getElementById('btn-reset').click());
  await page.waitForTimeout(2500);
  let picked = false;
  for (let y = 0.5; y < 0.95 && !picked; y += 0.06) {
    for (let x = 0.2; x < 0.85 && !picked; x += 0.1) {
      await page.mouse.click(size[0] * x, size[1] * y);
      await page.waitForTimeout(120);
      picked = await page.evaluate(() => Boolean(window.wizardChess.getState().selectedSquare));
    }
  }
  say(`selected ${picked}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/selected.png` });

  for (const s of SCENES) {
    const times = [];
    for (let rep = 0; rep < 3; rep++) {
      await setUp(page, s.fen);
      await page.waitForTimeout(700);
      const t0 = Date.now();
      await move(page, s.from, s.to);
      // The turn passes the moment the piece lands; waiting on the animation flag would also count the AI's reply.
      while (await myTurn(page)) await page.waitForTimeout(25);
      times.push(Date.now() - t0);
    }
    result.captures[s.id] = median(times);
    await setUp(page, s.fen);
    await page.waitForTimeout(700);
    await move(page, s.from, s.to);
    for (let f = 0; f < 8; f++) {
      await page.screenshot({ path: `${OUT}/${s.id}-${f}.png` });
      await page.waitForTimeout(120);
    }
    while (await animating(page)) await page.waitForTimeout(50);
  }
  say(`capture ms ${JSON.stringify(result.captures)}`);

  await setUp(page, 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w');
  await page.waitForTimeout(700);
  await move(page, 'h5', 'f7');
  for (const [name, ms] of [['mate-1', 3000], ['mate-2', 3000], ['mate-3', 4000]]) {
    await page.waitForTimeout(ms);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  }

  writeFileSync(`${OUT}/result.json`, JSON.stringify(result, null, 2));
  await page.evaluate(() => localStorage.clear());
  say('ALL DONE');
} catch (e) {
  say(`FAILED ${e.stack || e.message}`);
}
await task.finish({ keep: [] });
