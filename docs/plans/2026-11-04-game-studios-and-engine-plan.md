# 프로젝트 관리 개선과 고퀄리티 전환 계획서 — game-studios · 엔진 선택 · 「딸깍」을 넘는 길

작성일 2026-11-04. 대상 저장소 `D:\chess`(alarmpet/chess), 브랜치 `feat/phase-0a-pack-manifest`, PR https://github.com/alarmpet/chess/pull/4.

- 사실은 이 저장소(`git`·파일·테스트·빌드 실측)와 GitHub API(`gh api`)·공식 문서에서 확인한 것만 적었다. 재 보지 않은 것은 「재 보지 않았다」로 표시했다.
- 다운로드한 저장소는 없다. 외부 저장소는 전부 API 로 읽기만 했다.
- 설치·가입·비용이 드는 일은 하지 않았고 §5 「사용자 확인 목록」에 모았다.

## 0. 한 줄 답

| 질문 | 답 |
| :--- | :--- |
| 프로젝트 관리가 왜 흐트러져 보이나 | 계획서 12편(85KB 기획서 + 11편)과 라운드 15회가 있지만, **「지금 무엇이 열려 있고 누가 닫는가」를 한 곳에서 보여 주는 장치가 없다.** 진척은 각 계획서의 산문 「결과」 절에만 있고, 체크 표시는 0개, 사람 플레이 테스트는 0회, PR 은 52커밋·562파일 한 덩어리다 (§1) |
| game-studios 를 쓰나 | **통째로는 쓰지 않는다.** Donchitos 템플릿(MIT, ★34,892)은 Godot·Unity·Unreal 전제의 「복제해서 시작하는 틀」이고 웹 엔진 전문가가 없다. 대신 **스토리·게이트·플레이테스트 보고 스킬 몇 개를 골라 `.claude/` 에 이식**하고, 브라우저 3D 전용인 OpenAI `game-studio` 플러그인(MIT)의 three.js·GLB 파이프라인 스킬을 참고한다 (§2) |
| 엔진을 바꾸나 | **지금 그대로(three r170 + React 19 + Vite) 유지.** 세 엔진 모두 웹이 1급 목표가 아니거나(Unreal 은 공식 웹 빌드 없음) 웹 빌드가 지금보다 크다. 다만 「부분 도입」으로 Blender 를 에디터 대신 쓰고, 성능 예산을 못 지키면 그때 재검토한다 (§3) |
| 고퀄리티로 가는 길 | 아트는 「TRELLIS 로 뽑은 메시 + 파이썬 절차 키프레임」에서 **Blender 손질·수작업 애니메이션·LOD·텍스처 예산**으로, 게임은 「기능 추가」에서 **사람 시험 → 수치 → 수정** 고리로, 품질은 **CI 에 성능·에셋 게이트** 추가로 옮긴다. 6단계 로드맵, 단계마다 완료 기준과 검사 방법 (§4) |

---

## 1. 진단 — 지금 관리가 흐트러져 보이는 이유 (저장소 근거)

### 1.1 실측

| 항목 | 값 | 어디서 |
| :--- | ---: | :--- |
| 기획서 `docs/PLAN.md` | 85KB · v0.7 (2026-10-28 날짜) · 14개 절 · 로드맵 Phase 0a~6 | 파일 |
| 보조 계획서 `docs/plans/` | 11편 (10-30 ~ 11-03), 합계 약 140KB | `ls` |
| 세 모델 라운드 `docs/research/agent-rounds/` | 15회 (10-27 ~ 11-04) | `ls` |
| 체크 표시 `[ ]`/`[x]` | **0 / 0** (12편 전부) | `grep` |
| 「아직·남은 것·재지 않·못 봤」 표시 | 11편에 30건 | `grep` |
| 「사람 시험 A」를 전제로 둔 계획서 | 4편, **실시 0회** (모두 「사람이 해 본 측정은 아직 없다」) | `grep` |
| 현재 브랜치 ↔ `origin/main` | 52커밋 앞, PR #4 하나로 **+53,399 / −16,769 줄 · 562파일** | `gh pr view` |
| 로컬 `main` | `origin/main` 보다 21커밋 뒤(다른 PC 작업, §10-18 결정으로 `archive/other-pc-games` 에 보관) | `git branch -vv` |
| 미정리 브랜치 | `fix/lockfile-name`·`fix/typecheck-css-import` (10-27, 각 1커밋, 현재 브랜치에 없음) · `docs/wild-crown-plan`(전부 포함됨) | `git rev-list` |
| 하루 커밋 수 | 1·5·5·7·7·2·4·13·6 (10-27 → 11-04) | `git log` |
| 테스트 | 135개 통과, **147초** (무작위 대국 시뮬레이션 포함) | `npm test` |
| CI | `npm test` + `npm run build` 만. 타입 검사는 기존 오류 2건 때문에 빠져 있음 | `.github/workflows/ci.yml`, PLAN §13 |
| 저장소 안 `.claude/` | `launch.json` 하나. `CLAUDE.md` 없음 | `find` |
| 소스 | 15개 TS/TSX + JS, 14,891줄. 그중 `src/wizardChessEngine.js` **6,309줄** 단일 파일 | `wc` |
| 빌드 | JS 1,283KB(gzip 370KB) 한 덩어리 · CSS 34KB · `dist/` 129MB(모델 127MB) | `npm run build`, `du` |
| 모델 | GLB 125개 · 112,768KB. `legend` 팩 85개(종 × 단계 s2~s4 × 진영 w/b 변형이 각각 파일) | `find` |
| 성능 | 드로우콜 190, Intel UHD 35fps, 측정 잡음 ±3fps 게이트 **미통과** | premium-feel 계획서 §13·§14 |

### 1.2 해석

