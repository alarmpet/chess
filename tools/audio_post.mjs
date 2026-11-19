// 음원 후처리 (계획서 2026-11-11 slot-chess §9-2.5). ElevenLabs 에서 받은 원본 후보를 게임에 쓸 수 있게 다듬는다.
//   효과음: 앞뒤 무음 자르기(앞 무음은 타격 순간의 지연이 된다) → 최고점을 -1.5dB 로 맞춤
//   음악:   그대로 두고 통합 음량만 잰다(자르기·루프 잇기는 고른 뒤에 한다)
// 결과는 듣고 고르는 용도다: .reports/audio-pick/ 에 다듬은 WAV 와 index.html(후보를 눌러 듣는 표).
// 쓰는 법: node tools/audio_post.mjs [원본 폴더=D:/tmp/wc-audio/raw]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const RAW = process.argv[2] || 'D:/tmp/wc-audio/raw';
const OUT = new URL('../.reports/audio-pick/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const manifest = JSON.parse(readFileSync(new URL('../audio/manifest.json', import.meta.url), 'utf8'));
const PEAK_DB = -1.5;
const DUD_DB = -30; // 최고점이 이보다 작으면 생성이 실패해 거의 무음으로 나온 후보로 본다
const SILENCE = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01';
mkdirSync(OUT, { recursive: true });

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-nostats', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
const probe = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' }).trim());
// ffmpeg 는 분석 결과(무음·음량)를 stderr 에 쓴다.
const spawnErr = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args, '-f', 'null', '-'], { encoding: 'utf8' }).stderr || '';

const files = readdirSync(RAW).filter((f) => /\.(wav|mp3)$/i.test(f)).sort();
const rows = [];
for (const f of files) {
  const id = f.replace(/_take\d+\.\w+$/, '');
  const take = Number((f.match(/_take(\d+)/) || [0, 0])[1]);
  const src = join(RAW, f);
  const isMusic = id.startsWith('bgm-');
  const isLoop = id.endsWith('-loop');
  let seam = null;
  const out = join(OUT, f.replace(/\.\w+$/, '.wav'));
  const rawSec = probe(src);
  let lead = 0;
  if (isMusic) {
    if (/\.wav$/i.test(f)) copyFileSync(src, out); else ff(['-i', src, out]);
  } else if (isLoop) {
    // 루프는 자르지 않는다(무음을 자르면 이음새가 깨진다). 음량만 맞추고 이음새를 잰다.
    const vol = spawnErr(['-i', src, '-af', 'volumedetect']);
    const peak = Number((vol.match(/max_volume: (-?[\d.]+) dB/) || [0, 0])[1]);
    ff(['-i', src, '-af', `volume=${(PEAK_DB - peak).toFixed(2)}dB`, out]);
    seam = loopSeam(out);
  } else {
    const det = spawnErr(['-i', src, '-af', 'silencedetect=noise=-50dB:d=0.02']);
    const m = det.match(/silence_start: 0(?:\.0+)?\s[\s\S]*?silence_end: ([\d.]+)/);
    lead = m ? Number(m[1]) : 0;
    const vol = spawnErr(['-i', src, '-af', 'volumedetect']);
    const peak = Number((vol.match(/max_volume: (-?[\d.]+) dB/) || [0, 0])[1]);
    if (peak < DUD_DB) {
      // 거의 무음으로 나온 후보(생성 실패). 다듬지 않고 표에 표시만 한다.
      copyFileSync(src, out);
      rows.push({ id, take, file: f.replace(/\.\w+$/, '.wav'), rawSec: +rawSec.toFixed(2), sec: +rawSec.toFixed(2), leadSilence: 0, lufs: NaN, kb: Math.round(statSync(out).size / 1024), dud: true });
      continue;
    }
    const gain = (PEAK_DB - peak).toFixed(2);
    // 앞 무음 자르기 → 뒤집어서 뒤 무음 자르기 → 다시 뒤집기 → 끝 30ms 페이드 → 음량
    ff(['-i', src, '-af', `${SILENCE},areverse,${SILENCE},areverse,volume=${gain}dB`, out]);
    const d = probe(out);
    ff(['-i', out, '-af', `afade=t=out:st=${Math.max(0, d - 0.03).toFixed(3)}:d=0.03`, out + '.tmp.wav']);
    copyFileSync(out + '.tmp.wav', out);
    rmSync(out + '.tmp.wav');
  }
  const lufs = spawnErr(['-i', out, '-af', 'ebur128=peak=true']);
  const I = Number((lufs.match(/I:\s+(-?[\d.]+) LUFS(?![\s\S]*I:\s)/) || [0, NaN])[1]);
  rows.push({ id, take, file: f.replace(/\.\w+$/, '.wav'), rawSec: +rawSec.toFixed(2), sec: +probe(out).toFixed(2), leadSilence: +lead.toFixed(2), lufs: I, kb: Math.round(statSync(out).size / 1024), ...(seam || {}) });
}

