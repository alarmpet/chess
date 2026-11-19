# 운영 대시보드 계획서 — 출시 뒤 「어제 무슨 일이 있었나」를 5분 안에 보는 한 장

> 열린 항목은 [STATUS.md](../STATUS.md) 에서 관리한다 (2026-11-05). 이 문서는 결정의 기록이다.

작성일 2026-11-05. 사용자 요청 ②: 「곧 출시하는데 앱 운영 대시보드가 있어야 하지 않나. 오픈소스 대시보드를 내려받아 역공학하고, 커뮤니티·웹을 조사해 우리 앱에 맞는 최적 설계 계획서」.
사실은 저장소·공식 문서·원문에서 확인한 것만 적었고, 재지 않은 것은 「재 보지 않았다」로 표시했다. 세 모델 교차 검증은 하지 않았다.

## 0. 한 줄 답

**출시 첫날부터 보는 것은 네 숫자다 — 어제 판을 둔 사람 수, 판 완주율, 오류율, 다음 날 돌아온 비율.** 이것을 위해 외부 분석 SDK 를 앱에 넣지 않고(어린이 대상 Play 가족 정책 때문에), **우리 코드 30줄이 익명 사건 10종을 하루 한 번 묶어 보내는 작은 수집기 + Cloudflare Worker/D1(무료) + 우리 정적 대시보드 한 장**으로 시작한다. 식별자 없이 리텐션을 재는 방법은 「설치 뒤 며칠째인가」를 사건에 실어 보내는 것이다(§4). 출시 전 웹 시험 기간에는 PostHog 무료 구간을 **웹에서만** 붙여 비교한다.

## 1. 조사 방법과 출처

