# 「Grow a Garden」 쇼츠 분석 라운드 (2026-11-03)

사용자 요청: 「https://www.youtube.com/shorts/wQxh6ab8zUM 이 영상의 대본과 이미지 등의 내용 아주 자세히 분석해서 우리 게임에 참조하는 방향의 계획서 작성해 llm 협업해」

결과 계획서: [docs/plans/2026-11-03-garden-short-plan.md](../../../plans/2026-11-03-garden-short-plan.md)

## 방법
1. 영상(88초)을 yt-dlp 로 받았다. 자막 서버가 429 로 막혀서 로컬 faster-whisper medium 으로 받아썼다(`transcript-raw.txt`). large-v3 는 받는 중 2.1GB 에서 멈춰 중단했다.
2. 장면 46장을 통합자가 직접 보고, 화면 자막과 대조해 받아쓰기 오류 7곳을 고쳤다 → `VIDEO.md`(모델들의 유일한 영상 입력).
3. 통합자가 먼저 독립 판정을 썼다(`r1-claude.md`).
4. 셋에게 역할을 갈라 줬다.
   - agy: 게임 시스템 설계
   - grok: 영상 주장 사실 확인과 실제 게임 구조 조사
   - codex: 저장소 적합성, 운영, 위험
5. 실행 중 막힌 것:
   - agy·grok 을 권한 우회 플래그로 띄우는 것은 자동 승인에서 막혔다. 그래서 agy 는 도구 없이 원문 부록을 붙여(`BRIEF-agy-inline` 방식) 돌렸다.
   - grok 은 처음에 계획 모드로 돌렸는데 웹 읽기 권한을 물을 수 없어 실패했다. 다시 `--permission-mode default --allow Fetch/WebFetch/WebSearch/Search` 로 돌렸다.
   - codex 는 설정 파일의 모델 `gpt-6.1-sol` 이 ChatGPT 계정에서 400 오류를 냈다. 설정 파일은 고치지 않았고, 이번 실행에만 `-c model="gpt-6-sol"` 을 줬다(같은 날 성공한 세션 기록의 모델).
6. 핵심 사실은 통합자가 원문으로 다시 확인했다(아래 표).

## 영상 주장 대조 (통합자 원문 확인)
| 영상 주장 | 판정 | 확인한 원문 |
| :--- | :--- | :--- |
| 동접 2,230만 (2025-08) | 맞음 (2025-08-23, 22.3M) | Wikipedia 「Grow a Garden」 |
| 포트나이트 1,434만 | **출처가 갈림.** Tracker.gg 역대 14,346,265(grok 인용, 통합자 미확인). Wikipedia·PocketGamer.biz 는 「Fortnite's highest peak of 15.3m from late 2020」 | PocketGamer.biz 2025-06-25 기사 |
| 2025-03-26 공개, 16세 BMWLux, 사흘 제작 | 맞음 (사흘은 보도된 말, 독립 검증 없음) | Wikipedia 「the initial version was developed in only three days」 |
| 동접 500 일 때 지분 | **출처가 갈림.** Madsen 본인 「around maybe 500 CCUs」. Wikipedia 는 「around 1,000」 | GamesBeat Janzen Madsen 인터뷰 |
| 2주 만에 10만 | 맞음 「Maybe within two weeks we were at about 100,000 CCUs」 | GamesBeat |
| 한 달 만에 100만 | **1차 출처 못 찾음** (grok·통합자 모두) | — |
| 33일 10억 방문 | 맞음 | Wikipedia |
| 2025-05 매출 1,200만 달러 | **외부 추정**. 개발사는 매출 공개를 거절 | Calcalist(추정 보도), Wikipedia |
| 13세 미만 1/3 | 대략 맞음 (Jandel 「around 35%」) | Wikipedia |
| Kotaku 「프로토타입 같다」 | 맞음 | Wikipedia 가 Kotaku 의 Zack Zwiezen 인용 |
| 「매주 새 이벤트」가 성장 원인 | **절반만 맞음.** Madsen 은 「We started weekly updates」라고 했지만, 성장 이유로는 농사 주제와 **오프라인 성장**을 꼽았다: 「the whole idea of the garden growing offline, the persistent world」 | GamesBeat |
| (영상에 없음) 피크는 오래가지 않는다 | 21.3M 피크가 한 시간 뒤 7.6M | PocketGamer.biz 2025-06-25 |

## 세 모델 주장 판정
| 주장 | 누가 | 판정 |
| :--- | :--- | :--- |
| 실시간 성장은 (c) 「아침 이슬」(날이 바뀐 뒤 첫 판에 +1)로 일부만 | agy | **채택** (통합자 r1 과 같은 방향. 근거가 Madsen 인터뷰로 강해졌다) |
| 실시간 성장은 들이지 않고 "다음 판에 익어 있다"로 | grok, codex | 기본 고리로 채택. 다만 Madsen 이 오프라인 성장을 성장 이유로 꼽았으므로, 아침 이슬을 시험 항목으로 함께 둔다 |
| 「`tickVillage` 가 실제 시간을 쓰는 유일한 곳」은 틀림. 쓰다듬기 하루 한도도 날짜를 쓴다 | codex | **맞음** (`src/village/economy.js:342-352` `dayKey`·`pet`). **통합자 브리핑의 오류.** 섬 경제 계획의 원래 문장은 "돈이 들어오는 유일한 곳"이라 맞다 |
| `tickVillage` 는 `economy.js:320` | grok (섬 경제 계획 문장 인용) | **줄 번호가 낡았다.** 지금은 `:361`. 계획 문서의 줄 번호가 코드보다 늦다 |
| 작물 판매가 「해바라기 5 도토리」 | agy | **틀림.** 섬 경제 계획 §5 시작값에 해바라기 값은 없고, 기름이 10 이다. 「판당 판매 3개」는 맞다 |
| 매주 배포 주기가 가장 약한 결정. 주기보다 "매주 가설 점검, 통과한 변경만 배포" | codex | **채택** |
| 주간 단위는 새 GLB 가 아니라 JSON(문장·팔레트·주문) | grok | **채택** |
| 기기 시계 조작으로 주간·일일 보너스를 당겨 쓸 수 있다 | agy | 맞다. 그래서 주간 내용은 **놓쳐도 다시 오는 것**만 두고, 아침 이슬은 하루 1, 쌓이지 않게 한다 |
| 과시 경로가 없다(서버 없음, 아이 섬 공개 기본 끔) | grok | 맞다. 영주 증명서(D5) 공유가 지금 유일한 바깥 경로 |
| 홍보 쇼츠의 숫자는 같은 빌드의 실제 플레이로만 | codex | **채택** |

## 이 라운드에서 배운 것
- 영상의 결론(「매주 고친 속도」)과 운영자 본인의 설명(「오프라인에서 자라는 정원」)이 다르다. **2차 매체의 인과 해석은 1차 인터뷰로 확인한다.**
- 통합자 브리핑의 한 문장("실제 시간을 쓰는 유일한 곳")이 틀렸다. codex 만 찾았다.
