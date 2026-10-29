/**
 * beastModels.ts — Procedural 100% Volumetric 3D Sanctuary Beasts for Wizard Chess
 *
 * True 3D Sculpted Animal Guardians:
 *  - ♚ King:   🦁 Golden Sovereign Lion (사자 - 제왕의 갈기와 황금 왕관, 사파이어 안광)
 *  - ♛ Queen:  🐯 Celestial Tiger (호랑이 - 날렵한 맹수의 골격, 황금 호피 림, 유연한 3D 꼬리)
 *  - ♜ Rook:   🐻 Bastion Armored Bear (성채 갑주 곰 - 어깨를 두른 성벽 총안/성채 갑주와 거수)
 *  - ♝ Bishop: 🦅 Imperial Cathedral Eagle (대성당 독수리 - 천공의 날개와 날카로운 부리, 주교관 볏)
 *  - ♞ Knight: 🦌 Crowned Antler Stag (성스러운 뿔 사슴 - 웅장하게 뻗은 다분기 3D 황금 뿔)
 *  - ♟️ Pawn:   🐕 Cloister Warhound (수도원 하운드 - 충직한 맹견 두상과 방울 수도원 목걸이)
 *
 * Features:
 *  - 100% Volumetric 3D polygonal geometry with full 360° depth, contours, and shadows
 *  - Absolutely NO flat cards, slabs, or gravestones (비석 형태 완전 배제)
 *  - Real-time idle floating/breathing procedural animations & hover/select elevation
 *  - Multi-tiered marble/obsidian pedestal with glowing arcane rune disc at the feet
 *  - Integrated with Nano Banana 2.1 high-res artwork in the HUD Card Inspector and Codex
 */

import * as THREE from 'three';

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type PieceColor = 'w' | 'b';