1. **계획은 많고 「닫힘」이 없다.** 12편의 계획서는 각각 「만드는 순서」 표를 갖고 있고 진척은 아래쪽 「n단계 결과」 산문에 적힌다. 어느 계획의 어느 줄이 열려 있는지 알려면 12편을 다 읽어야 한다. 체크 표시가 0개라는 것은 도구 문제가 아니라 **진척을 기록하는 자리가 합의되지 않았다**는 뜻이다.
2. **기획서가 뒤처진다.** `PLAN.md` 는 v0.7(10-28) 이고, 그 뒤 7일 동안 계획서 11편·커밋 44개가 더 쌓였다. 로드맵 §9 는 Phase 0a~6 이지만 실제 작업은 마을·섬·카드·욕망·정원 계획서 쪽으로 갔다. 두 축(Phase 로드맵 ↔ 계획서 단계표)이 서로를 가리키지 않는다.
3. **검증 고리가 「사람」 앞에서 멈춰 있다.** 네 계획서가 「사람 시험 A」를 다음 관문으로 두고 D1~D7, G1~G4 를 그 앞까지 밀어 왔다. 봇 시뮬레이션·브라우저 확인은 꾸준히 했지만, 재미·중독성은 봇으로 재지 못한다. 관문이 열리지 않으니 기능이 관문 앞에 쌓인다.
4. **PR 하나가 프로젝트 전부다.** 562파일 PR 은 리뷰할 수 없고, 되돌릴 수도 없다. Phase 0a 이름의 브랜치가 섬 매대까지 담고 있다.
5. **품질 게이트가 느슨하다.** CI 는 테스트·빌드만 본다. 타입 검사는 알려진 오류 2건 때문에 꺼져 있고, 성능(드로우콜·fps)·에셋(tri·텍스처·본 수) 게이트는 기획서 §7 에 적혀 있지만 자동화되지 않았다. 테스트 147초는 매 커밋에 돌리기엔 길다.
6. **반복 작업 지식이 저장소 밖에 있다.** 캐릭터 절차는 `~/.claude/skills/chess-character-pipeline`, 규칙은 사용자 전역 설정에 있고, 저장소에는 `CLAUDE.md` 가 없다. 다른 PC·다른 세션이 같은 규칙을 모른다(§10-18 의 「다른 PC 작업이 main 에 섞여 온 사건」이 그 결과다).

이 여섯 가지 중 game-studios 가 직접 돕는 것은 1·4·5 다. 2·3·6 은 도구가 아니라 **운영 규칙**이며 §2.5 에서 함께 정한다.

---

## 2. game-studios 도입

### 2.1 「game-studios」가 무엇인가 — GitHub 확인 (2026-11-04, `gh api`)

이름으로 검색하면 한 원본과 여러 이식판이 나온다. 전부 `gh api repos/<이름>` 으로 확인했다.

| 저장소 | 정체 | 라이선스 | ★ | 마지막 푸시 | 비고 |
| :--- | :--- | :--- | ---: | :--- | :--- |
| **Donchitos/Claude-Code-Game-Studios** | Claude Code 용 「게임 스튜디오」 **템플릿**. 에이전트 49 · 스킬 74(설명문은 72) · 훅 15 · 규칙 14 · 문서 템플릿 62 | **MIT** (LICENSE 원문 확인) | 34,892 (포크 4,618) | 2026-10-19 (v1.2.0) | 2026-02-12 생성, 열린 이슈 93. 플러그인 매니페스트(`.claude-plugin/`) **없음 → 404**. 「clone 해서 시작」하는 틀 |
| HunLuanZhiZhu/Game-Studios-Plugin | 위를 **단일 Claude Code 플러그인**으로 묶은 것 | MIT | 2 | 2026-10-06 | 플러그인 형태가 필요하면 후보. 내용은 읽지 않았다 |
| striderZA/OpenCodeGameStudios | 어느 코딩 에이전트에서나 쓰는 변형 | MIT | 111 | 2026-11-03 | 내용은 읽지 않았다 |
| pixel-cellar/Claude-Code-Game-Studios | 중국어 현지화판 | MIT | 377 | 2026-03-30 | — |
| homie-rocks/homie | 「Claude·Codex 를 게임 스튜디오로」, Cloudflare 멀티플레이 웹 게임 | Apache-2.0 | 7 | 2026-10-31 | 내용은 읽지 않았다 |
| **openai/plugins → `plugins/game-studio`** | OpenAI Codex 용 **브라우저 게임** 플러그인. 스킬 9개: `web-game-foundations` · `phaser-2d-game` · `three-webgl-game` · `react-three-fiber-game` · `web-3d-asset-pipeline` · `sprite-pipeline` · `game-ui-frontend` · `game-playtest` · `game-studio`(라우터) | `plugin.json` 에 `"license": "MIT"`. **저장소 루트 LICENSE 는 GitHub 가 감지하지 못함**(`/license` 404) | 7,742 | 2026-11-03 | 우리 스택(three + Vite + GLB)과 가장 가깝다 |
| joemonster/claude-game-studio | 위 OpenAI 플러그인을 Claude Code 마켓플레이스 형식으로 재포장 | MIT | 0 | 2026-06-04 | 설치 명령 `/plugin marketplace add joemonster/claude-game-studio` → `/plugin install game-studio@claude-game-studio`. 2026-06 이후 갱신 없음 |

라이선스 판정: 두 후보 모두 MIT 다. 사용자 규칙(GPL/AGPL/CC-BY-NC 복사 금지)에 걸리지 않는다. 다만 MIT 도 **저작권 고지 유지**가 조건이므로, 스킬·에이전트 파일을 이식하면 파일 머리말에 출처와 MIT 고지를 남긴다. `openai/plugins` 는 루트 LICENSE 가 감지되지 않으므로 플러그인 폴더의 `plugin.json` 선언만 근거다 — 이식 전에 폴더 안 LICENSE 파일 유무를 한 번 더 본다(§6).

### 2.2 Donchitos 템플릿의 구조 (README·`CLAUDE.md`·`project.yaml`·`.claude/` 목록 직접 확인)

