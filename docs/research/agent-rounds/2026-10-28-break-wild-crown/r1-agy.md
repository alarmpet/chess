## 1. 깨뜨린 것

[결함 1] 승급 선택 UI 추가 시 엔진 하드코딩과 네트워크 전송 결함으로 인한 동작 파괴
어디: [`D:/chess/src/wizardChessEngine.js:2501`](file:///D:/chess/src/wizardChessEngine.js#L2501), [`:2148`](file:///D:/chess/src/wizardChessEngine.js#L2148), [`:3910`](file:///D:/chess/src/wizardChessEngine.js#L3910)
왜: §14.1은 승급 시 진화 계보(늑대 여왕, 곰 등)를 선택한다고 설계했으나, 엔진은 폰이 끝 열 도달 시 `options.promotion`을 무시하고 무조건 퀸으로 인스턴스화한다. 또한 원격 브로드캐스트(`sendMultiplayerMove`)에 `promotion: 'queen'`이 리터럴 상수로 박혀 있어 UI에서 나이트·비숍을 선택해도 상대 화면([`:3910`](file:///D:/chess/src/wizardChessEngine.js#L3910))에는 무조건 퀸으로 강제 동기화된다. AI(`chooseSmartAIMove`, [`:2747`](file:///D:/chess/src/wizardChessEngine.js#L2747)) 역시 승급 분기 없이 폰 상태로 국면을 평가하여 수가 왜곡된다.
근거: `const promoted = instantiatePiece('queen', piece.color, toR, toC);` ([`wizardChessEngine.js:2501`](file:///D:/chess/src/wizardChessEngine.js#L2501)), `promotion: 'queen'` ([`wizardChessEngine.js:2148`](file:///D:/chess/src/wizardChessEngine.js#L2148))
고치는 법: `executeChessMove`가 `options.promotion`을 넘겨받아 `instantiatePiece`로 전달하도록 수정하고, 2148줄의 하드코딩을 제거하며, 착수 완료 전 승급 비동기 모달 대기 락을 도입한다.
확신도: 높음

[결함 2] 본 소켓 장비 부착 시 `primaryMat` 재질 강제 덮어쓰기로 인한 외형 파괴
어디: [`D:/chess/src/wizardChessEngine.js:1520~1534`](file:///D:/chess/src/wizardChessEngine.js#L1520-L1534)
왜: §14.3은 머리·등·손 등 본 소켓에 장비를 부착한다고 했으나, `instantiatePiece`는 `SkeletonUtils.clone` 이후 트래버스하며 골드/스틸 외 모든 자식 메시를 단색 팀 재질(`primaryMat`)로 강제 덮어쓴다. 소켓에 장착된 무기·방패·모자의 고유 텍스처와 재질이 백색/흑색 석상 재질로 덧칠되어 상품 가치가 소멸한다.
근거: `child.material = primaryMat;` ([`wizardChessEngine.js:1533`](file:///D:/chess/src/wizardChessEngine.js#L1533))
고치는 법: 소켓 부착물에 `userData.isEquipment` 플래그를 부여해 `primaryMat` 치환 루프에서 예외 처리하거나, §12.3의 `keepMaterials` 파이프라인을 선행 구현한다.
확신도: 높음

[결함 3] 방패 피격 0.3초 지연 연출과 `attackSync` 불변 선언의 정면 충돌
어디: [`D:/chess/docs/PLAN.md:423`](file:///D:/chess/docs/PLAN.md#L423) 및 [`:442`](file:///D:/chess/docs/PLAN.md#L442)
왜: §14.4는 접촉 시각을 무기가 바꾸지 못한다고 보장했으나, §14.5는 방패 파괴 시 0.3초가 더 길어진다고 규정해 자체 충돌한다. [`wizardChessEngine.js:2440~2449`](file:///D:/chess/src/wizardChessEngine.js#L2440-L2449)의 안무는 `tApproach`, `tContact`, `tImpact`, `tStrikeDone`, 카메라 2차 베지어 곡선이 단일 타임라인으로 결합되어 있어, 0.3초를 임의 연장하면 카메라 보간 이탈 및 텔레메트리 테스트 실패를 초래한다.
근거: `접촉 시각(attackSync.contactSec)은 무기가 바꾸지 못한다` ([`PLAN.md:423`](file:///D:/chess/docs/PLAN.md#L423)), `방패 있음: 공격이 먼저 방패를 깨고(파편), 그다음 쓰러진다 → 0.3초 더 길다.` ([`PLAN.md:442`](file:///D:/chess/docs/PLAN.md#L442))
고치는 법: 0.3초 연장안을 폐기하고, 기존 `BLOW_CLIP_TIME`([`:2439`](file:///D:/chess/src/wizardChessEngine.js#L2439)) 내에서 방패 파편 파티클 교체로만 한정하여 전체 안무 시간을 유지한다.
확신도: 높음

[결함 4] 원거리 무기(활)와 근접 돌진(`applyConcreteTrajectory`) 안무 구조의 물리적 불일치
어디: [`D:/chess/docs/PLAN.md:429`](file:///D:/chess/docs/PLAN.md#L429), [`D:/chess/src/wizardChessEngine.js:2568~2572`](file:///D:/chess/src/wizardChessEngine.js#L2568-L2572)
왜: §14.4는 활의 '화살 궤적'을 비숍·룩·퀸의 장거리 포획에 쓴다고 했으나, 현재 포획 코드는 공격자가 대상의 정면 정지 위치(`strikePos`)까지 물리적으로 달려간 뒤([`:2572`](file:///D:/chess/src/wizardChessEngine.js#L2572)) 타격하도록 강제되어 있다. 원거리에서 활을 쏘려면 `tApproach` 이동을 건너뛰고 독립적인 화살 발사체 궤적 솔버를 새로 짜야 하므로 기존 이동 안무 아키텍처와 호환되지 않는다.
근거: `활 | 화살 궤적(비숍·룩·퀸 장거리 잡기에 어울림)` ([`PLAN.md:429`](file:///D:/chess/docs/PLAN.md#L429)), `applyConcreteTrajectory(u, startPos, strikePos);` ([`wizardChessEngine.js:2572`](file:///D:/chess/src/wizardChessEngine.js#L2572))
고치는 법: 활을 출시 무기 4종에서 제외하고 근접 타격 무기(검·망치·당근검·창)로 교체하거나, 발사체 궤적 파이프라인을 갖춘 Phase 6(야생 모드)로 연기한다.
확신도: 높음

[결함 5] 체크메이트 피니셔 타임라인 부재와 `stepKingFall`의 연출 독점
어디: [`D:/chess/docs/PLAN.md:426~429`](file:///D:/chess/docs/PLAN.md#L426-L429), [`D:/chess/src/wizardChessEngine.js:3593~3610`](file:///D:/chess/src/wizardChessEngine.js#L3593-L3610)
왜: §14.4는 무기별 메이트 피니셔(하늘 베기, 깃발 꽂기 등)를 제안했으나, 코드의 체크메이트 처리는 `stepKingFall`([`:3593`](file:///D:/chess/src/wizardChessEngine.js#L3593))이 패배한 킹의 비틀거림과 전도, 왕관 파괴를 단독 제어한다. 공격자 기물은 메이트 확정 시 모션이 정지되며 공격자 피니셔를 실행할 시퀀서 구조나 카메라 훅이 전무하다.
근거: `메이트 피니셔 | 하늘 베기 · 화면 2분할` ([`PLAN.md:426`](file:///D:/chess/docs/PLAN.md#L426)), `function stepKingFall(dt) {` ([`wizardChessEngine.js:3593`](file:///D:/chess/src/wizardChessEngine.js#L3593))
고치는 법: 공격자의 메이트 피니셔 연출을 출시 범위에서 제거하고, 킹 전도 시 발생하는 바닥 충격파 파티클만 무기 속성별로 다르게 분기한다.
확신도: 높음

---

## 2. 출시 후보 판정

| 후보 | 판정 | 한 줄 이유 | 수정이면 어떻게 |
| :--- | :--- | :--- | :--- |
| **A** (§14.1 캐스팅+승급) | **보류** | 승급 비동기 UI와 기물별 추적 엔진 개조에 약 14~18일 소요(추정)되어 출시 일정 붕괴 | 출시 시점엔 폰 1종 단일 모델 유지, 승급 선택 UI(Q/R/B/N)만 분리 선행 구현 |
| **B** (§14.4 무기 4종 이펙트) | **보류** | 원거리 발사체 궤적 부재 및 안무 타이밍 분리에 약 15~20일 소요(추정) | 원거리 활을 제외한 근접 3종의 타격 사운드/파티클 색상만 변경하는 경량형으로 축소 |
| **C** (§14.5 방패 연출) | **수정** | 0.3초 안무 연장 버그 수정 및 단순 파편 텍스처 교체로 구현 가능(약 7~10일 소요, 추정) | 0.3초 시간 지연을 삭제하고 기존 `BLOW_CLIP_TIME` 내 방패 분리 파편만 스폰 |
| **D** (§14.2 서사 훈장 3개) | **수정** | 3D 망토/성문 본 바인딩 비용은 과하나 카운터 원장은 가벼움(약 10~14일 소요, 추정) | 3D 장착 아이템을 제거하고 프로필 텍스트 칭호 및 2D 뱃지 해금으로 한정 |
| **K** (v0.5 KEEP) | **채택** | 1인 개발 리스크 방어와 Phase 0~1 성능 게이트(드로우콜 ≤40) 통과를 위한 유일한 실현 경로 | §14 전체를 Phase 6 이후로 미루고 v0.5 로드맵을 완수 |

---

## 3. 통합자가 못 본 것

1. **드로우콜 최적화 해법의 기술적 오류(스킨드 메시 병합·인스턴싱 불가)**
   통합자는 §14.9에서 224개 장비 메시 추가에 대해 "장비를 기물 메시에 병합 또는 인스턴싱 필요"라고 막연히 기술했다. 그러나 Three.js에서 애니메이션 본을 따라 변형되는 `SkinnedMesh`에 정적 장비 메시를 단순 병합(`BufferGeometryUtils.mergeGeometries`)할 수 없으며(장비도 동일한 본 가중치를 가진 스킨드 메시여야 함), `InstancedMesh`는 서로 다른 본 트랜스폼을 추적할 수 없어 스켈레탈 본에 부착되지 않는다. 이를 풀려면 변형 모델별로 장비를 사전 베이킹(Pre-baking)한 단일 GLB를 로드해야 한다.
2. **혼합 군단 동기화 시 Supabase 페이로드 및 모바일 히칭(Hitching)**
   현재 멀티플레이 패킷([`:2143~2150`](file:///D:/chess/src/wizardChessEngine.js#L2143-L2150))은 좌표와 색상만 보낸다. 16칸 혼합 편성을 지원하려면 대국 시작 시 각 기물의 액터 ID·티어·장비 메타데이터를 교환해야 한다. 서버 측 인벤토리 검증이 없는 상태에서 위조된 모델 ID 전송 시 상대 렌더러 크래시 위험이 있으며, 상대의 16개 커스텀 GLB를 런타임에 동적 다운로드할 때 심각한 프레임 드랍이 발생한다.
3. **CI 자산 규격 검약 파괴**
   [`test/applet.test.mjs:48~56`](file:///D:/chess/test/applet.test.mjs#L48-L56)은 번들 자산으로 오직 7개 GLB 모델(`option8_cathedral` 및 기본 기물 6종)만을 엄격히 단언(assert)하고 있다. §14의 배우·무기 확장은 CI 테스트 스위트 전체를 다시 설계해야 함을 의미한다.

---

## 4. 가장 약한 결정 하나

**가장 약한 결정**: §14.3의 "7슬롯 동적 본 소켓 장비 부착 파이프라인"
**재는 방법**:
- **드로우콜 실측 벤치마크**: 32개 기물 중 폰 8개에 머리·손·방패 3개 소켓 장비를 부착하고, 4개 기물이 동시 공격/이동하는 국면에서 `renderer.info.render.calls`를 측정한다. 드로우콜이 §4.4 예산인 40을 초과하여 70 이상으로 치솟는지 수치로 검증한다.
- **모바일 FPS 및 메모리 프로파일링**: 모바일 저사양 기기에서 32개체 다중 소켓 씬 로드 시 60fps 유지 여부와 본 매트릭스 업데이트 부하(`skeleton.update()`)로 인한 CPU 병목을 측정한다. 40 드로우콜 초과 및 60fps 미달 시 즉시 '단일 프리베이킹 모델 로드 방식'으로 회귀한다.
EXIT=0 
