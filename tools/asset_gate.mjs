// 에셋 게이트 (관리 계획서 §4.3 S1 · 기획서 §7). 의존성 없이 GLB 를 직접 읽는다.
//   node tools/asset_gate.mjs            # 상한과 대조해 어긋나면 종료 코드 1
//   node tools/asset_gate.mjs --report   # 값만 표로 출력(상한 판정 없음)
// 재는 것: 파일 크기(KB) · 삼각형 수(노드가 참조하는 메시 합) · 본 수(skins.joints 최대) · 텍스처 최대 변 · 텍스처 수.
// 더해서 pack.json 의 기물 model(w/b)·stages 가 실제 GLB 를 가리키는지 본다.
// 상한은 2026-11-04 실측 위에 둔 「래칫」이다(현재 최대값 조금 위). 자산을 가볍게 만들수록 상한을 내린다.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const REPORT = process.argv.includes('--report');
const ROOT = new URL('../public/packs/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// 범주별 상한. null 은 「재기만 하고 판정하지 않음」.
const LIMITS = {
  'legend': { tri: 20000, bones: 24, tex: 1024, kb: 1400, label: '기물(legend)' },
  'legend/items': { tri: 3000, bones: 0, tex: 512, kb: 300, label: '소품' },
  'legend/town': { tri: 16000, bones: 0, tex: 1024, kb: 700, label: '건물' },
  'legend/sea': { tri: 14000, bones: 0, tex: 1024, kb: 800, label: '바다' },
  'savanna': null,
  'cathedral': null
};
const TOTAL_KB_LIMIT = 120000; // 2026-11-04 실측 104,397KB. S4 목표는 40,000KB(추정) — 내려가는 대로 고친다.

function glbJson(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  const len0 = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + len0).toString('utf8'));
  let bin = null;
  const off = 20 + len0;
  if (off + 8 <= buf.length && buf.readUInt32LE(off + 4) === 0x004e4942) bin = buf.subarray(off + 8, off + 8 + buf.readUInt32LE(off));
  return { json, bin };
}

function imageDims(bytes) {
  if (!bytes || bytes.length < 30) return null;
  const s = (a, b) => bytes.subarray(a, b).toString('latin1');
  if (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') {
    const kind = s(12, 16);
    if (kind === 'VP8 ') return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
    if (kind === 'VP8L') { const b = bytes.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
    if (kind === 'VP8X') return [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1];
  }
  if (bytes[0] === 0x89 && s(1, 4) === 'PNG') return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const m = bytes[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [bytes.readUInt16BE(i + 7), bytes.readUInt16BE(i + 5)];
      i += 2 + bytes.readUInt16BE(i + 2);
    }
  }
  return null;
}

function measure(file) {
  const buf = readFileSync(file);
  const { json, bin } = glbJson(buf);
  const acc = json.accessors || [];
  const meshTri = (json.meshes || []).map((m) => (m.primitives || []).reduce((n, p) => {
    const mode = p.mode ?? 4;
    const count = p.indices != null ? acc[p.indices].count : acc[p.attributes?.POSITION]?.count ?? 0;
    return n + (mode === 4 ? count / 3 : mode === 5 || mode === 6 ? Math.max(0, count - 2) : 0);
  }, 0));
  let tri = 0;
  for (const n of json.nodes || []) if (n.mesh != null) tri += meshTri[n.mesh];
  const bones = Math.max(0, ...(json.skins || []).map((s) => s.joints.length));
  let tex = 0;
  const views = json.bufferViews || [];
  for (const img of json.images || []) {
    if (img.bufferView == null || !bin) continue;
    const v = views[img.bufferView];
    const d = imageDims(bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength));
    if (d) tex = Math.max(tex, d[0], d[1]);
  }
  return { tri: Math.round(tri), bones, tex, images: (json.images || []).length, kb: Math.round(buf.length / 1024), clips: (json.animations || []).length };
}

