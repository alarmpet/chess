// sc0/*.json 을 표 한 장으로 모은다: node docs/research/2026-11-11-slot-chess/sc0-table.mjs
import { readdirSync, readFileSync } from 'node:fs';
const dir = new URL('./sc0/', import.meta.url);
const rows = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')));
// 결정된 판의 백 비율이 0.5 와 다른가 — 정규 근사 95% 구간
const ci = (k, n) => { if (!n) return '-'; const p = k / n, h = 1.96 * Math.sqrt((p * (1 - p)) / n); return `${p.toFixed(2)} (${Math.max(0, p - h).toFixed(2)}~${Math.min(1, p + h).toFixed(2)})`; };
console.log('| 세트 | 규칙 | 단계·시드 | 판 | 백:흑:비김 | 결정 판의 백 비율 (95%) | 끝난 이유 | 반수 중앙·p90 | 잡기 중앙 | 첫 잡기 | 목표별 사용 |');
console.log('| :-- | :-- | :-- | --: | :-- | :-- | :-- | :-- | --: | --: | :-- |');
for (const r of rows.sort((a, b) => a.set.localeCompare(b.set) || a.rule.localeCompare(b.rule) || a.level.localeCompare(b.level) || (a.seed ?? 7000) - (b.seed ?? 7000))) {
  const reasons = Object.entries(r.reasons).map(([k, v]) => `${k} ${v}`).join(' · ');
  const use = Object.entries(r.goalUse).map(([k, v]) => `${k} ${v}`).join(' · ');
  console.log(`| ${r.set} | ${r.rule} | ${r.level}·${r.seed ?? 7000} | ${r.games} | ${r.white}:${r.black}:${r.draw} | ${ci(r.white, r.white + r.black)} | ${reasons} | ${r.plies.median}·${r.plies.p90} | ${r.captures.median} | ${r.firstCapture} | ${use} |`);
}
