/**
 * ballstormEngine.ts — Ball Storm Chaos Master 3D Engine
 *
 * Implements:
 *  - Full 3D WebGL render loop with PMREM Neon Environment
 *  - Interactive pointer dropper (instant 0-latency tracking & drop)
 *  - Real-time rigid body physics with sub-step tunneling prevention
 *  - Dynamic crystal shard explosion & chain merge reactions
 *  - Roguelike 3-Card Slot Machine Upgrade system
 *  - Peggle-style crescendo pentatonic audio integration
 */

import * as THREE from 'three';
import {
  BALL_TIERS,
  type BallTier,
  type PhysicsBall,
  createPhysicsBall,
  stepPhysics,
  checkGameOverCondition,
  resetPhysicsIdCounter,
  ARENA_W,
  ARENA_D,
  ARENA_FLOOR_Y,
  DANGER_Y
} from './ballstormPhysics.ts';
import {
  createCyberArenaEnvMap,
  createBallMesh,
  buildCyberArena,
  createMergeExplosion,
  stepShards,
  type Shard,
  createDropIndicator,
  getBallTexture
} from './ballstormAssets.ts';
import { fx, kickShake, kickPunch, kickFlash, triggerSlowMo, updateFX } from './ballstormFX.ts';
import { ballStormAudio } from './ballstormAudio.ts';

export interface CardUpgrade {
  id: string;
  title: string;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

export const ALL_CARD_UPGRADES: CardUpgrade[] = [
  {
    id: 'multiball',
    title: '멀티볼 폭풍 (Multiball)',
    desc: '즉시 3개의 보너스 볼(3~5번)이 쏟아져 연쇄 합성을 촉발합니다!',
    icon: '🎲',
    rarity: 'rare',
    color: '#38bdf8'
  },
  {
    id: 'magnetic',
    title: '마그네틱 인력 (Magnetic Surge)',
    desc: '9초간 같은 번호 볼들이 자석처럼 서로를 끌어당겨 자동 합성됩니다.',
    icon: '🧲',
    rarity: 'epic',
    color: '#c084fc'
  },
  {
    id: 'zero_g',
    title: '시공간 무중력 (Zero-G Void)',
    desc: '6초간 중력이 역전되어 볼들이 공중에 떠올라 공중 연쇄 폭발을 일으킵니다.',
    icon: '🌌',
    rarity: 'epic',
    color: '#f43f5e'
  },
  {
    id: 'mega_bomb',
    title: '메가 블래스터 (Mega Bomb)',
    desc: '다음 투하 볼이 거대한 충격파 폭탄으로 변해 반경 내 모든 볼을 1단계 승급시킵니다.',
    icon: '💥',
    rarity: 'legendary',
    color: '#fbbf24'
  },
  {
    id: 'chrono_slow',
    title: '크로노 딜레이 (Chrono Slow)',
    desc: '10초간 시공간이 0.35배속으로 감속되며 콤보 점수가 2배로 폭증합니다.',
    icon: '⏳',
    rarity: 'rare',
    color: '#34d399'
  },
  {
    id: 'danger_purge',
    title: '위험선 레이저 정화 (Laser Purge)',
    desc: '가장 위험한 최상단 3개 볼을 플라즈마 레이저로 즉시 소각 분쇄합니다.',
    icon: '⚡',
    rarity: 'common',
    color: '#fb7185'
  }
];

export interface BallStormState {
  score: number;
  highScore: number;
  combo: number;
  comboMultiplier: number;
  currentTier: number;
  nextTier: number;
  dropperX: number;
  isGameOver: boolean;
  dangerActive: boolean;
  activeCards: CardUpgrade[] | null;
  ballCount: number;
  activeModifiers: {
    magneticUntil: number;
    zeroGUntil: number;
    slowMoUntil: number;
    hasMegaBomb: boolean;
  };
}

class BallStormEngine {
  private container: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private envMap: THREE.Texture | null = null;

