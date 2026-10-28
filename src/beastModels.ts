/**
 * beastModels.ts — Procedural 3D Sanctuary Beasts with Nano Banana 2.1 AAA Concept Art
 *
 * Transforms chess pieces into 6 legendary Sanctuary Animal Guardians:
 *  - ♚ King:   🦁 Golden Sovereign Lion (황금 사자왕 - 백색 성소의 절대 군주)
 *  - ♛ Queen:  🐯 Celestial Tiger (천상 호랑이 - 전장의 최강 에이스)
 *  - ♜ Rook:   🐻 Bastion Armored Bear (성채 갑주 곰 - 불굴의 직선 돌진 중전차)
 *  - ♝ Bishop: 🦅 Imperial Cathedral Eagle (대성당 독수리 - 천공의 대각 저격수)
 *  - ♞ Knight: 🦌 Crowned Antler Stag (성스러운 뿔 사슴 - 도약 기습수)
 *  - ♟️ Pawn:   🐕 Cloister Warhound (수도원 하운드 - 충직한 전선 수호견)
 *
 * Features:
 *  - High-resolution Nano Banana 2.1 AAA concept art illustrations for all 12 pieces
 *  - 3D Luxury Arched Standee Tokens with multi-tiered marble/obsidian pedestals
 *  - Pulsing arcane rune discs and radiant celestial/magma additive auras
 *  - Smooth procedural floating/breathing animations and hover/selection elevation
 *  - Complete lore, tactical traits, and codex metadata
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
// Texture & Canvas Caches
// ─────────────────────────────────────────────────────────────────────────────

const textureCache = new Map<string, THREE.Texture>();
let textureLoader: THREE.TextureLoader | null = null;

function getTextureLoader(): THREE.TextureLoader | null {
  if (typeof window === 'undefined') return null;
  if (!textureLoader) {
    textureLoader = new THREE.TextureLoader();
  }
  return textureLoader;
}

export function getBeastTexture(info: BeastInfo): THREE.Texture {
  if (textureCache.has(info.id)) {
    return textureCache.get(info.id)!;
  }

  const loader = getTextureLoader();
  if (!loader) {
    // Node.js or SSR environment fallback
    const dummy = new THREE.DataTexture(new Uint8Array([200, 200, 200, 255]), 1, 1);
    dummy.needsUpdate = true;
    textureCache.set(info.id, dummy);
    return dummy;
  }

  const tex = loader.load(
    info.imageUrl,
    (loadedTex) => {
      loadedTex.colorSpace = THREE.SRGBColorSpace;
      loadedTex.generateMipmaps = true;
      loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
      loadedTex.magFilter = THREE.LinearFilter;
      loadedTex.needsUpdate = true;
    },
    undefined,
    () => {
      // In case image load fails, generate procedural canvas fallback
      console.warn(`[BeastEngine] Failed to load image: ${info.imageUrl}, falling back.`);
    }
  );

  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  textureCache.set(info.id, tex);
  return tex;
}

/**
 * Procedural Glowing Arcane Rune Texture for the Pedestal
 */
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

  // Base subtle radial glow
  const grad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 250);
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

  // Concentric Arcane Rings
  ctx.strokeStyle = isWhite ? '#fef08a' : '#f97316';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = isWhite ? '#38bdf8' : '#ef4444';
  ctx.beginPath();
  ctx.arc(cx, cy, 185, 0, Math.PI * 2);
  ctx.stroke();

  // 12 Sun rays / Sigils
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const r1 = 185;
    const r2 = 220;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.stroke();
  }

  // Inner mystic triangle
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

/**
 * Procedural Soft Radial Halo Aura for the Token Backing
 */
