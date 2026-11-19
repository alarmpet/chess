// 왕관 슬롯머신 (2026-11-18, 사용자 결정: 「진짜 기계 · 내가 레버를 당긴다 · 돌고 · 터지고 · 크게」).
// 판을 열면 화면 가운데에 기계가 내려와 기다린다. 레버(또는 큰 단추)를 당기면 창 세 칸의 동물 그림 띠가 돌다가
// 「쿵 · 쿵 · … 쾅」 하나씩 감속해 멈추며 이번 판의 표적 셋을 공개하고, 마지막에 전구·동전이 터진 뒤 HUD 쪽으로 빠진다.
// 연출만 한다: 계약은 이미 정해져 있다(src/rules/contractSets.js `pickContract`). 당기는 것은 「언제」만 정한다.
// 도는 동안 아무 데나 누르면 바로 멈춘다(건너뛰기). 결과는 같다.
// 전부 DOM 이라 드로우콜을 쓰지 않는다. 그림은 카드 그림(packs/legend/cards/<동물>_0.webp)의 가운데를 잘라 쓴다.
// 늦게 받는 묶음이라 화면 틀(React)이 아니라 여기서 DOM 과 CSS 를 만든다(contractHud.js 와 같은 방식).

export const SLOT_SPEED = 13;                 // 초당 그림 수(가장 빠를 때)
export const SLOT_STOPS = [1.3, 2.1, 3.3];    // 당긴 뒤 각 릴이 멈추는 때 — 셋째는 뜸을 들인다
export const SLOT_DECEL = [0.55, 0.65, 1.25]; // 멈추기 전 감속 구간
export const SLOT_HOLD = 1.9;                 // 마지막 멈춤 뒤 결과를 보여 주는 시간
export const SLOT_HOLD_SKIPPED = 0.9;
export const SLOT_LEAVE = 0.5;                // 기계가 빠지는 시간
export const SLOT_TOTAL = SLOT_STOPS[2] + SLOT_HOLD + SLOT_LEAVE;
export const SLOT_ORDER = ['p', 'n', 'b', 'r', 'q'];
// 잭팟(세 칸이 다 같은 말): 둘이 맞은 뒤 셋째 릴이 더 오래 끈다
export const SLOT_JACKPOT_EXTRA = 0.9;
export const SLOT_JACKPOT_DECEL = 2.0;
export const slotIsJackpot = (goals) => goals.length === 3 && goals.every((g) => g.type === goals[0].type);

/** 릴 i 가 멈출 자리까지 남은 그림 수. 등속으로 돌다가 감속 구간에서 속도가 0 까지 줄어 정확히 0 에 닿는다. */
export function slotRemaining(i, t, stops = SLOT_STOPS, decel = SLOT_DECEL) {
  const ts = stops[i];
  const d = Math.max(0.01, decel[i]);
  if (t >= ts) return 0;
  if (t >= ts - d) return SLOT_SPEED * (ts - t) ** 2 / (2 * d);
  return SLOT_SPEED * (ts - d - t) + SLOT_SPEED * d / 2;
}
/** 멈춘 직후의 되튐(그림 수 단위): 살짝 지나쳤다가 돌아온다. */
export const slotBounce = (u) => (u <= 0 || u >= 0.45 ? 0 : 0.16 * Math.exp(-u * 9) * Math.sin(u * 26));
/** 멈출 그림의 띠 위 자리: 큰 정수이고 SLOT_ORDER 에서 그 종류를 가리킨다. */
export const slotTarget = (type) => 40 + Math.max(0, SLOT_ORDER.indexOf(type));

const NAMES = { p: '미어캣', n: '캥거루', b: '판다', r: '코뿔소', q: '호랑이' };
const ANIMALS = { p: 'meerkat', n: 'kangaroo', b: 'panda', r: 'rhino', q: 'tiger' };
const GLYPHS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };
// 판 위 보석 · HUD 와 같은 색(src/fx/crownGems.js)
const GEM_COLORS = { p: '#ffc233', n: '#35d6b8', b: '#a877ff', r: '#ff7a5c', q: '#ff7ec0' };
const TILES = 15;
const CENTER = 9;
const BULBS = 13;

