# WILD CROWN — 야생의 왕관
### 고전 체스의 현대적 재해석 · 동물 왕국 3D 체스 기획서

> 작성일 2026-10-27 · **v0.4** (2026-10-28) · 기반 저장소 `alarmpet/chess` (wizard-chess-3d)
> v0.2 → v0.3: `tri-agent-review --design` 라운드(agy · grok · codex + 통합자 실측) 결과 반영. **v0.2 의 사실 전제 6개가 거짓**이었다(그중 4개는 통합자 오류). 라운드 원문·대조표: `docs/research/agent-rounds/2026-10-27-design-wild-crown/README.md`.
> v0.3 → v0.4: 사용자 요청(대전·등급·코인·상점·착용)으로 **§12 메타게임** 신설. 2차 라운드 결과 — 셋 다 "랭크는 외형만" 유지, 가챠 금지, Phase 5 분할. 라운드 기록: `docs/research/agent-rounds/2026-10-28-meta-wild-crown/README.md`.
> 상태: 검토 완료 초안. §10 결정에 답하면 v1.0.

---

## 0. 한 줄 요약

> 사자가 다스리는 **사바나 왕국**과 호랑이가 다스리는 **밀림 왕국**이 체스판 위에서 맞붙는다.
> 기물은 전부 동물, 잡을 때는 사냥 연출, 승리하면 왕관이 넘어간다.
> 그리고 **내 반려견을 킹으로 만들 수 있다.**

두 저장소를 합친다.
- **`D:\chess`** — 돌아가는 체스: 규칙 · 근접 격투 안무 · 공격 키프레임 동기화 · 카메라 · 체크메이트 시퀀스.
- **`D:\study-game`** — 돌아가는 에셋 공장: Flow 콘셉트 → 로컬 TRELLIS → Blender 굽기·리그 이전 → 압축 → three.js. 리그 동물 원본 12종, 실측 함정 기록.

---

## 1. 재사용 자산 — 실측 기준 (라운드에서 대조 완료)

### 1.1 `D:\chess` (체스 본체)

| 자산 | 위치 (`src/wizardChessEngine.js`) | 처분 · 주의 |
| :--- | :--- | :--- |
| 체스 규칙 | 1795~1976행 | **앙파상 없음(grep 0건) · 승급은 퀸 고정(`:2498`)** → `chess.js` 로 교체 (§4.5) |
| **공격 키프레임 동기화** `ATTACK_SYNC_PROFILES` | `:1582` | 값은 **초 단위 클립 시각**이다 (`:2444` `tApproach + CONTACT_CLIP_TIME / timeScale`, `:2620` `atkClipTime < CONTACT_CLIP_TIME`). ~~비율~~ ← v0.2 오류. 동물 클립도 접촉 시각을 **초**로 재서 적는다 |
| 근접 안무 · 공격 카메라 (`executeChessMove` `:2072`, `stepMove` `:2526`) | | 유지. 단 `MELEE_STANDOFF = 0.36`(`:2067`)은 **검 길이 상수** → 기물별 `standoff` 로 매니페스트화 |
| 클립 재생 `playPieceClip` | `:1591~1598` | **이름 부분 문자열 검색**. `'Move'`·`'Shatter'` 요청은 동물 클립 `Walk`·`HitReact` 에 매치되지 않는다 → **역할→클립 어댑터**가 Phase 1 전제 (codex) |
| 기물 인스턴스화 `instantiatePiece` | `:1511~1534` | 백 템플릿을 흑도 공유(`:1416`)하고 재질을 단색으로 덮는다(`:1534` `child.material = primaryMat`) → **동물 팩은 원본 재질 유지**, 석상 팩에만 교체 적용 |
| 파편 (`spawnStoneShatter` `:2020`) | | 공유 **지오메트리** + `Mesh` 32개 (~~공유 VBO~~). 400개로 늘리면 Mesh 400개 → 혼 효과는 `Points`/`InstancedMesh` 로 **별도 구현** |
| 킹 전도 (`:3573~3591`) | | 클립이 아니라 **쿼터니언 기울임** → 왕관 계승은 새 안무 |
| 스냅샷 (`:1677`) | | `type·color·hasMoved` 만 → 규칙 엔진 이력을 정본으로 |
| 카메라 프리셋 · 자유 비행 (`:4166~`) · i18n | | 유지 |
| 멀티플레이 (`:3824~4110`) | `CLOUD_MP_API_BASE = ''`(`:3824`) · 서버 코드 없음 → `localStorage`+`BroadcastChannel` 폴백 = **같은 브라우저 탭끼리만**. HUD 에서 제거(`test/applet.test.mjs:38-40` 금지) | 전송층 **폐기**, 수신 애니메이션 큐 `tryApplyNext`(`:3957~3979`, `fromRemote`) 만 유지 → §12.1 (agy) |
| `window.wizardChess.stepBy` (`:4699`) | | **수동 프레임 진행** — 결정적 테스트에 쓴다 (codex 발견) |
| GLB 로더 (`.glb.gz.b64`, `:1164`) | | 교체. **three r170 의 GLTFLoader 가 `EXT_texture_webp`·`KHR_mesh_quantization`·`EXT_meshopt_compression` 을 이미 읽는다** → ~~r185 업그레이드~~ 불필요 (v0.2 오류) |

