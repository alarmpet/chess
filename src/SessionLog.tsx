import { useEffect } from 'react';
import { fxSettings } from './fx/settings.js';
import { startEntry } from './cards/sessionLog.js';
import { logGame } from './cards/store';

// 기록 보강(FN-0): 판 시작(이어 하기 포함)·판 도중 창 닫음·끝나지 않은 판을 두고 새 판(quit)을 판 기록에 남긴다. 화면에는 아무것도 그리지 않는다.
// 판 끝(`game`)·수(`pace`)·정찰/되감기(`skill`)는 CardLayer·Blitz 가 남긴다. 묶어 읽는 것은 cards/sessionLog.js 의 storyOf.
const wc = () => (window as any).wizardChess;
const handBrainMode = () => {
  try { const m = JSON.parse(window.localStorage.getItem('wildcrown.handbrain.v1') || 'null')?.mode; return m === 'family' || m === 'adviser' ? m : 'off'; } catch (e) { return 'off'; }
};

const handBrainRoles = () => {
  try { return JSON.parse(window.localStorage.getItem('wildcrown.handbrain.v1') || 'null')?.swap === 'game' ? 'game' : 'move'; } catch (e) { return 'move'; }
};

export default function SessionLog() {
  useEffect(() => {
    const cur = { gameId: null as number | null, finished: true, left: false, ply: 0 };
    const onStarted = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      // 수가 있는데 끝나지 않은 판을 두고 새 판이 시작됐다(새 판 · 이른 기권 · 진영 바꾸기 · 라이벌 고르기).
      if (cur.gameId != null && cur.gameId !== d.gameId && !cur.finished && cur.ply > 0) {
        logGame({ type: 'quit', at: new Date().toISOString(), gameId: cur.gameId, ply: cur.ply });
      }
      if (d.color === 'spectator') { cur.gameId = null; return; }
      cur.ply = cur.gameId === d.gameId ? Math.max(cur.ply, d.resumed || 0) : d.resumed || 0;
      cur.gameId = d.gameId;
      cur.finished = false;
      cur.left = false;
      logGame(startEntry(d, { handBrain: handBrainMode(), blitz: fxSettings().blitz === true, roles: handBrainRoles() }));
    };
    const onMove = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      if (d.gameId === cur.gameId) cur.ply = Math.max(cur.ply, (d.ply ?? -1) + 1);
    };
    const onFinished = (e: Event) => {
      if ((e as CustomEvent).detail?.gameId === cur.gameId) cur.finished = true;
    };
    // 창을 닫거나 새로고침하거나 다른 앱으로 넘어갈 때: 끝나지 않은 판에 수가 있으면 한 번만 남긴다.
    const onLeave = () => {
      if (cur.gameId == null || cur.finished || cur.left) return;
      const st = wc()?.getHandBrainState?.();
      const ply = st?.gameId === cur.gameId ? st.history?.length || 0 : cur.ply;
      if (!ply) return;
      cur.left = true;
      logGame({ type: 'leave', at: new Date().toISOString(), gameId: cur.gameId, ply });
    };
    const onVisible = () => { if (document.visibilityState === 'hidden') onLeave(); else cur.left = false; };
    window.addEventListener('gamestarted', onStarted);
    window.addEventListener('gamefinished', onFinished);
    window.addEventListener('movestarted', onMove);
    window.addEventListener('pagehide', onLeave);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('gamestarted', onStarted);
      window.removeEventListener('gamefinished', onFinished);
      window.removeEventListener('movestarted', onMove);
      window.removeEventListener('pagehide', onLeave);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return null;
}
