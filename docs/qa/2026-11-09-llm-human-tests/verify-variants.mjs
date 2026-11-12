// CX-6 미어캣 반응 변형 확인: 한 판에서 미어캣을 세 번 잡아(exd5 · Qxd5 · Qxg2) 반응이 셋 다 다른지 재고 찍는다.
//   node docs/qa/2026-11-09-llm-human-tests/verify-variants.mjs   (떠 있는 dev 서버 3000 사용)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('./variants/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const port = 9351;
const ch = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
  '--no-first-run', '--mute-audio', '--window-size=960,600', `--user-data-dir=${process.env.TEMP}/wc-variants-profile`, process.env.WC_URL || 'http://localhost:3000/'], { stdio: 'ignore' });
process.on('exit', () => { try { ch.kill(); } catch { /* */ } });
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page')?.webSocketDebuggerUrl; } catch { /* */ }
  if (!wsUrl) await new Promise((ok) => setTimeout(ok, 500));
}
const ws = new WebSocket(wsUrl);
let id = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await new Promise((ok) => { ws.onopen = ok; });
const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pending.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return; await sleep(150); } throw new Error('timeout ' + expr); };

await until('Boolean(window.wizardChess?.setFreePlay)', 90000);
await ev(`(() => { localStorage.clear(); localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); location.reload(); return 1; })()`).catch(() => null);
await sleep(2000);
await until('(() => { const w = window.wizardChess; const s = w?.getHandBrainState?.(); return w?.isStarted?.() && s?.ready && !w.debugBusy(); })()', 120000);
await sleep(2500);
await ev('(() => { window.wizardChess.setFreePlay(true); document.querySelectorAll(".panel-overlay .panel-close").forEach((b) => b.click()); return 1; })()');
const moves = [[[6, 4], [4, 4]], [[1, 3], [3, 3]], [[4, 4], [3, 3], 'exd5'], [[0, 3], [3, 3], 'Qxd5'], [[7, 1], [5, 2]], [[3, 3], [6, 6], 'Qxg2']];
const out = [];
for (const [from, to, cap] of moves) {
  await until('!window.wizardChess.debugBusy()');
  await sleep(300);
  const ok = await ev(`window.wizardChess.executeChessMove(${from[0]}, ${from[1]}, ${to[0]}, ${to[1]})`);
  if (!cap) { out.push({ move: `${from}->${to}`, ok }); continue; }
  // 반응 구간(0.55초) 동안 자세를 모으고, 0.3초쯤 한 장 찍는다.
  const samples = [];
  let shot = false;
  for (let i = 0; i < 400; i++) {
    const f = await ev('window.wizardChess.debugFading().filter((x) => x.type === "pawn" && x.age < 0.7).sort((a, b) => a.age - b.age)[0]');
    if (f) {
      samples.push(f);
      if (!shot && f.age > 0.28) {
        const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
        writeFileSync(new URL(`${cap}-v${f.variant}.jpg`, OUT), Buffer.from(s.result.data, 'base64'));
        shot = true;
      }
      if (f.age > 0.55) break;
    }
    await sleep(15);
  }
  const r = samples.filter((s) => s.age <= 0.55);
  out.push({ move: cap, ok, variant: r[0]?.variant, maxUp: +Math.max(...r.map((s) => s.up)).toFixed(2), backAt055: +(r.at(-1)?.back ?? 0).toFixed(2), maxLeanDeg: Math.round(Math.max(...r.map((s) => s.leanDeg))), samples: r.length });
}
console.log(JSON.stringify(out, null, 1));
writeFileSync(new URL('result.json', OUT), JSON.stringify(out, null, 1));
await ev('(() => { localStorage.clear(); sessionStorage.clear(); return 1; })()');
ws.close();
process.exit(0);
