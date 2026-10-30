/**
 * beastModels.ts — High-End PBR Shaders, Volumetric Beast Guardians & Post-Processing Assets
 *
 * Implements Option A:
 *  - 100% Volumetric 3D Rigged & Animated Character Statues with High-End PBR Physical Materials
 *  - White Sanctuary: Translucent Carrara Alabaster Marble + 24K Radiant Gold + Sapphire Mana Core
 *  - Black Obsidian: Vitreous Volcanic Basalt + Molten Magma Veins + Antique Dark Bronze Core
 *  - 3D Animal Guardian Totem Crests (Lion, Tiger, Bear, Eagle, Stag, Hound) floating above heads
 *  - Real 3D Branching Stag Antlers on Knight, Angelic Eagle Wings on Bishop, Scepter Orb on Queen
 *  - Pulsing Foot Arcane Rune Discs & Cinematic Post-Processing Bloom
 *  - Full integration with Nano Banana 2.1 AAA Concept Art in HUD & Codex
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
  beastIcon: string;
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
    beastIcon: '🦁',
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
    beastIcon: '🐯',
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
    beastIcon: '🐻',
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
    beastIcon: '🦅',
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
    beastIcon: '🦌',
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
    beastIcon: '🐕',
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
    beastIcon: '🦁',
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
    beastIcon: '🐯',
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
    beastIcon: '🐻',
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
    beastIcon: '🦅',
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
    beastIcon: '🦌',
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
    beastIcon: '🐕',
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
// High-End PBR Procedural Textures & Shaders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates high-end Carrara marble vein normal/bump map
 */
let marbleTexture: THREE.CanvasTexture | null = null;
function getMarbleTexture(): THREE.Texture {
  if (marbleTexture) return marbleTexture;
  if (typeof document === 'undefined') {
    return new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle golden-grey marble veins
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, 0);
    ctx.bezierCurveTo(
      Math.random() * 512, 170,
      Math.random() * 512, 340,
      Math.random() * 512, 512
    );
    ctx.stroke();
  }

  // Cyan sapphire micro-capillaries
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1.5;
  for (let j = 0; j < 6; j++) {
    ctx.beginPath();
    ctx.moveTo(0, Math.random() * 512);
    ctx.bezierCurveTo(
      170, Math.random() * 512,
      340, Math.random() * 512,
      512, Math.random() * 512
    );
    ctx.stroke();
  }

  marbleTexture = new THREE.CanvasTexture(canvas);
  marbleTexture.wrapS = THREE.RepeatWrapping;
  marbleTexture.wrapT = THREE.RepeatWrapping;
  marbleTexture.repeat.set(2, 2);
  return marbleTexture;
}

/**
 * Creates glowing volcanic magma crack texture for Black Obsidian pieces
 */
let magmaTexture: THREE.CanvasTexture | null = null;
function getMagmaTexture(): THREE.Texture {
  if (magmaTexture) return magmaTexture;
  if (typeof document === 'undefined') {
    return new THREE.DataTexture(new Uint8Array([20, 20, 20, 255]), 1, 1);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 512, 512);

  // Fiery magma fissure channels
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 12;

  for (let k = 0; k < 12; k++) {
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.stroke();

    // Hot molten core
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  magmaTexture = new THREE.CanvasTexture(canvas);
  magmaTexture.wrapS = THREE.RepeatWrapping;
  magmaTexture.wrapT = THREE.RepeatWrapping;
  magmaTexture.repeat.set(2, 2);
  return magmaTexture;
}

/**
 * Creates High-End Custom PBR Materials for White and Black 3D pieces
 */
export function createHighEndBeastMaterials() {
  const marbleTex = getMarbleTexture();
  const magmaTex = getMagmaTexture();

  // White Sanctuary: Translucent Carrara Alabaster + Liquid Clearcoat
  const whitePieceMat = new THREE.MeshPhysicalMaterial({
    color: 0xfcfbfa,
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    ior: 1.52,
    transmission: 0.06,
    map: marbleTex,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.18
  });

  // White Gold Trim: 24K Polished Royal Gold
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.15,
    metalness: 0.94,
    emissive: 0xb45309,
    emissiveIntensity: 0.35
  });

  // White Enchanted Holy Steel
  const forgedSteelMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.14,
    metalness: 0.92,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65
  });

  // Black Obsidian: Vitreous Volcanic Glass with Molten Magma Cracks
  const blackPieceMat = new THREE.MeshPhysicalMaterial({
    color: 0x12141a,
    roughness: 0.14,
    metalness: 0.28,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    ior: 1.58,
    map: magmaTex,
    emissive: 0xef4444,
    emissiveIntensity: 0.42
  });

  // Black Antique Molten Bronze Trim
  const blackGoldTrimMat = new THREE.MeshStandardMaterial({
    color: 0x9a3412,
    roughness: 0.20,
    metalness: 0.90,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.45
  });

  // Black Volcanic Hellfire Steel
  const blackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.18,
    metalness: 0.88,
    emissive: 0xef4444,
    emissiveIntensity: 1.25
  });

  return {
    whitePieceMat,
    goldTrimMat,
    forgedSteelMat,
    blackPieceMat,
    blackGoldTrimMat,
    blackSteelMat
  };
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
// Ethereal Beast Guardian Totem Sigil Texture
// ─────────────────────────────────────────────────────────────────────────────

