# WILD CROWN — 야생의 왕관
### 고전 체스의 현대적 재해석 · 동물 왕국 3D 체스 기획서

> 작성일 2026-10-27 · **v0.7** (2026-10-28) · 기반 저장소 `alarmpet/chess` (wizard-chess-3d)
> v0.2 → v0.3: `tri-agent-review --design` 라운드(agy · grok · codex + 통합자 실측) 결과 반영. **v0.2 의 사실 전제 6개가 거짓**이었다(그중 4개는 통합자 오류). 라운드 원문·대조표: `docs/research/agent-rounds/2026-10-27-design-wild-crown/README.md`.
> v0.3 → v0.4: 사용자 요청(대전·등급·코인·상점·착용)으로 **§12 메타게임** 신설. 2차 라운드 결과 — 셋 다 "랭크는 외형만" 유지, 가챠 금지, Phase 5 분할. 라운드 기록: `docs/research/agent-rounds/2026-10-28-meta-wild-crown/README.md`.
> v0.4 → v0.5: 사용자 질문("인기 게임의 진화·카드덱·인기 요소를 조사하고 반영했나?") 에 "아니다" 가 답이어서 **3차 조사 라운드**. Steam 15개 게임 설명·리뷰 덤프(agy 체스 변형·오토체스 9 / codex 덱·수집·비동기 6) + grok 웹(Play 체스 앱·TFT·클래시 로얄·TCG Pocket·lichess/chess.com·한국 매출·쿠키런). **셋 다 "랭크는 외형만" 유지**, §12 에 §12.8(야생 모드 재료)·§12.9(조사 근거 표) 신설, §12.1~12.4 보강. 인용 60여 건 전부 덤프·원문 대조(오류 0, 부정확 1, 미확인 2). 라운드 기록: `docs/research/agent-rounds/2026-10-28-popular-wild-crown/README.md`.
> v0.5 → v0.6: 사용자 요청("같은 폰이어도 강아지·토끼·고양이를 내가 골라 배치, 더 강한 외모로 업그레이드, 아이템·무기·방패 장착, 무기마다 다른 이펙트") 으로 **§14 아이디어 뱅크** 신설 — 통합자 단독 안, **라운드 미검증**. 전부 §10-10(랭크는 외형만) 안에서 성립하도록 설계했고, 능력이 붙는 변형은 §12.8 야생 모드로 보냈다.
> v0.6 → v0.7: **4차 라운드 = §14 깨뜨리기**(agy 코드 · grok 등급분류·표시법 · codex 디자인·경제). **셋 다 "§14 는 출시(v1.0)에서 뺀다(KEEP)"** — 근거가 각각 달랐다: agy 승급 하드코딩 3곳·`primaryMat`·단일 안무 타임라인·스킨드 메시 병합 불가, grok 검=Apple 9+·GRAC "단순 폭력"·IARC 재설문·상대 기물은 내 설정으로 보는 체스 표준·표시광고법, codex 진행축 4개·§12.4 레벨업 코인 모순·방패 의미 충돌·수요 근거 부재. §14.0 판정표 신설, §14 각 절에 수정안, §10-15 기본값 뒤집음, §10-16 추가, §11 리스크 2줄, §12.4 모순 수정. 인용 전부 대조(오류 0, 줄번호 ±1~6 4건). 라운드 기록: `docs/research/agent-rounds/2026-10-28-break-wild-crown/README.md`.
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

### 2.2 기물 배정 — 「움직임이 곧 동물」 + 공여 리그 (v0.8: **양 진영 같은 종, 색만 다르게**)

> **v0.8 결정(§10-17, 사용자 2026-10-29)**: 사바나/밀림이 서로 다른 종을 쓰면 상대 기물을 읽을 때 헷갈린다 — 체스가 흑백 **같은 모양**인 이유와 같고, 3차 라운드 Chessarama 리뷰("messing up your pattern recognition")·4차 §10-15 와 같은 방향. 그래서 **6종 하나의 캐스팅**을 양 진영이 쓰고, 진영은 **색·장식 변형**(백색 왕국 백사자·백호·북극여우 / 암흑 왕국 흑사자·흑호·검은여우)으로 가른다. v0.3~0.7 의 사바나/밀림 이중 캐스팅은 폐기. 세계관 §2.1 의 두 왕국 이름·지형·사운드는 유지(보드·바이옴·체크 사운드가 진영을 말한다).

| 기물 | 움직임 · 값어치 | 동물 (양 진영 공통) | 백색 왕국 / 암흑 왕국 변형 | 공여 리그 | 이유 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 킹 | 1칸 · 잃으면 끝 | 🦁 **사자** | 백사자 / 흑사자(검은 갈기) | Wolf (`Attack`) | 동물의 왕. 생존이 곧 승패 |
| 퀸 | 전방향 무제한 · 9점 | 🐯 **호랑이** | 백호 / 흑호 | Wolf·Fox (`Attack`) | 최강 포식자, 판 전체를 누빈다 |
| 룩 | 직선 무제한 · 5점 | 🦏 **코뿔소** | 회백 / 흑요석 | Cow (`Attack_Headbutt`) | 직진 돌격 전차, 캐슬링 = 성벽 |
| 비숍 | 대각선 무제한 · 3점 | 🦊 **여우** | 북극여우 / 검은여우 | Fox (`Attack`) | 우회·기습하는 전략가 |
| 나이트 | L자 도약 · 3점 | 🦘 **캥거루** (후보 산양·개구리) | 모래색 / 흑갈색 | **공여 없음** → `biped_rig.py` 두 발 경로 | 유일하게 뛰어넘는 기물 = 점프하는 동물, 아이도 바로 안다 |
| 폰 | 1칸(첫수 2) · 대각선 공격 · 승급 · 1점 | 🦦 **미어캣** | 모래색 / 흑갈색 | biped 보강 | 집단·경계·협동, 끝까지 가면 변신 |

- 기린·코끼리·앵무새·얼룩말·사슴·암사자·흑표범은 **팩 상점 외형**(§12.3) 후보로 내려간다 — 규칙 읽기를 해치지 않는 선에서 "역할 실루엣 규약"(§14.1) 안에서만.
- 승급 = **진화 연출**(§2.4·§14.1): 미어캣이 끝줄에 닿으면 호랑이·코뿔소·여우·캥거루 중 하나로 변신. 자동 퀸 기본·언더프로모션 1탭(§11), 연출은 수 확정 뒤.
- 동물별 전용 공격 모션은 매니페스트 `clips.attack`·`attackSync`·`vfx` 가 이미 담는다(§4.3): 코뿔소 돌진, 호랑이 할퀴기, 여우 기습, 캥거루 공중 점프.

> **코브라**는 출시 팩에서 뺐다. 절차 재생기를 셋째 종류로 열면 안무·매니페스트·테스트가 세 갈래가 된다(grok·Claude). Phase 4 「AI 스킨 공방」이 어차피 절차 재생기를 만들므로 그때 시험 기물로 넣는다.
> **미어캣**은 `biped_rig.py` 보강(FOOT_Y=0 · Attack/Hit/Kneel 3클립, 1회 작업)이 끝나야 들어온다. 보강 전 임시 폰 = 임팔라(Deer 공여).
> **기린·코끼리**는 공여 리그에 코·긴 목 뼈가 없다. Alpaca·Donkey 로 시도하고 안 되면 UniRig(MIT, 저장소에 `examples/giraffe.glb` 있음 — grok 확인).

#### 2.2.1 `legend` 팩 — 최종 캐스팅 6종 전부 자체 제작 완료 (2026-10-29)

사자·코뿔소·캥거루·미어캣 4종을 **로컬 파이프라인**으로 하루에 만들었다(콘셉트 → 반입 한 종 약 9분). 호랑이·여우는 study-game 기존 캐릭터. 양 진영 같은 종 + 팀 틴트(§10-17).

| 기물 | 동물 | 출처 | 콘셉트 · 리그 렌더 |
| :--- | :--- | :--- | :--- |
| 킹 | 🦁 사자 | ComfyUI(Flux schnell) 콘셉트 seed 11 → 로컬 TRELLIS best-of-3(seed 11, 몸통깊이/키 0.573) → `bake_low` 8k·1024 → `biped_rig` → `pack-statue` → `legend_add_clips` | `docs/concepts/lion.png` · `lion_rig.png` |
| 퀸 | 🐯 호랑이 | ~~study-game `char_tiger`~~ → 2026-10-29 자체 제작으로 교체(정면 A자세 콘셉트, §2.2.2) | `tiger.png` |
| 룩 | 🦏 코뿔소 | 콘셉트 seed 23 → TRELLIS **seed 13** (0.681). seed 12(0.784)는 등에 판 모양 가짜 지오메트리 — **두께 지표가 속았다** → 이후 시드마다 `render_vc` 렌더를 남겨 눈으로 고른다. seed 11 은 어깨 좌우 비대칭(UpperArm.L 11 정점) → 팔 찢김. 둥근 등을 꼬리로 오인해 찢기는 문제는 `tools/biped_rig.py`(chess 사본) 의 `NO_TAIL=1` 로 | `rhino.png` · `rhino_rig.png` |
| 비숍 | 🐼 **판다** | 사용자 요청으로 여우에서 교체(2026-10-29), 자체 제작(§2.2.2) | `panda.png` |
| 나이트 | 🦘 캥거루 | **v2** 콘셉트("THICK chunky rounded arms … sturdy plump body", seed 47) → TRELLIS seed 11 (0.384). v1(0.305)은 팔이 칼날처럼 얇아 교체 — 원인은 콘셉트 그림 자체였다 | `kangaroo.png` · `kangaroo_rig.png` |
| 폰 | 🦦 미어캣 | 콘셉트 seed 11 → TRELLIS seed 12 (0.317) | `meerkat.png` · `meerkat_rig.png` |

높이(보드 칸, `fitHeight`) = 스탠턴 순서 킹 1.6 > 퀸 1.48 > 비숍 1.36 > 나이트 1.3 > 룩 1.22 > 폰 1.0 (`window.wizardChess.debugPieceHeights()` 로 실측 일치).

