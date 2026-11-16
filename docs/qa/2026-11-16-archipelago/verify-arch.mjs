// 군도 AR-1 ~ AR-3(2026-11-16): 섬 완성 → 지도에서 다음 섬 고르기 · 끝낸 섬 남기기와 다시 보기 · 값 곡선 · 특산물 · 왕관 섬으로 군도 끝내기.
// dev 서버(3000): node docs/qa/2026-11-16-archipelago/verify-arch.mjs [결과 파일=result-arch.json] [캡처 폴더=after]
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { BUILDINGS, KIND_ORDER, newVillage } from '../../../src/village/economy.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.argv[2] || 'result-arch.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';
const KEYS = ['wildcrown.cards.v1', 'wildcrown.skill.v1', 'wildcrown.fx.v1', 'wildcrown.resume.v1', 'wildcrown.village.v1', 'wildcrown.islands.v1'];
const SQ = ['c3', 'f3', 'c6', 'f6', 'd4', 'e5', 'b5', 'g4'];
const built8 = () => KIND_ORDER.map((kind, i) => ({ id: i + 1, kind, sq: SQ[i], tenant: null, level: 1, ready: true }));
const village = (patch) => JSON.stringify({ ...newVillage(), ...patch });
const mate = (() => { const c = new Chess(); for (const m of ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#']) c.move(m); return c.history({ verbose: true }); })();
const rec = (theme, games) => ({ theme, island: games, games, built: built8().map(({ kind, sq, level }) => ({ kind, sq, level, tenant: null })), decor: [{ kind: 'bench', sq: 'a1' }] });

for (const [port, name, w, h, touch] of [[9601, 'desk', 1280, 800, false], [9602, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-arch-${name}`;
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
  const until = async (expr, ms = 60000, step = 100) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1200);
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);
  const ready = `${W}?.isStarted?.() && !${W}.debugBusy()`;
  const base = `localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })),
    localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null })),
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }))`;
  const vil = () => ev(`JSON.parse(localStorage.getItem('wildcrown.village.v1') || 'null')`);
  const reopen = async (v) => {
    await ev(`(${base}, localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.islands.v1'), localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(v)}), 1)`);
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    await until(ready, 90000);
    await sleep(1000);
  };
  const openVillage = async () => {
    await ev(`document.getElementById('btn-village')?.click()`);
    await until(`Boolean(window.wcIsland) && Boolean(document.getElementById('village-map'))`, 30000);
    await sleep(3000);
  };

  // 1) 해초 섬 완성 → 지도에서 다음 섬 고르기: 동물 다섯은 고를 수 있고 왕관 섬은 안개
  await reopen(village({ games: 21, coins: 60, built: built8() }));
  await openVillage();
  const doneBtn = await ev(`document.getElementById('island-done')?.textContent || null`);
  const mapBtn0 = await ev(`document.getElementById('village-map').textContent`);
  await ev(`document.getElementById('island-done').click()`);
  await until(`Boolean(document.getElementById('arch-panel'))`, 5000);
  await sleep(500);
  const choose = await ev(`({ title: document.querySelector('#arch-panel .panel-title')?.textContent, picks: [...document.querySelectorAll('[data-pick]')].map((b) => b.dataset.pick), states: Object.fromEntries([...document.querySelectorAll('.arch-isle')].map((d) => [d.dataset.theme, d.dataset.state])) })`);
  await shot(`${name}-choose.jpg`);
  check(`${name} 다음 섬 고르기`, '단추 「지도에서 다음 섬 고르기」 · 🗺 1/7 · 고를 수 있는 섬 다섯(동물) · 해초 섬은 지금 · 왕관 섬은 안개', { doneBtn, mapBtn0, choose },
    /다음 섬 고르기/.test(doneBtn || '') && /1\/7/.test(mapBtn0) && choose.picks.length === 5 && choose.states.kelp === 'here' && choose.states.crown === 'fog');

  // 2) 판다 섬을 고른다: 해초 섬은 기록으로 남고, 새 섬은 빈 땅, 값이 15% 오른다
  await ev(`document.querySelector('[data-pick="panda"]').click()`);
  await sleep(1500);
  const after = await vil();
  const fieldCost = await ev(`document.querySelector('[data-kind="field"] small')?.textContent || null`);
  const mapBtn1 = await ev(`document.getElementById('village-map').textContent`);
  const photos = await ev(`JSON.parse(localStorage.getItem('wildcrown.islands.v1') || '[]').length`);
  await shot(`${name}-panda.jpg`);
  check(`${name} 판다 섬으로`, '지금 섬 panda · 기록 kelp(건물 8) · 새 섬 빈 땅 · 밭 값 🌰23(20×1.15) · 🗺 2/7 · 사진 1장', { current: after.arch.current, done: after.arch.done.map((d) => [d.theme, d.built.length]), built: after.built.length, fieldCost, mapBtn1, photos },
    after.arch.current === 'panda' && after.arch.done[0]?.theme === 'kelp' && after.arch.done[0].built.length === 8 && after.built.length === 0 && /23/.test(fieldCost || '') && /2\/7/.test(mapBtn1) && photos === 1);

  // 3) 지도에서 해초 섬 보기: 보기만(칸을 눌러도 아무 일 없음) → 지금 섬으로
  await ev(`document.getElementById('village-map').click()`);
  await until(`Boolean(document.querySelector('[data-view="kelp"]'))`, 5000);
  const look = await ev(`({ states: Object.fromEntries([...document.querySelectorAll('.arch-isle')].map((d) => [d.dataset.theme, d.dataset.state])), img: Boolean(document.querySelector('[data-theme="kelp"] img')), gift: document.querySelector('[data-theme="kelp"] .arch-gift')?.textContent })`);
  await shot(`${name}-map.jpg`);
  await ev(`document.querySelector('[data-view="kelp"]').click()`);
  await until(`Boolean(document.getElementById('arch-viewing'))`, 5000);
  await sleep(2500);
  await shot(`${name}-view-kelp.jpg`);
  const banner = await ev(`document.getElementById('arch-viewing')?.textContent || null`);
  await ev(`document.getElementById('arch-viewing-back').click()`);
  await sleep(800);
  const back = await ev(`({ banner: Boolean(document.getElementById('arch-viewing')), built: JSON.parse(localStorage.getItem('wildcrown.village.v1')).built.length })`);
  check(`${name} 지난 섬 보기`, '지도: 해초 done(사진·특산물 곡물 1) · 판다 here · 보기 막대 「해초 섬 — 21판째」 · 돌아오면 막대 없음 · 저장은 그대로', { look, banner, back },
    look.states.kelp === 'done' && look.states.panda === 'here' && look.img && /곡물 1/.test(look.gift || '') && /해초 섬/.test(banner || '') && /21판째/.test(banner || '') && !back.banner && back.built === 0);

  // 4) 판이 끝나면 지난 섬의 특산물이 온다(해초 섬: 곡물 1) — 소식 줄
  const g0 = (await vil()).grain || 0;
  await ev(`[...document.querySelectorAll('.village-view button')].find((b) => /체스로/.test(b.textContent || ''))?.click()`);
  await sleep(800);
  await ev(`(window.dispatchEvent(new CustomEvent('gamefinished', { detail: { moves: ${JSON.stringify(mate)}, color: 'w', result: 'win', rivalId: null, gameId: 7301 } })), 1)`);
  await sleep(500);
  const afterGame = await vil();
  await openVillage();
  const giftLine = await ev(`document.getElementById('village-gift-line')?.textContent || null`);
  await shot(`${name}-gift.jpg`);
  check(`${name} 특산물`, '판 끝에 곡물 +1 · 소식 줄 「지난 섬의 특산물: 🌿 곡물 1」', { grain: [g0, afterGame.grain], giftLine }, /곡물 1/.test(giftLine || '') && afterGame.grain >= g0 + 1);

  // 5) 왕관 섬 완성 → 군도 끝: 일곱 섬이 지도에 남는다, 새 섬은 없다
  const five = ['kelp', 'kangaroo', 'panda', 'rhino', 'tiger', 'lion'].map((t, i) => rec(t, 20 + i * 25));
  await reopen(village({ games: 180, coins: 99, built: built8(), arch: { current: 'crown', done: five } }));
  await openVillage();
  const crownBtn = await ev(`document.getElementById('island-done')?.textContent || null`);
  await ev(`document.getElementById('island-done').click()`);
  await until(`Boolean(document.getElementById('arch-panel'))`, 5000);
  await sleep(600);
  const fin = await vil();
  const end = await ev(`({ title: document.querySelector('#arch-panel .panel-title')?.textContent, done: [...document.querySelectorAll('.arch-isle')].filter((d) => d.dataset.state === 'done').length, picks: document.querySelectorAll('[data-pick]').length, note: document.querySelector('.arch-note')?.textContent })`);
  await shot(`${name}-finished.jpg`);
  check(`${name} 군도 완성`, '단추 「왕관 섬 완성! 군도를 끝내기」 → 7/7 · 일곱 섬 done · 고를 섬 없음 · 저장 finished · 다음 판에도 섬 그대로', { crownBtn, end, finished: fin.arch.finished, done: fin.arch.done.length, built: fin.built.length },
    /군도를 끝내기/.test(crownBtn || '') && /7\/7/.test(end.title || '') && end.done === 7 && end.picks === 0 && fin.arch.finished === true && fin.built.length === 8);

  await ev(`(${JSON.stringify(KEYS)}.forEach((k) => localStorage.removeItem(k)), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
