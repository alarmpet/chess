// IR-2 왕관 보석: 왕 머리 위 보석 자리, 잡기에서 왕관으로 나는 보석, HUD 머리줄의 왕관 거울.
// 시험 스위치(?lab=contract) 뒤. dev 서버(3000): node docs/qa/2026-11-13-ir2-crown/verify-ir2.mjs (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-ir2-build.json)
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-ir2.json';
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

for (const [port, name, phone] of [[9498, 'mouse', false], [9499, 'touch', true]]) {
  const dir = `${process.env.TEMP}/wc-ir2-${name}`;
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
      ${keepStore ? '' : "localStorage.removeItem('wildcrown.contract.v1');"}
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

  const seed = (rung) => ev(`(localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, games: 5, win: 3, loss: 2, draw: 0, byReason: {}, last: null, rung: ${rung}, lossRun: 0 })), 1)`);
  const head = () => ev(`(() => { const h = document.querySelector('#contract-hud .ch-head'); if (!h) return null; const r = h.getBoundingClientRect();
    return { h: Math.round(r.height), fits: h.scrollWidth <= h.clientWidth + 1, text: h.textContent, right: Math.round(r.right), vw: innerWidth }; })()`);

  // 1) 판 중간으로 돌아오면: 양쪽 왕 머리 위에 자리 둘씩, 흑은 나이트 보석 하나. 날아오는 보석은 없다(되살린 판).
  await seed(2);
  await open({ moves: LINE_MATCH, contract: 'p2nb', keepStore: true });
  await sleep(1200);
  const a = await con();
  const aHead = await head();
  const calls = await ev(`${W}.debugRenderCalls()`);
  await shot(`crown-start-${name}.jpg`);
  check(`${name} 왕관 자리`, '자리 4 · 보석 1(흑 나이트) · 날아오는 것 0 · 보석 드로우콜 ≤ 2 · 전체 ≤ 100', { crown: a.crown, calls },
    a.crown?.sockets === 4 && a.crown.gems === 1 && a.crown.b.join() === 'n' && a.crown.w.length === 0 && a.crown.flying === 0 && a.crown.landed === 0 && a.crown.draws <= 2 && calls <= 100);
  check(`${name} HUD 왕관 거울`, '머리줄에 「내 왕관」 빈 자리 둘 · 상대 자리에 ♞ 하나 · 「정식 상대」 · 화면 안', { crown: a.hud?.crown, head: aHead },
    a.hud?.crown?.mine.every((g) => g === null) && a.hud.crown.theirs.join() === '♞,' && /내 왕관/.test(aHead?.text || '') && /정식 상대/.test(aHead.text) && aHead.fits && aHead.right <= aHead.vw);
  if (phone) check(`${name} 머리줄 한 줄`, '세로 화면 머리줄 높이 ≤ 32px', aHead, aHead.h <= 32);

  // 2) 6.Qxf3 — 비숍을 잡아 목표 하나를 채운다: 잡은 칸에서 보석이 떠서 내 왕관에 박힌다
  await tap(await at(7, 3));
  await tap(await at(5, 5));
  const flew = await until(`${W}.debugContract().crown.flying >= 1`, 15000);
  await sleep(380);
  await shot(`gem-fly-${name}.jpg`);
  const landed = await until(`${W}.debugContract().crown.landed >= 1 && ${W}.debugContract().crown.w.length === 1`, 8000);
  await sleep(500);
  const b = await con();
  await shot(`gem-set-${name}.jpg`);
  check(`${name} 보석이 날아와 박힘`, '날아오는 보석 1 → 박힘 · 내 왕관 [b] · HUD 내 자리에 ♝', { flew, landed, w: b.crown.w, hud: b.hud?.crown?.mine, calls: await ev(`${W}.debugRenderCalls()`) },
    flew && landed && b.crown.w.join() === 'b' && b.hud?.crown?.mine[0] === '♝');

  // 3) 왕관 완성: 7.Qxf7+ 가 두 번째 폰 — 보석 둘, 배너 「왕관 완성」, 결과에 채운 순서(비숍 → 폰)
  await seed(0);
  await open({ moves: LINE_FINAL, contract: 'p2nb', keepStore: true });
  await sleep(1000);
  // dev 서버 · 느린 PC 에서는 되살린 판의 보석이 늦게 박힌다 — 그 전에 누르면 수가 놓이지 않았다(11-14, 이 항목이 여러 번 흔들렸다).
  const restored = await until(`${W}.debugContract().crown.gems >= 2 && !${W}.debugBusy()`, 20000);
  if (!restored) console.log('⚠️', name, '되살린 보석이 20초 안에 안 박힘', JSON.stringify((await con()).crown));
  await tap(await at(5, 5));
  await tap(await at(1, 5));
  await until(`${W}.debugContract().gameOver === true`, 15000);
  await sleep(2600);
  const c = await con();
  const res = await ev(`(() => { const box = document.getElementById('contract-result'); if (!box) return null;
    const rows = [...box.querySelectorAll('.cr-gems')].map((r) => [...r.querySelectorAll('.ch-gem')].map((g) => g.textContent || null));
    const r = box.getBoundingClientRect();
    return { rows, line: box.querySelector('.cr-line')?.textContent, title: document.getElementById('checkmate-title')?.textContent, inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }; })()`);
  await shot(`crown-win-${name}.jpg`);
  check(`${name} 왕관 완성`, '승 · 내 왕관 [b, p] · 판 위 보석 3 · 배너 「왕관 완성」 · 결과 줄과 보석(♝ ♟ / ♞ 빈칸)', { end: c.end, crown: c.crown, res },
    c.end?.result === 'win' && c.end.reason === 'contract' && c.crown.w.join() === 'b,p' && c.crown.gems === 3 && res?.title === '왕관 완성'
    && res.line === '미어캣 ×2 · 판다 보석으로 왕관을 먼저 완성했어요.' && res.rows[0].join() === '♝,♟' && res.rows[1].join() === '♞,' && res.inView);

  // 4) 새 판: 보석이 걷히고 빈 자리 넷으로 돌아온다
  await ev(`document.getElementById('btn-checkmate-newgame').click()`);
  await until(`${W}.debugContract().hud?.on === true && ${W}.debugHistory().length === 0 && ${W}.debugContract().revealed.every(Boolean)`, 20000);
  await sleep(600);
  const d = await con();
  check(`${name} 새 판은 빈 왕관`, '자리 4 · 보석 0 · HUD 양쪽 빈 자리', { crown: d.crown, hud: d.hud?.crown }, d.crown.sockets === 4 && d.crown.gems === 0 && d.hud?.crown?.mine.every((g) => g === null) && d.hud.crown.theirs.every((g) => g === null));

  // 5) 스위치가 꺼져 있으면 보석 모듈을 받지 않는다
  await open({ query: '' });
  await sleep(800);
  const e = await con();
  check(`${name} 스위치 꺼짐`, '계약 없음 · 보석 모듈 없음 · HUD 없음', { set: e.set, crown: e.crown, hud: e.hud }, e.set === null && e.crown === null && e.hud === null);

  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);
  ws.close(); chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