- **계층**: 디렉터 3(creative·technical·producer) → 리드 8 → 전문가 38. 엔진 전문가는 **Godot·Unity·Unreal 만** 있다(`godot-*` 5, `unity-*` 5, `ue-*` 4 + 3 리드). **three.js·웹 전문가는 없다.**
- **스킬 74개**: `/start` `/adopt` `/brainstorm` `/design-system` `/create-epics` `/create-stories` `/dev-story` `/story-done` `/sprint-plan` `/sprint-status` `/gate-check` `/perf-profile` `/playtest-report` `/asset-spec` `/asset-audit` `/art-bible` `/qa-plan` `/smoke-check` `/regression-suite` `/release-checklist` 등.
- **훅 15개**(bash): 커밋 전 검사(하드코딩 값·TODO 형식·JSON), 푸시 보호, **40KB 넘는 설계 문서의 전체 읽기 거부**(`validate-read.sh`), 쓰기 경고, 에셋 이름 검사, 세션 시작·종료 기록, Windows 토스트 알림 등.
- **규칙 14개**: 경로별 코딩 표준 (`src/gameplay/**` 데이터 주도 값, `src/ui/**` 상태 소유 금지, `tests/**` 이름 규칙 …).
- **설정 `project.yaml`**: `modes.rigor` = `minimal`(기본) / `standard` / `full`. README 의 실측: 같은 브리프로 `standard` 는 코드 첫 줄 전에 문서 30개를 썼고, 두 블라인드 평가자와 사람 플레이테스트에서 **꼴찌**였다. 그래서 기본값이 `minimal` 이다.
- **협업 규약 `CLAUDE.md`**: 「질문 → 선택지 → 결정 → 초안 → 승인」. 에이전트는 **쓰기 전에 매번 물어야** 한다(`active.md` 예외). 커밋은 지시 없이 하지 않는다.
- **기대 디렉터리**: `design/`(GDD) · `production/`(스프린트·세션 상태) · `tests/` · `assets/` · `prototypes/` · `studio-tests/`. 코드 루트는 엔진별(`src/` 는 Godot 행).
- **요구 사항**: Python 3(설정 읽기), Bash(Windows 는 Git Bash), jq 권장. 세션은 **반드시 저장소 루트에서** 시작해야 훅·거부 규칙이 든다.
- **기존 프로젝트용 `/adopt`**: 기존 산출물이 템플릿 형식과 맞는지 감사하고 `docs/adoption-plan-[날짜].md` 를 쓴다. 「GDD·ADR·스토리를 다시 생성하지 않는다」가 원칙.

### 2.3 우리 저장소와 맞물리는 곳·어긋나는 곳

| 템플릿 | 우리 | 판정 |
| :--- | :--- | :--- |
| `design/gdd/*.md` 필수 절 | `docs/PLAN.md` 85KB 한 파일 + `docs/plans/*.md` | **어긋남.** 훅 `validate-read.sh` 는 40KB 넘는 설계 문서 전체 읽기를 거부한다 → `PLAN.md` 는 바로 걸린다. 분할이 전제 |
| `production/sprints/`·스토리 파일 | 각 계획서의 「만드는 순서」 표 | **여기가 가장 큰 이득.** 표의 한 줄 = 스토리 하나로 옮기면 「열린 것」이 한 곳에 모인다 |
| `tests/` 루트 | `test/*.test.mjs`(node --test) | 경로만 다름. 규칙 파일 경로를 고치면 됨 |
| `assets/` | `public/packs/`, `public/assets/glb` | 경로만 다름 |
| `src/gameplay/` `src/ui/` 규칙 | `src/rules/` `src/village/` `src/cards/` `src/fx/` + 6,309줄 `wizardChessEngine.js` | 규칙 경로를 우리 구조로 다시 매핑. 단일 파일 엔진에는 「데이터 주도 값」 규칙이 바로 걸린다(상수가 많다) — 좋은 압박이지만 처음엔 경고로 |
| 엔진 전문가 | three.js | **없음.** OpenAI `three-webgl-game`·`web-3d-asset-pipeline` 스킬로 채운다 |
| 「쓰기 전 매번 질문」 규약 | 사용자는 자동 모드로 길게 돌리는 편(세션당 커밋 13개까지) | **충돌.** `modes.automation` 을 `autonomous` 로 두거나 규약을 뺀다 |
| 훅은 bash + Python 3 | Windows 11, Git Bash·Python 있음(캐릭터 도구가 Python) | 돌아간다. 단 훅이 Bash·PowerShell·Read·Write 호출마다 돈다 → 체감 지연은 재 보지 않았다 |
| `/playtest-report` `/perf-profile` `/gate-check` | 플레이테스트 계획서(10-31, 봇 9판), premium-feel 의 수동 측정 | **맞물림.** 우리 「사람 시험 A」 양식이 없다 → 이 템플릿을 그대로 쓸 수 있다 |

### 2.4 도입 방식 — 세 가지 중 「선택 이식」

| 방식 | 내용 | 비용 | 판정 |
| :--- | :--- | :--- | :--- |
| A. 통째 복제 | 템플릿을 clone 하고 우리 코드를 그 안으로 옮김 | 디렉터리 전면 이동, 85KB 기획서 분할, 엔진 전문가 공백, 훅 지연 | **아니오.** 우리에겐 돌아가는 게임과 12편의 설계가 이미 있다. 템플릿 자체가 「표준 모드는 문서 30개를 만들고 꼴찌였다」고 말한다 |
| B. 플러그인 설치(HunLuanZhiZhu 또는 joemonster) | `/plugin install` 한 줄 | 설치는 쉬우나 74개 스킬·49 에이전트가 한꺼번에 들어와 `/` 목록이 넘침. 둘 다 ★0~2, 갱신 멈춤 | OpenAI 플러그인은 **읽기용**으로만. 설치는 사용자 확인 뒤 |
| **C. 선택 이식** | 아래 목록의 스킬·훅·템플릿 7개만 우리 `.claude/` 에 복사하고 경로·언어를 고침 | 하루 안 | **추천** |

**이식 목록(초안)** — 각 파일 머리에 「출처: Donchitos/Claude-Code-Game-Studios v1.2.0, MIT」를 적는다.

