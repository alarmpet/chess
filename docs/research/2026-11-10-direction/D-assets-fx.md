# D — 에셋·효과 현황과 조사 (2026-11-10)

범위: 캐릭터·에셋·배경·효과를 로컬 프로그램(TRELLIS·Blender·three.js)으로 더 좋게 만들 방향. 이 문서는 **현황 파악과 조사**만 한다. 코드·에셋은 건드리지 않았고, TRELLIS·ComfyUI·Blender 는 돌리지 않았다.

확인 방법 표기
- 「저장소」 = 이 PC 의 `D:\chess` 파일을 직접 읽음(파일:줄).
- 「API」 = GitHub REST API(`gh api repos/<owner>/<repo>`) 응답, 2026-11-10. 별·마지막 푸시·SPDX 라이선스.
- 「원문」 = LICENSE·README·package.json 원본 파일을 내려받아 읽음(raw.githubusercontent.com, 2026-11-10).
- 「검색 요약」 = 검색 결과 요약만 봄. 원문 페이지는 열지 않았다.
- 「원문 확인 못함」 = 기억. 쓰기 전에 다시 확인해야 한다.

---

## 1부 — 지금 상태

### 1.1 제작 경로

스킬 `C:\Users\petbl\.claude\skills\chess-character-pipeline\SKILL.md` 의 순서(28~36행): Flow 콘셉트 → 단계 그림 → 사용자 확인 → 한 마리 시험 → `make_biped.py` 일괄 → `build_looks.py` → 체스판 확인.

