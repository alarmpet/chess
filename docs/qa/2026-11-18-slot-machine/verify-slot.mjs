// 왕관 슬롯머신(2026-11-18) 화면 검증 — 옛 소라 릴 검증(2026-11-12-pp1-reel/verify-reel.mjs)을 잇는다.
// 기계가 레버를 기다리는가 · 기다리는 동안 판이 안 눌리는가 · 진짜 누르기로 당겨지는가 · 릴이 차례로 멈추며 표적 그림이 가운데 서는가
// · 멈출 때마다 HUD·딱지가 드러나는가 · 터진 뒤 빠지는가 · 도는 중 누르면 건너뛰는가 · 이어 하기·보통 체스에는 안 뜨는가 · 드로우콜이 안 느는가.
// dev 서버(3000): node docs/qa/2026-11-18-slot-machine/verify-slot.mjs   (빌드판: WC_URL=http://localhost:4173/ WC_RESULT=result-slot-build.json)
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.env.WC_RESULT || 'result-slot.json';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', typeof got === 'string' ? got : JSON.stringify(got)); };
const W = 'window.wizardChess';
const mv = (s) => s.split(' ').map((m) => ({ from: m.slice(0, 2), to: m.slice(2, 4) }));
const LINE = mv('e2e4 d7d5 e4d5 d8d5 b1c3 d5a5');

