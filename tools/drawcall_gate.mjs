// 드로우콜 게이트 (엔진 선택 계획서 §4.1 조건 3 · §5). 헤드리스 Chrome 을 CDP 로 열어 초기 국면의 renderer.info.render.calls 를 읽고
// 상한(기본 100)을 넘으면 exit 1. 의존성 없음: Node 22 의 전역 WebSocket 으로 DevTools 프로토콜을 직접 말한다.
//   node tools/drawcall_gate.mjs            # 서버는 vite preview 를 스스로 띄운다(dist/ 필요 → npm run build 뒤)
//   DRAWCALL_URL=http://localhost:3000/ node tools/drawcall_gate.mjs   # 이미 떠 있는 서버를 쓴다
//   DRAWCALL_MAX=100 CHROME=<경로> 로 상한·브라우저를 바꾼다. 헤드리스는 SwiftShader 라 느리지만 드로우콜 수는 GPU 와 무관하다.
import { spawn, execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

// DRAWCALL_SCENE=village 는 섬(마을) 장면을 잰다(아틀란티스 계획서 §4.3): 완성 섬 고정 저장(tools/fixtures/village-full.json)을
// localStorage 에 넣고 #btn-village 를 눌러 window.wildcrownIsland.renderCalls() 를 읽는다. 상한 기본 150.
const SCENE = process.env.DRAWCALL_SCENE === 'village' || process.argv.includes('--village') ? 'village' : 'chess';
// 섬 상한 150: 아틀란티스 계획서 §4.3. PR B(돔·바다 속, 그림자 맵 끔) 뒤 완성 섬 고정 저장 실측 120~124(프레임마다 같음).
const MAX = Number(process.env.DRAWCALL_MAX || (SCENE === 'village' ? 150 : 100));
const PORT = 4173;
const SETTLE_MS = Number(process.env.DRAWCALL_SETTLE_MS || 15000);
// 체스 장면은 첫 국면 뒤에 잡기 순간도 잰다(11-09): 잡기 효과(고리·글자·별·시그니처)가 더해지는 최대가 상한 안이어야 한다.
// tools/fixtures/capture-lines.json 의 국면을 이어 하기로 세우고 마지막 잡기를 둔다. DRAWCALL_CAPTURE=0 이면 건너뛴다.
const CAPTURE = SCENE === 'chess' && process.env.DRAWCALL_CAPTURE !== '0';
const log = (m) => console.log(`[drawcall-gate] ${m}`);

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const candidates = process.platform === 'win32'
    ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
    : ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const c of candidates) {
    if (c.includes('/') && existsSync(c)) return c;
    if (!c.includes('/')) { try { execSync(`command -v ${c}`, { stdio: 'ignore' }); return c; } catch { /* next */ } }
  }
  throw new Error('Chrome 을 못 찾았다. CHROME=<경로> 로 지정한다.');
}

const children = [];
const kill = () => { for (const c of children) { try { c.kill(); } catch { /* ignore */ } } };
process.on('exit', kill);

async function startServer() {
  if (process.env.DRAWCALL_URL) return process.env.DRAWCALL_URL;
  if (!existsSync('dist/index.html')) throw new Error('dist/ 가 없다. npm run build 뒤에 돌린다.');
  const srv = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', shell: process.platform === 'win32' });
  children.push(srv);
  const url = `http://localhost:${PORT}/`;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(url); if (r.ok) return url; } catch { /* not yet */ }
    await new Promise((ok) => setTimeout(ok, 500));
  }
  throw new Error('vite preview 가 30초 안에 뜨지 않았다');
}

