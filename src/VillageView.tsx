// The village screen: the player's chess games as an island on water, and the captured animals who live on it.
// The scene is in village/islandScene.ts; this file holds the save and the panels over it.
import { useEffect, useRef, useState } from 'react';
import { BUILDINGS, BREAD_MAX, GRAIN_MAX, PET_DAILY_CAP, buildBlocked, influenceBonus, influenceSquares, islandDone, moveIn, moveOut, nightOpen, pet, reconcileTenants, startBuild, startNewIsland, tenantAnimal, tenantBlocked, tenantRarity, tickVillage } from './village/economy.js';
import { createIsland, slotRole } from './village/islandScene';
import { sfx } from './audio/sfx.js';
import CardFace, { ANIMAL_KO, RARITY_KO } from './cards/CardFace';
import { loadCollection } from './cards/store';
import { addIslandPhoto, loadIslandPhotos, loadVillage, saveVillage, villageRivals } from './village/store';

const FILES = 'abcdefgh';
const ROLE_OF: Record<string, string> = { a: 'rook', b: 'knight', c: 'bishop', d: 'queen', e: 'king', f: 'bishop', g: 'knight', h: 'rook' };
const SPECIES: Record<string, string> = { king: 'lion', queen: 'tiger', rook: 'rhino', bishop: 'panda', knight: 'kangaroo', pawn: 'meerkat' };
const ROLE_OF_ANIMAL: Record<string, string> = { lion: 'king', tiger: 'queen', rhino: 'rook', panda: 'bishop', kangaroo: 'knight', meerkat: 'pawn' };
const SHAPE_KO: Record<string, string> = { meerkat: '앞 칸', kangaroo: 'L자', panda: '대각선', rhino: '십자', tiger: '십자와 대각선', lion: '주변 8칸' };
const PIECE_ANIMAL: Record<string, string> = { pawn: '미어캣', knight: '캥거루', bishop: '판다', rook: '코뿔소', queen: '호랑이' };

const role = (slot: string) => (slot[3] === '2' || slot[3] === '7' ? 'pawn' : ROLE_OF[slot[2]]);
export const slotLabel = (slot: string, names: Record<string, string>) => {
  if (names[slot]) return names[slot];
  const r = role(slot);
  const species = ANIMAL_KO[SPECIES[r]];
  if (r === 'pawn') return `${species} ${FILES.indexOf(slot[2]) + 1}호`;
  if (r === 'king' || r === 'queen') return species;
  return `${FILES.indexOf(slot[2]) < 4 ? '왼쪽' : '오른쪽'} ${species}`;
};

type Props = { open: boolean; onClose: () => void; lang: 'ko' | 'en'; summary: any | null };

