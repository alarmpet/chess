// 성능 탐침 (관리 계획서 §4.3 S1 · premium-feel §13 의 「±3fps 게이트」 재시도).
// look_probe.mjs 의 측정 부분만 떼어 「같은 장면을 3번 새로 열어 각 3회 표본」으로 늘렸다. 캡처·스크린샷은 하지 않는다.
//   bash ~/.claude/skills/chess-character-pipeline/scripts/flow_run.sh tools/perf_probe.mjs 400
// 결과: docs/perf/<날짜>-<라벨>.json 과 한 줄 요약. 라벨은 .reports/look/label 이 있으면 그 값, 없으면 'probe'.
// 판정: 세 로드의 fps 중앙값 범위(최대-최소)가 3 이하이면 「안정」. 아니면 측정 잡음이 커서 비교에 쓸 수 없다고 기록한다.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const LABEL = existsSync('D:/chess/.reports/look/label') ? readFileSync('D:/chess/.reports/look/label', 'utf8').trim() : 'probe';
const DAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = 'D:/chess/docs/perf';
mkdirSync(OUT_DIR, { recursive: true });
const LOG = `${OUT_DIR}/${DAY}-${LABEL}.log`;
const say = (m) => { console.log(m); appendFileSync(LOG, `${m}\n`); };
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const URL = 'http://localhost:3000/';
const LOADS = 3, SAMPLES = 3, WARMUP_MS = 12000, SAMPLE_MS = 5000;
const SAVE = { v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 3, dust: 0, shelf: [], shelfSlots: 3 };

const frameMs = (page) => page.evaluate((ms) => new Promise((ok) => {
  const gaps = [];
  let last = performance.now();
  const t0 = last;
  const f = (now) => {
    gaps.push(now - last);
    last = now;
    if (now - t0 > ms) {
      gaps.sort((a, b) => a - b);
      ok({ median: gaps[Math.floor(gaps.length / 2)], p95: gaps[Math.floor(gaps.length * 0.95)], n: gaps.length });
    } else requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}), SAMPLE_MS);

const task = await taskSpace(`chess perf ${LABEL}`);
try {
  const page = task.page('p1');
  const loads = [];
  for (let load = 0; load < LOADS; load++) {
    await page.goto(URL);
    await page.evaluate((save) => { localStorage.clear(); localStorage.setItem('wildcrown.cards.v1', JSON.stringify(save)); }, SAVE);
    await page.goto(URL);
    await page.waitForFunction(() => window.wizardChess?.getState, undefined, { timeout: 90000 });
    await page.waitForTimeout(WARMUP_MS); // 셰이더 컴파일 구간은 버린다
    const samples = [];
    for (let i = 0; i < SAMPLES; i++) samples.push(await frameMs(page));
    const calls = await page.evaluate(() => window.wizardChess.debugRenderCalls?.() ?? null);
    const fps = Math.round(1000 / median(samples.map((s) => s.median)));
    const p95 = Math.round(median(samples.map((s) => s.p95)));
    loads.push({ fps, p95ms: p95, calls, samples });
    say(`load ${load + 1}: ${samples.map((s) => Math.round(1000 / s.median)).join(' ')} -> ${fps} fps · p95 ${p95} ms · calls ${calls}`);
  }
  const fpsList = loads.map((l) => l.fps);
  const spread = Math.max(...fpsList) - Math.min(...fpsList);
  const result = {
    label: LABEL, date: new Date().toISOString(), url: URL,
    ua: await page.evaluate(() => navigator.userAgent),
    viewport: await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]),
    gpu: await page.evaluate(() => { try { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : null; } catch { return null; } }),
    fps: median(fpsList), p95ms: median(loads.map((l) => l.p95ms)), calls: loads[0].calls, spread, stable: spread <= 3, loads
  };
  writeFileSync(`${OUT_DIR}/${DAY}-${LABEL}.json`, JSON.stringify(result, null, 2));
  say(`결과: fps 중앙값 ${result.fps} (로드별 ${fpsList.join('/')}, 범위 ${spread}${result.stable ? ' — 안정' : ' — 잡음 큼, 비교 불가'}) · p95 ${result.p95ms} ms · 드로우콜 ${result.calls} · ${result.gpu}`);
  await page.evaluate(() => localStorage.clear());
  say('ALL DONE');
} catch (e) {
  say(`FAILED ${e.stack || e.message}`);
}
await task.finish({ keep: [] });
