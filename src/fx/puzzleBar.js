// 한 방 퍼즐 줄 (직관성 계획 2026-11-12 §0.2 ④, IR-3). 연습 권유 알약 하나와, 문제를 푸는 동안 화면 아래에 서는 줄 하나.
//   권유: 「1분 연습 — 한 수로 왕관 완성 3문제」 [연습] [✕]  — 첫 판을 열었을 때만, 넘길 수 있다
//   풀이: 「연습 1/3 · 한 수로 왕관을 완성하세요」 [그만]  →  틀리면 귀띔  →  「왕관 완성!」 [다음 문제]
// 연습이라고 늘 적는다(§4 「연습이라고 표시된 국면」). 정식 기록·사다리에는 닿지 않는다 — 그건 엔진이 지킨다.
// 시험 스위치가 켜질 때만 받는 묶음이라 화면 틀(React)이 아니라 여기서 DOM 을 만든다.

const CSS = `
#puzzle-bar, #puzzle-offer { position: fixed; z-index: 31; left: 50%; transform: translateX(-50%); display: none; align-items: center; gap: 10px;
  font-family: system-ui, 'Malgun Gothic', sans-serif; border-radius: 16px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28); box-sizing: border-box; }
#puzzle-bar.on, #puzzle-offer.on { display: flex; }
body.cinematic-ui-hidden #puzzle-bar, body.cinematic-ui-hidden #puzzle-offer { display: none; }
#puzzle-bar { bottom: 86px; width: min(94vw, 460px); padding: 9px 12px; background: rgba(255, 248, 231, 0.97); border: 2px solid #d9912b; color: #2b1d10; }
#puzzle-bar.solved { background: #e3f7d6; border-color: #3f9a3a; }
#puzzle-bar .pb-text { flex: 1 1 auto; min-width: 0; }
#puzzle-bar .pb-tag { font-size: 11px; font-weight: 800; color: #8a5a00; letter-spacing: 0.02em; }
#puzzle-bar.solved .pb-tag { color: #2c7a28; }
#puzzle-bar .pb-line { font-size: 14px; font-weight: 700; line-height: 1.3; }
#puzzle-bar button, #puzzle-offer button { font: inherit; font-size: 13px; font-weight: 800; border-radius: 12px; border: 0; padding: 9px 13px; min-height: 40px; cursor: pointer; white-space: nowrap; }
#puzzle-bar .pb-go { background: #3f9a3a; color: #fff; }
#puzzle-bar .pb-quit { background: transparent; color: #6b4a1e; border: 2px solid #d9b77a; }
#puzzle-offer { bottom: 86px; padding: 7px 8px 7px 13px; background: rgba(20, 30, 44, 0.9); color: #fff; font-size: 13px; font-weight: 700; max-width: 94vw; }
#puzzle-offer span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#puzzle-offer .po-go { background: #ffd23f; color: #2b1d10; }
#puzzle-offer .po-no { background: transparent; color: #cfd8e3; padding: 9px 10px; min-width: 40px; }
@media (min-aspect-ratio: 21/20) { #puzzle-bar, #puzzle-offer { bottom: 18px; } }
`;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

export const PUZZLE_TEXT = {
  offer: '1분 연습 — 한 수로 왕관 완성 3문제',
  ask: '한 수로 내 왕관을 완성하세요',
  wrong: '그 수로는 왕관이 완성되지 않아요. 금빛 왕관이 붙은 말을 잡아 보세요.',
  solved: '왕관 완성! 보석 둘이 모였어요.',
  missedAsk: '여기서 한 수로 이길 수 있었어요. 찾아보세요',
  next: '다음 문제', first: '이제 첫 판!', again: '새 판', quit: '그만', start: '연습', skip: '✕'
};

/** 문제 머리 글자: 「연습 1/3」 · 「놓친 왕관」. */
export function puzzleTag(p) {
  return p.kind === 'missed' ? '놓친 왕관 · 연습' : `연습 ${p.index + 1}/${p.total}`;
}
/** 푼 뒤의 단추 글자. */
export function nextLabel(p) {
  if (p.kind === 'missed') return PUZZLE_TEXT.again;
  return p.index + 1 < p.total ? PUZZLE_TEXT.next : PUZZLE_TEXT.first;
}

export function createPuzzleBar({ onStart, onDismiss, onNext, onQuit }) {
  const doc = document;
  const style = el('style');
  style.textContent = CSS;
  doc.head.appendChild(style);

  const offer = el('div');
  offer.id = 'puzzle-offer';
  const go = el('button', 'po-go', PUZZLE_TEXT.start);
  const no = el('button', 'po-no', PUZZLE_TEXT.skip);
  go.type = no.type = 'button';
  no.setAttribute('aria-label', '연습 넘기기');
  go.addEventListener('click', () => onStart());
  no.addEventListener('click', () => onDismiss());
  offer.append(el('span', '', PUZZLE_TEXT.offer), go, no);

  const bar = el('div');
  bar.id = 'puzzle-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  const tag = el('div', 'pb-tag');
  const line = el('div', 'pb-line');
  const text = el('div', 'pb-text');
  text.append(tag, line);
  const next = el('button', 'pb-go');
  const quit = el('button', 'pb-quit', PUZZLE_TEXT.quit);
  next.type = quit.type = 'button';
  next.addEventListener('click', () => onNext());
  quit.addEventListener('click', () => onQuit());
  bar.append(text, next, quit);
  doc.body.append(offer, bar);

  let now = null;
  return {
    offer() { offer.classList.add('on'); },
    hideOffer() { offer.classList.remove('on'); },
    /** 문제를 연다. `p` 는 { kind: 'practice' | 'missed', index, total }. */
    show(p) {
      now = { ...p, state: 'ask' };
      offer.classList.remove('on');
      bar.className = 'on';
      tag.textContent = puzzleTag(p);
      line.textContent = p.kind === 'missed' ? PUZZLE_TEXT.missedAsk : PUZZLE_TEXT.ask;
      next.style.display = 'none';
      quit.style.display = '';
    },
    wrong() {
      if (!now) return;
      now.state = 'wrong';
      line.textContent = PUZZLE_TEXT.wrong;
    },
    solved() {
      if (!now) return;
      now.state = 'solved';
      bar.classList.add('solved');
      line.textContent = PUZZLE_TEXT.solved;
      next.textContent = nextLabel(now);
      next.style.display = '';
      quit.style.display = 'none';
    },
    hide() { now = null; bar.className = ''; },
    state: () => {
      const r = (now ? bar : offer).getBoundingClientRect();
      return {
        offer: offer.classList.contains('on'), on: bar.classList.contains('on'), state: now ? now.state : null,
        tag: now ? tag.textContent : null, line: now ? line.textContent : null, next: now && next.style.display !== 'none' ? next.textContent : null,
        rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }
      };
    }
  };
}