export default function VillageView({ open, onClose, lang, summary }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [village, setVillage] = useState<any>(null);
  const [col, setCol] = useState<any>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [trying, setTrying] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [away, setAway] = useState<any[]>([]);
  const [night, setNight] = useState(false);
  const [photos, setPhotos] = useState<any[] | null>(null);
  const island = useRef<ReturnType<typeof createIsland> | null>(null);
  const live = useRef({ picking, selected });
  live.current = { picking, selected };

  const commit = (v: any) => {
    saveVillage(v);
    setVillage({ ...v });
  };

  useEffect(() => {
    if (!open) return;
    setPicking(null);
    setSelected(null);
    setTrying(null);
    setNote('');
    setPhotos(null);
    const collection = loadCollection();
    const v = reconcileTenants(loadVillage(), collection);
    const t = Date.now();
    const events = tickVillage(v, villageRivals(), t);
    v.lastSeen = t;
    saveVillage(v);
    setCol(collection);
    setVillage({ ...v });
    setNight(Boolean(v.night) && nightOpen(v));
    setAway(events);
    (window as any).wizardChess?.setRenderPaused?.(true);
    return () => { (window as any).wizardChess?.setRenderPaused?.(false); };
  }, [open]);

  // Build the island once per opening; later state changes redraw only what sits on it.
  useEffect(() => {
    if (!open || !hostRef.current || !village) return;
    const api = createIsland(hostRef.current, {
      onTile(sq) {
        const kind = live.current.picking;
        if (!kind) {
          setSelected(null);
          setTrying(null);
          return;
        }
        const v = loadVillage();
        if (startBuild(v, kind, sq)) {
          commit(v);
          setPicking(null);
          setSelected(v.built[v.built.length - 1].id);
          setNote('다음 판이 끝나면 문을 엽니다.');
        } else setNote('여기에는 지을 수 없습니다.');
      },
      onBuilding(id) {
        setPicking(null);
        setSelected(id);
        setTrying(null);
        setNote('');
      },
      onActor(slot, animal) {
        if (!slot) {
          sfx.voice(ROLE_OF_ANIMAL[animal]);
          setNote(`${ANIMAL_KO[animal]}, 오늘도 일하는 중이에요.`);
          return;
        }
        const v = loadVillage();
        const gained = pet(v, slot, Date.now());
        commit(v);
        if (gained) sfx.voice(slotRole(slot));
        setNote(gained ? `${slotLabel(slot, v.names)}: 💗 ${v.hearts[slot]}` : '오늘은 충분히 쓰다듬었어요. 내일 또 만나요.');
      }
    });
    island.current = api;
    api.draw(village);
    api.drawShelf(loadCollection().shelf as string[]);
    api.setNight(Boolean(village.night) && nightOpen(village));
    return () => {
      api.dispose();
      island.current = null;
    };
    // the scene is rebuilt per opening, not per coin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, !!village]);

  useEffect(() => {
    if (village) island.current?.draw(village);
  }, [village]);

  const building = village?.built.find((b: any) => b.id === selected) || null;

  // The tinted squares answer "what would this do?" before anything is decided.
  useEffect(() => {
    const api = island.current;
    if (!api || !village) return;
    api.setPicking(Boolean(picking));
    if (picking) {
      const used = new Set([...village.built.map((b: any) => b.sq), ...village.decor.map((d: any) => d.sq)]);
      const free: string[] = [];
      for (const f of FILES) for (let r = 1; r <= 8; r++) if (!used.has(`${f}${r}`)) free.push(`${f}${r}`);
      api.setOverlay(free);
      return;
    }
    const card = trying || building?.tenant;
    if (!building || !card) {
      api.setOverlay([], [], building?.sq || null);
      return;
    }
    const reach = influenceSquares(tenantAnimal(card), building.sq);
    const homes = village.built.filter((b: any) => reach.includes(b.sq)).map((b: any) => b.sq);
    api.setOverlay(reach, homes, building.sq);
  }, [picking, trying, building, village]);

  if (!open) return null;
  const rivals = villageRivals();
  const rivalName = (id: string) => rivals.find((r: any) => r.id === id)?.name?.ko || id;
  const hero = village?.walk?.slot;
  const quest = village?.quest;
  const questHome = quest && village.built.find((b: any) => b.id === quest.buildingId);
  const done = village && islandDone(village);
  const owned = col ? Object.keys(col.cards).filter((id) => col.cards[id] > 0).sort((a, b) => tenantRarity(b) - tenantRarity(a)) : [];
  const h = summary?.harvest;
  const gains = h ? [h.grain && `🌾 +${h.grain}`, h.bread && `🥖 +${h.bread}`, h.coins && `🌰 +${h.coins}`, h.hearts && `💗 +${h.hearts}`].filter(Boolean).join(' · ') : '';
  const reason = (id: string) => {
    const why = tenantBlocked(village, col, building.id, id);
    return why === 'rarity' ? `${RARITY_KO[BUILDINGS[building.kind as keyof typeof BUILDINGS].minRarity]} 이상만` : why === 'busy' ? '다른 집에 살아요' : '';
  };

  return (
    <div className="village-view" id="village-view">
      <div className="village-canvas" ref={hostRef} />
      <div className="village-top">
        <span className="village-pill">🌰 {village?.coins ?? 0}</span>
        <span className="village-pill">🌾 {village?.grain ?? 0}/{GRAIN_MAX}</span>
        <span className="village-pill">🥖 {village?.bread ?? 0}/{BREAD_MAX}</span>
        <span className="village-pill">🤚 {Math.min(village?.petCount ?? 0, PET_DAILY_CAP)}/{PET_DAILY_CAP}</span>
        <span className="village-tools">
          <button type="button" className="hud-btn" aria-label="왼쪽으로 돌리기" onClick={() => island.current?.rotate(-1)}>⟲</button>
          <button type="button" className="hud-btn" aria-label="오른쪽으로 돌리기" onClick={() => island.current?.rotate(1)}>⟳</button>
          {village && nightOpen(village) && (
            <button
              type="button"
              className="hud-btn"
              id="village-night"
              onClick={() => {
                const on = !night;
                setNight(on);
                island.current?.setNight(on);
                commit({ ...loadVillage(), night: on });
              }}
            >
              {night ? '☀️ 낮' : '🌙 밤'}
            </button>
          )}
          <button type="button" className="hud-btn" id="village-album" onClick={() => setPhotos(photos ? null : loadIslandPhotos())}>📷</button>
          <button type="button" className="hud-btn" onClick={onClose}>{lang === 'en' ? 'Back to the board' : '♟ 체스로'}</button>
        </span>
      </div>

      {(summary || away.length > 0 || note || questHome) && (
        <div className="village-card" id="village-card">
          {summary && (
            <div>
              <b>이번 판</b> 🌰 +{summary.coins} · {slotLabel(summary.mvp, village?.names || {})} 💗 +{summary.hearts}
              {summary.added.trees.length > 0 && ` · 나무 ${summary.added.trees.length}그루`}
              {summary.added.houses.length > 0 && ' · 승급한 폰의 집'}
            </div>
          )}
          {gains && <div><b>수확</b> {gains}</div>}
          {summary?.opened?.length > 0 && <div>🎉 {summary.opened.map((k: string) => BUILDINGS[k as keyof typeof BUILDINGS].ko).join(', ')} 문을 열었어요!</div>}
          {summary?.quest?.done && <div>🔔 의뢰 성공! 건물이 한 단계 자랐어요.{summary.quest.festival && ` ${ANIMAL_KO[summary.quest.festival]} 축제가 열렸어요!`}</div>}
          {questHome && (
            <div className="village-quest" id="village-quest">🔔 {BUILDINGS[questHome.kind as keyof typeof BUILDINGS].ko}의 부탁: 다음 판에 {PIECE_ANIMAL[quest.piece]}를 잡아 주세요.</div>
          )}
          {hero && !note && <div>{slotLabel(hero, village?.names || {})}, 오늘 지나간 길을 다시 걷는 중이에요.</div>}
          {away.map((e, i) => (
            <div key={i}>💌 {rivalName(e.rival)} 다녀감, 🌰 +{e.coins}{e.memory ? ` — "지난번 ${slotLabel(e.memory.mvp, village?.names || {})} 멋졌어!"` : ''}</div>
          ))}
          {note && <div>{note}</div>}
        </div>
      )}

      {photos && (
        <div className="village-album" id="island-album">
          {photos.length === 0 && <span>섬을 완성하면 여기에 사진이 남습니다.</span>}
          {photos.map((p: any) => (
            <figure key={p.island}><img src={p.photo} alt={`${p.island}번째 섬`} /><figcaption>{p.island}번째 섬 · {p.games}판</figcaption></figure>
          ))}
        </div>
      )}

      {building && col && (
        <div className="village-panel" id="village-panel">
          <div className="village-panel-head">
            <b>{BUILDINGS[building.kind as keyof typeof BUILDINGS].icon} {BUILDINGS[building.kind as keyof typeof BUILDINGS].ko}{building.level ? ` Lv.${building.level + 1}` : ''}</b>
            <button type="button" className="panel-close" aria-label="닫기" onClick={() => { setSelected(null); setTrying(null); }}>✕</button>
          </div>
          <p>{BUILDINGS[building.kind as keyof typeof BUILDINGS].effect}{influenceBonus(village, building) > 0 && ` · 이웃 영향 +${influenceBonus(village, building)}`}</p>
          {!building.ready && <p>🔨 다음 판이 끝나면 문을 엽니다.</p>}
          <p>
            {building.tenant ? `주민: ${RARITY_KO[tenantRarity(building.tenant)]} ${ANIMAL_KO[tenantAnimal(building.tenant)]}` : '아직 주민이 없어요. 카드를 고르면 영향권이 보입니다.'}
            {building.tenant && <button type="button" className="village-link" onClick={() => { const v = loadVillage(); moveOut(v, building.id); commit(v); setTrying(null); }}>내보내기</button>}
          </p>
          {owned.length === 0 && <p>대국에서 말을 잡으면 주민 카드가 생깁니다.</p>}
          <div className="village-residents">
            {owned.map((id) => {
              const why = reason(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`village-resident${trying === id ? ' on' : ''}${why ? ' off' : ''}`}
                  data-card={id}
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') setTrying(id); }}
                  onPointerLeave={(e) => { if (e.pointerType === 'mouse') setTrying(null); }}
                  onClick={() => {
                    if (why) {
                      setTrying(id);
                      return;
                    }
                    const v = loadVillage();
                    moveIn(v, loadCollection(), building.id, id);
                    commit(v);
                    setNote(`${ANIMAL_KO[tenantAnimal(id)]}가 입주했어요. 영향권: ${SHAPE_KO[tenantAnimal(id)]}`);
                  }}
                >
                  <CardFace animal={tenantAnimal(id)} rarity={tenantRarity(id)} lang={lang} size="sm" />
                  {why && <small>{why}</small>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {done && !building && (
        <button
          type="button"
          className="village-toast island-done"
          id="island-done"
          onClick={() => {
            const shot = island.current?.photo();
            const v = loadVillage();
            if (shot) addIslandPhoto({ island: v.island, games: v.games, photo: shot });
            startNewIsland(v);
            commit(v);
            setNote('새 섬이 떠올랐어요. 주민과 도토리는 그대로입니다.');
          }}
        >
          📷 섬 완성! 사진을 찍고 새 섬으로
        </button>
      )}

      {!building && !done && (
        <div className="village-build" id="village-build">
          {Object.entries(BUILDINGS).filter(([id]) => !village?.built.some((b: any) => b.kind === id)).map(([id, b]) => {
            const blocked = village ? buildBlocked(village, id, '') : 'busy';
            return (
              <button
                key={id}
                type="button"
                data-kind={id}
                className={`village-build-btn${picking === id ? ' active' : ''}`}
                disabled={Boolean(blocked)}
                title={b.effect}
                onClick={() => { setPicking(picking === id ? null : id); setNote(picking === id ? '' : '지을 칸을 누르세요.'); }}
              >
                <span>{b.icon}</span>
                <span>{b.ko}</span>
                <small>🌰 {b.cost}{b.minRarity > 0 ? ` · ${RARITY_KO[b.minRarity]}` : ''}</small>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
