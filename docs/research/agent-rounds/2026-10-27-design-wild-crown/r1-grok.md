I'll start by reading the brief, then follow its instructions exactly.Brief assigns me [G]: game experience plus external facts. I’ll read only `PLAN.md`, then verify E1–E8 on the web.공식 원문을 열어 E1–E8을 한 줄씩 대조합니다. 틀린 전제가 있는지가 핵심입니다.E2의 Skill Level과 E5의 v1/v2 혼동, peerDependencies를 원문으로 더 좁혀 확인합니다.검증은 끝났습니다. E5가 기획서가 섞어 쓴 거짓 전제입니다. 아래는 [G] 독립 설계안입니다.

## 0. 모델 이름과 읽은 파일

**모델:** grok (Grok 4.6, xAI) · 영역 **[G]** 게임 경험 + 외부 사실

**연 파일**
- `D:\chess\docs\PLAN.md`

**웹으로 연 원문 (E1–E8)**
- https://jhlywa.github.io/chess.js/
- https://github.com/nmrugg/stockfish.js
- https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html
- https://threejs.org/docs/pages/GLTFLoader.html
- https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/GLTFLoader.js
- https://github.com/pmndrs/postprocessing
- https://raw.githubusercontent.com/pmndrs/postprocessing/main/package.json
- https://github.com/IgorAherne/TRELLIS.2-stableprojectorz/blob/main/README.md
- https://raw.githubusercontent.com/IgorAherne/TRELLIS.2-stableprojectorz/main/LICENSE
- https://github.com/IgorAherne/trellis-stable-projectorz
- https://github.com/VAST-AI-Research/UniRig
- https://raw.githubusercontent.com/VAST-AI-Research/UniRig/main/LICENSE
- https://huggingface.co/VAST-AI/UniRig
- https://poly.pizza/bundle/Animated-Animal-Pack-ILAPXeUYiS
- https://poly.pizza/bundle/Farm-Animal-Pack-1kUvRTPLzT
- https://threejs.org/docs/pages/WebGPURenderer.html
- https://raw.githubusercontent.com/mrdoob/three.js/dev/src/renderers/webgpu/WebGPURenderer.js

---

## 1. [G] 독립 설계안

### 1.1 구조 (모듈·경계·데이터 흐름)

세 층만 둔다. 규칙은 렌더를 모르고, 연출은 FEN을 모른다.

1. **규칙 층** `chess.js` 하나. FEN으로 국면을 싣고, 합법수·체크·3회 반복·50수·PGN을 여기서만 판정한다. 엔진 파일에 규칙 분기를 다시 쓰지 않는다.
2. **상대 층** Stockfish **lite-single WASM**을 `Worker`로. 화면 스레드는 UCI 문자열만 보낸다. 난이도는 `Skill Level`(0–20) + `go depth`/`movetime` + (선택) `UCI_LimitStrength`/`UCI_Elo`. 기본 엔진은 lite-single(~1.7MB). 풀 엔진(~94MB, COOP/COEP 필요)은 옵션.
3. **경험 층** 팩 매니페스트 → 기물 메시·클립·이펙트·SFX. 공식 팩과 사진 스킨이 같은 JSON 스키마.

데이터 흐름: 입력 → 합법수 하이라이트 → `chess.js.move` → 연출 큐(이동/사냥/승급/왕관) → FEN 갱신 → (AI 차례면) 워커 `position fen` + `go`.

출시 경험의 뼈대:
- **백 = 사바나(사자 왕), 흑 = 밀림(호랑이 왕).** 색은 틴트가 아니라 종·팔레트·바이옴으로 가른다.
- **잡기 = 사냥.** 피·사체 없음. 잡힌 기물은 진영색 파티클로 흩어진다.
- **메이트 = 왕관이 이긴 킹 머리로 옮겨진다.**
- **폰 승급 = 성장 실루엣 1.5~2초.**
- **스킨:** 출시 후 사진 1장 → 로컬 생성 큐 → `custom/` 슬롯. 출시 빌드는 공식 팩만.

기물(사용자 제안 + 움직임 일치):

| 기물 | 백 | 흑 | 이유 |
| :--- | :--- | :--- | :--- |
| 킹 | 사자 | 호랑이 | 사용자 제안, 라이벌 |
| 퀸 | 암사자 | 표범 | 판에서 가장 넓게 사냥 |
| 룩 | 코끼리 | 코뿔소 | 직선 돌진 |
| 나이트 | 가젤/임팔라 | 사슴 | L자 = 도약 |
| 비숍 | 얼룩말 | 기린 | 사용자 제안(비숍=얼룩말)을 1팩에 살린다 |
| 폰 | 미어캣 | 토끼 | 초식·줄 서서 망보기 |

