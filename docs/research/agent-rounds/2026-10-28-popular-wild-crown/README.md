# 설계 라운드 3 — 인기 게임 조사 (진화 · 카드 덱 · 진행 · 보상) (2026-10-28)

사용자: "진화?관련된? 카드덱? 스팀, 웹, 앱게임 등의 인기게임들의 특장점? 인기요소들? 자료조사하고 연구하고 반영해서 계획서 작성한거 맞아?" → 통합자 답 "아니다 — v0.4 §12 는 규제·기술 비용만 확인했고 인기 요소 조사는 없었다. 동물 등급 뱃지는 근거 없는 즉석 안, 카드 덱은 기획서에 없다." → "3차 라운드 진행". `tri-agent-review --design` 3차, **조사 라운드**. 결과는 `docs/PLAN.md` **v0.5** (§12.1~12.4·12.7 보강, §12.8 야생 모드 재료·§12.9 조사 근거 표 신설, §9 Phase 5a/5b/6, §10-14·15).

## 자료 — 통합자가 만든 덤프 (`dumps/`)
셋은 브라우저를 못 돌리므로(agy·codex) 통합자가 Steam 을 덤프했다. Steam 공식 `appreviews` JSON 은 302 로 막혀(2026-10-28 실측) **스토어 페이지(appdetails API + HTML 태그·집계) + 커뮤니티 허브 리뷰 HTML** 로 받았다(`scratchpad/steam_dump2.py`). 게임마다: 출시·가격·장르·카테고리·사용자 태그 20·리뷰 집계·설명 4,000자·도움됨 상위 리뷰·최근 리뷰 10.

| 영역 | 게임 (Steam appid) |
| :--- | :--- |
| [A] 체스 변형·오토체스 → agy | Chess Evolved Online 1064340 · Chessarama 1831830 · Shotgun King 1972440 · Pawnbarian 1142080 · 5D Chess 1349230 · Chess Ultra 518060 · Chessplosion 1571220 · Dota Underlords 1046930 · Auto Chess 1530300 |
| [C] 덱·수집·비동기 → codex | Slay the Spire 646570 · Slay the Spire 2 2868840 · Marvel Snap 1997040 · Balatro 2379780 · Backpack Battles 2427700 · Mahokenshi 1717640 |
| [G] 웹 → grok | Play 체스 앱(Chess Universe · chess.com · Really Bad Chess · Chess Royale) · TFT · Clash Royale · Pokémon TCG Pocket · lichess/chess.com · Sensor Tower 한국 1H2025 · 쿠키런: 킹덤 |

**덤프의 한계(실측)**: 영어 리뷰만. "도움됨 상위" 2페이지 요청(`p=2`)이 1페이지를 되돌려 **R11~R20 = R1~R10 중복** → 사실상 상위 10 + 최근 10. 도움됨 상위는 밈 리뷰("Finally, Chess 2") 비중이 크다. 세 모델 모두 이 한계를 브리핑에서 받았다.

## 방법 · 배정표

| 모델 | 실행 | 영역 | 결과 |
| :--- | :--- | :--- | :--- |
| **agy** | `agy --add-dir D:\chess --effort high --print-timeout 45m -p=…` (파일 읽기만) | [A] 덤프 9개 + PLAN §9·§10·§12 | 완주 14.7KB, 인용 20건 |
| **grok** (grok-4.6) | `--allow Read/Grep/Glob/WebFetch/WebSearch --deny Write/Edit/Bash --max-turns 80` | [G] 웹 E1~E8 | 완주 21KB — 중간에 자체 컨텍스트 압축이 일어나 **같은 답을 두 번** 출력(긴 판·짧은 판, 내용 동일). URL 16개 |
| **codex** (`gpt-6-sol`, `~/.codex/config.toml`) | `codex exec -s read-only - < C_prompt.md` ("읽기 전용 셸 허용" 머리에 명시) | [C] 덤프 6개 + PLAN | 완주 92줄 (stdout 에 답이 두 번 에코됨 → `r1-codex-answer.md` 는 한 벌). EXIT 줄 없이 프로세스 잔류 — 마지막 `^codex$` 뒤를 추출 |
| Claude (통합자) | `r1-claude.md` 셋 읽기 전 작성 | 전체 · lichess DB/features · chess.com · Play/Supercell/Kotaku/Ars/Sensor Tower 원문 재확인 | — |

