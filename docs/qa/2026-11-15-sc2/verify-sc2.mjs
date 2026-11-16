// 슬롯 체스 「안 된 것」 1차(2026-11-15): 스위치 없이 켜는 입구 · 계약전 보상(SC-2) · 고른 음원.
// dev 서버(3000): node docs/qa/2026-11-15-sc2/verify-sc2.mjs [결과 파일=result-sc2.json] [캡처 폴더=after]
// 주소에 ?lab=contract 를 붙이지 않는다 — 메뉴 단추로 켜고, 다시 열어도 켜져 있는지 본다.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { sanitizeVillage } from '../../../src/village/economy.js';

// 마을 저장이 아직 없으면 새 마을의 시작 도토리에서 센다
const START_COINS = sanitizeVillage(null).coins;

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.argv[2] || 'result-sc2.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';
const mv = (s) => s.split(' ').map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4) }));
// 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.Nf3 Bg4 5.h3 Bxf3 6.Qxf3 c6 — 백 차례, 7.Qxf7+ 가 두 번째 폰 = 왕관 완성
const LINE_FINAL = mv('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 g1f3 c8g4 h2h3 g4f3 d1f3 c7c6');
const KEYS = ['wildcrown.cards.v1', 'wildcrown.skill.v1', 'wildcrown.fx.v1', 'wildcrown.resume.v1', 'wildcrown.contract.v1', 'wildcrown.village.v1'];
const FILES = ['reel-rise', 'reel-stop', 'reel-stop-final', 'matchpoint-hush', 'sting-win', 'sting-lose'];

