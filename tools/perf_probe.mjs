// 성능 탐침 (관리 계획서 §4.3 S1 · 엔진 선택 계획서 §5 1일차에서 지표 교체).
// 2026-11-04 교훈: ego-browser 창은 빈 페이지에서도 rAF 간격이 약 34.8ms(29Hz) 라 fps 로는 장면이 아니라 환경을 잰다
// (docs/qa/2026-11-04-drawcalls-tiles.md). 그래서 이 탐침은
//   ① 빈 페이지 rAF 간격(환경 대조) ② 프레임 콜백 안 JS 시간(stepScene + render 제출) ③ renderer.render 제출 시간 ④ 드로우콜
// 을 「같은 장면을 3번 새로 열어 각 3회 표본」으로 잰다. 판정은 ② 의 로드별 중앙값 범위가 0.5ms 이하이면 「안정」.
//   bash ~/.claude/skills/chess-character-pipeline/scripts/flow_run.sh tools/perf_probe.mjs 400
// 결과: docs/perf/<날짜>-<라벨>.json 과 한 줄 요약. 라벨은 .reports/look/label 이 있으면 그 값, 없으면 'probe'.
// GPU 시간은 이 환경에서 못 잰다(해상도 절반·장면 숨김에도 간격이 안 변함). 진짜 fps 는 실제 Chrome 창에서 따로 잰다.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const LABEL = existsSync('D:/chess/.reports/look/label') ? readFileSync('D:/chess/.reports/look/label', 'utf8').trim() : 'probe';
const DAY = new Date().toISOString().slice(0, 10);
const OUT_DIR = 'D:/chess/docs/perf';
mkdirSync(OUT_DIR, { recursive: true });
const LOG = `${OUT_DIR}/${DAY}-${LABEL}.log`;
const say = (m) => { console.log(m); appendFileSync(LOG, `${m}\n`); };
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const URL = 'http://localhost:3000/';
const LOADS = 3, SAMPLES = 3, WARMUP_MS = 12000, SAMPLE_MS = 4000;
const SAVE = { v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 3, dust: 0, shelf: [], shelfSlots: 3 };

// rAF 간격만(환경 대조용)
const rafGapMs = (page, ms) => page.evaluate((ms) => new Promise((ok) => {
  const gaps = []; let last = performance.now(); const t0 = last;
  const f = (now) => { gaps.push(now - last); last = now; if (now - t0 > ms) { gaps.sort((a, b) => a - b); ok({ median: +gaps[Math.floor(gaps.length / 2)].toFixed(1), p95: +gaps[Math.floor(gaps.length * 0.95)].toFixed(1), n: gaps.length }); } else requestAnimationFrame(f); };
  requestAnimationFrame(f);
}), ms);

// 콜백 JS 시간·render 제출 시간을 감싸서 모은다(한 번만 설치)
const installHooks = (page) => page.evaluate(() => {
  if (window.__perf) return;
  const renderer = window.wizardChess.debugRenderer();
  const js = [], render = [];
  const orig = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => orig((t) => { const a = performance.now(); cb(t); js.push(performance.now() - a); });
  const origRender = renderer.render.bind(renderer);
  renderer.render = (s, c) => { const a = performance.now(); origRender(s, c); render.push(performance.now() - a); };
  window.__perf = { js, render, orig };
});
const sampleJs = (page, ms) => page.evaluate((ms) => new Promise((ok) => {
  const p = window.__perf; p.js.length = 0; p.render.length = 0;
  const stat = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? { median: +s[Math.floor(s.length / 2)].toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), n: s.length } : null; };
  setTimeout(() => ok({ js: stat(p.js), render: stat(p.render) }), ms);
}), ms);

const task = await taskSpace(`chess perf ${LABEL}`);
try {
  const page = task.page('p1');
  await page.goto(`${URL}robots.txt`);
  await page.waitForTimeout(1000);
  const blank = await rafGapMs(page, 2500);
  say(`환경 대조(빈 페이지 rAF): ${JSON.stringify(blank)}${blank.median > 20 ? ' — 창이 rAF 를 제한함, fps 는 환경값' : ''}`);
  const loads = [];
  for (let load = 0; load < LOADS; load++) {
    await page.goto(URL);
    await page.evaluate((save) => { localStorage.clear(); localStorage.setItem('wildcrown.cards.v1', JSON.stringify(save)); }, SAVE);
    await page.goto(URL);
    await page.waitForFunction(() => window.wizardChess?.debugRenderer, undefined, { timeout: 90000 });
    await page.waitForTimeout(WARMUP_MS); // 셰이더 컴파일 구간은 버린다
    await installHooks(page);
    const samples = [];
    for (let i = 0; i < SAMPLES; i++) samples.push(await sampleJs(page, SAMPLE_MS));
    const raf = await rafGapMs(page, 2000);
    const calls = await page.evaluate(() => window.wizardChess.debugRenderCalls?.() ?? null);
    const jsMs = median(samples.map((s) => s.js.median));
    const jsP95 = median(samples.map((s) => s.js.p95));
    const renderMs = median(samples.map((s) => s.render.median));
    loads.push({ jsMs, jsP95, renderMs, rafMs: raf.median, calls, samples });
    say(`load ${load + 1}: JS ${samples.map((s) => s.js.median).join(' ')} -> ${jsMs} ms (p95 ${jsP95}) · render ${renderMs} ms · rAF ${raf.median} ms · calls ${calls}`);
  }
  const jsList = loads.map((l) => l.jsMs);
  const spread = +(Math.max(...jsList) - Math.min(...jsList)).toFixed(2);
  const result = {
    label: LABEL, date: new Date().toISOString(), url: URL,
    ua: await page.evaluate(() => navigator.userAgent),
    viewport: await page.evaluate(() => [innerWidth, innerHeight, devicePixelRatio]),
    gpu: await page.evaluate(() => { try { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); const d = g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : null; } catch { return null; } }),
    blankRafMs: blank.median,
    jsMs: median(jsList), jsP95: median(loads.map((l) => l.jsP95)), renderMs: median(loads.map((l) => l.renderMs)), rafMs: median(loads.map((l) => l.rafMs)),
    calls: loads[0].calls, spread, stable: spread <= 0.5, loads
  };
  writeFileSync(`${OUT_DIR}/${DAY}-${LABEL}.json`, JSON.stringify(result, null, 2));
  say(`결과: 콜백 JS ${result.jsMs} ms (로드별 ${jsList.join('/')}, 범위 ${spread}${result.stable ? ' — 안정' : ' — 잡음 큼, 비교 불가'}) · p95 ${result.jsP95} · render 제출 ${result.renderMs} ms · rAF ${result.rafMs} ms(빈 페이지 ${result.blankRafMs}) · 드로우콜 ${result.calls} · ${result.gpu}`);
  await page.evaluate(() => localStorage.clear());
  say('ALL DONE');
} catch (e) {
  say(`FAILED ${e.stack || e.message}`);
}
await task.finish({ keep: [] });
