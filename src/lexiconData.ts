// Lexicon Dataset for Lexicon Chess: Sanctuary of Words
// Categorized by Etymology (Prefix + Root + Suffix), Tactical Theme, and Learning Level.

export interface LexiconWord {
  id: string;
  word: string;
  phonetic: string;
  meaningKo: string;
  meaningEn: string;
  prefix?: string;
  prefixMeaning?: string;
  root?: string;
  rootMeaning?: string;
  suffix?: string;
  suffixMeaning?: string;
  etymologyStory: string;
  exampleSentence: string;
  category: 'tactics' | 'magic' | 'mind' | 'power' | 'cathedral';
  level: 1 | 2 | 3; // 1: Novice, 2: Knight (CSAT/SAT), 3: Archmage (GRE/TOEFL)
  options: string[]; // 3 multiple-choice options (one of which is meaningKo)
  spellBonus?: 'mana' | 'shield' | 'damage' | 'speed';
}

export const LEXICON_WORDS: LexiconWord[] = [
  // --- 1. Spellcraft & Etymology Core ---
  {
    id: 'teleport',
    word: 'TELEPORT',
    phonetic: '/ˈtel.ə.pɔːrt/',
    meaningKo: '순간이동하다, 원격 이동시키다',
    meaningEn: 'To transport across space or distance instantly',
    prefix: 'tele-',
    prefixMeaning: '멀리 (far / distant)',
    root: 'port',
    rootMeaning: '나르다, 운반하다 (to carry)',
    etymologyStory: '그리스어 tele(멀리)와 라틴어 portare(나르다)가 결합하여 "먼 거리를 단숨에 운반하다"라는 뜻이 되었습니다.',
    exampleSentence: 'The wizard used arcane energy to teleport behind the enemy line.',
    category: 'magic',
    level: 1,
    options: ['순간이동하다, 원격 이동시키다', '영구히 봉인하다', '벽을 쌓아 방어하다'],
    spellBonus: 'speed'
  },
  {
    id: 'petrify',
    word: 'PETRIFY',
    phonetic: '/ˈpet.rə.faɪ/',
    meaningKo: '석화시키다, 돌처럼 굳게 만들다',
    meaningEn: 'To turn into stone; to paralyze with fear or power',
    prefix: 'petr-',
    prefixMeaning: '돌, 바위 (rock / stone)',
    suffix: '-ify',
    suffixMeaning: '~하게 만들다 (to make / cause to become)',
    etymologyStory: '그리스어 petra(바위/돌)와 동사형 접미사 -ify가 합쳐져 "바위처럼 굳어버리게 하다"를 의미합니다.',
    exampleSentence: 'Lightning strikes the opposing knight, petrifying it into lifeless stone.',
    category: 'magic',
    level: 2,
    options: ['석화시키다, 돌처럼 굳게 만들다', '불꽃으로 태우다', '치유하여 회복시키다'],
    spellBonus: 'mana'
  },
  {
    id: 'sanctuary',
    word: 'SANCTUARY',
    phonetic: '/ˈsæŋk.tʃu.er.i/',
    meaningKo: '성소, 안식처, 피난처',
    meaningEn: 'A sacred place, refuge, or holy shelter',
    root: 'sanct',
    rootMeaning: '거룩한, 신성한 (holy / sacred)',
    suffix: '-uary',
    suffixMeaning: '~의 장소 (a place of)',
    etymologyStory: '라틴어 sanctus(신성한)에서 유래하여 어떤 침략자도 함부로 해칠 수 없는 "거룩한 보호의 장소"를 뜻합니다.',
    exampleSentence: 'The King retreated into the divine sanctuary to evade the checkmate.',
    category: 'cathedral',
    level: 1,
    options: ['성소, 안식처, 피난처', '위험한 미궁', '전쟁터의 최전선'],
    spellBonus: 'shield'
  },
  {
    id: 'cataclysm',
    word: 'CATACLYSM',
    phonetic: '/ˈkæt.ə.klɪz.əm/',
    meaningKo: '대재앙, 격변, 대격동',
    meaningEn: 'A violent upheaval or sudden massive disaster',
    prefix: 'cata-',
    prefixMeaning: '완전히 아래로 (down / thoroughly)',
    root: 'clysm',
    rootMeaning: '씻어내다, 휩쓸다 (to wash / flood)',
    etymologyStory: '그리스어 cata(완전히 아래로)와 klyzein(휩쓸다)이 합쳐져 모든 것을 파괴하며 휩쓰는 거대한 대재앙을 뜻합니다.',
    exampleSentence: 'A brazier cataclysm rained fire from the vaulted ceiling of the cathedral.',
    category: 'power',
    level: 3,
    options: ['대재앙, 격변, 대격동', '새로운 탄생과 축복', '조용한 침묵의 시간'],
    spellBonus: 'damage'
  },
  {
    id: 'transform',
    word: 'TRANSFORM',
    phonetic: '/trænsˈfɔːrm/',
    meaningKo: '완전히 변형시키다, 승급시키다',
    meaningEn: 'To change thoroughly in form, nature, or appearance',
    prefix: 'trans-',
    prefixMeaning: '너머로, 가로질러 (across / beyond)',
    root: 'form',
    rootMeaning: '형태, 모양 (shape / structure)',
    etymologyStory: '라틴어 trans(경계를 넘어)와 formare(형태를 짓다)가 결합되어 한 형태에서 다른 형태로 거듭나는 것을 말합니다.',
    exampleSentence: 'The humble pawn transformed into a towering stone Queen.',
    category: 'magic',
    level: 1,
    options: ['완전히 변형시키다, 승급시키다', '원래대로 되돌리다', '기능을 정지시키다'],
    spellBonus: 'mana'
  },

  // --- 2. High-Frequency Tactical & Battle Words ---
  {
    id: 'vulnerable',
    word: 'VULNERABLE',
    phonetic: '/ˈvʌl.nər.ə.bəl/',
    meaningKo: '상처 입기 쉬운, 취약한',
    meaningEn: 'Susceptible to physical or emotional attack or damage',
    root: 'vulner',
    rootMeaning: '상처 (wound)',
    suffix: '-able',
    suffixMeaning: '~할 수 있는 (capable of being)',
    etymologyStory: '라틴어 vulnerare(상처를 입히다)에서 유래하여 적의 칼날이나 공격에 무방비로 노출된 상태를 의미합니다.',
    exampleSentence: 'An unguarded square leaves the black bishop extremely vulnerable.',
    category: 'tactics',
    level: 2,
    options: ['상처 입기 쉬운, 취약한', '철벽처럼 단단한', '빠르게 도망치는']
  },
  {
    id: 'invincible',
    word: 'INVINCIBLE',
    phonetic: '/ɪnˈvɪn.sə.bəl/',
    meaningKo: '천하무적의, 정복할 수 없는',
    meaningEn: 'Too powerful to be defeated or overcome',
    prefix: 'in-',
    prefixMeaning: '아닌 (not / un-)',
    root: 'vinc',
    rootMeaning: '이기다, 정복하다 (to conquer)',
    suffix: '-ible',
    suffixMeaning: '~할 수 있는 (able to be)',
    etymologyStory: 'in-(부정) + vincere(정복하다)가 결합하여 "그 어떤 적도 쓰러뜨릴 수 없는" 무적의 기물을 뜻합니다.',
    exampleSentence: 'Protected by the golden runic shield, the knight was virtually invincible.',
    category: 'power',
    level: 2,
    options: ['천하무적의, 정복할 수 없는', '쉽게 부서지는', '숨겨져 보이지 않는']
  },
  {
    id: 'resilience',
    word: 'RESILIENCE',
    phonetic: '/rɪˈzɪl.jəns/',
    meaningKo: '회복력, 탄성, 불굴의 의지',
    meaningEn: 'The capacity to recover quickly from difficulties; toughness',
    prefix: 're-',
    prefixMeaning: '다시 (back / again)',
    root: 'sili',
    rootMeaning: '튀어오르다 (to leap / bounce)',
    suffix: '-ence',
    suffixMeaning: '~의 상태/성질 (quality of)',
    etymologyStory: '라틴어 resilire(뒤로 다시 튀어오르다)에서 유래하여, 아무리 큰 충격을 받아도 원래 상태로 일어서는 힘을 뜻합니다.',
    exampleSentence: 'The defensive fortress demonstrated remarkable resilience against constant assaults.',
    category: 'mind',
    level: 2,
    options: ['회복력, 탄성, 불굴의 의지', '극심한 피로와 절망', '단순한 우연의 일치']
  },
  {
    id: 'malediction',
    word: 'MALEDICTION',
    phonetic: '/ˌmæl.əˈdɪk.ʃən/',
    meaningKo: '저주, 악담, 파멸의 선고',
    meaningEn: 'A magical curse; words uttered to bring evil or destruction',
    prefix: 'male-',
    prefixMeaning: '나쁜, 악한 (bad / evil)',
    root: 'dict',
    rootMeaning: '말하다 (to speak)',
    suffix: '-ion',
    suffixMeaning: '~의 행위/명사화',
    etymologyStory: 'male(악하게) + dicere(말하다)가 합쳐져 상대방의 파멸을 선언하는 어둠의 주문/저주를 나타냅니다.',
    exampleSentence: 'The dark bishop chanted a malediction that sealed the enemy king in stone.',
    category: 'magic',
    level: 3,
    options: ['저주, 악담, 파멸의 선고', '성스러운 축복과 감사', '평화 협정 체결']
  },
  {
    id: 'benefaction',
    word: 'BENEFACTION',
    phonetic: '/ˌben.əˈfæk.ʃən/',
    meaningKo: '은혜, 선행, 자선 기부',
    meaningEn: 'A donation, good deed, or benevolent gift conferring benefit',
    prefix: 'bene-',
    prefixMeaning: '좋은, 선한 (good / well)',
    root: 'fact',
    rootMeaning: '행동하다, 만들다 (to do / make)',
    suffix: '-ion',
    suffixMeaning: '~의 행위',
    etymologyStory: 'bene(선하게) + facere(행하다)가 결합되어 타인에게 베푸는 은혜와 축복의 선물을 의미합니다.',
    exampleSentence: 'The allied bishop granted a divine benefaction, recharging arcane mana for the army.',
    category: 'magic',
    level: 3,
    options: ['은혜, 선행, 자선 기부', '치명적인 배신', '물리적 충돌']
  },
  {
    id: 'momentum',
    word: 'MOMENTUM',
    phonetic: '/məˈmen.təm/',
    meaningKo: '추진력, 탄력, 기세',
    meaningEn: 'The impetus gained by a moving object or advancing strategy',
    root: 'mov / mot',
    rootMeaning: '움직이다 (to move)',
    etymologyStory: '라틴어 movere(움직이다)에서 파생되어 한번 기세를 타면 멈추지 않고 적진을 휩쓰는 전진력을 뜻합니다.',
    exampleSentence: 'Capturing the center pawns gave White unstoppable offensive momentum.',
    category: 'tactics',
    level: 1,
    options: ['추진력, 탄력, 기세', '후퇴와 항복', '혼란과 정체']
  },
  {
    id: 'omnipotent',
    word: 'OMNIPOTENT',
    phonetic: '/ɑːmˈnɪp.ə.t̬ənt/',
    meaningKo: '전능한, 무한한 힘을 가진',
    meaningEn: 'Having unlimited power; able to do anything',
    prefix: 'omni-',
    prefixMeaning: '모든 것의 (all / every)',
    root: 'potent',
    rootMeaning: '강력한, 힘이 있는 (powerful)',
    etymologyStory: '라틴어 omnis(모든 것)와 potens(강한)가 합쳐져 신적인 절대적 권능을 나타내는 단어입니다.',
    exampleSentence: 'With control of both diagonals and ranks, the stone Queen seemed omnipotent.',
    category: 'power',
    level: 3,
    options: ['전능한, 무한한 힘을 가진', '한계에 부딪힌', '의심이 많은']
  },
  {
    id: 'chronicle',
    word: 'CHRONICLE',
    phonetic: '/ˈkrɑː.nɪ.kəl/',
    meaningKo: '연대기, 역사적 기록',
    meaningEn: 'A factual written account of important or historical events',
    root: 'chron',
    rootMeaning: '시간 (time)',
    suffix: '-icle',
    suffixMeaning: '~에 관한 것 (associated with)',
    etymologyStory: '그리스어 chronos(시간)에서 유래하여 시간의 흐름에 따라 체스 명국을 기록하듯 남기는 연대기를 뜻합니다.',
    exampleSentence: 'The Cathedral Grimoire preserves the chronicle of every epic duel on this board.',
    category: 'cathedral',
    level: 2,
    options: ['연대기, 역사적 기록', '지하 감옥의 비밀 열쇠', '불타는 화로의 잔해']
  },
  {
    id: 'inevitable',
    word: 'INEVITABLE',
    phonetic: '/ɪnˈev.ə.t̬ə.bəl/',
    meaningKo: '피할 수 없는, 필연적인',
    meaningEn: 'Certain to happen; unavoidable',
    prefix: 'in-',
    prefixMeaning: '아닌 (not)',
    root: 'evit',
    rootMeaning: '피하다 (to shun / avoid)',
    suffix: '-able',
    suffixMeaning: '~할 수 있는',
    etymologyStory: 'in-(부정) + evitare(피하다)가 결합되어 "그 어떤 수로도 피할 수 없는" 숙명적인 체크메이트를 표현합니다.',
    exampleSentence: 'Surrounded with no legal escape squares, defeat was inevitable.',
    category: 'tactics',
    level: 2,
    options: ['피할 수 없는, 필연적인', '우연히 발생한', '쉽게 변경 가능한']
  },
  {
    id: 'sacred',
    word: 'SACRED',
    phonetic: '/ˈseɪ.krɪd/',
    meaningKo: '신성한, 성스러운, 종교적인',
    meaningEn: 'Connected with God or dedicated to a religious purpose',
    root: 'sacr',
    rootMeaning: '거룩한, 신성한 (holy)',
    etymologyStory: '라틴어 sacrare(신에게 바치다)에서 유래하여 세속의 불결함이 닿지 않는 성당의 순결함을 상징합니다.',
    exampleSentence: 'The stained glass window cast sacred crimson patterns across the marbled tiles.',
    category: 'cathedral',
    level: 1,
    options: ['신성한, 성스러운, 종교적인', '저주받은, 불결한', '상업적인, 이익 중심의']
  }
];
