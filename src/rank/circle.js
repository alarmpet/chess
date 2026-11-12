// 친구 무대 (계획서 §4.4 L-3): 「내가 둔 친구들 사이 순위」와 「친구별 전적」. 순수 함수라 테스트한다.
// 원칙(조사 ⑨): 전 세계 순위표는 없다. 내가 실제로 둔 사람만 보인다. 이름은 서버에 없고 기기에만 있다(friendNames).
// 서버에서는 자기 서명이 붙은 요청에만 답한다 — 남의 id 로 그 사람의 친구 목록을 읽지 못하게.
import { placeOf } from './ladder.js';

export const CIRCLE_V = 'wildcrown-circle-v1';
export const CIRCLE_MAX = 30;            // 최근에 둔 친구 30명까지
export const CIRCLE_SKEW_MS = 10 * 60 * 1000;
export const FRIENDS_KEY = 'wildcrown.friends.v1';

/** 서명할 글: 「wildcrown-circle-v1|<id>|<시각>」. */
export const circleText = (id, at) => `${CIRCLE_V}|${id}|${at}`;

const scoreFor = (meId, row) => {
  if (row.result === '1/2-1/2') return 0.5;
  const whiteWon = row.result === '1-0';
  return (row.white === meId) === whiteWon ? 1 : 0;
};

/**
 * 판 기록 → 친구별 전적. 무효 판은 빼고, 상한 판(capped)은 점수엔 안 들었어도 둔 판이라 전적에 넣는다.
 * @param {string} meId
 * @param {{white: string, black: string, result: string, status?: string, at: number}[]} rows
 * @returns {Map<string, {id: string, wins: number, losses: number, draws: number, games: number, last: number}>}
 */
export function headToHead(meId, rows) {
  const out = new Map();
  for (const r of rows || []) {
    if (r.status === 'void') continue;
    if (r.white !== meId && r.black !== meId) continue;
    const peer = r.white === meId ? r.black : r.white;
    if (!peer || peer === meId) continue;
    const h = out.get(peer) || { id: peer, wins: 0, losses: 0, draws: 0, games: 0, last: 0 };
    const s = scoreFor(meId, r);
    if (s === 1) h.wins++;
    else if (s === 0) h.losses++;
    else h.draws++;
    h.games++;
    h.last = Math.max(h.last, r.at || 0);
    out.set(peer, h);
  }
  return out;
}

/**
 * 친구 무대: 나와 친구들을 사다리 점수 순으로 줄 세운다. 같은 점수면 최근에 둔 사람, 그다음 id 순(늘 같은 순서).
 * @param {string} meId
 * @param {{white: string, black: string, result: string, status?: string, at: number}[]} rows
 * @param {Record<string, {points?: number}>} pointsOf  id → 사다리 점수(없으면 0)
 */
export function circleOf(meId, rows, pointsOf = {}, max = CIRCLE_MAX) {
  const h2h = [...headToHead(meId, rows).values()].sort((a, b) => b.last - a.last || (a.id < b.id ? -1 : 1)).slice(0, max);
  const pts = (id) => Number(pointsOf[id]?.points) || 0;
  const people = [
    { id: meId, me: true, points: pts(meId), place: placeOf(pts(meId)), last: Infinity },
    ...h2h.map((h) => ({ ...h, me: false, points: pts(h.id), place: placeOf(pts(h.id)) }))
  ];
  people.sort((a, b) => b.points - a.points || b.last - a.last || (a.id < b.id ? -1 : 1));
  // 같은 점수는 같은 등수(1, 2, 2, 4).
  let rank = 0;
  people.forEach((p, i) => {
    if (i === 0 || p.points !== people[i - 1].points) rank = i + 1;
    p.rank = rank;
  });
  return people.map((p) => (p.me ? { id: p.id, me: true, rank: p.rank, points: p.points, place: p.place } : { ...p, last: p.last }));
}

