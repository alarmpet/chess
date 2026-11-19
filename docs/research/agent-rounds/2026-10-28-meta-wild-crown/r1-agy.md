## 1. 네 영역의 설계안 ([A] 대전 기술)

### 구조 (Architecture)
- **1단계 매칭 방식**: **4자리 방 코드(`wizardChessEngine.js:4029-4033`) + 초대 링크(`?room=ABCD`)**. 자동 매칭은 1단계에서 제외(동시 접속자 풀 없음, 큐 서버 비용). URL 파라미터 감지 시 자동 입장.
- **전송층**: **Supabase Realtime (Broadcast 채널: `room:{code}`) 단일화**.
  - 기존 `mpApiRequest` 기반 SSE/폴링/BroadcastChannel(`:3824~4013`)은 폐기.
  - Vercel 함수는 상태 유지 불가 및 타임아웃 제약, WebRTC P2P는 TURN 서버 없이는 통신사/대칭형 NAT 실패율 발생.
  - `applyRemoteRoomState`(`:3956~3980`)의 `isAnimatingMove` 대기 큐(`tryApplyNext`) 및 `{ fromRemote: true }` 실행 안무 자산은 계승.
- **계정 및 데이터 이관**:
  - 시작: 비로그인 게스트 즉시 플레이 (`localStorage`에 `wizard_chess_token` 보관, 외부 네트워크 요청 0).
  - 이관: `D:\study-game` 및 `social-login-supabase` 스킬의 `cloud_saves` RLS 스키마 재사용. 소셜 로그인(구글/카카오) 성공 시 `user.id`에 로컬 데이터를 커밋. 클라우드에 기존 세이브 존재 시 1회 선택 팝업.
- **치트(결과 조작) 방지 최소선**:
  - Phase 0b에서 도입되는 `chess.js 1.4.0`을 양측 피어에서 런타임 심판으로 가동.
  - 수신된 수(`movePayload`)를 로컬 `chess.js`에 입력해 불법수 검증. 불합법 시 즉시 접속 차단 및 몰수패.
  - 경기 종료 및 승패 확정 역시 로컬 `chess.js.isGameOver()`가 참일 때만 결과 인정 및 정산.
- **기존 `/api/rooms` 코드 처분**:
  - 통신층(fetch/SSE/interval polling/BroadcastChannel)은 **폐기**.
  - Three.js 착수 애니메이션 버퍼링 및 수신 동기화 로직은 **살림**.

### 왜 (Why)
- 1인 개발 + 서버 운영 인력 없음. 상시 서버리스 웹소켓이나 전용 게임 서버를 유지할 수 없음.
- `D:\study-game`에 `@supabase/supabase-js ^2.117.2` 및 소셜 로그인/계정/법무 자산이 이미 실측 검증되어 있음.

### 틀릴 수 있는 곳 셋
1. **Supabase Realtime 무료 티어 한도 및 모바일 연결 불안정**: 동시 연결 수/메시지 수 상한 초과 또는 모바일 백그라운드 전환 시 웹소켓 복구 실패 가능성 (정확한 수치는 이번에 재 보지 않았다).
2. **Three.js 안무 실행 중 착수 큐 레이스 컨디션**: `standoff 0.22`, 공격 클립 재생 중 수신 패킷이 몰릴 때 `tryApplyNext`(120ms/250ms)와 `chess.js` 턴 상태 간의 비동기 디싱크.
3. **P2P 환경에서의 고의 이탈(Rage-quit) 판정 한계**: 중계 권위 서버가 없어 한쪽이 브라우저를 닫을 때 하트비트 타임아웃 판정을 클라이언트끼리 확정 짓기 어려움.

### 하지 않을 것
- 중앙 게임 권위 서버(Authoritative Server) 구축.
- 실시간 ELO 큐 기반 자동 매칭(Matchmaking) 서버 개발.
- TURN 인프라가 필요한 WebRTC P2P 도입.

### 가장 약한 결정
- "별도 서버 검증 없이 클라이언트 상호 `chess.js` 검증으로 랭크 승패를 확정하는 것". 변조된 클라이언트의 악의적 DB 직단 위조를 100% 차단하기 어려움.

---

## 2. 기획서 v0.3 과 충돌하는 곳

[충돌 1] 멀티플레이어 개발 일정의 과소 추정
어디    `D:\chess\docs\PLAN.md` §9 로드맵 (line 211)
무엇을  "| **5. 대전 · 출시** | 2주 | 멀티플레이 · PGN · 튜토리얼 · 모바일 | Vercel · Play 준비 |"
왜      2주 안에 "멀티플레이 · PGN · 튜토리얼 · 모바일"을 모두 구현하는 것은 불가능함. 메타게임(코인/등급)과 계정 연동, Realtime 통신 및 안무 큐가 결합되면 대전 네트워크 작업만으로 2주를 넘김.
고치는 법 Phase 0a에서 멀티플레이 상태 인터페이스를 미리 분리 정의하고, 대전 프로토콜 연동 일정을 독립 Phase로 확대.
확신도  높음

