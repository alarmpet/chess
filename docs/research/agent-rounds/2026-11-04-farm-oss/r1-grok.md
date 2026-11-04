## 0 한 줄 결론

허용 라이선스 꾸미기 OSS는 **섬 칸 점유(mykonos) + three.js 4방향 회전(CubeCity) + 가구 Occupancy(my-home)** 가 8×8 배치에 맞고, 농장 성장·주간 이벤트 JSON은 이번 꾸미기 조사에 없다.

## 1 후보 표

| owner/repo | 무엇 | 언어 | 라이선스(근거) | 가져갈 구조 | 확인 수준 |
|---|---|---|---|---|---|
| `boona13/mykonos-island-voxels` | 14×14 등축 섬, 팔레트 배치 | JS | MIT. LICENSE 원문 Copyright 2026 boona13 + API MIT | **배치.** `src/grid/TileMap.js`: `_occupancy` 칸→객체, `isFreeFor(gx,gy,w,d)`, `_stampOccupancy`. `src/building/PlacedObject.js`: `{id,assetId,gx,gy,footprint:{w,d},flipH,flipV}`. `PlacementSystem.canPlace`. `CONFIG.storageKey` localStorage | 소스 읽음 |
| `hexianWeb/CubeCity` | three.js 도시, 칸에 건물 | JS | MIT. LICENSE 원문(저작권 헤더 "Doinel Atanasiu"는 스타터 잔여) + API MIT. 기본 브랜치 `big-simcity` | **배치.** `src/stores/useGameState.js`: `metadata[x][y]={type,building,direction,level}` Pinia `persist:true`. `canPlaceBuilding`. `rotateBuilding`: `(direction+1)%4`. R키. 1칸만 점유 | 소스 읽음 |
| `twofactor/pogicity-demo` | Phaser 도시 건물 발자국 | TS | LICENSE 원문 **소스 MIT**, `/public` 아트 제외. API SPDX `NOASSERTION` | **배치.** `app/data/buildings.ts` `BuildingDefinition`: `footprint{width,height}`, `footprintByOrientation{south,north,east,west}`, `supportsRotation` | buildings.ts 읽음 |
| `Jannchie/my-home` | Vue+three 디오라마 가구 | TS | MIT. LICENSE 원문 Copyright 2026 Jianqi Pan + API MIT | **배치.** `src/occupancy.ts` `Occupancy.canPlace(asset,x,y,rot,z)` → Verdict. `footprint()` 90° Box. `Layer` floor/flat/prop/wall/hang. `hold`/`release` keepout. `PassageGrid` | occupancy.ts 일부 잘림, 시그니처 확인 |
| `wy51ai/floorplan-3d` | 단일 HTML 평면도+가구 | HTML/JS | MIT. LICENSE 원문 Copyright 2026 wuyi + API MIT | **배치·카탈로그.** README: `index.html`의 `LIB`(type, name, 기본 크기, 색). R / Shift+R 90°. localStorage | README. LIB 배열 원문 미열람 |
| `laanlabs/openPlan3D` | SvelteKit+three 평면도 | TS | MIT. LICENSE 원문 Copyright 2026 theLodgeStudio + API MIT | **배치·카탈로그.** `src/lib/utils/furnitureCatalog.ts` `FurnitureDef{id,category,width,depth,height}`. `getFurnitureSize`. `selectionRotation.ts` 도수 회전. README: R=15°, 우클릭 90° | catalog·README 확인. 겹침 금지 코드 미확인 |
| `Annoraaq/grid-engine` | Phaser 멀티타일 점유 | TS | Apache-2.0. API SPDX + 이전 LICENSE 원문 | **배치.** `GridCharacter` `tileWidth`/`tileHeight`. `CharBlockCache.forEachCharTile`가 발자국 칸을 막음 | 소스 읽음. 가구 카탈로그 없음 |
| `peter-kish/gloot` | Godot 그리드 인벤 | GDScript | MIT. LICENSE 원문 Copyright 2022 Peter Kish + API MIT | **보관함.** `addons/gloot/core/constraints/grid_constraint.gd` `GridConstraint`: `size`, 아이템 `size`/`rotated`/`positive_rotation`, `rotate_item`, `get_item_rect` | docs+경로 확인. 원문 .gd 미열람 |
| `jasonkneen/tiny-world-builder` | 복셀 섬, 작물·동물 | JS | **AGPL-3.0** LICENSE 원문+API. **설계만** | **배치·작물.** `world[x][z]{terrain,kind,floors}`, `cellMeshes['x,z']` | 이전 조사. 코드 복사 금지 |
| `charmlinn/blueprint3d-modern` | 3D 실내 CAD | TS | MIT. LICENSE 원문 Copyright 2026 contributors + API MIT | **배치.** 방·가구 카탈로그(CAD). 게임 그리드 아님 | LICENSE. 점유 클래스명 확인 안 함 |
| `furnishup/blueprint3d` | 원조 실내 플래너 | JS | MIT. LICENSE.txt Copyright 2015 FurnishUp Inc + API MIT | **배치.** 현대 포트의 원본 | LICENSE. **2021-01-20 이후 push 없음** |
| `aalavandhaann/blueprint-js` | blueprint3d ES6 포트 | JS | MIT. LICENSE 원문 Copyright 2018 Srinivasan Ramachandran + API MIT | **배치.** CAD 포트 | LICENSE. 점유 구조 확인 안 함. 2024-11-20 push |
| `MarkoDM/GodotInGameBuildingSystem` | 인게임 그리드 건축 | C# | MIT. LICENSE 원문 Copyright 2024 Marko Dmitrovic + API MIT | **배치.** `BuildingSystem/Scripts/GridCell.cs`: `GroundObject`, `WallObjects[2]`, `HasGroundObject`. `BuildingSystemGrid.cs` | GridCell 읽음. 2024-05-13 push |
| `sci-comp/scene-builder` | Godot 씬 배치 | GDScript | MIT. LICENSE 원문 Copyright 2024 Paul + API MIT | **배치.** 자료 구조 이름 **확인 안 함** | LICENSE만 |

