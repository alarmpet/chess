// SC-0 풀 확인: 새로 들어온 p3nb(폰×3) 판에서 HUD 칸 셋·딱지·AI 목표가 맞는가. 시험 스위치(?lab=contract) 뒤.
// dev 서버(3000)에서: node docs/qa/2026-11-13-sc0-pool/verify-sc0.mjs (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-sc0-build.json)
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-sc0.json';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', typeof got === 'string' ? got : JSON.stringify(got)); };
const W = 'window.wizardChess';
const measured = {};
const mv = (s) => s.split(' ').map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4) }));
// 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qa5 4.Nf3 Bg4 5.h3 Bxf3 — 흑이 나이트를 채움(흑 1 · 백 0), 백 차례
const LINE_MATCH = mv('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 g1f3 c8g4 h2h3 g4f3');
// … 6.Qxf3 c6 — 백도 비숍을 채움(1 대 1), 백 차례. 7.Qxf7+ 가 백의 두 번째 폰 = 계약 완성
const LINE_FINAL = [...LINE_MATCH, ...mv('d1f3 c7c6')];
// 1.Nc3 d5 2.Nb5 Bd7 3.Nd4 e5 4.Nb3 Ba4 5.d3 Bxb3 — 흑이 나이트를 채움, 폰은 아무도 안 잡음. 6.axb3 뒤에 흑이 한 수로 끝낼 길이 없다
const LINE_QUIET = mv('b1c3 d7d5 c3b5 c8d7 b5d4 e7e5 d4b3 d7a4 d2d3 a4b3');

for (const [port, name, phone] of [[9492, 'mouse', false], [9493, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-sc0-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
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
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(20); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); { const shotBuf = Buffer.from(s.result.data, 'base64'); for (let k = 0; ; k++) { try { writeFileSync(new URL(file, OUT), shotBuf); break; } catch (e) { if (k >= 5) { console.log('⚠️ 캡처를 못 씀(파일이 잠김)', String(e.code || e)); break; } await sleep(500); } } } };
  if (phone) {
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
  const at = (r, c) => ev(`${W}.debugSquareClient(${r}, ${c})`);
  const tap = async (p) => {
    if (phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(60);
  };
  const con = () => ev(`${W}.debugContract()`);
  const sans = () => ev(`${W}.debugHistory().map((m) => m.san)`);
  const ready = `(() => { const w = ${W}; return w?.isStarted?.() && !w.debugBusy(); })()`;
  const listen = () => ev(`(() => { if (window.__ends) return 1; window.__ends = { game: 0, contract: [] };
    window.addEventListener('gamefinished', () => { window.__ends.game += 1; });
    window.addEventListener('contractfinished', (e) => { window.__ends.contract.push(e.detail); }); return 1; })()`);
  // 저장을 깨끗이 하고(전용 기록 포함) 원하는 이어 하기 기록으로 연다
  const open = async ({ moves = null, contract = null, quick = false, query = '?lab=contract', keepStore = false } = {}) => {
    // 앞 판의 문서가 아직 살아 있으면(AI 가 두는 중 등) 심은 이어 하기 기록을 덮어쓴다 — 다른 판이 열리면 다시 심는다(11-15).
    for (let tries = 0; tries < 3; tries++) {
    await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: ${quick}, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
      ${keepStore ? '' : "localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, games: 0, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0 }));"}   // IR-1 뒤: 상대는 「정식」(계약을 다 안다)으로 고정
      ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves, ...(contract ? { contract } : {}) }))});` : "localStorage.removeItem('wildcrown.resume.v1');"}
      return 1; })()`);
    await send('Page.navigate', { url: BASE + query });
    await sleep(1500);
    if (await until(`${ready} && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, tries < 2 ? 45000 : 90000)) break;
    console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1, JSON.stringify(await ev(`${W}?.debugHistory?.().length`)));
    }
    await listen();
  };
  await until('Boolean(window.wizardChess)');

  // p3nb(폰×3·나이트·비숍) 판을 이어 하기 기록으로 연다: 1.e4 d5 2.exd5 — 백이 폰 하나, 흑 차례(AI 가 둔다)
  await open({ moves: mv('e2e4 d7d5 e4d5'), contract: 'p3nb' });
  await until(`${ready} && ${W}.debugHistory().length >= 4`, 60000);
  await sleep(600);
  const c = await con();
  await shot(`p3nb-${name}.jpg`);
  const pips = await ev("[...document.querySelectorAll('#contract-hud .ch-goal')].map((g) => [g.querySelector('.ch-name').textContent, g.querySelectorAll('.ch-pip').length, g.querySelectorAll('.ch-pip.full').length, g.querySelectorAll('.ch-dot').length])");
  const vw = await ev('({ w: innerWidth, h: innerHeight })');
  const r = c.hud?.rect;
  const inside = r && r.x >= 0 && r.y >= 0 && r.x + r.w <= vw.w + 1 && r.y + r.h <= vw.h + 1;
  check(`${name} p3nb 세트`, '세트 p3nb · AI 도 같은 목표(폰 3) · 계약 시험 중', { set: c.set, ai: c.aiContract?.goals }, c.set === 'p3nb' && c.aiContract?.goals?.[0]?.count === 3);
  check(`${name} 폰×3 HUD`, '첫 칸 「미어캣 ×3」 · 내 칸 3개 중 1개 참 · 상대 점 3개 · 화면 안', { pips, rect: r, vw }, pips[0]?.[0] === '미어캣 ×3' && pips[0][1] === 3 && pips[0][2] === 1 && pips[0][3] === 3 && inside);
  check(`${name} 딱지`, '폰 목표가 열려 있어 흑 폰에 딱지 · 종류 p·n·b', { tags: c.tags, types: c.types }, (c.types || []).includes('p') && c.tags > 0);
  measured[name] = { set: c.set, pips, hud: c.hud, tags: { tags: c.tags, types: c.types } };
  ws.close(); chrome.kill();
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows, measured }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
