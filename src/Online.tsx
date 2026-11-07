import { useEffect, useRef, useState } from 'react';
import { createMatchCore, newRoomCode, parseRoomCode } from './net/matchCore.js';
import { openRoom, realtimeConfig } from './net/transport.js';

// 친구와 두기 👫 (기획서 §12.1 · 협동 계획서 CO-4 를 앞당김, 2026-11-07 사용자 결정): 아는 사람을 방 코드·초대 링크로 불러 1:1.
// 랜덤 매칭·자유 채팅·카드·도토리 없음. 규칙은 net/matchCore.js, 전송은 net/transport.js(Supabase Realtime 방송, 없으면 같은 브라우저 탭끼리).
// 새로고침해도 주소의 ?room= 과 이 탭에 저장한 자리(id, sessionStorage — 탭마다 따로)로 같은 방에 다시 들어간다. 방장은 판 전체를 저장해 두고 손님에게 다시 준다.
const KEY = 'wildcrown.online.v1';
type Saved = { code: string; id: string; host: boolean; hostColor?: 'w' | 'b'; game?: number; moves?: string[]; ended?: any };
type View = ReturnType<ReturnType<typeof createMatchCore>['view']>;
const wc = () => (window as any).wizardChess;
const readSaved = (): Saved | null => { try { return JSON.parse(window.sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
const writeSaved = (s: Saved | null) => { try { if (s) window.sessionStorage.setItem(KEY, JSON.stringify(s)); else window.sessionStorage.removeItem(KEY); } catch (e) { /* 새로고침 때만 잃는다 */ } };
const newId = () => Math.random().toString(36).slice(2, 10);
const linkOf = (code: string) => `${window.location.origin}${window.location.pathname}?room=${code}`;
const setUrl = (code: string | null) => {
  try { window.history.replaceState({}, '', code ? `?room=${code}` : window.location.pathname); } catch (e) { /* 주소만 안 바뀜 */ }
};
const config = realtimeConfig((import.meta as any).env);

// 엔진이 뜰 때까지 기다린다(처음 열 때 모델을 읽는 동안).
const engineReady = () => new Promise<void>((ok) => {
  const go = () => (wc()?.startOnline ? ok() : window.setTimeout(go, 200));
  go();
});

export default function Online({ open, onOpen, onClose, lang }: { open: boolean; onOpen: () => void; onClose: () => void; lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  const [room, setRoom] = useState<{ code: string; host: boolean } | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [link, setLink] = useState<'idle' | 'open' | 'connecting' | 'closed'>('idle');
  const [pick, setPick] = useState<'w' | 'b' | 'r'>('r');
  const [codeInput, setCodeInput] = useState('');
  const [note, setNote] = useState('');
  const [confirmResign, setConfirmResign] = useState(false);
  const core = useRef<ReturnType<typeof createMatchCore> | null>(null);
  const net = useRef<ReturnType<typeof openRoom> | null>(null);
  const saved = useRef<Saved | null>(null);

  const leave = () => {
    net.current?.close();
    net.current = null;
    core.current = null;
    saved.current = null;
    writeSaved(null);
    setUrl(null);
    setRoom(null);
    setView(null);
    setLink('idle');
    wc()?.endOnline?.();
  };

  const enter = async (s: Saved) => {
    net.current?.close();
    saved.current = s;
    writeSaved(s);
    setUrl(s.code);
    setRoom({ code: s.code, host: s.host });
    setNote('');
    await engineReady();
    const c = createMatchCore({
      id: s.id, host: s.host, hostColor: s.hostColor || 'w',
      send: (msg: any) => net.current?.send(msg),
      apply: (mv: any) => wc()?.applyOnlineMove?.(mv) ?? Promise.resolve(false)
    });
    core.current = c;
    c.onChange((v) => {
      setView(v);
      // 새 판(처음·이어 받기·다시 두기)은 엔진에 한 번에 그린다.
      if (v.reset) {
        const r = c.takeReset();
        if (r) wc()?.startOnline?.({ color: r.color, moves: r.moves });
      }
      const cur = saved.current;
      if (cur && cur.host) {
        saved.current = { ...cur, hostColor: (v.myColor as any) || cur.hostColor, game: v.game, moves: v.moves, ended: v.ended };
        writeSaved(saved.current);
      }
    });
    if (s.host) {
      if (s.moves?.length || (s.game && s.game > 1)) c.restore({ hostColor: s.hostColor || 'w', game: s.game || 1, moves: s.moves || [], ended: s.ended });
      else wc().startOnline({ color: s.hostColor || 'w' });
    }
    setView(c.view());
    net.current = openRoom(s.code, {
      config,
      onMessage: (m: any) => core.current === c && c.receive(m),
      onStatus: (st: any) => { setLink(st); if (st === 'open') c.join(); }
    });
  };

  // 주소에 ?room= 이 있으면 그 방으로: 같은 방에 있던 자리(id)가 저장돼 있으면 그대로, 아니면 손님으로.
  useEffect(() => {
    const code = parseRoomCode(window.location.search);
    if (!code) { if (readSaved()) writeSaved(null); return; }
    const s = readSaved();
    enter(s && s.code === code ? s : { code, id: newId(), host: false });
    return () => { net.current?.close(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 방에 있는 동안 body 에 표시: 혼자 판 장치(손과 뇌 막대·정찰·되감기)를 CSS 로 숨긴다.
  useEffect(() => {
    document.body.classList.toggle('online-game', Boolean(room));
    return () => document.body.classList.remove('online-game');
  }, [room]);

  // 친구가 들어오면 초대 창을 닫는다(판을 가리지 않게).
  const peer = view?.peer;
  useEffect(() => { if (open && peer) onClose(); }, [peer]);   // eslint-disable-line react-hooks/exhaustive-deps

  // 살아 있음·다시 보내기
  useEffect(() => {
    if (!room) return;
    const id = window.setInterval(() => core.current?.tick(), 1500);
    return () => window.clearInterval(id);
  }, [room]);

  // 엔진 → 규칙 층: 내 수, 기권·새 판 버튼
  useEffect(() => {
    const onMove = (e: any) => { core.current?.local(e.detail || {}); };
    const onButton = (e: any) => {
      const kind = e.detail?.kind;
      const v = core.current?.view();
      if (!v) return;
      if (kind === 'resign') { if (!v.ended) setConfirmResign(true); }
      else if (kind === 'new') { if (v.ended) core.current?.rematch(); else onOpen(); }
    };
    window.addEventListener('onlinemove', onMove);
    window.addEventListener('onlinebutton', onButton);
    return () => { window.removeEventListener('onlinemove', onMove); window.removeEventListener('onlinebutton', onButton); };
  }, [onOpen]);

  const create = () => {
    const color = pick === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : pick;
    enter({ code: newRoomCode(), id: newId(), host: true, hostColor: color, game: 1, moves: [] });
  };
  const join = () => {
    const code = parseRoomCode(codeInput);
    if (!code) { setNote(en ? 'Room codes have 6 letters' : '방 코드는 6글자예요'); return; }
    enter({ code, id: newId(), host: false });
    onClose();
  };
  const copy = async () => {
    if (!room) return;
    const url = linkOf(room.code);
    try {
      if ((navigator as any).share) await (navigator as any).share({ title: 'WILD CROWN', text: en ? 'Play chess with me!' : '나랑 체스 한 판 두자!', url });
      else { await navigator.clipboard.writeText(url); setNote(en ? 'Invite link copied' : '초대 링크를 복사했어요'); }
    } catch (e) {
      try { await navigator.clipboard.writeText(url); setNote(en ? 'Invite link copied' : '초대 링크를 복사했어요'); } catch (err) { setNote(url); }
    }
  };

  const me = view?.myColor;
  const colorName = (c: string | null | undefined) => (c === 'w' ? (en ? 'White' : '백') : c === 'b' ? (en ? 'Black' : '흑') : '…');
  const peerText = !view?.peer
    ? (en ? 'Waiting for your friend' : '친구를 기다리는 중')
    : view.peerOnline ? (en ? 'Friend connected' : '친구 연결됨') : (en ? 'Friend disconnected' : '친구 연결 끊김');
  const dot = link !== 'open' ? '⚪' : !view?.peer ? '🟡' : view.peerOnline ? '🟢' : '🟠';
  const endText = (e: any) => {
    if (!e) return '';
    const why: Record<string, string> = en
      ? { checkmate: 'checkmate', resign: 'resignation', stalemate: 'stalemate', repetition: 'repetition', material: 'not enough pieces', fifty: '50-move rule' }
      : { checkmate: '체크메이트', resign: '기권', stalemate: '스테일메이트', repetition: '같은 수 반복', material: '기물 부족', fifty: '50수 규칙' };
    const res = e.result === 'win' ? (en ? 'You win' : '이겼어요') : e.result === 'loss' ? (en ? 'You lose' : '졌어요') : (en ? 'Draw' : '비겼어요');
    return `${res} · ${why[e.reason] || e.reason}`;
  };

  return (
    <>
      {room && (
        <div className="online-bar" id="online-bar" role="status">
          <span className="online-code" title={en ? 'Room code' : '방 코드'}>👫 {room.code}</span>
          <span className="online-peer" id="online-peer">{dot} {view?.full ? (en ? 'Room is full' : '방이 찼어요') : link === 'connecting' ? (en ? 'Connecting…' : '연결 중…') : peerText}</span>
          {me && !view?.ended && (
            <span className="online-turn" id="online-turn">{view?.turn === me ? (en ? `Your move (${colorName(me)})` : `내 차례 (${colorName(me)})`) : (en ? 'Friend’s move' : '친구 차례')}</span>
          )}
          {view?.ended && <b className="online-end" id="online-end">{endText(view.ended)}</b>}
          {view?.ended && (
            <button type="button" className="online-btn primary" id="online-rematch" onClick={() => core.current?.rematch()} disabled={view.rematch === 'me'}>
              {view.rematch === 'peer' ? (en ? '👍 Friend wants a rematch — play' : '👍 친구가 한 판 더! 두기') : view.rematch === 'me' ? (en ? 'Asked…' : '물어봤어요…') : (en ? '🔁 Rematch (swap colors)' : '🔁 한 판 더 (색 바꿔)')}
            </button>
          )}
          {!view?.peer && room.host && <button type="button" className="online-btn" id="online-invite" onClick={copy}>{en ? '🔗 Invite link' : '🔗 초대 링크'}</button>}
          {me && !view?.ended && view?.peer && <button type="button" className="online-btn" id="online-resign" onClick={() => setConfirmResign(true)}>{en ? 'Resign' : '기권'}</button>}
          <button type="button" className="online-btn" id="online-leave" onClick={leave}>{en ? 'Leave' : '나가기'}</button>
          {note && <span className="online-note">{note}</span>}
          {confirmResign && (
            <span className="online-confirm">
              {en ? 'Resign this game?' : '이 판을 기권할까요?'}
              <button type="button" className="online-btn primary" id="online-resign-yes" onClick={() => { core.current?.resign(); setConfirmResign(false); }}>{en ? 'Resign' : '기권'}</button>
              <button type="button" className="online-btn" onClick={() => setConfirmResign(false)}>{en ? 'Keep playing' : '계속 두기'}</button>
            </span>
          )}
        </div>
      )}
      {open && (
        <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
          <div className="panel-card online-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title"><span>👫</span><span>{en ? 'Play a friend' : '친구와 두기'}</span></div>
              <button type="button" className="panel-close" onClick={onClose}>✕</button>
            </div>
            <div className="panel-body">
              {room ? (
                <>
                  <p className="online-rule">{en ? 'Send this link to your friend. The game starts when they open it.' : '이 링크를 친구에게 보내세요. 친구가 열면 바로 시작해요.'}</p>
                  <div className="online-bigcode" id="online-bigcode">{room.code}</div>
                  <div className="online-row">
                    <button type="button" className="online-btn primary" id="online-share" onClick={copy}>{en ? '🔗 Share invite link' : '🔗 초대 링크 보내기'}</button>
                    <button type="button" className="online-btn" onClick={leave}>{en ? 'Leave room' : '방 나가기'}</button>
                  </div>
                  <small className="online-meta">{dot} {peerText}{me ? ` · ${en ? 'You play' : '내 색'} ${colorName(me)}` : ''}{net.current?.kind === 'local' ? (en ? ' · test mode: this browser only' : ' · 시험 모드: 이 브라우저 탭끼리만') : ''}</small>
                </>
              ) : (
                <>
                  <p className="online-rule">{en ? 'Invite someone you know with a link. No strangers, no chat, no cards — just a game.' : '아는 사람을 링크로 불러 1:1 로 둬요. 모르는 사람·채팅·카드 없이 체스만.'}</p>
                  <b className="online-sub">{en ? 'Make a room' : '방 만들기'}</b>
                  <div className="online-row" role="radiogroup" aria-label={en ? 'My color' : '내 색'}>
                    {([['w', en ? '⚪ White' : '⚪ 백'], ['b', en ? '⚫ Black' : '⚫ 흑'], ['r', en ? '🎲 Random' : '🎲 무작위']] as const).map(([k, label]) => (
                      <button key={k} type="button" role="radio" aria-checked={pick === k} id={`online-pick-${k}`} className={`online-btn${pick === k ? ' on' : ''}`} onClick={() => setPick(k)}>{label}</button>
                    ))}
                  </div>
                  <button type="button" className="online-btn primary wide" id="online-create" onClick={create}>{en ? 'Make a room and get a link' : '방 만들고 링크 받기'}</button>
                  <b className="online-sub">{en ? 'Join with a code' : '코드로 들어가기'}</b>
                  <div className="online-row">
                    <input className="online-input" id="online-code-input" value={codeInput} maxLength={64} placeholder={en ? '6-letter code or link' : '6글자 코드 또는 링크'}
                      onChange={(e) => setCodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') join(); }} />
                    <button type="button" className="online-btn primary" id="online-join" onClick={join}>{en ? 'Join' : '들어가기'}</button>
                  </div>
                  {note && <small className="online-note">{note}</small>}
                  {!config && <small className="online-meta">{en ? 'Test mode: no relay server in this build, so only tabs of this browser connect.' : '시험 모드: 이 빌드에 중계 서버 설정이 없어 이 브라우저 탭끼리만 이어져요.'}</small>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