for (const [port, name, phone] of [[9690, 'mouse', false], [9691, 'touch', true]]) {
  if (process.env.WC_ONLY && process.env.WC_ONLY !== name) continue;
  const dir = `${process.env.TEMP}/wc-slotv-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--window-size=960,640', `--user-data-dir=${dir}`, BASE], { stdio: 'ignore' });
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
    if (!wsUrl) await sleep(500);
  }
  const ws = new WebSocket(wsUrl);
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200)); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await new Promise((ok) => { ws.onopen = ok; });
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const until = async (expr, ms = 60000, step = 25) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(step); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 84 }); try { writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); } catch (e) { console.log('⚠️ 캡처를 못 씀', String(e.code || e)); } };
  await send('Runtime.enable');
  if (phone) {
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
  const press = async (p) => {
    if (phone) {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await sleep(80);
  };
  const center = (sel) => ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const reel = () => ev(`${W}.debugReel()`);
  const calls = () => ev(`${W}.debugRenderCalls?.() ?? ${W}.debugRenderer().info.render.calls`);
  // 저장: 계약전 켬 · 연습은 이미 한 것으로(스스로 열리지 않게) · 판 수 n
  const open = async ({ games = 0, moves = null, query = '' } = {}) => {
    // 앞 판의 문서가 아직 살아 있으면(AI 가 두는 중 등) 이어 하기 기록을 다시 써 버린다 — 다른 판이 열리면 다시 심는다
    for (let tries = 0; tries < 3; tries++) {
    await ev(`(() => { localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: false, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, on: true, games: ${games}, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0, practice: 1 }));
      ${moves ? `localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 4242, color: 'w', rivalId: null, moves, contract: 'p2nb' }))});` : "localStorage.removeItem('wildcrown.resume.v1');"}
      return 1; })()`);
    await send('Page.navigate', { url: BASE + query });
    await sleep(1500);
    if (await until(`${W}?.isStarted?.() && !${W}.debugBusy() && ${W}.debugHistory().length === ${moves ? moves.length : 0}`, tries < 2 ? 45000 : 90000)) break;
    console.log('⚠️ 심은 판이 안 열림 — 다시 심는다', tries + 1);
    }
  };
  // 가운데 줄에 선 그림: 각 창의 한가운데에 있는 타일의 그림 주소에서 동물 이름을 읽는다
  const faces = () => ev(`[...document.querySelectorAll('#slot-machine .sm-reel')].map((r) => { const b = r.getBoundingClientRect(); const cy = b.top + b.height / 2;
    const t = [...r.querySelectorAll('.sm-tile')].find((x) => { const q = x.getBoundingClientRect(); return q.top <= cy && q.bottom > cy; });
    if (!t) return { animal: null, off: 999 }; const q = t.getBoundingClientRect(); return { animal: t.dataset.animal, loaded: t.querySelector('img').naturalWidth > 0, off: Math.round(Math.abs((q.top + q.height / 2) - cy)) }; })`);
  await until('Boolean(window.wizardChess)');

  // 1) 새 판: 기계가 내려와 레버를 기다린다. 표적은 아직 가려져 있고, 판은 눌리지 않는다.
  await open();
  const idleCalls = await calls();
  const waiting = await until(`${W}.debugReel().waiting === true`, 20000);
  await sleep(800);
  const w0 = await reel();
  const c0 = await ev(`${W}.debugContract()`);
  const box = await ev(`(() => { const u = (r) => [r.left, r.top, r.right, r.bottom].map(Math.round); return { cab: u(document.querySelector('#slot-machine .sm-cab').getBoundingClientRect()), lever: u(document.getElementById('slot-lever').getBoundingClientRect()), btn: u(document.getElementById('slot-pull').getBoundingClientRect()), vw: innerWidth, vh: innerHeight, plates: [...document.querySelectorAll('#slot-machine .sm-plate')].map((p) => p.textContent) }; })()`);
  const inside = (r) => r[0] >= 0 && r[1] >= 0 && r[2] <= box.vw + 1 && r[3] <= box.vh + 1 && r[2] - r[0] > 20;
  await shot(`wait-${name}.jpg`);
  check(`${name} 기계가 레버를 기다린다`, '떠 있음 · 아직 안 돎 · 표적 셋 다 가림(명판 ?) · 딱지 0', { waiting, active: w0.active, stopped: w0.stopped, plates: box.plates, revealed: c0.revealed, tags: c0.tags },
    waiting && w0.active === false && w0.stopped.every((s) => !s) && box.plates.every((p) => p === '?') && c0.revealed.every((r) => !r) && c0.tags === 0);
  check(`${name} 기계 · 레버 · 단추가 화면 안`, `기계 폭이 화면의 ${phone ? '70' : '40'}% 이상`, box, inside(box.cab) && inside(box.lever) && inside(box.btn) && (box.cab[2] - box.cab[0]) / box.vw >= (phone ? 0.7 : 0.4));
  // 기다리는 동안 판을 눌러도(e2 → e4) 수가 안 둬진다
  const e2 = await ev(`${W}.debugSquareClient(6, 4)`); const e4 = await ev(`${W}.debugSquareClient(4, 4)`);
  await press(e2); await press(e4);
  await sleep(500);
  const still = await reel();
  check(`${name} 기다리는 동안 판은 안 눌린다`, '수 0 · 여전히 기다림 · AI 도 안 둠', { history: await ev(`${W}.debugHistory().length`), waiting: still.waiting }, (await ev(`${W}.debugHistory().length`)) === 0 && still.waiting === true);

  // 2) 레버를 진짜로 눌러 당긴다 → 차례로 멈춘다
  const lever = await ev(`(() => { const r = document.getElementById('slot-lever').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.25 }; })()`);
  await press(lever);
  const pulled = await until(`${W}.debugReel().active === true`, 3000);
  await sleep(250);
  const spin = await ev(`({ pics: [...document.querySelectorAll('#slot-machine .sm-pic img')].filter((i) => i.complete && i.naturalWidth > 0).length, fast: document.querySelectorAll('#slot-machine .sm-reel.fast').length, pulledCls: document.getElementById('slot-lever').classList.contains('pulled'), msg: document.querySelector('#slot-machine .sm-msg').textContent })`);
  await shot(`spin-${name}.jpg`);
  const stops = [];
  let duringCalls = 0;
  for (let i = 0; i < 3; i++) {
    await until(`${W}.debugReel().stopped[${i}] === true`, 30000);
    const s = await reel(); const c = await ev(`${W}.debugContract()`);
    stops.push({ t: s.t, stopped: s.stopped.filter(Boolean).length, revealed: c.revealed.filter(Boolean).length, tags: c.tags });
    duringCalls = Math.max(duringCalls, await calls());
  }
  await sleep(450);
  // 되튐(0.45초, 기계 시계)이 가라앉을 때까지 — 헤드리스는 동전이 터지는 프레임이 느리다
  await until(`${W}.debugReel().t >= 3.3 + 0.6`, 5000);
  const f = await faces();
  const win = await ev(`({ win: document.getElementById('slot-machine').classList.contains('win'), coins: document.querySelectorAll('#slot-machine .sm-coin').length, plates: [...document.querySelectorAll('#slot-machine .sm-plate')].map((p) => p.textContent), counts: [...document.querySelectorAll('#slot-machine .sm-count')].map((p) => p.textContent), msg: document.querySelector('#slot-machine .sm-msg').textContent })`);
  await shot(`win-${name}.jpg`);
  check(`${name} 레버로 돈다`, '진짜 누르기로 당겨짐 · 레버가 내려감 · 세 릴이 빠르게 도는 중 · 그림 45장 다 받음', { pulled, ...spin }, pulled && spin.pulledCls && spin.fast >= 2 && spin.pics === 45);
  check(`${name} 쿵 · 쿵 · 쾅`, '한 개씩 멈춤(1 → 2 → 3) · 멈출 때마다 HUD 칸이 하나씩 · 기계 시계로 1.3 · 2.1 · 3.3초(+0.5 안)', stops,
    stops.map((s) => s.stopped).join() === '1,2,3' && stops.map((s) => s.revealed).join() === '1,2,3' && [1.3, 2.1, 3.3].every((want, i) => stops[i].t >= want && stops[i].t <= want + 0.5) && stops[2].tags > stops[0].tags);
  check(`${name} 표적 그림이 가운데 선다`, '미어캣 · 캥거루 · 판다가 창 한가운데(어긋남 3px 안) · 명판 「미어캣 ×2 · 캥거루 ×1 · 판다 ×1」 · 수량 ×2 ×1 ×1', { faces: f, plates: win.plates, counts: win.counts },
    f.map((x) => x.animal).join() === 'meerkat,kangaroo,panda' && f.every((x) => x.off <= 3) && win.plates.join() === '미어캣 ×2,캥거루 ×1,판다 ×1' && win.counts.join() === '×2,×1,×1');
  check(`${name} 터진다`, '전구 승리 깜빡임 · 동전 20개 이상 · 「표적 확정」 글', { win: win.win, coins: win.coins, msg: win.msg }, win.win && win.coins >= 20 && /표적 확정/.test(win.msg));
  const gone = await until(`${W}.debugReel().active === false`, 20000);
  await sleep(500);
  const after = await ev(`({ shown: getComputedStyle(document.getElementById('slot-machine')).display, coins: document.querySelectorAll('#slot-machine .sm-coin').length, hud: ${W}.debugContract().hud?.shown, tags: ${W}.debugContract().tags })`);
  const afterCalls = await calls();
  await shot(`after-${name}.jpg`);
  check(`${name} 빠진 뒤`, '기계 숨김 · 동전 치움 · HUD 세 칸 · 딱지 있음 · 이제 판이 눌린다(e2-e4)', after, gone && after.shown === 'none' && after.coins === 0 && after.hud?.every(Boolean) && after.tags > 0);
  await press(await ev(`${W}.debugSquareClient(6, 4)`)); await press(await ev(`${W}.debugSquareClient(4, 4)`));
  const moved = await until(`${W}.debugHistory().length >= 1`, 6000);
  check(`${name} 드로우콜`, '기계가 떠 있는 동안 3D 드로우콜이 100 이하(기계는 DOM)', { idle: idleCalls, during: duringCalls, after: afterCalls, moved }, duringCalls <= 100 && afterCalls <= 100 && moved);

  // 3) 건너뛰기: 도는 중에 기계를 누르면 1초 안에 다 멈춘다. 결과는 같다.
  await open({ games: 1 });
  await until(`${W}.debugReel().waiting === true`, 20000);
  await sleep(600);
  await press(await center('#slot-pull'));
  await until(`${W}.debugReel().active === true`, 3000);
  await sleep(300);
  const t0 = Date.now();
  await press(await center('#slot-machine .sm-windows'));
  const allStopped = await until(`${W}.debugReel().stopped.every(Boolean)`, 5000);
  const skipMs = Date.now() - t0;
  await sleep(300);
  const sf = (await faces()) || []; const sr = await reel();
  check(`${name} 단추로 당기고 눌러서 건너뛰기`, '큰 단추로도 당겨짐 · 누른 뒤 1.2초 안에 다 멈춤 · 그림은 그대로 미어캣 · 캥거루 · 판다', { allStopped, skipMs, skipped: sr.skipped, phase: sr.phase, faces: sf.map((x) => x.animal) },
    allStopped && skipMs <= 1200 && sr.skipped === true && sf.map((x) => x.animal).join() === 'meerkat,kangaroo,panda');
  await until(`${W}.debugReel().active === false`, 15000);

  // 4) 이어 하기 · 보통 체스에는 기계가 없다
  await open({ games: 1, moves: LINE });
  await sleep(1500);
  const r1 = await reel();
  check(`${name} 이어 하기 = 기계 없음`, '판 중간으로 돌아오면 안 뜨고 표적은 바로 다 보인다', { moves: await ev(`${W}.debugHistory().length`), waiting: r1.waiting, active: r1.active, plays: r1.plays, revealed: (await ev(`${W}.debugContract()`)).revealed },
    (await ev(`${W}.debugHistory().length`)) === LINE.length && !r1.waiting && !r1.active && r1.plays === 0 && (await ev(`${W}.debugContract()`)).revealed.every(Boolean));
  await open({ games: 1, query: '?lab=classic' });
  await sleep(2500);
  const r2 = await reel();
  check(`${name} 보통 체스 = 기계 없음`, '?lab=classic 은 기계가 안 뜬다', { lab: r2.lab, waiting: r2.waiting, plays: r2.plays }, r2.lab === false && !r2.waiting && r2.plays === 0);
  // 5) 새 세트(11-18 풀): 코뿔소·호랑이가 든 세트도 그림이 맞게 선다
  await open({ games: 5 });
  await until(`${W}.debugReel().waiting === true`, 20000);
  await ev(`${W}.playReel('pbq')`);
  await sleep(500);
  await ev(`${W}.pullLever()`);
  await until(`${W}.debugReel().stopped.every(Boolean)`, 30000);
  await sleep(450);
  const qf = await faces();
  const qPlates = await ev(`[...document.querySelectorAll('#slot-machine .sm-plate')].map((p) => p.textContent)`);
  await shot(`set-pbq-${name}.jpg`);
  check(`${name} 호랑이가 든 세트`, '미어캣 · 판다 · 호랑이가 가운데 · 명판 「미어캣 ×1 · 판다 ×1 · 호랑이 ×1」 · 잭팟 아님', { faces: qf.map((x) => x.animal), plates: qPlates, jackpot: (await reel()).jackpot },
    qf.map((x) => x.animal).join() === 'meerkat,panda,tiger' && qf.every((x) => x.off <= 3) && qPlates.join() === '미어캣 ×1,판다 ×1,호랑이 ×1' && (await reel()).jackpot === false);
  await until(`${W}.debugReel().active === false`, 20000);

  // 6) 잭팟: 세 칸이 다 미어캣 — 셋째 릴이 더 끌고, JACKPOT · 동전이 더 많이 · 안내 한 줄
  await open({ games: 5 });
  await until(`${W}.debugReel().waiting === true`, 20000);
  await ev(`${W}.playReel('j-p3')`);
  await sleep(500);
  await ev(`${W}.pullLever()`);
  await until(`${W}.debugReel().stopped[1] === true`, 30000);
  const tease = await ev(`document.querySelector('#slot-machine .sm-msg').textContent`);
  await until(`${W}.debugReel().stopped[2] === true`, 30000);
  const jt = (await reel()).t;
  await sleep(500);
  const jf = await faces();
  const jack = await ev(`({ cls: document.getElementById('slot-machine').classList.contains('jackpot'), coins: document.querySelectorAll('#slot-machine .sm-coin').length, msg: document.querySelector('#slot-machine .sm-msg').textContent, plates: [...document.querySelectorAll('#slot-machine .sm-plate')].map((p) => p.textContent), banner: getComputedStyle(document.querySelector('#slot-machine .sm-jack')).animationName })`);
  await shot(`jackpot-${name}.jpg`);
  check(`${name} 잭팟 연출`, '미어캣 셋 · 둘이 맞으면 「설마?!」 · 셋째 릴은 4.2초 뒤(보통 3.3) · JACKPOT 글자 · 동전 60개 이상 · 「미어캣 3마리 사냥 — 보상 2배」', { faces: jf.map((x) => x.animal), tease, t: jt, ...jack },
    jf.map((x) => x.animal).join() === 'meerkat,meerkat,meerkat' && /설마/.test(tease) && jt >= 4.2 && jt <= 4.8 && jack.cls && jack.coins >= 60 && /미어캣 3마리 사냥 — 보상 2배/.test(jack.msg) && jack.plates.join() === '미어캣,미어캣,미어캣' && jack.banner === 'sm-jack');
  await until(`${W}.debugReel().active === false`, 20000);
  await sleep(700);
  const jHud = await ev(`({ hint: document.querySelector('#contract-hud .ch-hint')?.textContent, on: document.querySelector('#contract-hud .ch-hint')?.classList.contains('on'), set: ${W}.debugContract().set, tags: ${W}.debugContract().tags })`);
  await shot(`jackpot-hud-${name}.jpg`);
  check(`${name} 잭팟 판 안내`, 'HUD 에 「잭팟 판! 미어캣 3마리를 먼저 잡으면 승리 · 보상 2배」 · 상대 미어캣 여덟에 딱지', jHud, /잭팟 판! 미어캣 3마리를 먼저 잡으면 승리 · 보상 2배/.test(jHud.hint || '') && jHud.on === true && jHud.set === 'j-p3' && jHud.tags === 8);

  // 7) 잭팟 판을 끝까지: 미어캣 둘을 잡은 판에서 셋째(cxb7)를 잡으면 왕관 완성 — 도토리 2배, 사자 카드는 희귀 이상
  await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: { meerkat_0: 1 }, sinceRare: 0, sinceHero: 0, firstDone: true, games: 0, dust: 0, shelf: [], shelfSlots: 3 })); localStorage.removeItem('wildcrown.pouch.v1'); return 1; })()`);
  for (let tries = 0; tries < 3; tries++) {
    await ev(`(() => { localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: true, cards: true, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, on: true, games: 5, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0, practice: 1 }));
      localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 5151, color: 'w', rivalId: null, moves: mv('e2e4 d7d5 e4d5 c7c6 d5c6 g8f6'), contract: 'j-p3' }))}); return 1; })()`);
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    if (await until(`${W}?.isStarted?.() && !${W}.debugBusy() && ${W}.debugHistory().length === 6`, 45000)) break;
  }
  const mid = await ev(`${W}.debugContract()`);
  await press(await ev(`${W}.debugSquareClient(2, 2)`)); await press(await ev(`${W}.debugSquareClient(1, 1)`));
  const over = await until(`${W}.debugContract().gameOver === true`, 20000);
  await sleep(2600);
  const end = (await ev(`${W}.debugContract()`)).end;
  const payLine = await ev(`document.getElementById('contract-pay')?.textContent`);
  const got = await ev(`Object.keys(JSON.parse(localStorage.getItem('wildcrown.cards.v1')).cards)`);
  await shot(`jackpot-end-${name}.jpg`);
  check(`${name} 잭팟 판의 보상`, '이어 하기: 내 진도 [1,1,0](둘 잡음) → cxb7 로 왕관 완성 · 도토리 36(보통 18의 두 배) · 결과 창에 「잭팟 판 2배」 · 사자 카드 희귀 이상', { mine: mid.progress?.w?.counts, over, end, payLine, got },
    mid.progress?.w?.counts?.join() === '1,1,0' && over && end?.result === 'win' && end?.reason === 'contract' && end?.coins === 36 && end?.jackpot === true && /잭팟 판 2배/.test(payLine || '') && got.some((id) => /^lion_[23]$/.test(id)));
  await ev(`(localStorage.removeItem('wildcrown.cards.v1'), localStorage.removeItem('wildcrown.pouch.v1'), 1)`);
  // 8) 조커 잭팟(캥거루): 조커 보석 ★ 하나를 받고 시작 — 캥거루 하나만 먼저 잡으면 왕관 완성
  await open({ games: 5 });
  await until(`${W}.debugReel().waiting === true`, 20000);
  await ev(`${W}.playReel('j-n')`);
  await sleep(500);
  await ev(`${W}.pullLever()`);
  await until(`${W}.debugReel().stopped[2] === true`, 30000);
  await sleep(600);
  const kf = await faces();
  const kMsg = await ev(`document.querySelector('#slot-machine .sm-msg').textContent`);
  await shot(`joker-${name}.jpg`);
  await until(`${W}.debugReel().active === false`, 20000);
  await sleep(900);
  const kHud = await ev(`({ hint: document.querySelector('#contract-hud .ch-hint')?.textContent, names: [...document.querySelectorAll('#contract-hud .ch-name')].map((n) => n.textContent), crown: ${W}.debugContract().crown, stage: ${W}.debugContract().stage, tags: ${W}.debugContract().tags, mine: ${W}.debugContract().progress?.w })`);
  await shot(`joker-hud-${name}.jpg`);
  check(`${name} 조커 잭팟`, '캥거루 셋 · 「캥거루 1마리 사냥 — 보상 2배」 · HUD 첫 칸 「조커 ★」 · 양쪽 왕관에 조커 보석 하나씩 · 내 진도 [1,0,0] · 안내에 「조커」 · 상대 캥거루 둘에 딱지',
    { faces: kf.map((x) => x.animal), msg: kMsg, ...kHud },
    kf.map((x) => x.animal).join() === 'kangaroo,kangaroo,kangaroo' && /캥거루 1마리 사냥 — 보상 2배/.test(kMsg) && kHud.names[0] === '조커 ★' && kHud.crown?.w?.length === 1 && kHud.crown?.b?.length === 1 && kHud.crown.w[0] === 'j'
    && kHud.mine?.counts?.join() === '1,0,0' && /캥거루 1마리를 먼저 잡으면 승리.*조커/.test(kHud.hint || '') && kHud.tags === 2);
  // 끝까지: 1.e4 Nf6 2.e5 Nd5 3.c4 Nb4 4.a3 a5 뒤 5.axb4 — 캥거루 하나를 잡는 순간 끝난다
  for (let tries = 0; tries < 3; tries++) {
    await ev(`(() => { localStorage.setItem('wildcrown.fx.v1', JSON.stringify({ shake: true, quick: true, cards: false, dive: false, quests: false, blitz: false }));
      localStorage.setItem('wildcrown.contract.v1', JSON.stringify({ v: 1, on: true, games: 5, win: 0, loss: 0, draw: 0, byReason: {}, last: null, rung: 2, lossRun: 0, practice: 1 }));
      localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 6161, color: 'w', rivalId: null, moves: mv('e2e4 g8f6 e4e5 f6d5 c2c4 d5b4 a2a3 a7a5'), contract: 'j-n' }))}); return 1; })()`);
    await send('Page.navigate', { url: BASE });
    await sleep(1500);
    if (await until(`${W}?.isStarted?.() && !${W}.debugBusy() && ${W}.debugHistory().length === 8`, 45000)) break;
  }
  await press(await ev(`${W}.debugSquareClient(5, 0)`)); await press(await ev(`${W}.debugSquareClient(4, 1)`));
  const kOver = await until(`${W}.debugContract().gameOver === true`, 20000);
  await sleep(2400);
  const kEnd = await ev(`({ end: ${W}.debugContract().end, crown: ${W}.debugContract().crown.w, pay: document.getElementById('contract-pay')?.textContent, title: document.getElementById('checkmate-title')?.textContent })`);
  await shot(`joker-end-${name}.jpg`);
  check(`${name} 조커 잭팟을 끝까지`, 'axb4 로 캥거루 하나를 잡자 왕관 완성 · 9반수 · 왕관 보석 [조커, 캥거루] · 도토리 36 · 「잭팟 판 2배」', { over: kOver, ...kEnd },
    kOver && kEnd.end?.result === 'win' && kEnd.end?.reason === 'contract' && kEnd.end?.plies === 9 && kEnd.end?.coins === 36 && kEnd.crown?.join() === 'j,n' && /잭팟 판 2배/.test(kEnd.pay || '') && kEnd.title === '왕관 완성');
  // 9) 코뿔소 · 호랑이 조커 잭팟(사용자 결정): 기계와 HUD 가 맞게 뜬다. 호랑이는 판에 하나뿐 — 딱지 하나
  for (const [id, animal, ko, tags] of [['j-r', 'rhino', '코뿔소', 2], ['j-q', 'tiger', '호랑이', 1]]) {
    await open({ games: 5 });
    await until(`${W}.debugReel().waiting === true`, 20000);
    await ev(`${W}.playReel('${id}')`);
    await sleep(500);
    await ev(`${W}.pullLever()`);
    await until(`${W}.debugReel().stopped[2] === true`, 30000);
    await sleep(600);
    const ff = await faces();
    const m = await ev(`document.querySelector('#slot-machine .sm-msg').textContent`);
    await shot(`joker-${animal}-${name}.jpg`);
    await until(`${W}.debugReel().active === false`, 20000);
    await sleep(900);
    const h = await ev(`({ hint: document.querySelector('#contract-hud .ch-hint')?.textContent, names: [...document.querySelectorAll('#contract-hud .ch-name')].map((n) => n.textContent), crown: ${W}.debugContract().crown.w, tags: ${W}.debugContract().tags, set: ${W}.debugContract().set })`);
    check(`${name} ${ko} 조커 잭팟`, `${ko} 셋 · 「${ko} 1마리 사냥 — 보상 2배」 · HUD 「조커 ★ · ${ko} ×1 · ${ko} ×1」 · 조커 보석 · 딱지 ${tags}`, { faces: ff.map((x) => x.animal), msg: m, ...h },
      ff.every((x) => x.animal === animal) && new RegExp(`${ko} 1마리 사냥 — 보상 2배`).test(m) && h.names.join() === `조커 ★,${ko} ×1,${ko} ×1` && h.crown?.join() === 'j' && h.tags === tags && h.set === id && new RegExp(`${ko} 1마리를 먼저 잡으면 승리`).test(h.hint || ''));
  }
  check(`${name} 오류 없음`, '페이지 예외 0', errors.slice(0, 3), errors.length === 0);

  await ev(`(localStorage.removeItem('wildcrown.resume.v1'), localStorage.removeItem('wildcrown.contract.v1'), 1)`);
  ws.close();
  chrome.kill();
  await sleep(500);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
const pass = rows.filter((r) => r.ok).length;
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ url: BASE, at: new Date().toISOString(), pass, total: rows.length, rows }, null, 1));
console.log(`${pass}/${rows.length}`);
process.exit(pass === rows.length ? 0 : 1);
