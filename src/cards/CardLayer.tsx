import { useEffect, useRef, useState } from 'react';
import { sfx } from '../audio/sfx.js';
import { fxSettings } from '../fx/settings.js';
import CardFace, { ANIMAL_EN, ANIMAL_KO, RARITY_EN, RARITY_KO } from './CardFace';
import {
  ANIMALS, ANIMAL_OF, DROP_TABLE, HERO, HERO_GUARANTEE, MERGE_COST, RARE, RARE_GUARANTEE, RARITIES, UNLOCK_GAMES,
  albumProgress, howToGet, nextGoal, awardCard, buyShelfSlot, cardId, checkCard, commitPouch, consolationCard, convertOverflow, mergeCard, mergeList, newPouch, withPouch,
  seededRoll, shelfPrice, sparesOf, toggleShelf
} from './economy.js';
import { advanceMission, missionChoices } from './missions.js';
import { loadVillage } from '../village/store';
import { clearPouch, loadCollection, loadPouch, logGame, readPlaylog, saveCollection, savePouch } from './store';

// Cards wait out the blow (the 0.55s delay on .card-fly), so they never cover the hit they came from.
const FLY_MS = 1450;
const SHOW_MS = 2050;
const MERGE_MS = 1100;

type Won = { id: string; animal: string; rarity: number; fresh: boolean; check?: boolean };
type Fly = Won & { key: number; x: number; y: number };
type Game = {
  id: number; lastPly: number; won: Won[]; started: number; captures: number;
  mission: any; missionState: string | null; quest: string | null; boost: boolean; scout: number; rewind: number; usedScout: boolean; usedRewind: boolean;
};
const freshGame = (id: number): Game => ({
  id, lastPly: 0, won: [], started: Date.now(), captures: 0,
  mission: null, missionState: null, quest: null, boost: false, scout: 0, rewind: 0, usedScout: false, usedRewind: false
});
const engine = () => (window as any).wizardChess;

// 을/를 by the last syllable's final consonant.
function objectParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 ? '을' : '를';
}

// The end-of-game pouch flips one card at a time and the whole row is done within this many milliseconds.
const REVEAL_MS = 3000;
const REVEAL_MAX = 10;

