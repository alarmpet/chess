# 랭커 보상 조사 — 인기 게임은 랭크 상위자와 참여자에게 무엇을 주나 (2026-11-10)

사용자 요청: 「랭커 보상은 어떤 것들이 있는지? 인기 게임 자료 조사해 보고 우리 게임은 어떻게 적응하면 좋을지 계획서 작성해 봐」.
쓰인 곳: [랭커 보상 계획서](../../plans/2026-11-10-ranker-rewards-plan.md). 앞선 조사: [랭크 시스템·심리(11-09)](../2026-11-09-ranking-psychology/README.md).

## 방법

- 조사원(같은 모델의 하위 에이전트) 셋이 영역을 나눠 웹을 조사했다. 실제로 연 페이지의 문장만 인용하게 했다.
  - [A 경쟁 게임](A-competitive.md): LoL · VALORANT · Overwatch 2 · Apex · Rocket League · Fortnite · Marvel Rivals
  - [B 모바일·캐주얼](B-mobile.md): Clash Royale · Brawl Stars · Hearthstone · Clash of Clans · Pokémon GO · Pokémon UNITE · 쿠키런: 킹덤 · 카트라이더 · Mario Kart Tour
  - [C 체스·학습 앱 · 부작용 · 규제](C-chess-ethics.md): lichess(소스 코드 확인) · Chess.com · ChessKid · Duolingo, 순위표 연구 9편·아이 연구 4편, EU DSA 지침 · 영국 ICO · Google Play · Apple · 한국 게임산업법
- 통합자는 계획의 결정에 쓰는 주장 12개를 **다른 하위 에이전트로 원문 대조**했다. **12/12 맞음**(아래 표).
- 한계: 셋 다 같은 모델이다. 인용은 요약 도구를 거쳐 뽑았으므로, 아래 12개 밖의 인용은 한두 단어가 다를 수 있다. 레딧은 쓰지 않았다. 쿠키런·카트 드리프트·UNITE·Rocket League Top 100·Fortnite 보상은 공식 원문을 못 찾았다(각 파일 끝 목록).

## 원문 대조 (2026-11-10)

| # | 주장 | 판정 · 원문(20단어 미만) |
| :-- | :-- | :-- |
| 1 | LoL: 금 도달 보상이면 금 찍고 멈춘다 | 맞음(2022-12-06) "players on the skill threshold between Gold and Silver will often stop playing once they hit Gold." |
| 2 | LoL 2025: Victorious 스킨 = 한 시즌 랭크 15승, 이유는 「시간에 보상」 | 맞음(2024-11-25) "We want to reward you for your time in Ranked in each Season" |
| 3 | Riot: 대리로 얻은 보상 회수, 조작 계정 296,416개 처리(LoL+VALORANT) | 맞음(2026-09-17) "ranked rewards that were gained by the “booster” are revoked." |
| 4 | OW: Jade 무기는 최고 등급이 아니라 참여량 | 맞음(2024-02-08) "reflect your dedication to Competitive Play in 2024, not your highest rank achieved." |
| 5 | VALORANT 순위표: 50판 이상 · 7일에 1판 | 맞음(2021-01-12) "Requires playing at least 1 Competitive game a week" |
| 6 | Marvel Rivals: 반 시즌 리셋을 「압박」 때문에 취소 | 맞음(2025-02-11) "the pressure associated with having a rank reset every half-season" |
| 7 | Clash Royale 2025: 소수만 닿는 리그에 묶인 재화를 아래로 | 맞음(2025-06-28) "locked in high-ranked Leagues, which only a small percentage of players reached." |
| 8 | Brawl Stars 2026-11: 승부 조작 계정 4,000개 넘게 정지 | 맞음(2026-11-03) "We also banned 4.000+ accounts that are involved in win-trading." |
| 9 | Hearthstone: 시즌 카드 뒷면 = 어느 등급이든 5승, 즉시 | 맞음(2020-03-17) "Five wins at any rank will also award the seasonal card back immediately" |
| 10 | Chess.com 리그: 50명 무리, 강등 없음 | 맞음 "There are no demotions!" |
| 11 | ChessKid: 트로피는 1~3위(8명 이하면 1위만), 별은 줄지 않음 | 맞음 "Stars are never lost or deducted; they only increase!" |
| 12 | EU DSA 미성년자 지침: streak 기본 끔, 반복 행동 가상 보상 노출 금지 | 맞음(C(2025) 6826) "the creation of virtual rewards for performing (repeated) actions on the platform." |

## 무엇을 배웠나 (번호는 계획서에서 ⓐ… 로 부른다)

ⓐ **랭커 보상은 다섯 겹이다.** 대부분의 게임이 아래 다섯을 섞는다.

