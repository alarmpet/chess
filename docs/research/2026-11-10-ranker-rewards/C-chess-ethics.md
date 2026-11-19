# C. 체스·학습 앱의 랭커 보상과 아이 관련 규제·연구 (2026-11-10)

조사일: 2026-11-10. 모든 인용은 이날 실제로 연 페이지에서 옮겼다(20단어 미만).
등급: [official] 운영사·규제기관·법령 원문 · [paper] 논문(초록 또는 본문) · [press] 언론 · [community] 이용자 글.
열지 못한 페이지는 「열지 못함」, 기억으로 적은 것은 「원문 확인 못함」.

---

## 1. 체스·학습 앱은 무엇을 누구에게 주나

### 1-1. lichess

| 보상 | 받는 사람 | 영구? | 보이는 곳 | 근거 |
| :--- | :--- | :--- | :--- | :--- |
| 순위 트로피 Champion / Top 10 / Top 50 / Top 100 | 종목별 순위 1위 · 2–10 · 11–50 · 51–100 | **아니다** — 지금 순위표(`rankMap`)로 매번 계산해 그린다. 순위에서 빠지면 사라진다 | 프로필 옆 트로피, 눌러서 그 종목 순위표로 | [official] lila 소스 `UserBits.trophyMeta` |
| 마라톤 트로피 Winner / Top 10 / 50 / 100 / 500 | 마라톤 대회 1위 · ≤10 · ≤50 · ≤100 · ≤500 | **그렇다** — 대회 끝에 `trophyApi.award` 로 DB 에 저장 | 프로필 트로피 | [official] lila `TournamentApi.scala` |
| 칭호 LM 등 | 운영진 재량 | 원문 FAQ | 이름 옆 | [official] FAQ |

- 소스 `modules/user/src/main/ui/UserBits.scala`(최신 커밋 2162e30, 2026-10-25): `case 1 => … "Champion!"`, `r <= 10 → "Top 10!"`, `r <= 50 → "Top 50 player!"`, `r <= 100 → "Top 100 player!"`. 같은 함수가 `u.lame.not.so:` 로 감싸져 있어 **부정행위 표시(lame)된 계정은 순위 트로피를 아예 그리지 않는다**. https://github.com/lichess-org/lila/blob/master/modules/user/src/main/ui/UserBits.scala (2026-11-10) [official]
  - lila 는 AGPL 이다. 구조만 읽었고 코드는 옮기지 않는다(저장소 규칙).
- 마라톤: `TournamentApi.scala` 에서 `bestByTourWithRank(tour.id, 500)` 로 상위 500명을 받아 1위 `marathonWinner`, `rank <= 10` `marathonTopTen`, `<= 50`, `<= 100`, (500까지) 차례로 준다. https://github.com/lichess-org/lila/blob/master/modules/tournament/src/main/TournamentApi.scala (2026-11-10) [official]
- 순위표에 오르는 조건(FAQ): "have played at least 30 rated games in a given rating," · "have played a rated game within the last week for this rating," — https://lichess.org/faq (2026-11-10) [official]
  - 같은 목록에 RD(편차) 75 미만(변형 65 미만)과 "be in the top 10 in this rating." 조건도 있다. 이 「top 10」은 FAQ 문장 그대로이며, 순위표 페이지가 몇 명을 보여 주는지는 재 보지 않았다.
  - **「지난 1주 안에 한 판」 조건이 「순위 지키려 안 두기」를 직접 막는다** — 안 두면 순위표와 순위 트로피가 함께 사라진다.
- 계정 신분 표시 `rankban` 표지가 core 에 있다(`def rankable = enabled.yes && noBot && !marks.rankban`). https://github.com/lichess-org/lila/blob/master/modules/core/src/main/user.scala (2026-11-10) [official]
- 아레나 우승 배지·대회 우승자 목록: 소스에 `marathonWinners` 목록 화면이 있음을 확인했고, 일반 아레나 우승자 표시·Shield 트로피 규칙은 **원문 확인 못함**.
- lichess 포럼·블로그(트로피 역사, 퍼센트 기준을 원했지만 못 했다는 운영진 답) 페이지는 **열지 못함**(403). 검색 요약에만 나와 근거로 쓰지 않는다.