**통합자 작업 가정** "진화는 랭크에서 외형·뱃지만, 능력 변화는 야생 모드만. 카드 덱은 랭크에 자리 없음" → **셋 다 유지**. 단 codex 가 "덱의 뜻을 갈라라 — 외형만 묶은 착용 프리셋은 랭크에도 들어간다" 로 정밀화했고 채택(§12.3 "외형 덱").

## 사실 대조 (전부 덤프 `grep` 또는 원문 URL 재열람)

| 주장 | 낸 이 | 판정 | 근거 |
| :--- | :--- | :--- | :--- |
| 덤프 인용 20건 (CEO·Chessarama·Shotgun King·Pawnbarian·5D·Chess Ultra·Chessplosion·Underlords·Auto Chess 스토어 설명·리뷰) | agy | **전부 참** | `dumps/A-*.md` 글자 일치 |
| "Chess Ultra R4·R7·R10 이 AFK 인질극" | agy | **부정확** — R4·R7 참, **R10 은 접속 불량 리뷰** | `A-chess-ultra.md:74` "Connectivity: After only 17 hours…" |
| 덤프 인용 20건 (StS·StS2·Balatro·Snap·Backpack Battles·Mahokenshi) | codex | **전부 참** (Backpack R5 는 대소문자 "It's/it's" 차이만) | `dumps/C-*.md` |
| Mahokenshi 는 Single-player — 비동기 PvP 사례 아님 | codex | 참 | `C-mahokenshi.md` 카테고리 |
| Chess Universe Play 설명 "keep it as a pet" · "120 island opponents" · "50 exclusive premium items" · 리뷰 "1-2 ads" "sudden ads pop up" | grok | 참 | Play HTML `curl` 대조 |
| Chess Royale "dozens of unique boards, figures and avatars" · "Way too many ads" / Really Bad Chess "totally random pieces" · "A single in-app purchase unlocks Versus Mode" / chess.com Play "20+ board themes and 3D pieces" · "100M+" · "#2 top grossing board" | grok | 참 | Play HTML |
| chess.com 도움말: Basic 테마 변경 · Gold "NO ADS" "UNLIMITED puzzles" | grok | 참 | support.chess.com 8562418 |
| TFT "earn rewards such as Little Legend eggs and emotes just for playing" · "unlock cosmetic content" · Pass+ "arenas, exclusive Little Legends, and Star Shards" | grok | 참 | TFT Gizmos & Gadgets Pass 공지 |
| Supercell "Unlock new powers for cards they already own." · "6 Evolution Shards" | grok | 참 (**문장 일부** — 원문 "Card Evolution enables players to unlock new powers for cards they already own.") 2023-06-18 | supercell.com |
| Sportskeeda "around $100" · "pay-to-win" · "level up their cards faster" | grok | 참 | HTML `curl` (WebFetch 는 405) |
| Kotaku TCG Pocket "twelve different in-game currencies" · "selling gambling to children" · "750 Poké Gold a day" · "$120 per day" · 벨기에 미출시 | grok | 참, 2024-11-06 | kotaku.com |
| lichess features 테마 무료·Patron 동일 "All features are free for everybody, forever!" · Patron "bragging rights with cool new Patron wings" | grok·통합자 | 참 | lichess.org/features · /patron |
| 마니아타임즈 쿠키런 각성 "각성 영혼석을 모아 보다 강력하게 성장" · "최초 각성 시 쿠키의 외형이 변화" | grok | 참, 2024-07-01 | maniareport.com |
| Gametrodon CEO "if they've upgraded their pieces, they have access to options and moves you don't" · "larger supply pool" · "Or spending real money." | grok | 참 (기사 날짜 없음) | gametrodon.com |
| Sensor Tower 한국 1H2025 약 24억 달러 · 1위 리니지M · 2위 WOS 5월 약 2,600만 달러 · 8위 로블록스 기프트 카드 · 쿠키런 매출 성장 10위 "약 3년 만에 월매출 최고치" | grok | 참 | sensortower.com/ko |
| Ars Technica "$9.65 billion" Fortnite 2018~2019 | grok | 참 | HTML `curl` (WebFetch 차단) |
| Kotaku Fortnite "Everything that can be bought is cosmetic" | grok | **미확인** — URL 없음 | — |
| IGN TCG Pocket "$200 million in its first month" · "$1,500 just to complete the first set" | grok | **미확인** — URL 없음 | — |
| lichess 퍼즐 DB CC0, 6,157,341개 | Claude (r1 가정 "CC0 로 기억") | 참 | database.lichess.org "Database exports are released under the Creative Commons CC0 license." |