### 1.2 `D:\study-game` (에셋 공장)

**도구** (`tools/legend/`, 스킬 `ai-3d-asset-remaster` · `trellis-local-ops`) — 체스용으로 **복사 후 개조**(§10-8)

| 도구 | 실측 | 체스용 개조 (라운드에서 확인된 결함) |
| :--- | :--- | :--- |
| 로컬 TRELLIS v1 fp16 `D:\trellis-local\app` (**IgorAherne/trellis-stable-projectorz**, `run-fp16.bat` = `--precision half`) | RTX 4060 8GB · 1장 92~352초 · 피크 7,840MiB | 그대로. (v0.2 참고 URL 이 TRELLIS.2 저장소였음 — 오류) |
| `run_trellis2.py` (HF TRELLIS.2) | 25분/일 | 품질 우선 시 |
| `upgrade_runner.py` + 큐 | best-of-3 · 가드 · 밤 일괄 | 그대로 |
| **`rig_transfer.py`** (132줄) | 공여 리그 가중치 → 새 메시, 클립 유지. 종 하드코딩 없음 | `:122` 확인 렌더 라벨에 **`attack` 추가** |
| `bake_low.py` | 고폴리 → 저폴리 굽기 | `:114` **JPEG 내보내기 → PNG/무손실** (노멀맵 손상 방지) · TRIS/TEX 인자 상향 |
| `biped_rig.py` | 두 발 자동 리깅 | 클립 **Idle·Walk·Run·Sit·Cheer 5개뿐** · `FOOT_Y=-0.5`(카트 규격) → **FOOT_Y=0 + Attack/Hit/Kneel 3클립 추가** |
| `pack-statue.mjs` | meshoptimizer **감량** + `KHR_mesh_quantization` + WebP (~~meshopt 압축~~) | `:35` 비색상 텍스처 **512 강제** → `pack-chess.mjs` 분기: 색 1024 WebP · 노멀 1024 무손실 |
| `render_vc.py` · `thickness.py` | YAW·눌림 판정 | 그대로 |

**폐기 확정**: Blender Decimate · 복셀 리메시 · 새 UV 굽기 · 다중 뷰 콘셉트 · 후면 뷰.

**리그 공여자 — `tools/assets/packs_src/quaternius_animals/` (poly.pizza CC0 · 12종, 통합자 실측)**

| 공여 | 본 | 공격 클립 | 공통 클립 | 체스 배정 |
| :--- | ---: | :--- | :--- | :--- |
| Wolf · Husky · ShibaInu · Fox | 46~51 | `Attack` | Death · Eating · Gallop · Gallop_Jump · Idle · Idle_2 · Idle_HeadLow · HitReact L/R · Jump_ToIdle · Walk | 킹·퀸(고양잇과) · 집콕 팩 개 |
| Horse ×2 · Donkey | 50 | `Attack_Headbutt` · `Attack_Kick` | 〃 | **나이트 얼룩말** · 룩 코끼리(덩치) |
| Deer · Stag | 46 / 38 | 〃 | 〃 | **나이트 사슴** · 임시 폰 임팔라 |
| Cow ×2 | 42 | 〃 | 〃 | **룩 코뿔소**(박치기) |
| **Alpaca** | 46 | 〃 | 〃 | **비숍 기린 1순위 후보** (목이 긴 유일한 공여) |

farm 팩(Cow·Horse·Zebra 28본)은 **Attack 이 없다**(agy) → 쓰지 않는다. `assets/packs/pk_*.glb` 는 본이 벗겨진 사본.
`assets/char_*.glb` 로스터는 개·고양이 품종만 46본(Attack 없음, 9클립), 나머지는 15본 biped — 공여로 쓰지 않는다.

**기타 자산**: `legend/` 조각상 13종(5.2만 tri · 리그 없음 · 콘셉트 재료) · `legend/cards/` 콘셉트 이미지 · `char-renders/` 품종 렌더(집콕 팩).

**팀** (`docs/workflow/delegation.md` · `tools/team/consult.py`): Codex luna/sol(주·대조) · SPARK(검증) · agy(에셋·발상 23/24) · grok(웹 사실 검증 — 이번 라운드에서 가장 정확했다).

---

## 2. 세계관 · 기물

### 2.1 두 왕국

