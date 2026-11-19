codex
# WILD CROWN × 「Grow a Garden」 참조 설계안

영상에서 검증된 성공 공식으로 받아들일 수 있는 것은 없다. 동시접속·매출 수치는 **영상 주장**이며, 이 설계안의 근거로 쓰지 않는다([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:11)). 가져올 후보는 *짧은 행동 → 눈에 보이는 변화 → 다음 목표*라는 화면 구조와, 작은 변경을 자주 시험하는 운영 방식이다([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:17), [VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:27)).

## 1. 가져올 것

| 영상의 요소 | 우리 게임에 어떻게 | 어디를 고치나 | 첫 버전 크기 | 재는 방법 |
| :--- | :--- | :--- | :--- | :--- |
| 「심는다 → 기다린다 → 판다」 세 단계([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:17)) | 「한 판 둔다 → 섬이 자란다 → 다음 목표를 고른다」를 결과·섬 화면에 한 줄씩 보여 준다. 판을 건너뛰면 수확도 없다는 규칙을 명확히 한다. | 결과 연결 [App.tsx](/D:/chess/src/App.tsx:8), 정산 [economy.js](/D:/chess/src/village/economy.js:243), 섬 진입 [VillageView.tsx](/D:/chess/src/VillageView.tsx:56) | 기존 결과와 섬 화면의 안내·동선만 수정 | 사람 시험에서 판 뒤 섬 진입 여부, 다음 목표를 스스로 말하는지 기록. 현재 계획의 시험 B 기준과 함께 판단([island-economy-plan.md](/D:/chess/docs/plans/2026-11-02-island-economy-plan.md:194)). |
| 자라는 밭을 한눈에 보여 주는 화면([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:22)) | 기존 계획의 칸 농장에 판 종료 수확을 시각화한다. 재접속 보상으로 설명하지 않는다. | 현재 밭은 판 종료 시 곡물을 한 번 지급한다([economy.js](/D:/chess/src/village/economy.js:184)); 칸 농장 규칙은 [island-economy-plan.md](/D:/chess/docs/plans/2026-11-02-island-economy-plan.md:103) | 먼저 기존 밭의 수확 전후 표시, 이후 계획된 칸 농장 | 수확을 알아차리는지, 섬에서 칸을 직접 만지는지. 경제 속도는 기존 `test/village.test.mjs`의 수확·창고·시장 사례를 갱신해 확인([village.test.mjs](/D:/chess/test/village.test.mjs:59)). |
| 매주 새 이벤트를 보여 주는 리듬([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:27)) | **매주 하나의 작은 가설**을 시험한다. 첫 후보는 사건 카드 한 종류나 섬의 수확 표현 한 가지다. 매주 새 보상 체계를 약속하지 않는다. | 사건은 수 목록에서 재생할 수 있다([roster.js](/D:/chess/src/village/roster.js:43)); 사건 카드 순서는 [island-economy-plan.md](/D:/chess/docs/plans/2026-11-02-island-economy-plan.md:224) | 한 변경, 한 관찰 질문, 한 되돌리기 단위 | 배포 전후 같은 사람 시험 질문을 비교한다. 로컬 기록만으로 전체 이용자 유지율을 주장하지 않는다([store.ts](/D:/chess/src/cards/store.ts:33)). |
| 큰 숫자·목록·전후 비교로 설명하는 형식([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:36)) | 홍보 쇼츠에서 실제 판의 수, 얻은 카드, 변한 섬 칸을 짧게 보여 준다. | 정산 요약 [economy.js](/D:/chess/src/village/economy.js:266), 사건 집계 [roster.js](/D:/chess/src/village/roster.js:68) | 플레이 녹화 한 편과 확인된 자막 | 영상에 표시한 수치·보상이 동일 빌드에서 재현되는지 출시 전 대조 |

## 2. 바꿔서 가져올 것

