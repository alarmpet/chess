// 사람 시험 A 를 세 모델이 대신 한다 (2026-11-04). 실제 게임·실제 브라우저. 모델은 매 수를 직접 고르고,
// 하네스는 시험 A 가 보는 화면(판 끝 개봉 · 섬 · 매대 · 도감 빈 칸 · 외형 단계 · 라이벌 입장식 · 기권 확인창 · 새로고침 이어 하기)의
// "보이는 글자"만 덤프한다. 숨은 패널 글자가 섞여 없는 화면을 비판하게 만든 10-31 의 오류를 막기 위해서다.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';

const require = createRequire('D:/chess/package.json');
const { Chess } = require('chess.js');

const BASE = 'C:/Users/petbl/ego/chess-test-a-20261104';
const OUT = `${BASE}/logs`;
const SHOTS = `${BASE}/shots`;
mkdirSync(OUT, { recursive: true });
mkdirSync(SHOTS, { recursive: true });
const BASH = 'C:/Program Files/Git/bin/bash.exe';
const only = (process.env.PLAYERS || 'codex').split(','); // 2026-11-04 codex 재실행: ego-browser 가 환경변수를 넘기지 않아 기본값을 바꿨다
const MODEL_MOVES = 8;    // 판마다 모델이 직접 고르는 수. 그 뒤는 자동 수로 끝까지.
const PLY_CAP = 140;
const URL = 'http://localhost:3000/';

const say = (m) => { console.log(m); appendFileSync(`${BASE}/progress.log`, `${new Date().toISOString().slice(11, 19)} ${m}\n`); };
say('round-01 start');

// 시험 A 의 세 역할 (재미 계획서 §7 · 섬 경제 §8 · 욕망 §10).
const PERSONAS = {
  agy: '너는 체스를 막 배운 여덟 살 어린이다. 귀여운 동물이 움직이는 수를 고르고, 복잡한 계산은 하지 않는다. 잡히는 것을 무서워하지 않는다.',
  grok: '너는 체스 규칙만 아는 어른 초보다. 말을 잃는 것이 아깝고, 안전해 보이는 수를 고른다. 게임에서 무엇을 모으고 얻는지에 관심이 많다.',
  codex: '너는 체스를 오래 둔 어른이다. 좋은 수를 빠르게 두고 싶고, 대국을 늦추는 연출을 싫어한다. 수집 요소에는 냉담하다.'
};

function ask(player, prompt, timeoutSec) {
  const file = `${BASE}/prompt-${player}.txt`;
  writeFileSync(file, prompt, 'utf8');
  const cmds = {
    grok: `grok -p "$(cat '${file}')" --output-format plain -m grok-4.6 --effort low --max-turns 2`,
    agy: `agy --effort low --print-timeout ${Math.ceil(timeoutSec / 60) + 1}m -p="$(cat '${file}')"`,
    codex: `cd D:/chess && codex exec -s read-only -c model=gpt-6-sol - < '${file}'`
  };
  const r = spawnSync(BASH, ['-lc', cmds[player]], { encoding: 'utf8', timeout: timeoutSec * 1000, maxBuffer: 1 << 24 });
  return { text: `${r.stdout || ''}`, err: `${r.stderr || ''}`, status: r.status };
}

function board(chess) {
  return chess.board().map((row, i) => `${8 - i} ${row.map((p) => (p ? (p.color === 'w' ? p.type.toUpperCase() : p.type) : '.')).join(' ')}`).join('\n') + '\n  a b c d e f g h';
}
const ANIMALS = '폰=미어캣, 나이트=캥거루, 비숍=판다, 룩=코뿔소, 퀸=호랑이, 킹=사자';

function chooseMove(player, chess, recent) {
  const legal = chess.moves();
  const prompt = `${PERSONAS[player]}
게임: 동물 3D 체스 WILD CROWN. ${ANIMALS}. 너는 백이다. 파일이나 도구를 쓰지 마라.
보드(대문자 백):
${board(chess)}
FEN: ${chess.fen()}
직전에 화면에 있던 글자: ${recent || '없음'}
합법 수: ${legal.join(' ')}
답은 한 줄 JSON 만: {"move":"합법 수 하나","why":"20자 이내 이유"}`;
  const t0 = Date.now();
  const r = ask(player, prompt, 150);
  const ms = Date.now() - t0;
  const hit = [...r.text.matchAll(/\{[^{}]*"move"[^{}]*\}/g)].pop();
  try {
    const parsed = JSON.parse(hit[0]);
    if (legal.includes(parsed.move)) return { san: parsed.move, why: parsed.why || '', ms, source: 'model' };
  } catch (e) {}
  const cap = legal.find((m) => m.includes('x'));
  return { san: cap || legal[Math.floor(Math.random() * legal.length)], why: '', ms, source: `fallback(status=${r.status})`, raw: (r.text + r.err).slice(-200) };
}

