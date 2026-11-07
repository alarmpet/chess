// 친구 초대 1:1 대전(협동 계획서 CO-4 를 앞당김, 2026-11-07)의 규칙 층 — 전송과 화면이 없는 순수 상태 기계.
// 기획서 §12.1: 방 코드·초대 링크, 랜덤 매칭·자유 채팅·카드 없음. 받은 수는 chess.js 로 검증하고,
// 순번은 「엔진 적용에 성공한 뒤에만」 올린다(옛 tryApplyNext 는 적용 전에 올리고 말이 없으면 조용히 건너뛰었다 — codex 지적).
//
// 방장(host)이 판의 기준이다. 메시지는 모두 { t, from: 보낸 사람 id, to?: 받을 사람 id, ... }:
//   hello                               들어옴·다시 연결됨. 방장은 state 로, 손님은 hello 로 답한다.
//   state { hostColor, moves, ended, game }   방장의 판 전체. 손님은 모자란 수만 적용하거나 새 판으로 받는다.
//   move { seq, uci }  ack { seq }      seq 는 1부터. 방송 채널은 도착을 보장하지 않으므로 ack 가 올 때까지 다시 보낸다.
//   resign · rematch · rematchOk { game, hostColor } · full · ping
import { Chess } from 'chess.js';

export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** 방 코드 길이. 기획서는 4자리였지만 공용 채널이라 남이 우연히 맞히기 어렵게 6자리. */
export const CODE_LEN = 6;
export const RESEND_MS = 2000;
export const PEER_LOST_MS = 15000;

export function newRoomCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length) % CODE_CHARS.length];
  return s;
}

/** 사람이 친 코드나 초대 링크에서 방 코드를 꺼낸다. 틀리면 null. */
export function parseRoomCode(input) {
  const raw = String(input || '').trim();
  const fromUrl = /[?&]room=([A-Za-z0-9]+)/.exec(raw);
  const code = (fromUrl ? fromUrl[1] : raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== CODE_LEN) return null;
  return [...code].every((ch) => CODE_CHARS.includes(ch)) ? code : null;
}

export const uciOf = (m) => `${m.from}${m.to}${m.promotion || ''}`;
export function moveOfUci(uci) {
  const s = String(uci || '');
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(s)) return null;
  return { from: s.slice(0, 2), to: s.slice(2, 4), promotion: s[4] || undefined };
}

/** 판 끝을 내 쪽에서 본 결과. 아직이면 null. */
export function outcome(chess, myColor) {
  if (!chess.isGameOver()) return null;
  if (chess.isCheckmate()) return { result: chess.turn() === myColor ? 'loss' : 'win', reason: 'checkmate' };
  const reason = chess.isStalemate() ? 'stalemate' : chess.isThreefoldRepetition() ? 'repetition' : chess.isInsufficientMaterial() ? 'material' : 'fifty';
  return { result: 'draw', reason };
}

/** uci 목록을 chess.js 로 다시 둔다. 틀린 수에서 멈춘다. */
function replay(list) {
  const chess = new Chess();
  const moves = [];
  for (const u of list || []) {
    const mv = moveOfUci(u);
    let m = null;
    try { m = mv && chess.move(mv); } catch (e) { m = null; }
    if (!m) break;
    moves.push(uciOf(m));
  }
  return { chess, moves };
}

const other = (c) => (c === 'w' ? 'b' : 'w');
const flipEnd = (e) => (!e || e.result === 'draw' ? e : { ...e, result: e.result === 'win' ? 'loss' : 'win' });

/**
 * 한 사람 쪽 대전 상태. `send(msg)` 는 전송, `apply({from,to,promotion})` 는 엔진에 상대 수를 두고 Promise<boolean>.
 * 새 판을 엔진에 그려야 할 때 `view().reset` 이 생긴다 → 화면 층이 `takeReset()` 으로 받아 엔진을 새로 세운다.
 */
