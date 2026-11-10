# A. 손맛과 템포 — 인기 게임에서 옮길 수 있는 것 (조사)

작성일 2026-11-10. 사용자 요청: 「기존 체스는 좀 루즈하다. 인기 게임들의 손맛·플레이 방식·재미를 더 창의적이고 독창적으로 가져가고 싶다」.
이 문서는 **조사 기록**이다. 코드는 건드리지 않았고 결정도 하지 않았다. 세 모델 교차 검증은 하지 않았다.

## 0. 한 줄 답

조사한 개발자들이 되풀이한 말은 셋이다. ① 손맛은 규칙이 아니라 **입력 하나에 돌아오는 출력의 양**이다(「maximum output for minimum input」). ② 빠른 게임은 결정을 줄인 게 아니라 **기다림을 뺀** 게임이다(Marvel Snap 평균 약 3분, 동시 차례). ③ 체스에서 규칙을 안 바꾸고 템포를 올린 검증된 방법은 **선입력 · 짧은 시계 · 퍼즐 연타(3~5분) · 자발적 판돈(버서크)** 넷뿐이고, 나머지는 전부 「다른 게임」이 됐다. 우리 게임에 지금 없는 것 중 가장 싸고 근거가 센 것은 **연속 사건마다 반음씩 오르는 소리 계단을 판 전체로 넓히기, 판 끝 정산을 하나씩 세는 연출, AI 차례에 입력을 막지 않기(선입력 1수), 마지막 한 수 줌·슬로**다(§6 가).

## 1. 조사 방법과 한계

| 경로 | 한 것 |
| :--- | :--- |
| WebSearch 약 30건 → 나온 주소를 WebFetch 로 하나씩 엶 | 연 페이지 약 40개. 아래 인용은 전부 연 페이지에서 온 것 |
| Steam `storesearch`·`appdetails` API + 스토어 페이지 HTML(평가 집계·설명) | 체스 변형 10종, 2026-11-10 값. `appreviews` API 는 302 라 못 씀 |
| App Store 검색 API (`itunes.apple.com/search`) | 모바일 체스·비교 게임 평점·평가 수, 2026-11-10 값 |
| PDF 2개(`pdftotext`) | CHI 2013 논문, 바이로이트 대학 Game Feel 강의 자료 |
| arctic-shift 레딧 API 4건 | **응답의 `data` 가 비어 실패 — 레딧 글은 이번에 없다** |
| 저장소 | 계획서 3개 + `src` 에서 낱말 검색 1회(선입력·음 높이·진동 유무) |

**한계.**
- WebFetch 는 작은 모델이 페이지를 읽고 문장을 뽑아 준다. 인용은 그 결과라 구두점·생략이 원문과 다를 수 있다. 계획서에 옮기기 전에 핵심 인용은 브라우저로 한 번 더 본다.
- 강연 영상(「Juice it or lose it」 「The Art of Screenshake」 Brode GDC)은 **영상 자체를 보지 못했다.** 기사·세션 소개·강의 자료에서 본 것만 적었다.
- 수치는 전부 그 페이지가 말한 값이고 우리 게임에서 **재 보지 않았다.**

출처 등급: [official] 개발사·플랫폼 공식 · [press] 매체 · [community] 위키·블로그·포럼 · [paper] 논문 · [talk] 강연·강의 자료.

## 2. 이미 있는 것 (한 줄씩, 다시 조사하지 않음)

- 잡기 타격 3단계(멈춤·입자·링·흔들림·슬로·만화 글자), 역할별 시그니처 효과·소리 6종 — 역동 계획 §4.1, 고급화 계획 §4.
- 폰끼리 잡기 콤보의 **반음 상승**(`src/fx/captureSpecial.js` `pawnComboPitch`, 최대 7반음) — 음 계단은 폰 콤보에만 있다.
- 번개 판(수당 모래시계·빠른 수 도토리), 빠른 대국 설정 `quick` — 역동 계획 §4.2.
- 현상금 말 · 기술 도장 · 오늘의 퀘스트(48시간 유예) · 손과 뇌 · 반격 목표 — 목표 층 계획 OL-1~6.
- 파티 규칙 3종(960·언덕의 왕·세 번 체크), 3초 하이라이트, 2주 이벤트, 숨은 목표, 같은 퍼즐 경주(N3)·연승 불꽃(N4) — 계획됨·보류.
- 상대 생각 중 표현, 퐁당, 착지 반응, 방울 그림자 — 고급화 계획 §4-4·§5.
- 없는 것(낱말 검색으로 확인): **선입력**, `navigator.vibrate`(햅틱), 폰 콤보 밖의 음 높이 계단. `wizardChessEngine.js:4210` 은 `isAnimatingMove` 동안 입력을 돌려보낸다(연출 중 입력 잠금 — 한 줄만 읽었다. 범위는 재 보지 않았다).

## 3. 손맛의 구체 기법과 출처

### 3.1 기법 표