function autoMove(chess) {
  const value = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let best = null, bestScore = -Infinity;
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    const mate = chess.isCheckmate(); const check = chess.inCheck();
    chess.undo();
    const score = (mate ? 1000 : 0) + (m.captured ? value[m.captured] * 10 : 0) + (check ? 2 : 0) + (m.promotion === 'q' ? 50 : 0) + Math.random();
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return { san: best.san, why: '', ms: 0, source: 'auto' };
}
const sq = (s) => ({ r: 8 - Number(s[1]), c: s.charCodeAt(0) - 97 });

// 보이는 글자만: 크기가 있고, 뷰포트 안이고, 조상 어느 것도 opacity 0 / visibility hidden 이 아닌 텍스트 노드.
const visibleText = (page, rootSel = 'body') => page.evaluate((sel) => {
  const root = document.querySelector(sel);
  if (!root) return '';
  const vw = innerWidth, vh = innerHeight;
  const okEl = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const out = [];
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
    if (okEl(el)) out.push(t);
  }
  return out.join('\n').slice(0, 4000);
}, rootSel);

async function snapshot(page) {
  return page.evaluate(() => {
    const w = window.wizardChess; const s = w.getState();
    return { fen: w.getFen(), turn: s.currentTurn, animating: s.isAnimatingMove, over: s.gameOver,
      errors: (window.__errs || []).slice(-6), hud: document.getElementById('turn-text')?.textContent || '', tray: document.getElementById('captured-tray')?.textContent || '' };
  });
}
async function waitTurn(page, timeoutMs = 60000) {
  const t0 = Date.now();
  for (;;) {
    const s = await snapshot(page);
    if (s.over || (!s.animating && s.turn === 'w')) return { ...s, waited: Date.now() - t0 };
    if (Date.now() - t0 > timeoutMs) return { ...s, waited: Date.now() - t0, stuck: true };
    await page.waitForTimeout(250);
  }
}
async function hookErrors(page) {
  await page.evaluate(() => {
    window.__errs = [];
    const orig = console.error;
    console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0, 200)); orig(...a); };
    window.addEventListener('error', (e) => window.__errs.push(`error: ${e.message}`));
    window.addEventListener('unhandledrejection', (e) => window.__errs.push(`rejection: ${e.reason}`));
  });
}
async function ready(page) {
  await page.waitForFunction(() => window.wizardChess?.getState && document.getElementById('loader-bar'), undefined, { timeout: 90000 });
  await page.waitForTimeout(9000);
  await hookErrors(page);
}
async function freshPage(task, player) {
  const page = task.page('p1');
  await page.goto(URL);
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(URL);
  await ready(page);
  await page.click('canvas', { label: 'unlock audio', position: { x: 400, y: 330 } }).catch((e) => say(`click canvas: ${e.message}`));
  say(`${player}: page ready`);
  return page;
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {});
const clickText = (page, text, within = 'body') => page.evaluate(([t, w]) => {
  const b = [...document.querySelectorAll(`${w} button`)].find((x) => x.textContent.includes(t) && x.getBoundingClientRect().width > 0);
  if (b) { b.click(); return b.textContent.trim(); } return null;
}, [text, within]);