export function createMatchCore({ id, host, hostColor = 'w', send, apply, now = () => Date.now() }) {
  const s = {
    host, hostColor: host ? hostColor : null, myColor: host ? hostColor : null, game: 1,
    moves: /** @type {string[]} */ ([]), ended: /** @type {any} */ (null), peerSeen: 0, unacked: new Map(), rematch: /** @type {null | 'me' | 'peer'} */ (null), full: false,
    reset: /** @type {null | { color: string, game: number, moves: any[] }} */ (null), peer: /** @type {string | null} */ (null)
  };
  let chess = new Chess();
  let busy = Promise.resolve();
  const listeners = new Set();
  const view = () => ({
    myColor: s.myColor, game: s.game, plies: s.moves.length, moves: s.moves.slice(), ended: s.ended, full: s.full, reset: s.reset,
    peer: s.peer, peerOnline: Boolean(s.peer) && now() - s.peerSeen < PEER_LOST_MS, turn: chess.turn(), rematch: s.rematch,
    waitingAck: s.unacked.size
  });
  const changed = () => { const v = view(); for (const f of listeners) f(v); };
  const out = (msg) => send({ ...msg, from: id });
  const stateMsg = () => ({ t: 'state', hostColor: s.hostColor, moves: s.moves.slice(), ended: s.ended, game: s.game });
  const checkEnd = () => { if (!s.ended && s.myColor) s.ended = outcome(chess, s.myColor); };
  const newGame = (myColor, game, moves = [], ended = null) => {
    const r = replay(moves);
    chess = r.chess;
    s.myColor = myColor;
    s.game = game;
    s.moves = r.moves;
    s.ended = ended;
    s.unacked.clear();
    s.rematch = null;
    s.reset = { color: myColor, game, moves: r.moves.map(moveOfUci) };
    checkEnd();
  };

  // 상대 수: 다음 번호이고, 상대 색이고, 규칙에 맞을 때만 엔진에 넘기고, 성공한 뒤에만 번호를 올린다.
  async function applyRemote(uci, seq) {
    if (s.reset || !s.myColor || s.ended || seq !== s.moves.length + 1 || chess.turn() === s.myColor) return false;
    const mv = moveOfUci(uci);
    let m = null;
    try { m = mv && chess.move(mv); } catch (e) { m = null; }
    if (!m) return false;
    if (!(await apply(mv))) { chess.undo(); return false; }
    s.moves.push(uciOf(m));
    checkEnd();
    return true;
  }

  // 손님: 방장 판을 받는다. 내 기록이 그 앞부분이면 모자란 수만 엔진에 두고, 아니면 새 판으로 그린다.
  async function adopt(st) {
    if (s.host || !Array.isArray(st.moves)) return;
    s.hostColor = st.hostColor === 'b' ? 'b' : 'w';
    const mine = other(s.hostColor);
    const ended = flipEnd(st.ended || null);
    const same = s.myColor === mine && (st.game || 1) === s.game;
    // 같은 판인데 방장 기록이 내 기록의 앞부분이면(내 수가 아직 가는 중에 예전 state 가 늦게 옴) 그대로 둔다 — 내 수는 다시 보낸다.
    if (same && st.moves.length < s.moves.length && st.moves.every((u, i) => s.moves[i] === u)) return;
    const prefix = same && s.moves.every((u, i) => st.moves[i] === u);
    if (!prefix) { newGame(mine, st.game || 1, st.moves, ended); return; }
    if (s.reset) return;   // 아직 엔진이 새 판을 안 그렸다 — takeReset 뒤 다시 hello
    for (let i = s.moves.length; i < st.moves.length; i++) {
      const mv = moveOfUci(st.moves[i]);
      let m = null;
      try { m = mv && chess.move(mv); } catch (e) { m = null; }
      if (!m) break;
      // 엔진이 받지 못하면(엔진과 기록이 어긋남) 판 전체를 다시 그려 맞춘다.
      if (!(await apply(mv))) { chess.undo(); newGame(mine, st.game || 1, st.moves, ended); return; }
      s.moves.push(uciOf(m));
    }
    if (ended && !s.ended) s.ended = ended;
    checkEnd();
  }

  function hostRematch() {
    s.hostColor = other(s.hostColor);
    newGame(s.hostColor, s.game + 1);
    out({ t: 'rematchOk', game: s.game, hostColor: s.hostColor });
  }

  function receive(msg) {
    if (!msg || msg.from === id || (msg.to && msg.to !== id)) return busy;
    if (msg.t === 'full') { s.full = true; changed(); return busy; }
    // 자리 잡기: 방장은 처음 hello 한 사람, 손님은 처음 state 를 보낸 사람. 세 번째 사람에게 방장은 「찼다」만.
    if (!s.peer && (s.host ? msg.t === 'hello' : msg.t === 'state')) s.peer = msg.from;
    if (msg.from !== s.peer) { if (s.host && msg.t === 'hello') out({ t: 'full', to: msg.from }); return busy; }
    s.peerSeen = now();
    busy = busy.then(async () => {
      if (msg.t === 'hello') out(s.host ? stateMsg() : { t: 'hello' });
      else if (msg.t === 'state') await adopt(msg);
      else if (msg.t === 'move') {
        if (msg.seq <= s.moves.length) out({ t: 'ack', seq: msg.seq });   // 이미 둔 수를 다시 받음
        else if (await applyRemote(msg.uci, msg.seq)) out({ t: 'ack', seq: msg.seq });
        else out(s.host ? stateMsg() : { t: 'hello' });                    // 어긋남 → 방장 판으로 다시 맞춘다
      } else if (msg.t === 'ack') { for (const k of [...s.unacked.keys()]) if (k <= msg.seq) s.unacked.delete(k); }
      else if (msg.t === 'resign') { if (!s.ended) s.ended = { result: 'win', reason: 'resign' }; }
      // 둘 다 청했으면(한쪽이 새로고침해 요청을 잃은 경우 포함) 바로 시작: 방장은 새 판, 손님은 다시 「좋다」를 보낸다.
      else if (msg.t === 'rematch') {
        if (s.rematch === 'me') { if (s.host) hostRematch(); else out({ t: 'rematch' }); } else s.rematch = 'peer';
      }
      else if (msg.t === 'rematchOk' && !s.host) newGame(other(msg.hostColor), msg.game);
      changed();
    }).catch(() => {});
    return busy;
  }

  return {
    view,
    receive,
    /** @param {(v: ReturnType<typeof view>) => void} f */
    onChange: (f) => { listeners.add(f); return () => listeners.delete(f); },
    /** 방에 들어오거나 다시 연결되면 부른다. */
    join() { out({ t: 'hello' }); },
    /** 방장이 새로고침 뒤 저장해 둔 판으로 되살린다. */
    restore({ hostColor: c, game, moves, ended }) {
      if (!s.host) return;
      s.hostColor = c === 'b' ? 'b' : 'w';
      newGame(s.hostColor, game || 1, moves, ended || null);
      changed();
    },
    /** 엔진이 내 수를 둔 뒤 부른다. 내 차례가 아니거나 판이 끝났으면 false. */
    local(move) {
      if (s.reset || s.ended || !s.myColor || chess.turn() !== s.myColor) return false;
      let m = null;
      try { m = chess.move({ from: move.from, to: move.to, promotion: move.promotion }); } catch (e) { m = null; }
      if (!m) return false;
      s.moves.push(uciOf(m));
      const msg = { t: 'move', seq: s.moves.length, uci: uciOf(m) };
      s.unacked.set(msg.seq, { msg, at: now() });
      out(msg);
      checkEnd();
      changed();
      return true;
    },
    /** 1~2초마다: ack 안 온 수를 다시 보내고 살아 있다고 알린다. */
    tick() {
      const t = now();
      for (const u of s.unacked.values()) if (t - u.at >= RESEND_MS) { u.at = t; out(u.msg); }
      out({ t: 'ping' });
      changed();
    },
    resign() {
      if (s.ended || !s.myColor || s.reset) return;
      s.ended = { result: 'loss', reason: 'resign' };
      out({ t: 'resign' });
      changed();
    },
    /** 다시 두기(색을 바꿔서). 한쪽이 청하고 다른 쪽이 누르면 방장이 새 판을 연다. */
    rematch() {
      if (!s.ended) return;
      if (s.host && (s.rematch === 'peer' || !s.peer)) hostRematch();
      else { s.rematch = 'me'; out({ t: 'rematch' }); }
      changed();
    },
    /** 화면 층: 엔진에 새 판을 그리기 직전에 부른다. 그릴 색과 이미 둔 수를 돌려준다. */
    takeReset() {
      const r = s.reset;
      s.reset = null;
      if (r && !s.host) out({ t: 'hello' });   // 그리는 동안 방장이 둔 수를 마저 받는다
      changed();
      return r;
    },
    _chess: () => chess
  };
}
