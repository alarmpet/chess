/**
 * BallStormView.tsx — Ball Storm Chaos Cyberpunk 3D HUD & React View
 *
 * Implements:
 *  - Fullscreen 3D WebGL viewport integration
 *  - Real-time Neon Cyber HUD (Score, High Score, Combo Fire, Next-2 Ball Hologram)
 *  - Fever Overdrive Gauge & Fullscreen Adrenaline Vignette
 *  - Floating 3D-to-Screen Score & Combo Damage Popups
 *  - Container Tension / Danger Fill Gauge
 *  - Balatro-Style 3D Holographic Foil Upgrade Cards with Mouse Tilt
 *  - Rich WebAudio haptic feedback (hover, click, merge, fever)
 *  - Mode Switcher Pill ([⚡ 볼 스톰], [🎱 3D 당구장], [♚ 마법 체스])
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ballStormEngine,
  type BallStormState,
  type CardUpgrade,
  type FloatingText
} from './ballstormEngine.ts';
import { BALL_TIERS } from './ballstormPhysics.ts';
import { ballStormAudio } from './ballstormAudio.ts';

interface BallStormViewProps {
  onSwitchMode: (mode: 'ballstorm' | 'billiards' | 'chess') => void;
}

export const BallStormView: React.FC<BallStormViewProps> = ({ onSwitchMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<BallStormState>(ballStormEngine.getState());
  const [isMuted, setIsMuted] = useState(ballStormAudio.getMuted());
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // Initialize 3D Engine on Mount
  useEffect(() => {
    if (!containerRef.current) return;
    ballStormEngine.init(containerRef.current);

    const unsub = ballStormEngine.subscribe((st) => {
      setGameState({ ...st });
    });

    return () => {
      unsub();
      ballStormEngine.destroy();
    };
  }, []);

  const handleToggleMute = () => {
    ballStormAudio.playClick();
    const muted = ballStormAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.setProperty('--rx', `${-y * 22}deg`);
    e.currentTarget.style.setProperty('--ry', `${x * 22}deg`);
    e.currentTarget.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--rx', '0deg');
    e.currentTarget.style.setProperty('--ry', '0deg');
    e.currentTarget.style.setProperty('--mx', '50%');
    e.currentTarget.style.setProperty('--my', '50%');
  };

  const currentTierData = BALL_TIERS[gameState.currentTier - 1] || BALL_TIERS[0];
  const nextTierData = BALL_TIERS[gameState.nextTier - 1] || BALL_TIERS[0];
  const nextNextTierData = BALL_TIERS[gameState.nextNextTier - 1] || BALL_TIERS[0];

  return (
    <div className={`ballstorm-root ${gameState.isFeverActive ? 'fever-mode-active' : ''}`}>
      {/* 3D WebGL Viewport */}
      <div id="ballstorm-viewport" ref={containerRef} className="ballstorm-viewport" />

      {/* Fullscreen Adrenaline Fever Vignette */}
      {gameState.isFeverActive && <div className="fever-screen-vignette" />}

      {/* Floating 3D-to-Screen Score & Combo Damage Popups */}
      <div className="floating-text-layer" aria-hidden="true">
        {gameState.floatingTexts.map((ft: FloatingText) => (
          <div
            key={ft.id}
            className="floating-score-item"
            style={{
              left: `${ft.x}px`,
              top: `${ft.y}px`,
              color: ft.color,
              transform: `scale(${ft.scale})`,
              textShadow: `0 0 16px ${ft.color}, 0 2px 6px rgba(0,0,0,0.9)`,
            }}
          >
            <div className="floating-score-num">{ft.text}</div>
            {ft.comboText && <div className="floating-score-combo">{ft.comboText}</div>}
          </div>
        ))}
      </div>

      {/* Top Cyber HUD Bar */}
      <header className="ballstorm-top-bar">
        <div className="ballstorm-top-left">
          {/* Universal 3-Mode Switcher */}
          <div className="app-mode-switch-pill">
            <button
              type="button"
              className="app-mode-pill-btn active"
              title="볼 스톰 카오스 (초고속 3D 합성 로그라이크)"
              onMouseEnter={() => ballStormAudio.playHover()}
            >
              ⚡ 볼 스톰
            </button>
            <button
              type="button"
              className="app-mode-pill-btn"
              onClick={() => {
                ballStormAudio.playClick();
                onSwitchMode('billiards');
              }}
              onMouseEnter={() => ballStormAudio.playHover()}
              title="3D 정통 당구장으로 전환"
            >
              🎱 3D 당구장
            </button>
            <button
              type="button"
              className="app-mode-pill-btn"
              onClick={() => {
                ballStormAudio.playClick();
                onSwitchMode('chess');
              }}
              onMouseEnter={() => ballStormAudio.playHover()}
              title="마법 체스 대국장으로 전환"
            >
              ♚ 마법 체스
            </button>
          </div>

          <div className="ballstorm-brand-pill">
            <span className="brand-bolt">⚡</span>
            <div className="brand-texts">
              <span className="brand-name">BALL STORM CHAOS</span>
              <span className="brand-sub">3D 머지 로그라이크</span>
            </div>
          </div>
        </div>

        {/* Center: Score, Combo, & Fever Overdrive Gauge */}
        <div className="ballstorm-top-center">
          <div className="score-counter-pill">
            <div className="score-main-group">
              <span className="score-label">SCORE</span>
              <span className="score-digits">{gameState.score.toLocaleString()}</span>
            </div>
            <div className="score-divider-line" />
            <div className="high-score-group">
              <span className="score-label">BEST</span>
              <span className="score-digits best">{gameState.highScore.toLocaleString()}</span>
            </div>
            {gameState.combo > 0 && (
              <>
                <div className="score-divider-line" />
                <div className="combo-flame-group">
                  <span className="combo-count">{gameState.combo} COMBO</span>
                  <span className="multiplier-badge">x{gameState.comboMultiplier}</span>
                </div>
              </>
            )}
          </div>

          {/* Luxury Fever Overdrive Bar */}
          <div
            className={`fever-overdrive-pill ${gameState.isFeverActive ? 'fever-active' : ''}`}
            title="합성 시 충전되는 피버 게이지! 100% 도달 시 8초간 3배 점수 & 초고속 머신건 연사!"
          >
            <div className="fever-pill-header">
              <span className="fever-bolt">{gameState.isFeverActive ? '🔥' : '⚡'}</span>
              <span className="fever-title">
                {gameState.isFeverActive
                  ? `FEVER OVERDRIVE 3X (${gameState.feverTimeRemaining}s)`
                  : `FEVER GAUGE ${gameState.feverEnergy}%`}
              </span>
              {gameState.feverEnergy >= 100 && !gameState.isFeverActive && (
                <span className="fever-ready-badge">READY!</span>
              )}
            </div>
            <div className="fever-bar-track">
              <div
                className="fever-bar-fill"
                style={{ width: `${gameState.feverEnergy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Right: Holographic Next-2 Ball Queue & Controls */}
        <div className="ballstorm-top-right">
          {/* Holographic Next-2 Ball Queue Capsule */}
          <div className="next-ball-queue-capsule" title="투하 대기 큐 (Next 1 & Next 2)">
            <div className="queue-slot current-slot" title={`현재 조준 중: ${currentTierData.label}번 볼`}>
              <span className="slot-label">HOLD</span>
              <div
                className="queue-ball-sphere current"
                style={{
                  backgroundColor: `#${currentTierData.color.toString(16).padStart(6, '0')}`,
                  boxShadow: `0 0 14px #${currentTierData.color.toString(16).padStart(6, '0')}aa`,
                }}
              >
                <span>{currentTierData.label}</span>
              </div>
            </div>

            <div className="queue-arrow">▶</div>

            <div className="queue-slot next1-slot" title={`다음 볼: ${nextTierData.label}번 볼`}>
              <span className="slot-label">NEXT</span>
              <div
                className="queue-ball-sphere next1"
                style={{
                  backgroundColor: `#${nextTierData.color.toString(16).padStart(6, '0')}`,
                  boxShadow: `0 0 16px #${nextTierData.color.toString(16).padStart(6, '0')}cc`,
                }}
              >
                <span>{nextTierData.label}</span>
              </div>
            </div>

            <div className="queue-slot next2-slot" title={`그 다음 볼: ${nextNextTierData.label}번 볼`}>
              <span className="slot-label">+1</span>
              <div
                className="queue-ball-sphere next2"
                style={{
                  backgroundColor: `#${nextNextTierData.color.toString(16).padStart(6, '0')}`,
                  boxShadow: `0 0 10px #${nextNextTierData.color.toString(16).padStart(6, '0')}77`,
                }}
              >
                <span>{nextNextTierData.label}</span>
              </div>
            </div>
          </div>

          {/* Rules Modal Button */}
          <button
            type="button"
            className="ballstorm-icon-btn"
            onClick={() => {
              ballStormAudio.playClick();
              setRuleModalOpen(true);
            }}
            onMouseEnter={() => ballStormAudio.playHover()}
            title="게임 방법 및 볼 합성 도감"
          >
            📖
          </button>

          {/* Reset Button */}
          <button
            type="button"
            className="ballstorm-icon-btn"
            onClick={() => {
              ballStormAudio.playClick();
              ballStormEngine.resetGame();
            }}
            onMouseEnter={() => ballStormAudio.playHover()}
            title="게임 새로 시작 (R)"
          >
            🔄
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            className="ballstorm-icon-btn"
            onClick={handleToggleMute}
            onMouseEnter={() => ballStormAudio.playHover()}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Vertical Container Tension / Danger Gauge (Right Edge) */}
      <aside className="container-tension-meter" title="경기장 높이 적재 긴장도">
        <span className="tension-label">TENSION</span>
        <div className="tension-track">
          <div
            className={`tension-fill ${
              gameState.fillPercent > 80
                ? 'critical'
                : gameState.fillPercent > 50
                ? 'warning'
                : 'normal'
            }`}
            style={{ height: `${gameState.fillPercent}%` }}
          />
          <div className="tension-danger-marker" style={{ bottom: '85%' }} title="위험 한계선" />
        </div>
        <span className={`tension-percent ${gameState.fillPercent > 80 ? 'critical' : ''}`}>
          {gameState.fillPercent}%
        </span>
      </aside>

      {/* Active Modifiers Bar */}
      <div className="active-buffs-bar">
        {performance.now() < gameState.activeModifiers.magneticUntil && (
          <div className="buff-tag magnetic">
            <span>🧲</span> 마그네틱 자력 활성!
          </div>
        )}
        {performance.now() < gameState.activeModifiers.zeroGUntil && (
          <div className="buff-tag zerog">
            <span>🌌</span> 무중력 시공간!
          </div>
        )}
        {performance.now() < gameState.activeModifiers.slowMoUntil && (
          <div className="buff-tag slowmo">
            <span>⏳</span> 크로노 2배 콤보!
          </div>
        )}
        {gameState.activeModifiers.hasMegaBomb && (
          <div className="buff-tag megabomb">
            <span>💥</span> 다음 투하: 메가 블래스터 장전!
          </div>
        )}
      </div>

      {/* Danger Line Alarm Banner */}
      {gameState.dangerActive && (
        <div className="danger-alarm-banner animate-bounce">
          <span className="danger-icon">⚠️</span>
          <span className="danger-text">위험! 볼이 상단 위험선에 도달했습니다! 신속히 합성하세요!</span>
        </div>
      )}

      {/* Bottom Floating Hint */}
      <footer className="ballstorm-bottom-hint">
        <span className="hint-pill">
          💡 마우스 좌우 조준 &nbsp;|&nbsp; 클릭 / Space: 낙하 &nbsp;|&nbsp; 동일 번호 충돌 시 상위 볼 합성 &nbsp;|&nbsp; 피버 시 3배 점수 & 머신건!
        </span>
      </footer>

      {/* 🎰 Roguelike 3-Card Slot Machine Upgrade Modal (Balatro Holographic 3D Tilt) */}
      {gameState.activeCards && (
        <div className="ballstorm-modal-backdrop">
          <div className="card-selection-modal">
            <div className="card-modal-header">
              <span className="card-modal-badge">🎰 ROGUELIKE REWARD</span>
              <h2 className="card-modal-title">로그라이크 아티팩트를 선택하세요!</h2>
              <p className="card-modal-sub">합성 연쇄를 극대화할 초능력을 1개 획득합니다</p>
            </div>

            <div className="cards-grid-row">
              {gameState.activeCards.map((card) => (
                <div
                  key={card.id}
                  className={`upgrade-card-item rarity-${card.rarity}`}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  onMouseEnter={() => ballStormAudio.playHover()}
                  onClick={() => {
                    ballStormAudio.playClick();
                    ballStormEngine.selectCardUpgrade(card.id);
                  }}
                  style={{
                    borderColor: card.color,
                    boxShadow: `0 14px 40px rgba(0,0,0,0.8), 0 0 24px ${card.color}44`,
                  }}
                >
                  <div className="card-foil-overlay" />
                  <div className="card-rarity-tag" style={{ color: card.color }}>
                    {card.rarity.toUpperCase()}
                  </div>
                  <div className="card-hero-icon">{card.icon}</div>
                  <h3 className="card-name" style={{ color: card.color }}>{card.title}</h3>
                  <p className="card-description">{card.desc}</p>
                  <button
                    type="button"
                    className="card-select-btn"
                    style={{ background: card.color }}
                  >
                    선택하기
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 💀 Game Over Modal */}
      {gameState.isGameOver && (
        <div className="ballstorm-modal-backdrop">
          <div className="game-over-modal-card">
            <div className="game-over-skull">💀</div>
            <h2 className="game-over-title">GAME OVER</h2>
            <p className="game-over-sub">볼 더미가 한계선을 넘어 붕괴했습니다!</p>

            <div className="final-stats-box">
              <div className="stat-row">
                <span>최종 점수</span>
                <span className="stat-val yellow">{gameState.score.toLocaleString()} 점</span>
              </div>
              <div className="stat-row">
                <span>최고 기록</span>
                <span className="stat-val cyan">{gameState.highScore.toLocaleString()} 점</span>
              </div>
              <div className="stat-row">
                <span>경기장 볼 개수</span>
                <span className="stat-val">{gameState.ballCount} 개</span>
              </div>
            </div>

            <button
              type="button"
              className="instant-restart-btn"
              onClick={() => {
                ballStormAudio.playClick();
                ballStormEngine.resetGame();
              }}
              onMouseEnter={() => ballStormAudio.playHover()}
            >
              ⚡ 0.1초 즉시 재도전 (Space)
            </button>
          </div>
        </div>
      )}

      {/* 📖 Rules & Ball Evolution Tree Modal */}
      {ruleModalOpen && (
        <div className="ballstorm-modal-backdrop" onClick={() => setRuleModalOpen(false)}>
          <div className="rules-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚡ 볼 스톰 카오스 (Ball Storm Chaos) 플레이 가이드</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  ballStormAudio.playClick();
                  setRuleModalOpen(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="guide-section">
                <h3>🎮 게임 핵심 규칙</h3>
                <p>
                  하늘에서 떨어지는 3D 당구공을 좌우로 조준하여 투하하세요.
                  <strong> 동일한 번호의 볼 2개가 충돌하면 다음 상위 번호의 볼로 즉시 합성</strong>되며
                  화려한 크리스털 파편 충격파와 함께 점수가 폭발합니다!
                </p>
              </div>

              <div className="guide-section">
                <h3>🔥 피버 오버드라이브 (Fever Overdrive)</h3>
                <p>
                  볼이 합성될 때마다 상단 피버 게이지가 급속 충전됩니다. <strong>100% 충전 시 8초간 피버 모드가 발동</strong>하여
                  모든 점수가 <strong>3배로 폭증</strong>하며, 볼 투하 딜레이가 <strong>0.08초 머신건 수준</strong>으로 단축됩니다!
                </p>
              </div>

              <div className="guide-section">
                <h3>🔮 16단계 볼 진화 트리</h3>
                <div className="evolution-tree-grid">
                  {BALL_TIERS.map((td) => (
                    <div key={td.tier} className="evolution-tier-badge">
                      <div
                        className="tier-ball-circle"
                        style={{ backgroundColor: `#${td.color.toString(16).padStart(6, '0')}` }}
                      >
                        {td.label}
                      </div>
                      <span className="tier-name">{td.tier}단계</span>
                      <span className="tier-points">+{td.scoreValue}점</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="guide-section">
                <h3>✨ REA 역공학 물리 & Juice 연출</h3>
                <ul>
                  <li><strong>서브스텝 터널링 방지:</strong> 초고속 낙하 시에도 공이 뚫고 지나가지 않는 무결점 충돌</li>
                  <li><strong>방사형 충격파 (Shockwave):</strong> 합성이 일어날 때마다 주변 볼들을 밀어내어 연쇄 합성 촉발</li>
                  <li><strong>페글 피치 스케일:</strong> 연속 콤보마다 신스 음계가 한 음씩 상승하는 도파민 청각 피드백</li>
                  <li><strong>3D 홀로그램 카드:</strong> 일정 점수마다 마우스 기울임에 반응하는 3D 홀로그램 카드 획득</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="confirm-btn"
                onClick={() => {
                  ballStormAudio.playClick();
                  setRuleModalOpen(false);
                }}
              >
                확인 및 게임 계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