// 한 판. hooks: { atMove: n → async fn } 으로 판 중간 행동(기권 확인창, 새로고침)을 끼운다.
async function playGame(page, player, id, label, hooks = {}) {
  const chess = new Chess();
  const log = { player, id, label, plies: [], events: [] };
  let recent = '', own = 0;
  for (let ply = 0; ply < PLY_CAP; ply++) {
    const before = await waitTurn(page);
    if (before.over || before.stuck) { log.end = before; break; }
    if (hooks[own]) { log.events.push(await hooks[own](page, log)); }
    const cur = await snapshot(page);
    chess.load(cur.fen);
    const useModel = own < MODEL_MOVES;
    const pick = useModel ? chooseMove(player, chess, recent) : autoMove(chess);
    own += 1;
    const verbose = chess.moves({ verbose: true }).find((m) => m.san === pick.san);
    const from = sq(verbose.from), to = sq(verbose.to);
    const t0 = Date.now();
    const ok = await page.evaluate(([a, b, c, d, promotion]) => window.wizardChess.executeChessMove(a, b, c, d, { promotion }), [from.r, from.c, to.r, to.c, verbose.promotion ? { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[verbose.promotion] : undefined]);
    await page.waitForTimeout(900);
    const after = await waitTurn(page);
    const landed = Date.now() - t0;
    const row = { ply, san: pick.san, why: pick.why, source: pick.source, thinkMs: pick.ms, ok, msUntilMyTurn: landed, hud: after.hud, tray: after.tray, errors: after.errors };
    if (pick.raw) row.raw = pick.raw;
    log.plies.push(row);
    recent = `네 수 ${pick.san}, 차례 표시 "${after.hud}", ${after.tray}`;
    say(`${player} g${id} ${ply + 1}. ${pick.san} [${pick.source}] ${pick.ms}ms, back in ${landed}ms${after.stuck ? ' STUCK' : ''}`);
    if (after.stuck || after.over) { log.end = after; break; }
    writeFileSync(`${OUT}/${player}-g${id}.json`, JSON.stringify(log, null, 1));
  }
  log.pgn = await page.evaluate(() => window.wizardChess.getPgn().split('\n').pop());
  log.final = await snapshot(page);
  writeFileSync(`${OUT}/${player}-g${id}.json`, JSON.stringify(log, null, 1));
  return log;
}

// 판 끝 → 개봉 → 세 줄 고리 → 섬 → 매대 → 표식 → 체스로 → 도감 빈 칸 → 외형 단계. 전부 보이는 글자.
async function afterGame(page, player, id) {
  const v = { player, id, steps: [] };
  const step = async (name, fn) => { try { const r = await fn(); v.steps.push({ name, ...r }); } catch (e) { v.steps.push({ name, error: e.message }); } };
  await step('판 끝 0.5초', async () => { await page.waitForTimeout(500); return { text: await visibleText(page) }; });
  await step('판 끝 4초(개봉 뒤)', async () => { await page.waitForTimeout(3500); await shot(page, `${player}-${id}-end`); return { text: await visibleText(page), toast: await page.evaluate(() => document.getElementById('village-toast')?.textContent || null) }; });
  await step('결과 카드 닫기', async () => { await page.evaluate(() => document.getElementById('btn-checkmate-dismiss')?.click()); await page.waitForTimeout(800); return { text: await visibleText(page) }; });
  await step('섬으로(세 줄 고리 버튼)', async () => {
    const opened = await page.evaluate(() => { const t = document.getElementById('village-toast'); if (t) { t.click(); return true; } return false; });
    await page.waitForTimeout(9000); await shot(page, `${player}-${id}-island`);
    return { opened, text: await visibleText(page) };
  });
  await step('매대 열기', async () => { await page.evaluate(() => document.getElementById('village-shelf')?.click()); await page.waitForTimeout(800); await shot(page, `${player}-${id}-shelf`); return { text: await visibleText(page) }; });
  await step('매대 닫기·표식 열기', async () => { await page.evaluate(() => document.getElementById('village-shelf')?.click()); await page.waitForTimeout(300); await page.evaluate(() => document.getElementById('village-marks')?.click()); await page.waitForTimeout(800); return { text: await visibleText(page) }; });
  await step('표식 닫기·체스로', async () => { await page.evaluate(() => document.getElementById('village-marks')?.click()); await page.waitForTimeout(300); const c = await clickText(page, '체스로'); await page.waitForTimeout(1500); return { clicked: c, text: await visibleText(page) }; });
  await step('도감 열기', async () => { await page.evaluate(() => document.getElementById('btn-cards')?.click()); await page.waitForTimeout(1000); await shot(page, `${player}-${id}-album`); return { text: await visibleText(page) }; });
  await step('도감 빈 칸 누르기(얻는 길)', async () => {
    const r = await page.evaluate(() => { const s = document.querySelector('.card-slot.empty'); if (s) { s.click(); return s.className; } return null; });
    await page.waitForTimeout(700); return { slot: r, text: await visibleText(page) };
  });
  await step('도감 닫기·외형 열기', async () => {
    await page.evaluate(() => [...document.querySelectorAll('.panel-close')].forEach((b) => b.getBoundingClientRect().width && b.click()));
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById('btn-looks')?.click()); await page.waitForTimeout(1000); await shot(page, `${player}-${id}-looks`);
    return { text: await visibleText(page) };
  });
  await step('외형 닫기', async () => { await page.evaluate(() => [...document.querySelectorAll('.panel-close')].forEach((b) => b.getBoundingClientRect().width && b.click())); await page.waitForTimeout(400); return { text: (await visibleText(page)).slice(0, 600) }; });
  v.save = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /wildcrown/i.test(k)).map((k) => [k, localStorage.getItem(k).slice(0, 500)])));
  v.errors = await page.evaluate(() => (window.__errs || []).slice(-10));
  writeFileSync(`${OUT}/${player}-g${id}-after.json`, JSON.stringify(v, null, 1));
  return v;
}

