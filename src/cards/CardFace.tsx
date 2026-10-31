import { useRef, type PointerEvent } from 'react';
import { RARITIES } from './economy.js';

export const RARITY_KO = ['일반', '고급', '희귀', '영웅'];
export const RARITY_EN = ['Common', 'Uncommon', 'Rare', 'Hero'];
export const ANIMAL_KO: Record<string, string> = { meerkat: '미어캣', kangaroo: '캥거루', panda: '판다', rhino: '코뿔소', tiger: '호랑이', lion: '사자' };
export const ANIMAL_EN: Record<string, string> = { meerkat: 'Meerkat', kangaroo: 'Kangaroo', panda: 'Panda', rhino: 'Rhino', tiger: 'Tiger', lion: 'Lion' };

// The material says the rarity at a glance: matte, silver, rainbow foil, gold. Pointer position drives the foil.
export default function CardFace({ animal, rarity, owned = true, isNew = false, spares = 0, lang, size = 'md' }: {
  animal: string; rarity: number; owned?: boolean; isNew?: boolean; spares?: number; lang: 'ko' | 'en'; size?: 'sm' | 'md' | 'lg';
}) {
  const el = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = el.current?.getBoundingClientRect();
    if (!box || !el.current) return;
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    el.current.style.setProperty('--mx', `${x * 100}%`);
    el.current.style.setProperty('--my', `${y * 100}%`);
    el.current.style.setProperty('--rx', `${(0.5 - y) * 14}deg`);
    el.current.style.setProperty('--ry', `${(x - 0.5) * 14}deg`);
  };
  const onLeave = () => {
    for (const k of ['--mx', '--my', '--rx', '--ry']) el.current?.style.removeProperty(k);
  };
  const name = (lang === 'en' ? ANIMAL_EN : ANIMAL_KO)[animal];
  const grade = (lang === 'en' ? RARITY_EN : RARITY_KO)[rarity];
  return (
    <div ref={el} className={`wc-card r-${RARITIES[rarity]} ${size}${owned ? '' : ' empty'}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="wc-card-art">
        <img src={`./packs/legend/cards/${animal}_${rarity}.webp`} alt={owned ? `${grade} ${name}` : ''} draggable={false} />
      </div>
      <div className="wc-card-foil" aria-hidden="true"></div>
      <div className="wc-card-label">
        <span>{owned ? name : '?'}</span>
        <small>{grade}</small>
      </div>
      {isNew && <div className="wc-card-new">NEW</div>}
      {spares > 0 && (
        <div className="wc-card-spares" aria-label={`${spares}`}>
          {[0, 1, 2].map((i) => <i key={i} className={i < spares ? 'on' : ''}></i>)}
          {spares > 3 && <b>+{spares - 3}</b>}
        </div>
      )}
    </div>
  );
}
