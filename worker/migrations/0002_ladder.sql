-- 왕관 사다리 (계획서 §4.4 L-1): 보이는 랭크. 실력(rating)과 따로 움직인다.
ALTER TABLE players ADD COLUMN points INTEGER NOT NULL DEFAULT 0;   -- 사다리 점수(칸마다 100)
ALTER TABLE players ADD COLUMN floor INTEGER NOT NULL DEFAULT 0;    -- 이번 시즌 바닥(큰 등급 시작점)
ALTER TABLE players ADD COLUMN streak INTEGER NOT NULL DEFAULT 0;   -- 연승 수
ALTER TABLE matches ADD COLUMN ladder TEXT;                          -- 두 사람의 사다리 변화(JSON)
