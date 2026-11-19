// sweep.mjs 의 조각 결과를 모아 표(TABLE.md)와 합격 목록을 만든다.
//   node docs/research/2026-11-18-set-pool/table.mjs [시드=7000] [단계=normal]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const [seed = '7000', level = 'normal'] = process.argv.slice(2);
const dir = new URL('./', import.meta.url);
const rows = readdirSync(dir).filter((f) => f.startsWith(`result-${seed}-${level}-`)).flatMap((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')).rows);
// 합격 기준(SC-0 에서 세트를 뺀 까닭을 그대로 숫자로): 길이 · 선공 편향 · 계약으로 끝나는 비율 · 장식 목표 없음
export const RULES = { pliesMin: 15, pliesMax: 34, p90Max: 46, whiteMin: 0.38, whiteMax: 0.62, contractMin: 0.85, useMin: 0.25 };
export function verdict(r) {
  const why = [];
  if (r.plies.median < RULES.pliesMin) why.push(`짧다(중앙 ${r.plies.median})`);
  if (r.plies.median > RULES.pliesMax || r.plies.p90 > RULES.p90Max) why.push(`길다(중앙 ${r.plies.median} · p90 ${r.plies.p90})`);
  if (r.whiteShare === null || r.whiteShare < RULES.whiteMin || r.whiteShare > RULES.whiteMax) why.push(`기운다(백 ${r.whiteShare})`);
  if (r.contractShare < RULES.contractMin) why.push(`계약으로 안 끝난다(${r.contractShare})`);
  if (!r.jackpot && Math.min(...r.use) < RULES.useMin) why.push(`장식 목표(${r.goals[r.use.indexOf(Math.min(...r.use))].type} ${Math.min(...r.use)})`);
  return why;
}
rows.sort((a, b) => Number(a.jackpot) - Number(b.jackpot) || a.id.localeCompare(b.id));
const line = (r) => `| ${r.id} | ${r.white}:${r.black}:${r.draw} | ${r.whiteShare} | ${r.contractShare} | ${r.plies.median}·${r.plies.p90} | ${r.captures} | ${r.use.join(' · ')} | ${verdict(r).join(' · ') || '✅'} |`;
const pass = rows.filter((r) => !verdict(r).length);
const md = [`# 계약 세트 전수 시뮬 (시드 ${seed} · ${level} · 세트마다 ${rows[0]?.games}판)`, '',
  `기준: 반수 중앙 ${RULES.pliesMin}~${RULES.pliesMax} · p90 ≤ ${RULES.p90Max} · 결정 판의 백 비율 ${RULES.whiteMin}~${RULES.whiteMax} · 계약으로 끝난 비율 ≥ ${RULES.contractMin} · 목표별 쓰임 ≥ ${RULES.useMin}(잭팟 제외)`, '',
  `합격 ${pass.length} / ${rows.length}: ${pass.map((r) => r.id).join(' ')}`, '',
  '| 세트 | 백:흑:비김 | 백 비율 | 계약 종료 | 반수 중앙·p90 | 잡기 중앙 | 목표별 쓰임 | 판정 |', '| :-- | :-- | --: | --: | :-- | --: | :-- | :-- |', ...rows.map(line), ''].join('\n');
writeFileSync(new URL(`./TABLE-${seed}-${level}.md`, dir), md);
writeFileSync(new URL(`./pass-${seed}-${level}.json`, dir), JSON.stringify(pass.map((r) => r.id)));
console.log(`합격 ${pass.length}/${rows.length}`);
console.log(pass.map((r) => `${r.id}(${r.plies.median},${r.whiteShare})`).join(' '));
console.log('잭팟:', rows.filter((r) => r.jackpot).map((r) => `${r.id} 중앙${r.plies.median} p90 ${r.plies.p90} 백${r.whiteShare} 계약${r.contractShare} ${verdict(r).join('/') || 'OK'}`).join(' | '));
const reasons = {}; for (const r of rows) for (const w of verdict(r)) { const k = w.split('(')[0]; reasons[k] = (reasons[k] || 0) + 1; }
console.log('탈락 사유:', JSON.stringify(reasons));