### 1-2. Chess.com

| 보상 | 받는 사람 | 영구? | 보이는 곳 |
| :--- | :--- | :--- | :--- |
| Medals | 대회 1·2·3위 | 원문에 말 없음 | Awards → Medals, 쇼케이스에 걸 수 있음 |
| Achievements | 목표 달성(누구나) | 원문에 말 없음 | Awards → Achievements, 미획득은 회색 자물쇠 |
| League trophies | 이긴 판·비긴 판으로 쌓는 리그 점수 | 리그는 강등 없음 | 리그 화면 |
| Badges · Cheers | 다른 이용자가 줌 | — | Awards |

- Medals: "You can earn a medal by finishing in first, second, or third place in a tournament." — https://support.chess.com/en/articles/8724664-what-are-medals-on-chess-com (2026-11-10) [official]
- Achievements: "can't be given, they can only be earned!" · 예: "like logging in every day for a month or playing 10,000 Live games!" — https://support.chess.com/en/articles/8618496-what-are-achievements (2026-11-10) [official]
  - 「한 달 매일 접속」이 업적이다 = **참여(연속 접속) 보상**이 있다.
- 리그: "There are eight leagues." · "Within each league, players are grouped into divisions of 50 competitors." · "There are no demotions!" — https://support.chess.com/article/2813-what-are-leagues-how-do-i-join-one (2026-11-10) [official]
  - 같은 글: Wood 는 "The top 20 in each division advance.", 위로 갈수록 줄어 Champion 은 1명만 올라간다(요약). 매주 일요일 12pm PT 시작·종료.
  - "League trophies should be earned through normal play in chess games, arenas, and tournaments." 조작하면 트로피 삭제나 계정 정지가 될 수 있다고 적었다(요약).
- 샌드배깅: "The term 'Sandbagging' is used when a player intentionally lowers their chess rating by losing games on purpose." 동기는 낮은 등급 대회에 들어가 상품을 타기("easily dominate and win prizes"). — https://support.chess.com/en/articles/8583380-what-is-a-sandbagger (2026-11-10) [official]
- Titled Arena 상금·트로피 규칙, 순위표(Leaderboard) 상위 표시 방식: **원문 확인 못함**.

### 1-3. Duolingo

- "Every Sunday (based on your timezone), a new weekly league begins." · 리그는 처음 5개에서 지금 10개. — https://blog.duolingo.com/duolingo-leagues-leaderboards/ (2023-05-03 글, 2026-11-10 열람) [official]
- Diamond 토너먼트: "The top 10 learners in the Diamond league are eligible for entry into the Diamond Tournament" · "There are three phases to this competition: Quarterfinals, Semifinals, and Finals." — 같은 글 [official]
  - 같은 글: 라운드마다 탈락자가 있고 각 단계에 "special rewards" 가 있다. 보상 내용은 글에 없다.
- 효과 근거로는 "a little competition worked for a *lot* of learners!" 한 줄뿐이고 수치는 없다. — 같은 글 [official]
- 끄기: "Yes! Leaderboards aren't for everyone." 프로필 공개를 끄면 리그에서 빠진다. — 같은 글 [official]
- 승강 인원(예: Bronze 상위 20명 승급, 하위 5~10명 강등)은 제3자 사이트들끼리 다르다. 공식 도움말은 검색에 안 잡혀 **원문 확인 못함**. 업적 배지 규칙도 **원문 확인 못함**.

### 1-4. ChessKid · Chess Universe (아이·가벼운 체스 앱)

- ChessKid 대회 트로피: "Trophies are awarded to 1st, 2nd, and 3rd places for tournaments with more than 8 kids." · "If a tournament has 8 kids or fewer, only 1st place receives a trophy." — https://support.chesskid.com/en/articles/8867585-who-gets-a-trophy-in-a-tournament (2026-11-10) [official]
  - 프로필 어디에 보이는지, 영구인지는 글에 없다.