| 경로 | 한 것 | 결과 |
| :-- | :-- | :-- |
| GitHub API + LICENSE 원문 | 후보 16개의 스타·라이선스·최근 푸시 | §3 표 |
| 내려받아 읽음(실행 안 함) | `D:\tmp\dash-rea\` — Umami 3.4.1(MIT), Aptabase(AGPL — 구조만), GlitchTip backend(MIT) | §2 |
| 공식 문서 | Play 가족 정책(9893335)·가족 자체 인증 광고 SDK(9900633)·PostHog/Sentry/Umami/Aptabase/Supabase 가격·Cloudflare Workers/D1 한도 | §3·§4 |
| ego-browser: 구글 검색 6건 → Reddit 글 10개 본문 + 상위 댓글(r/gamedev·r/GameDevelopment·r/PBBG) | 라운드 02·03, `C:/Users/petbl/ego/ops-dashboard-20261105-0330/` | §2.1 |
| HN Algolia API | 「Ask HN: Who is using a self hosted analytics」 댓글 14개, 검색 2건 | §2.1 |
| Threads(로그인 상태) | 검색 3건 — 쓸 만한 글 1~2개 | §2.1 |
| X · LinkedIn | **로그인 벽.** 자격 증명을 넣지 않아 수집 못 함 | — |
| 블로그 | dev.to(PostHog+Grafana 개인 대시보드), GameAnalytics 「killer dashboards」, Immutable 인디 분석 가이드, dev.to 가족 정책 체크리스트 | §2.1 |

## 2. 조사에서 나온 것

### 2.1 커뮤니티가 실제로 보는 숫자 (원문 요약)

| 출처 | 말한 것 |
| :-- | :-- |
| r/PBBG 「Devs, what stats do you actually keep an eye on?」(2026-10, 상위 댓글 7점) | **「계정 나이별 일일 활동 플레이어」** 한 그래프가 가장 중요. 리텐션은 가입 코호트별 D1/D7/D30. 「어디서 그만뒀나」는 **마지막 행동**을 본다 |
| 같은 글, 다른 댓글 | 24시간 활동 사용자 하나면 충분(매일 들어오는 게임). 2주 활동은 의미 없음. 「떨어지는 지점」·안 쓰는 기능·재화가 어디서 쓰이는지 |
| r/gamedev 「What metric… enjoying your game?」(2026-10) | 지표 하나로 재미는 못 잰다. 굳이 하나면 **플레이 시간 중앙값**·돌아오는 비율. 질적 피드백을 같이 |
| r/gamedev 「What do indies use for in-game analytics?」(2026-08, 16점) | GameAnalytics(무료) 다수, Aptabase + CSV + 파이썬 대시보드(45분 만에 구성), 자기 DB + SQL, Firebase. **핵심 조언: 「백엔드 고르기 전에 그 데이터로 내릴 결정부터 정하라. 첫 스키마는 session started, run started/ended, checkpoint, item selected, feedback. 사건마다 안정적 세션 ID·빌드 번호·스키마 버전」** |
| r/gamedev 「lightweight, privacy-first analytics?」(2026-10) | 「run start, run end(결과·길이), 그만둔 단계」 몇 개면 된다. 뷰어가 불편하면 같은 테이블에 Metabase/Grafana 를 붙여라. 식별 정보 없이 UUID 하나 |
| r/gamedev 「Do indie… deep level analytics?」(2025) | Slay the Spire 가 깊은 분석으로 크게 득을 봤다(GDC). 「게임 열기·얼마나 오래·레벨 완료율·기능 열어 본 비율」은 누구나 봐야 한다 |
| r/gamedev 「Mobile Games — how to enter」(2024, 57점, Tech Tree Games 대표) | 리텐션 목표 **D1 40% · D7 10% · D30 3%**. D1 20% 면 게임에 문제 |
| r/unity 「What CPI & Retention publishers look for」(스니펫) | 퍼즐 게임 D1 50% 가 「solid」, 일반 30~35% |
| r/GameDevelopment 「What's wrong with game analytics dashboards?」(2025) | 가장 큰 불만 = **어수선한 UI**. 바라는 것 = 충돌·급락 **실시간 알림**, 역할별 화면 |
| HN 「Ask HN: Who is using a self hosted analytics」 | 자체 구축은 「유지보수가 수익 최적화 시간을 잡아먹었다」(tixocloud) vs 「$5 인스턴스에서 수백만 건, 결과를 **메일로 받아** 로그인 안 한다」(boyter) |
| dev.to PostHog+Grafana | PostHog 무료 구간이 넉넉하고 HogQL 이 편하지만 「내가 열고 싶은 대시보드」는 따로 만들었다 |
| GameAnalytics 블로그 | 대시보드는 **「탄광의 카나리아」** — 문제가 커지기 전에 먼저 우는 지표 몇 개를 맨 위에. 일간/월간을 나눠라 |
| Threads(한국, 개발일지) | 「다운로드 수보다 플레이 시간·재방문율·이탈 구간」 |

→ 공통분모: **DAU · 코호트 리텐션 · 완주/이탈 지점 · 플레이 시간 · 오류**, 그리고 「지표보다 그걸로 내릴 결정을 먼저」.

### 2.2 오픈소스 대시보드 역공학(읽기만) — 구조에서 배운 것

| 저장소 | 본 것 | 우리에게 |
| :-- | :-- | :-- |
| **Umami 3.4.1** (MIT, Next.js + Prisma, Postgres 또는 ClickHouse) | 사건 한 테이블(`website_event`: session_id·visit_id·created_at·url·referrer·event_name·event_type + 세션 테이블에 browser·os·device·screen·language·country). 기본 지표 5개 `pageviews·visitors·visits·bounces·totaltime`(`getWebsiteStats.ts`). **리텐션 = 세션의 첫 날을 코호트로 잡고 날짜 차이로 묶는 SQL 하나**(`getRetention.ts`). 패널 = 페이지·참조·브라우저·OS·기기·국가·이벤트·퍼널·목표·여정·코호트·실시간 | 테이블 둘(사건·세션)과 SQL 몇 개면 대시보드의 90% 가 나온다. 리텐션 SQL 모양을 그대로 쓴다(MIT) |
| **Aptabase** (AGPL — 구조만) | 사건 본문 = `eventName·timestamp·sessionId·systemProps{os·osVersion·locale·appVersion·appBuildNumber·engine·sdkVersion·deviceModel}·props(JSON)`. 세션은 **SDK 가 만드는 임시 ID**, 서버는 타임스탬프가 10분 넘게 미래면 거절. 통계 API = `metrics·periodic·top-events·top-props·top-appversions·top-buildnumbers·top-os·top-devices·top-countries`. 「고유 식별자 없이 세션만」이 원칙이라 **코호트 리텐션이 없다** | 앱 버전·빌드 번호를 사건마다 싣는다. 식별자 없이 가면 리텐션은 다른 방법이 필요(§4) |
| **GlitchTip** (MIT, Django, Sentry 호환) | 오류 사건 스키마 = `exception(type·value·stacktrace)·breadcrumbs·release·environment·user·tags`. Postgres 만으로 512MB 에서 돈다 | 오류 사건에 `release`(빌드)·`environment`(web/twa) 를 꼭 싣는다. Sentry 브라우저 SDK 없이 `window.onerror`+`unhandledrejection` 로 같은 모양을 만들 수 있다 |

### 2.3 어린이 대상 앱의 제약 (Play 가족 정책 원문, 2026-11-05 확인)

- 「Apps that solely target children must not contain any APIs or SDKs that are not approved for use in primarily child-directed services」, 「must not transmit Android advertising identifier (AAID), SIM Serial, Build Serial, BSSID, MAC, SSID, IMEI, and/or IMSI」, 「Don't collect personal data persistent identifiers (like AAID or IMEI) from children」, 「You must disclose the collection of any personal and sensitive information from children… including through APIs and SDKs」. 혼합 대상이면 **중립 연령 화면**.
- 광고 SDK 는 「Families Self-Certified Ads SDK」 목록만. **분석 SDK 에는 같은 자체 인증 목록이 없다** — 「child-directed services 에서 승인된」 것만이라는 문장뿐이라, 어떤 분석 SDK 가 허용되는지는 SDK 마다 약관을 확인해야 한다(재 보지 않았다). dev.to 체크리스트도 「분석·충돌 보고·로그인·지원 SDK 전부를 목록으로 만들고 데이터 경로를 적어라」로 같은 결론.
- → **외부 분석 SDK 를 넣지 않는 것이 가장 안전하다.** 우리 코드가 보내는 사건은 우리가 내용을 다 안다(Data safety 양식에 그대로 적는다). 이 판단은 법률 조언이 아니다(STATUS DS-법 과 함께 사용자·전문가 확인).

## 3. 후보 도구 표 (확인한 사실만)

| 도구 | 라이선스(원문) | 무료 구간(공식 가격 페이지) | 맞는가 |
| :-- | :-- | :-- | :-- |
| PostHog | 코어 MIT(`ee/` 제외) | 월 1M 사건·100K 예외·5K 리플레이, 매달 초기화 | 기능은 최고(퍼널·리텐션·오류). **브라우저 SDK 가 셋째 SDK**라 어린이 앱 안에는 보류. **출시 전 웹 시험용**으로 적합 |
| Umami | MIT | 클라우드 Hobby 월 100K 사건·사이트 1·6개월 보관. 자체 호스팅 무료 | 웹 분석이 중심. 커스텀 사건·리텐션 있음. 자체 호스팅이면 Postgres 서버가 필요 |
| Aptabase | AGPL-3.0 | 월 20K 사건 무료 | 앱 지향·단순. 리텐션 없음. AGPL 이라 코드 복사 금지(구조만) |
| GlitchTip | MIT | 자체 호스팅(512MB) | 오류 추적. 출시 뒤 오류가 많아지면 자체 호스팅 후보 |
| Sentry | FSL 1.1(Apache 2.0 전환 유예) | Developer $0 · 1인 · 5K 오류/월 | SDK 가 앱에 들어간다 → 같은 보류 |
| Cloudflare Web Analytics | — | 무료 | 페이지뷰·Web Vitals 만, 커스텀 사건 없음. **정적 사이트에 공짜로 하나 더** |
| Cloudflare Workers + D1 | — | Workers Free **100,000 요청/일·CPU 10ms·크론 5개**, D1 Free **DB 10개·DB당 500MB·계정 5GB·시간 여행 7일** | **채택.** 수집 끝점 + 일일 롤업 크론 + 대시보드 JSON. 일일 읽기/쓰기 행 한도는 저장한 문서에서 확인 못 했다 |
| Supabase | — | Free: MAU 5만·DB 500MB·**1주일 비활성 시 일시 정지**·활성 2개 | 이미 멀티플레이 전송층 후보(PLAN §12.1). 일시 정지가 무인 대시보드에는 치명적 → 수집 끝점으로는 안 씀. 나중에 서버 뒤 기능(DS-D9)과 함께 |
| Metabase / Grafana | AGPL | 자체 호스팅 | 우리 D1 에 BI 를 붙일 때 후보. 1인에게는 과함(HN tixocloud 경고) |
| GameAnalytics | 비공개 | 무료 | 커뮤니티 1위지만 SDK·제3자 → 보류 |

## 4. 설계

### 4.1 원칙

1. **지표보다 결정을 먼저.** 각 지표 옆에 「이 숫자가 X 면 하는 일」을 적는다(§4.3).
2. **식별자 없음.** 기기 ID·광고 ID·IP 저장 안 함(Worker 가 IP 를 버린다). 사용자 ID 도 없다.
3. **리텐션은 코호트 나이로.** 클라이언트가 설치일(첫 실행 날짜, localStorage)만 알고, 사건마다 `ageDays`(설치 뒤 며칠째)와 `cohortWeek`(설치 주)를 싣는다. 서버는 「코호트 주 × ageDays 별 활동 세션 수」를 세면 D1/D7/D30 이 비율로 나온다 — r/PBBG 의 「계정 나이별 일일 플레이어」 그래프가 바로 이것이고, 개인을 잇는 키가 없다. 정확도는 코호트 단위(주)다.
4. **하루 한 묶음.** 사건은 localStorage 에 쌓였다가 하루 한 번(또는 50개) `sendBeacon` 으로 간다. 꺼져 있던 기기는 다음 실행에 보낸다. 실패하면 버린다(3일 넘은 것).
5. **끌 수 있다.** 설정에 「사용 통계 보내기」 스위치(기본 켬, 설명 한 줄). 개인정보 처리방침에 사건 목록 그대로.
6. **카나리아 4개가 맨 위.** 나머지는 접힌다(r/GameDevelopment 「어수선한 UI」).

### 4.2 사건 사전 (v1, 10종) — `src/ops/telemetry.js`

공통 필드: `v`(스키마 1) · `app`(빌드 번호 = 커밋 짧은 해시, `vite define`) · `env`(web/twa) · `day`(UTC 날짜) · `ageDays` · `cohortWeek` · `sess`(실행마다 난수, 서버 저장 안 함 — 세션 수만 센다) · `lang` · `vw`(뷰포트 폭 버킷: <600/<1000/≥1000) · `gpu`(low/mid/high — `perf_probe` 의 콜백 JS·GPU ms 로 로컬 판정) · `storeOk`(localStorage 가능 여부).

| 사건 | 필드 | 쓰는 결정 |
| :-- | :-- | :-- |
| `open` | 없음 | DAU, 코호트 리텐션 |
| `game_start` | `mode`(single/rival/resume), `side` | 시작 수 |
| `game_end` | `result`(mate/draw/resign/abandon), `plies`, `secs`, `captures`, `takebacks` | **완주율**(end/start), 판 길이 중앙값(FN·AF 빠른 대국 결정), 10수 기권선 근거(IE-306) |
| `village_open` | `from`(toast/button/auto), `secsOnBoardSince` | 섬 진입률(GS-G1 측정) |
| `village_act` | `kind`(build/moveIn/pet/shelf/prop/photo) | 섬에서 손을 쓰는 비율(IE 시험 B 질문) |
| `island_state` (하루 1회) | `built`, `island`, `cards`, `hearts` | 진행 분포 — 8채 완성 판 수(DS-D7b) |
| `card` | `rarity`, `fromEvent` | 드롭 체감 확인 |
| `error` | `msg`(앞 120자), `stackHash`, `where`, `release` | **오류율**, 새 빌드 뒤 급증 알림 |
| `perf` (실행당 1회) | `drawcalls`, `jsMs`, `gpuMs`(있을 때), `rafHz` | 기기 등급별 성능 분포 — 품질 등급(PF-8) 기본값 |
| `quit_dialog` | `choice`(keep/newGame/resign) , `plies` | 확인창 문구 평가(TA-3) |

개인정보: 말 이름·증명서·카드 이름·자유 입력은 절대 싣지 않는다. 사건 크기 ≤ 300B, 하루 ≤ 100개.

### 4.3 화면 한 장 (`ops/index.html`, 정적, 관리자 토큰으로 JSON 읽음)

| 줄 | 내용 | 「이 숫자가 … 이면」 |
| :-- | :-- | :-- |
| 1 카나리아 | **어제 DAU** · **판 완주율** · **오류율(오류 세션/세션)** · **D1(지난주 코호트)** — 4칸, 전주 대비 화살표 | 완주율 < 60% → 판 길이·기권선 본다. 오류율 > 2% → 그날 빌드 되돌린다. D1 < 20% → 첫 판 경험(FN-2) |
| 2 추세 | 28일 DAU · 세션/일 · 판/일, 빌드 배포일 세로선 | 배포 뒤 꺾이면 그 빌드 |
| 3 코호트 | 주별 코호트 × ageDays 0·1·3·7·14·30 표(비율) | D7 < 10% → 섬 고리 재검토 |
| 4 퍼널 | open → game_start → game_end → village_open → village_act → 다음 game_start | 어느 화살표가 가장 얇은가 |
| 5 섬 | 건물 수 분포, 섬 번호 분포, 카드 장수 분포 | 8채 중앙값이 20~26판 밖이면 경제 재시뮬 |
| 6 기술 | 빌드별 오류 상위 10(스택 해시), 기기 등급 × gpuMs 분포, 뷰포트 버킷 | 특정 빌드·기기에서만 오류면 그 조합 재현 |
| 7 손으로 | Play Console 리뷰·평점·설치(수동 입력 칸), 사람 시험 메모 링크 | 숫자와 말이 어긋나면 말을 믿는다 |

알림: Worker 크론이 매일 아침 카나리아 4개를 계산해 **임계를 넘으면 메일 한 통**(Cloudflare Email Workers 또는 외부 메일 API — 무료 구간 재 보지 않았다). HN boyter 의 「로그인하지 않게 메일로」를 가져온다.

### 4.4 구성

```
브라우저(게임) ──sendBeacon 하루 1묶음──▶ Worker /ingest (IP 버림, 크기·스키마 검사, D1 insert)
                                           │
                              D1 events(원본 30일) ─크론 매일─▶ D1 daily_rollups(코호트·퍼널·오류·성능)
                                           │
