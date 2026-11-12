import { useEffect, useState } from 'react';
import { loadPouch } from './cards/store';

type Ask = { kind: 'new' | 'side' | 'resign'; myMoves: number; keepMoves: number; keeps: boolean };
const engine = () => (window as any).wizardChess;

// Asked before leaving a started game: its cards join the album only when the game ends (island economy plan §2).
// The wording leads with how to keep the cards, not with what is lost.
export default function QuitDialog({ lang }: { lang: 'ko' | 'en' }) {
  const [ask, setAsk] = useState<Ask | null>(null);
  const en = lang === 'en';

  useEffect(() => {
    const onAsk = (e: Event) => setAsk((e as CustomEvent).detail);
    window.addEventListener('quitrequest', onAsk);
    return () => window.removeEventListener('quitrequest', onAsk);
  }, []);

  if (!ask) return null;
  const cards = loadPouch()?.cards.length || 0;
  const close = () => setAsk(null);
  const run = (kind: string) => {
    setAsk(null);
    engine()?.quitNow?.(kind);
  };
  const held = cards
    ? (en ? `${cards} card${cards > 1 ? 's' : ''} caught this game` : `이번 판에 잡은 카드 ${cards}장`)
    : (en ? 'No cards caught yet' : '이번 판에 잡은 카드는 아직 없어요');

  let title: string;
  let body: string;
  const buttons: { label: string; kind?: string; main?: boolean }[] = [];
  if (ask.kind === 'resign' && ask.keeps) {
    title = en ? 'Resign this game?' : '기권할까요?';
    body = en ? `It ends as a lost game, and you keep them: ${held}.` : `진 판으로 끝나고, ${held}${cards ? '은 받아요' : ''}.`;
    buttons.push({ label: en ? 'Resign' : '기권하기', kind: 'resign', main: true });
  } else if (ask.kind === 'resign') {
    title = en ? 'Stop this game?' : '이번 판을 그만둘까요?';
    body = en
      ? `After ${ask.keepMoves} of your moves, resigning keeps your cards. You have made ${ask.myMoves}. Stopping now leaves them out (${held}).`
      : `내 수 ${ask.keepMoves}수부터 기권하면 진 판으로 끝나고 카드를 받아요. 지금은 ${ask.myMoves}수예요. 지금 그만두면 들어가지 않아요(${held}).`;
    buttons.push({ label: en ? 'Stop the game' : '그만두기', kind: 'resign' });
  } else {
    // TA-3 (2026-11-04 시험 A): 세 역할 모두 「들어가지 않아요」의 주어를 못 찾았고, 기권이 되는 창인지 제목에서 몰랐다.
    const leaving = ask.kind === 'side' ? (en ? 'Switching sides now' : '지금 진영을 바꾸면') : (en ? 'A new game now' : '지금 새 판을 시작하면');
    title = ask.kind === 'new' && ask.keeps
      ? (en ? 'Resign, or start a new game?' : '기권할까요, 새 판을 시작할까요?')
      : (ask.kind === 'side' ? (en ? 'Switch sides?' : '진영을 바꿀까요?') : (en ? 'Start a new game?' : '새 판을 시작할까요?'));
    body = en
      ? `Finish this game${ask.keeps ? ' or resign' : ''} to keep its cards (${held}). ${cards ? `${leaving} leaves ${cards > 1 ? 'these cards' : 'this card'} out of the album.` : `${leaving} loses no cards.`}`
      : `${ask.keeps ? '끝까지 두거나 기권하면' : '끝까지 두면'} 이번 판 카드를 받아요(${held}). ${cards ? `${leaving} 이 카드 ${cards}장은 도감에 들어가지 않아요.` : `${leaving} 잃는 카드는 없어요.`}`;
    if (ask.kind === 'new' && ask.keeps) buttons.push({ label: en ? 'Resign and keep cards' : '기권하고 카드 받기', kind: 'resign', main: true });
    buttons.push({ label: ask.kind === 'side' ? (en ? 'Switch sides' : '진영 바꾸기') : (en ? 'New game' : '새 판 시작'), kind: ask.kind });
  }
  buttons.push({ label: en ? 'Keep playing' : '계속 두기', main: !buttons.some((b) => b.main) });

  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={close}>
      <div className="panel-card quit-dialog" id="quit-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">
            <span>{ask.kind === 'resign' ? '🏳️' : '🃏'}</span>
            <span>{title}</span>
          </div>
        </div>
        <div className="panel-body">
          <p className="quit-text">{body}</p>
          <div className="quit-actions">
            {buttons.map((b) => (
              <button key={b.label} type="button" className={`quit-btn${b.main ? ' main' : ''}`} data-kind={b.kind || 'stay'} onClick={() => (b.kind ? run(b.kind) : close())}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
