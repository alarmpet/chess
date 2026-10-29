/**
 * BilliardsView.tsx — Authentic 3D Billiards Game View & High-End HUD
 *
 * Implements:
 *  - Dual Trajectory Line System: Object Target line (Yellow) + Tangent Deflection line (Cyan) + Cushion Bank Reflection (White)
 *  - Mouse Wheel Ultra-Fine Aim Rotation (0.1° per tick, Shift+Wheel for millimeter precision)
 *  - Cue Stick Elevation / Masse Slider (0°~25°)
 *  - Interactive Ball-in-Hand (프리볼) Table Click Placement
 *  - Collapsible Shooting Dock ([▼ 최소화] / [▲ 펼치기]) for full-table view
 *  - Real-Time Score Celebration & Game-Feel Feedback
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  billiardsEngine,
  BilliardsGameState,
  BilliardsMode,
  CameraPreset
} from './billiardsEngine.ts';
import { FELT_THEMES } from './billiardsAssets.ts';
import { billiardsAudio } from './billiardsAudio.ts';

interface BilliardsViewProps {
  onBackToChess?: () => void;
}

export const BilliardsView: React.FC<BilliardsViewProps> = ({ onBackToChess }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spinCanvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<BilliardsGameState>(billiardsEngine.state);
  const [isMuted, setIsMuted] = useState(billiardsAudio.getMuted());
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [isDraggingSpin, setIsDraggingSpin] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [scoreCelebration, setScoreCelebration] = useState<string | null>(null);

  const prevScoreRef = useRef<{ p1: number; p2: number }>({
    p1: billiardsEngine.state.player1Score,
    p2: billiardsEngine.state.player2Score
  });

  // 1. Initialize Billiards Engine on Mount
  useEffect(() => {
    if (!containerRef.current) return;
    billiardsEngine.init(containerRef.current);

    const unsub = billiardsEngine.subscribe((st) => {
      setGameState({ ...st });

      // Check for score increase for celebration feedback
      const prev = prevScoreRef.current;
      if (st.player1Score > prev.p1) {
        setScoreCelebration(`1P +${st.player1Score - prev.p1} 득점! ✦`);
        setTimeout(() => setScoreCelebration(null), 2400);
      } else if (st.player2Score > prev.p2) {
        setScoreCelebration(`2P +${st.player2Score - prev.p2} 득점! ✦`);
        setTimeout(() => setScoreCelebration(null), 2400);
      }
      prevScoreRef.current = { p1: st.player1Score, p2: st.player2Score };
    });

    return () => {
      unsub();
      billiardsEngine.destroy();
    };
  }, []);

  // 2. Keyboard Shortcuts (Space to Shoot, Arrows for Aim & Power)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        billiardsEngine.shootCue();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        billiardsEngine.adjustAimAngle(-0.02);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        billiardsEngine.adjustAimAngle(0.02);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        billiardsEngine.setShotPower(Math.min(1.0, gameState.shotPower + 0.05));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        billiardsEngine.setShotPower(Math.max(0.05, gameState.shotPower - 0.05));
      } else if (e.key === '1') {
        billiardsEngine.setCameraPreset('aim');
      } else if (e.key === '2') {
        billiardsEngine.setCameraPreset('top');
      } else if (e.key === '3') {
        billiardsEngine.setCameraPreset('orbit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.shotPower]);

  // 3. Draw English (당점) Ball Canvas
  useEffect(() => {
    const canvas = spinCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.42;

    ctx.clearRect(0, 0, w, h);

    // Ball Base with 3D gradient
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.65, '#e2e8f0');
    grad.addColorStop(1, '#94a3b8');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.moveTo(cx - r * 0.85, cy);
    ctx.lineTo(cx + r * 0.85, cy);
    ctx.moveTo(cx, cy - r * 0.85);
    ctx.lineTo(cx, cy + r * 0.85);
    ctx.stroke();
    ctx.setLineDash([]);

    // English Contact Point
    const dotX = cx + gameState.english.x * (r * 0.72);
    const dotY = cy - gameState.english.y * (r * 0.72);

    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Glow aura
    ctx.beginPath();
    ctx.arc(dotX, dotY, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [gameState.english]);

  // Handle spin canvas pointer interaction
  const handleSpinPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = spinCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const r = (rect.width * 0.42);

    let nx = (x - cx) / (r * 0.72);
    let ny = -(y - cy) / (r * 0.72);

    const dist = Math.hypot(nx, ny);
    if (dist > 1.0) {
      nx /= dist;
      ny /= dist;
    }

    billiardsEngine.setEnglish(nx, ny);
    billiardsAudio.playChalk();
  }, []);

  const getEnglishLabel = () => {
    const { x, y } = gameState.english;
    const dist = Math.hypot(x, y);
    if (dist < 0.15) return '무회전 (중앙)';

    let vert = '';
    if (y > 0.3) vert = '상단(오시)';
    else if (y < -0.3) vert = '하단(히끼)';

    let horiz = '';
    if (x > 0.3) horiz = '우회전';
    else if (x < -0.3) horiz = '좌회전';

    return `${vert} ${horiz}`.trim() || '미세 당점';
  };

  const getTurnDescription = () => {
    if (gameState.mode === '8ball') {
      const p1T = gameState.player1Target ? (gameState.player1Target === 'solids' ? '솔리드' : '스트라이프') : '선택 전';
      const p2T = gameState.player2Target ? (gameState.player2Target === 'solids' ? '솔리드' : '스트라이프') : '선택 전';
      return gameState.currentTurn === 1 ? `1P 차례 (${p1T})` : `2P 차례 (${p2T})`;
    } else if (gameState.mode === '4ball') {
      return gameState.currentTurn === 1 ? '1P 백구(흰공) 차례' : '2P 황구(노란공) 차례';
    } else if (gameState.mode === '3cushion') {
      return gameState.currentTurn === 1 ? '1P 백구 차례' : '2P 황구 차례';
    }
    return '자유 연습 모드';
  };

  return (
    <div className="billiards-view-root">
      {/* 3D WebGL Canvas Viewport */}
      <div id="billiards-viewport" ref={containerRef} className="billiards-viewport" />

      {/* Top Billiards Header Bar */}
      <header className="billiards-top-bar">
        <div className="billiards-top-left">
          {onBackToChess && (
            <div className="app-mode-switch-pill">
              <button
                type="button"
                className="app-mode-pill-btn active"
                title="3D 당구 모드"
              >
                🎱 3D 당구장
              </button>
              <button
                type="button"
                className="app-mode-pill-btn"
                onClick={onBackToChess}
                title="마법 체스 대국장으로 전환"
              >
                ♚ 마법 체스
              </button>
            </div>
          )}

          <div className="billiards-title-pill">
            <span className="billiards-logo-icon">🎱</span>
            <span className="billiards-title-text">리얼 3D 당구장</span>
          </div>

          {/* Game Mode Selector Tabs */}
          <div className="billiards-mode-selector">
            {(['8ball', '4ball', '3cushion', 'practice'] as BilliardsMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`mode-tab-btn ${gameState.mode === m ? 'active' : ''}`}
                onClick={() => billiardsEngine.setMode(m)}
              >
                {m === '8ball' && '🎱 8볼 포켓'}
                {m === '4ball' && '🔴 한국 4구'}
                {m === '3cushion' && '⚪ 3쿠션'}
                {m === 'practice' && '🎯 자유 연습'}
              </button>
            ))}
          </div>
        </div>

        {/* Center Score & Match Status */}
        <div className="billiards-top-center">
          <div className="billiards-score-pill">
            <span className={`player-score-tag ${gameState.currentTurn === 1 ? 'turn-active' : ''}`}>
              1P {gameState.player1Score}점
            </span>
            <span className="score-divider">VS</span>
            <span className={`player-score-tag ${gameState.currentTurn === 2 ? 'turn-active' : ''}`}>
              2P {gameState.player2Score}점
            </span>
            <span className="turn-info-badge">{getTurnDescription()}</span>
          </div>
        </div>

        {/* Top Right Controls & Settings */}
        <div className="billiards-top-right">
          {/* Ball-in-Hand Manual Trigger */}
          <button
            type="button"
            className={`billiards-btn ${gameState.isBallInHand ? 'btn-ball-in-hand-active' : ''}`}
            onClick={() => billiardsEngine.setBallInHand(!gameState.isBallInHand)}
            title="수구를 원하는 위치에 직접 배치"
          >
            🖐️ {gameState.isBallInHand ? '배치 취소' : '프리볼'}
          </button>

          {/* Felt Color Dropdown / Pills */}
          <div className="felt-theme-selector" title="당구대 라사지(펠트) 색상 변경">
            {(Object.keys(FELT_THEMES) as (keyof typeof FELT_THEMES)[]).map((themeKey) => (
              <button
                key={themeKey}
                type="button"
                className={`felt-color-btn felt-${themeKey} ${gameState.activeFeltTheme === themeKey ? 'active' : ''}`}
                onClick={() => billiardsEngine.setFeltTheme(themeKey)}
                title={FELT_THEMES[themeKey].name}
              />
            ))}
          </div>

          {/* Camera Presets */}
          <div className="camera-preset-group">
            <button
              type="button"
              className={`camera-btn ${gameState.cameraPreset === 'aim' ? 'active' : ''}`}
              onClick={() => billiardsEngine.setCameraPreset('aim')}
              title="조준 뷰 (단축키: 1)"
            >
              🎯 조준
            </button>
            <button
              type="button"
              className={`camera-btn ${gameState.cameraPreset === 'top' ? 'active' : ''}`}
              onClick={() => billiardsEngine.setCameraPreset('top')}
              title="탑다운 뷰 (단축키: 2)"
            >
              📐 탑다운
            </button>
            <button
              type="button"
              className={`camera-btn ${gameState.cameraPreset === 'orbit' ? 'active' : ''}`}
              onClick={() => billiardsEngine.setCameraPreset('orbit')}
              title="자유 궤도 뷰 (단축키: 3)"
            >
              🎥 궤도
            </button>
          </div>

          {/* Re-rack Button */}
          <button
            type="button"
            className="billiards-btn icon-btn"
            onClick={() => billiardsEngine.rackBalls(gameState.mode)}
            title="공 새로 배치 (재배열)"
          >
            🔄 리셋
          </button>

          {/* Rules / Help */}
          <button
            type="button"
            className="billiards-btn icon-btn"
            onClick={() => setRuleModalOpen(true)}
            title="당구 룰 및 물리 엔진 가이드"
          >
            ℹ️ 규칙
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            className="billiards-btn icon-btn"
            onClick={() => {
              const muted = billiardsAudio.toggleMute();
              setIsMuted(muted);
            }}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Score Celebration Toast */}
      {scoreCelebration && (
        <div className="billiards-celebration-toast">
          <span className="celebration-spark">✨</span>
          <span className="celebration-text">{scoreCelebration}</span>
        </div>
      )}

      {/* Ball-in-Hand Interactive Banner */}
      {gameState.isBallInHand && (
        <div className="billiards-ball-in-hand-banner">
          <span className="hand-icon">🖐️</span>
          <span>프리볼 모드: 당구대 위 원하는 빈 공간을 클릭하여 수구를 배치하세요!</span>
        </div>
      )}

      {/* Live Toast Notification Banner */}
      {!gameState.isBallInHand && gameState.notification && (
        <div className="billiards-notification-banner">
          <span className="notif-sparkle">✦</span>
          <span className="notif-text">{gameState.notification}</span>
        </div>
      )}

      {/* Trajectory Guide Legend Floating Pill */}
      <div className="trajectory-legend-pill">
        <span className="legend-tag">
          <span className="legend-dot white" /> 수구 조준/쿠션 반사
        </span>
        <span className="legend-tag">
          <span className="legend-dot yellow" /> 제1목적구 진행선
        </span>
        <span className="legend-tag">
          <span className="legend-dot cyan" /> 수구 90° 분리선
        </span>
        <span className="legend-hint">
          💡 마우스 휠: 0.1° 미세 조준 (Shift+휠: 초정밀)
        </span>
      </div>

      {/* Bottom Cue Shooting Cockpit Dock */}
      <footer className={`billiards-bottom-dock ${dockCollapsed ? 'collapsed' : ''}`}>
        {/* Toggle Collapse Button */}
        <button
          type="button"
          className="dock-toggle-btn"
          onClick={() => setDockCollapsed(!dockCollapsed)}
          title={dockCollapsed ? '조작 독 펼치기' : '조작 독 접어 당구대 전체보기'}
        >
          {dockCollapsed ? '▲ 조작 독 펼치기' : '▼ 독 최소화'}
        </button>

        {!dockCollapsed && (
          <>
            {/* English / Spin Circular Ball Controller */}
            <div className="english-dock-card">
              <div className="english-card-header">
                <span className="english-title">🎯 당점 (English)</span>
                <span className="english-label-text">{getEnglishLabel()}</span>
              </div>
              <div className="english-canvas-wrap">
                <canvas
                  ref={spinCanvasRef}
                  width={84}
                  height={84}
                  className="english-canvas"
                  onPointerDown={(e) => {
                    setIsDraggingSpin(true);
                    handleSpinPointer(e);
                  }}
                  onPointerMove={(e) => {
                    if (isDraggingSpin) handleSpinPointer(e);
                  }}
                  onPointerUp={() => setIsDraggingSpin(false)}
                  onPointerLeave={() => setIsDraggingSpin(false)}
                />
              </div>
              <button
                type="button"
                className="english-reset-btn"
                onClick={() => {
                  billiardsEngine.setEnglish(0, 0);
                  billiardsAudio.playChalk();
                }}
              >
                중앙 (무회전)
              </button>
            </div>

            {/* Aim Angle Micro-Adjuster */}
            <div className="aim-fine-tune-card">
              <span className="dock-card-label">조준 미세 조절</span>
              <div className="aim-tune-buttons">
                <button
                  type="button"
                  className="aim-nudge-btn"
                  onClick={() => billiardsEngine.adjustAimAngle(-0.01)}
                  title="좌측으로 0.5° 회전"
                >
                  ◀◀
                </button>
                <button
                  type="button"
                  className="aim-nudge-btn"
                  onClick={() => billiardsEngine.adjustAimAngle(-0.002)}
                  title="좌측으로 0.1° 초미세 회전"
                >
                  ◀
                </button>
                <span className="aim-icon">🎯</span>
                <button
                  type="button"
                  className="aim-nudge-btn"
                  onClick={() => billiardsEngine.adjustAimAngle(0.002)}
                  title="우측으로 0.1° 초미세 회전"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="aim-nudge-btn"
                  onClick={() => billiardsEngine.adjustAimAngle(0.01)}
                  title="우측으로 0.5° 회전"
                >
                  ▶▶
                </button>
              </div>
              <span className="aim-hint-text">마우스 휠 스크롤 회전 지원</span>
            </div>

            {/* Cue Elevation / Masse Angle Card */}
            <div className="cue-elevation-card">
              <div className="power-card-header">
                <span className="dock-card-label">큐대 각도 (Elevation)</span>
                <span className="elev-val-badge">{(gameState.cueElevation || 2.5).toFixed(1)}°</span>
              </div>
              <div className="elev-track-wrap">
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={gameState.cueElevation || 2.5}
                  onChange={(e) => billiardsEngine.setCueElevation(parseFloat(e.target.value))}
                  className="elev-range-input"
                  title="큐대 상하 각도 조절 (맛세이/찍어치기)"
                />
              </div>
              <div className="elev-presets">
                <button
                  type="button"
                  className="elev-quick-btn"
                  onClick={() => billiardsEngine.setCueElevation(0)}
                >
                  수평 0°
                </button>
                <button
                  type="button"
                  className="elev-quick-btn"
                  onClick={() => billiardsEngine.setCueElevation(2.5)}
                >
                  기본 2.5°
                </button>
                <button
                  type="button"
                  className="elev-quick-btn"
                  onClick={() => billiardsEngine.setCueElevation(12)}
                >
                  각도 12°
                </button>
                <button
                  type="button"
                  className="elev-quick-btn"
                  onClick={() => billiardsEngine.setCueElevation(22)}
                >
                  맛세이 22°
                </button>
              </div>
            </div>

            {/* Shot Power Slider & Gauge */}
            <div className="power-meter-card">
              <div className="power-card-header">
                <span className="dock-card-label">샷 파워 (Power)</span>
                <span className="power-val-badge">{Math.round(gameState.shotPower * 100)}%</span>
              </div>

              <div className="power-track-wrap">
                <div
                  className="power-bar-fill"
                  style={{
                    width: `${gameState.shotPower * 100}%`,
                    background: `linear-gradient(90deg, #38bdf8 0%, #facc15 60%, #ef4444 100%)`
                  }}
                />
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.01"
                  value={gameState.shotPower}
                  onChange={(e) => billiardsEngine.setShotPower(parseFloat(e.target.value))}
                  className="power-range-input"
                  title="샷 파워 조절 (단축키: ↑ / ↓)"
                />
              </div>

              <div className="power-presets">
                <button
                  type="button"
                  className="power-quick-btn"
                  onClick={() => billiardsEngine.setShotPower(0.25)}
                >
                  약 (25%)
                </button>
                <button
                  type="button"
                  className="power-quick-btn"
                  onClick={() => billiardsEngine.setShotPower(0.55)}
                >
                  중 (55%)
                </button>
                <button
                  type="button"
                  className="power-quick-btn"
                  onClick={() => billiardsEngine.setShotPower(0.90)}
                >
                  강 (90%)
                </button>
              </div>
            </div>
          </>
        )}

        {/* Big Shoot Cue Button */}
        <div className="shoot-action-wrap">
          <button
            type="button"
            className={`billiards-shoot-btn ${gameState.isAiming ? 'ready' : 'busy'}`}
            disabled={!gameState.isAiming || gameState.isShooting || gameState.isBallInHand}
            onClick={() => billiardsEngine.shootCue()}
            title="큐 스틱으로 공을 타격합니다 (단축키: 스페이스바)"
          >
            <span className="shoot-btn-icon">⚡</span>
            <span className="shoot-btn-text">
              {gameState.isShooting ? '타격 중...' : '샷 발사 (Space)'}
            </span>
          </button>
          {!dockCollapsed && (
            <span className="shoot-guide-hint">
              💡 화면 마우스 드래그로 큐 당기기/파워 충전 가능
            </span>
          )}
        </div>
      </footer>

      {/* Rules & Physics Information Modal */}
      {ruleModalOpen && (
        <div className="billiards-modal-backdrop" onClick={() => setRuleModalOpen(false)}>
          <div className="billiards-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🎱 3D 아라미스 당구 게임 규칙 및 물리 안내</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRuleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="rule-section">
                <h3>🎱 8볼 포켓볼 (8-Ball Pool)</h3>
                <p>
                  브레이크 샷 후 처음 포켓에 넣은 공의 종류(솔리드 1~7번 또는 스트라이프 9~15번)가 자신의 그룹이 됩니다.
                  자신의 그룹 공을 모두 넣은 뒤 마지막으로 검정색 8번 공을 넣으면 승리합니다.
                  스크래치 파울 시 상대방은 원하는 위치에 수구를 놓고 치는 <strong>프리볼(Ball-in-Hand)</strong> 권리를 얻습니다.
                </p>
              </div>

              <div className="rule-section">
                <h3>🔴 한국 4구 당구 (Korean 4-Ball)</h3>
                <p>
                  수구(1P 백구, 2P 황구)로 2개의 적구(빨간공)를 모두 맞히면 10점을 획득하고 계속 턴을 이어갑니다.
                  상대방 수구를 먼저 맞히거나 쿠션/공을 맞히지 못하면 턴이 상대방에게 넘어갑니다.
                </p>
              </div>

              <div className="rule-section">
                <h3>⚪ 3쿠션 캐롬 (3-Cushion)</h3>
                <p>
                  수구가 제1목적구와 제2목적구에 모두 접촉하기 전 또는 접촉하는 과정에서 최소 3회 이상 쿠션에 바운드되어야 점수를 획득합니다.
                  정교한 각도 계산과 상하좌우 회전(English) 조합이 승패를 좌우합니다.
                </p>
              </div>

              <div className="rule-section physics-section">
                <h3>🔬 리버스 엔지니어링 물리 엔진</h3>
                <ul>
                  <li><strong>Han 마찰 전이 모델:</strong> 미끄러짐(Sliding)에서 구름(Rolling)으로의 자연스러운 감속 전이 시뮬레이션</li>
                  <li><strong>Dr. Dave 회전 편차(Throw):</strong> 빗겨치기 마찰로 인한 궤도 편차(CIT) 및 사이드 스핀으로 인한 휨 현상(SIT) 구현</li>
                  <li><strong>Mathavan K-55 쿠션 모델:</strong> 2/5 고도 접촉 반발($e=0.85$) 및 레일 회전 각도 반사</li>
                  <li><strong>이중 궤적 예측선:</strong> 제1목적구 진행 경로(노란색) 및 수구 90° 분리각(하늘색), 쿠션 반사선(흰색) 실시간 시각화</li>
                  <li><strong>Aramith 페놀 수지 사운드:</strong> Web Audio API로 합성된 다중 음성 리미터 기반의 청명한 타격감</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="billiards-btn confirm-btn"
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
