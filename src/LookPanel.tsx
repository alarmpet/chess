// Appearance panel (PLAN §14.2 · §14.3, 2026-10-29): pick a look stage and non-weapon trinkets per side and role.
// Looks only — the first line says so (PLAN §14.0 display rule). Earning stages by play (Phase 5b) is not wired yet;
// for now every stage is open so the art can be seen on the board.
import { useEffect, useState } from 'react';

type Named = { ko?: string; en?: string };
type Stage = { id: string; name?: Named; desc?: Named };
type Item = { model: string; slot: 'head' | 'neck'; name?: Named };
type Catalog = {
  stages: Stage[];
  note: Named | null;
  items: Record<string, Item>;
  roles: Record<string, { slots: ('head' | 'neck')[]; stages: string[] }>;
};
type Look = { stage: string; head?: string; neck?: string };
type Cosmetics = { w: Record<string, Look>; b: Record<string, Look> };

const ROLES: { id: string; ko: string; en: string }[] = [
  { id: 'king', ko: '킹 · 사자', en: 'King · lion' },
  { id: 'queen', ko: '퀸 · 호랑이', en: 'Queen · tiger' },
  { id: 'rook', ko: '룩 · 코뿔소', en: 'Rook · rhino' },
  { id: 'bishop', ko: '비숍 · 판다', en: 'Bishop · panda' },
  { id: 'knight', ko: '나이트 · 캥거루', en: 'Knight · kangaroo' },
  { id: 'pawn', ko: '폰 · 미어캣', en: 'Pawn · meerkat' }
];
const SLOT_LABEL: Record<string, Named> = { head: { ko: '머리', en: 'Head' }, neck: { ko: '목', en: 'Neck' } };

function api(): any {
  return (window as any).wizardChess;
}

export default function LookPanel({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: 'ko' | 'en' }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [looks, setLooks] = useState<Cosmetics | null>(null);
  const [side, setSide] = useState<'w' | 'b'>('w');
  const [busy, setBusy] = useState(false);
  const L = (n?: Named | null) => (n ? (lang === 'en' ? n.en || n.ko : n.ko || n.en) || '' : '');

  useEffect(() => {
    if (!open) return;
    setCatalog(api()?.getLookCatalog?.() || null);
    setLooks(api()?.getCosmetics?.() || null);
  }, [open]);

  if (!open) return null;

  const apply = async (role: string, patch: Partial<Look>) => {
    if (!looks || busy) return;
    const next: Cosmetics = JSON.parse(JSON.stringify(looks));
    const cur = { ...(next[side][role] || { stage: catalog?.stages[0]?.id || 'base' }), ...patch };
    for (const k of Object.keys(cur) as (keyof Look)[]) if (cur[k] === undefined || cur[k] === '') delete cur[k];
    next[side][role] = cur;
    setLooks(next);
    setBusy(true);
    try {
      const saved = await api()?.setCosmetics?.(next);
      if (saved) setLooks(saved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel-card look-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">
            <span>🎨</span>
            <span>{lang === 'en' ? 'Looks' : '외형'}</span>
          </div>
          <button type="button" className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <p className="look-note" id="look-note">
            {L(catalog?.note) || (lang === 'en' ? 'Looks only — every piece moves exactly the same.' : '외형만 바뀌고 수는 같습니다.')}
          </p>
          {!catalog || !looks ? (
            <p>{lang === 'en' ? 'This pack has no looks.' : '이 팩에는 외형이 없습니다.'}</p>
          ) : (
            <>
              <div className="look-side-tabs" role="tablist">
                {(['w', 'b'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={side === s}
                    className={`hud-btn look-side-btn${side === s ? ' active' : ''}`}
                    onClick={() => setSide(s)}
                  >
                    {s === 'w' ? (lang === 'en' ? '☀️ Sun kingdom (white)' : '☀️ 해의 왕국 (백)') : lang === 'en' ? '🌙 Moon kingdom (black)' : '🌙 달의 왕국 (흑)'}
                  </button>
                ))}
              </div>
              {ROLES.map((r) => {
                const role = catalog.roles[r.id];
                const look = looks[side][r.id] || { stage: catalog.stages[0]?.id };
                if (!role) return null;
                return (
                  <div className="look-row" key={r.id} data-role={r.id}>
                    <div className="look-role">{lang === 'en' ? r.en : r.ko}</div>
                    <div className="look-stages">
                      {catalog.stages.filter((st) => role.stages.includes(st.id)).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          disabled={busy}
                          className={`look-chip${look.stage === st.id ? ' active' : ''}`}
                          title={L(st.desc)}
                          onClick={() => apply(r.id, { stage: st.id })}
                        >
                          {L(st.name) || st.id}
                        </button>
                      ))}
                    </div>
                    {role.slots.map((slot) => (
                      <label className="look-slot" key={slot}>
                        <span>{L(SLOT_LABEL[slot])}</span>
                        <select
                          disabled={busy}
                          value={look[slot] || ''}
                          onChange={(e) => apply(r.id, { [slot]: e.target.value || undefined })}
                        >
                          <option value="">{lang === 'en' ? 'none' : '없음'}</option>
                          {Object.entries(catalog.items).filter(([, it]) => it.slot === slot).map(([id, it]) => (
                            <option key={id} value={id}>{L(it.name) || id}</option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                );
              })}
              <p className="look-foot">
                {lang === 'en'
                  ? 'Trinkets are won from rivals, one per win. All stages are open for now.'
                  : '소품은 라이벌을 이기면 하나씩 얻습니다. 외형 단계는 지금 모두 열려 있습니다.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