| 가져올 것 | 어디에 | 고칠 것 |
| :--- | :--- | :--- |
| `skills/create-stories` · `dev-story` · `story-done` 의 **스토리 형식**만 | `.claude/skills/story/` + `docs/stories/` | 한국어, 스토리 = 계획서 「만드는 순서」 한 줄. 완료 조건에 「검사 방법」 칸 추가 |
| `skills/sprint-status` | `.claude/skills/status/` | 열린 스토리를 계획서별로 모아 한 표로 |
| `skills/playtest-report` + 템플릿 | `.claude/skills/playtest/` · `docs/playtests/` | 「사람 시험 A」 질문(말 구분·판 길이·갖고 싶다 ♡·산 것/번 것) 을 양식에 박음 |
| `skills/perf-profile` · `gate-check` | `.claude/skills/gate/` | 측정 대상을 `renderer.info.render.calls`·fps 중앙값·GLB 크기·tri 수로 교체 |
| `hooks/validate-commit.sh` 의 **커밋 메시지·JSON 검사만** | `.claude/hooks/` | 하드코딩 검사는 처음엔 경고. `pack.json` 검사기와 중복되면 빼기 |
| `rules/test-standards.md` · `data-files.md` | `.claude/rules/` | 경로 `test/**`, `public/packs/**/pack.json` |
| OpenAI `three-webgl-game` · `web-3d-asset-pipeline` 의 **규칙 절** | `docs/engineering/web3d-rules.md` | 「시뮬레이션 상태는 three 객체 밖에」「UI 는 DOM」「glTF Transform·meshopt·KTX2·LOD·텍스처 예산」을 우리 말로. 코드가 아니라 체크리스트 |

가져오지 않는 것: 49 에이전트 계층(우리는 세 모델 라운드 `tri-agent-review` 가 그 역할), GDD 템플릿 62개, 엔진 전문가, 「쓰기 전 질문」 규약, 상태줄.

### 2.5 설치·연결 단계 (실제 설치는 하지 않았다 — 각 단계의 ☐ 는 사용자 확인)

1. **진단 고정.** 이 문서 §1.1 표를 `docs/STATUS.md` 로 옮기고, 열린 항목을 계획서별로 한 줄씩 적는다. 도구 없이도 되는 일이며 오늘 할 수 있다. — **완료(2026-11-04):** [STATUS.md](../STATUS.md). 12편에서 미완 단계 54 · 남은 확인 74 · 미결 결정 20 을 추출했고, 계획서 11편 머리에 포인터를 달았다. 장부 어긋남 5건을 고쳤다(STATUS §4).
2. **`CLAUDE.md` 신설(저장소 안).** 사용자 전역 규칙 중 이 프로젝트 몫(한국어 응답, 커밋은 지시 때만, 라이선스 금지 목록, 받은 저장소 코드 실행 금지, D: 캐시, 캐릭터 절차 스킬 위치)을 적는다. 다른 PC 세션도 같은 규칙을 읽게 된다. — **초안 작성(2026-11-04):** [CLAUDE.md](../../CLAUDE.md). 내용 확정은 §5-4.
3. ☐ **읽기용 설치.** `/plugin marketplace add joemonster/claude-game-studio` 로 OpenAI 스킬 9개를 설치해 읽거나, 설치 없이 `gh api` 로 본다(이 문서는 후자로 했다). 설치하면 `/` 목록에 `game-studio:*` 9개가 늘어난다.
4. ☐ **선택 이식.** §2.4 표의 7건을 복사·번역·경로 수정. 커밋은 「docs+.claude 만」으로 따로.
5. **스토리 전환.** 12편 계획서의 「만드는 순서」 중 열린 줄만 `docs/stories/` 로 옮기고, 계획서에는 「스토리 번호」만 남긴다. `PLAN.md` §9 로드맵에 Phase ↔ 스토리 묶음 대응표를 한 줄씩 적어 두 축을 잇는다.
6. ☐ **훅 켜기.** 커밋 메시지·JSON 검사 훅을 `.claude/settings.json` 에 등록. Git Bash 경로가 맞는지 Windows 에서 한 번 돌려 본다.
7. **PR 쪼개기 규칙.** 이후 브랜치는 「스토리 1~3개 = PR 하나」. PR #4 는 되돌려 쪼갤 수 없으니 그대로 병합하되(사용자 결정), 다음부터 적용한다.
8. **브랜치 정리.** ☐ `fix/lockfile-name`·`fix/typecheck-css-import` 의 1커밋씩이 지금도 필요한지 보고 가져오거나 지운다. ☐ 로컬 `main` 을 `origin/main` 에 맞춘다(§10-18 의 「다른 PC 작업은 안 합친다」 결정은 그대로).

---

## 3. 왜 Godot·Unity·Unreal 을 쓰지 않는가

### 3.1 현재 스택 (저장소 확인)

| 항목 | 값 |
| :--- | :--- |
| 렌더 | `three` **0.170.0** (`package-lock.json`), WebGL. 후처리는 자체 코드 |
| UI | `react` 19.0.1, `react-dom` 19, DOM 오버레이 |
| 빌드 | `vite` 8.3.5, `typescript` 7.0.2. 빌드 28초, JS 1,283KB(gzip 370KB) |
| 규칙 | `chess.js` 1.4.0 (`src/rules/referee.js`), 자체 AI (`src/rules/ai.js`) |
| 저장 | `localStorage` (`wildcrown.resume.v1`, `wildcrown.pouch.v1`, 마을·카드·설정 스토어 10개 파일) |
| 에셋 | GLB 125개, 112MB. 로컬 TRELLIS → `tools/keepuv_low.py`(16k tri·1024 텍스처) → `tools/biped_rig.py` → `tools/legend_add_clips.py`(절차 키프레임) |
| 배포 | 정적 파일. 서버 없음(기획서 §12.1 은 Supabase Realtime 을 Phase 5a 로 둠) |
| 기타 의존성 | `@google/genai` 2.4.0 — 어디서 쓰는지 **재 보지 않았다** |

### 3.2 세 엔진 비교 (공식 문서 2026-11-04 확인)

