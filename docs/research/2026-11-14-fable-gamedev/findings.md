# Claude Fable 5.2 계열로 게임을 만드는 공개 사례 조사 (2026-11-14)

읽기 전용 웹 조사(하위 에이전트가 검색·열람, 통합자가 요약). 이 저장소에서 잰 것은 없다 — 적용 후보의 비용은 모두 추정이다.
통합자는 아래 URL 을 다시 열어 보지 않았다. 「직접」은 조사 에이전트가 그 페이지를 읽었다는 뜻이다.

## 0. 읽는 법

- **[직접]** 그 페이지를 읽어 확인 · **[2차]** 보도·요약 페이지만 읽음 · **[확인 못 함]** 검색 요약에만 나옴(403 등).
- 작성자 본인 주장(시간·비용·토큰)은 제3자가 검증한 수치가 아니다.
- 「Claude Mythos」를 내건 게임 제작 사례, Fable 5.2 로 체스·보드게임이나 모바일 세로 3D 보드 UI 를 만든 사례는 **찾지 못했다**.

## 1. 사례

| # | 무엇 | 모델 · 도구 | 작업 흐름(확인된 것) | 확인 | URL |
| :-- | :-- | :-- | :-- | :-- | :-- |
| A1 | 「Aiden's Revenge」 12스테이지 벨트스크롤 | Claude Code + Fable 5.2 | 긴 지시 1개. 지시하지 않았는데 에이전트가 **봇을 짜 헤드리스 브라우저로 전 스테이지를 돌리고 봇의 스크린샷을 검사**. 이후 사람 4명 시험으로 빈틈 발견 | 직접 | https://notesbylex.com/fable-5-2-one-shotted-my-nephews-dream-game |
| A2 | 「Age of Dragon」 three.js 오픈월드 | Fable 5.2 + Opus 5.5, Tripo, Blender | **그림 먼저**(명소마다 콘셉트 그림 → 장소). 모델이 Blender 를 몰아 공용 뼈대 하나에 리깅 | 2차 | https://explainx.ai/blog/age-of-dragon-ai-open-world-rpg-vibe-coded-fable-5-2-opus-5-5-three-js-2026 |
| A3 | 「Saltline」 브라우저 FPS | Fable 5.2 | 프롬프트 1개로 약 8시간 자율 작업, 에셋 파일 없이 생성 | 2차 | https://en.gamegpu.com/news/igry/nejroset-fable-5-2-ot-anthropic-sozdala-polnotsennyj-fps-za-8-chasov-i-usd550 |
| B1 | 「Raccoon Heist」 모바일 친화 3D 잠입 (three.js) | Claude Code + Fable 5 | `notes.md` 작업 기록 · 잦은 커밋. **Playwright 로 데스크톱·모바일 폭을 둘 다 찍다가 모바일에서만 주인공이 안 보이는 결함을 잡음** | 직접 | https://simonwillison.net/2026/aug/5/raccoon-heist |
| B2 | `fable51-worlds` 실제 장소 → three.js 장면 | Fable 5.1 에이전트 무리 | **만든 쪽이 자기 작업을 채점하지 않는다** — 역할이 다른 독립 검토자. 고정 시점 스크린샷을 참고 사진과 비교. 알려진 결함을 QA 보고서에 적음 | 직접 | https://github.com/PhiloLabs/fable51-worlds (MIT) |
| C1 | 「Tides of Fortune」 에셋 파일 0개 해적 게임 | Claude Code(판 미상) | **아트 바이블 + 비평 규약** 문서. 시스템마다 새 스크린샷으로 비평 3회(축별 점수·합격/불합격·수정 목록). `?shot=` 쇼케이스 16개. 드로우콜 예산 문서화 | 직접 | https://github.com/silvestroz/tides-of-fortune — **PolyForm Noncommercial: 코드 복사 금지** |
| C2 | 「Claude-of-Duty」 브라우저 FPS | 에이전트 무리(판 미상) | 적대적 비평가 다수가 프레임 채점(3.59 → 5.05). `shotset`(샷 묶음) · `imagediff`(**최적화 커밋은 바뀐 픽셀 0**) · 플레이 중 셰이더 컴파일 34 → 0 | 직접 | https://github.com/mshumer/Claude-of-Duty (MIT) |
| C3 | 「Freeze Out」 눈싸움 FPS | Claude Code | 버텍스 컬러 + 작은 트라이플래너 텍스처 1장. 재질별 병합으로 드로우콜 200 → 100, 캐릭터 30 → 3 | 직접 | https://discourse.threejs.org/t/freeze-out-a-first-person-4v4-snowball-fight-in-the-browser-three-js-webgpu-mobile-gamepad/96804 |
| C4 | 「Velocity GP」 브라우저 레이서 | Claude(판 미상) | 사람은 **캡처 + 증상 한 줄**, 원인 추적은 모델. 스카이돔은 카메라 추종, 안개는 월드 고정 평면 + UV 스크롤 | 직접 | https://buildingbetter.tech/p/i-built-a-browser-racing-game-in |
| C5 | 귀여운 소형 3D 게임 7종 | AI 언급 없음 | `RoomEnvironment` + PMREM 반사, 블룸 + 마지막 색 보정만, 봇이 헤드리스로 난이도 측정, 콤보마다 음계의 다음 음 | 직접 | https://discourse.threejs.org/t/7-small-3d-browser-games-with-zero-model-texture-or-audio-files-900-kb-each/95438 |

