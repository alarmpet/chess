import { useEffect, useRef, useState } from 'react';
import { TYPE_FROM_LETTER } from './rules/referee.js';
import { dayNumber } from './cards/quests.js';
import {
  FAMILY_ACORNS, HB_KINDS, HB_NAMES, adviseKind, familyQuestById, familyStep, movableKinds, refreshFamily, sanitizeFamily, weekOf
} from './cards/handBrain.js';
import { payMissionAcorns } from './village/store';
import { HANDOVER_S, brainSeat, ownMoveIndex } from './cards/teamPlay.js';
import { logGame } from './cards/store';

// 손과 뇌 🤝 (목표 층 OL-4): 한 편을 둘이 둔다. 뇌가 말 종류를 부르고 손이 그 말로 둔다.
// 뇌는 사람(가족·친구) 또는 AI 조언자(자기 최선 수의 말 종류만 알려 줌). 사람이 뇌인 판만 가족 퀘스트를 채운다.
// 둘이 한 왕국(협동 계획서 CO-1): 사람 둘이 🟠·🔵 자리로 앉아 수마다(또는 판마다) 뇌·손을 바꾼다. 부른 종류는 잠기고,
// 뇌가 20초 안 부르면 손에게 넘어간다. 상대 차례에는 「우리 실수 😅」와 두 자리 ✋ — 둘 다 누르면 하이파이브.
// 내부 모드 이름은 저장 호환 때문에 'family' 그대로.
type Mode = 'off' | 'family' | 'adviser';
type Swap = 'move' | 'game';
const MODE_KEY = 'wildcrown.handbrain.v1';
const FAMILY_KEY = 'wildcrown.family.v1';
const SEATS = ['🟠', '🔵'];
const FIVE_MS = 2500;   // 두 자리 ✋ 를 이 안에 누르면 하이파이브

