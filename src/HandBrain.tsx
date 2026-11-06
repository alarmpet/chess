import { useEffect, useRef, useState } from 'react';
import { TYPE_FROM_LETTER } from './rules/referee.js';
import { dayNumber } from './cards/quests.js';
import {
  FAMILY_ACORNS, HB_KINDS, HB_NAMES, adviseKind, familyQuestById, familyStep, movableKinds, refreshFamily, sanitizeFamily, weekOf
} from './cards/handBrain.js';
import { payMissionAcorns } from './village/store';

// 손과 뇌 🤝 (목표 층 OL-4): 한 편을 둘이 둔다. 뇌가 말 종류를 부르고 손이 그 말로 둔다.
// 뇌는 사람(가족·친구) 또는 AI 조언자(자기 최선 수의 말 종류만 알려 줌). 사람이 뇌인 판만 가족 퀘스트를 채운다.
type Mode = 'off' | 'family' | 'adviser';
const MODE_KEY = 'wildcrown.handbrain.v1';
const FAMILY_KEY = 'wildcrown.family.v1';

const readMode = (): Mode => {
  try { const m = JSON.parse(window.localStorage.getItem(MODE_KEY) || 'null')?.mode; return m === 'family' || m === 'adviser' ? m : 'off'; } catch (e) { return 'off'; }
};
const writeMode = (mode: Mode) => { try { window.localStorage.setItem(MODE_KEY, JSON.stringify({ v: 1, mode })); } catch (e) { /* 다음에 다시 고른다 */ } };
const thisWeek = () => weekOf(dayNumber());
const readFamily = () => {
  let raw = null;
  try { raw = JSON.parse(window.localStorage.getItem(FAMILY_KEY) || 'null'); } catch (e) { /* 새 주 */ }
  return refreshFamily(sanitizeFamily(raw), thisWeek());
};
const writeFamily = (s: any) => { try { window.localStorage.setItem(FAMILY_KEY, JSON.stringify(s)); } catch (e) { /* 이번 주만 잃는다 */ } };
const wc = () => (window as any).wizardChess;
const NAMES = HB_NAMES as Record<string, { ko: string; en: string; icon: string }>;
const TYPE_OF = TYPE_FROM_LETTER as Record<string, string>;