const task = await taskSpace('chess test-a');
say(`space ${task.spaceId}`);
for (const player of only) {
  try {
    const page = await freshPage(task, player);
    const first = { firstScreen: await visibleText(page) };
    await shot(page, `${player}-first`);
    writeFileSync(`${OUT}/${player}-first.json`, JSON.stringify(first, null, 1));

    // 1판: 일반 대국. 끝까지 → 개봉·섬·도감·외형.
    await playGame(page, player, 1, '일반 대국: 앞 8수 모델, 이후 자동으로 끝까지');
    await afterGame(page, player, 1);

    // 2판: 라이벌 대국. 입장식(쇼케이스) 글자를 먼저 뜬다.
    await page.evaluate(() => { window.wizardChess.resetChessBoard(); });
    await page.waitForTimeout(1500);
    const rivals = await page.evaluate(() => window.wizardChess.getRivalCatalog().rivals?.map((r) => r.id) || []);
    const entrance = { rivals, texts: [] };
    await page.evaluate((id) => window.wizardChess.startRival(id), rivals[0]);
    for (const ms of [800, 1500, 1500]) { await page.waitForTimeout(ms); entrance.texts.push({ atMs: ms, text: await visibleText(page) }); }
    await shot(page, `${player}-2-entrance`);
    await page.waitForTimeout(3000);
    writeFileSync(`${OUT}/${player}-g2-entrance.json`, JSON.stringify(entrance, null, 1));
    await playGame(page, player, 2, `라이벌 ${rivals[0]} 대국: 앞 8수 모델, 이후 자동`);
    await afterGame(page, player, 2);

    // 3판: 일반 대국. 5수 뒤 「새 판 시작」을 눌러 확인창을 뜬 뒤 「계속 두기」, 6수 뒤 새로고침(이어 하기).
    await page.evaluate(() => { window.wizardChess.resetChessBoard(); });
    await page.waitForTimeout(1500);
    const hooks = {
      5: async (pg) => {
        await pg.evaluate(() => document.getElementById('btn-reset')?.click());
        await pg.waitForTimeout(700);
        const text = await visibleText(pg, '#quit-dialog');
        await shot(pg, `${player}-3-quit`);
        const clicked = await clickText(pg, '계속 두기', '#quit-dialog');
        await pg.waitForTimeout(500);
        return { kind: '기권 확인창', text, clicked };
      },
      6: async (pg) => {
        const fenBefore = await pg.evaluate(() => window.wizardChess.getFen());
        await pg.reload();
        await ready(pg);
        const fenAfter = await pg.evaluate(() => window.wizardChess.getFen());
        const text = await visibleText(pg);
        await shot(pg, `${player}-3-resumed`);
        return { kind: '새로고침(이어 하기)', fenBefore, fenAfter, same: fenBefore === fenAfter, text: text.slice(0, 1500) };
      }
    };
    await playGame(page, player, 3, '일반 대국: 5수 뒤 새 판 확인창 → 계속, 6수 뒤 새로고침, 8수까지 모델, 이후 자동', hooks);
    await afterGame(page, player, 3);
    say(`${player}: done`);
  } catch (e) {
    say(`${player}: FAILED ${e.stack || e.message}`);
  }
}
await task.finish({ keep: [] });
say('ALL DONE');
