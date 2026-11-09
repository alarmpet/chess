// 랭크 판 결과 보고 (LA-R R-2). 두 사람이 같은 글(판 기록)에 각자 서명해 서버로 보낸다.
// 서버(worker/index.js)는 ① 두 서명이 각자의 기기 키로 맞고 ② 두 글이 똑같고 ③ 수를 chess.js 로 처음부터 다시 두어
// 규칙에 맞고 그 끝이 보고한 결과와 같을 때만 레이팅을 바꾼다. 화면(클라이언트)과 서버가 이 파일을 같이 쓴다.
// 한계: 둘이 짜고 같은 거짓 판을 서명하면 막지 못한다(R-4 의 같은 상대 상한·시간 대조가 맡는다).
import { Chess } from 'chess.js';
import { identityIdOf, verifySignature } from '../net/identity.js';

export const REPORT_V = 1;
const RESULTS = ['1-0', '0-1', '1/2-1/2'];
const BOARD_ENDS = ['checkmate', 'stalemate', 'repetition', 'material', 'fifty'];
const ID_RE = /^[A-Za-z0-9_-]{16}$/;
const ROOM_RE = /^[A-Z0-9]{4,12}$/;
const UCI_RE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
export const MAX_PLIES = 600;

/** 서명하는 글. 순서·구분자를 바꾸면 옛 서명이 모두 무효가 되므로 v 를 올린다. */
export function canonicalText(m) {
  return ['wildcrown-rank-v1', m.room, m.game, m.white, m.black, m.moves.join(' '), m.result, m.reason].join('|');
}

/** 같은 판을 가리키는 키. 같은 방·같은 판 번호·같은 두 사람. */
export const matchIdOf = (m) => `${m.room}:${m.game}:${m.white}:${m.black}`;

/** 내 쪽에서 본 끝(matchCore 의 ended: win/loss/draw)을 백 기준 결과로. */
export function resultFor(myColor, ended) {
  if (!ended) return null;
  if (ended.result === 'draw') return '1/2-1/2';
  const whiteWon = (ended.result === 'win') === (myColor === 'w');
  return whiteWon ? '1-0' : '0-1';
}

/** 판 기록을 만든다(화면 층). 모자란 것이 있으면 null. */
export function buildMatch({ room, game, myColor, myKey, peerKey, moves, ended }) {
  const result = resultFor(myColor, ended);
  if (!result || !myKey || !peerKey || !ended?.reason) return null;
  return {
    room, game,
    white: myColor === 'w' ? myKey : peerKey,
    black: myColor === 'w' ? peerKey : myKey,
    moves: moves.slice(), result, reason: ended.reason
  };
}

/** 내 기기 신분으로 서명한 보고서. */
export async function signReport(match, identity) {
  return { v: REPORT_V, match, signer: identity.id, pub: identity.pub, sig: await identity.sign(canonicalText(match)) };
}

function shapeError(r) {
  const m = r?.match;
  if (!r || r.v !== REPORT_V || !m) return 'shape';
  if (!ROOM_RE.test(String(m.room)) || !Number.isInteger(m.game) || m.game < 1 || m.game > 1000) return 'shape';
  if (!ID_RE.test(String(m.white)) || !ID_RE.test(String(m.black)) || m.white === m.black) return 'players';
  if (!Array.isArray(m.moves) || m.moves.length > MAX_PLIES || !m.moves.every((u) => UCI_RE.test(String(u)))) return 'moves';
  if (!RESULTS.includes(m.result)) return 'result';
  if (!(m.reason === 'resign' || BOARD_ENDS.includes(m.reason))) return 'reason';
  if (r.signer !== m.white && r.signer !== m.black) return 'signer';
  return null;
}

/** 수를 다시 두어 보고한 끝이 판과 맞는지 본다. 맞으면 null, 아니면 이유. */
export function replayError(m) {
  const chess = new Chess();
  for (const u of m.moves) {
    let ok = null;
    try { ok = chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined }); } catch (e) { ok = null; }
    if (!ok) return 'illegal';
  }
  const over = chess.isGameOver();
  if (m.reason === 'resign') {
    // 기권은 판이 끝나기 전에만, 결과는 승패여야 한다.
    if (over) return 'resign-after-end';
    return m.result === '1/2-1/2' ? 'result' : null;
  }
  if (!over) return 'not-over';
  if (m.reason === 'checkmate') {
    if (!chess.isCheckmate()) return 'reason';
    return m.result === (chess.turn() === 'w' ? '0-1' : '1-0') ? null : 'result';
  }
  const actual = chess.isCheckmate() ? 'checkmate' : chess.isStalemate() ? 'stalemate' : chess.isThreefoldRepetition() ? 'repetition' : chess.isInsufficientMaterial() ? 'material' : 'fifty';
  if (actual !== m.reason && !(m.reason === 'fifty' && chess.isDraw())) return 'reason';
  return m.result === '1/2-1/2' ? null : 'result';
}

/** 보고서 하나를 검사한다. 맞으면 { ok: true, text, id }, 아니면 { ok: false, error }. */
export async function checkReport(r, subtle = globalThis.crypto.subtle) {
  const bad = shapeError(r);
  if (bad) return { ok: false, error: bad };
  if ((await identityIdOf(r.pub || {}, subtle).catch(() => null)) !== r.signer) return { ok: false, error: 'key' };
  const text = canonicalText(r.match);
  if (!(await verifySignature(r.pub, text, r.sig, subtle))) return { ok: false, error: 'signature' };
  const rep = replayError(r.match);
  if (rep) return { ok: false, error: rep };
  return { ok: true, text, id: matchIdOf(r.match), signer: r.signer, match: r.match };
}

/** 두 보고서가 같은 판을 서로 다른 두 사람이 서명한 것인지. 맞으면 백 점수. */
export function agree(a, b) {
  if (a.text !== b.text) return { ok: false, error: 'mismatch' };
  if (a.signer === b.signer) return { ok: false, error: 'same-signer' };
  const result = a.match.result;
  return { ok: true, whiteScore: result === '1-0' ? 1 : result === '0-1' ? 0 : 0.5 };
}