export interface BeastInfo {
  id: string;
  type: PieceType;
  color: PieceColor;
  nameKo: string;
  nameEn: string;
  titleKo: string;
  chessRoleKo: string;
  chessSymbol: string;
  quoteKo: string;
  traitNameKo: string;
  traitDescKo: string;
  moveDescKo: string;
  imageUrl: string;
  value: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Beast Lore & Metadata Dictionary
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_BEASTS: BeastInfo[] = [
  // ── White Sanctuary Beasts (빛의 성소 영수단) ──
  {
    id: 'w_k',
    type: 'king',
    color: 'w',
    nameKo: '황금 사자왕 (리오네스)',
    nameEn: 'Golden Sovereign Lion',
    titleKo: '백색 성소의 절대 군주',
    chessRoleKo: '♚ 킹 (King)',
    chessSymbol: '♚',
    quoteKo: '성소가 서 있는 한, 정의의 불꽃은 결코 꺼지지 않는다.',
    traitNameKo: '제왕의 위엄 (Sovereign Majesty)',
    traitDescKo: '성소의 모든 결계를 유지하는 총사령관. 쓰러지면 왕국이 몰락하며 게임이 종료됩니다.',
    moveDescKo: '상하좌우 및 대각선 모든 8방향으로 1칸씩 신중하게 이동합니다.',
    imageUrl: '/assets/beasts/white_k.jpg',
    value: 99
  },
  {
    id: 'w_q',
    type: 'queen',
    color: 'w',
    nameKo: '천상 호랑이 (묵호)',
    nameEn: 'Celestial Tiger',
    titleKo: '전장을 지배하는 신성한 산군',
    chessRoleKo: '♛ 퀸 (Queen)',
    chessSymbol: '♛',
    quoteKo: '번개보다 빠르고 태양보다 찬란하게 적진의 심장을 유린하리라.',
    traitNameKo: '질풍의 포효 (Gale Pounce)',
    traitDescKo: '전장 최강의 돌격수. 종횡무진 막힘없는 직선과 대각선으로 전 맵을 즉각 타격합니다.',
    moveDescKo: '직선(상하좌우) 및 대각선 8방향으로 거리 제한 없이 전속력 돌진합니다.',
    imageUrl: '/assets/beasts/white_q.jpg',
    value: 9
  },
  {
    id: 'w_r',
    type: 'rook',
    color: 'w',
    nameKo: '성채 갑주 곰 (우르소스)',
    nameEn: 'Bastion Armored Bear',
    titleKo: '난공불락의 요새 수호병',
    chessRoleKo: '♜ 룩 (Rook)',
    chessSymbol: '♜',
    quoteKo: '성벽이 무너져도 내가 버티는 한 성소의 성문은 결코 열리지 않는다.',
    traitNameKo: '철옹성의 방벽 (Bastion Rampart)',
    traitDescKo: '묵직한 석조와 황금 갑주를 두른 중전차. 킹과 호흡을 맞춰 캐슬링 진형을 구축합니다.',
    moveDescKo: '상하좌우 직선 방향으로 장애물 전까지 무제한 돌진 타격합니다.',
    imageUrl: '/assets/beasts/white_r.jpg',
    value: 5
  },
  {
    id: 'w_b',
    type: 'bishop',
    color: 'w',
    nameKo: '대성당 독수리 (아퀼라)',
    nameEn: 'Imperial Cathedral Eagle',
    titleKo: '성스러운 천공의 저격수',
    chessRoleKo: '♝ 비숍 (Bishop)',
    chessSymbol: '♝',
    quoteKo: '천공에서 내려다보는 신의 눈은 어떤 거짓과 기만도 꿰뚫는다.',
    traitNameKo: '천공의 시야 (Cathedral Vision)',
    traitDescKo: '자신이 딛고 선 색상의 대각선 타일 전역을 감시하며 원거리에서 적을 기습합니다.',
    moveDescKo: '대각선 4방향으로 경로가 막히지 않는 한 끝까지 비행 타격합니다.',
    imageUrl: '/assets/beasts/white_b.jpg',
    value: 3
  },
  {
    id: 'w_n',
    type: 'knight',
    color: 'w',
    nameKo: '성스러운 뿔 사슴 (세르비아)',
    nameEn: 'Crowned Antler Stag',
    titleKo: '차원을 넘나드는 기사',
    chessRoleKo: '♞ 나이트 (Knight)',
    chessSymbol: '♞',
    quoteKo: '가장 높은 성벽도 나를 가둘 수 없으며, 가장 굳건한 방진도 뛰어넘는다.',
    traitNameKo: '영수의 도약 (Antler Leap)',
    traitDescKo: '유일하게 다른 기물을 뛰어넘어 적의 허를 찌르고 치명적인 포크(Fork)를 성공시킵니다.',
    moveDescKo: 'L자 형태(2칸 직진 후 1칸 직각)로 다른 말을 뛰어넘어 도약합니다.',
    imageUrl: '/assets/beasts/white_n.jpg',
    value: 3
  },
  {
    id: 'w_p',
    type: 'pawn',
    color: 'w',
    nameKo: '수도원 하운드 (바르도)',
    nameEn: 'Cloister Warhound',
    titleKo: '불굴의 전선 수호견',
    chessRoleKo: '♟️ 폰 (Pawn)',
    chessSymbol: '♟️',
    quoteKo: '뒤돌아보지 않는다. 한 걸음씩 적진의 심장을 향해 묵묵히 전진할 뿐.',
    traitNameKo: '승급의 서약 (Sacred Promotion)',
    traitDescKo: '전열을 지키는 굳건한 척후병. 적진 끝까지 도달하면 천상 호랑이(퀸) 등 상급 영수로 각성합니다.',
    moveDescKo: '앞으로 1칸(첫 이동 시 2칸) 전진하며, 대각선 앞 1칸의 적을 사냥합니다.',
    imageUrl: '/assets/beasts/white_p.jpg',
    value: 1
  },

  // ── Black Obsidian Beasts (흑요석 심연 영수단) ──
  {
    id: 'b_k',
    type: 'king',
    color: 'b',
    nameKo: '흑요석 마그마 사자왕 (볼카누스)',
    nameEn: 'Obsidian Magma Lion',
    titleKo: '심연의 화산 군주',
    chessRoleKo: '♚ 킹 (King)',
    chessSymbol: '♚',
    quoteKo: '대지를 불태우고 모든 영토를 잿더미와 암흑으로 뒤덮으리라.',
    traitNameKo: '마그마의 패권 (Volcanic Dominion)',
    traitDescKo: '검은 현무암과 타오르는 마그마의 지배자. 흑군의 총사령관입니다.',
    moveDescKo: '모든 8방향으로 1칸씩 위압적으로 진군합니다.',
    imageUrl: '/assets/beasts/black_k.jpg',
    value: 99
  },
  {
    id: 'b_q',
    type: 'queen',
    color: 'b',
    nameKo: '심연 호랑이 (카게토라)',
    nameEn: 'Shadow Sovereign Tiger',
    titleKo: '어둠 속을 가르는 파멸의 칼날',
    chessRoleKo: '♛ 퀸 (Queen)',
    chessSymbol: '♛',
    quoteKo: '숨을 쉬어라, 그 숨결이 네 마지막 유언이 될지니.',
    traitNameKo: '암영 습격 (Shadow Ambush)',
    traitDescKo: '칠흑의 암영 속에서 솟구치는 가장 치명적인 포식자입니다.',
    moveDescKo: '직선 및 대각선 전방위로 거리 제한 없이 급습합니다.',
    imageUrl: '/assets/beasts/black_q.jpg',
    value: 9
  },
  {
    id: 'b_r',
    type: 'rook',
    color: 'b',
    nameKo: '철옹성 흑곰 (바살트)',
    nameEn: 'Fortress Basalt Bear',
    titleKo: '화산암 요새의 괴수',
    chessRoleKo: '♜ 룩 (Rook)',
    chessSymbol: '♜',
    quoteKo: '부숴보아라, 네 칼날이 먼저 깨져나갈 것이다.',
    traitNameKo: '현무암 성벽 (Basalt Citadel)',
    traitDescKo: '용암이 흐르는 현무암 성벽을 두른 흑군의 전선 돌파형 거수입니다.',
    moveDescKo: '상하좌우 직선을 파괴적으로 돌진합니다.',
    imageUrl: '/assets/beasts/black_r.jpg',
    value: 5
  },
  {
    id: 'b_b',
    type: 'bishop',
    color: 'b',
    nameKo: '공허 대성당 독수리 (녹티스)',
    nameEn: 'Void Cathedral Eagle',
    titleKo: '고딕 첨탑의 심연 저격수',
    chessRoleKo: '♝ 비숍 (Bishop)',
    chessSymbol: '♝',
    quoteKo: '암흑의 밤하늘에서 사냥감을 결코 놓치지 않는다.',
    traitNameKo: '공허의 투시 (Void Sight)',
    traitDescKo: '고딕 양식 첨탑에서 급강하하여 대각선 궤적의 적을 사냥합니다.',
    moveDescKo: '대각선 경로를 따라 무제한 비행 타격합니다.',
    imageUrl: '/assets/beasts/black_b.jpg',
    value: 3
  },
  {
    id: 'b_n',
    type: 'knight',
    color: 'b',
    nameKo: '일식 뿔 사슴 (이클립스)',
    nameEn: 'Eclipse Antler Stag',
    titleKo: '타오르는 화염 뿔의 기사',
    chessRoleKo: '♞ 나이트 (Knight)',
    chessSymbol: '♞',
    quoteKo: '그림자를 밟고 넘어 적의 목을 벨 것이다.',
    traitNameKo: '마그마 도약 (Magma Leap)',
    traitDescKo: '불타는 마그마 뿔로 적의 방어선을 가볍게 뛰어넘습니다.',
    moveDescKo: 'L자 경로로 아군과 적을 뛰어넘어 기습합니다.',
    imageUrl: '/assets/beasts/black_n.jpg',
    value: 3
  },
  {
    id: 'b_p',
    type: 'pawn',
    color: 'b',
    nameKo: '심연의 하운드 (케르베로스)',
    nameEn: 'Abyssal Warhound',
    titleKo: '흑요석 전열의 돌격견',
    chessRoleKo: '♟️ 폰 (Pawn)',
    chessSymbol: '♟️',
    quoteKo: '주인의 명령이 있는 곳에 오직 전진과 파괴만이 있다.',
    traitNameKo: '심연의 각성 (Abyssal Awakening)',
    traitDescKo: '선봉에서 진격하며 적진 끝에 도달 시 심연의 호랑이 등 대형 영수로 변모합니다.',
    moveDescKo: '전방으로 전진하며 대각선 적을 사냥합니다.',
    imageUrl: '/assets/beasts/black_p.jpg',
    value: 1
  }
];

export function normalizePieceType(t: string): PieceType {
  const low = String(t).toLowerCase();
  if (low === 'k' || low === 'king') return 'king';
  if (low === 'q' || low === 'queen') return 'queen';
  if (low === 'r' || low === 'rook') return 'rook';
  if (low === 'b' || low === 'bishop') return 'bishop';
  if (low === 'n' || low === 'knight') return 'knight';
  return 'pawn';
}

export function getBeastInfo(type: string, color: PieceColor): BeastInfo {
  const normType = normalizePieceType(type);
  const found = ALL_BEASTS.find((b) => b.type === normType && b.color === color);
  if (found) return found;
  return ALL_BEASTS[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Material Palettes for True 3D Sculptures
// ─────────────────────────────────────────────────────────────────────────────

interface BeastPalette {
  body: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  pedestal: THREE.MeshStandardMaterial;
}

function createBeastPalette(color: PieceColor): BeastPalette {
  const isWhite = color === 'w';

  if (isWhite) {
    return {
      body: new THREE.MeshStandardMaterial({
        color: 0xfcfbfa,
        roughness: 0.22,
        metalness: 0.08,
        emissive: 0xffffff,
        emissiveIntensity: 0.05
      }),
      trim: new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Radiant 24K Gold
        roughness: 0.16,
        metalness: 0.92,
        emissive: 0xb45309,
        emissiveIntensity: 0.25
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        roughness: 0.3,
        metalness: 0.4
      }),
      eye: new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // Luminous Sapphire
        emissive: 0x0284c7,
        emissiveIntensity: 2.2,
        roughness: 0.05,
        metalness: 0.9
      }),
      pedestal: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.25,
        metalness: 0.15
      })
    };
  } else {
    return {
      body: new THREE.MeshStandardMaterial({
        color: 0x18181b, // Volcanic Basalt Obsidian
        roughness: 0.26,
        metalness: 0.32,
        emissive: 0x450a0a,
        emissiveIntensity: 0.15
      }),
      trim: new THREE.MeshStandardMaterial({
        color: 0xb45309, // Antique Dark Bronze / Molten Lava
        roughness: 0.22,
        metalness: 0.88,
        emissive: 0x78350f,
        emissiveIntensity: 0.35
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x451a03,
        roughness: 0.35,
        metalness: 0.5
      }),
      eye: new THREE.MeshStandardMaterial({
        color: 0xef4444, // Luminous Magma Ruby
        emissive: 0xd97706,
        emissiveIntensity: 2.4,
        roughness: 0.05,
        metalness: 0.9
      }),
      pedestal: new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.3,
        metalness: 0.25
      })
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Procedural Glowing Arcane Rune Texture for the Pedestal Base
// ─────────────────────────────────────────────────────────────────────────────

