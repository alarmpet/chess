# 농장·작물·꾸미기 오픈소스 조사 라운드 (2026-11-04)

사용자 요청: 「농장?경작물키우기?꾸미기 게임? 이런 게임 오픈소스 다운받아서 역공학 설계하고 진행하는거 맞아?」 → 「조사부터 진행」

## 방법
- 10-31 마을 조사(`../2026-10-31-town-survey/`)에서 52개 저장소를 이미 받았다. 그 가운데 농장 게임 셋(farmhand GPL-2, etherealfarm GPL-3, gooboo GPL-3)이 **모두 GPL** 이었다. 이번 라운드는 그 빈틈만 노렸다: 허용 라이선스 농장·꾸미기 게임, 주간 데이터, 매대.
- 영역을 갈랐다.
  - agy: 작물. 권한 우회가 막혀 **도구 없이 기억으로** 답했다.
  - grok: 꾸미기·배치. 웹 읽기만 허용.
  - codex: 상점 재고·주간 이벤트. `-c model="gpt-6-sol"`, 읽기 전용.
- 통합자는 셋을 읽기 전에 `gh search repos` 24개 질의로 직접 찾고 판정을 먼저 적었다(`r1-claude.md`).
- **모든 저장소**를 GitHub API 로 조회했다(`verify-repos.tsv`). `NOASSERTION`·`none` 은 LICENSE 원문을 열었다. 상위 후보는 인용한 파일과 식별자를 원문에서 찾았다.

## 저장소 대조 결과
| 모델 | 낸 수 | 404 | 라이선스 오기 | 파일·식별자 오기 |
| :--- | ---: | ---: | :--- | :--- |
| agy (도구 없음) | 12 | **3** — 1위 `TenPlus1/farming`, `nidorx/grid-engine`, `swarmsim/swarmsim` | `danielyxie/bitburner` 「MIT」 → 저장소에 LICENSE 없음(README·dist·index.html 만). `davidbau/seedrandom` 「LICENSE.md」 → 파일 없음 | SNKRX `tier_weights[matches]`(판 수) → 실제는 `level_to_shop_odds[shop_level]`(상점 레벨). 「품절 시 다음 판 입고 플래그」 → 실제는 매대 **잠금**(`locked_state`) |
| grok | 14 | 0 | 없음(14개 모두 API 와 일치) | CubeCity `rotateBuilding` 이 `src/stores/useGameState.js` 에 없다(`direction` 필드만 있다) |
| codex | 9 | 0 | `zonary123/UltraShop` 「GPL-3.0」 → LICENSE 원문은 **CC BY-NC 4.0**(비상업) | 확인한 범위에서 없음 |
| 통합자 | 16 | 0 | 없음 | — (구조는 아직 안 읽음) |

## 원문으로 확인한 핵심
- `Ding-Ding-Projects/farming-game` (MIT, TS, ★0, 2026-09 push): `src/game/` 아래에 `crops.ts`·`shop.ts`·`placement.ts`·`time.ts`·`market.ts`·`economy.ts`·`save.ts` 등이 나뉘어 있다. `shop.ts` 에 `ShopEntry { item, price, stock: number|null, note }` 와 `shopStock(state)` = `cropsForSeason(state.season)` + 상시 상품이 있다. README 「No assets, no runtime dependencies」.
- `space-wizards/space-station-14` (MIT 코드): 작물 정의는 `Resources/Prototypes/Hydroponics/plants.yml`·`randomMutations.yml`, 씨앗은 `Resources/Prototypes/Entities/Objects/Specific/Hydroponics/seeds.yml`, 씨앗 자판기 재고는 `Resources/Prototypes/Catalog/VendingMachines/Inventories/seeds.yml` 이다.
- `a327ex/SNKRX` (MIT, LICENSE 원문 확인): `buy_screen.lua:351` `local tier_weights = level_to_shop_odds[shop_level]`, 매대 3칸과 잠금 상태 저장(`:173-174`).
- `boona13/mykonos-island-voxels` (MIT, ★1066): `src/grid/TileMap.js` 에 `isFreeFor`·`_occupancy`, `src/building/PlacedObject.js` 에 `footprint`.
- `twofactor/pogicity-demo` (소스 MIT, `/public` 아트 제외, API 는 NOASSERTION): `app/data/buildings.ts` 에 `footprintByOrientation` 33회.
- `Jannchie/my-home` (MIT): `src/occupancy.ts` 에 `canPlace`.
- `peter-kish/gloot` (MIT, Godot): `grid_constraint.gd` 에 `rotate_item`.
- `KrasimirKralev/harvest-hollow` (MIT): README 「weekly County Fair」, `shared/` 「content tables (every crop, recipe and price …)」. 단 **Node 서버가 24시간 돈다**(README:20). 서버 없는 우리에게는 `shared/` 의 표 모양만 쓸 수 있다.

## 제외·주의
- `appleweiping/paradise-isle` (MIT): README 「Inspired by QQ天堂岛 (Tencent, 2011)」. 상용 게임 재구성이라 브리핑 기준으로 뺀다. `src/data/` 의 표 구조는 볼 수 있지만 상위 후보에서는 제외한다.
- `Gmast2662/grow-your-garden`: README 「Repo closed」, AI 로 만든 코드라고 밝힘, 멀티플레이 서버.
- `zonary123/UltraShop`: CC BY-NC 4.0(비상업). Play 판매 게임에는 참고도 조심한다.
- `jasonkneen/tiny-world-builder`: AGPL-3.0. 구조 이름만 본다.
- 검색에 걸린 「Trainer」「Full Version」「cheat」 저장소는 악성 유도 가능성이 있어 받지 않는다.
- **G3 주간 이벤트를 JSON 달력으로 돌리는 허용 라이선스 사례는 셋 다 찾지 못했다.** 통합자도 못 찾았다.

## 이 라운드에서 배운 것
- **cue:** 도구 없이 기억으로 답한 모델의 1위 후보. **lesson:** 주소부터 조회한다. **evidence:** agy 1위 `TenPlus1/farming` 이 404 였다(12개 중 3개 404).
- **cue:** 모델이 「GPL」「MIT」 라고 적은 라이선스. **lesson:** LICENSE 원문을 연다. **evidence:** codex 의 UltraShop 「GPL-3.0」 은 실제로 CC BY-NC 4.0 이었다.

## 다음 단계: 역공학 (같은 날)
상위 6개를 `D:\tmp\oss-farm\` 에 받아 읽었다. 결과는 [역공학 보고서](../../2026-11-04-farm-oss-rea/README.md)에 있다.
보조 에이전트 셋의 원문은 `x-farming-game.md` · `x-shop-crops.md` · `x-placement-weekly.md` 다. 인용 293개 가운데 292개가 원문 줄과 맞았고, 1개는 한 줄 어긋났다.
