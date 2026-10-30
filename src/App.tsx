import LookPanel from './LookPanel';
import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { getCurrentLang, getTranslations, setAppLanguage, subscribeLanguage, Language } from './i18n';
import { arcaneEngine, ArcaneState } from './arcaneEngine';
import { arcaneAudio } from './arcaneAudio';
import { farmEngine, FarmState } from './farmEngine';
import { CROPS, FACILITIES, RESTORATION_ZONES } from './farmData';
import {
  juiceEngine,
  XPState,
  DailyQuest,
  attachCardTilt,
  triggerCardDealAnimation,
} from './juiceEngine';
import { BeastInfo, ALL_BEASTS } from './beastModels';
import { BilliardsView } from './billiards/BilliardsView.tsx';
import { BallStormView } from './ballstorm/BallStormView.tsx';

export default function App() {
  const initializedRef = useRef(false);
  const [appMode, setAppMode] = useState<'ballstorm' | 'billiards' | 'chess'>('ballstorm');
  // The engine binds to the chess HUD once, so that DOM must exist first and stay mounted after the first visit.
  const [chessStarted, setChessStarted] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [questPanelOpen, setQuestPanelOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getCurrentLang());
  const [arcaneState, setArcaneState] = useState<ArcaneState>(arcaneEngine.getState());
  const [farmState, setFarmState] = useState<FarmState>(farmEngine.getState());
  const [xpState, setXpState] = useState<XPState>(juiceEngine.getXPState());
  const [quests, setQuests] = useState<DailyQuest[]>(juiceEngine.getQuests());
  const [pieceSkin, setPieceSkin] = useState<'pack' | '3d_beasts'>('pack');
  const [lookOpen, setLookOpen] = useState(false);
  // Wild mode (PLAN §10-10 · §12.8): spells and hazard tiles are non-rated and off by default.
  const [wildMode, setWildModeState] = useState<boolean>(() => {
    try {
      return new URLSearchParams(window.location.search).get('wild') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const onWild = (e: Event) => setWildModeState(Boolean((e as CustomEvent).detail?.wild));
    window.addEventListener('wildmodechange', onWild);
    return () => window.removeEventListener('wildmodechange', onWild);
  }, []);
  const [selectedBeast, setSelectedBeast] = useState<BeastInfo | null>(null);
  const [codexOpen, setCodexOpen] = useState(false);
  const [codexTab, setCodexTab] = useState<'w' | 'b'>('w');
  const [codexDetailBeast, setCodexDetailBeast] = useState<BeastInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const t = getTranslations(lang);

  // ── Subscribe to XP & Quest state ──
  useEffect(() => {
    const unsubXP = juiceEngine.subscribeXP(setXpState);
    const unsubQ  = juiceEngine.subscribeQuests(setQuests);
    juiceEngine.initJuiceEngine();
    return () => { unsubXP(); unsubQ(); };
  }, []);

  // ── Subscribe to 3D Beast Piece Selection ──
  useEffect(() => {
    (window as any).__onBeastSelect = (beastInfo: BeastInfo | null) => {
      setSelectedBeast(beastInfo);
    };
    return () => {
      delete (window as any).__onBeastSelect;
    };
  }, []);

  // ── Card tilt effect on hand change ──
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.arcane-card');
    const cleanups: (() => void)[] = [];
    cards.forEach(card => { cleanups.push(attachCardTilt(card)); });
    triggerCardDealAnimation();
    return () => cleanups.forEach(fn => fn());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arcaneState.hand.length]);

  useEffect(() => {
    if (appMode === 'chess') setChessStarted(true);
  }, [appMode]);

  useEffect(() => {
    if (!chessStarted || initializedRef.current) return;
    initializedRef.current = true;
    initWizardChess();
  }, [chessStarted]);

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
    const unsubFarm = farmEngine.subscribe((st) => {
      setFarmState(st);
    });
    return () => unsubFarm();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setQuestPanelOpen(false);
        setSelectedBeast(null);
        setCodexDetailBeast(null);
        setCodexOpen(false);
        arcaneEngine.cancelSpell();
        if (farmState.isShopOpen) farmEngine.toggleShop(false);
        if (farmState.isBarnOpen) farmEngine.toggleBarn(false);
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
  }, [farmState.isShopOpen, farmState.isBarnOpen, questPanelOpen]);

  const handleToggleLang = () => {
    const nextLang: Language = lang === 'ko' ? 'en' : 'ko';
    setAppLanguage(nextLang);
  };

  const handleToggleMute = () => {
    const muted = arcaneAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleSkin = () => {
    const nextSkin = pieceSkin === '3d_beasts' ? 'pack' : '3d_beasts';
    setPieceSkin(nextSkin);
    const win = window as any;
    win.wizardChess?.switchChessSkin?.(nextSkin);
  };

  const handleToggleWild = () => {
    const win = window as any;
    const next = !wildMode;
    win.wizardChess?.setWildMode?.(next);
    setWildModeState(next);
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
      {appMode === 'ballstorm' && (
        <BallStormView onSwitchMode={setAppMode} />
      )}

      {appMode === 'billiards' && (
        <BilliardsView onSwitchMode={setAppMode} onBackToChess={() => setAppMode('chess')} />
      )}

      <div
        id="canvas-container"
        style={{ display: appMode === 'chess' ? 'block' : 'none' }}
      ></div>

      {chessStarted && (
        <div style={{ display: appMode === 'chess' ? 'contents' : 'none' }}>
          <div id="loading-overlay">
            <div className="loader-title">{t.loadingTitle}</div>
            <div className="loader-bar-wrap">
              <div className="loader-bar" id="loader-bar"></div>
            </div>
            <div id="loader-text">{t.loadingSub}</div>
          </div>

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
          {/* Universal 3-Mode Switcher: Ball Storm vs 3D Billiards vs Magic Chess */}
          <div className="app-mode-switch-pill">
            <button
              type="button"
              className="app-mode-pill-btn"
              onClick={() => setAppMode('ballstorm')}
            >
              ⚡ 볼 스톰
            </button>
            <button
              type="button"
              className="app-mode-pill-btn"
              onClick={() => setAppMode('billiards')}
            >
              🎱 3D 당구장
            </button>
            <button
              type="button"
              className="app-mode-pill-btn active"
              onClick={() => setAppMode('chess')}
            >
              ♚ 마법 체스
            </button>
          </div>

          <div className="brand-pill">
            <span className="brand-title">
              {lang === 'ko' ? '성소의 정원: 아케인 팜' : 'Sanctuary Garden: Chess & Farm'}
            </span>
          </div>

          <div className="status-pill" id="status-pill">
            <span className="turn-dot" id="turn-dot"></span>
            <span id="turn-text">{t.turnWhite}</span>
            <span className="mode-badge" id="mode-badge">{t.playingAsWhite}</span>
          </div>

          {/* View Toggle Pill (Chessboard vs 3D Garden Courtyard) */}
          <button
            type="button"
            className={`farm-view-btn ${farmState.isGardenView ? 'in-garden' : ''}`}
            id="btn-farm-view"
            onClick={() => farmEngine.toggleGardenView()}
            title={farmState.isGardenView ? '⚔️ 체스 대국장으로 돌아가기' : '🌱 성소 안뜰 정원으로 이동'}
          >
            {farmState.isGardenView ? '⚔️ 체스 대국장' : '🌱 성소 정원'}
          </button>

          {/* Gold, Gems & Sacred Relics Currency Display */}
          <div className="farm-currency-pill" id="farm-currency-pill">
            <span className="farm-gold-item" title="골드 코인 (체스 전투 및 농작물 판매로 획득)">
              <span className="farm-gold-icon">💰</span>
              <span>{farmState.gold}G</span>
            </span>
            <span className="farm-gems-item" title="성소 보석 (체크메이트 승리 시 획득)">
              <span className="farm-gems-icon">💎</span>
              <span>{farmState.gems}</span>
            </span>
            <span className="farm-ash-item" title="정화된 성회 (화로 소각 처형 및 체크메이트 승리 획득)">
              <span className="farm-ash-icon">🔥</span>
              <span>{farmState.sacredAsh}</span>
            </span>
            <span className="farm-marble-item" title="축복받은 대리석 (기둥 격돌 및 체크메이트 승리 획득)">
              <span className="farm-marble-icon">🏛️</span>
              <span>{farmState.marbleDust}</span>
            </span>
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

          {/* XP Progress Bar */}
          <div className="xp-bar-pill" id="xp-bar-pill" title={`레벨 ${xpState.level} — 다음 레벨까지 ${xpState.xpToNext - xpState.xp} XP`}>
            <span className="level-badge">Lv.{xpState.level}</span>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xpState.fillPercent}%` }} />
            </div>
          </div>

          {/* Daily Quest Button */}
          <button
            type="button"
            className="daily-quest-pill"
            onClick={() => setQuestPanelOpen(true)}
            title="오늘의 성소 임무"
          >
            <span className={`quest-dot ${quests.every(q => q.isCompleted) ? 'all-done' : ''}`} />
            📜 {quests.filter(q => q.isCompleted).length}/{quests.length} 임무
          </button>

          {/* Win Streak Counter (only show if streak >= 2) */}
          {xpState.winStreak >= 2 && (
            <div className="win-streak-pill" title={`${xpState.winStreak}연승 중!`}>
              <span className="streak-fire-icon">🔥</span>
              {xpState.winStreak}연승
            </div>
          )}
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

          {/* Seed Shop Button */}
          <button
            type="button"
            className="hud-btn"
            id="btn-open-shop"
            onClick={() => {
              setMobileSheetOpen(false);
              farmEngine.toggleShop(true);
            }}
            title="씨앗 및 정원 시설 상점"
          >
            🛒 상점
          </button>

          {/* Barn Warehouse Button */}
          <button
            type="button"
            className="hud-btn"
            id="btn-open-barn"
            onClick={() => {
              setMobileSheetOpen(false);
              farmEngine.toggleBarn(true);
            }}
            title="수확물 창고 및 버프 현황"
          >
            🎒 창고
          </button>

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

          {/* Piece Skin Toggle (3D Sanctuary Beasts vs Classic Statues) */}
          <button
            type="button"
            className="hud-btn skin-toggle-btn"
            id="btn-skin-toggle"
            onClick={handleToggleSkin}
            title={pieceSkin === '3d_beasts' ? 'WILD CROWN 동물(사자·호랑이·코뿔소·판다·캥거루·미어캣)로 전환' : '3D 성소 영수단(동물 신수 조각상)으로 전환'}
            style={{
              borderColor: pieceSkin === '3d_beasts' ? 'rgba(234, 179, 8, 0.7)' : 'rgba(255, 255, 255, 0.2)',
              color: pieceSkin === '3d_beasts' ? '#fef08a' : '#94a3b8'
            }}
          >
            {pieceSkin === '3d_beasts' ? '🐾 3D 성소 영수단' : '🦁 WILD CROWN'}
          </button>

          {/* Wild mode toggle — spells & hazards (non-rated). Standard chess is the default. */}
          <button
            type="button"
            className="hud-btn"
            id="btn-wild-mode"
            onClick={handleToggleWild}
            title={wildMode ? '표준 체스(랭크 규칙)로 돌아가기' : '야생 모드: 주문 카드·화로·기둥 (비레이팅)'}
            style={{
              borderColor: wildMode ? 'rgba(74, 222, 128, 0.8)' : 'rgba(255, 255, 255, 0.2)',
              color: wildMode ? '#bbf7d0' : '#94a3b8'
            }}
          >
            {wildMode ? '🌿 야생 모드 켜짐' : '♟️ 표준 체스'}
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

          {/* Beast Codex (성소 영수 도감) Button */}
          <button
            type="button"
            className="hud-btn codex-btn"
            id="btn-beast-codex"
            onClick={() => {
              setCodexOpen(true);
              setMobileSheetOpen(false);
            }}
            title={lang === 'ko' ? '성소 영수 도감 열기' : 'Open Beast Codex'}
            style={{
              borderColor: 'rgba(234, 179, 8, 0.6)',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(0, 0, 0, 0.4))',
              color: '#fef08a'
            }}
          >
            📖 {lang === 'ko' ? '영수 도감' : 'Beast Codex'}
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

      {/* Floating Loot Notification Toast */}
      {farmState.lootNotification && (
        <div className="loot-toast-overlay" role="status">
          <div className="loot-toast-box">
            <span>✨</span>
            <span>{farmState.lootNotification}</span>
          </div>
        </div>
      )}

      {/* Floating Arcane Spell Action Banner */}
      {!farmState.isGardenView && arcaneState.bannerMessage && (
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

      {/* GARDEN VIEW TOOLBAR */}
      {farmState.isGardenView ? (
        <div className="garden-dock" id="garden-dock">
          <div className="garden-hint-pill">
            🌱 3D 밭을 마우스로 클릭하면 씨앗 심기, 물주기, 수확을 진행합니다. 체스를 두면 작물이 고속 성장합니다!
          </div>
          <div className="garden-tools-row">
            {Object.keys(CROPS).map((cropKey) => {
              const crop = CROPS[cropKey];
              const count = farmState.seeds[cropKey] || 0;
              const isSelected = farmState.selectedSeedId === cropKey;
              return (
                <button
                  key={cropKey}
                  type="button"
                  className={`garden-seed-btn ${isSelected ? 'active' : ''} ${count === 0 ? 'empty' : ''}`}
                  onClick={() => farmEngine.selectSeed(cropKey)}
                  title={`${crop.name}: ${crop.description} (${crop.buffDescription})`}
                >
                  <span className="seed-btn-icon">{crop.icon}</span>
                  <span className="seed-btn-name">{crop.name.split(' ')[0]}</span>
                  <span className="seed-btn-count">{count}개 보유</span>
                </button>
              );
            })}
            <button
              type="button"
              className="garden-action-btn"
              onClick={() => farmEngine.toggleShop(true)}
            >
              🛒 씨앗 상점
            </button>
            <button
              type="button"
              className="garden-action-btn"
              id="btn-open-restoration"
              onClick={() => farmEngine.toggleShop(true)}
              style={{ background: 'linear-gradient(135deg, rgba(15,118,110,0.4), rgba(13,148,136,0.5))', borderColor: '#5eead4', color: '#ccfbf1' }}
            >
              🏛️ 수도원 복원 ({Object.values(farmState.restorations || {}).filter(Boolean).length}/6)
            </button>
            <button
              type="button"
              className="garden-action-btn"
              onClick={() => farmEngine.toggleBarn(true)}
            >
              🎒 수확 창고
            </button>
          </div>
        </div>
      ) : wildMode ? (
        /* CHESS VIEW: ARCANE CARDS DOCK (wild mode only) */
        <div className="arcane-dock" id="arcane-dock">
          <div className="arcane-cards-row">
            {arcaneState.hand.map((card) => {
              const canAfford = arcaneState.currentMana >= card.cost;
              const isSelected = arcaneState.activeSpell?.id === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  data-card-id={card.id}
                  className={`arcane-card ${isSelected ? 'active' : ''} ${!canAfford ? 'unaffordable' : ''}`}
                  onClick={() => {
                    if (!canAfford) {
                      const el = document.querySelector(`.arcane-card[data-card-id="${card.id}"]`);
                      el?.classList.remove('shake-reject');
                      void (el as HTMLElement)?.offsetWidth;
                      el?.classList.add('shake-reject');
                      return;
                    }
                    arcaneEngine.selectCard(card);
                  }}
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
      ) : null}

      <LookPanel open={lookOpen} onClose={() => setLookOpen(false)} lang={lang === 'en' ? 'en' : 'ko'} />

      {/* SEED & FACILITY SHOP MODAL */}
      {farmState.isShopOpen && (
        <div
          className="farm-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => farmEngine.toggleShop(false)}
        >
          <div className="farm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <div className="farm-modal-title">
                <span>🛒</span>
                <span>성소의 상점 (Sanctuary Merchant)</span>
              </div>
              <button
                type="button"
                className="grimoire-close-btn"
                onClick={() => farmEngine.toggleShop(false)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body">
              <div className="farm-shop-section-title">🌱 마법 씨앗 구매</div>
              <div className="farm-shop-grid">
                {Object.keys(CROPS).map((key) => {
                  const crop = CROPS[key];
                  const canBuy = farmState.gold >= crop.seedCost;
                  return (
                    <div key={key} className="farm-item-card">
                      <div className="farm-item-header">
                        <span className="farm-item-name">
                          <span>{crop.icon}</span>
                          <span>{crop.name}</span>
                        </span>
                        <span style={{ color: '#eab308', fontWeight: 700, fontSize: '0.85rem' }}>
                          {crop.seedCost} Gold
                        </span>
                      </div>
                      <div className="farm-item-desc">{crop.description}</div>
                      <div className="farm-item-buff">✦ {crop.buffDescription}</div>
                      <button
                        type="button"
                        className="farm-buy-btn"
                        disabled={!canBuy}
                        onClick={() => farmEngine.buySeed(key)}
                      >
                        {canBuy ? '씨앗 구매하기' : '골드 부족'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="farm-shop-section-title" style={{ marginTop: '16px' }}>
                🏛️ 정원 시설 및 자동화 건설
              </div>
              <div className="farm-shop-grid">
                {Object.keys(FACILITIES).map((facKey) => {
                  const fac = FACILITIES[facKey];
                  const alreadyBuilt = farmState.facilities[facKey];
                  const canBuy = farmState.gold >= fac.cost && !alreadyBuilt;
                  return (
                    <div key={facKey} className="farm-item-card">
                      <div className="farm-item-header">
                        <span className="farm-item-name">
                          <span>{fac.icon}</span>
                          <span>{fac.name}</span>
                        </span>
                        <span style={{ color: '#eab308', fontWeight: 700, fontSize: '0.85rem' }}>
                          {alreadyBuilt ? '건설 완료' : `${fac.cost} Gold`}
                        </span>
                      </div>
                      <div className="farm-item-desc">{fac.description}</div>
                      <div className="farm-item-buff">✦ {fac.perk}</div>
                      <button
                        type="button"
                        className="farm-buy-btn"
                        disabled={!canBuy}
                        onClick={() => farmEngine.buyFacility(facKey)}
                      >
                        {alreadyBuilt ? '✓ 건설됨' : canBuy ? '건설하기' : '골드 부족'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="farm-shop-section-title" style={{ marginTop: '20px' }}>
                ✨ 대성당 및 수도원 6대 구역 복원 (Monastery Restoration)
              </div>
              <div className="farm-shop-grid">
                {Object.keys(RESTORATION_ZONES).map((zoneKey) => {
                  const zone = RESTORATION_ZONES[zoneKey];
                  const isRestored = Boolean(farmState.restorations && farmState.restorations[zoneKey]);
                  const canAfford =
                    (!zone.cost.gold || farmState.gold >= zone.cost.gold) &&
                    (!zone.cost.gems || farmState.gems >= zone.cost.gems) &&
                    (!zone.cost.sacredAsh || farmState.sacredAsh >= zone.cost.sacredAsh) &&
                    (!zone.cost.marbleDust || farmState.marbleDust >= zone.cost.marbleDust) &&
                    !isRestored;

                  return (
                    <div key={zoneKey} className={`farm-item-card ${isRestored ? 'restored-card' : ''}`}>
                      <div className="farm-item-header">
                        <span className="farm-item-name">
                          <span>{zone.icon}</span>
                          <span>{zone.name}</span>
                        </span>
                        <span style={{ color: isRestored ? '#86efac' : '#38bdf8', fontWeight: 700, fontSize: '0.82rem' }}>
                          {isRestored ? '✓ 복원 완료' : '미복원'}
                        </span>
                      </div>
                      <div className="farm-item-desc">{zone.description}</div>
                      <div className="farm-item-buff">✦ {zone.perkDescription}</div>
                      <div className="restoration-costs-pills">
                        {zone.cost.marbleDust && <span className="cost-tag marble">🏛️ {zone.cost.marbleDust} 대리석</span>}
                        {zone.cost.sacredAsh && <span className="cost-tag ash">🔥 {zone.cost.sacredAsh} 성회</span>}
                        {zone.cost.gems && <span className="cost-tag gems">💎 {zone.cost.gems} 보석</span>}
                        {zone.cost.gold && <span className="cost-tag gold">💰 {zone.cost.gold}G</span>}
                      </div>
                      <button
                        type="button"
                        className={`farm-buy-btn ${isRestored ? 'restored' : ''}`}
                        disabled={isRestored || !canAfford}
                        onClick={() => farmEngine.restoreZone(zoneKey)}
                        style={{ marginTop: '8px' }}
                      >
                        {isRestored ? '✅ 복원 완료 (영구 적용 중)' : canAfford ? '🏛️ 구역 복원하기' : '자재 부족'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARN / HARVEST WAREHOUSE MODAL */}
      {farmState.isBarnOpen && (
        <div
          className="farm-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => farmEngine.toggleBarn(false)}
        >
          <div className="farm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="farm-modal-header">
              <div className="farm-modal-title">
                <span>🎒</span>
                <span>수확물 창고 & 버프 현황 (Sanctuary Barn)</span>
              </div>
              <button
                type="button"
                className="grimoire-close-btn"
                onClick={() => farmEngine.toggleBarn(false)}
              >
                ✕
              </button>
            </div>
            <div className="farm-modal-body">
              <div className="farm-shop-section-title">🌾 수확한 마법 작물</div>
              <div className="farm-shop-grid">
                {Object.keys(CROPS).map((key) => {
                  const crop = CROPS[key];
                  const count = farmState.harvested[key] || 0;
                  return (
                    <div key={key} className="farm-item-card">
                      <div className="farm-item-header">
                        <span className="farm-item-name">
                          <span>{crop.icon}</span>
                          <span>{crop.name}</span>
                        </span>
                        <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
                          보유: {count}개
                        </span>
                      </div>
                      <div className="farm-item-desc">{crop.buffDescription}</div>
                      <button
                        type="button"
                        className="farm-buy-btn"
                        disabled={count <= 0}
                        onClick={() => farmEngine.sellHarvested(key, 1)}
                      >
                        {count > 0 ? `1개 판매 (+${crop.sellPrice}G)` : '보유량 없음'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="farm-shop-section-title" style={{ marginTop: '16px' }}>
                🏛️ 수도원 복원 성물 자재 (Cathedral Relics)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div className="farm-item-card">
                  <div className="farm-item-header">
                    <span className="farm-item-name">
                      <span>🔥</span>
                      <span>정화된 성회 (Sacred Ash)</span>
                    </span>
                    <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.9rem' }}>
                      {farmState.sacredAsh}개
                    </span>
                  </div>
                  <div className="farm-item-desc">
                    화로 소각 처형 및 체크메이트 승리로 획득. 수도원 허브 밭 비옥화 재료입니다.
                  </div>
                </div>
                <div className="farm-item-card">
                  <div className="farm-item-header">
                    <span className="farm-item-name">
                      <span>🏛️</span>
                      <span>축복받은 대리석 (Marble Dust)</span>
                    </span>
                    <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
                      {farmState.marbleDust}개
                    </span>
                  </div>
                  <div className="farm-item-desc">
                    기둥 격돌 분쇄 및 체크메이트 승리로 획득. 수도원 회랑 복원 필수 자재입니다.
                  </div>
                </div>
              </div>

              <div className="farm-shop-section-title" style={{ marginTop: '16px' }}>
                ✨ 현재 활성화된 체스 버프 현황
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                <div>✦ 수도원 복원 진척도: {Object.values(farmState.restorations || {}).filter(Boolean).length}/6 구역 복원 완료</div>
                <div>✦ 시작 마나 보너스: +{farmState.activeBuffs.manaBonus} (최대 {3 + farmState.activeBuffs.manaBonus} 마나)</div>
                <div>✦ 코인 획득 배율: x{farmState.activeBuffs.goldMultiplier}</div>
                <div>✦ 메테오 십자 폭발: {farmState.activeBuffs.meteorCross ? '🔥 활성화됨' : '미적용'}</div>
                <div>✦ 킹 생명초 부활: {farmState.activeBuffs.kingRevive ? '🌿 활성화됨' : '미적용'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="hud-bottom">
        <div className="hint-pill" id="controls-hint">
          {t.desktopHint}
        </div>
        {!farmState.isGardenView && wildMode && (
          <div className="hazard-legend-pill" id="hazard-legend-pill">
            <span>🔥 {lang === 'ko' ? '화로: 소각 처형 (성회 획득)' : 'Brazier: Incinerate'}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>🗿 {lang === 'ko' ? '기둥: 진입 불가 장애물' : 'Pillar: Impassable'}</span>
          </div>
        )}
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

          {/* Sequential Reward Reveal Breakdown (Balatro / RPG style) */}
          <div style={{ margin: '14px 0 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="checkmate-reward-row" style={{ animationDelay: '0.35s' }}>
              <span>⚔️ 승리 영예 보상</span>
              <span style={{ marginLeft: 'auto', color: '#fde047' }}>+250G · +40 XP</span>
            </div>
            <div className="checkmate-reward-row" style={{ animationDelay: '0.65s' }}>
              <span>💎 체크메이트 성소 보석</span>
              <span style={{ marginLeft: 'auto', color: '#38bdf8' }}>+3💎</span>
            </div>
            <div className="checkmate-reward-row" style={{ animationDelay: '0.95s' }}>
              <span>🔥 대성당 화형 정화 성회</span>
              <span style={{ marginLeft: 'auto', color: '#fb923c' }}>+5🔥 성회</span>
            </div>
            <div className="checkmate-reward-row" style={{ animationDelay: '1.25s' }}>
              <span>🏛️ 고딕 성당 축복 대리석</span>
              <span style={{ marginLeft: 'auto', color: '#7dd3fc' }}>+5🏛️ 대리석</span>
            </div>
            <div className="checkmate-reward-divider"></div>
            <div className="checkmate-reward-row total-row" style={{ animationDelay: '1.55s' }}>
              <span>✨ 총 획득 전리품</span>
              <span style={{ marginLeft: 'auto' }}>+250G · 3💎 · 5🔥 · 5🏛️</span>
            </div>
          </div>

          <div className="checkmate-actions">
            <button
              type="button"
              className="checkmate-btn"
              id="btn-checkmate-garden"
              style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)', borderColor: '#86efac', color: '#fff', fontWeight: 700 }}
              onClick={() => {
                farmEngine.toggleGardenView(true);
                document.getElementById('checkmate-overlay')?.classList.remove('visible');
              }}
            >
              🌱 {lang === 'ko' ? '수도원 정원으로 이동' : 'Visit Sanctuary Garden'}
            </button>
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

      {/* DAILY QUEST MODAL */}
      {questPanelOpen && (
        <div
          className="quest-panel-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setQuestPanelOpen(false)}
        >
          <div className="quest-panel" onClick={(e) => e.stopPropagation()}>
            <div className="quest-panel-header">
              <div className="quest-panel-title">
                <span>📜</span>
                <span>오늘의 성소 임무 (Daily Quests)</span>
              </div>
              <button
                type="button"
                className="grimoire-close-btn"
                onClick={() => setQuestPanelOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="quest-panel-body">
              {quests.map((q) => {
                const fillPct = Math.min(100, (q.progress / q.target) * 100);
                return (
                  <div key={q.id} className={`quest-item ${q.isCompleted ? 'completed' : ''}`}>
                    <span className="quest-item-icon">{q.icon}</span>
                    <div className="quest-item-body">
                      <div className="quest-item-title">{q.title}</div>
                      <div className="quest-item-progress-track">
                        <div
                          className={`quest-item-progress-fill ${q.isCompleted ? 'full' : ''}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <div className="quest-item-counter">
                        {q.progress} / {q.target}
                      </div>
                    </div>
                    <div className="quest-item-reward">
                      {q.reward.gold && <span className="quest-reward-tag">+{q.reward.gold}G</span>}
                      {q.reward.gems && <span className="quest-reward-tag">+{q.reward.gems}💎</span>}
                      {q.reward.ash && <span className="quest-reward-tag">+{q.reward.ash}🔥</span>}
                      {q.reward.marble && <span className="quest-reward-tag">+{q.reward.marble}🏛️</span>}
                      {q.reward.xp && <span className="quest-reward-tag">+{q.reward.xp} XP</span>}
                    </div>
                    {q.isCompleted && <span className="quest-check">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Active Beast Inspection Card (Nano Banana 2.1 AAA Asset View) ── */}
      {selectedBeast && (
        <div
          className={`beast-inspection-card ${selectedBeast.color === 'w' ? 'white-beast' : 'black-beast'}`}
          id="beast-inspection-card"
        >
          <div className="beast-card-header">
            <span className="beast-card-symbol">{selectedBeast.chessSymbol}</span>
            <div className="beast-card-names">
              <div className="beast-card-name-ko">{selectedBeast.nameKo}</div>
              <div className="beast-card-name-en">{selectedBeast.nameEn}</div>
            </div>
            <button
              type="button"
              className="beast-card-close-btn"
              onClick={() => setSelectedBeast(null)}
              title="닫기"
            >
              ✕
            </button>
          </div>

          <div className="beast-card-portrait-wrapper">
            <img
              src={selectedBeast.imageUrl}
              alt={selectedBeast.nameKo}
              className="beast-card-portrait-img"
              loading="eager"
            />
            <div className="beast-card-badge-row">
              <span className="beast-role-pill">{selectedBeast.chessRoleKo}</span>
              <span className="beast-value-pill">가치 {selectedBeast.value}</span>
            </div>
            <div className="beast-card-foil-shine" />
          </div>

          <div className="beast-card-body">
            <div className="beast-card-quote">“{selectedBeast.quoteKo}”</div>

            <div className="beast-card-trait-box">
              <div className="beast-trait-header">
                <span className="beast-trait-icon">⚔️</span>
                <span className="beast-trait-title">{selectedBeast.traitNameKo}</span>
              </div>
              <div className="beast-trait-desc">{selectedBeast.traitDescKo}</div>
            </div>

            <div className="beast-card-move-box">
              <span className="beast-move-icon">👟</span>
              <span className="beast-move-desc">{selectedBeast.moveDescKo}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Sanctuary Beast Codex Modal (성소 영수 도감) ── */}
      {codexOpen && (
        <div
          className="grimoire-overlay beast-codex-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (codexDetailBeast) setCodexDetailBeast(null);
              else setCodexOpen(false);
            }
          }}
        >
          <div className="beast-codex-modal" role="dialog" aria-modal="true">
            <div className="beast-codex-header">
              <div className="beast-codex-title">
                <span className="codex-icon">📖</span>
                <span>성소 영수 도감 (Sanctuary Beasts Codex)</span>
              </div>
              <div className="beast-codex-tab-group">
                <button
                  type="button"
                  className={`codex-tab-btn ${codexTab === 'w' ? 'active white-tab' : ''}`}
                  onClick={() => { setCodexTab('w'); setCodexDetailBeast(null); }}
                >
                  ✨ 백색 성소 영수단 (6)
                </button>
                <button
                  type="button"
                  className={`codex-tab-btn ${codexTab === 'b' ? 'active black-tab' : ''}`}
                  onClick={() => { setCodexTab('b'); setCodexDetailBeast(null); }}
                >
                  🌋 흑요석 심연 영수단 (6)
                </button>
              </div>
              <button
                type="button"
                className="grimoire-close-btn"
                onClick={() => { setCodexDetailBeast(null); setCodexOpen(false); }}
              >
                ✕
              </button>
            </div>

            <div className="beast-codex-content">
              {/* Card Grid */}
              <div className="beast-codex-grid">
                {ALL_BEASTS.filter((b) => b.color === codexTab).map((beast) => (
                  <div
                    key={beast.id}
                    className={`beast-codex-card ${beast.color === 'w' ? 'white-card' : 'black-card'} ${codexDetailBeast?.id === beast.id ? 'selected' : ''}`}
                    onClick={() => setCodexDetailBeast(beast)}
                  >
                    <div className="codex-card-thumb-wrap">
                      <img src={beast.imageUrl} alt={beast.nameKo} className="codex-card-thumb" />
                      <span className="codex-card-symbol">{beast.chessSymbol}</span>
                      <div className="codex-card-foil" />
                    </div>
                    <div className="codex-card-info">
                      <div className="codex-card-role">{beast.chessRoleKo}</div>
                      <div className="codex-card-name">{beast.nameKo}</div>
                      <div className="codex-card-trait-preview">{beast.traitNameKo}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Panel */}
              {codexDetailBeast && (
                <div className={`beast-codex-detail-pane ${codexDetailBeast.color === 'w' ? 'white-pane' : 'black-pane'}`}>
                  <div className="detail-pane-img-wrap">
                    <img src={codexDetailBeast.imageUrl} alt={codexDetailBeast.nameKo} className="detail-pane-img" />
                    <div className="detail-pane-symbol">{codexDetailBeast.chessSymbol}</div>
                  </div>
                  <div className="detail-pane-info">
                    <div className="detail-pane-role-pill">{codexDetailBeast.chessRoleKo}</div>
                    <h3 className="detail-pane-title">{codexDetailBeast.nameKo}</h3>
                    <div className="detail-pane-subtitle">{codexDetailBeast.nameEn} · {codexDetailBeast.titleKo}</div>
                    <p className="detail-pane-quote">“{codexDetailBeast.quoteKo}”</p>
                    <div className="detail-pane-section">
                      <div className="detail-section-label">⚡ 영수 고유 특성: {codexDetailBeast.traitNameKo}</div>
                      <div className="detail-section-desc">{codexDetailBeast.traitDescKo}</div>
                    </div>
                    <div className="detail-pane-section">
                      <div className="detail-section-label">♟️ 체스 전술 기동:</div>
                      <div className="detail-section-desc">{codexDetailBeast.moveDescKo}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </>
  );
}