let whiteRuneTexture: THREE.CanvasTexture | null = null;
let blackRuneTexture: THREE.CanvasTexture | null = null;

export function getRuneTexture(color: PieceColor): THREE.Texture {
  if (color === 'w' && whiteRuneTexture) return whiteRuneTexture;
  if (color === 'b' && blackRuneTexture) return blackRuneTexture;
  if (typeof document === 'undefined') {
    return new THREE.DataTexture(new Uint8Array([255, 215, 0, 255]), 1, 1);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  const isWhite = color === 'w';

  // Base radial gradient
  const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 240);
  if (isWhite) {
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.35)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  } else {
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.65)');
    grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Outer rune ring
  ctx.strokeStyle = isWhite ? '#fef08a' : '#f97316';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = isWhite ? '#38bdf8' : '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.stroke();

  // 12 Sun rays / Astrological spokes
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 180, cy + Math.sin(angle) * 180);
    ctx.lineTo(cx + Math.cos(angle) * 220, cy + Math.sin(angle) * 220);
    ctx.stroke();
  }

  // Mystic Center Sigil
  ctx.lineWidth = 4;
  ctx.strokeStyle = isWhite ? '#ffffff' : '#fbbf24';
  ctx.beginPath();
  for (let j = 0; j < 3; j++) {
    const a = (j * 2 * Math.PI) / 3 - Math.PI / 2;
    const x = cx + Math.cos(a) * 110;
    const y = cy + Math.sin(a) * 110;
    if (j === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  if (isWhite) whiteRuneTexture = tex;
  else blackRuneTexture = tex;
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// Common 3D Ornate Sculpted Base Builder
// ─────────────────────────────────────────────────────────────────────────────

function buildSculptedBase(palette: BeastPalette, color: PieceColor, scaleMul: number = 1.0): { group: THREE.Group; runeDisc: THREE.Mesh } {
  const baseGroup = new THREE.Group();
  baseGroup.name = 'PedestalBase';

  // Lower heavy disc
  const lowerGeo = new THREE.CylinderGeometry(0.38 * scaleMul, 0.44 * scaleMul, 0.06, 32);
  const lowerMesh = new THREE.Mesh(lowerGeo, palette.pedestal);
  lowerMesh.position.y = 0.03;
  lowerMesh.castShadow = true;
  lowerMesh.receiveShadow = true;
  baseGroup.add(lowerMesh);

  // Filigree metal trim ring
  const ringGeo = new THREE.TorusGeometry(0.41 * scaleMul, 0.024 * scaleMul, 16, 40);
  const ringMesh = new THREE.Mesh(ringGeo, palette.trim);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.y = 0.06;
  baseGroup.add(ringMesh);

  // Stepped inner collar
  const collarGeo = new THREE.CylinderGeometry(0.33 * scaleMul, 0.36 * scaleMul, 0.04, 32);
  const collarMesh = new THREE.Mesh(collarGeo, palette.pedestal);
  collarMesh.position.y = 0.08;
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  baseGroup.add(collarMesh);

  // Glowing Arcane Rune Disc
  const runeMat = new THREE.MeshBasicMaterial({
    map: getRuneTexture(color),
    transparent: true,
    opacity: color === 'w' ? 0.85 : 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const runeGeo = new THREE.PlaneGeometry(0.68 * scaleMul, 0.68 * scaleMul);
  const runeDisc = new THREE.Mesh(runeGeo, runeMat);
  runeDisc.rotation.x = -Math.PI / 2;
  runeDisc.position.y = 0.102;
  baseGroup.add(runeDisc);

  return { group: baseGroup, runeDisc };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 🦁 3D King: Golden Sovereign Lion (황금 사자왕)
// ─────────────────────────────────────────────────────────────────────────────

function build3DLion(palette: BeastPalette, color: PieceColor): THREE.Group {
  const root = new THREE.Group();
  const scaleMul = 1.15;
  const { group: base, runeDisc } = buildSculptedBase(palette, color, scaleMul);
  root.add(base);

  const model = new THREE.Group();
  model.name = 'Lion_Body';
  model.position.y = 0.10;

  // 1. Muscular Torso & Chest
  const chestGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.55, 20);
  const chest = new THREE.Mesh(chestGeo, palette.body);
  chest.position.set(0, 0.28, 0);
  chest.castShadow = true;
  model.add(chest);

  // Golden Breastplate collar
  const plateGeo = new THREE.TorusGeometry(0.26, 0.035, 12, 24, Math.PI * 1.2);
  const plate = new THREE.Mesh(plateGeo, palette.trim);
  plate.rotation.set(Math.PI / 2 + 0.3, 0, Math.PI * 0.9);
  plate.position.set(0, 0.38, 0.08);
  model.add(plate);

  // 2. Full 360-degree Volumetric Mane (3 Layers of Sculpted Tufts)
  const maneBackGeo = new THREE.SphereGeometry(0.32, 20, 20);
  maneBackGeo.scale(1.15, 1.25, 0.95);
  const maneBack = new THREE.Mesh(maneBackGeo, palette.trim);
  maneBack.position.set(0, 0.68, -0.06);
  maneBack.castShadow = true;
  model.add(maneBack);

  // 14 Radiating Volumetric Mane Tufts
  const tuftGeo = new THREE.ConeGeometry(0.08, 0.28, 7);
  for (let i = 0; i < 14; i++) {
    const angle = (i * Math.PI * 2) / 14;
    const rad = 0.29;
    const tuft = new THREE.Mesh(tuftGeo, palette.trim);
    tuft.position.set(Math.cos(angle) * rad, 0.68 + Math.sin(angle) * rad * 0.85, -0.02 + Math.sin(angle) * 0.06);
    tuft.rotation.z = angle - Math.PI / 2;
    tuft.rotation.x = -0.4;
    tuft.castShadow = true;
    model.add(tuft);
  }

  // 3. Lion Cranium & Head
  const skullGeo = new THREE.SphereGeometry(0.20, 20, 20);
  const skull = new THREE.Mesh(skullGeo, palette.body);
  skull.position.set(0, 0.76, 0.10);
  skull.castShadow = true;
  model.add(skull);

  // Muzzle & Snout
  const muzzleGeo = new THREE.BoxGeometry(0.14, 0.11, 0.16);
  const muzzle = new THREE.Mesh(muzzleGeo, palette.body);
  muzzle.position.set(0, 0.71, 0.25);
  muzzle.castShadow = true;
  model.add(muzzle);

  // Nose tip
  const noseGeo = new THREE.ConeGeometry(0.035, 0.04, 4);
  const nose = new THREE.Mesh(noseGeo, palette.trim);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.74, 0.33);
  model.add(nose);

  // Lower Jaw & Fangs
  const jawGeo = new THREE.BoxGeometry(0.12, 0.05, 0.13);
  const jaw = new THREE.Mesh(jawGeo, palette.accent);
  jaw.position.set(0, 0.65, 0.23);
  model.add(jaw);

  // Rounded Feline Ears
  const earGeo = new THREE.SphereGeometry(0.055, 12, 12);
  earGeo.scale(0.8, 1.2, 0.4);
  const earL = new THREE.Mesh(earGeo, palette.body);
  earL.position.set(-0.16, 0.90, 0.04);
  earL.rotation.z = -0.3;
  model.add(earL);

  const earR = new THREE.Mesh(earGeo, palette.body);
  earR.position.set(0.16, 0.90, 0.04);
  earR.rotation.z = 0.3;
  model.add(earR);

  // 4. Piercing Gemstone Eyes
  const eyeGeo = new THREE.SphereGeometry(0.026, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, palette.eye);
  eyeL.position.set(-0.065, 0.78, 0.22);
  model.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, palette.eye);
  eyeR.position.set(0.065, 0.78, 0.22);
  model.add(eyeR);

  // 5. 3D Royal Sovereign Crown
  const crownBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 12);
  const crownBase = new THREE.Mesh(crownBaseGeo, palette.trim);
  crownBase.position.set(0, 0.94, 0.06);
  crownBase.castShadow = true;
  model.add(crownBase);

  // 5 Crown Points
  const spikeGeo = new THREE.ConeGeometry(0.03, 0.09, 4);
  for (let j = 0; j < 5; j++) {
    const a = (j * Math.PI * 2) / 5;
    const sp = new THREE.Mesh(spikeGeo, palette.trim);
    sp.position.set(Math.cos(a) * 0.13, 1.01, 0.06 + Math.sin(a) * 0.13);
    model.add(sp);
  }

  // Central Gem on Crown
  const gemGeo = new THREE.SphereGeometry(0.032, 12, 12);
  const crownGem = new THREE.Mesh(gemGeo, palette.eye);
  crownGem.position.set(0, 0.96, 0.20);
  model.add(crownGem);

  root.add(model);
  root.userData = { isSanctuaryBeast: true, beastType: 'king', beastColor: color, modelBody: model, runeDisc };
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 🐯 3D Queen: Celestial Tiger (천상 호랑이)
// ─────────────────────────────────────────────────────────────────────────────

function build3DTiger(palette: BeastPalette, color: PieceColor): THREE.Group {
  const root = new THREE.Group();
  const scaleMul = 1.12;
  const { group: base, runeDisc } = buildSculptedBase(palette, color, scaleMul);
  root.add(base);

  const model = new THREE.Group();
  model.name = 'Tiger_Body';
  model.position.y = 0.10;

  // 1. Sleek Predatory Torso
  const torsoGeo = new THREE.CylinderGeometry(0.20, 0.28, 0.58, 20);
  const torso = new THREE.Mesh(torsoGeo, palette.body);
  torso.position.set(0, 0.29, 0);
  torso.rotation.x = 0.08;
  torso.castShadow = true;
  model.add(torso);

  // 3D Liquid Gold Tiger Stripes wrapping around body
  for (let s = 0; s < 4; s++) {
    const stripeGeo = new THREE.TorusGeometry(0.22 - s * 0.015, 0.018, 8, 20, Math.PI * 1.5);
    const stripe = new THREE.Mesh(stripeGeo, palette.trim);
    stripe.rotation.set(Math.PI / 2 + 0.15, 0, s * 0.4 - 0.6);
    stripe.position.set(0, 0.18 + s * 0.09, 0);
    model.add(stripe);
  }

  // 2. Tiger Head & Cheek Ruffs
  const headGeo = new THREE.SphereGeometry(0.19, 20, 20);
  headGeo.scale(1.05, 0.95, 1.1);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, 0.72, 0.08);
  head.castShadow = true;
  model.add(head);

  // Sculpted Cheek Ruffs
  const ruffGeo = new THREE.ConeGeometry(0.065, 0.18, 5);
  const ruffL = new THREE.Mesh(ruffGeo, palette.trim);
  ruffL.rotation.set(0, 0, -1.2);
  ruffL.position.set(-0.21, 0.67, 0.10);
  model.add(ruffL);

  const ruffR = new THREE.Mesh(ruffGeo, palette.trim);
  ruffR.rotation.set(0, 0, 1.2);
  ruffR.position.set(0.21, 0.67, 0.10);
  model.add(ruffR);

  // Broad Tiger Muzzle
  const muzzleGeo = new THREE.BoxGeometry(0.13, 0.09, 0.14);
  const muzzle = new THREE.Mesh(muzzleGeo, palette.body);
  muzzle.position.set(0, 0.68, 0.24);
  model.add(muzzle);

  // Nose
  const noseGeo = new THREE.ConeGeometry(0.03, 0.035, 3);
  const nose = new THREE.Mesh(noseGeo, palette.trim);
  nose.rotation.set(Math.PI / 2, 0, Math.PI);
  nose.position.set(0, 0.70, 0.31);
  model.add(nose);

  // Triangular Feline Ears
  const earGeo = new THREE.ConeGeometry(0.05, 0.10, 4);
  const earL = new THREE.Mesh(earGeo, palette.body);
  earL.position.set(-0.14, 0.88, 0.05);
  earL.rotation.set(-0.2, 0, -0.4);
  model.add(earL);

  const earR = new THREE.Mesh(earGeo, palette.body);
  earR.position.set(0.14, 0.88, 0.05);
  earR.rotation.set(-0.2, 0, 0.4);
  model.add(earR);

  // Glowing Almond-Shaped Eyes
  const eyeGeo = new THREE.SphereGeometry(0.024, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, palette.eye);
  eyeL.position.set(-0.065, 0.73, 0.21);
  model.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, palette.eye);
  eyeR.position.set(0.065, 0.73, 0.21);
  model.add(eyeR);

  // 3. Razor-Sharp Queen Tiara with Jewel
  const tiaraGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.05, 7);
  const tiara = new THREE.Mesh(tiaraGeo, palette.trim);
  tiara.position.set(0, 0.87, 0.06);
  model.add(tiara);

  const spikeGeo = new THREE.ConeGeometry(0.025, 0.12, 4);
  for (let k = 0; k < 5; k++) {
    const spk = new THREE.Mesh(spikeGeo, palette.trim);
    const ta = (k * Math.PI) / 4 - Math.PI / 2;
    spk.position.set(Math.cos(ta) * 0.11, 0.94, 0.06 + Math.sin(ta) * 0.09);
    model.add(spk);
  }

  // 4. Elegant Curling 3D Tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.12, -0.15),
    new THREE.Vector3(0.08, 0.28, -0.22),
    new THREE.Vector3(0.12, 0.50, -0.18),
    new THREE.Vector3(0.05, 0.65, -0.10)
  ]);
  const tailGeo = new THREE.TubeGeometry(tailCurve, 16, 0.028, 8, false);
  const tail = new THREE.Mesh(tailGeo, palette.trim);
  tail.castShadow = true;
  model.add(tail);

  root.add(model);
  root.userData = { isSanctuaryBeast: true, beastType: 'queen', beastColor: color, modelBody: model, runeDisc };
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 🐻 3D Rook: Bastion Armored Bear (성채 갑주 곰)
// ─────────────────────────────────────────────────────────────────────────────

