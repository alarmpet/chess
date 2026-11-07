# 설계 라운드 — WILD CROWN 기획서 v0.2 (2026-10-27)

`tri-agent-review --design docs/PLAN.md`. 세 모델이 서로 다른 자료로 독립 판정하고, 통합자(Claude)가 모든 사실 주장을 저장소·레지스트리·원문에서 대조했다. **결과: 기획서 v0.2 의 사실 전제 6개가 거짓이었고, 그중 4개는 통합자 자신의 오류다.** v0.3 (`docs/PLAN.md`) 에 반영.

## 방법 · 배정표

| 모델 | 실행 | 영역 | 배정 자료 | 결과 |
| :--- | :--- | :--- | :--- | :--- |
| **agy** (Antigravity · Gemini 3.8 Flash High 자기보고) | `agy --add-dir … --effort high` (권한 플래그 없음) | [A] 에셋 파이프라인 | study-game 스킬 4개 · `tools/legend/` 스크립트 4개 · 통합자 GLB 실측표 | 완주 14KB · ~15분 |
| **grok** (grok-4.6) | `--allow Read/Grep/Glob/WebFetch/WebSearch --deny Write/Edit/Bash` | [G] 게임 경험 + 외부 사실 | 기획서 + 웹 (E1~E8 표) | 완주 18KB · ~30분 |
| **codex** (GPT-6 자기보고 · `config.toml` `gpt-6-sol`) | `codex exec -s read-only - < C_prompt2.md` | [C] 엔진 구조 | `wizardChessEngine.js` 좌표 12개 · App.tsx · package.json · 테스트 | **1차 실패** → 2차 완주 125줄 |
| Claude (통합자) | `r1-claude.md` 를 셋을 읽기 전에 작성 · `verify-claude.md` 실측 | 전체 | 저장소 · npm · glTF 파싱 | — |

**codex 1차 실패**: 브리핑의 "셸 금지"를 문자 그대로 지켜 유일한 읽기 수단인 셸까지 안 쓰고 "지어내지 않겠다"로 끝냈다(`r1-codex-attempt1-failed.md`). 2차는 "읽기 전용 셸 허용"을 프롬프트 머리에 명시해 완주. → `cli-invocation.md` 교훈: **codex 에게는 셸 금지를 쓰지 않는다. "읽기 전용 명령만" 으로 적는다.**

## 거짓으로 확인된 기획서 전제 (전부 저장소 대조)

| # | 기획서 v0.2 | 실제 | 찾은 이 | 근거 |
| :--- | :--- | :--- | :--- | :--- |
| F1 | `contactClip` 은 "클립 길이 대비 **비율**" | **초 단위 클립 시각** | Claude(실측) · codex | `wizardChessEngine.js:2444` `tApproach + CONTACT_CLIP_TIME / timeScale` · `:2598` `atkClipTime = (elapsed - tApproach) * timeScale` · `:2620` `if (atkClipTime < CONTACT_CLIP_TIME)` |
| F2 | study-game GLB 를 읽으려면 **three r185 로 올린다** | **r170 이 이미 읽는다.** study-game GLB 는 `EXT_texture_webp` + `KHR_mesh_quantization`(meshopt 압축 아님) | Claude(실측) | r170 `GLTFLoader.js` 에 `EXT_meshopt_compression`·`EXT_texture_webp` 각 2회 · `gumiho_fox.glb` `extensionsRequired=['EXT_texture_webp','KHR_mesh_quantization']` |
| F3 | 참고자료 URL `IgorAherne/TRELLIS.2-stableprojectorz` 가 로컬 v1 fp16 서버 | **다른 저장소.** 로컬은 `trellis-stable-projectorz`(v1) | grok | `D:\trellis-local\app\run-fp16.bat` = `call run.bat --precision half` · grok 이 두 저장소 README 대조 |
| F4 | "난이도 1~10 = Skill Level … 1~3 은 폰을 던진다" | Skill Level 은 **0~20**, 폰을 던지는 API 없음. 어린이 난이도는 `UCI_LimitStrength`+`UCI_Elo`(min 1320) | grok | UCI 문서 `option name Skill Level type spin default 20 min 0 max 20` · `UCI_Elo … min 1320 max 3190` |
| F5 | "farm 28본 … 클립: Attack · …" / "얼룩말 farm 리그 원본(`pk_zebra`)" | farm 팩(Cow·Horse·Zebra 28본)에 **Attack 없음**(Death·Idle·Jump·Run·Walk·WalkSlow). `assets/packs/pk_zebra.glb` 는 **본 0**. 원본 `packs_src/quaternius_farm/Zebra.glb` 는 28본이나 역시 Attack 없음 | agy (+Claude 보강) | `A_glb-measurements.md` · `A3_quaternius-src-measurements.md` |
| F6 | `"pawn": … "rig": "biped15" … "attack": "Cheer"` | `biped_rig.py` 클립은 **Idle·Walk·Run·Sit·Cheer 5개뿐**, Hit·Death 없음. `FOOT_Y=-0.5` 로 발이 타일에 0.5 파묻힘. Cheer 는 두 팔 환호 | agy | `biped_rig.py:5,14,208,225` |

