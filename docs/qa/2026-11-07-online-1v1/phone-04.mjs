// 폰 새로고침(새 빌드) → 같은 방으로 복귀, 라이벌 안내·미션 띠가 없는지. 그다음 터치로 기권 → 확인.
import { tabs, attach } from './phone-lib.mjs';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const ADB = 'C:/Users/petbl/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const shot = (name) => fs.writeFile(DIR + name, execFileSync(ADB, ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }));
let t = (await tabs()).find((x) => x.type === 'page' && x.url.includes('wildcrown'));
let p = await attach(t);
const out = {};
await p.evaluate('window.__notes = []; new MutationObserver(() => { document.querySelectorAll("[class*=note], [class*=toast], [class*=notice]").forEach((n) => { const s = n.innerText; if (s && !window.__notes.includes(s)) window.__notes.push(s); }); }).observe(document.body, { subtree: true, childList: true, characterData: true }); 1').catch(() => {});
const t0 = Date.now();
await p.send('Page.reload', { ignoreCache: true });
p.close();
await new Promise((r) => setTimeout(r, 3000));
t = (await tabs()).find((x) => x.type === 'page' && x.url.includes('wildcrown'));
p = await attach(t);
out.readyMs = await p.waitFor(`window.wizardChess?.isOnline?.() && window.wizardChess.getHandBrainState().history.length >= 4 && !window.wizardChess.debugBusy()`, 120000, 100);
out.reloadMs = Date.now() - t0;
await new Promise((r) => setTimeout(r, 2500));
out.state = await p.evaluate(`(() => ({ ply: window.wizardChess.getHandBrainState().history.length, color: window.wizardChess.getHandBrainState().playerColor,
  bar: document.querySelector('#online-bar')?.innerText, strip: Boolean(document.querySelector('#game-strip')) && getComputedStyle(document.querySelector('#game-strip')).display,
  text: document.body.innerText.includes('첫 판이라') }))()`);
await shot('phone-c1-reloaded.png');
// 터치로 기권
const btn = await p.evaluate(`(() => { const r = document.querySelector('#online-resign').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
await p.tap(btn.x, btn.y);
await new Promise((r) => setTimeout(r, 800));
const yes = await p.evaluate(`(() => { const r = document.querySelector('#online-resign-yes').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
await shot('phone-c2-confirm.png');
await p.tap(yes.x, yes.y);
await new Promise((r) => setTimeout(r, 1500));
out.end = await p.evaluate(`document.querySelector('#online-end')?.innerText`);
await shot('phone-c3-resigned.png');
console.log(JSON.stringify(out, null, 1));
await fs.writeFile(DIR + 'phone-04.json', JSON.stringify(out, null, 1));
p.close();