function build3DBear(palette: BeastPalette, color: PieceColor): THREE.Group {
  const root = new THREE.Group();
  const scaleMul = 1.05;
  const { group: base, runeDisc } = buildSculptedBase(palette, color, scaleMul);
  root.add(base);

  const model = new THREE.Group();
  model.name = 'Bear_Body';
  model.position.y = 0.10;

  // 1. Colossal Armored Torso
  const torsoGeo = new THREE.CylinderGeometry(0.35, 0.40, 0.58, 20);
  const torso = new THREE.Mesh(torsoGeo, palette.body);
  torso.position.set(0, 0.29, 0);
  torso.castShadow = true;
  model.add(torso);

  // Armored Shoulder Plates
  const pauldronGeo = new THREE.SphereGeometry(0.20, 14, 14);
  const paulL = new THREE.Mesh(pauldronGeo, palette.trim);
  paulL.position.set(-0.25, 0.46, 0);
  model.add(paulL);

  const paulR = new THREE.Mesh(pauldronGeo, palette.trim);
  paulR.position.set(0.25, 0.46, 0);
  model.add(paulR);

  // 2. Castle Battlement Ramparts on the Back & Shoulders
  const turretGeo = new THREE.CylinderGeometry(0.26, 0.30, 0.16, 16);
  const turret = new THREE.Mesh(turretGeo, palette.pedestal);
  turret.position.set(0, 0.62, -0.08);
  turret.castShadow = true;
  model.add(turret);

  // 6 Crenellations
  const crenGeo = new THREE.BoxGeometry(0.065, 0.09, 0.065);
  for (let c = 0; c < 6; c++) {
    const ca = (c * Math.PI * 2) / 6;
    const cren = new THREE.Mesh(crenGeo, palette.trim);
    cren.position.set(Math.cos(ca) * 0.26, 0.71, -0.08 + Math.sin(ca) * 0.26);
    model.add(cren);
  }

  // 3. Heavy Bear Head & Snout
  const skullGeo = new THREE.SphereGeometry(0.22, 20, 20);
  skullGeo.scale(1.1, 0.95, 1.15);
  const skull = new THREE.Mesh(skullGeo, palette.body);
  skull.position.set(0, 0.72, 0.14);
  skull.castShadow = true;
  model.add(skull);

  const snoutGeo = new THREE.BoxGeometry(0.17, 0.13, 0.18);
  const snout = new THREE.Mesh(snoutGeo, palette.body);
  snout.position.set(0, 0.67, 0.31);
  model.add(snout);

  const noseGeo = new THREE.BoxGeometry(0.06, 0.04, 0.04);
  const nose = new THREE.Mesh(noseGeo, palette.trim);
  nose.position.set(0, 0.71, 0.40);
  model.add(nose);

  // Rounded Bear Ears
  const earGeo = new THREE.SphereGeometry(0.06, 12, 12);
  const earL = new THREE.Mesh(earGeo, palette.body);
  earL.position.set(-0.16, 0.88, 0.10);
  model.add(earL);

  const earR = new THREE.Mesh(earGeo, palette.body);
  earR.position.set(0.16, 0.88, 0.10);
  model.add(earR);

  // Recessed Glowing Eyes
  const eyeGeo = new THREE.SphereGeometry(0.026, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, palette.eye);
  eyeL.position.set(-0.075, 0.75, 0.27);
  model.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, palette.eye);
  eyeR.position.set(0.075, 0.75, 0.27);
  model.add(eyeR);

  root.add(model);
  root.userData = { isSanctuaryBeast: true, beastType: 'rook', beastColor: color, modelBody: model, runeDisc };
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 🦅 3D Bishop: Imperial Cathedral Eagle (대성당 독수리)
// ─────────────────────────────────────────────────────────────────────────────

