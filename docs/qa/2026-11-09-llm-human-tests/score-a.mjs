// 사람 시험 A 대역 채점: 세 모델 답(마지막 ```json 블록)을 answer-key.json 과 맞춘다.
//   node docs/qa/2026-11-09-llm-human-tests/score-a.mjs <답 폴더>   (기본 D:/tmp/wc-quizA)
import { readFileSync, existsSync, writeFileSync } from 'node:fs';

const DIR = process.argv[2] || 'D:/tmp/wc-quizA';
const key = JSON.parse(readFileSync(new URL('./answer-key.json', import.meta.url), 'utf8'));
const out = {};
for (const set of ['before', 'after']) {
  for (const m of ['agy', 'grok', 'codex']) {
    const f = `${DIR}/${set}-${m}.md`;
    if (!existsSync(f)) continue;
    const txt = readFileSync(f, 'utf8');
    const blocks = [...txt.matchAll(/```json\s*([\s\S]*?)```/g)];
    let ans = null;
    for (const b of blocks.reverse()) { try { const j = JSON.parse(b[1]); if (j.answers) { ans = j; break; } } catch { /* 다음 */ } }
    if (!ans) { out[`${set}/${m}`] = { error: '답 JSON 없음' }; continue; }
    let atk = 0, vic = 0, both = 0, unk = 0;
    const wrong = [];
    key[set].forEach((cell, i) => {
      const [a, v] = cell.split('>');
      const q = `q${String(i + 1).padStart(2, '0')}`;
      const r = ans.answers[q] || {};
      if (r.atk === 'unknown' || r.vic === 'unknown') unk++;
      if (r.atk === a) atk++;
      if (r.vic === v) vic++;
      if (r.atk === a && r.vic === v) both++;
      else wrong.push(`${q} ${cell} → ${r.atk}>${r.vic}`);
    });
    out[`${set}/${m}`] = { atk, vic, both, unk, wrong };
    console.log(`${set.padEnd(6)} ${m.padEnd(5)} 잡은 ${atk}/30 · 잡힌 ${vic}/30 · 둘 다 ${both}/30 · 모름 ${unk}`);
  }
}
writeFileSync(new URL('./score-a.json', import.meta.url), JSON.stringify(out, null, 1));
