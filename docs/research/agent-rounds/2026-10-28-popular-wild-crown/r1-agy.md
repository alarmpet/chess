## 1. 자료에서 본 인기 요소 표

| 게임 | 요소 | 자료 인용(글자 그대로) | 체스(랭크) 이식 | 야생 모드 이식 |
| :--- | :--- | :--- | :--- | :--- |
| **Chess Evolved Online** | 기물 수집 및 맞춤형 아미 빌딩 | "Collect new chess pieces, create custom armies, and play against others in live multiplayer PvP, ranked or practice." (스토어) | 불가 (표준 chess.js 규칙 파괴 및 가위바위보 상성 붕괴) | 높음 (비레이팅 환경에서 자유 조합의 깊은 전략 제공) |
| **Chessarama** | 디오라마 아트와 체스 퍼즐화 | "Unique art style, with beautiful dioramas;" (스토어) | 중간 (외형 세트는 가능하나 시각적 패턴 인지 방해 위험) | 높음 (캠페인/퍼즐 미니게임에 완벽히 부합) |
| **Shotgun King** | 킹 무기 교체 및 런 내 양방향 강화 | "After each floor, you may choose between two random combinations of one upgrade for you and one upgrade for the other side." (스토어) | 불가 (비대칭 파괴적 무기는 체스 동등성 훼손) | 높음 (PvE 챌린지 모드의 로그라이크 업그레이드로 매력적) |
| **Pawnbarian** | 체스 기물 카드화 및 런 내 카드 업그레이드 | "• Upgrading your cards can add a lot of flexibility and strategy" (`R7 · Recommended · 7.1 hrs on record · 30 people found this review   · 27 September, 2021`) | 불가 (패 드로우 RNG와 덱은 표준 대전 성립 불가) | 높음 (카드 핸드 기반 미니 던전 퍼즐로 분리 이식 가능) |
| **5D Chess** | 시공간 차원 이동 분기 | "Perfect for chess novices, because even if you play against an expert, they're just as confused as you are." (`R3 · Recommended · 5.5 hrs on record · 1,678 people found this review   · 26 July, 2020`) | 불가 (엔진·연산 복잡도 폭증 및 극심한 두뇌 피로) | 낮음 (1인 개발 기술 범위 및 체스판 범위 초과) |
| **Chess Ultra** | 사실적 3D 비주얼과 환경/기물 세트 | "Stunning chess sets and beautiful environments" (스토어) | 높음 (표준 규칙 보존하며 시각적 만족감 극대화) | 높음 (외형 에셋 공유 가능) |
| **Chessplosion** | 기물 이동 궤적의 폭발 무기화 | "combining bomberman's pace with the spatial awareness of chess is fantastic" (`R10 · Recommended · 1.7 hrs on record · 5 people found this review   · 21 September, 2021`) | 불가 (실시간 액션 메커니즘으로 턴제 체스와 양립 불가) | 중간 (체스 기물 이동 지식을 활용한 아케이드 보너스 모드) |
| **Dota Underlords** | 외형 전용 배틀패스 및 기물 3합 승급 | "The paid Battle Pass is not required to play the game, nor does it provide any gameplay specific advantage." (스토어) | 배틀패스: 높음 (공정성 유지) / 3합: 불가 (말 수 불일치) | 배틀패스: 높음 / 3합: 높음 (라운드제 합성 규칙 도입) |
| **Auto Chess** | 시너지 라인업 및 보드/스킨 치장 | "Cosmetics: Boards, skin pieces, effects, and much more. This game does very well on this side." (`R1 · Recommended · 783.4 hrs on record · 46 people found this review   · 19 May, 2023`) | 높음 (외형 치장품은 랭크와 완벽 호환) | 높음 (동물 종족·서식지 시너지 결합 가능) |

---

## 2. §12 에 가져올 것

