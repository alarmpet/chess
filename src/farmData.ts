// Farm & Economy Data for Sanctuary Garden: Cloister & Chess

export interface CropDef {
  id: string;
  name: string;
  nameEn: string;
  seedCost: number;
  sellPrice: number;
  growthTimeSeconds: number; // base growth time in real-time seconds
  growthPerChessMove: number; // percentage (0-100) gained instantly per chess turn
  icon: string;
  color: number; // Three.js hex color
  fruitGeometry: 'grapes' | 'wheat' | 'pepper' | 'herb' | 'gourd';
  description: string;
  buffDescription: string;
  buffType: 'mana' | 'gold' | 'meteor' | 'revive' | 'wealth';
}

export const CROPS: Record<string, CropDef> = {
  mana_grape: {
    id: 'mana_grape',
    name: '아케인 마나 포도',
    nameEn: 'Arcane Mana Grape',
    seedCost: 35,
    sellPrice: 75,
    growthTimeSeconds: 40,
    growthPerChessMove: 30, // 3-4 chess moves = ready to harvest!
    icon: '🍇',
    color: 0x9333ea,
    fruitGeometry: 'grapes',
    description: '성소의 마력을 머금고 자라는 보랏빛 포도입니다.',
    buffDescription: '수확 시 체스 대국 시작 마나 +1 영구 증가 (최대 5마나)',
    buffType: 'mana'
  },
  golden_wheat: {
    id: 'golden_wheat',
    name: '태양의 황금 밀',
    nameEn: 'Sun Golden Wheat',
    seedCost: 20,
    sellPrice: 55,
    growthTimeSeconds: 25,
    growthPerChessMove: 40,
    icon: '🌾',
    color: 0xeab308,
    fruitGeometry: 'wheat',
    description: '황금빛으로 출렁이는 수도원의 주식 작물입니다.',
    buffDescription: '수확 시 체스 대국 코인 획득량 1.5배 버프 (3턴 지속)',
    buffType: 'gold'
  },
  flame_pepper: {
    id: 'flame_pepper',
    name: '화로 불꽃 고추',
    nameEn: 'Brazier Flame Pepper',
    seedCost: 45,
    sellPrice: 95,
    growthTimeSeconds: 45,
    growthPerChessMove: 25,
    icon: '🌶️',
    color: 0xef4444,
    fruitGeometry: 'pepper',
    description: '성당 화로의 열기를 먹고 자란 매콤한 화염 작물입니다.',
    buffDescription: '수확 시 메테오 마법 피해가 십자형(Cross) 범위로 확장',
    buffType: 'meteor'
  },
  sacred_herb: {
    id: 'sacred_herb',
    name: '성스러운 생명초',
    nameEn: 'Sacred Life Herb',
    seedCost: 60,
    sellPrice: 130,
    growthTimeSeconds: 60,
    growthPerChessMove: 20,
    icon: '🌿',
    color: 0x10b981,
    fruitGeometry: 'herb',
    description: '치명적인 상처도 치유하는 신비한 약초입니다.',
    buffDescription: '수확 시 킹(King)이 잡혀도 1회 자동 부활하는 영약 제조',
    buffType: 'revive'
  },
  amethyst_gourd: {
    id: 'amethyst_gourd',
    name: '자수정 보석 호박',
    nameEn: 'Amethyst Gourd',
    seedCost: 75,
    sellPrice: 180,
    growthTimeSeconds: 70,
    growthPerChessMove: 20,
    icon: '🎃',
    color: 0xc084fc,
    fruitGeometry: 'gourd',
    description: '보석상들이 탐내는 결정화된 희귀 호박입니다.',
    buffDescription: '고가 판매용 및 체스 말의 자수정 스킨 해금 재료',
    buffType: 'wealth'
  }
};

export interface FacilityDef {
  id: string;
  name: string;
  nameEn: string;
  cost: number;
  icon: string;
  description: string;
  perk: string;
}

export const FACILITIES: Record<string, FacilityDef> = {
  fountain: {
    id: 'fountain',
    name: '성스러운 천사 분수대',
    nameEn: 'Sacred Angel Fountain',
    cost: 250,
    icon: '⛲',
    description: '성당 정원 중앙에 성수를 뿜어내는 대리석 분수대입니다.',
    perk: '정원의 모든 밭에 물을 자동으로 공급 (물주기 노동 생략)'
  },
  apiary: {
    id: 'apiary',
    name: '마법 꿀벌 벌통',
    nameEn: 'Arcane Apiary',
    cost: 200,
    icon: '🐝',
    description: '황금빛 꿀벌들이 꽃가루를 날리며 정원을 가꿉니다.',
    perk: '모든 작물의 성장 속도가 1.5배 가속'
  },
  scarecrow: {
    id: 'scarecrow',
    name: '체스 석상 허수아비',
    nameEn: 'Stone Chess Scarecrow',
    cost: 150,
    icon: '🗿',
    description: '정원을 지키는 고딕 나이트 석상입니다.',
    perk: '작물 수확 시 25% 확률로 수확량 2배 획득'
  }
};

// Chess Loot Values
export const CHESS_LOOT = {
  pawn: 15,
  knight: 35,
  bishop: 35,
  rook: 60,
  queen: 100,
  checkmateWin: 250,
  checkmateGems: 3
};
