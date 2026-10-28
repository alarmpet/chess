import { useEffect, useRef, useState } from 'react';
import { initWizardChess } from './wizardChessEngine.js';
import { getCurrentLang, getTranslations, setAppLanguage, subscribeLanguage, Language } from './i18n';
import { arcaneEngine, ArcaneState } from './arcaneEngine';
import { arcaneAudio } from './arcaneAudio';
import { lexiconEngine, LexiconState } from './lexiconEngine';
import { LEXICON_WORDS } from './lexiconData';

export default function App() {
  const initializedRef = useRef(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [lang, setLang] = useState<Language>(getCurrentLang());
  const [arcaneState, setArcaneState] = useState<ArcaneState>(arcaneEngine.getState());
  const [lexiconState, setLexiconState] = useState<LexiconState>(lexiconEngine.getState());
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
    const unsubLexicon = lexiconEngine.subscribe((st) => {
      setLexiconState(st);
    });
    return () => unsubLexicon();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        arcaneEngine.cancelSpell();
        if (lexiconState.isGrimoireOpen) {
          lexiconEngine.toggleGrimoire(false);
        }
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
  }, [lexiconState.isGrimoireOpen]);

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
            <span className="brand-title">
              {lang === 'ko' ? '렉시콘 체스: 어원의 성소' : 'Lexicon Chess: Sanctuary'}
            </span>
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

          {/* Lexicon Vocabulary Mastery Pill */}
          <div
            className="lexicon-pill"
            id="btn-lexicon-pill"
            onClick={() => lexiconEngine.toggleGrimoire(true)}
            title={lang === 'ko' ? '성소의 단어장 열기 (어휘 도감)' : 'Open Sanctuary Grimoire'}
          >
            <span>📖</span>
            <span>
              {lang === 'ko'
                ? `${lexiconState.totalMastered}단어 정복`
                : `${lexiconState.totalMastered} Mastered`}
            </span>
            {lexiconState.streak > 1 && (
              <span className="lexicon-streak-fire">
                🔥{lexiconState.streak}{lang === 'ko' ? '연속' : 'x'}
              </span>
            )}
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

          {/* Quick Word Duel Button */}
          <button
            type="button"
            className="hud-btn"
            id="btn-trigger-duel"
            onClick={() => {
              setMobileSheetOpen(false);
              lexiconEngine.triggerDuel({ title: '⚔️ 어휘 룬 챌린지' });
            }}
            title={lang === 'ko' ? '단어 퀴즈 도전 (+1 마나 획득)' : 'Word Duel (+1 Mana)'}
          >
            ⚔️ {lang === 'ko' ? '단어 퀴즈' : 'Word Duel'}
          </button>

          {/* Web Speech API TTS Pronunciation Toggle */}
          <button
            type="button"
            className="hud-btn"
            id="btn-tts-toggle"
            onClick={() => lexiconEngine.toggleTTS()}
            title={lexiconState.ttsEnabled ? '단어 발음 끄기' : '단어 발음 켜기 (Web Speech)'}
          >
            {lexiconState.ttsEnabled ? '🗣️ TTS' : '🔇 TTS'}
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

      {/* Word Duel Modal */}
      {lexiconState.isDuelActive && lexiconState.currentWord && (
        <div className="word-duel-overlay" role="dialog" aria-modal="true">
          <div className="word-duel-modal">
            <div className="duel-badge">⚔️ CATHEDRAL WORD DUEL</div>
            <div className="duel-word-wrap">
              <div className="duel-word-title">{lexiconState.currentWord.word}</div>
              <button
                type="button"
                className="duel-speaker-btn"
                onClick={() => lexiconEngine.replayWordAudio()}
                title="발음 듣기 (Web Speech TTS)"
              >
                🔊
              </button>
            </div>
            <div className="duel-phonetic">{lexiconState.currentWord.phonetic}</div>

            {/* Etymology Breakdown Box */}
            <div className="duel-etymology-box">
              {lexiconState.currentWord.prefix && (
                <span className="duel-etymology-pill">
                  접두사: {lexiconState.currentWord.prefix} ({lexiconState.currentWord.prefixMeaning})
                </span>
              )}
              {lexiconState.currentWord.root && (
                <span className="duel-etymology-pill">
                  어근: {lexiconState.currentWord.root} ({lexiconState.currentWord.rootMeaning})
                </span>
              )}
              {lexiconState.currentWord.suffix && (
                <span className="duel-etymology-pill">
                  접미사: {lexiconState.currentWord.suffix} ({lexiconState.currentWord.suffixMeaning})
                </span>
              )}
              <div style={{ marginTop: '6px' }}>{lexiconState.currentWord.etymologyStory}</div>
            </div>

            {/* 3 Multiple Choice Options */}
            <div className="duel-options-grid">
              {lexiconState.shuffledOptions.map((opt, i) => {
                let btnClass = 'duel-option-btn';
                if (lexiconState.isAnswered) {
                  if (opt === lexiconState.currentWord?.meaningKo) {
                    btnClass += ' correct';
                  } else if (opt === lexiconState.selectedOption) {
                    btnClass += ' wrong';
                  }
                }
                return (
                  <button
                    key={i}
                    type="button"
                    className={btnClass}
                    disabled={lexiconState.isAnswered}
                    onClick={() => lexiconEngine.answerDuel(opt)}
                  >
                    <span>{i + 1}. {opt}</span>
                    {lexiconState.isAnswered && opt === lexiconState.currentWord?.meaningKo && <span>✓ 정답</span>}
                  </button>
                );
              })}
            </div>

            {lexiconState.isAnswered && (
              <div className={`duel-feedback ${lexiconState.isCorrect ? 'success' : 'failure'}`}>
                {lexiconState.isCorrect
                  ? '✦ 정답입니다! (+1 마나 획득 / 룬 각성)'
                  : '✦ 오답입니다. 다음 기회에 복습해보세요!'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cathedral Grimoire Modal (Vocabulary Codex) */}
      {lexiconState.isGrimoireOpen && (
        <div
          className="grimoire-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => lexiconEngine.toggleGrimoire(false)}
        >
          <div
            className="grimoire-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grimoire-header">
              <div className="grimoire-title">
                <span>📖</span>
                <span>{lang === 'ko' ? '성소의 어휘 기록서 (Cathedral Grimoire)' : 'Cathedral Grimoire'}</span>
              </div>
              <button
                type="button"
                className="grimoire-close-btn"
                onClick={() => lexiconEngine.toggleGrimoire(false)}
                title="닫기 (ESC)"
              >
                ✕
              </button>
            </div>
            <div className="grimoire-body">
              {LEXICON_WORDS.map((w) => {
                const isMastered = lexiconState.totalMastered > 0;
                return (
                  <div key={w.id} className="grimoire-card">
                    <div className="grimoire-card-top">
                      <span className="grimoire-card-word">
                        {w.word} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{w.phonetic}</span>
                      </span>
                      <button
                        type="button"
                        className="duel-speaker-btn"
                        style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}
                        onClick={() => lexiconEngine.replayWordAudio(w.word)}
                        title="발음 듣기"
                      >
                        🔊
                      </button>
                    </div>
                    <div className="grimoire-card-meaning">
                      {w.meaningKo} <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>({w.meaningEn})</span>
                    </div>
                    <div className="grimoire-card-etymology">
                      <strong>어원 해설:</strong> {w.etymologyStory}
                    </div>
                    <div className="grimoire-card-example">
                      "{w.exampleSentence}"
                    </div>
                  </div>
                );
              })}
            </div>
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
