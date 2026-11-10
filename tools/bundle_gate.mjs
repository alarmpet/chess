// 번들 크기 게이트 (관리 계획서 §4.3 S1). `npm run build` 뒤에 돈다.
//   node tools/bundle_gate.mjs
// 2026-11-04 실측: JS 1,283KB(gzip 370KB) 한 덩어리, CSS 34KB(gzip 7.6KB). 상한은 실측 조금 위의 래칫이다.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/assets/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const LIMIT_GZ_KB = { js: 400, css: 12 };
const LIMIT_RAW_KB = { js: 1400 };

if (!existsSync(DIST)) { console.error('dist/assets 가 없다. 먼저 npm run build'); process.exit(2); }
const sum = { js: [0, 0], css: [0, 0] };
for (const f of readdirSync(DIST)) {
  const ext = f.endsWith('.js') ? 'js' : f.endsWith('.css') ? 'css' : null;
  if (!ext) continue;
  const b = readFileSync(join(DIST, f));
  const gz = gzipSync(b, { level: 9 }).length;
  sum[ext][0] += b.length; sum[ext][1] += gz;
  console.log(`${f.padEnd(28)} ${(b.length / 1024).toFixed(0).padStart(6)}KB  gzip ${(gz / 1024).toFixed(0).padStart(5)}KB`);
}
const bad = [];
for (const ext of ['js', 'css']) {
  const gzKb = sum[ext][1] / 1024;
  const rawKb = sum[ext][0] / 1024;
  console.log(`${ext} 합계 ${rawKb.toFixed(0)}KB · gzip ${gzKb.toFixed(0)}KB (상한 gzip ${LIMIT_GZ_KB[ext]}KB${LIMIT_RAW_KB[ext] ? `, 원본 ${LIMIT_RAW_KB[ext]}KB` : ''})`);
  if (gzKb > LIMIT_GZ_KB[ext]) bad.push(`${ext} gzip ${gzKb.toFixed(0)}KB > ${LIMIT_GZ_KB[ext]}KB`);
  if (LIMIT_RAW_KB[ext] && rawKb > LIMIT_RAW_KB[ext]) bad.push(`${ext} 원본 ${rawKb.toFixed(0)}KB > ${LIMIT_RAW_KB[ext]}KB`);
}
// 첫 화면에 받는 JS(index.html 의 script·modulepreload) 대 늦게 받는 조각(DR-0b, 2026-11-10). 상한은 아직 전체 합에 건다 —
// 「첫 화면 400 · 전체 600」으로 나눌지는 사용자 결정(방향 계획서 §7-2). 그 전까지는 보고만 한다.
const html = readFileSync(join(DIST, '..', 'index.html'), 'utf8');
const first = new Set([...html.matchAll(/(?:src|href)="\.\/assets\/([^"]+\.js)"/g)].map((m) => m[1]));
let firstGz = 0, lazyGz = 0;
for (const f of readdirSync(DIST)) {
  if (!f.endsWith('.js')) continue;
  const gz = gzipSync(readFileSync(join(DIST, f)), { level: 9 }).length;
  if (first.has(f)) firstGz += gz; else lazyGz += gz;
}
console.log(`첫 화면 JS gzip ${(firstGz / 1024).toFixed(0)}KB · 늦게 받는 JS gzip ${(lazyGz / 1024).toFixed(0)}KB (보고만)`);
if (bad.length) { console.log('어긋남: ' + bad.join(' · ')); process.exit(1); }
console.log('번들 게이트 통과');
