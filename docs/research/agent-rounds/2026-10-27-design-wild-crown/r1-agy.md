## 0. 네 모델 이름과 읽은 파일 목록

- **모델 이름**: Antigravity (Gemini 3.8 Flash High)
- **읽은 파일 목록** (총 12개, 실측 및 배정 파일 전수):
  - `D:\chess\.reports\consult-wild-crown-design\BRIEF.md`
  - `D:\chess\docs\PLAN.md`
  - `D:\chess\.reports\consult-wild-crown-design\A_glb-measurements.md`
  - `D:\study-game\.agents\skills\ai-3d-asset-remaster\SKILL.md`
  - `D:\study-game\.agents\skills\ai-3d-asset-remaster\references\measurements.md`
  - `D:\study-game\.agents\skills\ai-3d-asset-remaster\references\chibi-rig.md`
  - `D:\study-game\.agents\skills\trellis-local-ops\SKILL.md`
  - `D:\study-game\tools\legend\README.md`
  - `D:\study-game\tools\legend\bake_low.py`
  - `D:\study-game\tools\legend\rig_transfer.py`
  - `D:\study-game\tools\legend\biped_rig.py`
  - `D:\study-game\tools\legend\pack-statue.mjs`

---

## 1. 네 영역의 독립 설계안

### 1.1 구조 (모듈·경계·데이터 흐름)
- **형상 생성**: `flow-concept` (단일 시점 3/4 뷰 PNG) → 로컬 TRELLIS v1 fp16 (단일 큐, best-of-3) → `raw.glb` (`render_vc.py` yaw 0 정면 판정).
- **메시 재구축 및 베이크**: `bake_low.py` (비다양체 정리 → 스마트 UV 투영 → Cycles EMIT 베이크로 베이스 컬러 + Non-Color 노멀맵 추출) → 16k tri / 1024px PNG 내보내기.
- **단일 리그 체계 이전**: `_spike_prop.glb`(Animal 46본) 단일 공여 리그 → `rig_transfer.py` (복셀 bone heat 가중치 이전 + 자동 축 정렬) → 12종 표준 클립(Attack·Death·HitReact 등) 탑재.
- **체스 전용 패키징**: `pack-chess.mjs` (정점 노멀 8비트 양자화 + 베이스 컬러 WebP q85 + 노멀맵 무손실 WebP/PNG 보존) → `public/packs/<pack>/manifest.json`.

```
[Flow Concept PNG] 
   ↓ 
[Local TRELLIS v1 fp16] → raw.glb (VRAM 7.8GB 가드, Yaw 정면 검증)
   ↓ 
[Blender bake_low] → baked.glb (16k tris, 1024px Color/Normal 분리 베이크)
   ↓ 
[rig_transfer (Animal 46본 단일화)] → rigged.glb (Attack 접촉 프레임 실측)
   ↓ 
[pack-chess.mjs] → runtime GLB + manifest.json
```

### 1.2 왜 이 구조인가 (위 제약 하나하나에 어떻게 답하는가)
- **RTX 4060 8GB / VRAM 7,840MiB 피크**: 로컬 TRELLIS v1 fp16을 큐(`upgrade_runner.py`) 기반 단일 직렬 프로세스로 격리하여 8GB VRAM 한도 내에서 안전하게 구동.
- **C: 여유 6.8GB 한계**: 중간 캐시 및 임시 파일 디렉터리를 `D:\hf-cache`, `D:\chess\tools\_work`로 강제 지정.
- **Quaternius poly.pizza CC0 라이선스**: 검증된 단일 46본 리그(`_spike_prop.glb`)만 사용하여 파생 라이선스 리스크 차단 및 18개 클립 규격 통일.
- **1인 개발자 주 15~20시간**: 수작업 애니메이션/리깅 0시간화. 종마다 리그를 분기하지 않고 단일 46본 리그 파이프라인으로 일원화.

### 1.3 이 설계가 틀릴 수 있는 곳 셋 (재는 방법 구체화)
1. **극단적 이형 동물(기린·코끼리) 46본 강제 이전 시 관절 왜곡**:
   - *재는 법*: `rig_transfer` 완료 직후 Attack/Walk 클립의 정점 변위 최대치(`max_displacement`)를 계산하고, EEVEE 3프레임 렌더 캡처에서 `unweighted > 0` 정점 수 실측.
2. **16k tri 스마트 UV 투영 베이크 시 텍스처 솔기(Seam) 터짐**:
   - *재는 법*: Three.js 개발 환경에서 FOV 20 접사 카메라로 기물 360도 회전 캡처 후, UV 아일랜드 경계부의 빈 텍셀 번짐(블랙 라인) 유무를 픽셀 단위 분석.
