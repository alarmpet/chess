# B. 도시 건설 · 카드 마을 · "본게임이 메타를 먹여 살리는" 구조 조사

작성일 2026-10-31. 대상: WILD CROWN 에서 체스로 얻은 카드가 농장 → 돈 → 건물 → 발전소로 이어지는 생산 사슬을 만들 수 있는가.
읽은 계획서: [왕관 카드](../../../plans/2026-10-31-capture-card-plan.md), [왕관 마을](../../../plans/2026-10-30-crown-village-plan.md). 현재 건물값은 `src/village/economy.js` 에서 확인했다.

**표시:** [공식] 개발사 자료 · [위키] 위키 · [팬] 팬 가이드·블로그 · [리뷰] 언론·사용자 리뷰 · [분석] 업계 분석 글 · [미확인] 출처가 약하거나 교차 확인이 안 됨 · (발췌) 원문을 못 열고 검색 발췌로만 읽음. 발췌의 URL 은 검색 결과 묶음에서 가장 가까운 문서를 붙인 것이라 문장과 일대일로 대조하지 못한 경우가 있다.
**계산:** "계산" 표시는 내가 출처 수치로 나눈 값이다. 측정값이 아니다.
**인용:** 저작권 규칙 때문에 직접 인용은 문서 전체에 하나만 두고 나머지는 풀어 썼다. Steam 리뷰는 `steam-dumps/<게임>.md` 의 번호(`TOP6`, `NEW4`)로 원문을 찾을 수 있다.

---

## 0. 먼저 보는 결론

1. **이 구조에서 가장 많이 입증된 비율은 "이긴 판 1 = 별 1, 초반 작업 비용도 별 1" 이다.** 한 판이 곧 눈에 보이는 변화 하나다. 체스는 판이 길어서 이 비율을 더 후하게 줘야 한다.
2. **Royal Match 는 메타를 일부러 가볍게 골랐다.** 메타 없음, 배경만 바뀌는 안, 현재 꾸미기를 A/B/C 로 시험해 꾸미기를 택했다고 Naavik 이 전한다. 수치는 공개되지 않았다. 생산 사슬은 이 흐름의 반대편이므로 깊이를 강하게 제한해야 한다.
3. **플레이어가 가장 크게 미워하는 것은 등급 자체가 아니라 "특정 희귀품 하나가 없어 멈춤" 이다.** Monopoly GO 의 gold-locked, Hay Day 의 확장 재료, Coin Master 금카드가 같은 모양이다. 발전소가 "고급 코뿔소 카드" 를 요구하면 같은 함정이다. "아무 동물의 고급" 이면 합성이 100% 라 막히지 않는다.
4. **소모보다 보유 조건이 안전하다.** Anno 의 "장인 1명 달성", Stacklands 의 "퀘스트 N개 완료" 는 한 번 넘으면 끝이다. 왕관 카드 계획서 2절의 "카드를 강제로 태우게 하지 않는다" 와도 맞는다.
5. **일반 카드 과잉은 사용자 아이디어의 강점이다.** 계획서 10절의 미어캣 과잉과 도감 뒤 목표 부재를 농장이 함께 받는다. 예비 카드만 쓰면 도감은 줄지 않는다. 이것은 내 판단이고 재 보지 않았다.
6. **생산은 시계가 아니라 판 단위로 돌리는 편이 근거가 있다.** Terraforming Mars 는 세대 끝에 수입을 받는다. 이것을 "판 끝에 수확" 으로 옮기면 접속 재촉 없이 사슬이 돈다. 시간 대기를 없앤 Clash Royale 사례는 있지만, 그 변경이 좋았다는 근거는 찾지 못했다.
7. **가장 가까운 선례 Card City Nights 의 최대 불만은 같은 상대를 반복해 카드를 뽑는 지루함이다.** 카드가 주는 보상은 판을 다르게 만들지 않으면 일이 된다.
8. **도시 건설의 고질병은 중반 이후 지루함이고, Against the Storm 은 판을 끊어서 풀었다.** 19,281건 95% 긍정. 마을을 끝없이 키우기보다 구역을 완성하고 다음 구역으로 가는 구조가 맞다.
9. **Dystopika 는 재화 없이 95% 긍정이지만 금방 질린다는 평이 같이 있다.** 재화 없는 꾸미기로는 사흘째를 못 넘긴다는 마을 계획서의 우려를 지지한다.
10. **확인 못 한 것이 크다.** Royal Match 구역별 별 수, Coin Master 스핀당 코인, 체스 사이트 메타 자료, GDC 원문, 메타 유무 리텐션 수치는 찾지 못했다. 사람 측정이 없으므로 아래 제안은 시작값이다.

---

## 1. 출처 접근 결과 (정직한 기록)

