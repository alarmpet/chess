# 목표 층 아이디어의 출처 조사 — 세 모델 웹 조사 + 통합자 대조 (2026-11-05)

사용자 물음: 「다른 인기 게임에서 가져온 인기 요소 아이디어가 맞아? 아니면 네가 지어낸 거야?」 → 「둘 다 진행해, LLM 협업해서 더 다양하고 풍부하고 방대한 자료 조사」.
통합자 자기 점검(조사 전): [목표 층 계획서](../../../plans/2026-11-05-objective-layer-plan.md) 7개 중 ①현상금·③반격은 사실상 통합자 창작, ②도장·④퀘스트는 근거가 약함(장난 서브레딧 댓글, chess.com 포럼의 **사용자 제안**, 작은 개인 사이트).

## 방법

| 모델 | 영역 | 실행(읽기 전용 + 웹) | 답 |
| :--- | :--- | :--- | :--- |
| agy | 어린이·가족·교육 게임과 앱 | `--mode plan --sandbox --add-dir` | 17개 + 반대 증거 4 |
| grok | 경쟁·대전 게임 | `--permission-mode plan --allow Read --allow WebSearch --allow WebFetch` | 20개 + 반대 증거 7, 「직접 연 것」과 「검색 추출」을 스스로 나눠 적음 |
| codex (`gpt-6-sol`) | 체스 플랫폼·체스 앱·보드게임 | `codex --search exec -s read-only` | 17개 + 반대 증거 4 |

통합자는 셋을 읽기 전에 `r1-claude.md` 를 쓰고, 별도로 ego-browser 로 공식·위키 15쪽을 읽었다(`docs/research/exciting-chess-20261105/round-06.json`). 그다음 **세 모델이 낸 주소를 전부 열어** 본문에 주장한 낱말이 있는지 대조했다 — codex 17건은 ego-browser, grok 18건·agy 19건은 ego-browser 가 응답을 멈춰(목록 조회도 시간 초과) Node `fetch` + 위키 API 로. 결과 원본: `verify-codex.json` · `vf-grok.json` · `vf-agy.json` · `vf-api.json`(같은 research 폴더).

## 대조 결과

| 모델 | 낸 주소 | 원문 확인 | 막혀서 못 봄 | 거짓·없음 |
| :--- | :--- | :--- | :--- | :--- |
| codex | 17 | **15** | 2(BoardGameGeek 보안 화면) | 0 |
| grok | 18 | 13 + Clash Royale 퀘스트 삭제(위키 API) | 4(LoL 위키·Rocket League 지원 403 — 같은 내용 일부는 공식 패치 노트로 확인) | 0 |
| agy | 19 | 9 | 5(fandom·Minecraft 위키 403) | **5** — Prodigy 「Bounty Board」 문서 없음(API 404)과 「교사 항의로 삭제」 이야기, Duolingo Friends Quest 블로그 404, Story Time Chess 「Toy of the Year」 없음, Mario Party 반발·설정 분리 이야기 본문에 없음, ChessKid 「Activity Stars」 없음 |

- **codex** 는 Chess.com 공식 도움말을 주소로 들어 거의 전부가 맞았다. 「인기 게임에 들어 있다는 사실이 그 요소의 인기를 증명하지는 않는다」는 단서를 스스로 붙였다.
- **grok** 은 혼자서 가장 값진 것을 찾았다: LoL 패치 26.1 의 「Feats of Strength」 삭제(판 위 목표 과부하), LoL 의 objective bounty(③ 에 가장 가까움), Pokémon UNITE 가 좌절 이탈을 줄이려 점수판을 숨긴 이유, VALORANT 가 특정 행동 일일 임무를 체크포인트로 바꾼 것. 「검색 추출」을 스스로 표시해 통합자가 대조 범위를 정하기 쉬웠다.
- **agy** 는 확인된 것(Smash Bros. Challenges, Mario Odyssey 2인, Kirby 미션, Nook Miles+)과 함께 **그럴듯한 이야기**(반발·삭제·수상·「3배」)를 섞었다 — 반대 증거 4건 중 3건이 원문으로 확인되지 않았다. 판정은 「모든 7개가 완전히 같은 것이 있다」로 가장 낙관적이었고, 대조 뒤 ③⑤ 는 B 로 내려갔다.

## 결론(계획서 §2.5 로 옮김)

①②④⑥⑦ → **A**(인기 게임의 실제 기능), ③⑤ → **B**. 새 아이디어 N1~N5. 순서 다시 매김: OL-1 현상금 → OL-2 도장 → OL-3 퀘스트+유예 → OL-4 손과 뇌+가족 퀘스트 → OL-5 이벤트 → OL-6 반격·숨은 목표.

## 통합자 오류

- 처음 계획서는 ①③ 을 출처가 있는 것처럼 표에 넣었다(도타 현상금은 r/gamedesign 댓글 속 언급뿐). 사용자 질문이 아니었으면 등급 없이 진행됐다.
- 예측(`r1-claude.md`)에서 「Brawl Stars Bounty 가 ① 에 가장 가깝다」는 맞았고, 「Chess.com 업적이 ② 를 강하게 뒷받침」은 반만 맞았다 — 업적이 기술이 아니라 접속·판 수 이정표 위주다.