도구: `tools/comfy_concept.py`(ComfyUI API, 과거 출력 PNG 에서 복원한 Flux schnell GGUF 그래프) · `tools/make_biped.py`(TRELLIS best-of-N → 굽기 → 리깅 → 압축 → 클립 → 팩 반입). GPU 8GB 라 ComfyUI 와 TRELLIS 는 번갈아 띄운다. Phase 1(§9 "사자 1종 파이프라인 검증") 은 이것으로 끝났고, 화풍 A/B(§10-7) 는 "ComfyUI 콘셉트의 치비 3D 렌더 화풍" 이 사실상 채택됐다 — 사용자 확인 대기. 품질 다듬기(코뿔소 팔 판정·캥거루 두께·`fitHeight`·접촉 시각)는 Phase 2.

v0.7 까지의 진영별 다른 종(늑대/호랑이, 유니콘/드래곤…) 과 대역(판다·사슴·토끼·드래곤) 은 폐기. 남은 두 발 캐릭터(늑대·판다·얼룩말·유니콘·토끼·드래곤·펭귄·사슴·오리·시바·고양이·햄스터·닭)는 §12.3 상점 외형 후보.

클립: `tools/legend_add_clips.py` 가 기존 Idle·Walk·Run·Sit·Cheer 에 **Attack·Hit·Kneel** 을 키프레임으로 더했다(Blender 5.2 헤드리스, 가중치 불변). 잡기 접촉 0.40 s.

#### 2.2.2 진영 색 · 외형 단계 · 장식 (2026-10-29 제작)

사용자 질문("처음 캐릭터와 점점 고도화되거나 아이템 장착 캐릭터도 만들어야 하지 않나") 에 대한 답. §14.0 판정을 지킨다 — **외형만, 수는 같음**, 이름에 강함·전사·전설·진화 금지, 무기·방패 없음, 단계 보상은 슬롯을 차지하지 않는 체형·털색·재질.

**비숍 교체**: 사용자 요청으로 여우 → **판다**(옥색 학자 조끼). 호랑이도 study-game 모델 대신 자체 제작으로 바꿨다 — 비스듬히 선 기존 모델을 시작 그림으로 쓰면 팔이 접혀 A자세 리깅이 안 되고, 새 정면 콘셉트에서 1~3단계를 모두 뽑아야 단계마다 얼굴이 같다.

| 항목 | 방법 | 도구 |
| :--- | :--- | :--- |
| 진영 색 (해의 왕국 w / 달의 왕국 b) | 텍스처를 다시 굽는다. w = 밝고 따뜻한 털 + 금색 띠, b = 어둡고 차가운 털 + 보라 띠. 띠는 몸통 뼈(Hips·Spine·Chest) 가중치로 가려 팔·머리에 묻지 않는다. 런타임 `teamTint` 폐지 | `tools/kingdom_variant.py` (한 벌 약 4초) |
| 외형 단계 1 아기 | 기존 콘셉트 그대로 | — |
| 단계 2 자람 · 3 의젓함 | 1단계 콘셉트에서 **팔 선 아래 몸통·다리만 세로로 늘리고**(1.4배 · 1.75배) img2img 0.55 로 이음새를 다듬는다. img2img 만으로는 denoise 0.8 에서도 체형이 그대로였다(실측). 얼굴은 움직이지 않으므로 같다 | `tools/stage_warp.py` · `tools/comfy_concept.py --init` → `make_biped.py` |
| 단계 4 별빛 털 | 3단계 형상에 보로노이 별 점 + 밤하늘 톤을 기본색으로, 별 점을 발광 맵으로 굽는다 | `tools/starlit_variant.py` |
| 장식 4종 (리본·꽃핀·밀짚모자·방울) | 콘셉트 → TRELLIS → 굽기(2500면, 512) → 압축. 뼈대 없음 | `tools/make_prop.py` → `public/packs/legend/items/` |
| 뼈 소켓 | 바인드 자세에서 Head 가중치 정점으로 머리 꼭대기·폭, Chest 가중치 정점으로 가슴 앞면을 구한다(정점에 `applyBoneTransform` 을 적용해야 뼈와 같은 공간 — 안 하면 머리 꼭대기가 절반 높이로 잡혔다). 치비는 머리가 목보다 앞으로 나와 방울은 목이 아니라 가슴 앞면에 단다. 킹은 왕관이 있어 머리 슬롯 없음(§14.3) | `computeSockets` · `attachTrinkets` (`src/wizardChessEngine.js`) |

매니페스트: `looks.stages`(id·이름·설명) · `pieces.<role>.stages.<id> = {w,b}` · `pieces.<role>.slots` · `items.<id> = { model, slot, name, fit }`. 검증기가 강함 단어·`power`·`price`·`dropRate` 를 거부한다(`test/looks.test.mjs`). 선택은 브라우저에 저장(`wildcrown.cosmetics.v1`), HUD "🎨 외형" 패널에서 고른다 — 첫 문장 "외형만 바뀌고 수는 같습니다". 지금은 모든 단계가 열려 있고, 대국으로 얻는 방식은 Phase 5b 도감 기록에서 붙인다.

**드로우콜 실측 (§14.0 실험)**: 장식 54개를 단 판에서 한 번 렌더의 호출 수가 151 → 198, **+47 (장식 1개 ≈ 1회)**. 장식은 그림자를 드리우지 않게 해 그림자 패스 증가는 없다. 32기물 전부 2개씩은 기준 40 을 넘으므로, 그 경우를 열기 전에 **기물+장식 사전 굽기**(변형별 GLB)로 간다. 한두 기물만 꾸미는 지금 사용 범위는 문제없다.

#### 2.2.3 "누더기처럼 얼룩덜룩" 원인과 수정 (2026-10-30)

사용자 지적. 같은 사자를 단계별로 같은 조명에서 렌더해 갈랐다(`.reports/quality/`).

| 단계 | 면 · 텍스처 | 상태 |
| :--- | :--- | :--- |
| TRELLIS 원본 | 126,306 · 2048 | **깨끗함** — 콘셉트·TRELLIS 는 원인이 아니다 |
| study-game `bake_low.py` 뒤 | 8,000 · 1024(+노멀 JPEG) | 검은 금 · 번진 얼룩 · 끊긴 털 |
| 압축 · 진영 굽기 뒤 | 같음 · WebP | 거의 그대로(노멀맵을 빼도 얼룩 유지 — 노멀맵 탓 아님) |

원인: 8천 면으로 줄이고 UV 를 새로 편 뒤 고해상도 표면 색을 **광선으로 다시 굽는다**. TRELLIS 메시엔 안쪽 겹친 면이 남아 있고 케이지 0.015 가 좁아 광선이 엉뚱한 면에 맞거나 빗나갔다. 2048 → 1024 재샘플로 흐려짐도 더해졌다.

수정 `tools/keepuv_low.py`(이제 `make_biped.py` 기본, 옛 방식은 `--lowpoly bake`): 굽지 않고 **TRELLIS 자신의 UV·텍스처를 유지한 채 감량**. 두 가지 함정을 실측으로 잡았다 — ① glTF 가져오기는 UV 이음새마다 정점을 갈라 메시가 조각 섬이 되고, 섬별로 감량되면 경계가 벌어져 검은 틈이 생긴다 → 감량 전 **정점 용접**(UV 는 루프에 있어 유지). ② 감량된 면이 텍스처 빈 여백을 집을 수 있다 → 원본 UV 삼각형으로 유효 텍셀을 그려 **섬 색을 바깥으로 번지게** 채운다. 면 수 2만(1.6만·2.4만 비교 뒤 절충), 텍스처 1024. TRELLIS 재실행 없이 원본에서 20개 모델·진영·단계를 전부 다시 만들었다. 옛 산출물은 `.reports/legacy_bake/`.

#### 2.2.4 역할 퓨전 — "누가 봐도 킹·퀸·비숍" (2026-10-30)

사용자 요청: 원래 체스말 특징과 동물을 섞어 역할이 한눈에 읽히게. 원칙 셋 — ① **정수리가 정체**(대국 카메라는 위에서 비스듬히 본다) ② 표식은 장신구가 아니라 **몸의 일부**(떠 있는 장식은 TRELLIS 에서 사라진다) ③ 발밑은 **체스말 받침대**.

| 역할 | 스탠턴 표식 | 퓨전 |
| :--- | :--- | :--- |
| 킹 · 사자 | 최장신 · 십자 | 층진 갈기 + 십자 장식 왕관 + 흰 털 망토 깃 |
| 퀸 · 호랑이 | 구슬 왕관 · 나팔 몸통 | 구슬 왕관 + 아래로 퍼지는 드레스 |
| 비숍 · 판다 | 대각선 홈 주교관 | 흰 주교관에 검은 대각선 홈 + 꼭대기 구슬, 옥색 로브 |
| 나이트 · 캥거루 | 말 머리 옆모습 | 말 같은 얼굴 · 갈기 · 굴레 |
| 룩 · 코뿔소 | 성탑 · 성가퀴 | 성가퀴 관 + 어깨 벽돌 무늬, 원통 체형 |
| 폰 · 미어캣 | 둥근 머리 · 목 고리 · 종 몸통 | 둥근 머리 + 털 고리 + 종 모양 몸 |