const CSS = `
#slot-machine { position: fixed; inset: 0; z-index: 45; display: none; align-items: center; justify-content: center; overflow: hidden;
  background: radial-gradient(circle at 50% 46%, rgba(14, 26, 58, 0.3), rgba(5, 9, 24, 0.82)); touch-action: manipulation; user-select: none; -webkit-user-select: none; }
#slot-machine.on { display: flex; }
#slot-machine .sm-rays { position: absolute; left: 50%; top: 46%; width: 170vmax; height: 170vmax; margin: -85vmax 0 0 -85vmax; pointer-events: none; opacity: 0.5;
  background: repeating-conic-gradient(from 0deg, rgba(255, 221, 120, 0.16) 0deg 9deg, rgba(255, 221, 120, 0) 9deg 22deg); animation: sm-spin 26s linear infinite; }
#slot-machine.win .sm-rays { opacity: 1; animation-duration: 5s; }
#slot-machine .sm-cab { --w: min(540px, 78vw, 70vh); position: relative; width: var(--w); font-size: calc(var(--w) / 27); transform: translateX(-1.5em);
  font-family: inherit; color: #3b2408; animation: sm-drop 0.5s cubic-bezier(0.2, 1.5, 0.4, 1) both; }
#slot-machine.shake .sm-cab { animation: sm-shake 0.55s linear both; }
#slot-machine.leave .sm-cab { transition: transform ${SLOT_LEAVE}s cubic-bezier(0.5, 0, 0.9, 0.4), opacity ${SLOT_LEAVE}s ease-in; transform: translate(var(--lx, -40vw), var(--ly, 0)) scale(0.12); opacity: 0; animation: none; }
#slot-machine.leave { transition: background-color ${SLOT_LEAVE}s; background: rgba(5, 9, 24, 0); }
#slot-machine.leave .sm-rays { opacity: 0; transition: opacity 0.3s; }

#slot-machine .sm-crown { position: absolute; left: 50%; top: -2.1em; transform: translateX(-50%); font-size: 2.6em; line-height: 1; filter: drop-shadow(0 0.08em 0.1em rgba(0, 0, 0, 0.5)); animation: sm-bob 1.6s ease-in-out infinite; z-index: 3; }
#slot-machine .sm-sign { position: relative; z-index: 2; margin: 0 1.4em; padding: 0.75em 0 0.6em; text-align: center; border: 0.28em solid #ffcf5a; border-radius: 3.2em 3.2em 0.7em 0.7em;
  background: linear-gradient(#1e6fa8, #0d3d73 60%, #0a2a56); box-shadow: 0 0.3em 0.8em rgba(0, 0, 0, 0.45), inset 0 0.25em 0.5em rgba(255, 255, 255, 0.25); }
#slot-machine .sm-brand { font-size: 0.82em; font-weight: 800; letter-spacing: 0.42em; color: #ffe27a; margin-right: -0.42em; }
#slot-machine .sm-title { font-size: 2.15em; font-weight: 900; line-height: 1.1; letter-spacing: 0.06em; color: #fff3c4; text-shadow: 0 0.06em 0 #b8731a, 0 0.12em 0 #7a4208, 0 0 0.5em rgba(255, 210, 90, 0.75); }
#slot-machine .sm-shell { position: absolute; top: 50%; font-size: 2em; transform: translateY(-50%); filter: drop-shadow(0 0.06em 0.08em rgba(0, 0, 0, 0.5)); }
#slot-machine .sm-shell.l { left: 0.55em; transform: translateY(-50%) scaleX(-1); }
#slot-machine .sm-shell.r { right: 0.55em; }
#slot-machine .sm-bulbs { position: absolute; left: 1.6em; right: 1.6em; display: flex; justify-content: space-between; pointer-events: none; }
#slot-machine .sm-bulbs.top { top: -0.36em; padding: 0 1.2em; }
#slot-machine .sm-bulbs.bot { bottom: -0.36em; }
#slot-machine .sm-bulbs i { width: 0.6em; height: 0.6em; border-radius: 50%; background: #7a5a1c; box-shadow: inset 0 -0.08em 0.1em rgba(0, 0, 0, 0.4); animation: sm-bulb 1.04s steps(1) infinite; }
#slot-machine.spin .sm-bulbs i { animation-duration: 0.39s; }
#slot-machine.win .sm-bulbs i { animation: sm-bulb-win 0.22s steps(1) infinite; }

#slot-machine .sm-body { position: relative; margin-top: -0.35em; padding: 1.25em 1.2em 1.1em; border: 0.3em solid #ffcf5a; border-radius: 1.2em 1.2em 1.9em 1.9em;
  background: linear-gradient(#ff7a62, #e23a45 48%, #a3142e); box-shadow: 0 1.2em 2.4em rgba(0, 0, 0, 0.55), inset 0 0.3em 0.6em rgba(255, 255, 255, 0.35), inset 0 -0.6em 1em rgba(60, 0, 20, 0.45); }
#slot-machine .sm-msg { box-sizing: content-box; height: 1.5em; white-space: nowrap; overflow: hidden; margin-bottom: 0.75em; padding: 0.42em 0.5em; border-radius: 0.55em; text-align: center; font-size: 1.02em; font-weight: 800; line-height: 1.5;
  color: #ffe27a; background: #1a1030; box-shadow: inset 0 0.12em 0.35em rgba(0, 0, 0, 0.8), 0 0.06em 0 rgba(255, 255, 255, 0.25); text-shadow: 0 0 0.45em rgba(255, 200, 80, 0.8); }
#slot-machine.win .sm-msg { animation: sm-blink 0.44s steps(1) 4; }
#slot-machine .sm-jack { position: absolute; left: 50%; top: 42%; z-index: 6; transform: translate(-50%, -50%) rotate(-7deg) scale(0); white-space: nowrap; pointer-events: none; font-size: 4.3em; font-weight: 900; letter-spacing: 0.04em; color: #fff7c4;
  text-shadow: 0 0.05em 0 #ff3b6b, 0 0.1em 0 #b0123c, 0 0 0.35em #ffd24a, 0 0 0.8em #ff7ec0; }
#slot-machine.jackpot .sm-jack { animation: sm-jack 1.5s cubic-bezier(0.2, 1.6, 0.4, 1) both; }
#slot-machine.jackpot .sm-sign { animation: sm-rainbow 0.7s linear infinite; }
#slot-machine.jackpot .sm-rays { background: repeating-conic-gradient(from 0deg, rgba(255, 126, 192, 0.3) 0deg 8deg, rgba(255, 221, 120, 0.28) 8deg 16deg, rgba(53, 214, 184, 0.24) 16deg 24deg, rgba(255, 255, 255, 0) 24deg 30deg); animation-duration: 3s; }
@keyframes sm-jack { 0% { transform: translate(-50%, -50%) rotate(-7deg) scale(0); } 30% { transform: translate(-50%, -50%) rotate(-7deg) scale(1.15); } 80% { transform: translate(-50%, -50%) rotate(-7deg) scale(1); opacity: 1; } 100% { transform: translate(-50%, -62%) rotate(-7deg) scale(1); opacity: 0; } }
@keyframes sm-rainbow { 0% { box-shadow: 0 0 1.4em 0.3em #ff7ec0; } 33% { box-shadow: 0 0 1.4em 0.3em #ffd24a; } 66% { box-shadow: 0 0 1.4em 0.3em #35d6b8; } 100% { box-shadow: 0 0 1.4em 0.3em #ff7ec0; } }
#slot-machine .sm-windows { position: relative; display: flex; gap: 0.7em; padding: 0.7em; border: 0.24em solid #ffcf5a; border-radius: 1em;
  background: linear-gradient(#3d2a16, #150d06); box-shadow: inset 0 0.3em 0.7em rgba(0, 0, 0, 0.8); }
#slot-machine .sm-reel { --gem: #ffcf5a; position: relative; flex: 1; aspect-ratio: 1 / 1.5; overflow: hidden; border-radius: 0.6em; background: #fff7e3; box-shadow: 0 0 0 0.12em #7a4a12; }
#slot-machine .sm-strip { position: absolute; left: 0; right: 0; top: 0; will-change: transform; }
#slot-machine .sm-reel.fast .sm-strip { filter: blur(0.13em); }
#slot-machine .sm-tile { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
#slot-machine .sm-face { position: relative; width: 84%; aspect-ratio: 1; border-radius: 20%; background-color: #cfeaff; box-shadow: 0 0 0 0.14em #c98a2b, 0 0.14em 0.3em rgba(0, 0, 0, 0.35); }
#slot-machine .sm-pic { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; }
/* 카드 그림(400×560)의 가운데 — 나무 틀 안쪽의 동물만 보이게 172% 로 키워 자른다 */
#slot-machine .sm-pic img { position: absolute; left: -36%; top: -50.7%; width: 172%; height: auto; max-width: none; pointer-events: none; }
#slot-machine .sm-glyph { position: absolute; right: -0.25em; bottom: -0.25em; width: 1.55em; height: 1.55em; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.95em; line-height: 1; color: #fff; background: #2b1d10; box-shadow: 0 0 0 0.1em #ffcf5a; }
#slot-machine .sm-shade { position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: linear-gradient(rgba(30, 14, 0, 0.72), rgba(30, 14, 0, 0) 26%, rgba(255, 255, 255, 0.16) 50%, rgba(30, 14, 0, 0) 74%, rgba(30, 14, 0, 0.72)); box-shadow: inset 0 0 0 0.16em rgba(0, 0, 0, 0.25); }
#slot-machine .sm-reel.stopped { box-shadow: 0 0 0 0.16em var(--gem), 0 0 1.2em var(--gem); }
#slot-machine .sm-reel.stopped .sm-shade { animation: sm-flash 0.5s ease-out both; }
#slot-machine .sm-count { position: absolute; right: 0.18em; top: 0.1em; font-size: 2em; font-weight: 900; line-height: 1; color: #fff; opacity: 0; transform: scale(0.2);
  text-shadow: 0 0 0.12em #2b1d10, 0 0.06em 0 #2b1d10, 0 -0.06em 0 #2b1d10, 0.06em 0 0 #2b1d10, -0.06em 0 0 #2b1d10, 0 0 0.5em var(--gem); }
#slot-machine .sm-reel.stopped .sm-count { animation: sm-pop 0.45s cubic-bezier(0.2, 1.8, 0.4, 1) 0.08s both; }
#slot-machine .sm-line { position: absolute; left: 0.1em; right: 0.1em; top: 50%; height: 0; pointer-events: none; }
#slot-machine .sm-line::before, #slot-machine .sm-line::after { content: ''; position: absolute; top: -0.55em; border: 0.55em solid transparent; filter: drop-shadow(0 0 0.25em #ffd24a); }
#slot-machine .sm-line::before { left: -0.1em; border-left-color: #ffd24a; }
#slot-machine .sm-line::after { right: -0.1em; border-right-color: #ffd24a; }
#slot-machine .sm-plates { display: flex; gap: 0.7em; margin: 0.65em 0.94em 0; }
#slot-machine .sm-plate { flex: 1; padding: 0.3em 0; border-radius: 0.5em; text-align: center; font-size: 1.05em; font-weight: 900; white-space: nowrap; color: #6b4a14;
  background: linear-gradient(#ffe9a8, #e2b04a 55%, #b9812a); box-shadow: inset 0 0.1em 0 rgba(255, 255, 255, 0.7), 0 0.1em 0.2em rgba(0, 0, 0, 0.35); }
#slot-machine .sm-plate.on { color: #2b1d10; animation: sm-pop 0.4s cubic-bezier(0.2, 1.8, 0.4, 1) both; }
#slot-machine .sm-base { display: flex; justify-content: center; margin-top: 0.85em; }
#slot-machine .sm-pull { font: inherit; font-size: 1.3em; font-weight: 900; padding: 0.5em 1.7em; border: 0.16em solid #fff3c4; border-radius: 999px; color: #5a2d0c; cursor: pointer;
  background: linear-gradient(#fff0a8, #ffc233 55%, #f08a1c); box-shadow: 0 0.28em 0 #a3550c, 0 0.5em 0.9em rgba(0, 0, 0, 0.4); animation: sm-pulse 0.9s ease-in-out infinite; }
#slot-machine .sm-pull:active { transform: translateY(0.2em); box-shadow: 0 0.08em 0 #a3550c; }
#slot-machine.spin .sm-pull, #slot-machine.done .sm-pull { animation: none; opacity: 0.45; pointer-events: none; }
#slot-machine .sm-tray { position: relative; height: 1.15em; margin: 0.8em 3.2em 0; border-radius: 0.3em 0.3em 0.8em 0.8em; background: linear-gradient(#22090f, #5a1220); box-shadow: inset 0 0.25em 0.5em rgba(0, 0, 0, 0.85), 0 0.08em 0 rgba(255, 255, 255, 0.3); }

#slot-machine .sm-lever { position: absolute; right: -3.5em; top: 7.6em; width: 3.4em; height: 12em; cursor: pointer; }
#slot-machine .sm-socket { position: absolute; left: 0; bottom: 0; width: 2.6em; height: 2.9em; border-radius: 0 0.8em 0.8em 0; background: linear-gradient(90deg, #a36a14, #ffe08a 45%, #b9812a); box-shadow: 0 0.2em 0.5em rgba(0, 0, 0, 0.5); }
#slot-machine .sm-stick { position: absolute; left: 1.05em; bottom: 1.5em; width: 0.62em; height: 8.6em; border-radius: 0.3em; background: linear-gradient(90deg, #8c8c96, #fbfbff 45%, #7c7c88); box-shadow: 0 0.1em 0.3em rgba(0, 0, 0, 0.5); }
#slot-machine .sm-knob { position: absolute; left: 50%; top: -1.5em; width: 2.6em; height: 2.6em; margin-left: -1.3em; border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #ffd0d0, #ff3b4f 38%, #a30f26 78%); box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.5); }
#slot-machine.wait .sm-stick { animation: sm-nudge 1.1s ease-in-out infinite; }
#slot-machine .sm-lever.pulled .sm-stick { animation: sm-lever 0.62s cubic-bezier(0.3, 0, 0.3, 1) both; }
#slot-machine .sm-hint { position: absolute; right: -3.9em; top: 3.4em; width: 4.2em; text-align: center; font-size: 0.95em; font-weight: 900; line-height: 1.2; color: #fff3c4; text-shadow: 0 0.08em 0.2em rgba(0, 0, 0, 0.8); animation: sm-bob 0.9s ease-in-out infinite; pointer-events: none; }
#slot-machine.spin .sm-hint, #slot-machine.done .sm-hint { display: none; }

#slot-machine .sm-fx { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
#slot-machine .sm-coin { position: absolute; width: 1.5em; height: 1.5em; margin: -0.75em 0 0 -0.75em; animation: sm-coin-x var(--dur) linear both; }
#slot-machine .sm-coin i { display: block; width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff6c8, #ffc233 45%, #c47a0c 80%); box-shadow: inset 0 0 0 0.14em #e39a17, 0 0.1em 0.2em rgba(0, 0, 0, 0.35);
  animation: sm-coin-y var(--dur) cubic-bezier(0.25, 0.6, 0.5, 1) both; }
#slot-machine .sm-spark { position: absolute; width: 0.5em; height: 0.5em; margin: -0.25em; border-radius: 50%; background: #fff; box-shadow: 0 0 0.5em 0.18em var(--c, #ffd24a); animation: sm-spark 0.55s ease-out both; }
#slot-machine .sm-burst { position: absolute; left: 50%; top: 45%; width: 4em; height: 4em; margin: -2em; border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 0.95), rgba(255, 220, 110, 0.5) 45%, rgba(255, 220, 110, 0) 70%); animation: sm-burst 0.6s ease-out both; }

@keyframes sm-spin { to { transform: rotate(360deg); } }
@keyframes sm-drop { from { transform: translate(-1.5em, -70vh) rotate(-4deg); } to { transform: translate(-1.5em, 0); } }
@keyframes sm-shake { 0%, 100% { transform: translate(-1.5em, 0); } 12% { transform: translate(-2.1em, 0.35em) rotate(-1.2deg); } 28% { transform: translate(-0.9em, -0.3em) rotate(1.1deg); } 44% { transform: translate(-1.9em, 0.22em) rotate(-0.7deg); } 62% { transform: translate(-1.2em, -0.15em) rotate(0.5deg); } 80% { transform: translate(-1.65em, 0.08em); } }
@keyframes sm-bob { 50% { margin-top: -0.3em; } }
@keyframes sm-bulb { 0% { background: #fff6c0; box-shadow: 0 0 0.55em 0.15em #ffd24a; } 34% { background: #7a5a1c; box-shadow: inset 0 -0.08em 0.1em rgba(0, 0, 0, 0.4); } }
@keyframes sm-bulb-win { 0% { background: #fff; box-shadow: 0 0 0.75em 0.25em #ffe27a; } 50% { background: #ff6b8a; box-shadow: 0 0 0.6em 0.15em #ff3b6b; } }
@keyframes sm-blink { 50% { color: #fff; background: #5a1a6a; } }
@keyframes sm-flash { from { background-color: rgba(255, 255, 255, 0.95); } to { background-color: rgba(255, 255, 255, 0); } }
@keyframes sm-pop { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
@keyframes sm-pulse { 50% { transform: scale(1.07); filter: brightness(1.12); } }
@keyframes sm-nudge { 50% { height: 8em; } }
@keyframes sm-lever { 0% { height: 8.6em; } 38% { height: 2.3em; } 62% { height: 2.3em; } 100% { height: 8.6em; } }
@keyframes sm-coin-x { to { transform: translateX(var(--x)) rotate(var(--r)); } }
@keyframes sm-coin-y { 0% { transform: translateY(0) scale(0.5); } 38% { transform: translateY(var(--up)) scale(1); } 100% { transform: translateY(var(--down)) scale(1); opacity: 0.2; } }
@keyframes sm-spark { from { transform: rotate(var(--a)) translateX(0.5em) scale(1); opacity: 1; } to { transform: rotate(var(--a)) translateX(var(--d)) scale(0.2); opacity: 0; } }
@keyframes sm-burst { from { transform: scale(0.4); opacity: 1; } to { transform: scale(7); opacity: 0; } }
@media (max-aspect-ratio: 1/1) { #slot-machine .sm-cab { --w: min(540px, 76vw, 58vh); } }
@media (prefers-reduced-motion: reduce) {
  #slot-machine .sm-rays, #slot-machine .sm-bulbs i, #slot-machine .sm-crown, #slot-machine .sm-pull, #slot-machine .sm-hint, #slot-machine.wait .sm-stick { animation: none; }
  #slot-machine .sm-cab, #slot-machine.shake .sm-cab { animation: none; }
}
`;

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

