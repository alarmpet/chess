// CO-1 둘이 한 왕국 확인: 역할 표시(🟠→🔵 교대) · 종류 잠금 · 엔진 우회 차단 · 하이파이브 · 20초 인계 · 한 판 완주.
// 시작 전 localStorage 를 통째로 떠 두고 끝에 되돌린다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/coop-team-20261107/';
const task = await taskSpace('coop team check');
console.log('space', task.spaceId);
const page = task.page('p1');
const wait = (ms) => page.waitForTimeout(ms);
const out = { steps: [] };
const log = (k, v) => { out.steps.push([k, v]); console.log(k, JSON.stringify(v)); };
const shot = (name) => page.screenshot({ path: DIR + name });
const lead = () => page.evaluate(() => document.querySelector('#handbrain-bar')?.innerText || '');
const myTurn = (t = 120000) => page.waitForFunction(() => {
  if (window.__fin) return true;
  const s = window.wizardChess?.getHandBrainState?.();
  return Boolean(s && s.ready && s.turn === s.playerColor && document.querySelector('.handbrain-kind'));
}, undefined, { timeout: t }).then(() => true).catch(() => false);

await page.goto('http://127.0.0.1:3000/', { timeout: 60000 });
const backup = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)]))));
await fs.writeFile(DIR + 'ls-backup.json', backup);
try {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
    localStorage.setItem('wildcrown.handbrain.v1', JSON.stringify({ v: 1, mode: 'family', swap: 'move', games: 0 }));
  });
  await page.reload({ timeout: 60000 });
  await page.evaluate(() => {
    window.__fin = null;
    window.__caps = [];
    window.addEventListener('gamefinished', (e) => { window.__fin = e.detail || { done: true }; });
    window.addEventListener('movelanded', () => {
      const t = window.__wizardChessTelemetry?.lastCaptureTiming;
      if (t && window.__caps[window.__caps.length - 1] !== t) window.__caps.push(t);
    });
  });
  log('turn1', await myTurn());
  await wait(1500);
  log('lead1', await lead());
  await shot('a1-brain-orange.png');

  // 뇌가 캥거루를 부른다 → 잠김
  await page.click('#hb-n', { label: 'Brain names kangaroo' });
  await wait(300);
  log('locked', await page.evaluate(() => ({
    pawnDisabled: document.querySelector('#hb-p')?.disabled,
    swapRefused: window.wizardChess.setHandBrain('pawn'),
    pawnBypass: window.wizardChess.executeChessMove(6, 4, 4, 4)
  })));
  await wait(300);
  log('lead1b', await lead());
  await shot('a2-locked.png');
  log('knight', await page.evaluate(() => window.wizardChess.executeChessMove(7, 6, 5, 5)));

  // 상대 차례: 😅 와 두 자리 ✋
  const opp = await page.waitForSelector('#hb-slap-0', { timeout: 15000 }).then(() => true).catch(() => false);
  log('oppButtons', opp);
  await shot('b1-opp.png');
  await page.click('#hb-slap-0', { label: 'Orange taps hand' });
  await page.click('#hb-slap-1', { label: 'Blue taps hand' });
  await wait(250);
  log('five', await page.evaluate(() => Boolean(document.querySelector('#hb-five'))));
  await shot('b2-five.png');

  // 둘째 수: 🔵 가 뇌. 20초 동안 안 부르면 손에게 넘어간다.
  log('turn2', await myTurn());
  await wait(800);
  log('lead2', await lead());
  await shot('c1-brain-blue.png');
  await wait(21000);
  log('lead2b', await lead());
  log('handoverKindsDisabled', await page.evaluate(() => [...document.querySelectorAll('.handbrain-kind')].every((b) => b.disabled)));
  await shot('c2-handover.png');
  log('anyPiece', await page.evaluate(() => window.wizardChess.executeChessMove(6, 4, 4, 4)));

  // 나머지: 뇌는 AI 조언(adviseKind) 종류를 버튼으로 부르고, 손은 그 종류 안에서 쉬운 봇 수를 둔다.
  let own = 2;
  const leads = [];
  while (own < 150) {
    if (!(await myTurn())) { log('stuck', own); break; }
    if (await page.evaluate(() => Boolean(window.__fin))) break;
    await wait(200);
    const r = await page.evaluate(async () => {
      const hb = await import('/src/cards/handBrain.js');
      const ai = await import('/src/rules/ai.js');
      const st = window.wizardChess.getHandBrainState();
      const kind = hb.adviseKind(st.fen, { history: st.history, level: 'easy' });
      if (!kind) return { none: true };
      document.querySelector('#hb-' + kind).click();
      await new Promise((ok) => setTimeout(ok, 150));
      const lead = document.querySelector('.handbrain-lead')?.innerText || '';
      const mv = ai.chooseMove(st.fen, { level: 'easy', only: kind, slip: 0.3 });
      const rc = (sq) => [8 - Number(sq[1]), sq.charCodeAt(0) - 97];
      const [fr, fc] = rc(mv.from); const [tr, tc] = rc(mv.to);
      const ok = window.wizardChess.executeChessMove(fr, fc, tr, tc, { promotion: 'queen' });
      return { kind, lead, ok, from: mv.from, to: mv.to };
    });
    leads.push(r);
    if (!r.ok) { log('moveFailed', r); break; }
    own += 1;
    if (own === 12) { await wait(600); await shot('d1-midgame.png'); }
  }
  await wait(3000);
  log('fin', await page.evaluate(() => window.__fin));
  log('ownMoves', own);
  out.leads = leads.slice(0, 12);
  out.leadSeatsAlternate = leads.every((r, i) => i === 0 || r.lead.slice(0, 2) !== leads[i - 1].lead.slice(0, 2));
  log('caps', await page.evaluate(() => window.__caps.map((t) => ({ piece: t.pieceType, ret: t.returnDuration, total: t.totalDuration }))));
  await shot('d2-end.png');
  log('playlog', await page.evaluate(() => JSON.parse(localStorage.getItem('wildcrown.playlog.v1') || '[]').filter((e) => e.type === 'start' || e.type === 'coop' || e.type === 'game')));
} finally {
  await page.evaluate((b) => { localStorage.clear(); for (const [k, v] of Object.entries(JSON.parse(b))) localStorage.setItem(k, v); }, backup);
  await fs.writeFile(DIR + 'result-01.json', JSON.stringify(out, null, 1));
}
await task.finish({ keep: [] });