3. **노멀맵 압축 시 셰이딩 밴딩(Banding)**:
   - *재는 법*: 포인트 라이트 1개 씬에서 구형 모델 표면의 노멀 벡터 분해능을 측정하고 무손실 PNG 대비 WebP 손실 압축 시의 SSIM 값 측정(0.98 미만이면 탈락).

### 1.4 하지 않을 것과 이유
- **기물별 리그 다변화(farm 28본, biped 15본, 절차 애니메이션 혼용) 금지**: farm 28본에는 Attack 클립이 없고, biped 15본은 체스 필수 모션이 전무하며, 절차 애니메이션은 셰이더/스크립트 유지비가 폭증함.
- **노멀맵 손실 압축(JPEG/WebP 손실) 금지**: 3D 체스는 근접 줌인이 빈번하므로 노멀맵 손실 압축 시 빛 반사면에서 심각한 사각 블록 및 노이즈가 노출됨.
- **Blender Decimate 직접 적용 금지**: TRELLIS 메시의 UV 이음매를 찢어 얼굴에 6천~1.2만 개의 파편을 만듦(실측 폐기 확인).

### 1.5 스스로 가장 약하다고 보는 결정 하나
- **사족 46본 리그를 미어캣(폰)과 기린/코브라(비숍)에까지 일괄 적용하거나 억지로 맞추려는 결정**: 두 발로 서는 미어캣이나 목이 긴 기린의 경우 46본 베이스의 척추/목 뼈 비율과 극단적으로 달라 모션 재생 시 다리가 바닥을 뚫거나 목이 꺾일 수 있음.

---

## 2. 기획서 v0.2 의 사실 전제 검증표

| 기획서 절 | 주장 (글자 그대로 인용) | 판정 | 근거 (파일:줄, 글자 그대로 인용) |
| :--- | :--- | :---: | :--- |
| §1.2 line 48 | `RTX 4060 8GB fp16 에서 돌아간다. 1장 92~352초, 피크 VRAM 7,840MiB, 할당량 없음` | **참** | `trellis-local-ops\SKILL.md:17-18`: `환경(2026-10-14~15 실측): TRELLIS v1 · fp16 · RTX 4060 8GB.` / `생성 1장 92~352초... 피크 VRAM 7,840/8,188MiB` |
| §1.2 line 64 | `5.2만 tri · 텍스처 2~3장 · 리그 없음 · 발광` | **참** | `A_glb-measurements.md:26-38`: `assets/legend/*.glb` 13종 전수 실측 결과 삼각형 51992~60257, 본 0, 이미지 2~3개 일치. |
| §1.2 line 66 | `farm 28본 (얼룩말·소·양)` | **거짓** | `A_glb-measurements.md:25`: `assets/packs/pk_zebra.glb`는 `삼각형 1354 본 0`. 얼룩말은 본이 0개인 정적 메시임. |
| §1.2 line 66 | `클립: Attack · Idle · Idle_2 · Walk · Gallop · Gallop_Jump · HitReact L/R · Death · Eating · Jump_ToIdle` | **거짓** | `A_glb-measurements.md:22`: `pk_cow.glb`(farm 28본)의 클립은 `Armature\|Death, Armature\|Idle, Armature\|Jump, Armature\|Run, Armature\|Walk, Armature\|WalkSlow` 6개뿐이며 `Attack` 클립 없음. |
| §2.2 line 98 | `study-game 에 얼룩말 farm 리그 원본(pk_zebra)과 조각상 콘셉트가 둘 다 있어 나이트로 두면 가장 빨리 나온다.` | **거짓** | `A_glb-measurements.md:25`: `assets/packs/pk_zebra.glb`는 본이 0개(`본 0`)로 리그 원본이 아님. |
| §4.3 line 200 | `"pawn": { "model": "meerkat.glb", "rig": "biped15", "clips": { "idle": ["Idle"], "move": "Walk", "attack": "Cheer", "...": "..." } }` | **거짓** | `biped_rig.py:5`: 동작은 `Idle · Walk · Run · Sit(탈것에 앉아 운전) · Cheer` 5개뿐. 체스 필수 클립인 `HitReact`, `Death`(kneel), `Eating`(bored)이 전무함. |
| §5.1 line 243 | `Idle·Gallop·Attack 3프레임 렌더로 관절 확인 → Attack 접촉 프레임 측정 → contactClip 비율` | **거짓** | `rig_transfer.py:122`: `for label in ('idle', 'run', 'gallop', 'walk', 'fly'):`로 `attack` 클립 확인 렌더 코드가 없음. |
| §5.1 line 245 | `pack-statue.mjs <in> <out> 999999 (감량 없이 meshopt 양자화 + WebP)` | **거짓** | `pack-statue.mjs:28-30`: `quantize`와 `EXTTextureWebP`만 수행할 뿐 `EXT_meshopt_compression` 확장을 생성하지 않음. |

