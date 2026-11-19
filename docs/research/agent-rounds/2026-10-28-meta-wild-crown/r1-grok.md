BRIEF와 PLAN을 먼저 읽고, [G] 영역 지시대로 E1–E8을 웹으로 검증하겠습니다.E1–E8을 공식 문서와 검색으로 각각 확인합니다.1차 검색은 끝났습니다. 공식 문서에서 수치와 조문을 대조합니다.E1–E8을 공식 문서와 검색으로 각각 확인했습니다. 아래는 [G] 규제·외부 사실 설계안입니다.

## 1. 네 영역의 설계안

**구조.** 랭크는 **숫자 Glicko-2 레이팅 + 신뢰구간(RD)** 만 공개한다. 상점 등급명(C/B/A/S)은 **외형 스킨에만** 붙인다. 코인은 **확정가 상점**(스킨·보드·VFX)만 산다. 확률 상자·강화·합성은 넣지 않는다. 채팅은 v1에서 끈다. 친구는 방 코드/초대 링크만. 계정은 나중, 게스트 진행은 로컬.

**왜.** 체스 사용자가 돈을 내는 대상은 카드팩이 아니라 **학습·분석·광고 제거**다(E8). FIFA식 랜덤 능력 카드는 벨기에에서 도박으로 분류됐고, 한국·Play는 유상 확률에 고지를 강제한다(E3·E4·E7). 서버 인력 없음 + 어린이 가능이면 가챠·공개 채팅이 가장 비싼 규제 부채다.

**E1 라이선스·알고리즘.** Lichess FAQ: Glicko-2, 시작 1500 ± 1000.  
https://lichess.org/faq  
구현은 한 판마다 갱신하는 변종(색 보정 포함). 교과서 “레이팅 기간 일괄”과 다르다.  
https://lichess.org/page/rating-systems · http://www.glicko.net/glicko/glicko2.pdf  
lila는 **AGPL-3.0**. 계산기는 2024년 scalachess(MIT)로 옮겼다. Glicko/Glicko-2 **알고리즘 자체는 퍼블릭 도메인**.  
https://github.com/lichess-org/lila · https://en.wikipedia.org/wiki/Glicko_rating_system  
권장: 퍼블릭 도메인 수식 + MIT 구현을 직접 쓰고, lila 코드를 복사하지 않는다.

**E2 표시.** Chess.com은 **시간대별 숫자 레이팅**을 Stats에 공개한다. 사이트 HUD의 공식 등급명은 없다. Class A/B/C는 USCF 설명용이다. GM/IM 등은 FIDE 타이틀 배지. Lichess 비교표는 Chess.com을 **Glicko-1**로 적는다.  
https://www.chess.com/terms/chess-ratings · https://lichess.org/page/rating-systems

**E3 한국.** 「게임산업진흥에 관한 법률」 확률 표시 **2024-03-22 시행**. 직·간접 유상 아이템이 대상. **완전 무상만 제외**. 무료 재화가 유료 재화와 바뀌면 유상. 무료 게임도 해당. 예외: 아케이드(청소년·일반게임제공업), 교육·종교 등급예외, **제작·배급·제공자 모두 3년 연평균 매출 1억 원 이하 중소기업**. 벌칙(미표시·거짓): 시정 후 2년 이하 징역 또는 2천만 원.  
https://www.korea.kr/news/policyNewsView.do?newsId=148926013 · https://www.korea.kr/news/policyNewsView.do?newsId=148924297

**E4 Play.** 가상화폐는 **구매한 앱 안에서만**. 루트박스: 구매 **직전·근접**에 확률 고지. 가족 정책: 아동 대상이면 **실제·시뮬레이션 도박 금지**, 가상코인과 현금 구분, 아동에게 관심기반 광고 금지. 소셜: 아동 자유형식 교환 전 안전 안내, 개인정보 교환 전 성인 인증, 보호자 제어. 익명/랜덤 채팅 앱은 아동 타겟 금지.  
https://support.google.com/googleplay/android-developer/answer/9858738 · https://support.google.com/googleplay/android-developer/answer/9893335?hl=ko