| 축 | 지금(three + React) | Godot 4 | Unity 6 | Unreal 5 |
| :--- | :--- | :--- | :--- | :--- |
| 웹 빌드 | 가능. JS 1.3MB + 모델 | 가능. **WebGL 2 + WebAssembly 필수**, 「Compatibility 렌더러만, Forward+/Mobile 은 웹 미지원」, 4.3부터 단일 스레드 기본(멀티 스레드는 COOP/COEP 헤더 필요). **C# 프로젝트는 Godot 4 웹 내보내기 불가.** `.wasm`·`.pck` 는 「보통 크다」(절대 수치는 문서에 없음) | 가능. 데스크톱 Chrome·Firefox·Safari·Edge. 모바일은 「일부 모바일 브라우저 지원」(iOS Safari 15+, Android Chrome 58+) | **공식 지원 플랫폼 목록에 웹/HTML5 없음**(Windows·iOS·Android·XR·Pixel Streaming). HTML5 는 커뮤니티 확장, 4.24.3 태그에 고정 |
| 렌더·셰이더 | 손으로 짬. 톤매핑·물·안개를 premium-feel 계획서로 만든 상태 | 셰이더 언어·머티리얼 에디터·GI 내장 | URP·셰이더 그래프·포스트 프로세싱 내장 | 가장 강함(Lumen·Nanite). 웹에는 못 가져감 |
| 애니메이션 | three `AnimationMixer`. 클립은 파이썬 절차 생성 | AnimationTree·블렌드·IK | Animator·Timeline·IK | Control Rig·시퀀서 |
| 물리 | 없음(체스는 필요 적음). OpenAI 스킬은 Rapier 권장 | Jolt/Godot Physics 내장 | PhysX 내장 | Chaos 내장 |
| 에디터 | 없음. 장면은 코드 + Blender | 있음 | 있음 | 있음 |
| 에셋 파이프라인 | GLB 직접. glTF Transform·KTX2 미사용 | glTF 임포트, 자체 압축 | FBX 중심, glTF 는 패키지 | FBX·USD 중심 |
| 모바일·스토어 | PWA → Android 는 TWA(Digital Asset Links 로 사이트 소유 증명). iOS 는 App Store 4.2 「재포장한 웹사이트 이상이어야」·4.2.2 「웹 클리핑 금지」 심사 위험 | Android·iOS 네이티브 내보내기 | Android·iOS 네이티브 | Android·iOS 네이티브 |
| 멀티플레이 | 직접 구현(Supabase 계획) | 고수준 멀티플레이어 API | Netcode for GameObjects | 복제 내장 |
| 라이선스 | MIT 들(three·React·Vite·chess.js — 각 LICENSE 는 재 보지 않았다) | **MIT**(고지 포함 의무, 공식 라이선스 페이지) | Personal 무료(매출·투자 20만 달러 미만), Pro 연 2,310달러. **런타임 요금은 취소됨**(공식 블로그) | 공식 페이지가 403 으로 열리지 않아 **재 보지 않았다**(일반적으로 알려진 「제품당 총매출 100만 달러 초과분의 5%」는 미확인) |
| 학습 | 이미 안다 | GDScript/C# 새로 | C# 새로 | C++/블루프린트 새로 |
| 기존 코드 이전 | 0 | 14,891줄 + 135 테스트 전부 다시. `chess.js` 는 JS 라 못 가져감(규칙 재구현 또는 Godot 의 JS 브리지 — 재 보지 않았다) | 같음 | 같음 |
| 로컬 TRELLIS GLB | 그대로 | 임포트 가능 | 패키지 필요 | 변환 필요 |

### 3.3 세 선택지와 조건

| 선택지 | 조건 | 결과 |
| :--- | :--- | :--- |
| **① 지금 그대로** | 브라우저 배포가 1급 목표이고, 체스에 물리·오픈월드가 없고, 모델은 이미 GLB | 비용 0. 부족한 것은 「에디터·애니메이션 도구」인데 이것은 Blender 가 채운다 |
| ② 부분 도입 | Blender 를 장면·애니메이션 에디터로 쓰고 GLB 로 내보냄(엔진 교체 없음). 필요하면 `postprocessing`·glTF Transform·KTX2 등 웹 생태계 라이브러리 추가 | §4 로드맵이 이것이다 |
| ③ 전면 이전 | (a) 스토어 네이티브 출시가 웹보다 중요해지거나 (b) 성능 예산(모바일 30fps·드로우콜 ≤ 100)을 three 로 못 맞추거나 (c) 멀티플레이·GI 가 핵심이 될 때 | 그때 **Godot** 이 1순위(MIT, GLB 임포트, 웹 내보내기도 가능). Unity 는 웹이 되지만 라이선스·FBX 중심, Unreal 은 웹이 없다 |

**추천: ① + ②.** 근거는 세 가지다. 첫째, 우리 게임은 체스판 하나·기물 32개·섬 하나로 장면이 작아 엔진의 강점(월드·물리·GI)이 쓰이지 않는다. 둘째, 세 엔진 중 웹을 1급으로 지원하는 것은 없고 Unreal 은 공식 웹 빌드가 없다. 셋째, 지금 「싸 보이는」 원인은 premium-feel 계획서가 이미 진단했듯 엔진이 아니라 **시각 언어 혼재·절차 애니메이션·측정 부재**고, 이것은 Blender 와 게이트로 고친다. 재검토 시점은 ③의 조건 (a)(b)(c) 중 하나가 사실로 확인될 때로 정해 둔다.

---

## 4. 「딸깍 바이브코딩」이 아닌 고퀄리티 게임으로

### 4.1 지금 어디까지 돼 있나

