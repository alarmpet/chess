// 폰(흑): e4 를 받으면 손가락 터치로 e7 → e5. 그다음 홈으로 내려 신호를 보내고, PC 의 Nf3 가 간 뒤 20초 있다가
// 크롬을 다시 올려 밀린 수가 그려지는지 보고, 터치로 b8 → c6.
import { tabs, attach } from './phone-lib.mjs';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const ADB = 'C:/Users/petbl/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const adb = (...a) => execFileSync(ADB, a);
const shot = (name) => fs.writeFile(DIR + name, execFileSync(ADB, ['exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }));
const code = (await fs.readFile(DIR + 'code.txt', 'utf8')).trim();
const tab = (await tabs()).find((t) => t.type === 'page' && t.url.includes(code));
let p = await attach(tab);
const out = {};
const len = 'window.wizardChess.getHandBrainState().history.length';
const touchMove = async (from, to) => {
  const sq = (s) => [8 - Number(s[1]), s.charCodeAt(0) - 97];
  const [fr, fc] = sq(from); const [tr, tc] = sq(to);
  const a = await p.evaluate(`window.wizardChess.debugSquareClient(${fr}, ${fc})`);
  const b = await p.evaluate(`window.wizardChess.debugSquareClient(${tr}, ${tc})`);
  await p.tap(a.x, a.y);
  await new Promise((r) => setTimeout(r, 500));
  const sel = await p.evaluate('window.wizardChess.debugSelected()');
  await p.tap(b.x, b.y);
  return { a, b, sel };
};
out.waitE4 = await p.waitFor(`${len} >= 1`, 120000, 30);
out.gotE4 = Date.now();
// 내 차례가 되고 연출이 끝날 때까지
await p.waitFor(`!window.wizardChess.debugBusy?.() && /내 차례/.test(document.querySelector('#online-turn')?.innerText || '')`, 30000, 100);
await new Promise((r) => setTimeout(r, 800));
out.tapE5 = await touchMove('e7', 'e5');
if (!(await p.waitFor(`${len} >= 2`, 5000, 50) >= 0)) { console.log('e5 touch failed', JSON.stringify(out.tapE5)); process.exit(1); }
out.sentE5 = Date.now();
out.e5ok = await p.waitFor(`${len} >= 2`, 8000, 50);
await new Promise((r) => setTimeout(r, 2500));
await shot('phone-b1-after-e5.png');
// 홈으로 내린다
adb('shell', 'input', 'keyevent', 'KEYCODE_HOME');
await new Promise((r) => setTimeout(r, 1500));
await fs.writeFile(DIR + 'sig-bg', '1');
// PC 의 Nf3 가 간 뒤 20초
for (let i = 0; i < 600; i++) { try { await fs.access(DIR + 'sig-nf3'); break; } catch (e) { await new Promise((r) => setTimeout(r, 300)); } }
out.bgWhileNf3 = await p.evaluate(`({ ply: ${len}, vis: document.visibilityState, turn: document.querySelector('#online-turn')?.innerText })`).catch((e) => 'eval-failed');
await new Promise((r) => setTimeout(r, 20000));
out.bgAfter20s = await p.evaluate(`({ ply: ${len}, vis: document.visibilityState, peer: document.querySelector('#online-peer')?.innerText })`).catch((e) => 'eval-failed');
// 다시 올린다(최근 앱에서 크롬으로)
adb('shell', 'am', 'start', '-n', 'com.android.chrome/com.google.android.apps.chrome.Main');
const back = Date.now();
out.resumeMs = await p.waitFor(`${len} >= 3 && !window.wizardChess.debugBusy?.()`, 30000, 50);
out.afterResume = await p.evaluate(`({ ply: ${len}, vis: document.visibilityState, bar: document.querySelector('#online-bar')?.innerText })`);
await new Promise((r) => setTimeout(r, 1500));
await shot('phone-b2-resumed.png');
out.tapNc6 = await touchMove('b8', 'c6');
out.sentNc6 = Date.now();
out.nc6ok = await p.waitFor(`${len} >= 4`, 8000, 50);
out.backAt = back;
await new Promise((r) => setTimeout(r, 2500));
await shot('phone-b3-after-nc6.png');
console.log(JSON.stringify(out, null, 1));
await fs.writeFile(DIR + 'phone-02.json', JSON.stringify(out, null, 1));
p.close();
