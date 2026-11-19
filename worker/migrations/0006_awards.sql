-- 친구 무대 시즌 상 (랭커 보상 RW-3, src/rank/awards.js). 시즌을 넘길 때 그 사람의 무대(그 시즌 나와 둔 친구들)로 계산한다. 글자 기록뿐.
CREATE TABLE IF NOT EXISTS awards (
  id TEXT NOT NULL,
  season INTEGER NOT NULL,
  kind TEXT NOT NULL,      -- top(무대 1등) · rise(가장 많이 오름)
  size INTEGER NOT NULL,   -- 무대 사람 수(나 포함)
  at INTEGER NOT NULL,
  PRIMARY KEY (id, season, kind)
);
-- 과정 도장(RW-4)의 upset-win · upset-draw 는 firsts 표(kind 를 tier 칸에)에 같이 둔다.
