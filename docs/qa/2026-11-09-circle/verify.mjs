// L-3 친구 무대 확인: 로컬 Worker(/api/rank/circle) 와 두 브라우저.
//   npm run build → npx wrangler@4 d1 migrations apply wildcrown-rank --local → npx wrangler@4 dev --port 8787 --ip 127.0.0.1
//   node docs/qa/2026-11-09-circle/verify.mjs
// 하는 것:
//   API: 새 기기 넷(나·A·B·C). 나-A 3판(2승 1패), 나-B 1판(무), A-B 1판, C 는 나와 안 둠. 두 사람 보고로 넣는다.
//        → 나의 무대: 나·A·B 셋, 전적, 사다리 순 등수. 남의 id 로 서명 · 오래된 시각 · 위조 서명 → 거부.
//   화면: 「나」 키를 넣은 Chrome(960×600) 친구 창 → 무대 목록, 이름 바꾸기(기기 안 저장),
//         「A」 키를 넣은 휴대폰 폭 Chrome(390×844) 으로 같은 랭크 방 → 두 막대에 「이 친구와 2승 1패」/「1승 2패」.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { loadIdentity } from '../../../src/net/identity.js';
import { signReport } from '../../../src/rank/report.js';
import { RANK_BUILD } from '../../../src/rank/abuse.js';
import { circleText } from '../../../src/rank/circle.js';

const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });
const BASE = process.env.WC_URL || 'http://127.0.0.1:8787/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const procs = {};
process.on('exit', () => { for (const c of Object.values(procs)) { try { c.kill(); } catch { /* */ } } });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };

// ── API ──
const store = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), raw: m }; };
const person = async () => { const s = store(); const id = await loadIdentity(s); return { ...id, saved: s.raw.get('wildcrown.identity.v1') }; };
const ME = await person(), A = await person(), B = await person(), C = await person();
const post = async (path, body) => { const r = await fetch(`${BASE}api/rank/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return { code: r.status, body: await r.json() }; };
const meta = (mine) => { const now = Date.now(); return { build: RANK_BUILD, start: now - 90_000, end: now - 1000, think: Array.from({ length: mine }, (_, i) => 1500 + i * 400) }; };
let roomN = 0;
const play = async (w, b, result) => {
  const m = { room: `L3${String(++roomN).padStart(4, '0')}`, game: 1, white: w.id, black: b.id, moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6'], result, reason: result === '1/2-1/2' ? 'agree' : 'resign' };
  if (result === '1/2-1/2') { m.moves = ['g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8']; m.reason = 'repetition'; }
  const n = m.moves.length;
  await post('result', await signReport(m, w, meta(Math.ceil(n / 2))));
  return (await post('result', await signReport(m, b, meta(Math.floor(n / 2))))).body;
};
const outs = [await play(ME, A, '1-0'), await play(A, ME, '1-0'), await play(A, ME, '0-1'), await play(ME, B, '1/2-1/2'), await play(A, B, '1-0')];
check('판 다섯 넣기', 'counted ×5', outs.map((o) => o.status).join(','), outs.every((o) => o.status === 'counted'));

const ask = async (who, { id = who.id, at = Date.now(), text = null } = {}) => post('circle', {
  id, pub: { x: who.pub.x, y: who.pub.y }, at, sig: await who.sign(text ?? circleText(id, at))
});
const mine = await ask(ME);
const c = mine.body.circle || [];
const short = c.map((p) => ({ who: p.me ? 'ME' : p.id === A.id ? 'A' : p.id === B.id ? 'B' : '?', rank: p.rank, points: p.points, rec: p.me ? '' : `${p.wins}-${p.losses}-${p.draws}` }));
check('나의 무대', '나·A·B 셋, C 없음', JSON.stringify(short), c.length === 3 && !c.some((p) => p.id === C.id));
const a = c.find((p) => p.id === A.id), b = c.find((p) => p.id === B.id);
check('A 와 전적', '2승 1패 0무', a && `${a.wins}-${a.losses}-${a.draws}`, a?.wins === 2 && a?.losses === 1 && a?.draws === 0);
check('B 와 전적', '0승 0패 1무', b && `${b.wins}-${b.losses}-${b.draws}`, b?.draws === 1 && b?.games === 1);
const sorted = c.every((p, i) => i === 0 || c[i - 1].points >= p.points);
check('사다리 점수 순', '내림차순', c.map((p) => p.points).join(' ≥ '), sorted);
const empty = (await ask(C)).body.circle || [];
check('아직 둔 친구 없음', '나 혼자', empty.length, empty.length === 1 && empty[0].me);
const other = await ask(B, { id: ME.id });
check('남의 id 로 묻기(B 키로 나의 무대)', '403 pub', `${other.code} ${other.body.error}`, other.code === 403 && other.body.error === 'pub');
const forged = await post('circle', { id: ME.id, pub: { x: ME.pub.x, y: ME.pub.y }, at: Date.now(), sig: await B.sign(circleText(ME.id, Date.now())) });
check('내 공개 키 + 남의 서명', '403 signature', `${forged.code} ${forged.body.error}`, forged.code === 403 && forged.body.error === 'signature');
const old = await ask(ME, { at: Date.now() - 11 * 60e3 });
check('11분 지난 요청', '400 time', `${old.code} ${old.body.error}`, old.code === 400 && old.body.error === 'time');
const replayAt = Date.now();
const wrongText = await ask(ME, { at: replayAt, text: circleText(ME.id, replayAt - 1) });
check('시각과 안 맞는 서명', '403 signature', `${wrongText.code} ${wrongText.body.error}`, wrongText.code === 403);

// ── 화면 ──
async function browser(port, name, url) {
  const dir = `${process.env.TEMP}/wc-l3-${name}`;
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
  procs[name] = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${port}`, '--headless=new',
    '--no-first-run', '--mute-audio', '--window-size=960,600', `--user-data-dir=${dir}`, url], { stdio: 'ignore' });
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
  const until = async (expr, ms = 90000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return; await sleep(250); } throw new Error(`${name} timeout ${expr}`); };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
  return { ev, until, shot, send };
}
const ready = '(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()';
const seed = (saved) => `(() => { localStorage.setItem('wildcrown.identity.v1', ${JSON.stringify(saved)});
  localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); return 1; })()`;
