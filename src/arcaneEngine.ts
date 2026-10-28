import * as THREE from 'three';
import { arcaneAudio } from './arcaneAudio';

export type SpellType = 'lightning' | 'teleport' | 'shield' | 'meteor' | 'ascend' | 'kinetic_shove';

export interface SpellCard {
  id: string;
  type: SpellType;
  name: string;
  nameEn: string;
  cost: number;
  icon: string;
  desc: string;
  descEn: string;
}

export const SPELL_POOL: SpellCard[] = [
  {
    id: 'lightning',
    type: 'lightning',
    name: '심판의 번개',
    nameEn: 'Lightning Judgment',
    cost: 2,
    icon: '⚡',
    desc: '적 기물 1개를 1턴간 석화(이동/공격 불가)',
    descEn: 'Petrify 1 enemy piece for 1 turn (cannot move or attack)'
  },
  {
    id: 'kinetic_shove',
    type: 'kinetic_shove',
    name: '대성당 충격파',
    nameEn: 'Cathedral Kinetic Shove',
    cost: 1,
    icon: '💨',
    desc: '적 기물 1개를 1칸 밀쳐내어 기둥이나 화로에 처박음!',
    descEn: 'Shove 1 enemy piece 1 tile away into columns or braziers!'
  },
  {
    id: 'teleport',
    type: 'teleport',
    name: '차원 도약',
    nameEn: 'Dimensional Rift',
    cost: 1,
    icon: '🌀',
    desc: '아군 기물 1개를 반경 2칸 내 빈 타일로 순간이동',
    descEn: 'Teleport 1 ally piece up to 2 tiles away'
  },
  {
    id: 'shield',
    type: 'shield',
    name: '성소의 가호',
    nameEn: 'Divine Shield',
    cost: 2,
    icon: '🛡️',
    desc: '아군 기물 1개에 피격 1회 무효화 황금 보호막 부여',
    descEn: 'Grant 1-hit immunity golden shield to an ally piece'
  },
  {
    id: 'meteor',
    type: 'meteor',
    name: '화로의 겁화',
    nameEn: 'Brazier Cataclysm',
    cost: 3,
    icon: '🔥',
    desc: '적 기물 1개(킹 제외)를 불꽃으로 산산조각 파괴',
    descEn: 'Obliterate 1 enemy non-king piece with a meteor'
  },
  {
    id: 'ascend',
    type: 'ascend',
    name: '폰의 각성',
    nameEn: 'Pawn Ascendancy',
    cost: 2,
    icon: '♟️',
    desc: '아군 폰을 즉시 여왕(Queen)으로 승급',
    descEn: 'Instantly promote an allied pawn to a Queen'
  }
];

export interface ArcaneState {
  currentMana: number;
  maxMana: number;
  hand: SpellCard[];
  activeSpell: SpellCard | null;
  targetingStep: string | null; // e.g. 'teleport_dest'
  teleportSource: { r: number; c: number } | null;
  shoveSource: { r: number; c: number } | null;
  bannerMessage: string;
}

type ArcaneListener = (state: ArcaneState) => void;

class ArcaneEngine {
  public currentMana: number = 3;
  public maxMana: number = 3;
  public hand: SpellCard[] = [];
  public activeSpell: SpellCard | null = null;
  public targetingStep: string | null = null;
  public teleportSource: { r: number; c: number } | null = null;
  public shoveSource: { r: number; c: number } | null = null;
  public bannerMessage: string = '';

  private listeners: ArcaneListener[] = [];
  private activeFXGroup: THREE.Group | null = null;

  constructor() {
    this.refillHand();
  }

  public subscribe(fn: ArcaneListener): () => void {
    this.listeners.push(fn);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    const st = this.getState();
    for (const l of this.listeners) l(st);
  }

  public getState(): ArcaneState {
    return {
      currentMana: this.currentMana,
      maxMana: this.maxMana,
      hand: [...this.hand],
      activeSpell: this.activeSpell,
      targetingStep: this.targetingStep,
      teleportSource: this.teleportSource,
      shoveSource: this.shoveSource,
      bannerMessage: this.bannerMessage
    };
  }