| 겹 | 누구에게 | 예 |
| :-- | :-- | :-- |
| 참여 기념 | 시즌에 조금이라도 둔 사람 | Hearthstone 5승 카드 뒷면, 쿠키런 참여 프로필 사진, LoL 15승 스킨 |
| 등급 도달 | 그 등급에 닿은 사람 | VALORANT 액트 배지, LoL 크로마·테두리, 우리 L-4 테두리 |
| 첫 도달 기념(영구) | 처음 닿았을 때 한 번 | Brawl Stars 등급 첫 도달 아이콘·핀, Clash Royale 길 보상 |
| 상위 N명 | 순위표 꼭대기 | OW Top 500 칭호, VALORANT Radiant, Hearthstone 전설 번호, lichess Top 10 트로피 |
| 작은 무리 1등 | 무리 안 순위 | Mario Kart Tour 20명 무리, Chess.com 50명 리그, Duolingo 30명 리그 |

ⓑ **보상의 축이 「도달」에서 「참여」로 옮겨 갔다.** ✅1·2·4. LoL 은 금 도달 → Split Point → 15승으로 바꿨고, OW 는 무기를 참여량으로 줬다. 「찍고 멈춤」을 개발사가 직접 문제로 적었다.

ⓒ **재화는 아래로, 꼭대기에는 숫자·배지만.** ✅7. Clash Royale 은 꼭대기에 묶인 재화를 아래로 옮겼다. Hearthstone 전설의 재화는 다이아 10 과 같고, 대신 순위 번호를 준다.

ⓓ **상위 N명 보상은 「안 두고 지키기」와 부계정을 부른다 → 활동 조건으로 막는다.** ✅5. VALORANT 50판·7일 1판, lichess 30판·지난 1주 한 판. lichess 는 순위 트로피를 「지금 순위」로 매번 그려, 빠지면 사라진다.

ⓔ **보상이 크면 대리·짜고 치기·계정 매매가 따라온다.** ✅3·8. Riot 은 보상 회수와 영구 정지까지 갔다. Chess.com 은 상품이 샌드배깅의 동기라고 직접 쓴다. → 보상 크기 자체를 작게 두는 것이 가장 싼 방어다.

ⓕ **압박을 줄이는 쪽으로 되돌린다.** ✅6. Marvel Rivals 는 리셋 압박 때문에 하루 만에 계획을 취소했다. Chess.com 리그는 강등이 없다(✅10). 「놓치면 끝」인 기간 한정 보상은 압박이 된다.

ⓖ **모두가 받는 줄지 않는 보상 + 소수만 받는 상.** ✅11. ChessKid 는 트로피(1~3위)와 별(누구나, 줄지 않음)을 나눴다. Chess.com 은 메달(1~3위)과 업적(누구나)을 나눴다.

ⓗ **상징 보상은 일한다. 값이 아니라 「인정」이다.** ◐ Kosfeld & Neckermann 2011(축하 카드로 약 12% 더 일함), Gallus 2017(위키백과 신입에게 무작위 상징 상 → 잔류 증가). 논문 초록 수준 확인.

ⓘ **순위표는 양을 늘리지만 내적 동기는 늘리지 않는다.** ◐ Mekler · Hanus & Fox · Barankay · Garcia & Tor(경쟁자가 많을수록 의욕 감소). 「상위 10% 밖이면 포기」를 숫자로 보인 단일 연구는 찾지 못했다.

ⓙ **아이 규제는 「순위」보다 「몰입 장치·돈·소셜」을 본다.** ✅12. DSA 는 streak 과 반복 행동 가상 보상을, ICO 는 「안 하면 손해」 문구를, Play·Apple 은 광고·구매·소셜을, 한국 법은 현금성 경품·환전을 본다. 「leaderboard」를 직접 금지한 문장은 다섯 곳 어디에도 없었다. 한국에서 랭크 보상이 「경품」인지에 대한 게임물관리위원회 해석은 찾지 못했다(법률 자문 아님).

## 버린 것 · 보류

- **쿠키런 킹덤식 꼭대기 재화 격차(10배 이상):** 아이 게임이라도 따라 하지 않는다(ⓒ·ⓔ).
- **유료 트랙에 랭크 겉모습 묶기(Brawl Stars Pro Pass):** 실력 표시의 의미가 흐려지고 아이에게 구매 압박이 된다.
- **확률 상자를 랭크 보상으로:** Brawl Stars 도 확정 트랙으로 바꿨다. 카드 주머니와 랭크 보상은 분리한다.
- **보상 회수:** 아이에게 상처가 크다. 처음부터 못 얻게 하는 쪽(R-4 두 사람 서명·상한)으로.
- **Rocket League Top 100 칭호, Marvel Celestial 의상, 엘리트주의에 대한 공식 문장:** 찾지 못했다. 인용하지 않는다.