- **콘셉트**: 사용자 지시로 Google Flow **Nano Banana 2.1** (ego-browser, 1:1 · 2장씩, 한 건 끝난 뒤 40초 쉼). 6종 × 2장 중 추천안 채택(`docs/concepts/fusion_sheet.png`). ✦ 워터마크는 inpaint. 옛 콘셉트는 `docs/concepts/v1/`.
- **단계 2·3**: 같은 방식(팔 아래만 늘린 뒤 ComfyUI img2img 0.55), 프롬프트에 역할 표식을 그대로 적어 단계마다 유지. Flux 는 프롬프트의 "text-free" 같은 말에도 글자를 그렸다 → 미어캣 단계 그림의 글자는 inpaint 로 지움.
- **받침대**: 매니페스트 `pedestal {w, b, radius, height}` — 엔진이 스탠턴식 깎은 받침(LatheGeometry)을 동물 발밑에 그리고 동물을 받침 높이만큼 올린다. 상아 `#efe4cf` / 흑단 `#2a2420`. 리깅과 엉키지 않도록 그림·모델에는 받침을 넣지 않는다.
- **장식 슬롯**: 킹·비숍·룩은 정수리 표식을 가리지 않게 머리 슬롯 없음(목만).
- **치마 보정 (실측)**: 퀸 드레스는 걷기 때 다리가 앞자락을 끌고 나가 안쪽이 비쳤다 → `tools/biped_rig.py` 에 `SKIRT=<다리 반지름/키>` 를 더해, 다리 뼈에서 먼 천 정점은 엉덩이를 따르게 했다. 호랑이·판다 3단계 전부 `SKIRT=0.06` 으로 다시 리깅 — 드레스는 제자리, 발만 움직인다.
- **틀릴 수 있는 곳**: 역할 식별률은 아직 사람으로 재지 않았다 — 대국 카메라 각도 검은 실루엣 6장을 처음 보는 사람에게 맞히게 해서 잰다.

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
- **v0.6 예정 필드**(§14, 미검증): 배우별 `roleBand`(높이·바닥 면적 띠, lint 검사) · `promoteTo`(승급 계보) · `growth[4]`(성장 단계 재질·장식) · `sockets`+`equip`(§12.3) · 무기 `weapon: { vfx: { capture, check, mate }, sfx, hitVariant }` — **`attackSync` 는 무기가 덮어쓸 수 없다**.

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
| **0b. 규칙·AI·CI** | 1주 | chess.js · Stockfish lite-single 워커(GPL 고지) · 공통 국면 회귀 · GitHub Actions | CI 초록. 난이도 1·5·10 각 10국 블런더율 측정 · **진행(2026-10-29)**: chess.js 1.4.0 심판 `src/rules/referee.js` 연결 완료 — 합법수·체크·메이트·무승부(3회 반복·50수·기물 부족)·앙파상·캐슬링·언더프로모션·FEN/PGN 이 chess.js 기준. Stockfish 는 §10-9 결정 대기 |
| **1. 파이프라인 검증** | 3~4일 | 도구 개조(1일) + **사자 1종** 화풍 A/B + 접촉 시각·standoff 실측 + 8k/16k 비교판 | 사자가 석상 폰을 Attack 접촉 시각에 맞춰 잡는다. 드로우콜·p95 실측 |
| **2. 사바나 팩** | 2~3주 | 사족 5종 + 임시 폰 임팔라 → biped 보강 후 미어캣 · 바이옴(풀 2천) · 혼 · 포효 | 60fps(성능 게이트 입장 조건) |
| **3. 밀림 팩 + VFX** | 3주 | 6종(앵무새 biped) · 밀림 바이옴 · 이펙트 **3종 + 왕관 계승** (나머지 3종·시간 변화는 3.5) | 데모 영상 |
| **4. 스킨 공방** | 3주 | 절차 재생기 · 집콕 팩 · 사진→기물 · 코브라 시험 | 테스터 5명 |
| **5a. 초대 대전** | 2주 | Supabase Realtime 방 코드·초대 링크 · 양측 chess.js 심판 · 이탈 타임아웃 · **첫 수 미착수 타임아웃** · PGN · **종료 화면 = 복기·재대국 즉시** · 튜토리얼 · 모바일 | 다른 기기 두 대에서 한 판 완주 · 이탈 시 60초 안에 몰수 처리 · 첫 수 60초 미착수 → 무효 |
| **5b. 등급·코인·상점** | 3주 | Glicko-2 · XP · 코인 원장(서버 확정 결과만, **단일 통화**) · 확정가 상점 · **수집 도감·미리보기·착용 프리셋** · 착용 소켓 · **상대 기물 표준 실루엣 토글 · 연출 배속** · 어린이 안전선 | §12.6 남용 테스트 통과 · 랭크 중 `btn-ai-move`·`btn-reset` 비활성 · 표준 실루엣 토글로 패턴 인지 유지 |
| **5c. 법무·스토어** | 병렬 | `CREDITS.md`(GPL·CC0) · 개인정보·계정삭제 페이지(study-game 재사용) · Play Data safety · 비공개 테스트 12명×14일 | Play 심사 제출 |
| **6. WebGPU · 야생 모드** | 이후 | TSL 재작성 · 능력 기물용 별도 규칙 엔진(비레이팅) · **§12.8 재료**(3합 승급 · 짝 업그레이드 카드 · 1회 능력 덱) 중 하나를 프로토타입 | 선택 |

**총 15~17주** (v0.3 12~13주 + 5b 3주 + 5a 확장 1주. codex 2차 편성 15~16주와 같은 범위 — 실측 아님. 3차 라운드로 5b 에 도감·토글·배속이 늘어 2~3주 → 3주). §14 는 v1.0 제외(§10-16) 라 +1주 리스크 없음. Phase 0b 에 승급 `promotion` 전달 수정(기존 결함, §11) 추가 — 1일 미만 추정. Phase 1 은 기린(최악)이 아니라 사자(확실)로 시작해 도구부터 검증하고, 기린은 Phase 2 안에서 Alpaca → UniRig 순으로.

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
| 14 | 일일 퍼즐 넣나? | **넣는다 (Phase 5b, 서버 없음).** lichess 퍼즐 DB 는 **CC0**(6,157,341개 CSV: FEN·Moves·Rating·Themes — 통합자 실측 `database.lichess.org`). 체스 앱의 가장 싼 리텐션 장치. XP 만, 코인 없음 | 3차 라운드 통합자 제안(셋은 묻지 않음) — §12.9 |
| 15 | 랭크 상대 기물을 표준 실루엣으로 보는 토글 기본값 | **기본 켜짐 (v0.7 뒤집음)**. 상대 외형은 **입장식 10초 + 종료 화면**에서 보고, 대국 중엔 내 설정으로 본다 — chess.com 표준("you can customize your board color, choose your preferred piece style" · 상대 세트는 시작 때 "a brief animation plays, showing their board and pieces") | 4차 grok 결함 5 · codex 결함 4(3⁸=6,561 배열) · 3차 Chessarama R8 |
| 16 | §14(캐스팅·성장·장비·무기) 출시 포함? | **v1.0 에서 전부 제외(KEEP). Phase 6+ 후보로만.** 단 §14.0 의 "0원 수정" 4건은 지금 반영 | 4차 라운드 셋 다 K 채택. §14.0 |
| 18 | `main` 의 별도 작업(다른 PC, 21커밋)과 어떻게 합치나 | **합치지 않는다(사용자 결정 2026-10-30, 10-29 의 "WILD CROWN 기준 병합" 을 뒤집음).** 다른 PC 에서 한 다른 작업이므로 이 게임에서 제거. 원본은 `archive/other-pc-games` 브랜치. 야생 모드는 Phase 6 계획으로만 남는다 | §10-10 · §12.8 |
| 17 | 진영마다 다른 종? | **아니오 — 양 진영 같은 6종, 색·장식 변형으로 구분** (백색 왕국 / 암흑 왕국). 최종 캐스팅 사자·호랑이·코뿔소·여우·캥거루·미어캣 | 사용자 결정 2026-10-29 + 외부 제안서 검토. §2.2 |

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
| **승급이 퀸으로 하드코딩** (`:2501` `instantiatePiece('queen'…)` · AI `:2148` · 원격 `:3910` 전부 `'queen'`) — 지금도 언더프로모션이 불가능한 **기존 결함** | 확정 | 중 | Phase 0b 에서 `options.promotion` 전달 + chess.js 로 검증. 자동 퀸 기본, 언더프로모션 1탭(§14.1 수정안) (4차 agy 결함 1) |
| 콘텐츠 변경 뒤 **IARC 설문 미재제출 = 허위 등급** ("If you make changes to your app content or features that affect the responses to the rating questionnaire, you must submit a new content rating questionnaire") | 중 | 높 | 무기·폭력 연출을 어느 Phase 에 넣든 그 Phase 완료 조건에 "IARC 재설문 + GRAC 배지 확인" (4차 grok 결함 3) |

## 12. 메타게임 — 대전 · 등급 · 코인 · 상점 · 착용 (v0.4 신설)

사용자 요청(2026-10-28): "친구나 다른사람과 대전 · 많이 하거나 많이 이기면 등급업·레벨업 · 코인 모아서 FIFA 처럼 A급 비숍을 상점에서 · 멋진 아이템 착용". v0.3 엔 이 층이 없었다(Phase 5 "멀티플레이" 한 단어). 2차 라운드(agy 대전 기술 · grok 규제·외부 사실 · codex 게임 경제)로 설계. **셋 다 통합자 가정 "랭크는 외형만"을 유지**했고 근거가 각각 달랐다 — agy: chess.js 가 표준 규칙만 안다 + P2P 치트 복잡도 · grok: FIFA 능력 카드 = 벨기에 도박 판정(E7) · codex: 합법 수·AI·리플레이·회귀가 둘이 된다.

