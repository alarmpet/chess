# 경쟁 게임 랭크(사다리) 설계 조사 A — 무엇이 동기를 만들고 무엇이 역효과였나

조사일 2026-11-09. 대상: WILD CROWN 친구 초대 1:1 랭크(Glicko-2 서버 계산, 동물 배지 4개).
표시: **[official]** 개발사 블로그·패치 노트·고객지원 / **[press]** 언론 / **[community]** 선수 반응.
인용은 실제로 연 페이지에서 옮긴 원문이며 25단어 미만이다. 열지 못한 페이지는 따로 적었다.
규칙은 시즌마다 바뀐다. 각 항목의 날짜를 같이 본다. 2026년 현재 규칙인지는 표시한 곳 말고는 재 보지 않았다.

---

## 1. League of Legends (Riot)

### 1-1. 디비전 사이 승급전 폐지 (2020-09 발표 → 2021 시즌 적용)
- 기제: 같은 티어 안 디비전(예: Gold III→II) 승급전을 없애고, 남은 LP 를 다음 디비전으로 넘김. 대신 0 LP 디비전 강등 보호도 없앰. 티어 사이 승급전과 티어 강등 보호는 남김.
- 개발자 이유 [official] (/dev: End of Season Updates, Riot Codebear, 2020-09-17)
  - "at worst a source of major frustration when you were bounced out for the fifth time in a row."
  - "solve for unnecessary frustration and climbing blocks between solo and flex queues divisions."
  - 강등 보호 제거 이유: "avoid ranked inflation and rapid rubberbanding."
  - URL: https://www.leagueoflegends.com/en-gb/news/dev/dev-competitive-end-of-season-20-preseason-21/
  - "fifth time in a row" 는 예시이지 통계가 아니다. 승급전 실패율 같은 수치는 이 글에 없다.
- 적용 확인 [official] (Ranked 2021 Rundown, 2021-01-08)
  - "There are no more promo series between divisions (ex. Gold III -> Gold II)"
  - "You'll still go through promos between tiers (ex. Gold -> Platinum), and still have demotion protection between tiers."
  - 리셋: "the start-of-season rank reset is less drastic this year."
  - 휴면 감소(decay): Diamond 도 Master+ 처럼 "banked-game decay" 를 쓰되 하루 50 LP(Master+ 는 250 LP).
  - URL: https://www.leagueoflegends.com/en-us/news/game-updates/ranked-2021-rundown/

