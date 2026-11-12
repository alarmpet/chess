# 추출 C — 꾸미기 배치와 주간 콘텐츠 (보조 에이전트 원문, 통합자 대조 전)

## 1) mykonos-island-voxels (ca5faee)
- 점유 배열: `mykonos-island-voxels/src/grid/TileMap.js:28 «this._occupancy = new Array(width * height).fill(null)»`, 소유 객체 참조 `mykonos-island-voxels/src/grid/TileMap.js:62 «return this._occupancy[gy * this.width + gx] || null»`
- `mykonos-island-voxels/src/grid/TileMap.js:66 «isFreeFor(gx, gy, w, d)»`, `mykonos-island-voxels/src/grid/TileMap.js:70 «if (!this.inBounds(cx, cy)) return false»`, `mykonos-island-voxels/src/grid/TileMap.js:71 «if (this._occupancy[cy * this.width + cx]) return false»`
- 기록·지우기 한 함수: `mykonos-island-voxels/src/grid/TileMap.js:78 «this._stampOccupancy(obj, obj)»`, `mykonos-island-voxels/src/grid/TileMap.js:88 «this._stampOccupancy(target, null)»`, `mykonos-island-voxels/src/grid/TileMap.js:129 «const fp = obj.footprint || { w: 1, d: 1 }»`
- 불러올 때 다시 계산: `mykonos-island-voxels/src/grid/TileMap.js:122 «for (const obj of this.objects) this._stampOccupancy(obj, obj)»`
- 버그 후보: `mykonos-island-voxels/src/grid/TileMap.js:123 «this._nextId = this.objects.length + 1»` (중간 삭제 뒤 id 겹침 가능)
- `mykonos-island-voxels/src/building/PlacedObject.js:13 «this.footprint = footprint; // { w, d }»`, 뒤집기만 `mykonos-island-voxels/src/building/PlacedObject.js:14 «this.flipH = !!flipH»`, 저장 `mykonos-island-voxels/src/building/PlacedObject.js:46 «footprint: { ...this.footprint }»`
- `mykonos-island-voxels/src/building/PlacementSystem.js:22 «return this.tileMap.inBounds(gx, gy)»`, `mykonos-island-voxels/src/building/PlacementSystem.js:26 «return this.tileMap.isFreeFor(gx, gy, asset.footprint.w, asset.footprint.d)»`, `mykonos-island-voxels/src/building/PlacementSystem.js:57 «const obj = this.tileMap.objectAt(gx, gy)»`
- 저장: `mykonos-island-voxels/src/config.js:43 «storageKey: 'mykonos-island-voxels.save.v1'»`, `mykonos-island-voxels/src/storage/SaveSystem.js:16 «v: 1,»`, `mykonos-island-voxels/src/storage/SaveSystem.js:25 «localStorage.setItem(KEY, JSON.stringify(payload))»`
- 되돌리기 없음: `mykonos-island-voxels/src/ui/Toolbar.js:116 «reset → circular arrow (refresh / undo)»`

