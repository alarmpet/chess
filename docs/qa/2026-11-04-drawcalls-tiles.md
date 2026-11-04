# 드로우콜 실험 1~3일차 — 분해표, 측정 환경의 함정, 보드 타일 인스턴싱 (2026-11-04)

근거 계획서: [엔진 선택 계획서 §5](../plans/2026-11-04-engine-choice-triagent-plan.md). 원자료: `docs/perf/2026-11-04-drawcalls-day1.log`, `-day1.json`, `-day1b.json`, `-day1c.json`, `-day2.json`.
스크립트와 스크린샷은 저장소 밖 `C:/Users/petbl/ego/chess-drawcalls-20261104/` (`day1.mjs` `day1b.mjs` `day1c.mjs` `blank.mjs` `day2.mjs` `pick.mjs`, `day1.png` 전 · `day2-after.png` 후).
환경: ego-browser(ego lite 0.6.2.7), 내장 Intel UHD(0xA788), 캔버스 1920×921, dpr 1, 초기 국면, 기본(플레이어) 카메라.

## 1일차 — 드로우콜 분해 (타일 인스턴싱 전, 222콜)

| 그룹 | 객체 | 메시 | 스킨드 | 삼각형(지오메트리 합) | 드로우콜 |
| :-- | --: | --: | --: | --: | --: |
| piece(기물 32) | 32 | 128 | 32 | 695,808 | **128** |
| board(타일 64 + 테두리 4) | 1 | 68 | 0 | 19,248 | **68** |
| biome(섬·소품) | 1 | 134 | 0 | 135,971(인스턴스 미포함) | 25 |
| Mesh(바닥 등) | 2 | 2 | 0 | 38 | 1 |
| sprite(화로 빛) | 4 | 4 | 0 | 8 | 0 |
| light | 13 | 0 | 0 | 0 | 0 |

- 기물 1개 = 메시 4개: 동물 `low`(SkinnedMesh 20,000 tri) + 받침 `pedestal`(선반 880) + 띠(토러스 768) + `side-ring`(96, MeshBasic). **기물당 4콜 → 32개에 128콜.** 받침 3개가 96콜을 쓴다.
- 기물 32개 모두 21,744 tri(동일 템플릿 복제).
- `renderer.info.render.triangles` 는 1.69M(그림자 패스·인스턴스 포함). biome 을 숨기면 979k 가 빠진다 — 소품 인스턴싱이 삼각형의 큰 몫이다(재지 않았다).

## 1일차 — 측정 환경의 함정 (중요)

| 측정 | 결과 |
| :-- | :-- |
| 프레임 간격(rAF) 전체 장면 | 중앙값 34.8ms, p95 48.5 |
| 해상도 절반(pixelRatio 0.5) | 34.7 / 48.6 — **같음** |
| 장면 전부 숨김(0콜·0tri) | 34.7 / 48.6 — **같음** |
| **빈 페이지**(robots.txt) rAF | **34.8 / 69.3 — 같음** |
| 콜백 안 JS 시간(stepScene+render 제출) 전체 장면 | **중앙값 1.3ms, p95 3.9** (render 제출 1.0) |
| 같은 것, 장면 전부 숨김 | 0.5 / 1.0 |

결론: **이 브라우저 창은 rAF 를 약 29Hz 로 돌린다.** 지금까지의 fps 수치(perf_probe 21/47/36, PF-0 의 「잡음」)는 우리 장면이 아니라 측정 환경을 쟀다. CPU 쪽 비용은 프레임당 1.3ms 로 거의 비어 있다. GPU 시간은 이 환경에서 못 잰다(해상도 절반·장면 숨김 모두 간격이 안 변하므로 GPU 가 병목인 상태도 아니다).
→ 계획서 §4.1 조건 3 의 「UHD p95 ≤ 33ms」는 **이 도구로는 판정 불가**. `tools/perf_probe.mjs` 는 rAF 간격 대신 **콜백 JS ms + 빈 페이지 대조**를 재도록 바꿔야 한다(열린 항목). 드로우콜 수는 영향 없이 유효하다.

## 2~3일차 — 보드 타일 64 → InstancedMesh 2

`src/wizardChessEngine.js` `buildChessBoardGrid`: 밝은 칸 32·어두운 칸 32 를 `InstancedMesh` 둘로. 재질 둘은 그대로(색·거칠기 동일) → 화면 동일. 피킹은 `hit.instanceId` → `userData.squares[i]` 로 칸을 찾는다. `applyBoardPalette` 는 메시 둘의 재질 색만 바꾼다. 디버그 훅 `debugPick(nx, ny)` 추가.

| 항목 | 전 | 후 |
| :-- | --: | --: |
| 전체 드로우콜 | 222 | **160** |
| board 드로우콜 | 68 | **6** (인스턴스 2 + 테두리 4) |

확인:
- 스크린샷 전후(`day1.png` / `day2-after.png`) 눈으로 비교 — 타일 색·배치·그림자 동일(픽셀 비교는 하지 않았다).
- `debugPick` 으로 e2·e3·e4·a1·h8 다섯 칸 모두 올바른 r·c(instanceId 26·22·18·28·3).
- 마우스 클릭 e2 → 하이라이트 3개(e2·e3·e4) → e4 클릭 → FEN `rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2`(AI 응수 포함). 기본 카메라에서는 앞줄 왕이 e2 를 가려 e1 이 잡히므로 위 카메라(`btn-cam-top`)로 시험했다 — 이것은 인스턴싱과 무관한 기존 동작.
- `npm test` 134 통과, `tsc` 오류 0.

## 다음
- 받침 3메시 → 1(선반+띠 지오메트리 병합, 정점색 또는 재질 그룹) 이면 −64 → 96콜 ≤ 100 목표 도달. `side-ring` 은 투명 MeshBasic 이라 따로.
- `perf_probe.mjs` 지표 교체(위).