  private drawCard(): SpellCard {
    const rand = Math.floor(Math.random() * SPELL_POOL.length);
    const card = SPELL_POOL[rand];
    return { ...card, id: `${card.type}_${Date.now()}_${Math.random()}` };
  }

  public refillHand() {
    while (this.hand.length < 4) {
      this.hand.push(this.drawCard());
    }
  }

  public onPlayerTurnStart() {
    this.currentMana = this.maxMana;
    this.refillHand();
    this.cancelSpell();

    // Tick down petrify status on all pieces
    const win = window as any;
    const boardState = win.wizardChess?.boardState;
    if (boardState) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = boardState[r][c];
          if (p && p.isPetrified) {
            p.petrifiedTurns = (p.petrifiedTurns || 1) - 1;
            if (p.petrifiedTurns <= 0) {
              p.isPetrified = false;
              if (p.petrifyRing) {
                win.wizardChess.scene?.remove(p.petrifyRing);
                p.petrifyRing = null;
              }
            }
          }
        }
      }
    }
    this.notify();
  }

  public selectCard(card: SpellCard) {
    if (this.currentMana < card.cost) {
      this.bannerMessage = `마나가 부족합니다! (필요: ${card.cost} 마나)`;
      this.notify();
      return;
    }

    arcaneAudio.playCardSelect();

    if (this.activeSpell?.id === card.id) {
      this.cancelSpell();
      return;
    }

    this.activeSpell = card;
    this.targetingStep = null;
    this.teleportSource = null;

    switch (card.type) {
      case 'lightning':
        this.bannerMessage = `[⚡ ${card.name}] 석화시킬 적 기물을 클릭하세요 (취소: ESC 또는 우클릭)`;
        break;
      case 'teleport':
        this.bannerMessage = `[🌀 ${card.name}] 순간이동시킬 아군 기물을 클릭하세요 (취소: ESC 또는 우클릭)`;
        break;
      case 'shield':
        this.bannerMessage = `[🛡️ ${card.name}] 보호막을 부여할 아군 기물을 클릭하세요 (취소: ESC 또는 우클릭)`;
        break;
      case 'meteor':
        this.bannerMessage = `[🔥 ${card.name}] 파괴할 적 기물(킹 제외)을 클릭하세요 (취소: ESC 또는 우클릭)`;
        break;
      case 'ascend':
        this.bannerMessage = `[♟️ ${card.name}] 여왕으로 승급시킬 아군 폰을 클릭하세요 (취소: ESC 또는 우클릭)`;
        break;
      case 'kinetic_shove':
        this.bannerMessage = `[💨 ${card.name}] 밀쳐낼 적 기물(킹 제외)을 클릭하세요 (취소: ESC 또는 우클릭)`;
        break;
    }

    this.notify();
  }

  public cancelSpell() {
    this.activeSpell = null;
    this.targetingStep = null;
    this.teleportSource = null;
    this.shoveSource = null;
    this.bannerMessage = '';
    this.notify();
  }

  // Intercepts board tile clicks
  // Returns TRUE if the spell system handled the click (so normal chess selection is blocked)
  public handleTileClick(r: number, c: number): boolean {
    if (!this.activeSpell) return false;

    const win = window as any;
    const boardState = win.wizardChess?.boardState;
    const scene = win.wizardChess?.scene;
    const boardToWorld = win.wizardChess?.boardToWorld;
    if (!boardState || !scene || !boardToWorld) return false;

    const clickedPiece = boardState[r]?.[c];
    const playerColor = win.wizardChess?.playerColor || 'w';

    switch (this.activeSpell.type) {
      case 'lightning': {
        // Target must be an enemy piece
        if (!clickedPiece || clickedPiece.color === playerColor) {
          this.bannerMessage = '⚠️ 적 기물만 번개로 공격할 수 있습니다!';
          this.notify();
          return true;
        }

        this.consumeMana(this.activeSpell.cost);
        this.removeCardFromHand(this.activeSpell.id);
        this.activeSpell = null;

        // Apply Petrify status
        clickedPiece.isPetrified = true;
        clickedPiece.petrifiedTurns = 1;

        // Visual 3D Lightning FX
        const targetPos = boardToWorld(r, c);
        this.spawnLightningFX(scene, targetPos, clickedPiece);
        arcaneAudio.playLightning();

        this.bannerMessage = `⚡ 번개 작렬! (${r}, ${c}) 적 기물이 1턴간 석화되었습니다!`;
        this.notify();
        return true;
      }

      case 'teleport': {
        if (!this.teleportSource) {
          // Step 1: select allied piece
          if (!clickedPiece || clickedPiece.color !== playerColor) {
            this.bannerMessage = '⚠️ 이동시킬 아군 기물을 선택하세요!';
            this.notify();
            return true;
          }
          this.teleportSource = { r, c };
          this.targetingStep = 'teleport_dest';
          this.bannerMessage = `[🌀 순간이동] 2칸 내의 빈 타일을 클릭하세요.`;
          this.notify();
          return true;
        } else {
          // Step 2: select empty destination within 2 tiles
          const srcR = this.teleportSource.r;
          const srcC = this.teleportSource.c;
          const dist = Math.max(Math.abs(r - srcR), Math.abs(c - srcC));

          if (dist === 0) {
            this.cancelSpell();
            return true;
          }

          if (dist > 2) {
            this.bannerMessage = '⚠️ 2칸 이내의 타일만 선택 가능합니다!';
            this.notify();
            return true;
          }

          if (clickedPiece) {
            this.bannerMessage = '⚠️ 비어 있는 타일을 선택해야 합니다!';
            this.notify();
            return true;
          }

          const allyPiece = boardState[srcR][srcC];
          if (!allyPiece) {
            this.cancelSpell();
            return true;
          }

          this.consumeMana(this.activeSpell.cost);
          this.removeCardFromHand(this.activeSpell.id);
          this.activeSpell = null;
          this.teleportSource = null;
          this.targetingStep = null;

          // Move piece on boardState
          boardState[srcR][srcC] = null;
          boardState[r][c] = allyPiece;
          allyPiece.r = r;
          allyPiece.c = c;
          allyPiece.hasMoved = true;

          // Visual & Audio FX
          const fromPos = boardToWorld(srcR, srcC);
          const toPos = boardToWorld(r, c);
          this.spawnTeleportFX(scene, fromPos, toPos, allyPiece);
          arcaneAudio.playTeleport();

          this.bannerMessage = `🌀 차원 도약 완료! 기물이 공간을 왜곡하여 이동했습니다.`;
          this.notify();
          return true;
        }
      }

      case 'shield': {
        // Target must be an allied piece
        if (!clickedPiece || clickedPiece.color !== playerColor) {
          this.bannerMessage = '⚠️ 아군 기물에만 보호막을 부여할 수 있습니다!';
          this.notify();
          return true;
        }

        if (clickedPiece.hasShield) {
          this.bannerMessage = '⚠️ 이미 보호막을 보유하고 있습니다!';
          this.notify();
          return true;
        }

        this.consumeMana(this.activeSpell.cost);
        this.removeCardFromHand(this.activeSpell.id);
        this.activeSpell = null;

        // Apply Shield
        clickedPiece.hasShield = true;
        this.spawnShieldFX(scene, clickedPiece);
        arcaneAudio.playShield();

        this.bannerMessage = `🛡️ 성소의 가호! 황금 룬 보호막이 부여되었습니다.`;
        this.notify();
        return true;
      }

      case 'meteor': {
        // Target must be enemy non-king piece
        if (!clickedPiece || clickedPiece.color === playerColor) {
          this.bannerMessage = '⚠️ 적 기물만 메테오로 파괴할 수 있습니다!';
          this.notify();
          return true;
        }

        if (clickedPiece.type === 'king') {
          this.bannerMessage = '⚠️ 대성당의 군주(King)는 메테오에 면역입니다!';
          this.notify();
          return true;
        }

        this.consumeMana(this.activeSpell.cost);
        this.removeCardFromHand(this.activeSpell.id);
        this.activeSpell = null;

        const targetPos = boardToWorld(r, c);
        arcaneAudio.playFireball();

        // 3D Meteor drop animation
        this.spawnMeteorFX(scene, targetPos, () => {
          if (clickedPiece.mesh) {
            scene.remove(clickedPiece.mesh);
          }
          if (clickedPiece.shieldMesh) {
            scene.remove(clickedPiece.shieldMesh);
          }
          boardState[r][c] = null;
          win.wizardChess.spawnStoneShatter?.(targetPos, clickedPiece.color);
        });

        this.bannerMessage = `🔥 화로의 겁화! 메테오가 적 기물을 가루로 만들었습니다!`;
        this.notify();
        return true;
      }

      case 'ascend': {
        // Target must be allied pawn
        if (!clickedPiece || clickedPiece.color !== playerColor || clickedPiece.type !== 'pawn') {
          this.bannerMessage = '⚠️ 아군의 폰(Pawn)만 승급시킬 수 있습니다!';
          this.notify();
          return true;
        }

        this.consumeMana(this.activeSpell.cost);
        this.removeCardFromHand(this.activeSpell.id);
        this.activeSpell = null;

        const targetPos = boardToWorld(r, c);
        if (clickedPiece.mesh) {
          scene.remove(clickedPiece.mesh);
        }

        // Instantiate new Queen
        const newQueen = win.wizardChess.instantiatePiece('queen', playerColor, r, c);
        boardState[r][c] = newQueen;

        this.spawnAscendFX(scene, targetPos);
        arcaneAudio.playAscend();

        this.bannerMessage = `♟️ 폰의 각성! 폰이 장엄한 여왕(Queen)으로 승급했습니다!`;
        this.notify();
        return true;
      }

      case 'kinetic_shove': {
        if (!this.shoveSource) {
          // Step 1: Click target enemy non-king piece
          if (!clickedPiece || clickedPiece.color === playerColor) {
            this.bannerMessage = '⚠️ 밀쳐낼 적 기물을 클릭하세요!';
            this.notify();
            return true;
          }
          if (clickedPiece.type === 'king') {
            this.bannerMessage = '⚠️ 대성당의 군주(King)는 절대 체급으로 밀쳐낼 수 없습니다!';
            this.notify();
            return true;
          }
          this.shoveSource = { r, c };
          this.targetingStep = 'shove_dir';
          this.bannerMessage = '[💨 충격파] 적 기물을 밀쳐낼 방향(인접 1칸: 상하좌우)을 클릭하세요!';
          this.notify();
          return true;
        } else {
          // Step 2: Click adjacent tile to shove into
          const srcR = this.shoveSource.r;
          const srcC = this.shoveSource.c;
          const dr = Math.abs(r - srcR);
          const dc = Math.abs(c - srcC);

          if (dr + dc !== 1) {
            this.bannerMessage = '⚠️ 상하좌우 인접한 1칸을 클릭해야 합니다!';
            this.notify();
            return true;
          }

          const enemyPiece = boardState[srcR][srcC];
          if (!enemyPiece) {
            this.cancelSpell();
            return true;
          }

          this.consumeMana(this.activeSpell.cost);
          this.removeCardFromHand(this.activeSpell.id);
          this.activeSpell = null;
          this.shoveSource = null;
          this.targetingStep = null;

          const hazardTiles = win.wizardChess?.hazardTiles || [];
          const targetHazard = hazardTiles[r]?.[c]?.type;
          const targetWorldPos = boardToWorld(r, c);

          // Kinetic visual shockwave
          this.spawnShoveFX(scene, boardToWorld(srcR, srcC), targetWorldPos);
          arcaneAudio.playShove();

          if (targetHazard === 'brazier') {
            // Case A: Shoved into Brazier -> Instant Cremation!
            boardState[srcR][srcC] = null;
            if (enemyPiece.mesh) scene.remove(enemyPiece.mesh);
            win.wizardChess?.spawnBrazierIncineration?.(targetWorldPos);
            win.__farmEngine?.awardHazardKill('brazier', enemyPiece.type);
            win.__farmEngine?.awardChessPieceCapture(enemyPiece.type);
            this.bannerMessage = '🔥 화로 소각 처형 완료! 적 기물이 화로 속으로 밀려나 전소되었습니다! (+2 성회)';
          } else if (targetHazard === 'pillar') {
            // Case B: Shoved into Pillar -> Massive Stone Collision & Stun!
            enemyPiece.isPetrified = true;
            enemyPiece.petrifiedTurns = 1;
            win.wizardChess?.shakeCamera?.(0.08);
            win.__farmEngine?.awardHazardKill('pillar', enemyPiece.type);
            this.bannerMessage = '🏛️ 기둥 격돌 분쇄! 적 기물이 석조 기둥에 처박혀 1턴간 기절했습니다! (+2 대리석)';
          } else if (boardState[r][c]) {
            // Case C: Bump collision with another piece!
            const bumpTarget = boardState[r][c];
            bumpTarget.isPetrified = true;
            bumpTarget.petrifiedTurns = 1;
            win.wizardChess?.shakeCamera?.(0.04);
            this.bannerMessage = '💥 연쇄 충돌! 두 기물이 강하게 충돌하여 충격을 입었습니다!';
          } else {
            // Case D: Clean displacement into empty square
            boardState[srcR][srcC] = null;
            boardState[r][c] = enemyPiece;
            enemyPiece.r = r;
            enemyPiece.c = c;
            if (enemyPiece.mesh) {
              enemyPiece.mesh.position.copy(targetWorldPos);
            }
            this.bannerMessage = '💨 대성당 충격파! 적 기물을 전술적 위치로 1칸 밀쳐냈습니다!';
          }

          this.notify();
          return true;
        }
      }
    }

    return false;
  }

  private consumeMana(amount: number) {
    this.currentMana = Math.max(0, this.currentMana - amount);
  }

  private removeCardFromHand(cardId: string) {
    this.hand = this.hand.filter((c) => c.id !== cardId);
  }

  // --- 3D Visual Effects Helpers ---

  private spawnLightningFX(scene: THREE.Scene, pos: THREE.Vector3, piece: any) {
    const group = new THREE.Group();

    // 1. Vertical cyan beam
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.08, 6.0, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x88f0ff,
      transparent: true,
      opacity: 0.95
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(pos.x, pos.y + 3.0, pos.z);
    group.add(beam);

    // 2. Flash light
    const light = new THREE.PointLight(0xaae8ff, 18, 5);
    light.position.set(pos.x, pos.y + 0.6, pos.z);
    group.add(light);

    // 3. Petrify stone ground ring
    const ringGeo = new THREE.RingGeometry(0.18, 0.26, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x667788,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, pos.y + 0.02, pos.z);
    scene.add(ring);
    piece.petrifyRing = ring;

    scene.add(group);

    // Flash & fade
    let t = 0;
    const interval = setInterval(() => {
      t += 0.05;
      beamMat.opacity = Math.max(0, 0.95 - t * 2.5);
      light.intensity = Math.max(0, 18 - t * 45);
      if (t >= 0.4) {
        clearInterval(interval);
        scene.remove(group);
        beamGeo.dispose();
        beamMat.dispose();
      }
    }, 16);
  }

  private spawnTeleportFX(scene: THREE.Scene, fromPos: THREE.Vector3, toPos: THREE.Vector3, piece: any) {
    // Rings at from and to
    const createPortalRing = (p: THREE.Vector3) => {
      const geo = new THREE.RingGeometry(0.15, 0.32, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x9944ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(p.x, p.y + 0.03, p.z);
      scene.add(mesh);

      let scale = 1;
      const interval = setInterval(() => {
        scale += 0.08;
        mat.opacity -= 0.07;
        mesh.scale.set(scale, scale, scale);
        if (mat.opacity <= 0.02) {
          clearInterval(interval);
          scene.remove(mesh);
          geo.dispose();
          mat.dispose();
        }
      }, 16);
    };

    createPortalRing(fromPos);
    createPortalRing(toPos);

    // Smooth position update
    if (piece.mesh) {
      piece.mesh.position.copy(toPos);
    }
  }

  private spawnShieldFX(scene: THREE.Scene, piece: any) {
    if (!piece.mesh) return;

    // Golden wireframe icosahedron
    const geo = new THREE.IcosahedronGeometry(0.32, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const shield = new THREE.Mesh(geo, mat);
    shield.position.set(0, 0.28, 0);
    piece.mesh.add(shield);
    piece.shieldMesh = shield;

    // Slow spin in render loop
    const spinTimer = setInterval(() => {
      if (!piece.shieldMesh || !piece.hasShield) {
        clearInterval(spinTimer);
        return;
      }
      shield.rotation.y += 0.03;
      shield.rotation.x += 0.015;
    }, 16);
  }

  private spawnMeteorFX(scene: THREE.Scene, targetPos: THREE.Vector3, onHit: () => void) {
    // Start high up in cathedral
    const startPos = new THREE.Vector3(targetPos.x - 2.5, targetPos.y + 6.0, targetPos.z - 2.5);

    const geo = new THREE.SphereGeometry(0.14, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const meteor = new THREE.Mesh(geo, mat);
    meteor.position.copy(startPos);

    const light = new THREE.PointLight(0xff6600, 6, 4);
    meteor.add(light);
    scene.add(meteor);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.055;
      const u = Math.min(1, progress);
      meteor.position.lerpVectors(startPos, targetPos, u);
      meteor.position.y += Math.sin(u * Math.PI) * 0.4; // parabolic arc

      if (u >= 1) {
        clearInterval(interval);
        scene.remove(meteor);
        geo.dispose();
        mat.dispose();
        onHit();
      }
    }, 16);
  }

  private spawnAscendFX(scene: THREE.Scene, pos: THREE.Vector3) {
    const geo = new THREE.CylinderGeometry(0.28, 0.38, 4.0, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffea77,
      transparent: true,
      opacity: 0.95
    });
    const pillar = new THREE.Mesh(geo, mat);
    pillar.position.set(pos.x, pos.y + 2.0, pos.z);
    scene.add(pillar);

    let t = 0;
    const interval = setInterval(() => {
      t += 0.04;
      mat.opacity = Math.max(0, 0.95 - t * 1.5);
      pillar.scale.x += 0.02;
      pillar.scale.z += 0.02;
      if (t >= 0.7) {
        clearInterval(interval);
        scene.remove(pillar);
        geo.dispose();
        mat.dispose();
      }
    }, 16);
  }

  private spawnShoveFX(scene: THREE.Scene, fromPos: THREE.Vector3, toPos: THREE.Vector3) {
    const group = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.08, 0.22, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(fromPos);
    ring.position.y += 0.05;
    group.add(ring);
    scene.add(group);

    let t = 0;
    const interval = setInterval(() => {
      t += 0.05;
      ring.position.lerp(toPos, 0.35);
      ring.scale.multiplyScalar(1.08);
      ringMat.opacity = Math.max(0, 0.9 - t * 1.8);
      if (t >= 0.5) {
        clearInterval(interval);
        scene.remove(group);
        ringGeo.dispose();
        ringMat.dispose();
      }
    }, 16);
  }
}

export const arcaneEngine = new ArcaneEngine();
(window as any).__arcaneEngine = arcaneEngine;
(window as any).__arcaneTileHandler = (r: number, c: number) => arcaneEngine.handleTileClick(r, c);