| | **사바나 왕국** (백) | **밀림 왕국** (흑) |
| :--- | :--- | :--- |
| 색 | 황금빛 · 상아색 · 노을 | 심녹색 · 흑단 · 달빛 |
| 지형 | 바오밥 · 마른 풀 · 모래 먼지 | 덩굴 · 이끼 · 안개 · 반딧불 |
| 체크 사운드 | 사자 포효 | 호랑이 으르렁 |

### 2.2 기물 배정 — 「움직임이 곧 동물」 + 공여 리그

| 기물 | 움직임 | 사바나 | 밀림 | 공여 리그 | 이유 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 킹 | 1칸 | 🦁 사자 | 🐯 호랑이 | Wolf (`Attack`) | 라이벌 |
| 퀸 | 무제한 | 🦁 암사자 | 🐆 흑표범 | Fox (`Attack`, 날렵) | 실제 사냥은 암사자 |
| 룩 | 직선 | 🐘 코끼리 | 🦏 코뿔소 | Donkey / Cow (`Attack_Headbutt`) | 돌진하는 거체 |
| 나이트 | L자 | 🦓 얼룩말 | 🦌 사슴 | Horse / Deer (`Attack_Kick`) | 말 골격 = 도약 |
| 비숍 | 대각선 | 🦒 기린 | 🦜 **앵무새** (v0.2 코브라 → Phase 4 로) | Alpaca → 안 되면 UniRig / biped 보강 | 멀리 본다 / 두 발 |
| 폰 | 1칸·승급 | 🦦 미어캣 | 🐰 토끼 | biped 보강 / Fox | 망보는 미어캣 = 폰 줄 |

> **코브라**는 출시 팩에서 뺐다. 절차 재생기를 셋째 종류로 열면 안무·매니페스트·테스트가 세 갈래가 된다(grok·Claude). Phase 4 「AI 스킨 공방」이 어차피 절차 재생기를 만들므로 그때 시험 기물로 넣는다.
> **미어캣**은 `biped_rig.py` 보강(FOOT_Y=0 · Attack/Hit/Kneel 3클립, 1회 작업)이 끝나야 들어온다. 보강 전 임시 폰 = 임팔라(Deer 공여).
> **기린·코끼리**는 공여 리그에 코·긴 목 뼈가 없다. Alpaca·Donkey 로 시도하고 안 되면 UniRig(MIT, 저장소에 `examples/giraffe.glb` 있음 — grok 확인).

### 2.3 집콕 왕국 (3번째 팩) · 2.4 승급 연출 — v0.2 와 같음

---

## 3. 핵심 경험 — v0.2 와 같되 수치 보정

- **3.1 잡기**: 동물별 사냥 모션 + 혼 흩어짐. 혼 파티클은 **`Points`/`InstancedMesh` 로 새로 구현**(기존 파편 구조는 Mesh 32개). 접촉 시각은 공여 클립마다 `render_vc.py` 3프레임 렌더로 재서 **초**로 매니페스트에.
- **3.2 체크·메이트**: `HitReact` 경계 · 왕관 계승(새 안무 — 기존 전도는 메시 기울임) · 스테일메이트 `Eating`.
- **3.3 바이옴**: 풀 **기본 2,000 · 옵션 20,000** (grok: 60fps 근거 없음) · SSAO 는 중급 기본 끔 · 성능 게이트를 **Phase 2 입장 조건**으로.
- **3.4 대기 모션**: `Idle`·`Idle_2`·`HeadLow`·`Eating` 전환 — 공여 클립에 전부 있다.
- **3.5 사운드**: CC0 + `CREDITS.md`.

---

## 4. 기술 아키텍처

### 4.1 목표 구조 — v0.2 와 같음 (`engine/` `scene/` `pieces/` `vfx/` `audio/` `skins/` `ui/` · `public/packs/`)

**이전 순서 (codex)**: ① 규칙 상태 ↔ 화면 상태 경계 ② 역할→클립 어댑터 + 팩 로더 ③ AI 워커 ④ 효과. 규칙은 **안무 전에 확정**하고 화면은 투영 — 되돌리기·리플레이·멀티플레이가 같은 이력을 본다.

### 4.2 렌더링 — **three r170 유지**, WebGL + `postprocessing`

- r170 GLTFLoader 가 study-game GLB(WebP + 양자화)를 이미 읽는다. 업그레이드는 필요 없다 (실측).
- `postprocessing` 6.39.5 peer `three >=0.168 <0.187` — r170 호환 (npm 확인).
- WebGPU 는 Phase 6. 폴백은 있으나 `ShaderMaterial`(`:561`·`:700`) 과 `onBeforeCompile`(`:1010`) 은 그대로 못 간다 → TSL 재작성 비용을 Phase 6 완료 조건에 명시.

### 4.3 팩 매니페스트 — 역할→클립 어댑터 포함

