-- 서버 랭크 (LA-R R-2). 개인정보 없음: 기기 공개 키와 그 해시 id, 판 기록(수 목록)·레이팅만.
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,          -- 기기 신분 id (공개 키 SHA-256 앞 12바이트, base64url 16글자)
  pub TEXT NOT NULL,            -- 공개 키 JWK (x, y)
  rating REAL NOT NULL,
  rd REAL NOT NULL,
  vol REAL NOT NULL,
  games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);

-- 한 사람이 보낸 보고서. 상대 보고서가 오면 둘을 맞춰 본다.
CREATE TABLE IF NOT EXISTS reports (
  match_id TEXT NOT NULL,
  signer TEXT NOT NULL,
  text TEXT NOT NULL,
  body TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (match_id, signer)
);

-- 레이팅에 반영된 판. match_id 가 같으면 두 번 세지 않는다.
CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  white TEXT NOT NULL,
  black TEXT NOT NULL,
  result TEXT NOT NULL,
  reason TEXT NOT NULL,
  plies INTEGER NOT NULL,
  at INTEGER NOT NULL,
  white_before REAL NOT NULL,
  white_after REAL NOT NULL,
  black_before REAL NOT NULL,
  black_after REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS matches_white ON matches (white, at);
CREATE INDEX IF NOT EXISTS matches_black ON matches (black, at);