### 12.1 대전 — 서버 없이, 초대로 시작 (agy + Claude)
- **1단계 = 4자리 방 코드(기존 `:4029~4033`) + 초대 링크 `?room=ABCD`.** 자동 매칭은 넣지 않는다(초기 인구 없음, 큐 서버 비용).
- **전송층 = Supabase Realtime Broadcast 채널 `room:{code}`.** 기존 `/api/rooms` fetch·SSE·`BroadcastChannel` 층은 **폐기**, 수신 애니메이션 큐(`tryApplyNext` `:3957~3979`, `{ fromRemote: true }`)만 유지. WebRTC P2P 는 TURN 없이 **약 18~25% 중계 필요**(grok E6, 2016~17 영상통화 표본 · 한국 모바일 CGNAT 는 더 높을 수 있음) → 제외. Vercel 함수는 상태 유지 불가 → 제외.
- **한도(실측, grok E5 → 통합자 재확인)**: Free 동시 200 · 100 msg/s · 월 200만 메시지, **1주 유휴 시 일시정지**. Pro $25/월(컴퓨트 크레딧 $10 포함) 동시 500 · 500 msg/s · 월 500만, 초과 $2.50/백만 · $10/1,000 연결. 한 판 ≈ 80수 × 2 ≈ 200 메시지 → Free 로 월 1만 판. 충분.
- **계정**: 게스트 즉시 플레이(`wizard_chess_token` `localStorage`, 외부 요청 0 — study-game `installAccount` 와 같은 원칙). 등급·코인을 남기고 싶을 때만 구글·카카오 연결 → study-game 의 `cloud_saves` RLS 스키마(`social-login-supabase` 스킬) 로 이관. 클라우드에 기존 세이브 있으면 1회 선택 팝업 (agy P2: 빈 클라우드가 로컬을 덮어쓰는 사고 방지).
- **치트 최소선**: 양쪽 피어가 chess.js 로 수신 수를 검증, 불법 수 → 즉시 차단·몰수. 승패는 `isGameOver()` 참일 때만. 결과는 **양쪽 서명 PGN** 을 Supabase 에 올리고 불일치면 무효. **가장 약한 곳**(agy): 변조 클라이언트의 DB 직단 위조는 100% 못 막는다 — RLS 로 `matches` 테이블은 insert-only + 양측 토큰 일치 조건으로 좁힌다.
- **이탈**: 하트비트 30초 · 무응답 60초 → 몰수패. 랭크 중 `btn-ai-move`·`btn-reset`(`App.tsx:168,176`) **비활성** (codex 충돌 5).
- **첫 수 미착수 = 인질극** (3차 agy, Chess Ultra 리뷰 R4 "People are always afking at the start of a match to get you to quit so they gain free elo" · R7 "if they do not move you are held hostage"): 양측 첫 수 **60초** 미착수 → 판 **무효(레이팅 변동 없음)**. 상대에게 메시지를 보낼 수단이 없는 설계(§12.5 자유 채팅 없음)라 타이머가 유일한 해법이다.
- **대국 중 광고 없음** (3차 grok, Play 체스 앱 리뷰 "pretty much after every game, you get 1-2 ads" · "Between few moves sudden ads pop up" · "Way too many ads"): 광고를 나중에 넣더라도 **진행 중인 온라인 판·초읽기 중 삽입 금지**. Play 체스 앱의 반복 불만은 수집 부족이 아니라 광고다.
- **종료 화면 = 복기·재대국 즉시** (3차 codex, Marvel Snap "Every match gives you another fast chance to test, learn, and improve."): PGN 복기 진입과 "다시 두기" 를 보상 지급과 별개로 바로 띄운다. 코인·레벨이 없어도 다음 판을 두게 하는지를 Phase 5a 에서 본다.
- **비동기 "상대 기록 대전" 은 5a 의 대체가 아니다** (3차 codex, Backpack Battles R5 "your opponent isn't really there--you play against a snapshot of a rando's build" · R7 "you will always encounter cheat builds"): 체스는 상대가 내 수에 응수해야 한다. 비동기는 **일일 퍼즐 순위**(§10-14) 로만.
- **테스트 가드**: `test/applet.test.mjs:38-40` 이 `btn-lobby`·`lobby-modal`·`room-pill` 을 금지 → 대전 UI 는 **별도 라우트/오버레이**로 두고 단일 플레이 HUD 테스트는 그대로 (agy 충돌 2).

### 12.2 등급 — 레이팅과 XP 를 분리 (셋 수렴)
| 축 | 움직이는 조건 | 쓰는 곳 | 표시 |
| :--- | :--- | :--- | :--- |
| **레이팅** Glicko-2 | 랭크 대전 결과만 (서버 확정) | 매칭(인구 후) | **숫자 + RD** (grok) **+ 동물 등급 뱃지** 새끼→성체→우두머리→왕관 (Claude) — 토글 |
| **XP · 레벨** | 모든 판(AI 포함) · 일일 과제 · 일일 퍼즐 | **비거래 외형 해금·시즌 트랙** (코인 지급 아님 — 3차 codex 가 §12.4 와의 충돌을 잡음) | 레벨 숫자 |
- Glicko-2 **수식은 퍼블릭 도메인**, lichess 는 Glicko-2(시작 1500±1000, 한 판마다 갱신 변종). **lila 코드는 AGPL-3.0 — 복사 금지**, 계산기는 2024 년 scalachess(MIT) 로 옮겨졌다 (grok E1). 직접 구현 또는 MIT 구현.
- chess.com 은 시간대별 숫자 레이팅 공개, 공식 등급명 없음 (grok E2). "많이 하면 강해진다"는 체스에서 성립 안 함 → **"많이 하면 멋있어진다"** 로.
- **동물 등급 뱃지(새끼→성체→우두머리→왕관)는 재미 근거가 없는 통합자 즉석 안**이다 — 3차 라운드 덤프 15개·웹 어디에도 "뱃지 단계가 재미있다" 는 증거가 없다(codex 지적). 남기되 Phase 5b 테스터 5명에게 보여 주고 결정한다. 한국 초등 수집 게임의 훅은 **"변신 연출"**(쿠키런: 킹덤 각성 "최초 각성 시 쿠키의 외형이 변화", 3차 grok) 이므로 뱃지보다 **기물 외형이 사용 횟수로 자라는 것**(§12.3 "쓰면 자란다") 이 더 가까운 후보다.
- **시즌 보상은 외형·감정표현·보드만** (TFT 공식 "earn rewards such as Little Legend eggs and emotes just for playing" · "unlock cosmetic content", 3차 grok). 랭크 보상에 능력·샤드·팩 없음.
- **레이팅 보호권 금지** (3차 agy, Auto Chess R1 "Insurance cards: allows you to not lose any points if you had a bad ranked game, does cost you in game currency"): 재화로 패배를 지우는 순간 Glicko-2 가 실력 지표가 아니게 된다.

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
- **보드·기물 테마는 체스 웹에서 무료가 기본** (3차 통합자·grok 실측: lichess features "Light/Dark theme, custom boards, pieces and background" 무료·Patron 동일, Patron 페이지 "Patrons get bragging rights with cool new Patron wings" · chess.com 도움말 Basic "Change your pieces, board, and background to a theme of your choosing", Gold 는 "NO ADS"·"UNLIMITED puzzles"). → **C 등급(기본) 은 완성품이어야 하고, 파는 것은 "추가 룩" 이다.** 모바일 Chess Universe 는 VIP 로 "Access 50 exclusive premium items" 를 판다 — 이쪽이 §12.3 의 실제 선례.
- **수집 도감 + 미리보기 + 직접 선택** (3차 codex, Marvel Snap 리뷰 R6 "0% Agency over the collection progress." · R3 "it will take you MONTHS to amass a collection"; 통합자 r1): 상점·보유 목록에서 기물별 외형을 **미리 보고 원하는 것을 바로 고른다**. 도감은 빈 칸이 보이는 수집 화면 — 확정가라도 도감은 된다. 무작위 획득과 연결하지 않는다.
- **기물 캐스팅·장비·무기 이펙트의 구체 안은 §14** (v0.6, 미검증).
- **착용 프리셋 = "외형 덱"** (3차 codex ③ · agy): 사냥 모션·포효 사운드·승급 연출·승리 팡파르·이모지를 한 세트로 저장해 대국 전에 고른다. 능력이 없으니 **랭크에도 들어간다**. 사용자 말의 "카드 덱" 중 랭크에 넣을 수 있는 유일한 형태.
- **쓰면 자란다** (통합자 r1 · grok 쿠키런 "변신 연출"): 기물을 많이 쓰면(판 수·잡은 수) 그 기물의 외형 단계가 오른다. 능력 변화 없음, 확률 없음, 거래 없음 → 확률법·가족 정책 밖. 등급 뱃지(§12.2) 보다 이쪽을 먼저 시험.
- **동반자 펫** (3차 grok, Chess Universe "when you defeat an island opponent, you get to keep it as a pet." · "When you defeat all 120 island opponents you get a special pet."): 과제·온라인 완료 보상으로 킹 옆 대기 연출 펫을 **확정 지급**. 이동·수 계산 무관.
- **상대 기물을 내 화면에서 표준 실루엣으로** (3차 agy, Chessarama R8 "it picks a random chess set to use, messing up your pattern recognition."): A/S 등급 장식이 수읽기를 방해하면 체스가 깨진다. 설정 토글(§10-15), 기본 꺼짐.
- **연출 배속·간소화 옵션** (3차 agy, Chessarama R6 "tedious having to watch an unskippable (same) animation after every move."): A/S 공격·사냥 연출은 2배속·핵심 프레임 옵션, 초읽기 중 자동 단축. §4.4 성능 게이트와 같은 자리.
- **시즌 외형은 판매 종료·재판매 여부를 미리 표시** (3차 codex): "시즌 한정으로 소비처 유지"(§12.4) 는 그대로 두되 예측 가능하게.
- **단일 통화** (3차 agy, Auto Chess R3 "You collect biscuits to unlock chests, chests require keys to open. Donuts buy keys." …): 비스킷·도넛·열쇠·상자·조각 식 다단계 환전은 만들지 않는다. 코인 하나.

### 12.4 코인 경제 (codex 표 + 통합자)
| 흐름 | 설계 | 남용·인플레 제어 |
| :--- | :--- | :--- |
| 획득: 온라인 대전 완료 | 승>무>패 전부 지급 (참여 보상) | **서버 확정 결과만**. 같은 상대 반복·중도 포기 규칙 |
| 획득: 일일·주간 과제 · 메이트 종류 보너스 (**레벨업은 코인 아님** — §12.2 와의 모순을 4차 codex 가 잡음) | 공개 조건 · 과제는 온라인 판 안에서만 완료 가능 | 중복 지급 방지 |
| 획득: AI·로컬 대전 | **XP 만**, 소비 가능 코인 제외 (codex) | 로컬 결과를 코인으로 바꾸지 않는다 |
| 소비: 확정가 상품 | 외형·장비·보드·바이옴·감정표현 | 구매+차감을 한 거래로 기록 |
- **지급량·가격·과제 주기는 재 보지 않았다** — Phase 5b 에서 실제 플레이 시간·구매 도달 시간을 재고 정한다 (codex "가장 약한 결정"). 영구 소장품만 팔면 잔액이 쌓인다 → 시즌 한정 외형으로 소비처 유지.
- 무료 기본 외형은 **완성된 품질**로 (C 등급이 "미완성"이면 안 된다).

### 12.5 어린이 안전 최소선 (grok)
자유 채팅 **없음**(프리셋 이모지만) · 닉네임 욕설·사칭·광고 금지, 변경 1회 · 친구 = 방 코드/링크만, 랜덤 매칭에 텍스트 없음 · 아동 타겟 선언을 거짓으로 쓰지 않는다 · IAP 가 생기면 Play Billing + 가상코인·원화 병기 + 보호자 승인.