---

## 3. 네 영역에서 찾은 문제 (심각한 것부터)

[문제 1] farm 28본 리그 원본 부재 및 Attack 클립 미존재
- **어디**: 기획서 §1.2 line 66 / §2.2 line 93-94, 98
- **무엇을**: `"farm 28본 (얼룩말·소·양) ... 클립: Attack · Idle ... 사족 기물의 뼈대 공여자. rig_transfer.py 로 TRELLIS 메시에 입힌다. Attack 클립이 이미 있다"`
- **왜 문제**: `A_glb-measurements.md:25` 실측상 `pk_zebra.glb`는 본이 0개(`본 0`)인 정적 메시이며, 유일한 28본 자산인 `pk_cow.glb`(line 22)에는 체스 필수 모션인 `Attack`, `Idle_2`, `HitReact`가 아예 없다. 이 전제로 룩(코끼리/코뿔소)과 나이트(얼룩말/사슴)를 작업하면 공격 애니메이션이 없어 전투 시 멈춰 서게 된다.
- **고치는 법**: farm 28본 리그 의존을 기획서에서 완전히 제거하고, Quaternius 46본 `_spike_prop.glb`(Attack 포함 12클립 보유) 단일 리그로 통합하거나, 외부 CC0 Quaternius Horse 리그를 정식 수급한다.
- **확신도**: 높음

[문제 2] biped_rig 기반 폰(미어캣)의 필수 애니메이션 결손 및 오프셋 침하
- **어디**: 기획서 §2.2 line 96 / §4.3 line 200 / `tools/legend/biped_rig.py:5, 14, 225`
- **무엇을**: `""pawn": { "model": "meerkat.glb", "rig": "biped15", "clips": { "idle": ["Idle"], "move": "Walk", "attack": "Cheer", "...": "..." } }"`
- **왜 문제**: `biped_rig.py`가 생성하는 클립은 `Idle, Walk, Run, Sit, Cheer` 5개뿐이며 `hit`, `kneel(death)`, `bored`가 없다. 공격으로 매핑한 `Cheer`는 두 팔을 번쩍 드는 환호 동작(line 208)이라 공격 타격감이 전무하다. 또한 `biped_rig.py:14, 225`는 VocaRider 카트 규격에 맞춰 `FOOT_Y = -0.5`로 발을 내려 내보내므로 체스 타일(Y=0) 바닥으로 0.5 유닛 파묻힌다.
- **고치는 법**: 미어캣도 46본 사족 리그를 적용하여 폰 역할을 수행하게 하거나, `biped_rig.py`를 체스 전용으로 복사하여 `FOOT_Y = 0`으로 수정하고 Attack/Hit/Death 키프레임을 추가한다.
- **확신도**: 높음

[문제 3] bake_low 및 pack-statue 파이프라인의 노멀맵 훼손 및 강제 다운사이즈
- **어디**: 기획서 §5.1 line 239, 245 / `tools/legend/bake_low.py:114` / `tools/legend/pack-statue.mjs:35`
- **무엇을**: `"③ 굽기 bake_low.py — TRIS=16000 TEX=1024 ... ⑤ 압축 pack-statue.mjs <in> <out> 999999"`
- **왜 문제**: `bake_low.py:114`는 `export_image_format='JPEG'`로 내보내 노멀맵에 8x8 손실 블록 아티팩트를 영구 각인시킨다. 이어지는 `pack-statue.mjs:35`는 `isColor`가 아닌 텍스처(노멀맵)를 `px = 512`로 강제 다운사이즈하고 WebP q85 손실 압축을 가한다. 기획서가 설정한 1024px 노멀맵 디테일이 512px로 반토막 나고 이중 손실 압축으로 셰이딩이 찢어진다.
- **고치는 법**: `bake_low.py` 내보내기를 무손실 PNG로 수정하고, `pack-chess.mjs`를 별도 제작하여 베이스 컬러(1024px WebP q85)와 노멀맵(1024px 무손실 WebP 또는 PNG)의 처리를 엄격히 분리한다.
- **확신도**: 높음

