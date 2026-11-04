# 엔진 선택 계획서 — three.js 를 계속 쓰나, Godot·Unity·Unreal 로 바꾸나 (2026-11-04, 세 모델 교차 검증)

> 열린 항목은 [STATUS.md](../STATUS.md) 에서 관리한다. 이 문서는 결정의 기록이다.
> 라운드 원문·검증표: [docs/research/agent-rounds/2026-11-04-engine-choice/](../research/agent-rounds/2026-11-04-engine-choice/README.md). 방법은 `tri-agent-review`(agy 기술 · grok 사업 · codex 반대 심문 · 통합자 독립 판정 뒤 대조).
> 11-04 관리 계획서 §3 의 결론(「① 그대로 + ② Blender」)을 이 라운드로 다시 검토했다. 결론은 유지되되 **재검토 조건과 떠날 때의 행선지가 바뀌었다**.

## 0. 한 줄 답

**three.js 없이도 이 게임은 만들 수 있다. 그러나 지금 바꿀 이유는 없고, 바꾸면 손해다.** 바꿔야 하는 두 조건(§4)을 정해 두고, 그 조건은 2주 실험 하나와 사업 결정 하나로 잰다. 세 모델과 통합자 넷이 같은 결론에 모였고, 갈린 곳은 「떠날 때 어디로」만이다.

사용자 질문에 바로 답하면:

| 질문 | 답 |
| :-- | :-- |
| three 없이 구현이 안 되나 | 된다. three 는 WebGL 을 쉽게 부르는 MIT 라이브러리일 뿐이다. Babylon.js·PlayCanvas 로도, Godot·Unity 로도 된다. 안 되는 것은 **Unreal 로 웹에 내는 것**(공식 웹 빌드 없음) |
| 대체하면 더 좋은가 | 웹이 1급인 동안은 아니다. 세 엔진은 웹을 2급으로 지원하고(Godot 은 Compatibility 렌더러·WebGPU 없음·C# 불가, Unity 는 수 MB Wasm, Unreal 은 없음), 우리 장면(기물 32·섬 1·물리 없음)은 엔진의 강점(월드·물리·GI·에디터)을 쓰지 않는다 |
| 장기 손익 | 남는 비용 = Phase 6 WebGPU 때 TSL 재작성(기획서 §4.2 에 이미 있음) + 에디터 부재(Blender 가 채움). 떠나는 비용 = 13,710줄·테스트 135·HUD 전부 재작성, 추정 1.5~6인월(§3). 유일한 매출 레버(Phase 5b 룩 상점)가 그 기간 닫힌다 |

## 1. 사실 (저장소·공식 문서, 2026-11-04 확인)

### 1.1 우리 장면이 실제로 무엇으로 되어 있나
| 항목 | 값 | 어디 |
| :-- | :-- | :-- |
| `three` 직접 import | 8파일 | `grep -rl "from 'three" src` |
| 장면·안무·카메라 | 6,300줄 단일 파일 | `src/wizardChessEngine.js` |
| 보드 타일 | **64개 개별 `Mesh`** | `:985~1003` |
| 그림자 | `shadowMap.autoUpdate=false`, 8곳에서만 갱신 | `:65`, `needsUpdate` ×8 |
| 조명 | Hemisphere 1 + Directional 3 + PointLight 다수(창·화로·타격) | `:225~840` |
| 외곽선 | `OutlineEffect` 는 **섬 장면에만** | `src/village/islandScene.ts:408` |
| 커스텀 셰이더 | `ShaderMaterial` 6곳(보드·바다·하늘·물), `onBeforeCompile` 2곳 | 엔진 `:573`·`:712`·`:1248`, `fx/openSea.js`, `fx/water.js`, `fx/reefLife.js` |
| 드로우콜 | 220 (세 로드 동일) | `docs/perf/2026-11-04-gate-s1.json` |
| fps | 21/47/36 — 잡음 커서 비교 불가 | 같은 파일 |
| 번들 | JS gzip 358KB(상한 400) | `tools/bundle_gate.mjs` |

### 1.2 후보 엔진·라이브러리 (공식 문서)
| 후보 | 라이선스 | 웹 | WebGPU | 비고 |
| :-- | :-- | :-- | :-- | :-- |
| three.js r170(현재, 최신 r187 10-30) | MIT(LICENSE 확인) | 1급 | `WebGPURenderer` 있음, **WebGL2 자동 폴백**(`forceWebGL` 옵션). 커스텀 셰이더는 TSL 재작성 | 릴리스 간격 5주~3개월(r184→r187 날짜) |
| Babylon.js | Apache-2.0(license.md 확인) | 1급 | 5.0 부터 내장, WebGL 과 「side by side」 유지 | `@babylonjs/core@8.0.0` 전체 gzip 1,298KB(bundlephobia). **트리 셰이킹 뒤 크기는 재 보지 않았다** |
| PlayCanvas 엔진 | MIT(LICENSE 확인) | 1급 | 재 보지 않았다 | 에디터는 클라우드 서비스, 엔진은 독립 |
| Godot 4 | MIT | 2급: WebGL2 Compatibility 만, 단일 스레드 기본, **C# 불가**, **WebGPU 없음**, Safari 문제 명시 | 없음 | `JavaScriptBridge` 로 JS 호출 가능(eval·get_interface, 콜백 1인자·부동소수 정밀도 제한) |
| Unity 6 | Personal 무료(20만 달러 미만), 런타임 요금 취소 | 2급: 데스크톱 4종 + iOS Safari 15+·Android Chrome 58+ | 재 보지 않았다 | Wasm 수 MB(수치는 문서에 없음) |
| Unreal 5 | 라이선스 페이지 403 — **확인 못 함** | 없음(커뮤니티 HTML5 만) | — | 32기물+섬에 과잉 |

### 1.3 스토어·결제 (공식 문서)
- Google Play: 디지털 상품 인앱 구매는 **Play 결제 시스템 필수**. 수수료 연 100만 달러까지 15%, 초과 30%. 한국·EEA·인도·미국은 대체 결제 프로그램(수수료는 여전).
- TWA(Trusted Web Activity): Chrome 72+, Digital Asset Links 로 사이트 소유 증명, PWA 설치 요건 충족 필요 — **three 를 유지한 채 Play 에 내는 경로**.
- iOS App Store 4.2: 「beyond a repackaged website」, 4.2.2 「web clippings」 금지 — **웹 래퍼 거절 근거. iOS 스토어 출시만이 엔진 교체를 강제한다**(grok, 통합자 동의).
- 웹 결제(Stripe·Paddle 등) 수수료 3~5% 는 **재 보지 않았다**.

## 2. three 없이 되는가 — 후보별 요구 충족

요구: GLB 125개 로드 · 스켈레톤 클립 재생 · 그림자 · 물·하늘 셰이더 · 외곽선 · DOM(React) HUD · gzip 400KB 게이트 · PWA/TWA.

| 후보 | 요구 충족 | 가져가는 것 | 다시 쓰는 것 | 판정 |
| :-- | :-- | :-- | :-- | :-- |
| three 유지 | 전부 | 전부 | 0 | **기본** |
| Babylon.js (하이브리드: 렌더만 교체) | 전부 가능. 번들 게이트는 **재야 안다** | React·Vite·chess.js·테스트·GLB·파이썬 도구 | 장면 6,300 + fx 1,269 + 섬 장면의 렌더 부분 | 성능 사유로 떠날 때의 **1순위 비교 대상** |
| PlayCanvas (하이브리드) | 전부 가능 | 같음 | 같음 | Babylon 과 같은 급. 재지 않으면 고르지 않는다 |
| 순수 WebGL/WebGPU | 가능하나 로더·스킨·행렬을 손으로 | — | 전부 + 엔진 자체 | 1인 개발 불가(넷 일치) |
| Godot 4 웹 | 게임은 가능. React HUD 못 가져감, chess.js 는 `JavaScriptBridge` 경유 또는 재구현 | GLB·파이썬 도구 | 코드 전부(GDScript) | 웹 2급 → 웹 1급 목표와 충돌 |
| Unity 6 웹 | 같음(C#) | 같음 | 같음 | 같음 + Wasm 크기 |
| Godot/Unity 네이티브 | 가능. 웹 포기 | GLB·파이썬 도구 | 전부 | **스토어 네이티브가 1급으로 확정될 때만** |
| Unreal | 웹 없음 | GLB(변환) | 전부(C++/BP) | 제외 |

## 3. 장기 손익 (2~3년)

| 축 | three 에 남음 | 하이브리드(Babylon) | Godot/Unity 네이티브 |
| :-- | :-- | :-- | :-- |
| 이전 공수 | 0 | **추정** 20~40근무일(grok, 200~400줄/일 가정) · 장면 파일 20~50% 결합 가정 시 1,260~3,150줄(codex) | **추정** 3~6인월(grok) · 230~250시간(agy). 측정 아님 |
| 업그레이드 세금 | Phase 6 TSL 재작성(이미 로드맵에 있음). r170→최신 깨짐은 재 보지 않았다 | WebGPU 는 내장이라 적음(공식 문서) | Godot 메이저 재작성 전례, Unity 라이선스 변동 전례(2023 런타임 요금 발표→취소) |
| 에셋 파이프라인 | 그대로 | GLB 그대로. 리그·클립 재검증 | GLB 가져오기 가능하나 리그·클립·머티리얼 재검증 1~2주(추정) |
| 스토어 | Play 는 TWA 로 가능. iOS 는 4.2 위험 | 같음 | Play·iOS 네이티브 모두 가능 |
| 수수료 | 엔진 0. 웹 결제 3~5%(미확인) 또는 Play 15% | 같음 | 엔진 0(Godot) / 0(Unity 20만 달러 미만). Play 15% + iOS 15/30% |
| LLM 협업 | 넷 모두 「인상」: JS/TS/three 가 유리. **근거 없음**. 다만 지금 13,710줄이 이 스택에서 LLM 협업으로 나왔다는 것이 유일한 실측 | 같은 언어 | GDScript 3/4 혼재·C# 보일러플레이트 — 인상 |
| 기회비용 | 0 | Phase 5a·5b 1~2개월 지연 | **Phase 5b 룩 상점(유일한 매출 레버) 3~6개월 지연** |

결론: 매출 가정이 어떻든 이전 공수가 수수료 차액보다 크다(grok: 룩 연매출 1만 달러 **가정** 시 Play 추가 부담 약 1,200달러 vs 이전 3인월). **엔진 선택은 수익화 문제가 아니라 「웹이 1급인가」 하나로 갈린다.**

## 4. 결정 — 조건부

### 4.1 남는다 (지금)
다음이 모두 참인 동안 three 에 남는다.
1. 웹 배포가 1급(기획서 §9 Phase 5a·5c 의 전제).
2. 장면 규모가 체스판+섬.
3. **드로우콜 220 → ≤100, 내장 Intel UHD 에서 p95 ≤ 33ms** 를 three 안에서 2주 안에 맞춘다(§5 실험).

### 4.2 떠난다
다음 **하나라도** 참이면 재검토를 연다.
- (a) **스토어 네이티브(특히 iOS)가 웹보다 우선**이라는 제품 결정이 문서화된다 → Godot·Unity 네이티브 비교(웹 2급 또는 포기). 웹 내보내기를 노리지 않는다(agy·grok 일치).
- (b) §5 실험이 실패하고, **같은 GLB·같은 장면**으로 만든 Babylon 1주 스파이크가 프레임 시간을 절반 이하로 내린다 → 하이브리드 이전(React·Vite·chess.js·GLB 유지).
- 11-04 관리 계획서의 조건 (c)「멀티플레이·GI 가 핵심」은 **뺀다**: 체스는 턴제라 전송층(Supabase)이 렌더러와 무관하고(codex 지목), GI 는 디오라마 방향(premium-feel)에 필요 없다.

### 4.3 떠날 때 어디로 (갈린 곳의 판정)
통합자 초안은 Godot 1순위였다. 라운드 뒤 **사유별로 행선지를 가른다**: 성능 사유 → 웹 스택 보존 하이브리드(Babylon/PlayCanvas, 같은 장면으로 재서 고른다). 스토어 사유 → 네이티브(Godot 우선, MIT·GLB 임포트). 행선지를 미리 하나로 정하지 않는다.

## 5. 재는 방법 — 2주 드로우콜 실험 (MG-S3 앞에 끼운다)

| 날 | 일 | 완료 기준 | 근거 |
| :-- | :-- | :-- | :-- |
| 1 | `debugRenderCalls()`(엔진 `:5726`) 로 **장면별** 드로우콜 분해표: 보드·기물·섬·바다·효과 각각 몇 콜인지. 해상도 절반으로도 재서 fill-rate 병목을 분리 | 220 의 출처가 표로 | 지금은 합계만 안다. agy 의 분해(타일 64·기물 96·소품 60)는 추정 |
| 2~3 | 보드 타일 64 → `InstancedMesh` 1 | 콜 −63, 화면 동일(스크린샷 비교) | `:985~1003` 확인됨 |
| 4~6 | 섬 정적 소품 `mergeGeometries`/아틀라스 | 콜 측정 | 효과는 재 봐야 안다 |
| 7~10 | 같은 리그 기물(폰 8) 본 행렬 텍스처 인스턴싱 시제품 | 8콜→1콜이 되는지, 클립 타이밍이 기물마다 달라도 되는지 | agy 제안·통합자 보류. 안 되면 **생략**하고 다음으로 |
| 11~12 | `tools/perf_probe.mjs` 3로드×3표본, 내장 UHD + NVIDIA 두 GPU | 드로우콜 ≤100, p95 ≤33ms(UHD) | 잡음 문제: 고정 카메라·고정 국면·창 크기 고정으로 재측정 |
| 13~14 | 실패 시: Babylon 스파이크 범위 산정(장면 파일에서 렌더 결합 줄 수 세기 — codex) | 결합 비율 수치 | 하이브리드 공수의 근거 |

### 5.1 결과 (2026-11-04, 1~3일차) — [qa 기록](../qa/2026-11-04-drawcalls-tiles.md)
- 분해: 기물 128콜(32×4: 동물 1 + 받침 3), 보드 68, 섬 25, 기타 1 = 222.
- **측정 함정**: ego-browser 창은 빈 페이지에서도 rAF 34.8ms(약 29Hz). 장면 전부 숨겨도, 해상도 절반이어도 같다. 콜백 JS 는 1.3ms. → §4.1 조건 3 의 p95 기준은 이 도구로 판정 불가. **조건 3 은 「드로우콜 ≤ 100」만으로 좁히고, 프레임 시간은 지표를 바꾼 뒤(콜백 JS ms + 빈 페이지 대조, 또는 실제 Chrome 창) 다시 정한다.**
- 타일 64 → InstancedMesh 2: 222 → 160콜. 피킹·클릭 이동·화면 동일 확인.
- 다음: 받침 병합(−64 → 96), 섬 소품 병합, perf_probe 지표 교체. 폰 8 스킨드 인스턴싱(7~10일차)은 드로우콜 목표가 받침 병합만으로 닿으면 **생략**.

## 6. 사용자 확인 목록
| # | 질문 | 추천 |
| :-- | :-- | :-- |
| 1 | 웹이 1급인가, 스토어(특히 iOS) 네이티브가 1급인가 | 웹 1급 유지(기획서 §9 그대로). iOS 는 v1.0 제외 |
| 2 | §5 2주 실험을 MG-S3(사자 A/B) 앞에 넣는가 | 넣는다 — 재검토 조건 (b) 가 이 실험에 걸려 있다 |
| 3 | 실험 실패 시 Babylon 스파이크 1주를 쓰는가 | 쓴다(실패했을 때만) |
| 4 | 11-04 관리 계획서 §3.3 의 조건 (c) 삭제 수용 | 수용 |

## 7. 틀릴 수 있는 곳
1. **LLM 적합성은 전부 인상이다.** 넷 중 누구도 근거를 대지 못했다. 바꾸는 쪽이 유리할 가능성을 배제하지 않는다.
2. **드로우콜을 three 안에서 줄일 수 있다는 것은 가설이다.** 특히 스킨드 메시 인스턴싱은 아무도 해 보지 않았다. 또 UHD 병목이 드로우콜이 아닐 수 있다(agy E-1).
3. **이전 공수는 전부 줄 수 비례 추정이다.** Godot 에디터·AnimationTree 가 안무·카메라 코드를 크게 줄여 추정보다 싸질 수 있고, 반대로 GLB 재검증이 더 비쌀 수 있다.
4. Babylon 번들은 전체 패키지 수치만 있다. 트리 셰이킹 뒤 400KB 게이트를 넘는지 재지 않았다 — 넘으면 하이브리드 자체가 게이트와 충돌한다.
5. Unreal 라이선스는 두 번 403 으로 확인 못 했다. 결론에 영향은 없다(웹 빌드 없음이 결정적).

## 8. 출처
- three LICENSE https://github.com/mrdoob/three.js/blob/dev/LICENSE · 릴리스 https://github.com/mrdoob/three.js/releases · WebGPURenderer https://threejs.org/docs/pages/WebGPURenderer.html
- Babylon license.md https://github.com/BabylonJS/Babylon.js/blob/master/license.md · WebGPU https://doc.babylonjs.com/setup/support/webGPU · bundlephobia `@babylonjs/core@8.0.0`
- PlayCanvas LICENSE https://github.com/playcanvas/engine/blob/main/LICENSE
- Godot 웹 내보내기 https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html · JavaScriptBridge https://docs.godotengine.org/en/stable/tutorials/platform/web/javascript_bridge.html
- Unity 웹 브라우저 호환 https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/intro/browsercompatibility
- Play 결제 정책 https://support.google.com/googleplay/android-developer/answer/10281818 · 수수료 https://support.google.com/googleplay/android-developer/answer/112622 · TWA https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities
- App Store 심사 지침 https://developer.apple.com/app-store/review/guidelines/
- 저장소: `src/wizardChessEngine.js`, `src/village/islandScene.ts`, `docs/perf/2026-11-04-gate-s1.json`, `docs/PLAN.md` §4.2·§9