### 12.6 Phase 5b 남용 테스트 (완료 조건)
불법 수 전송 → 차단 · 결과 PGN 불일치 → 무효 · AI 버튼으로 랭크 수 두기 → 불가 · 로컬 초기화로 결과 변경 → 불가 · 게스트→계정 이관 시 로컬·클라우드 둘 다 있음 → 선택 팝업 · 상대 창 닫음 → 60초 내 몰수 · **첫 수 60초 미착수 → 무효, 레이팅 불변** · **표준 실루엣 토글 켜면 상대 A/S 기물이 내 화면에서 기본 외형** · 같은 상대 반복·중도 포기 → 코인 미지급 · `dropRate` 필드 매니페스트 → lint 거부.

### 12.7 틀릴 수 있는 곳
① Supabase Free 1주 유휴 정지 — 출시 직후 트래픽 공백기에 방 생성이 실패한다 → cron ping 또는 Pro. ② 한국 CGNAT 에서 Realtime 웹소켓 복구(모바일 백그라운드 전환) — agy 미측정. ③ 1인 개발이 매출 1억 예외에 머문다는 가정 — Play(구글)가 "제공자"면 예외가 깨질 수 있다, 법률 자문 전 (grok). ④ 등급별 연출이 체스판 가독성을 해칠 수 있다 → 성능·가독성 게이트를 전 등급 동일 적용 (codex) + 표준 실루엣 토글(§10-15). ⑤ **3차 조사 표본 편향**: Steam **영어** 리뷰 "도움됨 상위 10 + 최근 10" 뿐(상위 2페이지 요청이 1페이지를 되돌려 사실상 10개), 도움됨 상위는 밈 리뷰("Finally, Chess 2")로 치우친다. 모바일·한국 이용자 반응은 grok 의 Play 리뷰 몇 줄과 Sensor Tower 집계뿐. ⑥ **외형에 실제로 돈을 낸다는 근거는 없다** (codex): 덤프는 "외형 수집이 인기" 까지만 말하고 구매 전환은 말하지 않는다. Fortnite $9.65B(2018~19, Ars Technica) 는 규모가 다른 사례. ⑦ 동물 등급 뱃지 단계의 재미 — 미검증(§12.2).

### 12.8 야생 모드 재료 (Phase 6, 비레이팅) — 3차 라운드에서 모은 것
사용자 말의 "진화" 와 "카드 덱" 중 **능력이 바뀌는 것**은 전부 여기. 셋 다 "랭크에는 못 들어간다" 에 수렴했고 근거는 달랐다 — agy: Chess Evolved Online 상위 랭크 "forced to play only the most boring stally armies or lose a lot of rating because of effective RNG where other armies hard-counter your pieces" (R7, 2,226시간) · "Turn one checkmate was once possible" (R3) · 최근 리뷰 "grindy, pay2win, and not that fun" (N1) · "The game is dead" (R6). grok: 클래시 로얄 카드 진화(2023-06-18) "unlock new powers for cards they already own" → Sportskeeda "pay-to-win", "around $100" 출시 팩 비판 · Gametrodon(CEO) "if they've upgraded their pieces, they have access to options and moves you don't". codex: Mahokenshi R7 "cumulative upgrades that carry over runs, the game becomes very trivial".

| 재료 | 출처 게임 (덤프 인용) | 야생 모드에서의 모습 | 넣지 않는 이유가 생기는 곳 |
| :--- | :--- | :--- | :--- |
| **3합 승급(진화)** | Dota Underlords · Auto Chess — 같은 기물 3개 → 상위 등급 | 라운드제 변형판: 잡은 기물을 모아 같은 종 3개면 2성 (이동 범위 +1 등) | 체스는 기물 수가 고정 — 라운드제 재편성이 필요 = 별도 규칙 엔진 (agy) |
| **짝 업그레이드 카드** | Shotgun King "After each floor, you may choose between two random combinations of one upgrade for you and one upgrade for the other side." | AI 상대 PvE 런: 층마다 "내 장점 + 상대 장점" 짝 선택 | 가장 가벼운 "덱". 선택이 의미 있어야 한다 — codex: 무작위 뽑기 자체는 재미가 아님 (Mahokenshi R8 "random card draws, which can screw you over completely") |
| **1회 능력 덱** | Pawnbarian R7 "Upgrading your cards can add a lot of flexibility and strategy" | 판 중 카드 1장 뽑아 1회 사용 (나이트 지진 등) | 무작위 패가 수읽기를 가린다 (codex ①) |
| **오프닝 선택 덱** | Slay the Spire "Select cards that work together" | 대국 전 능력 조합 3개 중 공개 선택 | 강한 조합이 고정되면 선택이 사라짐 (codex ②) |
| **"Chess 2" 한 방 콘셉트** | Shotgun King·Chessplosion·5D·CEO 리뷰 최상단 "Finally, Chess 2" (agy) | "체스인데 사자가 포효하면 한 칸 밀린다" 처럼 **1초 만에 이해되는 규칙 하나** | 복잡한 덱·파밍이 아니라 한 방이 환호를 받았다 (agy §6-3) |

원칙: 전부 **비레이팅 · 확정 해금(XP) · 가챠 없음 · 랭크 코인 상점과 분리**(섞이면 간접 유상이 상점 전체로 번짐, §10-12). 프로토타입은 **짝 업그레이드 카드(PvE)** 부터 — 상대가 AI 라 치트·동기화 문제가 없고 규칙 엔진 분기가 가장 작다.

### 12.9 조사 근거 — 인기 게임에서 가져온 것 · 안 가져온 것 (3차 라운드, 전부 원문 대조)
| 게임 (출처) | 인기 요소 / 불만 | WILD CROWN 반영 |
| :--- | :--- | :--- |
| Chess Evolved Online (Steam, 긍정 91%/808) | 능력 기물 수집 + 랭크 → "Finally, Chess 2" 환호와 "Pay to win chess" 밈, 상위 랭크 하드카운터 RNG, 사망 | **반례** — §10-10 외형만 유지의 가장 직접적 근거 |
| Chess Ultra (Steam, 76%/1,838) | 4K 기물 세트 DLC 칭찬 "Stunning chess sets and beautiful environments" / 온라인 AFK 인질 | 외형 세트 = §12.3 선례 · 첫 수 타임아웃 §12.1 |
| Chessarama (Steam) | 디오라마 아트 / 랜덤 세트가 패턴 인지 방해 · 스킵 불가 연출 | 표준 실루엣 토글 · 연출 배속 |
| Dota Underlords (Steam) | "The paid Battle Pass is not required to play the game, nor does it provide any gameplay specific advantage." / 언더로드 유닛이 게임을 죽임 | 시즌 보상 외형만 · 제3 유닛 금지 |
| Auto Chess (Steam) | "Cosmetics: Boards, skin pieces, effects, and much more. This game does very well on this side." / 보험 카드 · 5중 통화 | 외형 상점 긍정 · 레이팅 보호권·다단계 통화 금지 |
| Shotgun King · Pawnbarian · Chessplosion · 5D (Steam) | "Chess 2" 한 방 콘셉트, 짝 업그레이드, 카드 업그레이드 | §12.8 재료 |
| Slay the Spire · Balatro (Steam) | 메타 진행 없이 해금만으로 재플레이 "things just got interesting again" | XP = 해금, 종료 화면 재대국 |
| Marvel Snap (Steam) | variant 외형 수집 칭찬 / "0% Agency over the collection progress." · 시즌패스 뒤 능력 카드 P2W | 도감·직접 선택 · 능력 판매 금지 |
| Backpack Battles (Steam) | 비동기 "snapshot" 대전 — 상대가 없음, 치트 빌드 | 5a 대체 아님 |
| Chess Universe · Chess Royale (Play) | 펫 수집 · VIP 보드/기물 50종 / 광고 불만 반복 | 펫 확정 지급 · 대국 중 광고 금지 |
| chess.com (Play 100M+, 보드 매출 2위) · lichess | 테마 무료, 유료 = 퍼즐·레슨·광고 제거 / Patron 은 날개뿐 | 기본 외형 완성품 · 일일 퍼즐 §10-14 |
| TFT (공식) | 리틀 레전드·이모트·아레나 — 외형만 | 시즌 보상 원칙 |
| Clash Royale (Supercell 2023-06-18 · Sportskeeda) | 카드 진화 = 새 능력 → P2W 비판 | 능력 진화 랭크 금지 |
| Pokémon TCG Pocket (Kotaku 2024-11-06) | "twelve different in-game currencies" · "selling gambling to children" · 벨기에 미출시 | 팩·다통화 금지 |
| 쿠키런: 킹덤 (데브시스터즈 자료 2024-07-01 · Sensor Tower 1H2025 한국 매출 성장 10위) | 각성 = "최초 각성 시 쿠키의 외형이 변화" + 전투력 | **변신 연출만** 가져온다("쓰면 자란다"), 전투력은 안 됨 |
| 한국 1H2025 모바일 (Sensor Tower) | 약 24억 달러, 1위 리니지M · 2위 WOS · 8위 로블록스(어린이날 기프트 카드) | 수집 체스 선례 없음 — WILD CROWN 은 틈새 |
| Fortnite (Ars Technica, Epic v Apple) | "$9.65 billion – Approximate gross revenue generated by Fortnite across 2018 and 2019" 외형만 | 규모가 달라 참고만 (§12.7⑥) |

미확인 2건(grok, URL 없음): Kotaku 의 Fortnite "Everything that can be bought is cosmetic" 문장 · IGN TCG Pocket "$200 million" "$1,500". 부정확 1건(agy): Chess Ultra R10 을 AFK 사례로 들었으나 R10 은 접속 불량 리뷰.

---

