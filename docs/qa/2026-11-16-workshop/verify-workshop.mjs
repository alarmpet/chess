// 공방 WS-1(2026-11-16): 받기 · 판 끝 진도와 부품 · 곡물 사기 · 골라 만들기 · 섬에 그려짐 · 계약전 결과 줄.
// dev 서버(3000): node docs/qa/2026-11-16-workshop/verify-workshop.mjs [결과 파일=result-workshop.json] [캡처 폴더=after]
// 마을 저장을 심고 마을을 열어 실제 단추를 누른다. 판 끝은 엔진이 내는 gamefinished 사건을 같은 모양으로 보낸다(정산 경로를 본다).
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { newVillage } from '../../../src/village/economy.js';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const CLASSIC = `${BASE}?lab=classic`;   // 보통 체스로 연다 — 계약전이 기본이 된 뒤(11-18)에도 이 검증은 보통 판을 본다
const RESULT = process.argv[2] || 'result-workshop.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';
const KEYS = ['wildcrown.cards.v1', 'wildcrown.skill.v1', 'wildcrown.fx.v1', 'wildcrown.resume.v1', 'wildcrown.contract.v1', 'wildcrown.village.v1'];
const mate = (() => { const c = new Chess(); for (const m of ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#']) c.move(m); return c.history({ verbose: true }); })();
const mv = (s) => s.split(' ').map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4) }));
const LINE_FINAL = mv('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 g1f3 c8g4 h2h3 g4f3 d1f3 c7c6');
const village = (patch) => JSON.stringify({ ...newVillage(), ...patch });

