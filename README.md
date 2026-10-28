# 🧙‍♂️ 렉시콘 체스: 어원의 성소 (Lexicon Chess: Sanctuary of Words)

> **3D 고딕 대성당 위저드 체스 × 뇌과학 기반 단어학습(에듀테크)의 결합!**  
> 체스의 수읽기 전략에 **기억의 궁전(Method of Loci)**과 **어원학적 룬 조합(Etymological Spellcrafting)**, **실시간 워드 듀얼(Word Duel)**, **Web Speech API 원어민 발음**을 더한 하이브리드 교육용 3D 배틀러입니다.

---

## ✨ 킬러 에듀테크 & 게임플레이 특징 (Core Features)

### 1. ⚔️ 3D 시네마틱 워드 듀얼 (Word Duel)
* 체스 기물이 적을 공격하거나 상단 `[⚔️ 단어 퀴즈]` 버튼을 누르면 실시간 3D 워드 듀얼이 발동합니다.
* 영단어의 발음(Phonetic), 원어민 음성(TTS), 어원(Prefix / Root / Suffix) 분해 카드가 나타납니다.
* 3지선다 퀴즈를 맞추면 **+1 아케인 마나 충전**, **연속 정답(Streak) 부스트**, 칼날에 번개가 감기는 크리티컬 타격이 발동합니다!

### 2. 🎴 어원 룬 마법 조합 (Etymological Spellcrafting)
영단어의 접두사(Prefix)와 어근(Root)이 곧 마법 주문의 원리가 됩니다:
* **[Tele-]** (멀리) + **[-port]** (나르다) ➔ **`TELEPORT` (차원 도약)**: 아군 기물 2칸 내 순간이동
* **[Petri-]** (돌) + **[-fy]** (만들다) ➔ **`PETRIFY` (심판의 번개)**: 적 기물 1턴간 석화(스턴)
* **[Sanct-]** (거룩한) + **[-uary]** (장소) ➔ **`SANCTUARY` (성소의 가호)**: 아군 1회 피격 면역 황금 보호막
* **[Cata-]** (아래로) + **[-clysm]** (씻다) ➔ **`CATACLYSM` (화로의 겁화)**: 메테오로 적 기물 산산조각 파괴
* **[Trans-]** (넘어) + **[-form]** (형태) ➔ **`TRANSFORM` (폰의 각성)**: 폰을 즉시 여왕(Queen)으로 승급

### 3. 🗣️ Web Audio & Web Speech API 원어민 발음 엔진
* 별도의 mp3 파일 다운로드 없이 브라우저 내장 Web Speech API를 통해 미국/영국식 원어민 발음을 실시간 스트리밍합니다.
* 상단 헤더의 **[🗣️ TTS]** 버튼으로 언제든 단어 발음 자동 재생을 켜고 끌 수 있습니다.
* 무지연 절차적 Web Audio 신시사이저로 천둥, 포탈, 쉴드 공명, 팡파르 사운드가 재생됩니다.

### 4. 📖 성소의 어휘 기록서 (Cathedral Grimoire)
* 상단 헤더의 **[📖 N단어 정복]** 버튼을 누르면 언제든지 대국 중 익힌 단어 도감을 열람할 수 있습니다.
* 어원 해설 스토리, 예문, 발음 다시 듣기(🔊) 기능을 통해 대국 후 자연스러운 에빙하우스 망각곡선 복습(SRS)이 가능합니다.

### 5. 웅장한 3D 고딕 성당 & 석재 파괴 물리
* 아치형 천장, 실시간 스테인드글라스 광원, 3중 볼륨 화로 불꽃 커스텀 GLSL 셰이더.
* 기물 처치 시 32개의 3D 돌 파편이 사방으로 튀는 물리 시뮬레이션 (`spawnStoneShatter`).
* PC: `WASD + R/F` 3D 자유 비행 모드 & `H` 키 시네마틱 관람 모드.
* 모바일: 터치 제스처(1핑거 회전, 2핑거 이동, 핀치 줌) 완벽 지원.

---

## 🕹️ 조작법 가이드 (Controls)

| 환경 | 동작 | 설명 |
| :--- | :--- | :--- |
| **공통** | **카드 클릭 ➔ 대상 클릭** | 하단 마법 카드를 선택하고 체스판 위 대상 기물/타일을 클릭하여 마법 발동 |
| **공통** | **단어 퀴즈 풀기** | 워드 듀얼 모달에서 올바른 한국어 뜻을 선택 (+1 마나 획득) |
| **공통** | **성소 단어장 열기** | 상단 `[📖 N단어 정복]` 버튼을 눌러 어휘 도감 및 발음 복습 |
| **공통** | **주문 취소** | 마우스 우클릭 또는 `ESC` 키 입력 시 선택한 주문 취소 |
| **PC** | **마우스 좌클릭 드래그** | 체스판 주변 카메라 궤도 회전 (Orbit) |
| **PC** | **마우스 우클릭 드래그** | 화면 평행 이동 (Pan) |
| **PC** | **마우스 휠 스크롤** | 줌 인 / 줌 아웃 (Zoom In / Out) |
| **PC** | **WASD + R/F** | 3D 공간 자유 비행 이동 (R: 상승, F: 하강) |
| **PC** | **키보드 H** | UI 숨기기/보이기 토글 (시네마틱 관람 모드) |
| **모바일** | **1손가락 / 2손가락 / 핀치** | 회전, 이동, 화면 확대/축소 제스처 완벽 지원 |

---

## 🚀 빠른 시작 (Quick Start)

Node.js (v18 이상 권장) 환경에서 바로 실행 가능합니다:

```bash
# 1. 저장소 클론
git clone https://github.com/alarmpet/chess.git
cd chess

# 2. 패키지 설치
npm install

# 3. 로컬 게임 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 시 즉시 3D 단어학습 체스를 플레이할 수 있습니다.

### 테스트 및 프로덕션 빌드
```bash
npm test       # 단위 테스트 6종 (3D 바이너리 + 아케인 엔진 + 렉시콘 어휘 엔진)
npm run build  # 프로덕션 번들링
npm run preview
```

---

## 🛠️ 기술 스택 (Tech Stack)

* **프론트엔드**: React 19, TypeScript, Vite 8
* **3D 그래픽스 & 애니메이션**: Three.js (r170), GLTFLoader, SkeletonUtils, OrbitControls
* **에듀테크 & 음성 엔진**: Web Speech API (Native TTS), Spaced Repetition System (SRS)
* **오디오 엔진**: Web Audio API (Procedural Real-Time Audio Synthesizer)
* **셰이더 & 이펙트**: Custom GLSL (Brazier Fire & Charred Embers, Procedural Stone Noise)
* **에셋 파이프라인**: 3D 바이너리 모델 스트리밍 (`.glb.gz.b64` ➔ `DecompressionStream('gzip')`)