[채택 1] 첫 수 미착수 및 대전 시작 전 잠수(AFK) 인질극 방지 타임아웃 규정 신설
어디: §12.1
근거: "Visually Great , mechanics are solid . Online gameplay is trash , People are always afking at the start of a match to get you to quit so they gain free elo. There are no turn timers / timeouts so you can literally afk for 24 hours and make the player quit and get a free W" (`A-chess-ultra.md`, `R4 · Not Recommended · 11.6 hrs on record · 61 people found this review   · 18 July, 2021`)
바꾸는 문장: 방 입장 후 백/흑 양측 모두 첫 수를 60초 내에 착수하지 않으면 경기를 무효화(레이팅 변동 없음)하거나 미착수자를 몰수패 처리하여 상대방을 인질로 잡고 무료 승수를 파밍하는 잠수 어뷰징을 원천 차단한다.
확신도: 높음

[채택 2] 상대 기물 외형 판독성 저하를 방지하는 '기본 기물 강제 표시' 로컬 토글 옵션 신설
어디: §12.3
근거: "You can play a chess match against the AI (great!) but it picks a random chess set to use, messing up your pattern recognition." (`A-chessarama.md`, `R8 · Recommended · 18.3 hrs on record · 7 people found this review   · 27 December, 2023`)
바꾸는 문장: 상대가 착용한 화려한 외형(A/S등급) 기물 세트가 플레이어 본연의 수읽기 및 패턴 인지(pattern recognition)를 방해하지 않도록, 설정에서 '내 화면에는 상대 기물도 클래식/표준 실루엣으로 고정 표시' 토글 옵션을 제공한다.
확신도: 높음

[채택 3] 게임플레이 우위가 전무한 외형 중심 배틀패스/진행 보상 원칙 명문화
어디: §12.2 및 §12.3
근거: "The paid Battle Pass is not required to play the game, nor does it provide any gameplay specific advantage." (`A-dota-underlords.md`, 스토어 원문)
바꾸는 문장: 레벨업 및 향후 시즌 패스 보상은 보드 테마, 동물 기물 외형, 등장/승리 모션, 말풍선 이모지로만 구성하며, 어떠한 경우에도 게임플레이에 유리한 능력치를 일절 배제한다.
확신도: 높음

[채택 4] 반복 연출 피로 방지를 위한 애니메이션 배속/간소화 옵션 제공
어디: §12.3
근거: "The Dragon Slayers Campaign is tedious having to watch an unskippable (same) animation after every move." (`A-chessarama.md`, `R6 · Not Recommended · 33.2 hrs on record · 8 people found this review   · 18 March`)
바꾸는 문장: A/S등급 공격·사냥 연출이 장기전에서 피로를 주지 않도록 설정에 연출 2배속 또는 핵심 프레임 즉시 재생(Fast Animation) 옵션을 두고, 타이머가 급한 종반전에는 자동으로 연출 길이를 단축한다.
확신도: 높음

---

## 3. 가져오지 말 것

[거부 1] 랭크 대전 내 맞춤형 군대(기물 커스텀 빌딩) 및 능력 기물 도입
어디: §12.3 및 §10-10
근거: "you eventually get to a level where, at the highest rankings (I am currently in the top 50 as of this review, rank ~4400), you are forced to play only the most boring stally armies or lose a lot of rating because of effective RNG where other armies hard-counter your pieces." (`A-chess-evolved-online.md`, `R7 · Recommended · 2,226.8 hrs on record · 38 people found this review   · 24 February, 2021`)
왜 안 되는가: 체스에 능력 기물을 섞으면 고랭크에서 하드카운터 가위바위보와 지루한 정체 덱만 강요되며, 1인 개발 환경에서 기물 밸런스 붕괴와 Stockfish/chess.js 엔진 불일치를 감당할 수 없다.
확신도: 높음

[거부 2] 유료/재화 소모형 랭크 점수 보호권 (Insurance Card) 도입
어디: §12.2 및 §12.4
근거: "Insurance cards: allows you to not lose any points if you had a bad ranked game, does cost you in game currency" (`A-auto-chess.md`, `R1 · Recommended · 783.4 hrs on record · 46 people found this review   · 19 May, 2023`)
왜 안 되는가: 재화로 패배 점수 하락을 방어하는 순간 순수 실력 지표인 Glicko-2 레이팅의 신뢰도가 파괴되고 P2W 비판(N8 "IMBA, pay to win")을 사며, 어린이 유저층에게 불공정성을 학습시킨다.
확신도: 높음

