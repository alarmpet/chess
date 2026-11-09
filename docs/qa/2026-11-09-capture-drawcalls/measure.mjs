// 잡기 직후 드로우콜: renderer.render 를 감싸 프레임마다 calls 를 남기고, 최대인 프레임에 장면에 새로 보이는
// 그릴 거리(메시·스프라이트·점)를 이름·종류로 뽑는다. 이어 하기로 국면을 세우고 마지막 잡기를 둔다. 끝에 저장을 비운다.
const fs = await import('node:fs/promises');
const OUT = 'D:/chess/docs/qa/2026-11-09-capture-drawcalls/';
const lines = JSON.parse(await fs.readFile('D:/chess/docs/qa/2026-11-08-cx0-captures/lines.json', 'utf8'));
const cfg = JSON.parse(await fs.readFile(OUT + 'config.json', 'utf8').catch(() => '{}'));
const KEYS = cfg.keys || ['pawn>pawn', 'knight>pawn', 'bishop>knight', 'rook>queen', 'queen>queen', 'king>rook'];
const task = await taskSpace('capture drawcalls');
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
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      const w = window.wizardChess;
      const r = w.debugRenderer();
      const scene = w.debugScene();
      const drawn = () => {
        const set = new Map();
        scene.traverseVisible((o) => {
          if (!(o.isMesh || o.isSprite || o.isPoints || o.isLine)) return;
          const k = `${o.type}:${o.geometry?.type || '-'}:${o.material?.color?.getHexString?.() || '-'}:${o.parent?.type || '-'}${o.count != null ? ':n' + o.count : ''}`;
          set.set(o.uuid, k);
        });
        return set;
      };
      window.__base = drawn();
      window.__calls = [];
      window.__peak = { calls: 0 };
      const orig = r.render.bind(r);
      r.render = (s, c) => {
        orig(s, c);
        const calls = r.info.render.calls;
        window.__calls.push(calls);
        if (calls > window.__peak.calls) {
          const now = drawn();
          const added = {};
          for (const [id, k] of now) if (!window.__base.has(id)) added[k] = (added[k] || 0) + 1;
          window.__peak = { calls, added, at: window.__calls.length };
        }
      };
      window.__restore = () => { r.render = orig; };
    });
    const idle = await page.evaluate(async () => { const a = window.__calls.length; await new Promise((res) => setTimeout(res, 600)); return Math.max(...window.__calls.slice(a)); });
    row.idle = idle;
    await page.evaluate(() => { window.__peak = { calls: 0 }; window.__calls = []; window.__imp0 = window.wizardChess.debugImpacts(); });
    await page.evaluate((L) => window.wizardChess.executeChessMove(L.last.from[0], L.last.from[1], L.last.to[0], L.last.to[1], L.last.promotion ? { promotion: L.last.promotion } : {}), L);
    // 이 칸의 잡기 + 1.5초까지만(상대 응수 전)
    await page.waitForFunction(() => window.wizardChess.debugImpacts() > window.__imp0, undefined, { timeout: 30000, polling: 30 });
    const hitAt = await page.evaluate(() => window.__calls.length);
    await page.waitForTimeout(1500);
    const res = await page.evaluate((hitAt) => { const c = window.__calls; window.__restore(); return { before: Math.max(...c.slice(0, hitAt)), after: Math.max(...c.slice(hitAt)), frames: c.length, peak: window.__peak, over100: c.filter((x) => x > 100).length }; }, hitAt);
    Object.assign(row, res);
  } catch (e) { row.error = String(e).slice(0, 300); }
  out[key] = row;
  console.log(key, JSON.stringify(row));
}
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await fs.writeFile(OUT + (cfg.tag ? `result-${cfg.tag}.json` : 'result-before.json'), JSON.stringify(out, null, 1));
await task.finish({ keep: [] });