23★ `Jannchie/my-home`은 별 하한 위이고, 가구 Occupancy가 조사 중 가장 구체적이라 넣었다.

## 2 상위 3

**1. `boona13/mykonos-island-voxels`**  
8×8 섬과 같은 칸 모델. `isFreeFor` + `_occupancy` O(1) + `footprint{w,d}` 가 겹침 금지 그대로다. 저장 키도 localStorage. 회전은 `flipH`/`flipV`뿐이라 90°는 CubeCity를 붙인다.

**2. `hexianWeb/CubeCity`**  
우리 스택(three.js)과 같다. `metadata[x][y].direction` + `rotateBuilding` `(d+1)%4` + R키 + 철거·이사. Pinia persist. 한 칸=한 건물만이라 2×2 밭은 mykonos 발자국을 쓴다. `canPlaceBuilding`은 도로 인접 규칙이라 섬에는 다시 쓴다.

**3. `Jannchie/my-home`**  
`Occupancy.canPlace` + Layer + 90° footprint + keepout이 가구 배치 설계의 골격이다. 카탈로그 JSON은 `laanlabs/openPlan3D`의 `FurnitureDef`/`getFurnitureSize`를 데이터 모양만 참고한다.

G4 매대 3칸은 `gloot` `GridConstraint`(3×1, `rotated`)를 설계 참고. G3 주간 JSON·작물 단계는 이 꾸미기 묶음에 없다. AGPL `tiny-world-builder`의 `world[x][z].kind`만 아이디어.

## 3 조심

- **복사 금지:** `jasonkneen/tiny-world-builder`는 AGPL-3.0. 구조 이름만 보고 코드·에셋을 가져가면 우리 MIT/웹 배포가 AGPL에 걸린다.
- **아트 제외:** `pogicity-demo` LICENSE는 소스 MIT, `/public` 아트는 비적용. GitHub SPDX는 `NOASSERTION`. 스프라이트 쓰지 말고 `BuildingDefinition`만.
- **클론 제외함:** Habbo 계열 `open-hotel/open-hotel-client`, `itsezc/CycloneIO`, `marcus-sa/apex`. Stardew/AC/Harvest Moon 팬작도 제외.
- **라이선스 없음(표 밖):** `ahmethakanbesel/floor-maker` README MIT 주장, API `license=null`.
- **방치:** `furnishup/blueprint3d` 2021-01-20. CubeCity LICENSE 저작권 이름과 소유자가 어긋남(파일 본문은 MIT). mykonos는 생성일=push일 하루짜리 커밋 폭.
- **CAD ≠ 게임 그리드:** floorplan-3d·openPlan3D·blueprint3d는 연속 mm/cm 좌표. 칸 스냅은 우리가 만든다.
- **스택:** `grid-engine`은 Phaser 이동 엔진. three.js 섬에 통째 넣지 말고 `tileWidth` 발자국만 참고.
- 지난 조사 농장 3종(`farmhand`, `etherealfarm`, `gooboo`)은 전부 GPL. 허용 라이선스 Stardew-like JS는 이번에도 없음.