### 1-2. 승급전 완전 폐지·배치 5판·Emerald 신설 (2023 Split 2, 2023-06-08 발표)
- 기제: 티어 승급전까지 전부 없앰. 배치 경기 10→5. 첫 리셋을 평소보다 작게. Platinum 과 Diamond 사이에 Emerald 추가.
- 개발자 이유 [official] (What's Next for Ranked, Riot Auberaun·Riot Revenancer, 2023-06-08)
  - "Promotion series have long been a divisive element of the ranked climb."
  - "the stress of repeatedly running through promotion series for ranks you may have earned before outweighs the benefits"
  - 배치 축소: "we can determine starting rank more quickly and save you the extra time before getting to laddering up."
  - 오르내림을 쉽게 한 목적: "so that your ranked journey is more eventful."
  - 스플릿 보상 반응: "we don't have an official take on how these have landed yet."
  - URL: https://www.leagueoflegends.com/en-us/news/game-updates/what-s-next-for-ranked/
- 같은 날 요약판 [official] "We’re completely removing promos from League." — https://www.leagueoflegends.com/en-sg/news/dev/tl-dw-clash-ranked-skins-dev-update/
- 언론 해석 [press] esports.gg 는 Wild Rift 에서 승급전을 뺀 성공과 TFT 에 승급전이 없는 점을 근거로 들었다고 보도(검색 요약으로만 봄, 본문은 열지 않음): https://esports.gg/news/league-of-legends/league-of-legends-gets-new-rank-removes-promos-system-and-more
- 「ranked anxiety」라는 Riot 공식 문장은 찾지 못했다. Riot 이 쓴 말은 "frustration", "stress" 이다.

### 1-3. 스플릿과 스플릿 보상 (2023~2024)
- 기제: 한 해 랭크 리셋 2번(2023) → 3번(2024). 판마다 Split Point 를 쌓아 보상 트랙을 연다.
- [official] Changes to Ranked in 2023 (2022-12-06)
  - "League of Legends will have two Ranked resets in Season 2023."
  - "we want you to always have a goal to be able to chase"
  - 이긴 판은 더 많이, 진 판도 적게 Split Point 를 준다고 설명(요약 확인, 원문 문장은 옮기지 않음).
  - URL: https://www.leagueoflegends.com/en-sg/news/game-updates/changes-to-ranked-in-2023
- [official] /dev: Ranked Rewards in 2024 (2024-04-08)
  - Victorious 스킨 조건: Gold 이상은 80 Split Points, Gold 미만은 1000 (1600 에서 낮춤).
  - "making it worthwhile to continue playing through the full season"
  - URL: https://www.leagueoflegends.com/en-us/news/dev/dev-ranked-rewards-in-2024/
- 결과 수치: 몇 명이 받았는지 등은 공개 글에 없다. 2025년 이후 구조는 재 보지 않았다.

---

## 2. VALORANT (Riot)

### 2-1. RR(Rank Rating)·진행 막대·0 RR 강등·Act 랭크 삼각형 (Episode 2 Act I, 2021-01-12)
- [official] VALORANT Episode 2 Act I Competitive Changes (Brighteyz·EvrMoar, 2021-01-12)
  - "New Progress bar and Rank Rating show proximity to next rank"
  - "Demotion protection: You must lose at 0 RR to demote"
  - "If you demote, you will not go below 80 RR at that rank" (WebFetch 결과에서 원문으로 나옴. 검색 요약 한 곳은 제3자 출처로 표기 — 확인 필요 표시)
  - 배치: "The number of placement games (5) is now consistent for each Act"
  - Act 랭크: "Act Ranks will give you a rank triangle for the rank you end the match with."
  - 휴면: "Players will no longer have their rank hidden (changed to ‘?’) for inactivity."
  - URL: https://playvalorant.com/en-us/news/game-updates/valorant-episode-2-act-i-competitive-changes/

### 2-2. 숨은 MMR 과 보이는 랭크의 관계 (2021-03-18)
- [official] Ask VALORANT - Rank Rating Edition
  - 보이는 랭크를 MMR 과 "slightly decoupled" 시켜 "wild swings in your rank" 를 피한다.
  - "Even with a 50% win rate, you could go on a long winstreak and promote to a rank above your MMR."
  - "Ranked is about finding your true skill and we will hold you accountable to the skill level you are playing."
  - 인정한 부작용: "we know it can feel frustrating to lose more RR then you are gaining."
  - 배치 후 시작점: "on the low end of where we think you belong" (일부러 낮게 놓고 올라오게 함)
  - URL: https://playvalorant.com/en-us/news/dev/ask-valorant-rank-rating-edition/
- [official] 고객지원 How Rank Rating (RR) is calculated (게시 2026-06-01 표기)
  - "Your final RR value is adjusted by a convergence factor that aligns your visible rank with your hidden skill rating."
  - "MMR = Rank: If your skill rating matches your rank, your RR gains and losses will be about the same."
  - URL: https://support.riotgames.com/valorant/gameplay/how-rank-rating-rr-is-calculated
- 휴면 감소 없음: 검색 요약에서 FAQ 문장 "No rank decay here" 를 봤으나 페이지는 열지 않았다 — https://support-valorant.riotgames.com/hc/en-us/articles/360047937633-VALORANT-Competitive-Mode-FAQ

### 2-3. Rank Shield (Patch 10.01, 2025-01-21)
- 기제: 각 랭크 1단계(Silver 1, Gold 1…)에서 방패 2개. 0 RR 패배 3번째에 강등. 1단계로 다시 들어올 때만 채움.
- [official] Patch Notes 10.01
  - "You are granted two Rank Shields while in Tier 1 (e.g. Silver 1, Gold 1, Platinum 1) of all Ranks except Radiant."
  - "If you lose three games while at 0 RR, you demote to the lower rank (e.g. Gold 1 to Silver 3)."
  - "Winning at 0 RR and going back to 10 RR will not replenish your shields."
  - 이유는 한 줄뿐: "It’s time to start the grind." (심리적 근거 설명 없음)
  - URL: https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-10-01/
- 결과 수치: 공개된 것 못 찾음.

---

## 3. Overwatch 2 (Blizzard)

### 3-1. 출시(2022-10): 7승 또는 20패마다 랭크 갱신 → 역효과
- [press] 출시 때 숫자 SR 을 없애고 7승/20패마다 갱신. GameWatcher 는 "특정 랭크에 갇힌 느낌"을 덜려는 의도라고 보도(검색 요약, 본문 안 열음): https://www.gamewatcher.com/news/overwatch-2-replaces-skill-rating-with-skill-tier-divisions
- [community, press 경유] Charlie INTEL 2022-10-21 기사에 실린 선수·스트리머 트윗
  - Deku(2022-10-18): "no idea of how you are doing in your games until you reach 7 wins"
  - Crimzo(2022-10-19): "Having everything hidden from you"
  - URL: https://www.charlieintel.com/overwatch-2/overwatch-2-players-call-for-change-to-trash-ranked-system-205627/

### 3-2. Season 3(2023-02): 5승/15패로 줄임
- [official] Overwatch 2 Developer Blog: Explaining matchmaker goals and plans, part 2 (날짜 페이지에 표기 없음, Season 3 직전)
  - "having to play as many as 26 matches to get an update has been discouraging for players."
  - "We want you to feel a sense of progression without needing to focus on a super granular number like a skill rating"
  - "We only create matches based on players’ MMR, not the visible competitive rank."
  - "When we decay ranks at the beginning of a season, this has no effect on players’ underlying ratings."
  - 시즌 리셋·휴면 감소 폐지 예고: "we’re planning to remove seasonal competitive rank resets and all current and past seasonal rank decay."
  - URL: https://overwatch.blizzard.com/en-us/news/23910161

### 3-3. Season 9(2024-02-13): 판마다 진행·수정치 공개
- [official] Director’s Take – Looking to the Future of Competitive Overwatch (날짜 페이지에 없음, Season 9 직전)
  - "When the game doesn't acknowledge the loss, it can feel as though the whole match was a waste of time."
  - "Going forward, we're shifting our values to provide more transparency to the mode."
  - 역효과 사례: "we've seen players go 5-2 and be demoted at their next Competitive Update."
  - URL: https://overwatch.blizzard.com/en-us/news/24003139
- [official] 결과 수치 — Director's Take - Looking Ahead to Improvements and Experiments (Season 9 출시 주)
  - "Competitive Play now makes up about 45% of match hours, with Quick Play around 32%."
  - 이전: Quick Play 약 40%, Competitive 약 35%.
  - "the total number of hours that people are playing Quick Play isn't down;"
  - 주의: 같은 시즌에 영웅 체력·자가 회복 등 큰 변화가 함께 들어왔으므로 랭크 변경만의 효과로 볼 수 없다(우리 해석).
  - URL: https://overwatch.blizzard.com/en-us/news/24069288
- [press] Season 9 세부(검색 요약만): 승리 3, 무승부·패배 1 진행 포인트, 30 모이면 경쟁 포인트 100. 수정치(연승·연패, 랭크 불안정, 매치 유불리)를 판 뒤에 보여 줌. 배치 결과에 예상 랭크 표시 — MP1st·Kotaku 등: https://kotaku.com/overwatch-2-new-ranked-system-competitive-season-9-1851239386

---

## 4. Apex Legends (Respawn/EA)

### 4-1. Ranked Leagues 출시 (2019-07-01)
- [official] Introducing Apex Legends Ranked Leagues
  - 입장료(RP entry cost): Bronze 무료 → Apex Predator 5 RP. 이유: "This is intended to not let high-ranked players completely carry their lower-ranked friends."
  - 티어 강등 없음: "There is currently no demotion if you drop into a lower tier" / 디비전 강등은 있음.
  - 패배 면제: "Loss forgiveness is defined as zeroing out any potential losses in RP for a match." (매칭된 팀원 이탈·클라이언트 오류 때)
  - 보상 철학: "Ultimately, the best reward in a ranked system is the recognition of your skill and the rank you achieve."
  - URL: https://www.ea.com/games/apex-legends/news/ranked-leagues-mode-details

### 4-2. Series 3 (2020-01-23): 패배 면제 남용 → 제한
- [official] Ranked Series 3 Details
  - "There are some changes coming to loss forgiveness to reduce abuse of the system."
  - "We will be limiting the RP loss forgiveness when you leave to once per day."
  - 분포 공개(5시간 이상 플레이, 괄호는 직전 시리즈): Silver 29.1%(40%), Gold 35.3%(35.7%), Platinum 23.6%(16.8%), Diamond 7.1%(2.1%) — 강등 없는 구조에서 상위로 쏠림이 커짐(우리 해석).
  - URL: https://www.ea.com/games/apex-legends/news/ranked-series-3-details

### 4-3. Season 13 "Ranked Reloaded" (2022-05): 티어 강등 도입 + 3판 보호
- [press] Charlie INTEL (2022-05-04 갱신)
  - 보호가 끝나면 "dropping the player halfway down the previous division."
  - 목표 두 가지: "Teamplay for Victory" 와 "Accurate Skill & Better Competition."
  - 승급 직후 3판 강등 보호(기사 서술).
  - URL: https://www.charlieintel.com/apex-legends/apex-legends-season-13-ranked-changes-173578/
- EA 원문 블로그는 열지 못했다. 검색 요약에 Respawn 인용 "Your ranking is important and should be accurate…" 이 보였으나 원 페이지 미확인이라 인용으로 쓰지 않는다.
- Season 20(2024-02) 다시 개편(Promotional Trials 제거, 시즌 시작 RP 리셋 등)은 언론 검색 요약으로만 봄: https://charlieintel.com/apex-legends/apex-legends-season-20-ranked-changes-302186

---

## 5. Rocket League (Psyonix/Epic)

### 5-1. 시즌 보상 = 그 랭크 이상에서 10승씩
- [official] What are Season Rewards in Rocket League? (Epic 고객지원, curl 로 받아 읽음, 날짜 없음)
  - "Season Rewards are special Items earned at the end of a Season and are determined by your Rank for that Season."
  - "Once you have secured 10 wins, "Unranked" will be replaced with the rank you achieved."
  - "if your rank progress bar shows Bronze, you'll need to win 10 matches in Silver to progress the bar and earn Silver Rewards."
  - URL: https://www.epicgames.com/help/en-US/rocket-league-c-202300000001622/gameplay-c-202300000001682/what-are-season-rewards-in-rocket-league-a202300000017950
- 「패배가 승수를 깎지 않는다」「강등돼도 진행이 남는다」는 검색 요약에만 있었고 위 페이지 본문에서는 확인 못 함.
- 도입 이유를 설명한 Psyonix 2017 글(Season 5 변경)은 403 으로 열지 못했다: https://www.rocketleague.com/news/changes-competitive-season-5
- [press] 보상 품질 불만: GGRecon "Rocket League Players Fuming With Competitive Season 4 Rewards"(제목만 봄): https://www.ggrecon.com/articles/rocket-league-players-fuming-with-competitive-season-4-rewards/

---

## 6. Fortnite Ranked (Epic, 2023-05 출시)

- [official] How do I play Fortnite ranked mode? (Epic 고객지원, curl 로 읽음, 날짜 없음 — 현재 문구)
  - "Your rank is based on placement and eliminations each match."
  - "Once you reach Elite, you cannot be demoted below it for the rest of the season."
  - "Ranks partially reset at the start of each new season."
  - "Each season, reaching certain ranks earns exclusive cosmetic rewards."
  - URL: https://www.epicgames.com/help/en-US/fortnite-battle-royale-c-202300000001636/a202300000014667
- [official] How does the % gained in Fortnite Ranked Mode work?
  - "The % shown in Fortnite Ranked represents your progress toward the next rank tier."
  - URL: https://www.epicgames.com/help/en-US/fortnite-battle-royale-c-202300000001636/gameplay-c-202300000001721/how-does-the-gained-in-fortnite-ranked-mode-work-a202300000013008
- 주의: 언론 글들은 강등 바닥을 Unreal 이라 하거나 Elite·Champion·Unreal 이라 하는 등 엇갈린다. 현재 공식 문구는 「Elite 아래로 안 떨어짐」. 설계 이유를 밝힌 Epic 개발자 글은 찾지 못했다.
- [press] 출시 때 배치는 1판(과거 SBMM 기록 + 첫 판): https://www.theouterhaven.net/2023/05/fortnite-ranked (검색 요약)

---

## 7. 게임을 가로지르는 공통 패턴

| 패턴 | 사례(날짜) | 근거 | 우리 판단 메모 |
| :--- | :--- | :--- | :--- |
| 숨은 MMR + 보이는 랭크 분리 | OW2 2023, VALORANT 2021 | OW "We only create matches based on players’ MMR, not the visible competitive rank." / VAL convergence factor | 보이는 랭크는 「천천히 따라오는 진행 막대」. 실력 계산(Glicko-2)과 보여 주는 배지를 분리하는 근거 |
| 승급전(관문 시합) 제거 | LoL 2021 디비전, 2023 전부 | "stress of repeatedly running through promotion series…" | 관문 시합은 좌절의 주원인으로 공식 인정 |
| 진행을 판마다 보여 주기 | OW2 7승→5승(S3)→판마다(S9) | "having to play as many as 26 matches … discouraging" / "waste of time" | 숨기면 불안을 줄이는 게 아니라 더 키움. 결과 수치(경쟁전 35%→45%)가 공개된 유일한 사례 |
| 진 판에도 무언가 주기 | OW2 S9 패배 1점, LoL Split Point 패배도 적게 | OW "When the game doesn't acknowledge the loss…" | 아이 대상이면 특히 중요 |
| 강등 보호·바닥 | LoL 티어 보호, VAL 0 RR·80 RR·Rank Shield, Apex 2019 티어 무강등→2022 3판 보호, Fortnite Elite 바닥 | 각 절 | 보호를 넓히면 분포가 위로 쏠림(Apex Series 3 수치). 보호 → 정확도 쪽으로 되돌린 사례(Apex S13, LoL 0 LP 보호 제거) |
| 연승 보너스 | VAL(수렴 계수), OW2 S9 연승·연패 수정치 | VAL "long winstreak and promote to a rank above your MMR" | 따로 「연승 보너스」를 설계했다는 공식 문장은 없음. 계산 결과로 생김 |
| 시즌 리셋을 부드럽게 | LoL 2021·2023 "less drastic", Fortnite 부분 리셋, OW2 리셋 폐지 예고 | 각 절 | 리셋해도 숨은 점수는 그대로(OW 공식) |
| 배치 경기 줄이기 | LoL 10→5(2023), VAL 5, Fortnite 1판 | "determine starting rank more quickly" | VAL 은 일부러 낮게 놓아 오르는 경험을 줌 |
| 시즌 말 보상 = 랭크 + 참여량 | RL 랭크별 10승, LoL Split Point 80/1000, Apex 배지 | RL·LoL·Apex 공식 | 「도달한 랭크」만이 아니라 「그 랭크에서 이긴 횟수·한 판 수」를 같이 요구 |
| 휴면 감소 | LoL Diamond+ banked decay, VAL 감소 없음, OW2 폐지 예고 | 각 절 | 소수 친구 대전에는 감소가 맞지 않음(우리 해석) |

### 역효과로 공식 인정된 것
1. LoL 승급전: 반복 실패 좌절(2020, 2023 공식).
2. OW2 묶음 갱신: 진행 숨김·「5승 2패인데 강등」(2023, 2024 공식), 선수 반발(2022 언론).
3. Apex 패배 면제: 남용 → 하루 1회 제한(2020 공식).
4. Apex 티어 무강등: 분포 상향 쏠림(2020 공식 수치) → 2022 티어 강등 도입(언론).
5. VAL: 랭크가 MMR 위면 "lose more RR then you are gaining" 좌절(2021 공식 인정).

---

## 8. 확인 상태

### 실제로 연 페이지(WebFetch 또는 curl)
- https://www.leagueoflegends.com/en-us/news/game-updates/what-s-next-for-ranked/ (2023-06-08)
- https://www.leagueoflegends.com/en-gb/news/dev/dev-competitive-end-of-season-20-preseason-21/ (2020-09-17)
- https://www.leagueoflegends.com/en-us/news/game-updates/ranked-2021-rundown/ (2021-01-08)
- https://www.leagueoflegends.com/en-sg/news/dev/tl-dw-clash-ranked-skins-dev-update/ (2023-06-08)
- https://www.leagueoflegends.com/en-sg/news/game-updates/changes-to-ranked-in-2023 (2022-12-06)
- https://www.leagueoflegends.com/en-us/news/dev/dev-ranked-rewards-in-2024/ (2024-04-08)
- https://playvalorant.com/en-us/news/game-updates/valorant-episode-2-act-i-competitive-changes/ (2021-01-12)
- https://playvalorant.com/en-us/news/dev/ask-valorant-rank-rating-edition/ (2021-03-18)
- https://support.riotgames.com/valorant/gameplay/how-rank-rating-rr-is-calculated (2026-06-01 게시 표기)
- https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-10-01/ (2025-01-21)
- https://overwatch.blizzard.com/en-us/news/23910161 (Season 3 직전, 날짜 미표기)
- https://overwatch.blizzard.com/en-us/news/24003139 (Season 9 직전, 날짜 미표기)
- https://overwatch.blizzard.com/en-us/news/24069288 (Season 9 출시 주)
- https://www.ea.com/games/apex-legends/news/ranked-leagues-mode-details (2019-07-01)
- https://www.ea.com/games/apex-legends/news/ranked-series-3-details (2020-01-23)
- https://www.charlieintel.com/apex-legends/apex-legends-season-13-ranked-changes-173578/ (2022-05-04)
- https://www.charlieintel.com/overwatch-2/overwatch-2-players-call-for-change-to-trash-ranked-system-205627/ (2022-10-21)
- Epic 고객지원(Rocket League 시즌 보상, Fortnite 랭크 2건) — WebFetch 403, curl 로 받아 읽음

### 검색 결과로만 본 것(인용으로 쓰지 않음 또는 표시함)
- VALORANT FAQ(휴면 감소 없음), GameWatcher·Kotaku·MP1st(OW2), Apex Season 13 EA 원문·Season 20 기사, esports.gg·GameRiv(LoL 2023), GGRecon(RL 보상 불만), theouterhaven(Fortnite 배치)

### 열지 못한 것
- rocketleague.com 뉴스(2017 Season 5·6 변경) — 403
- Reddit — 검색 도구가 reddit.com 접근을 막음. 그래서 [community] 반응은 언론에 실린 선수 트윗(OW2)만 있다.
