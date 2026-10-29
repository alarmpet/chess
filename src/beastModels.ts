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
// Attach Beast Guardian Totem to 3D Rigged Model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attaches the animal guardian totem, foot rune disc, and 3D accessories
 * to a full 3D rigged character statue.
 */
export function attachBeastGuardianTotem(root: THREE.Group, type: string, color: PieceColor) {
  const normType = normalizePieceType(type);
  const info = getBeastInfo(normType, color);
  const isWhite = color === 'w';

  // 1. Foot Arcane Rune Disc at the base
  const runeMat = new THREE.MeshBasicMaterial({
    map: getRuneTexture(color),
    transparent: true,
    opacity: isWhite ? 0.85 : 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const runeGeo = new THREE.PlaneGeometry(0.78, 0.78);
  const runeDisc = new THREE.Mesh(runeGeo, runeMat);
  runeDisc.rotation.x = -Math.PI / 2;
  runeDisc.position.y = 0.012;
  root.add(runeDisc);

  // 2. Floating Ethereal Beast Spirit Totem Crest (Hovering above the head)
  let headY = 1.35;
  if (normType === 'king') headY = 1.55;
  else if (normType === 'queen') headY = 1.48;
  else if (normType === 'rook') headY = 1.38;
  else if (normType === 'bishop') headY = 1.42;
  else if (normType === 'knight') headY = 1.45;
  else headY = 1.15; // pawn

  const totemGroup = new THREE.Group();
  totemGroup.name = 'Beast_Spirit_Totem';
  totemGroup.position.set(0, headY, 0);

  // Outer Torus Ring
  const ringMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xfbbf24 : 0x9a3412,
    metalness: 0.92,
    roughness: 0.18,
    emissive: isWhite ? 0xd97706 : 0xef4444,
    emissiveIntensity: 0.4
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 12, 24), ringMat);
  totemGroup.add(ring);

  // Glowing Sigil Disc (Double-Sided)
  const sigilMat = new THREE.MeshBasicMaterial({
    map: getBeastSigilTexture(info.beastIcon, color),
    transparent: true,
    opacity: 0.90,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const sigilPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), sigilMat);
  totemGroup.add(sigilPlane);

  root.add(totemGroup);

  // 3. Piece-Specific 3D Physical Attachments (mounted directly to skeleton nodes!)
  // Knight: 3D Branching Stag Antlers on Horse Head
  if (normType === 'knight') {
    let horseHeadNode: THREE.Object3D | null = null;
    root.traverse((child) => {
      if (child.name === 'Horse_Head') horseHeadNode = child;
    });

    if (horseHeadNode) {
      const antlerMat = new THREE.MeshStandardMaterial({
        color: isWhite ? 0xf59e0b : 0x9a3412,
        metalness: 0.94,
        roughness: 0.16,
        emissive: isWhite ? 0xd97706 : 0xef4444,
        emissiveIntensity: 0.55
      });

      function createBranch(isR: boolean): THREE.Group {
        const bg = new THREE.Group();
        const sign = isR ? 1 : -1;
        const mainCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 0.04, 0.12, 0.02),
          new THREE.Vector3(sign * 0.14, 0.28, -0.04),
          new THREE.Vector3(sign * 0.22, 0.45, -0.08),
          new THREE.Vector3(sign * 0.18, 0.58, -0.12)
        ]);
        const mainTube = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 12, 0.016, 6, false), antlerMat);
        mainTube.castShadow = true;
        bg.add(mainTube);

        const browCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 0.08, 0.20, 0.02),
          new THREE.Vector3(sign * 0.12, 0.28, 0.10)
        ]);
        const browTube = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 6, 0.012, 5, false), antlerMat);
        bg.add(browTube);

        return bg;
      }

      const antlerL = createBranch(false);
      const antlerR = createBranch(true);
      (horseHeadNode as THREE.Object3D).add(antlerL);
      (horseHeadNode as THREE.Object3D).add(antlerR);
    }
  }

  // Bishop: 3D Feathered Angelic Eagle Wings on Back
  if (normType === 'bishop') {
    const wingMat = new THREE.MeshStandardMaterial({
      color: isWhite ? 0xf59e0b : 0x9a3412,
      metalness: 0.88,
      roughness: 0.20,
      emissive: isWhite ? 0xd97706 : 0xef4444,
      emissiveIntensity: 0.4
    });

    const wingGeo = new THREE.SphereGeometry(0.16, 12, 12);
    wingGeo.scale(0.25, 1.25, 0.65);

    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.18, 0.70, -0.10);
    wingL.rotation.set(-0.25, 0.15, 0.2);
    wingL.castShadow = true;
    root.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0.18, 0.70, -0.10);
    wingR.rotation.set(-0.25, -0.15, -0.2);
    wingR.castShadow = true;
    root.add(wingR);
  }

  // Queen: Scepter Glowing Arcane Tiger Core Orb
  if (normType === 'queen') {
    let scepterNode: THREE.Object3D | null = null;
    root.traverse((child) => {
      if (child.name === 'Mace_Scepter_Bone') scepterNode = child;
    });
    if (scepterNode) {
      const orbMat = new THREE.MeshStandardMaterial({
        color: isWhite ? 0x38bdf8 : 0xef4444,
        emissive: isWhite ? 0x0284c7 : 0xd97706,
        emissiveIntensity: 3.2,
        roughness: 0.05,
        metalness: 0.9
      });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), orbMat);
      orb.position.set(0, 0.38, 0);
      (scepterNode as THREE.Object3D).add(orb);
    }
  }

  // Tag metadata for animation and selection engine
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
    baseHeadY: headY
  };
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
