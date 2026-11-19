# 설계 라운드 2 — 메타게임(대전·등급·코인·상점·착용) (2026-10-28)

사용자: "친구나 다른사람과 대전 · 많이 하거나 이기면 등급업·레벨업 · 코인 모아서 FIFA 처럼 A급 비숍을 상점에서 · 멋진 아이템 착용 … 너희가 낸 아이디어들은 어떻게 된거야?" → 1차 라운드 브리핑이 에셋·엔진·효과만 물어서 **기획서 v0.3 에 이 층이 없었다**(통합자 범위 설정 오류). `tri-agent-review --design` 2차. 결과는 `docs/PLAN.md` **v0.4 §12**.

## 방법 · 배정표

| 모델 | 실행 | 영역 | 배정 자료 | 결과 |
| :--- | :--- | :--- | :--- | :--- |
| **agy** | `agy --add-dir ×3 --effort high` | [A] 대전 기술 | `wizardChessEngine.js:3820~4110, 4260~4280` · `applet.test.mjs` · study-game `package.json`·`router.js` · `social-login-supabase` 스킬 | 완주 7.8KB |
| **grok** (grok-4.6) | `--allow Read/Grep/Glob/WebFetch/WebSearch --deny Write/Edit/Bash` | [G] 외부 사실·규제 E1~E8 | 기획서 + 웹 | 완주 10KB · URL 25개 |
| **codex** | `codex exec -s read-only - < C_prompt.md` ("읽기 전용 셸 허용" 머리에 명시) | [C] 게임 디자인·경제 | 기획서 §4.3·§4.5·§9·§10 · `App.tsx` · 엔진 `1395~1420`·`1518~1540`·`3591~3610` | 1차에 완주 191줄 (1라운드 교훈 적용 성공) |
| Claude (통합자) | `r1-claude.md` 셋 읽기 전 작성 | 전체 | 저장소 · Supabase/korea.kr 재확인 | — |

**통합자 작업 가정** "랭크 대전 기물은 외형만 다르다. 능력 기물은 캐주얼 모드만" 을 브리핑에 넣고 반박을 허용했다 → **셋 다 유지**, 근거는 서로 달랐다(agy 엔진·치트 / grok 도박 규제·FUT 선례 / codex 합법수·AI·회귀 분리). 사용자 미답 결정 → §10-10.

## 사실 대조 (전부 저장소·원문 확인)

| 주장 | 낸 이 | 판정 | 근거 |
| :--- | :--- | :--- | :--- |
| `applet.test.mjs:38-40` 이 `btn-lobby`·`lobby-modal`·`room-pill` 금지 | agy | 참 | 실측 `:38-40` |
| 방 코드 4자리 생성 `:4029-4033` | agy | 참 | `chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'` 4회 |
| `tryApplyNext` 120ms/250ms 재시도 · `{ fromRemote: true }` | agy | 참 | `:3957~3979` |
| study-game `installAccount` 게스트 외부요청 0 · `cloud_saves` RLS | agy | 참 | `router.js:14,3049` · 스킬 `SKILL.md:23-32` |
| Supabase Free 동시 200 · 100 msg/s · 월 200만 · 1주 유휴 정지 / Pro $25 · 500 · 500 msg/s · 월 500만 · $2.50/백만 · $10/1,000 | grok E5 | **참** (통합자 재확인) | `supabase.com/docs/guides/realtime/limits` · `supabase.com/pricing` |
| 한국 확률 표시 2024-03-22 · 간접 유상 포함 · "온전히 무상"만 제외 · 예외 중소기업 3년 연평균 매출 1억 이하 | grok E3 | **참** | korea.kr 148926013 · 148924297 원문 |
| 위반 벌칙 "2년 이하 징역 또는 2천만 원" | grok E3 | **미확인** | 인용한 두 보도자료에 없음. 법 조문 미대조 |
| chess.com 선물 멤버십 연 $49.99/$79.99/$119.99 | grok E8 | **미확인** | 페이지가 가격을 렌더하지 않음 |
| lichess Glicko-2 · lila AGPL · scalachess MIT · 벨기에 2018 · EA 2019-01 · 네덜란드 과태료 2022 취소 · Metered 20GB · Cloudflare TURN $0.05/GB | grok E1·E7·E6 | 참 (통합자 기존 지식과 일치, 이번에 URL 재열람 안 함) | — |
| `child.material = primaryMat` `:1533` | codex | 참 | 실측 |
| `btn-ai-move` `App.tsx:167` · `btn-reset` `:175` | codex | 참 (줄 ±1) | id 는 `:168`·`:176`, `:167`·`:175` 는 `<button` |
| PLAN §4.3 인용 `:133` | codex | 참 (줄 ±1) | 인용문은 `:134` |
| `const tpl = {` `:1411` · `stepKingFall` `:3593` | codex | 참 | 실측 |

