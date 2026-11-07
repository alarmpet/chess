# 통합자 독립 판정 (세 모델 답을 읽기 전, 2026-11-04)

## 검색 범위
`gh search repos` 24개 질의(농장·작물·꾸미기·주제 태그, 별 순). 원본: `claude-search.tsv`, `claude-search2.tsv`.

## 첫 판단
- 허용 라이선스이면서 **크고 오래 다듬어진 웹 농장 게임은 찾지 못했다.** 10-31 조사의 빈틈("Stardew-likes in JS: nothing beyond phaser demos")이 그대로다.
- 결과 대부분이 별 0~60개다. 실질 후보(라이선스 확인 전):
  - appleweiping/paradise-isle (MIT, TS, 섬 생활 — 농사·동물·낚시)
  - KrasimirKralev/harvest-hollow (MIT, JS, 3D 브라우저 농장)
  - Gmast2662/grow-your-garden (MIT, JS — 이름이 Grow a Garden 과 비슷, 클론 여부 확인)
  - aaronvanston/farm-lib (MIT, TS, 농장 클리커 라이브러리)
  - WispSnow/TinyFarm (MIT, C++, 63★)
  - hackagotchi/hackagotchi (BSD-3, Rust, 경제)
  - songkeys/little-flock (MIT, TS)
  - starity777-byte/naituan (MIT, JS, 펫·방 꾸미기)
  - 배치: rjct/react-isometric-game, FelipeIzolan/phaser-isometric-engine, KuroiAkuma19/GridVille (MIT)
- **제외:** QQ 농장·FarmVille·Tomodachi 이름을 쓴 저장소(클론), 트레이너·치트·"Full Version" 저장소(악성 유도 가능성 — 받지 않는다), 라이선스 없는 것(keyfarm 72★ 등).
- 가설: 가장 질 좋은 농장 설계 근거는 여전히 GPL(farmhand)이고, 허용 라이선스 쪽은 **작은 저장소의 데이터 파일**(작물 표·상점 표) 수준에서만 가져갈 것이 있다.