/** 루프 이음새: 끝 → 처음으로 넘어갈 때의 표본 튐(전체 눈금 대비)과, 끝 0.1초·처음 0.1초의 세기 차이(dB). 둘 다 작을수록 매끄럽다. */
function loopSeam(file) {
  const pcm = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-f', 's16le', '-'], { maxBuffer: 1 << 28 }).stdout;
  const n = Math.floor(pcm.length / 2);
  const at = (i) => pcm.readInt16LE(i * 2) / 32768;
  const win = Math.min(4800, Math.floor(n / 4));
  const rms = (from) => { let s = 0; for (let i = from; i < from + win; i++) s += at(i) ** 2; return Math.sqrt(s / win); };
  // 이웃 표본 사이의 보통 튐과 견준다: 이음새의 튐이 그 몇 배인가
  let typical = 0;
  for (let i = 1; i < n; i += 97) typical += Math.abs(at(i) - at(i - 1));
  typical /= Math.ceil((n - 1) / 97);
  const jump = Math.abs(at(0) - at(n - 1));
  return { seamJump: +jump.toFixed(4), seamVsTypical: +(jump / (typical || 1e-9)).toFixed(1), seamEdgeDb: +(20 * Math.log10((rms(n - win) || 1e-9) / (rms(0) || 1e-9))).toFixed(1) };
}

const meta = Object.fromEntries([...manifest.sfx, ...manifest.music].map((x) => [x.id.replace(/-30s$/, ''), x]));
const groups = [...new Set(rows.map((r) => r.id))];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const html = `<!doctype html><meta charset="utf-8"><title>WILD CROWN 음원 고르기</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:980px;margin:24px auto;padding:0 16px;background:#fbf7ee;color:#222}
h2{margin:28px 0 4px;font-size:17px}p.use{margin:0 0 2px;color:#555}p.prompt{margin:0 0 8px;color:#777;font-size:13px}
.takes{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px}
.take{background:#fff;border:1px solid #e3dccb;border-radius:10px;padding:8px}audio{width:100%;height:32px}small{color:#666}</style>
<h1>WILD CROWN 음원 고르기</h1>
<p>후보를 들어 보고 마음에 드는 번호를 알려 주세요. 효과음은 앞뒤 무음을 자르고 최고점을 ${PEAK_DB}dB 로 맞춘 것입니다. 음악은 원본 그대로입니다.</p>
${groups.map((g) => { const m = meta[g.replace(/-30s$/, '')] || {}; return `<h2>${esc(g)}</h2><p class="use">${esc(m.use || '')}</p><p class="prompt">${esc(m.prompt || '')}</p><div class="takes">${rows.filter((r) => r.id === g).map((r) => `<div class="take"><b>후보 ${r.take}</b>${r.dud ? ' <b style="color:#b33">거의 무음</b>' : ''} <small>${r.sec}초${r.leadSilence ? ` · 앞 무음 ${r.leadSilence}초 자름` : ''} · ${Number.isFinite(r.lufs) ? r.lufs + ' LUFS' : ''}${r.seamVsTypical !== undefined ? ` · 이음새 튐 ${r.seamVsTypical}배 · 끝/처음 ${r.seamEdgeDb}dB` : ''}</small><audio controls ${r.id.endsWith('-loop') ? 'loop ' : ''}preload="none" src="${esc(r.file)}"></audio></div>`).join('')}</div>`; }).join('\n')}`;
writeFileSync(join(OUT, 'index.html'), html);
writeFileSync(join(OUT, 'report.json'), JSON.stringify(rows, null, 1));
console.log(`${rows.length}개 처리 → ${OUT}index.html`);
console.table(rows.map(({ id, take, rawSec, sec, leadSilence, lufs }) => ({ id, take, rawSec, sec, leadSilence, lufs })));