  private animFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  // Camera defaults
  private baseCamPos: THREE.Vector3 = new THREE.Vector3(0, 0.05, 4.45);
  private baseFov: number = 48;

  // Visual Dropper
  private dropperMesh: THREE.Mesh | null = null;
  private dropGuideLine: THREE.Line | null = null;
  private dropperX: number = 0;
  private targetDropperX: number = 0;
  private canDrop: boolean = true;
  private dropCooldownTimer: number = 0;

  // Active Scene Entities
  private balls: PhysicsBall[] = [];
  private shards: Shard[] = [];

  // Game Progression State
  private score: number = 0;
  private highScore: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private currentTier: number = 1;
  private nextTier: number = 1;
  private isGameOver: boolean = false;
  private dangerActive: boolean = false;

  // Roguelike Progression
  private nextCardScoreThreshold: number = 400;
  private activeCardChoices: CardUpgrade[] | null = null;

  // Powerup Modifiers
  private magneticUntil: number = 0;
  private zeroGUntil: number = 0;
  private slowMoUntil: number = 0;
  private hasMegaBomb: boolean = false;

  // Danger Line Visual Mesh
  private dangerLineMesh: THREE.LineSegments | null = null;

  // Subscribers
  private listeners: Array<(st: BallStormState) => void> = [];

  constructor() {
    this.loadHighScore();
  }

  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem('ballstorm_high_score');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch {
      this.highScore = 0;
    }
  }

  private saveHighScore(): void {
    try {
      localStorage.setItem('ballstorm_high_score', this.highScore.toString());
    } catch {}
  }