집콕 팩(강아지 킹, 고양이 퀸)은 출시 다음. 대성당은 「클래식」 4번째 팩으로 남긴다.

렌더: **WebGL + `postprocessing`(bloom·갓레이).** WebGPU는 폴백이 있어도 GLSL `ShaderMaterial`을 그대로 못 가져가므로 이후 단계.

### 1.2 왜 이 구조인가

- **1인 + 주 15~20시간:** 규칙·AI는 라이브러리, 창작은 사냥 연출·팩·사운드에만 쓴다.
- **RTX 4060 8GB / C: 6.8GB:** 생성은 D: 큐. 브라우저 AI는 lite-single. 풀 엔진·멀티스레드 WASM은 헤더·용량 때문에 기본에서 뺀다.
- **라이선스:** 기물은 poly.pizza CC0만. Stockfish 엔진은 **GPL-3.0**이라 동적 로드 + `COPYING` 고지. chess.js는 규칙만.
- **사용자 네 가지:** 고전 재해석 = 규칙 원형 + 동물 왕국 연출. 킹=사자. 비숍=얼룩말을 1.0에 넣는다. 커스텀 스킨은 팩 스키마로 나중에. 이펙트는 사냥 6종 + 왕관 + 바이옴 대기.
- **현재 안을 유지할 이유:** 규칙·AI·팩 경계는 이 구조와 같다. 바꿀 것은 URL 혼동·GPL·난이도 과장·1.0 기물 범위다.

### 1.3 이 설계가 틀릴 수 있는 곳 셋

1. **Stockfish `Skill Level` 1–3이 “폰을 던지는” 어린이용이 아니다.** 확인: lite-single 워커에 `uci` → 옵션 목록에 `Skill Level`이 있는지 캡처. 같은 오프닝 10국을 Level 0 / 10 / 20 + `go depth 8`로 두고 블런더율·평균 손실(cp)을 잰다. 약하면 `UCI_Elo` 1320 + `movetime` 캡을 어린이 난이도로 쓴다.
2. **8GB PC에서 게임과 TRELLIS 큐가 같이 못 돈다.** 확인: 체스 탭 연 채로 생성 1건. `nvidia-smi`로 피크 VRAM·프레임. 충돌이면 생성은 밤 큐 전용, 공방은 “내일 아침 수령”.
3. **CC0 공여 리그에 사자·코끼리·기린이 없다.** poly.pizza Animated Pack은 소·당나귀·사슴·알파카·황소·여우·시바·수사슴·허스키·늑대·말, Farm은 라마·돼지·퍼그·양·말·소·얼룩말. 확인: 공여 GLB 1종을 사자 메시에 입힌 뒤 Idle/Walk/Attack 3프레임. 관절이 접히면 그 종은 절차 애니로 내리거나 팩에서 뺀다.

### 1.4 하지 않을 것과 이유

- **출시 팩에 코브라 절차 리그.** 사족·두 발·절차 세 재생기를 동시에 열면 안무·매니페스트·테스트가 세 갈래다. 밀림 비숍은 기린 또는 앵무(두 발)로 간다.
- **피·사체·사실 해부.** 스토어·아동 난이도와 안 맞는다. 혼 파티클로 충분하다.
- **Phase 0에서 WebGPU.** 폴백은 WebGL2 백엔드이지 GLSL 셰이더 호환이 아니다.
- **풀 Stockfish 94MB를 첫 로딩에.** 15MB 예산과 COOP/COEP를 깬다.
- **지금 집콕 팩 + 사진 공방을 사바나와 같은 주에.** 데모는 사자 킹 사냥 한 수.

### 1.5 스스로 가장 약하다고 보는 결정 하나

**비숍=얼룩말을 1.0에 남긴 것.** 말 골격이라 나이트 도약이 더 맞고, Farm에 얼룩말 원본이 있어 나이트가 더 빨리 나온다. 사용자 문장을 지키려고 대각선 자리에 두었으나, 첫 영상이 “얼룩말이 L자로 뛰어넘지 못하는” 장면이면 세계관이 먼저 흔들린다. 확인은 플레이테스트 5판에서 “이 동물이 그 움직임이냐” 한 줄 설문.

---

## 2. 기획서 v0.2 사실 전제 검증표