## 2. 반복되는 기법

1. **고정 시점 샷 묶음** — 장면·카메라·국면을 결정적으로 재현하는 진입점, 데스크톱·모바일 폭 둘 다(B1·C1·C2·B2).
2. **비평하는 쪽과 만드는 쪽을 가른다** — 문서로 고정한 채점표, 새 스크린샷으로 여러 회(B2·C1·C2).
3. **픽셀 비교 문지기** — 성능·리팩터 커밋은 화면이 안 바뀜을 증명(C2).
4. **봇 플레이 + 스크린샷 검사**, 그 뒤 사람 시험(A1·C5).
5. **싸게 완성도 올리기** — 후처리는 패스 하나(약한 블룸 + 비네트 + 톤 매핑 + 색 보정), 접지 그림자는 그라디언트 평면, 환경광은 PMREM, 픽셀 비율 상한 2, 모바일 드로우콜 예산 약 100. 출처: https://github.com/pmndrs/postprocessing (Zlib) · https://www.utsubo.com/blog/threejs-best-practices-100-tips
6. **물·하늘** — 물가 거품 띠(깊이 차 또는 미리 구운 물가 거리), 스카이돔 카메라 추종, 월드 고정 안개(C4, https://code.tutsplus.com/creating-toon-water-for-the-web-part-2--cms-30485t).
7. **주스** — 히트 스톱 0.06초, 스쿼시 (1.3, 0.7) 탄성 복귀, 플래시 0.12초, 피치 ±8%, 효과는 하나씩 넣고 조율(Godot 글: https://forum.godotengine.org/t/game-feel-checklist-for-godot-4-hit-stop-trauma-shake-coyote-time-and-more/145340).

## 3. 체스·보드 플레이 화면

자료가 얇다. 3D 체스 세로 화면 설계 사례 연구는 찾지 못했다.

- 수 표시 기준선(Chessground 기능 목록 — **GPL-3.0, 코드 복사 금지**): 직전 수 강조 · 갈 칸 표시 · 체크 강조 · 탭-탭과 끌기 둘 다. https://github.com/lichess-org/chessground
- 표시는 점이어도 **판정은 칸 전체**. https://www.chess.com/clubs/forum/view/expanding-the-clickable-area-for-piece-placement-mobile-app
- 폰에서는 끌면 엄지가 가린다 → 탭-탭 기본. https://www.chess.com/clubs/forum/view/simple-idea-for-optimal-thumb-navigation-on-small-screens
- 자주 쓰는 조작은 아래 엄지 영역, 탭 표적 44px 이상, 안전 영역 inset. https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users

## 4. 이 게임에 비춰 본 적용 후보

| 순위 | 후보 | 이 저장소의 현재 | 판단 |
| :-- | :-- | :-- | :-- |
| 1 | 고정 샷 묶음(세로·가로) | `verify-play.mjs` 가 네 화면 × 7장을 찍는다 | 있음. 국면을 더 늘리면 된다 |
| 2 | 아트 바이블 + 다른 검토자의 채점 | 없음. 만든 쪽이 캡처를 보고 스스로 판단한다 | **다음 후보** — `tri-agent-review` 로 캡처를 채점 |
| 3 | 픽셀 비교 문지기 | 없음. 드로우콜·번들 게이트만 있다 | 후보(바다·물고기가 움직여 고정 프레임 장치가 먼저 필요) |
| 4 | 판정은 칸 전체 · 직전 수 강조 · 탭-탭 | 눌림 판정은 칸 메시, 직전 수 표시 있음, 탭-탭과 끌기 둘 다 | 있음 |
| 5 | 주 조작을 아래 엄지 영역으로 | 빠른 단추가 위 줄에 있다 | 후보 — 사람 시험과 함께 |
| 6 | 그라디언트 접지 그림자 · PMREM | 재 보지 않았다 | 보류(GPU 병목 21.6ms 기록이 있어 그림자 비용부터 잰다) |
| 7 | 패스 하나짜리 후처리 | 라이브러리를 넣을 번들 여유가 없다(394/400KB) | **CSS 비네트로 대신**(4차에서 적용, 번들 JS 0) |
| 8 | 잡기 주스 묶음 | 히트 스톱 · 흔들림 · 반음 상승이 이미 있다 | 있음 |
| 9 | 물가 거품 띠 · 스카이돔 · 안개 평면 | 바다는 `src/fx` 에 있다. 거품 띠 유무는 확인하지 않았다 | 후보 |
| 10 | 소품 재질별 병합 · 셰이더 미리 컴파일 | 드로우콜 68(상한 100) | 보류 |

## 5. 못 읽은 것

403: thenewstack · tweaktown(Saltline 세부) · Codrops 스타일 물 · lichess 블로그 「Making 3D chess feel like over the board」. Fable 5.2 게임 제작에 대한 Anthropic 공식 기술 글은 찾지 못했다.