| # | 기법 | 무엇을 | 개발자·분석가가 말한 이유 (인용) | 등급 |
| :--- | :--- | :--- | :--- | :--- |
| J1 | 입력 대비 출력 키우기 | 한 번의 입력에 움직임·소리·입자가 여럿 돌아온다 | Jonasson: 「it's about maximum output for minimum input.」 https://www.gamedeveloper.com/design/video-is-your-game-juicy-enough- (2013-08-23) | [press] |
| J2 | 트윈·늘이기·찌그러뜨리기 | 물체가 부딪히면 늘고 줄고 흔들린다 | 같은 기사: 「tween, stretch, or squeeze in-game objects to give their titles a sense of life.」 Purho: 「If a game's juicy, it's way more fun to interact with it」 (같은 주소) | [press] |
| J3 | 「Juice it」 목록 | 색, 트윈/이징, 무작위 지연, 패들 늘이기, 흔들거림, 충돌 때 색·크기 변화, 소리(벽·블록·패들), 음악, 입자, 부서짐, 공 꼬리, 화면 흔들림, 의인화(큰 눈·깜박임·웃음) | 세션 소개: 「neat little tricks you can apply to any game to make it more satisfying」 https://www.gdcvault.com/play/1016487/Juice-It-or-Lose (GDC Europe 2012). 목록은 바이로이트 대학 강의 자료 `GxD-10-Game-Feel.pdf` (https://medienwissenschaft.uni-bayreuth.de/wp-content/uploads/GxD-10-Game-Feel.pdf, 연 날 2026-11-10) | [talk] 세션 소개 · [community] 목록 |
| J4 | Vlambeer 30가지 | 강의 자료의 목록: 적 HP 낮추기, 더 큰 총알, 총구 섬광, 타격 효과, 맞는 동작, 적 넉백, **영속성(시체·탄피·연기)**, 카메라 러프, 화면 흔들림, 플레이어 넉백, **Sleep(맞는 순간 게임 정지)**, 낮은 음 더하기, **카메라 킥(쏘는 반대 방향)**, 더 큰 폭발, 슬로모션, 의미(게임 오버 화면) | 기사: 「demonstrates 30 minor tweaks that each make the game a bit better.」 「making the screen shake slightly in the opposite direction」 https://www.gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games (2014-01-02). Nijman 인용(강의 자료): 「Just fill your game with love and tiny details.」 | [press] · [community] 목록 |
| J5 | 게임 필의 정의 | 손맛 = 입력 + 반응 + 맥락 + 다듬기 | Swink: 「The tactile sensation of manipulating a digital agent.」 「a combination of sights, sounds, and instant response to action.」 https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient (2007-11-23) | [official] 저자 글 |
| J6 | 다듬기 효과 | 입자, 화면 흔들림, 시점 변화 | Swink: 「Any effect that enhances the impression that the game world has its own self consistent physics is fair game.」 (같은 주소) | [official] |
| J7 | 반응 시간 한계 | 0.1초 즉답 / 1초 생각 흐름 / 10초 주의 | Nielsen: 「0.1 second is about the limit for having the user feel that the system is reacting instantaneously」 「1.0 second is about the limit for the user's flow of thought to stay uninterrupted」 https://www.nngroup.com/articles/response-times-3-important-limits/ (1993, 2014 보완) | [paper] 에 준함 |
| J8 | 점수 세기 연출 | 카드·조커가 하나씩 나와 점수를 더하고, 소리가 올라가고, 배수가 불탄다 | GMTK: 「The numbers tick up, with escalating sound effects.」 LocalThunk: 「the game is more fun when you set up your Rube Goldberg machine and watch it go」 https://gmtk.substack.com/p/balatros-cursed-design-problem (2024-04-02) | [press] (개발자 인용 포함) |
| J9 | 결과를 미리 안 보여 주기 | 점수 미리보기 없음 → 세는 동안 긴장 | 같은 글. LocalThunk 는 미리보기를 넣으면 「they're not going to experience the game that I wanted to create」 (Eggplant 팟캐스트 재인용) | [press] |
| J10 | 음 높이 계단 | 한 수로 여러 줄을 지우면 줄마다 같은 소리가 반음씩 오른다 | Belcher: 「Each subsequent row has the same sound, but a semi-tone higher.」 효과는 「the feeling of elevation, building jubilance」 https://www.gamedeveloper.com/audio/why-candy-crush-saga-is-so-engaging-an-audio-breakdown (2013-07-12) | [press] 분석 |
| J11 | 칭찬 목소리·글자 | 「Divine」「Delicious」「Sugar Crush」 | Belcher: 「Think of each sound as a good pat on the back」 「The player needs constant feedback」 (같은 주소) | [press] 분석 |
| J12 | 마지막 순간 확대 | 마지막 주황 못에 가까워지면 공을 확대, 「Extreme Fever」+「환희의 송가」 | 위키: 임시로 넣은 것에 「the players reacted well to the simpler placeholder elements.」 이후 「adding a zoom on the current ball as it neared the last orange peg」. Sidhu 는 파친코의 「wild sounds and visuals」를 원했다. https://en.wikipedia.org/wiki/Peggle (연 날 2026-11-10) | [community] |
| J13 | 「작은 승리」 | 져도 기쁜 순간이 판 안에 있다 | Brode: 「Essentially little victories add a little joy, even if you lose.」 https://mobilegamer.biz/second-dinners-ben-brode-reveals-marvel-snaps-recipe-for-success-literally/ (2023-03-23) | [press] (GDC 발표 보도) |
| J14 | 기다림 빼기 | 두 사람이 동시에 둔다 | Brode: 「Instead of spending half your time doing nothing, making no decisions, waiting for the opponent」 「But average is about three minutes.」 https://gamesbeat.com/ben-brode-bets-super-speed-will-make-marvel-snap-stand-out/ (2022-06-01) | [press] 인터뷰 |
| J15 | 판돈 올리기(스냅) | 자신 있으면 판돈 2배, 상대는 물러날 수 있다 | Brode: 「I'd like to double the stakes.」 「they can decide to retreat」 (같은 주소). 기사 설명: 백개먼의 「double it」 | [press] |
| J16 | 짧은 판 보장 | 「5분이면 한 판」이라는 확신 | Brode(클래시 로얄 예): 「If you have five minutes you are 100% sure you can get a game of Clash Royale in.」 (mobilegamer.biz, 위 주소) | [press] |
| J17 | 끝으로 갈수록 빨라짐(오버타임) | 연장 2분, 마지막 1분은 엘릭서 3배 | Supercell: 「Overtime now lasts for 2 minutes instead of 3, and includes x3 Elixir generation in the last minute.」 목적은 「a more engaging and exciting experience」 https://supercell.com/en/games/clashroyale/blog/release-notes/november-update (2019-11-26) | [official] |
| J18 | 햅틱 | 인과가 분명한 짧은 진동, 소리·그림과 세기 맞추기, 끌 수 있게 | Apple: 「Use haptics consistently throughout your app or game.」 「Avoid overusing haptics.」 「Make haptics optional.」 충격 햅틱 예: 「a tap when a view snaps into place」 https://developer.apple.com/design/human-interface-guidelines/playing-haptics (변경 기록 2024-05-07) | [official] |
| J19 | 웹 진동의 제약 | `navigator.vibrate` 는 사용자 조작 뒤에만, 일부 브라우저 미지원 | MDN: 「This feature is not Baseline because it does not work in some of the most widely-used browsers.」 「Sticky user activation is required.」 https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate (연 날 2026-11-10). 어느 브라우저가 안 되는지는 표가 안 열려 **확인 못 함** | [official] |

