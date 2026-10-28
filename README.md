# 🧙‍♂️ 3D 위저드 체스 (Wizard Chess 3D)

> **Google AI Studio**의 플래그십 3D 쇼케이스 데모이자, 해리 포터의 마법사 체스를 웹 브라우저에서 실감나게 즐길 수 있는 오픈소스 3D 체스 게임입니다.

![Wizard Chess 3D](https://raw.githubusercontent.com/djai32521/wizard-chess-3d/main/public/preview.png)

---

## ✨ 주요 특징 (Features)

1. **웅장한 고딕 대성당(Cathedral) 3D 환경**:
   - 실시간 아치형 천장, 제단, 스테인드글라스 및 그림자 렌더링
   - 3중 레이어의 볼륨 화로 불꽃 커스텀 GLSL 셰이더 & 숯불 엠버 연출
2. **시네마틱 근접 격투 & 석재 파괴 물리 (Stone Shatter Physics)**:
   - 기물이 상대를 잡을 때 직접 다가가 무기를 휘두르는 근접 전투 애니메이션
   - 타격 순간 32개의 3D 돌 파편이 사방으로 폭발하며 튀는 물리 시뮬레이션
3. **체크메이트 킹 전도(Fall-Over) 연출**:
   - 대국 종료 시 패배한 킹이 슬로우 모션으로 쓰러지며 왕관과 돌가루가 튀는 시네마틱 효과
4. **4종 카메라 프리셋 & 자유 비행 모드**:
   - 플레이어 1인칭 체감 시점, 탑다운 수직 전술 시점, 측면 시점, 대성당 전경 시점
   - PC 전용 `WASD + R/F` 3D 자유 비행 카메라 모드
5. **싱글 플레이어 전술 AI 탑재**:
   - 친구 없이도 언제든 백/흑 진영을 선택하여 AI와 1:1 대국 가능
6. **한국어 / 영어 완벽 지원**:
   - 상단 HUD 버튼으로 원클릭 실시간 언어 토글 (기본 한국어)
7. **모바일 / 태블릿 완벽 대응**:
   - 1손가락 회전, 2손가락 패닝, 핀치 줌 터치 제스처 및 슬라이드 UI 지원

---

## 🚀 빠른 시작 (Quick Start)

어떤 PC(Windows, macOS, Linux)에서든 **Node.js (v18 이상)**만 설치되어 있다면 바로 실행할 수 있습니다.

### 1. 저장소 클론
```bash
git clone https://github.com/alarmpet/chess.git
cd chess
```

### 2. 의존성 패키지 설치
```bash
npm install
```

### 3. 로컬 개발 서버 실행
```bash
npm run dev
```
터미널에 표시되는 로컬 주소(예: `http://localhost:3000`)를 웹 브라우저(Chrome, Edge, Safari 등)에서 열면 바로 게임을 플레이할 수 있습니다!

### 4. 프로덕션 빌드 & 미리보기
```bash
npm run build
npm run preview
```

---

## 🕹️ 조작법 가이드 (Controls)

| 환경 | 동작 | 설명 |
| :--- | :--- | :--- |
| **공통** | **말 선택 및 이동** | 마우스 클릭 또는 화면 터치로 기물을 선택하고 이동 가능한 칸을 누릅니다. |
| **PC** | **마우스 좌클릭 드래그** | 체스판 주변 카메라 궤도 회전 (Orbit) |
| **PC** | **마우스 우클릭 드래그** | 화면 평행 이동 (Pan) |
| **PC** | **마우스 휠 스크롤** | 줌 인 / 줌 아웃 (Zoom In / Out) |
| **PC** | **WASD + R/F** | 3D 공간 자유 비행 이동 (R: 상승, F: 하강) |
| **PC** | **키보드 H** | UI 숨기기/보이기 토글 (시네마틱 관람 모드) |
| **모바일** | **1손가락 드래그** | 체스판 카메라 회전 |
| **모바일** | **2손가락 드래그** | 화면 평행 이동 |
| **모바일** | **핀치 (두 손가락)** | 화면 확대 / 축소 |

---

## 🛠️ 기술 스택 (Tech Stack)

* **프론트엔드**: React 19, TypeScript, Vite
* **3D 그래픽스 & 애니메이션**: Three.js (r170), GLTFLoader, SkeletonUtils, OrbitControls
* **셰이더 & 이펙트**: Custom GLSL (Brazier Fire & Charred Embers, Procedural Stone Noise)
* **에셋 파이프라인**: 3D 바이너리 모델 스트리밍 (`.glb.gz.b64` ➔ `DecompressionStream('gzip')`)
* **팩 매니페스트** (`public/packs/<id>/pack.json`): 기물 모델·역할→클립 매핑(`idle`·`move`·`attack`·`shatter`)·`attackSync` 타이밍·`keepMaterials` 를 팩 단위로 선언. `?pack=<id>` 로 선택하며 없거나 깨진 팩은 `cathedral` 로 폴백. 검증기는 `src/packs/packManifest.js`, 테스트는 `npm test` (`test/pack.test.mjs` 가 선언된 클립이 GLB 안에 실제로 있는지 대조). 동물 왕국 팩 계획은 `docs/PLAN.md` §4.3.

---

## 📄 라이선스 (License)

This project is open-source. Inspired by Google AI Studio's bundled showcase application.
