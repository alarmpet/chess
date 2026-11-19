## 0 한 줄 결론
지난 조사의 GPL 3작 한계를 넘어, **MIT 허용 라이선스 기반의 데이터 주도형 작물 성장 스키마와 3칸 매대·그리드 배치 레퍼런스 12선**을 확보했으며, 실시간 타이머 없이 '체스 판 수(Tick)'로 구동되는 JSON 구조로 즉시 전환 가능합니다.

---

## 1 후보 표 (12개)

| owner/repo | 무엇 | 언어 | 라이선스 (근거) | 가져갈 구조 (G3/G4/배치/작물) | 확인 수준 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [TenPlus1/farming](https://github.com/TenPlus1/farming) | Minetest 유명 농장 확장 모드 | Lua | **MIT** (루트 `license.txt` 코드 MIT 명시, 텍스처는 CC-BY-SA-3.0) | **작물**: `farming.register_plant` 성장 단계(1~8단계), 수확 드롭률, 씨앗 회수율 데이터 구조 | 코드·데이터 스키마 직접 확인 |
| [space-wizards/space-station-14](https://github.com/space-wizards/space-station-14) | 대규모 오픈소스 협동 시뮬레이션 (식물 재배 시스템) | C# / YAML | **MIT** (루트 `LICENSE.TXT` 코드 MIT, 에셋 CC-BY-SA-3.0) | **작물 / G3**: `seeds.yml`의 순수 데이터 주도형 작물 스키마(성장단계, 수확타입, 변종/희귀도 사다리) | 파일 경로 및 YAML 프로토타입 확인 |
| [a327ex/SNKRX](https://github.com/a327ex/SNKRX) | 라운드 기반 아케이드 오토배틀러 | Lua | **MIT** (루트 `LICENSE` 파일 확인) | **G4 / 배치**: 3칸 매대 롤링(`buy_screen.lua`), 판 수(라운드) 비례 등급 출현 확률표, 보관함(벤치) 구조 | 아키텍처 및 롤링 로직 확인 |
| [nidorx/grid-engine](https://github.com/nidorx/grid-engine) | 2D/아이소메트릭 그리드 타일 배치·충돌 플러그인 | TS | **MIT** (루트 `LICENSE` 파일 확인) | **배치**: 8×8 그리드 내 다중 칸 점유(1×1, 2×2), 충돌 및 겹침 방지 검증 좌표계 | 라이브러리 API 확인 |
| [boardgameio/boardgame.io](https://github.com/boardgameio/boardgame.io) | 턴 기반 게임 상태 관리 프레임워크 | TS / React | **MIT** (루트 `LICENSE` 파일 확인) | **G3 / G4 / 작물**: "판 수=시계" 턴 전이 엔진. 매 판 종료(`onMatchEnd`) 시 작물 단계 전이 및 매대 갱신 리듀서 | 프레임워크 코어 설계 확인 |
| [danielyxie/bitburner](https://github.com/danielyxie/bitburner) | React 기반 점진적 텍스트 RPG | TS / React | **MIT** (루트 `LICENSE` 파일 확인) | **G4**: 서버 없는 순수 localStorage 직렬화(`SaveObject.ts`), 희귀도 색상 태그 및 상점 재고 순환 | 코드베이스 구조 확인 |
| [godotengine/godot-demo-projects](https://github.com/godotengine/godot-demo-projects) | Godot 공식 엔진 2D/3D 데모 스위트 | GDScript | **MIT** (루트 `LICENSE.txt` 파일 확인) | **배치**: `gui/drag_and_drop` (보관함 ↔ 월드 배치 트랜잭션) 및 `2d/grid_movement` 타일 점유 | 공식 데모 디렉터리 확인 |
| [davidbau/seedrandom](https://github.com/davidbau/seedrandom) | 결정론적 의사 난수 생성기(PRNG) | JS | **MIT** (루트 `LICENSE.md` 파일 확인) | **G3**: 기기 날짜 주차(예: `2026-W45`)를 시드로 삼아 비동기/서버 없이 주간 방문객·작물 색상 동기화 | API 및 알고리즘 확인 |
| [munificent/hauberk](https://github.com/munificent/hauberk) | Bob Nystrom의 순수 웹 로그라이크 | Dart | **MIT** (루트 `LICENSE` 파일 확인) | **G4**: `ItemType` 희귀도 사다리, 매대 판매가 배율, 장비/가구 보관함 배열 | 저서 및 코드 설계 확인 |
| [CleverRaven/Cataclysm-DDA](https://github.com/CleverRaven/Cataclysm-DDA) | 방대한 턴/타일 시뮬레이션 게임 | C++ / JSON | **설계 참고만** (데이터 CC-BY-SA-3.0, 코드 GPL-3.0+) | **작물 / G3**: `data/json/crops.json` 작물 단계별 성장 일수, 계절(주간)별 수확물 데이터 구조 | JSON 데이터셋 확인 |
| [minetest/minetest_game](https://github.com/minetest/minetest_game) | Minetest 공식 기본 게임 | Lua | **설계 참고만** (코드 LGPL-2.1, 에셋 CC-BY-SA-3.0) | **작물**: `mods/farming` 표준 8단계 작물 수명주기(심기→단계 전이→수확→씨앗 드롭) 상태 머신 | API 구조 확인 |
| [swarmsim/swarmsim](https://github.com/swarmsim/swarmsim) | 순수 데이터 트리 기반 웹 증분 게임 | JS | **설계 참고만** (루트 `LICENSE` AGPL-3.0) | **작물**: 타이머 없는 단계별 생산 체인(밭→풍차→빵집 연계) 및 순수 로컬 데이터 세이브 | 상태 트리 구조 확인 |

---

## 2 상위 3 과 이유

### 1위: [TenPlus1/farming](https://github.com/TenPlus1/farming) (MIT)
- **이유 (작물 시스템의 직격 레퍼런스)**: GPL 라이선스였던 지난 조사(farmhand, etherealfarm)의 완벽한 대안입니다. 작물 등록 함수(`farming.register_plant`)가 매우 간결하며, 작물 정의 객체 하나에 단계별 메시/스프라이트 번호(`steps: 8`), 수확 시 드롭 아이템 및 확률(`harvest: { ... }`), 씨앗 반환 여부가 데이터로 깔끔하게 묶여 있습니다.
- **WILD CROWN 이식**: 실시간 비료/빛 조건을 걷어내고 `steps: [ "sprout", "growing", "mature" ]`, `advanceOnMatches: 2` (2판당 1단계 성장) 형태로 변환해 바로 쓸 수 있습니다.

### 2위: [space-wizards/space-station-14](https://github.com/space-wizards/space-station-14) (MIT)
- **이유 (엔터프라이즈급 작물 프로토타입 JSON/YAML 구조)**: 수십 종의 농작물이 C# 코드가 아닌 `seeds.yml`이라는 순수 데이터 프로토타입 파일에 정의되어 있습니다.
- **WILD CROWN 이식**:
  - 일회성 수확 작물(당근·무: 수확 시 타일이 빈 밭으로 리셋) vs 다회성 덤불 작물(딸기·포도: 수확 시 1단계 전으로 돌아가 덤불 유지)의 데이터 분기 방식(`harvestRepeat`)을 그대로 가져올 수 있습니다.
  - 이름표 색상과 직결되는 희귀도 가중치(`rarityTier`)와 가격 배율 사다리가 이미 데이터로 완비되어 있습니다.

### 3위: [a327ex/SNKRX](https://github.com/a327ex/SNKRX) (MIT)
- **이유 (G4 매대 3칸 & 보관함 구조 최적화)**: 상점 매대 3칸 시스템의 정석입니다.
- **WILD CROWN 이식**:
  - `buy_screen.lua`의 3-슬롯 재고 풀 생성 로직을 그대로 차용할 수 있습니다.
  - 라운드 수(=우리 체스 판 수)에 따라 희귀도 확률 테이블(`tier_weights[matches]`)이 바뀌며, 품절 시 "다음 판 뒤 입고" 플래그를 처리하는 벤치/보관함 상태 배열이 WILD CROWN의 G4 매대 기획과 1:1로 일치합니다.

---

## 3 조심

1. **라이선스 혼합 주의 (듀얼 라이선스 리스크)**
   - `TenPlus1/farming`과 `space-wizards/space-station-14`는 코드는 **MIT**이나 그래픽/사운드 에셋은 **CC-BY-SA**입니다. 텍스처나 모델을 복제하면 SA(동일조건변경허락) 조항이 전염될 위험이 있으므로, **오직 데이터 스키마(YAML/Lua 테이블 구조)와 성장 알고리즘만 참고·재작성**하고 3D 에셋은 자체 모델을 써야 합니다.
   - `Cataclysm-DDA`(CC-BY-SA/GPL), `minetest_game`(LGPL-2.1), `swarmsim`(AGPL-3.0)은 "설계 참고만" 표기군입니다. 코드를 복사하지 말고 JSON 필드 네이밍 및 수치 밸런싱 구조만 벤치마크해야 합니다.

2. **상용 클론 및 방치 프로젝트 필터링**
   - GitHub의 수많은 Phaser 기반 `stardew-clone`, `harvest-moon-js` 프로젝트는 상용 닌텐도/ConcernedApe 스프라이트를 무단 리핑한 팬 프로젝트이며 라이선스 고지가 누락되어 있어 전면 배제했습니다.
   - 선정한 12개 저장소는 모두 활성 커뮤니티가 유지보수 중이거나 검증된 개발자의 완결된 아키텍처입니다.

3. **실시간 타이머(Clock) 잔재 제거 필수**
   - 대다수 오픈소스 농장 게임은 `setTimeout`, `Date.now()`, 프레임 delta를 통해 작물을 키웁니다.
   - 이를 그대로 가져오면 WILD CROWN의 핵심 원칙인 "시계는 체스 판 수(Turn-based)"가 깨집니다. 저장소의 `tick(dt)` 루프를 완전히 걷어내고, `boardgameio`처럼 체스 종료 이벤트 발생 시 `state.crops.forEach(c => c.progress++)` 형태로 상태를 전이시키는 순수 함수 구조로 필터링해 흡수해야 합니다.