| 출처 | 결과 | 비고 |
| :--- | :--- | :--- |
| Steam 리뷰 | **성공.** 17개 게임, 1,017건, `steam-dumps/` | 게임당 도움됨 상위 40 + 최근 20 (Cities: Skylines 만 57). `appreviews` API 는 시도하지 않고 커뮤니티 허브를 썼다 |
| Steam 커서 | **새로 해결** | 메모의 "p=2 는 1쪽 반복" 은 `steamcommunity.com/app/<id>/homecontent/` 에 숨은 입력 `userreviewscursor` 를 넘기면 풀린다. 메모 파일은 범위 밖이라 고치지 않았다 |
| Reddit | **부분.** old.reddit 은 로그인 벽. www.reddit.com 검색·글은 ego-browser 로 열림 | 글 3개와 검색 제목만 읽었다. 대표성 없음 |
| X | **실패.** 검색이 로그인 화면으로 넘어감 | 내용 없음 |
| Threads | **사실상 실패.** 검색은 열리나 무관한 글만 나옴 | 내용 없음 |
| 한국 커뮤니티 | **약함.** 네이버 검색 요약은 읽음. 디시 검색은 무관한 결과. 아카라이브는 제목 1건. 인벤은 결과 없음 | 타운십 한국어 후기는 찾지 못함 |
| Deconstructor of Fun | **성공.** Royal Match, Playrix, Toon Blast 글 | Coin Master, Monopoly GO 해체 글은 찾지 못함 |
| Naavik, Mobile Free to Play | **성공** | |
| GDC | **실패.** Vault 원문 없음 | 관련 강연은 2차 언급뿐. 메타 A/B 수치 강연을 찾지 못함 |
| Fandom | WebFetch 402, ego-browser 로 읽음 | Gardenscapes·Homescapes·Coin Master 위키의 해당 쪽은 비어 있었음 |
| Hooded Horse 공식 위키 | **실패.** 두 방법 모두 봇 확인에서 멈춤 | Against the Storm 수치는 검색 발췌 |
| Playrix 도움말 | **실패.** 직접 열면 404 | 검색 발췌만 |
| RoyaleAPI | **실패.** 403, 브라우저도 차단 | 검색 발췌만 |

Steam 표본은 도움됨 순서라 찬반 비율을 대표하지 않는다. 내용 근거로만 쓴다. 집계 비율은 스토어 표시값이다.

---

## 2. 핵심: 본게임이 메타를 먹여 살리는 비율

### 2.1 한 판이 얼마를 벌어 주는가