그 밖의 기획서 부정확 (거짓까지는 아님): "`pack-statue.mjs` … meshopt 양자화" → 실제는 meshoptimizer **감량** + `KHR_mesh_quantization`(agy) · "파편 물리 공유 VBO" → 실제는 공유 **지오메트리**로 `Mesh` 32개(codex `:2020–2026`) · "`spawnStoneShatter` 재사용" → 400개로 늘리면 Mesh 400개(codex) · 킹 전도는 `Death` 클립이 아니라 쿼터니언 기울임(codex `:3591`).

## 각 모델이 틀린 것 (지우지 않는다)

| 모델 | 틀린/부정확한 주장 | 실제 |
| :--- | :--- | :--- |
| **agy** | [문제 1] "farm 28본 리그 원본 부재" | 원본 `packs_src/quaternius_farm/Zebra.glb` 는 **28본 리그가 있다**(agy 는 본 0 인 `assets/packs/pk_zebra.glb` 사본만 봤다). Attack 없음은 맞다 — 관찰 채택, "부재" 진단 폐기 |
| agy | §2 인용 "farm 28본 (얼룩말·소·양)" | 기획서 원문은 `farm **28본** (얼룩말·소·양)` — 굵게 표시를 뺀 재구성 인용. 내용은 같아 항목 유지 |
| **grok** | [문제 5] "meshopt GLB 는 디코더를 안 물리면 안 읽힌다 … Phase 0 완료 조건" | 관찰(디코더 필수)은 참이나 **study-game GLB 는 meshopt 압축을 쓰지 않는다** → 이 프로젝트엔 해당 없음. 진단 폐기 |
| grok | 1.3-3 "CC0 공여 리그에 사자·코끼리·기린이 없다" | 종 이름 기준으론 참. 그러나 로컬 `packs_src/quaternius_animals/` 에 **Alpaca(긴 목)·Donkey·Cow·Horse·Deer·Stag·Wolf·Husky·Shiba·Fox 12종이 Attack 류 클립과 함께 있다** — grok 은 파일을 못 봤으므로 오류는 아니고 자료 한계 |
| **codex** | 사실 오류 **없음**. 인용 14건 전부 코드와 일치 | 1차 실행 실패는 지시서 문제(통합자 책임) |
| **Claude** | F1·F2·F3·F4 + 위 "부정확" 4건 | 기획서를 쓴 쪽이라 가장 많이 틀렸다. 특히 F1 은 "값만 보고 소비 코드를 안 읽은" 것 |

## 셋이 갈린 결정과 끊는 법

| 쟁점 | agy | grok | codex | Claude r1 | 끊는 법 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 밀림 비숍 코브라(절차) | 유지 | **Phase 4 로 미룸** | 유지하되 어댑터 선정의 | 비용 과소평가 | **미룸 채택** — 출시 팩은 재생기 종류 최소. 밀림 비숍 = 🦜 앵무새(biped) |
| 화풍 | 조각상 chunky | 라이온킹/픽사 (사용자 "디테일") | 판정 불가 | 조각상 | **실측으로 끊는다**: Phase 1 사자를 두 프롬프트로 생성해 비교판 → 사용자 선택 (§10-7 유지) |
| 폰 미어캣(biped) | 46본 사족으로 | Phase 2 끝 또는 토끼 | — | — | biped_rig **보강**(FOOT_Y=0 · Attack/Hit/Kneel 3클립) 후 투입. 보강 전 임시 폰 = 임팔라(Deer 공여) |
| Phase 0 범위 | — | 무겁다 | **무겁다**(문제 7) | 무겁다(C3) | 셋 수렴 + 실측(r185 불필요) → 0a/0b 로 분할 |

## 혼자만 찾은 것 (가장 값어치 있었던 것)
- **codex**: 클립 재생이 이름 **부분 문자열 검색**(`:1591–1598`)이라 `Move`/`Shatter` 요청이 동물 클립 `Walk`/`HitReact` 에 매치되지 않는다 → 역할→클립 어댑터가 Phase 1 전제. `instantiatePiece` 가 재질을 단색으로 덮어(`:1534`) 동물 텍스처가 사라진다. 승급이 퀸 고정(`:2498`)이고 앙파상이 없다(grep 0건) → 1,000국면 비교는 공통 국면만.
- **grok**: Stockfish npm 이 **GPL-3.0**(205MB) · lite-single ≈1.7MB · 멀티스레드는 COOP/COEP. TRELLIS 두 저장소 혼동.
- **agy**: `bake_low.py:114` 가 **JPEG** 로 내보내 노멀맵을 손상 · `pack-statue.mjs:35` 가 비색상 텍스처를 **512 로 강제** · `rig_transfer.py:122` 확인 렌더 라벨에 `attack` 없음 · `FOOT_Y=-0.5`.
- **Claude**: `packs_src/quaternius_animals/` 12종 리그(UUID 파일명 → 노드 이름으로 종 식별, "Cube" 는 썸네일로 허스키 확인) — 세 모델 모두 못 본 자료.

## 파일
`BRIEF.md` 지시서 · `r1-claude.md` 통합자 선판정 · `verify-claude.md` 통합자 실측 · `r1-agy.md` `r1-grok.md` `r1-codex-answer.md`(원본 `r1-codex.md` 224KB 는 stdin 에코 포함) · `r1-codex-attempt1-failed.md` · `A_*.md` 실측표 3개 · `run-*.cmd` `C_prompt*.md` 실행 파일.
