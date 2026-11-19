# 실제 게임 해부 자료 (2026-10-30)

상용 게임은 공개 자료만 봤다. 앱을 뜯지 않았다. 위키·가이드의 숫자는 판마다 다를 수 있다. "분석가" 표시는 회사 발표가 아니라 해설자의 해석이다.

## 상용 게임

| 게임 | 확인된 구조 | 출처 |
| :--- | :--- | :--- |
| Clash Royale | 대전 승리로 상자를 얻고 슬롯 4개에 저장, 한 번에 하나만 연다. 무료 상자 4시간, 크라운 상자는 크라운 10개(출처마다 표현 차이). 패배는 상자가 없어 사실상 입장권을 돌려받는다(분석가). 상자 열림 알림이 복귀를 부른다(분석가). 2025-01 슈퍼셀이 신규 구간 상자 실험을 했고 "요즘 신규 이용자의 기대는 출시 때와 다를 수 있다" 고 밝혔다 | mobilefreetoplay.com/deconstructing-clash-royale, gamedeveloper.com/design/energy-systems-are-back-clash-royale, supercell.com/en/games/clashroyale/blog/news/chest-experiment-king-tower-levels-1-9 |
| Clash of Clans | 자원 수집 → 건설·훈련 → 전투. 목표에 따라 비중이 바뀐다. 건설 일꾼 2명이 최대 제약. 눈에 보이는 꾸준한 진행이 잔존의 주된 이유(2012 분석). 접속하지 않은 동안 공격받는다. 슈퍼셀은 초보·중간·상위로 나눠 본다(2차 인용) | deconstructoroffun.com 2012, gamedeveloper.com/business/game-monetization-design-analysis-of-clash-of-clans |
| Pikmin Bloom | 걸으면 씨앗이 자라 피크민이 된다. 피크민 머리의 꽃잎으로 지도에 꽃을 심는다. 꽃잎은 유한하다. 원정은 걷지 않아도 진행되고 결과 목록이 남는다. 밤 9시 이후 하루 돌아보기: 걸음·심은 꽃·뽑은 피크민 요약, 사진·기분 기록. 방문한 곳과 꽃길이 지도에 남는다 | pikminwiki.com/Lifelog, pikminwiki.com/Pikmin_Bloom_interface |
| Pokémon GO 버디 | 하트 하루 상한(가이드: 기본 10, 기분 좋음 20. Bulbapedia 는 보너스 포함 26). 걷기·먹이·놀기·배틀·기념품. 단계 1/70/150/300 하트. 최고 단계는 리본과 전투 CP 보정. 기분이 최고면 사탕 2배·하트 2배 | pokemongohub.net 버디 가이드, Bulbapedia Buddy Pokémon |
| Stardew Valley | 주민 한 명당 선물 하루 1번, 주 2번. 생일 예외. 하트 1칸 250점. 하루 대화 +20. 안 만나면 천천히 줄지만 하한이 있는 경우가 많다. 결혼 상대는 계속 줄어든다 | stardewvalleywiki.com/Friendship, /Gifts |
| Neko Atsume | 음식·장난감을 놓으면 그에 따라 고양이가 온다. 앱을 끈 동안 방문. 떠나며 생선을 남긴다. 좋아하는 것을 놓으면 더 많이. 희귀 고양이는 특정 조합을 요구. 여러 번 오면 기념품. 생선으로 음식·장난감 구매. 정원 확장 금붕어 180 | wikipedia Neko_Atsume, twinfinite 가이드 |
| Animal Crossing: New Horizons | 안 하면 잡초가 자라고 순무가 상하고 주민이 이사 갈 수 있다. 되돌릴 수 있는 변화라는 저품질 가이드가 있다. 복귀가 청소 숙제가 된다는 후기 있음. 닌텐도가 장기 미접속자에게 메일을 보내 죄책감 논란이 있었다(thegamer 제목, 본문 미열람) | destructoid, thegamer |
| Shadow of Mordor 네메시스 | 오크 대장이 플레이어와의 일을 기억하고, 이기면 승진·강화된다. 위계가 있고 영웅의 부활이 고리를 돌린다. "내가 만든 악당" 이라는 후기 | gamesradar, gameinformer |
| Cookie Run: Kingdom | 단순하고 읽기 쉬운 코어와 강한 캐릭터 정체성 위에 성장·라이브 서비스를 얹는다(개발사 인터뷰). 왕국 건설과 전투의 결합이지만 수치 근거 못 찾음 | 80.lv |
| Chess Universe | 진짜 체스. 컴퓨터 대전이 주제별 섬으로 구성. 승리·과제로 상자, 상자에서 펫·꾸미기. 난이도가 실력에 맞게 조정된다는 앱 설명. 온라인 대전·일일 도전 있음. "상대를 이기면 펫으로 데려간다" 기록 있음 | apps.apple.com Chess Universe, PLAN.md:391 |

## 오픈소스 코드에서 직접 확인한 것 (MIT·Unlicense·MPL 외 코드 복사 금지)

- **gooboo** (GPL-3.0): 모듈별 tick(diff). village 모듈은 건물 대기열 upgrade/tickQueue, 인구 직업 job, 행복도 villageHappiness 하한, 탐험 loot 시간당 발생, 제작 crafting 이 있다. farm 모듈은 격자 field 에 작물이 grow 값을 쌓고 오래 두면 overgrow 배수로 더 큰 수확, 주간 무료 상자(village_ingredientBox), 일 단위 forceTick(patient 유전자 스택). 카드 수집 card.js. 돌아오면 offlineSummary.
- **progress-knight** (Unlicense): 수명 → 환생 → maxLevel 잔존.
- **Pocket-Bird** (MPL-2.0): 쓰다듬기, 깃털 확률 해금, 모자.
- **Trimps** (GPL-2.0): 오프라인 처리 선택.
- **isocity** (MIT): 작은 타일 배치.

## 현재 우리 게임
- 표준 체스, 라이벌 AI 3명, 소품 7종, localStorage. 말 슬롯 16개 추적기 `src/village/roster.js` 는 300판 무작위 검증 통과.
- 캐릭터를 더 귀엽게 다시 그리는 중이다. 큰 머리, 짧은 몸. 표식(왕관 등)은 유지.
