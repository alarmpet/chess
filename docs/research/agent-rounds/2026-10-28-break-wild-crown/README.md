# 설계 라운드 4 — §14 아이디어 뱅크 깨뜨리기 (2026-10-28)

사용자: "같은 폰이어도 강아지·토끼·고양이를 직접 선택해 배치, 더 강한 외모로 업그레이드, 아이템·무기·방패 장착, 무기마다 다른 이펙트… 창의적인 아이디어 많이 내서 진행해봐" → 통합자가 **혼자** `docs/PLAN.md` v0.6 §14(9절, 93줄) 를 씀 → "4차 라운드" → `tri-agent-review --design` **공격 라운드**: 셋에게 §14 를 깨뜨리게 하고 출시 후보 A~D + KEEP 을 판정시켰다. 결과는 PLAN.md **v0.7** — **셋 다 KEEP(§14 는 v1.0 제외)**, 통합자만 반대했고 반박 자료가 없어 수용. §14.0 판정표, 각 절 "▶ 4차 판정", 0원 수정 4건(§10-15 뒤집음 · §12.4 모순 · §11 리스크 2줄 · §14.5 자체 충돌 삭제), §10-16.

## 방법 · 배정표

| 모델 | 실행 | 영역 | 자료 | 결과 |
| :--- | :--- | :--- | :--- | :--- |
| **agy** | `agy --add-dir D:\chess --effort high` (파일 읽기만) | [A] 기술 실현성 | `wizardChessEngine.js` 1395~1420 · 1518~1545 · 2095~2110 · 2495~2510 · 3591~3610 · 1436~1445, `App.tsx`, `applet.test.mjs`, PLAN §14·§12.3·§4.3~4.4·§9 | 완주 10KB, 결함 5 + 못 본 것 3, 일수 추정 4건 |
| **grok** (grok-4.6) | `--allow Read/Grep/Glob/WebFetch/WebSearch --deny Write/Edit/Bash --max-turns 80` | [G] 등급분류·표시법·외부 사실 E1~E7 | PLAN + 웹 | 완주 13.5KB, 결함 7, URL 15 |
| **codex** (`gpt-6-sol`) | `codex exec -s read-only - < C_prompt.md` | [C] 디자인·경제·오해 | PLAN 전체 + 3차 Steam 덤프 15개 | 완주 85줄(stdout 408KB 중 마지막 `^codex$` 뒤 추출), 결함 9 |
| Claude (통합자) | `r1-claude.md` 셋 읽기 전 | 자기 안 깨기 | — | 결함 6, 판정 A수정·B수정·C채택·D수정·K아니오 |

**브리핑 조항**: "§14 를 통째로 빼라(KEEP) 도 정상 답" · "§14.9 에 통합자가 이미 적은 네 가지는 다시 내지 말고 더 깊이" · 인용은 글자 그대로. 통합자가 실측해 준 전제: 승급은 `:2498~2503` 무조건 퀸(선택 UI 없음), `:1518~1540` `primaryMat` 덮기, `capturedByWhite/Black` 숫자만, 드로우콜 ≤40 은 가설.

## 사실 대조 (전부 코드·원문 재확인)

| 주장 | 낸 이 | 판정 | 근거 |
| :--- | :--- | :--- | :--- |
| `:2501` `instantiatePiece('queen'` · `:2148` `promotion: 'queen'` · `:3910` · `:2747 chooseSmartAIMove` · `:1533 primaryMat` · `:2439 BLOW_CLIP_TIME` · `:2440~2449` 타임라인 · `:2572 applyConcreteTrajectory` · `:3593 stepKingFall` · `:2143~2150` 패킷 · `applet.test.mjs:48~56` expectedModels 7개 | agy | **전부 참** | `sed -n` 실측 |
| PLAN `:423` `:442` `:429` `:426` | agy | 참 | 실측 |
| "SkinnedMesh 에 정적 장비 `mergeGeometries` 불가 · InstancedMesh 는 본 트랜스폼 추적 불가" | agy | 참 (three.js 일반 지식 — 코드로 재지 않음) | 통합자 기존 지식과 일치 |
| GRAC 전체이용가 "폭력, 혐오, 공포 등의 요소가 단순하게 표현" | grok | 참 (HTML 줄바꿈으로 분리돼 있음) | `grac.or.kr/Institution/EtcForm01.aspx` |
| GRAC 자체등급분류 정의 · 사례집 "단순한 폭력 표현" | grok | 참 | `AutonomicGradePlan.aspx` · `RatingCasebooks.aspx` |
| Apple "Guns or Other Weapons … guns, swords, or knives" · 9+ "Infrequent guns or other weapons" · 4+ "contain no objectionable material" | grok | 참 | developer.apple.com 연령 등급 정의 |
| Play IARC "minimal cartoon, fantasy or mild violence" · "Bugs Bunny or Tom & Jerry" · "In South Korea, ratings have been approved by the Game Rating Administration Committee (GRAC)." | grok | 참 (`&amp;` 인코딩) | support.google.com 6209544 |
| Play "you must submit a new content rating questionnaire" · "Misrepresentation of your app's content may result in removal or suspension" | grok | 참 (곡선 아포스트로피) | 9898843 |
| Play Families "Apps that include violence, gore, or shocking content not appropriate for children." | grok·통합자 | 참 | 9893335 |
| chess.com 자동 퀸 "save crucial seconds in bullet games" · ALT 언더프로모션 | grok | 참 | support.chess.com 8614542 |
| lichess "Promote to Queen automatically" · "Hold the <ctrl> key while promoting…" | grok | 참 (`&lt;ctrl&gt;`) | lila `preferences.xml` |
| chess.com "customize your board color, choose your preferred piece style" · 상대 세트는 "a brief animation plays, showing their board and pieces" | grok | 참 | 8594320 · 9090964 |
| 표시광고법 제3조 · 시행령 거짓과장/기만 정의 · 공정위 2018 전자상거래법 제21조 | grok | 참 | law.go.kr · korea.kr 156261741 |
| TFT Star Shards "starting from 625 RP" · 100/125/150 · Pass+ 1295RP | grok | 참 | TFT Fates Pass 공지 |
| "혼합 군단을 상대 화면에 보여주는 체스 앱 선례 없음" | grok | **범위 명시된 부재** (chess.com Help 3페이지·lichess·스토어 검색) | — |
| "외형 전용 공정위 처분 사례 못 찾음" | grok | 범위 명시된 부재 | — |
| PLAN `:280` `:315` `:405` `:389` `:402` `:403` `:404` `:243` `:444` `:462` `:442` `:426` `:437` `:436` `:392` `:307` `:457` `:458` | codex | 참 | 실측 |
| PLAN `:327` "외형에 실제로 돈을 낸다는 근거는 없다" | codex | 참 (줄 ±1, 실제 `:328`) | 실측 |
| Chessarama `R8:77` · Chess Ultra `N7:173` · Auto Chess `R1:18` 인용 | codex | 참 (줄번호는 리뷰 머리 기준, 본문은 +3~6) | 덤프 실측 |
| §12.2 "코인 지급 아님" vs §12.4 "레벨업" 코인 — 모순 | codex | **참 — 통합자 v0.5 오류** | 두 줄 실측 |