**E5 Supabase Realtime.** Free: 동시 **200**, **100 msg/s**, 월 **200만** 메시지. Pro(spend cap): 동시 **500**, **500 msg/s**. Pro no-cap/Team: 동시 10,000 · 2,500 msg/s. Pro **월 $25부터**(컴퓨트 크레딧 $10 포함). 초과: 메시지 $2.50/백만, 피크 연결 $10/1,000. Free는 1주 유휴 시 일시정지.  
https://supabase.com/docs/guides/realtime/limits · https://supabase.com/docs/guides/realtime/pricing · https://supabase.com/pricing

**E6 WebRTC.** TURN 없으면 대칭 NAT·기업망에서 실패한다. appear.in/Chrome 계열 공개치는 **중계 약 18–25%**(TURN 있으면 ICE 실패는 ~0.5%). 이용자망에 따라 0–50%. 무료 TURN: Metered Open Relay **월 20 GB**. Cloudflare TURN은 SFU와 쓰면 무료, 단독은 **$0.05/GB**.  
https://stackoverflow.com/questions/52485365/what-may-be-the-expected-percentage-of-connections-that-will-fallback-to-turn · https://www.metered.ca/tools/openrelay/ · https://developers.cloudflare.com/realtime/turn/ · https://bloggeek.me/webrtcglossary/turn/

**E7 FIFA.** 2018 벨기에 게임위원회: FIFA 18 등 유료 루트박스 = 불법 도박. 미준수 시 최대 €80만·5년, 미성년 관여 시 가중. EA는 2019-01 벨기에에서 FIFA Points 판매 중단. 네덜란드 €1,000만 과태는 2022 최고행정법원에서 취소(“독립 도박이 아니라 스킬 게임의 우연 요소”). **그대로 가져오면 안 되는 이유:** 랜덤 카드가 **경기력**을 바꾸고, 가상화폐로 현금 구매를 가리며, 어린이 도박 혼합으로 본다. 체스 랭크에 능력 카드를 넣으면 동일 공격면이 열린다.  
https://www.bbc.co.uk/news/technology-43906306 · https://www.eurogamer.net/ea-buckles-in-belgium-stops-selling-fifa-points-following-loot-box-gambling-pressure · https://www.eurogamer.net/eas-10m-dutch-fifa-loot-box-fine-has-been-overturned

**E8 수익.** Chess.com: 대전은 무료 무제한. 유료는 Gold/Platinum/Diamond — 퍼즐·레슨·광고제거·Game Review·코치 설명. 공식 선물가 **연 $49.99 / $79.99 / $119.99**. 대전이 아니라 **훈련·분석**에 돈을 낸다. Lichess: 비영리 기부(Patron). **기능은 전원 무료**, Patron은 날개 배지뿐.  
https://support.chess.com/en/articles/8562418-what-does-each-level-of-membership-get-me · https://www.chess.com/membership/gift · https://lichess.org/patron

**어린이 안전 최소선.** (1) v1 **자유 채팅 없음**. 프리셋 이모지만. (2) 닉네임: 욕설·사칭·광고 금지, 변경 1회. (3) 친구 = 방 코드/링크. 랜덤 매칭에 텍스트 없음. (4) 아동 타겟이면 Play 가족 정책: 시뮬레이션 도박 금지 → **유료 랜덤 보상 자체를 안 만든다**. (5) IAP가 생기면 Play Billing, 가상코인과 원화 병기, 보호자 승인. (6) 타겟층 선언을 거짓으로 쓰지 않는다.

**틀릴 수 있는 곳 셋.** ① 1인 개발이 매출 1억 예외에 오래 머문다는 가정 — 구글·애플이 제공자면 예외가 깨질 수 있다. 재 보지 않았다. ② TURN 18–25%는 2016–17 영상통화 표본. 한국 모바일 CGNAT는 더 높을 수 있다. ③ 중소기업 예외를 로컬·웹에도 쓸 수 있는지는 법률 자문을 받지 않았다.

**하지 않을 것.** 유료·혼합재화 가챠, 랭크에 능력 다른 기물, 익명 채팅, lila AGPL 레이팅 코드 복사, “A급 비숍이 더 멀리 간다”.

