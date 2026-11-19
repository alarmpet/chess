# 통합자 실측 대조표 (셋의 답을 읽기 전, 2026-10-27 18:20)

셋이 돌아가는 동안 통합자가 직접 잴 수 있는 것을 쟀다. **기획서 v0.2 의 전제 2개가 거짓이다 — 둘 다 통합자(Claude) 자신의 오류다.**

| # | 기획서 주장 (절) | 판정 | 근거 |
| :--- | :--- | :--- | :--- |
| V1 | §1.1 "값이 클립 길이 대비 **비율**(`contactClip: 0.56~0.60`)이라 어떤 Attack 클립이든 접촉 지점만 재면 맞출 수 있다" | **거짓** | `wizardChessEngine.js:2440` `const CONTACT_CLIP_TIME = atkProfile.contactClip; // Weapon physically strikes defender` · `:2444` `tContact = … tApproach + CONTACT_CLIP_TIME / atkProfile.timeScale` — **초 단위 클립 시각**이다(0.58s ≈ 24fps Frame 14). 비율이 아니다. 결론(클립마다 접촉 시각을 재서 매니페스트에 적는다)은 그대로 유효하지만 단위가 **초**다. 클립 길이가 다른 Quaternius Attack 에도 그대로 적용 가능 |
| V2 | §4.2 "study-game 의 GLB(meshopt 확장 · WebP 텍스처)를 읽으려면 r185 로 올린다 (Phase 0)" | **거짓** | ① `D:\chess\node_modules\three\examples\jsm\loaders\GLTFLoader.js`(r170) 에 `EXT_meshopt_compression` 2회 · `EXT_texture_webp` 2회 — **r170 이 이미 둘 다 읽는다.** ② study-game `legend/gumiho_fox.glb` 의 `extensionsRequired = ['EXT_texture_webp','KHR_mesh_quantization']` — meshopt 압축이 아니라 **양자화**이고, 이것도 r170 이 읽는다. → **r185 업그레이드는 자산 호환을 위해 필요하지 않다.** Phase 0 에서 뺄 수 있다 |
| V3 | §4.2 "`postprocessing` 패키지" r185 호환 | 참 | `npm view postprocessing` 6.39.5 `peerDependencies = { three: '>= 0.168.0 < 0.187.0' }` — r170·r185 둘 다 범위 안 |
| V4 | §4.5 `chess.js` · Stockfish WASM 존재 | 참(존재만) | `chess.js` 1.4.0 · `stockfish` 19.0.1 "The Stockfish chess engine in Web Assembly (WASM)". 3회 반복·Skill Level 은 grok 이 확인 |
| V5 | §5.1 `rig_transfer.py` 에 종 특이 가정이 있나 | 확인 | 132줄. 정렬은 상자 중심 + 키 맞춤(`:60,63`), 가중치는 bone heat 자동(`:66`), 머리 방향 자동(`:43,52`). **종 이름·뼈 이름 하드코딩 없음.** 단 공여 리그에 없는 부위(코끼리 코·기린 목)는 가장 가까운 뼈에 통째로 붙는다 — 코드가 막지 않을 뿐 결과 품질은 미측정 |
| V6 | §1.1 `MELEE_STANDOFF` | 기획서 누락 | `:2067` `const MELEE_STANDOFF = 0.36; // Optimal melee standoff (1.06 squares) so sword blades visibly bridge the gap` · `:2183` `stopOffset = isCapture ? Math.min(MELEE_STANDOFF, dist * 0.76) : 0` — 검 길이 기준 상수. 매니페스트에 기물별 `standoff` 필요 (r1-claude C2) |

## v0.3 에 반영할 것 (셋의 답과 무관하게 확정)
- §1.1·§3.1·§4.3: "비율" → "초 단위 클립 시각". `attackSync.contactClip` 단위를 초로 명시.
- §4.2: r185 업그레이드를 Phase 0 필수에서 **선택(Phase 6 과 함께)** 으로. Phase 0 이 가벼워진다.
- §4.3 매니페스트에 `attackSync.standoff` 추가.
