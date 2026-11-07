# REA 분석 기록

REA `analyze_javascript_application` 으로 소스를 실행하지 않고 정적 그래프를 복구했다.

| 대상 | 범위 | 결과 |
| :--- | :--- | :--- |
| Spires of Azeroth (MIT) | `js/engine/rewards.js`, `deck.js`, `js/ui/cardReveal.js` | 3개 파싱, 호출 흐름 142, 데이터 흐름 1437 관계. 나머지 320파일은 범위 밖 |
| Chess Chaos Roguelike (MIT) | `api/turns.js`, `src/board-state.js` | 2개 파싱, 호출 흐름 40, 데이터 흐름 640 관계. 나머지 16파일은 범위 밖 |

그래프 범위는 부분이다. 수치는 소스에서 직접 읽었다.

- Azeroth 카드 가중치: 일반 60, 고급 30, 희귀 9, 에픽 1. 정예 45/35/17, 보스 0/30/55/15. 에픽은 보스 전용이다(`rewards.js:5`, `:33-36`).
- Azeroth 는 쓸모없는 카드를 60% 확률로 다시 뽑는다(`rewards.js:43`).
- Azeroth 업그레이드는 정의를 덮어쓰는 방식이다(`deck.js:18-23`).
- Chess Chaos 는 3턴마다 규칙을 선택하고 지속 규칙은 턴 수를 센다(`api/turns.js:16`, `:186`, `:206-207`).

컴파일된 상용 게임은 받지도 분석하지도 않았다.