**아트 파이프라인** (`tools/`, `chess-character-pipeline` 스킬)
- 콘셉트(Flow 또는 ComfyUI) → 로컬 TRELLIS(RTX 4060 8GB, 종당 수 분) → `keepuv_low.py`(16k tri · 1024 텍스처) → `biped_rig.py`(두 발 자동 리깅) → `legend_add_clips.py`(Idle·Walk·Attack·Hit·Kneel 등 **파이썬 수식 키프레임**) → `build_looks.py`(왕국색·단계 변형) → `pack-statue`(meshopt 감량·WebP).
- 6종 캐스팅 완성, 단계 s2~s4 × 진영 변형이 **파일로 각각**(85 GLB). 건물·소품·바다 생물도 같은 길.
- 없는 것: Blender 에서 **사람이 손댄 메시·리토폴로지**, **손으로 만든 애니메이션**(모든 클립이 수식), **LOD**(코드·도구에 LOD 0건), **텍스처 예산**(전부 1024 또는 512, 재질·아틀라스 공유 없음), **KTX2/glTF Transform**, 아트 바이블(화풍 A/B 는 §10-7 미결).

**게임 느낌**
- 핵심 루프는 있다: 대국 → 카드 주머니 확정 → 섬 정산(도토리·건물·매대·주간 손님·이슬) → 다음 판. 봇 시뮬레이션으로 페이스(8채 20~26판)와 도감(대등 28판) 측정.
- 욕망 계획 D1~D7 완료(외형 잠금·얻는 길·개봉·입장식·증명서·표식). 재미 계획 1단계(말 구분·AI 끝내기·상단 정리) 완료.
- 없는 것: **사람 플레이 0회**, 리텐션 장치는 「매주 손님」「밤사이 이슬」만(일일 퍼즐 §10-14 미착수), 난이도 사다리(재미 2·4·5단계 미착수), 소리는 사람이 못 들어 봄, 휴대폰 실기기 확인 없음(이어 하기·공유 시트).

**품질 게이트**
- 있음: 135 테스트(규칙·경제·팩 검사기), CI 테스트+빌드, 브라우저 수동 확인 기록, 봇 시뮬레이터 2종(`island_sim.mjs`, 앨범).
- 없음: 타입 검사(끔), 성능 게이트(측정 잡음 ±3fps 미통과 상태), 에셋 게이트(tri·본·텍스처 자동 검사 — 기획서 §7 에만 있음), 시각 회귀(결정적 스크린샷 — `stepBy` 는 있음), 번들 크기 예산(1.3MB 단일 청크 경고 중), 테스트 시간(147초).

### 4.2 부족한 것 → 무엇으로 채우나

| 영역 | 부족 | 채우는 것 | Blender·TRELLIS 활용 |
| :--- | :--- | :--- | :--- |
| 메시 | TRELLIS 원본을 자동 감량만 | Blender 에서 **주역 6종만** 리토폴로지·실루엣 보정·대칭화, 1종 2~3시간 추정(재 보지 않았다) | TRELLIS = 초안, Blender = 완성 |
| 리그 | `biped_rig.py` 자동 가중치 | 주역 6종은 Blender 에서 가중치 페인트 수정, 얼굴 본 2~3개(눈·입) 추가 | 수식 클립이 찢어지는 원인(스킬 문서의 「큰 머리 체형」)을 뿌리에서 잡음 |
| 애니메이션 | 수식 키프레임 5~6개 | Blender 액션: 역할별 **Attack 2종·Idle 변주·Victory·Capture 피격**을 손으로. 접촉 시각(초)을 액션 이름 또는 `pack.json` 에 기록 | 체스의 「잡기」가 이 게임의 얼굴이다 |
| 외형 단계·진영 | 변형마다 GLB(85개) | 메시 공유 + **텍스처·머티리얼 변형**으로 압축(KHR_materials_variants 또는 런타임 교체). 1종당 파일 1~2개 | 112MB → 목표 40MB 이하(추정) |
| LOD·텍스처 | 없음 | 기물 LOD 2단계(16k/4k), 섬 소품 LOD, 텍스처 512 기본·주역만 1024, KTX2 | glTF Transform 한 줄 |
| 화풍 | 미결(§10-7) | 아트 바이블 1장: 색 팔레트·윤곽·재질 규칙·금지 목록. A/B 는 사자 1종 렌더 비교 | ComfyUI 콘셉트 프롬프트에 바이블을 고정 |
| 재미 | 봇 측정만 | **사람 시험 A**(어린이 1·초보 어른 1·체스 어른 1, 3판) 양식·녹화·질문 고정. 결과를 스토리로 | — |
| 리텐션 | 주간 손님·이슬 | 일일 퍼즐(lichess CC0 DB, §10-14), 난이도 사다리(재미 2단계), 복귀 보상 없는 「오늘의 섬」 | — |
| 게이트 | 테스트·빌드만 | CI 에 타입 검사(오류 2건 수정 후), 에셋 게이트 스크립트(tri·본·텍스처·파일 크기), 번들 크기 상한, 성능 측정은 **같은 기보 3회 중앙값**으로 잡음을 줄여 재시도 | — |

### 4.3 로드맵 — 단계별 완료 기준과 검사 방법

각 단계는 §2.5 의 스토리 형식으로 쪼개 `docs/stories/` 에 둔다. 기간은 **추정**이고 재 보지 않았다.