```json
{
  "id": "savanna", "name": { "ko": "사바나 왕국", "en": "Savanna Kingdom" },
  "biome": "savanna", "palette": { "primary": "#d4a24c", "soul": "#ffd27a" },
  "pieces": {
    "king": {
      "model": "lion.glb", "scale": 1.0, "rig": "animal", "keepMaterials": true,
      "clips": { "idle": ["Idle", "Idle_2"], "move": "Walk", "charge": "Gallop", "attack": "Attack",
                 "hit": "Idle_HitReact_Left", "victory": "Jump_ToIdle", "kneel": "Death", "bored": "Eating" },
      "attackSync": { "timeScale": 1.10, "swingStartSec": 0.34, "contactSec": 0.56, "blowSec": 0.75,
                      "maxLunge": 0.080, "standoff": 0.22 },
      "vfx": { "attack": "roar", "move": "dust" }, "sfx": { "attack": "lion_roar.ogg" }
    },
    "pawn": { "model": "meerkat.glb", "rig": "biped", "clips": { "idle": ["Idle"], "move": "Walk", "attack": "Attack", "hit": "Hit", "kneel": "Kneel", "victory": "Cheer" } }
  }
}
```

- `rig`: `animal` | `biped` 두 종류만 (출시). `procedural` 은 Phase 4.
- `attackSync` 단위는 **초**(`*Sec`). `standoff` 는 기물별 접근 정지 거리 (검 0.36 → 앞발/박치기 0.15~0.25, 실측).
- `keepMaterials: true` 면 `instantiatePiece` 의 재질 교체를 건너뛴다.
- 역할 이름(idle·move·charge·attack·hit·victory·kneel·bored)은 고정, 클립 이름은 팩이 매핑. **없는 역할은 매니페스트 lint 가 거부**한다.

### 4.4 성능 예산 — v0.2 와 같되 **드로우콜 ≤ 40 은 측정 전 가설** (`SkeletonUtils.clone` 이 기물마다 별도 인스턴스). Phase 1 에서 `renderer.info.render.calls` 실측.

### 4.5 AI · 규칙 — 라이선스와 난이도 보정

- **`chess.js` 1.4.0 (BSD-2)**: `isThreefoldRepetition()` · `isDrawByFiftyMoves()` · FEN · PGN 제공 (grok 확인). 앙파상·승급 선택이 생긴다.
- **Stockfish — `stockfish` npm 19.0.1 은 GPL-3.0** (엔진 포함, 205MB). **lite-single ≈1.7MB** 만 동적 로드, 멀티스레드(COOP/COEP 필요)는 쓰지 않는다. `COPYING` 고지 + 라이선스 페이지가 Phase 0b 완료 조건. 번들 GPL 이 싫으면 기존 휴리스틱 유지.
- **난이도 1~10** (v0.2 "폰을 던진다" 삭제):

| 단계 | 설정 | 근거 |
| :--- | :--- | :--- |
| 1~3 | `UCI_LimitStrength true` + `UCI_Elo 1320` + `go depth 3~4` + movetime 캡 | `UCI_Elo` 최소 1320 (UCI 문서) |
| 4~7 | `Skill Level 5~12` + depth 6~10 | Skill Level 0~20 |
| 8~10 | `Skill Level 20` + movetime | |

- **규칙 회귀 테스트** (codex 보정): 옛 엔진은 앙파상·승급 선택이 없으므로 **공통 지원 국면만** 차등 비교. 앙파상·승급·반복은 별도 국면 사례.

---

## 5. 에셋 파이프라인 — 체스용 사본 (`D:\chess\tools\`)

```
① 콘셉트     Flow — §5.2 스타일 가이드 + legend/cards 참고. 공여 리그의 쉬는 자세와 같은 자세로
② 3D         로컬 TRELLIS v1 (best-of-3 → thickness.py) · render_vc.py yaw 0 · raw.glb 보관
③ 굽기       bake_low.py — TRIS=16000 TEX=1024, 내보내기 PNG (JPEG 금지)
④ 리깅       rig_transfer.py <Quaternius 공여> <baked> <out> — attack 렌더 추가 → 접촉 시각(초)·standoff 측정
⑤ 압축       pack-chess.mjs — 색 1024 WebP q85 · 노멀 1024 무손실 · KHR_mesh_quantization
⑥ 인게임     manifest 등록 → lint(역할 누락 거부) → attackSync 튜닝
```

두 발(미어캣·앵무새·햄스터): ③ 뒤 보강된 `biped_rig.py`. 시간 추정은 v0.2 와 같다(기물당 ≈2시간) + **1회성 도구 개조 ≈1일**(JPEG→PNG · attack 렌더 · pack-chess · biped 보강).

### 5.2 스타일 가이드 — 두 후보를 Phase 1 에서 실측 비교 (§10-7)
- A「조각상 chunky」(agy · Claude): TRELLIS 가 가장 안정. 콘셉트 13종 즉시 재료.
- B「라이온킹(2019)~픽사」(grok): 사용자 원문 "아주 디테일하고 멋있게".
- 사자 1종을 두 프롬프트로 뽑아 체스 카메라 거리에서 비교판 → 사용자가 고른다.