`D:\chess\tools\` 의 제작 도구(파일 머리 주석에서 확인)

| 파일 | 역할 |
| :--- | :--- |
| `comfy_concept.py` | 로컬 ComfyUI(Flux schnell GGUF)로 콘셉트 그림, img2img 지원 |
| `clean_concept.py` | Flow 그림 워터마크 지우기(cv2 inpaint) |
| `stage_warp.py` | 같은 얼굴로 몸만 늘린 단계 그림의 시작 그림 |
| `make_biped.py` | 콘셉트 → TRELLIS v1 fp16(best-of-N) → 감량 → `biped_rig.py` → 압축 → `legend_add_clips.py` → `public/packs/legend/<이름>.glb` |
| `biped_rig.py` | 메시 모양에서 다리·팔·꼬리를 찾아 뼈대(13~15개)를 세우고 bone heat 가중치, Idle·Walk·Run·Sit·Cheer 를 키프레임으로 직접 만듦 |
| `keepuv_low.py` | TRELLIS 원본 UV 를 유지한 채 감량(2만 면)·텍스처 여백 번짐 채우기. 재굽기 얼룩을 피하려고 만든 것 |
| `legend_add_clips.py` · `rebuild_clips.py` | Attack·Hit·Kneel·Yawn·종별 클립(Lookout·Roar) 추가, 전체 다시 굽기(72개 약 10분) |
| `kingdom_variant.py` · `starlit_variant.py` · `build_looks.py` | 진영 색·띠를 텍스처에 굽기(Cycles EMIT), 별빛 털, 단계×진영 일괄 |
| `make_prop.py` · `make_building.py` | 소품(2,500면·512)·건물/바다 생물(12,000면·768 등) |
| `render_glb.py` · `render_clip.py` | Blender 헤드리스 미리보기·클립 프레임 |
| `asset_gate.mjs` · `bundle_gate.mjs` · `drawcall_gate.mjs` · `perf_probe.mjs` | 게이트·측정 |

- 기획서 §5(`docs/PLAN.md` 256~274행)는 「공여 리그 `rig_transfer.py`」「`pack-chess.mjs` — 색 1024 WebP·`KHR_mesh_quantization`」을 적었으나, 실제 경로는 `biped_rig.py` + `keepuv_low.py` 다. **기획서 §5 와 실제가 어긋난다.**
- `CREDITS.md` 는 **없다**(`D:\chess\CREDITS.md`, `docs/CREDITS*` 둘 다 없음). CLAUDE.md 는 MIT·Apache·CC0 를 가져오면 `CREDITS.md` 에 적으라고 한다. 출처 한 줄은 `pack.json` 8행 `credits` 에만 있다.
- 스킬이 적어 둔 한계(SKILL.md): 떠 있는 장식은 TRELLIS 에서 사라짐(66행), 머리 큰 체형은 Head·Spine 을 꺾으면 찢어짐(59행), 사자는 팔을 들면 갈기가 갈라짐(60행), 가는 가지가 많으면 텍스처 펼치기가 멈춤(80행).

### 1.2 에셋 현황 (`npm run gate:assets -- --report`, 2026-11-10 실행)

| 묶음 | 개수 | 합계 | 삼각형 | 본 | 텍스처 | 개당 크기 |
| :--- | ---: | ---: | :--- | :--- | :--- | :--- |
| legend 기물(6종 × 단계 4 × {무색·w·b}) | 72 | 약 70MB | 20,000 | 13~15 | 1024 × 1장(4단계는 2장) | 906~1,129KB |
| legend 예비 두 발(study-game 13종) | 13 | 약 13MB | 약 8,000 | 15 | 1024 × 2장 | 823~1,204KB |
| legend/items 소품 | 7 | 1,210KB | 2,500 | 0 | 512 × 2장 | 144~227KB |
| legend/town 건물 | 10 | 5,389KB | 12,000 | 0 | 768 × 1장 | 459~660KB |
| legend/sea 바다 | 11 | 2,554KB | 2,500~13,998 | 0 | 384~768 × 1장 | 85~721KB |
| savanna(네 발, 텍스처 없음) | 12 | 11,923KB | 1,848~3,667 | 38~51 | 0 | 831~1,083KB |
| **전체** | **125** | **104,922KB**(상한 120,000) | | | | |

GLB 머리를 직접 읽어 확인한 것(node 로 JSON 청크 파싱)
- `lion_w.glb`: `extensionsUsed` = `EXT_texture_webp` **하나뿐**. 텍스처는 WebP 96KB 1장, 나머지 약 860KB 가 지오메트리·스킨·클립 10개다. **meshopt 압축도 양자화도 없다.** 재질은 기본색 1장 + `roughnessFactor 0.6` 고정, 노멀 맵 없음.
- `lion_s4_w.glb`: 위에 발광 맵 6KB 추가(`KHR_materials_emissive_strength`).
- `town/bakery.glb`·`sea/turtle.glb`: 확장 없음, JPEG 1장, 압축 없음.
- `items/bell.glb`: `EXT_texture_webp` + `KHR_mesh_quantization`, 기본색 + 노멀 2장.
- `pack.json` 은 기물을 `_w`·`_b` 이름으로만 참조한다(77~346행). 접미사 없는 24개는 `build_looks.py` 의 입력이고, study-game 13종과 `savanna` 팩은 `src/` 에서 이름 검색 결과가 없다. **약 49MB 가 화면에 안 쓰이면서 `public/` 에 있다**(빌드에 실리는지는 재 보지 않았다).

### 1.3 성능 예산과 게이트

- 드로우콜 상한 100. 첫 국면 98 → 받침·별 인스턴싱 뒤 **68**, 잡기 최대 75(`docs/qa/2026-11-09-capture-drawcalls.md` 16~19행). 같은 문서 21행: **삼각형 1,693,990**.
- 마을 섬 드로우콜 120 안팎, 상한 150(`docs/STATUS.md` 108행).
- JS gzip 상한 400KB(`tools/bundle_gate.mjs` 10행). STATUS 210행에 「번들 여유 3KB」. 이번에 빌드해서 다시 재 보지 않았다.
- GPU: 체스 초기 국면 19.0~21.5ms(`docs/perf/2026-11-05-gpu-probe.log`, `2026-11-05-wave-after2.log`, Intel UHD, 96콜), 기억 파일에는 1024×768 에서 21.6ms. 콜백 JS 는 1.4~2.6ms 라 **GPU 가 병목**이다.
- fps 는 이 PC 창이 rAF 를 제한해 못 잰다(STATUS 214행). 계층 렌더 실험은 가만히 있을 때 GPU 20.6 → 11.8ms 였으나 기본 꺼짐(STATUS 215행).

### 1.4 효과·조명 현황

`src/fx/` (파일 머리 주석)

| 파일 | 한 줄 |
| :--- | :--- |
| `impactFx.js` · `impactTier.js` | 잡기 효과(별 InstancedMesh 1콜·충격 고리·글자·흰 번쩍·눌림·카메라 흔들림), 세기 3단계 |
| `signatureFx.js` | 동물별 시그니처 잡기 6종 |
| `attackStyle.js` · `captureReaction.js` · `captureSpecial.js` · `moveStyle.js` | 새 클립 없이 몸 전체 자세로 만든 공격·반응·특례·이동 |
| `contactShadows.js` | 말 밑 어두운 점, 전체 1콜 |
| `openSea.js` · `seaBiome.js` · `water.js` · `reefLife.js` | 바다(깊이 패스 없이 쿼드 1장), 섬, 마을 물, 산호·물고기(종마다 InstancedMesh, 정점 셰이더로 헤엄) |
| `layeredRender.js` | 정적 층을 렌더 타깃에 가끔만 그리는 실험 |
| `settings.js` | 효과 설정 |

`src/wizardChessEngine.js`
- 렌더러: `antialias: true`, 픽셀 비율 최대 2(69행), `PCFSoftShadowMap` + `autoUpdate = false`(70~73행), ACES 톤 매핑(74행). 바다 팩에서는 `NeutralToneMapping` 으로 바꿈(1143행).
- 조명: 반구광 1 + 그림자 내는 평행광 1(그림자 맵 2048², 243~255행) + 보조 평행광 2(259·263행). 대성당용 점광원은 바다 팩에서 끔(1131~1133행).
- 환경: PMREM 환경맵을 코드로 만듦(84~114행), 바다 팩은 `daylightEnvironment`(1140행). HDRI·스카이박스 그림 파일은 쓰지 않는다.
- 재질: 전부 `MeshStandardMaterial`·`MeshBasicMaterial`. `MeshToonMaterial`·매트캡은 검색 결과 없음.
- **후처리 없음.** `package.json` 의존성에 `three ^0.170.0` 만 있고 `postprocessing` 은 없다. `EffectComposer` 검색 결과도 없다. 기획서 §4.2 의 「WebGL + `postprocessing`」(206행)은 구현되지 않았다.
- 로더: `GLTFLoader` 만(3·891행). `KTX2Loader`·`MeshoptDecoder`·`DRACOLoader` 연결 없음.
- 기물은 `SkeletonUtils.clone` 으로 말마다 따로(2031행), 믹서도 말마다(2059행).

`src/village/islandScene.ts`: 픽셀 비율 최대 1.5(393행), 그림자 맵 끔(397행), 접촉 그림자로 대체. 풀·돌·나무·깃발은 InstancedMesh.

### 1.5 STATUS.md 의 열린 항목(에셋·효과)

| 번호 | 내용 | 상태(행) |
| :--- | :--- | :--- |
| AF-4 | 동물별 이동 클립(두리번·하품·포효) | 부분, 몸 전체 6종만(28) |
| CV | 소품 위치가 새 체형에 안 맞음(킹 방울이 얼굴 가림, 3단계 선글라스 낮음) | 열림(34) |
| PF-4 | 하늘·물·먼 경치·시간 흐름 | 부분(56) |
| PF-5 | 타격 구조·퐁당·파편 세기 | 미착수(57) |
| PF-6 | 움직임 반응·그림자·생각 표현 | 미착수(58) |
| PF-7 | 시작 화면·전환·끝 장면 | 미착수(59) |
| PF-8 | 후처리·품질 등급(내장 그래픽 30fps) | 미착수(60) |
| IE-0 | 마을 섬 투명 바다·해 지는 시간 흐름 | 미착수(86) |
| DY | 역할별 Attack 클립 변형 | 열림(123) |
| MG-S3 | 사자 1종 Blender 완성판(리토폴로지·가중치·LOD·KTX2) | 미착수(207) |
| MG-S4 | 변형을 머티리얼 변형으로 압축(112MB → 40MB 추정) | 미착수(208) |
| 실험 ① | 계층 렌더 기본 켜기 | 결정 대기(215·241) |
| AT | 건물 맞히기 14/24(LLM 대행) | 사람 시험 남음(114·116) |

### 1.6 지금 가장 약한 곳 5개

1. **기물이 무겁고 압축이 없다.** 말 하나 20,000면 × 32마리, 프레임당 삼각형 169만(qa 11-09 21행). GLB 는 텍스처 96KB 에 지오메트리·클립 860KB 인데 meshopt·양자화가 없다(1.2). 쓰지 않는 49MB 가 `public/` 에 있다. GPU 가 병목인데(1.3) 체스 카메라 거리에서 2만 면이 필요한지 재 본 기록이 없다.
2. **리그와 동작이 얕다.** 뼈 13~15개, 손·얼굴·귀 없음. 클립 9~10개는 전부 스크립트 키프레임이다(`biped_rig.py`·`legend_add_clips.py`). Head·Spine 을 꺾으면 찢어진다(SKILL.md 59행). 그래서 공격·반응을 「몸 전체 자세」로 대신했고(`attackStyle.js` 머리 주석), AF-4·DY 의 클립 변형이 열려 있다.
3. **재질·조명이 한 가지 모습이다.** 기본색 1장 + roughness 0.6 고정, 노멀 없음(1.2). 후처리·품질 등급이 없다(PF-8). 픽셀 비율 2 + 2048² 부드러운 그림자 + Standard 재질이 내장 그래픽에서 19~21ms 를 쓴다(1.3·1.4).
4. **배경이 정적이다.** 하늘·환경맵이 코드 생성이고 시간 흐름이 없다(PF-4 부분, IE-0 미착수). 먼 경치는 작은 섬 9개(`pack.json` 29행)뿐이다.
5. **작은 것들의 마감.** 소품이 체형에 안 맞고(CV 34행), 건물은 LLM 대행 시험에서 24개 중 14개만 맞혔고(STATUS 114행), 타격·파편·퐁당(PF-5)과 그림자·반응(PF-6)이 미착수다. 출처 파일 `CREDITS.md` 도 없다.

---

## 2부 — 조사

### 2.1 이미지 → 3D 로컬 모델

| 모델 | 저장소 | 라이선스 | 별 · 마지막 푸시(API) | VRAM(README 원문) | 출력 | 8GB |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TRELLIS v1 | microsoft/TRELLIS | MIT | 14,228 · 2026-10-27 | 「at least 16GB」(README 41행) | GLB, 기본색 텍스처 | **지금 fp16 으로 돌리는 중**(로컬 실측) |
| TRELLIS.2 (4B) | microsoft/TRELLIS.2 | MIT | 12,779 · 2026-07-10 | 「at least 24GB」(README 60행) | PBR GLB, 모양만 주고 PBR 텍스처 생성도 있음(185행) | 공식은 안 됨. 커뮤니티 포트의 6~8GB 주장은 검색 요약뿐 |
| Hunyuan3D-2 / 2.1 | Tencent-Hunyuan/Hunyuan3D-2, -2.1 | 텐센트 커뮤니티 라이선스 | 15,375 · 4,401 | 2.0: 모양 6GB·텍스처 포함 16GB / 2.1: 모양 10GB·텍스처 21GB·합 29GB | 2.1 은 PBR | **한국에서 쓸 수 없다**(아래) |
| TripoSG | VAST-AI-Research/TripoSG | MIT | 1,895 · 2025-04-18 | 「at least 8GB VRAM」(85행) | 모양만(텍스처 없음 — README 에서 텍스처 언급을 못 찾음) | 됨(공식 최소) |
| TripoSR | VAST-AI-Research/TripoSR | MIT | 7,349 | 약 6GB(41행) | 저해상 메시·정점색 | 됨 |
| Stable Fast 3D | Stability-AI/stable-fast-3d | Stability 커뮤니티 라이선스 | 1,931 · 2025-01-22 | 약 6GB(80행) | UV 텍스처 GLB | 됨. 연 매출 100만 달러 미만 무료 |
| SPAR3D | Stability-AI/stable-point-aware-3d | 같은 계열(원문 확인 못함) | 1,087 | 기본 10.5GB, 저VRAM 모드 약 7GB(48행) | 텍스처 GLB | 저VRAM 모드로 |
| InstantMesh | TencentARC/InstantMesh | Apache-2.0 | 4,596 · 2025-01-03 | README 에 수치 없음 | 텍스처 메시 | 재 보지 않았다 |
| PartCrafter | wgsxm/PartCrafter | MIT | 2,510 · 2026-04-16 | 「at least 8GB VRAM」(132행) | 부품별 메시(텍스처 없음) | 됨(공식 최소) |
| HoloPart | VAST-AI-Research/HoloPart | MIT | 676 | 열지 않음 | 부품 분리·가려진 부분 채움 | 재 보지 않았다 |
| Hunyuan3D-Part · Omni | Tencent-Hunyuan/… | 텐센트 커뮤니티 라이선스 | 558 · 661 | 열지 않음 | 부품 분리 | **한국 제외** |
| SAM 3D Objects | facebookresearch/sam-3d-objects | SAM License | 7,661 | 열지 않음 | — | 상업 조건 원문 끝까지 읽지 못함 |
| Stable3DGen(Hi3DGen) | Stable-X/Stable3DGen | MIT | 1,291 | 열지 않음 | 노멀 기반 고정밀 모양 | 재 보지 않았다 |

**텐센트 Hunyuan 계열은 한국에서 쓸 수 없다.** LICENSE 원문 3행: "THIS LICENSE AGREEMENT DOES NOT APPLY IN THE EUROPEAN UNION, UNITED KINGDOM AND SOUTH KOREA" (https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/LICENSE, 2026-11-10). 같은 문장이 Hunyuan3D-2.1, Hunyuan3D-Part, HunyuanWorld-1.0, HY-Motion-1.0 의 라이선스 파일에도 있다(각각 내려받아 확인). 산출물을 지역 밖에서 쓰는 것도 금지한다(같은 파일 39행 c 항).

Stable Fast 3D: "generating annual revenue of less than US $1,000,000" 인 개인·조직에 무료(https://raw.githubusercontent.com/Stability-AI/stable-fast-3d/main/LICENSE.md 10행, 2026-11-10).

TRELLIS.2 의존성: README 316~318행이 nvdiffrast 는 자기 라이선스를 따른다고 적었다. nvdiffrast 라이선스 원문은 열지 않았다. 생성 뒤 GLB 만 쓰는 데 영향이 있는지는 **확인 못함**.

읽어 낸 것
- 지금 쓰는 TRELLIS v1(MIT)은 계속 써도 된다. 바꿀 후보는 **TRELLIS.2 하나**인데 공식 최소가 24GB 다. 커뮤니티 포트(`visualbruno/ComfyUI-Trellis2`, MIT, 별 882, 2026-02 「FP8 models」 추가 — 페이지 확인)가 있으나 그 페이지에 VRAM 수치는 없다. 「8GB 에서 1024³」은 검색 요약에 나온 개인 주장이다. **이 PC 에서 되는지는 재 보지 않았다.**
- 부품 분리(PartCrafter, MIT, 8GB)는 「왕관·갈기·몸」을 따로 뽑아 소품·장식 문제(SKILL.md 66행 「떠 있는 장식은 사라진다」)를 풀 후보다. 텍스처가 없어 TRELLIS 텍스처를 옮겨야 한다.

### 2.2 자동 리깅·애니메이션

| 도구 | 저장소 | 라이선스 | 별(API) | VRAM | 메모 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| UniRig | VAST-AI-Research/UniRig | MIT | 2,081 · 2026-06-04 | 「at least 8GB VRAM」(README 394행) | 뼈대 + 스킨 가중치 예측. 공개 체크포인트는 Articulation-XL2.0 학습본, Rig-XL/VRoid 전체 모델은 「⏳」(66행) |
| SkinTokens | VAST-AI-Research/SkinTokens | MIT | 626 · 2026-05-12 | 「at least **14 GB**」(42행) | UniRig 후속. 8GB 로는 공식 최소 미달 |
| Puppeteer | Seed3D/Puppeteer | Apache-2.0 | 444 · 2025-09-19 | README 에 수치 없음 | 뼈대·가중치 뒤 **영상을 보고 동작을 맞춤**(42행) |
| MagicArticulate | Seed3D/MagicArticulate | Apache-2.0 | 418 | 열지 않음 | 뼈대 생성 가중치 공개(49행) |
| RigNet | zhan-xu/RigNet | **GPL-3.0** | 1,528 · 2024-11-04 | — | 코드 복사 금지 대상. 도구로 돌리는 것의 산출물 문제는 따로 판단 |
| Mesh2Motion | Mesh2Motion/mesh2motion-app | 코드 MIT · 에셋 CC0(README 59행) | 3,658 · 2026-11-07 | 브라우저 도구, GPU 불필요 | 「Mixamo 와 비슷한」 웹 앱(13행). 뼈대 맞추고 동작 골라 GLB 내보내기 |
| MDM | GuyTevet/motion-diffusion-model | MIT | 4,130 | 열지 않음 | 사람 동작(HumanML3D·SMPL). 데이터·SMPL 은 별도 라이선스 |
| MoMask | EricGuo5513/momask-codes | MIT | 1,344 · 2024-09-13 | 열지 않음 | README 245행: SMPL·데이터셋은 「their own respective licenses」 |
| HY-Motion 1.0 | Tencent-Hunyuan/HY-Motion-1.0 | 텐센트 커뮤니티 | 2,662 | — | **한국 제외** |
| blender-animation-retargeting | Mwni/blender-animation-retargeting | **라이선스 파일 없음**(API `license: null`) | 739 | — | 읽기만 |
| Rokoko Blender 플러그인 | Rokoko/rokoko-studio-live-blender | LGPL-3.0 | 515 | — | 리타게팅 기능 포함(원문 확인 못함) |
| Mixamo | — | — | — | — | 약관 원문을 열지 않았다. **원문 확인 못함** |

`make_biped.py` 방식과 견줘 얻을 것
- 지금: 메시 높이 띠로 관절 위치를 찍고 bone heat 가중치(`biped_rig.py` 머리 주석). 머리 큰 치비 체형에서 목·갈기가 찢어진다.
- UniRig(MIT, 8GB): 학습된 가중치 예측이라 **찢어짐이 줄 수 있다**(재 보지 않았다). 다만 뼈 이름·개수가 달라져 `legend_add_clips.py` 의 클립(뼈 이름 고정)과 에셋 게이트 본 상한 24 를 다시 맞춰야 한다. 기획서 §5.3 도 UniRig 를 폴백으로 적어 뒀다.
- Mesh2Motion(MIT + CC0): 사람형 동작 묶음을 CC0 로 받는다. 손 키프레임 9~10개를 「걷기·달리기·환호·앉기」 진짜 동작으로 바꿀 가장 싼 길이다. 치비 비율에 맞는지는 재 보지 않았다.
- 텍스트→동작(MDM·MoMask): 코드는 MIT 지만 학습 데이터(HumanML3D·AMASS)와 SMPL 이 별도 라이선스다. 상업 이용 판단이 어렵다. **보류.**

### 2.3 Blender 자동화로 품질 올리기

| 일 | 도구 | 라이선스 | three r170 |
| :--- | :--- | :--- | :--- |
| 리토폴로지 | Instant Meshes(`wjakob/instant-meshes`, 별 6,292, BSD 3조항 형식 — LICENSE.txt 원문) · QuadriFlow(`hjwdzh/QuadriFlow`, 별 883, BSD 형식 — LICENSE.txt 원문). Blender 내장 QuadriFlow 리메시는 **원문 확인 못함** | BSD 계열 | 해당 없음 |
| 감량·LOD | Blender Decimate(지금 `keepuv_low.py`), glTF-Transform `simplify`(meshoptimizer) | MIT | `THREE.LOD` 예제 `webgl_lod` r170 에 있음 |
| 지오메트리 압축 | glTF-Transform `meshopt` — 「compresses geometry, morph targets, and keyframe animation」(CLI README 40행) · Draco | MIT · Apache-2.0 | `examples/jsm/libs/meshopt_decoder.module.js`(24KB)·`DRACOLoader.js` 가 r170 에 있음(로컬 `node_modules/three` 확인) |
| 텍스처 압축 | glTF-Transform `webp`·`uastc`·`etc1s`(CLI README 50~57행), KTX-Software(Apache-2.0 위주, LICENSE.md 7~10행), basis_universal(Apache-2.0) | MIT · Apache-2.0 | `KTX2Loader.js`(26.5KB) + `libs/basis/` 가 r170 에 있음 |
| 텍스처 굽기·아틀라스 | Blender Cycles bake(지금 `kingdom_variant.py` 가 EMIT 굽기 사용), glTF-Transform `palette`·`join`(원문에서 이름만 확인 못함 — `optimize` 묶음은 확인) | GPL(Blender 도구, 산출물은 자유 — **원문 확인 못함**) · MIT | — |
| 소품 변형 대량 생산 | Blender 지오메트리 노드 + 헤드리스 파이썬 | Blender | 변형을 GLB 로 굽거나, 한 메시 + 인스턴스 색으로 |
| glTF 내보내기 | `KhronosGroup/glTF-Blender-IO` | Apache-2.0(API) | — |

저장소 숫자: glTF-Transform 별 2,070 · 2026-10-20, meshoptimizer 8,820 · 2026-10-14, KTX-Software 1,397, basis_universal 3,142, draco 7,546(전부 API).

읽어 낸 것
- **meshopt 가 먼저다.** 기물 GLB 의 86% 가 지오메트리·클립이다(1.2). `make_biped.py` 머리 주석은 「pack-statue.mjs (meshopt + WebP)」라고 적었지만 실제 파일에는 meshopt 확장이 없다. 어디서 빠졌는지는 조사하지 않았다.
- KTX2 는 급하지 않다. 텍스처가 이미 WebP 96KB 라 내려받기는 줄지 않고(오히려 늘 수 있다), 얻는 것은 GPU 메모리다. 기물 텍스처는 종 6 × 진영 2 = 12장이라 메모리 부담이 크지 않다(추정, 재 보지 않았다).
- MG-S4 의 「변형을 머티리얼 변형으로」: 진영 색을 텍스처에 구워 파일을 3배로 만든 구조(`kingdom_variant.py`)를, 지오메트리 1개 + 텍스처 2장으로 나누면 파일 수가 준다. glTF `KHR_materials_variants` 지원 여부는 r170 로더에서 확인하지 않았다.

### 2.4 three.js 로 싸게 좋아 보이는 기법

r170 지원은 두 가지로 확인했다: ① 로컬 `node_modules/three@0.170.0` 의 파일·클래스, ② r170 태그의 예제 목록(https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/files.json, 2026-11-10).

| 기법 | r170 근거 | 예산 영향(추정, 재 보지 않았다) |
| :--- | :--- | :--- |
| 툰·매트캡 | `MeshToonMaterial`·`MeshMatcapMaterial` 클래스가 빌드에 있음. 예제 `webgl_materials_toon`·`webgl_materials_matcap` | 드로우콜 0. 매트캡은 조명 계산이 없어 Standard 보다 싸다. 림 라이트는 `onBeforeCompile` 한 줄(코드에 이미 쓰는 방식, 기획서 210행) |
| 구운 라이트맵 | `examples/jsm/misc/ProgressiveLightMap.js`, 예제 `webgl_shadowmap_progressive`. 재질 `lightMap` 속성은 **원문 확인 못함** | 정적 섬·건물만. 텍스처 1장(수백 KB), 그림자 패스 제거 |
| 가짜 그림자 | 예제 `webgl_shadow_contact`. **이미 있다**(`contactShadows.js`, 엔진 1935행) | 낮은 등급에서 그림자 맵을 끄면 삼각형이 절반으로(그림자 패스 몫) |
| 인스턴싱 | 예제 `webgl_instancing_performance`·`webgl_instancing_dynamic`. **이미 넓게 씀** | — |
| BatchedMesh | 빌드에 `class BatchedMesh` 있음, 예제 `webgl_mesh_batch`. 문서: "A special version of a mesh with multi draw batch rendering support." (https://threejs.org/docs/pages/BatchedMesh.html, 2026-11-10). 스키닝 언급 없음 | 서로 다른 정적 지오메트리(건물 10종·산호)를 재질 1개로 묶으면 콜이 준다. 텍스처 아틀라스가 먼저 필요 |
| 정점 애니메이션 텍스처(VAT) | three 코어·예제에 없다. 포럼 「Animated Instanced Skinned Meshes (GLTF)」(https://discourse.threejs.org/t/animated-instanced-skinned-meshes-gltf/41958, 첫 글 2022-08-27)는 뼈 행렬을 텍스처에 넣는 방식이고 코어 PR #22667 은 병합되지 않았다 | 말 32마리에는 필요 없다. 마을 주민·관중 군중을 넣을 때만. 직접 구현 |
| 스프라이트 시트 파티클 | 예제 `webgl_points_sprites`·`webgl_sprites`·`webgl_buffergeometry_instancing_billboards` | 아틀라스 1장(256~512KB)·1콜. 지금 별은 메시 인스턴스 |
| 임포스터 | `agargaro/octahedral-impostor`(MIT, 별 69, peer `three >=0.159.0` — package.json 원문). 별이 적고 README 가 거의 비어 있다 | 먼 섬·나무. 채택 전 읽어 보기 |
| 후처리 없이 블룸 흉내 | 발광 스프라이트(가산 혼합)·`Lensflare`(`examples/jsm/objects/Lensflare.js`, 예제 `webgl_lensflares`) | 콜 +1~2, 풀스크린 패스 없음. 진짜 블룸(`UnrealBloomPass`, 예제 `webgl_postprocessing_unreal_bloom_selective`)은 GPU 가 병목인 지금은 비싸다 |
| 셰이더 한 장 물·코스틱 | **이미 이 방식**(`openSea.js`·`water.js` 머리 주석). 예제 `webgl_water`·`webgl_shaders_ocean` 은 반사 패스가 있어 더 비싸다 | — |
| 하늘 | `examples/jsm/objects/Sky.js`, 예제 `webgl_shaders_sky`, `GroundedSkybox.js`, 예제 `webgl_materials_envmaps_groundprojected`·`webgl_panorama_equirectangular` | 스카이박스 그림 1장은 `scene.background` 로 콜 0~1 |
| SDF 글자 | `troika-three-text`(protectwise/troika, MIT, 별 1,987 · 2026-11-02). README 3~5행: SDF 를 글꼴 파일에서 그 자리에서 만든다 | 번들 크기는 재 보지 않았다. **gzip 여유 3KB 로는 못 넣는다.** 지금 잡기 글자를 어떻게 그리는지는 `impactFx.js` 를 끝까지 읽지 않았다 |
| 압축 로더 | 예제 `webgl_loader_gltf_compressed`·`webgl_loader_texture_ktx2` | meshopt 디코더 24KB(원본)·KTX2Loader 26.5KB(원본) — gzip 으로도 3KB 는 넘는다(추정) |
| 후처리 라이브러리 | `pmndrs/postprocessing`(Zlib, 별 2,963), peer `three >= 0.168.0 < 0.188.0`(package.json 원문) — r170 호환 | 번들·GPU 둘 다 든다. PF-8 품질 등급의 「높음」에만 |

**번들 게이트가 가장 좁은 문이다.** `bundle_gate.mjs` 는 `dist/assets` 의 모든 JS 를 더하므로(13~21행) 동적 import 로 쪼개도 합계에 들어간다. meshopt 디코더·KTX2·troika·postprocessing 어느 것을 넣든 상한을 올리거나 다른 것을 빼야 한다.

### 2.5 배경·환경 생성

- **360 스카이박스 로컬 생성**
  - 지금 쓰는 FLUX.1 [schnell] 은 Apache-2.0 이다(모델 카드 「License: apache-2.0」, https://huggingface.co/black-forest-labs/FLUX.1-schnell, 2026-11-10). 상업 이용 가능.
  - 360 LoRA: `ProGamerGov/qwen-360-diffusion` 은 MIT, 바탕 모델 Qwen-Image, 권장 2048×1024(https://huggingface.co/ProGamerGov/qwen-360-diffusion, 2026-11-10). Qwen-Image 는 20B 급이라 **8GB 에서 도는지 재 보지 않았다**(양자화 필요, VRAM 수치는 페이지에 없음). Qwen-Image 자체 라이선스는 열지 않았다.
  - FLUX.1-dev 기반 360 LoRA 들은 dev 의 비상업 라이선스를 따른다는 것이 검색 요약에 있었다. 원문은 열지 않았다. **쓰지 않는다.**
  - 미리보기 노드 `ProGamerGov/ComfyUI_preview360panorama`(MIT, 별 112, API). ComfyUI 본체는 GPL-3.0(API, `Comfy-Org/ComfyUI`, 별 146,034) — 도구로 돌리는 것이라 산출 그림에는 걸리지 않는다는 해석이 일반적이나 **원문 확인 못함**.
  - 대안: schnell 로 가로 2:1 그림을 뽑고 좌우 이음매만 inpaint. 품질은 재 보지 않았다.
  - HunyuanWorld-1.0·HunyuanWorld-Mirror 는 **한국 제외**(HunyuanWorld-1.0 LICENSE 3행 원문. Mirror 는 API 가 NOASSERTION, 파일은 열지 않았다).
- **가우시안 스플랫을 웹에서**
  - Spark(`sparkjsdev/spark`, MIT, 별 3,895 · 2026-10-20): package.json peer 가 **`three >= 0.180.0`** 이다. **r170 에서는 못 쓴다.**
  - GaussianSplats3D(`mkkellogg/GaussianSplats3D`, MIT, 별 2,949, peer `three >= 0.160.0`): r170 호환이나 마지막 푸시가 2025-10-19.
  - `antimatter15/splat`(MIT, 별 3,086), 편집기 `playcanvas/supersplat`(MIT, 별 10,621), 변환기 `playcanvas/splat-transform`(MIT, 별 1,435 — SOG 「Super-compressed format for web delivery」 README 57행).
  - 원조 `graphdeco-inria/gaussian-splatting` 은 API 가 NOASSERTION(비상업 라이선스로 기억, **원문 확인 못함**). 학습은 `nerfstudio-project/gsplat`(Apache-2.0, 별 5,883).
  - 판단: 스플랫은 정렬·오버드로가 커서 GPU 가 병목인 이 게임에 맞지 않는다(성능은 재 보지 않았다). 장난감 디오라마 화풍과도 다르다. **넣지 않는다.**
- **프로시저 지형·식생**: 예제 `webgl_geometry_terrain` 이 r170 에 있다. 섬·나무·풀은 이미 코드 생성 + 인스턴싱이다(`islandScene.ts`, 엔진 1170~1215행). 더 할 것은 **먼 경치**(임포스터 섬·구름 띠)와 **시간 흐름**(하늘 색·해 방향 보간)이다. Blender 지오메트리 노드로 나무·바위 변형을 구워 `BatchedMesh` 로 묶는 길이 있다.

### 2.6 2D 효과·UI 에셋 로컬 생성

| 일 | 도구 | 라이선스(API) | 메모 |
| :--- | :--- | :--- | :--- |
| 스프라이트 시트 VFX | ComfyUI + Flux schnell(Apache-2.0) + 투명 배경 `lllyasviel/LayerDiffuse`(Apache-2.0, 별 2,222 · 2024-06-16) | Apache-2.0 | LayerDiffuse 는 SD 계열용이고 Flux 지원은 확인 못함. 프레임 일관성은 AI 그림으로 어렵다 — **Blender 로 파티클을 렌더해 시트로 굽는 쪽이 확실하다**(도구 이미 있음) |
| 아이콘·카드 그림 일관성 | IP-Adapter(`tencent-ailab/IP-Adapter`, Apache-2.0, 별 6,713 · 2024-06-28). ComfyUI 노드 `cubiq/ComfyUI_IPAdapter_plus` 는 GPL-3.0(별 6,175) | Apache-2.0 / 노드 GPL | 지금은 Flow 에 자기 그림을 참조로 올려 얼굴을 유지한다(SKILL.md 31행). 로컬로 옮기려면 IP-Adapter 나 LoRA 학습. 8GB 에서 Flux LoRA 학습은 재 보지 않았다 |
| 다른 바탕 모델 | `Tongyi-MAI/Z-Image`(Apache-2.0, 별 12,140 · 2026-02-09) | Apache-2.0 | 기억 파일에 「Z-Image Turbo 도 있으나 그래프 미검증」 |
| GGUF 로더 | `city96/ComfyUI-GGUF`(Apache-2.0, 별 4,238) | Apache-2.0 | 지금 쓰는 것 |

카드 그림은 이미 `public/packs/legend/cards/*.webp` 24장(29~54KB)이 있다. 2D 쪽은 품질보다 **출처 기록**이 먼저다(`CREDITS.md` 없음).

---

## (가) 약한 곳 → 기법 → 도구 → 예산 영향

예산 숫자는 전부 추정이고 **재 보지 않았다.**

| # | 지금 약한 곳 | 고칠 기법 | 필요한 도구(라이선스 · VRAM) | 예산 영향(추정) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 기물 GLB 무압축(지오메트리·클립 860KB) | meshopt 압축 + 양자화 | glTF-Transform(MIT) · GPU 불필요 | 기물 1MB → 0.3~0.5MB, 팩 70MB → 25~35MB. 드로우콜 0. **JS gzip +약 8KB(디코더) — 상한 조정 필요** |
| 2 | 쓰지 않는 GLB 49MB 가 `public/` 에 | 중간 산출물·예비 팩을 `public/` 밖으로 | 없음 | 배포 −49MB(빌드에 실린다면). 드로우콜·gzip 0 |
| 3 | 프레임당 삼각형 169만, GPU 병목 | 체스 카메라용 LOD(20,000 → 6,000~8,000면), 가까이 볼 때만 원본 | Blender Decimate 또는 glTF-Transform `simplify`(MIT) · GPU 불필요 | 삼각형 −60%. 드로우콜 0. 파일 +(LOD 를 따로 두면) 또는 −(바꾸면). GPU ms 효과는 모름(채움 병목일 수 있다) |
| 4 | 그림자 맵 2048² + 픽셀 비율 2 + Standard | 품질 등급 3단(PF-8): 낮음 = 그림자 맵 끔(접촉 그림자만)·픽셀 비율 1·매트캡 | three r170 내장 | 낮음 등급에서 삼각형 절반·GPU 크게 감소. 드로우콜 −수 개. gzip +1KB 안팎 |
| 5 | 재질이 한 가지(기본색 + roughness 0.6) | 툰 띠 + 림 라이트(`onBeforeCompile`), 종별 매트캡 1장 | three r170 내장 · 매트캡 그림은 Blender 렌더 | 드로우콜 0. 텍스처 +50~100KB. gzip +1KB 안팎 |
| 6 | 찢어지는 가중치·뼈 13~15개 | 학습 기반 가중치로 교체 뒤 기존 클립 이름에 맞춤 | UniRig(MIT · 8GB) | 본 수가 늘면 게이트 상한 24 확인. 파일 +수십 KB. 드로우콜 0 |
| 7 | 손 키프레임 클립 9~10개 | CC0 동작 묶음을 리타게팅, 종별 Attack 은 Blender 에서 손질 | Mesh2Motion(MIT + CC0 · GPU 불필요), Blender | 클립당 +10~40KB(meshopt 뒤). 드로우콜 0 |
| 8 | 떠 있는 장식이 사라짐·소품이 체형에 안 맞음 | 부품 분리 생성 후 본 소켓에 따로 붙임 | PartCrafter(MIT · 8GB), 텍스처는 TRELLIS v1 에서 옮김 | 소품 1개 150~230KB·콜 +1(지금과 같음) |
| 9 | 더 정밀한 모양·PBR | TRELLIS.2 로 사자 1종 A/B | TRELLIS.2(MIT · 공식 24GB, 커뮤니티 저VRAM 은 미확인) | 파일은 감량 뒤 같음. 노멀 맵을 쓰면 +100~300KB/종 |
| 10 | 하늘·환경이 정적 | 2:1 스카이 그림 2~3장(낮·노을·밤) 보간 + 해 방향 이동 | ComfyUI + Flux schnell(Apache-2.0 · 8GB GGUF, 지금 쓰는 것) | 그림 1장 150~300KB. 드로우콜 0~1. gzip +1KB 안팎 |
| 11 | 타격·퐁당·파편(PF-5)이 메시 별뿐 | Blender 로 구운 스프라이트 시트 + 인스턴스 쿼드 | Blender · three r170 내장 | 아틀라스 256~512KB. 효과 종류당 콜 +1(잡기 최대 75 → 80 안팎, 상한 100 안) |
| 12 | 건물 10종이 각자 1콜·서로 헷갈림 | 건물 텍스처를 아틀라스 1장으로, `BatchedMesh` 로 묶기. 실루엣은 콘셉트부터 다시 | glTF-Transform(MIT), three r170 `BatchedMesh` | 섬 드로우콜 −5~9. 파일 비슷. gzip +1KB 안팎 |

## (나) 8GB GPU 에서 순차로 돌릴 수 있는 것과 없는 것

ComfyUI 와 TRELLIS 는 동시에 못 돌린다(CLAUDE.md). 아래는 **하나씩** 돌린다는 전제다.

| 구분 | 항목 | 근거 |
| :--- | :--- | :--- |
| 돌린다(실측) | TRELLIS v1 fp16, ComfyUI Flux schnell Q4 GGUF, Blender 5.2 헤드리스(Cycles 굽기) | 이 저장소의 기존 제작 기록 |
| 공식 최소가 8GB | TripoSG, PartCrafter, UniRig | 각 README 원문. 이 PC 에서는 재 보지 않았다 |
| 8GB 미만 | TripoSR·Stable Fast 3D(약 6GB), SPAR3D 저VRAM 모드(약 7GB) | 각 README 원문 |
| GPU 불필요 | glTF-Transform, meshoptimizer, KTX-Software, Instant Meshes, Mesh2Motion(브라우저) | — |
| 안 됨(공식) | TRELLIS.2(24GB), SkinTokens(14GB), Hunyuan3D-2.1 텍스처(21GB) | 각 README 원문 |
| 모름 | TRELLIS.2 커뮤니티 저VRAM 포트, Qwen-Image 360 LoRA, InstantMesh, Puppeteer, MDM·MoMask | 수치를 원문에서 못 찾음 |

## (다) 상업 이용이 막혔거나 걸리는 것

| 항목 | 이유 | 근거 |
| :--- | :--- | :--- |
| Hunyuan3D-2 · 2.1 · Part · Omni, HunyuanWorld-1.0, HY-Motion-1.0 | 라이선스가 **한국·EU·영국에 적용되지 않음**. 산출물 사용도 금지 | 각 LICENSE 원문 3행(Omni 는 API 가 NOASSERTION, 파일은 열지 않았다) |
| Stable Fast 3D · SPAR3D | 연 매출 100만 달러 넘으면 유료 | SF3D LICENSE.md 10행. SPAR3D 는 원문 확인 못함 |
| SAM 3D Objects | SAM License. 상업 조항을 끝까지 읽지 못함 | README 81행 |
| RigNet | GPL-3.0 — 코드 복사 금지(CLAUDE.md) | API |
| ComfyUI 본체, `ComfyUI_IPAdapter_plus`, Krita AI Diffusion | GPL-3.0 — 도구로만 쓰고 코드를 가져오지 않는다 | API |
| FLUX.1-dev 와 그 위의 360 LoRA | 비상업 | 검색 요약. 원문 열지 않음 |
| `graphdeco-inria/gaussian-splatting` | 비상업으로 기억 | API NOASSERTION. 원문 확인 못함 |
| MDM · MoMask 의 학습 데이터·SMPL | 코드는 MIT, 데이터·몸 모델은 별도 라이선스 | MoMask README 245행 |
| `Mwni/blender-animation-retargeting` | 라이선스 파일 없음 | API `license: null` |
| Mixamo | 약관을 열지 않았다 | 원문 확인 못함 |
| Spark(스플랫) | 라이선스는 MIT 지만 `three >= 0.180` 이라 r170 에서 못 씀 | package.json 원문 |

## 열지 못했거나 확인하지 않은 것

- HoloPart·Stable3DGen·MagicArticulate·InstantMesh 의 VRAM 수치.
- nvdiffrast, SAM License 전체, Qwen-Image, FLUX.1-dev, Mixamo, Blender 산출물 관련 조항.
- TRELLIS.2 저VRAM 포트의 실제 동작. 검색 요약의 수치끼리도 서로 달랐다.
- three r170 `GLTFLoader` 의 `KHR_materials_variants` 처리, 재질 `lightMap` 문서.
- `make_biped.py` 가 말하는 meshopt 단계가 왜 결과 파일에 없는지.
- 이번 조사에서는 빌드·드로우콜 게이트·GPU 측정을 돌리지 않았다. 1.3 의 수치는 기존 기록이다.
