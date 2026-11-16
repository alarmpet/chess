// 「끝의 모습」 캡처(2026-11-16): endgame_sim.mjs --save 가 남긴 끝 상태를 게임 저장에 심고, 판 · 섬 · 도감을 찍는다.
// 처음 상태(빈 저장)도 같은 자리에서 찍어 나란히 본다.
// dev 서버(3000): node docs/research/2026-11-16-endgame/capture-end.mjs <끝 상태 JSON> [캡처 폴더=shots]
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const SAVE = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const SHOTS = process.argv[3] || 'shots';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const W = 'window.wizardChess';
const KEYS = ['wildcrown.cards.v1', 'wildcrown.skill.v1', 'wildcrown.fx.v1', 'wildcrown.resume.v1', 'wildcrown.village.v1'];
const facts = {};

for (const [port, name, w, h, touch] of [[9591, 'desk', 1280, 800, false], [9592, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-end-${name}`;
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
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 }); writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), Buffer.from(s.result.data, 'base64')); };
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1200);
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);

  for (const [tag, village, cards] of [['start', null, null], ['end', SAVE.village, SAVE.cards]]) {
    const fx = JSON.stringify({ shake: true, quick: false, cards: true, dive: false, quests: true, blitz: false });
    const skill = JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null });
    await ev(`(${JSON.stringify(KEYS)}.forEach((k) => localStorage.removeItem(k)),
      localStorage.setItem('wildcrown.fx.v1', ${JSON.stringify(fx)}), localStorage.setItem('wildcrown.skill.v1', ${JSON.stringify(skill)}),
      ${village ? `localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(JSON.stringify(village))}),` : ''}
      ${cards ? `localStorage.setItem('wildcrown.cards.v1', ${JSON.stringify(JSON.stringify({ ...cards, firstDone: true }))}),` : `localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 0, dust: 0, shelf: [], shelfSlots: 3 })),`} 1)`);
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    await until(`${W}?.isStarted?.() && !${W}.debugBusy()`, 90000);
    await sleep(6000);
    await shot(`${name}-${tag}-board.jpg`);
    // 섬
    await ev(`document.getElementById('btn-village')?.click()`);
    await until(`Boolean(window.wcIsland)`, 30000);
    await sleep(6000);
    await ev(`(document.getElementById('village-card-open') ? 0 : 0, 1)`);
    await shot(`${name}-${tag}-island.jpg`);
    if (tag === 'end' && name === 'desk') {
      facts.village = await ev(`(() => { const v = JSON.parse(localStorage.getItem('wildcrown.village.v1')); return { island: v.island, games: v.games, coins: v.coins, built: v.built.map((b) => b.kind + ':' + (b.level || 0)), decor: v.decor.length, guests: Object.keys(v.guestBook || {}), workshop: v.workshop }; })()`);
    }
    await ev(`[...document.querySelectorAll('.village-view button')].find((b) => /체스로/.test(b.textContent || ''))?.click()`);
    await sleep(1500);
    // 도감
    await ev(`document.getElementById('btn-cards')?.click()`);
    await until(`document.querySelectorAll('.card-grid img').length > 0 || Boolean(document.getElementById('card-book'))`, 15000);
    await sleep(4000);
    await shot(`${name}-${tag}-album.jpg`);
    await ev(`(document.querySelectorAll('.panel-close').forEach((b) => b.click()), 1)`);
    await sleep(800);
  }
  await ev(`(${JSON.stringify(KEYS)}.forEach((k) => localStorage.removeItem(k)), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(`./${SHOTS}/facts.json`, OUT), JSON.stringify(facts, null, 1));
console.log(JSON.stringify(facts).slice(0, 600));