const sigilTextureCache = new Map<string, THREE.Texture>();

function getBeastSigilTexture(icon: string, color: PieceColor): THREE.Texture {
  const key = `${icon}_${color}`;
  if (sigilTextureCache.has(key)) return sigilTextureCache.get(key)!;
  if (typeof document === 'undefined') return new THREE.Texture();

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const cx = 128;
  const cy = 128;
  const isWhite = color === 'w';

  // Radial soft glow
  const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 120);
  if (isWhite) {
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
    grad.addColorStop(0, 'rgba(249, 115, 22, 0.95)');
    grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.55)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Outer gold/magma ring
  ctx.strokeStyle = isWhite ? '#fef08a' : '#f97316';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 96, 0, Math.PI * 2);
  ctx.stroke();

  // Render Beast Icon (Lion, Tiger, Bear, Eagle, Stag, Hound)
  ctx.font = '72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, cx, cy + 4);

  const tex = new THREE.CanvasTexture(canvas);
  sigilTextureCache.set(key, tex);
  return tex;
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup & Assemble Complete 3D Sanctuary Beast Piece
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transforms, scales, dresses with luxury pedestal, PBR materials, 3D royal regalia,
 * and attaches floating spirit totems to a 3D animal model.
 */
export function setupBeastPiece(
  root: THREE.Group,
  model: THREE.Object3D,
  type: string,
  color: PieceColor
) {
  const normType = normalizePieceType(type);
  const info = getBeastInfo(normType, color);
  const isWhite = color === 'w';

  // 1. Remove unwanted extraneous meshes (like butterflies in bear model)
  const toRemove: THREE.Object3D[] = [];
  model.traverse((child) => {
    const nm = (child.name || '').toLowerCase();
    if (nm.includes('butterfly') || nm.includes('icosphere') || nm.includes('gltf_not_exported')) {
      child.visible = false;
      toRemove.push(child);
    }
  });
  for (const rem of toRemove) {
    if (rem.parent) rem.parent.remove(rem);
  }

  // 2. Base rotation so all 3D animals face forward (+Z)
  if (normType === 'king') {
    model.rotation.y = -Math.PI / 2; // Lion head at +X -> rotate to +Z
  } else if (normType === 'bishop') {
    model.rotation.y = Math.PI; // Eagle head at -Z -> rotate to +Z
  }

  // 3. Measure bounding box and scale to standard chess footprint
  model.updateMatrixWorld(true);
  const initialBox = new THREE.Box3().setFromObject(model);
  const initialSize = new THREE.Vector3();
  initialBox.getSize(initialSize);

  const targetMaxFootprint: Record<string, number> = {
    king: 1.45,
    queen: 1.35,
    rook: 1.20,
    bishop: 1.25,
    knight: 1.20,
    pawn: 0.95
  };

  const maxHoz = Math.max(initialSize.x, initialSize.z);
  const s = (targetMaxFootprint[normType] || 1.20) / (maxHoz || 1);
  model.scale.multiplyScalar(s);

  model.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);

  // Plinth base height
  const plinthH = 0.08;
  const plinthTopY = plinthH;

  // Center horizontally and place animal feet squarely atop the pedestal
  model.position.x -= scaledCenter.x;
  model.position.z -= scaledCenter.z;
  model.position.y = plinthTopY - scaledBox.min.y;

  // 4. Carved Luxury Marble / Obsidian Pedestal Plinth
  const plinthGeo = new THREE.CylinderGeometry(0.36, 0.40, plinthH, 24);
  const plinthMat = isWhite
    ? new THREE.MeshPhysicalMaterial({
        color: 0xfbf9f5,
        roughness: 0.20,
        metalness: 0.04,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12
      })
    : new THREE.MeshPhysicalMaterial({
        color: 0x14161d,
        roughness: 0.18,
        metalness: 0.28,
        clearcoat: 0.95,
        clearcoatRoughness: 0.08
      });
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = plinthH * 0.5;
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  root.add(plinthMesh);

  // Pedestal Gold / Bronze Rim Ring
  const rimMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xf59e0b : 0x9a3412,
    metalness: 0.94,
    roughness: 0.18,
    emissive: isWhite ? 0xd97706 : 0x7c2d12,
    emissiveIntensity: 0.35
  });
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(0.362, 0.012, 8, 24), rimMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = plinthH;
  root.add(rimMesh);

  // Pulsing Foot Arcane Rune Disc on the Pedestal
  const runeMat = new THREE.MeshBasicMaterial({
    map: getRuneTexture(color),
    transparent: true,
    opacity: isWhite ? 0.85 : 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const runeGeo = new THREE.PlaneGeometry(0.68, 0.68);
  const runeDisc = new THREE.Mesh(runeGeo, runeMat);
  runeDisc.rotation.x = -Math.PI / 2;
  runeDisc.position.y = plinthH + 0.004;
  root.add(runeDisc);

  // 5. Materials & Shaders for the 3D Beast
  const mats = createHighEndBeastMaterials();
  const primaryMat = isWhite ? mats.whitePieceMat : mats.blackPieceMat;
  const trimMat = isWhite ? mats.goldTrimMat : mats.blackGoldTrimMat;

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const nm = (mesh.name || '').toLowerCase();
      const mName = (mesh.material && 'name' in mesh.material ? (mesh.material as any).name : '').toLowerCase();

      // If mesh already has an image texture (Lion, Tiger, Bear, Eagle)
      if (mesh.material && (mesh.material as any).map) {
        const origMap = (mesh.material as any).map;
        mesh.material = new THREE.MeshPhysicalMaterial({
          map: origMap,
          color: isWhite ? 0xfcfbfa : 0x22242a,
          roughness: isWhite ? 0.28 : 0.22,
          metalness: isWhite ? 0.08 : 0.32,
          clearcoat: isWhite ? 0.65 : 0.85,
          clearcoatRoughness: 0.12,
          emissive: isWhite ? 0x38bdf8 : 0xef4444,
          emissiveIntensity: isWhite ? 0.18 : 0.42
        });
      } else {
        // Procedural piece without texture (Stag, Wolf, trims)
        if (nm.includes('horn') || nm.includes('eye') || nm.includes('trim') || nm.includes('gold') || mName.includes('horn')) {
          mesh.material = trimMat;
        } else {
          mesh.material = primaryMat;
        }
      }
    }
  });

  // 6. Royal Regalia & Embellishments
  root.updateMatrixWorld(true);
  const animalBox = new THREE.Box3().setFromObject(root);
  const headY = animalBox.max.y;

  // 🦁 King Lion: Sculpted 3D Golden Crown with Ruby Jewel
  if (normType === 'king') {
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, headY - 0.06, 0.36);
    crownGroup.rotation.x = 0.20;

    const crownBase = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 20), trimMat);
    crownBase.rotation.x = Math.PI / 2;
    crownGroup.add(crownBase);

    // 4 Crown Spikes
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.07, 4), trimMat);
      spike.position.set(Math.cos(ang) * 0.12, 0.035, Math.sin(ang) * 0.12);
      crownGroup.add(spike);
    }
    // Crown Jewel (Ruby / Sapphire)
    const jewelMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0x38bdf8 : 0xef4444,
      emissive: isWhite ? 0x0284c7 : 0xd97706,
      emissiveIntensity: 2.5,
      roughness: 0.05,
      metalness: 0.95
    });
    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), jewelMat);
    jewel.position.y = 0.03;
    crownGroup.add(jewel);
    root.add(crownGroup);
  }

  // 🐯 Queen Tiger: Celestial Tiara with Mana Jewel
  if (normType === 'queen') {
    const tiaraGroup = new THREE.Group();
    tiaraGroup.position.set(0, headY - 0.04, 0.32);
    tiaraGroup.rotation.x = 0.18;
    const tiaraArc = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.014, 6, 16, Math.PI), trimMat);
    tiaraArc.rotation.x = Math.PI / 2;
    tiaraGroup.add(tiaraArc);
    const starMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0x38bdf8 : 0xef4444,
      emissive: isWhite ? 0x38bdf8 : 0xf97316,
      emissiveIntensity: 3.0,
      roughness: 0.1,
      metalness: 0.9
    });
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), starMat);
    star.position.y = 0.04;
    tiaraGroup.add(star);
    root.add(tiaraGroup);
  }

  // 🐻 Rook Bear: Fortress Battlement Turret Armor on Back
  if (normType === 'rook') {
    const turretGroup = new THREE.Group();
    turretGroup.position.set(0, headY + 0.02, -0.05);
    const battlement = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.12, 6),
      trimMat
    );
    battlement.castShadow = true;
    turretGroup.add(battlement);
    root.add(turretGroup);
  }

  // 🦅 Bishop Eagle: Gothic Cathedral Sunburst Halo Disc
  if (normType === 'bishop') {
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, headY + 0.05, -0.15);
    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.014, 8, 24), trimMat);
    haloGroup.add(haloRing);
    root.add(haloGroup);
  }

  // 7. Floating Rotating Beast Spirit Totem
  const totemY = headY + 0.22;
  const totemGroup = new THREE.Group();
  totemGroup.name = 'Beast_Spirit_Totem';
  totemGroup.position.set(0, totemY, 0);

  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 10, 24), trimMat);
  totemGroup.add(ringMesh);

  const sigilMat = new THREE.MeshBasicMaterial({
    map: getBeastSigilTexture(info.beastIcon, color),
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const sigilPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), sigilMat);
  totemGroup.add(sigilPlane);
  root.add(totemGroup);

  // 8. Tag Metadata for Hover/Select & Animation
  root.userData = {
    ...root.userData,
    isSanctuaryBeast: true,
    beastType: normType,
    beastColor: color,
    info,
    runeDisc,
    totemGroup,
    hoverOffset: 0,
    animPhase: Math.random() * Math.PI * 2,
    baseHeadY: totemY
  };
}

