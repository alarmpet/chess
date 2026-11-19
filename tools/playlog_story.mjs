// 판 기록 이야기(FN-0, 2026-11-07): 브라우저에서 복사한 판 기록(`wildcrown.playlog.v1` 의 JSON)을 판 하나씩 다시 그린다.
// 사람 시험 A 에서 한 사람의 기록을 받아 「몇 판 했나 · 어디서 떠났나 · 지고 나서 다음 판을 눌렀나」를 본다.
//   node tools/playlog_story.mjs <playlog.json> [--json]
import { readFileSync } from 'node:fs';
import { storyOf } from '../src/cards/sessionLog.js';

const [file, flag] = process.argv.slice(2);
if (!file) { console.error('쓰는 법: node tools/playlog_story.mjs <playlog.json> [--json]'); process.exit(2); }
const raw = JSON.parse(readFileSync(file, 'utf8'));
const s = storyOf(Array.isArray(raw) ? raw : raw.log || raw.playlog || []);
if (flag === '--json') { console.log(JSON.stringify(s, null, 1)); process.exit(0); }

const RESULT = { win: '승', loss: '패', draw: '무' };
const hhmm = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 8) : '--:--:--');   // 이 PC 의 시각
for (const [i, g] of s.games.entries()) {
  const tags = [g.color === 'b' ? '흑' : g.color === 'w' ? '백' : null, g.rivalId ? `라이벌 ${g.rivalId}` : null,
    g.handBrain && g.handBrain !== 'off' ? `손과 뇌 ${g.handBrain}` : null, g.blitz ? '번개' : null].filter(Boolean).join(' · ');
  console.log(`${i + 1}. ${hhmm(g.at)} 시작${tags ? ` (${tags})` : ''}`);
  for (const l of g.leaves) console.log(`   ${hhmm(l.at)} 창 닫음 — ${l.ply}반수`);
  if (g.resumes) console.log(`   이어 하기 ${g.resumes}번`);
  for (const k of g.skills) console.log(`   ${k.kind === 'rewind' ? '되감기' : '정찰'} — ${k.ply}반수`);
  if (g.end) console.log(`   ${hhmm(g.end.at)} 끝: ${RESULT[g.end.result] || g.end.result}${g.end.resigned ? '(기권)' : ''} · ${g.end.plies}반수 · 시작부터 ${Math.round((Date.parse(g.end.at) - Date.parse(g.at)) / 1000)}초(카드 기록 ${g.end.seconds ?? '?'}초 — 이어 하기 뒤부터만 잼)`);
  else if (g.quit) console.log(`   ${hhmm(g.quit.at)} 새 판으로 버림 — ${g.quit.ply}반수`);
  else console.log(`   끝나지 않음(창을 닫고 안 돌아옴) — 마지막 ${g.maxPly}반수`);
  if (g.next) console.log(`   → 다음 판까지 ${g.next.gapS}초`);
}
const m = s.summary;
console.log(`\n시작 ${m.started} · 둔 판 ${m.played} · 끝낸 판 ${m.finished} · 이탈 ${m.abandoned} · 새 판으로 버림 ${m.quits} · 창 닫음 ${m.leaves} · 이어 하기 ${m.resumes} · 기술 ${m.skills}`);
for (const [k, v] of Object.entries(m.nextAfter)) console.log(`${{ win: '이긴', loss: '진', draw: '비긴', resign: '기권한' }[k] || k} 판 뒤 다음 판: ${v.next}/${v.n}`);
