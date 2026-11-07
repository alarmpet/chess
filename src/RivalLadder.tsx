import { useEffect, useState } from 'react';
import { FIRST_EASY_GAMES, STAGE_NAME, freePlayFor, lossStreak, opponentStage, suggestAfter } from './cards/rivalLadder.js';
import { threatNote } from './cards/threatNote.js';
import { loadCollection, readPlaylog } from './cards/store';

// 라이벌 = 난이도(FN-2): 자유 대국 세기(첫 판들은 쉬움)를 엔진에 알리고, 판이 끝나면 연패·쉬움 승리에 맞춰 다른 라이벌을 묻는다.
// 몰래 바꾸지 않는다 — 첫 판들은 알림으로 「쉬운 상대」라고 쓰고, 라이벌 바꾸기는 사람이 눌러야 한다.
// FN-3: 연습 단계(쉬운 상대)에서는 상대 수가 내려앉을 때 내 호랑이·코뿔소가 새로 위험해지면 한 줄(cards/threatNote.js).
const wc = () => (window as any).wizardChess;
type Offer = { kind: 'easier' | 'harder'; rivalId: string; name: { ko?: string; en?: string } | null; stage: string };

// 받침이 있으면 「과」, 없으면 「와」.
const gwa = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? '과' : '와'; };

const note = (ko: string, en: string, ms = 4200) => window.dispatchEvent(new CustomEvent('gamenote', { detail: { ko, en, ms } }));

export default function RivalLadder({ lang }: { lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const apply = () => {
      const games = loadCollection().games || 0;
      const free = freePlayFor(games);
      wc()?.setFreePlay?.(free);
      return { games, free };
    };
    apply();
    const practice = { gameId: null as number | null, color: 'w', on: false, said: [] as string[] };
    const onStarted = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      setOffer(null);
      const games0 = loadCollection().games || 0;
      const rival = wc()?.getRivalCatalog?.()?.rivals?.find((r: any) => r.id === d.rivalId) || null;
      practice.gameId = d.gameId;
      practice.color = d.color === 'b' ? 'b' : 'w';
      practice.on = d.color !== 'spectator' && opponentStage(games0, rival) === 'easy';
      practice.said = [];
      if (d.resumed) return;
      const { games, free } = apply();
      if (!d.rivalId && free.stage === 'easy') {
        note(`첫 판이라 쉬운 상대예요 (${games + 1}/${FIRST_EASY_GAMES})`, `An easy opponent for your first games (${games + 1}/${FIRST_EASY_GAMES})`);
      }
    };
    const onLanded = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (!practice.on || d.byPlayer || d.gameId !== practice.gameId || !d.move?.after) return;
      const r = threatNote(d.move.after, practice.color, practice.said);
      practice.said = r.said;
      if (r.text) note(r.text.ko, r.text.en, 3200);
    };
    const onFinished = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      // 판 끝 기록(CardLayer)이 먼저 쓰이도록 한 박자 뒤에 읽는다.
      window.setTimeout(() => {
        const cat = wc()?.getRivalCatalog?.();
        if (!cat) return;
        let log: any[] = [];
        try { log = JSON.parse(readPlaylog()); } catch (err) { /* 기록 없음 */ }
        const rival = cat.rivals.find((r: any) => r.id === d.rivalId);
        const stage = rival ? rival.stage || 'normal' : cat.freePlay?.stage || 'normal';
        const s = suggestAfter({ result: d.result, streak: lossStreak(log), stage, rivalId: d.rivalId || null, rivals: cat.rivals });
        if (!s) return;
        const r = cat.rivals.find((x: any) => x.id === s.rivalId);
        setOffer({ ...s, kind: s.kind as Offer['kind'], name: r?.name || null });
      }, 400);
    };
    window.addEventListener('gamestarted', onStarted);
    window.addEventListener('gamefinished', onFinished);
    window.addEventListener('movelanded', onLanded);
    return () => {
      window.removeEventListener('movelanded', onLanded);
      window.removeEventListener('gamestarted', onStarted);
      window.removeEventListener('gamefinished', onFinished);
    };
  }, []);

  if (!offer) return null;
  const name = (en ? offer.name?.en : offer.name?.ko) || offer.rivalId;
  const stage = STAGE_NAME[offer.stage as keyof typeof STAGE_NAME];
  const go = async () => {
    setOffer(null);
    await wc()?.startRival?.(offer.rivalId);
  };
  return (
    <div className="rival-offer" id="rival-offer" role="dialog" aria-live="polite">
      <span>
        {offer.kind === 'easier'
          ? (en ? `Three losses in a row. Try an easier rival, ${name}?` : `세 판 연속 졌어요. 더 쉬운 라이벌 「${name}」${gwa(name)} 둬 볼까요?`)
          : (en ? `You won! Ready for ${name}?` : `이겼어요! 다음 라이벌 「${name}」에 도전할까요?`)}
        <small> · {en ? stage.en : stage.ko}</small>
      </span>
      <button type="button" className="rival-offer-go" id="rival-offer-go" onClick={go}>{offer.kind === 'easier' ? (en ? 'Play them' : '둬 볼래요') : (en ? 'Challenge' : '도전')}</button>
      <button type="button" className="rival-offer-no" id="rival-offer-no" onClick={() => setOffer(null)}>{en ? 'Not now' : '괜찮아요'}</button>
    </div>
  );
}