## 13. 바로 다음 액션
1. §10-7(화풍)·§10-9(GPL)·§10-10(외형만 — 추천 수용, 3차에서도 셋 다 유지)·§10-12(코인 실돈 — 추천 없음)·§10-14(일일 퍼즐 — 추천 넣음) 에 답한다.
1-1. ~~§14 출시 후보 고르기~~ → 4차 라운드 완료: **§14 는 v1.0 제외(§10-16)**. 남은 결정은 §10-15 기본 켜짐·§10-16 수용 여부. Phase 0b 에 **승급 하드코딩 결함** 수정 추가(§11).
2. Phase 0a 착수: 역할→클립 어댑터 + `keepMaterials` + 대성당 매니페스트.
3. Phase 1 병행: 도구 개조 4건 → 사자 콘셉트 A/B → 로컬 TRELLIS 밤 큐.

**2026-10-30 처리한 것**
- **체크메이트 연출 (동물 기물)**: 진 킹을 넘어뜨려 화로에 던지던 석상용 연출을 동물 팩에서는 쓰지 않는다. 진 킹은 Kneel 로 무릎 꿇고, 이긴 쪽 기물이 물결처럼 차례로 Cheer. 1.3초 뒤 결과 창. 석상 팩(`?pack=cathedral`)은 기존 연출 유지.
- **승급 하드코딩 결함(§11) 수정**: 클릭으로 승급할 때 선택 창 — 퀸이 미리 선택, 2.5초 뒤 자동 확정, 룩·비숍·나이트는 한 번 탭(Q/R/B/N 키). 버튼에 그 역할의 동물 이름. §14.0 (a) "자동 퀸 기본 + 언더프로모션 1탭". AI 수는 지금처럼 퀸.
- **다른 PC 작업 분리**: main 에 섞여 들어온 21커밋(단어 체스·정원 농사·수도원 복원·상점·XP·주문 카드·화로/기둥·밀치기·성소 영수 스킨·도감·블룸·당구·볼 스톰)은 다른 PC 의 다른 작업이다. 사용자 결정(2026-10-30): **이 PC 에서 만든 것만 이 게임.** §10-18 의 "WILD CROWN 기준 병합" 을 되돌려 모두 제거하고, 병합 전 코드에 이후 작업(외형·장식·승급 선택·체크메이트·받침대)만 다시 얹었다. 그래서 야생 모드 구현도 함께 빠졌다(§12.8 은 Phase 6 계획으로 남음). 원본은 `archive/other-pc-games` 브랜치(main afd603d 시점)에 보관.
- **라이벌 전리품 시제품**: 라운드 결론(`docs/research/agent-rounds/2026-10-30-cosmetics-trophy/README.md`)의 첫 단계. 시작은 소품 없음. 소품을 입은 AI 3명(`pack.json` `rivals`)을 체크메이트하면 그 상대의 소품을 하나씩 얻고, 메이트를 둔 말 역할에 자동으로 달린다(표식을 가리는 슬롯이면 폰부터). 패자가 잃는 것은 없다. 저장은 로컬뿐이라 랭크 보상이 아니다. 새 소품 3종: 대나무 헤드폰·나뭇잎 선글라스·도토리 목걸이. 얼굴 소품은 단계마다 머리 모양이 달라 `fit.byStage` 로 위치를 나눈다.
- **대국 밖 세계**: [왕관 마을 계획서](plans/2026-10-30-crown-village-plan.md). 인기 게임 구조를 공개 자료로 해부해 도토리·건설·하트·라이벌 손님을 넣었다. 체스 수는 그대로다. 핵심 고리 시제품이 동작한다.
- **CI**: `.github/workflows/ci.yml` — 푸시·PR 마다 `npm ci` → `npm test` → `npm run build`. 타입 검사(`npm run lint`)는 기존 오류 2건(farmData.ts · styles.css) 때문에 아직 넣지 않았다.

### 참고 자료
- 라운드 대조표: `docs/research/agent-rounds/2026-10-27-design-wild-crown/README.md` · `2026-10-28-meta-wild-crown/README.md` · `2026-10-28-popular-wild-crown/README.md`(3차, Steam 덤프 15개 포함) · `2026-10-28-break-wild-crown/README.md`(4차, §14 깨뜨리기)
- 등급: Apple 연령 등급 정의 https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/ · Play 콘텐츠 등급(IARC) https://support.google.com/googleplay/android-developer/answer/9898843 · GRAC 등급분류 기준 https://www.grac.or.kr/Institution/EtcForm01.aspx · chess.com 자동 퀸 https://support.chess.com/en/articles/8614542-what-is-auto-queen-and-how-do-i-enable-it
- lichess 퍼즐·기보 DB (CC0): https://database.lichess.org/ · lichess 기능표: https://lichess.org/features · chess.com 멤버십: https://support.chess.com/en/articles/8562418-what-does-each-level-of-membership-get-me
- 로컬 TRELLIS v1 서버 원본 (fp16): https://github.com/IgorAherne/trellis-stable-projectorz · TRELLIS.2 (HF 경로): https://github.com/IgorAherne/TRELLIS.2-stableprojectorz
- Stockfish.js (GPL-3.0 · lite-single): https://github.com/nmrugg/stockfish.js · UCI 옵션: https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html
- chess.js: https://jhlywa.github.io/chess.js/ · postprocessing: https://github.com/pmndrs/postprocessing
- UniRig (MIT): https://github.com/VAST-AI-Research/UniRig · Quaternius CC0: https://poly.pizza/bundle/Animated-Animal-Pack-ILAPXeUYiS

---

## 14. 아이디어 뱅크 — 기물 캐스팅 · 성장 · 장비 · 무기 이펙트 (v0.6 통합자 단독 → **v0.7 4차 라운드 판정 반영**)

사용자 요청(2026-10-28): "같은 폰이어도 강아지·토끼·고양이 등을 직접 선택해 배치 · 같은 강아지라도 더 강한 외모로 업그레이드 · 아이템 장착 · 무기와 방패 장착 · 무기에 따라 이펙트가 다름". 전부 **외형·연출 층**에서 성립하므로 §10-10 과 충돌하지 않는다. 한 줄 원칙: **"무엇이 움직이는가(규칙)는 체스가 정하고, 누가·어떻게 움직이는가(배우·의상·연출)는 플레이어가 정한다."** §14.1~14.9 는 v0.6 원안을 그대로 두고(지우지 않는다), 각 절 끝에 **▶ 4차 판정** 을 붙였다. 종합은 §14.0.

### 14.0 4차 라운드 판정 (v0.7) — §14 는 v1.0 에 들어가지 않는다
| 후보 | Claude(r1, 읽기 전) | agy (코드) | grok (등급·법) | codex (디자인) | **결정** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| A 캐스팅 + 승급=진화 | 수정 | 보류 (14~18일 추정) | 수정 (내 화면만·자동 퀸) | 보류 (식별 오인율 미측정) | **Phase 6+ 후보.** 승급 UI 는 **기존 결함**(§11) 으로 0b 에서 고친다. 진화 연출은 수 확정 뒤 재생·초읽기 생략 |
| B 무기 4종 이펙트 | 수정 (코믹만) | 보류 (15~20일) | 보류 (**Apple 9+ · GRAC 단순 폭력**) | 보류 (체크 연출 주인 모호) | **제외.** 검·망치·활·포크 전부. 재검토 조건 = grok 의 등급 실험(아래) |
| C 캐슬링 방패벽 + 방패 파손 | 채택 | 수정 (0.3초 연장 폐기) | 보류 (무기·피격 = 같은 설문) | 보류 (야생 모드 방패 능력과 **의미 충돌**) | **제외.** 캐슬링 연출은 방어 의미 없는 동작(룩·킹 하이파이브) 으로 §3 에 — 무료·짧게 |
| D 서사 훈장 3개 | 수정 (한국어 이름) | 수정 (2D 뱃지·칭호만) | 보류 (전사·전설 = 표시 오인) | 보류 (진행축 추가·혼합 편성 벌칙) | **Phase 5b 도감 "기록" 으로 흡수**, 3D 장착물·"포크 무기" 없음. 이름에 강함·전설 금지 |
| **K §14 제외** | 아니오 | **채택** | **채택** | **채택** | **채택.** 통합자가 유일하게 반대했고 셋의 근거(코드 비용·등급·수요 부재) 를 반박할 자료가 없다 |

**지금 반영한 "0원 수정" 4건** — 코드·자산 비용 없이 문장만 바꾼 것:
1. §10-15 토글 **기본 켜짐**: 대국 중 상대 기물은 내 설정으로(chess.com 표준), 상대 외형은 입장식·종료 화면.
2. §12.4 **레벨업 코인 삭제** — §12.2 "코인 지급 아님" 과 모순이었다(codex 결함 1). 진행축은 **레이팅(실력) + 레벨(계정)** 둘뿐. 성장 단계·훈장은 도감 기록으로.
3. §11 리스크 2줄: **승급 퀸 하드코딩**(기존 결함) · **IARC 재설문**.
4. §14.4 "접촉 시각 불변" 과 §14.5 "0.3초 더 길다" 의 자체 충돌(agy 결함 3) → 14.5 문장 삭제.

**등급 실험 (B·C 재검토 조건, grok)**: 맨몸 포효 / 당근검 / 검 "왕 목" 클립 3개로 Play IARC 설문과 App Store Connect 연령 설문을 각각 내고 GRAC·ESRB·PEGI·Apple 배지를 표로 붙인다. 검이 전체이용가·4+ 가 아니면 무기는 영구 제외. 확인된 기준 원문: Apple "Guns or Other Weapons: References to or depictions of guns, weapons, or objects that may cause bodily harm. May include: guns, swords, or knives." 는 **9+ 부터**("Infrequent guns or other weapons"), 4+ 는 "contain no objectionable material". GRAC 전체이용가는 폭력 "요소가 단순하게 표현". Play IARC: ESRB E "minimal cartoon, fantasy or mild violence" · PEGI 3 "comical context (typically cartoonlike - Bugs Bunny or Tom & Jerry…)". Play Families: "Apps that include violence, gore, or shocking content not appropriate for children." 위반.

**가독성 실험 (A 재검토 조건, codex)**: 폰 3종 혼합판과 표준판을 같은 참가자에게 순서를 바꿔 보여 제한 시간 안에 역할·합법 수를 고르게 한다. **역할 오인율 · 첫 판단 시간 · 표준 실루엣 전환율** 기록. 어린이에겐 "더 센 말이 뭐야" 를 물어 외형→능력 오해를 잰다. 결과 전엔 혼합 군단을 일정에 넣지 않는다.

