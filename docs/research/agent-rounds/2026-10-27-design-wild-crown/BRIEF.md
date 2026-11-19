[역할] `D:\chess`(wizard-chess-3d · 돌아가는 Three.js 3D 체스)를 동물 왕국 체스 「WILD CROWN」으로 바꾸는 기획서 v0.2(`D:\chess\docs\PLAN.md`)를 **설계 검토자**의 눈으로 검토하고, 네 담당 영역의 **독립 설계안**을 낸다.
파일 읽기 도구만 써라. 셸·터미널·명령 실행·저장소 수정은 금지. 디렉터리를 뒤지지 말고 아래 절대경로를 직접 읽어라.

════════ 사용자 요청 원문 (2026-10-27) ════════

> 내가 원하는거 1. 클래식한 고전게임을 현대식으로 재해석 , 2. 예를들어 킹은 사자? , 비숍은 얼룩말?쫄은 초식동물들? (강아지,고양이?등등)  trellis , blnder , threejs 등으로 아주 디테일하고 멋있게 제작하고 , 3. 나만의 체스 커스텀 캐릭터들? 스킨? , 4. 특수효과도 빵빵하게 ,    아무튼 정말 너의 천재적인 아이디어와 창의석 등을 발휘하고 llm 들 협업해서  제대로 된 미친 멋진 게임 만들어보자 계획서 작성해

> D:\study-game  < 이 경로에 trellis , blender , threejs 등등 다 있어  캐릭터들 생성한 에셋들도 있고 , 필요하면 구글플로우에서 이미지나 영상도 생성 가능하고 , 필요한 프로그램 깃허브에서 다 다운받아 사용해도 되고

════════ 네게 배정된 것 ════════

셋 모두 `D:\chess\docs\PLAN.md` (기획서 v0.2, 398줄) 를 읽는다. 그 외에는 **네 영역의 파일만** 읽어라. 다른 영역의 파일은 읽지 마라 — 서로 다른 자료로 독립 판정하는 것이 이 라운드의 요점이다.

    agy   → [A] 에셋 파이프라인 — 기획서 §1.2 · §5 · §6 이 네 영역이다.
             D:\chess\.reports\consult-wild-crown-design\A_glb-measurements.md   (통합자가 오늘 glTF JSON 을 직접 파싱한 실측표)
             D:\study-game\.agents\skills\ai-3d-asset-remaster\SKILL.md
             D:\study-game\.agents\skills\ai-3d-asset-remaster\references\measurements.md
             D:\study-game\.agents\skills\ai-3d-asset-remaster\references\chibi-rig.md
             D:\study-game\.agents\skills\trellis-local-ops\SKILL.md
             D:\study-game\tools\legend\README.md
             D:\study-game\tools\legend\rig_transfer.py
             D:\study-game\tools\legend\bake_low.py
             D:\study-game\tools\legend\biped_rig.py
             D:\study-game\tools\legend\pack-statue.mjs

    codex → [C] 엔진 구조 — 기획서 §1.1 · §4 · §7 이 네 영역이다.
             D:\chess\src\wizardChessEngine.js   (4,969줄 단일 파일. 통합자가 찾은 좌표:
               ShaderMaterial 561·700 / whitePieceMat 835 · blackPieceMat 841 / loadGltfModel 1164 /
               instantiatePiece 1511 / ATTACK_SYNC_PROFILES 1582 / playPieceClip 1591 / spawnStoneShatter 2022 /
               executeChessMove 2072 / stepMove 2526 / chooseSmartAIMove 2747 / triggerCheckmateSequence 3413)
             D:\chess\src\App.tsx
             D:\chess\package.json
             D:\chess\vite.config.ts
             D:\chess\test\applet.test.mjs

    grok  → [G] 게임 경험 + 외부 사실 — 기획서 §2 · §3 · §6 · §9 가 네 영역이다.
             기획서 외에 파일은 없다. 대신 **웹 검색·웹 조회가 허용된다.** 아래 「외부 사실 전제」 표의 각 줄을 공식 문서·저장소 원문으로 확인하고 URL 을 적어라.