for (const [port, name, w, h, touch] of [[9571, 'desk', 1280, 800, false], [9572, 'phone', 390, 844, true]]) {
  const dir = `${process.env.TEMP}/wc-ws-${name}`;
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
  // 슬롯머신(11-18): 레버를 기다리지 않고 바로 당기는 사람 흉내 — 문서가 열릴 때마다 심는다
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'setInterval(() => { try { window.wizardChess?.pullLever?.(); } catch (e) {} }, 120);' });
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const until = async (expr, ms = 60000, step = 50) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
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
  // 마을 저장을 심고 판 화면을 다시 연다
  const reopen = async (v, extra = '') => {
    await ev(`(${base}, localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(v)}), ${extra || '1'}, 1)`);
    await send('Page.navigate', { url: CLASSIC });
    await sleep(1500);
    await until(ready, 90000);
    await sleep(1200);
  };
  const openVillage = async () => {
    await ev(`document.getElementById('btn-village')?.click()`);
    await until(`Boolean(window.wcIsland) && Boolean(document.getElementById('village-workshop'))`, 30000);
    await sleep(2500);
  };
  const click = async (x, y) => {
    if (touch) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
    }
  };

  // 1) 한 판만 끝낸 마을: 공방은 아직 — 창에 「1/2」
  await reopen(village({ games: 1 }));
  await openVillage();
  await ev(`document.getElementById('village-workshop').click()`);
  await until(`Boolean(document.getElementById('workshop-panel'))`, 5000);
  const early = await ev(`({ wait: document.getElementById('workshop-wait')?.textContent || null, claim: Boolean(document.getElementById('workshop-claim')), glow: document.getElementById('village-workshop').classList.contains('village-new') })`);
  check(`${name} 아직 못 받음`, '「판을 2번 끝내면」 (1/2) · 받기 단추 없음 · 🔨 깜빡이지 않음', early, /1\/2/.test(early.wait || '') && !early.claim && !early.glow);

  // 2) 두 판 끝낸 마을: 🔨 가 빛나고, 받으면 공방이 서고 곡물 3
  await reopen(village({ games: 2, coins: 40 }));
  await openVillage();
  const offer = await ev(`({ glow: document.getElementById('village-workshop').classList.contains('village-new'), line: document.getElementById('village-workshop-offer')?.textContent || null })`);
  await ev(`document.getElementById('village-workshop').click()`);
  await until(`Boolean(document.getElementById('workshop-claim'))`, 5000);
  await shot(`${name}-claim.jpg`);
  await ev(`document.getElementById('workshop-claim').click()`);
  await until(`Boolean(document.getElementById('workshop-meters'))`, 5000);
  await sleep(2500);
  const got = await vil();
  const drawn = await ev(`window.wcIsland?.debugWorkshop?.()`);
  await ev(`document.querySelector('#workshop-panel .panel-close')?.click()`);
  await sleep(600);
  await shot(`${name}-island.jpg`);
  check(`${name} 공방 받기`, '🔨 빛남 · 안내 줄 · 받으면 공방(빈 칸) · 곡물 3 · 도토리 그대로 · 섬에 그려짐', { offer, workshop: got.workshop, grain: got.grain, coins: got.coins, drawn },
    offer.glow && Boolean(offer.line) && /^[a-h][1-8]$/.test(got.workshop?.sq || '') && got.grain === 3 && got.coins === 40 && drawn?.shown === true);

  // 3) 섬의 공방을 누르면 공방 창이 열린다
  const spot = await ev(`window.wcIsland.debugWorkshop()`);
  await click(spot.x, spot.y);
  const tapped = await until(`Boolean(document.getElementById('workshop-panel'))`, 4000);
  check(`${name} 공방을 눌러 열기`, '섬의 공방을 누르면 공방 창', { spot, tapped }, tapped);
  await ev(`document.querySelector('#workshop-panel .panel-close')?.click()`);

  // 4) 판이 끝나면: 진도 +1일, 곡물 1 → 부품 2. 마을 소식 줄에 적힌다.
  await reopen(village({ games: 3, coins: 40, grain: 3, workshop: { sq: 'e2', work: 0, parts: 0, made: 0, crafted: 0 } }));
  await ev(`(window.dispatchEvent(new CustomEvent('gamefinished', { detail: { moves: ${JSON.stringify(mate)}, color: 'w', result: 'win', rivalId: null, gameId: 9101 } })), 1)`);
  await sleep(400);
  const after1 = await vil();
  await openVillage();
  const line = await ev(`document.getElementById('village-work-line')?.textContent || null`);
  await ev(`document.getElementById('village-workshop').click()`);
  await until(`Boolean(document.getElementById('workshop-meters'))`, 5000);
  await sleep(400);
  const meters = await ev(`({ work: document.getElementById('workshop-work')?.textContent, grain: document.getElementById('workshop-grain')?.textContent, parts: document.getElementById('workshop-parts')?.textContent })`);
  await shot(`${name}-panel.jpg`);
  check(`${name} 판 끝 진도·부품`, '진도 +1일 → 곡물 1 로 부품 2 · 소식 줄 「공방 진도 +1일 · 부품 +2」 · 창의 막대가 같은 값', { workshop: after1.workshop, line, meters },
    after1.workshop.parts === 2 && after1.workshop.work === 0 && /\+1일/.test(line || '') && /부품 \+2/.test(line || '') && /^2\//.test(meters.parts || ''));

  // 5) 곡물 사기: 도토리 3 → 곡물 +1
  const g0 = (await vil()).grain;
  const c0 = (await vil()).coins;
  await ev(`document.getElementById('workshop-buy-grain').click()`);
  await sleep(300);
  const bought = await vil();
  check(`${name} 곡물 사기`, '도토리 −3 · 곡물 +1', { grain: [g0, bought.grain], coins: [c0, bought.coins] }, bought.grain === g0 + 1 && bought.coins === c0 - 3);

  // 6) 골라 만들기: 부품이 모자라면 단추가 꺼져 있고, 넉넉하면 만들어 보관함에 들어간다
  await reopen(village({ games: 4, coins: 200, grain: 0, workshop: { sq: 'e2', work: 0, parts: 8, made: 8, crafted: 0 } }));
  await openVillage();
  await ev(`document.getElementById('village-workshop').click()`);
  await until(`Boolean(document.querySelector('[data-craft="fountain"] button'))`, 5000);
  const states = await ev(`({ fountain: document.querySelector('[data-craft="fountain"] button').disabled, lantern: document.querySelector('[data-craft="lantern"] button').disabled, statue: Boolean(document.querySelector('[data-craft="statue"]')), why: document.querySelector('[data-craft="fountain"] small')?.textContent })`);
  await shot(`${name}-crafts.jpg`);
  await ev(`document.querySelector('[data-craft="lantern"] button').click()`);
  await sleep(500);
  const crafted = await vil();
  const note = await ev(`document.getElementById('village-card')?.textContent || ''`);
  check(`${name} 골라 만들기`, '분수(부품 12)는 꺼짐 · 등불(부품 8)은 켜짐 · 왕관 동상은 목록에 없음 · 만들면 도토리 −10 · 부품 −8 · 보관함 등불 1 · 놓을 칸 안내', { states, coins: crafted.coins, parts: crafted.workshop.parts, stash: crafted.stash, note: note.slice(0, 60) },
    states.fountain === true && states.lantern === false && states.statue === false && crafted.coins === 190 && crafted.workshop.parts === 0 && crafted.stash.lantern === 1 && /놓을 칸/.test(note));

  // 7) 계약전으로 이긴 판: 결과 상자에 「공방 진도 +0.5일」, 곡물이 있으면 진도는 기다린다(0.5 < 1)
  for (let tries = 0; tries < 3; tries++) {
    await ev(`(${base}, localStorage.setItem('wildcrown.village.v1', ${JSON.stringify(village({ games: 5, coins: 50, grain: 2, workshop: { sq: 'e2', work: 0.5, parts: 0, made: 0, crafted: 0 } }))}),
      localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, on: true, games: 5, win: 3, loss: 2, draw: 0, byReason: {}, last: null, rung: 0, lossRun: 0 })),
      localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4243, color: 'w', rivalId: null, moves: LINE_FINAL, contract: 'p2nb' }))}), 1)`);
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    if (await until(`${ready} && ${W}.debugHistory().length === ${LINE_FINAL.length}`, tries < 2 ? 45000 : 90000)) break;
    console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1);
  }
  await sleep(1500);
  const n = await ev(`${W}.debugHistory().length`);
  for (let i = 0; i < 3 && (await ev(`${W}.debugHistory().length`)) === n; i++) {
    for (const [r, c] of [[5, 5], [1, 5]]) { const p = await ev(`${W}.debugSquareClient(${r}, ${c})`); await click(p.x, p.y); await sleep(120); }
    await sleep(2000);
  }
  await until(`Boolean(document.getElementById('contract-pay'))`, 15000);
  await sleep(2000);
  await shot(`${name}-contract.jpg`);
  const pay = await ev(`document.getElementById('contract-pay')?.textContent || null`);
  const cv = await vil();
  check(`${name} 계약전 결과 줄`, '「🌰 도토리 +18 · 🔨 공방 진도 +0.5일」 · 진도 0.5 → 1 → 곡물 1 로 부품 2', { pay, workshop: cv.workshop, grain: cv.grain },
    /\+18/.test(pay || '') && /공방 진도 \+0\.5일/.test(pay || '') && cv.workshop.parts === 2 && cv.grain === 1 && cv.workshop.work === 0);

  await ev(`(${JSON.stringify(KEYS)}.forEach((k) => localStorage.removeItem(k)), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
