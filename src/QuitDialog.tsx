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
    title = en ? 'Start a new game?' : '새 판을 시작할까요?';
    body = en
      ? `Finish this game${ask.keeps ? ' or resign' : ''} to keep its cards (${held}). A new game now leaves them out.`
      : `${ask.keeps ? '끝까지 두거나 기권하면' : '끝까지 두면'} 이번 판 카드를 받아요(${held}). 지금 새 판을 시작하면 들어가지 않아요.`;
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
