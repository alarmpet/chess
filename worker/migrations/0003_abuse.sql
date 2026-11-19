-- 랭크 남용 막기 (계획서 §4.2 R-4).
ALTER TABLE matches ADD COLUMN status TEXT NOT NULL DEFAULT 'counted';   -- counted · capped(같은 상대 상한) · void(첫 수 전)
ALTER TABLE matches ADD COLUMN day INTEGER;                               -- 한국 시각 날짜 번호(src/rank/abuse.js dayOf)
ALTER TABLE matches ADD COLUMN pair TEXT;                                 -- 두 기기 id 를 정렬해 이은 것
CREATE INDEX IF NOT EXISTS matches_pair_day ON matches (pair, day);
ALTER TABLE reports ADD COLUMN kind TEXT NOT NULL DEFAULT 'pair';         -- pair(두 사람 보고) · abandon(혼자 낸 이탈 몰수)
-- 사람이 낼 수 없는 기록을 보낸 기기. 지금은 남기기만 한다(정지 규칙은 사람이 보고 정한다).
CREATE TABLE IF NOT EXISTS flags (
  signer TEXT NOT NULL,
  reason TEXT NOT NULL,
  match_id TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS flags_signer ON flags (signer, at);