[충돌 2] 단위 테스트가 로비 및 대전 UI를 금지함
어디    `D:\chess\test\applet.test.mjs:38-40`
무엇을  
```javascript
    'btn-lobby',
    'lobby-modal',
    'room-pill',
```
왜      단일 플레이어 전용 HUD 유지를 위해 테스트가 위 DOM id들을 `Forbidden UI element`로 검사하고 있어, 기존 대전 UI를 복구하면 테스트가 실패함.
고치는 법 대전 UI를 기존의 모달 방식이 아닌 오버레이 라우터 방식으로 분리하거나, 대전 기능 복구 시 해당 테스트의 금지 목록을 개정.
확신도  높음

[충돌 3] 기존 멀티플레이 코드는 동작하지 않는 빈 껍데기임
어디    `D:\chess\src\wizardChessEngine.js:3824` (및 `D:\chess\docs\PLAN.md` §1.1 line 36)
무엇을  "const CLOUD_MP_API_BASE = '';"
왜      기획서 §1.1은 멀티플레이 코드를 "유지 · Phase 5"로 명시했으나, 실제 백엔드 API가 없어 브라우저 탭 간 `BroadcastChannel`로만 작동함. "유지"할 수 있는 백엔드가 없음.
고치는 법 §1.1 표기에서 "멀티플레이 유지"를 "수신 애니메이션 큐만 유지, 전송층은 Supabase Realtime으로 전면 재작성"으로 변경.
확신도  높음

---

## 3. 통합자 가정("랭크는 외형만")에 대한 판정

**유지**
- **근거**: `D:\chess\docs\PLAN.md` §4.5(line 155)에서 규칙 엔진을 `chess.js 1.4.0`으로 교체하기로 확정함. `chess.js`와 Stockfish는 오직 표준 체스 규칙만 검증 가능함. 기물에 특수 능력치(FIFA식 스탯 차별)를 부여할 경우, 표준 체스 엔진을 사용할 수 없어 커스텀 규칙 엔진을 별도로 작성해야 하며, 서버 없는 P2P 환경에서 규칙 검증 및 치트 방지 복잡도가 폭증함. 따라서 랭크는 표준 규칙 기반 외형(스킨/VFX/사운드)만 적용하고 능력 기물은 배제하는 것이 타당함.

---

## 4. 네 자료에서만 드러나는 것

1. **`applet.test.mjs`의 명시적 로비 UI 차단 가드**: `btn-lobby`, `lobby-modal`, `room-pill`이 App.tsx에 포함되는 순간 실패하도록 하드코딩 검사가 걸려 있음.
2. **`wizardChessEngine.js`의 멀티플레이는 '동일 브라우저 탭 간' 기능**: `CLOUD_MP_API_BASE = ''`이며, 서버 요청 실패 시 `localStorage`와 `BroadcastChannel`로 폴백하도록 되어 있어 현재 외부 기기와의 통신 기능은 0%임.
3. **`D:\study-game`에 이미 검증된 Supabase 인프라 자산 존재**: `@supabase/supabase-js ^2.117.2` 패키지, `public.cloud_saves` RLS 테이블 스키마, `installAccount` 게스트-소셜 로그인 연동 흐름, Play 데이터 보안 가이드가 이미 완성되어 있어 즉시 이식 가능함.
4. **애니메이션 대기 큐(`tryApplyNext`) 존재**: `wizardChessEngine.js:3957~3979`에 원격 착수 패킷이 도착해도 로컬 3D 애니메이션(`isAnimatingMove`) 종료를 기다린 후 순차 실행하는 버퍼 구조가 이미 구현되어 있음.

---

## 5. 우선순위 셋

1. **P1. 원격 착수 동기화 지연 및 안무 충돌로 인한 게임 프리즈 (Desync/Hang)**: 상대 착수 패킷과 Three.js 근접 안무(`executeChessMove`) 실행 타이밍이 어긋나 `isAnimatingMove` 락이 풀리지 않고 게임이 멈추는 결함 방지.
2. **P2. 게스트 진행도 유실 및 클라우드 동기화 덮어쓰기 사고**: 비로그인 상태의 코인/스킨 획득 데이터가 브라우저 캐시 삭제 시 증발하거나, 계정 로그인 시 빈 클라우드 데이터로 로컬을 덮어쓰는 데이터 손실 방지.
3. **P3. 상대방 이탈/네트워크 두절 시 무한 대기**: P2P 환경에서 상대가 창을 닫거나 연결이 끊겼을 때 턴 타임아웃/몰수승 처리가 되지 않아 방에 갇히는 현상 방지.
EXIT=0 