| 게임 | 본게임 1회 | 벌이 | 메타 단위 비용 | 한 단위에 드는 판 수 | 출처 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Royal Match | 1~5분, 평균 3분 남짓 | 승리 1 = 별 1, 별은 구매 불가 | 작업마다 다름. 구역 단위로 상자 | 구역당 약 45~120판 (계산, 수치 충돌) | [위키](https://royalmatch.fandom.com/wiki/Stars_%26_Tasks), [분석](https://www.blog.udonis.co/mobile-marketing/mobile-games/royal-match-analysis) |
| Gardenscapes | 매치3 한 판 | 레벨 완료마다 별 | 초반 작업 대개 별 1, 작업당 최대 5 | 구역당 대개 3~5 게임 일 | [공식](https://playrix.helpshift.com/hc/en/5-gardenscapes/faq/62-how-do-i-unlock-new-areas-in-the-garden) (발췌), [분석](https://mobilefreetoplay.com/deconstructing-gardenscapes/) |
| Coin Master | 스핀 1회. 시간당 무료 5회 | 코인 (스핀당 값 못 찾음) | 마을 1 = 310만, 마을 10 = 3,480만. 마을당 물품 25개 | 못 찾음 | [팬](https://www.pockettactics.com/coin-master/village-cost), [분석](https://blog.udonis.co/mobile-marketing/mobile-games/coin-master-monetization) |
| Monopoly GO | 주사위 | 현금 | 판 총액 ≈ 첫 랜드마크 업그레이드값 × 112~120 | 못 찾음 | [팬](https://www.gamerevolution.com/guides/961906-monopoly-go-board-costs-how-much-cash-money-cost-upgrade-landmarks-landmark), [팬](https://guide.mego90.com/monopoly-go-board-levels/) (발췌, 서로 다름) |
| Clash of Clans | 공격 1회 | 자원 | 타운홀 2 = 1,000골드 10초, 타운홀 10 = 350만 3일, 타운홀 18 = 2,500만 12일 | 못 찾음. 시간 벽이 주 제동 | [위키](https://clashofclans.fandom.com/wiki/Town_Hall) |
| Stacklands | 달 주기 | 카드 판매 코인 | 팩 3 → 25코인 (8단계) | 퀘스트 3 → 34개로 해금 | [위키](https://stacklands.fandom.com/wiki/Booster_Packs) |
| Pikmin Bloom | 걸음 | 새싹 성장 | 1,000 / 3,000 / 5,000 / 10,000 걸음 | 하루 걸음으로 끝나는 단위 | [리뷰](https://www.charlieintel.com/games/pikmin-bloom-beginners-guide-expeditions-how-to-play-planting-more-235778/) (발췌) |
| Pokémon Sleep | 하룻밤 | 수면 점수 × 잠만보 힘 | 월~일 한 주 주기로 다시 시작 | 1일 1회 | [리뷰](https://sportskeeda.com/pokemon/ways-increase-snorlax-drowsy-power-pokemon-sleep) (발췌) |
| WILD CROWN 현재 | 한 판 길이 미측정 | 승 30, 무 20, 패 15 도토리 | 벤치 20, 무대 40, 집 60, 분수 120 | 4종 합 240 = 8승 또는 16패 (계산) | `src/village/economy.js`, 왕관 마을 계획서 |

**Royal Match 구역당 판 수의 한계.** 구역 수와 레벨 수가 출처마다 다르다. 81구역 7,500레벨(Twinfinite, 오래됨), 레벨 4,500+(Udonis, 2025), 13,000레벨 돌파(iGV 블로그, 약함). 위키 분류에 101~110번 구역 칸이 있다. 나누면 약 45~120이다. 초반과 후반이 같다는 뜻은 아니고 실패 판은 빠져 있다. 구역별 별 총합은 위키에서 찾지 못했다.

**시간으로 옮기면 (계산).** 구역 하나 45~120승 × 3분 = 약 2.3~6시간의 이긴 시간이다. 체스 한 판을 10분으로 가정하면 14~36판이다. 이 10분은 내 가정이고 재지 않았다.

### 2.2 시장 기준값

- Royal Match D30 16.5%, 비교 상위권 16% 안팎. App Annie 2021년 3분기, [분석](https://www.pocketgamer.biz/dream-games-royal-match-leads-match-3-d30-retention-at-165).
- 매치3 D30 약 5%, 퍼즐 전체 2%. Adjust 2024, [분석](https://www.adjust.com/blog/puzzle-games-trends-strategies/) (발췌). 위 수치와 표본이 달라 같은 줄에 놓을 수 없다.
- 장르 대부분 하루 4~5세션. GameAnalytics 2024년 1분기, [분석](https://gameindustrylibrary.com/documents/q1-mobile-games-benchmarks-2024) (발췌).
- 클래식 매치3 세션 2~4분, 메타가 있으면 꾸미기 시간까지 계산해 짧게 유지하라는 조언. [분석](https://www.gamedeveloper.com/business/how-to-crack-the-match-3-code---part-1).
- D7 누적 70~110레벨, D14 150~200레벨이라는 경험칙은 출처 없는 LinkedIn 글이다. [미확인](https://vn.linkedin.com/in/truongps) (발췌). 쓰지 않는다.

**메타가 리텐션을 얼마나 올리는지 숫자로 공개한 자료는 찾지 못했다.** 정성 주장만 있다.

### 2.3 메타는 얼마나 무거워야 하는가

| 무게 | 사례 | 기록 |
| :--- | :--- | :--- |
| 없음 | Toon Blast | 사가 지도를 빼고 게임과 이벤트에 집중. 뺄셈으로 이겼다는 [분석](https://www.deconstructoroffun.com/blog/how-toon-blast-became-the-best-business-in-puzzle). [분석](https://mobilefreetoplay.com/peak-games-toon-blast-death-of-saga/) |
| 가벼움 | Royal Match | 정해진 자리에 놓는 꾸미기. 인지 부담을 낮춰 퍼즐에 집중시킨다고 [분석](https://naavik.co/digest/why-dream-games-success-is-a-challenge-to-replicate/). 초기 분석은 "꾸미기 라이트" 로 분류. [분석](https://www.deconstructoroffun.com/blog/2021/3/21/royal-match-the-new-king-from-turkey) |
| 중간 | Gardenscapes, Homescapes | 레벨 → 별 → 작업 → 이야기 → 꾸미기 → 다음 필요. 살 수 있는 것은 부스터뿐. [분석](https://mobilefreetoplay.com/deconstructing-gardenscapes/) |
| 약한 연결 | Merge Mansion | 메타가 꾸미기 고리뿐이라 본게임과 연결이 약하다는 경쟁사 평. 경쟁작 Plantopia 는 농장식 자원 관리로 연결했다고 주장. [분석](https://elitegamedevelopers.substack.com/p/egd-news-85-designing-a-merge-game) |
| 무거움 | Township | 메타가 곧 게임. 작물 → 공장 → 주문 → 창고 확장. [위키](https://township.fandom.com/wiki/Barn) |

Naavik 은 메타 부품은 베끼기 쉽고 본게임 품질이 무너지면 메타 효과도 함께 무너진다고 본다. 이 글의 A/B/C 시험은 2차 보도이고 수치가 없다.

Fishdom 의 꾸미기 선택지가 많아 부담스럽다는 지적도 있다. [분석](https://mobilefreetoplay.com/deconstructing-gardenscapes/). 선택은 줄일수록 안전하다.

### 2.4 제동 장치별 평가

| 제동 | 사례 | 효과와 불만 |
| :--- | :--- | :--- |
| 목숨 | Royal Match | 다 떨어지면 할 일이 없어진다는 초기 비판. [분석](https://www.deconstructoroffun.com/blog/2021/3/21/royal-match-the-new-king-from-turkey) |
| 에너지 | Merge Mansion | 탭당 1, 회복 2분, 상한 100은 사용자 리뷰 값. [미확인](https://justuseapp.com/en/app/1484442152/merge-mansion/reviews) (발췌). 에너지 표시 막대 불만 글이 406 추천. [Reddit](https://www.reddit.com/r/MergeMansion/comments/1kunsvo/devs_i_sincerely_hate_this_bar/) |
| 에너지(학습앱) | Duolingo | 하트를 에너지로 바꾼 뒤 맞혀도 줄어든다는 비판. [미확인](https://unanswered.io/guide/why-are-people-leaving-duolingo) (발췌). 공식은 하트를 속도 조절로 설명. [공식](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo) (발췌) |
| 실시간 건설 | Clash of Clans | 타운홀 18은 12일. 일꾼 1~6명. 대기를 줄이는 유료 도우미가 팔린다. [위키](https://clashofclans.fandom.com/wiki/Town_Hall), [위키](https://clashofclans.fandom.com/wiki/Builder%27s_Apprentice) (발췌) |
| 상자 슬롯 | Clash Royale | 2025-03-31 슬롯·타이머 제거, Lucky Drop 으로 교체. 슬롯이 차면 이겨도 보람 없다는 설명. [팬](https://royaleapi.com/blog/rip-chests-2025-q1-update) (발췌), [공식](https://supercell.com/en/games/clashroyale/blog/news/upcoming-changes-to-clash-royale) (발췌). 다음 달 업데이트는 큰 비판을 받았다. [팬](https://www.royaleinsights.com/guides/april-2025-update-critics) (발췌). 슬롯 제거 자체가 원인인지는 확인 못 함 |
| 난이도 | Royal Match, Gardenscapes | 후반 난이도 상승과 구매 유도 불만. [리뷰](https://search.naver.com/search.naver?where=view&query=%EB%A1%9C%EC%97%B4%EB%A7%A4%EC%B9%98%20%ED%9B%84%EA%B8%B0) (네이버 요약). 실패 상태가 있어야 별 획득이 의미 있다는 분석. [분석](https://mobilefreetoplay.com/deconstructing-gardenscapes/) |

---

## 3. 등급 관문: 어떻게 쓰고 무엇을 미워하는가

| 유형 | 사례 | 기록 | 위험 |
| :--- | :--- | :--- | :--- |
| 특정 희귀품 | Monopoly GO 금 스티커 | Golden Blitz 때만 교환, 지정 2종, 일정 불규칙. 개발사는 희소성을 높이려는 제한이라고 답하고 이벤트를 늘리겠다고 했다. [리뷰](https://www.sportskeeda.com/esports/monopoly-go-q-a-avenue-trade-gold-stickers-golden-blitz-fps-drops-answered), [리뷰](https://www.dexerto.com/monopoly-go/trade-gold-stickers-monopoly-go-2788408) (발췌). 커뮤니티 글에서 금 스티커 2~11장 부족을 말한다. [Reddit](https://www.reddit.com/r/MonopolyGoTrading/comments/1tkalpm/im_so_curious_how_many_of_yall_are_gold_locked/) | **최상** |
| 특정 희귀품 | Coin Master 금카드 | 교환 이벤트 때만 지정 카드 교환. [리뷰](https://twinfinite.net/guides/coin-master-trade-gold-cards-how-what-do/) (발췌). 카드 시장과 확률을 문제 삼은 소송도 있다. [리뷰](https://www.classaction.org/news/coin-master-mobile-casino-game-tilted-too-far-in-favor-of-the-house-class-action-says) (발췌) | **최상** |
| 무작위 소모 재료 | Hay Day | 재료 드롭 57% / 30% / 13%, 계정별 고정이라는 사용자 주장. [Reddit 미러](https://redlib.belloworld.it/r/HayDay/comments/1ducqpz/i_actually_cant_take_this_anymore) (발췌, 미확인). 필요 수량과 보유 상한이 어긋난다는 불만. [리뷰](https://www.sikayetvar.com/en/hay-day-us/hay-day-upgrade-limits-are-unfair-and-too-low) (발췌) | 높음 |
| 무작위 소모 재료 | Township 창고 | 창고 확장에 망치·못·페인트. 1단계 각 1, 2단계 각 2. 기차가 무작위 재료 3~5개, 그 밖에 비행기·동물원·상자·이벤트. [위키](https://township.fandom.com/wiki/Barn) | 중간. 공급원이 많아 완화 |
| 생산 슬롯 유료 | Township 공장 | 공장은 코인과 인구·확장 조건. 생산 칸은 T-cash 200~500. [위키](https://township.fandom.com/wiki/Factories) | 유료 게임 전용 |
| 보유 인원 문턱 | Anno 1800 | 일꾼 35 → 장인 1 → 기술자 1 → 투자자 1 → 투자자 1,000 + 인구 25,000. [위키](https://anno1800.fandom.com/wiki/Game_progression) (발췌) | 낮음. 소모 없음 |
| 인구 문턱 | Cities: Skylines | 500 → 1,000 → 1,300 → 2,400 → 4,600 … 80,000. 맵마다 다름. [위키](https://skylines.fandom.com/wiki/Milestone) (발췌) | 낮음 |
| 퀘스트 문턱 | Stacklands | 퀘스트 3, 10, 16, 22, 24, 26, 30, 34 로 팩 해금. [위키](https://stacklands.fandom.com/wiki/Booster_Packs) | 낮음 |
| 선택 초안 | Against the Storm | 시작 3회, 평판 1·2·3·4·5·7·9·11 에서 8회 설계도 선택. [위키](https://wiki.hoodedhorse.com/Against_the_Storm/Reputation) (발췌) | 중간. 원하는 설계도가 안 나오는 판이 있음(`against-the-storm` TOP11) |

### 플레이어가 미워하는 모양

1. **하나만 모자라 멈춤.** 전체 진행이 특정 카드 한 장에 묶인다.
2. **얻는 때를 내가 못 정함.** 이벤트 일정이 불규칙하거나 교환이 막혀 있다.
3. **이겨도 소용없음.** 슬롯이 찼거나 재료가 막혀 승리가 진행으로 안 이어진다.
4. **필요량과 보관량의 모순.** 요구 수량이 상한을 넘는다.
5. **비용이 결과와 안 맞음.** 사소한 작업에 별을 많이 쓴다는 Gardenscapes 앱스토어 불만. [리뷰](https://apps.apple.com/tt/app/gardenscapes/id1105855019) (발췌).
6. **돈으로 푸는 벽이 보임.** Kingdom Rush Vengeance 영웅 유료 벽 불만. [리뷰](https://androidauthority.com/kingdom-rush-vengeance-review-928335) (발췌). Monster Train 은 패배해도 카드가 풀린다는 평이 있다(`monster-train` TOP19).

---

## 4. 도시 건설 게임

Steam 비율은 영어 리뷰 표시값(받은 날 2026-10-31). 못 찾은 칸은 비웠다.

### Cities: Skylines (92%, 100,585건) · II (58%, 35,033건, 최근 69%)
- **기계:** 인구 문턱이 건물·서비스·지구·타일을 푼다. 기본 타일 9장. [위키](https://skylines.fandom.com/wiki/Milestone), [팬](https://guidestrats.com/cities-skylines-expand-city-limits/) (발췌). 초기 단계에서 학교·병원, 이후 경찰·소방·정책, 대학·지하철 순. [팬](https://www.gameplayinside.com/strategy/cities-skylines/cities-skylines-guide-milestones-how-important-are-these-unlocks/) (발췌).
- **II:** 인구·행복의 주기 XP 와 배치 XP 로 단계 도달, 단계마다 돈·개발점수·타일 허가. [위키](https://cs2.paradoxwikis.com/Progression). 짓기 자체가 진행이 된다.
- **복귀:** 교통 문제를 푸는 재미, 새 수단이 문제를 바꾼다(`cities-skylines` TOP36).
- **깨짐:** 인구 8천에 가서야 댐이 풀렸다는 평(`TOP26`). 전기 같은 기본 시설이 늦으면 문턱이 답답하다. DLC 72개 불만(`TOP29`). II 는 성능·시뮬레이션 불신이 상위 리뷰를 채운다.

### Manor Lords (86%, 41,143건, 최근 82%)
- **기계:** 부르가지 땅에 가족이 살고 뒤뜰에 생산 확장을 붙인다. 공방은 2단계 땅 + 지역 재화. 제빵소는 개발 점수로 해금 후 땅에 건설. [리뷰](https://www.pcgamer.com/games/city-builder/manor-lords-burgage-plot/) (발췌).
- **사슬:** 생산 → 창고 → 시장 노점 → 땅. 한 칸이 끊기면 노점이 빈다. [팬](https://www.switchbladegaming.com/manor-lords/beginners-guide-2026-11/) (발췌). 양조는 맥아 + 2단계 땅 + 공방 + 양조 확장. [팬](https://citybuilder.tools/tools/manor-lords/burgage-planner) (발췌). 과수원은 전성기까지 3년이라는 팬 수치. [미확인](https://manorlordsguide.com/tips) (발췌).
- **복귀:** 땅 하나의 깊이(`TOP26`).
- **깨짐:** 음식이 있는데 운반이 안 되어 굶는다(`NEW2`). 자급까지 게임 시간 10년이 걸린다는 평(`NEW4`). 곡물 사슬이 지역 재화를 까먹는다는 평(`TOP32`). 앞서 해보기 2년째 내용 부족(`TOP23`, `TOP27`). 개발자는 할 일이 없으면 다른 게임을 하다 오라고 했다. [리뷰](https://gamesradar.com/games/city-builder/out-of-things-to-do-in-a-game-manor-lords-dev-has-a-good-idea-enjoy-other-games-for-a-while-and-come-back-when-theres-new-fun-stuff) (헤드라인).

### Dystopika (95%, 2,560건)
- **기계:** 목표·경제·생산 사슬 없음. 건물 수가 늘면 장식이 풀린다. [공식](https://store.steampowered.com/app/2379910/Dystopika/), [리뷰](https://tryhardguides.com/dystopika-review-a-night-city-of-your-own/) (발췌). PC Gamer 는 Townscaper 계열로 분류. [리뷰](https://www.pcgamer.com/games/city-builder/this-brilliant-dark-and-moody-cyberpunk-city-builder-is-my-kind-of-cosy-game-and-for-less-than-usd7-you-might-as-well-see-if-its-yours-too/) (발췌).
- **복귀:** 분위기 자체. 저렴한 가격.
- **깨짐:** 목표가 없어 곧 지루하다는 평(`TOP6`), 할 일이 없다는 평(`NEW18`), 자유도 부족(`TOP31`).
- **의미:** 놓은 수만으로 장식을 푸는 규칙은 아주 싸다. 돈이 없는 이 게임의 유일한 진행이 "놓을수록 더 놓을 것" 이다.

### Anno 1800 (78%, 12,170건)
- **기계:** 계층이 필요를 채우면 다음 계층으로 올라간다. 기본 다섯 계층, DLC 일곱. 거주지가 차야 하고 기본 필요만 채우면 승급된다. [위키](https://anno1800.fandom.com/wiki/Population) (발췌).
- **문턱:** 3절 표. 같은 계층 조건은 섬마다, 다른 계층 조건은 전역 충족. [위키](https://anno1800.fandom.com/wiki/Game_progression) (발췌). 필요 수량 비율표는 원문을 읽지 못했다.
- **깨짐:** 상위 부정 리뷰 대부분이 Ubisoft 접속 문제다(`TOP12~19`). 게임 구조 비판은 표본에서 적다.
- **의미:** "장인 1명" 문턱은 낮고 분명하다. 첫 1명이 새 계층을 알려 준다.

### Banished (90%, 25,839건)
- **기계:** 인구가 곧 유한 자원이다. 굶주림·겨울·질병이 적이고 전쟁이 없다. [리뷰](https://bit-tech.net/reviews/gaming/pc/banished-review/1/) (발췌).
- **복귀:** 첫 마을들의 실패가 곧 학습(`TOP10`), 재난 이야기(`TOP6`, `TOP24`).
- **깨짐:** 초기 생존을 익히면 매력이 줄어든다. [리뷰](https://lanoc.org/review/games/banished) (발췌). 음식이 있는데 굶는다는 불만(`NEW15`).

### Frostpunk (92%, 39,250건)
- **기계:** 발전기 둘레 도시, 법 선택과 도덕 비용. 온도 하강이 시계다(`TOP4`, `TOP3`). 3개 시나리오 135일 기록(`TOP1`).
- **복귀:** 끝이 있는 이야기. 극복하면 끝난다는 평(`TOP17`).
- **깨짐:** 시나리오 반복 가치가 낮다는 평(`TOP38`). 시스템이 얇다는 언론 평. [리뷰](https://gamespot.com/reviews/frostpunk-review-damned-if-you-do-damned-if-you-do/1900-6416899/) (발췌).

### Foundation (86%, 11,415건)
- **기계:** 구역을 정하면 마을이 유기적으로 자란다(`TOP3`, `TOP17`). 세 주민 등급의 주거 관리(`TOP15`).
- **깨짐:** 금·대리석이 쓸모없다는 평(`TOP12`). 만든 자원에 쓸 곳이 없으면 사슬은 죽는다. 원인 찾기 어려운 부족(`TOP12`), 추세 확인 도구 없음(`TOP20`), 규모가 커지면 관리 부담(`TOP15`), 사슬이 얕다는 평(`TOP18`).

---

## 5. 카드로 마을을 짓거나 다른 게임에 묶인 경우

### Against the Storm (95%, 19,281건) — 도시 건설의 끝을 푼 사례
- **기계:** 정착지를 한 판으로 끊는다. 평판이 승리 조건이고 평판 구간에서 건물 설계도를 고른다. [위키](https://wiki.hoodedhorse.com/Against_the_Storm/Blueprints) (발췌). 정착지 사이에 왕도 업그레이드.
- **판 길이:** 몇 시간(`TOP13`), 1시간 안팎이라는 평도 있음(`TOP21`).
- **복귀:** 도시 건설의 첫 몇 시간만 반복하는 구조라는 평(`TOP6`, `TOP21`). 판마다 쓸 수 있는 건물이 달라 강제 적응(`TOP15`).
- **깨짐:** 후반에는 평판을 빨리 주는 설계도만 의미가 있다는 공략 의견. [팬](https://benedictjacka.co.uk/other-writing/against-the-storm-strategy-guide/) (발췌). 메타 업그레이드가 밋밋하다는 토론. [리뷰](https://steamcommunity.com/app/1336490/discussions/0/3818529263634771603/) (발췌).

### Dawnmaker (91%, 158건) — 카드 + 도시의 직접 사례
- **기계:** 카드로 자원을 내고 건물을 짓고 등대를 올려 땅을 연다. 건물은 인접 효과가 있다. [리뷰](https://www.boardgamequest.com/dawnmaker-digital-review/) (발췌), [리뷰](https://www.superjumpmagazine.com/indie-monthly-august-2024/) (발췌).
- **깨짐:** 재미는 건물에 있고 카드는 지루하다는 평(`TOP6`). 깊이 부족(`TOP1`). 초판 후 반복 가치 없음(`TOP9`, `NEW8`). 카드 운으로 임무 실패(`NEW10`).
- **개발자 회고:** 메타가 게임 밖 게임이어야 한다고 믿고 오래 헤맸다. 판 사이 진행이 없어 많은 플레이어가 싫어했다고 인정했다. 그는 이렇게 썼다: "our meta-progression is too shallow and doesn't improve the core of the game" ([개발자 회고](https://adrian.gaudebert.fr/blog/post/3-years-of-intense-learning-The-Dawnmaker-Post-mortem), [공식]).
- **판매:** 출시 18일 약 952장, 위시리스트 전환 5.8%, 순수익 약 $7,734. [리뷰](https://automaton-media.com/newsjp/developer-of-dawnmaker-post-mortem-20240819-306357/) (발췌). 틈새가 매우 좁았다고 개발자가 평가.
- **의미:** 2인 팀이 메타로 범위가 폭발했다. 우리에게 가장 직접적인 경고다.

### Stacklands (95%, 12,027건)
- **기계:** 카드를 겹쳐 생산한다. 달마다 주민이 먹고, 대부분 음식 2, 아기와 개 1. [위키](https://stacklands.fandom.com/wiki/Category:Villagers) (발췌). 초과 카드는 달 끝에 판매. [리뷰](https://www.thegamer.com/stacklands-beginner-tips-tricks-getting-started/) (발췌).
- **사슬:** 팩 8종 3~25코인. 아이디어 카드는 한 번만 나오고 나오면 칸에서 빠진다. 희귀도 없이 카드 슬롯 구조로 분배. 포일 1%. [위키](https://stacklands.fandom.com/wiki/Booster_Packs).
- **판 길이:** 전체 3~5시간이라는 평(`TOP24`). 주말에 끝낸다는 평(`TOP6`).
- **깨짐:** 타이머 대기와 위협 부족(`NEW17`), 몇 시간 뒤 재미 감소(`TOP7`).
- **의미:** 아이디어가 중복 없이 빠지는 규칙은 수집의 빈칸을 보장한다.

### Terraforming Mars (보드게임, 디지털 69%, 3,495건)
- **기계:** 세대마다 카드 뽑기 → 행동 → 생산만큼 수입. 카드는 건물·기술이고 수입을 올린다. [위키](https://en.wikipedia.org/wiki/Terraforming_Mars_(board_game)).
- **수치:** 강철 1 = 건물 카드 2 MC, 티타늄 1 = 우주 카드 3 MC, 식물 8 = 녹지, 열 8 = 온도 1단계, 남은 전력은 열이 된다. [팬](https://rules.dized.com/terraforming-mars/rule/concepts/resources) (발췌).
- **깨짐:** 디지털판은 버그와 DLC 강제 불만(`TOP1~8`). 규칙 평가가 아니다.
- **의미:** 전력의 잔량이 열로 넘어가는 규칙은 생산이 남아도 버려지지 않게 한다. 세대가 시계를 대신한다.

### Slipways (93%, 1,815건)
- **기계:** 행성에 산업을 고르고 항로로 잇는다. 항로는 교차 불가. 25년 약 1시간. [리뷰](https://indiegamereviewer.com/slipways-review-outer-space-grand-strategy-at-its-most-simplified/) (발췌), `slipways` TOP33.
- **깨짐:** 운이 재미없게 작동(`TOP3`), 전략보다 무작위 배치 대응(`TOP16`, `TOP23`).
- **의미:** 생산 사슬을 한 시간 퍼즐로 압축할 수 있다.

### Cultist Simulator (79%, 5,351건)
- **기계:** 카드를 시간이 도는 행동 칸에 넣고 진행 중 잠긴다. 일부 카드는 시간이 지나면 사라지거나 바뀐다. [위키](https://en.wikipedia.org/wiki/Cultist_Simulator) (발췌), [리뷰](https://www.tapsmart.com/games/review-cultist-simulator-beguilingly-odd-card-game/?amp=1) (발췌).
- **깨짐:** 타이머 동시 관리(`TOP3`), 반복 지루함(`TOP6`, `TOP16`).
- **의미:** 카드가 썩는 장치는 어린이 대상 게임에 맞지 않는다. 마을 계획서의 "부패 없음" 과도 같다.

### Card City Nights (89%, 663건) — 가장 가까운 선례
- **기계:** 도시를 돌며 상대를 이겨 금화와 팩을 받고 덱을 키운다(`TOP10`, `TOP13`).
- **깨짐:** 같은 상대를 여러 번 이겨 카드를 모아도 원하는 카드가 안 나온다(`TOP20`). 팩 파밍이 귀찮다(`TOP28`). 시너지가 늦게 온다(`NEW11`). 반대로 파밍 없이 끝까지 간다는 평도 있다(`TOP19`).

### Monster Train (96%, 12,275건)
- **기계:** 클랜당 레벨 10, 새 카드 해금. [공식](https://www.playstation.com/en-in/games/monster-train/) (발췌). 언약 등급이 승리마다 오른다. [리뷰](https://steamcommunity.com/app/1102190/discussions/0/3203744826059253491/?l=tchinese) (발췌). 패배해도 해금(`TOP19`).
- **의미:** 패배도 진행이 된다.

### Kingdom Rush (96%, 4,950건)
- **기계:** 레벨 최고 별 3, 영웅·철인 추가 모드(`TOP2`, `TOP35`). 업그레이드 체계가 장점으로 꼽힘(`TOP32`). 별 사용 수치는 찾지 못했다.
- **깨짐:** Steam 판과 모바일 판의 영웅 지불 방식 차이를 지적(`TOP25`).

### Clash of Clans
- **기계:** 일꾼이 있어야 건설, 1명 → 6명. 타운홀이 건물 수와 상한을 연다. 타운홀 표는 2.1표. [위키](https://clashofclans.fandom.com/wiki/Town_Hall).
- **복귀:** 타운홀 승급 뒤 3~5일 보조 버프로 뒤처짐을 완화. [위키](https://clashofclans.fandom.com/wiki/Town_Hall).
- **깨짐:** 대기 불만의 직접 사료는 찾지 못했다. 도우미 가치 논쟁만 읽었다. [리뷰](https://www.sportskeeda.com/esports/is-clash-clans-goblin-builder-worth-it) (발췌).

### Pokémon Sleep · Pikmin Bloom
- **Sleep:** 졸음력 = 잠만보 힘 × 수면 점수. 8.5시간에 100점. 낮에 도우미가 재료를 모으고 하루 3번 요리. 월~일 주기. [리뷰](https://sportskeeda.com/pokemon/ways-increase-snorlax-drowsy-power-pokemon-sleep), [리뷰](https://www.videogamer.com/guides/pokemon-sleep-beginners-guide) (발췌). 수면 방식은 조절이 안 되어 원하는 포켓몬을 얻기 답답하다는 지적이 검색 발췌에 있었으나 어느 문서인지 특정하지 못했다. [미확인]. 이용자 수면 증가 자료는 회사 분석. [리뷰](https://automaton-media.com/en/news/20240201-26555/) (발췌).
- **Bloom:** 걸음으로 새싹이 자라고 꽃을 심는 동안 친밀도가 오른다. [공식](https://niantic.helpshift.com/hc/en/23-pikmin-bloom/faq/2855-planting-flowers/) (발췌).
- **의미:** 잘하고 못함이 아니라 했다는 사실이 보상이다. 패배 도토리와 같은 철학이다. 상한이 분명하다.

### Duolingo · chess.com
- **Duolingo:** 젬은 연속 기록 복구와 하트에 쓰인다. [미확인](https://nogood.io/2023/10/09/duolingo-case-study) (발췌). 연속 기록 불안과 2025년 AI 논란으로 끊겠다는 사용자가 있었다는 설명. [미확인](https://unanswered.io/guide/why-are-people-leaving-duolingo) (발췌, 재확인 시 410). Aftermath 원문에는 이 내용이 없었다. 계획서의 "접속 재촉 없음" 과 맞는 반면교사.
- **chess.com:** 배지·리그 구조의 믿을 만한 자료를 찾지 못했다. 게임화를 싫어하는 의견과 원하는 의견이 모두 있다는 포럼 수준 자료뿐. [리뷰](https://lichess.org/@/SayChessClassical/blog/are-online-chess-players-trapped-pigeons/JPMnLrTC) (발췌). Comillas 논문 초록이 있으나 본문은 못 읽었다. [공식 저장소](https://repositorio.comillas.edu/items/18fe3b86-688c-46e3-b8d0-97519f73767a) (발췌).

### Candy Crush 류
사가 지도를 유지한다는 비교 자료뿐이다. [미확인](https://playworth.pages.dev/compare/games-like-candy-crush-saga) (발췌). 메타 구조 분석은 찾지 못했다.

---

## 6. WILD CROWN 에 옮기면 (내 제안, 측정 전)

전제: 체스 규칙은 건드리지 않는다(왕관 카드 계획서 2절). 유료, 재촉, 부패 없음.

### 6.1 카드 흐름

사용자 사슬을 네 등급에 다음처럼 대응시키는 안을 제안한다.

| 등급 | 역할 | 소모? | 이유 |
| :--- | :--- | :--- | :--- |
| 일반 | 씨앗. 예비분을 밭에 심어 판이 끝날 때 작물 | 예비만 소모 | 과잉을 받아 주는 곳. 도감 칸은 안 줄어듦 |
| 고급 | 건물 해금 문턱. 도감에 고급 칸 1개 이상 | **소모 안 함, 동물 무관** | 합성 100% 라 막히지 않음 |
| 희귀 | 선택 강화 또는 전시 | 소모 안 함 | 필수 사슬에 넣지 않음 |
| 영웅 | 꾸미기 전용 | 소모 안 함 | 천장 60장. 필수 관문이면 gold-locked 재현 |

**가장 나쁜 플레이어 검사.** 위로 카드만 받는 플레이어는 판당 일반 1장이다. 같은 동물 일반 4장(도감 1 + 예비 3)이 있어야 합성으로 고급이 나오므로 최소 4판이고, 동물이 흩어지면 더 걸린다. 희귀 이상도 인정하면 이 문제는 사라지지만 첫 카드가 희귀 이상으로 보장되므로 문턱 자체가 첫 판에 풀린다. 두 안의 선택은 6.6 의 2번이다. 문턱을 살리려면 위로 카드의 동물을 앞선 위로 카드와 맞추는 보정이 필요하다.

**판당 카드 추정 (계산, 가정).** 잡기 6회(폰 3, 나이트·비숍 2, 룩 0.5, 퀸 0.5)를 가정하면 표대로 일반 4.0, 고급 1.47, 희귀 0.48, 영웅 0.05장이다. 영웅은 표 확률로 약 21판, 60장 천장으로 약 10판이다. 잡기 수는 사람으로 재지 않았고, 이 값은 숫자 감각용이다.

### 6.2 생산 주기

- **실시간 대신 판 끝 수확.** 건물은 "판이 끝날 때" 만 돈다. 승패와 무관하게 받는다. 쉬어도 손해가 없다.
- **사슬 깊이는 3 이하.** 작물 → 가공 → 도토리. 전력은 Terraforming Mars 처럼 남으면 작물로 넘어가게 하면 관리 실패가 없다.
- **모든 산출물에 쓸 곳.** Foundation 의 쓸모없는 자원을 피한다.
- **고장 없음.** Manor Lords 식 운반 실패는 우리에게 재미가 아니다. 재료가 있으면 돈다.
- **구역 완성형.** Against the Storm 처럼 마을을 끝없이 키우지 않고, 구역을 완성하면 전시 후 다음 구역. 구역 완성 상자는 Royal Match 의 구역 상자.

### 6.3 페이스 시작값

| 단계 | 조건 | 목표 판 수 | 근거 |
| :--- | :--- | :--- | :--- |
| 첫 밭 | 1승 또는 2패 분 도토리 | 1판 | 별 1 = 작업 1, 현재 벤치 20도토리와 동일 |
| 고급 문턱 건물 | 도토리 + 고급 보유 | 3~5판 | 합성 1회 도달 시점 |
| 가공 건물 | 작물 소비 시작 | 6~10판 | 사슬 체감 |
| 구역 완성 | 전체 | 14~36판 | 2.1 계산. 초기 추천 20판 |

실패해도 진행하도록 패배는 승리의 절반을 유지한다(현재 15/30).

### 6.4 건물 시간과 충돌

현재 건물은 실시간 1~120분이다(`economy.js`). 조사 근거로는 시간 대기가 복귀 동기라는 증거도, 없애면 좋아진다는 증거도 단정할 수 없다. 사슬 도입 시 "판 끝 수확" 과 실시간 건설이 겹치면 두 개의 시계가 된다. 건설만 짧게 유지하거나 한 판 완료로 바꾸는 시험을 권한다.

### 6.5 체스와 연결

메타가 체스와 따로 놀면 Merge Mansion 비판과 Dawnmaker 회고가 그대로 온다. 연결 후보: 7단계 미션을 마을 주문판으로 넣는다. 예: 제분소가 "이번 판에 나이트를 잡아 주세요" 를 부탁한다. 안 해도 벌칙 없음. Card City Nights 의 지루함을 줄이려면 주문이 판마다 달라야 한다.

### 6.6 사용자가 정할 것

1. 일반 카드를 합성 재료로 둘지 씨앗으로 둘지, 자동 배분 규칙(예: 합성에 쓰고 남는 넘침만 밭으로).
2. 고급 문턱을 정확히 고급 칸으로 둘지(문턱 유지, 약자 지연), 고급 이상으로 둘지(지연 없음, 문턱 소멸), 사용자 원안대로 소모로 둘지.
3. 도토리만 쓸지, 작물을 파는 돈을 도토리로 합칠지. 합치는 쪽을 권한다. 화폐가 늘면 어린이에게 어렵다.
4. 실시간 건설을 유지할지.
5. 사슬 전체를 1차에 넣을지, 밭 1종과 고급 문턱 건물 1종만 먼저 시험할지. Dawnmaker 범위 폭발을 보면 후자를 권한다.

---

## 7. 틀릴 수 있는 곳, 모르는 것

- 메타 유무의 리텐션 차이를 숫자로 공개한 자료를 찾지 못했다. Royal Match A/B/C 도 2차 보도다.
- Royal Match 구역별 판 수는 충돌하는 수치의 나눗셈이다.
- Coin Master 와 Monopoly GO 는 카지노식 수익 구조로, 무료 게임의 비율 기준으로 쓰기 어렵다. 불만 모양만 참고했다.
- 상용 모바일 게임의 리뷰 자료는 Reddit 몇 건, 앱 리뷰 모음, 위키에 치우쳤다. 한국 커뮤니티 자료는 거의 없다.
- 어린이 대상 자료가 없다. 이 문서의 플레이어 불만은 주로 성인 사례다.
- 체스 한 판 길이, 판당 잡기 수, 판 끝 화면 체류 시간은 미측정이다. 왕관 카드 계획서 4단계 측정 로그가 먼저다.
- 6절은 사실 조사가 아니라 제안이다. 사람이 해 본 적이 없다.
