# 라운드 — three.js 를 계속 쓰나, 엔진을 바꾸나 (2026-11-04)

사용자 질문: 「threejs 없이 우리 게임이 구현이 안 되는 거야? 다른 걸로 대체하고 고닷이나 언리얼, 유니티 엔진을 사용하는 게 더 좋은 건지? 장기적 관점으로 손익 잘 따져서 llm 들 협업해서 계획서 작성해」
결과 계획서: [docs/plans/2026-11-04-engine-choice-triagent-plan.md](../../../plans/2026-11-04-engine-choice-triagent-plan.md)

## 방법
- 브리핑 `BRIEF-base.md`(저장소 확인 사실만) + 역할 셋. 통합자(Claude)는 셋을 읽기 전에 `r1-claude.md` 를 썼다.
- 셋은 파일·도구 접근 없이 브리핑만 보고 답했다(권한 분류기가 `--dangerously-skip-permissions`·`bypassPermissions` 를 막아 플래그 없이 실행. 브리핑이 필요한 사실을 담고 있어 영향 없음).

| 모델 | 역할 | 명령 | 결과 |
| :-- | :-- | :-- | :-- |
| agy | 기술 실현성·이전 비용 | `agy --effort high --print-timeout 40m -p "$(cat BRIEF-agy.md)"` | 7.4KB, `r1-agy.md` |
| grok | 사업·장기 유지 | `grok -p … --output-format plain -m grok-4.6 --effort high --max-turns 20` | 4.5KB, `r1-grok.md` |
| codex | 반대 심문 | `codex exec -s read-only -c model=gpt-6-sol - < BRIEF-codex.md` | 5.1KB, `r1-codex.md` |

## 어느 주장이 틀렸나 (저장소·공식 문서 대조)
| 출처 | 주장 | 판정 | 근거 |
| :-- | :-- | :-- | :-- |
| agy | 보드 타일 64개가 개별 메시 → ~64 드로우콜 | **참** | `src/wizardChessEngine.js:985~1003` — `RoundedBoxGeometry` 하나를 8×8 루프에서 `new Mesh` 64개 |
| agy | 기물 32개에 `OutlineEffect` 2패스 → +32 드로우콜 | **거짓** | `OutlineEffect` 는 `src/village/islandScene.ts:408` 섬 장면에만 있다. 체스 장면 파일에는 없다 |
| agy | 그림자 캐스터 패스가 매 프레임 드로우콜을 2배로 | **거짓** | `renderer.shadowMap.autoUpdate = false`(`:65`), `needsUpdate` 8곳에서만 갱신 |
| agy | Babylon.js 번들 600KB~1MB+ gzip (추정 표시) | **보류** | bundlephobia `@babylonjs/core@8.0.0` 전체 gzip 1,298KB — 트리 셰이킹 뒤 실제 크기는 재 보지 않았다 |
| agy | PlayCanvas 는 「클라우드 종속」 | **절반** | 엔진은 MIT 독립 라이브러리(LICENSE 확인). 에디터만 클라우드 |
| agy | Godot 웹은 WebGPU 미지원 | **참** | 공식 문서 「Godot currently does not support WebGPU」 |
| agy | three `WebGPURenderer` 는 TSL 재작성 필요 | **참(기획서 §4.2 와 같음)**. 덧붙여 WebGL2 폴백 내장 | 공식 문서 「falls backs to a WebGL 2 backend」, `forceWebGL` |
| agy | Unity SRP Batcher 는 스킨드 메시 제외 | **확인 못 함** | 공식 문서 조회 안 함 |
| agy | 이전 공수 230~250시간 | **추정** | 줄 수 비례 계산. 측정 아님 |
| grok | Play 디지털 상품은 Play 결제 시스템 필수 | **참** | Play 결제 정책 「Google Play's billing system is required for developers offering in-app purchases of digital goods」. 한국·EEA·인도·미국은 대체 결제 프로그램(수수료 여전) |
| grok | Play 수수료 15%(연 100만 달러까지)/30% | **참** | Play 도움말 112622 |
| grok | 웹 결제 3~5% | **재 보지 않았다** | Stripe·Paddle 요율 페이지 미조회 |
| grok | iOS 4.2 가 웹 재포장 거절 근거 | **참** | 지침 4.2 「beyond a repackaged website」, 4.2.2 「web clippings」 |
| grok | Unreal 로열티 $1M 초과 5% | **확인 못 함** | 라이선스 페이지 403(두 번째 시도도) |
| grok | 체스 유저의 본진은 웹 | **인상(본인 표시)** | 수치 없음 |
| codex | `three` 직접 import 파일 8개가 최소 변경 범위 | **참** | `grep -rl "from 'three" src` = 8 |
| codex | 장면 파일 20~50% 가 렌더 결합(가정) | **재 보지 않았다** | 결합도 측정 안 함 |
| 셋 모두 | LLM 은 JS/TS/three 를 더 잘 쓴다 | **인상** | 셋 다 스스로 「인상」표시. 통합자도 같음 |
| 통합자(r1-claude) | 「`SkeletonUtils.clone` 32개는 인스턴싱이 어렵다」 | **보류** | agy 가 본 행렬 텍스처 방식 `InstancedSkinnedMesh` 를 제안. 둘 다 안 해 봤다 |

## 셋이 갈린 곳·모인 곳
- **모임(셋+통합자)**: three 없이도 된다. 지금 떠날 이유는 없다. 재검토 조건은 ① 드로우콜 실험 실패 ② iOS/스토어 네이티브가 1급으로 확정. 이전 시 GLB 125개·파이썬 도구는 그대로 간다.
- **갈림**: 떠날 때 어디로. agy = 웹을 버릴 때만 Unity 네이티브. grok = 성능이면 Babylon/Godot 웹 1주 스파이크로 판정. codex = 하이브리드(렌더만 교체)가 성립하되 결합도 측정이 먼저. 통합자 = Godot 1순위였다 → **codex·grok 쪽을 채택**(먼저 결합도를 재고, 성능 사유면 같은 장면으로 Babylon 과 재서 고른다).
- codex 가 지목: 기존 재검토 조건 (c)「멀티플레이가 핵심이면」은 턴제 체스에서 렌더러와 무관 → **조건에서 뺀다**.

## 교훈
- 역할을 기술/사업/반대심문으로 가르자 셋이 겹치지 않았다. agy 의 사실 오류 2건(외곽선·그림자)은 저장소 한 줄로 걸렸다 — 모델이 「일반적인 three 장면」을 우리 장면으로 가정했다.
- 브리핑이 「`OutlineEffect` 사용」이라고만 적어 어느 장면인지 안 밝힌 것이 통합자 오류였다(§1 규칙 3).
