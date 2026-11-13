// IR-0 결과를 읽게: 판이 끝나면 HUD 가 접히고 종료 배너 안에 까닭 한 문장과 최종 진도가 들어가는가, 알림 줄이 HUD 를 덮지 않는가.
// 시험 스위치(?lab=contract) 뒤. dev 서버(3000): node docs/qa/2026-11-13-ir0-result/verify-ir0.mjs (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-ir0-build.json)
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-ir0.json';
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

for (const [port, name, phone] of [[9494, 'mouse', false], [9495, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-ir0-${name}`;
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
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(20); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
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
    await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: ${quick}, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1000, games: 30, mode: 'fixed', step: 3, hold: 0, change: null }));
      ${keepStore ? '' : "localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, games: 0, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0 }));"}   // IR-1 뒤: 상대는 「정식」(계약을 다 안다)으로 고정
      ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves, ...(contract ? { contract } : {}) }))});` : "localStorage.removeItem('wildcrown.resume.v1');"}
      return 1; })()`);
    await send('Page.navigate', { url: BASE + query });
    await sleep(1500);
    await until(`${ready} && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, 90000);
    await listen();
  };
  await until('Boolean(window.wizardChess)');

  const box = () => ev(`(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).display !== 'none' ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null; };
    return { hud: q('#contract-hud'), banner: q('#checkmate-overlay .checkmate-banner'), note: q('.card-note'), result: q('#checkmate-overlay .checkmate-banner #contract-result'), line: document.querySelector('#contract-result .cr-line')?.textContent || null,
      sub: document.getElementById('checkmate-subtitle').textContent, title: document.getElementById('checkmate-title').textContent, visible: document.getElementById('checkmate-overlay').classList.contains('visible'), vw: innerWidth, vh: innerHeight }; })()`);
  const hit = (a, b) => Boolean(a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h);
  const inside = (r, v) => Boolean(r && r.x >= 0 && r.y >= 0 && r.x + r.w <= v.vw + 1 && r.y + r.h <= v.vh + 1);
  const endOk = (b) => b.visible && b.hud === null && Boolean(b.result) && inside(b.banner, b);

  // 1) 이어 하기 알림이 HUD 를 덮지 않는다
  await open({ moves: LINE_FINAL, contract: 'p2nb' });
  await sleep(1200);
  const n = await box();
  await shot(`note-${name}.jpg`);
  check(`${name} 복귀 알림`, '알림 줄과 HUD 가 둘 다 보이고 겹치지 않는다', { note: n.note, hud: n.hud }, Boolean(n.note && n.hud) && !hit(n.note, n.hud));

  // 2) 계약으로 이긴다: HUD 가 접히고, 배너 안에 까닭과 최종 진도
  await tap(await at(5, 5));
  await tap(await at(1, 5));
  await until(`${W}.debugContract().gameOver === true`, 15000);
  await sleep(2500);
  const w = await box();
  await shot(`end-win-${name}.jpg`);
  check(`${name} 계약 승리 화면`, 'HUD 접힘 · 배너 안에 결과 · 화면 안 · 「미어캣 ×2 · 판다 보석으로 왕관을 먼저 완성했어요.」 · 보조 글자 비움', { hud: w.hud, banner: w.banner, result: w.result, line: w.line, sub: w.sub, title: w.title },
    endOk(w) && w.line === '미어캣 ×2 · 판다 보석으로 왕관을 먼저 완성했어요.' && w.sub === '' && w.title === '왕관 완성');

  // 3) 새 게임: 결과는 치워지고 HUD 가 다시 선다
  await ev(`document.getElementById('btn-checkmate-newgame').click()`);
  await until(`${W}.debugContract().hud?.on === true && ${W}.debugHistory().length === 0`, 15000);
  await sleep(500);
  const g = await box();
  check(`${name} 새 게임`, '결과 없음 · HUD 다시 보임 · 배너 닫힘', { result: g.result, hud: g.hud, visible: g.visible }, g.result === null && Boolean(g.hud) && g.visible === false);

  // 4) AI 가 계약으로 이긴다: 진 까닭이 상대가 채운 목표로 적힌다
  await open({ moves: LINE_MATCH, contract: 'p2nb' });
  await sleep(800);
  await tap(await at(7, 3));
  await tap(await at(5, 5));
  await until(`${W}.debugContract().gameOver === true`, 40000);
  await sleep(2000);
  const l = await box();
  await shot(`end-loss-${name}.jpg`);
  check(`${name} 계약 패배 화면`, 'HUD 접힘 · 배너 안에 결과 · 「상대가 미어캣 ×2 · 캥거루 보석으로 왕관을 먼저 완성했어요.」', { hud: l.hud, banner: l.banner, result: l.result, line: l.line, sub: l.sub },
    endOk(l) && l.line === '상대가 미어캣 ×2 · 캥거루 보석으로 왕관을 먼저 완성했어요.' && l.sub === '');

  // 5) 기권: 「카드는 받았어요」라는 거짓 안내가 없다. 내 수 10번부터 기권이 진 판으로 남는다 — 잡기 없는 20반수
  await open({ moves: mv('a2a3 a7a6 b2b3 b7b6 c2c3 c7c6 d2d3 d7d6 e2e3 e7e6 f2f3 f7f6 g2g3 g7g6 h2h3 h7h6 b1d2 b8d7 c1b2 c8b7'), contract: 'p2nb' });
  await sleep(800);
  const quit = await ev(`(() => { const i = ${W}.quitInfo(); return { keeps: i.keeps, did: ${W}.quitNow('resign') }; })()`);
  await until(`${W}.debugContract().gameOver === true`, 10000);
  await sleep(1500);
  const r = await box();
  await shot(`end-resign-${name}.jpg`);
  check(`${name} 기권 화면`, 'HUD 접힘 · 「기권했어요.」 · 카드 문구 없음', { quit, hud: r.hud, line: r.line, sub: r.sub, title: r.title }, endOk(r) && r.line === '기권했어요.' && !/카드/.test(r.sub + r.line));

  // 6) 메이트로 이긴다(1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#): 배너는 연출 뒤에 뜨고, 까닭은 계약이 아니라 왕 제압
  await open({ moves: mv('e2e4 e7e5 f1c4 b8c6 d1h5 g8f6'), contract: 'p2nb' });
  await sleep(800);
  await tap(await at(3, 7));
  await tap(await at(1, 5));
  await until(`${W}.debugContract().gameOver === true`, 40000);
  await until(`document.getElementById('checkmate-overlay').classList.contains('visible')`, 40000);
  await sleep(1500);
  const m = await box();
  const mc = await con();
  await shot(`end-mate-${name}.jpg`);
  check(`${name} 메이트 화면`, 'Qxf7# · 사유 checkmate(폰 하나를 잡았어도 계약이 아님) · HUD 접힘 · 「상대 왕을 제압해 이겼어요.」', { last: (await sans()).slice(-1), end: mc.end, hud: m.hud, line: m.line, sub: m.sub, title: m.title },
    mc.end?.reason === 'checkmate' && endOk(m) && m.line === '상대 왕을 제압해 이겼어요.');

  // 7) 화면이 돌면 HUD 자리도 바뀐다(가로 창에서만 잰다)
  if (!phone) {
    await open({ moves: LINE_QUIET, contract: 'p2nb' });
    await sleep(800);
    const before = (await con()).hud?.layout;
    await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 820, deviceScaleFactor: 1, mobile: false });
    await sleep(1200);
    const turned = await con();
    const tb = await box();
    await shot('rotate-tall.jpg');
    await send('Emulation.clearDeviceMetricsOverride');
    await sleep(800);
    const backTo = (await con()).hud?.layout;
    check('화면 돌리기', 'wide → tall → wide · 세로에서 화면 안', { before, turned: turned.hud?.layout, rect: tb.hud, backTo }, before === 'wide' && turned.hud?.layout === 'tall' && inside(tb.hud, tb) && backTo === 'wide');
  }
  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);
  ws.close(); chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
