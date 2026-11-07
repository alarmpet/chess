// 친구 초대 대전의 전송층. 기획서 §12.1: Supabase Realtime 「방송」 채널 하나(`wildcrown:<방 코드>`), DB 표 없음.
// 라이브러리 없이 Realtime 의 Phoenix 웹소켓 규약을 직접 쓴다(join · broadcast · 25초 heartbeat · 끊기면 다시 연결).
// 주소·키(공개용 publishable 키)는 빌드 환경 변수 VITE_WC_REALTIME_URL · VITE_WC_REALTIME_KEY 에서 읽는다.
// 둘 다 없으면 같은 브라우저의 탭끼리만 잇는 BroadcastChannel 로 대신한다(개발·시험용).

const HEARTBEAT_MS = 25000;

/** 빌드에 들어간 중계 설정. 없으면 null. */
export function realtimeConfig(env) {
  const url = env?.VITE_WC_REALTIME_URL;
  const key = env?.VITE_WC_REALTIME_KEY;
  return url && key ? { url: String(url).replace(/\/+$/, ''), key: String(key) } : null;
}

/** Supabase 주소(https://<ref>.supabase.co)에서 Realtime 웹소켓 주소. */
export function socketUrl({ url, key }) {
  return `${url.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`;
}

/**
 * 방 채널을 연다. onMessage(msg) 로 받은 것을, onStatus('connecting' | 'open' | 'closed') 로 연결 상태를 알린다.
 * 돌려주는 send(msg) 는 연결이 끊긴 동안 보낸 것을 버린다(규칙 층이 다시 보낸다).
 * @param {string} code
 * @param {{ onMessage: (m: any) => void, onStatus?: (s: string) => void, config?: { url: string, key: string } | null, WebSocketImpl?: any }} opts
 */
export function openRoom(code, { onMessage, onStatus = () => {}, config = null, WebSocketImpl = globalThis.WebSocket }) {
  if (!config || !WebSocketImpl) return openLocalRoom(code, { onMessage, onStatus });
  const topic = `realtime:wildcrown:${code}`;
  let ws = null;
  let ref = 0;
  let joined = false;
  let closed = false;
  let beat = 0;
  let retry = 0;
  let wait = 1000;
  const raw = (o) => { try { ws?.send(JSON.stringify({ ...o, ref: String(++ref) })); } catch (e) { /* 끊김 */ } };
  const connect = () => {
    if (closed) return;
    onStatus('connecting');
    joined = false;
    try { ws = new WebSocketImpl(socketUrl(config)); } catch (e) { schedule(); return; }
    ws.onopen = () => {
      raw({ topic, event: 'phx_join', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, private: false } } });
      beat = setInterval(() => raw({ topic: 'phoenix', event: 'heartbeat', payload: {} }), HEARTBEAT_MS);
    };
    ws.onmessage = (e) => {
      let m = null;
      try { m = JSON.parse(e.data); } catch (err) { return; }
      if (m.topic !== topic) return;
      if (m.event === 'phx_reply' && !joined) {
        if (m.payload?.status === 'ok') { joined = true; wait = 1000; onStatus('open'); } else ws.close();
      } else if (m.event === 'broadcast' && m.payload?.event === 'm') onMessage(m.payload.payload);
      else if (m.event === 'phx_error' || m.event === 'phx_close') ws.close();
    };
    ws.onclose = () => { clearInterval(beat); if (joined) onStatus('closed'); joined = false; schedule(); };
    ws.onerror = () => { try { ws.close(); } catch (e) { /* 이미 닫힘 */ } };
  };
  // 끊기면 1·2·4·8초…(최대 15초) 뒤 다시 잇는다.
  const schedule = () => {
    if (closed) return;
    clearTimeout(retry);
    retry = setTimeout(connect, wait);
    wait = Math.min(15000, wait * 2);
  };
  connect();
  return {
    kind: 'realtime',
    send: (msg) => { if (joined) raw({ topic, event: 'broadcast', payload: { type: 'broadcast', event: 'm', payload: msg } }); },
    close: () => { closed = true; clearTimeout(retry); clearInterval(beat); try { ws?.close(); } catch (e) { /* 닫힘 */ } onStatus('closed'); }
  };
}

/** @param {string} code @param {{ onMessage: (m: any) => void, onStatus: (s: string) => void }} opts */
function openLocalRoom(code, { onMessage, onStatus }) {
  let ch = null;
  try { ch = new BroadcastChannel(`wildcrown:${code}`); } catch (e) { ch = null; }
  if (ch) ch.onmessage = (e) => onMessage(e.data);
  setTimeout(() => onStatus(ch ? 'open' : 'closed'), 0);
  return {
    kind: 'local',
    send: (msg) => { try { ch?.postMessage(msg); } catch (e) { /* 닫힘 */ } },
    close: () => { try { ch?.close(); } catch (e) { /* 닫힘 */ } onStatus('closed'); }
  };
}