async function launchChrome(url) {
  const port = 9333;
  const args = [`--remote-debugging-port=${port}`, '--headless=new', '--no-sandbox', '--disable-gpu-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--window-size=1280,800', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${process.env.RUNNER_TEMP || process.env.TEMP || '/tmp'}/drawcall-gate-profile`, url];
  const ch = spawn(findChrome(), args, { stdio: 'ignore' });
  children.push(ch);
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.url.startsWith(url));
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not yet */ }
    await new Promise((ok) => setTimeout(ok, 500));
  }
  throw new Error('Chrome DevTools 에 30초 안에 연결하지 못했다');
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const ready = new Promise((ok, no) => { ws.onopen = ok; ws.onerror = (e) => no(new Error(`ws ${e.message || e}`)); });
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text || 'evaluate 실패');
    return r.result?.result?.value;
  };
  return { ready, evaluate, close: () => ws.close() };
}

try {
  const url = await startServer();
  log(`서버 ${url}`);
  const wsUrl = await launchChrome(url);
  const c = cdp(wsUrl);
  await c.ready;
  await c.evaluate('new Promise((ok) => { const t = setInterval(() => { if (window.wizardChess?.debugRenderCalls) { clearInterval(t); ok(true); } }, 250); })');
  if (SCENE === 'village') {
    const fixture = JSON.parse(readFileSync(new URL('./fixtures/village-full.json', import.meta.url), 'utf8'));
    await c.evaluate(`(() => { const f = ${JSON.stringify(fixture)}; for (const [k, v] of Object.entries(f)) localStorage.setItem(k, JSON.stringify(v)); document.getElementById('btn-village').click(); return true; })()`);
    await c.evaluate('new Promise((ok) => { const t = setInterval(() => { if (window.wildcrownIsland && window.wildcrownIsland.pending() === 0) { clearInterval(t); ok(true); } }, 250); })');
    log(`섬 장면 준비(모델 로드 끝). ${SETTLE_MS}ms 안정화`);
    await new Promise((ok) => setTimeout(ok, SETTLE_MS));
    // 그림자 맵은 3프레임마다 갱신돼 그 프레임만 콜이 많다. 4프레임을 읽어 최대값을 판정에 쓴다.
    const r = await c.evaluate('new Promise((ok) => { const seen = []; const f = () => { seen.push(window.wildcrownIsland.renderCalls()); if (seen.length >= 4) ok({ calls: Math.max(...seen), low: Math.min(...seen), tris: window.wildcrownIsland.triangles(), built: JSON.parse(localStorage.getItem("wildcrown.village.v1")).built.length }); else requestAnimationFrame(f); }; requestAnimationFrame(f); })');
    c.close();
    log(`섬 장면 드로우콜 최대 ${r.calls} · 보통 ${r.low} (삼각형 ${r.tris}, 건물 ${r.built}) · 상한 ${MAX}`);
    if (r.built < 8) { log('고정 저장이 읽히지 않았다(건물 8채 아님)'); process.exitCode = 1; }
    else if (r.calls > MAX) { log('실패: 상한 초과'); process.exitCode = 1; }
    else log('통과');
  } else {
    log(`엔진 준비. ${SETTLE_MS}ms 안정화`);
    await new Promise((ok) => setTimeout(ok, SETTLE_MS));
    const r = await c.evaluate(`new Promise((ok) => { let n = 0; const f = () => (++n >= 4 ? ok({ calls: window.wizardChess.debugRenderCalls(), tris: window.wizardChess.debugRenderer().info.render.triangles, pieces: window.wizardChess.debugScene().children.filter((o) => o.name === 'piece').length }) : requestAnimationFrame(f)); requestAnimationFrame(f); })`);
    log(`드로우콜 ${r.calls} (삼각형 ${r.tris}, 기물 ${r.pieces}) · 상한 ${MAX}`);
    if (r.pieces < 32) { log('기물이 32개 아님 — 장면이 다 뜨지 않았다. DRAWCALL_SETTLE_MS 를 늘린다'); process.exitCode = 1; }
    else if (r.calls > MAX) { log('실패: 상한 초과'); process.exitCode = 1; }
    else log('통과');
    if (CAPTURE) {
      const lines = JSON.parse(readFileSync(new URL('./fixtures/capture-lines.json', import.meta.url), 'utf8'));
      for (const L of lines) {
        await c.evaluate(`(() => { localStorage.clear(); localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); localStorage.setItem('wildcrown.resume.v1', ${JSON.stringify(JSON.stringify({ v: 1, gameId: 777, color: L.color, rivalId: null, moves: L.moves }))}); location.reload(); return true; })()`);
        await new Promise((ok) => setTimeout(ok, 1500));
        await c.evaluate('new Promise((ok) => { const t = setInterval(() => { const w = window.wizardChess; const s = w?.getHandBrainState?.(); if (w?.isStarted?.() && s && s.ready && s.turn === s.playerColor && !w.debugBusy()) { clearInterval(t); ok(true); } }, 250); })');
        await new Promise((ok) => setTimeout(ok, 4000));
        const m = await c.evaluate(`new Promise((ok) => {
          const w = window.wizardChess; const rr = w.debugRenderer(); const orig = rr.render.bind(rr);
          document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click());
          let still = 0, move = 0, after = 0, moved = false; const imp0 = w.debugImpacts(); let hitAt = 0;
          rr.render = (a, b) => { orig(a, b); const n = rr.info.render.calls; if (hitAt) after = Math.max(after, n); else if (moved) move = Math.max(move, n); else still = Math.max(still, n); };
          const L = ${JSON.stringify(L.last)};
          setTimeout(() => {
            moved = true;
            w.executeChessMove(L.from[0], L.from[1], L.to[0], L.to[1], L.promotion ? { promotion: L.promotion } : {});
            const t0 = performance.now();
            const t = setInterval(() => {
              if (!hitAt && w.debugImpacts() > imp0) hitAt = performance.now();
              if ((hitAt && performance.now() - hitAt > 1500) || performance.now() - t0 > 60000) { clearInterval(t); rr.render = orig; ok({ still, move, after, peak: Math.max(still, move, after), hit: Boolean(hitAt) }); }
            }, 50);
          }, 600);
        })`);
        log(`잡기 ${L.key} (${L.san}): 두기 전 ${m.still} · 다가가며 ${m.move} · 타격 뒤 1.5초 ${m.after} → 최대 ${m.peak} · 상한 ${MAX}`);
        if (!m.hit) { log(`실패: ${L.key} 잡기가 일어나지 않았다`); process.exitCode = 1; }
        else if (m.peak > MAX) { log('실패: 잡기 순간 상한 초과'); process.exitCode = 1; }
      }
      await c.evaluate('(() => { localStorage.clear(); return true; })()');
    }
    c.close();
  }
} catch (e) {
  log(`오류: ${e.message}`);
  process.exitCode = 1;
} finally {
  kill();
}