  public subscribe(fn: (st: BallStormState) => void): () => void {
    this.listeners.push(fn);
    fn(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private emitState(): void {
    const st = this.getState();
    this.listeners.forEach(fn => fn(st));
  }

  public getState(): BallStormState {
    const comboMult = 1 + this.combo * 0.4;
    return {
      score: this.score,
      highScore: this.highScore,
      combo: this.combo,
      comboMultiplier: Math.round(comboMult * 10) / 10,
      currentTier: this.currentTier,
      nextTier: this.nextTier,
      dropperX: this.dropperX,
      isGameOver: this.isGameOver,
      dangerActive: this.dangerActive,
      activeCards: this.activeCardChoices,
      ballCount: this.balls.length,
      activeModifiers: {
        magneticUntil: this.magneticUntil,
        zeroGUntil: this.zeroGUntil,
        slowMoUntil: this.slowMoUntil,
        hasMegaBomb: this.hasMegaBomb,
      }
    };
  }

  public init(container: HTMLElement): void {
    this.destroy();
    this.container = container;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03000a);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(this.baseFov, width / height, 0.1, 100);
    this.camera.position.copy(this.baseCamPos);
    this.camera.lookAt(0, -0.35, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    container.appendChild(this.renderer.domElement);

    // 4. PMREM Cyber Arena Environment
    this.envMap = createCyberArenaEnvMap(this.renderer);
    this.scene.environment = this.envMap;
    this.scene.environmentIntensity = 1.1;

    // 5. Arena Geometry & Lights
    buildCyberArena(this.scene, this.envMap);

    // 6. Danger Line Indicator
    this.buildDangerLine();

    // 7. Dropper Guide & Preview Ball
    this.setupDropper();

    // 8. Bind Controls
    this.bindEvents();

    // 9. Reset and start game loop
    this.resetGame();
    this.clock.start();
    this.animate();
  }

  private buildDangerLine(): void {
    if (!this.scene) return;
    const halfW = ARENA_W / 2;
    const halfD = ARENA_D / 2;
    const pts = [
      new THREE.Vector3(-halfW, DANGER_Y, halfD + 0.01),
      new THREE.Vector3( halfW, DANGER_Y, halfD + 0.01),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    this.dangerLineMesh = new THREE.LineSegments(geo, mat);
    this.scene.add(this.dangerLineMesh);
  }

  private setupDropper(): void {
    if (!this.scene || !this.envMap) return;

    this.currentTier = this.randomInitialTier();
    this.nextTier = this.randomInitialTier();

    // Dropper guide line
    this.dropGuideLine = createDropIndicator();
    this.dropGuideLine.position.set(0, 0, 0);
    this.scene.add(this.dropGuideLine);

    // Dropper preview ball
    this.dropperMesh = createBallMesh(this.currentTier, this.envMap);
    this.dropperMesh.position.set(0, 1.95, 0);
    (this.dropperMesh.material as THREE.MeshPhysicalMaterial).transparent = true;
    (this.dropperMesh.material as THREE.MeshPhysicalMaterial).opacity = 0.95;
    this.scene.add(this.dropperMesh);
  }

  private randomInitialTier(): number {
    // Weighted RNG for starting drops (tiers 1..4)
    const r = Math.random();
    if (r < 0.45) return 1;
    if (r < 0.75) return 2;
    if (r < 0.92) return 3;
    return 4;
  }

  private updateDropperMesh(): void {
    if (!this.dropperMesh || !this.scene || !this.envMap) return;
    this.scene.remove(this.dropperMesh);
    this.dropperMesh = createBallMesh(this.currentTier, this.envMap);
    this.dropperMesh.position.set(this.dropperX, 1.95, 0);
    this.scene.add(this.dropperMesh);
  }

  private bindEvents(): void {
    if (!this.container) return;

    // Pointer move (0-delay immediate tracking)
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = mouseX / Math.max(1, rect.width); // 0..1
    const arenaX = (ratio - 0.5) * (ARENA_W * 0.94);
    const maxX = (ARENA_W / 2) - 0.22;
    this.targetDropperX = THREE.MathUtils.clamp(arenaX, -maxX, maxX);
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (this.activeCardChoices || this.isGameOver) return;
    if (e.clientY < 75) return; // Prevent accidental drop when interacting with top HUD
    if (e.button === 0) {
      this.dropCurrentBall();
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'Space') {
      e.preventDefault();
      this.dropCurrentBall();
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      const maxX = (ARENA_W / 2) - 0.22;
      this.targetDropperX = Math.max(-maxX, this.targetDropperX - 0.15);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      const maxX = (ARENA_W / 2) - 0.22;
      this.targetDropperX = Math.min(maxX, this.targetDropperX + 0.15);
    } else if (e.code === 'KeyR') {
      this.resetGame();
    }
  };

  private onResize = (): void => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /**
   * Drops the currently queued ball from the dropper position
   */
  public dropCurrentBall(): void {
    if (!this.canDrop || this.isGameOver || this.activeCardChoices || !this.scene || !this.envMap) return;

    this.canDrop = false;
    this.dropCooldownTimer = 0.25; // 250ms rapid fire drop interval

    const dropTier = this.currentTier;
    const dropPos = new THREE.Vector3(this.dropperX, 1.95, 0);
    const ballMesh = createBallMesh(dropTier, this.envMap);
    ballMesh.position.copy(dropPos);
    this.scene.add(ballMesh);

    const pBall = createPhysicsBall(dropTier, dropPos, ballMesh);
    // Initial drop velocity straight down
    pBall.vel.set((Math.random() - 0.5) * 0.1, -3.2, 0);
    this.balls.push(pBall);

    // If Mega Bomb is primed, tag it
    if (this.hasMegaBomb) {
      this.hasMegaBomb = false;
      pBall.mass *= 2.0;
      (pBall.mesh.material as THREE.MeshPhysicalMaterial).emissive = new THREE.Color(0xf59e0b);
      (pBall.mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.2;
    }

    ballStormAudio.playDrop();
    kickPunch(0.12);

    // Queue next ball
    this.currentTier = this.nextTier;
    this.nextTier = this.randomInitialTier();
    this.updateDropperMesh();
    this.emitState();
  }

  /**
   * Selects a Roguelike Upgrade Card
   */
  public selectCardUpgrade(cardId: string): void {
    const card = ALL_CARD_UPGRADES.find(c => c.id === cardId);
    if (!card) return;

    ballStormAudio.playCardSelect();
    kickFlash(0.6);
    kickShake(0.35);

    const now = performance.now();

    switch (cardId) {
      case 'multiball': {
        // Drop 3 extra balls immediately
        if (this.scene && this.envMap) {
          [-0.8, 0, 0.8].forEach((xOffset, idx) => {
            const tier = 3 + idx;
            const pos = new THREE.Vector3(xOffset, DANGER_Y + 0.4 + idx * 0.25, 0);
            const m = createBallMesh(tier, this.envMap!);
            m.position.copy(pos);
            this.scene!.add(m);
            const b = createPhysicsBall(tier, pos, m);
            b.vel.set((Math.random() - 0.5) * 1.5, -3.5, 0);
            this.balls.push(b);
          });
        }
        break;
      }
      case 'magnetic': {
        this.magneticUntil = now + 9000;
        break;
      }
      case 'zero_g': {
        this.zeroGUntil = now + 6000;
        break;
      }
      case 'mega_bomb': {
        this.hasMegaBomb = true;
        break;
      }
      case 'chrono_slow': {
        this.slowMoUntil = now + 10000;
        triggerSlowMo(10000, 0.35);
        break;
      }
      case 'danger_purge': {
        // Sort balls by height descending and vaporize top 3
        const sorted = [...this.balls].sort((a, b) => b.pos.y - a.pos.y);
        const purgeCount = Math.min(3, sorted.length);
        for (let i = 0; i < purgeCount; i++) {
          const target = sorted[i];
          if (this.scene) {
            this.scene.remove(target.mesh);
            (target.mesh.material as THREE.Material).dispose();
            const td = BALL_TIERS[target.tier - 1];
            const sh = createMergeExplosion(this.scene, target.pos, td.color);
            this.shards.push(...sh);
          }
          const idx = this.balls.indexOf(target);
          if (idx >= 0) this.balls.splice(idx, 1);
        }
        break;
      }
    }

    this.activeCardChoices = null;
    this.emitState();
  }

  public resetGame(): void {
    if (this.scene) {
      this.balls.forEach(b => {
        this.scene!.remove(b.mesh);
        (b.mesh.material as THREE.Material).dispose();
      });
      this.shards.forEach(s => {
        this.scene!.remove(s.mesh);
        (s.mesh.material as THREE.Material).dispose();
      });
    }
    this.balls = [];
    this.shards = [];
    resetPhysicsIdCounter();

    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.isGameOver = false;
    this.dangerActive = false;
    this.activeCardChoices = null;
    this.nextCardScoreThreshold = 400;

    this.magneticUntil = 0;
    this.zeroGUntil = 0;
    this.slowMoUntil = 0;
    this.hasMegaBomb = false;

    this.currentTier = this.randomInitialTier();
    this.nextTier = this.randomInitialTier();
    this.updateDropperMesh();
    this.emitState();
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const dt = Math.min(0.033, this.clock.getDelta());
    const now = performance.now();

    // 0. Smoothly lerp dropper position to target
    this.dropperX = THREE.MathUtils.lerp(this.dropperX, this.targetDropperX, 0.45);
    if (this.dropperMesh) {
      this.dropperMesh.position.x = this.dropperX;
      this.dropperMesh.position.y = 1.95;
    }
    if (this.dropGuideLine) {
      this.dropGuideLine.position.x = this.dropperX;
    }

    // 1. Dropper Cooldown
    if (!this.canDrop) {
      this.dropCooldownTimer -= dt;
      if (this.dropCooldownTimer <= 0) {
        this.canDrop = true;
      }
    }

    // 2. Combo Decay Timer
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.emitState();
      }
    }

    // 3. Step Physics if not paused / game over
    if (!this.isGameOver && !this.activeCardChoices) {
      const modifiers = {
        gravityInvertUntil: this.zeroGUntil,
        magneticUntil: this.magneticUntil,
        slowMotionUntil: this.slowMoUntil,
      };

      const { merges, dangerActive } = stepPhysics(this.balls, dt, modifiers);
      this.dangerActive = dangerActive;

      // Handle Merges
      if (merges.length > 0 && this.scene && this.envMap) {
        for (const m of merges) {
          // Remove old balls
          this.scene.remove(m.a.mesh);
          this.scene.remove(m.b.mesh);
          (m.a.mesh.material as THREE.Material).dispose();
          (m.b.mesh.material as THREE.Material).dispose();

          const idxA = this.balls.indexOf(m.a);
          if (idxA >= 0) this.balls.splice(idxA, 1);
          const idxB = this.balls.indexOf(m.b);
          if (idxB >= 0) this.balls.splice(idxB, 1);

          // Spawn upgraded ball
          const newMesh = createBallMesh(m.tier, this.envMap);
          newMesh.position.copy(m.center);
          this.scene.add(newMesh);

          const newBall = createPhysicsBall(m.tier, m.center, newMesh);
          newBall.vel.set((Math.random() - 0.5) * 1.5, Math.random() * 2.5 + 1.0, (Math.random() - 0.5) * 1.5);
          this.balls.push(newBall);

          // Crystal shard explosion
          const td = BALL_TIERS[m.tier - 1];
          const newShards = createMergeExplosion(this.scene, m.center, td.color);
          this.shards.push(...newShards);

          // Combo & Score calculation
          this.combo++;
          this.comboTimer = 2.4; // 2.4s window for next chain merge
          const mult = (1 + this.combo * 0.4) * (now < this.slowMoUntil ? 2.0 : 1.0);
          const pointsEarned = Math.round(m.score * mult);
          this.score += pointsEarned;

          if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
          }

          // Juice: Peggle crescendo sound & Screen shake
          ballStormAudio.playMerge(m.tier, this.combo);
          kickShake(0.12 + Math.min(0.6, m.tier * 0.04));
          kickPunch(0.18);

          // Check Roguelike Milestone
          if (this.score >= this.nextCardScoreThreshold && !this.activeCardChoices) {
            this.triggerCardSelection();
          }
        }
        this.emitState();
      }

      // 4. Check Sustained Game Over
      if (checkGameOverCondition(this.balls)) {
        this.isGameOver = true;
        ballStormAudio.playGameOver();
        kickShake(0.8);
        kickFlash(0.9);
        this.emitState();
      }
    }

    // 5. Danger Line Pulse FX
    if (this.dangerLineMesh) {
      if (this.dangerActive) {
        const pulse = (Math.sin(now * 0.012) + 1) * 0.5;
        (this.dangerLineMesh.material as THREE.LineBasicMaterial).opacity = 0.4 + pulse * 0.6;
        (this.dangerLineMesh.material as THREE.LineBasicMaterial).color.setHex(0xff0055);
      } else {
        (this.dangerLineMesh.material as THREE.LineBasicMaterial).opacity = 0.25;
        (this.dangerLineMesh.material as THREE.LineBasicMaterial).color.setHex(0xef4444);
      }
    }

    // 6. Step Crystal Shards
    if (this.scene && this.shards.length > 0) {
      this.shards = stepShards(this.shards, this.scene, dt);
    }

    // 7. Update FX Camera Shake & FOV
    if (this.camera) {
      updateFX(this.camera, this.baseCamPos, this.baseFov, dt);
    }

    // 8. Render
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  private triggerCardSelection(): void {
    // Pick 3 random distinct cards
    const shuffled = [...ALL_CARD_UPGRADES].sort(() => Math.random() - 0.5);
    this.activeCardChoices = shuffled.slice(0, 3);
    this.nextCardScoreThreshold = Math.round(this.score * 1.85 + 600);

    ballStormAudio.playSlotFanfare();
    kickFlash(0.5);
    this.emitState();
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.container) {
      this.container.removeEventListener('pointermove', this.onPointerMove);
      this.container.removeEventListener('pointerdown', this.onPointerDown);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.balls = [];
    this.shards = [];
  }
}

export const ballStormEngine = new BallStormEngine();