| 단계 | 내용 | 완료 기준 | 검사 방법 |
| :--- | :--- | :--- | :--- |
| **S0. 관리 정돈** (1~2일) | §2.5 1·2·5·7·8. `STATUS.md`, `CLAUDE.md`, 스토리 전환, PR 규칙, 브랜치 정리 | 열린 항목이 한 파일에 전부 있고, 12편 계획서 각각이 그 파일을 가리킨다. 새 PR 이 스토리 ≤3개 | `grep` 으로 계획서마다 스토리 번호 링크 존재. `gh pr list` 로 PR 크기 |
| **S1. 게이트 세우기** (3~4일) | 타입 오류 2건 수정 → CI 에 `npm run lint`. 에셋 게이트 스크립트(`tools/asset_gate.mjs`: GLB 마다 tri·본·텍스처·크기 상한, `pack.json` 역할 매핑). 번들 상한(gzip 400KB). 성능 측정 스크립트(같은 기보 3회, 드로우콜·fps 중앙값·p95). 느린 시뮬 테스트를 `test:slow` 로 분리해 기본 테스트 30초 이내 | CI 초록에 4개 검사 포함. 성능 3회 측정 차이 ±3fps 이내(premium-feel 의 미통과 게이트를 다시) | GitHub Actions 로그. 측정 결과를 `docs/perf/` 에 날짜별 저장 |
| **S2. 사람 시험 A** (1주, 병행) | 양식·동의·녹화 절차. 어린이 1·초보 어른 1·체스 어른 1 이상, 3판씩. 질문: 말 구분·판 길이·봐줬다는 느낌·한 판 더·갖고 싶다 ♡·산 것/번 것 구분 | `docs/playtests/2026-11-xx-A.md` 에 참가자별 답과 관찰, 결함 목록이 스토리로 등록 | 기록 파일 존재 + 결함 스토리 ≥1. 재미 계획 §7·욕망 §10·섬 경제 §8 의 「사람 시험 A」 줄을 닫음 |
| **S3. 아트 바이블 + 주역 1종 완성판** (1~2주) | 화풍 A/B 결정(§10-7). 사자 1종: Blender 리토폴로지·가중치·얼굴 본·손 애니메이션(Attack·Idle·Victory·Hit)·LOD 2단계·KTX2. 접촉 시각 `pack.json` 기록 | 사자가 같은 판에서 기존 수식 클립 버전과 나란히 보이고, 참가자 3명 중 2명 이상이 새 버전을 고른다(S2 참가자 재활용). 에셋 게이트 통과. 파일 크기 기존 대비 −50% 이상 | 렌더 비교 시트(`tools/render_glb.py`), 게이트 로그, 선택 기록 |
| **S4. 나머지 5종 + 변형 압축** (3~4주) | 호랑이·코뿔소·여우·캥거루·미어캣 같은 절차. 단계·진영 변형을 머티리얼 변형으로. 소품·건물 LOD | `public/packs/legend/` 총량 40MB 이하(추정 목표). 드로우콜 ≤ 120(지금 190, 측정 뒤 상한 재조정). 모바일 Chrome 중급 기기 30fps 중앙값 | 에셋 게이트·성능 스크립트·실기기 1대 측정 기록 |
| **S5. 재미·리텐션 2차** (2~3주) | 사람 시험 A 결함 수정 → 난이도 사다리(재미 2·4) → 일일 퍼즐(§10-14) → 소리 사람 확인 → **사람 시험 B**(같은 사람 5판) | 시험 B 에서 섬에 30초 이상 머물고 칸을 만진다(섬 경제 §8 기준). 다음 판 시작률을 승·패 뒤로 나눠 기록 | 기록 파일, 로컬 이벤트 로그(재미 계획 §7 0단계) |
| **S6. 출시 준비** (이후) | TWA(Android), HTTPS 배포(공유 시트 확인), CREDITS(MIT 고지·CC0·TRELLIS), 개인정보 페이지. iOS 는 4.2 심사 위험을 두고 보류 | Play 비공개 테스트 12명×14일 통과 | 스토어 콘솔. 기획서 Phase 5c 와 합침 |

**S1 결과 (2026-11-04):** 완료 기준 「CI 초록에 4개 검사 포함」은 파일로는 갖췄고(lint · test · test:slow · gate:assets · build · gate:bundle), 실제 초록은 푸시 뒤 확인한다. 「성능 3회 측정 ±3fps」는 **다시 미통과** — 3로드 fps 21/47/36(범위 26), 드로우콜 220 은 세 번 같았다(`docs/perf/2026-11-04-gate-s1.json`). 이 PC 의 fps 는 잡음이 신호보다 크므로 게이트는 드로우콜·에셋·번들·테스트 네 가지로 두고, fps 는 조용한 상태 재측정과 `stepBy` 결정적 측정을 다음 시도로 적는다(STATUS §2). 느린 시뮬 테스트를 떼어 기본 테스트는 147초 → 11초. 상세는 STATUS MG-S1.

**S2 결과 (2026-11-04, LLM 대행):** 참가자 섭외가 안 돼 사용자 지시로 세 모델이 세 역할로 대신했다. 양식(질문 9개)은 [보고서](../playtests/2026-11-04-test-a-llm.md)로 고정됐고 결함 9건이 STATUS TA-1~9 로 들어갔다. 세 역할 모두 「다음 목표」를 한 줄로 말해 D2·G1 은 통과 신호, 기권 확인창 문구는 셋이 수렴한 결함이다. 하네스 사고 5건(모델 400·환경변수·좀비 실행·토스트 시점·오버레이 덤프)은 [라운드 기록](../research/agent-rounds/2026-11-04-test-a-llm/README.md)에 있다. **사람 시험은 여전히 열려 있다.**

S3 가 끝나기 전에는 S4 를 시작하지 않는다. 사자 1종이 「Blender 를 더해도 좋아지지 않는다」로 나오면 S4 의 방향(손질 범위·화풍)을 바꾼다. 이것이 「딸깍」과의 차이다 — 한 종으로 가설을 검증하고 다음으로 간다.

### 4.4 운영 규칙 (도구가 아닌 것)

1. **기능 하나 = 측정 하나.** 봇 또는 사람으로 재지 못하는 기능은 스토리로 올리지 않는다.
2. **계획서는 결정의 기록, 스토리는 진척의 기록.** 계획서에 「결과」 산문을 더 쌓지 않고 스토리를 닫는다. 계획서는 결정이 바뀔 때만 고친다.
3. **PR 은 스토리 ≤3개.** 리뷰는 `code-review` 스킬로 한 번.
4. **세션 시작은 `STATUS.md` 읽기.** 세 모델 라운드는 설계가 갈릴 때만 연다(지금처럼 매 계획마다 열지 않는다 — 15회 중 결론이 「셋 다 같다」였던 횟수를 세어 보는 것도 S0 의 일이다).
5. **화면·소리는 사람이 본다.** Donchitos 템플릿의 「파싱 통과는 실행이 아니다, 스크린샷을 남긴다」 원칙을 그대로 가져온다. 우리는 이미 브라우저 확인을 하고 있으니 **캡처를 `docs/qa/` 에 남기는 것**만 더한다.