**사실 오류 0건.** 줄번호 ±1~6 4건(codex). 통합자 오류 2건(§12.4 모순 · §14.9 병합/인스턴싱).

## 각 모델이 틀리거나 약한 것 (지우지 않는다)
| 모델 | 내용 |
| :--- | :--- |
| agy | 일수 추정(14~18일 등) 은 본인도 "추정" 표기 — 채택은 "크다" 정도로만. "AI 가 승급 분기 없이 폰 상태로 평가" 는 `:2747` 함수 존재만 확인, 평가 로직은 안 읽음. |
| grok | 결함 2 제목에 깨진 글자("Mil다") — 출력 인코딩 사고, 내용 무관. "PEGI 3 선을 넘기 쉽다" 는 판단이지 사실 아님. |
| codex | 줄번호 4건 ±1~6. "출시 최소 조합 = §14 에서 0개" 는 가장 강한 판정 — 통합자가 수용. |
| Claude | §14 전체가 통합자 단독 안이었고 셋이 전부 KEEP. **§12.4 레벨업 코인 모순**을 v0.5 에서 스스로 만들었다. **§14.9 "메시 병합 또는 인스턴싱"** 은 스킨드 메시에 성립하지 않는 틀린 해법. §14.5 "0.3초 더 길다" 가 §14.4 "접촉 시각 불변" 과 자체 충돌. r1 에서 C 를 "채택" 이라 했으나 야생 모드 방패 능력과의 의미 충돌(codex) 을 못 봤다. 등급분류를 "재 보지 않았다" 고 적은 것은 맞았고 grok 이 채웠다. |

## 셋이 갈린 것과 끊는 법
| 쟁점 | agy | grok | codex | Claude | 결정 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A 캐스팅 | 보류 | 수정(내 화면만) | 보류(오인율 측정 전) | 수정 | Phase 6+ 후보 + 가독성 실험 조건 |
| B 무기 | 보류 | 보류(등급) | 보류 | 수정(코믹만) | **제외** — 등급 실험 전엔 어떤 무기도 안 됨(코믹도 Apple weapons) |
| C 방패 | 수정 | 보류 | 보류 | 채택 | **제외** — 의미 충돌 + 수요 부재 |
| D 훈장 | 수정(2D) | 보류 | 보류 | 수정 | 도감 "기록" 흡수 |
| K | 채택 | 채택 | 채택 | 아니오 | **채택** |
| 상대 화면 기본값(§10-15) | — | 표준 기본 | 표준 쉽게 | 꺼짐(v0.5) | **기본 켜짐** — chess.com 표준 원문 |

## 혼자만 찾은 것
- **agy**: 승급 하드코딩이 **기존 결함**(지금도 언더프로모션 불가) · 활은 돌진 안무와 불일치 · `stepKingFall` 공격자 훅 없음 · CI 7개 GLB 단언 · 스킨드 메시 병합 불가.
- **grok**: Play 한국 등급 = IARC 설문(재제출 의무) · Apple 4+ 엔 cartoon violence 자체가 없음 · chess.com 상대 세트는 시작 애니메이션뿐 · TFT 도 "별" 언어가 능력과 겹침.
- **codex**: §12.4 모순 · 진행축 4개 · 성장 보상이 판매 슬롯을 점유 · 방패의 모드별 의미 충돌 · 발견 체크의 연출 주인 · "우리" 와 도감 혼동 · 배우별 카운트 정의 부재.
- **Claude**: 포크 무기는 영어 농담(한국어 "양걸이").

## 파일
`BRIEF.md` · `r1-claude.md` · `r1-agy.md` · `r1-grok.md` · `r1-codex-answer.md`(원본 `r1-codex.md` 408KB 미복사) · `C_prompt.md` · `run-*.cmd`