- ChessKid 별(Stars): "Stars are earned automatically when kids complete activities such as lessons, puzzles, or games." · "Stars are never lost or deducted; they only increase!" 보석(Gems)은 "never purchased with real money." — https://support.chesskid.com/en/articles/12552532-how-do-stars-and-gems-work-on-chesskid (2026-11-10) [official]
  - 즉 ChessKid 는 **순위 보상(트로피, 상위 3명)과 참여 보상(별, 줄지 않음)을 나눴고**, 꾸미기 화폐는 현금으로 못 산다.
  - ChessKid 순위표(Puzzles·Slow·Fast 분류)는 검색 요약에만 나왔다. **원문 확인 못함**.
- Chess Universe(App Store): "Battle players from around the world and climb your country's leaderboard." · "Defeat opponents to choose rewards from a fresh prize list." 연령 13+, 광고·채팅 있음. — https://apps.apple.com/us/app/chess-universe/id1487204900 (2026-11-10) [official]
  - 아이 전용 모드·리그·트로피는 페이지에 없다.

---

## 2. 순위표·상위 보상의 부작용 연구

| 연구 | 무엇을 봤나 | 핵심 결과 | 근거 |
| :--- | :--- | :--- | :--- |
| Garcia & Tor 2009, *Psychological Science* 20:871-877, doi:10.1111/j.1467-9280.2009.02385.x | 경쟁자 수(N)와 의욕 | 상위 20% 안에 들라는 같은 과제에서 경쟁자가 100명이라 믿으면 10명일 때보다 느렸다. 사회 비교 성향이 클수록 강함 | [paper] Crossref 초록 |
| Barankay 2011, 「Rankings and Social Tournaments」 작업 논문 | 크라우드소싱 노동자에게 순위만 알려 줌(돈과 무관) | 순위를 받은 집단이 **다시 일하러 덜 오고 생산성도 낮았다** | [paper] OpenAlex 초록 |
| Hanus & Fox 2015, *Computers & Education* 80:152-161, doi:10.1016/j.compedu.2014.08.019 | 16주 수업, 순위표+배지 반 vs 없는 반 | 게임화 반이 시간이 갈수록 의욕·만족·자율감이 낮았고, 내적 동기를 거쳐 기말 점수도 낮았다 | [paper] 초록은 미러 요약만 봄 |
| Mekler 외 2017, *Computers in Human Behavior* 71:525-534, doi:10.1016/j.chb.2015.08.048 | 점수·레벨·순위표 개별 효과 | 내적 동기·유능감은 그대로, **양(태그 수)만 늘었다** | [paper] 저자 PDF 초록 |
| Landers 외 2017, *CHB* 71:508-515, doi:10.1016/j.chb.2015.08.008 | 순위표 = 목표 설정 | 순위표만으로 「어려운 목표」 수준 수행. 사람들이 맨 위를 목표로 삼는다 | [paper] 대학 초록 |
| Anderson & Green 2018, *PNAS* 115:1772-1776, doi:10.1073/pnas.1706530115 | 체스 1억 3,300만 판 | 개인 최고 등급을 세우려 애쓰고, **세우면 그만둔다** | [paper] Crossref 초록 |
| Moul & Nye 2006(SSRN), doi:10.2139/ssrn.905612 | 1940–64 체스 후보전 | 소련 선수끼리 짜고 비겼다는 가설과 맞음. 짬이면 소련 독식 확률 75%, 아니면 25% | [paper] Crossref 초록 |
| Kosfeld & Neckermann 2011, *AEJ Micro* 3(3):86-99, doi:10.1257/mic.3.3.86 | 「최고 성과자에게 축하 카드」(상징 보상) | 약 12% 더 일했다(성인 대학생) | [paper] Semantic Scholar 초록 |
| Gallus 2017, *Management Science* 63:3999-4015, doi:10.1287/mnsc.2016.2540 | 위키백과 신입에게 무작위 상징 상 | 신입 잔류가 4분기 동안 크게 늘었다. **성적과 무관하게 무작위로 줬다** | [paper] Crossref 초록 |