**가장 약한 결정.** 코인 IAP를 언제 열지. 증거(E8)는 **구독·분석**이지 카드팩이 아니다. 코인을 열면 E3 간접유상 범위가 상점 전체로 번진다.

## 2. 기획서 v0.3 과 충돌하는 곳

**[충돌 1] Phase 5 2주에 랭크·코인·상점을 넣으면 규제·Play 가족 심사가 같은 스프린트에 쌓인다**  
어디    §9 로드맵 Phase 5  
무엇을  "대전 · 출시 | 2주 | 멀티플레이 · PGN · 튜토리얼 · 모바일"  
왜      확률 고지·가상화폐 정책·아동 소셜 요건이 멀티플레이와 동시에 터진다  
고치는 법  메타는 Phase 5 뒤 별도 2~3주. 5는 초대 대전+PGN만  
확신도  높음

**[충돌 2] 커스텀을 “무료 N회 후 수요”로 두면, 나중에 코인과 섞이는 순간 한국 확률법이 상점 전체로 확장된다**  
어디    §10 표 #4  
무엇을  "로컬 큐 무료 N회 → 수요 후"  
왜      무상 골드가 유료 재화와 교환되면 “온전한 무상”이 아니다  
고치는 법  유료 재화와 무료 재화를 교환 불가로 분리. 랜덤 보상은 영구 제외  
확신도  높음

**[충돌 3] 팩 매니페스트에 확률·티어·소켓 필드가 없다**  
어디    §4.3  
무엇을  `"vfx": { "attack": "roar", "move": "dust" }, "sfx": { "attack": "lion_roar.ogg" }`  
왜      A급 비숍을 상점에 넣으면 표시·고지 필드가 매니페스트 밖에 생긴다  
고치는 법  `cosmeticTier`만 추가. `dropRate` 필드는 만들지 않는다  
확신도  높음

**[충돌 4] “총 12~13주”에 메타·법무가 없다**  
어디    §9 말미  
무엇을  "총 12~13주."  
왜      Play 12명×14일 비공개 테스트·계정 삭제·확률/결제 문구가 일정 밖으로 밀린다  
고치는 법  출시 전 법무·스토어를 로드맵 행으로 명시. 주 수는 재 보지 않았다  
확신도  중간

## 3. 통합자 가정("랭크는 외형만")에 대한 판정

**유지.** chess.js·Stockfish는 표준 규칙만 안다(§4.5). E7은 **능력 차이 카드 + 현금 랜덤**이 도박·약탈 과금으로 읽힌다. 랭크에 움직임이 다른 기물을 넣으면 엔진이 둘이 되고, 유료 카드는 벨기에형 공격면이 된다. 캐주얼 변형은 Phase 4 절차 재생기 이후에도 **비레이팅**으로 둔다.

## 4. 네 자료에서만 드러나는 것

- 체스 유료 품목은 스킨이 아니라 **퍼즐·레슨·리뷰**(Chess.com). Lichess는 기능을 팔지 않는다.  
- 한국법은 **무료 게임도** 간접 유상이면 확률 고지 대상.  
- Play 가족은 아동 앱에서 **시뮬레이션 도박 자체 금지** — 확률만 공개하면 끝나는 문제가 아니다.  
- TURN 없는 P2P는 대략 다섯 집 중 한 집이 실패한다. 무료 릴레이는 월 트래픽 캡이 있다.  
- Glicko-2 수식은 공짜, Lichess 서버 코드는 AGPL이라 복사하면 네트워크 대응 의무가 붙는다.

## 5. 우선순위 셋

1. **유료 랜덤·능력 카드를 열지 않는다** — 한국 표시의무·Play 가족 도박 조항·벨기에 FUT 선례가 한 번에 온다.  
2. **채팅·닉네임·친구를 닫힌 초대로 시작한다** — 아동 타겟이면 익명 채팅이 Play에서 막히고, 열린 채팅은 1인 운영이 감당 못 한다.  
3. **레이팅은 숫자 Glicko-2, 상점 등급은 외형 라벨** — FIFA식 “A급 비숍”을 능력으로 팔면 체스 본판이 무너진다. 사용자는 분석·꾸미기에 돈을 낸다.
EXIT=0 
