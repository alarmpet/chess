// The village screen: the player's chess games as an island on water, and the captured animals who live on it.
// The scene is in village/islandScene.ts; this file holds the save and the panels over it.
import { useEffect, useRef, useState } from 'react';
import { BUILDINGS, BREAD_MAX, DEW_GRAIN, GRAIN_MAX, PET_DAILY_CAP, buildBlocked, dewReady, rollWeek, influenceBonus, influenceSquares, islandDone, moveIn, moveOut, nightOpen, pet, reconcileTenants, startBuild, startNewIsland, tenantAnimal, tenantBlocked, tenantRarity, tickVillage, roleOfSlot, GUESTS, collectGifts, decorScore, nextScoreLevel, shelfLevel, PROPS, TIER_KO, PROP_PRICE, SHELF_ODDS, SHELF_XP, SHELF_LEVEL_MAX, stockShelf, buyProp, placeProp, storeProp, shelfReserve } from './village/economy.js';
// 섬 장면(three 장면 코드 약 110KB)은 마을을 열 때 받는다 — 첫 화면 JS 상한(방향 계획서 §7-2, 2026-11-10).
import type { createIsland } from './village/islandScene';
import { sfx } from './audio/sfx.js';
import CardFace, { ANIMAL_KO, RARITY_KO } from './cards/CardFace';
import { loadCollection } from './cards/store';
import { addIslandPhoto, loadIslandPhotos, loadVillage, saveVillage, villageRivals, villageWeekly } from './village/store';
import { certificateLines, drawCertificate } from './village/certificate.js';
import { earnedMarks } from './village/marks.js';
import LoopStrip from './village/LoopStrip';
import { ZONES, zoneOf, zoneSquares } from './village/zones.js';

const FILES = 'abcdefgh';
const ROLE_OF: Record<string, string> = { a: 'rook', b: 'knight', c: 'bishop', d: 'queen', e: 'king', f: 'bishop', g: 'knight', h: 'rook' };
const SPECIES: Record<string, string> = { king: 'lion', queen: 'tiger', rook: 'rhino', bishop: 'panda', knight: 'kangaroo', pawn: 'meerkat' };
const ROLE_OF_ANIMAL: Record<string, string> = { lion: 'king', tiger: 'queen', rhino: 'rook', panda: 'bishop', kangaroo: 'knight', meerkat: 'pawn' };
const SHAPE_KO: Record<string, string> = { meerkat: '앞 칸', kangaroo: 'L자', panda: '대각선', rhino: '십자', tiger: '십자와 대각선', lion: '주변 8칸' };
const PIECE_ANIMAL: Record<string, string> = { pawn: '미어캣', knight: '캥거루', bishop: '판다', rook: '코뿔소', queen: '호랑이' };

// 받침이 있으면 앞 조사, 없으면 뒤 조사.
const josa = (word: string, withFinal: string, without: string) => ((word.charCodeAt(word.length - 1) - 0xac00) % 28 ? withFinal : without);
const role = (slot: string) => (slot[3] === '2' || slot[3] === '7' ? 'pawn' : ROLE_OF[slot[2]]);
export const slotLabel = (slot: string, names: Record<string, string>) => {
  if (names[slot]) return names[slot];
  const r = role(slot);
  const species = ANIMAL_KO[SPECIES[r]];
  if (r === 'pawn') return `${species} ${FILES.indexOf(slot[2]) + 1}호`;
  if (r === 'king' || r === 'queen') return species;
  return `${FILES.indexOf(slot[2]) < 4 ? '왼쪽' : '오른쪽'} ${species}`;
};

type Props = { open: boolean; onClose: () => void; lang: 'ko' | 'en'; summary: any | null; dive?: boolean };

const CARD_QUIET_MS = 7000;

