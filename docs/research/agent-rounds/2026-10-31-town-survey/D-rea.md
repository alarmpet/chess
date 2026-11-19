# REA 분석 기록

`analyze_javascript_application`, 실행 없이 정적 분석. 세 저장소 모두 파싱 실패 0. 그래프 범위는 부분이며 큰 파일은 노드 상한에 걸렸다.

| 대상 | 범위 | 파일 | 호출 흐름 | 데이터 흐름 | 비고 |
| :--- | :--- | ---: | ---: | ---: | :--- |
| Ethereal Farm (GPL-3) | game, data, state, save | 4 | 8979 | 33337 | 노드 상한 도달 |
| Evolve (MPL-2.0) | main, functions, vars | 3 | 1254 | 23940 | 노드 상한 도달 |
| Kittens Game (재배포 제한) | game, core, resources, time | 4 | 42 | 16782 | |

REA 는 소스가 있는 대상에서 복구가 아니라 흐름 그래프를 더한다. 게임 수치와 구조는 소스를 직접 읽은 `C-open-source.md` 를 따른다. 컴파일된 상용 게임은 받지 않았다.
