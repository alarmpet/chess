// 손과 뇌 LLM 대행(2026-11-06): 세 모델이 역할(어린이·초보 어른·숙련 어른)로 실제 규칙의 판을 글자로 둔다.
// 조건: alone(혼자, 둘 수 있는 수 전부) · adviser(AI 조언자가 말 종류를 부르고 그 종류 수만) · family(grok 이 부모 뇌, agy 가 아이 손).
// 모델 수 12개, 상대는 게임의 기본 AI(보통). 블런더 = 손실 ≥ 200(탐색 2수, tools/blunder_rate.mjs 와 같은 자).
// 모델 호출은 읽기 전용 모드만(분류기 규칙): agy --mode plan --sandbox, grok --permission-mode plan, codex exec -s read-only.
//   node play.mjs <agy|grok|codex|family> <alone|adviser|family> [수=12]
import { spawnSync } from 'node:child_process';
import { appendFileSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { chooseMove, positionKey, rootScores } from '../../../../src/rules/ai.js';
import { adviseKind, movableKinds } from '../../../../src/cards/handBrain.js';

const [, , who, cond, nArg] = process.argv;
const N = Number(nArg || 12);
const DIR = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const LOG = `${DIR}logs/play-${who}-${cond}.jsonl`;
writeFileSync(LOG, '');
let seed = 1357;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const ANIMAL = { p: '미어캣', n: '캥거루', b: '판다', r: '코뿔소', q: '호랑이', k: '사자' };
const ROLE = {
  agy: '너는 체스를 막 배운 여덟 살 어린이다. 말이 어떻게 움직이는지는 알지만 몇 수 앞은 잘 못 본다. 귀여운 동물을 좋아한다.',
  grok: '너는 체스 규칙만 아는 어른 초보다. 한두 수 앞까지 보려고 애쓴다.',
  codex: '너는 체스를 오래 둔 어른이다. 수를 꼼꼼히 계산한다.'
};

function board(c) {
  const rows = [];
  for (let r = 8; r >= 1; r--) {
    let line = `${r} `;
    for (const f of 'abcdefgh') {
      const p = c.get(f + r);
      line += p ? (p.color === 'w' ? p.type.toUpperCase() : p.type) : '.';
      line += ' ';
    }
    rows.push(line);
  }
  rows.push('  a b c d e f g h');
  return rows.join('\n') + '\n(대문자 = 내 말(백), 소문자 = 상대(흑). P 미어캣 · N 캥거루 · B 판다 · R 코뿔소 · Q 호랑이 · K 사자)';
}

function describe(m) {
  return `${m.san} — ${ANIMAL[m.piece]} ${m.from}→${m.to}${m.captured ? ` (${ANIMAL[m.captured]} 잡기)` : ''}`;
}

function call(model, prompt0) {
  let prompt = prompt0;
  const t0 = Date.now();
  let r;
  prompt += '\n\n도구·명령·파일을 쓰지 말고, 생각만으로 바로 답하라.';
  if (model === 'agy') r = spawnSync('agy', ['--mode', 'plan', '--sandbox', '--print-timeout', '5m', `-p=${prompt}`], { encoding: 'utf8', timeout: 360000, shell: false });
  else if (model === 'grok') r = spawnSync('grok', ['-p', prompt, '--output-format', 'plain', '-m', 'grok-4.6', '--permission-mode', 'plan', '--max-turns', '4'], { encoding: 'utf8', timeout: 360000 });
  else r = spawnSync('codex exec -c model=gpt-6-sol -s read-only -', { input: prompt, encoding: 'utf8', timeout: 360000, shell: true });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  return { out, ms: Date.now() - t0 };
}

function lastJson(text) {
  const all = [...text.matchAll(/\{[^{}]*\}/g)].map((m) => m[0]);
  for (let i = all.length - 1; i >= 0; i--) { try { return JSON.parse(all[i]); } catch (e) { /* next */ } }
  return null;
}

const c = new Chess();
const history = [];
let made = 0;
const rows = [];
while (made < N && !c.isGameOver()) {
  if (c.turn() === 'b') {
    const mv = chooseMove(c.fen(), { level: 'normal', history, rand });
    c.move(mv);
    history.push(positionKey(c.fen()));
    continue;
  }
  const fen = c.fen();
  const legal = c.moves({ verbose: true });
  let kind = null;
  let brainNote = null;
  if (cond === 'adviser') kind = adviseKind(fen, { history, rand: () => 0.5 });
  if (cond === 'family') {
    const kinds = movableKinds(fen);
    const p = `${ROLE.grok.replace('어른 초보다', '어른 초보이고, 지금은 아이와 한 편인 부모(뇌)다')}\n「손과 뇌」: 너(뇌)는 말 종류만 부르고, 아이(손)가 그 종류의 말로 둔다. 아이가 스스로 수를 찾게 하되 좋은 수가 있는 종류를 불러라.\n\n지금 판(백 차례):\n${board(c)}\n\n부를 수 있는 종류: ${kinds.map((k) => `${k}=${ANIMAL[k]}`).join(', ')}\n\n마지막 줄에 JSON 한 줄만: {"kind":"n","why":"짧게"}`;
    const r = call('grok', p);
    const j = lastJson(r.out);
    kind = j && kinds.includes(j.kind) ? j.kind : kinds[0];
    brainNote = { kind, why: j?.why || null, ms: r.ms, valid: Boolean(j && kinds.includes(j.kind)) };
  }
  const options = kind ? legal.filter((m) => m.piece === kind) : legal;
  const hand = who === 'family' ? 'agy' : who;
  const lead = cond === 'adviser' ? `AI 조언자가 말했다: 「${ANIMAL[kind]}로 둬 봐요」. 이번에는 ${ANIMAL[kind]}만 움직일 수 있다.`
    : cond === 'family' ? `한 편인 부모(뇌)가 「${ANIMAL[kind]}!」라고 불렀다. 이번에는 ${ANIMAL[kind]}만 움직일 수 있다.`
    : '이번 수는 네가 고른다.';
  const prompt = `${ROLE[hand]}\n체스를 두고 있다(너는 백). ${lead}\n\n지금 판:\n${board(c)}\n\n둘 수 있는 수(이 중 하나만):\n${options.map(describe).join('\n')}\n\n역할 그대로 생각하고, 마지막 줄에 JSON 한 줄만: {"move":"SAN","why":"짧게"}`;
  const r = call(hand, prompt);
  const j = lastJson(r.out);
  let pick = j && options.find((m) => m.san === j.move || m.lan === j.move);
  const valid = Boolean(pick);
  if (!pick) pick = options[Math.floor(rand() * options.length)];
  const scores = rootScores(fen);
  const played = scores.find((x) => x.from === pick.from && x.to === pick.to && (x.promotion || null) === (pick.promotion || null));
  const loss = played ? scores[0].score - played.score : 0;
  const best = scores[0];
  const row = { n: made + 1, fen, kind, options: options.length, move: pick.san, valid, why: j?.why || null, loss, blunder: loss >= 200,
    bestIsKind: kind ? new Chess(fen).get(best.from)?.type === kind : null, ms: r.ms, brain: brainNote, raw: valid ? undefined : r.out.slice(-600) };
  rows.push(row);
  appendFileSync(LOG, JSON.stringify(row) + '\n');
  console.log(who, cond, row.n, row.move, valid ? '' : '(대체)', `손실 ${loss}`, `${(r.ms / 1000).toFixed(0)}s`);
  c.move(pick);
  history.push(positionKey(c.fen()));
  made++;
}
const sum = { who, cond, moves: rows.length, invalid: rows.filter((r) => !r.valid).length, blunders: rows.filter((r) => r.blunder).length,
  meanLoss: Math.round(rows.reduce((s, r) => s + r.loss, 0) / Math.max(1, rows.length)), pgn: c.pgn() };
appendFileSync(LOG, JSON.stringify({ summary: sum }) + '\n');
console.log(JSON.stringify(sum));
