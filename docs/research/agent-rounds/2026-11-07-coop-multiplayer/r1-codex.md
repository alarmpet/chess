## 출처

아래 인용은 모두 연결된 Reddit 글을 **직접 열어 본문에서 확인**했다. 날짜가 정확히 확인되지 않은 글은 추정하지 않았다.

| 사례 | 주소·확인 상태 | 원문 짧은 인용 | 날짜 | 설계에 주는 근거 |
|---|---|---|---|---|
| 실력 차가 있는 친구의 팀전 | [r/chess: 친구와 체스 두기](https://www.reddit.com/r/chess/comments/mv92wx/how_do_you_play_chess_against_friends_who_dont/) · 직접 열어 읽음 | “We either play 2vs2, or we don't play it all, sadly” | 2021-04-21 | 일대일보다 함께 편을 짜는 쪽을 택한 경험담이다. |
| 손과 뇌의 짝 구성 | [같은 글](https://www.reddit.com/r/chess/comments/mv92wx/how_do_you_play_chess_against_friends_who_dont/) · 직접 열어 읽음 | “Pair up strongest player with weakest.” | 2021-04-21 | 실력 차가 있어도 같은 편으로 참여시키는 방법이다. |
| 상의해서 한 수를 두는 팀 체스 | [r/chess: Team Chess Battle 후기](https://www.reddit.com/r/chess/comments/1awlyqr/the_fabicristian_vs_anishdanny_team_chess_battle/) · 직접 열어 읽음 | “Team chess event where the two "teams" could discuss moves before playing them.” | 정확한 날짜 미확인 | 수 자체보다 둘이 의견을 주고받는 과정이 재미의 일부였다. |
| 실력 차와 4인 체스 | [r/chess: 3·4인 체스판 경험담](https://www.reddit.com/r/chess/comments/53al17/chess_newbie_here_are_3_or_4_player_chess_boards/) · 직접 열어 읽음 | “My family won't ever play me regular chess because I'm too good.” | 정확한 날짜 미확인 | 가족이 강한 사람과 일대일을 피한다는 사례다. |
| 버그하우스의 팀 소통 | [r/chess: Bug House Nuances](https://www.reddit.com/r/chess/comments/9lppar/bug_house_nuances/) · 직접 열어 읽음 | “You cannot move for your partner” | 2018-10-05 | 팀원에게 말할 수 있지만 상대의 말을 대신 움직일 수는 없는 역할 경계가 있다. |

## 반대 증거

- [4인 체스 경험담](https://www.reddit.com/r/chess/comments/53al17/chess_newbie_here_are_3_or_4_player_chess_boards/)에서는 “it was painfully slow since one person made a move at a time.”이라며 한 번 하고 다시 하지 않았다는 댓글이 있다. **직접 열어 읽음**, 정확한 날짜 미확인. 인원을 늘리는 것만으로는 대기 시간이 커진다.
- [팀 체스 제안에 대한 댓글](https://www.reddit.com/r/chess/comments/1kjeaai/has_fide_ever_experimented_some_sort_of_team/)은 “There would be a lot of waiting”이라고 했고, 한 사람의 실수가 팀 전체를 망칠 수 있다고 덧붙였다. **직접 열어 읽음**, 정확한 날짜 미확인.
- [Team Chess Battle 후기](https://www.reddit.com/r/chess/comments/1awlyqr/the_fabicristian_vs_anishdanny_team_chess_battle/)에는 강자가 파트너를 조용히 시키고 혼자 둘 것이라는 우려가 있다: “Hikaru permanently shutting up Levy and playing by himself”. **직접 열어 읽음**, 정확한 날짜 미확인. 상의할 수 있다는 규칙만으로 발언권이 고르게 나뉘지는 않는다.
- [버그하우스 불만 글](https://www.reddit.com/r/chess/comments/kcho48/does_bughouse_always_have_problems_of_constant/)의 작성자는 “I just started playing bughouse, and I love it”이라고 시작하지만, 빠른 기권·연결 오류·파트너 판의 불명확한 결과도 호소한다. **직접 열어 읽음**, 2020-12-13. 팀전에서는 동기화와 결과 설명도 재미를 좌우한다.
- [친구와 체스 두기](https://www.reddit.com/r/chess/comments/mv92wx/how_do_you_play_chess_against_friends_who_dont/)에는 배우자에게 일부러 약하게 뒀더니 상대가 알아채고 좌절했다는 경험담이 있다. **직접 열어 읽음**, 2021-04-21. 난이도를 맞추려고 사람에게 져 주라고 요구하지 않는 편이 낫다.

## 설계안

**‘손과 뇌 릴레이’ — 두 사람이 한 팀으로 AI와 두고, 자기 편이 한 수 둘 때마다 역할을 바꾼다.** 새 체스 변형보다 [이미 구현된 손과 뇌](/D:/chess/src/HandBrain.tsx:161)를 확장하는 제안이다.

- **한 판의 흐름:** A가 뇌로서 합법적으로 움직일 수 있는 *말 종류* 하나를 고른다. B는 그 종류의 말 중 하나를 골라 합법적인 수를 둔다. AI가 응수한다. 다음 자기 편 차례에는 B가 뇌, A가 손이 된다. 역할과 현재 지시를 판 위에 늘 표시한다. 둘이 먼저 상의할 수 있지만, 최종 종류 선택과 실제 수 입력은 서로 다른 역할의 조작으로 확정한다.
- **왜:** 손과 뇌는 실력 차가 나는 친구를 한 편에 넣을 수 있고, 팀 체스 후기에서는 상의 과정 자체를 즐겼다. 릴레이는 4인 체스에서 드러난 긴 대기를 피하면서 기존 8×8 체스 규칙과 AI를 그대로 쓴다.
- **한 사람이 다 두는 문제:** 뇌는 정확한 칸을 클릭할 수 없고 손은 종류를 고를 수 없게 한다. 매 자기 편 수마다 역할을 교대한다. 같은 기기에서 강자가 말로 정답을 지시하는 것까지 기술적으로 막을 수는 없으므로, UI에는 ‘종류만 알려 주고 수는 손이 찾기’를 안내하고 사람 시험에서 실제 지배 여부를 관찰한다.
- **기다리는 사람의 지루함:** 둘 다 매 자기 편 수에 조작이 있다. 상대 수와 잡기 연출 중에는 다음 역할과 현재 국면을 보여 주고, 연출 단축 선택지를 제공한다. 단축이 실제로 필요한지는 측정 후 결정한다.
- **순서:** ① **같은 기기, 두 사람 대 AI를 먼저** 만든다. 서버 없이 역할 교대와 재미를 검증할 수 있다. ② 그 결과가 좋으면 Supabase 방 초대로 **원격 두 사람 대 AI**를 만든다. 2대2 사람 대전은 연결 안정성·이탈 처리·대기 시간까지 확인한 다음 단계다.
- **틀릴 수 있는 곳 셋:** ① 종류 선택이 너무 제한적이어서 손이 답을 찾는 느낌이 약할 수 있다. ② 실력자가 말로 모든 수를 지시할 수 있다. ③ 역할 교대와 3D 잡기 연출 때문에 판이 길고 흐름이 끊길 수 있다.
- **하지 않을 것:** 첫 버전에 4인 전용 판, 버그하우스의 기물 전달·드롭 규칙, 자동 매칭, 랭크 보상, 자유 채팅을 넣지 않는다.
- **가장 약한 결정:** *매 수 역할 교대*다. 공평한 참여에는 유리하지만, 한 사람이 긴 계획을 세우는 즐거움을 해칠 수도 있다. 고정 역할인 현재 손과 뇌와 사람 시험에서 비교해야 한다.

## 저장소 수정

아래는 **실제로 연 파일과 줄**만 적었다. 이번 라운드에서는 파일을 바꾸지 않았다.

| 위치 | 제안·위험 |
|---|---|
| [src/App.tsx:173](/D:/chess/src/App.tsx:173), [src/App.tsx:285](/D:/chess/src/App.tsx:285) | 기존 ‘함께’ 진입점과 `HandBrain` 패널에 릴레이 선택 및 현재 역할 표시를 붙인다. |
| [src/HandBrain.tsx:60](/D:/chess/src/HandBrain.tsx:60), [src/HandBrain.tsx:124](/D:/chess/src/HandBrain.tsx:124) | 현재 FEN·차례를 0.4초마다 읽고 말 종류를 설정한다. 판 식별자와 **자기 편 수 번호**로 역할을 교대하고, 새 판·이어 하기에서는 역할 상태를 명시적으로 초기화해야 한다. |
| [src/cards/handBrain.js:21](/D:/chess/src/cards/handBrain.js:21) | `movableKinds(fen)`을 재사용해 선택 불가능한 종류를 막는다. 체스 규칙은 유지한다. |
| [src/wizardChessEngine.js:5133](/D:/chess/src/wizardChessEngine.js:5133), [src/wizardChessEngine.js:3277](/D:/chess/src/wizardChessEngine.js:3277) | 현재 종류 제한은 **클릭 처리**에 있다. 릴레이의 역할 권한은 `executeChessMove` 진입점에서도 검사해야 다른 호출 경로가 우회하지 못한다. 합법성의 최종 판정은 기존 `referee.move`를 유지한다. |
| [src/wizardChessEngine.js:5930](/D:/chess/src/wizardChessEngine.js:5930) | 현재 `setHandBrain`·`getHandBrainState`가 연결 지점이다. 역할·모드·수 번호를 노출하되 UI가 엔진의 턴을 추측하지 않게 한다. |
| [src/wizardChessEngine.js:5155](/D:/chess/src/wizardChessEngine.js:5155), [src/wizardChessEngine.js:5290](/D:/chess/src/wizardChessEngine.js:5290) | 원격 단계에서는 옛 `/api/rooms`·SSE·`BroadcastChannel` 전송층을 폐기한다. 현재 `tryApplyNext`는 **적용 성공 확인 전에 `appliedMoveSeq`를 올리므로**, 순서·중복·누락 검증 후 성공할 때만 증가하도록 고쳐야 한다. 애니메이션 중 수신 수를 기다리는 큐 개념은 재사용 가능하다. |
| [src/wizardChessEngine.js:3028](/D:/chess/src/wizardChessEngine.js:3028), [src/rules/resume.js:16](/D:/chess/src/rules/resume.js:16) | 현재 이어 하기는 싱글 판의 수 목록만 보존하고 멀티 판은 보존하지 않는다. 같은 기기 릴레이는 같은 게임 ID와 수 번호로 역할을 복원해야 한다. 원격 단계에는 서버의 확정 수 목록으로 복구하는 별도 경로가 필요하다. |
| [src/cards/CardLayer.tsx:168](/D:/chess/src/cards/CardLayer.tsx:168), [src/cards/CardLayer.tsx:286](/D:/chess/src/cards/CardLayer.tsx:286) | 현재 싱글 이벤트의 잡기·종료에서 카드·도토리를 처리한다. 같은 기기 대 AI는 기존 싱글 경제를 따르되, 원격 모드에서 이 이벤트를 재사용할 때 **로컬 지급으로 새어 나가지 않도록** 명시적으로 구분해야 한다. |
| [docs/plans/2026-11-02-island-economy-plan.md:44](/D:/chess/docs/plans/2026-11-02-island-economy-plan.md:44) | 계획상 멀티플레이는 양측 결과 검증 전까지 카드가 없다. 원격 팀전도 이 조건을 따른다. |
| [docs/PLAN.md:349](/D:/chess/docs/PLAN.md:349) | §12.1의 Supabase 초대 대전 뒤에 팀원 역할·확정 수·재접속 규칙을 설계해야 한다. 절 제목의 ‘서버 없이’는 본문의 Supabase 계획과 맞지 않아 구현 시 정리할 필요가 있다. |

## 측정

| 기능·결정 | 봇 시뮬레이션 | 사람 시험 |
|---|---|---|
| 릴레이의 종류 선택 | 여러 FEN에서 `movableKinds`가 빈 선택지나 합법 수 없는 종류를 내지 않는지 확인 | 각자가 “내 결정이 실제 수에 영향을 줬다”고 느끼는지 묻고, 강자가 정확한 수를 지시한 횟수를 관찰 |
| 매 수 역할 교대 | 판마다 각 역할의 조작 수와 역할 누락·중복을 기록 | 기존 고정 역할 손과 뇌와 비교해 어느 쪽을 다시 하고 싶은지 묻기 |
| 대기·연출 | 판 길이, 상대 턴 및 잡기 연출에 묶인 시간을 재기 | 기다리는 동안 지루했던 순간을 표시하게 하고 연출 단축 선호를 묻기 |
| 원격 동기화(2단계) | 지연·중복·역순·재접속 메시지를 주입해 양쪽 FEN과 수 번호 일치 확인 | 두 기기에서 완주한 뒤 상대가 둔 수와 역할 전환이 이해됐는지 묻기 |

## 내가 확신 못 하는 것

커뮤니티 글은 소수의 자발적 경험담이다. **WILD CROWN의 어린이·가족이 릴레이를 실제로 더 좋아한다는 증거는 아직 없다.** 원격 대전에서 기존 잡기 연출 길이가 문제인지도 재측정하지 않았다. 특히 “말 종류만 고르기”가 협동으로 느껴지는지, 강자가 결국 대화를 독점하는지는 사람 시험이 결정해야 한다.

ego-browser 조사는 완료했다. 브라우저 도구에는 Ego Lite 업데이트가 가능하다는 알림이 표시됐지만 업데이트는 실행하지 않았다.
