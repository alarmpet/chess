# 브리핑 — 농장·작물·꾸미기 오픈소스 게임 조사 (2026-11-04)

## 사용자 요청 (원문)
> 농장?경작물키우기?꾸미기 게임? 이런 게임 오픈소스 다운받아서 역공학 설계하고 진행하는거 맞아?
> → 조사부터 진행

## 우리 게임 (WILD CROWN)
- 귀여운 동물 3D 체스. three.js r170 · React 19 · Vite · chess.js. **서버 없음**, 저장은 localStorage. 웹/PWA, Play 출시 예정. 1인 개발.
- 체스 한 판이 끝나면 잡은 동물이 카드 주민이 되고, 8×8 섬 칸에 건물(밭·풍차·빵집·장터 …)을 짓고 주민을 들인다.
- **시계는 체스 판 수다.** 실시간 타이머·썩음·물 주기·카운트다운·유료 뽑기는 없다(우리 원칙).
- 다음에 만들 것:
  - G3 **달력 주간**: 기기 날짜로 주차를 정해 섬 손님 주문·작물 색·등불·들르는 라이벌이 바뀐다. 데이터(JSON)로만. 놓쳐도 다음 주기에 다시 온다.
  - G4 **매대**: 상점 매대 3칸이 판마다 바뀐다. 재고가 없으면 "다음 판 뒤 입고". 희귀도는 이름표 색.
  - **꾸미기 배치**: 칸 점유·회전·보관함·겹침 금지.
  - 작물 종류·성장 단계·희귀도 사다리를 데이터로.

## 이미 한 것 — 다시 내지 마라
2026-10-31 조사에서 아래 52개 저장소를 이미 받아 읽었다. **이 목록에 있는 저장소는 후보로 내지 마라.**
micropolisJS, micropolis, lincity-ng, OpenTTD, simutrans, widelands, unknown-horizons, OpenRCT2, julius, Mindustry, freeciv-web, shapez.io, kittensgame, gooboo, etherealfarm, farmhand, Evolve, Trimps, AntimatterDimensions, civ-clicker, adarkroom, paperclips, yet-another-idle-rpg, progress-knight, 1255-burgomaster, kirkmcdonald calculator, stackcards, tuntian, CardSettler, stackworlds-clone, StartX, simcity-threejs-clone, isocity, 3d.city, Towngardia, kingdomarchitect, Koi, hex-map-wfc, wavefunctioncollapse, three-wfc, hexcastle, ndwfc, irregular_grid, hexagrid-relaxing, townsclipper, webgl-outlines, Three.js-Ocean-Scene, stylized-water, three-stylized-water, threejs-grass-water-shaders, three-stylized, folio-2025.

그 조사의 빈틈(원문): "Stardew-likes in JS: nothing beyond phaser demos. `farmhand` and `gooboo` are the real farm references." 그리고 농장 참고작 셋(farmhand GPL-2, etherealfarm GPL-3, gooboo GPL-3)이 **모두 GPL** 이었다.

## 이번에 찾는 것
**허용 라이선스(MIT · Apache-2.0 · BSD · Unlicense · zlib · CC0)** 우선. GPL·AGPL·MPL 은 "설계 참고만"으로 표시해 낼 수 있다.
- 농장·작물 키우기(심기·성장 단계·수확·판매) 게임
- 꾸미기·배치(섬·방·마을 꾸미기, 그리드 배치, 가구 보관함) 게임 또는 라이브러리
- 상점 재고 순환·주간/계절 이벤트를 **데이터 파일**로 돌리는 게임
- 웹(JS/TS) 우선. 다른 언어(Godot GDScript, C#, Lua …)는 데이터 구조가 뚜렷할 때만.

## 제외
- 상용 게임의 클론·리메이크(이름·그림을 그대로 쓰는 Stardew/Animal Crossing/Harvest Moon 복제). 팬 프로젝트도 제외.
- 라이선스 파일이 없는 저장소(권리 유보). 표에 "없음"으로만 적고 상위 후보로 올리지 마라.
- 별 0~2개짜리 튜토리얼·과제 저장소. 단, 데이터 구조가 특별히 좋으면 이유를 적고 낸다.

## 규칙
1. **저장소 주소는 `owner/repo` 형식.** 통합자가 GitHub API 로 하나씩 조회해 404 면 그 항목을 통째로 버린다. 모르면 내지 마라.
2. **라이선스는 네가 확인한 근거를 적는다**(LICENSE 파일을 읽었는지, 배지만 봤는지). 통합자가 원문으로 다시 확인한다. 지난 조사에서 모델 라이선스 표기가 14건 틀렸다.
3. 그 저장소에서 **우리가 가져갈 구조**를 구체적으로: 파일 경로·자료 구조 이름을 알면 적고, 모르면 "확인 안 함".
4. 새 수치를 지어내지 않는다. 한국어로. 1,500 단어 이내.

## 답의 형식
- `## 0 한 줄 결론`
- `## 1 후보 표` 8~15개: owner/repo | 무엇 | 언어 | 라이선스(근거) | 가져갈 구조(G3/G4/배치/작물 중) | 확인 수준
- `## 2 상위 3` 과 이유
- `## 3 조심` (라이선스·클론·방치 여부)

## 네 담당 영역 (이 절을 깊게)
- **grok: 꾸미기·배치.** 섬/방/마을 꾸미기 게임과 그리드 배치·회전·보관함 라이브러리(three.js·Phaser·PixiJS 등). 실제로 GitHub 에서 검색하고 저장소 페이지를 열어 라이선스를 확인하라. Do not call any MCP tool.
