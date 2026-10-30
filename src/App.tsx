import LookPanel from './LookPanel';
import RivalPanel from './RivalPanel';
import VillageView from './VillageView';
import { loadVillage, settleFinishedGame } from './village/store';
import { stageForHearts } from './village/economy.js';
import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { sfx } from './audio/sfx.js';
import { getCurrentLang, getTranslations, setAppLanguage, subscribeLanguage, Language } from './i18n';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getCurrentLang());
  const [lookOpen, setLookOpen] = useState(false);
  const [rivalOpen, setRivalOpen] = useState(false);
  const [villageOpen, setVillageOpen] = useState(false);
  const [lastGame, setLastGame] = useState<any>(null);
  const [soundOn, setSoundOn] = useState(!sfx.isMuted());
  const t = getTranslations(lang);

  // A finished game pays the village at once; the card below is the way in.
  useEffect(() => {
    const onFinished = (e: Event) => setLastGame(settleFinishedGame((e as CustomEvent).detail));
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

        <button
          type="button"
          className={`hud-btn mobile-controls-trigger ${mobileSheetOpen ? 'active' : ''}`}
          id="btn-mobile-controls"
          aria-expanded={mobileSheetOpen}
          aria-controls="hud-right"
          onClick={() => setMobileSheetOpen((prev) => !prev)}
        >
          {mobileSheetOpen ? t.close : t.controls}
        </button>

        <div
          className={`mobile-sheet-backdrop ${mobileSheetOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileSheetOpen(false);
          }}
          aria-hidden="true"
        ></div>

        <div
          className={`hud-group ${mobileSheetOpen ? 'mobile-sheet-open' : ''}`}
          id="hud-right"
        >
          <div
            className="mobile-sheet-handle-wrap"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSheetOpen(false);
            }}
            aria-hidden="true"
          >
            <div className="mobile-sheet-handle"></div>
          </div>

          <div className="mobile-sheet-header">
            <span className="mobile-sheet-title">{t.controls}</span>
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
              {t.close}
            </button>
          </div>

          {/* Language Switch Button */}
          <button
            type="button"
            className="hud-btn lang-toggle-btn"
            id="btn-lang-toggle"
            onClick={handleToggleLang}
            title={lang === 'ko' ? 'Switch to English' : '한국어로 전환'}
          >
            🌐 {t.langSwitchLabel}
          </button>

          {/* Appearance (PLAN §14.2 · §14.3): stages and trinkets — looks only */}
          <button
            type="button"
            className="hud-btn"
            id="btn-looks"
            onClick={() => { setLookOpen(true); setMobileSheetOpen(false); }}
            title="외형 단계와 장식 고르기 — 외형만 바뀌고 수는 같습니다"
          >
            🎨 외형
          </button>

          <button
            type="button"
            className="hud-btn"
            id="btn-rivals"
            onClick={() => { setRivalOpen(true); setMobileSheetOpen(false); }}
            title="소품을 입은 AI 를 이기고 소품을 하나씩 얻습니다"
          >
            🏆 라이벌
          </button>

          <button
            type="button"
            className="hud-btn"
            id="btn-village"
            onClick={() => { setVillageOpen(true); setMobileSheetOpen(false); }}
            title="내 말들이 사는 마을"
          >
            🏡 마을
          </button>

          <div className="hud-divider" aria-hidden="true"></div>

          <div className="mobile-sheet-section-label">{t.gameActions}</div>

          <button
            className="hud-btn"
            id="btn-side-toggle"
            title={lang === 'ko' ? '백/흑 진영 바꾸기' : 'Switch between White and Black'}
            onClick={() => setMobileSheetOpen(false)}
          >
            {t.playAsBlack}
          </button>
          <button
            className="hud-btn"
            id="btn-ai-move"
            title={lang === 'ko' ? 'AI에게 다음 수 두게 하기' : 'Let AI make the next move'}
            onClick={() => setMobileSheetOpen(false)}
          >
            {t.aiMove}
          </button>
          <button
            className="hud-btn"
            id="btn-reset"
            title={lang === 'ko' ? '체스판 초기화 및 새 게임 시작' : 'Start a fresh game'}
            onClick={() => setMobileSheetOpen(false)}
          >
            {t.newGame}
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">
            <span>{t.cameraViews}</span>
            <span className="mobile-sheet-section-sub">{t.cameraSub}</span>
          </div>

          <button
            className="hud-btn active"
            id="btn-cam-player"
            title={t.camPlayer}
          >
            {t.camPlayer}
          </button>
          <button
            className="hud-btn"
            id="btn-cam-top"
            title={t.camTop}
          >
            {t.camTop}
          </button>
          <button
            className="hud-btn"
            id="btn-cam-side"
            title={t.camSide}
          >
            {t.camSide}
          </button>
          <button
            className="hud-btn"
            id="btn-cam-wide"
            title={t.camWide}
          >
            {t.camWide}
          </button>

          <div className="hud-divider" aria-hidden="true"></div>
          <div className="mobile-sheet-section-label">{t.displayAndGestures}</div>

          <button
            className="hud-btn"
            id="btn-hide-ui"
            title={t.hideUi}
            onClick={() => setMobileSheetOpen(false)}
          >
            {t.hideUi}
          </button>

          <button
            className="hud-btn"
            id="btn-sound"
            aria-pressed={soundOn}
            onClick={() => {
              sfx.setMuted(soundOn);
              setSoundOn(!soundOn);
            }}
          >
            {soundOn ? (lang === 'en' ? '🔊 Sound on' : '🔊 소리 켜짐') : (lang === 'en' ? '🔇 Sound off' : '🔇 소리 꺼짐')}
          </button>

          <div className="mobile-sheet-hint">
            {t.mobileHint}
          </div>
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

      <LookPanel open={lookOpen} onClose={() => setLookOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />
      <RivalPanel open={rivalOpen} onClose={() => setRivalOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />
      {lastGame && !villageOpen && (
        <button type="button" className="village-toast" id="village-toast" onClick={() => setVillageOpen(true)}>
          🌰 +{lastGame.coins} · 💗 +{lastGame.hearts} — 마을로 가기
        </button>
      )}
      <VillageView open={villageOpen} onClose={() => { setVillageOpen(false); setLastGame(null); }} lang={lang === 'en' ? 'en' : 'ko'} summary={lastGame} />
    </>
  );
}
