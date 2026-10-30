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

// Cathedral Special Relic Resources
export interface SpecialResourceDef {
  id: 'sacredAsh' | 'marbleDust';
  name: string;
  nameEn: string;
  icon: string;
  description: string;
}

export const SPECIAL_RESOURCES: Record<string, SpecialResourceDef> = {
  sacredAsh: {
    id: 'sacredAsh',
    name: '정화된 성회',
    nameEn: 'Purified Sacred Ash',
    icon: '🔥',
    description: '대성당 화로의 신성한 불꽃에 악이 소각되며 남긴 거룩한 재입니다. 토양의 생명력을 극대화합니다.'
  },
  marbleDust: {
    id: 'marbleDust',
    name: '축복받은 대리석',
    nameEn: 'Consecrated Marble Dust',
    icon: '🏛️',
    description: '기둥과 석조물에 가해진 충격으로 부서져 내린 고딕 대리석 파편입니다. 수도원 건축 복원의 핵심 자재입니다.'
  }
};

// 6 Monastery Restoration Zones
export interface RestorationCost {
  gold?: number;
  gems?: number;
  sacredAsh?: number;
  marbleDust?: number;
}

export interface RestorationZoneDef {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  cost: RestorationCost;
  description: string;
  perkDescription: string;
  buffType: 'mana' | 'shield' | 'growth' | 'ash' | 'marble' | 'revive';
}

export const RESTORATION_ZONES: Record<string, RestorationZoneDef> = {
  cloister_walkway: {
    id: 'cloister_walkway',
    name: '무너진 수도원 회랑',
    nameEn: 'Ruined Cloister Walkway',
    icon: '🏛️',
    cost: { marbleDust: 6, gold: 120 },
    description: '전투 중 부서진 대리석을 엮어 복원한 고딕 양식의 석조 아치 회랑입니다.',
    perkDescription: '기둥 격돌 시 대리석 획득량 2배 (+4개) 및 아군 기물 충돌 방어력 강화',
    buffType: 'marble'
  },
  herb_sanctuary: {
    id: 'herb_sanctuary',
    name: '성스러운 약초원',
    nameEn: 'Sacred Herb Sanctuary',
    icon: '🌿',
    cost: { sacredAsh: 6, gold: 100 },
    description: '화로 소각 성회로 토양을 정화하여 마력 약초를 고속 재배하는 정원입니다.',
    perkDescription: '모든 작물 밭에 비옥한 토양 버프 적용 (턴당 성장률 +15% 가속)',
    buffType: 'growth'
  },
  stained_glass: {
    id: 'stained_glass',
    name: '대성당 로즈 스테인드글라스',
    nameEn: 'Cathedral Rose Window',
    icon: '✨',
    cost: { gems: 4, gold: 200, marbleDust: 4 },
    description: '빛과 영광을 투과하는 대성당의 신성한 장미창을 완벽히 복원합니다.',
    perkDescription: '체스 대국 시작 마나 +1 영구 증가 (최대 5마나 선제 사용 가능)',
    buffType: 'mana'
  },
  altar_brewery: {
    id: 'altar_brewery',
    name: '성배 양조대',
    nameEn: 'Altar Holy Brewery',
    icon: '🍷',
    cost: { sacredAsh: 8, gems: 2, gold: 150 },
    description: '재배한 약초와 성회를 조합하여 축복의 성유(Holy Oil)를 양조합니다.',
    perkDescription: '화로 소각 처형 시 성회 획득량 2배 (+4개) 및 메테오 화염 반경 확장',
    buffType: 'ash'
  },
  bell_tower: {
    id: 'bell_tower',
    name: '천사 종탑',
    nameEn: 'Angelic Bell Tower',
    icon: '🔔',
    cost: { marbleDust: 10, gold: 250 },
    description: '사악한 기운을 물리치고 승리의 종소리를 대성당 전역에 울려 퍼지게 합니다.',
    perkDescription: '대국 승리 및 기물 포획 골드 획득량 1.5배 영구 증폭',
    buffType: 'shield'
  },
  high_altar: {
    id: 'high_altar',
    name: '지고의 성소 제단',
    nameEn: 'Grand Sanctum High Altar',
    icon: '🏛️',
    cost: { marbleDust: 12, sacredAsh: 12, gems: 6, gold: 400 },
    description: '모든 수도원 구역의 마력을 집대성한 궁극의 성소 중앙 제단입니다.',
    perkDescription: '킹(King) 피격 시 1회 100% 자동 부활 영약 부여 및 체크메이트 승리 보석 2배',
    buffType: 'revive'
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
  checkmateGems: 3,
  brazierKillAsh: 2,
  pillarKillMarble: 2,
  checkmateAsh: 5,
  checkmateMarble: 5
};