export default function VillageView({ open, onClose, lang, summary, dive = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [village, setVillage] = useState<any>(null);
  const [col, setCol] = useState<any>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [trying, setTrying] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [away, setAway] = useState<any[]>([]);
  const [night, setNight] = useState(false);
  const [photos, setPhotos] = useState<any[] | null>(null);
  const [cert, setCert] = useState<{ url: string; file: File } | null>(null);
  const [marks, setMarks] = useState<any[] | null>(null);
  const [dew, setDew] = useState(false);
  const [newWeek, setNewWeek] = useState<any>(null);
  const [shelfOpen, setShelfOpen] = useState(false);
  const [propAt, setPropAt] = useState<string | null>(null);
  const [cardQuiet, setCardQuiet] = useState(false);
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
    const week = rollWeek(v, villageWeekly(), t);
    stockShelf(v);
    v.lastSeen = t;
    setShelfOpen(false);
    setPropAt(null);
    saveVillage(v);
    setCol(collection);
    setVillage({ ...v });
    setNight(Boolean(v.night) && nightOpen(v));
    setAway(events);
    setDew(dewReady(v, t));
    setNewWeek(week || summary?.week || null);
    (window as any).wizardChess?.setRenderPaused?.(true);
    // Closing forgets this opening's save. Kept, it reached the next opening's scene before the fresh load did, so the
    // island was first drawn from the old save and a saved night opened as day (found in the AT-9 LLM round, 2026-11-05).
    return () => {
      (window as any).wizardChess?.setRenderPaused?.(false);
      setVillage(null);
    };
  }, [open]);

  // Build the island once per opening; later state changes redraw only what sits on it.
  // The scene module arrives on the first opening (a later chunk); `sceneReady` lets the effects that read the scene run again.
  const [sceneReady, setSceneReady] = useState(0);
  useEffect(() => {
    if (!open || !hostRef.current || !village) return;
    let dead = false;
    let api: ReturnType<typeof createIsland> | null = null;
    import('./village/islandScene').then(({ createIsland: make }) => {
      if (dead || !hostRef.current) return;
      api = make(hostRef.current, {
      onTile(sq) {
        const kind = live.current.picking;
        if (!kind) {
          setSelected(null);
          setTrying(null);
          const here = loadVillage().decor.find((d: any) => d.sq === sq && PROPS[d.kind as keyof typeof PROPS]);
          setPropAt(here ? sq : null);
          // The dome's quarters have names, shown like a place sign when a square is tapped (atlantis AT-6).
          const zoneKey = zoneOf(sq);
          const zone = ZONES[zoneKey as keyof typeof ZONES];
          if (zone && !here) {
            setNote(`${zone.icon} ${lang === 'en' ? zone.en : zone.ko}`);
            island.current?.setOverlay(zoneSquares(zoneKey), [], sq);
          }
          return;
        }
        const v = loadVillage();
        if (kind.startsWith('prop:')) {
          const prop = kind.slice(5);
          const why = placeProp(v, prop, sq);
          if (why) {
            setNote('여기에는 놓을 수 없습니다.');
            return;
          }
          commit(v);
          setPicking(v.stash[prop] > 0 ? kind : null);
          setNote(`${PROPS[prop as keyof typeof PROPS].ko}${josa(PROPS[prop as keyof typeof PROPS].ko, '을', '를')} 놓았어요.`);
          return;
        }
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
        if (gained) sfx.voice(roleOfSlot(slot));
        setNote(gained ? `${slotLabel(slot, v.names)}: 💗 ${v.hearts[slot]}` : '오늘은 충분히 쓰다듬었어요. 내일 또 만나요.');
      }
    });
    island.current = api;
    if (dive) api.enter();
    api.draw(village);
    api.drawShelf(loadCollection().shelf as string[]);
    api.drawRivalFlags(villageRivals());
    api.setNight(Boolean(village.night) && nightOpen(village));
    api.setDew(dewReady(village, Date.now()) ? village.built.filter((b: any) => b.kind === 'field' && b.ready && b.tenant).map((b: any) => b.sq) : []);
      setSceneReady((n) => n + 1);
    });
    return () => {
      dead = true;
      api?.dispose();
      island.current = null;
    };
    // the scene is rebuilt per opening, not per coin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, !!village]);

  useEffect(() => {
    if (village) island.current?.draw(village);
    // DR-3: guests waiting with gifts stand over their props.
    if (village) island.current?.setGifts((village.pending || []).map((g: any) => ({ sq: g.sq, icon: (GUESTS as any)[g.guest]?.icon || '🎁' })));
  }, [village, sceneReady]);

  // DR-3 「모아 받기」: every waiting gift in one tap, counted with a rising note per gift (DR-1a ladder).
  const collect = () => {
    const v = loadVillage();
    const got = collectGifts(v);
    if (!got.acorns) return;
    commit(v);
    got.gifts.slice(0, 8).forEach((_: any, i: number) => window.setTimeout(() => sfx.play('button', 0, 2 ** (Math.min(7, i) / 12)), i * 110));
    setNote(`🧺 손님 선물 ${got.gifts.length}개 · 🌰 +${got.acorns}`);
  };

  // The loop strip and the note card sit under the top row whatever height it wraps to. On a phone the pills and the tool
  // buttons wrap to four rows and the strip covered 「체스로」 (AT-9 LLM round, 11-phone-dome).
  useEffect(() => {
    const top = topRef.current;
    const view = viewRef.current;
    if (!open || !top || !view) return;
    const fit = () => {
      const bottom = Math.round(top.getBoundingClientRect().bottom - view.getBoundingClientRect().top);
      view.style.setProperty('--village-top-bottom', `${bottom}px`);
      // The loop strip sits under the top row; together they are what covers the top of the scene.
      const loop = view.querySelector('.village-loop');
      island.current?.setTopInset(loop ? Math.round(loop.getBoundingClientRect().bottom - view.getBoundingClientRect().top) : bottom);
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(top);
    return () => watch.disconnect();
  }, [open, !!village, sceneReady]);

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
  }, [picking, trying, building, village, sceneReady]);

  function currentMarks() {
    return earnedMarks({ rivals: villageRivals(), v: loadVillage(), col: loadCollection(), photos: loadIslandPhotos() });
  }

  // Lord's certificate (desire plan D5): the island with its record, shared through the phone's own sheet or saved.
  async function makeCert() {
    const shot = island.current?.photo(1080);
    if (!shot) return;
    const lines = certificateLines(loadVillage(), loadCollection(), villageRivals());
    lines.marks = currentMarks().filter((m) => m.earned).map((m) => `${m.icon} ${m.name}`);
    const blob = await drawCertificate(lines, shot);
    if (!blob) return;
    const file = new File([blob], `wildcrown-${lines.date.replace(/\./g, '')}.png`, { type: 'image/png' });
    setCert({ url: URL.createObjectURL(file), file });
  }
  function closeCert() {
    if (cert) URL.revokeObjectURL(cert.url);
    setCert(null);
  }
  function canShare(file: File) {
    const nav = navigator as any;
    return typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] });
  }
  async function shareCert(file: File) {
    try {
      await (navigator as any).share({ files: [file], title: 'WILD CROWN 영주 증명서' });
    } catch (e) {
      // closing the share sheet is not an error worth showing
    }
  }

  // The card sat over the island's near-left squares on a desktop (the market there was named by none of three models,
  // 11-05). It folds to a small button after a while, and opens again with new news or a tap.
  const cardKey = [note, away.length, dew, Boolean(newWeek), propAt, picking, Boolean(summary), village?.quest?.buildingId].join('|');
  useEffect(() => setCardQuiet(false), [cardKey, open]);
  useEffect(() => {
    if (!open || cardQuiet || picking || propAt) return;
    const t = setTimeout(() => setCardQuiet(true), CARD_QUIET_MS);
    return () => clearTimeout(t);
  }, [cardKey, open, cardQuiet]);

  if (!open) return null;
  const rivals = villageRivals();
  const rivalName = (id: string) => rivals.find((r: any) => r.id === id)?.name?.ko || id;
  const hero = village?.walk?.slot;
  const quest = village?.quest;
  const questHome = quest && village.built.find((b: any) => b.id === quest.buildingId);
  const done = village && islandDone(village);
  const owned = col ? Object.keys(col.cards).filter((id) => col.cards[id] > 0).sort((a, b) => tenantRarity(b) - tenantRarity(a)) : [];
  const reason = (id: string) => {
    const why = tenantBlocked(village, col, building.id, id);
    return why === 'rarity' ? `${RARITY_KO[BUILDINGS[building.kind as keyof typeof BUILDINGS].minRarity]} 이상만` : why === 'busy' ? '다른 집에 살아요' : '';
  };

  return (
    <div className={`village-view${dive ? ' diving' : ''}`} id="village-view" ref={viewRef}>
      <div className="village-canvas" ref={hostRef} />
      <div className="village-top" ref={topRef}>
        {/* TA-5 (2026-11-04 시험 A): 그림만으로는 어린이가 못 읽어 이름을 함께 쓴다. */}
        <span className="village-pill" title="도토리 — 판이 끝나면 받아요">🌰 도토리 {village?.coins ?? 0}</span>
        <span className="village-pill" title="곡물 — 밭에서 자라요">🌾 곡물 {village?.grain ?? 0}/{GRAIN_MAX}</span>
        <span className="village-pill" title="빵 — 빵집이 곡물로 구워요">🥖 빵 {village?.bread ?? 0}/{BREAD_MAX}</span>
        {village && (() => {
          const score = decorScore(village);
          const nx = nextScoreLevel(village);
          return <span className="village-pill" id="village-decor" title={nx ? `꾸밈 점수 — ${nx.need}점 더 모으면 매대 Lv.${nx.level}` : '꾸밈 점수 — 매대가 가장 높은 레벨이에요'}>✨ 꾸밈 {score}</span>;
        })()}
        {village && (
          <span className="village-pill" id="village-guests" title={`손님 도감 — ${Object.keys(GUESTS).map((k) => `${(GUESTS as any)[k].icon} ${(GUESTS as any)[k].ko}${village.guestBook?.[k] ? ` ${village.guestBook[k]}번` : ' ?'}`).join(' · ')}`}>
            🐠 손님 {Object.keys(village.guestBook || {}).length}/{Object.keys(GUESTS).length}
          </span>
        )}
        <span className="village-pill" title="쓰다듬기 — 하루에 열 번까지">🤚 쓰다듬기 {Math.min(village?.petCount ?? 0, PET_DAILY_CAP)}/{PET_DAILY_CAP}</span>
        <span className="village-tools">
          <button type="button" className="hud-btn" aria-label="왼쪽으로 돌리기" onClick={() => island.current?.rotate(-1)}>⟲</button>
          <button type="button" className="hud-btn" aria-label="오른쪽으로 돌리기" onClick={() => island.current?.rotate(1)}>⟳</button>
          <button type="button" className="hud-btn" id="village-zoom-in" aria-label="크게 보기" onClick={() => island.current?.zoomStep(1)}>➕</button>
          <button type="button" className="hud-btn" id="village-zoom-out" aria-label="돔 전체 보기" onClick={() => island.current?.zoomStep(-1)}>➖</button>
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
          {(village?.pending?.length || 0) > 0 && (
            <button type="button" className="hud-btn village-collect" id="village-collect" onClick={collect}>
              🧺 모아 받기 · 🎁 {village.pending.length} · 🌰 {village.pending.reduce((n: number, g: any) => n + (g.acorns || 0), 0)}
            </button>
          )}
          <button type="button" className="hud-btn" id="village-shelf" aria-label="매대" onClick={() => setShelfOpen(!shelfOpen)}>🛒</button>
          <button type="button" className="hud-btn" id="village-album" onClick={() => setPhotos(photos ? null : loadIslandPhotos())}>📷</button>
          <button type="button" className="hud-btn" id="village-marks" aria-label="표식" onClick={() => setMarks(marks ? null : currentMarks())}>🏅</button>
          <button type="button" className="hud-btn" id="village-cert" aria-label="영주 증명서" onClick={makeCert}>📜</button>
          <button type="button" className="hud-btn" onClick={onClose}>{lang === 'en' ? 'Back to the board' : '♟ 체스로'}</button>
        </span>
      </div>

      <LoopStrip village={village} summary={summary} hasCards={owned.length > 0} dew={dew} onPlay={onClose} />

      {(summary || away.length > 0 || note || questHome || dew || newWeek || propAt) && (
        <div className={`village-card${cardQuiet ? ' quiet' : ''}`} id="village-card">
          {cardQuiet ? (
            <button type="button" className="village-card-open" id="village-card-open" onClick={() => setCardQuiet(false)}>💬 소식</button>
          ) : (<>
          {summary && (
            <div>
              <b>이번 판 활약</b> {slotLabel(summary.mvp, village?.names || {})}
              {summary.added.trees.length > 0 && ` · 나무 ${summary.added.trees.length}그루`}
              {summary.added.houses.length > 0 && ' · 승급한 폰의 집'}
            </div>
          )}
          {summary?.shelfUp && <div>🛒 섬 매대 레벨이 올랐어요(Lv.{village ? shelfLevel(village) : 1}). 더 귀한 소품이 들어와요.</div>}
          {summary?.guests?.length > 0 && (
            <div id="village-guest-line">
              {summary.guests.map((g: any) => `${(GUESTS as any)[g.guest]?.icon} ${(GUESTS as any)[g.guest]?.ko}${g.fresh ? '(새 손님!)' : ''}`).join(' · ')}{josa((GUESTS as any)[summary.guests[summary.guests.length - 1].guest]?.ko || '손님', '이', '가')} 소품 보고 놀러 왔어요 — 선물 🌰 {summary.guests.reduce((n: number, g: any) => n + g.acorns, 0)} 기다리는 중
            </div>
          )}
          {summary?.dew && <div>💧 밤사이 이슬이 내려 밭마다 곡물 +{DEW_GRAIN}</div>}
          {dew && !summary && <div>💧 밤사이 밭에 이슬이 맺혔어요. 오늘 첫 판을 끝내면 밭마다 곡물 +{DEW_GRAIN}.</div>}
          {newWeek && <div className="village-week" id="village-week">📅 새 주가 왔어요.{newWeek.guest && ` 이번 주 손님은 ${rivalName(newWeek.guest)}.`} {newWeek.line?.[lang] || newWeek.line?.ko}</div>}
          {summary?.opened?.length > 0 && <div>🎉 {summary.opened.map((k: string) => BUILDINGS[k as keyof typeof BUILDINGS].ko).join(', ')} 문을 열었어요!</div>}
          {summary?.quest?.done && <div>🔔 의뢰 성공! 건물이 한 단계 자랐어요.{summary.quest.festival && ` ${ANIMAL_KO[summary.quest.festival]} 축제가 열렸어요!`}</div>}
          {questHome && (
            <div className="village-quest" id="village-quest">🔔 {BUILDINGS[questHome.kind as keyof typeof BUILDINGS].ko}의 부탁: 다음 판에 {PIECE_ANIMAL[quest.piece]}{josa(PIECE_ANIMAL[quest.piece], '을', '를')} 잡아 주세요.</div>
          )}
          {hero && !note && !summary && <div>{slotLabel(hero, village?.names || {})}, 오늘 지나간 길을 다시 걷는 중이에요.</div>}
          {away.length === 1 && <div>💌 {rivalName(away[0].rival)} 다녀감, 선물 {PROPS[away[0].gift as keyof typeof PROPS]?.icon || '🎁'} {PROPS[away[0].gift as keyof typeof PROPS]?.ko || ''}{away[0].memory ? ` — "지난번 ${slotLabel(away[0].memory.mvp, village?.names || {})} 멋졌어!"` : ''}</div>}
          {away.length > 1 && <div>💌 손님 {away.length}팀 다녀감, 선물 {away.map((e) => PROPS[e.gift as keyof typeof PROPS]?.icon || '🎁').join('')}</div>}
          {note && <div>{note}{picking?.startsWith('prop:') && <button type="button" className="village-link" onClick={() => { setPicking(null); setNote(''); }}>그만두기</button>}</div>}
          {propAt && (() => {
            const d = village?.decor.find((x: any) => x.sq === propAt);
            const p = d && PROPS[d.kind as keyof typeof PROPS];
            return p ? (
              <div id="village-prop">
                {p.icon} {p.ko}
                <button type="button" className="village-link" onClick={() => { const v = loadVillage(); storeProp(v, propAt); commit(v); setPropAt(null); setNote(`${p.ko}${josa(p.ko, '을', '를')} 보관함에 넣었어요.`); }}>보관함으로</button>
              </div>
            ) : null;
          })()}
          </>)}
        </div>
      )}

      {shelfOpen && village && (
        <div className="panel-overlay" role="dialog" aria-modal="true" onClick={() => setShelfOpen(false)}>
          <div className="panel-card shelf-panel" id="shelf-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title"><span>🛒</span><span>섬 매대 Lv.{shelfLevel(village)}</span></div>
              <button type="button" className="panel-close" onClick={() => setShelfOpen(false)}>✕</button>
            </div>
            <div className="panel-body">
              <p className="look-note">판이 끝나면 세 칸이 새로 들어와요. 도토리로는 다시 굴리거나 레벨을 살 수 없어요.</p>
              {shelfReserve(village) && (
                <p className="shelf-reserve" id="shelf-reserve">
                  🏗️ 다음 건물({BUILDINGS[shelfReserve(village)!.kind as keyof typeof BUILDINGS].ko}) 몫 🌰 {shelfReserve(village)!.cost}은 남겨 둬요. 매대에 쓸 수 있는 도토리 {Math.max(0, village.coins - shelfReserve(village)!.cost)}개.
                </p>
              )}
              <div className="shelf-slots">
                {village.shelf.slots.map((s: any, i: number) => {
                  const p = PROPS[s.kind as keyof typeof PROPS];
                  const price = PROP_PRICE[p.tier];
                  return (
                    <div className={`shelf-slot tier-${p.tier}`} key={i} data-slot={i} data-kind={s.kind}>
                      <span className="shelf-icon">{p.icon}</span>
                      <b>{p.ko}</b>
                      <span className={`shelf-tier tier-${p.tier}`}>{TIER_KO[p.tier]}</span>
                      {s.stock > 0 ? (
                        <button
                          type="button"
                          className="hud-btn shelf-buy"
                          disabled={village.coins - price < (shelfReserve(village)?.cost ?? 0)}
                          onClick={() => {
                            const v = loadVillage();
                            if (buyProp(v, i)) return;
                            commit(v);
                            setNote(`${p.ko}${josa(p.ko, '을', '를')} 샀어요. 보관함에서 놓을 칸을 고르세요.`);
                          }}
                        >
                          🌰 {price}
                        </button>
                      ) : null}
                      {s.stock > 0 ? (
                        <small className="shelf-stock">남은 {s.stock}개</small>
                      ) : (
                        <span className="shelf-out">다음 판 뒤 입고</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="shelf-odds" id="shelf-odds">
                이 레벨의 확률: {SHELF_ODDS[shelfLevel(village) - 1].map((w: number, t: number) => `${TIER_KO[t + 1]} ${w}%`).join(' · ')}
                {shelfLevel(village) < SHELF_LEVEL_MAX ? ` — 두 판마다 1점이 쌓여요(${village.shelf.xp}/${SHELF_XP[village.shelf.lv - 1]}점), 또는 ✨ 꾸밈 점수로도 올라요${nextScoreLevel(village) ? `(${nextScoreLevel(village)!.need}점 더 모으면 Lv.${nextScoreLevel(village)!.level})` : ''}.` : ' — 가장 높은 레벨이에요.'}
              </p>
              <div className="shelf-stash" id="shelf-stash">
                <b>보관함</b>
                {Object.keys(village.stash || {}).length === 0 && <span> 비어 있어요.</span>}
                {Object.entries(village.stash || {}).map(([kind, n]: [string, any]) => (
                  <button
                    key={kind}
                    type="button"
                    className="hud-btn"
                    data-stash={kind}
                    onClick={() => {
                      setShelfOpen(false);
                      setSelected(null);
                      setPicking(`prop:${kind}`);
                      setNote(`${PROPS[kind as keyof typeof PROPS].ko}${josa(PROPS[kind as keyof typeof PROPS].ko, '을', '를')} 놓을 칸을 누르세요.`);
                    }}
                  >
                    {PROPS[kind as keyof typeof PROPS].icon} {PROPS[kind as keyof typeof PROPS].ko} ×{n} 놓기
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {cert && (
        <div className="panel-overlay" role="dialog" aria-modal="true" onClick={closeCert}>
          <div className="cert-view" id="cert-view" onClick={(e) => e.stopPropagation()}>
            <img src={cert.url} alt="영주 증명서" />
            <div className="cert-actions">
              {canShare(cert.file) && <button type="button" className="hud-btn" id="cert-share" onClick={() => shareCert(cert.file)}>📤 공유하기</button>}
              <a className="hud-btn" id="cert-save" href={cert.url} download={cert.file.name}>💾 저장하기</a>
              <button type="button" className="hud-btn" onClick={closeCert}>닫기</button>
            </div>
            <small>사진에는 섬과 기록만 담깁니다. 말 이름은 넣지 않아요.</small>
          </div>
        </div>
      )}

      {marks && (
        <div className="panel-overlay" role="dialog" aria-modal="true" onClick={() => setMarks(null)}>
          <div className="panel-card marks-panel" id="marks-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
              <div className="panel-title"><span>🏅</span><span>표식</span></div>
              <button type="button" className="panel-close" onClick={() => setMarks(null)}>✕</button>
            </div>
            <div className="panel-body">
              <p className="look-note">표식은 플레이로만 얻습니다. 상점에서 팔지 않아요.</p>
              {marks.map((m) => (
                <div className={`mark-row${m.earned ? ' earned' : ''}`} key={m.id} data-mark={m.id}>
                  <span className="mark-icon">{m.earned ? m.icon : '🔒'}</span>
                  <div className="mark-text">
                    <b>{m.name}</b> <small>{m.have}/{m.need}</small>
                    <div className="mark-bar"><i style={{ width: `${Math.min(100, (100 * m.have) / Math.max(1, m.need))}%` }} /></div>
                    <div className="mark-how">{m.how}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                    const who = ANIMAL_KO[tenantAnimal(id)];
                    setNote(`${who}${josa(who, '이', '가')} 입주했어요. 영향권: ${SHAPE_KO[tenantAnimal(id)]}`);
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
