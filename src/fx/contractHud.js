// 계약 HUD (슬롯 체스 계획서 2026-11-11 §3.1 「표시」, SC-1). 세 목표와 양쪽 진도, 남은 차례를 늘 보여 준다.
// 내 진도는 채운 칸(색 + 체크), 상대 진도는 따로 작은 점 — 색만으로 구분하지 않는다.
// 누를 수 없다(pointer-events 없음): 판을 가리지 않고 입력을 가로채지 않는다.
// 세로 화면은 위쪽 하늘 자리에 가로로, 가로 화면은 왼쪽 바다 자리에 세로로 선다.
// 시험 스위치가 켜질 때만 받는 묶음이라 화면 틀(React)이 아니라 여기서 DOM 을 만든다.
// IR-2 왕관 보석: 머리줄은 판 위 두 왕관의 거울이다 — 「내 왕관 ◆◇ · 상대 ◇◇」. 찬 보석은 색과 함께 그 목표의 체스 기호를 적는다.

const NAMES = { p: '미어캣', n: '캥거루', b: '판다', r: '코뿔소', q: '호랑이' };
const GLYPHS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', j: '★' };
// 판 위 보석(src/fx/crownGems.js 의 GEM_COLORS)과 같은 색
const GEM_COLORS = { p: '#ffc233', n: '#35d6b8', b: '#a877ff', r: '#ff7a5c', q: '#ff7ec0', j: '#ffffff' };
const CROWN_SLOTS = 2;

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
#contract-hud .ch-rival { color: #bfe3ff; font-weight: 600; }
#contract-hud .ch-crown { display: inline-flex; align-items: center; gap: 3px; }
#contract-hud .ch-crown.theirs { color: #bfe3ff; font-weight: 600; }
.ch-gem { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; box-sizing: border-box; border: 2px solid #ffd23f; border-radius: 50%;
  font: 10px/1 serif; color: #2b1d10; }
.ch-gem.full { background: var(--gem, #ffd23f); border-color: #fff6c8; }
.ch-gem.new { animation: ch-gem-pop 0.5s ease-out; }
@keyframes ch-gem-pop { 0% { transform: scale(0.2); } 60% { transform: scale(1.5); } 100% { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .ch-gem.new { animation: none; } }
.contract-result .ch-gem { border-color: #d9912b; }
.contract-result .ch-gem.full { border-color: #8a5a00; }
.contract-result .cr-pay { margin-top: 6px; font-size: 0.95rem; font-weight: 900; color: #8a5a00; }
.contract-result .cr-note { margin-top: 6px; font-size: 0.78rem; font-weight: 700; color: #1f5a8a; }
.contract-result .cr-missed { margin-top: 8px; font: inherit; font-size: 0.86rem; font-weight: 800; color: #2b1d10; background: #ffd23f; border: 0; border-radius: 12px; padding: 9px 14px; min-height: 40px; cursor: pointer; pointer-events: auto; }
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
#contract-hud.done { display: none; }
/* 알림 줄(.card-note)이 HUD 머리줄을 덮지 않게: 세로 화면은 위 단추 줄과 HUD 사이로, 가로 화면은 HUD 오른쪽으로 */
body.contract-hud-tall .card-note { top: 50px; }   /* 두 줄 알림(52px)까지 HUD 머리줄(104px) 위에 선다 */
body.contract-hud-wide .card-note { left: 160px; }
/* 끝난 판의 결과 — 종료 배너 안에 들어간다(IR-0). 살아 있는 HUD 는 접는다. */
.contract-result { margin: 0 0 12px; color: #2b1d10; font-family: system-ui, 'Malgun Gothic', sans-serif; }
.contract-result .cr-line { font-size: 0.95rem; font-weight: 800; color: #5a2d0c; line-height: 1.35; word-break: keep-all; }
.contract-result .cr-score { margin: 6px 0; font-size: 0.85rem; font-weight: 700; display: flex; justify-content: center; gap: 14px; }
.contract-result .cr-gems { display: inline-flex; gap: 3px; vertical-align: middle; }
.contract-result .cr-score > span { display: inline-flex; align-items: center; gap: 5px; }
.contract-result .cr-goals { display: flex; justify-content: center; gap: 5px; }
.contract-result .cr-goal { border: 2px solid #d9912b; border-radius: 10px; padding: 3px 4px; font-size: 0.72rem; font-weight: 700; background: #fffdf5; display: flex; flex-direction: column; align-items: center; gap: 1px; flex: 1 1 0; min-width: 0; max-width: 120px; white-space: nowrap; }
.contract-result .cr-goal.mine-done { background: #e3f7d6; border-color: #3f9a3a; }
.contract-result .cr-goal.theirs-done { border-style: dashed; }
/* 메이트 배너의 보조 글자(「백 승리…」)는 같은 말을 색 이름으로 한 번 더 하는 것이라 숨긴다 */
.checkmate-banner:has(#contract-result) .checkmate-subtitle { display: none; }
.contract-result .cr-goal small { font-size: 0.62rem; font-weight: 600; opacity: 0.8; font-variant-numeric: tabular-nums; }
`;

export const HINT_TEXT = '보석 둘로 왕관을 먼저 완성하면 승리! 상대 왕을 제압해도 이겨요.';
export const HINT_SEC = 5;

/** 남은 내 차례 수: 남은 반수 가운데 내가 둘 몫. `turn` 은 지금 둘 색. */
export function turnsLeftFor(pliesLeft, turn, color) {
  return turn === color ? Math.ceil(pliesLeft / 2) : Math.floor(pliesLeft / 2);
}

const goalWord = (g) => `${NAMES[g.type]}${g.count > 1 ? ` ×${g.count}` : ''}`;
// 조커 세트의 첫 칸은 조커 ★ 가 채운 칸이다
const cellWord = (set, g, i) => (set.joker && i === 0 ? '조커 ★' : goalWord(g));
const filled = (set, side) => set.goals.map((g, i) => (side.counts[i] >= g.count ? cellWord(set, g, i) : null)).filter(Boolean).join(' · ');

/**
 * 끝난 까닭 한 문장(IR-0) — 내 쪽에서 본 말로, 실제로 채운 목표를 적는다.
 * `end` = { reason, result('win'|'loss'|'draw'), mine, theirs } · mine/theirs 는 contractProgress 의 한쪽({ counts, done }).
 */
export function resultLine(set, { reason, result, mine, theirs }) {
  // 「0으로 · 1로 · 2로」 — 끝 숫자의 받침에 맞춘다
  const score = `보석 ${mine.done} 대 ${theirs.done}${[0, 3, 6].includes(theirs.done % 10) ? '으' : ''}`;
  if (reason === 'checkmate') return result === 'win' ? '상대 왕을 제압해 이겼어요.' : '내 왕이 제압당했어요.';
  if (reason === 'contract') return result === 'win' ? `${filled(set, mine)} 보석으로 왕관을 먼저 완성했어요.` : `상대가 ${filled(set, theirs)} 보석으로 왕관을 먼저 완성했어요.`;
  if (reason === 'limit') return result === 'win' ? `24차례가 끝났어요. ${score}로 이겼어요.` : result === 'loss' ? `24차례가 끝났어요. ${score}로 졌어요.` : `24차례가 끝났어요. ${score}로 같아 비겼어요.`;
  if (reason === 'resign') return '기권했어요.';
  if (reason === 'kings') return '왕만 남아 비겼어요.';
  if (reason === 'stalemate') return '둘 수 있는 수가 없어 비겼어요.';
  if (reason === 'threefold') return '같은 자리가 세 번 나와 비겼어요.';
  if (reason === 'fifty') return '쉰 수 동안 잡기도 폰 움직임도 없어 비겼어요.';
  return result === 'win' ? '이겼어요.' : result === 'loss' ? '졌어요.' : '비겼어요.';
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
  let ended = null;
  let rivalName = '';

  const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  /** 왕관 자리 둘. `paint(types)` 로 찬 만큼 칠한다 — 색 + 그 목표의 체스 기호. 새로 찬 자리는 한 번 통 튄다. */
  const crownRow = () => {
    const gems = Array.from({ length: CROWN_SLOTS }, () => el('span', 'ch-gem'));
    let had = 0;
    const paint = (types = [], pop = true) => {
      gems.forEach((g, i) => {
        const type = types[i] || null;
        g.classList.toggle('full', Boolean(type));
        g.classList.toggle('new', Boolean(type) && pop && i >= had);
        g.textContent = type ? GLYPHS[type] : '';
        if (type) g.style.setProperty('--gem', GEM_COLORS[type]); else g.style.removeProperty('--gem');
      });
      had = types.length;
    };
    return { gems, paint };
  };
  // 보석 목록이 없으면(모듈을 받기 전) 채운 목표를 세트 순서로 적는다
  const gemTypes = (side, list) => (list ? list.map((g) => g.type) : set.goals.filter((g, i) => side.counts[i] >= g.count).map((g) => g.type)).slice(0, CROWN_SLOTS);
  let myCrown = null;
  let theirCrown = null;

  /** 새 판의 계약을 건다. 목표 칸은 `reveal(i)` 로 하나씩 드러난다(릴이 멈출 때마다). */
  const dropResult = () => { doc.getElementById('contract-result')?.remove(); ended = null; };
  const noteRoom = (wide) => {
    doc.body.classList.toggle('contract-hud-wide', wide === true);
    doc.body.classList.toggle('contract-hud-tall', wide === false);
  };
  /** 화면이 돌면 자리만 바꾼다. */
  function layout(wide) {
    if (!set || ended) return;
    root.classList.toggle('wide', wide);
    root.classList.toggle('tall', !wide);
    noteRoom(wide);
  }

  /**
   * 판이 끝났다: 살아 있는 HUD 를 접고, 종료 배너 안에 까닭 한 문장과 최종 진도를 넣는다.
   * 메이트는 배너가 나중에 뜨고 제 글자를 쓴다 — 그 밖의 종료는 배너의 보조 글자를 비워 같은 말을 두 번 하지 않는다.
   */
  function finish(end) {
    if (!set) return;
    dropResult();
    root.classList.add('done');
    noteRoom(null);
    const box = el('div', 'contract-result');
    box.id = 'contract-result';
    const line = resultLine(set, end);
    const score = el('div', 'cr-score');
    for (const [who, side, color] of [['내 왕관', end.mine, me], ['상대', end.theirs, me === 'w' ? 'b' : 'w']]) {
      const part = el('span', '', who);
      const row = crownRow();
      row.paint(gemTypes(side, end.gems?.[color]), false);
      const box = el('span', 'cr-gems');
      box.append(...row.gems);
      part.appendChild(box);
      score.appendChild(part);
    }
    const goals = el('div', 'cr-goals');
    set.goals.forEach((g, i) => {
      const chip = el('div', 'cr-goal');
      chip.classList.toggle('mine-done', end.mine.counts[i] >= g.count);
      chip.classList.toggle('theirs-done', end.theirs.counts[i] >= g.count);
      chip.append(el('span', '', set.joker && i === 0 ? cellWord(set, g, i) : `${GLYPHS[g.type]} ${goalWord(g)}`), el('small', '', `나 ${end.mine.counts[i]}/${g.count} · 상대 ${end.theirs.counts[i]}/${g.count}`));
      goals.appendChild(chip);
    });
    box.append(el('div', 'cr-line', line), score, goals);
    if (end.coins > 0) { const pay = el('div', 'cr-pay', `${end.jackpot ? '🎰 잭팟 판 2배 · ' : ''}🌰 도토리 +${end.coins}${end.work > 0 ? ` · 🔨 공방 진도 +${end.work}일` : ''}`); pay.id = 'contract-pay'; box.appendChild(pay); }
    if (end.note) box.appendChild(el('div', 'cr-note', end.note));
    // 놓친 왕관(IR-3): 이 판에서 실제로 지나친 결정타가 있을 때만. 누르면 그 국면이 연습으로 열린다.
    if (end.missed) {
      const again = el('button', 'cr-missed', '👑 놓친 왕관 다시 보기');
      again.type = 'button';
      again.addEventListener('click', () => end.missed());
      box.appendChild(again);
    }
    const banner = doc.querySelector('#checkmate-overlay .checkmate-banner');
    const actions = banner?.querySelector('.checkmate-actions');
    if (banner) banner.insertBefore(box, actions || null);
    if (end.reason !== 'checkmate') { const sub = doc.getElementById('checkmate-subtitle'); if (sub) sub.textContent = ''; }
    ended = { line, reason: end.reason, result: end.result, note: end.note || null, missed: Boolean(end.missed) };
  }

  /** 끝난 판이 되살아났다(되돌리기): 결과를 치우고 HUD 를 다시 편다. */
  function resume(wide) {
    dropResult();
    root.classList.remove('done');
    if (set) noteRoom(wide);
  }

  function show(nextSet, myColor, wide, rival = '') {
    dropResult();
    noteRoom(wide);
    set = nextSet;
    me = myColor === 'b' ? 'b' : 'w';
    last = null;
    root.textContent = '';
    root.className = `on ${wide ? 'wide' : 'tall'}`;
    const head = el('div', 'ch-head');
    myCrown = crownRow();
    theirCrown = crownRow();
    const mineEl = el('span', 'ch-crown', '내 왕관');
    mineEl.append(...myCrown.gems);
    // 상대 단계 이름(IR-1)은 상대 왕관 앞에 붙는다: 「입문 상대 ◇◇」
    const theirsEl = el('span', 'ch-crown theirs', rival ? `${rival} 상대` : '상대');
    theirsEl.append(...theirCrown.gems);
    head.append(mineEl, theirsEl, (turnsEl = el('span', 'ch-turns', '')));
    rivalName = rival;
    root.appendChild(head);
    goalEls = set.goals.map((g, i) => {
      const box = el('div', 'ch-goal');
      const rows = el('div', 'ch-rows');
      const mine = el('div', 'ch-row');
      mine.appendChild(el('span', 'ch-who', '나'));
      const pips = Array.from({ length: g.count }, () => mine.appendChild(el('span', 'ch-pip')));
      const theirs = el('div', 'ch-row');
      theirs.appendChild(el('span', 'ch-who', '상대'));
      const dots = Array.from({ length: g.count }, () => theirs.appendChild(el('span', 'ch-dot')));
      rows.append(mine, theirs);
      // 조커 세트의 첫 칸은 조커가 채운 칸이다
      const jokerCell = Boolean(set.joker) && i === 0;
      box.append(el('span', 'ch-glyph', jokerCell ? GLYPHS.j : GLYPHS[g.type]), el('span', 'ch-name', jokerCell ? '조커 ★' : `${NAMES[g.type]} ×${g.count}`), rows);
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
  function hint(seconds = HINT_SEC, text = HINT_TEXT) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintLeft = seconds;
    hintEl.classList.add('on');
  }

  /** 진도와 남은 차례. `progress` 는 contractProgress, `turn` 은 지금 둘 색. */
  function update(progress, pliesLeft, turn, gems = null) {
    if (!set || !progress) return;
    const mine = progress[me];
    const theirs = progress[me === 'w' ? 'b' : 'w'];
    myCrown?.paint(gemTypes(mine, gems?.[me]));
    theirCrown?.paint(gemTypes(theirs, gems?.[me === 'w' ? 'b' : 'w']));
    goalEls.forEach((g, i) => {
      g.pips.forEach((p, k) => { const full = k < mine.counts[i]; p.classList.toggle('full', full); p.textContent = full ? '✓' : ''; });
      g.dots.forEach((d, k) => d.classList.toggle('full', k < theirs.counts[i]));
      g.box.classList.toggle('mine-done', mine.counts[i] >= set.goals[i].count);
      g.box.classList.toggle('theirs-done', theirs.counts[i] >= set.goals[i].count);
    });
    const left = turnsLeftFor(pliesLeft, turn, me);
    turnsEl.textContent = `남은 차례 ${left}`;
    turnsEl.classList.toggle('low', left <= 5);
    last = { mine: mine.counts.slice(), theirs: theirs.counts.slice(), mineDone: mine.done, theirsDone: theirs.done, turnsLeft: left,
      crown: { mine: myCrown.gems.map((g) => g.textContent || null), theirs: theirCrown.gems.map((g) => g.textContent || null) } };
  }

  function tick(dt) {
    if (hintLeft > 0) {
      hintLeft -= dt;
      if (hintLeft <= 0) hintEl?.classList.remove('on');
    }
  }

  function hide() {
    dropResult();
    noteRoom(null);
    set = null;
    last = null;
    hintLeft = 0;
    root.className = '';
    root.textContent = '';
  }

  return {
    show, reveal, hint, update, tick, hide, layout, finish, resume,
    state: () => ({
      ended: ended && { ...ended }, rival: rivalName, resultIn: Boolean(doc.querySelector('#checkmate-overlay .checkmate-banner #contract-result')),
      on: root.classList.contains('on') && !root.classList.contains('done'), layout: root.classList.contains('wide') ? 'wide' : root.classList.contains('tall') ? 'tall' : null,
      shown: goalEls.map((g) => g.box.classList.contains('shown')), hint: Boolean(hintEl?.classList.contains('on')), ...(last || {}),
      rect: (() => { const r = root.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; })()
    })
  };
}
