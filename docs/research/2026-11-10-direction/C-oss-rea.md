# C. 오픈소스·잼 역공학 조사 (2026-11-10)

사용자 요청: 「인기 오픈소스 게임을 내려받아 구조를 분석(역설계)해도 되고, itch.io·깃허브·커뮤니티 등 웹을 다 활용해 독창적인 방향을 찾아라」.
이 문서는 **조사와 읽기**만 담는다. 프로젝트 코드는 건드리지 않았다.

## 방법과 한계

- 저장소 정보(라이선스 SPDX·별·마지막 푸시)는 모두 **GitHub API**(`gh api repos/<owner>/<repo>`)로 2026-11-10 에 확인했다. 라이선스가 `NOASSERTION`·`none` 으로 나온 것은 LICENSE 원문 첫 줄을 따로 읽었다.
- 받은 곳은 `D:\tmp\rea-2026-11-10\<이름>\` 이고 모두 `git clone --depth 1` 이다. **실행·설치·빌드는 하지 않았다.** 읽기만 했다.
- 300MB 가 넘는 저장소(lila · Evolve · A Dark Room · pokemonAutoChess · pokeclicker · postprocessing)는 받지 않고 GitHub API 로 파일만 읽었다. 이 경우 줄 번호는 달지 않고 파일 경로만 적는다.
- **SynergismOfficial 은 실수로 받았다가 지웠다.** API 의 `size` 는 132MB 였는데 받아 보니 354MB 였다. 두 파일을 읽은 뒤 폴더를 지웠다.
- 번들 크기는 **bundlephobia API**(`/api/size?package=`)의 값이다. 패키지 전체를 min+gzip 한 크기이고, **우리 빌드에 넣어서 재 보지는 않았다.** 트리 셰이킹이 되면 더 작아질 수 있다.
- itch.io 평점 수는 게임 페이지의 `aggregateRating`(JSON-LD)에서 읽었다. 페이지에 그 값이 없는 게임은 「평점 수 확인 못함」으로 적었다.
- itch.io 설명·댓글 요약은 페이지를 실제로 연 것만 적었다. 요약은 보조 모델이 페이지 글에서 뽑은 것이라, 숫자가 아닌 부분은 한 번 걸러진 내용이다.
- 치트·트레이너 저장소는 받지 않았다. 검색에 걸린 `XJYdemons/JinChanChanTool`(자동 구매 도구) · `n5za/chess-mate`(자동 대국 봇)는 열지 않았다.
- 프로젝트 쪽 사실 하나만 읽었다: `tools/bundle_gate.mjs` 는 **dist 의 JS 전체를 합쳐** gzip 400KB 와 견준다(`LIMIT_GZ_KB = { js: 400, css: 12 }`). 그래서 지연 로딩으로 쪼개도 이 문은 못 피한다.

## 이미 본 저장소 (다시 읽지 않음)

- `2026-11-04-farm-oss-rea`: farming-game · SNKRX · space-station-14 · mykonos-island-voxels · pogicity-demo · harvest-hollow — **이미 봄.**
- `2026-11-03-village-detail-rea`: hexcastle · folio-2025 · three-stylized — **이미 봄.**

---

## 1. 체스 변형 · 체스 로그라이크 · 빠른 체스

### 1-1. lichess-org/lila — 퍼즐 스톰 · 레이서
- 주소: https://github.com/lichess-org/lila
- 라이선스 **AGPL-3.0**(LICENSE 첫 줄 「GNU AFFERO GENERAL PUBLIC LICENSE」 확인) · 별 18,963 · 푸시 2026-11-10 · 732MB 라 받지 않음.
- 읽은 파일(API): `ui/storm/src/config.ts` · `ui/storm/src/ctrl.ts` · `ui/racer/src/config.ts` · `ui/racer/src/boost.ts` · `ui/lib/src/puz/combo.ts` · `ui/lib/src/puz/clock.ts` · `ui/lib/src/puz/sign.ts` · `modules/storm/src/main/StormSelector.scala` · `modules/racer/src/main/RacerRace.scala`
- 배운 구조:
  - **스톰과 레이서는 같은 뼈대(`lib/puz`)를 쓴다.** `Run = { moves, errors, current, clock, combo, history, modifier }` 하나에 `Clock` 과 `Combo` 를 꽂고, 설정 파일만 다르다.
  - **스톰 수치:** 시작 3분, 오답 −10초. 콤보 단계는 `[[0,0],[5,3],[12,5],[20,7],[30,10]]` — 연속 정답 5·12·20·30 에 닿을 때 +3·+5·+7·+10초, 30 뒤로는 10개마다 +10초(`combo.ts` 의 `percent()===0` 일 때만 보너스).
  - **시계는 「남은 시간」을 줄이지 않고 「처음 시간」을 늘리거나 줄인다**(`addSeconds` 가 `initialMillis` 에 더함). 첫 수를 둘 때 시작한다.
  - `minFirstMoveTime: 400` — 퍼즐이 바뀐 뒤 0.4초 안의 입력은 버린다(앞 퍼즐에서 누르던 손이 다음 퍼즐을 망치지 않게).
  - **출제:** 한 묶음 137문제. 레이팅 구간 11개에 7·7·8·9·10·11·13·15·17·19·21 문제씩 뽑아 **쉬운 것부터 정렬**한다. 주석: 「스톰 난이도는 일정해야 한다」. 묶음은 7초마다 새로 만들어 캐시하므로 **같은 7초 안에 시작한 사람은 같은 문제**를 푼다.
  - **레이서:** 90초 고정, 오답 벌 0, 최대 10명, 방 id 는 5글자. 공개 로비는 3명, 친구 방은 2명부터 카운트다운. 점수가 오른 뒤 1초 동안 차가 「부스트」 그림이 된다(`boost.ts`).
  - 기록 위조 막기: 서버 열쇠를 일회용 난수와 XOR 해 받아 두었다가 결과에 붙인다(`sign.ts`, 시작 40초 뒤).
- 옮길 수 있는 것: **구조·수치 아이디어만.** AGPL 이라 코드는 한 줄도 옮기지 않는다.
- 주의: 화면에 남은 시간을 보여 주는 방식이라, 우리 「카운트다운을 보여 주지 않는다」 원칙(11-04 문서 G3 #11)과 부딪힐 수 있다. 판 안의 시계와 섬의 마감은 다른 문제인지 먼저 정해야 한다.

### 1-2. lichess-org/chessground
- 주소: https://github.com/lichess-org/chessground · **GPL-3.0** · 별 1,394 · 푸시 2026-10-20 · 받음(b4f6050, 12MB)
- 읽은 파일: `src/anim.ts` · `src/explosion.ts` · `src/premove.ts` (파일 목록과 줄 수는 `src/*.ts` 전체)
- 배운 구조:
  - 전체 3,397줄. 상태(`state.ts`) · 판 조작(`board.ts`) · 그리기(`render.ts`) · 끌기(`drag.ts`)가 따로다.
  - **애니메이션은 「앞 판과 뒤 판의 차이」에서 스스로 계획을 짠다**(`anim.ts` `computePlan`). 사라진 말과 새로 생긴 말을 모으고, 새 말마다 **같은 종류의 사라진 말 중 가장 가까운 것**을 짝지어 이동으로 보고, 짝이 없는 것은 흐려지게 한다. 호출하는 쪽은 「이 말이 여기서 저기로」를 말해 줄 필요가 없다.
  - 이징은 3차 in-out 한 줄(`anim.ts` 끝). 진행 중에 새 변화가 오면 계획만 갈아 끼운다.
  - 폭발은 2단계 × 120ms 의 클래스 토글이다(`explosion.ts`, 19줄).
  - 미리 두기는 말 종류별 「갈 수 있는 모양」 술어 표다(`premove.ts` `mobilityByRole`).
- 옮길 수 있는 것: **구조만**(GPL). 「차이에서 애니메이션 계획 짜기」는 생각이라 우리 식으로 다시 쓸 수 있다.

### 1-3. lichess-org/scalachess
- 주소: https://github.com/lichess-org/scalachess · **MIT**(LICENSE 「Copyright (c) 2012-2014 Thibault Duplessis」) · 별 786 · 푸시 2026-11-09 · 받음(24c1cbf, 41MB)
- 읽은 파일: `core/src/main/scala/variant/Variant.scala`(60~270줄) · `KingOfTheHill.scala`(34줄 전체) · `ThreeCheck.scala`(53줄 전체) · 변형 폴더 줄 수
- 배운 구조:
  - **변형 = 기본 규칙 클래스의 훅 몇 개만 덮어쓴 것.** 훅은 `validMoves` · `specialEnd` · `specialDraw` · `isInsufficientMaterial` · `valid` · `initialFen` · `materialImbalance` 다.
  - 승자는 `checkMate || specialEnd` 한 줄로 정한다(`Variant.scala` `winner`).
  - 킹 오브 더 힐은 `specialEnd = 상대 킹이 중앙 4칸에 있다` **한 줄**, 파일 전체가 34줄이다.
  - 쓰리 체크는 수를 만들 때마다 체크 횟수를 기록에 더하고 3 이상이면 끝(53줄). FEN 끝에 `+0+0` 을 붙여 횟수를 들고 다닌다.
  - 변형별 줄 수: Antichess 110 · Atomic 146 · Crazyhouse 290 · Horde 254 · RacingKings 95. 규칙 하나에 100~300줄이다.
  - 변형마다 「오프닝 책이 말이 되는가」 「국면 구분이 말이 되는가」 집합을 따로 둔다(`openingSensibleVariants`).
- 옮길 수 있는 것: **MIT 라 논리를 옮겨도 된다**(고지 필요). 다만 Scala 라서 실제로는 훅 모양만 가져와 `src/rules/referee.js` 에 맞게 다시 쓰게 된다.

### 1-4. fairy-stockfish/Fairy-Stockfish
- 주소: https://github.com/fairy-stockfish/Fairy-Stockfish · **GPL-3.0**(Copying.txt 첫 줄 확인) · 별 929 · 푸시 2026-11-07 · 받음(4e3d014, 18MB)
- 읽은 파일: `src/variants.ini` 1~60줄, 155~309줄
- 배운 구조:
  - **변형을 코드가 아니라 설정 파일로 정의한다.** `[자식:부모]` 로 상속하고 다른 점만 적는다(1~60줄 설명).
  - 규칙 옵션이 155~300줄에 한 줄씩 있다(약 140개). 우리에게 쓸모 있어 보이는 것:
    - `blastOnCapture`(잡으면 주변이 터진다) · `petrifyOnCaptureTypes`(잡은 말이 돌이 된다) · `mustCapture`(잡을 수 있으면 잡아야 한다)
    - `capturesToHand` + `pieceDrops`(잡은 말을 손에 넣었다가 내려놓는다)
    - `flagRegion` · `flagPieceCount`(특정 칸에 닿으면 이긴다) · `checkCounting`(체크 N번) · `connectN`(N개를 줄 세우면 이긴다) · `extinctionPieceTypes`(특정 종류가 다 사라지면 진다)
    - `wallingRule` · `wallOrMove`(수를 둘 때 벽·오리를 놓는다) · `passOnStalemate`
  - 「함께 못 쓰는 옵션 조합」 목록을 따로 적어 두고 읽을 때 거절한다(302~309줄).
- 인기 변형(lichess 공개 기록 `database.lichess.org/<변형>/counts.txt`, 2026-10 랭크 대국 수): 안티체스 419,316 · 체스960 367,964 · 아토믹 324,630 · 크레이지하우스 323,465 · 쓰리체크 142,111 · 킹오브더힐 94,489 · 호드 81,338 · 레이싱킹스 59,307. 표준은 95,395,628 이다. **변형을 다 합쳐도 표준의 2% 가 안 된다.**
- 옮길 수 있는 것: **구조만**(GPL). 「규칙을 표의 한 줄로」라는 생각과 옵션 이름 목록이 값지다.

### 1-5. DougDougGithub/Chess-Chaos-Roguelike
- 주소: https://github.com/DougDougGithub/Chess-Chaos-Roguelike · **MIT** · 별 33 · 푸시 2026-04-08 · 받음(a2b749b, 18MB)
- 읽은 파일: `README.md` · `api/rules.js`
- 배운 구조:
  - 「3턴마다 새 규칙을 하나 고르는 체스」. 규칙 68개, 그중 즉시 발동 28개.
  - 규칙 한 줄의 모양: `{ title, description, isInstant, kingImmune, minTurns, maxTurns, turnsLeft }`. **규칙의 효과는 코드가 아니라 글**이고, 사람이 오른쪽 클릭으로 말을 직접 고친다(방송용 수동 심판).
  - 판 상태와 턴 상태를 따로 저장한다(「판 = 말」, 「턴 = 진행 중인 규칙과 고를 후보」).
  - **설계 메모가 값지다**(`rules.js` 머리 주석): 수를 둔 **뒤에** 규칙을 고르게 하면 더 공정하고 잘하는 쪽이 더 이기지만 「15% 덜 신난다」. 방송은 앞에, 공개 출시는 뒤에 고르는 쪽을 권한다.
  - 지속 규칙 예: 「폰만 죽을 수 있다」 「잡은 말도 함께 죽는다」 「비숍·룩·퀸은 끝까지 가야 한다」 「좌우가 이어진다」 「E 열은 이 규칙이 끝날 때 모두 죽는다」.
- 옮길 수 있는 것: MIT 라 코드도 되지만 **가져올 코드가 없다**(규칙이 글이다). 규칙 목록과 `isInstant/kingImmune/min~maxTurns` 표 모양, 고르는 시점 메모가 쓸모다.
- 주의: 규칙 이름·문구에 방송용 농담과 거친 말이 많다. 문구는 가져오지 않는다.

### 1-6. shrechochek/evolution-chess
- 주소: https://github.com/shrechochek/evolution-chess · **MIT** · 별 5 · 푸시 2026-02-08 · 받음(b070e75, 31MB)
- 읽은 파일(API): `docs/js/data.js` 1~90줄 · `docs/js/evolution-tree.js` 전체
- 배운 구조:
  - 말이 잡을 때 경험치를 얻고, 차면 **갈래 중 하나로 진화**한다.
  - 말 정의 한 줄: `{ name, tier, xpReq, role, moves, extraMoves, special, ghost, immortal }`. 움직임은 `slide(VEC_ORTHO)` · `step(VEC_KNIGHT)` 처럼 **벡터 + 미끄러짐 여부**로 적는다.
  - 진화 나무는 `{ 'pawn': ['pawn_spearman','pawn_runner','pawn_torpedo'], … }` 인 평평한 표다. 3단까지 있고, 일부는 다른 기본 말로 넘어간다(예: 강화 나이트 → 룩).
  - `xpReq: -1` 은 「더 진화하지 않음」이다. 모드용 JSON 예시(`minimal-mod.json`)도 있다.
- 옮길 수 있는 것: MIT 라 코드도 되지만 한 파일 10만 바이트짜리(`script.js`)라 **표 모양만** 쓸모다.
- 주의: 별이 5개다. 인기 근거는 못 된다.

### 1-7. 열지 않고 정보만 본 것
- `keldaanCommunity/pokemonAutoChess` — GPL-3.0 · 별 1,849 · 1.1GB. 남의 IP 팬 게임이라 열지 않았다.
- `Jameskmonger/creature-chess` — AGPL-3.0 · 별 93. 열지 않았다.
- GitHub 에서 「chess roguelike」 「topic:roguelike chess」 로 찾은 나머지는 별 10개 미만이거나 라이선스가 없다. 읽지 않았다.

---

## 2. 방치형 · 증분 게임

### 한눈에 — 떠나 있던 시간을 다루는 다섯 가지 방법

| 게임 | 방법 | 상한 | 문턱 |
| :--- | :--- | :--- | :--- |
| Antimatter Dimensions | 평소 게임 루프를 큰 틱으로 **다시 돌린다** | 틱 수 기본 10만(설정) · 최대 100만 · 틱 하나는 33ms 보다 짧지 않게 | 10초 미만은 안 함 |
| Trimps | 24시간까지는 100ms 틱으로 다시 돌리고, **넘는 시간은 공식으로** 준다 | 다시 돌리기 864,000틱 | 5분 미만은 안 함 |
| Synergism | 길이와 상관없이 **항상 200틱**으로 나눈다 | 3일(+연구) | 모바일은 60초 |
| Kittens Game | 달력을 **날짜 단위로 건너뛴다**(2초 = 하루) + 가속 은행 | 게임 안 10년(후반 40년) | 3일(6초) 미만은 무시 |
| Evolve | 생산을 주지 않고 **「2배속 시간」을 적립**한다 | 2배속 8시간 분량 | 120초 |
| Profectus | 적립한 시간을 **매 틱 10% 씩** 흘려 넣는다 | 1시간(설정) | — |
| A Dark Room | **없다**(켜 둔 동안만) | — | — |

### 2-1. IvarK/AntimatterDimensionsSourceCode
- 주소: https://github.com/IvarK/AntimatterDimensionsSourceCode · **MIT** · 별 417 · 푸시 2026-07-17 · 받음(5409e32, 167MB)
- 읽은 파일: `src/game.js:422-470`, `:895-1010` · `src/core/storage/storage.js:80-90`, `:480-515` · `src/core/storage/migrations.js:1-60`, `:1205-1243` · `src/core/storage/serializer.js:1-60` · `src/core/away-progress.js:1-60` · `src/core/player.js:792-806` · `src/core/intervals.js:56-58`
- 배운 구조:
  - **틱 루프:** `setInterval(gameLoop, updateRate)`, 기본 33ms(`player.js:792`). 한 틱의 시간 차는 `clamp(now − lastUpdate, 1, 8.64e7)` 로 하루에 묶는다(`game.js:438`).
  - **잠들었다 깬 것 알아채기:** 한 틱이 60초를 넘으면 기기가 잠든 것으로 보고 루프를 멈춘 뒤 `simulateTime` 으로 넘긴다(`game.js:449-454`).
  - **오프라인 계산 `simulateTime(seconds, real, fast)`**(`game.js:895`):
    - 틱 수 = `floor(초 × 20)`(50ms 기준). 상한은 `min(설정값, floor(ms/33), 1e6)`(`storage.js:86-89`). 기본 설정값은 1e5 다(`player.js:798`).
    - 10초 미만은 아무것도 안 하고, 10~50초는 50틱짜리 「빠른」 계산이다(`storage.js:500-506`).
    - 틱 길이는 「남은 시간 ÷ 남은 틱」으로 매번 다시 나눈다. 도중에 「빨리」 단추(남은 틱을 반으로, 최소 500)나 「건너뛰기」(남은 시간을 10틱에)를 누를 수 있기 때문이다(`game.js:940-955`, `:985-1000`).
    - 계산은 비동기로 쪼개 돌리고 진행 막대를 보여 준다.
  - **떠난 사이 요약:** 계산 전에 플레이어 상태를 통째로 복사해 두고(`game.js:915`), 끝난 뒤 항목 표(`away-progress-types.js`)를 돌며 앞뒤 값을 견준다. 항목은 「플레이어 객체 안의 경로」로만 적는다(`away-progress.js:12-17`).
  - **저장 옮기기:** `patches: { 1: fn, 2: fn, 5: fn, 9: fn, 9.5: fn, … }` 처럼 **번호가 열쇠인 함수 표**다. `patch()` 는 먼저 기본 플레이어와 저장을 깊게 합쳐 빠진 칸을 채우고, `player.version < v` 인 것을 차례로 돌리며 번호를 올린다(`migrations.js:1221-1233`).
    - 머리 경고: 「옮기기 함수 안에서 전역 상태 접근자를 쓰지 마라. 오래 가면 안전하지 않다」(`migrations.js:3`).
  - **저장 형식:** JSON → 압축 → base64 에 **머리말·꼬리말 문자열**(`AntimatterDimensionsSavefileFormat` … `EndOfSavefile`)과 3글자 판 번호(`AAB`)를 붙인다(`serializer.js:38-58`). `Infinity` 와 `Set` 은 변환기로 따로 처리한다. 자동 저장은 30초(`player.js:806`).
- 옮길 수 있는 것: **MIT 라 코드도 된다.** 번호 열쇠 옮기기 표 · 「기본값과 깊게 합친 뒤 고친다」 · 떠난 사이 요약 표는 모양 그대로 쓸 만하다.
- 주의: 저장소가 167MB 다(뉴스 문구·이미지). 큰 수 라이브러리와 Vue 2 에 묶여 있어 파일째 가져올 것은 없다.

### 2-2. Trimps/Trimps.github.io
- 주소: https://github.com/Trimps/Trimps.github.io · **GPL-2.0** · 별 287 · 푸시 2025-03-12 · 받음(b9edb1d, 16MB)
- 읽은 파일: `main.js:2674-2705`, `:2880-2905`, `:3124-3200`, `:258-746`(옮기기 줄 목록)
- 배운 구조:
  - **두 갈래 오프라인.** 100ms 틱으로 다시 돌리되 `maxTicks: 864000`(24시간)에서 자르고(`main.js:2700`, `:2891`), **넘는 시간은 공식 계산 `trustworthyTrimps` 로 넘긴다**(`:2894-2897`).
  - 5분(300,000ms) 미만이면 아무것도 안 한다(`:3125`). 설정에서 「다시 돌리기」 「공식만」을 고른다(`:3126-3131`).
  - **시계 되돌리기 막기:** `lastOfflineProgress > 지금` 이면 값을 지금으로 고치고 돌아간다(`:2881-2884`).
  - 공식 쪽은 일꾼 종류 5개를 돌며 `보유 수 × 계수 × 특전…` 을 곱한다. 시간에 따라 쌓이는 보너스는 **10분 조각으로 나눠 흉내 낸다**(`:3184-3200`).
  - 저장 옮기기는 `if (oldVersion < 3.51) { … }` 가 50개 넘게 이어진 사슬이다(`main.js:331-746`).
- 옮길 수 있는 것: **구조만**(GPL-2.0). 「정확히 다시 돌리기 + 넘치면 공식」 두 갈래와 시계 되돌리기 막기.

### 2-3. pmotschmann/Evolve
- 주소: https://github.com/pmotschmann/Evolve · **MPL-2.0**(LICENSE 첫 줄 확인) · 별 1,281 · 푸시 2026-10-16 · 372MB 라 받지 않음
- 읽은 파일(API): `src/functions.js` 108~206줄 · `src/main.js` 820~880줄, 12830~12860줄 · `src/vars.js`(검색)
- 배운 구조:
  - **루프 세 개:** 빠른 250ms · 중간 1,000ms · 느린 5,000ms(= 게임 하루). 웹 워커가 박자를 주고, 본 스레드는 `loopTick % midRatio` 로 맞춘다(`execGameLoops`). 한 번에 따라잡는 양은 「1분(게임 12일)」로 묶는다. 주석: 「똑똑한 따라잡기는 아직 없다」.
  - **오프라인 생산이 없다. 대신 「가속 시간」을 적립한다**(`addATime`):
    - 120초 넘게 떠나 있었으면 `at += floor(2/3 × 떠난 시간 × 2 ÷ 5000ms)` 게임 일.
    - 가속 중에는 모든 루프가 2배 빨리 돈다(`loopTimers` 의 `aTimeMultiplier`).
    - 주석의 뜻: 「가속 구간은 멈춰 있던 시간의 2/3 만큼 이어진다」.
    - 상한 11,520 게임 일. 주석 「8×60×60/2.5」 — 2배속으로 8시간 분량이다.
  - 저장은 `LZString.compressToUTF16(JSON.stringify(global))` 를 localStorage `evolved` 한 칸에 넣는다(`vars.js`).
- 옮길 수 있는 것: MPL-2.0 은 **파일 단위 공개 조건**이라, 파일을 그대로 가져오면 그 파일은 공개해야 한다. **구조·수식만** 가져온다.
- 주의: 본 파일이 13,000줄 한 덩어리(`main.js`)다.

### 2-4. doublespeakgames/adarkroom
- 주소: https://github.com/doublespeakgames/adarkroom · **MPL-2.0** · 별 8,387 · 푸시 2025-05-23 · 401MB 라 받지 않음
- 읽은 파일(API): `script/state_manager.js`(`setIncome` · `collectIncome` · `updateOldState`) · `script/outside.js`(일꾼 표)
- 배운 구조:
  - **오프라인 진행이 없다.** 1초 `setTimeout` 사슬이 `collectIncome` 을 부른다.
  - **수입원 = `{ delay: 10, stores: { 'fur': -5, 'leather': 1 } }`.** 음수는 재료, 양수는 산출이다. `timeLeft` 를 1초씩 깎다가 0 이 되면 한 번에 정산하고 `delay` 로 되돌린다.
  - **재료가 하나라도 모자라면 그 수입원은 통째로 건너뛴다**(전부 아니면 전무).
  - 일꾼 표가 곧 생산 사슬이다: 사냥꾼(가죽·고기 +0.5) → 무두장이(가죽 −5 → 무두질 가죽 +1) → … → 무기장이(강철 −1 · 유황 −1 → 탄환 +1). 모두 `delay: 10` 이다.
  - 도둑도 같은 표의 한 줄이다(`stores` 가 전부 음수).
  - 저장 옮기기는 `if (version == 1.0) { …; version = 1.1 }` 식의 계단이다.
- 옮길 수 있는 것: **구조만**(MPL 파일 조건). 「음수 = 재료」 한 줄 표는 가장 작고 읽기 쉬운 생산 모형이다.

### 2-5. nuclear-unicorn/kittensgame (Kittens Game)
- 주소: https://github.com/nuclear-unicorn/kittensgame · API 는 `NOASSERTION` · 별 119 · 푸시 2026-11-08 · 받음(30231f6, 54MB)
- **소스는 공개돼 있다. 그러나 자유 라이선스가 아니다.** `license.txt` 원문: 「WET PAWS LICENSE」 — 개인·교육 목적 수정만 되고, **상업 이용과 파생물 제작은 금지**다.
- 읽은 파일: `license.txt` · `game.js:2289`, `:2345`, `:3093-3094`, `:3304-3584`(줄 목록), `:5263-5304` · `js/time.js:117-129`, `:233-312` · `js/buildings.js:350-367`
- 배운 구조:
  - 초당 5틱(`game.js:2289`). 박자는 **인라인 웹 워커**가 준다(`:5263`) — 탭이 뒤로 가도 느려지지 않게.
  - 건물 한 줄: `{ name, prices:[{name,val}], priceRatio: 1.12, effects:{ catnipPerTickBase: 0.125 }, unlockRatio: 0.3, unlockScheme }`(`buildings.js:350-367`). **효과는 이름표 사전**이고, 전체 효과는 사전을 합쳐서 구한다. 단계가 있는 건물은 `stages` 배열로 덮어쓴다.
  - **오프라인 = 「적색편이」**(`time.js:233-312`): `날 수 = round(떠난 ms / 2000)`. 3일 미만은 「화면 멈춤일 뿐」이라며 버린다(`:249-251`). 상한은 게임 안 10년, 후반은 40년(`:253-258`).
  - **가속 은행 「시간 흐름」**: 떠난 60초마다 5점(`time.js:123`), 기본 상한 3,000점 = 가속 10분(`:653`). 가속을 켜면 틱마다 1점씩 쓴다(`:153-154`).
  - 저장 옮기기는 `saveVersion` 1→15 의 계단이다(`game.js:3304-3584`).
- 옮길 수 있는 것: **구조만. 코드·문구·수치표를 옮기면 안 된다**(파생물 금지).

### 2-6. profectus-engine/Profectus
- 주소: https://github.com/profectus-engine/Profectus · **MIT** · 별 35 · 푸시 2026-11-01 · 받음(09e5927, 25MB)
- 읽은 파일: `src/game/gameLoop.ts` 전체 · `src/game/player.ts:1-70` · `src/data/projInfo.json`
- 배운 구조:
  - 루프는 `setInterval(update, 50)` 이고, 설정으로 `requestAnimationFrame` 으로 바꿀 수 있다.
  - **오프라인 시간을 한 번에 주지 않고 흘려 넣는다:** `offlineDiff = max(offlineTime / 10, diff)` 를 이번 틱에 더하고 은행에서 뺀다. 은행이 클수록 빨리, 줄수록 천천히 빠진다.
  - 은행 상한 `offlineLimit`(시간, 기본 1), 틱 하나의 상한 `maxTickLength`(초, 기본 3,600). 둘 다 `projInfo.json` 의 값이다.
  - 저장 뼈대: `{ id, name, time, timePlayed, offlineProd, offlineTime, modID, modVersion, layers: {…} }`. **`modID` 로 다른 게임의 저장을 걸러 낸다.**
  - NaN 이 한 번이라도 나오면 루프를 멈춘다(`state.hasNaN`).
- 옮길 수 있는 것: **MIT 라 코드도 된다.** 다만 Vue 반응형에 묶여 있어 `update()` 30줄의 생각만 옮기는 편이 낫다.
- 주의: 별 35개. 엔진이지 게임이 아니다.

### 2-7. Patashu/break_infinity.js · break_eternity.js
- 주소: https://github.com/Patashu/break_infinity.js (MIT · 별 254 · 푸시 2025-08-26 · 받음 22a00b9, 10MB) · https://github.com/Patashu/break_eternity.js (MIT · 별 208 · 푸시 2026-11-08 · 받음 7b564e5, 8MB)
- 읽은 파일: `break_infinity.js/src/constants.ts` · `src/decimal.ts:1-40` · `README.md:1-40` · `break_eternity.js/src/index.ts`(검색)
- 배운 구조:
  - break_infinity: 수 = `{ mantissa, exponent }`. 지수 상한 9e15. **지수가 17 넘게 벌어지면 더하지 않고 큰 쪽만 돌려준다**(`constants.ts`). 정확도보다 속도를 고른 설계다.
  - break_eternity: 수 = `{ sign, layer, mag }`. 9e15 를 넘으면 층을 하나 올린다.
- 번들: break_infinity **gzip 4.0KB** · break_eternity 13.0KB · decimal.js 12.7KB.
- 옮길 수 있는 것: MIT 라 코드도 된다. **그러나 우리에겐 필요 없다** — 도토리가 1e308 을 넘을 일이 없으면 일반 수로 충분하다. 큰 수를 쓰는 순간 저장·표시·비교가 모두 바뀐다.

### 2-8. Pseudo-Corp/SynergismOfficial
- 주소: https://github.com/Pseudo-Corp/SynergismOfficial · **MIT** · 별 378 · 푸시 2026-11-10 · 받았다가 지움(354MB)
- 읽은 파일: `src/Calculate.ts:829-960` · `src/Synergism.ts:4020-4050`
- 배운 구조:
  - 오프라인 상한 = 3일 + 연구 두 개가 2시간씩 늘림(`Calculate.ts:862-867`).
  - **떠난 시간이 얼마든 200틱으로 나눈다**(`timeTick = timeAdd / 200`).
  - 10ms 넘게 걸리면 `setTimeout(0)` 으로 양보한다. 양보한 사이 저장이 바뀌었는지 「세대 번호」로 확인하고, 바뀌었으면 그만둔다.
  - 모바일은 벽시계가 60초 넘게 벌어지면 오프라인 계산으로 보낸다(`Synergism.ts:4031-4040`). 계산 창이 떠 있는 동안에는 그 시간을 **한 번만** 주도록 도장을 건드리지 않는다.
- 옮길 수 있는 것: MIT 라 코드도 된다. 「세대 번호로 낡은 비동기 계산 버리기」가 쓸모다.

### 2-9. Flaque/merchant.js
- 주소: https://github.com/Flaque/merchant.js · **MIT** · 별 646 · 푸시 2018-05-25(오래됨) · 받지 않음
- 읽은 파일(API): `README.md`
- 배운 구조: 「장부」 = 화폐 → 수의 불변 맵. 아이템은 **상태 없는 설계도** `{ type, cost(), effect(state) }` 이고, 가진 개수는 지갑에 화폐처럼 넣는다. 틱 = 장부를 더하고(`sum`) 곱하는(`scale`) 일이다.
- 옮길 수 있는 것: MIT 지만 immutable.js 에 기대고 7년간 멈춰 있다. **생각만.**

### 2-10. 정보만 본 것
- `nroutasuo/level13` — Apache-2.0 · 별 266 · 푸시 2026-10-18. 읽지 않았다.
- `ihtasham42/progress-knight` — Unlicense · 별 183. 읽지 않았다.
- `Acamaeda/The-Modding-Tree` — MIT(LICENSE 확인) · 별 135. Profectus 의 앞 세대다. 읽지 않았다.
- `pokeclicker/pokeclicker` — 라이선스 없음 · 별 725 · 422MB. 남의 IP 라 열지 않았다.
- Idle Game Maker(Orteil) — 저장소를 찾지 않았다. **확인 못함.**

---

## 3. 꾸미기 · 마을 배치

**먼저 결론:** 「Islanders · Dorfromantik 을 웹으로 다시 만든 별 많은 오픈소스」는 **찾지 못했다.** GitHub 검색 열한 가지(`islanders clone` · `dorfromantik` · `adjacency bonus game` · `tile placement game three.js` · `topic:city-builder` · `cozy builder three.js` · `isometric room builder` 등)에서 나온 것은 풀이 도구이거나 별 20개 미만이다. 인접 보너스는 오픈소스보다 지난번에 본 hexcastle · mykonos 와 아래 풀이 도구에서 배우는 편이 낫다.

### 3-1. dgreenheck/simcity-threejs-clone
- 주소: https://github.com/dgreenheck/simcity-threejs-clone · **MIT** · 별 277 · 푸시 2025-12-20 · 받음(9116cf6, 89MB)
- 읽은 파일(API): `src/scripts/config.js` 전체 · `src/scripts/sim/buildings/modules/development.js` · `src/scripts/sim/city.js`(검색)
- 배운 구조:
  - 격자는 16×16 의 `Tile`. 타일마다 건물 하나, 건물은 **모듈 묶음**(개발 · 주민 · 일자리 · 도로 접근 · 전력)이다.
  - **한 걸음 = 서비스 먼저, 그다음 모든 타일의 `simulate(city)`**(`city.js` `simulate`).
  - **건물은 상태 기계로 자란다**(`development.js`): 미개발 → 공사 중(3일) → 개발됨 → 버려짐.
    - 조건(도로 닿음 + 전력 충분)이 맞아도 **확률 0.25** 로만 공사를 시작한다. 그래서 한꺼번에 솟지 않는다.
    - 레벨은 3까지, 걸음마다 0.05 확률로 오른다.
    - 조건이 10걸음 넘게 깨지면 0.25 확률로 버려진다.
  - 이웃 찾기는 `findTile(start, filter, maxDistance)` 너비 우선 탐색이다(도로 찾기 3칸, 일자리 찾기 4칸).
  - 수치가 `config.js` 한 파일에 주석과 함께 모여 있다.
- 옮길 수 있는 것: **MIT 라 코드도 된다.** 「조건 + 확률 + 지연」 상태 기계가 우리 건물 단계에 맞는다.
- 주의: 받은 폴더가 89MB(모델)다. 에셋은 따로 라이선스를 확인하지 않았다 — **에셋은 가져오지 않는다.**

### 3-2. victorqribeiro/isocity
- 주소: https://github.com/victorqribeiro/isocity · **MIT** · 별 3,264 · 푸시 2024-10-14 · 받음(c577241, 6MB)
- 읽은 파일(API): `js/main.js`(4,667바이트 전체 중 1~60줄, 80~120줄)
- 배운 구조:
  - **코드 전체가 4.6KB.** 7×7 격자, 칸 값은 `[텍스처 행, 열]` 뿐이다. 규칙도 경제도 없다.
  - **상태를 주소 해시에 넣는다:** 49칸을 `Uint8Array` 로 만들어 base64 한 뒤 `history.pushState('#…')`. 주소를 복사하면 도시가 공유되고, 뒤로 가기가 되돌리기다.
  - 텍스처는 opengameart 의 아이소메트릭 묶음이다(파일 머리 주석).
- 옮길 수 있는 것: MIT 라 코드도 되지만 30줄이다. **「섬을 주소 한 줄로 공유」** 생각이 값지다.
- 주의: 별 3,264 는 「작아서」 받은 별이다. 게임으로서의 깊이는 없다.

### 3-3. amosborne/dorfperfekt (Dorfromantik 풀이 도구)
- 주소: https://github.com/amosborne/dorfperfekt · **MIT** · 별 17 · 푸시 2023-11-20 · 받지 않음
- 읽은 파일(API): `dorfperfekt/tile.py` 1~80줄 · `dorfperfekt/tilemap.py` 1~150줄
- 배운 구조:
  - **육각 타일 = 변 6개의 지형 글자열**(`"GFRDWS"` 같은 6글자) + 돌림 값. 같은 타일은 돌려서 사전순으로 가장 작은 꼴로 통일한다(`terrains2tile`).
  - 이웃 여섯 방향은 `OFFSETS = [(1,0),(0,1),(-1,1),(-1,0),(0,-1),(1,-1)]`(축 좌표).
  - **인접 규칙이 표 두 개다:** 「제한 지형」(물·기찻길은 같은 것끼리만) + 예외 쌍 목록, 그리고 「완벽 일치로 쳐 주는 쌍」 목록.
  - 놓을 자리에서 **바깥 여섯 변을 모아 가상의 타일을 만들고**(`outer_tile`), 그것과 놓을 타일을 견준다. 변마다 「유효/완벽」이 나온다.
  - 「놓을 수 있는 빈 칸」 집합(`open`)과 「완벽이 깨진 칸」 목록(`ruined`)을 놓을 때마다 고쳐 둔다. 다시 세지 않는다.
- 옮길 수 있는 것: MIT 라 논리를 옮겨도 된다(파이썬 → JS 로 다시 쓰기). 「바깥 변을 모아 견준다」와 `open` 집합 유지가 인접 보너스 계산의 뼈대로 쓸 만하다.

### 3-4. 정보만 본 것
- `thorsten/Voltopia`(MIT · 별 3) · `KuroiAkuma19/GridVille`(MIT · 별 3) · `emollick/monument-brutalist-city-builder`(MIT · 별 15) · `trymnilsen/kingdomarchitect`(NOASSERTION · 별 23) — 읽지 않았다.
- `reneodlt/civitas` · `dunkean/magna-urbis` — AGPL-3.0. 열지 않았다.
- 방 꾸미기: `gVguy/living-room-three` · `Mkreidly91/Isometric-Room` 등 모두 별 2개 이하에 라이선스가 없다. 읽지 않았다.

---

## 4. three.js 손맛 · 효과 라이브러리

**먼저 결론:** JS gzip 여유가 3KB 인데, 아래에서 **통째로 3KB 안에 드는 라이브러리는 하나도 없다.** 가장 작은 tween.js 가 3.7KB 다. 그래서 쓸 수 있는 것은 「라이브러리」가 아니라 **30~60줄짜리 기법을 직접 쓰는 것**이다. 지연 로딩도 지금 문으로는 못 피한다(JS 합계를 잰다).

| 패키지 | 라이선스 | 판 | min | **gzip** | 판단 |
| :--- | :--- | :--- | ---: | ---: | :--- |
| three.quarks | MIT | 0.17.1 | 166KB | **38.7KB** | 못 넣음. 묶어 그리기 구조만 배움 |
| postprocessing (pmndrs) | Zlib | 6.39.6 | 327KB | **112.6KB** | 못 넣음(전체 기준, 트리 셰이킹하면 줄지만 재 보지 않음) |
| troika-three-text | MIT | 0.53.1 | 128KB | **46.3KB** | 못 넣음 |
| camera-controls | MIT | 3.1.2 | 45KB | **10.3KB** | 못 넣음. 흔들림 기능 없음 |
| three-nebula | MIT | 13.3.0 | 83KB | **23.5KB** | 못 넣음 |
| @tweenjs/tween.js | MIT | 25.0.0 | 12.6KB | **3.7KB** | 0.7KB 넘음 |
| gsap | 자체(무료) | 3.15.1 | 71KB | **27.4KB** | 못 넣음 + 라이선스 주의 |
| animejs | MIT | 4.5.0 | 117KB | **40.5KB** | 못 넣음 |
| maath | MIT | 0.10.8 | 31KB | **10.4KB** | 전체는 못 넣음(이징만 떼면 작을 것 — 재 보지 않음) |
| three-custom-shader-material | MIT | 6.4.0 | 13.9KB | **4.0KB** | 1KB 넘음 |
| lz-string | MIT | 1.5.0 | 4.8KB | **1.5KB** | **들어간다**(저장 압축이 필요해질 때) |
| break_infinity.js | MIT | 2.2.0 | 16.4KB | **4.0KB** | 필요 없음 |

### 4-1. Alchemist0823/three.quarks
- 주소: https://github.com/Alchemist0823/three.quarks · **MIT** · 별 1,192 · 푸시 2026-05-21 · 받음(de7c207, 47MB)
- 읽은 파일: `packages/three.quarks/src/BatchedRenderer.ts:1-80` · `packages/quarks.core/src/behaviors/`(목록 23개) · `packages/` 구조
- 배운 구조:
  - **장면에 `BatchedRenderer` 하나만 두고**, 모든 입자 시스템을 「같은 지오메트리 · 재질 · 타일 수 · 그리기 방식 · 순서 · 레이어」 묶음으로 나눠 **묶음마다 드로우콜 하나**로 그린다(`VFXBatchSettings`).
  - 묶음 종류는 스프라이트(`SpriteBatch`)와 꼬리(`TrailBatch`) 둘이다.
  - 동작은 「수명에 따른 X」 식 23종이다: 색 · 크기 · 회전 · 속도 · 힘 · 소음 · 난류 · 하위 입자 내뿜기 등.
  - 핵심 계산(`quarks.core`)과 three 렌더 쪽이 다른 패키지다.
- 옮길 수 있는 것: MIT 라 코드도 되지만 **크기 때문에 못 넣는다.** 「효과가 몇 개든 같은 텍스처 시트면 드로우콜 하나」는 우리 드로우콜 100 상한에 그대로 맞는 생각이다.

### 4-2. pmndrs/postprocessing
- 주소: https://github.com/pmndrs/postprocessing · **Zlib**(LICENSE.md 「Copyright © 2015 Raoul van Rüschen … provided 'as-is'」) · 별 2,963 · 푸시 2026-11-01 · 262MB 라 받지 않음
- 읽은 파일(API): `src/effects/`(목록 34개) · `src/effects/ShockWaveEffect.js:1-60` · `src/effects/glsl/shock-wave.frag`
- 배운 구조:
  - 효과 34개. 손맛에 쓸 만한 것: ShockWave · ChromaticAberration · Vignette · Glitch · Outline · TiltShift.
  - **충격파는 UV 만 민다**(`shock-wave.frag` `mainUv`): 중심에서의 거리가 `radius ~ radius+waveSize` 띠 안이면 `(1−cos(각))/2 × amplitude` 만큼 바깥으로 밀고, 멀수록 줄인다. 기본값 속도 2.0 · 최대 반지름 1.0 · 띠 폭 0.2 · 세기 0.05.
  - 효과들이 `mainUv` · `mainImage` 조각을 내놓으면 한 패스로 합쳐 준다(이 라이브러리의 핵심).
- 옮길 수 있는 것: Zlib 라 코드도 된다(출처 표시, 고친 판임을 밝힐 것). **그러나 후처리 패스 자체가 GPU 값이 든다.** 우리 체스 장면은 이미 GPU 병목(21.6ms, 메모리 기록)이라 전체 화면 패스를 더하는 것은 재 본 뒤에 정한다.

### 4-3. protectwise/troika (troika-three-text)
- 주소: https://github.com/protectwise/troika · **MIT** · 별 1,987 · 푸시 2026-11-02 · 받음(9c89d51, 65MB)
- 읽은 파일: `packages/troika-three-text/src/`(목록) · `BatchedText.js:38-50` · `Text.js:148` · `FontResolver.js`(검색)
- 배운 구조:
  - 글꼴 파싱 → 조판 → SDF 생성을 **웹 워커**에서 한다. 재질은 기존 재질을 「파생」해 SDF 조각을 끼운다(`TextDerivedMaterial.js`).
  - `BatchedText` 는 여러 `Text` 를 **드로우콜 하나**로 묶는다(실험 표시, WebGL2 필요).
  - **기본값이 CDN 이다:** `unicodeFontsURL = null //defaults to CDN`(`Text.js:148`). 글꼴을 지정하지 않으면 바깥 서버에서 받는다.
- 옮길 수 있는 것: MIT 지만 46KB 라 못 넣는다. 한글 글꼴을 SDF 로 굽는 값도 따로 든다.
- 주의: CDN 기본값은 오프라인·개인정보·CSP 문제다. 쓰게 되면 반드시 글꼴 주소를 직접 준다.

### 4-4. yomotsu/camera-controls
- 주소: https://github.com/yomotsu/camera-controls · **MIT** · 별 2,450 · 푸시 2026-10-21 · 받음(c516011, 14MB)
- 읽은 것: `src/` 전체에서 `shake` 검색 → **0건.**
- 결론: **화면 흔들림 기능이 없다.** 부드러운 이동·경계·맞춤(fit)용이다. 그 밖의 구조는 읽지 않았다.

### 4-5. creativelifeform/three-nebula
- 주소: https://github.com/creativelifeform/three-nebula · **MIT**(LICENSE.md 「Copyright (c) 2018 a-jie & rohan-deshpande」) · 별 1,248 · 푸시 2026-10-22 · 받음(1264b62, 65MB)
- 읽은 것: `src/` 폴더 목록 · `src/behaviour/`(목록 15개) · `src/renderer/`(목록)
- 배운 구조: 내뿜개 → 초기화기 → 동작(끌림 · 밀림 · 중력 · 소용돌이 · 컬 노이즈 · 스프링 등 15종) → 렌더러(스프라이트 · 메시 · 리본 · GPU) 네 층이다. JSON 으로 효과를 불러올 수 있다.
- 옮길 수 있는 것: MIT 지만 23.5KB. **목록 수준만 봤다.** three.quarks 와 견주면 묶어 그리기가 덜 앞에 나와 있다(자세히는 읽지 않았다).

### 4-6. tweenjs/tween.js · GSAP
- tween.js: https://github.com/tweenjs/tween.js · API 는 `NOASSERTION`, **LICENSE 첫 줄 「The MIT License」** · 별 10,149 · 푸시 2026-11-09 · 받음(9ab7edf, 33MB)
  - 읽은 것: `src/` 목록(`Tween.ts` 20KB · `Easing.ts` 6KB · `Group.ts` · `Timeline.ts` 22KB).
  - gzip 3.7KB. 이징 식(`Easing.ts`)은 Robert Penner 식이라 필요한 서너 개만 직접 쓰면 수백 바이트다.
- GSAP: https://github.com/greensock/GSAP · 저장소에 라이선스 파일 없음(API 404) · 별 30,390
  - 라이선스 원문(https://gsap.com/community/standard-license/, 발효 2025-04-30): **상업 이용 포함 무료.** 금지는 「Webflow 와 겨루는 시각 애니메이션 제작 도구에 쓰기」 「경쟁 제품을 만들려고 역공학하기」 「표시 지우기」다. Webflow 가 위반 시 해지할 수 있다.
  - **오픈소스 라이선스가 아니다.** 재배포·오픈소스 호환은 페이지에 적혀 있지 않다(확인 못함). 27KB 라 어차피 못 넣는다.
- 대안: 지금처럼 직접 쓴 이징. 넣는다면 tween.js 가 가장 작다.

### 4-7. 화면 흔들림 · 히트스톱
- **pmndrs/drei `CameraShake`** — https://github.com/pmndrs/drei · MIT · 별 10,136 · 푸시 2026-10-21 · 받지 않음
  - 읽은 파일(API): `src/core/CameraShake.tsx` 전체
  - 기법: `흔들림 = 세기²`. 요·피치·롤 각각에 **심플렉스 소음(시간 × 주파수)** 을 곱해 처음 회전에 더한다. `decay` 면 세기를 초당 0.65 씩 줄인다. 기본 최대 각 0.1 라디안, 주파수 0.1.
  - **위치가 아니라 회전을 흔든다.** 그래서 조작기와 싸우지 않게 「조작기가 바뀔 때마다 처음 회전을 다시 잡는다」.
  - 옮길 수 있는 것: MIT. React 훅이라 그대로는 못 쓰고, **30줄쯤으로 다시 쓰면 된다**(소음은 three 의 `SimplexNoise` 애드온이나 사인 합으로 대신).
- **히트스톱:** 별이 있고 라이선스가 분명한 three.js·웹 구현을 **찾지 못했다.** 검색 `hitstop` 의 결과는 Unity·스카이림 모드이고, 웹 것은 `wrwcmaster/hitstop`(별 1 · 라이선스 없음)뿐이라 읽지 않았다. 기법 자체는 「연출 시계의 배율을 N ms 동안 0 으로」라 라이브러리가 필요 없다.

### 4-8. 툰 셰이딩 · 외곽선
- **pmndrs/drei-vanilla `Outlines`** — https://github.com/pmndrs/drei-vanilla · MIT · 별 620 · 푸시 2026-02-20 · 받지 않음
  - 읽은 파일(API): `src/core/Outlines.ts` 1~140줄
  - 기법: **뒤집힌 껍질.** 같은 지오메트리를 `BackSide` 로 한 번 더 그리되 정점을 법선 쪽으로 `thickness`(기본 0.05) 만큼 민다. `screenspace` 면 클립 공간에서 밀어 **멀어도 굵기가 같다.**
  - **스킨 메시와 인스턴스 메시를 따로 처리한다**(부모의 뼈대에 묶거나 `instanceMatrix` 를 같이 쓴다). 각진 모델은 `toCreasedNormals` 로 법선을 갈라 틈을 막는다.
  - 값: 외곽선을 켠 메시마다 **드로우콜이 하나 더** 든다.
  - 옮길 수 있는 것: MIT 라 셰이더 조각을 옮겨도 된다(고지). 40줄쯤이다.
- **OmarShehata/webgl-outlines** — https://github.com/OmarShehata/webgl-outlines · MIT · 별 415 · 푸시 2022-12-09(오래됨) · 받음(42e2103, 19MB)
  - 읽은 파일: `threejs/src/CustomOutlinePass.js`(검색) · `threejs/src/FindSurfaces.js`(검색)
  - 기법: **후처리 한 패스.** 깊이 + 법선 + 「면 번호」 버퍼(HalfFloat 렌더 타깃)를 따로 그리고 이웃 픽셀과의 차이로 선을 긋는다. 면 번호는 미리 **이어진 정점끼리 같은 번호**를 매겨 정점 색 속성으로 넣는다(`FindSurfaces`).
  - 옮길 수 있는 것: MIT. 그러나 장면을 한 번 더 그리는 값이라 GPU 병목인 우리에겐 무겁다. **뒤집힌 껍질 쪽이 싸다.**

### 4-9. 물 · 코스틱
- **martinRenou/threejs-caustics** — https://github.com/martinRenou/threejs-caustics · **BSD-3-Clause**(LICENSE.txt 「Copyright (c) 2020 Martin Renou」) · 별 372 · 푸시 2020-08-27(오래됨) · 받음(e24fa18, 15MB)
  - 읽은 파일: `index.js`(렌더 타깃 검색) · `shaders/` 폴더 목록
  - 구조: 물결 시뮬레이션(512² Float 타깃 두 장 핑퐁) → 환경 맵(1024² Float) → 코스틱(1536² Float) → 물 표면. **Float 렌더 타깃 네 장.**
  - 옮길 수 있는 것: BSD-3 이라 코드도 된다(고지 + 이름 광고 금지). **그러나 모바일에는 너무 무겁다.** 「코스틱 = 굴절된 광선이 모이는 정도」라는 생각만.
- `norio/three-stylized-water`(MIT · 별 80 · WebGPU+TSL) · `boona13/threejs-grass-water-shaders`(MIT · 별 15) — 정보만 봤다. 읽지 않았다.
- 우리 바다는 이미 `src/fx/` 에 있다. 코스틱이 필요하면 **미리 구운 무늬 텍스처 두 장을 엇갈려 흘리는** 싼 방법이 먼저다(이것은 이 저장소들에서 본 것이 아니라 일반 기법이다).

---

## 5. itch.io · 잼

페이지를 실제로 연 것만 적는다. 평점은 2026-11-10 에 읽은 값이다.

### 5-1. itch.io 「chess」 태그 (인기순 · 평점순 첫 쪽에서)

| 게임 | 한 줄 아이디어 | 평점(수) | 잼 |
| :--- | :--- | :--- | :--- |
| Shotgun King (PUNKCAKE) | 군대 대신 산탄총 든 킹 하나 | 4.8 (270) | Ludum Dare 50 |
| Chessformer (rob1221) | 말이 움직인 뒤 **떨어진다** — 체스 말 퍼즐 플랫포머 | 4.8 (163) | — |
| Rulehouse (Dalichrome) | **판마다 규칙이 바뀌고 앞 판 규칙이 쌓인다** (15판) | 4.7 (121) | Brackeys 2026.1 |
| CHARK (protzz) | 5×5 판 + 덱 빌딩, 킹 하나로 시작 | 4.5 (106) | Brackeys 2025.2 |
| Pawnbarian Classic (j4nw) | **카드 = 체스 수.** 4장 뽑아 그 수로 움직인다 | 4.4 (76) | 7DRL 2019 |
| Ending (st33d) | 턴제 전투 | 4.6 (63) | — |
| The Board Is Yours (Draelent) | 5×5 판에 말을 놓으면 **지배하는 칸에서 자원이 난다** — 체스 방치형 | 4.3 (42) | — |
| Rook (Raindrinker) | — | 4.6 (36) | Alakajam 7 |
| Chess Mix (Keith Burgun) | 1인용 전술 | 3.5 (35) | — |
| Pawned Souls (Mika) | 소울라이크 전투 + 엄격한 체스 규칙 | 4.5 (31) | — |
| Chess K.O. (kalasherr) | **잡기 없음. 밀어서 판 밖으로** | 4.9 (21) | — |
| MEGACHESS (Gorglomux) | — | 4.7 (21) | Acerola Jam 0 |
| Rooklite (Elias Guyd) | **지도가 체스판**, 칸 안에 반쪽 판 전투 | 4.2 (16) | — |
| Cursed Pawn (deflig) | 체스 덱 + 포커 더미, 강화와 저주 | 4.9 (16) | Gamedev.js 2025 |
| █ █ ▄ █ (Hempuli) | 체스 규칙 전투 + 설명 없는 지팡이 | 4.9 (12) | 7DRL 2026 |

평점 수 확인 못함(페이지에 값 없음): Last Chess Standing · Rook's Last Stand · Chesses(Pippin Barr) · The Ouroboros King DEMO · King for a Knight · Chesstris 2000.

### 5-2. 자세히 연 것

- **Rulehouse** — https://dalichrome.itch.io/house-rules
  - 15판, 판마다 다른 규칙·장소·인물. 댓글과 개발 일지에 나온 판: 외계인(특수 폰) · 판다(말 하나 적게 시작 + 시계) · 탈옥 · 샹치 식 판 · 「자물쇠」 말 · 앙파상 · 총.
  - 칭찬: 대사·초상·컷신의 유머, 판마다 다른 규칙. 불만: 외계인 판이 너무 어렵다, 판다 판의 시계가 거칠다, 브라우저에서 느리다.
- **CHARK** — https://protzz.itch.io/chark
  - 5×5, 킹 하나에서 눈덩이처럼 불린다. 손패 3장, 「되부르기」 단추, 상점, 음식 아이템(댓글에서).
  - 칭찬: 발라트로 같은 맛, 연출·소리. 불만: **체력이 왜 깎이는지 · 점수가 어떻게 나오는지 · 느낌표가 뭔지 · 판이 언제 끝나는지 모르겠다.** 너무 쉽게 눈덩이가 된다.
- **The Board Is Yours** — https://draelent.itch.io/theboardisyours
  - 목표는 5×5 판의 25칸을 모두 사는 것. 정식판은 스팀, 특전 50개 넘음.
  - **한 주기 = 두 걸음**(개발자 댓글): ①말이 자기가 **지배하는 모든 칸**에 생산한다 ②말이 그 칸에 쌓인 것을 수확한다. 특전·강화·말·칸을 살 때마다 규칙이 바뀌어 가장 좋은 배치도 달라진다.
  - 주기 속도 강화는 살수록 싸지고 마지막 것이 「생산 폭발」이 되게 했다.
  - 칭찬: 「너무 중독적」, 깊은 최적화. 불만: 가장 좋은 배치 찾기가 「완전히 무식한 대입」이었다, 「생산」「수확」 걸음 설명이 모자라다, 환생 전에 확인을 물어 달라.
  - 개발자는 배치 풀이 도구를 넣었다가 뺐다(무식한 대입이라 안내에 그쳐야 한다는 이유).
- **Chess K.O.: Out of board** — https://kalasherr.itch.io/chess-ko
  - 말은 원래대로 움직이되 **잡지 못하고, 말마다 고유한 「밀기 모양」** 이 있다. 체크메이트가 없으니 **상대 말을 모두 판 밖으로 밀면** 이긴다.
  - **강화를 고를 때마다 상대도 맞강화를 받는다.** 그래서 안전한 계획이 없다(댓글).
  - 밀림이 이어질 때 어떻게 풀리는지는 페이지에 없다(확인 못함). 댓글 6개.
- **Rooklite** — https://eliasguyd.itch.io/rooklite
  - 지도에서 나이트를 한 칸씩 움직이고 **지나온 길은 무너진다.** 적 진영 칸에 닿으면 카메라가 그 칸 안의 작은 판으로 들어간다.
  - 군대가 덱이다. 전투마다 **말 3개 + 킹**을 뽑아 떨어진 자리에 놓는다. 정해진 오프닝이 없다.
  - 시계 30초 + 수마다 2초. 체크메이트만 이기고, 시간이 다 되면 판이 끝난다.
  - 진 적의 말을 영입·강화·합성한다. 세계의 왕을 이기면 **그 왕의 특수 수를 내 왕이 배운다.**
  - 불만: 킹처럼 움직이는 나이트 + 방패·화약이 너무 세다, 비숍·폰이 약하다, 초보에게 시계가 가혹하다, 수집 화면이 처음부터 벅차다.
- **Cursed Pawn** — https://deflig.itch.io/cursed-pawn
  - 2주 제작. 한 판이 몇 분. Pawnbarian 을 영감으로 든다. 소스 링크 없음.
  - 불만: 적의 능력과 여러 버프·디버프가 헷갈린다.
- **Chessformer** — https://rob1221.itch.io/chessformer
  - 말은 체스대로 움직이되 **움직인 뒤 떨어지고, 멈출 때까지 다시 못 움직인다.** 움직이지 않는 상대 킹을 잡으면 끝.
  - 불만: 진행 저장이 없다(다 날렸다는 사람도 있다), 판이 더 있었으면(댓글에 「25판쯤」).
- **Pawnbarian Classic** — https://j4nw.itch.io/pawnbarian-classic
  - 턴마다 4장. 카드를 끌어 방향을 고르면 그 체스 수로 움직인다. 빨간 십자 칸에서 턴을 마치면 생명을 잃는다.
  - 불만: 적이 어느 칸을 공격하는지(특히 잡은 뒤 바뀔 때) 알기 어렵다, 카드 끌기가 직관적이지 않다.
- **█ █ ▄ █** (Hempuli) — https://hempuli.itch.io/chessrl
  - 윈도우 전용. 탑을 오르며 체스 규칙으로 싸우고 설명 없는 지팡이를 쓴다. 칭찬: 「매우 신비롭다」 — 규칙을 스스로 알아내는 맛.

### 5-3. Ludum Dare 50 — Shotgun King (잼 원작)
- 근거: ldjam.com API(`api.ldjam.com/vx/node2/get/285284`). 잼 부문, 72시간 안에 제작, 2022-04-05 공개.
- 한 줄: 「체스인데, 군대 전체를 왕실 산탄총 한 자루로 바꾼다」.
- 결과: 평가 243건. **종합 1위(4.624) · 재미 1위(4.599) · 혁신 2위(4.618)** · 주제 729위(3.629) · 그래픽 68위 · 소리 25위 · 유머 216위 · 분위기 59위.
  - 항목 이름은 LD 의 표준 순서(종합·재미·혁신·주제·그래픽·소리·유머·분위기)로 읽었다. 순서 자체는 API 에서 확인하지 못했다.
- 눈여겨볼 점: **주제 점수는 729위인데 종합 1위다.** 잼 주제(「피할 수 없는 것을 늦춰라」)에 맞추는 것보다 한 줄 아이디어와 손맛이 이겼다.
- 잼 뒤 정식판에서 더한 것(페이지 글): 이야기 모드와 난이도, 고친 인터페이스, 해자·창병·마법 지팡이·수류탄 카드.
- 개발 일지는 열지 않았다(확인 못함).

### 5-4. GMTK 잼의 체스 비틀기
- **Chess Dungeon**(kypello, GMTK 2020 「통제 불능」) — https://itch.io/jam/gmtk-2020/rate/695920
  - 「로그라이크가 된 체스」. **조종하는 말이 계속 바뀐다.**
  - 독창성 20위(4.450) · 종합 38위(4.225) · 재미 73위 · 연출 216위. 평가 111건.
  - 불만: 너무 쉽다(상점이 싸다), 상대가 더 세고 압박이 있었으면.
- **Pawn of the Dead**(Ennea 외, GMTK 2021 「이어 붙임」) — https://itch.io/jam/gmtk-2021/rate/1085002
  - 체스 + 던전 탐험. 독창성 108위 · 종합 119위(4.044) · 재미 378위. 평가 60건.
  - 불만: **적이 제멋대로 움직여 계획이 아니라 운으로 이긴다**, 걷는 연출이 느리다.
- **FINAL CHESS**(Ivy, GMTK 2023 「역할 뒤집기」) — https://itch.io/jam/gmtk-2023/rate/2161583
  - **양쪽을 번갈아 두며 모든 말을 없애 스테일메이트를 만드는** 1인 퍼즐. 킹이 앞장선다.
  - 종합 412위(3.920) · 창의 419위 · 재미 553위. 평가 46건.
- **수상작은 아니다.** 내가 연 GMTK 체스 출품작 가운데 종합 20위 안은 없었다. 가장 높은 것이 Chess Dungeon 의 종합 38위다.

---

## (가) 「구조만 배울 것」 대 「코드·에셋도 가져올 수 있는 것」

| 저장소 | 라이선스 | 판정 | 이유 · 조건 |
| :--- | :--- | :--- | :--- |
| lichess-org/lila | AGPL-3.0 | **구조만** | 저장소 규칙 |
| lichess-org/chessground | GPL-3.0 | **구조만** | 저장소 규칙 |
| fairy-stockfish/Fairy-Stockfish | GPL-3.0 | **구조만** | 저장소 규칙 |
| Trimps/Trimps.github.io | GPL-2.0 | **구조만** | 저장소 규칙 |
| keldaanCommunity/pokemonAutoChess · Jameskmonger/creature-chess | GPL-3.0 · AGPL-3.0 | **구조만**(열지도 않음) | 저장소 규칙 + 남의 IP |
| nuclear-unicorn/kittensgame | WET PAWS(자체) | **구조만** | 상업 이용·파생물 금지 |
| pmotschmann/Evolve · doublespeakgames/adarkroom | MPL-2.0 | **구조만 권함** | 파일째 가져오면 그 파일은 공개해야 한다. 수식·표 모양만 |
| greensock/GSAP | 자체 무료 | **쓰지 않음** | 오픈소스 아님, 해지 조항, 27KB |
| lichess-org/scalachess | MIT | 코드도 됨 | Scala 라 실제로는 훅 모양만 |
| IvarK/AntimatterDimensionsSourceCode | MIT | 코드도 됨 | 옮기기 표 · 떠난 사이 요약 표의 모양 |
| profectus-engine/Profectus | MIT | 코드도 됨 | `update()` 의 생각만 |
| Patashu/break_infinity.js · break_eternity.js | MIT | 코드도 됨 | 필요 없음 |
| Pseudo-Corp/SynergismOfficial | MIT | 코드도 됨 | 세대 번호로 낡은 계산 버리기 |
| Flaque/merchant.js | MIT | 코드도 됨 | 7년 멈춤, 생각만 |
| DougDougGithub/Chess-Chaos-Roguelike | MIT | 코드도 됨 | 가져올 코드 없음. **문구는 가져오지 않음** |
| shrechochek/evolution-chess | MIT | 코드도 됨 | 표 모양만. **말 그림은 확인 안 함 → 가져오지 않음** |
| dgreenheck/simcity-threejs-clone | MIT | 코드도 됨 | 상태 기계. **모델은 확인 안 함 → 가져오지 않음** |
| victorqribeiro/isocity | MIT | 코드도 됨 | 해시 공유 30줄. 텍스처는 opengameart 것 → 가져오지 않음 |
| amosborne/dorfperfekt | MIT | 코드도 됨 | 파이썬 → 다시 쓰기 |
| pmndrs/drei · drei-vanilla | MIT | 코드도 됨 | 흔들림 30줄 · 외곽선 셰이더 40줄(고지 + CREDITS) |
| pmndrs/postprocessing | Zlib | 코드도 됨 | 충격파 조각. 출처 표시 + 고친 판임을 밝힘 |
| Alchemist0823/three.quarks · three-nebula · troika · camera-controls · tween.js | MIT | 코드도 됨 | **크기 때문에 못 넣음** |
| OmarShehata/webgl-outlines | MIT | 코드도 됨 | 후처리 값이 큼 |
| martinRenou/threejs-caustics | BSD-3-Clause | 코드도 됨 | 고지 + 이름 광고 금지. 모바일에 무거움 |

에셋은 **어느 저장소 것도 가져오지 않는다.** 코드 라이선스와 에셋 라이선스가 다른 경우가 많고(지난번 pogicity 처럼), 이번에는 에셋 라이선스를 하나도 확인하지 않았다.

## (나) 가장 독창적이라고 본 아이디어 10개

1. **말이 지배하는 칸에서 자원이 난다** — 섬을 5×5 판으로 보고 말을 놓으면 「공격 범위 = 생산 범위」가 된다. 체스 지식이 그대로 방치 경제의 실력이 된다. 「생산 → 수확」 두 걸음. *(The Board Is Yours, itch 4.3/42)* — 주의: 가장 좋은 배치가 무식한 대입이 되지 않게 판을 작게, 규칙을 적게.
2. **떠나 있던 시간을 생산이 아니라 「빠른 시간」으로 돌려준다** — 돌아오면 일시불 숫자 대신 섬이 2배속으로 도는 것을 **본다.** 떠난 시간의 2/3, 2배속 8시간 상한, 120초 문턱. 마감·카운트다운 없이 「돌아올 이유」가 생긴다. *(Evolve `addATime`; 같은 계열로 Kittens Game 「시간 흐름」 60초당 5점 · Profectus 「매 틱 10% 흘려 넣기」)*
3. **잡지 않고 밀어낸다** — 말마다 고유한 밀기 모양, 판 밖으로 다 밀면 승리. 귀여운 동물이 「죽지」 않고 퐁당 빠진다. 바다에 둘러싸인 우리 판에 맞는다. *(Chess K.O., itch 4.9/21)*
4. **내가 강화를 고르면 상대도 맞강화를 받는다** — 보상이 곧 위험이라 안전한 눈덩이가 없다. CHARK·Chess Dungeon 이 받은 「너무 쉽게 불어난다」는 불만의 답이다. *(Chess K.O.)*
5. **판마다 규칙 한 줄이 바뀌고, 앞 판 규칙이 쌓인다** — 규칙은 「끝나는 조건 훅」 한 줄로 만든다(킹 오브 더 힐이 34줄). 주간 내용(G3)의 후보 묶음을 「이번 주 규칙」으로 쓸 수 있다. *(Rulehouse, itch 4.7/121 + scalachess `specialEnd` + Fairy-Stockfish `variants.ini` 옵션 표)*
6. **규칙 카드는 「수를 둔 뒤」 고른다** — 앞에 고르면 더 신나고 뒤에 고르면 더 공정하다(「15% 덜 신난다」). 규칙마다 `즉시/지속(최소~최대 턴)` 과 `킹 면역` 딱지를 붙인다. *(Chess-Chaos-Roguelike `api/rules.js` 머리 주석)*
7. **연속 정답이 시간을 번다** — 5·12·20·30 연속에 +3·+5·+7·+10초, 틀리면 −10초와 콤보 0. 문제는 쉬운 것부터, 같은 시각의 모두에게 같은 묶음. 퍼즐 바뀐 뒤 0.4초 입력은 버린다. *(lichess 퍼즐 스톰 `ui/storm/src/config.ts` · `lib/puz/combo.ts`)* — 주의: 화면의 시계가 우리 원칙과 맞는지 먼저 정한다.
8. **지도가 체스판이고, 칸 안에 작은 판이 있다** — 나이트로 지도를 걷고 지나온 길은 무너진다. 왕을 이기면 **그 왕의 특수 수를 배운다.** 우리 「섬 → 판」 전환과 라이벌 왕국에 맞는다. *(Rooklite, itch 4.2/16)*
9. **잡을 때마다 자라는 말, 세 갈래 진화** — 평평한 표 하나(`말: [다음 1, 다음 2, 다음 3]`)와 「벡터 + 미끄러짐」 움직임 정의. 우리 외형 단계(`build_looks.py`)와 새끼 → 어른이 그대로 이어진다. *(evolution-chess `evolution-tree.js` · `data.js`)*
10. **섬을 주소 한 줄로 공유한다** — 칸 값을 바이트 배열로 만들어 base64 해시에 넣는다(49칸이면 68글자). 서버 없이 자랑·구경이 되고, 뒤로 가기가 되돌리기다. *(isocity `updateHashState`)*

덤(순위 밖): 움직인 말이 떨어지는 중력 퍼즐 *(Chessformer 4.8/163)* · 카드가 곧 체스 수 *(Pawnbarian 4.4/76)* · 조종하는 말이 계속 바뀜 *(Chess Dungeon, GMTK 2020 독창성 20위)* · 양쪽을 번갈아 두어 스테일메이트 만들기 *(FINAL CHESS)* · 설명하지 않는 도구 *(Hempuli)*.

**반복해서 나온 불만 세 가지(피할 것):** ①무슨 일이 왜 일어났는지 모르겠다(CHARK · Cursed Pawn · Pawnbarian · The Board Is Yours) ②너무 쉽게 눈덩이가 된다(CHARK · Chess Dungeon · Rooklite) ③적이 제멋대로라 운이다(Pawn of the Dead).

## (다) 받지 않았거나 못 연 것

**크기 때문에 받지 않고 API 로 파일만 읽은 것**
- lichess-org/lila(732MB) · pmotschmann/Evolve(372MB) · doublespeakgames/adarkroom(401MB) · pmndrs/postprocessing(262MB, 상한 아래지만 효과 파일 셋만 필요해서)

**받았다가 지운 것**
- Pseudo-Corp/SynergismOfficial — API 크기 132MB, 실제 354MB. 두 파일을 읽고 지웠다.

**일부러 열지 않은 것**
- keldaanCommunity/pokemonAutoChess(GPL · 1.1GB · 남의 IP) · pokeclicker/pokeclicker(라이선스 없음 · 남의 IP) · Jameskmonger/creature-chess(AGPL) · reneodlt/civitas · dunkean/magna-urbis(AGPL)
- XJYdemons/JinChanChanTool · n5za/chess-mate — 자동화·봇 도구라 받지 않았다.

**정보만 보고 읽지 않은 것**
- nroutasuo/level13 · ihtasham42/progress-knight · Acamaeda/The-Modding-Tree · norio/three-stylized-water · boona13/threejs-grass-water-shaders · thorsten/Voltopia · emollick/monument-brutalist-city-builder · trymnilsen/kingdomarchitect
- three-nebula · tween.js · camera-controls 는 받았지만 **폴더 목록과 검색만** 했다. 함수 전체는 읽지 않았다.

**못 연 것 · 확인 못한 것**
- itch.io 가 요청을 막은 쪽(429): GMTK 2021 `rate/1081908`(Checkmates) · GMTK 2024 `rate/2909743` · GMTK 2020 `rate/697808`. 검색 결과에만 있었고 직접 확인하지 못했다.
- Shotgun King 개발 일지 — 열지 않았다. 소스는 비공개다.
- Idle Game Maker(Orteil) — 찾지 않았다.
- 히트스톱의 믿을 만한 웹 구현 — 찾지 못했다.
- Islanders · Dorfromantik 의 별 많은 오픈소스 클론 — 찾지 못했다.
- Fairy-Stockfish `variants.ini` 의 변형 수 — 세지 못했다(검색 도구 오류). 옵션 줄만 읽었다.
- 번들 크기를 우리 빌드에 넣어 잰 값 — **재 보지 않았다.** 표의 값은 bundlephobia 것이다.
- 받은 저장소의 에셋 라이선스 — 하나도 확인하지 않았다.

## 받은 저장소 (`D:\tmp\rea-2026-11-10\`, 모두 `--depth 1`, 실행 안 함)

| 폴더 | 커밋 | 크기 |
| :--- | :--- | ---: |
| AntimatterDimensionsSourceCode | 5409e32 | 167MB |
| simcity-threejs-clone | 9116cf6 | 89MB |
| troika | 9c89d51 | 65MB |
| three-nebula | 1264b62 | 65MB |
| kittensgame | 30231f6 | 54MB |
| three.quarks | de7c207 | 47MB |
| scalachess | 24c1cbf | 41MB |
| tween.js | 9ab7edf | 33MB |
| evolution-chess | b070e75 | 31MB |
| Profectus | 09e5927 | 25MB |
| webgl-outlines | 42e2103 | 19MB |
| Fairy-Stockfish | 4e3d014 | 18MB |
| Chess-Chaos-Roguelike | a2b749b | 18MB |
| Trimps.github.io | b9edb1d | 16MB |
| threejs-caustics | e24fa18 | 15MB |
| camera-controls | c516011 | 14MB |
| chessground | b4f6050 | 12MB |
| break_infinity.js | 22a00b9 | 10MB |
| break_eternity.js | 7b564e5 | 8MB |
| isocity | c577241 | 6MB |
| **합계** | 20개 | **745MB** |

크기는 받은 직후 `du -sm` 값이다(`.git` 포함).