배정 파일은 전부 실제 저장소의 파일이다. 지어낸 것이 아니다. 네 파일에 없는 것은 **"확인 못함"** 으로 두어라 — 없는 것을 채우지 마라.

════════ 통합자가 이미 확인한 것 (다시 내지 마라) ════════

실측 (오늘 통합자가 직접 잰 것):
- `D:\chess` three **0.170.0**, `D:\study-game` three **0.185.1** (node_modules/three/package.json).
- `wizardChessEngine.js` 4,969줄. 기물 GLB 는 백색 6종(`public/assets/glb/*_white.glb.gz.b64`)만 있고 흑은 `blackPieceMat` 틴트. 대성당 8.4MB(base64).
- `npm test` 2/2 통과 · `tsc --noEmit` 0건 · `vite build` 성공 · 개발 서버에서 렌더링·AI 수 두기 동작 확인.
- GitHub Actions 워크플로 0개. 사운드 파일 0개.
- `assets/generated/_spike_prop.glb`: 46본 `AnimalArmature`, 클립 12종(Attack·Death·Eating·Gallop·Gallop_Jump·Idle·Idle_2·Idle_2_HeadLow·Idle_HitReact_Left/Right·Jump_ToIdle·Walk) — A_glb-measurements.md 에 전체 표.
- `ATTACK_SYNC_PROFILES` 의 `contactClip: 0.56~0.60` 은 **클립 길이 대비 비율**이라고 기획서가 주장한다 — **codex 가 코드에서 확인하라** (통합자는 값만 봤고 소비하는 코드를 끝까지 읽지 않았다).

study-game 문서에서 읽은 것 (통합자가 오늘 재현하지 않았다 — 문서의 날짜를 믿는다):
- 로컬 TRELLIS v1 fp16 이 RTX 4060 8GB 에서 돌아간다 (2026-10-14~15 실측 기록, 1장 92~352초).
- Blender Decimate 는 TRELLIS UV 이음매를 찢는다 · 리그 메시의 이음매 보존 감량은 ~5.8만 tri 에서 멈춘다 (measurements.md).
- `rig_transfer.py` 가 시바·늑대·판다 등 **개과·곰과 치비**에서 애니메이션을 유지하며 가중치를 옮겼다 (chibi-rig.md).

재 보지 않은 것 (기획서의 가설 — 이것들이 검토 대상이다):
- `rig_transfer.py` 가 **코끼리·기린·코뿔소**(공여 리그와 비율이 크게 다른 종)에도 되는가.
- `bake_low.py` 를 16k tri · 1024px 로 올렸을 때 품질과 성능.
- Quaternius `Attack` 클립의 접촉 지점이 체스 근접 안무(`MELEE_STANDOFF`)와 맞는가.
- three r170 → r185 업그레이드가 기존 GLSL 셰이더·OrbitControls·SkeletonUtils 경로를 깨는가.
- `chess.js` · Stockfish WASM 이 기획서가 말하는 기능(3회 반복·50수·Skill Level·Web Worker)을 실제로 제공하는가.
- Phase 0 (r185 업그레이드 + 모듈 분해 1차 + chess.js + Stockfish + CI) 가 1주에 되는가.