**사실 오류 0건 · 부정확 1건(agy R10) · 미확인 2건(grok, 기획서에 표기)**.

## 각 모델이 틀리거나 약한 것 (지우지 않는다)
| 모델 | 내용 |
| :--- | :--- |
| agy | R10 오인용(위). 야생 모드 안이 가장 화려하지만("3합 승급·야생 돌연변이·전술 기동 카드 덱") 전부 별도 규칙 엔진이 필요하다고 스스로 적었다 — 재료로만 채택. |
| grok | 미확인 2건. 답을 두 번 출력(압축). 표본은 Play 리뷰 몇 줄 — 광고 불만이 "반복" 이라는 것은 2개 앱의 리뷰 4줄 근거. |
| codex | "외형 유료 구매 전환 근거는 없다" 고 스스로 한정 — 맞고, 기획서 §12.7⑥ 로 올렸다. 비동기 PvP 를 묻는 브리핑 자체가 Mahokenshi 를 잘못 넣었다(통합자 오류). |
| Claude | 브리핑에 Mahokenshi 를 "비동기 PvP" 로 넣음(싱글). 1차·2차에서 인기 요소 조사를 아예 빼먹은 것이 이 라운드의 원인. 동물 뱃지 단계를 근거 없이 썼다 → 기획서에 "미검증" 표기. 일일 퍼즐은 통합자 혼자 제안(셋은 질문받지 않음) → §10-14 로 사용자 결정에 올림. |

## 셋이 갈린 것과 끊는 법
| 쟁점 | agy | grok | codex | 결정 |
| :--- | :--- | :--- | :--- | :--- |
| "카드 덱" 을 랭크에 | 치장 프리셋 덱 | 없음 | 외형 프리셋만 가능, 능력 덱은 야생 | **외형 프리셋 = 랭크 OK, 능력 = 야생** (agy·codex 같은 말) |
| 진화 | 숙련도 외형 진화 | 뱃지·펫·보드 룩 | XP 이정표 해금, 뱃지는 실력 표시와 분리 | **"쓰면 자란다" 외형 단계 먼저**, 뱃지는 테스터 후 |
| 우선순위 1 | AFK 타임아웃 | 능력·팩 금지 | 랭크 공정성 | 셋이 같은 방향 — §12.1 타임아웃은 5a 완료 조건으로 |

## 혼자만 찾은 것
- **agy**: AFK 인질극(Chess Ultra) · 패턴 인지 방해(Chessarama) · 보험 카드·5중 통화(Auto Chess) · "Chess 2 는 한 방 콘셉트".
- **grok**: Play 체스 앱 불만의 핵은 **광고** · 테마는 무료가 기본 · 쿠키런 각성 = 변신 연출 · TCG Pocket 벨기에 미출시 · 한국 상위권에 수집 체스 없음.
- **codex**: §12.2 "XP → 코인 지급" 과 §12.4 "AI/로컬은 XP 만" 의 **문장 충돌** · 비동기 PvP 는 "서버 없는 대전" 이 아니다 · 외형 인기 ≠ 구매 전환 · 덱의 뜻 구분.
- **Claude**: lichess 퍼즐 DB CC0 → 서버 없는 일일 퍼즐 · Steam `appreviews` API 폐쇄 우회.

## 파일
`BRIEF.md` · `r1-claude.md` · `r1-agy.md` · `r1-grok.md` · `r1-codex-answer.md`(원본 `r1-codex.md` 263KB 는 stdin 에코 포함, 미복사) · `C_prompt.md` · `run-*.cmd` · `dumps/*.md`(15개, 218KB — 인용 대조용 원자료)
