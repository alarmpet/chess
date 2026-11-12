// 계약 HUD (슬롯 체스 계획서 2026-11-11 §3.1 「표시」, SC-1). 세 목표와 양쪽 진도, 남은 차례를 늘 보여 준다.
// 내 진도는 채운 칸(색 + 체크), 상대 진도는 따로 작은 점 — 색만으로 구분하지 않는다.
// 누를 수 없다(pointer-events 없음): 판을 가리지 않고 입력을 가로채지 않는다.
// 세로 화면은 위쪽 하늘 자리에 가로로, 가로 화면은 왼쪽 바다 자리에 세로로 선다.
// 시험 스위치가 켜질 때만 받는 묶음이라 화면 틀(React)이 아니라 여기서 DOM 을 만든다.

const NAMES = { p: '미어캣', n: '캥거루', b: '판다', r: '코뿔소', q: '호랑이' };
const GLYPHS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

const CSS = `
#contract-hud { position: fixed; z-index: 30; pointer-events: none; display: none; gap: 8px; align-items: stretch;
  font-family: system-ui, 'Malgun Gothic', sans-serif; color: #2b1d10; }
#contract-hud.on { display: flex; }
#contract-hud.wide { left: 14px; top: 50%; transform: translateY(-50%); flex-direction: column; width: 132px; }
#contract-hud.tall { left: 50%; top: 104px; transform: translateX(-50%); flex-direction: row; flex-wrap: wrap; justify-content: center; width: min(96vw, 420px); }
body.cinematic-ui-hidden #contract-hud { display: none; }
#contract-hud .ch-head { background: rgba(20, 30, 44, 0.82); color: #ffe9b0; border-radius: 12px; padding: 5px 10px; font-size: 12px; font-weight: 700;
  display: flex; justify-content: space-between; gap: 8px; align-items: center; }
#contract-hud .ch-head span { white-space: nowrap; }
#contract-hud.wide .ch-head { flex-direction: column; align-items: flex-start; gap: 2px; }
#contract-hud.tall .ch-head { flex: 1 0 100%; }
#contract-hud .ch-turns { color: #fff; font-variant-numeric: tabular-nums; }
#contract-hud .ch-turns.low { color: #ffd166; }
#contract-hud .ch-goal { background: rgba(255, 248, 231, 0.94); border: 2px solid #d9912b; border-radius: 12px; padding: 5px 8px;
  display: grid; grid-template-columns: auto 1fr; column-gap: 6px; align-items: center; opacity: 0.25; transition: opacity 0.25s; }
#contract-hud.tall .ch-goal { flex: 1 1 0; min-width: 0; }
#contract-hud .ch-goal.shown { opacity: 1; }
#contract-hud .ch-goal.mine-done { background: #e3f7d6; border-color: #3f9a3a; }
#contract-hud .ch-goal.theirs-done { border-style: dashed; }
#contract-hud .ch-glyph { font: 26px/1 serif; grid-row: span 2; }
#contract-hud .ch-name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#contract-hud .ch-rows { display: flex; flex-direction: column; gap: 2px; }
#contract-hud .ch-row { display: flex; align-items: center; gap: 3px; font-size: 10px; line-height: 1; }
#contract-hud .ch-who { width: 22px; opacity: 0.75; }
#contract-hud .ch-pip { width: 13px; height: 13px; border-radius: 4px; border: 2px solid #b9770e; box-sizing: border-box; font-size: 9px; line-height: 9px; text-align: center; color: #fff; }
#contract-hud .ch-pip.full { background: #3f9a3a; border-color: #2c7a28; }
#contract-hud .ch-dot { width: 8px; height: 8px; border-radius: 50%; border: 2px solid #8a4b3a; box-sizing: border-box; }
#contract-hud .ch-dot.full { background: #c0482f; border-color: #8f2f1c; }
#contract-hud .ch-hint { background: rgba(20, 30, 44, 0.88); color: #fff; border-radius: 12px; padding: 6px 10px; font-size: 12px; line-height: 1.35; opacity: 0; transition: opacity 0.3s; }
#contract-hud.tall .ch-hint { flex: 1 0 100%; text-align: center; }
#contract-hud .ch-hint.on { opacity: 1; }
`;

export const HINT_TEXT = '목표 둘을 먼저 채우거나 왕을 제압하면 이깁니다';
export const HINT_SEC = 5;