[거부 3] 다단계 화폐 교환 및 상자-열쇠 파밍 경제 구조 (복합 통화 루프)
어디: §12.4
근거: "You collect biscuits to unlock chests, chests require keys to open. Donuts buy keys. You can also sell chests for bazaar coins, bazaar coins can buy skins that you can sell for more bazaar coins, but not donuts. Donuts can be bought with real moneys. Real moneys cannot buy biscuits though. Then you also need chess fragments, of various types, to convert into chess board items. Which also can be sold for bazaar coins!" (`A-auto-chess.md`, `R3 · Recommended · 21.7 hrs on record · 21 people found this review   · 20 July`)
왜 안 되는가: 비스킷-도넛-열쇠-상자-코인으로 얽힌 다중 재화 환전은 유저에게 사기 피로감을 유발하며, 한국 확률형 아이템 법규 및 구글 가족 정책(시뮬레이션 도박 금지)에 정면 충돌한다.
확신도: 높음

[거부 4] 보드 전장에 직접 개입하는 제3의 독립 보스 유닛 (Underlords 유닛) 도입
어디: §12.3 및 §10-10
근거: "With Riot games adding vanguard to league of legends which is basically a root kit. Now would be a perfect time to revive underlords and remove the underlord units that killed the game. Your move Valve!" (`A-dota-underlords.md`, `R10 · Recommended · 362.3 hrs on record · 106 people found this review   · 2 May, 2024`)
왜 안 되는가: 기존 체스 기물 체계를 흔드는 강력한 외부 지휘관 유닛의 필드 등장은 직관적인 수싸움을 망가뜨리고 유저 이탈을 초래한다.
확신도: 높음

---

## 4. "진화" 와 "카드 덱" 을 WILD CROWN 에 넣는 안

### 1) 랭크(외형만)에서의 모습
- **진화**: 기물 숙련도에 따른 **외형적 성체 진화(Visual Progression)**. 미어캣(폰)이나 사자(킹)로 판수와 캡처 조건을 달성하면 기물 스탯은 100% 동일하되 [새끼 동물 → 성체 야수 → 우두머리 야수]로 외형 털 텍스처, 장식, 승리 댄스 연출이 화려해짐 (§12.2 등급 뱃지와 연동).
- **카드 덱**: 능력 카드가 아닌 **"치장 프리셋 덱(Cosmetic Deck)"**. 대전 진입 전 [사냥 모션 팩, 체크 포효 사운드, 폰 승급 연출, 승리 팡파르, 퀵 이모지] 5종을 한 세트로 묶어 덱처럼 장착.
- **틀릴 수 있는 곳**: 외형 진화와 치장 이펙트가 너무 과해지면 기물의 고유 실루엣을 해쳐 체스판의 패턴 인지(pattern recognition)를 심각하게 왜곡할 수 있음.

### 2) 야생 모드(Phase 6, 비레이팅)에서의 모습
- **진화**: 오토체스식 **"3합 승급(3-Star Synthesis) 및 야생 돌연변이"**. 동일 기물 3마리가 생존하거나 특정 라운드를 넘기면 2성/3성으로 진화하여 체력 증가, 도약 거리 확장(예: 폰이 대각선 2칸 돌진), 인접 칸 충격파 등 액티브/패시브 스킬 획득.
- **카드 덱**: 폰바리안/샷건킹식 **"전술 기동 카드 덱(Action Deck)"**. 매 턴 무작위 카드 2장을 뽑아 기물 이동에 특수 효과(예: "나이트 지진 공격", "킹 샷건 1회 발사")를 부여하는 비대칭 로그라이크 덱빌딩 모드.
- **틀릴 수 있는 곳**: Stockfish와 chess.js가 비표준 규칙을 전혀 해석하지 못하므로, 야생 모드 전용의 별도 규칙 엔진 및 AI 워커를 밑바닥부터 구현해야 해 1인 개발 리소스가 고갈될 수 있음.

---

## 5. 통합자 가정 판정

**판정: 유지**