### 5.3 환경 — 실측 완료. 로컬 TRELLIS 돌아감 · Blender 5.2 · D: 전용 · UniRig(MIT, giraffe 예시) 는 기린·코끼리 폴백.

---

## 6. AI 스킨 공방 (Phase 4) — v0.2 와 같음. 절차 재생기(`rig: "procedural"`)는 **여기서 처음** 만든다. 코브라가 그 시험 기물.

## 7. 품질 · 테스트
- 규칙 회귀(공통 국면) · 매니페스트 lint · 에셋 게이트(tri ≤ 16k · 본 ≤ 51 · 역할 전부 매핑 · `unweighted 0` · 텍스처 포맷) · 시각 회귀(Playwright + `wizardChess.stepBy` 로 **결정적 프레임**) · 성능 게이트(`renderer.info` 드로우콜 · p95) · GitHub Actions.

## 8. LLM 협업 — v0.2 와 같음. 이번 라운드 교훈: **codex 에게 "셸 금지"를 쓰지 않는다("읽기 전용 명령만")** · grok 의 웹 사실 검증이 가장 정확했다 · 통합자가 쓴 문서는 통합자가 가장 많이 틀린다 → 설계 라운드는 필수.

---

## 9. 로드맵 (v0.3 — Phase 0 분할, r185 제거)

| Phase | 기간 | 산출물 | 완료 조건 |
| :--- | :--- | :--- | :--- |
| **0a. 경계** | 1주 | 규칙↔화면 경계 · 역할→클립 어댑터 · 팩 로더(WebP/양자화) · `keepMaterials` · 대성당 팩 매니페스트화 | **대성당 버전이 매니페스트 경유로 그대로** 돈다. `stepBy` 결정적 스크린샷 3장 일치 |
| **0b. 규칙·AI·CI** | 1주 | chess.js · Stockfish lite-single 워커(GPL 고지) · 공통 국면 회귀 · GitHub Actions | CI 초록. 난이도 1·5·10 각 10국 블런더율 측정 |
| **1. 파이프라인 검증** | 3~4일 | 도구 개조(1일) + **사자 1종** 화풍 A/B + 접촉 시각·standoff 실측 + 8k/16k 비교판 | 사자가 석상 폰을 Attack 접촉 시각에 맞춰 잡는다. 드로우콜·p95 실측 |
| **2. 사바나 팩** | 2~3주 | 사족 5종 + 임시 폰 임팔라 → biped 보강 후 미어캣 · 바이옴(풀 2천) · 혼 · 포효 | 60fps(성능 게이트 입장 조건) |
| **3. 밀림 팩 + VFX** | 3주 | 6종(앵무새 biped) · 밀림 바이옴 · 이펙트 **3종 + 왕관 계승** (나머지 3종·시간 변화는 3.5) | 데모 영상 |
| **4. 스킨 공방** | 3주 | 절차 재생기 · 집콕 팩 · 사진→기물 · 코브라 시험 | 테스터 5명 |
| **5a. 초대 대전** | 2주 | Supabase Realtime 방 코드·초대 링크 · 양측 chess.js 심판 · 이탈 타임아웃 · PGN · 튜토리얼 · 모바일 | 다른 기기 두 대에서 한 판 완주 · 이탈 시 60초 안에 몰수 처리 |
| **5b. 등급·코인·상점** | 2~3주 | Glicko-2 · XP · 코인 원장(서버 확정 결과만) · 확정가 상점 · 착용 소켓 · 어린이 안전선 | §12.6 남용 테스트 통과 · 랭크 중 `btn-ai-move`·`btn-reset` 비활성 |
| **5c. 법무·스토어** | 병렬 | `CREDITS.md`(GPL·CC0) · 개인정보·계정삭제 페이지(study-game 재사용) · Play Data safety · 비공개 테스트 12명×14일 | Play 심사 제출 |
| **6. WebGPU · 야생 모드** | 이후 | TSL 재작성 · 능력 기물용 별도 규칙 엔진(비레이팅) | 선택 |

**총 15~17주** (v0.3 12~13주 + 5b 2~3주 + 5a 확장 1주. codex 편성 15~16주와 같은 범위 — 실측 아님). Phase 1 은 기린(최악)이 아니라 사자(확실)로 시작해 도구부터 검증하고, 기린은 Phase 2 안에서 Alpaca → UniRig 순으로.

---

## 10. 결정이 필요한 것 (라운드 의견 포함)