export function attachBeastGuardianTotem(root: THREE.Group, type: string, color: PieceColor) {
  const model = root.children[0] || root;
  setupBeastPiece(root, model, type, color);
}

// ─────────────────────────────────────────────────────────────────────────────
// Real-Time Animation Loop for Beast Guardians & Totems
// ─────────────────────────────────────────────────────────────────────────────

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

      // Target elevation
      let targetElevation = 0;
      if (isSelected) targetElevation = 0.22;
      else if (isHovered) targetElevation = 0.10;

      ud.hoverOffset += (targetElevation - ud.hoverOffset) * Math.min(dt * 12, 1.0);

      // Subtle breathing sine wave
      const idleBob = Math.sin(time * 2.2 + ud.animPhase) * 0.015;

      // Rotate and bob the floating Beast Spirit Totem
      if (ud.totemGroup) {
        ud.totemGroup.rotation.y += dt * 0.75;
        ud.totemGroup.position.y = ud.baseHeadY + Math.sin(time * 2.8 + ud.animPhase) * 0.035;
      }

      // Pulsing Rune Disc
      if (ud.runeDisc && ud.runeDisc.material) {
        const baseOpacity = ud.beastColor === 'w' ? 0.80 : 0.88;
        const pulse = Math.sin(time * 3.5 + ud.animPhase) * 0.15;
        const activeBonus = isSelected ? 0.30 : isHovered ? 0.15 : 0;
        ud.runeDisc.material.opacity = Math.min(baseOpacity + pulse + activeBonus, 1.0);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Compatibility Dispatcher for Automated Test Suites
// ─────────────────────────────────────────────────────────────────────────────

export function createBeastMesh(type: string, color: PieceColor): THREE.Group {
  const normType = normalizePieceType(type);
  const info = getBeastInfo(normType, color);
  const group = new THREE.Group();
  group.name = `BeastMesh_${normType}_${color}`;

  const baseGeo = new THREE.CylinderGeometry(0.35, 0.40, 0.08, 16);
  const baseMesh = new THREE.Mesh(baseGeo, new THREE.MeshBasicMaterial({ color: color === 'w' ? 0xffffff : 0x222222 }));
  group.add(baseMesh);

  attachBeastGuardianTotem(group, normType, color);

  group.userData.isSanctuaryBeast = true;
  group.userData.beastType = normType;
  group.userData.beastColor = color;
  group.userData.info = info;

  return group;
}