### 3.2 찾았지만 원문을 못 연 것 · 못 찾은 것

| 대상 | 상태 |
| :--- | :--- |
| Balatro 「카드마다 음이 한 음씩 오른다」 | 제3자 분석(blakecrosley.com)의 검색 요약에만 있음 — **원문 확인 못함**. 개발자 발언은 못 찾음. 확인한 것은 GMTK 의 「escalating sound effects」까지 |
| Peggle 「슬로모션」 | 위키 원문은 **확대(zoom)** 만 말한다. 슬로모션·아슬아슬하게 빗나가면 합창이 탄식한다는 이야기는 검색 요약(TV Tropes 계열)뿐 — 원문 확인 못함. PC Gamer 「The Making of Peggle」은 본문이 잘려 **열지 못함** |
| Marvel Snap 카드 놓는 감촉 | 관련 개발자 발언 못 찾음. inkl·TouchArcade 기사는 403 으로 **열지 못함**. GameSpot 「We cut out waiting」는 검색 요약뿐 — 원문 확인 못함 |
| Vampire Survivors | PC Gamer 기사(슬롯머신 경력)는 본문이 잘려 **열지 못함**. 80.lv 기사에는 설계 인용이 없었다. 상자 연출과 도박 연출의 관계는 **원문 확인 못함** |
| Hades 히트스톱·대시 | Supergiant 의 직접 발언을 못 찾았다. 건너뜀 |
| Fruit Ninja | GamesRadar 기사는 본문이 잘려 **열지 못함**. 「slice fruit, avoid bombs」 네 낱말 설명서, 3일 프로토타입은 검색 요약뿐 — 원문 확인 못함 |
| Slay the Spire 적 의도 표시 | 「의도를 보여 준 것이 게임을 완성했다」는 검색 요약뿐. 연 기사(Game Developer 2020-01-22)에는 그 내용이 없고 「went through years of playtesting」만 있다 — 원문 확인 못함 |
| Royal Match | 개발사 발언 못 찾음. 제3자 분석만 있어 인용하지 않는다 |
| Swink 책의 ms 문턱(100ms·240ms) | 블로그마다 숫자가 달랐고 책을 못 봤다 — **원문 확인 못함**. 문턱은 J7(Nielsen)로 대신한다 |
| Brawl Stars 판 길이·오버타임 | 조사하지 않았다 |

### 3.3 체스에 옮길 때의 읽기 (조사자의 해석 — 근거는 위 표)

- J8·J9·J10 은 한 묶음이다. **「결과를 하나씩 세고, 셀 때마다 소리가 오르고, 끝을 미리 말하지 않는다.」** 우리 게임에서 이 구조가 맞는 곳은 판 끝 정산(도토리·현상금·퀘스트·도장)과, 판 안의 연속 사건(연속 잡기·연속 체크)이다. 폰 콤보에만 있는 음 계단을 넓히는 일이다.
- J4 의 「Sleep」「카메라 킥」「영속성」 가운데 앞 둘은 이미 있다(멈춤·흔들림). **영속성**(잡기가 일어난 칸에 자국이 판 끝까지 남는다)은 없다 — 역동 계획 §4.1 의 금 간 바닥 데칼은 0.5초로 사라진다.
- J12 는 「마지막 못」처럼 **끝이 정해진 순간에만** 크게 쓴다. 체스에서는 메이트를 두는 수 하나다. 고급화 계획 §7-5 에 끝 장면은 있으나 「두는 순간의 확대」는 적혀 있지 않다.
- J14 는 체스에 그대로 못 옮긴다(동시 차례는 규칙 변경). 옮길 수 있는 것은 그 원리, **「내가 아무 결정도 안 하는 시간」을 줄이는 것**이다 → §5.
- J13 은 목표 층(현상금·반격 목표)이 이미 맡고 있다. 새로 볼 곳은 「조용한 좋은 수」(잡기가 아닌 포크·전개)에 대한 칭찬인데, 판정에 엔진 평가가 필요해 오판정 위험이 있다.

## 4. 체스를 빠르고 짜릿하게 바꾼 게임들

표의 「규칙」 열: ★ = 체스 규칙을 안 바꾸고 템포·형식만 바꿈 / △ = 규칙은 거의 같고 판·배치만 바꿈 / ✕ = 다른 게임.
Steam 수치는 2026-11-10 스토어 페이지(영어 리뷰 집계 문구), App Store 수치는 같은 날 검색 API(미국).

### 4.1 ★ 규칙은 그대로, 템포만