| # | 질문 | 추천 | 라운드 |
| :--- | :--- | :--- | :--- |
| 1 | 얼룩말 = 나이트 | 나이트 | 셋 다 나이트. Horse 공여에 `Attack_Kick` |
| 2 | 밀림 비숍 | **앵무새(biped)**, 코브라는 Phase 4 | grok·Claude 미룸 / agy·codex 유지 → 재생기 종류 최소화로 끊음 |
| 3 | 대성당 | 남긴다(클래식 팩, 0a 의 매니페스트 시험대) | 셋 다 남김 |
| 4 | 커스텀 비용 | 로컬 큐 무료 N회 → 수요 후 | 셋 다 |
| 5 | tri-agent 검토 | **완료** | — |
| 6 | 이름 WILD CROWN | 유지 | 셋 다 |
| 7 | **화풍** | **Phase 1 에서 A/B 실측 후 사용자 선택** | agy 조각상 / grok 픽사 — 갈림 |
| 8 | 도구 복사 vs 참조 | **복사** (개조 4건이 필요하므로) | 셋 다 복사 |
| 9 | Stockfish GPL 수용? | 수용(lite-single 동적 로드 + 고지) / 아니면 휴리스틱 유지 | grok 발견 |
| 10 | **A급 기물 = 외형만?** | **외형만**(랭크). 능력 기물은 Phase 6 "야생 모드"(비레이팅) | 2차 라운드 셋 다 유지 + 통합자. §12.3 |
| 11 | 레이팅 숫자 공개? | **숫자 공개 + 동물 등급 뱃지 병기** (토글) | grok "숫자+RD" / Claude "뱃지" → 둘 다 |
| 12 | 코인 실돈 판매? | **출시 시점엔 없음.** 열면 한국 확률법 간접유상 범위가 상점 전체로 번짐(§12.4) | grok |
| 13 | 전송층 | **Supabase Realtime** (study-game 계정·법무 재사용) | agy 추천 · grok E5·E6 수치 |

---

## 11. 리스크 (v0.3)

| 리스크 | 확률 | 영향 | 대응 |
| :--- | :--- | :--- | :--- |
| 기린·코끼리 공여 리그 불일치 | 중 | 중 | Alpaca·Donkey → UniRig → 절차(Phase 4) |
| biped 보강(3클립 키프레임) 품질 | 중 | 중 | 미어캣·앵무새·햄스터 공통 1회 작업. 안 되면 사족 대체 |
| 규칙↔화면 경계 분리 중 멀티플레이·되돌리기 타이밍 | 중 | 높 | 0a 에서 입력·접촉·종료 3시점 상태 기록으로 검증 (codex) |
| Stockfish GPL | — | 중 | §10-9 |
| 바이옴 60fps | 중 | 중 | 풀 2천 기본 · 성능 게이트 입장 조건 |
| 화풍 불일치 | 낮 | 중 | §5.2 A/B 후 한 프롬프트 고정 |
| 라이선스 | 낮 | 높 | Quaternius poly.pizza CC0 · Stockfish GPL 고지 · `CREDITS.md` |

## 12. 메타게임 — 대전 · 등급 · 코인 · 상점 · 착용 (v0.4 신설)

사용자 요청(2026-10-28): "친구나 다른사람과 대전 · 많이 하거나 많이 이기면 등급업·레벨업 · 코인 모아서 FIFA 처럼 A급 비숍을 상점에서 · 멋진 아이템 착용". v0.3 엔 이 층이 없었다(Phase 5 "멀티플레이" 한 단어). 2차 라운드(agy 대전 기술 · grok 규제·외부 사실 · codex 게임 경제)로 설계. **셋 다 통합자 가정 "랭크는 외형만"을 유지**했고 근거가 각각 달랐다 — agy: chess.js 가 표준 규칙만 안다 + P2P 치트 복잡도 · grok: FIFA 능력 카드 = 벨기에 도박 판정(E7) · codex: 합법 수·AI·리플레이·회귀가 둘이 된다.

