I'll start by reading the brief, then `docs/PLAN.md`, and verify rows E1–E7 against the live web.BRIEF is loaded. Next I’ll read the assigned PLAN.md sections, then verify E1–E7 on official pages.PLAN.md sections are in. I’ll verify E1–E7 on official sources next and keep literal quotes with URLs.Search hits are in. I’ll fetch the official GRAC, Play, Apple, and chess.com pages so quotes stay literal.Official pages are loading. I’ll pull the remaining GRAC, Apple, IARC, and product-display sources next.I still need official quotes for GRAC weapons, lichess/chess.com promotion, mixed-army apps, TFT pricing, and Korean labeling law.근거는 모두 가져온 페이지의 원문이다. 아래가 E1–E7 검증과 후보 판정이다.

## 1. 깨뜨린 것

[결함 1] §14.4 검 체크·메이트 연출은 GRAC 전체이용가「단순한 폭력」과 Apple 4+를 동시에 넘는다.
어디    PLAN.md §14.4 「왕 목에 검 끝」「하늘 베기 · 화면 2분할」「판 전체 흔들리고 왕 모자 날아감」
왜      GRAC 공식 표는 전체이용가 폭력을 「폭력, 혐오, 공포 등의 요소가 단순하게 표현」로만 허용한다. Apple은 칼을 「Guns or Other Weapons」에 넣고, 그 항목은 4+ 정의에 없으며 9+부터 「Infrequent guns or other weapons」다. 동물+검 베기·목 겨냥은 설문이 정직하면 한국 12세·iOS 9+(빈도에 따라 13+)로 간다.
근거    "폭력, 혐오, 공포 등의 요소가 단순하게 표현" (https://www.grac.or.kr/Institution/EtcForm01.aspx) · "단순한 폭력 표현" (https://www.grac.or.kr/Institution/RatingCasebooks.aspx) · "Guns or Other Weapons: References to or depictions of guns, weapons, or objects that may cause bodily harm. May include: guns, swords, or knives." / "9+ … Infrequent cartoon or fantasy violence / Infrequent guns or other weapons" / "4+ … contain no objectionable material" (https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)
고치는 법 출시 무기에서 검·망치·활을 뺀다. 체크는 「왕 목」 겨냥을 삭제한다. 남기면 당근검·맨몸만.
확신도  높음

[결함 2] Play 「아동 대상」선언과 §14.4 무기 잡기는 Families 폭력 조항과 IARC 최저등급을 동시에  Mil다.
어디    §14.4 무기 4종 · §12.5 「아동 타겟 선언을 거짓으로 쓰지 않는다」
왜      Families는 아동이 보는 내용이 「appropriate for children」이어야 하고, 위반 예시에 「violence, gore, or shocking content not appropriate for children」가 있다. IARC/ESRB E는 「minimal cartoon, fantasy or mild violence」까지, PEGI 3는 「comical context」이며 「real life characters」와 구별돼야 한다. 검·망치 충격파·왕 모자 날아감은 PEGI 3의 Tom&Jerry 선을 넘기 쉽다. 아동 대상으로 올리면 Families SDK·광고 규칙까지 붙는다.
근거    "Your app's content that is accessible to children must be appropriate for children." / "Apps that include violence, gore, or shocking content not appropriate for children." (https://support.google.com/googleplay/android-developer/answer/9893335) · "May contain minimal cartoon, fantasy or mild violence" / "Some violence in a comical context (typically cartoonlike - Bugs Bunny or Tom & Jerry - forms of violence) is acceptable. A child should not be able to associate the character on the screen with real life characters" / "Some violence in a comical or fantasy context is acceptable." (https://support.google.com/googleplay/answer/6209544)
고치는 법 출시 타깃을 「전연령 가능, 아동 전용 아님」으로 고정한다. 무기 VFX는 설문 재작성 후에만 넣는다.
확신도  높음

[결함 3] Play 자체등급은 IARC 설문이고, 무기 이펙트를 나중에 넣으면 설문을 다시 안 내면 허위등급이 된다.
어디    §14.9 「Phase 3 에 무기 4종 이펙트」· §4.3 v0.6 무기 필드
왜      한국 Play 게임 등급은 GRAC 승인으로 표시된다. 개발자는 GRAC 창구가 아니라 Play Console IARC 설문을 채운다. 「If you make changes to your app content or features that affect the responses to the rating questionnaire, you must submit a new content rating questionnaire」. 오답은 삭제·정지. 자체등급분류는 「지정 받은 사업자가 … 자체적으로 등급분류」하는 제도라 Play 경로에 적용된다. 무기 추가를 Phase 3 리스크로만 적으면 등급 재설문·재표시가 빠진다.
근거    "In South Korea, ratings have been approved by the Game Rating Administration Committee (GRAC)." (https://support.google.com/googleplay/answer/6209544) · "문화체육부장관으로부터 지정 받은 사업자가 등급분류기준 또는 게임물관리위원회와 협약한 별도의 기준에 따라 서비스 하는 게임물을 자체적으로 등급분류를 하는 것" (https://www.grac.or.kr/Institution/AutonomicGradePlan.aspx) · "If you make changes to your app content or features that affect the responses to the rating questionnaire, you must submit a new content rating questionnaire in the Play Console." / "Misrepresentation of your app's content may result in removal or suspension" (https://support.google.com/googleplay/android-developer/answer/9898843)
고치는 법 Phase 3 완료 조건에 「IARC 설문 재제출 + GRAC 배지 재확인」을 넣는다. 무기 없이 출시하면 설문은 출시 클립 기준으로 한 번만.
확신도  높음

[결함 4] 승급=진화 화면은 체스 표준 자동퀸과 충돌하고, 초읽기에서 시계를 깨뜨린다.
어디    §14.1 「선택 화면이 곧 진화 화면」· 빛 기둥·털갈이·포효
왜      chess.com 공식은 자동퀸이 「save crucial seconds in bullet games」라고 적는다. 언더프로모션은 ALT. lichess 원문은 「Promote to Queen automatically」이고 「Hold the ctrl key while promoting to temporarily disable auto-promotion」. 진화 연출을 선택 UI에 붙이면 블리츠에서 플래그·언더프로모션 상실이 난다. 어린이용으로 화면을 길게 만들수록 시계 손실이 커진다.
근거    "When auto-queen is enabled, any time you move a pawn to the final rank, it will automatically promote to a queen. This can save crucial seconds in bullet games!" / "hold down the ALT key" (https://support.chess.com/en/articles/8614542-what-is-auto-queen-and-how-do-i-enable-it) · "Promote to Queen automatically" / "Hold the <ctrl> key while promoting to temporarily disable auto-promotion" (https://raw.githubusercontent.com/lichess-org/lila/master/translation/source/preferences.xml)
고치는 법 대국 중 승급은 1탭/자동퀸. 진화 연출은 대국 후 리플레이 또는 건너뛰기 기본.
확신도  높음

[결함 5] 「상대도 자기 군단으로 온다」는 체스 앱 표준과 반대이고, 대국 중 혼합 군단을 상대 화면에 보여주는 공식 선례를 못 찾았다.
어디    §14.1 「상대도 자기 군단으로 온다」
왜      chess.com 공식은 보드·기물을 **내** 설정으로 고른다. 상대 테마는 대국 시작 「brief animation」으로만 보여 주고, 본 대국 화면은 내 기물 스타일이다. 찾아본 범위: chess.com Help 3페이지, lichess preferences, Play/App Store 「army customization」검색(Super Style Chess 스토어 페이지 404). 같은 역할·다른 모델을 상대 화면에 실시간으로 그리는 표준 체스 공식 문서는 없다.
근거    "you can customize your board color, choose your preferred piece style, and change the background." (https://support.chess.com/en/articles/8594320-how-do-i-change-my-background-board-and-pieces) · "At the start of each new live chess game, a brief animation plays, showing their board and pieces, league division, and any flair they have." (https://support.chess.com/en/articles/9090964-what-are-the-board-animations-on-chess-com)
고치는 법 상대 화면 기본값은 표준 실루엣(§10-15을 기본 켬으로). 혼합 군단은 내 화면·입장식 10초에만.
확신도  높음

[결함 6] 「더 강해 보인다」·단계명 전사/전설은 표시광고법상 전체 인상 오인에 해당할 수 있고, 외형 전용 공정위 사례는 못 찾았다.
어디    §14.2 제목 「같은 강아지인데 더 강해 보인다」· 3 전사 가죽갑옷 · 4 전설 오라
왜      표시광고법 제3조는 「소비자를 속이거나 소비자로 하여금 잘못 알게 할 우려」를 금지한다. 시행령은 거짓과장을 「사실과 다르게」또는 「지나치게 부풀려」, 기만을 「은폐하거나 축소」로 정의한다. 공정위 2018은 전자상거래법 제21조 제1항 제1호로 확률 과장에 과징금을 매기며 「소비자의 구매 선택에 중요한 영향을 미칠 수 있는 정보」는 오인되지 않게 표시할 책임이라고 했다. 「전설」갑옷·오라에 작은 각주 「이동 규칙 동일」만 두면, 사실 일부가 맞아도 전체 인상은 능력 상승이다. 외형만 강해 보여 적발된 공정위 사례는 이번 검색에서 못 찾았다.
근거    "소비자를 속이거나 소비자로 하여금 잘못 알게 할 우려가 있는 표시ㆍ광고 행위" (https://www.law.go.kr/LSW/lsSideInfoP.do?lsiSeq=268659&joNo=0003&joBrNo=00&docCls=jo&urlMode=lsScJoRltInfoR) · "거짓ㆍ과장의 표시ㆍ광고는 사실과 다르게 표시ㆍ광고하거나 사실을 지나치게 부풀려 표시ㆍ광고하는 것으로 한다." / "기만적인 표시ㆍ광고는 사실을 은폐하거나 축소하는 등의 방법으로 표시ㆍ광고하는 것으로 한다." (https://www.law.go.kr/LSW/lumLsLinkPop.do?lspttninfSeq=65001) · "소비자의 구매 선택에 중요한 영향을 미칠 수 있는 정보의 경우에는 소비자가 오인하지 않도록 표시할 책임이 있음을 분명히 하였다" / "적용 법조는 전자상거래법 제21조 제1항 제1호입니다." (https://www.korea.kr/news/policyNewsView.do?newsId=156261741)
고치는 법 단계명에서 전사·전설·강하다를 뺀다. 구매·성장 화면 제1문장을 「외형만 · 수는 같음」으로 고정한다.
확신도  중간(법 조문은 높음, 외형 전용 사례는 없음)

[결함 7] 외형만 유료 진화의 선례(TFT 스타 샤드)는 있으나, 그 언어도 보드의 「별=능력」과 겹친다.
어디    §14.2 성장 4단계 · §14.1 승급=진화
왜      Riot 공식은 Little Legend를 Star Shard로 레벨업하며, 번들은 「starting from 625 RP」, Rare 100 / Epic 125 / Legendary 150, Pass+는 1295 RP. 아바타라 대전 규칙과 무관하다. 같은 게임 보드의 3성은 능력이다. §14가 「진화」「전설」을 기물 승급·성장에 쓰면 TFT와 같은 언어 충돌이 난다. 유료 외형 진화 자체는 선례가 있으니 「못 판다」가 아니라 「이름을 능력 언어에서 떼라」가 맞다.
근거    "you'll be able to level up your Little Legends by purchasing Star Shards." / "Star Shards will be available for purchase in bundles starting from 625 RP." / "It'll take 100 Star Shards to upgrade Rare Little Legends … 125 Star Shards to upgrade Epic … and 150 Star Shards to upgrade Legendary" / "upgrade your Pass to the Pass+ for 1295RP" (https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/tft-fates-pass-and-more/)
고치는 법 성장 단계를 털색·리본·흉터처럼 능력과 무관한 단어로만 판다.
확신도  높음

## 2. 출시 후보 판정

| 후보 | 판정 | 한 줄 이유 | 수정이면 어떻게 |
| :--- | :--- | :--- | :--- |
| A | 수정 | 혼합 군단을 상대 화면에 넣는 선례가 없고, 진화 화면은 자동퀸 표준을 깨뜨린다. | 폰 배우 3종은 내 화면만. 상대는 표준 실루엣 기본. 승급은 1탭/자동퀸, 진화는 대국 후. |
| B | 보류 | 검·망치·활은 Apple 9+·GRAC 「단순 폭력」선을 넘긴다. 출시 연령을 올리는 비용이다. | — |
| C | 보류 | 방패 파괴·캐슬링 방패벽도 무기·피격 연출이라 B와 같은 등급 설문을 탄다. | — |
| D | 보류 | 「포크 무기」는 Apple weapons, 「전사/전설」훈장은 표시 오인. 성장축을 출시에 얹지 마라. | — |
| K | 채택 | 출시 기본은 v0.5. A 수정분만 Phase 2 뒤에 붙인다. | — |

## 3. 통합자가 못 본 것

Play 한국 게임 등급은 GRAC 창구 신청이 아니라 IARC 설문이다. 무기 VFX를 Phase 3에 끼우면 설문을 다시 내야 하고, 안 내면 허위등급이다. Apple 4+ 정의에는 cartoon violence와 swords가 없다. 9+부터다. 표시광고법의 「보통의 주의력을 가진 일반 소비자」기준은 7세 오인을 직접 구제하지 않는다. 외형=능력 오인 전용 공정위 처분은 못 찾았다. TFT 샤드는 외형 유료 진화의 가격 구조(625 RP~)를 증명하지만, 별/전설 언어는 능력과 겹친다.

## 4. 가장 약한 결정 하나

검·망치·활 코믹 잡기(피 없음)가 전체이용가·iOS 4+에 남는가. §14.9는 오해만 적었고 등급 숫자는 없다.

재는 방법: 맨몸 포효 / 당근검 / 검「왕 목」클립 세 장을 만들어 Play IARC 설문과 App Store Connect 연령 설문을 각각 제출한다. 나온 GRAC·ESRB·PEGI·Apple 배지를 표로 붙인다. 검이 4+/ALL이 아니면 B는 출시에서 뺀다.
EXIT=0 
