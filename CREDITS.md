# CREDITS — 출처와 라이선스

이 게임에 들어간 남의 코드·에셋과, 우리가 만든 에셋을 무엇으로 만들었는지 적는다. 저장소 규칙(CLAUDE.md 「라이선스·외부 코드」): MIT·Apache·CC0 를 가져오면 파일 머리와 여기에 적는다. GPL·AGPL·CC-BY-NC 는 읽고 구조만 배우며 코드·에셋을 복사하지 않는다.
처음 만든 날 2026-11-10(방향 계획서 DR-0b). 라이선스는 `node_modules/<이름>/package.json` 과 각 팩의 `pack.json` `credits` 에서 확인했다.

## 실행에 쓰는 라이브러리 (배포 번들에 들어감)

| 이름 | 판 | 라이선스 | 쓰는 곳 |
| :-- | :-- | :-- | :-- |
| three | 0.170.0 | MIT | 3D 장면 전체 |
| chess.js | 1.4.0 | BSD-2-Clause | 규칙 심판(`src/rules/referee.js`), AI 수 생성 |
| react · react-dom | 19.3.1 | MIT | 화면(UI) |

## 에셋

| 묶음 | 출처 | 라이선스 · 비고 |
| :-- | :-- | :-- |
| `public/packs/legend/` 기물 6종(사자·호랑이·코뿔소·판다·캥거루·미어캣), 외형 단계, 소품 | 우리가 만듦: ComfyUI + FLUX.1 schnell 콘셉트 → 로컬 TRELLIS → `tools/biped_rig.py`·`build_looks.py` 등 | 자체 에셋. 도구: FLUX.1 schnell(Apache-2.0), TRELLIS(MIT, Microsoft) |
| `public/packs/legend/town/` 건물 · `sea/` 바다 생물 | 우리가 만듦: Google Flow 콘셉트 → 로컬 TRELLIS → `tools/make_building.py` | 자체 에셋. Flow 이용 약관의 산출물 조항은 출시 전에 다시 확인한다(재 보지 않았다) |
| `public/packs/legend/` 예비 두 발 동물(wolf · zebra · unicorn …) | `D:\study-game` 의 우리 캐릭터 | 자체 에셋. 지금 게임에서 쓰지 않아 배포(`dist`)에서 뺀다(`tools/prune_dist.mjs`) |
| `public/packs/legend/cards/` 카드 그림 | 우리가 만듦(로컬 생성) | 자체 에셋 |
| `public/packs/savanna/` 네 발 동물(시험용 대체 팩, `?pack=savanna`) | Quaternius Animated Animal Pack (poly.pizza) | **CC0** |
| `public/packs/cathedral/` 석상(대체 팩) | 초기 프로토타입 | 출처를 다시 확인해야 한다(이 문서를 만들 때 확인하지 못했다) |
| 소리 전부 | `src/audio/recipes.js` 의 합성 레시피 | 오디오 파일이 없다 — 라이선스 대상 없음 |

## 읽고 구조만 배운 것 (코드를 가져오지 않음)

조사 기록: `docs/research/2026-11-10-direction/C-oss-rea.md`, `docs/research/2026-11-04-farm-oss-rea/`, `docs/research/2026-11-03-village-detail-rea/`.
lichess lila(AGPL-3.0) · chessground(GPL-3.0) · Fairy-Stockfish(GPL-3.0) · Trimps(GPL-2.0) · Kittens Game(상업·파생 금지) · CSSLab/maia-chess(GPL-3.0) — 모두 구조·수치만 기록했다.
Glicko-2 는 공개된 논문 수식을 직접 구현했다(`src/rank/glicko2.js`).

## 데이터 (넣기로 정했으나 아직 안 넣음)

- lichess 퍼즐 데이터베이스 — CC0(기획서 §10-14). 낚시 판(DR-4)에서 쓸 때 여기에 판과 날짜를 적는다.
