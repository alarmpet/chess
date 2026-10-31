import { useEffect, useRef, useState } from 'react';
import { sfx } from '../audio/sfx.js';
import { fxSettings } from '../fx/settings.js';
import CardFace, { ANIMAL_EN, ANIMAL_KO, RARITY_EN, RARITY_KO } from './CardFace';
import {
  ANIMALS, DROP_TABLE, HERO, HERO_GUARANTEE, MERGE_COST, RARE, RARE_GUARANTEE, RARITIES,
  albumProgress, awardCard, cardId, consolationCard, mergeCard, mergeList, seededRoll, sparesOf
} from './economy.js';
import { loadCollection, saveCollection } from './store';

const FLY_MS = 900;
const SHOW_MS = 1500;
const MERGE_MS = 1100;

type Won = { id: string; animal: string; rarity: number; fresh: boolean };
type Fly = Won & { key: number; x: number; y: number };

// Listens to the chess engine, pays cards and shows them. The engine only reports what happened on the board.
export default function CardLayer({ open, onOpen, onClose, lang }: { open: boolean; onOpen: () => void; onClose: () => void; lang: 'ko' | 'en' }) {
  const game = useRef<{ id: number; lastPly: number; won: Won[] }>({ id: 0, lastPly: 0, won: [] });
  const flyKey = useRef(0);
  const [flies, setFlies] = useState<Fly[]>([]);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<Won[] | null>(null);
  const [col, setCol] = useState<any>(() => loadCollection());
  const [merged, setMerged] = useState<Won | null>(null);
  const [odds, setOdds] = useState(false);
  const en = lang === 'en';

  const startGame = (id: number) => {
    if (game.current.id === id) return;
    game.current = { id, lastPly: 0, won: [] };
    setCount(0);
    setResult(null);
  };

  const show = (card: Won, x = 50, y = 50) => {
    const key = (flyKey.current += 1);
    const hold = card.rarity >= RARE ? SHOW_MS : FLY_MS;
    setFlies((f) => [...f, { ...card, key, x, y }]);
    setTimeout(() => setFlies((f) => f.filter((c) => c.key !== key)), hold);
    if (card.rarity === HERO) sfx.play('mate');
    else if (card.rarity >= RARE) sfx.play('promote');
  };

  const pay = (type: string | null, roll: number, x?: number, y?: number) => {
    const fresh = loadCollection();
    const card = type ? awardCard(fresh, type, roll) : consolationCard(fresh, roll);
    saveCollection(fresh);
    setCol(fresh);
    game.current.won.push(card);
    setCount(game.current.won.length);
    show(card, x, y);
  };

  useEffect(() => {
    const onCapture = (e: Event) => {
      if (!fxSettings().cards) return;
      const d = (e as CustomEvent).detail;
      startGame(d.gameId);
      // A taken-back move and its replay share a move number, so a capture pays only once.
      if (d.ply <= game.current.lastPly) return;
      game.current.lastPly = d.ply;
      pay(d.type, seededRoll(d.gameId, 'capture', d.ply), d.x, d.y);
    };
    const onFinished = (e: Event) => {
      if (!fxSettings().cards) return;
      const d = (e as CustomEvent).detail;
      startGame(d.gameId);
      if (d.result === 'win') pay('king', seededRoll(d.gameId, 'mate', 0));
      if (!game.current.won.length) pay(null, seededRoll(d.gameId, 'comfort', 0));
      setResult([...game.current.won]);
    };
    window.addEventListener('piececaptured', onCapture);
    window.addEventListener('gamefinished', onFinished);
    return () => {
      window.removeEventListener('piececaptured', onCapture);
      window.removeEventListener('gamefinished', onFinished);
    };
  }, []);

  useEffect(() => { if (open) setCol(loadCollection()); }, [open]);

  const doMerge = (animal: string, rarity: number) => {
    const fresh = loadCollection();
    const card = mergeCard(fresh, animal, rarity);
    if (!card) return;
    saveCollection(fresh);
    setCol(fresh);
    setMerged(card);
    sfx.play('promote');
    setTimeout(() => setMerged(null), MERGE_MS);
  };

  const mergeAll = () => {
    const fresh = loadCollection();
    let last: Won | null = null;
    for (let list = mergeList(fresh); list.length; list = mergeList(fresh)) {
      last = mergeCard(fresh, list[0].animal, list[0].rarity);
    }
    if (!last) return;
    saveCollection(fresh);
    setCol(fresh);
    setMerged(last);
    sfx.play('promote');
    setTimeout(() => setMerged(null), MERGE_MS);
  };

  const merges = mergeList(col);
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

      {count > 0 && !open && !result && (
        <button type="button" className="card-dock" id="card-dock" onClick={onOpen}>🃏 {count}</button>
      )}

      {result && !open && (
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

              <section className="card-gauges">
                <div><span>{en ? 'Rare within' : '희귀까지'}</span><meter min={0} max={RARE_GUARANTEE} value={RARE_GUARANTEE - rareLeft}></meter><b>{rareLeft}</b></div>
                <div><span>{en ? 'Hero within' : '영웅까지'}</span><meter min={0} max={HERO_GUARANTEE} value={HERO_GUARANTEE - heroLeft}></meter><b>{heroLeft}</b></div>
              </section>

              <div className="card-grid">
                {ANIMALS.map((a) => RARITIES.map((_, r) => (
                  <CardFace key={cardId(a, r)} animal={a} rarity={r} owned={Boolean(col.cards[cardId(a, r)])} spares={sparesOf(col, a, r)} lang={lang} size="sm" />
                )))}
              </div>

              <button type="button" className="card-odds-toggle" onClick={() => setOdds(!odds)}>{en ? 'Odds' : '자세히: 확률'}</button>
              {odds && (
                <table className="card-odds">
                  <thead><tr><th></th>{grades.map((g) => <th key={g}>{g}</th>)}</tr></thead>
                  <tbody>
                    {[['pawn', 'meerkat'], ['knight', 'kangaroo'], ['bishop', 'panda'], ['rook', 'rhino'], ['queen', 'tiger'], ['king', 'lion']].map(([type, a]) => (
                      <tr key={type}><td>{names[a]}{type === 'king' ? (en ? ' (checkmate)' : ' (체크메이트)') : ''}</td>{(DROP_TABLE as any)[type].map((p: number, i: number) => <td key={i}>{p}%</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {merged && (
            <div className="card-merge-show" onClick={(e) => e.stopPropagation()}>
              <CardFace animal={merged.animal} rarity={merged.rarity} isNew={merged.fresh} lang={lang} size="lg" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