function build3DEagle(palette: BeastPalette, color: PieceColor): THREE.Group {
  const root = new THREE.Group();
  const scaleMul = 1.04;
  const { group: base, runeDisc } = buildSculptedBase(palette, color, scaleMul);
  root.add(base);

  const model = new THREE.Group();
  model.name = 'Eagle_Body';
  model.position.y = 0.10;

  // 1. Gothic Fluted Pillar Support
  const pillarGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.35, 12);
  const pillar = new THREE.Mesh(pillarGeo, palette.pedestal);
  pillar.position.set(0, 0.18, 0);
  pillar.castShadow = true;
  model.add(pillar);

  // 2. Streamlined Avian Body
  const bodyGeo = new THREE.ConeGeometry(0.20, 0.55, 16);
  bodyGeo.scale(1.0, 1.0, 0.85);
  const body = new THREE.Mesh(bodyGeo, palette.body);
  body.rotation.x = Math.PI;
  body.position.set(0, 0.55, 0);
  body.castShadow = true;
  model.add(body);

  // 3. Volumetric Folded 3D Wings wrapping around the sides
  const wingGeo = new THREE.SphereGeometry(0.18, 16, 16);
  wingGeo.scale(0.35, 1.35, 0.75);

  const wingL = new THREE.Mesh(wingGeo, palette.trim);
  wingL.position.set(-0.20, 0.55, -0.02);
  wingL.rotation.set(-0.2, 0.1, 0.15);
  wingL.castShadow = true;
  model.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, palette.trim);
  wingR.position.set(0.20, 0.55, -0.02);
  wingR.rotation.set(-0.2, -0.1, -0.15);
  wingR.castShadow = true;
  model.add(wingR);

  // 4. Eagle Head & Hooked Predatory Beak
  const headGeo = new THREE.SphereGeometry(0.15, 18, 18);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, 0.86, 0.08);
  head.castShadow = true;
  model.add(head);

  // Curved Hooked Beak
  const beakGeo = new THREE.ConeGeometry(0.055, 0.15, 8);
  const beak = new THREE.Mesh(beakGeo, palette.trim);
  beak.rotation.set(Math.PI / 2 + 0.6, 0, 0);
  beak.position.set(0, 0.82, 0.24);
  model.add(beak);

  // Sharp Keen Eyes
  const eyeGeo = new THREE.SphereGeometry(0.024, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, palette.eye);
  eyeL.position.set(-0.075, 0.88, 0.14);
  model.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, palette.eye);
  eyeR.position.set(0.075, 0.88, 0.14);
  model.add(eyeR);

  // 5. Cathedral Bishop Miter Crest
  const miterGeo = new THREE.ConeGeometry(0.08, 0.22, 4);
  miterGeo.scale(1.2, 1.0, 0.6);
  const miter = new THREE.Mesh(miterGeo, palette.trim);
  miter.position.set(0, 1.02, 0.04);
  miter.castShadow = true;
  model.add(miter);

  const gemGeo = new THREE.SphereGeometry(0.025, 12, 12);
  const miterGem = new THREE.Mesh(gemGeo, palette.eye);
  miterGem.position.set(0, 1.00, 0.10);
  model.add(miterGem);

  root.add(model);
  root.userData = { isSanctuaryBeast: true, beastType: 'bishop', beastColor: color, modelBody: model, runeDisc };
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. 🦌 3D Knight: Crowned Antler Stag (성스러운 뿔 사슴)
// ─────────────────────────────────────────────────────────────────────────────

