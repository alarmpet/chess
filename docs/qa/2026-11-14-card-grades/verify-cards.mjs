// 카드 등급 사다리(2026-11-14): 가만히 있어도 등급이 보이는가.
// dev 서버(3000): node docs/qa/2026-11-14-card-grades/verify-cards.mjs [결과 파일=result-cards.json] [캡처 폴더=after]
// 도감을 열어 네 등급의 카드를 찍고(0.9초 간격 두 장 — 움직임이 있으면 두 장이 다르다), 등급마다 걸린 효과를 계산된 스타일로 읽는다.
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const RESULT = process.argv[2] || 'result-cards.json';
const SHOTS = process.argv[3] || 'after';
mkdirSync(new URL(`./${SHOTS}/`, OUT), { recursive: true });
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const measured = {};
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', JSON.stringify(got)); };
const W = 'window.wizardChess';
const ANIMALS = ['meerkat', 'kangaroo', 'panda', 'rhino', 'tiger', 'lion'];
const all = {};
for (const a of ANIMALS) for (let r = 0; r < 4; r++) all[`${a}_${r}`] = 1;

for (const [port, name, w, h, touch, reduce] of [[9541, 'desk', 1280, 800, false, false], [9542, 'phone', 390, 844, true, false], [9543, 'calm', 390, 844, true, true]]) {
  const dir = `${process.env.TEMP}/wc-cards-${name}`;
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
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(50); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); writeFileSync(new URL(`./${SHOTS}/${file}`, OUT), Buffer.from(s.result.data, 'base64')); };
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: touch ? 2 : 1, mobile: touch });
  if (reduce) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await sleep(1200);
  // 느린 PC 에서는 이때 아직 about:blank 다(저장을 못 쓴다) — 게임 문서가 뜬 것을 보고 심는다.
  await until(`location.href.startsWith(${JSON.stringify(BASE)}) && document.readyState !== 'loading'`, 60000);
  const seeded = await ev(`(localStorage.setItem('wildcrown.cards.v1', ${JSON.stringify(JSON.stringify({ v: 1, cards: all, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }))}), localStorage.removeItem('wildcrown.resume.v1'), localStorage.getItem('wildcrown.cards.v1').length)`);
  if (!(seeded > 100)) throw new Error('카드 저장을 심지 못했다: ' + seeded);
  await send('Page.navigate', { url: BASE });
  await sleep(1500);
  await until(`${W}?.isStarted?.() && !${W}.debugBusy()`, 90000);
  await sleep(2000);
  await ev(`document.getElementById('btn-cards')?.click()`);
  const opened = await until(`document.querySelectorAll('.wc-card.r-hero').length > 0`, 10000);
  // 그림 24장이 다 뜬 뒤에 찍는다(느린 PC 에서는 몇 초 걸린다)
  await until(`[...document.querySelectorAll('#card-book .card-grid img')].every((i) => i.complete && i.naturalWidth > 0)`, 30000);
  await sleep(600);
  await ev(`document.querySelector('.wc-card.r-hero')?.scrollIntoView({ block: 'center' })`);
  await sleep(400);

  // 등급마다: 빛 겹(foil)의 움직임 · 카드의 흔들림 · 후광(그림자 겹 수) · 별
  const grades = await ev(`(() => { const out = {}; for (const g of ['common', 'uncommon', 'rare', 'hero']) { const cards = [...document.querySelectorAll('.wc-card.r-' + g + ':not(.empty)')]; const big = cards.find((c) => !c.classList.contains('sm')) || cards[0];
    if (!big) { out[g] = null; continue; } const foil = big.querySelector('.wc-card-foil'); const cs = getComputedStyle(big); const star = getComputedStyle(big, '::after');
    out[g] = { n: cards.length, sm: big.classList.contains('sm'), foil: foil ? getComputedStyle(foil).animationName : null, float: cs.animationName, glows: (cs.filter.match(/drop-shadow/g) || []).length, stars: star.content !== 'none' && star.content !== 'normal' ? star.animationName : null }; } return out; })()`);
  measured[name] = grades;
  await shot(`${name}-album-a.jpg`);
  await sleep(900);
  await shot(`${name}-album-b.jpg`);
  check(`${name} 도감 열림`, '네 등급의 카드가 모두 보인다', { opened, n: grades && Object.fromEntries(Object.entries(grades).map(([k, v]) => [k, v?.n ?? 0])) }, opened && ['common', 'uncommon', 'rare', 'hero'].every((g) => grades[g]?.n > 0));
  const fit = await ev(`(() => { const b = document.querySelector('#card-book .panel-body'); const g = document.querySelector('.card-grid').getBoundingClientRect(); return { scroll: b.scrollWidth, client: b.clientWidth, left: Math.round(g.left), right: Math.round(g.right), vw: innerWidth }; })()`);
  check(`${name} 도감이 화면 안`, '가로로 넘치지 않는다', fit, fit.scroll <= fit.client + 1 && fit.left >= 0 && fit.right <= fit.vw);
  // 카드 보기: 영웅 카드를 눌러 크게 본다 → 다음 카드 → 마을에 전시 → 닫기
  await ev(`document.querySelector('.card-slot .wc-card.r-hero').closest('button').click()`);
  const insOpen = await until(`Boolean(document.getElementById('card-inspect'))`, 5000);
  await until(`document.querySelector('#card-inspect img')?.complete`, 15000);
  await sleep(700);
  const ins = await ev(`(() => { const el = document.getElementById('card-inspect'); const card = el.querySelector('.wc-card'); const box = card.getBoundingClientRect(); const rays = getComputedStyle(el.querySelector('.card-inspect-rays'));
    return { cls: el.className, grade: document.getElementById('card-inspect-grade').textContent, w: Math.round(box.width), inView: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight, rays: Number(rays.opacity), spin: rays.animationName, float: getComputedStyle(card).animationName }; })()`);
  await shot(`${name}-inspect-hero.jpg`);
  check(`${name} 카드 보기(영웅)`, '큰 카드가 화면 안 · ★★★★ · 금빛 무대와 빛살', { insOpen, ...ins }, insOpen && /g3/.test(ins.cls) && /★★★★/.test(ins.grade) && ins.w >= 200 && ins.inView && ins.rays === 1);
  await ev(`document.getElementById('card-inspect-next').click()`);
  await sleep(500);
  const nxt = await ev(`({ cls: document.getElementById('card-inspect').className, grade: document.getElementById('card-inspect-grade').textContent, rays: Number(getComputedStyle(document.querySelector('.card-inspect-rays')).opacity) })`);
  await shot(`${name}-inspect-common.jpg`);
  check(`${name} 다음 카드`, '영웅 다음은 다음 동물의 일반(★) · 빛살 없음', nxt, /g0/.test(nxt.cls) && /^★ /.test(nxt.grade) && nxt.rays === 0);
  await ev(`(document.getElementById('card-inspect-prev').click(), document.getElementById('card-inspect-prev').click())`);
  await sleep(500);
  await shot(`${name}-inspect-rare.jpg`);
  await ev(`document.getElementById('card-inspect-shelf').click()`);
  await sleep(300);
  const shelf = await ev(`({ on: document.getElementById('card-inspect-shelf').classList.contains('on'), saved: JSON.parse(localStorage.getItem('wildcrown.cards.v1')).shelf })`);
  check(`${name} 마을에 전시`, '단추가 켜지고 저장에 들어간다', shelf, shelf.on === true && shelf.saved.length === 1);
  await ev(`document.getElementById('card-inspect-close').click()`);
  await sleep(300);
  const closed = await ev(`({ inspect: Boolean(document.getElementById('card-inspect')), book: Boolean(document.getElementById('card-book')) })`);
  check(`${name} 닫기`, '카드 보기만 닫히고 도감은 남는다', closed, closed.inspect === false && closed.book === true);
  const c = grades.common, u = grades.uncommon, r = grades.rare, hh = grades.hero;
  if (!reduce) {
    check(`${name} 일반`, '빛 겹 없음 · 후광 없음(그림자 1겹)', c, c && c.foil === null && c.glows === 1 && !c.stars);
    check(`${name} 고급`, '은빛 반짝임(wc-glint) · 후광 1겹 더', u, u && u.foil === 'wc-glint' && u.glows === 2 && !u.stars);
    check(`${name} 희귀`, '흐르는 홀로그램(wc-holo) · 후광 · 큰 카드는 흔들림', r, r && r.foil === 'wc-holo' && r.glows === 2 && !r.stars && (r.sm || r.float === 'wc-float'));
    check(`${name} 영웅`, '금빛 훑기(wc-gold) · 후광 · 별(wc-twinkle) · 큰 카드는 흔들림', hh, hh && hh.foil === 'wc-gold' && hh.glows === 2 && hh.stars === 'wc-twinkle' && (hh.sm || hh.float === 'wc-float'));
  } else {
    check(`${name} 효과 줄이기`, '움직임이 모두 멈춘다(후광은 남는다)', { u, r, hh }, [u, r, hh].every((x) => x && x.foil === 'none' && x.float === 'none' && x.glows === 2) && (!hh.stars || hh.stars === 'none'));
  }
  await ev(`(localStorage.removeItem('wildcrown.cards.v1'), localStorage.removeItem('wildcrown.resume.v1'), 1)`);
  ws.close(); chrome.kill();
  await sleep(400);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
}
writeFileSync(new URL(RESULT, OUT), JSON.stringify({ at: new Date().toISOString(), base: BASE, measured, rows }, null, 1));
console.log(rows.filter((r) => r.ok).length + '/' + rows.length);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