/**
 * `sound(name, pitch)` 는 소리(없어도 된다). `artBase` 는 카드 그림 폴더.
 * 돌려주는 것은 예전 소라 릴과 같은 모양(play · skip · update · active · revealing · state)에 pull · waiting · busy · cancel 을 더했다.
 */
export function createSlotMachine({ sound = () => {}, artBase = './packs/legend/cards/' } = {}) {
  if (!document.getElementById('slot-machine-css')) {
    const style = el('style');
    style.id = 'slot-machine-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const art = (type) => `${artBase}${ANIMALS[type]}_0.webp`;
  for (const type of SLOT_ORDER) { const img = new Image(); img.src = art(type); img.decode?.().catch(() => {}); }   // 미리 받아 풀어 둔다

  const root = el('div');
  root.id = 'slot-machine';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', '왕관 슬롯머신 — 이번 판의 표적 셋을 뽑는다');
  const rays = el('div', 'sm-rays');
  const cab = el('div', 'sm-cab');
  const sign = el('div', 'sm-sign');
  const bulbRow = (cls) => { const row = el('div', `sm-bulbs ${cls}`); for (let k = 0; k < BULBS; k++) { const b = el('i'); b.style.animationDelay = `${(k % 3) * -0.13}s`; row.appendChild(b); } return row; };
  sign.append(bulbRow('top'), el('span', 'sm-shell l', '🐚'), el('span', 'sm-shell r', '🐚'), el('div', 'sm-brand', 'WILD CROWN'), el('div', 'sm-title', '왕관 슬롯'), bulbRow('bot'));
  const body = el('div', 'sm-body');
  const msg = el('div', 'sm-msg');
  msg.setAttribute('aria-live', 'polite');
  const windows = el('div', 'sm-windows');
  const reels = [0, 1, 2].map(() => {
    const reel = el('div', 'sm-reel');
    const strip = el('div', 'sm-strip');
    for (let j = 0; j < TILES; j++) {
      const type = SLOT_ORDER[(((CENTER - j) % 5) + 5) % 5];
      const tile = el('div', 'sm-tile');
      tile.dataset.animal = ANIMALS[type];
      const face = el('div', 'sm-face');
      // 배경 그림이 아니라 <img>: 흐림 필터를 켜고 끌 때 다시 그리면서 그림이 한 프레임 비는 일이 없다
      const pic = el('div', 'sm-pic');
      const img = el('img');
      img.decoding = 'sync';
      img.alt = '';
      img.draggable = false;
      img.src = art(type);
      pic.appendChild(img);
      face.append(pic, el('span', 'sm-glyph', GLYPHS[type]));
      tile.appendChild(face);
      strip.appendChild(tile);
    }
    const count = el('div', 'sm-count');
    reel.append(strip, el('div', 'sm-shade'), count);
    windows.appendChild(reel);
    return { reel, strip, count, stopped: false, target: 40, last: -1, w: 0, h: 0 };
  });
  windows.appendChild(el('div', 'sm-line'));
  const plates = el('div', 'sm-plates');
  const plateEls = [0, 1, 2].map(() => { const p = el('div', 'sm-plate', '?'); plates.appendChild(p); return p; });
  const base = el('div', 'sm-base');
  const pullBtn = el('button', 'sm-pull', '🎰 레버 당기기');
  pullBtn.type = 'button';
  pullBtn.id = 'slot-pull';
  base.appendChild(pullBtn);
  const tray = el('div', 'sm-tray');
  body.append(msg, windows, plates, base, tray);
  const lever = el('div', 'sm-lever');
  lever.id = 'slot-lever';
  lever.setAttribute('role', 'button');
  lever.setAttribute('aria-label', '레버 당기기');
  const stick = el('div', 'sm-stick');
  stick.appendChild(el('div', 'sm-knob'));
  lever.append(el('div', 'sm-socket'), stick);
  const hint = el('div', 'sm-hint', '당겨요! ▼');
  const fx = el('div', 'sm-fx');
  const jack = el('div', 'sm-jack', 'JACKPOT!');
  cab.append(el('div', 'sm-crown', '👑'), sign, body, lever, hint, fx, jack);
  root.append(rays, cab);
  document.body.appendChild(root);

  let phase = 'idle';      // idle · wait · spin · done(멈춘 뒤 보여 주는 중) · leave
  let t = 0;
  let goals = [];
  let onStop = null;
  let stops = [...SLOT_STOPS];
  let decel = [...SLOT_DECEL];
  let endAt = SLOT_STOPS[2] + SLOT_HOLD;
  let skipped = false;
  let jackpot = false;
  let joker = false;            // 조커 잭팟: 하나(둘째 칸)만 채우면 왕관 완성
  let plays = 0;
  let pulls = 0;
  let tickAt = 0;
  const still = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const setPhase = (next) => {
    phase = next;
    root.classList.toggle('on', next !== 'idle');
    for (const name of ['wait', 'spin', 'done', 'leave']) root.classList.toggle(name, next === name);
    if (next === 'idle') root.classList.remove('win', 'shake', 'jackpot');
  };

  function sparks(at, n, color, far) {
    const box = fx.getBoundingClientRect();
    const r = at.getBoundingClientRect();
    for (let k = 0; k < n; k++) {
      const s = el('i', 'sm-spark');
      s.style.left = `${r.left + r.width / 2 - box.left}px`;
      s.style.top = `${r.top + r.height / 2 - box.top}px`;
      s.style.setProperty('--a', `${(k / n) * 360 + Math.random() * 20}deg`);
      s.style.setProperty('--d', `${far * (0.7 + Math.random() * 0.6)}em`);
      s.style.setProperty('--c', color);
      fx.appendChild(s);
      setTimeout(() => s.remove(), 700);
    }
  }
  function coins(n) {
    const box = fx.getBoundingClientRect();
    const r = tray.getBoundingClientRect();
    for (let k = 0; k < n; k++) {
      const c = el('span', 'sm-coin');
      c.appendChild(el('i'));
      c.style.left = `${r.left + r.width * (0.2 + Math.random() * 0.6) - box.left}px`;
      c.style.top = `${r.top + r.height / 2 - box.top}px`;
      c.style.setProperty('--x', `${(Math.random() - 0.5) * 30}em`);
      c.style.setProperty('--up', `${-(7 + Math.random() * 13)}em`);
      c.style.setProperty('--down', `${6 + Math.random() * 10}em`);
      c.style.setProperty('--r', `${(Math.random() - 0.5) * 900}deg`);
      c.style.setProperty('--dur', `${0.9 + Math.random() * 0.7}s`);
      c.style.animationDelay = c.firstChild.style.animationDelay = `${Math.random() * 0.35}s`;
      fx.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  }

  // 창과 타일의 크기(소수점까지). 기계가 뜰 때와 화면 크기가 바뀔 때 다시 잰다.
  function measure() {
    for (const r of reels) {
      // 계산된 높이를 쓴다: getBoundingClientRect 는 내려오는 동안의 기울임(변형)에 부풀고, clientWidth 는 정수로 깎인다
      r.w = parseFloat(getComputedStyle(r.strip.firstChild).height) || r.reel.clientWidth;
      r.h = parseFloat(getComputedStyle(r.reel).height) || r.reel.clientHeight;
    }
  }
  window.addEventListener('resize', () => { if (phase !== 'idle') measure(); });

  function draw() {
    for (const [i, r] of reels.entries()) {
      const left = slotRemaining(i, t, stops, decel);
      const pos = r.target - left + (left === 0 ? slotBounce(t - stops[i]) : 0);
      const q = ((pos % 5) + 5) % 5;
      r.strip.style.transform = `translateY(${(r.h - r.w) / 2 - (CENTER - q) * r.w}px)`;
      r.reel.classList.toggle('fast', left > 1.4);
      if (phase !== 'spin') continue;
      // 느려지는 릴은 그림이 넘어갈 때마다 「딸깍」
      const step = Math.floor(pos);
      if (left > 0 && left < 7 && step !== r.last && t - tickAt > 0.05) { tickAt = t; sound('slotTick', 0.9 + Math.min(0.5, left * 0.07)); }
      r.last = step;
      if (left === 0 && !r.stopped) {
        r.stopped = true;
        const goal = goals[i];
        r.reel.style.setProperty('--gem', GEM_COLORS[goal.type] || '#ffcf5a');
        r.reel.classList.add('stopped');
        // 잭팟은 칸마다의 수량 대신 동물 이름만 — 「몇 마리 사냥」은 안내 띠가 말한다
        r.count.textContent = jackpot ? '' : `×${goal.count}`;
        plateEls[i].textContent = jackpot ? NAMES[goal.type] : `${NAMES[goal.type]} ×${goal.count}`;
        plateEls[i].classList.add('on');
        if (!still()) sparks(r.reel, i === 2 ? 18 : 10, GEM_COLORS[goal.type] || '#ffd24a', i === 2 ? 9 : 6);
        if (i === 1) msg.textContent = jackpot ? '같은 말이 둘…! 설마?!' : '두근두근… 마지막 하나!';
        if (onStop) onStop(i, goal);
        if (i === 2) win();
      }
    }
  }

  function win() {
    setPhase('done');
    root.classList.add('win');
    msg.textContent = jackpot ? `🎰 잭팟! ${NAMES[goals[0].type]} ${joker ? goals[1].count : goals[0].count + goals[1].count}마리 사냥 — 보상 2배` : '🎯 표적 확정! 먼저 둘을 잡으면 왕관 완성';
    sound('slotCoins', 1);
    if (jackpot) { root.classList.add('jackpot'); sound('slotCoins', 1.26); endAt += 0.9; }
    if (still()) return;
    root.classList.add('shake');
    fx.appendChild(el('div', 'sm-burst'));
    setTimeout(() => fx.querySelector('.sm-burst')?.remove(), 700);
    coins(jackpot ? 90 : 34);
  }

  /** 기계를 띄우고 레버를 기다린다. `set` 은 계약 세트, `stop(i, goal)` 은 릴이 멈출 때마다 불린다. */
  function play(set, stop = null) {
    goals = set.goals.slice(0, 3);
    onStop = stop;
    jackpot = slotIsJackpot(goals);
    joker = jackpot && Boolean(set.joker);
    stops = [...SLOT_STOPS];
    decel = [...SLOT_DECEL];
    if (jackpot) { stops[2] += SLOT_JACKPOT_EXTRA; decel[2] = SLOT_JACKPOT_DECEL; }
    endAt = stops[2] + SLOT_HOLD;
    skipped = false;
    t = 0;
    plays += 1;
    fx.textContent = '';
    cab.style.removeProperty('--lx');
    cab.style.removeProperty('--ly');
    lever.classList.remove('pulled');
    msg.textContent = '레버를 당겨 이번 판에 잡을 말 셋을 뽑아요!';
    for (const [i, r] of reels.entries()) {
      r.stopped = false;
      r.last = -1;
      r.target = slotTarget(goals[i].type);
      r.reel.classList.remove('stopped', 'fast');
      r.count.textContent = '';
      plateEls[i].textContent = '?';
      plateEls[i].classList.remove('on');
    }
    root.classList.remove('win', 'shake', 'jackpot');
    setPhase('wait');
    measure();
    // 기다리는 동안은 띠가 조금씩 어긋난 채 서 있다
    for (const [i, r] of reels.entries()) {
      r.strip.style.transform = `translateY(${(r.h - r.w) / 2 - (CENTER - ((i * 2 + 1) % 5)) * r.w}px)`;
    }
    try { pullBtn.focus({ preventScroll: true }); } catch (e) { /* 초점을 못 줘도 된다 */ }
    return true;
  }

  /** 레버를 당긴다 — 기다리는 중일 때만. */
  function pull() {
    if (phase !== 'wait') return false;
    pulls += 1;
    t = 0;
    tickAt = 0;
    lever.classList.remove('pulled');
    void lever.offsetWidth;
    lever.classList.add('pulled');
    msg.textContent = '돌아간다…!';
    sound('slotLever', 1);
    setPhase('spin');
    return true;
  }

  /** 도는 중에 누르면: 아직 안 멈춘 릴을 짧은 차이로 지금 멈춘다. 결과는 같다. */
  function skip() {
    if (phase !== 'spin' || skipped) return false;
    skipped = true;
    let k = 0;
    for (const [i, r] of reels.entries()) {
      if (r.stopped) continue;
      decel[i] = 0.12;
      stops[i] = Math.min(stops[i], t + 0.14 + 0.13 * k);
      k += 1;
    }
    endAt = stops[2] + SLOT_HOLD_SKIPPED;
    return true;
  }

  function leave() {
    // HUD 가 있으면 그쪽으로 빨려 든다
    const hud = document.getElementById('contract-hud')?.getBoundingClientRect();
    const me = cab.getBoundingClientRect();
    if (hud && hud.width > 0) {
      cab.style.setProperty('--lx', `${hud.left + hud.width / 2 - (me.left + me.width / 2)}px`);
      cab.style.setProperty('--ly', `${hud.top + hud.height / 2 - (me.top + me.height / 2)}px`);
    }
    setPhase('leave');
  }

  /** 판이 바뀌었다: 아무 일 없이 치운다. */
  function cancel() {
    if (phase === 'idle') return false;
    fx.textContent = '';
    setPhase('idle');
    return true;
  }

  function update(dt) {
    if (phase === 'idle' || phase === 'wait') return;
    t += dt;
    if (phase === 'spin' || phase === 'done') draw();
    if (phase === 'done' && t >= endAt) leave();
    else if (phase === 'leave' && t >= endAt + SLOT_LEAVE) { fx.textContent = ''; setPhase('idle'); }
  }

  const onPull = (e) => { e.preventDefault(); e.stopPropagation(); pull(); };
  pullBtn.addEventListener('click', onPull);
  lever.addEventListener('pointerdown', onPull);
  root.addEventListener('pointerdown', (e) => { if (phase === 'spin') { e.preventDefault(); skip(); } });

  return {
    play, pull, skip, cancel, update,
    /** 레버를 당긴 뒤 기계가 다 빠질 때까지. */
    active: () => phase === 'spin' || phase === 'done' || phase === 'leave',
    waiting: () => phase === 'wait',
    /** 화면에 떠 있는가(기다리는 중 포함). */
    busy: () => phase !== 'idle',
    /** 아직 표적을 다 공개하지 않았는가(건너뛰기가 뜻이 있는 동안). */
    revealing: () => phase === 'spin',
    state: () => ({ active: phase === 'spin' || phase === 'done' || phase === 'leave', waiting: phase === 'wait', phase, t: phase === 'idle' || phase === 'wait' ? null : +t.toFixed(3), skipped, plays, pulls,
      jackpot, stopped: reels.map((r) => r.stopped), goals: goals.map((g) => `${g.type}${g.count}`), layout: 'machine' })
  };
}