function build3DStag(palette: BeastPalette, color: PieceColor): THREE.Group {
  const root = new THREE.Group();
  const scaleMul = 1.04;
  const { group: base, runeDisc } = buildSculptedBase(palette, color, scaleMul);
  root.add(base);

  const model = new THREE.Group();
  model.name = 'Stag_Body';
  model.position.y = 0.10;

  // 1. Muscular Cervine Torso
  const torsoGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.46, 16);
  const torso = new THREE.Mesh(torsoGeo, palette.body);
  torso.position.set(0, 0.25, 0);
  torso.castShadow = true;
  model.add(torso);

  // Knightly Gilded Barding
  const bardingGeo = new THREE.TorusGeometry(0.21, 0.03, 10, 20);
  const barding = new THREE.Mesh(bardingGeo, palette.trim);
  barding.rotation.set(Math.PI / 2 + 0.3, 0, 0);
  barding.position.set(0, 0.34, 0.04);
  model.add(barding);

  // 2. Graceful Arched Neck
  const neckGeo = new THREE.CylinderGeometry(0.11, 0.15, 0.36, 16);
  const neck = new THREE.Mesh(neckGeo, palette.body);
  neck.position.set(0, 0.54, 0.06);
  neck.rotation.x = 0.25;
  neck.castShadow = true;
  model.add(neck);

  // 3. Stag Head & Muzzle
  const headGeo = new THREE.SphereGeometry(0.14, 18, 18);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, 0.78, 0.16);
  head.castShadow = true;
  model.add(head);

  // Tapered Muzzle
  const muzzleGeo = new THREE.ConeGeometry(0.075, 0.16, 12);
  const muzzle = new THREE.Mesh(muzzleGeo, palette.body);
  muzzle.rotation.set(Math.PI / 2 + 0.35, 0, 0);
  muzzle.position.set(0, 0.72, 0.28);
  model.add(muzzle);

  // Alert Cervine Ears
  const earGeo = new THREE.ConeGeometry(0.038, 0.15, 4);
  const earL = new THREE.Mesh(earGeo, palette.body);
  earL.position.set(-0.12, 0.88, 0.10);
  earL.rotation.set(-0.3, 0, -0.6);
  model.add(earL);

  const earR = new THREE.Mesh(earGeo, palette.body);
  earR.position.set(0.12, 0.88, 0.10);
  earR.rotation.set(-0.3, 0, 0.6);
  model.add(earR);

  // Luminous Eyes
  const eyeGeo = new THREE.SphereGeometry(0.024, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, palette.eye);
  eyeL.position.set(-0.065, 0.80, 0.22);
  model.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, palette.eye);
  eyeR.position.set(0.065, 0.80, 0.22);
  model.add(eyeR);

  // 4. Magnificent Branching 3D Antlers (Left & Right Sprawling 3D Tubes)
  function createAntlerBranch(isRight: boolean): THREE.Group {
    const branch = new THREE.Group();
    const sign = isRight ? 1 : -1;

    // Main Beam Curve
    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.05, 0.88, 0.10),
      new THREE.Vector3(sign * 0.16, 1.05, 0.04),
      new THREE.Vector3(sign * 0.26, 1.25, -0.05),
      new THREE.Vector3(sign * 0.22, 1.42, -0.10)
    ]);
    const mainTube = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 16, 0.020, 8, false), palette.trim);
    mainTube.castShadow = true;
    branch.add(mainTube);

    // Brow Tine (pointing forward over eyes)
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.10, 0.95, 0.08),
      new THREE.Vector3(sign * 0.14, 1.04, 0.20)
    ]);
    const browTube = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 8, 0.014, 6, false), palette.trim);
    branch.add(browTube);

    // Bez Tine (pointing outward)
    const bezCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sign * 0.20, 1.15, 0.00),
      new THREE.Vector3(sign * 0.32, 1.24, 0.08)
    ]);
    const bezTube = new THREE.Mesh(new THREE.TubeGeometry(bezCurve, 8, 0.013, 6, false), palette.trim);
    branch.add(bezTube);

    return branch;
  }

  model.add(createAntlerBranch(false)); // Left Antler
  model.add(createAntlerBranch(true));  // Right Antler

  root.add(model);
  root.userData = { isSanctuaryBeast: true, beastType: 'knight', beastColor: color, modelBody: model, runeDisc };
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. 🐕 3D Pawn: Cloister Warhound (수도원 하운드)
// ─────────────────────────────────────────────────────────────────────────────