// Listens to the chess engine, pays cards and shows them. The engine only reports what happened on the board.
export default function CardLayer({ open, onOpen, onClose, lang }: { open: boolean; onOpen: () => void; onClose: () => void; lang: 'ko' | 'en' }) {
  const game = useRef<Game>(freshGame(0));
  const flyKey = useRef(0);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<Won[] | null>(null);
  const [reveal, setReveal] = useState<Won[] | null>(null);
  const [col, setCol] = useState<any>(() => loadCollection());
  const [merged, setMerged] = useState<Won[] | null>(null);
  const [odds, setOdds] = useState(false);
  const [howTo, setHowTo] = useState<{ animal: string; rarity: number } | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [mission, setMission] = useState<{ m: any; state: string | null } | null>(null);
  const [skills, setSkills] = useState({ scout: 0, rewind: 0 });
  const [note, setNote] = useState('');
  const en = lang === 'en';

  const say = (text: string, ms = 2400) => {
    setNote(text);
    setTimeout(() => setNote((n) => (n === text ? '' : n)), ms);
  };

  const startGame = (id: number) => {
    if (game.current.id === id) return;
    game.current = freshGame(id);
    setCount(0);
    setResult(null);
    setReveal(null);
    setOffers([]);
    setMission(null);
    setSkills({ scout: 0, rewind: 0 });
  };

  const syncSkills = () => {
    const g = game.current;
    setSkills({ scout: g.usedScout ? 0 : g.scout, rewind: g.usedRewind ? 0 : g.rewind });
  };

  const show = (card: Won, x = 50, y = 50) => {
    const key = (flyKey.current += 1);
    const hold = card.rarity >= RARE ? SHOW_MS : FLY_MS;
    setFlies((f) => [...f, { ...card, key, x, y }]);
    setTimeout(() => setFlies((f) => f.filter((c) => c.key !== key)), hold);
    if (card.rarity === HERO) sfx.play('mate');
    else if (card.rarity >= RARE) sfx.play('promote');
  };

  const pay = (type: string | null, roll: number, x?: number, y?: number, options?: { floor?: number; boost?: boolean }) => {
    // The card goes into this game's pouch; the album gets it when the game ends (economy.js commitPouch).
    const held = loadPouch();
    const pouch = held && held.gameId === game.current.id ? held : newPouch(game.current.id);
    const preview = withPouch(loadCollection(), pouch);
    const card = type === 'check' ? checkCard(preview) : type ? awardCard(preview, type, roll, options) : consolationCard(preview, roll);
    pouch.cards.push(card);
    savePouch(pouch);
    game.current.won.push(card);
    setCount(game.current.won.length);
    show(card, x, y);
    return card;
  };

  const settleMission = (state: string | null) => {
    const g = game.current;
    if (!state || !g.mission || g.missionState) return;
    g.missionState = state;
    setMission({ m: g.mission, state });
    const reward = g.mission.target || g.mission.attacker || g.mission.piece;
    if (state === 'done') {
      pay(reward, seededRoll(g.id, 'mission', 0), 50, 30, { floor: 1 });
      say(en ? 'Mission complete!' : '미션 성공!');
    } else {
      g.boost = true;
      say(en ? 'Mission missed. Your next card gets better.' : '미션은 놓쳤어요. 다음 카드가 좋아져요.');
    }
  };

  useEffect(() => {
    const onCapture = (e: Event) => {
      if (!fxSettings().cards) return;
      const d = (e as CustomEvent).detail;
      startGame(d.gameId);
      const g = game.current;
      if (g.mission) settleMission(advanceMission(g.mission, { capture: d }));
      // A taken-back move and its replay share a move number, so a capture pays only once.
      if (!d.byPlayer || d.ply <= g.lastPly) return;
      g.lastPly = d.ply;
      if (d.type === g.quest) setMission((m) => m && { ...m, state: 'done' });
      g.captures += 1;
      const card = pay(d.type, seededRoll(d.gameId, 'capture', d.ply), d.x, d.y, { boost: g.boost });
      g.boost = false;
      if (loadCollection().games >= UNLOCK_GAMES) {
        if (card.animal === 'meerkat') g.scout = 1;
        if (card.rarity >= 1) g.rewind = 1;
        syncSkills();
      }
    };
    const onStarted = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d.resumed) say(en ? 'Picking up the last game where you left it.' : '지난 판을 이어서 둡니다.', 6000);
      // A pouch from any other game was left unfinished: those cards are not kept.
      const held = loadPouch();
      if (held && held.gameId !== d.gameId) clearPouch();
      if (!fxSettings().cards) return;
      startGame(d.gameId);
      if (d.resumed && held?.gameId === d.gameId) {
        game.current.won = [...held.cards];
        setCount(held.cards.length);
      }
      // Once a village resident is asking, its request replaces the card mission.
      const quest = loadVillage().quest;
      if (quest) {
        game.current.quest = quest.piece;
        setMission({ m: { ko: `마을의 부탁: ${ANIMAL_KO[ANIMAL_OF[quest.piece as keyof typeof ANIMAL_OF]]} 잡기`, en: `Village request: capture a ${ANIMAL_EN[ANIMAL_OF[quest.piece as keyof typeof ANIMAL_OF]].toLowerCase()}` }, state: null });
      } else if (!d.resumed && loadCollection().games >= UNLOCK_GAMES) setOffers(missionChoices(seededRoll(d.gameId, 'offer', 0)));
    };
    const onMoved = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setOffers([]);
      const g = game.current;
      if (g.id === d.gameId && g.mission) settleMission(advanceMission(g.mission, { ply: d.ply }));
      // The first check the player gives pays the lion common, once per game (a resumed pouch remembers it).
      if (d.byPlayer && d.check && fxSettings().cards) {
        startGame(d.gameId);
        if (!game.current.won.some((c: any) => c.check)) pay('check', 0, 50, 30);
      }
    };
    const onFinished = (e: Event) => {
      if (!fxSettings().cards) return;
      const d = (e as CustomEvent).detail;
      if (loadCollection().settled.includes(d.gameId >>> 0)) return;
      startGame(d.gameId);
      if (d.result === 'win') pay('king', seededRoll(d.gameId, 'mate', 0));
      if (!game.current.won.length) pay(null, seededRoll(d.gameId, 'comfort', 0));
      const g = game.current;
      const saved = loadCollection();
      const pouch = loadPouch();
      if (pouch?.gameId === (d.gameId >>> 0)) commitPouch(saved, pouch);
      clearPouch();
      saved.games += 1;
      const dust = convertOverflow(saved);
      saveCollection(saved);
      setCol(saved);
      if (dust) say(en ? `Stardust +${dust}` : `별가루 +${dust}`);
      setResult([...g.won]);
      setReveal([...g.won]);
      setSkills({ scout: 0, rewind: 0 });
      logGame({
        type: 'game', at: new Date().toISOString(), result: d.result, seconds: Math.round((Date.now() - g.started) / 1000),
        plies: d.moves?.length, captures: g.captures, cards: g.won.map((c) => c.id), fresh: g.won.filter((c) => c.fresh).length,
        mission: g.mission?.id || null, missionState: g.missionState, usedScout: g.usedScout, usedRewind: g.usedRewind
      });
    };
    window.addEventListener('piececaptured', onCapture);
    window.addEventListener('gamefinished', onFinished);
    window.addEventListener('gamestarted', onStarted);
    window.addEventListener('movelanded', onMoved);
    return () => {
      window.removeEventListener('piececaptured', onCapture);
      window.removeEventListener('gamefinished', onFinished);
      window.removeEventListener('gamestarted', onStarted);
      window.removeEventListener('movelanded', onMoved);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setCol(loadCollection());
    logGame({ type: 'book', at: new Date().toISOString() });
  }, [open]);

  const pickMission = (m: any) => {
    game.current.mission = m;
    setMission({ m, state: null });
    setOffers([]);
  };

  const useScout = () => {
    const found = engine()?.showThreats?.();
    if (found === undefined || found < 0) return say(en ? 'Use it on your turn.' : '내 차례에 쓸 수 있어요.');
    game.current.usedScout = true;
    syncSkills();
    say(found ? (en ? `${found} pieces in danger` : `위험한 말 ${found}개`) : (en ? 'All safe' : '위험한 말이 없어요'));
  };

  const useRewind = () => {
    if (!engine()?.takeBackMove?.()) return say(en ? 'Use it on your turn, after a move.' : '내 차례, 수를 둔 뒤에 쓸 수 있어요.');
    game.current.usedRewind = true;
    syncSkills();
    sfx.play('button');
  };

  const onShelf = (id: string) => {
    const fresh = loadCollection();
    if (!toggleShelf(fresh, id)) return say(en ? 'The shelf is full.' : '전시대가 찼어요.');
    saveCollection(fresh);
    setCol(fresh);
  };

  const onBuySlot = () => {
    const fresh = loadCollection();
    if (!buyShelfSlot(fresh)) return say(en ? 'Not enough stardust.' : '별가루가 모자라요.');
    saveCollection(fresh);
    setCol(fresh);
  };

  const doMerge = (animal: string, rarity: number) => {
    const fresh = loadCollection();
    const card = mergeCard(fresh, animal, rarity);
    if (!card) return;
    saveCollection(fresh);
    setCol(fresh);
    setMerged([card]);
    sfx.play('promote');
    logGame({ type: 'merge', at: new Date().toISOString(), card: card.id });
    setTimeout(() => setMerged(null), MERGE_MS);
  };

  const mergeAll = () => {
    const fresh = loadCollection();
    const made: Won[] = [];
    for (let list = mergeList(fresh); list.length; list = mergeList(fresh)) {
      made.push(mergeCard(fresh, list[0].animal, list[0].rarity) as Won);
    }
    if (!made.length) return;
    saveCollection(fresh);
    setCol(fresh);
    setMerged(made);
    sfx.play('promote');
    logGame({ type: 'merge', at: new Date().toISOString(), cards: made.map((c) => c.id) });
    setTimeout(() => setMerged(null), MERGE_MS + Math.min(800, made.length * 80));
  };

  const merges = mergeList(col);
  const how = howTo ? howToGet(col, howTo.animal, howTo.rarity) : null;
  const album = albumProgress(col);
  const heroLeft = HERO_GUARANTEE - col.sinceHero;
  const rareLeft = RARE_GUARANTEE - col.sinceRare;
  const best = result?.length ? [...result].sort((a, b) => b.rarity - a.rarity)[0] : null;
  const names = en ? ANIMAL_EN : ANIMAL_KO;
  const grades = en ? RARITY_EN : RARITY_KO;

  return (
    <>
      {flies.map((c) => (
        <div key={c.key} className={`card-fly${c.rarity === HERO ? ' hero' : c.rarity >= RARE ? ' rare' : ''}`} style={{ left: `${c.x}%`, top: `${c.y}%` }}>
          <CardFace animal={c.animal} rarity={c.rarity} isNew={c.fresh} lang={lang} size={c.rarity >= RARE ? 'lg' : 'sm'} />
        </div>
      ))}

      {note && <div className="card-note">{note}</div>}

      {offers.length > 0 && !open && (
        <div className="mission-offer" id="mission-offer">
          <b>{en ? 'Pick a mission' : '미션을 골라요'}</b>
          {offers.map((m) => (
            <button key={m.id} type="button" onClick={() => pickMission(m)}>{en ? m.en : m.ko}</button>
          ))}
          <button type="button" className="skip" onClick={() => setOffers([])}>{en ? 'Skip' : '건너뛰기'}</button>
        </div>
      )}

      {mission && !open && !result && (
        <div className={`mission-chip${mission.state ? ` ${mission.state}` : ''}`} id="mission-chip">
          🎯 {en ? mission.m.en : mission.m.ko}{mission.state === 'done' ? ' ✓' : ''}
        </div>
      )}

      {(skills.scout > 0 || skills.rewind > 0) && !open && !result && (
        <div className="card-skills" id="card-skills">
          {skills.scout > 0 && <button type="button" id="skill-scout" onClick={useScout}>👀 {en ? 'Scout' : '정찰'}</button>}
          {skills.rewind > 0 && <button type="button" id="skill-rewind" onClick={useRewind}>⏳ {en ? 'Rewind' : '되감기'}</button>}
        </div>
      )}

      {count > 0 && !open && !result && (
        <button type="button" className="card-dock" id="card-dock" onClick={onOpen}>🃏 {count}</button>
      )}

      {reveal && !open && (() => {
        const shown = reveal.slice().sort((a, b) => a.rarity - b.rarity).slice(-REVEAL_MAX);
        const checks = reveal.filter((c) => c.check).length;
        const step = Math.min(350, REVEAL_MS / Math.max(1, shown.length));
        const doneAt = step * shown.length + 400;
        const goal = nextGoal(col);
        const gn = goal.animal ? `${names[goal.animal]} ${grades[goal.rarity as number]}` : '';
        const prey = goal.animal === 'lion' ? '' : names[goal.animal as string] || '';
        const goalText = {
          merge: en ? `Merge now: ${gn}` : `지금 합성하면 ${gn}`,
          spares: en ? `${gn}: ${goal.left} more spare${goal.left === 1 ? '' : 's'} to merge` : `${gn}까지 예비 ${goal.left}장`,
          rare: en ? `A rare within ${goal.left} cards` : `${goal.left}장 안에 희귀 이상`,
          capture: goal.animal === 'lion' && goal.rarity === 0
            ? (en ? `Next: ${gn} — give check` : `다음 칸: ${gn} — 킹에게 체크하면`)
            : goal.animal === 'lion'
            ? (en ? `Next: ${gn} — win by checkmate` : `다음 칸: ${gn} — 체크메이트로 이기면`)
            : (en ? `Next: ${gn} — capture a ${prey}` : `다음 칸: ${gn} — ${prey}${objectParticle(prey)} 잡으면`),
          full: en ? 'Album complete!' : '도감을 다 채웠어요!'
        }[goal.kind as 'merge' | 'spares' | 'rare' | 'capture' | 'full'];
        return (
          <div className="card-reveal" id="card-reveal" role="dialog" aria-label={en ? 'Cards from this game' : '이번 판 카드'}>
            {/* TA-1 (2026-11-04 시험 A): 사자 카드는 잡은 것이 아니라 체크로 얻은 것이라 제목과 카드에 그 이유를 적는다. */}
            <div className="card-reveal-title">
              🎒 {en ? `This game's pouch · ${reveal.length}` : `이번 판 주머니 · ${reveal.length}장`}
              {checks > 0 && <small> ({en ? `${reveal.length - checks} caught + ${checks} for check` : `잡은 ${reveal.length - checks} + 체크 ${checks}`})</small>}
            </div>
            <div className="card-reveal-row">
              {shown.map((c, i) => (
                <div key={i} className={`card-reveal-card${c.rarity === HERO ? ' hero' : c.rarity >= RARE ? ' rare' : ''}`} style={{ animationDelay: `${i * step}ms` }}>
                  <CardFace animal={c.animal} rarity={c.rarity} isNew={c.fresh} lang={lang} size="sm" />
                  {c.check && <div className="card-reveal-tag">👑 {en ? 'for check' : '체크로 얻음'}</div>}
                </div>
              ))}
              {reveal.length > shown.length && <span className="card-reveal-more">+{reveal.length - shown.length}</span>}
            </div>
            <div className="card-reveal-after" style={{ animationDelay: `${doneAt}ms` }}>
              <div className="card-reveal-gauges">
                <span>{en ? 'Rare within' : '희귀까지'} <b>{rareLeft}</b></span>
                <span>{en ? 'Hero within' : '영웅까지'} <b>{heroLeft}</b></span>
                <span>{en ? 'Album' : '도감'} <b>{album.owned}/{album.total}</b></span>
              </div>
              <div className="card-reveal-goal" id="card-reveal-goal">🎯 {goalText}</div>
              <div className="card-reveal-actions">
                <button type="button" onClick={() => { setReveal(null); onOpen(); }}>{en ? 'Open album' : '도감 열기'}</button>
                <button type="button" className="secondary" onClick={() => setReveal(null)}>{en ? 'Close' : '닫기'}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {result && !reveal && !open && (
        <button type="button" className={`card-toast${merges.length ? ' ready' : ''}`} id="card-toast" onClick={onOpen}>
          🃏 {en ? `${result.length} cards` : `카드 ${result.length}장`}
          {merges.length > 0 && <b>{en ? ` · ${merges.length} ready to merge` : ` · 합성 ${merges.length}개`}</b>}
        </button>
      )}

      {open && (
        <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
          <div className="panel-card card-book" id="card-book" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title">
                <span>🃏</span>
                <span>{en ? 'Card album' : '카드 도감'}</span>
                <small>{album.owned}/{album.total}</small>
              </div>
              <button type="button" className="panel-close" onClick={onClose}>✕</button>
            </div>
            <div className="panel-body">
              {result && result.length > 0 && (
                <section className="card-result">
                  <h4>{en ? 'This game' : '이번 판'}</h4>
                  <div className="card-result-row">
                    {best && <CardFace animal={best.animal} rarity={best.rarity} isNew={best.fresh} lang={lang} />}
                    <ul>
                      {RARITIES.map((_, r) => {
                        const n = result.filter((c) => c.rarity === r).length;
                        return n ? <li key={r}>{grades[r]} {n}</li> : null;
                      }).reverse()}
                      <li>{en ? 'New' : '새 카드'} {result.filter((c) => c.fresh).length}</li>
                    </ul>
                  </div>
                </section>
              )}

              {merges.length > 0 && (
                <section className="card-merges">
                  <h4>{en ? `${MERGE_COST} spares make 1 of the next rarity` : `같은 카드 ${MERGE_COST}장을 합치면 다음 등급 1장`}</h4>
                  <div className="card-merge-list">
                    {merges.map((m: any) => (
                      <button key={cardId(m.animal, m.rarity)} type="button" className="card-merge-btn" onClick={() => doMerge(m.animal, m.rarity)}>
                        {names[m.animal]} {grades[m.rarity]} → {grades[m.rarity + 1]}
                      </button>
                    ))}
                    {merges.length > 1 && <button type="button" className="card-merge-btn all" onClick={mergeAll}>{en ? 'Merge all' : '모두 합성'}</button>}
                  </div>
                </section>
              )}

              <section className="card-shelf">
                <span>✨ {en ? 'Stardust' : '별가루'} {col.dust}</span>
                <span>🏡 {en ? 'Village shelf' : '마을 전시'} {col.shelf.length}/{col.shelfSlots}</span>
                {shelfPrice(col) !== null && <button type="button" onClick={onBuySlot}>{en ? 'Add slot' : '칸 늘리기'} ✨{shelfPrice(col)}</button>}
                <small>{en ? 'Tap a card to show it in the village, an empty slot to see how to get it.' : '카드를 누르면 마을에 전시되고, 빈 칸을 누르면 얻는 길이 보여요.'}</small>
              </section>

              <section className="card-gauges">
                <div><span>{en ? 'Rare within' : '희귀까지'}</span><meter min={0} max={RARE_GUARANTEE} value={RARE_GUARANTEE - rareLeft}></meter><b>{rareLeft}</b></div>
                <div><span>{en ? 'Hero within' : '영웅까지'}</span><meter min={0} max={HERO_GUARANTEE} value={HERO_GUARANTEE - heroLeft}></meter><b>{heroLeft}</b></div>
              </section>

              {how && howTo && (
                <div className="card-howto" id="card-howto">
                  <b>{names[howTo.animal]} {grades[howTo.rarity]}</b>
                  <span>
                    {how.byCheck
                      ? (en ? 'Give check: once every game' : '킹에게 체크를 걸면 · 판마다 한 장')
                      : howTo.animal === 'lion'
                      ? (en ? `Checkmate: ${how.chance}%` : `체크메이트로 이기면 ${how.chance}%`)
                      : (en ? `Capture a ${names[howTo.animal]}: ${how.chance}%` : `${names[howTo.animal]}${objectParticle(names[howTo.animal])} 잡으면 ${how.chance}%`)}
                  </span>
                  {how.merge && (
                    <span>{en ? `Merge ${how.merge.need} ${grades[how.merge.from]} spares (${how.merge.have}/${how.merge.need})` : `${grades[how.merge.from]} 예비 ${how.merge.need}장 합성 (지금 ${how.merge.have}/${how.merge.need})`}</span>
                  )}
                  {how.guaranteeIn !== null && howTo.rarity === HERO && (
                    <span>{en ? `Hero guarantee in ${how.guaranteeIn} cards, as a hero you still lack` : `영웅 보장까지 ${how.guaranteeIn}장 · 없는 영웅으로 나와요`}</span>
                  )}
                  {how.guaranteeIn !== null && howTo.rarity === RARE && (
                    <span>{en ? `A rare or better within ${how.guaranteeIn} cards` : `${how.guaranteeIn}장 안에 희귀 이상 1장`}</span>
                  )}
                </div>
              )}

              <div className="card-grid">
                {ANIMALS.map((a) => RARITIES.map((_, r) => (
                  <button
                    key={cardId(a, r)}
                    type="button"
                    className={`card-slot${col.shelf.includes(cardId(a, r)) ? ' shelved' : ''}${!col.cards[cardId(a, r)] ? ' empty' : ''}${howTo?.animal === a && howTo?.rarity === r ? ' asked' : ''}`}
                    onClick={() => (col.cards[cardId(a, r)] ? onShelf(cardId(a, r)) : setHowTo(howTo?.animal === a && howTo?.rarity === r ? null : { animal: a, rarity: r }))}
                  >
                    <CardFace animal={a} rarity={r} owned={Boolean(col.cards[cardId(a, r)])} spares={sparesOf(col, a, r)} lang={lang} size="sm" />
                  </button>
                )))}
              </div>

              <button type="button" className="card-odds-toggle" onClick={() => setOdds(!odds)}>{en ? 'Odds' : '자세히: 확률'}</button>
              {odds && (
                <>
                <table className="card-odds">
                  <thead><tr><th></th>{grades.map((g) => <th key={g}>{g}</th>)}</tr></thead>
                  <tbody>
                    {[['pawn', 'meerkat'], ['knight', 'kangaroo'], ['bishop', 'panda'], ['rook', 'rhino'], ['queen', 'tiger'], ['king', 'lion']].map(([type, a]) => (
                      <tr key={type}><td>{names[a]}{type === 'king' ? (en ? ' (checkmate)' : ' (체크메이트)') : ''}</td>{(DROP_TABLE as any)[type].map((p: number, i: number) => <td key={i}>{p}%</td>)}</tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="card-odds-toggle" onClick={() => navigator.clipboard?.writeText(readPlaylog()).then(() => say(en ? 'Copied' : '복사했어요'))}>{en ? 'Copy play record' : '플레이 기록 복사'}</button>
                </>
              )}
            </div>
          </div>
          {merged && (
            <div className="card-merge-show" onClick={(e) => e.stopPropagation()}>
              {merged.slice(0, 8).map((c, i) => (
                <CardFace key={i} animal={c.animal} rarity={c.rarity} isNew={c.fresh} lang={lang} size={merged.length > 2 ? 'md' : 'lg'} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
