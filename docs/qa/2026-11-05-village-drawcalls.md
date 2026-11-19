# 섬 장면 드로우콜 첫 측정 (2026-11-05)

근거 계획서: [아틀란티스 수중 마을 계획서 §4](../plans/2026-11-05-atlantis-village-plan.md). 체스 장면 게이트(`tools/drawcall_gate.mjs`)는 섬 장면을 재지 않아, 페이지에서 WebGL `drawElements`·`drawArrays`·`drawElementsInstanced`·`drawArraysInstanced` 를 감싸 프레임당 호출 수를 셌다(코드 수정 없음).

환경: 개발 서버 `http://localhost:3000/`(커밋 `18caffd`), Claude 내장 브라우저 창 1024×768, dpr 1, 기본 카메라(zoom 1, pitch 0.74), 낮. 2초 동안 rAF 71~77회로 나눈 평균.

| 저장 상태 | 콜/프레임 | 삼각형/프레임 | 캡처 |
| :-- | --: | --: | :-- |
| 빈 섬(기본 저장: 집 1 g7 · 부두 · 산호 · 물고기) | 51.2 | 1,203,594 | [empty](2026-11-05-village-drawcalls-empty.jpg) |
| 건물 8채(b2·d2·f2·b4·d4·f4·b6·d6, 주민 없음, 나무·소품·깃발 없음) | 134.3 | 1,339,169 | — |
| 완성 섬(건물 8 + 나무 16 + 소품 3(집·등불·분수) + 깃발 2 + 성문 + 승급 집 1, 길 9칸) | 261.4 | 1,504,225 | [full](2026-11-05-village-drawcalls-full.jpg) |

- 삼각형 수는 그림자 패스·인스턴스를 포함한다(`drawElementsInstanced` 의 인스턴스 수를 곱함).
- 저장(`wildcrown.village.v1`)은 백업한 뒤 바꿨고, 측정 뒤 되돌린 것을 확인했다(`restored: true`).
- 같은 창에서 체스 장면 `window.wizardChess.debugRenderCalls()` 는 194(로드 직후)·207(마을 닫은 뒤)이었다. 게이트의 98 과 다르다. 원인은 재 보지 않았다.
- rAF 는 이 창에서 약 36~38Hz 였다. fps 는 환경값이라 쓰지 않는다([drawcalls-tiles](2026-11-04-drawcalls-tiles.md)).