이미 끝난 일 (다시 내지 마라): 클론·설치·빌드·타입 오류 1건 수정(PR #1) · 락파일 이름 동기화(PR #2) · `D:\study-game` 자산 조사.

════════ 이 작업의 제약 (원문) ════════

- 사용자에게 보이는 모든 글은 **한글**. 코드·식별자·경로는 원문.
- 이 PC: RTX 4060 Laptop 8GB · Blender 5.2 · Python 3.13 · Node 22. **C: 여유 6.8GB — 새 모델·캐시·가상환경은 D:** (`D:\hf-cache`, `D:\tools`).
- 라이선스: Quaternius 모델은 poly.pizza CC0 배포분만 (quaternius.com 직접 다운로드는 재배포 금지 — study-game 2026-09-21 확인). 출처 표기 필수.
- 1인 개발자 + 에이전트. 주당 15~20시간.
- **현재 안(v0.2)을 그대로 두는 것도 정상 답이다.** 증거가 바꾸라고 하지 않으면 바꾸지 마라.

════════ 외부 사실 전제 (grok 전용 — 각 줄을 URL 로 확인) ════════

| # | 기획서의 전제 | 확인할 것 |
| :--- | :--- | :--- |
| E1 | `chess.js` 가 3회 반복·50수 규칙·FEN·PGN 을 제공한다 | npm 패키지 README/API |
| E2 | Stockfish 가 WASM 으로 브라우저 Web Worker 에서 돌고 `Skill Level` UCI 옵션이 있다 | stockfish.js / stockfish.wasm 저장소 |
| E3 | three r185 `GLTFLoader` 가 `EXT_meshopt_compression` 과 `EXT_texture_webp` 를 읽는다 (study-game GLB 가 이 둘을 쓴다) | three.js 문서/소스 |
| E4 | `postprocessing` 패키지(pmndrs)가 three r185 와 호환되고 bloom·SSAO·갓레이를 제공한다 | 패키지 peerDependencies·README |
| E5 | IgorAherne/TRELLIS.2-stableprojectorz 가 MIT 이고 TRELLIS v1 fp16 모드가 있다 | 저장소 LICENSE·README |
| E6 | UniRig(VAST-AI-Research) 코드가 MIT 이고 사족 동물을 지원한다; 체크포인트 라이선스는 별도 | 저장소 LICENSE·README |
| E7 | Quaternius 동물 팩이 poly.pizza 에서 CC0 로 배포된다 | poly.pizza 페이지 |
| E8 | three.js `WebGPURenderer` 가 WebGL 폴백을 갖는다 (Phase 6 근거) | three.js 문서 |

════════ 낼 것 ════════

## 0. 네 모델 이름과 읽은 파일 목록
실제로 연 파일만 적어라.

## 1. 네 영역의 독립 설계안
기획서를 **읽기 전에 생각한 것처럼** 써라. 형식:
    ### 1.1 구조 (모듈·경계·데이터 흐름)
    ### 1.2 왜 이 구조인가 (위 제약 하나하나에 어떻게 답하는가)
    ### 1.3 이 설계가 틀릴 수 있는 곳 셋 (각각 어떻게 확인할 것인가 — 재는 방법을 구체적으로)
    ### 1.4 하지 않을 것과 이유
    ### 1.5 스스로 가장 약하다고 보는 결정 하나

## 2. 기획서 v0.2 의 사실 전제 검증표
네 배정 파일(grok 은 웹)에서 확인할 수 있는 기획서의 사실 주장을 **하나씩** 표로. 열: 기획서 절 | 주장 (글자 그대로 인용) | 판정 (참 / 거짓 / 확인 못함) | 근거 (파일:줄 또는 URL, 글자 그대로 인용).
**거짓인 전제를 찾는 것이 이 라운드에서 가장 값어치 있는 일이다.** 기획서에는 사실이 틀린 전제가 최소 하나 있다고 가정하고 찾아라. 틀리지 않은 것을 틀렸다고 하지는 마라.

## 3. 네 영역에서 찾은 문제 (심각한 것부터)
항목마다 정확히 이 형식:
    [문제 N] <한 줄 제목>
    어디    <기획서 절 또는 파일:줄>
    무엇을  "<자료에 있는 글자 그대로 인용>"
    왜 문제 <무슨 일이 일어나는가. 수치나 코드에 걸어라>
    고치는 법 <무엇을 빼거나 옮기거나 순서를 바꾸는가>
    확신도  높음/중간/낮음
인용은 반드시 자료에 실제로 있는 글자여야 한다. 통합자가 한 건씩 grep 으로 대조하고, 없는 문장을 인용하면 그 항목 전체를 버린다.

## 4. 네 자료에서만 드러나는 것
다른 둘은 다른 파일을 받았다. **네 파일이라서 보이는 것**이 무엇인가.

## 5. 기획서 §10 결정 8개에 대한 네 답과 한 줄 근거
근거가 네 자료에 없으면 "자료 밖 — 의견" 이라고 표시하라.

[금지] 자료에 없는 문장·수치·파일·API 지어내기. 확인 질문. 저장소 수정. 새 문안 작성(무엇을 바꿀지만). 다른 영역 파일 읽기.
분량 300줄 이내. 한글로.