- **꺼 둬도 자라는 밭 → 판이 끝나면 자라는 밭.** 기존 섬 계획은 실시간 타이머·썩음·물 주기 없이 판 종료를 성장 단위로 정했다([island-economy-plan.md](/D:/chess/docs/plans/2026-11-02-island-economy-plan.md:112)). 현재 `tickVillage`의 4시간 라이벌 선물은 이 원칙과 충돌하므로, 계획대로 판 끝 손님과 꾸미기 선물로 이전한다([economy.js](/D:/chess/src/village/economy.js:361), [island-economy-plan.md](/D:/chess/docs/plans/2026-11-02-island-economy-plan.md:179)). 구현 시 섬을 열 때 호출하는 지점도 함께 제거해야 중복 선물이 남지 않는다([VillageView.tsx](/D:/chess/src/VillageView.tsx:63)). 단, “실제 시간을 쓰는 유일한 곳”이라는 설명은 정확하지 않다. 쓰다듬기 하트에도 날짜별 한도가 있다([economy.js](/D:/chess/src/village/economy.js:343)). 이것은 별도 규칙으로 명시하고, 이번 방문 변경과 섞지 않는다.
- **희귀 상점 → 얻는 길이 보이는 라이벌 쇼케이스.** 영상의 품절·재입고 화면([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:29)) 대신 라이벌의 장식을 누르면 승리 조건과 진행도를 보여 준다. `legend` 팩에는 이미 라이벌별 착용물과 순서 있는 보상이 있다([pack.json](/D:/chess/public/packs/legend/pack.json:594)); 쇼케이스 계산과 검증 테스트도 있다([packManifest.js](/D:/chess/src/packs/packManifest.js:285), [looks.test.mjs](/D:/chess/test/looks.test.mjs:132)). 사람 시험에서는 아이가 “돈으로 사는 것”과 “이겨서 얻는 것”을 구별하는지 확인한다([desire-plan.md](/D:/chess/docs/plans/2026-11-02-desire-plan.md:111)).
- **매주 이벤트 → 저장과 되돌리기가 가능한 작은 배포.** 현재 카드는 `wildcrown.cards.v1`, 섬은 `wildcrown.village.v1`에 따로 저장되고, 섬 데이터는 내부 `v: 1 → 2` 이전을 거친다([cards/economy.js](/D:/chess/src/cards/economy.js:3), [village/economy.js](/D:/chess/src/village/economy.js:5), [village/economy.js](/D:/chess/src/village/economy.js:106)). 매주 작업은 다음 절차로 제한한다.

  1. 변경 전, 기존 저장 자료의 복사본과 재현 판을 준비한다. 저장 실패를 현재 코드가 조용히 넘기므로, 용량 부족·차단 상태도 확인한다([village/store.ts](/D:/chess/src/village/store.ts:12), [cards/store.ts](/D:/chess/src/cards/store.ts:12)).
  2. 새 필드는 읽을 때 기본값을 채우고, 옛 저장을 읽는 이전 함수를 둔다. 모르는 버전을 새 마을로 돌리는 현재 처리([economy.js](/D:/chess/src/village/economy.js:114))에 실제 이용자 저장이 닿지 않게 한다.
  3. `npm test`, `npm run lint`, `npm run build`를 통과시킨다([package.json](/D:/chess/package.json:7)). 변경에 따라 수확·방문·저장 이전 테스트와 판 이어 하기·주머니 중복 지급 테스트를 확인한다([village.test.mjs](/D:/chess/test/village.test.mjs:216), [resume.test.mjs](/D:/chess/test/resume.test.mjs:64), [pouch.test.mjs](/D:/chess/test/pouch.test.mjs:11)).
  4. 배포 뒤에는 새 저장과 옛 저장에서 한 판을 마치고 새로고침한다. 문제가 나면 직전 빌드로 되돌리고 **새 버전이 쓴 저장도 직전 코드가 읽을 수 있는지** 확인한다. 읽을 수 없다면 되돌릴 코드에 호환 읽기를 먼저 넣는다. 서버가 없으므로 사람 시험 기록은 동의를 받고 수동으로 모은다.

## 3. 가져오지 않을 것

영상의 유료 알 뽑기·성장 가속·재입고 카운트다운([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:29))은 현행 욕망 계획의 구매·재방문 원칙과 맞지 않는다([desire-plan.md](/D:/chess/docs/plans/2026-11-02-desire-plan.md:91), [desire-plan.md](/D:/chess/docs/plans/2026-11-02-desire-plan.md:122)). 특히 아동 대상 수익화에서 감정을 자극해 구매를 유도하는 방식은 [Google Play 가족 정책](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)의 검토 대상이다. 무료 카드와 유료 상품의 연결 여부도 출시 전 별도로 검토해야 한다. 유상 무작위 상품에는 [Google Play의 확률 고지 요건](https://support.google.com/googleplay/android-developer/answer/6223646?hl=en)이 있다.

## 4. 틀릴 수 있는 곳 셋

1. **섬을 보여 줘도 체스를 한 판 더 두고 싶어지지 않을 수 있다.** 섬 체류만 보지 말고 다음 판 시작 여부와 “왜 다시 두었나”를 함께 묻는다([fun-plan.md](/D:/chess/docs/plans/2026-11-02-fun-plan.md:103)).
2. **칸 농장이 경제를 너무 빨리 채울 수 있다.** 지금의 밭·빵집·시장 순차 정산([economy.js](/D:/chess/src/village/economy.js:184))에 작물별 창고를 얹으면 기존 수확 테스트와 완성 판 수가 달라진다. 계획의 봇 측정을 다시 돌린다([island-economy-plan.md](/D:/chess/docs/plans/2026-11-02-island-economy-plan.md:128)).
3. **짧은 쇼츠가 실제 기능보다 강한 약속으로 읽힐 수 있다.** 영상의 “매주 고친 속도가 이겼다”는 인과 해석([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:32))을 우리 성과 주장으로 옮기지 않는다. 홍보물의 숫자·전후 화면은 동일 빌드의 실제 플레이로 확인하고, 개발 예정 기능은 시연 장면과 구분한다. 한국 게임산업법은 해당 확률 정보의 게임 내 표시뿐 아니라 광고·선전물 표시도 규정한다([국가법령정보센터](https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=1&chrClsCd=010202&efYd=20241022&gubun=api&lsiSeq=265811&mobile=&urlMode=lsInfoP)).

## 5. 가장 약한 결정 하나

**“매주 하나씩 배포”라는 주기 자체다.** 영상은 매주 이벤트와 성장 수치를 함께 보여 주지만, 그 주기가 성장을 만들었다는 증거는 이 자료에 없다([VIDEO.md](/D:/chess/.reports/consult-garden/VIDEO.md:27)). 1인 개발에서는 저장 이전이나 체스 회귀를 서두를 위험도 있다. 따라서 첫 운영 목표는 **매주 가설을 점검하고, 검증을 통과한 변경만 배포하는 것**으로 둔다. 배포 횟수보다 판을 끝낸 뒤 다음 목표를 이해하고 다시 두는지를 기준으로 계속 여부를 정한다.