**사실 오류 0건**(세 모델 모두). 미확인 2건은 grok 의 외부 수치로, 기획서에 "미확인" 표기.

## 각 모델이 틀리거나 약한 것 (지우지 않는다)
| 모델 | 내용 |
| :--- | :--- |
| agy | "Three.js 안무 중 착수 큐 레이스" 를 틀릴 수 있는 곳으로 적었으나 측정 없음 — 관찰 아닌 추정. 채택은 §12.6 테스트 항목으로만 |
| grok | TURN 18~25% 는 2016~17 영상통화 표본이라고 스스로 한정. 벌칙·가격 2건 출처 불일치 |
| codex | 줄 번호 2건 ±1. "15~16주" 는 편성안이지 실측 아님(본인도 명시) |
| Claude | 1차 라운드 브리핑에서 메타게임을 묻지 않아 v0.3 에 통째로 빠짐. "레이팅 숫자 숨김" 안은 grok 의 E2(chess.com 숫자 공개) 앞에서 철회 → 숫자+뱃지 병기 |

## 셋이 갈린 것과 끊는 법
| 쟁점 | agy | grok | codex | Claude | 결정 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 레이팅 표시 | — | 숫자+RD | — | 뱃지(숨김) | **둘 다 + 토글** (§10-11) |
| Phase 5 | 독립 Phase 로 확대 | 메타는 5 뒤 2~3주 | 4 +1주, 5 +2주 | — | **5a/5b/5c 분할**, 총 15~17주 |
| 전송층 | Supabase Realtime | (E5·E6 수치) | — | P2P 또는 Supabase | **Supabase** — E6 중계율로 P2P 탈락 |

## 혼자만 찾은 것
- **agy**: `room-pill` 도 금지 목록 · `tryApplyNext` 큐 재사용 가치 · 게스트→계정 이관 시 **빈 클라우드가 로컬을 덮는 사고**(P2).
- **grok**: "무료 재화라도 유료 재화와 교환되면 유상" → 커스텀 무료 N회(§10-4)가 나중에 코인과 섞이면 확률법 범위가 상점 전체로 번짐 · Play 가족 정책은 **확률 공개로 끝나지 않음**(시뮬레이션 도박 금지) · 체스 사용자는 분석·레슨에 돈을 냄.
- **codex**: 랭크 중 `btn-ai-move`·`btn-reset` 이 결과를 바꾼다 · `variants`/`sockets`/`equipSlots` 매니페스트 확장 · AI·로컬 대전은 XP 만.
- **Claude**: 한 판 ≈ 200 메시지 → Free 로 월 1만 판 계산 · 1주 유휴 정지 리스크.

## 파일
`BRIEF.md` · `r1-claude.md` · `r1-agy.md` · `r1-grok.md` · `r1-codex-answer.md`(원본 `r1-codex.md` 98KB 는 stdin 에코 포함, 미복사) · `C_prompt.md` · `run-*.cmd`