| 사례 | 한 판 길이 | 무엇을 바꿨나 | 반응·근거 | 등급 |
| :--- | :--- | :--- | :--- | :--- |
| 불릿·하이퍼불릿 (Chess.com) | 한 사람 3분 미만 / 1분 미만 | 시계만 | 「there are around 2,500,000 bullet games played per day on Chess.com (as of January 2023)」 — 블리츠 다음으로 인기. 「Pre-moves, unusual and offbeat openings, blunders, and other craziness define this」 https://www.chess.com/terms/bullet-chess (연 날 2026-11-10) | [official] |
| lichess 시간별 판 수 | 1+0 · 3+0 · 5+0 | 시계만 | 2019-04 표본 280만 판: 「1 minute per side with no increment (1+0; 25% of all games)」 「Bullet and Blitz represent about 79% of all games」 https://chessvillage.blogspot.com/2019/05/most-popular-time-controls-on-lichess.html (2019-05-26) | [community] 개인 분석, 오래됨 |
| 선입력 (Chess.com) | — | 상대 차례에 내 수를 미리 넣음 | 「Pre-moves are played almost instantly and use 0.1 seconds of your remaining time.」 최대 5수 대기, 누르면 취소. https://support.chess.com/en/articles/8562432-what-are-pre-moves-and-how-do-they-work (2026-10-04) | [official] |
| Puzzle Rush (Chess.com) | 5분 · 3분 · 생존 | 판 대신 퍼즐 연타 | 「Solve as many puzzles as you can in five minutes.」 「Three strikes and you're out.」 나카무라가 비공개 방송에서 몇 시간 도전, Abrahamyan 「Completely obsessed with」 https://www.chess.com/news/view/puzzle-rush-chess-coms-new-addictive-feature (2018-11-21 갱신) | [official] |
| Puzzle Storm (lichess) | 3분 + 보너스 | 퍼즐 연타 + **콤보 시간 보너스** | 「Solve as many puzzles as possible in 3 minutes.」 「5 moves: +3s」 … 「30 moves: +10s」, 틀리면 「the combo bar is depleted, and you lose 10 seconds.」 https://lichess.org/page/storm (연 날 2026-11-10). 출시 블로그는 403 으로 **열지 못함** | [official] |
| 아레나 버서크·연승 (lichess) | 대회 형식 | 내 시계를 스스로 반으로 → 이기면 +1점 | 「they lose half of their clock time, but the win is worth one extra tournament point.」 「If you win two games consecutively you will start a double-point streak, represented by a flame icon.」 https://lichess.org/tournament/help (연 날 2026-11-10) | [official] |
| Battle Chess (1988) | 보통 체스 + 연출 | 잡을 때 싸우는 애니메이션만 | 「Battle Chess sold 250,000 copies by February 1993.」 「The game can be also played in a 2D version with no animations.」 독일 ASM 은 약한 AI 를 비판. https://en.wikipedia.org/wiki/Battle_Chess (연 날 2026-11-10). 2017 Steam 판: 111개 중 81% 긍정 | [community] · [official] 스토어 |
| Chess Clash 「Quick Chess」, Chess Universe | — | 이미 있음(역동 계획 §2.2). 오늘 값: Chess Clash 4.68★ 3,255 / Chess Universe 4.75★ 6,486 | App Store API | [official] |

읽기: 규칙을 안 건드린 사례는 전부 **시계·형식·보상**만 바꿨다. 그리고 연출이 붙은 유일한 고전(Battle Chess)은 처음부터 「연출 끄기」를 함께 팔았다.

### 4.2 △ 규칙은 거의 같고 판·배치만

| 사례 | 한 판 길이 | 무엇을 바꿨나 | 반응·근거 | 등급 |
| :--- | :--- | :--- | :--- | :--- |
| Gardner 미니체스 5×5 (1969) | 원문에 시간 없음 | 5×5, 체스 수 전부 유지 | 「The motivation for these variants is to make the game simpler and shorter than standard chess.」 2013년 약하게 풀림 — 「proved the game-theoretic value to be a draw.」 완료된 판은 백 40% · 흑 28% · 무 32%. https://en.wikipedia.org/wiki/Minichess (앞 절반만 읽음, 2026-11-10) | [community] |
| Los Alamos 체스 6×6 | 원문에 시간 없음 | 6×6 | 「The first chess-like game implemented on a computer was the 6×6 chess variant Los Alamos chess.」 (같은 주소). 비숍을 뺐다는 것·1956년은 그 페이지 읽은 범위에 없어 **원문 확인 못함** | [community] |
| Really Bad Chess (2016) | 보통 체스 | 기물 구성이 무작위, 무승부 없음 | TouchArcade 5/5, 「mundane task of learning chess into an extremely enjoyable experience.」 Kill Screen: 「great for beginners to learn about the joy of landing a checkmate without having to study openings.」 https://en.wikipedia.org/wiki/Really_Bad_Chess · App Store 3.76★ 1,637 | [community] · [official] |
| Chess960 · 언덕의 왕 · 세 번 체크 | — | 이미 있음(파티 규칙, 역동 계획 §4.3) | — | — |
| Racing Kings · Antichess · Horde (lichess) | — | 이미 「넣지 않는다」로 결정(역동 계획 §4.3). 공식 한 줄: 「Get your king to the other side of the board to win.」 「Lose all your pieces (or get stalemated) to win the game.」 「One side has a large number of pawns, the other has a normal army.」 https://lichess.org/variant | [official] |
| Duck Chess | 보통 체스 | 수마다 오리를 빈 칸으로 옮김, 체크 없음·킹을 잡으면 승 | 「Players make a standard chess move, followed by moving the duck to an empty square」 2016년 Tim Paulden 고안, 「went viral in 2022」 https://www.chess.com/terms/duck-chess | [official] |

### 4.3 ✕ 체스를 재료로 쓴 다른 게임