### 12.1 대전 — 서버 없이, 초대로 시작 (agy + Claude)
- **1단계 = 4자리 방 코드(기존 `:4029~4033`) + 초대 링크 `?room=ABCD`.** 자동 매칭은 넣지 않는다(초기 인구 없음, 큐 서버 비용).
- **전송층 = Supabase Realtime Broadcast 채널 `room:{code}`.** 기존 `/api/rooms` fetch·SSE·`BroadcastChannel` 층은 **폐기**, 수신 애니메이션 큐(`tryApplyNext` `:3957~3979`, `{ fromRemote: true }`)만 유지. WebRTC P2P 는 TURN 없이 **약 18~25% 중계 필요**(grok E6, 2016~17 영상통화 표본 · 한국 모바일 CGNAT 는 더 높을 수 있음) → 제외. Vercel 함수는 상태 유지 불가 → 제외.
- **한도(실측, grok E5 → 통합자 재확인)**: Free 동시 200 · 100 msg/s · 월 200만 메시지, **1주 유휴 시 일시정지**. Pro $25/월(컴퓨트 크레딧 $10 포함) 동시 500 · 500 msg/s · 월 500만, 초과 $2.50/백만 · $10/1,000 연결. 한 판 ≈ 80수 × 2 ≈ 200 메시지 → Free 로 월 1만 판. 충분.
- **계정**: 게스트 즉시 플레이(`wizard_chess_token` `localStorage`, 외부 요청 0 — study-game `installAccount` 와 같은 원칙). 등급·코인을 남기고 싶을 때만 구글·카카오 연결 → study-game 의 `cloud_saves` RLS 스키마(`social-login-supabase` 스킬) 로 이관. 클라우드에 기존 세이브 있으면 1회 선택 팝업 (agy P2: 빈 클라우드가 로컬을 덮어쓰는 사고 방지).
- **치트 최소선**: 양쪽 피어가 chess.js 로 수신 수를 검증, 불법 수 → 즉시 차단·몰수. 승패는 `isGameOver()` 참일 때만. 결과는 **양쪽 서명 PGN** 을 Supabase 에 올리고 불일치면 무효. **가장 약한 곳**(agy): 변조 클라이언트의 DB 직단 위조는 100% 못 막는다 — RLS 로 `matches` 테이블은 insert-only + 양측 토큰 일치 조건으로 좁힌다.
- **이탈**: 하트비트 30초 · 무응답 60초 → 몰수패. 랭크 중 `btn-ai-move`·`btn-reset`(`App.tsx:168,176`) **비활성** (codex 충돌 5).
- **테스트 가드**: `test/applet.test.mjs:38-40` 이 `btn-lobby`·`lobby-modal`·`room-pill` 을 금지 → 대전 UI 는 **별도 라우트/오버레이**로 두고 단일 플레이 HUD 테스트는 그대로 (agy 충돌 2).

### 12.2 등급 — 레이팅과 XP 를 분리 (셋 수렴)
| 축 | 움직이는 조건 | 쓰는 곳 | 표시 |
| :--- | :--- | :--- | :--- |
| **레이팅** Glicko-2 | 랭크 대전 결과만 (서버 확정) | 매칭(인구 후) | **숫자 + RD** (grok) **+ 동물 등급 뱃지** 새끼→성체→우두머리→왕관 (Claude) — 토글 |
| **XP · 레벨** | 모든 판(AI 포함) · 일일 과제 | 코인 지급 · 상점 해금 | 레벨 숫자 |
- Glicko-2 **수식은 퍼블릭 도메인**, lichess 는 Glicko-2(시작 1500±1000, 한 판마다 갱신 변종). **lila 코드는 AGPL-3.0 — 복사 금지**, 계산기는 2024 년 scalachess(MIT) 로 옮겨졌다 (grok E1). 직접 구현 또는 MIT 구현.
- chess.com 은 시간대별 숫자 레이팅 공개, 공식 등급명 없음 (grok E2). "많이 하면 강해진다"는 체스에서 성립 안 함 → **"많이 하면 멋있어진다"** 로.

### 12.3 상점 — 외형 등급 C/B/A/S, 능력 없음, 가챠 없음 (codex + grok)
- **등급은 완성도·연출 범위의 약속** (codex): C 기본 캐릭터·색 · B 장식·재질 변형 · A 눈에 띄는 모델 장식 + 고유 공격 효과 · S 고유 등장·승리 연출. **어느 등급도 이동·수 계산·접촉 시각을 바꾸지 않는다.** 상품명은 "A등급 비숍 **외형**", 구매 화면에 "이동 규칙 동일" 명시.
- **착용 아이템**(왕관·갑옷·목걸이): 리그 본 소켓에 부착. 매니페스트 확장 —
  ```json
  "sockets": { "head": "Head", "back": "Spine2", "neck": "Neck" },
  "variants": [ { "id": "bishop_giraffe_A", "tier": "A", "model": "giraffe_A.glb", "keepMaterials": true,
                  "vfx": { "attack": "lightning_neck" }, "sfx": { "attack": "giraffe_A.ogg" },
                  "equipSlots": ["head", "neck"] } ]
  ```
  `dropRate` 필드는 **만들지 않는다**(grok 충돌 3). 소켓 매핑 없는 리그는 lint 거부. 본 없는 사진 기물(Phase 4)은 제작 시 앵커 삽입. 소유·착용 상태는 팩 파일과 분리해 계정에 상품 ID + 슬롯 선택으로 저장.