**근거**:
1. Chess Evolved Online 자료에서 명백히 드러나듯, 랭크 체스에 기물 능력과 덱 구성을 넣은 결과 "forced to play only the most boring stally armies or lose a lot of rating because of effective RNG where other armies hard-counter your pieces" (`A-chess-evolved-online.md`, R7)라는 극단적인 상성 불쾌감과 P2W 인식(N1)이 발생해 대전 생태계가 완전히 파괴되었다.
2. Dota Underlords에서도 본연의 체스 기물 외에 능력 유닛(언더로드)을 투입했다가 유저들의 극심한 반발을 사고 게임이 쇠락했다 (`A-dota-underlords.md`, R10 "remove the underlord units that killed the game").
3. 체스 랭크 대전의 핵심은 규칙의 불변성과 실력의 동등성이다. 따라서 랭크에서는 철저히 외형과 뱃지만 진화시키고, 능력 진화와 카드 덱은 비레이팅 야생 모드(Phase 6)로 격리해야 한다는 통합자의 가정은 스팀 덤프 데이터와 완벽히 합치한다.

---

## 6. 네 자료에서만 드러나는 것

1. **체스 게이머의 2대 역린: '패턴 인지(Pattern Recognition) 방해'와 'AFK 인질극(Stalling Gambit)'**:
   - 고품질 4K 그래픽(Chess Ultra)이나 귀여운 디오라마(Chessarama)를 갖춰도, 상대 기물 스킨이 너무 이질적이면 한눈에 전장을 읽는 '패턴 인지'가 깨져 플레이어가 격분한다 (`A-chessarama.md` R8 "picks a random chess set to use, messing up your pattern recognition").
   - 또한 타이머 시작 전 첫 수를 두지 않고 고의 잠수타서 상대가 기권할 때까지 방치하는 인질극(`A-chess-ultra.md` R4, R7, R10)은 온라인 체스 경험을 한순간에 파탄 낸다.
2. **체스 공간에 특수 능력이 들어가면 '1턴 메이트'와 '우주방어(Stall) 정체'라는 극단값만 남는다**:
   - `A-chess-evolved-online.md`에서 드러나듯(R3 "Turn one checkmate was once possible", R7 "boring stally armies"), 체스의 좁은 64칸 판 위에 원거리·마법 능력이 결합되면 상호작용 불가능한 날빌 콤보나 지루한 방어벽 덱으로 고착화된다.
3. **"Chess 2" 열풍의 핵심은 복잡한 룰이 아니라 '직관적이고 유쾌한 한 방'이다**:
   - Shotgun King, Chessplosion, 5D Chess, CEO 모두 리뷰 최상단이 "Finally, Chess 2" 밈으로 도배되어 있다. 유저들이 환호한 것은 복잡한 카드 덱이나 파밍이 아니라 "체스인데 샷건을 쏜다", "폭탄이 터진다"처럼 단 1초 만에 이해되는 파괴적이고 유쾌한 콘셉트였다.

---

## 7. 우선순위 셋

1. **[1순위] 온라인 대전 첫 수 미착수 및 잠수(AFK) 인질극 방지 장치 신설**
   - Chess Ultra에서 검증된 최악의 사용자 경험. 상대가 첫 수를 안 두고 버티면 레이팅 보호를 위해 무한정 시간을 뺏기므로(R4, R7, R10), 60초 내 미착수 시 경기 무효화/몰수패 처리가 최우선 필수다.
2. **[2순위] 상대방 기물 스킨을 표준형으로 대체해 보는 가독성 보호 옵션 제공**
   - Chessarama(R8)에서 지적되었듯, 제각각인 동물 스킨이 체스판의 패턴 인식을 방해하면 체스 본연의 재미가 파괴된다. 내 화면에서 상대 기물을 표준 외형으로 고정하는 토글이 반드시 필요하다.
3. **[3순위] 랭크 대전의 순수 실력 보존 및 점수 방어권/능력 기물 절대 배제**
   - Chess Evolved Online(R7)의 가위바위보 상성과 Auto Chess(R1, N8)의 패배 방어권 논란에서 보듯, 랭크에 과금이나 능력 개입이 1%라도 섞이는 순간 공정성이 무너져 유저가 즉각 이탈한다.
EXIT=0 
