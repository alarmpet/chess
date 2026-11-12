// CX-0: 잡기 칸마다 이어 하기로 국면을 세우고, 마지막 잡기 한 수를 캔버스 녹화(captureStream + MediaRecorder)로 찍는다.
// 환경변수 CX_ONLY=칸1,칸2 로 일부만, CX_TAG 로 파일 접미사. 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const DIR = 'C:/Users/petbl/ego/cx0-20261108/';
const lines = JSON.parse(await fs.readFile('D:/chess/docs/qa/2026-11-08-cx0-captures/lines.json', 'utf8'));
// ego-browser nodejs 에는 환경변수가 넘어가지 않아 설정 파일로 받는다.
const cfg = JSON.parse(await fs.readFile(DIR + 'cx-config.json', 'utf8').catch(() => '{}'));
const only = cfg.only || [];
const tag = cfg.tag || 'before';
const task = await taskSpace('cx0 capture record');
const page = task.page('p1');
const out = [];
await page.goto('http://127.0.0.1:3000/', { timeout: 90000 });
for (const L of lines) {
  if (only.length && !only.includes(L.key)) continue;
  const row = { key: L.key, san: L.san };
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
    await page.waitForTimeout(500);
    // 사람 시험 A 용: 글자(퍽!·쾅!·역전! 등)를 끄고 찍는다.
    if (cfg.noWords) await page.evaluate(() => window.wizardChess.debugHideWords(true));
    row.canvas = await page.evaluate(() => {
      const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
      const s = c.captureStream(30);
      const r = new MediaRecorder(s, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 5e6 });
      window.__chunks = []; r.ondataavailable = (e) => e.data.size && window.__chunks.push(e.data);
      r.start(100); window.__rec = r; window.__t0 = performance.now();
      return [c.width, c.height];
    });
    row.sq = await page.evaluate((L) => window.wizardChess.debugSquareClient(L.last.to[0], L.last.to[1]), L);
    row.dpr = await page.evaluate(() => [devicePixelRatio, innerWidth, innerHeight]);
    await page.waitForTimeout(300);
    row.ok = await page.evaluate((L) => window.wizardChess.executeChessMove(L.last.from[0], L.last.from[1], L.last.to[0], L.last.to[1], L.last.promotion ? { promotion: L.last.promotion } : {}), L);
    // 연출이 시작되고 끝날 때까지(상대 응수 전에 멈춘다)
    await page.waitForFunction(() => window.wizardChess.debugBusy?.(), undefined, { timeout: 5000 }).catch(() => null);
    await page.waitForFunction(() => !window.wizardChess.debugBusy?.(), undefined, { timeout: 20000, polling: 30 });
    row.busyMs = Math.round(await page.evaluate(() => performance.now() - window.__t0));
    await page.waitForTimeout(350);
    const b64 = await page.evaluate(async () => {
      await new Promise((res) => { window.__rec.onstop = res; window.__rec.stop(); });
      const buf = new Uint8Array(await new Blob(window.__chunks, { type: 'video/webm' }).arrayBuffer());
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return btoa(s);
    });
    const file = `${L.key.replace('>', '-x-')}-${tag}.webm`;
    await fs.writeFile(DIR + file, Buffer.from(b64, 'base64'));
    row.file = file; row.kb = Math.round(b64.length * 0.75 / 1024);
    row.impacts = await page.evaluate(() => window.wizardChess.debugImpacts?.());
    row.upset = await page.evaluate(() => window.wizardChess.debugLastUpset?.());
    row.special = await page.evaluate(() => window.wizardChess.debugSpecial?.() || null);
  } catch (e) { row.error = String(e).slice(0, 200); }
  out.push(row);
  console.log(JSON.stringify(row));
}
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await fs.writeFile(DIR + `result-${tag}.json`, JSON.stringify(out, null, 1));
await task.finish({ keep: [] });
