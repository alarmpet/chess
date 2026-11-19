// 대기 중(첫 국면) 보이는 그릴 거리를 종류별로 센다. 같은 지오메트리·재질이 여러 번 그려지면 묶을 후보다.
const fs = await import('node:fs/promises');
const task = await taskSpace('drawcall breakdown');
const page = task.page('p1');
await page.goto('http://127.0.0.1:3000/', { timeout: 90000 });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('wildcrown.cards.v1', JSON.stringify({ v: 1, cards: {}, sinceRare: 0, sinceHero: 0, firstDone: true, games: 10, dust: 0, shelf: [], shelfSlots: 3 })); });
await page.reload({ timeout: 90000 });
await page.waitForFunction(() => window.wizardChess?.isStarted?.() && !window.wizardChess.debugBusy?.(), undefined, { timeout: 120000 });
await page.waitForTimeout(6000);
const res = await page.evaluate(() => {
  const w = window.wizardChess; const s = w.debugScene(); const cam = w.debugCamera();
  const THREE_Frustum = cam.constructor; // not used
  const groups = {};
  s.traverseVisible((o) => {
    if (!(o.isMesh || o.isSprite || o.isPoints || o.isLine)) return;
    let top = o; while (top.parent && top.parent !== s) top = top.parent;
    const mats = Array.isArray(o.material) ? o.material.length : 1;
    const k = `${top.name || top.type}>${o.type}:${o.geometry?.type}${o.isSkinnedMesh ? ':skin' : ''}${o.frustumCulled ? '' : ':nocull'}`;
    groups[k] = groups[k] || { n: 0, mats: 0 };
    groups[k].n++; groups[k].mats += mats;
  });
  return { calls: w.debugRenderCalls(), size: [innerWidth, innerHeight], groups: Object.entries(groups).sort((a, b) => b[1].mats - a[1].mats) };
});
console.log(JSON.stringify(res, null, 0));
await fs.writeFile('D:/chess/docs/qa/2026-11-09-capture-drawcalls/breakdown-before.json', JSON.stringify(res, null, 1));
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
await task.finish({ keep: [] });
