# 추출 A — Ding-Ding-Projects/farming-game e6f317a (보조 에이전트 원문, 통합자 대조 전)

경로는 저장소 기준 상대 경로다.

### 1. 작물 정의와 성장
- 작물 타입: src/game/types.ts:41 «export interface CropDef»
  - 계절: src/game/types.ts:45 «seasons: Season[]» · 씨앗값: src/game/types.ts:46 «seedCost: number» · 기준가: src/game/types.ts:47 «basePrice: number»
  - 단계별 일수: src/game/types.ts:49 «stageDays: number[]» (물 준 날만 센다: src/game/types.ts:48 «Watered days required»)
  - 수확 개수: src/game/types.ts:50 «yieldMin», src/game/types.ts:51 «yieldMax»
  - 재수확: src/game/types.ts:53 «regrowDays: number | null» (null = 한 번 수확)
  - 렌더 값: src/game/types.ts:54 «art: PlantArt»
- 레벨 문턱: src/game/crops.ts:31 «level: number», 잠긴 작물은 회색으로 보인다: src/game/crops.ts:21 «`level` is the progression gate»
- 예: 밀 src/game/crops.ts:41 «seedCost: 14», src/game/crops.ts:43 «stageDays: [1, 1, 1, 1]» · 멜론 src/game/crops.ts:277 «seedCost: 80», src/game/crops.ts:278 «basePrice: 280» · 딸기 src/game/crops.ts:176 «regrowDays: 5»
- 식물 상태: src/game/types.ts:60 «stage: number», src/game/types.ts:62 «progress: number», src/game/types.ts:64 «dry: number», src/game/types.ts:67 «fertilized: boolean», src/game/types.ts:69 «regrown: number»
- 전체 성장일: src/game/crops.ts:490 «export function totalGrowDays», src/game/crops.ts:492 «days += d» · 익음: src/game/crops.ts:497 «plant.stage >= crop.stageDays.length»
- 계절 필터: src/game/crops.ts:486 «export function cropsForSeason», src/game/crops.ts:487 «c.seasons.includes(season)»
- 재수확 단계 되돌리기: src/game/actions.ts:316 «function regrowStage», src/game/actions.ts:319 «crop.regrowDays ?? 1», src/game/actions.ts:326 «Math.min(stage, stages.length - 1)»
- 희귀도 사다리는 없고 품질 3단계: src/game/types.ts:17 «'normal' | 'silver' | 'gold'», 배수 src/game/constants.ts:58 «silver: 1.25», src/game/constants.ts:59 «gold: 1.5», 판매값 src/game/crops.ts:502 «Math.floor(crop.basePrice * QUALITY_MULTIPLIER[quality])»
- 품질 확률: src/game/actions.ts:331 «fertilized ? 0.2 : 0.08», src/game/actions.ts:332 «fertilized ? 0.34 : 0.22», src/game/actions.ts:333 «Math.min(regrown, 4) * 0.02» · 개수 src/game/actions.ts:374 «randInt(rand, crop.yieldMin, crop.yieldMax)»