**드로우콜 실험 (장비 전체의 전제, agy)**: 통합자의 "메시 병합 또는 인스턴싱" 은 틀렸다 — 본을 따라 변형되는 `SkinnedMesh` 에 정적 장비를 `mergeGeometries` 로 합칠 수 없고 `InstancedMesh` 는 본 트랜스폼을 따르지 않는다. 남는 길은 **변형별 사전 베이킹 GLB** 또는 장비를 같은 스켈레톤에 바인딩한 스킨드 메시. 폰 8개 × 소켓 3 + 4기물 동시 이동 국면에서 `renderer.info.render.calls` 실측, 40 초과면 사전 베이킹으로.

**표시 원칙 (전 항목)**: 표시광고법 제3조 "소비자를 속이거나 소비자로 하여금 잘못 알게 할 우려" · 시행령 "사실을 지나치게 부풀려" / "은폐하거나 축소" (grok 결함 6). 외형 상품·성장·도감 화면의 **첫 문장은 "외형만 · 수는 같음"**, 단계·상품 이름에 **강함·전사·전설·진화** 금지(TFT 조차 "별" 이 보드의 능력 언어와 겹친다 — grok 결함 7). 외형 전용 공정위 처분 사례는 못 찾았다(grok, 검색 범위: 공정위 보도자료·law.go.kr).

### 14.1 기물 캐스팅 — "역할은 체스, 배우는 내가"
- **군단 편성 화면**: 16칸 라인업. 역할마다 **배우 풀**이 있고 같은 역할 안에서는 자유 혼합. 폰 8칸에 강아지 3·토끼 2·고양이 2·고슴도치 1 — 전부 "폰" 이다. 상대도 자기 군단으로 온다.
- **역할 실루엣 규약**(가독성 — 3차 agy 의 "패턴 인지" 지적): 같은 역할의 배우는 **키·덩치 띠**를 공유한다. 폰 = 작은 동물(무릎 아래), 나이트 = 네발 중형·목이 길지 않음, 비숍 = **키가 큼/날개**, 룩 = 묵직한 거체, 퀸 = 날렵한 대형 맹수, 킹 = 왕관+갈기. 어떤 배우를 골라도 **5m 밖에서 역할이 읽혀야** 한다. 매니페스트 lint 가 `roleBand`(높이·바닥 면적) 를 검사한다. 그래도 헷갈리면 §10-15 표준 실루엣 토글.
- **폰 배우 풀(초기)**: 미어캣 · 토끼 · 강아지(코기) · 고양이 · 고슴도치 · 오리새끼 · 펭귄 · 다람쥐. **나이트**: 얼룩말 · 사슴 · 말 · 타조(달리기) · 캥거루(도약!). **비숍**: 기린 · 앵무새 · 플라밍고 · 두루미 · 올빼미. **룩**: 코끼리 · 코뿔소 · 하마 · 곰 · 거북(등딱지=성벽). **퀸**: 암사자 · 흑표범 · 치타 · 늑대 · 독수리. **킹**: 사자 · 호랑이 · 곰왕 · 고릴라 · 용(시즌).
- **승급 = 진화의 순간** (체스에 이미 있는 진화!): 폰이 8열에 닿으면 퀸·룩·비숍·나이트 **선택 화면이 곧 진화 화면**. 강아지 폰 → 퀸이면 **늑대 여왕**, 룩이면 **곰**, 토끼 폰 → 비숍이면 **달토끼 두루미 사제**… 배우별 **진화 계보**를 매니페스트에 둔다(`promoteTo: { queen: "wolf_queen", rook: "bear" }`). 연출: 빛 기둥·털갈이·포효. 규칙은 chess.js `promotion` 그대로.
- **대장 폰**: 폰 하나를 "대장" 으로 지정하면 깃발·완장. 외형만. 어린이가 가장 먼저 고르는 버튼이 될 것(미검증).
- **내 사진 기물(Phase 4 스킨 공방)** 과 결합: 우리 집 강아지 사진 → 폰 배우 추가. §6.
- ▶ **4차 판정**: Phase 6+ 후보. (a) 승급 선택은 **자동 퀸 기본 + 언더프로모션 1탭**(chess.com "This can save crucial seconds in bullet games!" · lichess "Promote to Queen automatically"), 진화 연출은 수 확정 **뒤** 재생, 초읽기엔 생략(codex 결함 8). (b) 혼합 군단은 **내 화면·입장식·종료 화면**에서만, 상대 대국 화면은 표준(§10-15). (c) 편성 동기화: 대국 시작 때 16칸 배우 ID·장비를 교환하고 **서버가 소유를 검증**, 상대 GLB 는 입장식 전에 프리로드(agy §3-2). (d) `test/applet.test.mjs:48~56` 의 `expectedModels` 7개 단언을 팩 매니페스트 기반으로 다시 짠다(agy §3-3). (e) "그 배우로 N판" 은 한 판에 같은 배우가 여럿이어도 **1회**(codex 결함 2).

### 14.2 성장 — "같은 강아지인데 더 강해 보인다"
능력 변화 0, 확률 0, 거래 0 → 한국 확률법·Play 가족 정책 밖(§12.3).
| 단계 | 조건(예시 — 수치는 Phase 5b 실측) | 외형 변화 | 연출 변화 |
| :--- | :--- | :--- | :--- |
| 1 새끼 | 기본 | 둥글고 작음, 큰 눈 | 넘어지며 공격(귀여움) |
| 2 성체 | 그 배우로 N판 | 체격·털결 · 흉터 1개 | 공격 모션 안정 |
| 3 전사 | 그 배우로 적 N기 잡음 | **가죽 갑옷·전투 문신·이빨 목걸이** | 포효 추가, 먼지 2배 |
| 4 전설 | 그 배우로 체크메이트 N회 | **빛나는 눈·오라·흔들리는 망토** | 등장 시 카메라 줌, 전용 BGM 스팅 |
- **무패 훈장**: 한 판에서 한 번도 안 잡힌 폰이 승급까지 가면 "철벽" 훈장 — 다음 판부터 발에 금 발찌. 이런 **"서사 훈장"** 을 10개쯤: 앙파상 5회 = "바람 망토", 나이트 포크 10회 = **"포크(식기) 무기"**(진짜 포크 — 농담이 곧 보상), 캐슬링 50회 = "성문 방패", 스테일메이트 유도 = "평화의 올리브 관", 1수 메이트(풀스메이트) 달성 = "바보 모자 수집가"(상대가 쓴 모자를 내가 전리품으로).
- **성장은 배우별**이다. 강아지 전설을 키워도 토끼는 새끼. → "다음엔 토끼를 키워야지" 가 재플레이 동기(StS 식 해금 루프, §12.9).
- **퇴화 없음.** 어린이 설계: 잃는 것이 없다.
- ▶ **4차 판정**: 출시 제외, Phase 5b **도감 "기록"** 으로 흡수. 단계명 전사·전설·"강해 보인다" **금지**(표시광고법 오인 우려, grok 결함 6·7) → 털색·흉터·리본처럼 능력과 무관한 말로. 성장 보상은 **슬롯을 점유하지 않는** 색·재질·도감 기록만 — 갑옷·망토·방패는 판매 장비와 슬롯이 겹친다(codex 결함 3). 훈장은 2D 뱃지·칭호(agy). "포크(식기) 무기" 삭제(무기 + 영어 농담). 진행축은 레이팅·레벨 둘.

### 14.3 장비 — 리그 본 소켓 (§12.3 `sockets` 확장)
| 슬롯 | 본 | 예시 | 비고 |
| :--- | :--- | :--- | :--- |
| 머리 | `Head` | 투구 · 왕관 · 리본 · 바보 모자 · 선글라스 · 꽃 | 킹의 왕관은 계승 연출(§3)과 충돌 → 킹 머리 슬롯은 **왕관 디자인 교체**로만 |
| 목 | `Neck` | 방울 · 이빨 목걸이 · 스카프 · 넥타이 | 소리 아이템: 방울은 걸을 때 딸랑(sfx 소켓) |
| 등 | `Spine2` | 망토 · 날개 · 안장 · 배낭 · 깃발 | 망토는 cloth 흉내 — 본 3개 체인으로 흔들림, 물리 없음 |
| 손/입 | `Hand_R` 또는 `Jaw` | **무기** (§14.4) | 네발 동물은 입에 문다(강아지가 검을 물고 달려드는 그림) |
| 반대손/등 | `Hand_L` / `Spine1` | **방패** · 냄비 뚜껑 · 거북 등딱지 · 나뭇잎 | 잡힐 때 방패가 먼저 깨진다(§14.5) |
| 발 | `Foot_*` | 금 발찌 · 장화 · 롤러(코믹) | 걸음 먼지 색이 바뀜 |
| 꼬리 | `Tail` | 리본 · 불꽃 · 별 | 꼬리 없는 배우(앵무새)는 슬롯 비활성 — lint |
- **장비는 배우에 종속되지 않는다**: 강아지에 입힌 투구를 고양이에 옮길 수 있다(계정 소유, 슬롯 선택 저장 — §12.3).
- **세트 효과 = 연출만**: 같은 테마 3개(기사단·해적·우주·한복·마법학교·운동회) 를 맞추면 **등장식 오라·전용 대기 모션** 해금. 능력 0.
- **군단 입장식**: 대국 시작 때 양 군단이 장비를 갖추고 행진해 들어온다(TFT 식). 상대 군단을 구경하는 10초가 "상점이 성립하는 10초" 다. 건너뛰기 버튼 필수(3차 agy 연출 피로).
- ▶ **4차 판정**: 장비 전체가 두 전제 위에 있다 — ① `keepMaterials` 선행(`:1533` `child.material = primaryMat` 가 장비 재질도 덮는다, agy 결함 2) ② 드로우콜 실험(§14.0, 통합자의 병합·인스턴싱 안은 틀림). 무기·방패는 §14.4·14.5 판정에 따라 제외. 남는 후보는 **비무기 장식**(리본·방울·모자·목걸이·발찌) 만. 입장식은 §10-15 와 함께 "상대 외형을 보는 유일한 시간" 이 됐다.