function build3DHound(palette: BeastPalette, color: PieceColor): THREE.Group {
  const root = new THREE.Group();
  const scaleMul = 0.88;
  const { group: base, runeDisc } = buildSculptedBase(palette, color, scaleMul);
  root.add(base);

  const model = new THREE.Group();
  model.name = 'Hound_Body';
  model.position.y = 0.08;

  // 1. Muscular Guardian Canine Body
  const bodyGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.44, 16);
  const body = new THREE.Mesh(bodyGeo, palette.body);
  body.position.set(0, 0.22, 0);
  body.castShadow = true;
  model.add(body);

  // 2. Monastic Studded Collar with Hanging Golden Bell
  const collarGeo = new THREE.TorusGeometry(0.16, 0.026, 10, 20);
  const collar = new THREE.Mesh(collarGeo, palette.trim);
  collar.rotation.set(Math.PI / 2 + 0.2, 0, 0);
  collar.position.set(0, 0.38, 0.04);
  model.add(collar);

  const bellGeo = new THREE.SphereGeometry(0.04, 12, 12);
  const bell = new THREE.Mesh(bellGeo, palette.trim);
  bell.position.set(0, 0.32, 0.18);
  model.add(bell);

  // 3. Robust Mastiff Head & Jowls
  const headGeo = new THREE.SphereGeometry(0.15, 18, 18);
  const head = new THREE.Mesh(headGeo, palette.body);
  head.position.set(0, 0.55, 0.08);
  head.castShadow = true;
  model.add(head);

  // Square Mastiff Muzzle
  const muzzleGeo = new THREE.BoxGeometry(0.13, 0.09, 0.13);
  const muzzle = new THREE.Mesh(muzzleGeo, palette.body);
  muzzle.position.set(0, 0.50, 0.20);
  model.add(muzzle);

  const noseGeo = new THREE.BoxGeometry(0.045, 0.035, 0.03);
  const nose = new THREE.Mesh(noseGeo, palette.trim);
  nose.position.set(0, 0.53, 0.27);
  model.add(nose);

  // Folded Drop Ears
  const earGeo = new THREE.SphereGeometry(0.05, 10, 10);
  earGeo.scale(0.5, 1.4, 0.8);
  const earL = new THREE.Mesh(earGeo, palette.body);
  earL.position.set(-0.13, 0.55, 0.06);
  earL.rotation.set(0.2, 0, 0.2);
  model.add(earL);

  const earR = new THREE.Mesh(earGeo, palette.body);
  earR.position.set(0.13, 0.55, 0.06);
  earR.rotation.set(0.2, 0, -0.2);
  model.add(earR);

  // Loyal Glowing Eyes
  const eyeGeo = new THREE.SphereGeometry(0.022, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, palette.eye);
  eyeL.position.set(-0.055, 0.56, 0.18);
  model.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, palette.eye);
  eyeR.position.set(0.055, 0.56, 0.18);
  model.add(eyeR);

  root.add(model);
  root.userData = { isSanctuaryBeast: true, beastType: 'pawn', beastColor: color, modelBody: model, runeDisc };
  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public Beast Builder Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates and returns a genuine 100% Volumetric 3D Sanctuary Beast sculpture.
 * Full 360-degree polygonal geometry — absolutely NO flat cards or gravestones.
 */