인용(각 초록):
- "increasing the number of competitors ( N) can decrease competitive motivation." — https://doi.org/10.1111/j.1467-9280.2009.02385.x (Crossref API, 2026-11-10) [paper]
- "employees who received feedback about their rank were less likely to return to work" — OpenAlex 레코드 「Rankings and Social Tournaments」 2011 (https://api.openalex.org 검색, 2026-11-10) [paper]. core.ac.uk PDF 는 **열지 못함**(403).
- "students in the gamified course showed less motivation, satisfaction, and empowerment over time" — https://ai.updf.com/paper-detail/assessing-the-effects-of-gamification-in-the-classroom-a-longitudinal-hanus-fox-dff76a9862467d426113ec530f83942016ae3a97 (2026-11-10, 미러 요약) [paper]. ScienceDirect 원문 **열지 못함**(403). 표본 수(71명 등)는 **원문 확인 못함**.
- "functioned as extrinsic incentives, effective only for promoting performance quantity." — https://glassmanlab.seas.harvard.edu/annotated_works/mekler17.pdf (2026-11-10) [paper]
- "The presence of a leaderboard was successful in motivating participants" — https://experts.umn.edu/en/publications/gamification-of-task-performance-with-leaderboards-a-goal-setting/ (2026-11-10) [paper]
- "players exert effort to set new personal best ratings and quit once they have done so." — https://doi.org/10.1073/pnas.1706530115 (Crossref API, 2026-11-10) [paper]
- "Our results are consistent with Soviet draw-collusion and inconsistent with Soviet competition." — https://doi.org/10.2139/ssrn.905612 (Crossref API, 2026-11-10) [paper]
- "outperform students in the control treatment by about 12 percent on average." — https://doi.org/10.1257/mic.3.3.86 (2026-11-10) [paper]
- "awards have a sizeable effect on newcomer retention" — https://doi.org/10.1287/mnsc.2016.2540 (Crossref API, 2026-11-10) [paper]

「상위 10% 밖이면 포기」를 숫자로 보인 단일 연구는 찾지 못했다. 가장 가까운 것은 Garcia & Tor(N 이 크면 「상위 몇 %」 목표 의욕이 준다)와 Barankay(순위만 알려도 복귀가 준다)다. 하위권 이탈이 공개 여부·비교 집단·성향에 따라 갈린다는 검색 요약(Ashraf 외 공개 순위, MovieLens 비교 집단 실험 등)은 원문을 열지 않아 **원문 확인 못함**.

---

## 3. 아이 관련 규제·가이드

### 3-1. Google Play 가족 정책

- 제목 "Google Play Families Policies - Play Console Help". **순위표·사회 비교를 직접 말한 문장은 없다.** — https://support.google.com/googleplay/android-developer/answer/9893335 (2026-11-10) [official]
- 관련 문장:
  - 금지 예: "Use of shocking or emotionally manipulative tactics to encourage ads viewing or in-app purchases."
  - "Google Play reserves the right to reject, remove or suspend apps for overly aggressive commercial tactics."
  - 금지 예: "Not providing a distinction between the use of virtual game coins versus real-life money"
  - 보상형 광고도 5초 뒤 닫을 수 있어야 한다("including rewarded or opt-in ads, that are not closeable after 5 seconds.").
  - 소셜 기능: 어른이 아이의 소셜 기능을 관리할 수 있어야 한다("provide a method for adults to manage social features for child users.").
- 해석: 순위 보상이 **광고 시청·구매로 이어지거나**, 순위표가 자유 입력 닉네임·채팅을 품으면 이 정책에 걸린다. 순위 자체는 규정이 없다.

### 3-2. 영국 ICO 아동 코드(Age appropriate design code)

- ico.org.uk 페이지·PDF 는 **열지 못함**(403, WebFetch·curl 모두). 대신 같은 코드 PDF 사본(판 2.1.87, 2022-10-17)을 열었다: https://www.ais-sociologia.it/wp-content/uploads/2026/06/Age-Appropriate-Design-Code-ICO.pdf (2026-11-10) [official 사본 — 원 출처 아님에 주의]
- 표준 13(Nudge) 문장 자체는 개인정보·사생활 보호 설정에 관한 것이다: "Do not use nudge techniques to lead or encourage children to provide unnecessary personal data". 순위표·리더보드라는 단어는 코드에 없다(사본 전문 검색).
- 보상·몰입 장치는 표준 5(Detrimental use of data) 설명에 있다:
  - "'sticky' features can include mechanisms such as reward loops, continuous scrolling, notifications and auto-play features"
  - 질문 "Does this mean we can't use features such as rewards, notifications and 'likes'" → 답 "No", 단 아이가 압박 없이 그만둘 수 있게 설계해야 한다.
  - 위반 예: 개인정보로 "exploit human susceptibility to reward, anticipatory and pleasure seeking behaviours, or peer pressure."
  - 할 것: 계속하기를 중립적으로 묻기 — "without suggesting that children will lose out if they don't;"
  - 할 것: 진행을 잃지 않고 쉴 수 있는 일시정지("pause buttons which allow children to take a break at any time without losing their progress")
- 해석: 「이번 주에 안 두면 순위·트로피를 잃는다」는 표시는 「안 하면 손해」 문구에 가깝다. 개인정보를 쓰지 않는 순위라도 코드의 취지와 부딪칠 수 있다(해석, 규제기관 판단 아님).

### 3-3. EU DSA 제28조 미성년자 지침

- 연 문서: "Guidelines on measures to ensure a high level of privacy, safety and security for minors online, pursuant to Article 28(4) of Regulation (EU) 2022/2065", C(2025) 6826 final, 2025-10-07 판. 받은 곳 https://ec.europa.eu/newsroom/dae/redirection/document/118226 (안내 페이지 https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-protection-minors, 2026-11-10) [official]
  - 첫 공개는 2025-07-14로 알려졌다(검색 요약). 연 PDF 는 10월 판이다.
- §6.3.1 기본 설정 viii: 과다 사용을 부르는 기능은 기본으로 끈다 — "features that may contribute to excessive use, such as the number of "likes" or "reactions", "streaks"" … "are turned off."
- §6.4 b: 몰입 위주 설득 설계에 노출하지 않는다. 예시 끝에 "the creation of virtual rewards for performing (repeated) actions on the platform."
- §6.6 l(상업 관행): "manipulative design techniques (82), such as scarcity (83), intermittent or random rewards" 에 노출하지 않는다(과소비·중독 맥락).
- 「leaderboard」「ranking 보상」이라는 단어는 지침에 없다(전문 검색). 순위 보상이 **반복 행동에 주는 가상 보상**이거나 **연속 기록(streak)** 이면 §6.4 b·§6.3.1 viii 에 해당할 수 있다(해석).
- DSA 는 「온라인 플랫폼」에 적용된다. 이 게임이 플랫폼에 해당하는지는 따지지 않았다.

### 3-4. 한국 게임산업진흥에 관한 법률

- 연 원문: 국가법령정보센터, 법률 제20485호(2024. 10. 22. 일부개정) https://www.law.go.kr/LSW/lsInfoR.do?lsiSeq=265811&efYd=20241022 (2026-11-10) [official]
- 제28조 제3호(사업자 준수사항): "경품 등을 제공하여 사행성을 조장하지 아니할 것." 단서는 **청소년게임제공업(오락실 등 장소)의 전체이용가 게임**에만 대통령령 경품(완구류·문구류)을 허용하고 "현금, 상품권 및 유가증권은 제외한다".
- 제32조 제1항 제7호: 게임으로 얻은 "점수, 경품, 게임 내에서 사용되는 가상의 화폐" 등을 "환전 또는 환전 알선하거나 재매입을 업으로 하는 행위" 금지.
- 법 조문에는 「랭킹」「순위 보상」이라는 말이 없다(원문 검색). 온라인 게임의 순위 상금·실물 경품이 제28조 제3호 「경품」에 해당하는지에 대한 게임물관리위원회·문체부 해석은 **원문 확인 못함**.
- 해석: 순위 보상을 **게임 안 꾸미기(돈으로 바꿀 수 없는 것)**로만 주면 두 조항과 닿지 않는다. 현금·상품권·거래 가능한 아이템을 순위로 주는 순간 검토 대상이다.

### 3-5. Apple App Store 심사 지침 1.3 Kids

- "These apps must not include links out of the app, purchasing opportunities, or other distractions to kids unless reserved for a designated area behind a parental gate." — https://developer.apple.com/app-store/review/guidelines/ (2026-11-10) [official]
- 같은 1.3: 제3자 분석·광고 금지 원칙("should not include third-party analytics or third-party advertising."), 개인정보·기기 정보 제3자 전송 금지.
- 3.1.1: 무작위 유료 상자는 확률 공개("must disclose the odds of receiving each type of item to customers prior to purchase.").
- 3.2.2(x): 행동 보상은 허용 — "Apps may otherwise incentivize users to take specific actions within apps (such as by completing a level"
- Game Center 순위표·순위 보상을 아이와 묶어 말한 문장은 없다(4.5.3·4.5.5 는 플레이어 ID 오용 금지). 페이지 끝 약 14,000자는 읽지 않았다.

---

## 4. 아이에게 경쟁·순위 보상 — 교육·발달 연구

1. **Deci, Koestner & Ryan 1999**, *Psychological Bulletin* 125(6):627-668, doi:10.1037/0033-2909.125.6.627 — 128개 연구 메타분석. 성과 조건 보상도 자유 선택 내적 동기를 낮춤(d = −0.28), 긍정 피드백은 높임(d = 0.33). "Tangible rewards tended to be more detrimental for children than college students" — OpenAlex 초록 (https://api.openalex.org/works/doi:10.1037/0033-2909.125.6.627, 2026-11-10) [paper]
2. **Butler 1987**, *Journal of Educational Psychology* 79(4):474-482, doi:10.1037/0022-0663.79.4.474 — 5·6학년 200명. 개별 코멘트를 받은 아이가 흥미·수행이 가장 높았고, 점수·칭찬은 자아 관여(남과 비교) 귀인을 키웠다. "interest, performance, and attributions of effort … were highest at both levels of achievement after receipt of comments." (생략 포함) — OpenAlex 초록 (2026-11-10) [paper]
3. **Lepper, Greene & Nisbett 1973**, *JPSP* 28:129-137, doi:10.1037/h0035519 — 유아. **미리 약속한 상**을 받은 아이가 나중에 그 활동에 흥미를 덜 보였다. 예고 없이 받은 상은 그렇지 않았다. "subjects in the expected-award condition would show less subsequent intrinsic interest" — OpenAlex 초록 (2026-11-10) [paper]
4. **Reeve & Deci 1996**, *PSPB* 22(1):24-33, doi:10.1177/0146167296221003 — 대학생 대상이지만 경쟁 요소를 쪼갰다. 이기면 유능감을 거쳐 동기↑, **압박하는 분위기**는 자율감을 거쳐 동기↓. "a pressured (relative to nonpressured) interpersonal context decreased intrinsic motivation" — Crossref 초록 (2026-11-10) [paper]

아이 대상으로 「상위 N명 보상」만 따로 시험한 연구는 찾지 못했다. 위 넷은 모두 보상·비교의 일반 효과다.

---

## 교차 패턴

1. **순위 트로피는 「지금 순위」, 대회 트로피는 「영구」로 나눈다.** lichess 는 순위 트로피를 지금 순위로 매번 그리고(빠지면 사라짐), 마라톤 트로피만 DB 에 저장한다. 영구 상은 끝난 대회에만 준다.
2. **순위에 남으려면 계속 둬야 한다.** lichess 순위표는 「지난 1주 한 판」·30판·RD 조건을 건다. 「순위 지키려 안 두기」를 규칙으로 막은 예다. 반대로 Anderson & Green 은 개인 최고를 찍으면 그만두는 경향을 1억 판 넘게 보였다.
3. **상위 보상은 아주 적은 사람에게, 참여 보상은 모두에게.** Chess.com(메달 1–3위 / 업적 누구나), ChessKid(트로피 1–3위, 8명 이하면 1위만 / 별은 누구나·줄지 않음), Duolingo(Diamond 상위 10명만 토너먼트). 다수는 참여 보상으로 붙잡는다.
4. **승급만 있고 강등 없는 사다리가 있다.** Chess.com 리그는 "There are no demotions!" — 잃을 걱정을 지운다. Duolingo 는 강등이 있다(인원은 원문 확인 못함).
5. **부정행위자는 순위 보상에서 뺀다.** lichess `u.lame.not` 로 순위 트로피 숨김·`rankban`, Chess.com 은 샌드배깅을 조작으로 보고 리그 트로피 조작 시 삭제·정지. 상품이 걸린 대회가 샌드배깅의 동기라고 공식 도움말이 직접 쓴다.
6. **순위표는 양을 늘리지만 내적 동기는 안 늘린다.** Mekler(양만↑), Landers(맨 위를 목표로 삼음), Hanus & Fox(학기 동안 동기·성적↓), Barankay(순위만 알려도 복귀↓), Garcia & Tor(경쟁자가 많으면 의욕↓).
7. **상징 보상은 효과가 있고, 무작위·비성과 상도 잔류를 늘린다.** Kosfeld & Neckermann(+12%), Gallus(위키 신입 잔류↑, 무작위 수여). 상의 「값」이 아니라 「인정」이 일한다.
8. **아이 규제는 「순위」보다 「몰입 장치·돈·소셜」을 본다.** DSA 지침은 streak·반복 행동 가상 보상을 기본 끔/노출 금지로, ICO 코드는 「안 하면 손해」 문구와 보상 루프를, Google Play·Apple 은 광고·구매·외부 링크·소셜을, 한국 법은 현금성 경품·환전을 본다. 「leaderboard」를 직접 금지한 문장은 다섯 곳 어디에도 없었다.

---

## 아이 대상 체스 게임에 옮길 때 지킬 선

- 순위 보상은 **꾸미기·칭호 같은 상징 보상**만. 현금·상품권·거래·환전 가능한 것은 주지 않는다(게임산업법 제28조 3호·제32조 1항 7호, Google Play 가상 화폐 구분).
- 순위 보상을 **광고 시청·구매와 묶지 않는다**(Google Play 감정 조작·과도한 상업 전술, Apple 1.3).
- **「이번 주 안 하면 잃는다」 문구·연속 기록(streak) 압박을 쓰지 않는다.** 계속하기는 중립으로 묻고, 쉬어도 진행을 잃지 않게 한다(ICO 표준 5, DSA §6.3.1 viii·§6.4 b).
- 「지금 순위」 표시와 「끝난 시즌의 영구 기념」을 나눈다. 영구 기념은 시즌 끝에만 주고, 지금 순위는 비활동이면 조용히 내려온다 — 내려온다고 경고·알림을 보내지 않는다.
- 상위 몇 명만 받는 보상과 별개로 **모두가 받는 참여 보상(줄지 않는)**을 둔다(ChessKid 별 구조). 비교 대상은 작은 무리(친구·비슷한 실력)로 좁힌다(Garcia & Tor N 효과).
- 피드백은 「몇 위」보다 **그 판에 대한 코멘트**를 앞에 둔다(Butler 1987). 순위표는 끌 수 있게 한다(Duolingo 처럼).
- 짜고 지기·샌드배깅·다중 계정으로 얻은 순위는 보상에서 뺀다(lichess lame/rankban, Chess.com 샌드배깅). 보상이 클수록 동기가 커진다는 점을 설계 크기에 반영한다.
- 위 해석은 법률 자문이 아니다. 국내 출시 전 게임물관리위원회 해석(순위 보상이 「경품」인지)은 따로 확인해야 한다 — 이번에 원문을 찾지 못했다.
