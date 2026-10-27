import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { getCurrentLang, getTranslations, setAppLanguage, subscribeLanguage, Language } from './i18n';
import { arcaneEngine, ArcaneState } from './arcaneEngine';
import { arcaneAudio } from './arcaneAudio';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getCurrentLang());
  const [arcaneState, setArcaneState] = useState<ArcaneState>(arcaneEngine.getState());
  const [isMuted, setIsMuted] = useState(false);
  const t = getTranslations(lang);

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
    const unsubArcane = arcaneEngine.subscribe((st) => {
      setArcaneState(st);
    });
    return () => unsubArcane();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        arcaneEngine.cancelSpell();
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

  const handleToggleMute = () => {
    const muted = arcaneAudio.toggleMute();
    setIsMuted(muted);
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
            <span className="brand-title">{lang === 'ko' ? '아케인 체스: 영혼의 성소' : 'Arcane Chess: Sanctuary'}</span>
          </div>
          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">{t.turnWhite}</span>
            <span className="mode-badge" id="mode-badge">{t.playingAsWhite}</span>
          </div>

          {/* Arcane Mana Crystal Pill */}
          <div className="mana-pill" id="mana-pill" title={lang === 'ko' ? '아케인 마나' : 'Arcane Mana'}>
            <span className="mana-gem-icon">✦</span>
            <span className="mana-count">{arcaneState.currentMana}/{arcaneState.maxMana}</span>
            <div className="mana-dots">
              {Array.from({ length: arcaneState.maxMana }).map((_, idx) => (
                <span
                  key={idx}
                  className={`mana-dot ${idx < arcaneState.currentMana ? 'filled' : 'spent'}`}
                />
              ))}
            </div>
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

          {/* Audio Sound Toggle */}
          <button
            type="button"
            className="hud-btn audio-toggle-btn"
            id="btn-audio-toggle"
            onClick={handleToggleMute}
            title={isMuted ? (lang === 'ko' ? '음소거 해제' : 'Unmute Sound') : (lang === 'ko' ? '음소거' : 'Mute Sound')}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

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
            onClick={() => {
              arcaneEngine.cancelSpell();
              arcaneEngine.refillHand();
              setMobileSheetOpen(false);
            }}
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

          <div className="mobile-sheet-hint">
            {t.mobileHint}
          </div>
        </div>
      </div>

      {/* Floating Arcane Spell Action Banner */}
      {arcaneState.bannerMessage && (
        <div className="arcane-banner-overlay" role="alert">
          <div className="arcane-banner-box">
            <span className="arcane-banner-text">{arcaneState.bannerMessage}</span>
            {arcaneState.activeSpell && (
              <button
                type="button"
                className="arcane-cancel-btn"
                onClick={() => arcaneEngine.cancelSpell()}
                title="주문 취소 (ESC)"
              >
                ✕ {lang === 'ko' ? '취소' : 'Cancel'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Arcane Cards Dock */}
      <div className="arcane-dock" id="arcane-dock">
        <div className="arcane-cards-row">
          {arcaneState.hand.map((card) => {
            const canAfford = arcaneState.currentMana >= card.cost;
            const isSelected = arcaneState.activeSpell?.id === card.id;
            return (
              <button
                key={card.id}
                type="button"
                className={`arcane-card ${isSelected ? 'active' : ''} ${!canAfford ? 'unaffordable' : ''}`}
                onClick={() => arcaneEngine.selectCard(card)}
                title={lang === 'ko' ? card.desc : card.descEn}
              >
                <div className="arcane-card-top">
                  <span className="card-cost">{card.cost} ✦</span>
                  <span className="card-icon">{card.icon}</span>
                </div>
                <div className="card-name">{lang === 'ko' ? card.name : card.nameEn}</div>
                <div className="card-desc">{lang === 'ko' ? card.desc : card.descEn}</div>
              </button>
            );
          })}
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
    </>
  );
}