export default function HandBrain({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  const [mode, setModeState] = useState<Mode>(readMode());
  const [family, setFamily] = useState<any>(readFamily());
  const [turn, setTurn] = useState<{ key: string; kinds: string[] } | null>(null);
  const [kind, setKind] = useState<string>('');
  const [note, setNote] = useState('');
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const noteTimer = useRef(0);

  const say = (text: string) => {
    setNote(text);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(''), 2600);
  };
  const setMode = (m: Mode) => {
    setModeState(m);
    writeMode(m);
    if (m === 'off') { wc()?.setHandBrain?.(null); setTurn(null); }
  };
  const name = (k: string) => (en ? NAMES[k].en : NAMES[k].ko);
  // 「미어캣으로」 「캥거루로」: 받침이 있으면(ㄹ 빼고) 「으로」.
  const ro = (k: string) => {
    const w = NAMES[k].ko;
    const code = w.charCodeAt(w.length - 1) - 0xac00;
    const jong = code >= 0 && code < 11172 ? code % 28 : 0;
    return `${w}${jong && jong !== 8 ? '으로' : '로'}`;
  };

  // 차례가 바뀌는 것을 0.4초마다 읽는다(수 착지·되돌리기·이어 하기·새 판을 한 곳에서).
  useEffect(() => {
    let last = '';
    const tick = () => {
      const m = modeRef.current;
      const st = wc()?.getHandBrainState?.();
      if (m === 'off' || !st) { if (last) { last = ''; setTurn(null); } return; }
      const mine = st.ready && st.turn === st.playerColor;
      const key = mine ? `${st.gameId}:${st.fen}:${m}` : `wait:${st.gameId}`;
      if (key === last) return;
      last = key;
      if (!mine) { wc().setHandBrain(''); setTurn(null); setKind(''); return; }
      const kinds = movableKinds(st.fen);
      setTurn({ key, kinds });
      if (m === 'adviser') {
        const k = adviseKind(st.fen, { history: st.history });
        setKind(k || '');
        wc().setHandBrain(k ? TYPE_OF[k] : null);
      } else {
        setKind('');
        wc().setHandBrain('');
      }
    };
    const id = window.setInterval(tick, 400);
    if (modeRef.current !== 'off') tick();
    return () => window.clearInterval(id);
  }, []);

  // 가족 퀘스트: 사람이 뇌인 판의 내 수와 판 끝만 센다.
  useEffect(() => {
    const feed = (event: any) => {
      if (modeRef.current !== 'family') return;
      const before = readFamily();
      const { state, finished } = familyStep(before, event);
      if (state === before) return;
      writeFamily(state);
      setFamily(state);
      if (finished) {
        payMissionAcorns(FAMILY_ACORNS);
        const q = familyQuestById(state.id);
        say(en ? `🤝 Family quest done: ${q.en}! +${FAMILY_ACORNS} acorns` : `🤝 가족 퀘스트 완료: ${q.ko}! 도토리 +${FAMILY_ACORNS}`);
      }
    };
    const onMoved = (e: any) => { if (e.detail?.byPlayer && e.detail.move) feed({ kind: 'move', move: e.detail.move }); };
    const onFinished = (e: any) => feed({ kind: 'end', result: e.detail?.result });
    const onStarted = () => setFamily(readFamily());
    const onBlocked = (e: any) => {
      const want = e.detail?.want;
      const letter = Object.keys(TYPE_OF).find((k) => TYPE_OF[k] === want);
      if (!letter) say(en ? '🧠 The brain names a piece first' : '🧠 뇌가 먼저 말을 불러요');
      else say(en ? `✋ Only a ${name(letter)} this turn` : `✋ 이번엔 ${name(letter)}만 움직여요`);
    };
    window.addEventListener('movelanded', onMoved);
    window.addEventListener('gamefinished', onFinished);
    window.addEventListener('gamestarted', onStarted);
    window.addEventListener('handbrainblocked', onBlocked);
    return () => {
      window.removeEventListener('movelanded', onMoved);
      window.removeEventListener('gamefinished', onFinished);
      window.removeEventListener('gamestarted', onStarted);
      window.removeEventListener('handbrainblocked', onBlocked);
    };
  }, [en]);

  const call = (k: string) => {
    setKind(k);
    wc()?.setHandBrain?.(TYPE_OF[k]);
  };
  const q = familyQuestById(family.id);

  return (
    <>
      {mode !== 'off' && (
        <div className={`handbrain-bar ${mode}`} id="handbrain-bar" role="group" aria-label={en ? 'Hand and brain' : '손과 뇌'}>
          {!turn && <span className="handbrain-wait">{en ? '🤝 Hand and brain — opponent’s turn' : '🤝 손과 뇌 — 상대 차례'}</span>}
          {turn && mode === 'family' && (
            <>
              <span className="handbrain-lead">{kind ? (en ? `✋ Hand: move a ${name(kind)}` : `✋ 손: ${ro(kind)} 둬요`) : (en ? '🧠 Brain, name a piece' : '🧠 뇌가 말을 불러요')}</span>
              <span className="handbrain-kinds">
                {HB_KINDS.map((k) => (
                  <button key={k} type="button" className={`handbrain-kind${kind === k ? ' on' : ''}`} id={`hb-${k}`}
                    disabled={!turn.kinds.includes(k)} onClick={() => call(k)} title={name(k)}>
                    <span aria-hidden="true">{NAMES[k].icon}</span><small>{name(k)}</small>
                  </button>
                ))}
              </span>
            </>
          )}
          {turn && mode === 'adviser' && (
            <span className="handbrain-lead">{kind ? (en ? `🤖 Adviser: try a ${name(kind)}` : `🤖 조언자: ${ro(kind)} 둬 봐요`) : '🤖 …'}</span>
          )}
          {note && <span className="handbrain-note" id="handbrain-note">{note}</span>}
        </div>
      )}
      {open && (
        <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
          <div className="panel-card handbrain-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title"><span>🤝</span><span>{en ? 'Hand and brain' : '손과 뇌'}</span></div>
              <button type="button" className="panel-close" onClick={onClose}>✕</button>
            </div>
            <div className="panel-body">
              <p className="handbrain-rule">{en
                ? 'Two play one side. The brain names a piece kind, the hand moves a piece of that kind.'
                : '둘이 한 편이 돼요. 뇌가 말 종류를 부르면, 손이 그 말로 둬요.'}</p>
              {([
                ['family', '👪', en ? 'Family or friend is the brain' : '가족·친구가 뇌', en ? 'Grown-up names the piece, child moves it. Fills the family quest' : '어른이 말을 부르고 아이가 둬요. 가족 퀘스트가 차요'],
                ['adviser', '🤖', en ? 'AI adviser is the brain' : 'AI 조언자가 뇌', en ? 'The AI names only the piece kind — you find the move' : 'AI 는 말 종류만 알려 줘요. 수는 내가 찾아요'],
                ['off', '✋', en ? 'Play alone' : '혼자 두기', en ? 'Back to the usual game' : '보통 판으로']
              ] as const).map(([m, icon, label, hint]) => (
                <button key={m} type="button" className="settings-row" id={`hb-mode-${m}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
                  <span className="settings-icon">{icon}</span>
                  <span className="settings-text"><b>{label}</b><small>{hint}</small></span>
                  <span className={`settings-switch${mode === m ? ' on' : ''}`}>{mode === m ? '✓' : ''}</span>
                </button>
              ))}
              <div className={`card-quest handbrain-family${family.done ? ' done' : ''}`} id="hb-family">
                <b>🤝 {en ? 'Family quest this week' : '이번 주 가족 퀘스트'}: {en ? q.en : q.ko}</b>
                <small>{family.done ? (en ? `Done — +${FAMILY_ACORNS} acorns` : `완료 — 도토리 +${FAMILY_ACORNS}`) : `${family.have}/${q.need} · ${en ? `+${FAMILY_ACORNS} acorns` : `도토리 +${FAMILY_ACORNS}`}`}</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