우리 대시보드 ops/index.html ◀── Worker /rollups?token=… (JSON) ──┘
                                           └─ 카나리아 임계 → 메일
원격 설정 ops/config.json(정적 CDN) ──▶ 게임이 하루 1회 읽음: 기능 끄기 스위치 3개(전환·계층 렌더·주간 손님), 점검 공지 한 줄
```

- Worker 코드 ≈ 150줄, D1 스키마 2 테이블, 대시보드 1 HTML(차트는 Chart.js MIT 또는 SVG 직접). 번들 게이트에는 들어가지 않는다(게임 번들은 수집기 ≈ 2KB gzip 추정).
- 원격 설정은 대시보드의 「운영」 절반이다 — 출시 뒤 문제가 난 기능을 배포 없이 끈다. 값에 닿는 것은 넣지 않는다(욕망 계획 §7).

## 5. 단계표 — PR 하나에 스토리 3개 이하

| PR | 스토리 | 내용 | 완료 조건 | 측정 하나 |
| :-- | :-- | :-- | :-- | :-- |
| **OD-A** | OD-0 | 사건 사전 확정 + 개인정보 처리방침 초안 한 절 + Data safety 답안 표 | 표가 §4.2 와 같다. 사용자 승인 | 문서 |
| | OD-1 | `src/ops/telemetry.js`: 큐·ageDays·sendBeacon·설정 스위치·`error`·`perf` | 단위 테스트(큐 상한·날짜 경계·끄기). 번들 +≤3KB gzip | `gate:bundle` |
| | OD-2 | Worker `/ingest` + D1 스키마 + 크론 롤업(코호트·퍼널·오류·성능) | 가짜 사건 1,000개로 롤업 값이 손계산과 같음 | 테스트 스크립트 |
| **OD-B** | OD-3 | `ops/index.html` 7줄 화면 + 토큰 | 롤업 JSON 으로 그림이 뜬다. 휴대폰 폭 | 캡처 `docs/qa` |
| | OD-4 | 카나리아 메일 | 임계 넘긴 가짜 날에 메일 1통 | 메일 수신 |
| | OD-5 | 원격 설정 `config.json` + 스위치 3개 | 끄면 다음 실행에 반영, 없으면 기본값 | 브라우저 확인 |
| **OD-C** | OD-6 | 출시 전 점검: 사람 3명 기기에서 사건이 D1 에 도착, 개인정보 없음 확인(원본 눈으로), 7일 운영 리허설 | 7일치 화면 캡처 1장 | 사람 시험 |
| 선택 | OD-X | 출시 전 **웹 주소에서만** PostHog 2주 병행 → 우리 숫자와 비교 | 두 DAU 가 ±10% | 비교표 |

비용: $0(Workers Free·D1 Free·Pages). 시간: OD-A 2일 · OD-B 2일 · OD-C 리허설 7일(추정, 재 보지 않았다).

## 6. 틀릴 수 있는 곳

1. **코호트 나이 리텐션은 개인 리텐션이 아니다.** 한 사람이 하루 두 번 열면 세션 2로 센다 → 비율이 부풀 수 있다. `open` 은 하루 첫 실행만 보내 보정한다. 그래도 코호트 주 단위 근사다.
2. **D1 일일 읽기·쓰기 행 한도**를 공식 문서에서 못 찾았다(저장본에 없음). 사용자 1만 명 × 사건 100 = 하루 100만 행이면 무료 구간을 넘을 수 있다 — 출시 뒤 한 달 안에 확인.
3. **「우리가 쓴 수집기 = SDK 아님」이라는 해석**은 정책 원문의 문장 구조에서 온 추정이다. Data safety 양식에는 「앱 상호작용·충돌 로그·성능 진단」 수집으로 답해야 하고, 전문가 확인이 남아 있다(DS-법).
4. 사람이 적은 초기에는 리텐션이 요동친다(r/PBBG BaseballDreamGM). 코호트 < 30 이면 화면에 「표본 적음」을 띄운다.
5. X·LinkedIn 은 못 봤다. 거기 특유의 의견(인디 마케터)은 빠졌다.
6. 메일 발송 무료 구간·Chart.js 번들은 재 보지 않았다.
7. localStorage 가 막힌 기기(사파리 비공개 등)는 사건을 못 쌓는다 → `storeOk=false` 를 세어 비율만 안다.

## 7. 사용자 결정

| # | 질문 | 추천 |
| :-- | :-- | :-- |
| 1 | 수집 끝점: Cloudflare Workers+D1(새 계정 설정) vs Supabase(이미 있음, 1주 정지) | **Cloudflare** |
| 2 | 외부 SDK 없이 자체 수집기로 갈지 vs PostHog 를 앱에도 넣을지 | **자체 수집기**, PostHog 는 웹 시험 2주만 |
| 3 | 「사용 통계 보내기」 기본값 켬(설명 한 줄) vs 첫 실행 때 묻기 | 기본 켬 + 설정에서 끔(개인정보 없음이 전제). 전문가 의견에 따라 바꿀 수 있음 |
| 4 | 대시보드를 우리 HTML 한 장으로 vs Metabase 자체 호스팅 | 우리 HTML. 6개월 뒤 질문이 늘면 Metabase |
| 5 | 원격 설정 스위치 3개를 1차에 넣을지 | 넣는다(배포 없이 끄는 길이 운영의 절반) |