const rows = [];
const problems = [];
let totalKb = 0;
for (const [cat, lim] of Object.entries(LIMITS)) {
  const dir = join(ROOT, cat);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.glb')).sort()) {
    const path = join(dir, f);
    let m;
    try { m = measure(path); } catch (e) { problems.push(`${cat}/${f}: 읽기 실패 — ${e.message}`); continue; }
    totalKb += m.kb;
    rows.push({ cat, f, ...m });
    if (!lim || REPORT) continue;
    if (m.tri > lim.tri) problems.push(`${cat}/${f}: 삼각형 ${m.tri} > ${lim.tri}`);
    if (m.bones > lim.bones) problems.push(`${cat}/${f}: 본 ${m.bones} > ${lim.bones}`);
    if (m.tex > lim.tex) problems.push(`${cat}/${f}: 텍스처 ${m.tex} > ${lim.tex}`);
    if (m.kb > lim.kb) problems.push(`${cat}/${f}: ${m.kb}KB > ${lim.kb}KB`);
  }
}

// pack.json 참조 검사: 기물 model(w/b) 과 stages 가 파일로 있는지.
for (const pack of ['legend', 'savanna', 'cathedral']) {
  const pj = join(ROOT, pack, 'pack.json');
  if (!existsSync(pj)) continue;
  const man = JSON.parse(readFileSync(pj, 'utf8'));
  const need = new Set();
  const add = (m) => { if (typeof m === 'string') need.add(m); else if (m && typeof m === 'object') Object.values(m).forEach((v) => typeof v === 'string' && need.add(v)); };
  for (const p of Object.values(man.pieces || {})) {
    add(p.model);
    for (const st of Object.values(p.stages || {})) add(st.model ?? st);
  }
  // assetBase 는 public/ 기준 상대 경로("./packs/legend/", "./assets/glb/"). 대성당 팩은 .glb.gz.b64 로 들어 있다.
  const base = join(ROOT, '..', man.assetBase || `./packs/${pack}/`);
  for (const name of need) {
    if (!existsSync(join(base, `${name}.glb`)) && !existsSync(join(base, `${name}.glb.gz.b64`))) problems.push(`${pack}/pack.json: 모델 ${name} 이 ${man.assetBase} 에 없음`);
  }
}

// 표 출력
const byCat = {};
for (const r of rows) (byCat[r.cat] ||= []).push(r);
for (const [cat, list] of Object.entries(byCat)) {
  const mx = (k) => Math.max(...list.map((r) => r[k]));
  const lim = LIMITS[cat];
  console.log(`\n[${cat}] ${list.length}개 · 합 ${list.reduce((a, r) => a + r.kb, 0)}KB · 최대 tri ${mx('tri')} / 본 ${mx('bones')} / 텍스처 ${mx('tex')} / ${mx('kb')}KB` + (lim ? ` · 상한 tri ${lim.tri} 본 ${lim.bones} 텍스처 ${lim.tex} ${lim.kb}KB` : ' · 판정 없음'));
  if (REPORT) for (const r of list) console.log(`  ${r.f.padEnd(22)} tri ${String(r.tri).padStart(6)}  본 ${String(r.bones).padStart(3)}  텍스처 ${String(r.tex).padStart(4)}×${r.images}  ${String(r.kb).padStart(5)}KB  클립 ${r.clips}`);
}
console.log(`\n전체 GLB ${rows.length}개 · ${totalKb}KB (상한 ${TOTAL_KB_LIMIT}KB)`);
if (!REPORT && totalKb > TOTAL_KB_LIMIT) problems.push(`전체 ${totalKb}KB > ${TOTAL_KB_LIMIT}KB`);

if (problems.length) {
  console.log(`\n어긋남 ${problems.length}건:`);
  for (const p of problems) console.log('  - ' + p);
  if (!REPORT) process.exit(1);
} else console.log('\n에셋 게이트 통과');