| 절 | 주장 (글자 그대로) | 판정 | 근거 |
| :--- | :--- | :--- | :--- |
| E1 / §4.1·§7 | `chess.js` 가 3회 반복·50수 규칙·FEN·PGN 을 제공한다 | **참** | https://jhlywa.github.io/chess.js/ — `.isThreefoldRepetition()` “current board position has occurred three or more times”; `.isDrawByFiftyMoves()` “drawn by 50-move rule”; `.fen()`; `.load(fen)`; `.loadPgn(pgn)`; `.pgn()` |
| E2 / §4.5 | Stockfish WASM + Web Worker + `Skill Level` UCI | **참** (범위는 과장) | https://github.com/nmrugg/stockfish.js — “var worker = new Worker("stockfish-19-lite-single.js")”; “WASM implementation”. https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html — `option name Skill Level type spin default 20 min 0 max 20`. **같은 README:** “Stockfish.js engine code is GPL v3” |
| E3 / §4.2 | r185 `GLTFLoader` 가 `EXT_meshopt_compression` 과 `EXT_texture_webp` 를 읽는다 | **참** (디코더 필수) | https://threejs.org/docs/pages/GLTFLoader.html — 확장 목록에 둘 다. `setMeshoptDecoder`: “Required for decoding assets compressed with the `EXT_meshopt_compression` extension.” |
| E4 / §4.1·§3.3 | `postprocessing` 이 r185와 호환, bloom·SSAO·갓레이 | **참** | https://raw.githubusercontent.com/pmndrs/postprocessing/main/package.json — `"peerDependencies": { "three": ">= 0.168.0 < 0.187.0" }` (0.185 포함). README Included Effects: Bloom, God Rays, SSAO. Usage는 `WebGLRenderer` |
| E5 / 참고자료 | IgorAherne/TRELLIS.2-stableprojectorz 가 MIT 이고 **TRELLIS v1 fp16 모드**가 있다 | **거짓** | LICENSE는 MIT (“Copyright (c) Microsoft Corporation”). README 제목은 **TRELLIS.2** “4B parameters”. v1 fp16은 **다른 저장소** https://github.com/IgorAherne/trellis-stable-projectorz — “I've added support for `float16` instead of `float32`” · `python main_gradio.py --precision half`. 기획서 §1.2는 `trellis-stable-projectorz v40`, 참고자료 URL은 TRELLIS.2. **두 제품을 한 저장소로 적었다.** |
| E6 / §5.3 | UniRig 코드 MIT, 사족 지원, 체크포인트 라이선스 별도 | **참** | https://raw.githubusercontent.com/VAST-AI-Research/UniRig/main/LICENSE — “MIT License”. README: “humans, animals, objects”; `examples/giraffe.glb`. HF 카드 `license: mit` (코드와 **별 파일**, 둘 다 MIT). Articulation-XL2.0 데이터셋 라이선스는 **확인 못함** |
| E7 / §1.2·§11 | Quaternius 동물 팩이 poly.pizza 에서 CC0 | **참** | https://poly.pizza/bundle/Animated-Animal-Pack-ILAPXeUYiS — “Licence: Public Domain (CC0)”. Farm Pack도 CC0, Zebra 포함 |
| E8 / §4.2·§9 Phase 6 | `WebGPURenderer` 가 WebGL 폴백을 갖는다 | **참** | https://raw.githubusercontent.com/mrdoob/three.js/dev/src/renderers/webgpu/WebGPURenderer.js — “If not, `WebGPURenderer` falls backs to a WebGL 2 backend.” `forceWebGL` / `getFallback` → `WebGLBackend` |
| §2.2 | “실제 사냥은 암사자가 한다” | **참** (단순화) | 사자 프라이드에서 암컷이 주된 집단 사냥을 한다. 수컷도 큰 사냥감에 가담한다. 퀸 은유로는 성립 |
| §4.5 | “난이도 1~10 = Skill Level + 깊이 + 실수 확률. 1~3 은 어린이용(폰을 던진다)” | **거짓** | UCI `Skill Level`은 **0–20**. “폰을 던진다” API는 없다. Level 1–19는 깊이·시간 제한 없이 체감이 비슷하다는 보고가 있다 (Stockfish #4431). 어린이 난이도는 Elo/노드 캡이 필요하다 |
| §4.2 | “r170→r185 는 WebGL 경로에서 큰 파손이 없다” | **확인 못함** | 웹 문서만으로는 이 저장소 GLSL 5개를 검증할 수 없다. 가설 |
| §9 | Phase 0 1주 · Phase 1 3일 | **확인 못함** | 외부 사실 아님. 주 15–20시간이면 Phase 0은 r185+분해+chess.js+GPL 워커+CI |

---

## 3. [G]에서 찾은 문제 (심각한 것부터)

**[문제 1] TRELLIS v1과 TRELLIS.2 저장소를 한 줄로 섞었다**  
어디    참고 자료 + §1.2 + §5.3  
무엇을  “TRELLIS 로컬 서버 원본: https://github.com/IgorAherne/TRELLIS.2-stableprojectorz” / “IgorAherne/trellis-stable-projectorz v40 · MIT” / “로컬 TRELLIS v1 fp16 … 돌아간다”  
왜 문제 TRELLIS.2 README는 4B·공식 하드웨어 “at least 24GB”. v1 fp16 8GB는 `trellis-stable-projectorz`의 `--precision half`. Phase 1이 잘못된 레포를 클론하면 8GB에서 안 뜨거나 파이프라인이 바뀐다.  
고치는 법 참고 URL을 `trellis-stable-projectorz`로 고친다. TRELLIS.2는 HF 품질 경로(§1.2 `run_trellis2.py`)로만 적는다.  
확신도  높음

**[문제 2] Stockfish를 넣으면 엔진이 GPL-3.0이다. §11 라이선스 표에 없다**  
어디    §4.5 · §9 Phase 0 · §11  
무엇을  “`chooseSmartAIMove` → **Stockfish WASM** (Web Worker)”  
왜 문제 nmrugg/stockfish.js: “engine code is GPL v3 (see Copying.txt). The published npm package is licensed under GPL-3.0 because it contains the engine.” 웹에 `.wasm`을 실으면 고지·소스 제공 의무가 생긴다. 앱 전체를 MIT/독점으로 두기 어렵다.  
고치는 법 Phase 0에 `COPYING`·동적 로드·라이선스 페이지를 완료 조건으로 넣는다. 번들 GPL이 싫으면 서버 AI 또는 휴리스틱 유지.  
확신도  높음

**[문제 3] 난이도 1–10 = Skill Level, 1–3은 “폰을 던진다”**  
어디    §4.5  
무엇을  “난이도 1~10 = Skill Level + 깊이 + 실수 확률. 1~3 은 어린이용(폰을 던진다)”  
왜 문제 Skill Level은 0–20. 약화는 MultiPV로 약한 수를 고르는 것이지 폰 실수 전용이 아니다. 출시 카피가 거짓이 된다.  
고치는 법 표: 1–3 = `UCI_Elo` 1320 + depth 3–4 + movetime 캡. 4–7 = Skill 10 + depth. 8–10 = Skill 20. 카피에서 “폰을 던진다” 삭제.  
확신도  높음

**[문제 4] 출시 경험에 리그 종류가 셋 + 코브라**  
어디    §2.2 · §4.3 · §9 Phase 3  
무엇을  “코브라: **절차 애니메이션**” / “`rig` 가 셋 중 하나: `animal46` · `biped15` · `procedural`”  
왜 문제 안무·클립 매핑·에셋 게이트가 세 갈래. Phase 3 완료 조건이 “§3 전부”라 사운드 0개·시간 변화·갓레이·왕관까지 한 묶음이다. 주 15–20시간 × 3주로는 밀린다.  
고치는 법 사바나 6종은 사족만. 미어캣은 Phase 2 끝 또는 토끼로 대체. 코브라는 Phase 4 공방 시험으로 미룬다. Phase 3 완료를 “밀림 6종 + 사냥 이펙트 3종 + 왕관”으로 줄인다.  
확신도  중간

**[문제 5] meshopt GLB는 로더에 디코더를 안 물리면 안 읽힌다**  
어디    §4.2 · §5.1  
무엇을  “study-game 의 meshopt/WebP GLB 그대로 읽게” / “pack-statue.mjs … meshopt 양자화 + WebP”  
왜 문제 공식 문서: `setMeshoptDecoder`가 EXT_meshopt에 **Required**. r185만 올린다고 되는 일이 아니다.  
고치는 법 Phase 0 로더에 `MeshoptDecoder` 연결을 완료 조건으로. 테스트 GLB 한 개로 게이트.  
확신도  높음

**[문제 6] WebGPU 폴백을 Phase 6 안전망으로 적었으나 GLSL 5개는 그대로 못 간다**  
어디    §4.2 · §9 Phase 6  
무엇을  “WebGPU/TSL 은 Phase 6. 지금 전환하면 기존 GLSL 셰이더 5개를 즉시 다시 써야”  
왜 문제 폴백은 `WebGLBackend`다. 이슈 #28957: `ShaderMaterial` / `RawShaderMaterial`은 WebGPURenderer 경로에서 지원하지 않는다. 연기 판단은 맞다. “폴백이 있으니 나중에 한 줄”은 틀리다.  
고치는 법 Phase 6 완료 조건에 TSL 재작성·`forceWebGL: true` 시각 비교를 명시. pmndrs `postprocessing`은 WebGLRenderer 전제라 WebGPU 전환 시 교체 대상을 적는다.  
확신도  중간

**[문제 7] 바이옴 예산이 경험의 완료 조건인데 측정이 없다**  
어디    §3.3 · §4.4 · §9 Phase 2–3  
무엇을  “`InstancedMesh` 20,000개” / “혼 400 + 먼지 2000 + 반딧불 500” / “중급 노트북 60fps”  
왜 문제 32 스키닝 + 풀 2만 + 파티클 + bloom/SSAO/갓레이를 4060 8GB 노트북 60fps에 동시에 올리는 숫자는 웹에 근거가 없다. Phase 2 완료가 “풀 게임 60fps”라 바이옴이 기물을 막는다.  
고치는 법 풀 2만은 옵션. 기본 2천. SSAO는 중급 기본 끄기. 성능 게이트(§7)를 Phase 2 입장 조건으로 앞당긴다.  
확신도  중간

---

## 4. 네 자료에서만 드러나는 것

다른 둘은 엔진 소스·GLB 실측을 받았다. 이쪽은 **공식 README·LICENSE·UCI·peerDependencies**다.

- chess.js가 3회·50수·FEN·PGN을 **실제로** 제공한다 (E1 참).
- Stockfish.js는 Worker+WASM이 맞고, Skill Level도 있으나 엔진은 **GPL-3.0**, 풀 빌드는 **~94MB + cross-origin isolation**, 권장은 lite-single **~1.7MB**.
- `postprocessing` 6.39.5는 three **≥0.168 <0.187** — r185는 안에 있다. bloom/SSAO/갓레이는 목록에 있다.
- TRELLIS.2-stableprojectorz ≠ v1 fp16. 기획서 하단 URL이 잘못된 제품이다.
- UniRig는 giraffe 예시로 사족을 보여주고 코드·HF 체크포인트 모두 MIT 표기.
- poly.pizza Animated/Farm 팩이 CC0. **사자·호랑이·코끼리·기린·미어캣·코브라는 그 목록에 없다.** 얼룩말·말·사슴·개과만 공여로 확실하다.
- WebGPURenderer 폴백은 소스 주석으로 확인된다. `ShaderMaterial` 호환은 그 문장에 없다.

---

## 5. §10 결정 8개

| # | 답 | 근거 |
| :--- | :--- | :--- |
| 1 얼룩말 자리 | **나이트** | Farm Pack에 Zebra CC0 원본. 말과 골격이 같다. 사용자 비숍안은 1.5 스킨으로. 자료: poly.pizza Farm Pack |
| 2 밀림 비숍 | **앵무(`biped`) 또는 기린. 코브라 미룸** | 절차 리그를 출시 완료 조건에서 뺀다. UniRig 기린 예시는 사족 쪽. 자료 밖 일부 — 의견 |
| 3 대성당 | **남긴다 (클래식 4번째 팩)** | 사용자 요청 “클래식한 고전게임을 현대식으로”. 자료 밖 — 의견 |
| 4 커스텀 비용 | **로컬 큐 하루 N회 무료 유지** | 같은 8GB에서 게임과 생성을 동시에 돌리지 말 것(§1.3). 자료 밖 — 의견 |
| 5 tri-agent-review | **예 (진행 중)** | 이 라운드가 그 작업. |
| 6 이름 WILD CROWN | **유지** | 왕관 계승 메이트와 맞다. 자료 밖 — 의견 |
| 7 화풍 | **§5.2 “라이온킹(2019)과 픽사 사이”를 §10-7보다 우선** | 사용자 원문이 “아주 디테일하고 멋있게”. 조각상 chunky만 고르면 요청과 어긋난다. TRELLIS 안정은 프롬프트 고정으로 푼다. 자료 밖 — 의견 |
| 8 도구 복사 vs 참조 | **복사 (`D:\chess\tools\`)** | 기획서 추천과 같음. study-game이 바뀌어도 체스 팩이 안 깨진다. |

**유지할 것:** 사바나/밀림 왕국, 사냥=잡기, 왕관 계승, 팩 매니페스트, chess.js, Stockfish는 **lite-single + GPL 고지**, WebGL+postprocessing, WebGPU 연기, Quaternius는 poly.pizza CC0만.

**바꿀 것:** 참고 URL을 v1 저장소로. 난이도 표. Phase 3에서 코브라·§3 전부 묶음 해제. meshopt 디코더를 Phase 0 완료 조건에.
EXIT=0 