| 사례 | 한 판(런) 길이 | 무엇을 바꿨나 | 반응 (2026-11-10) | 등급 |
| :--- | :--- | :--- | :--- | :--- |
| Shotgun King (2022) | 「Runs may take ~20 minutes to complete.」(Steam 설명) | 내 군대 전부를 산탄총 든 킹 하나로. 말마다 작은 타이머 | Steam 영어 리뷰 3,856개 93% 긍정, $7.49. iOS(2026-02) 4.8★ 772. 개발자 Devaux: 「a pretty massive success for tiny indies like us!」 「came together very naturally!」 Ludum Dare 주제 「Delay the inevitable」에서 출발. https://zatu.com/blogs/interviews/shotgun-king-interview-with-remy-devaux (2024-06-12). 판매량 수치는 없음 | [official] 스토어 · [press] |
| Pawnbarian (2021) | 「Blitz through quick 15-30 minute runs」 | 작은 던전 판, 카드를 내면 영웅이 그 체스 말처럼 움직임 | Steam 453개 91% 긍정, $9.99. iOS 4.22★ 353. 「Pick up the basics instantly if you're familiar with chess」 | [official] |
| The Ouroboros King (2023) | 「15-45 minute runs」 | 체스 + 로그라이크(군대 구성·유물) | Steam 480개 81% 긍정, $4.99. iOS 3.82★ 62 | [official] |
| Chessplosion (2021) | 설명에 길이 없음 | 체스 말 폭탄을 놓는 아케이드 액션 | Steam 140개 95% 긍정, $11.99 | [official] |
| Gambonanza (2026-05) | 「snackable and high-impact rounds」 | 작은 판 + 규칙을 깨는 강화. 「capturing every single piece」 가 목표 | Steam 1,694개 74% 긍정, $14.99 | [official] |
| Below the Crown (2026-04) | — | 던전 크롤러 + 체스 | Steam 66개 96% 긍정 | [official] |
| Chessformer (2022) | 퍼즐 한 판 | 체스 말로 하는 격자 퍼즐 플랫포머, 킹은 안 움직임 | Steam 306개 100% 긍정, $4.99 | [official] |
| FPS Chess (2022) | — | 잡기를 1대1 총싸움으로 | Steam 영어 31,382개 85% 긍정, 무료. 설명: 「Chess takes a back-seat to FPS」 | [official] |
| Knightmare Chess (1996) | 보통 체스 | 카드가 체스 규칙을 바꿈 | 「removes the tedium of standard chess while preserving plenty of scope for strategic play.」(The Game Report) 그러나 Arcane 7/10 「best played every now and then」, RPGnet 「ultimately doesn't hold your attention for too long.」 https://en.wikipedia.org/wiki/Knightmare_Chess | [community] |
| Dota Auto Chess (2019) | 「several dozen rounds」 (분 단위 없음) | 8명, 전투가 자동 | 「over 8.5 million subscribers by May 2019, with more than 300,000 active players daily.」 Game Informer: 「It's not chess, and it's not Dota」 https://en.wikipedia.org/wiki/Auto_Chess · Steam 판(2022) 1,029개 65% 긍정 | [community] · [official] |
| Passant · 5D Chess · Cat Chess | — | 이미 있음(역동 계획 §2.2) | — | — |
| Might & Magic: Chess Royale (Ubisoft) | — | 위키 404, PCGamesN 은 제목만(「neither chess nor royale」) — **열지 못함**. 100명·10분·서비스 종료일은 원문 확인 못함 | — | — |
| Brawl Chess | — | Steam 「Brawl Chess - Gambit」은 「Coming soon」, 설명 「family-friendly game with a lively cartoon style」. 평가 없음. 모바일 판은 검색 API 에 안 나와 수치 없음 | [official] |

읽기.
- 평가가 가장 좋은 ✕ 계열(Shotgun King 93% · Chessformer 100% · Chessplosion 95%)은 「체스 + 무엇」이 아니라 **한 문장으로 말할 수 있는 뒤틀림 하나**다. 강화가 쌓여 체스가 사라지는 쪽(Gambonanza 74%, Passant 79% — 역동 계획 §2.2)은 낮다.
- 런 길이를 스토어 설명 첫머리에 **숫자로** 적는 게임이 많다(20분 · 15~30분 · 15~45분). 「한 판이 얼마나 걸리는지」를 파는 것이다.
- 카드로 규칙을 바꾸는 Knightmare Chess 의 30년 전 평이 「가끔 하기 좋다」였다 — 능력 카드를 기본 판에 넣지 않는 기존 결정(기획서 §10-10)과 같은 쪽.

## 5. 기다림을 없애는 기법

| # | 기법 | 출처 | 우리에게 |
| :--- | :--- | :--- | :--- |
| W1 | **선입력 1수** — AI 가 두는 동안(연출 포함) 내 다음 수를 넣어 둔다. 불법이 되면 조용히 취소 | Chess.com: 0.1초 소모·최대 5수·누르면 취소(§4.1) | 시계가 없는 판에서는 「시간 절약」이 아니라 **입력이 막히지 않는 감각**이 목적. 아이에게는 1수만(여러 수는 실수 연쇄) |
| W2 | **AI 수 연출과 내 입력을 겹치기** — 연출은 흐르고 판은 이미 다음 상태 | 고급화 계획 §4-4 가 퐁당에 대해 이미 「다음 턴 위로 겹쳐 흐른다」고 적음. Nielsen 1초 한계(J7) | `isAnimatingMove` 잠금 범위를 줄이는 일. 얼마나 잠기는지는 **재 보지 않았다** — 먼저 「AI 수 시작 → 내가 말을 집을 수 있을 때까지」 ms 를 잰다 |
| W3 | **탭하면 건너뛰기 / 배속** | Battle Chess 는 처음부터 연출 없는 2D 판을 제공(§4.1). 우리 `quick` 설정은 이미 있음 | 새 것은 **설정이 아니라 그 자리의 탭**: 연출 중 화면을 누르면 그 연출만 끝으로 |
| W4 | **상대 차례에 할 일** | Brode: 「waiting for the opponent」를 없애려 동시 차례(J14). 디시 체스 갤러리 「상대 수 기다리면서 뭐함?」(목표 층 계획 §2) | 동시 차례는 규칙 변경이라 불가. 대신 AI 차례에 띠의 퀘스트·현상금 숫자가 움직이게(이미 있는 정보의 타이밍만 옮김) |
| W5 | **끝으로 갈수록 빨라짐** | Clash Royale 연장 2분·마지막 1분 3배(J17) | 번개 판에만: 말이 줄수록 빠른 수 보너스가 커진다. 기본 판에는 넣지 않는다(시간 압박 금지 결정) |
| W6 | **5분 형식 ① 퍼즐 연타** | Puzzle Rush 5분/3분·삼진, Puzzle Storm 3분+콤보(§4.1) | 보류 목록 N3(같은 퍼즐 경주)과 겹친다. 새 정보는 **콤보 시간 보너스 수치표**(5수 +3초 … 30수 +10초, 틀리면 −10초) |
| W7 | **5분 형식 ② 미니 판** | Gardner 5×5 — 「simpler and shorter」(§4.2). 5×5 는 수학적으로 무승부, 실전은 백 40% | 선택 모드. 판·카메라·AI·에셋이 다 바뀌어 비용이 크다(§6 나) |
| W8 | **5분 형식 ③ 중반부터 / n수 메이트 판** | 직접 사례를 이번에 열지 못했다. Really Bad Chess 가 「오프닝 공부 없이 메이트의 기쁨」으로 평가된 것이 가장 가까운 근거(§4.2) | 규칙은 그대로, 시작 국면만 다름 → ★에 가깝다. 근거는 약함(B급) |
| W9 | **판 길이를 숫자로 약속** | Brode: 「If you have five minutes you are 100% sure」(J16). Steam 설명의 「~20 minutes」「15-30 minute」(§4.3) | 새 판 화면에 「약 n분」 표시. 우리 판의 실제 길이 분포는 **재 보지 않았다**(판 기록 `pace` 로 잴 수 있다) |

