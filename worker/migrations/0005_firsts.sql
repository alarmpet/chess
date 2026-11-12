-- 첫 도달 도장 (랭커 보상 계획서 RW-1, src/rank/rankMarks.js). 성체·우두머리·왕관에 처음 닿은 때. 시즌과 무관하게 영원.
CREATE TABLE IF NOT EXISTS firsts (
  id TEXT NOT NULL,
  tier TEXT NOT NULL,
  season INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (id, tier)
);
-- 이미 닿았던 사람 채우기: 지금 시즌 최고 점수와 지난 시즌 테두리 기록에서.
INSERT OR IGNORE INTO firsts (id, tier, season, at) SELECT id, 'adult', season, updated FROM players WHERE peak >= 300;
INSERT OR IGNORE INTO firsts (id, tier, season, at) SELECT id, 'alpha', season, updated FROM players WHERE peak >= 600;
INSERT OR IGNORE INTO firsts (id, tier, season, at) SELECT id, 'crown', season, updated FROM players WHERE peak >= 900;
INSERT OR IGNORE INTO firsts (id, tier, season, at) SELECT id, 'adult', season, at FROM trophies WHERE peak >= 300;
INSERT OR IGNORE INTO firsts (id, tier, season, at) SELECT id, 'alpha', season, at FROM trophies WHERE peak >= 600;
INSERT OR IGNORE INTO firsts (id, tier, season, at) SELECT id, 'crown', season, at FROM trophies WHERE peak >= 900;