## 2) pogicity-demo (e7c6928)
- `pogicity-demo/app/data/buildings.ts:12 «export interface BuildingDefinition»`, `pogicity-demo/app/data/buildings.ts:16 «footprint: { width: number; height: number }»`, `pogicity-demo/app/data/buildings.ts:18 «footprintByOrientation?: {»`, `pogicity-demo/app/data/buildings.ts:26 «renderSize?: { width: number; height: number }»`, `pogicity-demo/app/data/buildings.ts:34 «supportsRotation?: boolean»`, `pogicity-demo/app/data/buildings.ts:35 «isDecoration?: boolean»`, `pogicity-demo/app/data/buildings.ts:28 «south: string»`
- 방향별 크기는 데이터로: `pogicity-demo/app/data/buildings.ts:43 «if (!building.footprintByOrientation || !orientation) {»`, `pogicity-demo/app/data/buildings.ts:162 «east: { width: 3, height: 4 },»`
- 회전 입력: `pogicity-demo/app/components/game/GameBoard.tsx:193 «building?.supportsRotation && (e.key === "r" || e.key === "R")»`, `pogicity-demo/app/components/game/GameBoard.tsx:197 «case Direction.Down:»`, `pogicity-demo/app/components/game/GameBoard.tsx:171 «setBuildingOrientation(Direction.Down)»`
- 배치 검사: `pogicity-demo/app/components/game/GameBoard.tsx:401 «const footprint = getBuildingFootprint(»`, `pogicity-demo/app/components/game/GameBoard.tsx:405 «const bOriginX = x - footprint.width + 1»`, `pogicity-demo/app/components/game/GameBoard.tsx:434 «if (isDecoration) {»`, `pogicity-demo/app/components/game/GameBoard.tsx:444 «if (cellType !== TileType.Grass) {»`
- 칸마다 원점 복사: `pogicity-demo/app/components/game/GameBoard.tsx:464 «newGrid[py][px].originX = bOriginX»`, `pogicity-demo/app/components/game/GameBoard.tsx:470 «newGrid[py][px].buildingOrientation = buildingOrientation»`, `pogicity-demo/app/components/game/types.ts:26 «isOrigin?: boolean»`
- 저장 슬롯: `pogicity-demo/app/components/game/GameBoard.tsx:968 «key.startsWith("pogicity_save_")»`, `pogicity-demo/app/components/game/GameBoard.tsx:987 «timestamp: Date.now(),»`

