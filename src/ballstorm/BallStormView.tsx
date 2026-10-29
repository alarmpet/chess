/**
 * BallStormView.tsx — Ball Storm Chaos Cyberpunk 3D HUD & React View
 *
 * Implements:
 *  - Fullscreen 3D WebGL viewport integration
 *  - Real-time Neon Cyber HUD (Score, High Score, Combo Fire, Next Ball Preview)
 *  - 3-Card Roguelike Slot Upgrade Modal (Balatro/Vampire Survivors inspiration)
 *  - Active Buff Status Badges (Magnetic, Zero-G, Slow-Mo)
 *  - Game Over Instant Restart Modal (< 0.1s recovery loop)
 *  - Mode Switcher Pill ([⚡ 볼 스톰], [🎱 3D 당구장], [♚ 마법 체스])
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ballStormEngine,
  type BallStormState,
  type CardUpgrade
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
    const muted = ballStormAudio.toggleMute();
    setIsMuted(muted);
  };

  const currentTierData = BALL_TIERS[gameState.currentTier - 1] || BALL_TIERS[0];
  const nextTierData = BALL_TIERS[gameState.nextTier - 1] || BALL_TIERS[0];

  return (
    <div className="ballstorm-root">
      {/* 3D WebGL Viewport */}
      <div id="ballstorm-viewport" ref={containerRef} className="ballstorm-viewport" />

      {/* Top Cyber HUD Bar */}
      <header className="ballstorm-top-bar">
        <div className="ballstorm-top-left">
          {/* Universal 3-Mode Switcher */}
          <div className="app-mode-switch-pill">
            <button
              type="button"
              className="app-mode-pill-btn active"
              title="볼 스톰 카오스 (초고속 3D 합성 로그라이크)"
            >
              ⚡ 볼 스톰
            </button>
            <button
              type="button"
              className="app-mode-pill-btn"
              onClick={() => onSwitchMode('billiards')}
              title="3D 정통 당구장으로 전환"
            >
              🎱 3D 당구장
            </button>
            <button
              type="button"
              className="app-mode-pill-btn"
              onClick={() => onSwitchMode('chess')}
              title="마법 체스 대국장으로 전환"
            >
              ♚ 마법 체스
            </button>
          </div>

          <div className="ballstorm-brand-pill">
            <span className="brand-bolt">⚡</span>
            <span className="brand-name">BALL STORM CHAOS</span>
            <span className="brand-sub">3D 아라미스 볼 머지 로그라이크</span>
          </div>
        </div>

        {/* Center: Score & Combo Multiplier */}
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
          </div>

          {/* Combo Multiplier Flame Badge */}
          {gameState.combo > 0 && (
            <div className="combo-flame-pill animate-pulse">
              <span className="flame-icon">🔥</span>
              <span className="combo-count">{gameState.combo} COMBO</span>
              <span className="multiplier-badge">x{gameState.comboMultiplier}</span>
            </div>
          )}
        </div>

        {/* Top Right: Next Ball Preview & Settings */}
        <div className="ballstorm-top-right">
          {/* Next Ball Holographic Preview */}
          <div className="next-ball-preview-card" title="다음에 투하될 볼">
            <span className="next-label">NEXT</span>
            <div
              className="preview-ball-sphere"
              style={{
                backgroundColor: `#${nextTierData.color.toString(16).padStart(6, '0')}`,
                boxShadow: `0 0 16px #${nextTierData.color.toString(16).padStart(6, '0')}88`,
              }}
            >
              <span className="preview-ball-num">{nextTierData.label}</span>
            </div>
          </div>

          {/* Rules Modal Button */}
          <button
            type="button"
            className="ballstorm-icon-btn"
            onClick={() => setRuleModalOpen(true)}
            title="게임 방법 및 볼 합성 도감"
          >
            📖
          </button>

          {/* Reset Button */}
          <button
            type="button"
            className="ballstorm-icon-btn"
            onClick={() => ballStormEngine.resetGame()}
            title="게임 새로 시작 (R)"
          >
            🔄
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            className="ballstorm-icon-btn"
            onClick={handleToggleMute}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

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
          💡 마우스 좌우 이동: 조준 &nbsp;|&nbsp; 클릭 / 스페이스바: 볼 낙하 &nbsp;|&nbsp; 동일 번호 볼 충돌 시 상위 볼로 합성!
        </span>
      </footer>

      {/* 🎰 Roguelike 3-Card Slot Machine Upgrade Modal */}
      {gameState.activeCards && (
        <div className="ballstorm-modal-backdrop">
          <div className="card-selection-modal">
            <div className="card-modal-header">
              <span className="card-modal-badge">🎰 LEVEL UP REWARD</span>
              <h2 className="card-modal-title">로그라이크 아티팩트를 선택하세요!</h2>
              <p className="card-modal-sub">합성 연쇄를 극대화할 초능력을 1개 획득합니다</p>
            </div>

            <div className="cards-grid-row">
              {gameState.activeCards.map((card) => (
                <div
                  key={card.id}
                  className={`upgrade-card-item rarity-${card.rarity}`}
                  onClick={() => ballStormEngine.selectCardUpgrade(card.id)}
                  style={{ borderColor: card.color }}
                >
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
              onClick={() => ballStormEngine.resetGame()}
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
                onClick={() => setRuleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="guide-section">
                <h3>🎮 게임 핵심 규칙</h3>
                <p>
                  하늘에서 떨어지는 3D 당구공을 좌우로 조준하여 투하하세요.
                  <strong>동일한 번호의 볼 2개가 충돌하면 다음 상위 번호의 볼로 즉시 합성</strong>되며 폭발적인 점수와 3D 크리스털 파편 충격파가 방출됩니다!
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
                  <li><strong>서브스텝 터널링 방지:</strong> 고속 낙하 시에도 벽이나 다른 공을 뚫지 않는 무결점 충돌</li>
                  <li><strong>방사형 충격파 (Shockwave):</strong> 합성이 터질 때마다 주변 볼들을 밀어내며 연쇄 합성 유발</li>
                  <li><strong>페글 피치 스케일:</strong> 연속 콤보가 이어질 때마다 신스 음계가 한 음씩 상승하는 도파민 청각 피드백</li>
                  <li><strong>슬롯머신 3택 로그라이크:</strong> 일정 점수 돌파 시 마그네틱, 무중력, 메가밤 등 6종의 파워업 선택</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="confirm-btn"
                onClick={() => setRuleModalOpen(false)}
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
