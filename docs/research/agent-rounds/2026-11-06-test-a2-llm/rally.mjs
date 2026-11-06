// 반격 목표 LLM 대행(2026-11-06): 크게 지고 있는 국면 6개에서 역할별로 「계속 둔다 / 새 판(기권)」을 고르게 한다.
// 같은 국면을 모델마다 🔥 목표가 있는 화면·없는 화면으로 엇갈려 준다(모델 하나가 한 국면은 한 번만 본다).
// 화면 글자는 게임의 실제 문구(CardLayer.tsx 의 띠·알림)를 그대로 쓴다. 호출은 읽기 전용 모드.
//   node rally.mjs <agy|grok|codex>
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';

const who = process.argv[2];
const POS = JSON.parse(readFileSync(new URL('./positions.json', import.meta.url), 'utf8'));
const WITH = { agy: [0, 1, 2], grok: [3, 4, 5], codex: [0, 2, 4] }[who];
const LOG = new URL(`./logs/rally-${who}.jsonl`, import.meta.url);
writeFileSync(LOG, '');
const ANIMAL = { p: '미어캣', n: '캥거루', b: '판다', r: '코뿔소', q: '호랑이', k: '사자' };
const ROLE = {
  agy: '너는 체스를 막 배운 여덟 살 어린이다. 지는 판은 금방 지루해진다.',
  grok: '너는 체스 규칙만 아는 어른 초보다. 질 것 같은 판을 끝까지 두는 게 시간 낭비 같을 때가 있다.',
  codex: '너는 체스를 오래 둔 어른이다. 진 판은 깔끔하게 끝내는 편이다.'
};
const count = (c, color) => {
  const n = {};
  for (const row of c.board()) for (const sq of row) if (sq && sq.color === color) n[sq.type] = (n[sq.type] || 0) + 1;
  return ['k', 'q', 'r', 'b', 'n', 'p'].filter((t) => n[t]).map((t) => `${ANIMAL[t]} ${n[t]}`).join(', ');
};
function board(c) {
  const rows = [];
  for (let r = 8; r >= 1; r--) {
    let line = `${r} `;
    for (const f of 'abcdefgh') { const p = c.get(f + r); line += (p ? (p.color === 'w' ? p.type.toUpperCase() : p.type) : '.') + ' '; }
    rows.push(line);
  }
  return rows.join('\n') + '\n  a b c d e f g h\n(대문자 = 내 말(백), 소문자 = 상대(흑). P 미어캣 · N 캥거루 · B 판다 · R 코뿔소 · Q 호랑이 · K 사자)';
}
function call(prompt) {
  const p = `${prompt}\n\n도구·명령·파일을 쓰지 말고, 생각만으로 바로 답하라.`;
  let r;
  if (who === 'agy') r = spawnSync('agy', ['--mode', 'plan', '--sandbox', '--print-timeout', '5m', `-p=${p}`], { encoding: 'utf8', timeout: 360000 });
  else if (who === 'grok') r = spawnSync('grok', ['-p', p, '--output-format', 'plain', '-m', 'grok-4.6', '--permission-mode', 'plan', '--max-turns', '4'], { encoding: 'utf8', timeout: 360000 });
  else r = spawnSync('codex exec -c model=gpt-6-sol -s read-only -', { input: p, encoding: 'utf8', timeout: 360000, shell: true });
  return `${r.stdout || ''}\n${r.stderr || ''}`;
}
const lastJson = (t) => { const a = [...t.matchAll(/\{[^{}]*\}/g)].map((m) => m[0]); for (let i = a.length - 1; i >= 0; i--) { try { return JSON.parse(a[i]); } catch (e) { /* next */ } } return null; };

for (const [i, pos] of POS.entries()) {
  const c = new Chess(pos.fen);
  const withGoal = WITH.includes(i);
  const moveNo = Math.floor(pos.ply / 2) + 1;
  const strip = withGoal ? `🎯 캥거루를 먼저 잡기 · 상대가 먼저 | 🔥 말 하나 되찾기 | 📋 1/3 | ${moveNo}수째` : `🎯 캥거루를 먼저 잡기 · 상대가 먼저 | 📋 1/3 | ${moveNo}수째`;
  const note = withGoal ? '\n방금 뜬 알림: 「🔥 반격 목표: 말 하나 되찾기 → 도토리 +5」' : '';
  const prompt = `${ROLE[who]}
동물 체스 게임을 두는 중이다(너는 백). 판이 끝나면 이기든 지든 도토리를 받아 섬을 꾸민다(이기면 30, 지면 15). 「새 판」을 누르면 이 판은 진 것으로 끝난다.

화면 위쪽 띠: ${strip}${note}
내 말: ${count(c, 'w')}
상대 말: ${count(c, 'b')}
지금 판(백 차례):
${board(c)}

질문: 지금 (A) 이 판을 계속 둔다, (B) 「새 판」을 누른다 — 어느 쪽인가? 역할 그대로 답하라.
마지막 줄에 JSON 한 줄만: {"choice":"A 또는 B","why":"짧게","want":"이 판에서 지금 하고 싶은 것 한 줄"}`;
  const out = call(prompt);
  const j = lastJson(out);
  const row = { i, withGoal, gap: pos.gap, moveNo, choice: j?.choice?.trim()?.[0] || null, why: j?.why || null, want: j?.want || null, raw: j ? undefined : out.slice(-500) };
  appendFileSync(LOG, JSON.stringify(row) + '\n');
  console.log(who, i, withGoal ? '🔥' : '  ', row.choice, row.why);
}