let auraTexture: THREE.CanvasTexture | null = null;
function getAuraTexture(): THREE.Texture {
  if (auraTexture) return auraTexture;
  if (typeof document === 'undefined') return new THREE.Texture();

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.35, 'rgba(255, 220, 120, 0.45)');
  grad.addColorStop(0.7, 'rgba(255, 180, 50, 0.15)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  auraTexture = new THREE.CanvasTexture(canvas);
  return auraTexture;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3D Luxury Standee Token Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an exquisite 3D Standee Token featuring high-resolution
 * Nano Banana 2.1 concept art, ornate pedestal, glowing rune disc, and living aura.
 */
export function createBeastMesh(type: string, color: PieceColor): THREE.Group {
  const normType = normalizePieceType(type);
  const info = getBeastInfo(normType, color);
  const isWhite = color === 'w';

  const root = new THREE.Group();
  root.name = `Beast_${info.id}`;

  // Dimensions based on piece hierarchy
  let scaleMul = 1.0;
  let archH = 1.15;
  let archW = 0.82;

  switch (normType) {
    case 'king':
      scaleMul = 1.18;
      archH = 1.30;
      archW = 0.90;
      break;
    case 'queen':
      scaleMul = 1.14;
      archH = 1.25;
      archW = 0.88;
      break;
    case 'rook':
      scaleMul = 1.05;
      archH = 1.10;
      archW = 0.86;
      break;
    case 'bishop':
      scaleMul = 1.04;
      archH = 1.14;
      archW = 0.80;
      break;
    case 'knight':
      scaleMul = 1.04;
      archH = 1.12;
      archW = 0.82;
      break;
    case 'pawn':
      scaleMul = 0.88;
      archH = 0.92;
      archW = 0.72;
      break;
  }

  // ── 1. Pedestal Base ──
  const pedGroup = new THREE.Group();
  pedGroup.name = 'Pedestal';

  // Lower heavy disc
  const baseMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xf8fafc : 0x18181b,
    roughness: isWhite ? 0.22 : 0.32,
    metalness: isWhite ? 0.12 : 0.25
  });
  const lowerBaseGeo = new THREE.CylinderGeometry(0.38 * scaleMul, 0.43 * scaleMul, 0.05, 32);
  const lowerBase = new THREE.Mesh(lowerBaseGeo, baseMat);
  lowerBase.position.y = 0.025;
  lowerBase.castShadow = true;
  lowerBase.receiveShadow = true;
  pedGroup.add(lowerBase);

  // Metal ornate filigree rim
  const rimMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xfbbf24 : 0xb45309,
    roughness: 0.2,
    metalness: 0.9,
    emissive: isWhite ? 0x78350f : 0x451a03,
    emissiveIntensity: 0.25
  });
  const rimGeo = new THREE.TorusGeometry(0.40 * scaleMul, 0.022 * scaleMul, 16, 40);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.05;
  pedGroup.add(rim);

  // Stepped collar
  const collarGeo = new THREE.CylinderGeometry(0.34 * scaleMul, 0.36 * scaleMul, 0.04, 32);
  const collar = new THREE.Mesh(collarGeo, baseMat);
  collar.position.y = 0.07;
  collar.castShadow = true;
  collar.receiveShadow = true;
  pedGroup.add(collar);

  // Pulsing Arcane Rune Disc on the pedestal face
  const runeMat = new THREE.MeshBasicMaterial({
    map: getRuneTexture(color),
    transparent: true,
    opacity: isWhite ? 0.85 : 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const runeGeo = new THREE.PlaneGeometry(0.68 * scaleMul, 0.68 * scaleMul);
  const runeDisc = new THREE.Mesh(runeGeo, runeMat);
  runeDisc.rotation.x = -Math.PI / 2;
  runeDisc.position.y = 0.092;
  pedGroup.add(runeDisc);

  root.add(pedGroup);

  // ── 2. Upright Floating Token Body ──
  const tokenBody = new THREE.Group();
  tokenBody.name = 'TokenBody';
  tokenBody.position.y = 0.10; // Sits smoothly atop pedestal

  // Standee Frame Slab (Rounded Arch Shape)
  const archShape = new THREE.Shape();
  const hw = (archW * scaleMul) / 2;
  const h = archH * scaleMul;
  const radius = hw; // Arch curve radius

  archShape.moveTo(-hw, 0);
  archShape.lineTo(hw, 0);
  archShape.lineTo(hw, h - radius);
  archShape.absarc(0, h - radius, radius, 0, Math.PI, false);
  archShape.lineTo(-hw, 0);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.05,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015
  };

  const archGeo = new THREE.ExtrudeGeometry(archShape, extrudeSettings);
  archGeo.center(); // Center local anchor

  // Frame Metal Material
  const frameMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0xd4af37 : 0x78350f,
    roughness: 0.25,
    metalness: 0.85,
    emissive: isWhite ? 0x92400e : 0x27170e,
    emissiveIntensity: 0.2
  });

  const archMesh = new THREE.Mesh(archGeo, frameMat);
  archMesh.position.y = (h / 2);
  archMesh.castShadow = true;
  archMesh.receiveShadow = true;
  tokenBody.add(archMesh);

  // Front Face Artwork: Nano Banana 2.1 AAA Concept Art
  const artTex = getBeastTexture(info);
  const artMat = new THREE.MeshStandardMaterial({
    map: artTex,
    roughness: 0.18,
    metalness: 0.1,
    emissive: isWhite ? 0xfffbeb : 0x450a0a,
    emissiveIntensity: isWhite ? 0.15 : 0.25
  });

  const artW = archW * scaleMul * 0.90;
  const artH = archH * scaleMul * 0.90;
  const artGeo = new THREE.PlaneGeometry(artW, artH);
  const artFront = new THREE.Mesh(artGeo, artMat);
  artFront.position.set(0, (h / 2), 0.042);
  tokenBody.add(artFront);

  // Back Face: Sigil Crest & Symbol
  const backMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0x0f172a : 0x18181b,
    roughness: 0.35,
    metalness: 0.4
  });
  const artBack = new THREE.Mesh(artGeo, backMat);
  artBack.position.set(0, (h / 2), -0.042);
  artBack.rotation.y = Math.PI;
  tokenBody.add(artBack);

  // Glowing Corner Gemstones on the Arch
  const gemMat = new THREE.MeshStandardMaterial({
    color: isWhite ? 0x38bdf8 : 0xef4444,
    emissive: isWhite ? 0x0284c7 : 0xb91c1c,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.9
  });
  const gemGeo = new THREE.SphereGeometry(0.028 * scaleMul, 12, 12);

  const gemTop = new THREE.Mesh(gemGeo, gemMat);
  gemTop.position.set(0, h + 0.015, 0);
  tokenBody.add(gemTop);

  const gemLeft = new THREE.Mesh(gemGeo, gemMat);
  gemLeft.position.set(-hw, 0.02, 0.04);
  tokenBody.add(gemLeft);

  const gemRight = new THREE.Mesh(gemGeo, gemMat);
  gemRight.position.set(hw, 0.02, 0.04);
  tokenBody.add(gemRight);

  // ── 3. Additive Aura Halo Plane (Behind the Token) ──
  const auraMat = new THREE.MeshBasicMaterial({
    map: getAuraTexture(),
    transparent: true,
    opacity: isWhite ? 0.4 : 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: isWhite ? 0xfef08a : 0xef4444
  });
  const auraGeo = new THREE.PlaneGeometry(artW * 1.5, artH * 1.4);
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.set(0, (h / 2), -0.08);
  tokenBody.add(auraMesh);

  root.add(tokenBody);

  // ── 4. Metadata & Animation Registry Tagging ──
  root.userData = {
    isSanctuaryBeast: true,
    beastType: normType,
    beastColor: color,
    info,
    tokenBody,
    runeDisc,
    auraMesh,
    gemMat,
    baseY: 0,
    hoverOffset: 0,
    animPhase: Math.random() * Math.PI * 2,
    isHovered: false,
    isSelected: false
  };

  return root;
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
        targetElevation = 0.28;
      } else if (isHovered) {
        targetElevation = 0.16;
      }

      // Smooth lerp to target elevation
      ud.hoverOffset += (targetElevation - ud.hoverOffset) * Math.min(dt * 12, 1.0);

      // Procedural Idle Floating/Breathing Sine Wave
      const idleBob = Math.sin(time * 2.2 + ud.animPhase) * 0.025;
      const idleTilt = Math.sin(time * 1.8 + ud.animPhase) * 0.015;

      if (ud.tokenBody) {
        ud.tokenBody.position.y = 0.10 + ud.hoverOffset + idleBob;
        ud.tokenBody.rotation.z = idleTilt;

        // Subtle camera orientation assist (keeps artwork oriented towards player)
        if (camera) {
          const camRotY = camera.rotation.y || 0;
          ud.tokenBody.rotation.y = THREE.MathUtils.lerp(
            ud.tokenBody.rotation.y,
            camRotY * 0.25,
            Math.min(dt * 4, 1.0)
          );
        }
      }

      // Pulsing Rune Disc on the pedestal
      if (ud.runeDisc && ud.runeDisc.material) {
        const baseOpacity = ud.beastColor === 'w' ? 0.75 : 0.85;
        const pulse = Math.sin(time * 3.5 + ud.animPhase) * 0.20;
        const activeBonus = isSelected ? 0.35 : isHovered ? 0.20 : 0;
        ud.runeDisc.material.opacity = Math.min(baseOpacity + pulse + activeBonus, 1.0);
      }

      // Glowing Aura Intensity
      if (ud.auraMesh && ud.auraMesh.material) {
        const auraBase = ud.beastColor === 'w' ? 0.35 : 0.55;
        const auraPulse = Math.sin(time * 2.8 + ud.animPhase) * 0.15;
        const auraBonus = isSelected ? 0.4 : isHovered ? 0.25 : 0;
        ud.auraMesh.material.opacity = Math.min(auraBase + auraPulse + auraBonus, 1.0);
      }
    }
  }
}