const boot = async (b, saved) => { await b.until('Boolean(window.wizardChess)'); await b.ev(seed(saved)); await b.ev('location.reload(), 1').catch(() => null); await sleep(1500); await b.until(ready); await sleep(800); };
const openPanel = (b) => b.ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); document.getElementById('btn-online').click(); return 1; })()`);
const circleDom = (b) => b.ev(`(() => ({ standing: document.getElementById('online-standing')?.textContent || null,
  rows: [...document.querySelectorAll('#online-circle li')].map((li) => li.innerText.replace(/\\s+/g, ' ').trim()) }))()`);

const host = await browser(9381, 'me', BASE);
await boot(host, ME.saved);
await openPanel(host);
await host.until(`document.querySelectorAll('#online-circle li').length === 3`, 20000);
const panel = await circleDom(host);
check('친구 창 무대', '3줄 · 「3명 중 n등」', JSON.stringify(panel), panel.rows.length === 3 && /3명 중 \d등/.test(panel.standing || ''));
await host.shot('1-panel-circle.jpg');
// 이름 바꾸기: A 줄의 이름 단추 → 입력 → Enter
await host.ev(`(() => { [...document.querySelectorAll('#online-circle li')].find((li) => li.dataset.id === ${JSON.stringify(A.id)}).querySelector('button.circle-name').click(); return 1; })()`);
await host.until(`Boolean(document.querySelector('#online-circle .circle-input'))`, 5000);
await host.ev(`(() => { const i = document.querySelector('#online-circle .circle-input'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '우리 아빠'); i.dispatchEvent(new Event('input', { bubbles: true })); return 1; })()`);
await host.ev(`document.querySelector('#online-circle .circle-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })), 1`);
await host.until(`/우리 아빠/.test(document.getElementById('online-circle').innerText)`, 5000);
const savedNames = await host.ev(`localStorage.getItem('wildcrown.friends.v1')`);
check('이름 바꾸기', '「우리 아빠」 화면·기기 저장', savedNames, /우리 아빠/.test(savedNames || '') && savedNames.includes(A.id));
await host.shot('2-panel-renamed.jpg');

// 같은 랭크 방: 나(백, 넓은 화면) · A(휴대폰 폭)
await host.until(`Boolean(document.getElementById('online-kind-ranked'))`);
await host.ev(`(() => { document.getElementById('online-kind-ranked').click(); document.getElementById('online-pick-w').click(); return 1; })()`);
await sleep(300);
await host.ev(`document.getElementById('online-create').click(), 1`);
await host.until(`Boolean(document.getElementById('online-bigcode')?.textContent)`);
const code = await host.ev(`document.getElementById('online-bigcode').textContent`);
await host.ev(`document.querySelectorAll('.panel-overlay').forEach((o) => o.click()), 1`);
const guest = await browser(9382, 'a', `${BASE}?room=${code}`);
await guest.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await boot(guest, A.saved);
await host.until(`Boolean(document.getElementById('online-h2h'))`, 60000);
await guest.until(`Boolean(document.getElementById('online-h2h'))`, 60000);
await sleep(800);
const barOf = (b) => b.ev(`(() => ({ scores: document.getElementById('online-scores')?.textContent || null, h2h: document.getElementById('online-h2h')?.textContent || null }))()`);
const hb = await barOf(host), gb = await barOf(guest);
check('내 막대', '「우리 아빠」 · 「이 친구와 2승 1패」', JSON.stringify(hb), /우리 아빠/.test(hb.scores || '') && hb.h2h === '이 친구와 2승 1패');
check('A 막대(휴대폰)', '기본 동물 이름 · 「이 친구와 1승 2패」', JSON.stringify(gb), / 친구 [A-Z0-9_-]{2}/.test(gb.scores || '') && gb.h2h === '이 친구와 1승 2패');
await host.shot('3-host-bar-h2h.jpg');
await guest.shot('4-phone-bar-h2h.jpg');
// 휴대폰 폭에서 막대가 화면 밖으로 넘치지 않는지
const overflow = await guest.ev(`(() => { const r = document.getElementById('online-h2h').getBoundingClientRect(); return { right: Math.round(r.right), vw: innerWidth }; })()`);
check('휴대폰 폭 넘침', 'right ≤ 390', JSON.stringify(overflow), overflow.right <= overflow.vw);

writeFileSync(new URL('result.json', OUT), JSON.stringify({ at: new Date().toISOString(), pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