/** 요청 검사(서버): 형식·시각만. 서명은 호출한 쪽이 verifySignature 로. */
export function circleRequestError(body, now) {
  if (!body || typeof body !== 'object') return 'body';
  if (typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{16}$/.test(body.id)) return 'id';
  if (!Number.isFinite(body.at) || Math.abs(now - body.at) > CIRCLE_SKEW_MS) return 'time';
  if (typeof body.sig !== 'string' || body.sig.length > 200) return 'sig';
  if (!body.pub || typeof body.pub.x !== 'string' || typeof body.pub.y !== 'string') return 'pub';
  return null;
}

// ── 기기 안 친구 이름 ──
// 서버에는 이름이 없다. 처음엔 id 로 정해지는 동물 이름(「여우 친구」)을 쓰고, 이 기기에서만 바꿀 수 있다.
const ANIMALS_KO = ['여우', '토끼', '곰', '부엉이', '고슴도치', '수달', '판다', '다람쥐', '펭귄', '너구리', '고래', '사슴'];
const ANIMALS_EN = ['Fox', 'Bunny', 'Bear', 'Owl', 'Hedgehog', 'Otter', 'Panda', 'Squirrel', 'Penguin', 'Raccoon', 'Whale', 'Deer'];
const ICONS = ['🦊', '🐰', '🐻', '🦉', '🦔', '🦦', '🐼', '🐿️', '🐧', '🦝', '🐳', '🦌'];

const hashOf = (id) => {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
};

/** id 로 정해지는 기본 이름: 「🦊 여우 친구 K3」(뒤 두 글자는 id 끝 — 같은 동물이 둘이어도 갈린다). */
export function defaultFriendName(id, en = false) {
  const i = hashOf(id) % ANIMALS_KO.length;
  const tag = String(id).slice(-2).toUpperCase();
  return en ? `${ICONS[i]} ${ANIMALS_EN[i]} friend ${tag}` : `${ICONS[i]} ${ANIMALS_KO[i]} 친구 ${tag}`;
}

export const MAX_NAME = 12;
/** 이름 다듬기: 앞뒤 공백·줄바꿈 제거, 12글자까지. 빈 글이면 null(기본 이름으로). */
export function cleanName(text) {
  const t = String(text ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return t ? [...t].slice(0, MAX_NAME).join('') : null;
}

/** @param {Storage | null} storage */
export function loadFriendNames(storage) {
  try {
    const v = JSON.parse(storage?.getItem(FRIENDS_KEY) || 'null');
    return v && v.v === 1 && v.names && typeof v.names === 'object' ? v.names : {};
  } catch (e) {
    return {};
  }
}

/** 이름 하나를 저장하고 새 목록을 돌려준다. name 이 비면 지운다. */
export function saveFriendName(storage, id, name) {
  const names = { ...loadFriendNames(storage) };
  const n = cleanName(name);
  if (n) names[id] = n;
  else delete names[id];
  try { storage?.setItem(FRIENDS_KEY, JSON.stringify({ v: 1, names })); } catch (e) { /* 저장 막힘: 이번 실행만 */ }
  return names;
}

export const friendName = (names, id, en = false) => names?.[id] || defaultFriendName(id, en);

/** 전적 글자: 「3승 2패」(무승부가 있으면 「· 1무」). */
export function recordText(h, en = false) {
  if (!h) return '';
  const parts = en ? [`${h.wins}W`, `${h.losses}L`] : [`${h.wins}승`, `${h.losses}패`];
  if (h.draws) parts.push(en ? `${h.draws}D` : `${h.draws}무`);
  return parts.join(' ');
}

/** 무대 위 내 자리 한 줄: 「친구 4명 중 2등」(혼자면 null). */
export function standingLine(circle, en = false) {
  const me = circle?.find((p) => p.me);
  if (!me || circle.length < 2) return null;
  return en ? `#${me.rank} of ${circle.length} with your friends` : `친구들과 ${circle.length}명 중 ${me.rank}등`;
}