for (const [port, name, w, h, touch] of [[9561, 'desk', 1280, 800, false], [9562, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-sc2-${name}`;
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
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (touch) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await sleep(1200);
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);
  const tap = async (r, c) => {
    const p = await ev(`${W}.debugSquareClient(${r}, ${c})`);
    if (touch) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(120);
  };
  const play = async (r1, c1, r2, c2) => {
    const n = await ev(`${W}.debugHistory().length`);
    for (let i = 0; i < 3; i++) {
      await tap(r1, c1); await tap(r2, c2);
      if (await until(`${W}.debugHistory().length > ${n}`, 2500)) return true;
      console.log('⚠️ 누르기가 안 먹음 — 다시 누른다', i + 1);
      await sleep(800);
    }
    return false;
  };
  const base = `localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })),
    localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null })),
    localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }))`;
  const ready = `${W}?.isStarted?.() && !${W}.debugBusy()`;
  const coinsNow = `(JSON.parse(localStorage.getItem('wildcrown.village.v1') || 'null')?.coins ?? ${START_COINS})`;

  // 1) 처음에는 꺼져 있다(주소에 스위치 없음)
  await ev(`(${base}, localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);
  await send('Page.navigate', { url: BASE });
  await sleep(1500);
  await until(ready, 90000);
  await sleep(1500);
  const off = await ev(`({ on: ${W}.isContractOn(), reel: ${W}.debugReel().contract, url: location.search })`);
  check(`${name} 처음에는 끔`, '스위치 없는 주소 · 계약전 끔 · 이번 판에 계약 없음', off, off.on === false && off.reel === null && off.url === '');

  // 2) 메뉴에서 켠다: 단추가 「켬」이 되고 저장에 남는다
  await ev(`[...document.querySelectorAll('button')].find((b) => /메뉴|☰/.test(b.textContent || ''))?.click()`);
  await until(`Boolean(document.getElementById('btn-contract'))`, 5000);
  await sleep(600);
  const btn0 = await ev(`(() => { const b = document.getElementById('btn-contract'); if (!b) return null; const r = b.getBoundingClientRect(); return { text: b.textContent, inView: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && r.width > 0, h: Math.round(r.height) }; })()`);
  await ev(`document.getElementById('btn-contract')?.click()`);
  await sleep(500);
  await shot(`${name}-menu-on.jpg`);
  const on = await ev(`({ on: ${W}.isContractOn(), text: document.getElementById('btn-contract')?.textContent, pressed: document.getElementById('btn-contract')?.getAttribute('aria-pressed'), saved: JSON.parse(localStorage.getItem('wildcrown.contract.v1') || 'null')?.on })`);
  check(`${name} 메뉴에서 켬`, '단추가 화면 안 · 「끔」→「켬」 · 저장 on=true', { before: btn0, after: on }, Boolean(btn0?.inView) && /끔/.test(btn0.text) && on.on === true && /켬/.test(on.text || '') && on.pressed === 'true' && on.saved === true);

  // 3) 다시 열어도 켜져 있고(스위치 없는 주소), 새 판이 계약전으로 열린다
  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), 1)`);
  await send('Page.navigate', { url: BASE });
  await sleep(1500);
  await until(ready, 90000);
  const opened = await until(`${W}.debugReel().contract !== null`, 30000);
  await sleep(3000);
  await shot(`${name}-new-game.jpg`);
  const reel = await ev(`({ on: ${W}.isContractOn(), reel: ${W}.debugReel(), url: location.search, hud: Boolean(document.getElementById('contract-hud')), samples: ${W}.debugSamples() })`);
  check(`${name} 다시 열어도 켬`, '주소에 스위치 없음 · 계약 p2nb(첫 판 고정) · 목표판 보임', { opened, on: reel.on, contract: reel.reel.contract, plays: reel.reel.plays, url: reel.url, hud: reel.hud }, opened && reel.on && reel.reel.contract === 'p2nb' && reel.url === '' && reel.hud);
  const files = await ev(`Promise.all(${JSON.stringify(FILES)}.map((f) => fetch('./audio/' + f + '.ogg').then((r) => r.arrayBuffer().then((b) => [f, r.status, b.byteLength]))))`);
  check(`${name} 음원 파일`, '여섯 개 모두 200 · 합 40KB 이하 · 엔진이 여섯 개를 받아 둠', { files, samples: reel.samples }, files.every((f) => f[1] === 200 && f[2] > 1000) && files.reduce((a, f) => a + f[2], 0) < 40000 && reel.samples.asked === true && reel.samples.ready.length + reel.samples.waiting.length === 6);

  // 4) 계약으로 이긴 판: 결과 상자에 「도토리 +18」, 마을 도토리가 18 는다. 한 번만.
  for (let tries = 0; tries < 3; tries++) {
    await ev(`(${base}, localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, on: true, games: 5, win: 3, loss: 2, draw: 0, byReason: {}, last: null, rung: 0, lossRun: 0 })),
      localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves: LINE_FINAL, contract: 'p2nb' }))}), 1)`);
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    if (await until(`${ready} && ${W}.debugHistory().length === ${LINE_FINAL.length}`, tries < 2 ? 45000 : 90000)) break;
    console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1);
  }
  await sleep(1500);
  const coins0 = await ev(coinsNow);
  const games0 = await ev(`(JSON.parse(localStorage.getItem('wildcrown.village.v1') || '{}').games || 0)`);
  await play(5, 5, 1, 5);
  await until(`${W}.debugContract().gameOver === true`, 15000);
  await until(`Boolean(document.getElementById('contract-pay'))`, 8000);
  await sleep(2200);
  await shot(`${name}-win-pay.jpg`);
  const pay = await ev(`(() => { const p = document.getElementById('contract-pay'); const r = p?.getBoundingClientRect(); const v = JSON.parse(localStorage.getItem('wildcrown.village.v1') || '{}');
    return { text: p?.textContent || null, inView: Boolean(r && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth), coins: v.coins || 0, games: v.games || 0, end: ${W}.debugContract().end }; })()`);
  check(`${name} 이긴 판 보상`, '결과 상자에 「도토리 +18」(화면 안) · 마을 도토리 +18 · 마을 판 수 그대로', { coins0, startCoins: START_COINS, games0, ...pay }, /\+18/.test(pay.text || '') && pay.inView && pay.coins === coins0 + 18 && pay.games === games0 && pay.end?.result === 'win');
  await sleep(1500);
  const again = await ev(coinsNow);
  check(`${name} 한 번만 준다`, '기다려도 더 늘지 않는다', { again, want: coins0 + 18 }, again === coins0 + 18);

  // 5) 끄면 저장도 꺼진다
  await ev(`${W}.setContractLab(false, true)`);
  const offAgain = await ev(`({ on: ${W}.isContractOn(), saved: JSON.parse(localStorage.getItem('wildcrown.contract.v1') || 'null')?.on })`);
  check(`${name} 다시 끔`, '계약전 끔 · 저장 on=false', offAgain, offAgain.on === false && offAgain.saved === false);

  await ev(`(${JSON.stringify(KEYS)}.forEach((k) => localStorage.removeItem(k)), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