**모바일 세션 길이 통계.** GameAnalytics 2025 보고서(2024년 자료, 게임 1만 1,600개)의 요약 기사: 「The median is 5-6 minutes.」 상위 25% 는 「8-9 minutes」, 「On average, a player has 4 sessions per day.」 https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks (2025-02-17) [press — 보고서 원문 PDF 는 열지 않았다]. 같은 글: 중장기 유지율이 좋은 장르는 「board games, card games, puzzles, and casino games.」 2024년 1분기 보고서의 「중앙값 4.45분」은 검색 요약뿐 — 원문 확인 못함.
읽기: 한 번 앉아 있는 시간의 중앙값이 5~6분이면, **한 판이 그 안에 끝나거나 그 안에서 「끝난 느낌」이 한 번은 와야** 한다. 이어 하기(`wildcrown.resume.v1`)가 이미 있으니 「판 중간의 매듭」(현상금 수령·퀘스트 달성)이 그 역할을 할 수 있다.

## 6. 한 손·한 번 터치 조작

| # | 사실 | 출처 | 등급 |
| :--- | :--- | :--- | :--- |
| T1 | Chess.com 은 **끌기와 탭-탭 둘 다**, 모바일에서는 항상 둘 다 켬 | 「Click or tap on the piece, then do it again on the square you want to move it to.」 「On mobile, you can use both move options at any time.」 https://support.chess.com/en/articles/8708726-how-do-i-make-moves-in-live-chess (2025-07-16) | [official] |
| T2 | 끌기에는 **끌지 않는 대안이 있어야** 한다(WCAG 2.2 AA) | 「All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging」 https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html — 이유: 「Some people cannot use a mouse to drag items.」 | [official] |
| T3 | 유아에게 가장 쉬운 것은 **탭** | Sesame Workshop: 「Tapping is one of the most intuitive interactions for preschoolers」 「pinching and flicking are often difficult for children with developing motor skills」 https://joanganzcooneycenter.org/?p=19607 (2012-12-17) | [official] 연구 기관 |
| T4 | 유아는 태블릿 **아래 가장자리에 손목을 올린다** → 그 자리의 버튼이 잘못 눌린다 | 같은 페이지: 「Preschoolers tend to rest their wrists along the bottom edge of tablets」. 「끌기는 도중에 손이 떨어지니 부분 완료를 허용하라」는 권고는 검색 요약뿐 — 원문 확인 못함 | [official] |
| T5 | 노년층: 터치스크린이 마우스보다 빠르고 오류가 적다. 그러나 **끌기가 가장 느리다** | Findlater 외, CHI 2013(노년 20명·청년 20명): 「the touchscreen resulted in a significant movement time reduction of 35% over the mouse for older adults」 「On the touchscreen, older adults were slowest with dragging」 오류율 노년 터치 0.75% 대 데스크톱 4.18%. 최소 과녁 「9.2 mm (48 px)」로 실험. https://faculty.washington.edu/wobbrock/pubs/chi-13.04.pdf | [paper] |
| T6 | 합법 수 점은 Chess.com 에서 켜고 끄는 설정 | T1 페이지가 「enable legal moves」와 점 켜기/끄기 글을 안내 | [official] |
| T7 | 햅틱은 「제자리에 딱 붙는」 순간에 | Apple: 충격 햅틱 예 「a tap when a view snaps into place」(J18) | [official] |

읽기.
- 아이·노년층 모두 근거가 가리키는 기본값은 **탭-탭**이고, 끌기는 「되기도 하는」 보조다(T1·T3·T5). 끌기만 되는 조작은 접근성 기준에도 걸린다(T2).
- 끌기를 지원한다면 도중에 손이 떨어져도 **말이 들린 채 남아 있고**(=탭-탭 상태로 자연스럽게 넘어감) 다음 탭으로 놓을 수 있어야 한다. 이것이 「끌기 실패 = 탭 선택 성공」이 되는 한 가지 설계다(조사자 제안, T4 의 미확인 권고와 같은 방향).
- 자석 스냅·실수 방지(되돌리기, 확인 탭)에 대한 **체스 앱의 공식 근거는 이번에 못 찾았다.** lichess 모바일 설정 문서는 검색에 안 나왔다.
- 우리 판에서 한 칸의 화면 크기(mm)는 **재 보지 않았다.** CHI 실험의 최소 과녁 9.2mm 와 비교하려면 375px 휴대폰에서 먼 쪽 줄의 칸 폭을 재야 한다(3D 원근 때문에 먼 줄이 더 작다).
- 고급화 계획 §13 이 「합법 수 표시가 연한 파란 점이고 작다」를 3단계로 넘겨 두었다 — 같은 숙제다.

