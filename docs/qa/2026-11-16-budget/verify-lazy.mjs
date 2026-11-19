// 예산 비우기(2026-11-16): 누를 때만 받는 화면 다섯이 실제로 열리는가.
// 마을 · 외형 · 라이벌 · 설정 · 친구 대전(👫 단추와 초대 링크 ?room=). 처음에는 그 조각을 받지 않았는지도 본다.
// dev 서버(3000) 또는 빌드판(WC_URL=http://localhost:4173/): node docs/qa/2026-11-16-budget/verify-lazy.mjs [결과 파일] [캡처 폴더]
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const CLASSIC = `${BASE}?lab=classic`;   // 보통 체스로 연다 — 계약전이 기본이 된 뒤(11-18)에도 이 검증은 보통 판을 본다
const RESULT = process.argv[2] || 'result-lazy.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';
const KEYS = ['wildcrown.cards.v1', 'wildcrown.skill.v1', 'wildcrown.fx.v1', 'wildcrown.resume.v1'];

for (const [port, name, w, h, touch] of [[9581, 'desk', 1280, 800, false], [9582, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-lazy-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', `--window-size=${w},${h}`, `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
    if (!wsUrl) await sleep(500);
  }
  const ws = new WebSocket(wsUrl);
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await new Promise((ok) => { ws.onopen = ok; });
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const until = async (expr, ms = 60000, step = 50) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1200);
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);
  await ev(`(localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })),
    localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null })),
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false })), localStorage.removeItem('wildcrown.resume.v1'), 1)`);
  await send('Page.navigate', { url: CLASSIC });
  await sleep(1500);
  await until(`${W}?.isStarted?.() && !${W}.debugBusy()`, 90000);
  await sleep(1500);
  // 처음 받은 스크립트: 늦게 받는 화면의 조각 이름이 없어야 한다(dev 는 파일 이름, 빌드는 조각 이름으로 본다)
  const loaded = () => ev(`performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /\\.(js|tsx|ts)(\\?|$)/.test(n)).map((n) => n.split('/').pop().split('?')[0])`);
  const first = await loaded();
  const lazyNames = ['VillageView', 'LookPanel', 'RivalPanel', 'SettingsPanel', 'Online', 'HandBrain'];
  const early = lazyNames.filter((n) => first.some((f) => f.startsWith(n)));
  check(`${name} 처음에는 안 받음`, '마을·외형·라이벌·설정·친구 대전·손과 뇌 조각을 받지 않았다', { early, scripts: first.length }, early.length === 0);

  // 한 화면씩 연다. 메뉴 안에 있는 단추는 메뉴를 먼저 연다.
  const menu = `[...document.querySelectorAll('button')].find((b) => /메뉴|☰/.test(b.textContent || ''))?.click()`;
  const cases = [
    ['마을', `document.getElementById('btn-village').click()`, `Boolean(document.getElementById('village-workshop'))`, 'VillageView', `document.querySelector('.village-view .hud-btn:last-child, #village-close')?.click()`],
    ['라이벌', `document.getElementById('btn-rivals').click()`, `[...document.querySelectorAll('.panel-title')].some((t) => /라이벌/.test(t.textContent || ''))`, 'RivalPanel', null],
    ['외형', `(${menu}, setTimeout(() => document.getElementById('btn-looks')?.click(), 300))`, `[...document.querySelectorAll('.panel-title')].some((t) => /외형/.test(t.textContent || ''))`, 'LookPanel', null],
    ['설정', `(${menu}, setTimeout(() => document.getElementById('btn-settings')?.click(), 300))`, `[...document.querySelectorAll('.panel-title')].some((t) => /설정/.test(t.textContent || ''))`, 'SettingsPanel', null],
    ['친구 대전', `document.getElementById('btn-online').click()`, `[...document.querySelectorAll('.panel-title')].some((t) => /친구/.test(t.textContent || ''))`, 'Online', null]
  ];
  for (const [label, open, shown, chunk] of cases) {
    await ev(open);
    const ok = await until(shown, 20000);
    await sleep(500);
    await shot(`${name}-${chunk}.jpg`);
    const now = await loaded();
    check(`${name} ${label} 열림`, '누르면 조각을 받아 창이 뜬다', { ok, got: now.some((f) => f.startsWith(chunk)) }, ok && now.some((f) => f.startsWith(chunk)));
    // 닫기: 열린 창의 ✕ 또는 Esc
    await ev(`(document.querySelectorAll('.panel-close').forEach((b) => b.click()), document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })), 1)`);
    if (label === '마을') { await ev(`[...document.querySelectorAll('.village-view button')].find((b) => /체스로/.test(b.textContent || ''))?.click()`); }
    await sleep(800);
  }
  // 마을을 닫으면 판이 다시 그려진다(마을이 그리기를 멈췄다가 푼다)
  const frames = await ev(`new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else ok(n); }; requestAnimationFrame(f); })`);
  const calls = await ev(`${W}.debugRenderCalls()`);
  check(`${name} 마을 닫은 뒤 판`, '판이 다시 그려진다(드로우콜 > 0)', { frames, calls }, calls > 0);

  // 초대 링크로 들어오면 친구 대전 조각을 바로 받는다
  await send('Page.navigate', { url: `${BASE}?room=ABCDEF` });
  await sleep(1500);
  await until(`${W}?.isStarted?.()`, 90000);
  const bar = await until(`Boolean(document.getElementById('online-bar'))`, 30000);
  await shot(`${name}-room.jpg`);
  check(`${name} 초대 링크`, '?room= 으로 열면 방 막대가 뜬다', { bar, code: await ev(`document.querySelector('#online-bar .online-code')?.textContent || null`) }, bar);
  await ev(`(sessionStorage.clear(), ${JSON.stringify(KEYS)}.forEach((k) => localStorage.removeItem(k)), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
