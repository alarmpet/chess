// 잡기 뒤 debugBusy 가 풀리지 않는 원인: 페이지 오류·콘솔 오류를 모으고, 수를 둔 뒤 상태를 시간별로 본다.
const fs = await import('node:fs/promises');
const lines = JSON.parse(await fs.readFile('D:/chess/docs/qa/2026-11-08-cx0-captures/lines.json', 'utf8'));
const task = await taskSpace('capture hang');
const page = task.page('p1');
await page.goto('http://127.0.0.1:3000/', { timeout: 90000 });
const L = lines.find((l) => l.key === 'knight>knight');
await page.evaluate((L) => {
  localStorage.clear();
  localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
  localStorage.setItem('wildcrown.resume.v1', JSON.stringify({ v: 1, gameId: 777, color: L.color, rivalId: null, moves: L.moves }));
}, L);
await page.reload({ timeout: 90000 });
await page.evaluate(() => { window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(String(e.message) + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno)); const ce = console.error; console.error = (...a) => { window.__errs.push('console ' + a.map(String).join(' ').slice(0, 300)); ce(...a); }; });
await page.waitForFunction(() => { const s = window.wizardChess?.getHandBrainState?.(); return window.wizardChess?.isStarted?.() && s && s.ready && s.turn === s.playerColor && !window.wizardChess.debugBusy?.(); }, undefined, { timeout: 120000 });
await page.waitForTimeout(3000);
await page.evaluate(() => document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click()));
await page.evaluate((L) => window.wizardChess.executeChessMove(L.last.from[0], L.last.from[1], L.last.to[0], L.last.to[1]), L);
for (let i = 0; i < 8; i++) {
  await page.waitForTimeout(1500);
  console.log(i, JSON.stringify(await page.evaluate(() => { const s = window.wizardChess.getHandBrainState(); return { ms: window.wizardChess.debugMoveState(), busy: window.wizardChess.debugBusy(), imp: window.wizardChess.debugImpacts(), turn: s.turn, player: s.playerColor, ply: s.history.length, over: document.body.innerText.includes("승부 끝"), overlay: [...document.querySelectorAll(".panel-overlay")].filter((o) => o.offsetParent).map((o) => o.className).slice(0, 3), errs: window.__errs.slice(0, 5) }; })));
}
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await task.finish({ keep: [] });
