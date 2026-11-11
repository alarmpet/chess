# WILD CROWN — 저장소 규칙 (초안 2026-11-04)

귀여운 동물 3D 체스 웹 게임. 사자가 다스리는 백색 왕국과 흑색 왕국이 체스판에서 맞붙고, 판이 끝나면 카드와 도토리로 섬을 키운다.
근거 문서: [docs/PLAN.md](docs/PLAN.md)(기획서) · [docs/STATUS.md](docs/STATUS.md)(열린 항목 한 곳) · [docs/plans/](docs/plans/)(결정 기록) · [docs/research/](docs/research/)(조사·라운드).
세션은 `docs/STATUS.md` 를 먼저 읽고 시작한다.

## 응답·작업 규칙

- 응답·주석·문서는 **한국어**. 코드·경로·식별자는 원문. 영어가 많은 긴 글은 쓰지 않는다.
- **커밋·푸시는 사용자가 「커밋」「푸시」라고 말할 때만** 한다. 계획서·코드를 고친 뒤 스스로 커밋하지 않는다.
- 사실은 저장소·공식 문서에서 확인한 것만 적고, 재지 않은 것은 「재 보지 않았다」로 표시한다.
- 화면·소리가 바뀌는 작업은 브라우저로 실제로 보고, 캡처 또는 기록을 `docs/qa/` 에 남긴다. 테스트 통과만으로 끝내지 않는다.
- 기능 하나에는 측정 하나(봇 시뮬레이션 또는 사람 시험). 재지 못하는 기능은 스토리로 올리지 않는다.
- PR 하나는 스토리(계획서 단계) 3개 이하.

## 라이선스·외부 코드

- **GPL · AGPL · CC-BY-NC** 저장소의 코드·에셋은 복사하지 않는다. 읽고 구조만 배운다.
- 내려받은 저장소의 코드는 **실행하지 않는다**(읽기만). 권한 분류기가 막으면 우회하지 않는다.
- 치트·트레이너 저장소는 내려받지 않는다.
- MIT·Apache·CC0 를 가져올 때는 파일 머리에 출처와 고지를 남기고 `CREDITS.md` 에 적는다.

## 이 PC 에서만

- `main` 에는 다른 PC 의 다른 게임 작업이 섞여 온 적이 있다(기획서 §10-18). **이 PC 에서 만든 것만 이 게임**이다. 병합 전에 커밋 출처를 확인한다. 원본은 `archive/other-pc-games` 브랜치.
- C: 여유가 적다. 모델·캐시·가상환경·데이터는 **D:** (`D:\hf-cache`, `D:\tools`, `D:\tmp\pip-cache`).
- GPU 8GB 라 ComfyUI 와 TRELLIS 를 동시에 돌리지 않는다.

## 명령

```bash
npm run dev        # Vite, 3000 포트 (.claude/launch.json 의 dev)
npm test           # 빠른 테스트 134개, 약 10초
npm run test:slow  # 300판 시뮬 1개, 약 150초 (CI 에서 돈다)
npm run build      # vite build → dist/
npm run lint       # tsc --noEmit, 오류 0 (CI 포함)
npm run gate:assets   # GLB 삼각형·본·텍스처·크기·pack.json 참조 (--report 로 표)
npm run gate:bundle   # 빌드 뒤 JS/CSS gzip 상한
npm run gate:drawcalls # 빌드 뒤 헤드리스 Chrome 으로 초기 국면·잡기 세 칸 드로우콜 ≤ 100 (DRAWCALL_URL 로 떠 있는 서버 사용 가능)
```

캐릭터·건물·소품 제작은 `~/.claude/skills/chess-character-pipeline` 스킬을 따른다(Flow/ComfyUI 콘셉트 → 로컬 TRELLIS → `tools/make_biped.py` → `tools/build_looks.py`). 긴 작업은 산출물이 늘어나는지로 감시한다.

## 구조

| 경로 | 내용 |
| :--- | :--- |
| `src/wizardChessEngine.js` | 체스 장면·안무·카메라 (6,300줄, 단일 파일) |
| `src/rules/` | `chess.js` 심판 `referee.js`, AI, 이어 하기 |
| `src/village/` | 섬 경제 `economy.js`, 장면 `islandScene.ts`, 저장 |
| `src/cards/` | 카드 주머니·도감 |
| `src/fx/`, `src/audio/` | 효과·바다·소리 |
| `src/packs/packManifest.js` | 팩 매니페스트 로더·검사기 |
| `src/net/`, `src/rank/`, `worker/` | 친구 대전 전송·기기 신분, 랭크 보고·Glicko-2, Cloudflare Worker `/api/rank` + D1 |
| `public/packs/legend/` | 동물·건물·소품 GLB, `pack.json` |
| `tools/` | Blender·TRELLIS 파이썬 도구 |
| `test/*.test.mjs` | 규칙·경제·팩 테스트 |
| `docs/stories/` | 열린 작업 단위(예정) |

## 저장 키

`localStorage`: `wildcrown.resume.v1`(이어 하기) · `wildcrown.pouch.v1`(카드 주머니) · `wildcrown.identity.v1`(기기 익명 서명 키, 랭크) · `wildcrown.skill.v1`(AI 판 실력 점수·단계, DR-M1) · 마을·카드·설정 스토어. 시험으로 저장을 건드렸으면 시험 전으로 되돌린다.