[문제 4] rig_transfer.py 확인 렌더 루프의 Attack 클립 누락
- **어디**: 기획서 §5.1 line 243 / `tools/legend/rig_transfer.py:122`
- **무엇을**: `"Idle·Gallop·Attack 3프레임 렌더로 관절 확인 → Attack 접촉 프레임 측정 → contactClip 비율"`
- **왜 문제**: 실제 `rig_transfer.py:122` 코드는 `for label in ('idle', 'run', 'gallop', 'walk', 'fly'):`로 `attack` 클립 확인 렌더를 생성하지 않는다. 이 상태로는 파이프라인 자동화로 공격 접촉 프레임(`contactClip`)을 실측할 수 없다.
- **고치는 법**: 체스용으로 복사할 `rig_transfer.py`의 라벨 목록에 `'attack'`을 추가하고 접촉 프레임 렌더를 자동 출력하도록 수정한다.
- **확신도**: 높음

---

## 4. 네 자료에서만 드러나는 것

1. **`pk_zebra.glb`의 실제 본 개수는 0개이며 farm 동물에는 Attack 모션이 없다**:
   - `A_glb-measurements.md`를 열어보기 전까지 기획서는 얼룩말 원본 리그가 존재한다고 믿고 있었으나, 실제로는 본이 전혀 없는 정적 메시였음.
2. **`pack-statue.mjs`는 `EXT_meshopt_compression`을 만들지 않는다**:
   - `pack-statue.mjs`는 meshoptimizer의 `simplify` 알고리즘과 정점 양자화(`quantize`)만 쓸 뿐, glTF meshopt 버퍼 압축 확장을 적용하지 않음. 기획서 §1.1/§4.2의 meshopt 전제는 실제 코드와 불일치함.
3. **`biped_rig.py`의 FOOT_Y 오프셋(-0.5) 함정**:
   - VocaRider 카트 탑승을 위해 원점이 몸 중앙에 맞춰져 있어(`biped_rig.py:14`), 이를 체스에 그대로 넣으면 모든 두 발 기물이 타일에 반쯤 파묻힘.
4. **TRELLIS 메시의 정면(YAW)은 리그 시트로 판정할 수 없다**:
   - `trellis-local-ops/SKILL.md:43-45` 실측 기록상 리그 렌더 시트는 카메라 기준으로 왜곡되어 15종 전수가 yaw 270으로 돌아가 있었음. 오직 `render_vc.py` yaw 0 단독 렌더로만 정면 판정이 가능함.

---

## 5. 기획서 §10 결정 8개에 대한 네 답과 한 줄 근거

1. **얼룩말을 나이트로 (원안 비숍)**:
   - **수정 찬성 (나이트 배치는 찬성하나 리그 출처 변경)**: `pk_zebra.glb`는 실측 결과 본이 0개(`A_glb-measurements.md:25`)이므로 farm 리그가 아닌 46본 `_spike_prop` 리그를 이전받아야 한다.
2. **밀림 비숍 — 코브라(절차 애니) vs 앵무새(biped)**:
   - **코브라 유지**: 절차 애니메이션은 리그 가중치 꼬임 리스크가 없어 §6 커스텀 스킨의 뼈대 없는 메시 처리 프로토타입으로 가치가 크다.
3. **대성당 맵 — 버리나 / 「클래식」 4번째 팩**:
   - **남긴다 (보존)**: *자료 밖 — 의견*. 기존 8.4MB 대성당을 WebP/meshopt로 재압축하면 용량 부담 없이 훌륭한 클래식 모드가 된다.
4. **커스텀 스킨 비용**:
   - **로컬 큐 하루 1~2회 무료 제공**: `trellis-local-ops/SKILL.md:18` 실측상 1장 생성에 92~352초(VRAM 7.8GB)가 걸리므로 남발 방지 큐 제어가 필수적이다.
5. **이 문서를 `tri-agent-review --design` 에 바로**:
   - **예**: *자료 밖 — 의견*. 에셋 파이프라인의 핵심 사실 오류(farm 리그 부재 등)가 규명되었으므로 조기 설계 수렴이 가능하다.
6. **이름 — WILD CROWN / 야생의 왕관**:
   - **찬성 (유지)**: *자료 밖 — 의견*.
7. **화풍 — study-game 조각상과 같은 "stylized low-poly chunky" vs 더 사실적**:
   - **조각상 화풍 유지**: `README.md:56` 및 `measurements.md:22` 실측상 TRELLIS는 단순한 실루엣에서 형상과 텍스처가 가장 안정적으로 나온다.
8. **두 저장소 관계 — chess 가 study-game `tools/legend` 를 복사하나 / 경로 참조하나**:
   - **복사 (`D:\chess\tools\`)**: `bake_low.py`(노멀맵 포맷 분리), `rig_transfer.py`(Attack 렌더 추가), `biped_rig.py`(FOOT_Y=0 수정) 등 체스 전용 코드 개조가 필수적이다.
EXIT=0 
