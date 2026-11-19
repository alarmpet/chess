// Rival entrance card (desire plan D4): when a rival walks on, say what it wears — the stages ahead of yours and the
// trinkets you have not got — and what one more win gives. The pieces drop in on the board meanwhile; Skip lands them.
import { useEffect, useState } from 'react';

type Named = { ko?: string; en?: string };
type Show = {
  id: string;
  name: Named | null;
  wins: number;
  next: { id: string; name: Named | null } | null;
  wears: { role: string; stage: string; stageName: Named | null; ahead: boolean; items: { id: string; name: Named | null; owned: boolean }[] }[];
};

const ROLE: Record<string, Named> = {
  king: { ko: '사자 킹', en: 'Lion king' },
  queen: { ko: '호랑이 퀸', en: 'Tiger queen' },
  rook: { ko: '코뿔소 룩', en: 'Rhino rook' },
  bishop: { ko: '판다 비숍', en: 'Panda bishop' },
  knight: { ko: '캥거루 나이트', en: 'Kangaroo knight' },
  pawn: { ko: '미어캣 폰', en: 'Meerkat pawns' }
};
const SHOW_MS = 3500;

export default function RivalEntrance({ lang }: { lang: 'ko' | 'en' }) {
  const [show, setShow] = useState<Show | null>(null);
  const L = (n?: Named | null) => (n ? (lang === 'en' ? n.en || n.ko : n.ko || n.en) || '' : '');
  const en = lang === 'en';

  useEffect(() => {
    let timer = 0;
    const onEnter = (e: Event) => {
      window.clearTimeout(timer);
      setShow((e as CustomEvent).detail || null);
      timer = window.setTimeout(() => setShow(null), SHOW_MS);
    };
    // A new game announces itself before the entrance does, so this only clears a card left from an earlier game.
    const onHide = () => setShow(null);
    window.addEventListener('rivalentrance', onEnter);
    window.addEventListener('gamestarted', onHide);
    window.addEventListener('gamefinished', onHide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('rivalentrance', onEnter);
      window.removeEventListener('gamestarted', onHide);
      window.removeEventListener('gamefinished', onHide);
    };
  }, []);

  if (!show) return null;
  const skip = () => {
    (window as any).wizardChess?.skipEntrance?.();
    setShow(null);
  };
  // Only what the rival has and the player does not: a higher stage or an unowned trinket.
  const rows = show.wears.filter((w) => w.ahead || w.items.some((i) => !i.owned));

  return (
    <div className="rival-entrance" id="rival-entrance" role="status" onClick={() => setShow(null)}>
      <div className="rival-entrance-title">
        ⚔️ {L(show.name)} {en ? 'enters' : '등장'}
        <span className="rival-entrance-wins">{en ? `${show.wins} wins` : `${show.wins}승`}</span>
      </div>
      {rows.length > 0 && (
        <ul className="rival-entrance-list">
          {rows.map((w) => (
            <li key={w.role}>
              <b>{L(ROLE[w.role])}</b>
              {w.ahead && <span className="rival-entrance-stage">✨ {L(w.stageName)}</span>}
              {w.items.filter((i) => !i.owned).map((i) => (
                <span className={`rival-entrance-item${show.next?.id === i.id ? ' next' : ''}`} key={i.id}>
                  {show.next?.id === i.id ? '🎁' : '🔒'} {L(i.name)}
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
      <div className="rival-entrance-next">
        {show.next
          ? en ? `Win and take 🎁 ${L(show.next.name)}` : `이기면 🎁 ${L(show.next.name)}${objectEnding(L(show.next.name))} 가져와요`
          : en ? 'Every trinket already won' : '소품을 모두 얻었어요'}
      </div>
      <button type="button" className="rival-entrance-skip" onClick={(e) => { e.stopPropagation(); skip(); }}>
        {en ? 'Skip' : '건너뛰기'}
      </button>
    </div>
  );
}

// 을/를 by the last syllable's final consonant.
function objectEnding(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return '를';
  return code % 28 ? '을' : '를';
}