## 3) harvest-hollow (9b23e1a)
- 장식 표: `harvest-hollow/shared/content/decor.js:7 «layer: 'object', size: [1, 1], unlock: 1,»`, `harvest-hollow/shared/content/decor.js:13 «layer: 'ground'»`
- 회전: `harvest-hollow/shared/rules/grid.js:2 «rot is quarter turns and odd rot swaps w and d»`, `harvest-hollow/shared/rules/grid.js:16 «return rot % 2 ? [d, w] : [w, d]»`
- `harvest-hollow/shared/rules/grid.js:159 «export function canPlace(state, defId, x, z, rot = 0, ignoreId = null)»`, `harvest-hollow/shared/rules/grid.js:184 «if (owner !== null && owner !== ignoreId) return ERR.BLOCKED»`, 같은 층만 `harvest-hollow/shared/rules/grid.js:183 «const owner = g[def.layer][i]»`
- 보관함: `harvest-hollow/shared/rules/actions/decor.js:177 «const fromTray = (state, defId) => (state.farm.storage[defId] ?? 0) > 0»`, `harvest-hollow/shared/rules/actions/decor.js:377 «tx.del(['farm', 'objects', a.id])»`, `harvest-hollow/shared/rules/actions/decor.js:364 «if (def.kind !== 'decor') return ERR.LOCKED»`
- 옮긴 뒤 되돌리기 창: `harvest-hollow/shared/rules/actions/decor.js:290 «until: ctx.now + SAFETY.moveBackMs»`, `harvest-hollow/shared/rules/actions/decor.js:342 «if (ctx.now >= o.prev.until) return ERR.NOT_REFUNDABLE»`
- 달력: `harvest-hollow/shared/rules/calendar.js:36 «return Math.floor(Date.UTC(p.year, p.month - 1, p.day) / DAY_MS)»`, `harvest-hollow/shared/rules/calendar.js:40 «export const weekIndex = (day) => Math.floor((day + 3) / 7)»`, `harvest-hollow/shared/rules/calendar.js:44 «['winter', 'spring', 'summer', 'autumn'][Math.floor((parts(now, tz).month % 12) / 3)]»`, `harvest-hollow/shared/rules/calendar.js:4 «Never use the browser's zone or Date#getDay/getMonth in rules»`
- `harvest-hollow/shared/rules/coop.js:83 «export const weekStartDay = (w) => 7 * w - 3»`, `harvest-hollow/shared/rules/actions/fair.js:56 «fairCloseAt = (state, w) => localAt(state.meta.tz, weekStartDay(w) + FAIR.closeDay, FAIR.closeHour)»`
- 주간 행사: `harvest-hollow/shared/content/weekly.js:13 «export const FAIR = {»`, `harvest-hollow/shared/content/weekly.js:19 «closeDay: 6,»`, `harvest-hollow/shared/content/weekly.js:34 «{ id: 'bronze1', name: 'Bronze I', atBp: 2000 },»`, `harvest-hollow/shared/content/weekly.js:58 «farms: ['Brambleton', 'Oakhurst', 'Mill Creek', 'Cobble Hill', 'Fennimore']»`, `harvest-hollow/shared/rules/actions/league.js:74 «const h = hash32(state.meta.farmSeed, 'league', w, i)»`
- 주 상태에 주차 번호: `harvest-hollow/shared/rules/actions/fair.js:241 «const cur = { w, W, L, p: 0, by: {}, ent: {}, open: true }»`, `harvest-hollow/shared/rules/actions/fair.js:157 «if (cur.w !== weekOf(state, now) || now >= fairCloseAt(state, cur.w)) return null»`
- 계절: `harvest-hollow/shared/content/crops.js:9 «season: 'winter'»`, `harvest-hollow/shared/rules/economy.js:290 «cropOf(cropId)?.season === seasonOf(now, state.meta.tz)»`, `harvest-hollow/shared/content/daily.js:24 «seasonDecor: { spring: 'tulip_planter', summer: 'sunflower_planter', autumn: 'pumpkin_lanterns',»`
- 주문: `harvest-hollow/shared/content/orders.js:12 «refillMs: min(15),»`, `harvest-hollow/shared/content/orders.js:77 «meter: {»`
- 축제(연간): `harvest-hollow/shared/content/festivals.js:1 «every festival»`, `harvest-hollow/shared/content/festivals.js:11 «start: [2, 7], days: 10»`
- 난수: `harvest-hollow/shared/rules/rng.js:4 «Math.random is banned in shared/»`
- 서버: `harvest-hollow/server/scheduler.js:77 «nextSystemDueAt(this.engine.state, now, this.engine.dueEnv(now))»`, `harvest-hollow/server/scheduler.js:20 «export const MAX_DELAY = 60 * 60 * 1000»`, `harvest-hollow/shared/rules/system.js:291 «if (fairDue(state, now)) due.push({ type: '_fair', args: {} })»`, `harvest-hollow/shared/rules/system.js:310 «export function nextDayStart(now, tz)»`, `harvest-hollow/shared/rules/actions/fair.js:292 «unseen[pid] = [...ceremonyQueue(tx.state, pid, cur.w), last].slice(-FAIR_UNSEEN_MAX)»`
- 앱을 열 때 지난 주 닫기와 같은 모양: `harvest-hollow/shared/rules/actions/fair.js:319 «if (f.cur && f.cur.open && ctx.now >= fairCloseAt(tx.state, f.cur.w)) ceremony(tx, ctx)»`

## 보조 에이전트 제안 — 옮길 것
1. 64칸 점유 배열에 소유자 참조, 불러올 때 다시 계산(저장하지 않음).
2. decor `{kind, sq, rot}`, rot 0~3, 홀수면 w·d 맞바꿈. 비대칭만 `footprintByOrientation`.
3. `canPlace` → null 또는 오류 코드, `ignoreId`. 미리보기와 배치가 같은 함수.
4. ground / object 두 층.
5. 보관함 `storage[kind] = 개수`.
6. 주차: 기기 날짜 → dayIndex → `Math.floor((day+3)/7)`(월요일 시작), 내용은 `hash(saveSeed,'week',w)` 로 순환 표에서.
7. 주간 상태에 `w` 를 달고, 앱을 열 때 바뀌었으면 지난 주를 닫는다(스케줄러 불필요).
8. 다음 id 는 max(id)+1.

## 옮기면 안 되는 것
서버 스케줄러·멀티 대기열, 마감 시각·남은 시간, IANA 시간대 고정, ms 타이머(15분 주문·10분 되돌리기), 칸마다 원점 복사, 오른쪽 아래 기준점, flip 으로 회전 대신, pogicity `/public` 아트, 연 1회 축제.