## 7. 정리

### (가) 규칙을 안 바꾸고 옮길 수 있는 손맛 기법 — 순위

순위는 「근거 세기 × 우리 게임에 지금 없는 정도 ÷ 구현 난이도」로 조사자가 매겼다. 난이도는 코드를 깊이 읽지 않은 **추정**이다.

| 순위 | 기법 | 무엇을 | 효과 근거 | 난이도(추정) | 지금 상태 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **음 계단 넓히기** | 한 판 안의 연속 사건(같은 말의 연속 잡기, 연속 체크, 현상금 누적, 정산 항목)마다 같은 소리가 반음씩 오른다. 끊기면 처음으로 | J10 Candy Crush 「a semi-tone higher」, J8 Balatro 「escalating sound effects」 | 하 — `sfx.js` 의 `pitch` 인자와 `pawnComboPitch` 가 이미 있다 | 폰 콤보에만 있음 |
| 2 | **판 끝 「하나씩 세기」** | 결과 카드에서 도토리를 항목별로(승리·현상금·퀘스트·도장) 하나씩 튀기며 더하고, 합계는 끝에야 보인다. 큰 합계는 숫자가 불탄다 | J8·J9 LocalThunk 「watch it go」, 미리보기를 일부러 숨김 | 중 — 결과 카드 UI·소리. 건너뛰기 탭 필요 | 결과 카드는 있음, 세는 연출은 없음(재 보지 않았다) |
| 3 | **AI 차례에 입력을 막지 않기 + 선입력 1수** | AI 연출 중에도 말을 집을 수 있고, 미리 둔 한 수는 합법이면 바로 나간다 | J14 Brode 「waiting for the opponent」, Chess.com 선입력(공식), J7 1초 한계 | 중~상 — `isAnimatingMove` 잠금과 안무 순서를 건드린다 | 없음 |
| 4 | **마지막 한 수 확대** | 메이트가 되는 수를 두는 순간에만 카메라 확대 + 짧은 느림 + 음악 한 소절, 그 뒤 기존 끝 장면 | J12 Peggle — 임시로 넣었는데 「players reacted well」 | 중 — 기존 메이트 연출·카메라와 합쳐야 함 | 끝 장면은 있음, 「두는 순간」 강조는 계획에 없음 |
| 5 | **집기·놓기 즉답** | 말을 누르면 0.1초 안에 들썩임+소리, 놓으면 칸에 자석처럼 붙으며 찌그러졌다 펴짐 | J1 「maximum output for minimum input」, J2 늘이기·찌그러뜨리기, J7 0.1초, J18 「snaps into place」 | 하 — `LANDING_SQUASH` 가 있다. 누른 뒤 반응까지의 ms 는 **재 보지 않았다** | 일부 있음(들썩임·착지) |
| 6 | **탭-탭 기본 + 끌기 실패 구제** | 끌다 손이 떨어지면 말이 선택된 채 남는다. 합법 칸은 크고 진하게 | T1 Chess.com, T2 WCAG, T3 Sesame, T5 CHI 2013 | 하~중 | 합법 수 점이 작다(고급화 §13) |
| 7 | **그 자리 건너뛰기** | 연출 중 화면을 누르면 그 연출만 끝으로 간다(설정 `quick` 과 별개) | Battle Chess 가 연출 없는 판을 함께 제공, J7 | 하~중 | `quick` 설정만 있음 |
| 8 | **영속성** | 큰 잡기가 일어난 칸에 작은 자국(발자국·금·꽃잎)이 판 끝까지 남아, 판이 「지나온 이야기」를 보여 준다 | J4 Vlambeer 목록의 Permanence 3단계(시체·탄피·연기) | 중 — 드로우콜 게이트(≤100) 안에서 인스턴스 한 묶음 | 데칼은 0.5초로 사라짐 |
| 9 | **햅틱 3단계** | 놓기(약) · 잡기(중) · 메이트(강), 설정으로 끄기 | J18 Apple 「consistently」「optional」 | 하 — 다만 J19: 웹 진동은 일부 브라우저에서 안 된다. 되는 기기만 | 없음 |
| 10 | **AI 차례에 띠가 움직이기** | 퀘스트·현상금 숫자가 오르는 연출을 AI 가 생각하는 동안으로 옮긴다 | J14 의 원리, J13 「little victories」 | 하 | 띠는 있음, 타이밍은 재 보지 않았다 |
| 11 | **판 길이 약속** | 새 판 화면에 「약 n분」 | J16 Brode 「100% sure」, Steam 설명의 런 길이 표기 | 하 — 먼저 실제 판 길이 분포를 잰다 | 없음 |
| 12 | **조용한 좋은 수 칭찬** | 포크·핀·전개 같은 잡기 아닌 수에 작은 글자 | J11 「pat on the back」, J13 | 중~상 — 판정 오류 위험. 기술 도장 판정(OL-2)을 재사용하면 낮아짐 | 잡기 글자만 있음 |

측정 하나씩(저장소 규칙): 1·2 는 사람 시험 질문 「소리가 올라가는 걸 알아챘나」, 3·7·10 은 봇으로 「AI 수 시작 → 입력 가능」 ms 와 판당 총 대기 시간, 5 는 누름→첫 프레임 ms, 6 은 잘못 놓기 횟수, 11 은 판 기록 `pace`.

### (나) 선택 모드로만 넣을 것 (규칙·판·판돈이 바뀜)

