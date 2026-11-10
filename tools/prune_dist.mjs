// 배포에서 쓰지 않는 GLB 빼기 (방향 계획서 DR-0b, 2026-11-10). `npm run build` 가 vite build 뒤에 부른다.
// 게임은 legend 기물을 `<동물>[_s2|_s3|_s4]_w|_b.glb` 로만 읽는다(pack.json pieces·stages, islandScene 주민·영웅).
// 접미사 없는 legend 루트 GLB 는 두 갈래다 — 제작 입력(`lion.glb`·`lion_s2.glb` …, tools/build_looks.py 가 읽음)과
// study-game 예비 동물(wolf·zebra …, 어디서도 안 읽음). 둘 다 `public/` 에는 남기고(제작 도구가 쓴다) `dist/` 에서만 지운다.
// items/·town/·sea/·cards/ 와 다른 팩(cathedral 은 대체 팩, savanna 는 `?pack=savanna`)은 건드리지 않는다.
//   node tools/prune_dist.mjs [--dry]
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');
const ROOT = new URL('../dist/packs/legend/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
if (!existsSync(ROOT)) { console.error('dist/packs/legend 가 없다. 먼저 vite build'); process.exit(2); }

const KEEP = /_[wb]\.glb$/;
let n = 0, bytes = 0;
for (const f of readdirSync(ROOT)) {
  if (!f.endsWith('.glb') || KEEP.test(f)) continue;
  const p = join(ROOT, f);
  if (!statSync(p).isFile()) continue;
  bytes += statSync(p).size;
  n += 1;
  if (!DRY) unlinkSync(p);
}
console.log(`${DRY ? '(시험) ' : ''}dist/packs/legend 에서 접미사 없는 GLB ${n}개 · ${(bytes / 1048576).toFixed(1)}MB ${DRY ? '를 지울 것' : '지움'}`);
