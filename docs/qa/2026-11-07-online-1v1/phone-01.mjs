// 폰(에뮬레이터 크롬)이 초대 링크를 연다: 로딩 시간 · 연결 · 내 색 · 화면 크기 · WebGL.
import { openTab, attach } from './phone-lib.mjs';
import fs from 'node:fs/promises';
const DIR = 'C:/Users/petbl/ego/online-1v1-20261107/';
const code = (await fs.readFile(DIR + 'code.txt', 'utf8')).trim();
const t0 = Date.now();
const tab = await openTab(`https://wildcrown.yonghane.workers.dev/?room=${code}`, code);
await fs.writeFile(DIR + 'phone-tab.json', JSON.stringify(tab));
const p = await attach(tab);
const out = { code };
out.engineMs = await p.waitFor('Boolean(window.wizardChess && window.wizardChess.startOnline)', 180000);
out.readyMs = await p.waitFor(`(() => { const o = document.querySelector('#loading-overlay'); return !o || getComputedStyle(o).pointerEvents === 'none' || getComputedStyle(o).display === 'none' || getComputedStyle(o).opacity === '0'; })()`, 240000);
out.connectedMs = await p.waitFor(`/친구 연결됨/.test(document.querySelector('#online-bar')?.innerText || '')`, 60000);
out.totalMs = Date.now() - t0;
out.info = await p.evaluate(`(() => { const s = window.wizardChess.getHandBrainState(); const gl = document.createElement('canvas').getContext('webgl2');
  const bar = document.querySelector('#online-bar')?.getBoundingClientRect();
  return { color: s.playerColor, ply: s.history.length, bar: document.querySelector('#online-bar')?.innerText, vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
    barRect: bar && [Math.round(bar.left), Math.round(bar.top), Math.round(bar.width), Math.round(bar.height)],
    gl: gl ? gl.getParameter(gl.VERSION) : null, ua: navigator.userAgent.slice(0, 60) }; })()`);
console.log(JSON.stringify(out, null, 1));
await fs.writeFile(DIR + 'phone-01.json', JSON.stringify(out, null, 1));
p.close();