export function createBeastMesh(type: string, color: PieceColor): THREE.Group {
  const normType = normalizePieceType(type);
  const palette = createBeastPalette(color);
  let group: THREE.Group;

  switch (normType) {
    case 'king':
      group = build3DLion(palette, color);
      break;
    case 'queen':
      group = build3DTiger(palette, color);
      break;
    case 'rook':
      group = build3DBear(palette, color);
      break;
    case 'bishop':
      group = build3DEagle(palette, color);
      break;
    case 'knight':
      group = build3DStag(palette, color);
      break;
    case 'pawn':
    default:
      group = build3DHound(palette, color);
      break;
  }

  // Tag with beast identifiers
  group.userData.isSanctuaryBeast = true;
  group.userData.beastType = normType;
  group.userData.beastColor = color;
  group.userData.hoverOffset = 0;
  group.userData.animPhase = Math.random() * Math.PI * 2;

  return group;
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-Time Procedural Animation Engine (생동감)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates idle floating, breathing, rune disc pulsations, and smooth hover/selection elevation.
 * Runs inside the main render/animation loop in wizardChessEngine.js.
 */
export function updateBeastTokens(
  dt: number,
  boardState: any[][],
  camera: THREE.Camera | null,
  selectedSquare: { r: number; c: number } | null = null,
  hoveredSquare: { r: number; c: number } | null = null
): void {
  const time = performance.now() * 0.001;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardState[r]?.[c];
      if (!piece || !piece.mesh || !piece.mesh.userData?.isSanctuaryBeast) continue;

      const ud = piece.mesh.userData;
      const isSelected = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;
      const isHovered = hoveredSquare && hoveredSquare.r === r && hoveredSquare.c === c;

      ud.isSelected = Boolean(isSelected);
      ud.isHovered = Boolean(isHovered);

      // Target elevation
      let targetElevation = 0;
      if (isSelected) {
        targetElevation = 0.25;
      } else if (isHovered) {
        targetElevation = 0.12;
      }

      // Smooth lerp to target elevation
      ud.hoverOffset += (targetElevation - ud.hoverOffset) * Math.min(dt * 12, 1.0);

      // Procedural Idle Floating/Breathing Sine Wave
      const idleBob = Math.sin(time * 2.2 + ud.animPhase) * 0.022;
      const idleTilt = Math.sin(time * 1.6 + ud.animPhase) * 0.012;

      if (ud.modelBody) {
        ud.modelBody.position.y = 0.10 + ud.hoverOffset + idleBob;
        ud.modelBody.rotation.z = idleTilt;
      }

      // Pulsing Rune Disc on the pedestal
      if (ud.runeDisc && ud.runeDisc.material) {
        const baseOpacity = ud.beastColor === 'w' ? 0.80 : 0.88;
        const pulse = Math.sin(time * 3.5 + ud.animPhase) * 0.18;
        const activeBonus = isSelected ? 0.30 : isHovered ? 0.15 : 0;
        ud.runeDisc.material.opacity = Math.min(baseOpacity + pulse + activeBonus, 1.0);
      }
    }
  }
}