### 14.4 무기 → 잡기 연출이 달라진다 (`vfx.attack` 를 무기가 덮어쓴다)
체스의 "잡기" 는 한 종류지만 연출은 무기 수만큼. **접촉 시각(`attackSync.contactSec`)은 무기가 바꾸지 못한다** — 무기는 이펙트·사운드·카메라만 바꾼다(§4.3 adapter 가 보장).
| 무기 | 잡기 연출 | 체크 연출 | 메이트 피니셔 | 느낌 |
| :--- | :--- | :--- | :--- | :--- |
| 검 | 베기 슬래시 · 잔상 | 왕 목에 검 끝 | 하늘 베기 · 화면 2분할 | 정석 |
| 망치 | 땅 충격파 · 화면 흔들림 · 돌 파편 | 바닥 금 가기 | 판 전체 흔들리고 왕 모자 날아감 | 통쾌 |
| 창 | 찌르기 관통 · 바람 선 | 창이 왕 앞 바닥에 꽂힘 | 창 던져 깃발 꽂기 | 날렵 |
| 활 | **화살 궤적**(비숍·룩·퀸 장거리 잡기에 어울림) | 화살이 왕관 스침 | 화살비 | 원거리 역할 전용 추천 |
| 마법봉·지팡이 | 별가루 · 변신(잡힌 기물이 개구리로) | 왕 주변 룬 | 유성우 | 마법학교 세트 |
| 당근검 · 포크 · 냄비 | 코믹 효과음 · 별 뿅 | 물음표 | 꽈당 | 어린이 최애 후보(미검증) |
| 물총 | 물방울 · 무지개 | 왕이 젖음 | 분수 | 여름 시즌 |
| 붓 | 먹물 튀김 · 한 획 | 서예 "將" | 한 폭의 그림으로 정지 | 집콕·한복 세트 |
| 악기(북·나팔) | 음파 링 · 노트 | 팡파르 | 콘서트 | 운동회 세트 |
| 맨몸(기본) | 종별 고유(사자 포효·코끼리 박치기) | §2.1 | 왕관 계승(§3) | C 등급도 완성품 |
- **무기별 사운드 세트**: 같은 무기라도 배우 소리와 섞인다(강아지+망치 = "멍!"+쿵).
- **잡힌 쪽 리액션도 무기에 반응**: 망치면 멀리 날아가고, 마법봉이면 개구리가 되어 폴짝 뛰어 나간다, 물총이면 젖어서 털 털기. `hit` 클립 + 무기별 `hitVariant`.
- **카메라 연출 등급**: C 는 고정 카메라, A/S 는 줌·슬로모 0.4초. 초읽기 중엔 자동 꺼짐(§12.3 배속).
- ▶ **4차 판정: 제외.** ① 등급: 검·망치·활·포크는 Apple "Guns or Other Weapons … swords, or knives" → 9+, GRAC 전체이용가 "단순하게 표현" 경계, Play Families 폭력 조항(grok 결함 1·2). ② 코드: 활은 공격자가 `strikePos` 까지 달려가는 `applyConcreteTrajectory(u, startPos, strikePos)`(`:2572`) 구조와 맞지 않아 발사체 솔버가 따로 필요(agy 결함 4). 메이트 피니셔는 `stepKingFall`(`:3593`) 이 패배 킹만 연출하고 공격자 시퀀서·카메라 훅이 없다(agy 결함 5). ③ 디자인: 발견 체크·더블 체크에서 "왕 목에 검 끝" 의 주인이 없다(codex 결함 7). 재검토 조건은 §14.0 등급 실험. 살릴 수 있는 것: **종별 맨몸 공격의 파티클 색·사운드 변주**(무기 없이, 설문 영향 없음).

### 14.5 방패·방어는 "잡히는 연출" 을 바꾼다
체스에 방어는 없다. 그래서 방패는 **"잡힐 때 얼마나 멋있게 지는가"** 의 아이템이다 — 패배 연출에 돈을 쓰게 하는 설계는 chess.com 에도 lichess 에도 없다(§12.9), 이게 WILD CROWN 의 빈 자리 후보.
- ~~방패 있음: 공격이 먼저 방패를 깨고(파편), 그다음 쓰러진다 → 0.3초 더 길다. 초읽기 중 자동 생략.~~ (v0.7 삭제 — §14.4 "접촉 시각 불변" 과 자체 충돌. 안무는 `tApproach→tContact→tImpact→tStrikeDone` 단일 타임라인(`:2440~2449`), agy 결함 3)
- 거북 룩: 등딱지에 숨었다가 끌려 나감. 냄비 뚜껑: 땡 소리. 나뭇잎: 바람에 날아감.
- **캐슬링 = 방패벽**: 룩이 킹 옆에 서며 방패를 세운다(외형만). 캐슬링이 처음 멋있어지는 체스.
- **"마지막 폰" 연출**: 폰이 하나만 남으면 작은 방패를 들고 떤다(귀여움·긴장).
- ▶ **4차 판정: 제외.** 같은 방패 그림이 랭크에선 장식, 야생 모드(§14.8 "방패 = 1회 잡힘 무효")에선 능력 — 7세에게 모드별로 뜻이 다른 아이템을 맡길 수 없다(codex 결함 5). 패배 연출에 돈을 낸다는 가설은 덤프 15개에 수요 근거가 없다(codex 결함 6 — 반례가 아니라 **부재**). 캐슬링 연출은 방어 의미 없는 동작(룩·킹 하이파이브·자리 바꾸기 춤) 으로 §3 에 무료로.

### 14.6 상황 연출 — 규칙이 만드는 순간을 전부 무대로
- **앙파상**: 지나가던 폰이 뒤에서 낚아채임 — "그림자 습격" 효과.
- **포크**: 나이트가 두 기물 사이에 착지하면 양쪽에 ❗ 말풍선 + 포크(식기) 반짝.
- **핀·스큐어**: 선으로 묶인 기물이 쇠사슬 흔들림(장식).
- **체크**: 왕 배우가 뒤로 한 발, 군단 전체가 왕 쪽을 본다(헤드 트래킹 — three.js 본 회전만).
- **스테일메이트**: 양쪽이 앉아서 차를 마신다. **무승부 합의**: 악수(앞발).
- **시간 초과**: 왕이 잠든다. **기권**: 왕이 왕관을 벗어 상대에게 건넨다(§3 계승 재활용).
- **일일 퍼즐(§10-14) 해결**: 퍼즐 속 왕이 왕관을 벗어 주는 짧은 연출 — 퍼즐에도 보상 감각.

### 14.7 "내 동물원" — 수집을 한 화면으로
- 가진 배우·장비·훈장이 **섬 하나에 살아 움직이는 3D 전시**(Chess Universe 펫 섬 아이디어의 3D 판, §12.9). 전설 단계 배우는 섬 중앙 바위 위.
- 잡은 상대 기물은 판 옆 **"우리"** 에 모인다(체스의 captured pieces 표시를 동물원으로). 상대 배우를 구경하는 또 하나의 10초.
- 도감 빈 칸은 실루엣 + "어떻게 얻나" 한 줄(확정가 또는 훈장 조건). 무작위 없음(§12.3).
- ▶ **4차 판정**: "우리" 는 **도감과 시각적으로 분리** — 잡힌 상대 기물은 한 판의 기록이지 소유가 아니다, 붙여 두면 "잡아서 얻었다" 로 오해(codex 결함 9). 현재 코드는 `capturedByWhite/Black` 숫자 카운터만(`:1441`) 이라 어차피 새로 만든다. 섬 전시는 Phase 6+.

### 14.8 야생 모드로 보낸 것 (§12.8) — 능력이 붙는 순간 여기로
창 = 2칸 앞 공격 · 방패 = 1회 잡힘 무효 · 활 = 원거리 잡기 · 망치 = 인접 칸 밀치기 · 마법봉 = 잡힌 기물을 1턴 개구리(이동 불가) · 날개 = 기물 뛰어넘기. **전부 비레이팅·별도 규칙 엔진.** 위 §14.4 의 연출 자산을 그대로 재사용하므로 야생 모드의 추가 비용은 규칙뿐이다 — 이것이 연출을 먼저 만드는 이유.

### 14.9 비용 · 순서 · 틀릴 수 있는 곳 (v0.6 원안 — v0.7 판정은 §14.0, agy 일수 추정: A 14~18일 · B 15~20일 · C 7~10일 · D 10~14일, 전부 "추정")
- **배우 1종 = 리그 1 + 클립 세트 1 + 승급 계보 1 + 성장 4단계 재질/장식**. Quaternius 공여 리그 재사용(§2.2)이면 모델만. **초기 폰 배우 8종은 과하다 → 출시 3종(미어캣·토끼·강아지), 나머지는 시즌**. 역할당 2종이면 6역할 × 2 = 12종 = v0.3 과 같은 수.
- **장비는 배우보다 싸다**(메시 1개 + 소켓). 무기 10종 × 이펙트 3종(잡기·체크·메이트) = 30 연출 — Phase 3 "VFX 3종" 과 같은 공장에서 만든다. 출시는 **무기 4종(검·망치·활·당근검)** 으로.
- 순서: Phase 2 에 **캐스팅 UI + 폰 3종**(배우 혼합이 되는지, 실루엣 규약이 읽히는지 테스터 5명) → Phase 3 에 **무기 4종 이펙트** → Phase 5b 에 **성장 단계·훈장·동물원**. 로드맵 §9 의 주차는 바꾸지 않았다 — 캐스팅 UI(약 3일)·무기 이펙트(3종→4종 무기별로 ×3 = 약 1주 추가) 는 **Phase 2·3 에 +1주 리스크**로 적는다.
- 틀릴 수 있는 곳: ① 혼합 군단이 **상대 입장에서 읽히는가** — 실루엣 규약으로 충분한지 실측 전(§10-15 토글이 안전망). ② 성장 4단계가 "강해 보인다" 가 아니라 "강하다" 로 **오해**되면 상품 표시 문제(§12.3 "이동 규칙 동일" 문구를 성장 화면에도). ③ 패배 연출(방패) 에 돈을 쓴다는 가설 — 선례 없음. ④ 드로우콜: 장비 7슬롯 × 32기물 = 최대 224 메시 추가 → `SkeletonUtils.clone` 뒤 **장비를 기물 메시에 병합** 또는 인스턴싱 필요, §4.4 예산 재측정.
