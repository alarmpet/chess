# 방향 조사 E — 난이도 조절과 비슷한 실력끼리 두기 (2026-11-10)

사용자 질문(11-10): 「난이도를 조정할 수 있게 하거나 비슷한 등급(실력)의 사람들과 두어야 더 재밌지 않을까? 어떻게 연결할 수 있을까?」
수집은 **ego-browser**(ego lite 2.2.0, 작업 공간 56)로 했다. 스크립트 네 편과 받은 글은 `C:\Users\petbl\ego\match-difficulty-20261110-1500\`(round-01~04.mjs · pages/ 40여 개)에 있다. 쓰인 곳: [방향 계획서](../../plans/2026-11-10-direction-plan.md) §4.5.

## 방법과 한계

- 검색 16건(DuckDuckGo) → 후보 주소를 열어 본문을 저장 → 통합자가 저장한 글에서 문장을 직접 읽었다. 아래 인용은 저장한 글에 있는 그대로다(20단어 미만).
- 막힌 곳: DuckDuckGo 가 연속 검색 9건을 빈 결과로 돌려줬다(천천히 다시 해 6건 중 5건 성공). Bing 은 한국어 지역 결과만 줘서 쓸모없었다. 레딧은 로그인 벽이라 arctic-shift API 로 글·댓글을 받았다(7건 성공). Stack Exchange(403) · RoyaleAPI · lichess 프로필 화면(봇 확인)은 못 열어, lichess 는 공개 API 로 받았다. EOMM 논문은 초록만 읽었다.
- `aside` CLI 도 이 PC 에 있지만 ego-browser 로 충분해 쓰지 않았다.
- 조사한 사람은 통합자 하나다. 다른 모델의 교차 검증은 없다. 레딧 글은 점수가 낮다(1~10점) — 「이런 목소리가 있다」 정도로만 쓴다.

## 지금 우리 게임 (저장소에서 확인)

- AI 세기는 세 단계다: 쉬움(탐색 1수·실수 0.3) · 보통(2수·0.1) · 어려움(3수·0)(`src/rules/ai.js:29-32`). 실수는 「둘째·셋째로 좋은 수를 고름」이다.
- 「라이벌 = 난이도」: 라이벌을 고르면 단계가 정해진다. 첫 3판은 쉬움, 3연패면 쉬운 라이벌을 **권하고**, 쉬움에서 이기면 위 라이벌을 권한다. 판 중에는 안 바뀐다(`src/cards/rivalLadder.js`).
- 봇 측정(11-07): 약한 플레이어의 승률이 쉬움 33% · 보통 20% · 어려움 3%. **단계 사이가 넓고, 가장 쉬운 단계에서도 약한 쪽이 3판에 1판만 이긴다.**
- 사람 대전은 친구 초대뿐이다. 숨은 실력 점수(Glicko-2)와 왕관 사다리가 있고, 판 전에 「이기면 +a · 지면 −b」를 보여 준다. 자동 매칭은 「인구가 없고 큐 서버 비용이 든다」는 이유로 넣지 않기로 했다(기획서 §12.1).
- **AI 판에는 실력 점수가 없다.** 사람 대전의 점수와 AI 난이도가 이어져 있지 않다.

## 수집한 것

### 1. 사람끼리 — 비슷한 실력으로 묶는 법

| # | 사실 | 출처 |
| :-- | :-- | :-- |
| M1 | Chess.com 은 ±25점에서 찾기 시작해 못 찾으면 넓힌다. 「begins by looking for opponents within a narrow rating range (±25 points)」 | support.chess.com/en/articles/8639319 (2025-04-05) [official] |
| M2 | 기본 한계는 ±200점이다(불릿·블리츠 2500 미만, 래피드 2000 미만). 이유: 「unbalanced games where one player has little to gain and the other has little to lose」 | 같은 글 |
| M3 | 1200 미만은 10분 판이 43% 로 가장 많고, 찾는 데 0.5~2초다. 높은 등급일수록 빠른 판을 고르고 오래 기다린다(2400 이상 9~55초) | 같은 글 |
| M4 | 범위는 스스로 정할 수 있다. 「We do not advise setting either + or - to below 50.」 | support.chess.com/en/articles/8598433 (2026-04-17) [official] |
| M5 | 중단·시간 끌기·샌드배깅으로 표시된 계정은 「separate matchmaking pools」로 보낼 수 있다 | M1 글 |
| M6 | lichess(코드, AGPL — 읽기만): 짝을 지을 수 있는 최대 점수 차가 레이팅에 따라 다르다 — 1000 미만 130, 1500 미만 100, 그 위는 레이팅 ÷ 15. 부정·부스팅 표시 계정은 자기들끼리 묶는다 | `lila/modules/pool/src/main/MatchMaking.scala` [official 코드] |
| M7 | Clash Royale(2021): 기본은 킹 레벨 ±1, 5초마다 ±1 씩 넓혀 10초에 ±3 까지. 이유는 「several levels higher than you」에 대한 오랜 불만 | supercell.com 블로그 (2021-02-25) [official] |
| M8 | ChessKid(아이 전용): 지금 도움말은 「Kids can only play games against other kids who are on their friends list.」 어른은 보호자로 연결된 자기 아이와만 둔다 | support.chesskid.com/en/articles/9067136 (2026-02-06) · 8871844 (2025-07-15) [official] |
| M9 | 같은 ChessKid 의 2022년 글은 「our system finds another kid with a close rating」(비슷한 레이팅의 다른 아이 자동 매칭)이라고 썼다. **두 글이 다르다** — 정책이 좁아졌는지, 둘 다 있는지는 확인 못 했다 | chesskid.com/learn/articles/how-to-play-fast-… (2022-06-22) [official] |
| M10 | Google Play 가족 정책: 「소셜 기능」(자유 형식 콘텐츠 공유·많은 사람과 소통)이 있으면 안전 알림, 어른이 켜고 끄는 방법, 개인 정보 교환 전 어른 확인이 필요하다. 모르는 사람과의 채팅이 중심인 앱은 아이를 대상으로 못 한다 | support.google.com/googleplay/android-developer/answer/9893335 [official] |
| M11 | 비동기 대전은 사람이 적은 게임에서 기다림을 없앤다 — 「especially for lower DAU games」 | skillz.com 블로그 [official, 자사 플랫폼 홍보 글이라 이해관계 있음] |
| M12 | 「공정한 매칭이 늘 가장 재밌는 것은 아니다」: EOMM 논문(EA, WWW 2017)은 비슷한 실력 매칭이 참여에 최적이 아닐 수 있다고 주장한다 | arxiv.org/abs/1702.06820 [paper, 초록만] |

읽기
- 큰 사이트는 「좁게 시작해 넓힌다」와 「한계(±200)」 두 가지로 한다. 사람이 적으면 넓혀도 못 찾는다. 우리는 출시 초기에 사람이 없다.
- 아이 전용 서비스(ChessKid)의 현재 도움말은 **친구 목록 안에서만** 두게 한다. 우리의 「친구 초대만」과 같은 쪽이다.
- 자유 채팅이 없으면 가족 정책의 「소셜 기능」 정의에는 덜 걸리지만, 이것은 해석이지 법률 확인이 아니다.
- M12(참여 최적화 매칭)는 이기고 지는 순서를 회사가 조종하는 것이다. 우리 원칙(숨은 고무줄 금지)과 맞지 않아 **쓰지 않는다.**

### 2. AI — 난이도를 맞추는 법

| # | 사실 | 출처 |
| :-- | :-- | :-- |
| A1 | Chess.com 「Play Coach」(2025-06): 「can play at your level」「Coach can adapt to provide just the right challenge」, 「stress-free environment」 | chess.com/news/view/announcing-play-coach (2025-06-10) [official] |
| A2 | 봇 레이팅은 사람 레이팅과 안 맞는다는 불만이 되풀이된다: 「I can regularly beat the 1100-1200 bots, but struggle to beat players around my elo of 380-420.」 | reddit r/chess wwn8yy (2022-08-24, 7점) [community] |
| A3 | 이유로 드는 것: 「they don't know what a human-like mistake looks like」 — 사람은 안 하는 엉뚱한 실수를 아무 때나 한다 | reddit r/chessbeginners 112e2t3 · 12uesk4 (1~5점) [community] |
| A4 | 반대 의견(Chess.com 블로그 글쓴이): 초급·중급 봇은 「the ratings are quite accurate」, 다만 「some of their moves were clearly non-human」 | chess.com/blog/AdviceCabinet/are-chess-com-bots-ratings-accurate [community] |
| A5 | Maia: 사람 대국으로 학습해 **특정 실력대의 사람이 둘 법한 수**를 맞히는 모델. 「predicts human moves at a much higher accuracy than existing engines」 | arxiv.org/abs/2006.01855 [paper, 초록] · maiachess.com |
| A6 | lichess 의 Maia 봇은 많이 쓰인다: maia1(1100) **374만 판**, maia9(1900) 142만 판 | lichess.org/api/user/maia1 · maia9 (2026-11-10) [official API] |
| A7 | 라이선스: `CSSLab/maia-chess` 는 **GPL-3.0**(읽기만), `CSSLab/maia2` 는 MIT(별 162, 설명에 「For new projects, see Maia-3」). 브라우저에서 도는 크기인지는 확인하지 않았다 | GitHub API (2026-11-10) |
| A8 | 조절을 들키면 속았다고 느낀다: 「they will feel "cheated" if games are adjusted during or across play sessions」, 조절은 핵심 경험을 해치지 않아야 한다 | Hunicke 2005, ACM ACE '05 초록, doi:10.1145/1178477.1178573 [paper] |
| A9 | lichess AI 단계별 레이팅(4~8 = 1600~2600)은 포럼 글뿐이다 | lichess 포럼 [community, 약함] |

읽기
- 「내 수준에 맞춰 주는 상대」는 큰 사이트가 2025년에 전면에 내세운 기능이다(A1). 그리고 그 맞춤은 **숨기지 않고 알린다**(「play at your level」).
- 숫자(레이팅)를 봇에 붙이면 사람 레이팅과 비교돼 불만이 된다(A2·A3). 우리는 이미 숫자 대신 라이벌 이름·단계를 쓴다 — 그대로 둔다.
- 약한 봇이 재미없는 이유는 「약해서」가 아니라 **실수가 사람 같지 않아서**다(A3·A5). 우리 봇의 실수(둘째·셋째 수 고르기)도 같은 꼴이다.
- A8 은 우리 원칙(숨은 고무줄 금지, 바꿀 때는 묻는다)을 뒷받침한다.

### 3. 실력이 다른 두 사람 — 핸디캡

| # | 사실 | 출처 |
| :-- | :-- | :-- |
| H1 | 「어떤 실력 차도 맞출 핸디캡이 있다」(Kaufman): 「there is always some handicap available that will equalise any given difference in strength」 | en.wikipedia.org/wiki/Handicap_(chess) [community, 각주 Kaufman 2024] |
| H2 | 전통 순서: 무승부 양보 → 폰(f) → 폰과 선수 → 나이트 → 룩 → … 폰을 뗄 때는 늘 f 폰이다(다른 폰은 길이 열려 보상이 생긴다) | 같은 글 |
| H3 | 말 떼기 봇은 지금 인기다: LeelaQueenOdds(퀸을 떼고 두는 봇) **110만 판**(봇 92만 승 · 12.7만 패 · 5.2만 무) | lichess.org/api/user/LeelaQueenOdds (2026-11-10) [official API] |
| H4 | 나이트를 뗀 Leela 가 2500 안팎 그랜드마스터들에게 +24 −5 =2 | H1 글(2023-11-09 이후) |
| H5 | 「퀸을 떼고 아빠와 두니 다시 재밌어졌다」 — 약한 쪽은 이길 기회가 생기고 센 쪽은 일부러 못 두지 않아도 된다 | lesswrong.com 글 [community, 개인 경험] |
| H6 | Chess.com 도움말에 「How do I play an odds game?」 글이 있다(제목만 봄) | M4 글의 관련 글 목록 |

읽기
- 부모와 아이, 형과 동생처럼 **아는 사이의 큰 실력 차**에는 「비슷한 사람 찾기」가 답이 아니다. 그 둘이 두고 싶은 것이다. 핸디캡이 맞는 도구다.
- 핸디캡은 센 쪽이 「봐주는 연기」를 안 해도 되게 한다(H5). 이것이 숨은 고무줄과 다른 점이다 — 판 전에 둘 다 보고 정한다.

### 4. 사람 대신 봇을 섞는 것

- Marvel Snap 에 봇이 많다는 이용자 글과 봇 이름 목록(커뮤니티 데이터베이스)은 있다. 개발사가 인정한 글은 **찾지 못했다**(marvelsnapzone.com/bots · reddit 164tp0c, 7점).
- 이용자 반응은 「infinite is nothing more than a participation trophy」(봇 때문에 랭크가 의미 없다) 쪽이다. 사람인 척하는 봇은 들키면 랭크의 값을 깎는다.

## 우리 측정 — 말 떼기가 실력 차를 얼마나 메우나 (`tools/handicap_sim.mjs`)

결과는 계획서 §4.5 와 `docs/perf/2026-11-10-handicap-sim.json` 에 있다. 봇끼리의 값이고 사람이 아니다.

## 한 줄씩

1. 비슷한 실력끼리 두는 것은 재미의 큰 조건이 맞다 — 큰 사이트는 ±25 에서 시작해 ±200 을 한계로 둔다.
2. 그러나 **사람이 적으면 자동 매칭은 돌지 않는다.** 그리고 아이 전용 서비스는 친구 안에서만 두게 한다.
3. 그래서 「비슷한 실력」을 주는 길은 셋이다: **AI 가 내 실력에 맞춘다**(알리고, 판 사이에만) · **친구와는 핸디캡으로 맞춘다** · 인구가 생기면 **말 없는 자동 매칭**(사용자 결정).
4. 약한 AI 는 「사람 같은 실수」를 해야 재밌다. 숫자 레이팅은 봇에 붙이지 않는다.
5. 참여를 위해 승패 순서를 조종하는 매칭, 사람인 척하는 봇은 쓰지 않는다.
