// CX-4 확인: 거울 대결 4칸은 잡히는 쪽 자세(debugSpecial().mirrorPose)를, 사자 6칸 중 5칸은 흔들린 말 수를,
// 폰끼리는 콤보 번호·음높이를 기록한다. 시계를 0.25배로 늦춰 연속 캡처한다. 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/cx0-20261108/';
const lines = JSON.parse(await fs.readFile('D:/chess/docs/qa/2026-11-08-cx0-captures/lines.json', 'utf8'));
const KEYS = ['knight>knight', 'bishop>bishop', 'rook>rook', 'queen>queen', 'king>pawn', 'king>knight', 'king>bishop', 'king>rook', 'king>queen', 'pawn>pawn'];
const task = await taskSpace('cx4 trace');
const page = task.page('p1');
const out = {};
await page.goto('http://127.0.0.1:3000/', { timeout: 90000 });
for (const key of KEYS) {
  const L = lines.find((l) => l.key === key);
  const row = {};
  try {
    await page.evaluate((L) => {
      localStorage.clear();
      localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 }));
      localStorage.setItem('wildcrown.resume.v1', JSON.stringify({ v: 1, gameId: 777, color: L.color, rivalId: null, moves: L.moves }));
    }, L);
    await page.reload({ timeout: 90000 });
    await page.waitForFunction(() => { const s = window.wizardChess?.getHandBrainState?.(); return window.wizardChess?.isStarted?.() && s && s.ready && s.turn === s.playerColor && !window.wizardChess.debugBusy?.(); }, undefined, { timeout: 120000 });
    await page.waitForTimeout(3500);
    await page.evaluate(() => document.querySelectorAll('.panel-overlay .panel-close').forEach((b) => b.click()));
    row.sq = await page.evaluate((L) => window.wizardChess.debugSquareClient(L.last.to[0], L.last.to[1]), L);
    await page.evaluate(() => {
      const real = performance.now.bind(performance);
      const base = real();
      performance.now = () => base + (real() - base) * 0.25;
      window.__trace = [];
      const tick = () => {
        const a = window.wizardChess.debugAttackPose();
        const s = window.wizardChess.debugSpecial();
        window.__trace.push({ u: a?.u ?? null, atype: a?.type ?? null, impacts: s.impacts, special: s, mirror: s.mirrorPose, swaying: s.swaying });
        window.__traceRaf = requestAnimationFrame(tick);
      };
      tick();
    });
    const imp0 = await page.evaluate(() => window.wizardChess.debugImpacts());
    await page.evaluate((L) => window.wizardChess.executeChessMove(L.last.from[0], L.last.from[1], L.last.to[0], L.last.to[1], L.last.promotion ? { promotion: L.last.promotion } : {}), L);
    const atkType = key.split('>')[0];
    await page.waitForFunction((t) => window.__trace.some((p) => p.atype === t && p.u >= 0), atkType, { timeout: 60000, polling: 20 });
    const shots = [];
    for (let i = 0; i < 16; i++) {
      const p = await page.evaluate(() => ({ a: window.wizardChess.debugAttackPose(), s: window.wizardChess.debugSpecial() }));
      if (!p.a || p.a.u > 1.05) break;
      const name = `t4-${key.replace('>', '-x-')}-${String(i).padStart(2, '0')}.png`;
      await page.screenshot({ path: DIR + name });
      shots.push({ name, u: +p.a.u.toFixed(2), swaying: p.s?.swaying ?? 0, mirrorPitch: p.s?.mirrorPose ? +p.s.mirrorPose.pitch.toFixed(2) : null });
    }
    await page.waitForFunction(() => !window.wizardChess.debugBusy?.(), undefined, { timeout: 90000 });
    const all = await page.evaluate(() => { cancelAnimationFrame(window.__traceRaf); return window.__trace; });
    // 이 칸의 잡기만: 상대 응수가 또 잡으면 그 뒤 프레임은 버린다.
    const tr = all.filter((p) => p.impacts <= imp0 + 1);
    const hit = tr.find((p) => p.impacts === imp0 + 1);
    row.special = hit ? { mirror: hit.special.mirror, comboN: hit.special.comboN, pitch: hit.special.pitch, swayed: hit.special.swayed } : null;
    const mir = tr.filter((p) => p.mirror).map((p) => p.mirror);
    if (mir.length) {
      const ext = (k) => [+Math.min(...mir.map((m) => m[k])).toFixed(2), +Math.max(...mir.map((m) => m[k])).toFixed(2)];
      row.mirror = { frames: mir.length, pitch: ext('pitch'), lift: ext('lift'), roll: ext('roll'), yaw: ext('yaw'), stretch: ext('stretch') };
    }
    row.swayMax = Math.max(0, ...tr.map((p) => p.swaying || 0));
    row.swayFrames = tr.filter((p) => p.swaying > 0).length;
    row.shots = shots;
  } catch (e) { row.error = String(e).slice(0, 300); }
  out[key] = row;
  console.log(key, JSON.stringify({ ...row, shots: row.shots?.length }));
}
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await fs.writeFile(DIR + 'result-trace-cx4.json', JSON.stringify(out, null, 1));
await task.finish({ keep: [] });
