## 0 한 줄 결론

조사 방향은 맞다. **WILD CROWN에는 농장 게임 전체보다 ‘콘텐츠 표 → 판 종료 시 상태 갱신 → 매대 표시’ 구조가 유용하다.** 확인한 후보 중 주간 이벤트를 **JSON 달력 파일로 운영하는 완성 사례는 찾지 못했다.**

## 1 후보 표

| owner/repo | 무엇 | 언어 | 라이선스(확인 근거) | 가져갈 구조 | 확인 수준 |
|---|---|---|---|---|---|
| [Ding-Ding-Projects/farming-game](https://github.com/Ding-Ding-Projects/farming-game) | 계절별 씨앗 판매, 작물, 건물 배치 | TS | [MIT `LICENSE` 원문](https://raw.githubusercontent.com/Ding-Ding-Projects/farming-game/main/LICENSE) | **G4·작물·배치:** [`src/game/shop.ts`, `crops.ts`, `placement.ts`, `time.ts`](https://github.com/Ding-Ding-Projects/farming-game/tree/main/src/game)를 각각 분리. 매대 갱신을 `time.ts`의 게임 시간 대신 체스 판 번호에 연결 | 파일 목록·README 확인, `time.ts` 본문 확인. 나머지 본문 미확인 |
| [KrasimirKralev/harvest-hollow](https://github.com/KrasimirKralev/harvest-hollow) | 계절 콘텐츠, 주간 박람회, 주문, 장식 | JS·Three.js | [MIT `LICENSE` 원문](https://github.com/KrasimirKralev/harvest-hollow/blob/main/LICENSE) | **G3·작물·배치:** `shared/` 콘텐츠 표와 규칙 엔진, `server/` 일간·주간 스케줄러. 콘텐츠와 진행 규칙의 분리만 참고 | README·라이선스 확인, 세부 코드 본문 미확인 |
| [hashk014/Universal-Shop](https://github.com/hashk014/Universal-Shop) | 한정 재고, 자동 재입고, 결정적 주간 특가 | Java | MIT **GitHub 라이선스 표시·README만** 확인 | **G4:** 상시 상품과 회전 상품 구분, 유한 재고와 재입고 상태 분리. 회전 주기를 판 번호로 바꾸는 설계 참고 | README 확인, `LICENSE` 원문·회전 코드 미확인 |
| [Kapuzenjoe/simple-shop-craft-5e](https://github.com/Kapuzenjoe/simple-shop-craft-5e) | 상점별 재고와 선택한 날짜의 재입고 | JS | MIT **GitHub 라이선스 표시만** 확인 | **G4:** 정상·무제한·재입고 제외 재고 모드, 현재 수량과 최대 수량 분리. 관련 경로 [`scripts/shop/`](https://github.com/Kapuzenjoe/simple-shop-craft-5e/tree/main/scripts) | README·폴더 확인, 코드·라이선스 원문 미확인 |
| [Leoocast/lofi-valley-engine](https://github.com/Leoocast/lofi-valley-engine) | 화면과 분리한 농장 시뮬레이션 | TS·React | [MIT `LICENSE` 원문](https://github.com/Leoocast/lofi-valley-engine/blob/main/LICENSE) | **작물·배치:** `src/engine/data/`, `systems/`, `inventoryStore.ts`의 역할 분리 | README·파일 목록 확인, 세부 코드 본문 미확인 |
| [devhitp/FarmSimulator](https://github.com/devhitp/FarmSimulator) | 재배·구매·판매와 등록부 | JS | [MIT `LICENSE` 원문](https://github.com/devhitp/FarmSimulator/blob/main/LICENSE) | **G4·작물:** `js/registries/`와 `js/gameplay/`의 상품 정의·구매 처리 분리. **매대 회전은 확인되지 않음** | README·라이선스 확인, 코드 본문 미확인 |
| [Soturine/fazenda-inteligente-cbr](https://github.com/Soturine/fazenda-inteligente-cbr) | 씨앗 구매·수확물 판매가 있는 웹 농장 | TS·Phaser | [MIT `LICENSE` 원문](https://github.com/Soturine/fazenda-inteligente-cbr/blob/main/LICENSE) | **작물·G4:** 구매와 판매 흐름. 구체 자료 구조는 확인 안 함 | README·라이선스 확인 |
| [WispSnow/TinyFarm](https://github.com/WispSnow/TinyFarm) | JSON·Tiled를 쓰는 농장 게임 | C++ | [MIT `LICENSE` 원문](https://raw.githubusercontent.com/WispSnow/TinyFarm/main/LICENSE) | **작물:** `config/`와 게임 코드의 분리 가능성. 실제 작물 데이터 형식은 확인 안 함 | README·폴더·라이선스 확인 |
| [zonary123/UltraShop](https://github.com/zonary123/UltraShop) | 일반·회전·카탈로그 상점, 시간·이벤트 조건 | Java | **GPL-3.0, GitHub 라이선스 표시 확인** | **G3·G4 설계 참고만:** README의 `RotationShop`, `ConditionsConfig`, `Scheduler` 구분. 판 기반 회전과 주차 조건을 별도 규칙으로 둘 때 참고 | README 확인, 코드·라이선스 원문 미확인 |

## 2 상위 3

1. **Ding-Ding-Projects/farming-game** — `shop.ts`, `crops.ts`, `placement.ts`, `time.ts`가 별도 파일이다. WILD CROWN의 G4·작물·배치를 검토할 출발점으로 가장 직접적이다. 계절별 씨앗 판매도 확인됐다. [저장소 설명과 파일 목록](https://github.com/Ding-Ding-Projects/farming-game/tree/main/src/game)
2. **KrasimirKralev/harvest-hollow** — Three.js 게임에서 콘텐츠 표와 규칙을 `shared/`에 두고 주간 행사를 운영한다. G3의 **주차별 콘텐츠 정의**에 참고할 만하지만, 현재 스케줄러는 서버 기반이므로 WILD CROWN에서는 기기 날짜로 주차를 계산해야 한다. [구조 설명](https://github.com/KrasimirKralev/harvest-hollow)
3. **hashk014/Universal-Shop** — 결정적 주간 회전, 한정 재고, 재입고를 함께 다룬다고 명시한다. G4의 “3칸 회전”과 “다음 판 뒤 입고”를 **서로 다른 상태**로 설계할 때 유용하다. 다만 구현 코드와 라이선스 원문 확인이 남았다. [기능 설명](https://github.com/hashk014/Universal-Shop)

## 3 조심

- 별 0~1개인 **Ding-Ding-Projects/farming-game, hashk014/Universal-Shop, Kapuzenjoe/simple-shop-craft-5e**는 요청의 예외로 넣었다. 각각 분리된 농장 규칙 파일, 결정적 주간 회전, 재고 모드와 재입고 규칙이라는 구체적 구조가 이유다. 통합 전에 해당 코드 본문을 읽어 실제 동작을 재확인해야 한다.
- **UltraShop은 GPL-3.0이라 설계 참고 전용**이다. TinyFarm은 코드가 MIT여도 README에 유료 에셋 사용을 밝힌다. 에셋은 별도로 취급해야 한다. [UltraShop 저장소](https://github.com/zonary123/UltraShop), [TinyFarm 설명](https://github.com/WispSnow/TinyFarm)
- 상용 게임을 바탕으로 규칙을 재구성했다고 밝힌 섬 게임과, `LICENSE` 파일이 없는 회전 상점 저장소는 표에서 제외했다. 확인된 후보에서도 **G3용 주간 이벤트 JSON 원본**과 **G4용 판 단위 매대 회전 코드**는 아직 확보하지 못했다.
