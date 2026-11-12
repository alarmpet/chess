// DR-M1 화면 확인: 설정의 「AI 세기」(− + 자동)와 판 끝 「실력이 늘었어요 — 다음 상대 …」 + 되돌리기.
// dev 서버(3000)에서: node docs/qa/2026-11-10-dr-m1/verify-coach.mjs — 임시 프로필 헤드리스 Chrome, 960×640 과 390×844.
import { spawn } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
const BASE = process.env.WC_URL || 'http://localhost:3000/';
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const rows = [];
const check = (item, want, got, ok) => { rows.push({ item, want, got, ok }); console.log(ok ? '✅' : '❌', item, '|', want, '|', got); };

for (const [port, name, mobile] of [[9471, 'wide', false], [9472, 'phone', true]]) {
  const dir = `${process.env.TEMP}/wc-drm1-${name}`;
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
  const until = async (expr, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(expr).catch(() => false)) return true; await sleep(150); } return false; };
  const shot = async (file) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(file, OUT), Buffer.from(s.result.data, 'base64')); };
  if (mobile) await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  await until('Boolean(window.wizardChess)');
  await ev(`(() => { localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
    localStorage.removeItem('wildcrown.skill.v1'); localStorage.removeItem('wildcrown.resume.v1'); return 1; })()`);
  await ev('location.reload(), 1').catch(() => null);
  await sleep(1500);
  await until('(() => { const w = window.wizardChess; return w?.isStarted?.() && !w.debugBusy(); })()', 90000);
  await sleep(800);
  const engineStep = () => ev(`window.wizardChess.getRivalCatalog().freePlay.step`);
  const skill = () => ev(`JSON.parse(localStorage.getItem('wildcrown.skill.v1') || 'null')`);

  // 새 기기: 2단계로 시작
  const s0 = await engineStep();
  check(`${name} 새 기기의 자유 대국`, '엔진 단계 2(다람쥐)', JSON.stringify({ engine: s0 }), s0 === 2);

  // 설정 열기
  const openSettings = () => ev(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /설정|⚙️/.test(x.textContent || '') || /설정/.test(x.title || '')); if (b) b.click(); return Boolean(b); })()`);
  const menu = async () => { await ev(`(() => { const m = [...document.querySelectorAll('button')].find((x) => /메뉴|☰/.test(x.textContent || '')); if (m) m.click(); return 1; })()`); await sleep(400); };
  let opened = await openSettings();
  if (!opened || !(await until(`Boolean(document.getElementById('setting-strength'))`, 3000))) { await menu(); opened = await openSettings(); }
  await until(`Boolean(document.getElementById('setting-strength'))`, 8000);
  const row = () => ev(`(() => { const r = document.getElementById('setting-strength'); return r ? r.innerText.replace(/\\s+/g, ' ') : null; })()`);
  const r0 = await row();
  const stepLine = await ev(`(() => { const e = document.getElementById('strength-step'); const r = e.getBoundingClientRect(); return { text: e.textContent, h: Math.round(r.height) }; })()`);
  check(`${name} 설정 AI 세기 줄`, '「🐿️ 다람쥐 · 2/7」 한 줄 · 자동', JSON.stringify({ r0, stepLine }), /다람쥐 · 2\/7/.test(r0 || '') && /자동:/.test(r0 || '') && stepLine.h < 40);
  await ev(`document.getElementById('strength-up').click(), 1`);
  await sleep(300);
  const r1 = await row(); const sk1 = await skill(); const e1 = await engineStep();
  check(`${name} + 누르기`, '여우 3/7 · 고정 · 엔진 3', JSON.stringify({ r1, mode: sk1?.mode, engine: e1 }), /여우 · 3\/7/.test(r1 || '') && sk1?.mode === 'fixed' && e1 === 3);
  await shot(`settings-${name}.jpg`);
  await ev(`document.getElementById('strength-auto').click(), 1`);
  await sleep(300);
  const sk2 = await skill();
  check(`${name} 자동 다시 켜기`, 'mode auto', sk2?.mode, sk2?.mode === 'auto');
  await ev(`(() => { document.querySelectorAll('.panel-overlay .panel-close').forEach((x) => x.click()); return 1; })()`);
  await sleep(300);

  // 판 끝: 높은 실력으로 꾸민 저장에서 자유 대국 승리 → 한 칸 오름 알림
  await ev(`(() => { localStorage.setItem('wildcrown.skill.v1', JSON.stringify({ v: 1, rating: 1100, games: 12, mode: 'auto', step: 3, hold: 0, change: null })); window.wizardChess.setFreePlay({ search: 'easy', mistake: 0.04, blind: 0.05, stage: 'normal', step: 3 }); return 1; })()`);
  await ev(`(() => { window.dispatchEvent(new CustomEvent('gamefinished', { detail: { gameId: 910001, result: 'win', color: 'w', moves: [], rivalId: null } })); return 1; })()`);
  // 주머니 화면이 떠 있는 동안에는 알림이 숨는다 → 닫으면 보인다
  await sleep(1500);
  const hiddenWhilePouch = await ev(`Boolean(document.getElementById('card-reveal')) && !document.getElementById('strength-change')`);
  check(`${name} 주머니 화면 동안 알림 숨김`, 'card-reveal 있음 · 알림 없음', hiddenWhilePouch, hiddenWhilePouch === true);
  await ev(`(() => { document.querySelectorAll('.card-reveal-actions button.secondary').forEach((b) => b.click()); return 1; })()`);
  await until(`Boolean(document.getElementById('strength-change'))`, 5000);
  const bar = await ev(`(() => { const b = document.getElementById('strength-change'); if (!b) return null; const r = b.getBoundingClientRect(); return { text: b.innerText.replace(/\\s+/g, ' '), right: Math.round(r.right), vw: innerWidth }; })()`);
  const sk3 = await skill(); const e3 = await engineStep();
  check(`${name} 판 끝 한 칸 오름 알림`, '「실력이 늘었어요 — 다음 상대 🐼 판다 (4/7)」 · 엔진 4 · 화면 안', JSON.stringify({ bar, step: sk3?.step, engine: e3 }),
    /실력이 늘었어요 — 다음 상대 .* \(4\/7\)/.test(bar?.text || '') && sk3?.step === 4 && e3 === 4 && bar.right <= bar.vw);
  await shot(`change-${name}.jpg`);
  await ev(`document.getElementById('strength-undo').click(), 1`);
  await sleep(300);
  const sk4 = await skill(); const e4 = await engineStep();
  check(`${name} 되돌리기`, '단계 3 · hold 3 · 엔진 3 · 알림 사라짐', JSON.stringify({ step: sk4?.step, hold: sk4?.hold, engine: e4, bar: await ev(`Boolean(document.getElementById('strength-change'))`) }),
    sk4?.step === 3 && sk4?.hold === 3 && e4 === 3 && !(await ev(`Boolean(document.getElementById('strength-change'))`)));
  ws.close();
  chrome.kill();
}
writeFileSync(new URL('result-coach.json', OUT), JSON.stringify({ at: new Date().toISOString(), pass: rows.filter((r) => r.ok).length, total: rows.length, rows }, null, 2));
console.log(`${rows.filter((r) => r.ok).length}/${rows.length}`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
