# 잡기 카드 조사 라운드 (2026-10-31)

사용자 제안: 말을 잡을 때 등급 확률로 카드를 주고, 시작 미션을 먼저 달성하면 보상을 준다. 계획서는 [잡기 카드 계획서](../../../plans/2026-10-31-capture-card-plan.md).

## 방법

- 세 모델에게 다른 자료를 주고 독립 설계안을 받았다(`BRIEF-*`, `r1-*`). 통합자 판정은 읽기 전에 썼다(`r1-claude.md`).

| 모델 | 받은 자료 | 답 |
| :--- | :--- | :--- |
| agy | 체스 × 카드 게임 | 일부만 판에 영향, 규칙 변형 카드 포함 |
| grok-4.6 | 카드 수집·확률·리텐션 | 체스 무영향, 3장 중 1장 선택 |
| codex (배너 gpt-6-sol) | 시스템·구현·법 | 체스 무영향, 전부 장식 |

**한계**
- **REA 는 쓰지 못했다.** 이번 세션에서 연결 시간이 초과됐다. 오픈소스는 소스가 공개되어 있어 직접 받아 코드를 읽었다. 컴파일된 게임의 역공학은 하지 않았다.
- 상용 게임은 리뷰, 위키, 팬 사이트, 보도 자료다. 수치 다수가 공식 자료가 아니다.
- 재미는 재지 않았다. 판단은 시뮬레이션과 코드 대조까지다.

## 받아 읽은 오픈소스

코드는 복사하지 않았고 구조만 읽었다. 받은 위치는 `D:\tmp\oss-cards` 다.

| 저장소 | 라이선스 | 읽은 내용 |
| :--- | :--- | :--- |
| DougDougGithub/Chess-Chaos-Roguelike | MIT | `api/rules.js` 규칙 목록과 제작자 주석. 3턴마다 규칙 선택 |
| jahabrewer/decapitate-the-spire | GPL-3.0 | `game.py` 희귀 보정: 시작 5, 일반마다 1 감소, 최저 -40, 희귀가 나오면 복귀 |
| Chrisl252/spiresofazeroth | MIT | `rewards.js` 3장 가중 선택, 쓸모없는 카드 다시 뽑기, `cardReveal.js` |
| fairy-stockfish/Fairy-Stockfish | GPL-3.0 | `capturesToHand`, `pieceDrops` 설정으로 Crazyhouse 표현 |
| rafaelcastrocouto/foda, etriceu/Roguelike_Chess, jkl3848/chess-deckbuilder, syumai6842/chess-deckbuilder | 다양 | 구조만 훑었다. 쓸 만한 확률 규칙 없음 |

## 상용·공개 자료

