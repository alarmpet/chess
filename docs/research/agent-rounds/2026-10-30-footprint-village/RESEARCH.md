# 조사 자료 (통합자 확인, 2026-10-30)

## 내려받아 코드를 읽은 오픈소스 (라이선스는 GitHub API 와 저장소 파일로 확인, 실행하지 않음)
| 저장소 | 라이선스 | 코드에서 확인한 것 |
| :--- | :--- | :--- |
| ihtasham42/progress-knight | Unlicense | 1,157줄 main.js. 나이 든다(days), 수명(getLifespan)이 다하면 멈춘다. rebirth 하면 레벨 0, 그러나 task.maxLevel 은 남겨서 다음 생을 빠르게 한다. "죽음 → 환생 → 이전 삶이 다음 삶을 돕는다" 를 1,500줄 안쪽으로 만들었다. |
| Tendsty/gooboo | GPL-3.0 (코드 복사 금지, 구조만 참고) | 모듈 mining·village·horde·farm·gallery·gem·school·event·relic 이 하나의 tick(diff) 를 공유한다. 시간차를 받아 모듈마다 tickspeed 로 나눠 처리하므로 열려 있든 닫혀 있든 같은 코드가 돈다. 일정 시간 이상 비우면 offlineSummary 화면을 먼저 보여 준다. cryolab 으로 특정 모듈을 얼려 멈출 수 있다. |
| Trimps/Trimps.github.io | GPL-2.0 (복사 금지) | 오프라인 처리를 사용자가 고른다: 없음 / Time Warp(24시간 상한) / Hybrid. 24시간 넘는 분은 다른 방식으로 준다. |
| miktaew/yet-another-idle-rpg | MIT | 번들·소스 일부만 훑었다. 플레이 내 시간을 Date.now 로 재서 처리. 세부는 재 보지 않았다. |
| IdreesInc/Pocket-Bird | MPL-2.0 | 브라우저 위를 다니는 픽셀 새. 쓰다듬기 가능. 희귀 깃털을 잡으면 종 해금(30종 이상), 모자 12종 이상. UNCOMMON_FEATHER_CHANCE 0.15. 사용자 화면에 얹혀 있는 "늘 곁에 있음" 이 핵심. |
| victorqribeiro/isocity | MIT | main.js 185줄 수준의 아이소메트릭 도시 타일 배치 예제. |

REA `analyze_javascript_application` 을 progress-knight 에 돌렸다: 파일 4개, 파싱 실패 0, 타이머 관계 3건, 네트워크·요청 없음으로 나왔으나 커버리지는 partial 이고 "없음을 뜻하지 않는다" 고 REA 가 명시한다. 오픈소스는 소스가 있으므로 REA 의 추가 소득은 작았다.

그 밖에 API 로 존재만 확인: Anuken/Mindustry GPL-3.0 · pmotschmann/Evolve MPL-2.0 · doublespeakgames/adarkroom MPL-2.0 · IvarK/AntimatterDimensionsSourceCode MIT · LorisYounger/VPet Apache-2.0 · ViciousSquid/Dosidicus GPL-2.0.

## 현재 게임 (실측)
- 표준 체스 + 동물 6종 × 4단계. 라이벌 AI 3명, 소품 7종. 소품은 체크메이트로 얻는다. 저장은 localStorage 뿐, 서버 없음.
- 말 개체 구분 없음: 폰 8마리는 같은 모델이고 역할별로 외형이 같다.
- 코드 재사용 후보: three r170, instantiatePiece, Idle·Walk·Attack·Hit·Kneel·Cheer 클립, 소켓.
- 다른 PC 작업의 농장(정원 격자, 작물, 시설, 체스 전리품)은 archive/other-pc-games 브랜치에 있다. 사용자가 이 게임이 아니라고 했다. 코드를 되살리지 않는다.

## 웹 근거
- Cutting, Gundry, Cairns (2018) "Busy doing nothing? What do players do in idle games?", IJHCS 122. Neko Atsume 설문 N=1972. 초록 기준: 참여를 시간·직접 사교·소셜미디어 사교·확인 빈도로 설명하고, 기존 몰입 모델에 맞지 않아 "습관" 으로 보자고 제안. https://eprints.whiterose.ac.uk/id/eprint/135461/ (본문은 읽지 않았다)
- Tamagotchi effect: 기계·소프트웨어에 정서적 유대를 형성. 초기 다마고치는 방치하면 약 반나절에 죽어 비판받았고 뒤에 일시정지가 생겼다고 Wikipedia 가 적는다(문서 품질 경고 있음). https://en.wikipedia.org/wiki/Tamagotchi_effect
- 오프라인 상한: 한 개발자 글은 24시간 상한이 매일 확인 습관을 돕고 무제한은 건너뛰기를 가르친다고 주장(근거 없는 의견). https://manu-site-astro.pages.dev/offline-progression/
- 긴 타이머가 진행을 지배하면 잔존이 무너진다(업계 분석). https://www.pocketgamer.biz/deconstructing-a-100m-idle-game-what-5-years-of-gold-and-goblins-reveals-about-live-ops-and-retention/
- 벌칙형 일일 로그인은 단기 상승 뒤 반감 이탈(Roblox 관련 글, 품질 낮음). https://rowatcher.com/news/the-afk-revolution-how-idle-mechanics-conquered-roblox
- Cookie Run: Kingdom: 단순하고 읽기 쉬운 코어 + 강한 캐릭터 정체성 위에 성장을 얹는다는 개발자 설명. https://80.lv/articles/how-to-build-a-game-to-retain-300-million-players-with-long-term-appeal
- FTC 2025-01 HoYoverse 합의: 2천만 달러, 16세 미만 부모 동의 없는 구매 차단. FTC 안내는 다크패턴을 피하라고 한다. https://ftc.gov/business-guidance/blog/2025/01/level-tips-businesses-ftcs-settlement-genshin-impact-developer-hoyoverse

## 찾지 못한 것
- 알림 빈도에 대한 믿을 만한 자료, Play 가족 정책의 알림 문구, Animal Crossing 의 결석 처리 개발자 자료, 체스와 마을을 잇는 성공 사례. 없다는 뜻이 아니라 이번에 못 찾았다는 뜻이다.
