import LookPanel from './LookPanel';
import RivalPanel from './RivalPanel';
import RivalEntrance from './RivalEntrance';
import SettingsPanel from './SettingsPanel';
import CardLayer from './cards/CardLayer';
import HandBrain from './HandBrain';
import VillageView from './VillageView';
import QuitDialog from './QuitDialog';
import { loadVillage, settleFinishedGame } from './village/store';
import { stageForHearts } from './village/economy.js';
import { gainText } from './village/LoopStrip';
import { fxSettings } from './fx/settings.js';
import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { getCurrentLang, getTranslations, setAppLanguage, subscribeLanguage, Language } from './i18n';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getCurrentLang());
  const [lookOpen, setLookOpen] = useState(false);
  const [rivalOpen, setRivalOpen] = useState(false);
  const [handBrainOpen, setHandBrainOpen] = useState(false);
  const [villageOpen, setVillageOpen] = useState(false);
  const [lastGame, setLastGame] = useState<any>(null);
  // 잠수 전환 (아틀란티스 계획서 AT-2): 체스 카메라가 판 아래로 내려가는 0.42초 뒤에 마을이 열리고, 남색 물막이 덮였다 걷힌다.
  const [veil, setVeil] = useState<'in' | 'out' | null>(null);
  const [diving, setDiving] = useState(false);
  const diveOn = () => fxSettings().dive && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const openVillage = () => {
    if (villageOpen) return;
    if (!diveOn()) { setDiving(false); setVillageOpen(true); return; }
    (window as any).wizardChess?.diveCamera?.(0.45);
    setVeil('in');
    setDiving(true);
    window.setTimeout(() => setVillageOpen(true), 420);
    window.setTimeout(() => setVeil(null), 1150);
  };
  const closeVillage = () => {
    setVillageOpen(false);
    setLastGame(null);
    if (!diveOn()) return;
    (window as any).wizardChess?.surfaceCamera?.(0.6);
    setVeil('out');
    window.setTimeout(() => setVeil(null), 750);
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const t = getTranslations(lang);
  const en = lang === 'en';

  useEffect(() => {
    if (!mobileSheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileSheetOpen]);

  // A finished game pays the village at once; the card below is the way in.
  useEffect(() => {
    const onFinished = (e: Event) => {
      const summary = settleFinishedGame((e as CustomEvent).detail);
      if (summary) setLastGame(summary);
    };
    window.addEventListener('gamefinished', onFinished);
    return () => window.removeEventListener('gamefinished', onFinished);
  }, []);

  // Coming back to the board, each piece shows the look its hearts earned.
  useEffect(() => {
    if (villageOpen) return;
    const hearts = loadVillage().hearts as Record<string, number>;
    const stages = Object.fromEntries(Object.entries(hearts).map(([slot, n]) => [slot, stageForHearts(n)]).filter(([, st]) => st !== 'baby'));
    (window as any).wizardChess?.setSlotStages?.(stages);
  }, [villageOpen]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeLanguage((newLang) => {
      setLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
      }
    };
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleToggleLang = () => {
    const nextLang: Language = lang === 'ko' ? 'en' : 'ko';
    setAppLanguage(nextLang);
  };

  const handleRestoreUI = () => {
    const win = window as unknown as { wizardChess?: { toggleUI?: (force?: boolean) => void } };
    if (win.wizardChess?.toggleUI) {
      win.wizardChess.toggleUI(false);
    } else {
      document.body.classList.remove('cinematic-ui-hidden');
      const btnHide = document.getElementById('btn-hide-ui');
      if (btnHide) btnHide.textContent = t.hideUi;
    }
  };

  return (
    <>
      <div id="loading-overlay">
        <div className="loader-title">{t.loadingTitle}</div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" id="loader-bar"></div>
        </div>
        <div id="loader-text">{t.loadingSub}</div>
      </div>

      <div id="canvas-container"></div>

      <button
        type="button"
        className="hud-btn mobile-only-restore-ui"
        id="btn-mobile-show-ui"
        onClick={handleRestoreUI}
        title={t.showUiMobile}
      >
        {t.showUiMobile}
      </button>

      <div id="hud-top">
        <div className="hud-group" id="hud-left">
          <div className="brand-pill">
            <span className="brand-title">{t.brandTitle}</span>
          </div>
          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">{t.turnWhite}</span>
            <span className="mode-badge" id="mode-badge">{t.playingAsWhite}</span>
          </div>
        </div>

        {/* Always on screen: the four places a player goes between moves. Everything else sits in the menu. */}
        <div className="hud-group" id="hud-quick">
          <button type="button" className="hud-btn quick-btn" id="btn-cards" onClick={() => setCardsOpen(true)} title={en ? 'Card album' : '카드 도감'}>
            <span aria-hidden="true">🃏</span><span className="quick-label">{en ? 'Cards' : '카드'}</span>
          </button>
          <button type="button" className="hud-btn quick-btn" id="btn-village" onClick={openVillage} title={en ? 'Your island village' : '내 말들이 사는 섬 마을'}>
            <span aria-hidden="true">🏡</span><span className="quick-label">{en ? 'Village' : '마을'}</span>
          </button>
          <button type="button" className="hud-btn quick-btn" id="btn-rivals" onClick={() => setRivalOpen(true)} title={en ? 'Beat a rival to win its item' : '라이벌을 이기고 소품 얻기'}>
            <span aria-hidden="true">🏆</span><span className="quick-label">{en ? 'Rivals' : '라이벌'}</span>
          </button>
          <button type="button" className="hud-btn quick-btn" id="btn-handbrain" onClick={() => setHandBrainOpen(true)} title={en ? 'Hand and brain: two play one side' : '손과 뇌: 둘이 한 편'}>
            <span aria-hidden="true">🤝</span><span className="quick-label">{en ? 'Together' : '함께'}</span>
          </button>
          <button
            type="button"
            className={`hud-btn quick-btn menu-trigger ${mobileSheetOpen ? 'active' : ''}`}
            id="btn-mobile-controls"
            aria-expanded={mobileSheetOpen}
            aria-controls="hud-right"
            onClick={() => setMobileSheetOpen((prev) => !prev)}
          >
            <span aria-hidden="true">☰</span><span className="quick-label">{en ? 'Menu' : '메뉴'}</span>
          </button>
        </div>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        <div className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`} id="hud-right" role="menu">
          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">{en ? 'Menu' : '메뉴'}</span>
            <button
              type="button"
              className="mobile-sheet-close"
              id="btn-mobile-sheet-close"
              onClick={(e) => {
                e.stopPropagation();
                setMobileSheetOpen(false);
              }}
              aria-label={t.close}
            >
              ✕
            </button>
          </div>

          <div className="mobile-sheet-section-label">{en ? 'This game' : '이번 판'}</div>
          <button className="hud-btn" id="btn-reset" title={en ? 'Start a fresh game' : '새 판 시작'} onClick={() => setMobileSheetOpen(false)}>
            {en ? '♻️ New game' : '♻️ 새 판'}
          </button>
          <button className="hud-btn" id="btn-resign" title={en ? 'Resign this game' : '이번 판 기권하기'} onClick={() => setMobileSheetOpen(false)}>
            {en ? '🏳️ Resign' : '🏳️ 기권'}
          </button>
          <button className="hud-btn" id="btn-side-toggle" title={en ? 'Switch between White and Black' : '백/흑 바꾸기'} onClick={() => setMobileSheetOpen(false)}>
            {t.playAsBlack}
          </button>

          <div className="mobile-sheet-section-label">{en ? 'View' : '보기'}</div>
          <button className="hud-btn active" id="btn-cam-player" title={t.camPlayer}>{t.camPlayer}</button>
          <button className="hud-btn" id="btn-cam-top" title={t.camTop}>{t.camTop}</button>
          <button className="hud-btn" id="btn-cam-side" title={t.camSide}>{t.camSide}</button>
          <button className="hud-btn" id="btn-cam-wide" title={t.camWide}>{t.camWide}</button>

          <div className="mobile-sheet-section-label">{en ? 'More' : '더 보기'}</div>
          <button type="button" className="hud-btn" id="btn-looks" onClick={() => { setLookOpen(true); setMobileSheetOpen(false); }} title={en ? 'Looks only; the moves stay the same' : '외형만 바뀌고 수는 같습니다'}>
            {en ? '🎨 Looks' : '🎨 외형'}
          </button>
          <button className="hud-btn" id="btn-settings" onClick={() => { setSettingsOpen(true); setMobileSheetOpen(false); }}>
            {en ? '⚙️ Settings' : '⚙️ 설정'}
          </button>
          <button type="button" className="hud-btn" id="btn-lang-toggle" onClick={handleToggleLang} title={lang === 'ko' ? 'Switch to English' : '한국어로 전환'}>
            🌐 {t.langSwitchLabel}
          </button>
          <button className="hud-btn" id="btn-hide-ui" title={t.hideUi} onClick={() => setMobileSheetOpen(false)}>
            {t.hideUi}
          </button>
        </div>
      </div>

      <div id="hud-bottom">
        <div className="hint-pill" id="controls-hint">
          {t.desktopHint}
        </div>
        <div className="captured-pill" id="captured-tray"></div>
      </div>

      <div id="checkmate-overlay" role="status" aria-live="polite">
        <div className="checkmate-banner">
          <div className="checkmate-ornament">{t.judgment}</div>
          <div className="checkmate-crown" id="checkmate-crown">♔</div>
          <div className="checkmate-title" id="checkmate-title">{t.checkmateTitle}</div>
          <div className="checkmate-rule"></div>
          <div className="checkmate-subtitle" id="checkmate-subtitle">
            {t.whiteTriumphs}
          </div>
          <div className="checkmate-actions">
            <button className="checkmate-btn" id="btn-checkmate-replay">
              {t.replayFall}
            </button>
            <button className="checkmate-btn" id="btn-checkmate-newgame">
              {t.newGame}
            </button>
            <button className="checkmate-btn secondary" id="btn-checkmate-dismiss">
              {t.dismiss}
            </button>
          </div>
        </div>
      </div>

      <QuitDialog lang={lang === 'en' ? 'en' : 'ko'} />
      <LookPanel open={lookOpen} onClose={() => setLookOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />
      <RivalPanel open={rivalOpen} onClose={() => setRivalOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />
      <RivalEntrance lang={lang === 'en' ? 'en' : 'ko'} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />
      <HandBrain open={handBrainOpen} onClose={() => setHandBrainOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />
      <CardLayer open={cardsOpen} onOpen={() => setCardsOpen(true)} onClose={() => setCardsOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />
      {lastGame && !villageOpen && (
        <button type="button" className="village-toast" id="village-toast" onClick={openVillage}>
          🌱 심기 → ♟ 한 판 ✓ → 🧺 거두기 {gainText(lastGame)} — 섬으로
        </button>
      )}
      <VillageView open={villageOpen} onClose={closeVillage} lang={lang === 'en' ? 'en' : 'ko'} summary={lastGame} dive={diving} />
      {veil && (
        <div className={`dive-veil ${veil}`} id="dive-veil" aria-hidden="true">
          {[8, 22, 37, 51, 64, 78, 90, 44].map((left, i) => <i key={i} style={{ left: `${left}%`, animationDelay: `${i * 0.07}s`, width: `${10 + (i % 3) * 5}px`, height: `${10 + (i % 3) * 5}px` }} />)}
        </div>
      )}
    </>
  );
}