| 게임 | 가져온 사실 | 출처 |
| :--- | :--- | :--- |
| Chess Chaos | 수를 둔 뒤 고르면 더 공정하지만 약 15% 덜 신난다는 제작자 시험 | 소스 주석 |
| Chess Evolved Online | 대전용 유닛에 무작위 없음 | 스토어 문구(`2026-10-28` 덤프) |
| Shotgun King | 나와 상대가 함께 강화되는 묶음을 고른다. 카드 설명 불명확이 불만 | [리뷰](https://turnbasedlovers.com/review/shotgun-king-the-final-checkmate-review/) |
| Knightmare Chess | 규칙을 바꾸는 카드와 비용 점수 | [위키백과](https://en.wikipedia.org/wiki/Knightmare_Chess) |
| Hearthstone | 전설 평균 5%, 40팩 천장으로 알려짐. 문서화 여부 논쟁 | [위키](https://hearthstone.wiki.gg/wiki/Pity_Timer), [PC Gamer](https://pcgamer.com/blizzards-chinese-hearthstone-website-confirms-card-rarity-drop-rates) |
| Pokémon TCG Pocket | 팩마다 독립 확률, 포인트 교환이 사실상 천장 | [가이드](https://20cards.com/guides/pack-points), [Game8](https://game8.co/games/Pokemon-TCG-Pocket/archives/474410) |
| Marvel Snap | 등급 업그레이드는 외형만 바꾸고 수집 레벨을 올린다 | [가이드](https://mobilematters.gg/gaming/marvel-snap-card-levels-explained-cost-collection-level-cosmetics) |
| Teamfight Tactics | 정해진 시점에 3개 중 1개 선택 | [위키](https://leagueoflegends.fandom.com/wiki/Augment_(Teamfight_Tactics)) |
| Slay the Spire | 일반전 희귀 3%, 정예 10%, 일반마다 +1% | [위키](https://slay-the-spire.fandom.com/wiki/Card_Rewards) |
| 한국 게임산업법 | 유료 확률형 아이템 공개 의무, 온전한 무상은 제외 | [ZDNet](https://zdnet.co.kr/view/?no=20240222164405), [서울신문](https://newsseoul.co.kr/news/view/1065579020816949) |

Balatro 의 70/25/5 수치는 확인하지 못해 쓰지 않았다.

## 주장 판정

| 주장 | 낸 모델 | 판정 | 근거 |
| :--- | :--- | :--- | :--- |
| 카드가 합법 수를 바꾸면 안 된다 | grok, codex | **채택** | `referee.js` 는 표준 규칙만 받고 기보 재생이 마을을 계산한다 |
| 전부 장식이면 판 안 재미가 약하다 | codex 자평, grok 자평, 통합자 | **채택** | 세 곳 모두 가장 약한 결정으로 지목. 재지는 않았다 |
| 규칙을 안 깨는 도움 카드를 판에서 쓴다 | agy | **채택** | 되돌리기는 `wizardChessEngine.js:4131`, `referee.js:215` 에 이미 있다 |
| 규칙 변형 카드 30%, FEN 주입 | agy | **기각** | 자기 답에서도 판정 오류와 기보 손상을 위험으로 적었다 |
| 카드를 3장 중 1장 고른다 | grok | **기각, 판 끝으로 옮김** | 판 안에서 고르면 대기가 늘어난다 |
| 체크메이트 영웅 100% | grok, agy | **기각** | 이기는 판마다 영웅이면 희소성이 사라진다. 시뮬레이션 대비 10% 안 채택 |
| 첫 체크마다 보너스 카드 | agy | **보류** | 체크 빈도를 재지 않았다 |
| 플레이어가 앞서면 AI 실수율을 몰래 낮춘다 | agy | **기각** | 숨은 난이도 조작이다. `rival.mistake` 는 라이벌의 공개 성격이다 |
| AI 선착순 미션 금지 | codex | **기각, 완화** | 사용자가 요청한 재미 축이다. AI 는 미션을 노리지 않고, 져도 위로 보상을 준다 |
| AI 가 먼저 달성하면 다음 잡기 보정 | grok | **채택** | 뒤진 쪽을 돕고 체스를 바꾸지 않는다 |
| 내 말이 잡히면 구원 카드 | agy | **채택, 축소** | 나이트 이상을 잃은 판에서 한 번만. 미끼 남용을 막는다 |
| 폰을 미끼로 던져 카드 파밍 | agy | **유효 위험** | AI 가 잡기 점수를 크게 준다. 보상은 내가 잡을 때만 준다 |
| 일반 카드는 연출 안에서 작게 표시 | codex | **채택** | 판당 약 12장이 멈추면 1분 이상 늘어난다 |
| Shotgun King 은 따라잡기 구조 | agy | **거짓** | 양쪽 동시 강화 선택이지 역전 보정이 아니다 |
| 체크메이트·희귀 천장 수치 | 셋 다 | **시뮬레이션으로 대체** | 아래 |

## 시뮬레이션

판당 잡기는 실측 평균을 기준으로 했다. 사람 기준은 재지 않았고 가정이다. 스크립트는 저장소에 없다.

| 조건 | 첫 영웅 평균 | 불운 10% 지점 | 판당 카드 |
| :--- | :--- | :--- | :--- |
| 어떤 말이든 영웅 0.1%, 천장 없음 | 86판 | 198판 | 약 12장 |
| 채택표, 잡기 절반·승률 50%, 천장 없음 | 10.7판 | 24판 | 6.4장 |
| 채택표, 잡기 절반·승률 50%, 천장 10/60 | 6.5판 | 10판 | 6.4장 |
| 채택표, 잡기 30%·승률 30%, 천장 10/60 | 10.7판 | 17판 | 3.8장 |

## 이번 라운드에서 배운 것

- **cue:** 셋 중 둘과 통합자가 같은 결론일 때. **lesson:** 나머지 하나를 먼저 읽는다. **evidence:** agy 답이 늦게 도착해 '전부 장식' 으로 닫힐 뻔했다. 되돌리기와 정찰 카드는 agy 에서만 나왔다.
- **cue:** 여러 CLI 를 한 줄에서 백그라운드로 묶을 때. **lesson:** 각각 절대 경로로 출력하고 끝나면 파일 존재를 확인한다. **evidence:** 첫 실행에서 agy 출력이 이전 라운드 폴더의 `r1-agy.md` 를 덮어썼다. git 으로 되돌렸고 agy 를 다시 돌렸다.
