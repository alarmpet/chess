// 에뮬레이터 크롬을 adb forward(tcp:9333 → chrome_devtools_remote)로 CDP 조작하는 작은 도구.
const BASE = 'http://127.0.0.1:9333';
export async function tabs() { return (await fetch(`${BASE}/json/list`)).json(); }
// 안드로이드 크롬은 /json/new 를 막는다 → adb 인텐트로 열고 주소로 탭을 찾는다.
export async function openTab(url, match = url) {
  const { execFileSync } = await import('node:child_process');
  execFileSync('C:/Users/petbl/AppData/Local/Android/Sdk/platform-tools/adb.exe', ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `'${url}'`, 'com.android.chrome']);
  for (let i = 0; i < 100; i++) {
    const t = (await tabs()).find((x) => x.type === 'page' && x.url.includes(match));
    if (t) return t;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('tab not found');
}
export async function closeTab(id) { await fetch(`${BASE}/json/close/${id}`); }
export async function attach(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  let id = 0;
  const wait = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const n = ++id; wait.set(n, ok); ws.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
    return r.result?.result?.value;
  };
  const waitFor = async (expr, ms = 60000, step = 200) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (await evaluate(expr)) return Date.now() - t0; } catch (e) { /* 아직 */ } await new Promise((r) => setTimeout(r, step)); }
    return -1;
  };
  // 손가락 한 번: CSS 좌표에 touchStart → touchEnd
  const tap = async (x, y) => {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await new Promise((r) => setTimeout(r, 60));
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  return { send, evaluate, waitFor, tap, close: () => ws.close() };
}
