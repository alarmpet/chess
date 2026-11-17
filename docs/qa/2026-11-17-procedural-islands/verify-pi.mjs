// 절차적 섬 PI-1 ~ PI-3(2026-11-17): 섬마다 체스 판 화면의 해안선이 바뀌는가 · 군도 지도에 일곱 섬 그림이 서로 다른가.
// dev 서버(3000): node docs/qa/2026-11-17-procedural-islands/verify-pi.mjs [결과 파일=result-pi.json] [캡처 폴더=after]
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { KIND_ORDER, newVillage } from '../../../src/village/economy.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.argv[2] || 'result-pi.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const measured = {};
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';
const KEYS = ['wildcrown.cards.v1', 'wildcrown.skill.v1', 'wildcrown.fx.v1', 'wildcrown.resume.v1', 'wildcrown.village.v1', 'wildcrown.islands.v1'];
const THEMES = ['kelp', 'kangaroo', 'panda', 'rhino', 'tiger', 'lion', 'crown'];
const SQ = ['c3', 'f3', 'c6', 'f6', 'd4', 'e5', 'b5', 'g4'];
const rec = (theme) => ({ theme, island: 1, games: 20, built: KIND_ORDER.map((kind, i) => ({ kind, sq: SQ[i], level: 1, tenant: null })), decor: [] });

for (const [port, name, w, h, touch] of [[9611, 'desk', 1280, 800, false], [9612, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-pi-${name}`;
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
  const errors = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description?.slice(0, 160)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(String(m.params.args?.[0]?.value || '').slice(0, 200)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await new Promise((ok) => { ws.onopen = ok; });
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const until = async (expr, ms = 60000, step = 100) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1200);
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);
  const base = `localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })),
    localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null })),
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }))`;
  const ready = `${W}?.isStarted?.() && !${W}.debugBusy()`;

  // 1) 섬마다 판 화면: 해안선이 그 섬을 따른다(일곱 장). 드로우콜은 그대로.
  const coasts = {};
  for (const theme of THEMES) {
    const v = { ...newVillage(), games: 30, arch: { current: theme, done: [], seed: 1234 } };
    await ev(`(${base}, localStorage.removeItem('wildcrown.resume.v1'), localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(JSON.stringify(v))}), 1)`);
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    await until(ready, 90000);
    await until(`${W}.debugIslandCoast?.().on === true`, 20000);
    await sleep(2500);
    coasts[theme] = await ev(`${W}.debugIslandCoast()`);
    if (name === 'desk' || theme === 'kelp' || theme === 'tiger') await shot(`${name}-board-${theme}.jpg`);
  }
  measured[name] = coasts;
  const keys = THEMES.map((t) => coasts[t]?.key);
  check(`${name} 판 화면 해안선`, '일곱 섬 모두 해안선이 그 섬을 따른다(on) · 열쇠 일곱이 서로 다름 · 드로우콜 ≤ 72', { keys, calls: THEMES.map((t) => coasts[t]?.calls) },
    THEMES.every((t) => coasts[t]?.on) && new Set(keys).size === 7 && THEMES.every((t) => coasts[t].calls <= 72));

  // 1-2) 게임 중에 섬을 옮기면(마지막으로 연 왕관 섬 → 사자 섬) 바다 생물이 새 해안을 따라 다시 놓인다 — 모래 위의 산호 0
  await until(`(${W}.debugIslandCoast().reef?.total || 0) > 20`, 30000);
  const reef0 = (await ev(`${W}.debugIslandCoast()`)).reef;
  await ev(`${W}.setIslandCoast('lion', 1234)`);
  await sleep(500);
  await until(`(${W}.debugIslandCoast().reef?.total || 0) > 20`, 30000);
  await sleep(800);
  const reef1 = (await ev(`${W}.debugIslandCoast()`)).reef;
  check(`${name} 섬을 옮기면 산호를 다시 놓음`, '옮긴 뒤 산호 자리가 바뀌고(지문이 다름) 모래 위에는 0', { before: reef0, after: reef1 }, reef0?.total > 20 && reef1?.total > 20 && reef1.onSand === 0 && reef1.sig !== reef0.sig);

  // 2) 군도 지도: 일곱 섬 그림이 캔버스로, 사진 없이. 끝낸 섬은 색, 안 간 섬은 실루엣.
  const v = { ...newVillage(), games: 120, arch: { current: 'tiger', done: ['kelp', 'kangaroo', 'panda', 'rhino'].map(rec), seed: 1234 } };
  await ev(`(${base}, localStorage.removeItem('wildcrown.islands.v1'), localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(JSON.stringify(v))}), 1)`);
  await send('Page.navigate', { url: BASE });
  await sleep(1500);
  await until(ready, 90000);
  await ev(`document.getElementById('btn-village')?.click()`);
  await until(`Boolean(document.getElementById('village-map'))`, 30000);
  await sleep(2000);
  await ev(`document.getElementById('village-map').click()`);
  await until(`document.querySelectorAll('.arch-canvas').length === 7`, 8000);
  await sleep(600);
  const pics = await ev(`[...document.querySelectorAll('.arch-canvas')].map((c) => { const g = c.getContext('2d'); const d = g.getImageData(0, 0, 48, 48).data; let land = 0, sum = 0; for (let i = 0; i < d.length; i += 4) { sum = (sum * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13) >>> 0; if (d[i + 2] <= d[i] || d[i + 1] > d[i + 2]) land++; } return { island: c.dataset.island, state: c.closest('.arch-isle').dataset.state, hash: sum, land }; })`);
  await shot(`${name}-map.jpg`);
  check(`${name} 지도 섬 그림`, '캔버스 일곱 · 그림이 모두 다름 · 끝낸 섬(4)에는 땅 색이 있고 안개 섬은 실루엣(땅 색 0)', pics,
    pics.length === 7 && new Set(pics.map((p) => p.hash)).size === 7 && pics.filter((p) => p.state === 'done').every((p) => p.land > 20) && pics.filter((p) => p.state === 'fog').every((p) => p.land === 0));
  check(`${name} 오류 없음`, '셰이더·페이지 오류 0', errors.slice(0, 4), errors.length === 0);

  await ev(`(${JSON.stringify(KEYS)}.forEach((k) => localStorage.removeItem(k)), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, measured, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
