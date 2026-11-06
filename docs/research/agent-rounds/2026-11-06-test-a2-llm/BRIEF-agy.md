# 화면 평가 — WILD CROWN 동물 체스 (2026-11-06)

**이것은 실제 게임 화면이다.** 통합자가 실제 브라우저로 게임을 돌려 찍었다(데스크톱 게임 화면 전체를 폭 1280 으로 줄인 것. s02 는 판 일부를 확대한 것, s03·s04 는 도감 창의 일부, s10 은 모래시계 부분을 잘라 붙인 것). 사람 시험을 대신해 결함을 찾는 라운드다. 움직임·소리는 받지 못한다 — 정지 화면만 판정한다.

게임: 동물 말로 두는 3D 체스. 미어캣=폰, 캥거루=나이트, 판다=비숍, 코뿔소=룩, 호랑이=퀸, 사자=킹. 백 말은 노란 받침 위에, 흑 말은 분홍·남색 받침 위에 선다. 화면 아래쪽이 백, 위쪽이 흑(잡는 순간은 두 말이 한 칸 근처에 겹친다).

## 규칙

- **화면에 있는 글자만 인용한다.** 그림에 없는 문장을 인용하면 그 항목 전체를 버린다.
- 새 문구를 지어내지 마라. 「무엇을 빼고, 어디로 옮기고, 무엇을 먼저 보이게」만 제안한다.
- 역할(아래 「역할」)로 답한다. 모르겠으면 모르겠다고 쓴다.

## 1부 — 누가 잡았나 (sig-1 ~ sig-6)

여섯 장은 각각 **잡는 순간 + 0.06~0.12초**에 찍었다. 큰 글자(예: 「어흥!」)와 효과(별·흙먼지·잎·금 간 바닥·빛줄기·고리)가 보인다. 순서는 섞었다.

장마다:
- 잡은 동물(백/흑과 동물 이름), 잡힌 동물.
- 무엇을 보고 알았나: 글자 / 효과 / 말의 모양·자세 / 모름.
- 확신 1~5.

## 2부 — 오늘 들어간 기능 화면 (s01 ~ s10)

| 파일 | 무엇 |
| :-- | :-- |
| s01-rally-strip | 판 화면. 왼쪽 위 띠(🎯 미션 · 🔥 반격 목표 · 📋 퀘스트 · 수), 가운데 위 알림 |
| s02-bounty-marks | 판 화면. 두 번 잡은 말의 머리 위에 💰 표식 |
| s03-quests-album | 카드 도감 위쪽 「📋 오늘의 퀘스트」 칸 |
| s04-stamps-album | 카드 도감의 「🏅 기술 도장」 칸 |
| s05-handbrain-panel | 「🤝 손과 뇌」 고르기 창 |
| s06-handbrain-family | 가족이 뇌일 때 판 아래 띠(말 버튼 6개, 캥거루를 부른 뒤) |
| s07-handbrain-adviser | AI 조언자가 뇌일 때 판 아래 띠 |
| s08-blitz-setting | 설정 창의 「⚡ 번개 판」 줄(이 화면에서는 아직 꺼짐) |
| s09-blitz-green | 번개 판, 내 차례 오른쪽 위 모래시계 |
| s10-blitz-zoom | 모래시계 확대: 왼쪽 10초 안(초록), 오른쪽 10초 지난 뒤 |

화면마다:
- 이게 무슨 뜻인지 한 줄(역할의 말로). 모르겠으면 「모름」.
- 판을 두는 데 방해되나(0 전혀 ~ 3 많이).
- 켜고 싶나 / 끄고 싶나 / 상관없음 (켜고 끄는 기능만: 퀘스트·손과 뇌·번개 판).
- 빼거나 옮기거나 먼저 보이게 할 것 하나(없으면 없음).

## 3부 — 종합

- 판 화면 위쪽 띠와 알림이 한 번에 몇 개까지 괜찮나?
- 이 기능들 중 「한 판 더」 하게 만드는 것 하나, 그만두게 만드는 것 하나.
- 바꿀 것 셋(빼기·옮기기·먼저 보이기만).

답 끝에 1부 표를 JSON 한 줄로: `{"sig":[{"n":1,"by":"…","took":"…","cue":"…","sure":1}, …]}`

## 역할
너는 체스를 막 배운 **여덟 살 어린이**다. 말이 어떻게 움직이는지는 알지만 글자를 오래 읽기 싫다. 귀여운 동물과 도토리를 좋아한다. 어린이 말투로 짧게 답한다.

## 이미지 파일 (모두 열어 보고 답하라. 도구는 파일 읽기만 쓴다)
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s01-rally-strip.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s02-bounty-marks.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s03-quests-album.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s04-stamps-album.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s05-handbrain-panel.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s06-handbrain-family.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s07-handbrain-adviser.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s08-blitz-setting.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s09-blitz-green.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/s10-blitz-zoom.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/sig-1.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/sig-2.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/sig-3.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/sig-4.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/sig-5.jpg
- D:/chess/docs/research/agent-rounds/2026-11-06-test-a2-llm/img/sig-6.jpg
