// 랭크 판 결과를 서버로 보내는 화면 쪽 (LA-R R-2). 서버는 worker/index.js 의 /api/rank/*.
// 주소: 빌드에 VITE_WC_RANK_URL 이 있으면 그것, 없으면 배포판은 같은 주소(''), 개발 서버는 보내지 않는다(null).
import { buildMatch, signReport } from './report.js';

export function rankApiBase(env) {
  const url = env?.VITE_WC_RANK_URL;
  if (typeof url === 'string' && url) return url.replace(/\/+$/, '');
  return env?.PROD ? '' : null;
}

/**
 * 보고서를 보낸다. 내가 먼저 보내면 서버는 'waiting' — 상대 보고서가 올 때까지 몇 번 다시 보낸다(같은 보고서라 두 번 세지 않는다).
 * @returns {Promise<{status: string, [k: string]: any}>}
 */
export async function sendRankReport({ base, identity, room, game, myColor, peerKey, moves, ended, tries = 8, waitMs = 2500, fetchFn = fetch, sleep = (ms) => new Promise((ok) => setTimeout(ok, ms)) }) {
  if (base === null || base === undefined) return { status: 'off' };
  const match = buildMatch({ room, game, myColor, myKey: identity?.id, peerKey, moves, ended });
  if (!match) return { status: 'incomplete' };
  const body = JSON.stringify(await signReport(match, identity));
  let last = { status: 'error' };
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetchFn(`${base}/api/rank/result`, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      last = await r.json();
    } catch (e) {
      last = { status: 'error' };
    }
    if (last.status !== 'waiting' && last.status !== 'error') return last;
    await sleep(waitMs);
  }
  return last;
}

/** 내 쪽 레이팅 변화(서버 응답 counted 에서). */
export function myChange(res, myId) {
  if (res?.status !== 'counted') return null;
  const side = res.white?.id === myId ? res.white : res.black?.id === myId ? res.black : null;
  return side ? { before: side.before, after: side.after } : null;
}

/** 서버에서 한 사람의 레이팅을 읽는다. 서버가 없거나 실패하면 null. */
export async function fetchPlayer(base, id, fetchFn = fetch) {
  if (base === null || base === undefined || !id) return null;
  try {
    const r = await fetchFn(`${base}/api/rank/player?id=${encodeURIComponent(id)}`);
    if (!r.ok) return null;
    const p = await r.json();
    return typeof p?.rating === 'number' ? p : null;
  } catch (e) {
    return null;
  }
}

/** 판 뒤 한 줄: 「🏆 1500 → 1662 (+162)」. 뱃지가 바뀌었으면 덧붙인다. */
export function changeLine(ch, oldBadge, newBadge, label) {
  const d = ch.after - ch.before;
  const base = `🏆 ${ch.before} → ${ch.after} (${d >= 0 ? '+' : ''}${d})`;
  if (!newBadge || newBadge === oldBadge) return base;
  const b = label(newBadge);
  return `${base} · ${b.icon} ${b.name}!`;
}