type Saved = { mode: Mode; swap: Swap; games: number };
const readSaved = (): Saved => {
  try {
    const r = JSON.parse(window.localStorage.getItem(MODE_KEY) || 'null') || {};
    return { mode: r.mode === 'family' || r.mode === 'adviser' ? r.mode : 'off', swap: r.swap === 'game' ? 'game' : 'move', games: Number.isInteger(r.games) && r.games >= 0 ? r.games : 0 };
  } catch (e) { return { mode: 'off', swap: 'move', games: 0 }; }
};
const writeSaved = (s: Saved) => { try { window.localStorage.setItem(MODE_KEY, JSON.stringify({ v: 1, ...s })); } catch (e) { /* 다음에 다시 고른다 */ } };
const readMode = (): Mode => readSaved().mode;
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
  const [swap, setSwapState] = useState<Swap>(readSaved().swap);
  const [turn, setTurn] = useState<{ key: string; kinds: string[]; brain: number } | null>(null);
  const [kind, setKind] = useState<string>('');
  const [handover, setHandover] = useState(false);
  const [note, setNote] = useState('');
  const [slaps, setSlaps] = useState<number[]>([0, 0]);
  const [five, setFive] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const swapRef = useRef(swap);
  swapRef.current = swap;
  const noteTimer = useRef(0);
  const handoverTimer = useRef(0);
  const kindRef = useRef('');
  kindRef.current = kind;

  const say = (text: string) => {
    setNote(text);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(''), 2600);
  };
  const setMode = (m: Mode) => {
    setModeState(m);
    writeSaved({ ...readSaved(), mode: m });
    wc()?.setTeamGame?.(m === 'family');
    if (m === 'off') { wc()?.setHandBrain?.(null); setTurn(null); }
  };
  const setSwap = (s: Swap) => { setSwapState(s); writeSaved({ ...readSaved(), swap: s }); };
  const coopLog = (what: string) => {
    const st = wc()?.getHandBrainState?.();
    logGame({ type: 'coop', at: new Date().toISOString(), kind: what, gameId: st?.gameId ?? null, ply: st?.history?.length || 0 });
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
      wc()?.setTeamGame?.(m === 'family');
      if (m === 'off' || !st) { if (last) { last = ''; setTurn(null); } return; }
      const mine = st.ready && st.turn === st.playerColor;
      const key = mine ? `${st.gameId}:${st.fen}:${m}:${swapRef.current}` : `wait:${st.gameId}`;
      if (key === last) return;
      last = key;
      window.clearTimeout(handoverTimer.current);
      setHandover(false);
      setSlaps([0, 0]);
      // 새 차례는 언제나 '' 로 먼저 푼다(종류 잠금은 한 차례 안에서만).
      wc().setHandBrain('');
      if (!mine) { setTurn(null); setKind(''); return; }
      const kinds = movableKinds(st.fen);
      const brain = brainSeat(ownMoveIndex(st.fen), swapRef.current, readSaved().games);
      setTurn({ key, kinds, brain });
      if (m === 'adviser') {
        const k = adviseKind(st.fen, { history: st.history });
        setKind(k || '');
        wc().setHandBrain(k ? TYPE_OF[k] : null);
      } else {
        setKind('');
        // 뇌가 20초 동안 안 부르면 손에게 넘긴다. 시간패는 없다. 인계 횟수만 판 기록에.
        handoverTimer.current = window.setTimeout(() => {
          if (modeRef.current !== 'family' || kindRef.current) return;
          wc()?.setHandBrain?.(null);
          setHandover(true);
          coopLog('handover');
        }, HANDOVER_S * 1000);
      }
    };
    const id = window.setInterval(tick, 400);
    if (modeRef.current !== 'off') tick();
    return () => { window.clearInterval(id); window.clearTimeout(handoverTimer.current); };
  }, []);

  // 판마다 역할 바꾸기: 새 판(이어 하기 아님)마다 판 번호를 올린다.
  useEffect(() => {
    const onStarted = (e: any) => {
      if (modeRef.current !== 'family' || e.detail?.resumed || e.detail?.color === 'spectator') return;
      const s = readSaved();
      writeSaved({ ...s, games: s.games + 1 });
    };
    window.addEventListener('gamestarted', onStarted);
    return () => window.removeEventListener('gamestarted', onStarted);
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

  // 종류 잠금: 한 번 부르면 이 차례에는 바꿀 수 없다(엔진도 거부).
  const call = (k: string) => {
    if (kind || handover) return;
    if (wc()?.setHandBrain?.(TYPE_OF[k]) === false) return;
    window.clearTimeout(handoverTimer.current);
    setKind(k);
  };
  const oops = () => { say(en ? '😅 Our mistake — next move!' : '😅 우리 실수! 다음 수에 만회해요'); coopLog('oops'); };
  // 두 자리 ✋ 를 FIVE_MS 안에 둘 다 누르면 하이파이브. 승패·도토리와 무관.
  const slap = (seat: number) => {
    const now = Date.now();
    const next = [...slaps];
    next[seat] = now;
    if (next[1 - seat] && now - next[1 - seat] <= FIVE_MS) {
      setSlaps([0, 0]);
      setFive(now);
      coopLog('highfive');
      window.setTimeout(() => setFive((f) => (f === now ? 0 : f)), 1600);
      return;
    }
    setSlaps(next);
  };
  const q = familyQuestById(family.id);

  return (
    <>
      {mode !== 'off' && (
        <div className={`handbrain-bar ${mode}`} id="handbrain-bar" role="group" aria-label={en ? 'Hand and brain' : '손과 뇌'}>
          {!turn && mode !== 'family' && <span className="handbrain-wait">{en ? '🤝 Hand and brain — opponent’s turn' : '🤝 손과 뇌 — 상대 차례'}</span>}
          {!turn && mode === 'family' && (
            <>
              <span className="handbrain-wait">{en ? '🤝 Opponent’s turn' : '🤝 상대 차례'}</span>
              <button type="button" className="handbrain-react" id="hb-oops" onClick={oops}>{en ? '😅 Our mistake' : '😅 우리 실수'}</button>
              {SEATS.map((s, i) => (
                <button key={s} type="button" className={`handbrain-react slap${slaps[i] ? ' on' : ''}`} id={`hb-slap-${i}`} onClick={() => slap(i)}
                  title={en ? 'Both tap ✋ for a high five' : '둘 다 ✋ 누르면 하이파이브'}>{s}✋</button>
              ))}
            </>
          )}
          {five > 0 && <span className="handbrain-five" id="hb-five" key={five} aria-live="polite">🙌 {en ? 'High five!' : '하이파이브!'}</span>}
          {turn && mode === 'family' && (
            <>
              <span className="handbrain-lead">
                <span className="handbrain-seats">{SEATS[turn.brain]}🧠 · {SEATS[1 - turn.brain]}✋</span>{' '}
                {handover
                  ? (en ? `⏱ ${SEATS[1 - turn.brain]} Hand, any piece` : `⏱ ${SEATS[1 - turn.brain]} 손이 아무 말이나 둬요`)
                  : kind
                    ? (en ? `${SEATS[1 - turn.brain]} Hand: move a ${name(kind)}` : `${SEATS[1 - turn.brain]} 손: ${ro(kind)} 둬요`)
                    : (en ? `${SEATS[turn.brain]} Brain, name a piece` : `${SEATS[turn.brain]} 뇌가 말을 불러요`)}
              </span>
              <span className="handbrain-kinds">
                {HB_KINDS.map((k) => (
                  <button key={k} type="button" className={`handbrain-kind${kind === k ? ' on' : ''}`} id={`hb-${k}`}
                    disabled={!turn.kinds.includes(k) || handover || (Boolean(kind) && kind !== k)} onClick={() => call(k)} title={name(k)}>
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
                ? 'Two play one side. The brain names a piece kind, the hand moves a piece of that kind. Once named, the kind stays.'
                : '둘이 한 편이 돼요. 뇌가 말 종류를 부르면, 손이 그 말로 둬요. 한 번 부르면 바꿀 수 없어요.'}</p>
              {([
                ['family', '👪', en ? 'Two of us, one kingdom' : '둘이 한 왕국', en ? '🟠 and 🔵 take turns as brain and hand against the AI. Fills the family quest' : '🟠·🔵 둘이 뇌와 손을 번갈아 맡아 AI 와 둬요. 가족 퀘스트가 차요'],
                ['adviser', '🤖', en ? 'AI adviser is the brain' : 'AI 조언자가 뇌', en ? 'The AI names only the piece kind — you find the move' : 'AI 는 말 종류만 알려 줘요. 수는 내가 찾아요'],
                ['off', '✋', en ? 'Play alone' : '혼자 두기', en ? 'Back to the usual game' : '보통 판으로']
              ] as const).map(([m, icon, label, hint]) => (
                <button key={m} type="button" className="settings-row" id={`hb-mode-${m}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
                  <span className="settings-icon">{icon}</span>
                  <span className="settings-text"><b>{label}</b><small>{hint}</small></span>
                  <span className={`settings-switch${mode === m ? ' on' : ''}`}>{mode === m ? '✓' : ''}</span>
                </button>
              ))}
              {mode === 'family' && (
                <div className="handbrain-swap" role="radiogroup" aria-label={en ? 'Swap roles' : '역할 바꾸기'}>
                  <span>{en ? 'Swap brain and hand' : '뇌·손 바꾸기'}</span>
                  {(['move', 'game'] as const).map((s) => (
                    <button key={s} type="button" id={`hb-swap-${s}`} role="radio" aria-checked={swap === s} className={swap === s ? 'on' : ''} onClick={() => setSwap(s)}>
                      {s === 'move' ? (en ? 'Every move' : '수마다') : (en ? 'Every game' : '판마다')}
                    </button>
                  ))}
                </div>
              )}
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