### 2. 상점과 시장
- src/game/shop.ts:7 «export interface ShopEntry», src/game/shop.ts:11 «stock: number | null», src/game/shop.ts:10 «null means the shop never runs out»
- 실제로는 전부 무한 재고: src/game/shop.ts:61 «stock: null», src/game/shop.ts:70 «stock: null» · 검사 코드만 있다: src/game/shop.ts:115 «entry.stock !== null && entry.stock < n»
- 진열은 고정(계절 씨앗 + 상품 2종): src/game/shop.ts:52 «cropsForSeason(state.season)», src/game/shop.ts:17 «sprinkler: 400», src/game/shop.ts:18 «fertilizer: 100», 계절 밖 거절 src/game/shop.ts:113 «IS NOT SOLD THIS SEASON»
- 되팔기 절반: src/game/shop.ts:29 «function buyBack», src/game/shop.ts:30 «Math.floor(price / 2)», src/game/shop.ts:82 «buyBack(crop.seedCost)», 수확물 src/game/shop.ts:86 «produceValue(crop, item.quality)»
- 자리 먼저 확인: src/game/shop.ts:126 «spaceCheck(state, entry.item, n)»
- 시세: src/game/economy.ts:666 «econ.base * q * supply * demand * reputationBonus», src/game/economy.ts:436 «1 / Math.pow(safeIndex, safeElasticity)», src/game/economy.ts:52 «SUPPLY_FACTOR_MIN = 0.4», src/game/economy.ts:53 «SUPPLY_FACTOR_MAX = 1.8», src/game/economy.ts:767 «current + units / marketDepth(item)», src/game/economy.ts:791 «1 + (market.supply[key] - 1) * (1 - recovery)»
- 주간 이벤트: src/game/economy.ts:72 «DAYS_PER_WEEK = 7», src/game/economy.ts:285 «Math.floor(day / DAYS_PER_WEEK)», src/game/economy.ts:464 «quiet: { weight: 34», src/game/economy.ts:468 «caravan: { weight: 15, days: 2, multiplier: 1.1 }», 시드 src/game/economy.ts:539 «market:event:${week}», 주마다 한 번 src/game/economy.ts:804 «state.market.eventWeek === week»
- 불일치: src/game/economy.ts:609 «export function caravanSeed», src/game/economy.ts:615 «!cropById(id)?.seasons.includes(season)» 는 src 안에서 호출되지 않는데 UI 는 src/shell/ui/ledger.ts:255 «a rare seed in the shop» 라고 말한다.
- 주문 게시판 3칸: src/game/market.ts:83 «DELIVERY_OFFERS = 3», 빈 칸만 채움 src/game/market.ts:705 «countOffers(next, 'delivery'); i < DELIVERY_OFFERS», src/game/market.ts:692 «!order.accepted», 기한 src/game/market.ts:838 «order.dueDay >= today»
- 노점: src/game/market.ts:43 «STALL_SLOTS = 6», src/game/market.ts:46 «STALL_PRICE_FLOOR = 0.5», src/game/market.ts:47 «STALL_PRICE_CEILING = 2», src/game/market.ts:66 «STALL_NIGHTLY_CAP = 12», src/game/farm-types.ts:276 «export interface StallSlot»

### 3. 배치
- 발자국: src/game/farm-types.ts:32 «export interface Footprint», 왼쪽 위 기준 src/game/farm-types.ts:58 «Top-left tile of the footprint». 회전 없음("rotat" 0건).
- src/game/placement.ts:137 «export function tilesOf», 땅 src/game/placement.ts:44 «new Set<Ground>(['grass', 'soil', 'path'])», 이유 우선순위 src/game/placement.ts:75 «REASON_PRIORITY», 작물 src/game/placement.ts:329 «tile.plant !== null», 겹침 src/game/placement.ts:332 «buildings.has(index)»
- 접근성 BFS: src/game/placement.ts:365 «function isReachable», src/game/placement.ts:376 «const ay = oy + h»
- 점유 거울: src/game/types.ts:85 «buildingId: string | null», src/game/placement.ts:217 «function syncTileBuildings», 이동 시 자기 제외 src/game/placement.ts:432 «ignoreId: string | null»
- 비용: src/game/placement.ts:62 «MOVE_FEE_RATE = 0.05», src/game/placement.ts:63 «MOVE_FEE_MIN = 100», src/game/placement.ts:66 «DEMOLISH_REFUND = 0», src/game/placement.ts:9 «Nothing is spent until»
- 꾸미기 보관함 없음. 수량 상한만: src/game/storage.ts:45 «SILO_START_CAP = 150», src/game/storage.ts:48 «BARN_START_CAP = 200», src/game/storage.ts:56 «STORE_CAP_STEP = 25», src/game/storage.ts:94 «export function storeOf»

### 4. 시간
- src/game/constants.ts:27 «DAYS_PER_SEASON = 28», src/game/constants.ts:28 «SEASONS = ['spring', 'summer', 'fall', 'winter']», src/game/time.ts:48 «(seasonIndex(season) + 1) % SEASONS.length», src/game/economy.ts:281 «seasons * DAYS_PER_SEASON + (day - 1)»
- 밤 정산 src/game/actions.ts:612 «export function sleep»: 성장 src/game/actions.ts:649 «while (p.stage < crop.stageDays.length», 비료 src/game/actions.ts:647 «dayEnded % 2 === 0 ? 2 : 1», 시듦 src/game/actions.ts:661 «p.dry >= DRY_DAYS_TO_WITHER», 이자·세금 src/game/actions.ts:685 «dayEnded >= DAYS_PER_SEASON», 날짜 src/game/actions.ts:702 «s.day += 1», 해 src/game/actions.ts:708 «if (s.season === 'spring') s.year += 1», 계절 밖 제거 src/game/actions.ts:717 «!crop.seasons.includes(s.season)», 시장 src/game/actions.ts:725 «dailyRecovery(s)», src/game/actions.ts:726 «refreshEvent(s)», src/game/actions.ts:727 «expireOrders(s)», src/game/actions.ts:729 «offerOrders(s, rand)»

### 5. 저장
- src/game/constants.ts:66 «SAVE_VERSION = 1», src/game/save.ts:79 «version: SAVE_VERSION», 버전 다르면 null src/game/save.ts:86 «raw['version'] !== SAVE_VERSION», src/game/save.ts:82 «Never throws», 필드 추가 시 버전 유지 src/game/save.ts:348 «deliberately **not** bumped», src/game/save.ts:360 «value.slice(0, MAX_LIST)», src/game/save.ts:75 «MAX_LIST = 4096»

### 6. 결정적 난수
- src/game/rng.ts:7 «mulberry32», src/game/rng.ts:19 «hashString», src/game/rng.ts:29 «export function rngFor», src/game/rng.ts:32 «0x9e3779b1»
- 시드: src/game/types.ts:129 «seed: number», 새 게임에서 한 번 src/renderer/main.ts:179 «Math.random() * 0x7fffffff»
- 솔트: src/game/actions.ts:614 «night:${s.year}:${s.season}:${s.day}», src/game/actions.ts:372 «harvest:${state.year}», src/game/economy.ts:616 «market:caravan:${weekOf(day)}»

### 보조 에이전트 제안 — 옮길 것
1. CropDef 형태(stageDays=판 수 배열, regrowDays, yieldMin/Max, level, seasons), regrowStage, 품질 3단계를 희귀도 뼈대로.
2. G4 매대: ShopEntry + `restockAtMatch`, offerOrders 식 "빈 칸만 채우기", `rngFor(seed, 'shelf:'+matchNo)`.
3. 판 끝 정산 함수 하나(sleep 순서에서 날씨·물·시듦·에너지 제외).
4. 배치: Footprint + 왼쪽 위 기준 + REASON_PRIORITY + ignoreId + 점유 거울. 회전·보관함은 우리가 더한다.
5. rngFor + mulberry32, 판 번호 솔트, 버전별 마이그레이션은 우리가 더한다.

### 옮기면 안 되는 것
물 주기·시듦·날씨·에너지·분 단위 시계, 공급 지수 가격 하락, 대출·세금, 호출되지 않는 caravanSeed, 버전 불일치 시 저장 폐기, 철거 환불 0·이동 수수료.