---

## 5. 사용자 확인 목록 (설치·가입·비용·용량·결정)

| # | 항목 | 왜 확인이 필요한가 |
| :--- | :--- | :--- |
| 1 | §2.4 방식 C(선택 이식) 채택 여부, 또는 A/B | 저장소 구조와 작업 방식이 바뀐다 |
| 2 | `/plugin marketplace add joemonster/claude-game-studio` 설치 | 외부 스킬 9개가 세션에 들어온다. 2026-06 이후 갱신 없음. 설치 없이 읽기만도 가능 |
| 3 | 훅 활성화(커밋 메시지·JSON 검사) | 모든 Bash 호출에 훅이 돈다. 체감 지연은 재 보지 않았다 |
| 4 | 저장소 `CLAUDE.md` 신설 | 전역 규칙 일부가 저장소(공개 PR)에 들어간다. 적을 것·뺄 것 결정 |
| 5 | PR #4 를 그대로 병합할지 | 562파일을 쪼갤 수는 없다. 병합 뒤 규칙 적용 |
| 6 | 브랜치 `fix/lockfile-name`·`fix/typecheck-css-import` 삭제 또는 반영 | 각 1커밋, 10-27 |
| 7 | 사람 시험 A 참가자(어린이 포함) 섭외·동의·녹화 | 사람과 시간이 든다. 어린이는 보호자 동의 |
| 8 | 화풍 A/B 결정(§10-7) 을 S3 에서 사자 1종 렌더로 할지 | 아트 바이블의 출발점 |
| 9 | Blender 수작업 시간 투입(주역 6종, 종당 수 시간 추정) | 사용자가 직접 하거나 외주. 에이전트는 Blender 파이썬으로 일부만 가능 |
| 10 | 디스크: KTX2·LOD 산출물과 Blender 작업 파일은 D: 에 | C: 여유 적음 |
| 11 | 엔진 재검토 트리거 (§3.3 ③ a/b/c) 동의 | 조건이 맞기 전에는 엔진 논의를 다시 열지 않기로 |
| 12 | 일일 퍼즐(lichess CC0 DB) 도입 — 기획서 §10-14 미결 | 데이터 수 GB, D: 에 받음 |
| 13 | TWA·Play 콘솔(25달러 1회, 재 보지 않았다)·HTTPS 배포 주소 | S6. 가입·비용 |

## 6. 틀릴 수 있는 곳

- **Donchitos 템플릿의 동작**은 README·`CLAUDE.md`·`project.yaml`·디렉터리 목록·`adopt` 스킬 머리만 읽었다. 훅 스크립트 본문·74 스킬 본문은 읽지 않았다. 이식할 때 각 파일을 읽고 판단한다.
- **OpenAI `game-studio` 라이선스**는 `plugin.json` 의 `"license": "MIT"` 선언만 확인했다. 저장소 루트 LICENSE 를 GitHub 가 감지하지 못했다. 폴더 안 LICENSE 파일 유무를 이식 전에 본다.
- **Unreal 로열티**는 공식 페이지(EULA·FAQ·license) 세 곳이 모두 403 으로 열리지 않았다. 표의 값은 미확인이다.
- **Godot 웹 빌드 절대 크기**는 공식 문서에 수치가 없다(「보통 크다」, gzip 으로 약 1/4). 비교하려면 빈 프로젝트를 직접 내보내 재야 한다.
- **Unity 모바일 브라우저**는 문서가 「일부 지원」이라 했고 「공식」이라는 말은 없다.
- **기간·용량 목표**(S3 1~2주, 40MB, 드로우콜 120, 종당 2~3시간)는 전부 추정이다. S1 의 측정 뒤 다시 적는다.
- **`@google/genai` 의 용도**, three·React 등 각 LICENSE 원문, 훅의 체감 지연, 테스트 147초의 내역은 재 보지 않았다.
- **15회 라운드 중 「셋 다 같다」 비율**은 세지 않았다. §4.4 의 주장(라운드를 줄여도 된다)은 이 수치가 나와야 성립한다.
- 이 문서의 「진단」은 저장소만 보고 썼다. 사용자가 느끼는 「관리가 잘 안 된다」의 실제 원인이 다른 곳(시간·우선순위·동기)에 있을 수 있다.

## 7. 확인한 출처

- GitHub API: `gh api repos/Donchitos/Claude-Code-Game-Studios`(및 `/contents`, `/readme`, `/releases`, `/contents/.claude/*`, `/contents/CLAUDE.md`, `/contents/project.yaml`, `/contents/.claude/skills/adopt/SKILL.md`, `/contents/.claude/docs/directory-structure.md`), `gh api repos/openai/plugins/contents/plugins/game-studio/**`, `gh api repos/joemonster/claude-game-studio/readme`, 검색 `search/repositories?q=game-studios`.
- Godot 웹 내보내기: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html · 라이선스: https://godotengine.org/license/
- Unity 웹 브라우저 호환: https://docs.unity.com/en-us/engine/current/manual/platform-specific/webgl/intro/browsercompatibility · 가격: https://unity.com/pricing · 런타임 요금 취소: https://unity.com/blog/unity-is-canceling-the-runtime-fee
- Unreal 지원 플랫폼: https://dev.epicgames.com/documentation/en-us/unreal-engine/sharing-and-releasing-projects-for-unreal-engine · HTML5 커뮤니티 확장: https://github.com/UnrealEngineHTML5/Documentation
- Apple 심사 지침 4.2·4.2.2: https://developer.apple.com/app-store/review/guidelines/ · TWA: https://developer.chrome.com/docs/android/trusted-web-activity
- 저장소: `docs/PLAN.md` §7·§9·§10·§13, `docs/plans/*.md`(premium-feel §13·§14, desire §10, fun §7, island-economy §8, garden-short §7), `.github/workflows/ci.yml`, `package.json`, `package-lock.json`, `tools/*.py`, `~/.claude/skills/chess-character-pipeline/SKILL.md`, `npm test`, `npm run build`.
