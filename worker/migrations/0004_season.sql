-- 시즌 (계획서 §4.4 L-4, src/rank/season.js). 시즌이 지나면 사람을 읽거나 판을 넣을 때 그 자리에서 넘긴다.
ALTER TABLE players ADD COLUMN season INTEGER NOT NULL DEFAULT 1;   -- 이 줄의 사다리가 속한 시즌
ALTER TABLE players ADD COLUMN peak INTEGER NOT NULL DEFAULT 0;     -- 이번 시즌 최고 사다리 점수
ALTER TABLE players ADD COLUMN sgames INTEGER NOT NULL DEFAULT 0;   -- 이번 시즌 점수에 든 판 수
UPDATE players SET peak = points;
-- 지난 시즌 테두리(겉모습 보상). 그 시즌 랭크 판 SEASON_MIN_GAMES 판 이상만.
CREATE TABLE IF NOT EXISTS trophies (
  id TEXT NOT NULL,
  season INTEGER NOT NULL,
  tier TEXT NOT NULL,
  peak INTEGER NOT NULL,
  games INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (id, season)
);
