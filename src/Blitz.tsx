import { useEffect, useRef, useState } from 'react';
import { fxSettings } from './fx/settings.js';
import { BLITZ_CAP, BLITZ_FAST_MS, BLITZ_SAND_MS, blitzStep, newBlitz } from './cards/blitz.js';
import { logGame } from './cards/store';
import { payMissionAcorns } from './village/store';

// 번개 판 ⚡ (역동적 체스 DY-3): 켜 둔 판에서 내 차례마다 30초 모래시계, 10초 안에 두면 도토리 1개(판당 10개).
// 시간이 다 돼도 아무 일도 없다. 모든 판(번개·보통)의 생각 시간과 수를 판 기록 `pace` 로 남겨,
// tools/blunder_rate.mjs 가 두 모드의 블런더율을 비교한다.
const wc = () => (window as any).wizardChess;

export default function Blitz({ lang }: { lang: 'ko' | 'en' }) {
  const en = lang === 'en';
  const [on, setOn] = useState(false);          // 이 판이 번개 판인가(판 시작 때 정함)
  const [turnAt, setTurnAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [acorns, setAcorns] = useState(0);
  const [pops, setPops] = useState<number[]>([]);
  const game = useRef({ id: -1, on: false, blitz: newBlitz(), think: {} as Record<number, number>, turnAt: 0, turnKey: '' });

  // 내 차례가 시작된 때(상대 수가 다 내려앉아 손을 쓸 수 있게 된 때)를 0.2초마다 읽는다.
  useEffect(() => {
    const id = window.setInterval(() => {
      const st = wc()?.getHandBrainState?.();
      const g = game.current;
      if (!st) return;
      const mine = st.ready && st.turn === st.playerColor;
      const key = mine ? `${st.gameId}:${st.fen}` : '';
      if (key === g.turnKey) { if (g.on && mine) setNow(Date.now()); return; }
      g.turnKey = key;
      g.turnAt = mine ? Date.now() : 0;
      setTurnAt(mine && g.on ? g.turnAt : null);
      setNow(Date.now());
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onStarted = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const g = game.current;
      if (g.id === d.gameId) return;
      g.id = d.gameId;
      g.on = fxSettings().blitz === true;
      g.blitz = newBlitz();
      g.think = {};
      g.turnKey = '';
      setOn(g.on);
      setAcorns(0);
      setTurnAt(null);
    };
    const onMove = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const g = game.current;
      if (!d.byPlayer || !g.turnAt) return;
      if (g.id !== d.gameId) { g.id = d.gameId; g.on = fxSettings().blitz === true; g.blitz = newBlitz(); g.think = {}; setOn(g.on); }
      const ms = Date.now() - g.turnAt;
      g.think[d.ply] = ms;
      g.turnAt = 0;
      setTurnAt(null);
      if (!g.on) return;
      const r = blitzStep(g.blitz, ms);
      g.blitz = r.state;
      setAcorns(r.state.acorns);
      if (r.earned) {
        const key = Date.now();
        setPops((p) => [...p, key]);
        window.setTimeout(() => setPops((p) => p.filter((k) => k !== key)), 1100);
      }
    };
    const onFinished = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const g = game.current;
      if (g.on && g.blitz.acorns) payMissionAcorns(g.blitz.acorns);
      if (Array.isArray(d.moves) && d.moves.length) {
        logGame({ type: 'pace', at: new Date().toISOString(), gameId: d.gameId, mode: g.on ? 'blitz' : 'normal', color: d.color, result: d.result,
          san: d.moves.map((m: any) => m.san), think: g.think, acorns: g.on ? g.blitz.acorns : 0 });
      }
      g.on = false;
      setOn(false);
      setTurnAt(null);
    };
    window.addEventListener('gamestarted', onStarted);
    window.addEventListener('movestarted', onMove);
    window.addEventListener('gamefinished', onFinished);
    return () => {
      window.removeEventListener('gamestarted', onStarted);
      window.removeEventListener('movestarted', onMove);
      window.removeEventListener('gamefinished', onFinished);
    };
  }, []);

  if (!on) return null;
  const ms = turnAt ? now - turnAt : null;
  const left = ms == null ? 0 : Math.max(0, 1 - ms / BLITZ_SAND_MS);
  const pays = ms != null && ms <= BLITZ_FAST_MS && acorns < BLITZ_CAP;
  return (
    <div className="blitz" id="blitz" aria-live="off">
      {ms != null && ms < BLITZ_SAND_MS && (
        <div className={`blitz-glass${pays ? ' pays' : ''}`} id="blitz-glass" title={en ? 'Move within 10 s for an acorn' : '10초 안에 두면 도토리 1개'}>
          <span aria-hidden="true">⏳</span>
          <span className="blitz-sand"><i style={{ width: `${Math.round(left * 100)}%` }} /></span>
          {/* TA2-6: 숫자만 있던 「17」에 단위를 붙인다(초록일 때는 도토리까지 남은 초, 지난 뒤에는 모래가 다 떨어질 때까지 남은 초). */}
          <b>{pays ? `🌰 ${Math.ceil((BLITZ_FAST_MS - ms) / 1000)}${en ? 's' : '초'}` : `${Math.ceil((BLITZ_SAND_MS - ms) / 1000)}${en ? 's' : '초'}`}</b>
        </div>
      )}
      <span className="blitz-count" id="blitz-count">⚡ 🌰 {acorns}/{BLITZ_CAP}</span>
      {pops.map((k) => <span key={k} className="blitz-pop">+1 🌰</span>)}
    </div>
  );
}