/** 남은 내 차례 수: 남은 반수 가운데 내가 둘 몫. `turn` 은 지금 둘 색. */
export function turnsLeftFor(pliesLeft, turn, color) {
  return turn === color ? Math.ceil(pliesLeft / 2) : Math.floor(pliesLeft / 2);
}

export function createContractHud(doc = document) {
  const style = doc.createElement('style');
  style.textContent = CSS;
  doc.head.appendChild(style);
  const root = doc.createElement('div');
  root.id = 'contract-hud';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-live', 'polite');
  doc.body.appendChild(root);

  let set = null;
  let me = 'w';
  let goalEls = [];
  let turnsEl = null;
  let hintEl = null;
  let hintLeft = 0;
  let last = null;

  const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };

  /** 새 판의 계약을 건다. 목표 칸은 `reveal(i)` 로 하나씩 드러난다(릴이 멈출 때마다). */
  function show(nextSet, myColor, wide) {
    set = nextSet;
    me = myColor === 'b' ? 'b' : 'w';
    last = null;
    root.textContent = '';
    root.className = `on ${wide ? 'wide' : 'tall'}`;
    const head = el('div', 'ch-head');
    head.append(el('span', '', '셋 중 둘을 먼저'), (turnsEl = el('span', 'ch-turns', '')));
    root.appendChild(head);
    goalEls = set.goals.map((g) => {
      const box = el('div', 'ch-goal');
      const rows = el('div', 'ch-rows');
      const mine = el('div', 'ch-row');
      mine.appendChild(el('span', 'ch-who', '나'));
      const pips = Array.from({ length: g.count }, () => mine.appendChild(el('span', 'ch-pip')));
      const theirs = el('div', 'ch-row');
      theirs.appendChild(el('span', 'ch-who', '상대'));
      const dots = Array.from({ length: g.count }, () => theirs.appendChild(el('span', 'ch-dot')));
      rows.append(mine, theirs);
      box.append(el('span', 'ch-glyph', GLYPHS[g.type]), el('span', 'ch-name', `${NAMES[g.type]} ×${g.count}`), rows);
      root.appendChild(box);
      return { box, pips, dots };
    });
    hintEl = el('div', 'ch-hint', HINT_TEXT);
    root.appendChild(hintEl);
  }

  function reveal(i) {
    goalEls[i]?.box.classList.add('shown');
  }

  /** 규칙 한 줄을 잠깐 띄운다(릴이 끝난 뒤 한 번). */
  function hint(seconds = HINT_SEC) {
    if (!hintEl) return;
    hintLeft = seconds;
    hintEl.classList.add('on');
  }

  /** 진도와 남은 차례. `progress` 는 contractProgress, `turn` 은 지금 둘 색. */
  function update(progress, pliesLeft, turn) {
    if (!set || !progress) return;
    const mine = progress[me];
    const theirs = progress[me === 'w' ? 'b' : 'w'];
    goalEls.forEach((g, i) => {
      g.pips.forEach((p, k) => { const full = k < mine.counts[i]; p.classList.toggle('full', full); p.textContent = full ? '✓' : ''; });
      g.dots.forEach((d, k) => d.classList.toggle('full', k < theirs.counts[i]));
      g.box.classList.toggle('mine-done', mine.counts[i] >= set.goals[i].count);
      g.box.classList.toggle('theirs-done', theirs.counts[i] >= set.goals[i].count);
    });
    const left = turnsLeftFor(pliesLeft, turn, me);
    turnsEl.textContent = `남은 차례 ${left}`;
    turnsEl.classList.toggle('low', left <= 5);
    last = { mine: mine.counts.slice(), theirs: theirs.counts.slice(), mineDone: mine.done, theirsDone: theirs.done, turnsLeft: left };
  }

  function tick(dt) {
    if (hintLeft > 0) {
      hintLeft -= dt;
      if (hintLeft <= 0) hintEl?.classList.remove('on');
    }
  }

  function hide() {
    set = null;
    last = null;
    hintLeft = 0;
    root.className = '';
    root.textContent = '';
  }

  return {
    show, reveal, hint, update, tick, hide,
    state: () => ({
      on: root.classList.contains('on'), layout: root.classList.contains('wide') ? 'wide' : root.classList.contains('tall') ? 'tall' : null,
      shown: goalEls.map((g) => g.box.classList.contains('shown')), hint: Boolean(hintEl?.classList.contains('on')), ...(last || {}),
      rect: (() => { const r = root.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; })()
    })
  };
}