- **`keepMaterials` 선행 필수**: `instantiatePiece` 의 `child.material = primaryMat`(`:1533`) 이 등급 재질을 덮는다 (codex 충돌 2). 왕관 계승 장면은 `stepKingFall`(`:3593`) 이 메시를 기울일 뿐이라 장비 분리·부착 연출을 따로 (codex).
- **가챠·강화·합성 없음. 전부 확정가.** 근거: 한국 「게임산업진흥에 관한 법률」 확률 표시 의무 **2024-03-22 시행**, 직·간접 유상 아이템 전부 대상, **무료 재화라도 유료 재화와 교환되면 유상**. 예외: 제작·배급·제공자 모두 3년 연평균 매출 1억 원 이하 중소기업 등 (korea.kr 보도자료, 통합자 재확인). Play 가족 정책: 아동 대상이면 **시뮬레이션 도박 자체 금지** — 확률만 공개하면 끝나는 문제가 아니다 (grok E4). FIFA 18 벨기에 도박 판정(2018) → EA 2019-01 FIFA Points 판매 중단 (grok E7).
- **코인 실돈 판매는 출시 시점에 없음** (§10-12). 체스 사용자가 돈을 내는 것은 **퍼즐·레슨·분석·광고 제거**(chess.com Gold/Platinum/Diamond)이지 카드팩이 아니다 (grok E8 · 가격은 미확인). lichess 는 전 기능 무료 + Patron 뱃지.

### 12.4 코인 경제 (codex 표 + 통합자)
| 흐름 | 설계 | 남용·인플레 제어 |
| :--- | :--- | :--- |
| 획득: 온라인 대전 완료 | 승>무>패 전부 지급 (참여 보상) | **서버 확정 결과만**. 같은 상대 반복·중도 포기 규칙 |
| 획득: 일일·주간 과제 · 레벨업 · 메이트 종류 보너스 | 공개 조건 | 중복 지급 방지 |
| 획득: AI·로컬 대전 | **XP 만**, 소비 가능 코인 제외 (codex) | 로컬 결과를 코인으로 바꾸지 않는다 |
| 소비: 확정가 상품 | 외형·장비·보드·바이옴·감정표현 | 구매+차감을 한 거래로 기록 |
- **지급량·가격·과제 주기는 재 보지 않았다** — Phase 5b 에서 실제 플레이 시간·구매 도달 시간을 재고 정한다 (codex "가장 약한 결정"). 영구 소장품만 팔면 잔액이 쌓인다 → 시즌 한정 외형으로 소비처 유지.
- 무료 기본 외형은 **완성된 품질**로 (C 등급이 "미완성"이면 안 된다).

### 12.5 어린이 안전 최소선 (grok)
자유 채팅 **없음**(프리셋 이모지만) · 닉네임 욕설·사칭·광고 금지, 변경 1회 · 친구 = 방 코드/링크만, 랜덤 매칭에 텍스트 없음 · 아동 타겟 선언을 거짓으로 쓰지 않는다 · IAP 가 생기면 Play Billing + 가상코인·원화 병기 + 보호자 승인.

### 12.6 Phase 5b 남용 테스트 (완료 조건)
불법 수 전송 → 차단 · 결과 PGN 불일치 → 무효 · AI 버튼으로 랭크 수 두기 → 불가 · 로컬 초기화로 결과 변경 → 불가 · 게스트→계정 이관 시 로컬·클라우드 둘 다 있음 → 선택 팝업 · 상대 창 닫음 → 60초 내 몰수 · `dropRate` 필드 매니페스트 → lint 거부.

### 12.7 틀릴 수 있는 곳
① Supabase Free 1주 유휴 정지 — 출시 직후 트래픽 공백기에 방 생성이 실패한다 → cron ping 또는 Pro. ② 한국 CGNAT 에서 Realtime 웹소켓 복구(모바일 백그라운드 전환) — agy 미측정. ③ 1인 개발이 매출 1억 예외에 머문다는 가정 — Play(구글)가 "제공자"면 예외가 깨질 수 있다, 법률 자문 전 (grok). ④ 등급별 연출이 체스판 가독성을 해칠 수 있다 → 성능·가독성 게이트를 전 등급 동일 적용 (codex).

---

## 13. 바로 다음 액션
1. §10-7(화풍)·§10-9(GPL)·§10-10(외형만 — 추천 수용)·§10-12(코인 실돈 — 추천 없음) 에 답한다.
2. Phase 0a 착수: 역할→클립 어댑터 + `keepMaterials` + 대성당 매니페스트.
3. Phase 1 병행: 도구 개조 4건 → 사자 콘셉트 A/B → 로컬 TRELLIS 밤 큐.

### 참고 자료
- 라운드 대조표: `docs/research/agent-rounds/2026-10-27-design-wild-crown/README.md`
- 로컬 TRELLIS v1 서버 원본 (fp16): https://github.com/IgorAherne/trellis-stable-projectorz · TRELLIS.2 (HF 경로): https://github.com/IgorAherne/TRELLIS.2-stableprojectorz
- Stockfish.js (GPL-3.0 · lite-single): https://github.com/nmrugg/stockfish.js · UCI 옵션: https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html
- chess.js: https://jhlywa.github.io/chess.js/ · postprocessing: https://github.com/pmndrs/postprocessing
- UniRig (MIT): https://github.com/VAST-AI-Research/UniRig · Quaternius CC0: https://poly.pizza/bundle/Animated-Animal-Pack-ILAPXeUYiS