| 후보 | 근거 | 왜 기본 판이 아닌가 |
| :--- | :--- | :--- |
| 미니 판 5×5·6×6 | Gardner 「simpler and shorter」 | 판·AI·카메라·카드 정산이 다 달라진다. 5×5 는 백 40%/흑 28% 로 쏠림 |
| 퍼즐 폭풍(3분 + 콤보 시간 보너스) | lichess 공식 수치표, Puzzle Rush 의 반응 | 보류 목록 N3 과 같은 것. 퍼즐 데이터가 필요 |
| n수 메이트 판 · 중반 시작 판 | Really Bad Chess 평(오프닝 없이 메이트의 기쁨) — 근거 약함 | 시작 국면 데이터·난이도 조절 필요 |
| 「용기 선언」(스냅·버서크) | Marvel Snap 판돈 2배·물러나기, lichess 버서크(시계 반 → +1점) | 판돈 걸기는 아이에게 도박 문법 — (다) 참조. 넣는다면 도토리만, 잃는 것 없이 「더 받기」만 |
| 끝으로 갈수록 빨라지는 번개 판 | Clash Royale 연장 3배 | 시간 압박은 선택 모드라는 기존 결정 |
| 무작위 기물 판 | Really Bad Chess(TouchArcade 5/5, 그러나 App Store 3.76★) | 기물 가치 감각이 흔들림. 이벤트 판 후보 |
| 오리 판 | Duck Chess — 2022년 방송으로 유행 | 체크가 없어져 초보가 배운 규칙과 충돌 |
| 「한 문장 뒤틀림」 야생 모드 | Shotgun King 93% · Chessformer 100% | 다른 게임이다. 기획서의 야생 모드(Phase 6)에 둘 자리 |
| 넣지 않는 쪽 | 능력 카드 누적(Knightmare 「가끔」, Gambonanza 74%), 자동 전투(Auto Chess 「It's not chess」), FPS 화 | 기존 결정(§10-10)과 같은 쪽의 새 근거 |

### (다) 아이·가족 게임에 옮길 때 주의

1. **도박 문법을 통째로 옮기지 않는다.** 점수 세기·판돈 2배·상자 연출은 슬롯머신에서 온 기법과 겹친다(Peggle 은 파친코의 「wild sounds and visuals」를 의도했다 — 위키). 세는 것은 **이미 번 것**만, 무작위 보상의 뜸 들이기에는 쓰지 않는다. 욕망 계획 §7(어두운 패턴 금지)과 같은 선.
2. **아슬아슬하게 놓쳤을 때 놀리지 않는다.** Peggle 의 「놓치면 탄식」(미확인)류 연출은 아이에게 벌이다. 놓친 메이트는 조용히 지나간다.
3. **음 계단은 한 옥타브 안에서 멈춘다.** 이미 `COMBO_MAX_STEPS = 7`. 높은 음이 오래 이어지면 시끄럽다. 소리 끄기·줄이기 설정을 따른다.
4. **흔들림·번쩍임·느림은 설정과 `prefers-reduced-motion` 을 따른다**(고급화 계획 §3 원칙 그대로). 새 연출(확대·불타는 숫자)도 같은 스위치에 묶는다.
5. **햅틱은 끌 수 있게, 인과가 분명한 곳에만**(Apple: 「Make haptics optional」「Avoid overusing haptics」). 공용 기기·교실에서는 진동이 방해다.
6. **선입력은 1수, 취소가 쉬워야 한다.** 여러 수 대기는 불릿용이다. 아이가 실수로 넣은 수가 나가면 되돌리기와 충돌한다 — 되돌리기 정책을 먼저 정한다.
7. **빠름을 실력으로 칭찬하지 않는다.** 불릿의 매력으로 Chess.com 이 든 것이 「blunders, and other craziness」다. 속도 보상은 도토리에만 닿게 한 번개 판 결정을 유지하고, 건너뛰기·겹치기(W2·W3)는 「내 생각 시간」을 줄이지 않는 쪽으로만 쓴다.
8. **탭 과녁과 손목.** 유아는 화면 아래 가장자리에 손목을 올린다(Sesame). 아래쪽 띠·버튼의 오작동을 본다. 먼 줄 칸의 크기를 mm 로 잰다(노년층 실험 최소 9.2mm).
9. **글을 못 읽는 아이.** 칭찬 글자(J11)는 소리·그림과 함께(Sesame: 「Provide dialogue and visual reinforcements」). 만화 글자만으로 뜻을 전하지 않는다.
10. **연출은 판을 늘리지 않는다.** 재미 계획의 잡기 0.3초 상한, 고급화 계획의 「대국이 느려지면 안 된다」가 그대로 적용된다. (가)의 2·4 는 건너뛸 수 있어야 하고, 판 중간이 아니라 **판 끝**에만 길게 쓴다.

## 8. 틀릴 수 있는 곳

1. 강연 원본을 보지 못했다. 「Juice it」「Screenshake」 목록은 대학 강의 자료가 정리한 것이라 순서·이름이 원 강연과 다를 수 있다.
2. Balatro 의 음 높이 설계는 개발자 발언으로 확인하지 못했다. 순위 1의 근거 중 확실한 것은 Candy Crush 분석 글(개발사가 아니라 외부 음향가의 분석)이다.
3. Steam·App Store 수치는 하루치 값이고, Steam 은 영어 리뷰 집계 문구를 읽은 것이다. 판매량은 어디에서도 확인하지 못했다.
4. lichess 시간별 비율은 2019년 개인 블로그의 9% 표본이다.
5. 순위표의 난이도는 코드를 깊이 읽지 않은 추정이다. 특히 3번(입력 잠금)은 6,300줄 단일 파일의 안무 순서에 달려 있다.
6. 레딧·X·국내 커뮤니티의 이용자 목소리는 이번 조사에 없다(arctic-shift 실패). 「체스가 루즈하다」는 느낌이 **어디에서** 오는지(AI 대기인지, 연출 길이인지, 판 길이인지)는 사람 시험이나 판 기록으로 먼저 갈라야 한다.
