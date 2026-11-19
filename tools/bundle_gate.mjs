// 번들 크기 게이트 (관리 계획서 §4.3 S1). `npm run build` 뒤에 돈다.
//   node tools/bundle_gate.mjs
// 2026-11-04 실측: JS 1,283KB(gzip 370KB) 한 덩어리, CSS 34KB(gzip 7.6KB). 상한은 실측 조금 위의 래칫이다.
// 2026-11-10 사용자 결정(방향 계획서 §7-2): JS 상한을 둘로 나눈다 — 첫 화면에 받는 JS(index.html 의 script·modulepreload)
// gzip 400KB, 늦게 받는 조각까지 더한 전체 gzip 600KB. 낚시 판·친구 창 랭크 칸·meshopt 디코더 같은 것은 늦게 받으면 된다.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/assets/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
// 2026-11-16 사용자 결정(군도 설계서 §7-3): CSS 도 JS 처럼 둘로 — 첫 화면에 받는 CSS gzip 12KB(지금까지의 상한),
// 늦게 받는 화면(마을·친구 대전 등)의 CSS 까지 더한 전체 gzip 16KB.
const LIMIT_GZ_KB = { js: 600, css: 16 };          // 전체(첫 화면 + 늦게 받는 조각)
const FIRST_CSS_GZ_KB = 12;
const LIMIT_RAW_KB = { js: 2100 };
const FIRST_GZ_KB = 400;                             // 첫 화면 JS
const FIRST_RAW_KB = 1400;

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
// 첫 화면에 받는 JS(index.html 의 script·modulepreload) 대 늦게 받는 조각.
const html = readFileSync(join(DIST, '..', 'index.html'), 'utf8');
const first = new Set([...html.matchAll(/(?:src|href)="\.\/assets\/([^"]+\.js)"/g)].map((m) => m[1]));
let firstGz = 0, firstRaw = 0, lazyGz = 0;
for (const f of readdirSync(DIST)) {
  if (!f.endsWith('.js')) continue;
  const b = readFileSync(join(DIST, f));
  const gz = gzipSync(b, { level: 9 }).length;
  if (first.has(f)) { firstGz += gz; firstRaw += b.length; } else lazyGz += gz;
}
// 첫 화면 CSS(index.html 의 stylesheet) 대 늦게 받는 CSS
const firstCss = new Set([...html.matchAll(/href="\.\/assets\/([^"]+\.css)"/g)].map((m) => m[1]));
let firstCssGz = 0, lazyCssGz = 0;
for (const f of readdirSync(DIST)) {
  if (!f.endsWith('.css')) continue;
  const gz = gzipSync(readFileSync(join(DIST, f)), { level: 9 }).length;
  if (firstCss.has(f)) firstCssGz += gz; else lazyCssGz += gz;
}
console.log(`첫 화면 CSS gzip ${(firstCssGz / 1024).toFixed(1)}KB (상한 ${FIRST_CSS_GZ_KB}KB) · 늦게 받는 CSS gzip ${(lazyCssGz / 1024).toFixed(1)}KB`);
if (firstCssGz / 1024 > FIRST_CSS_GZ_KB) bad.push(`첫 화면 CSS gzip ${(firstCssGz / 1024).toFixed(1)}KB > ${FIRST_CSS_GZ_KB}KB`);
console.log(`첫 화면 JS ${(firstRaw / 1024).toFixed(0)}KB · gzip ${(firstGz / 1024).toFixed(0)}KB (상한 gzip ${FIRST_GZ_KB}KB, 원본 ${FIRST_RAW_KB}KB) · 늦게 받는 JS gzip ${(lazyGz / 1024).toFixed(0)}KB`);
if (firstGz / 1024 > FIRST_GZ_KB) bad.push(`첫 화면 JS gzip ${(firstGz / 1024).toFixed(0)}KB > ${FIRST_GZ_KB}KB`);
if (firstRaw / 1024 > FIRST_RAW_KB) bad.push(`첫 화면 JS 원본 ${(firstRaw / 1024).toFixed(0)}KB > ${FIRST_RAW_KB}KB`);
if (bad.length) { console.log('어긋남: ' + bad.join(' · ')); process.exit(1); }
console.log('번들 게이트 통과');
