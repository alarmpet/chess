// Rival panel (prototype, 2026-10-30): pick a dressed-up AI to play. Each win over it gives its next trinket, and the
// list shows what is still to win. Looks only — the same note as the appearance panel (PLAN §14.0 display rule).
import { useEffect, useState } from 'react';

type Named = { ko?: string; en?: string };
type Rival = { id: string; name?: Named; blurb?: Named; rewards: string[] };
type Catalog = {
  active: string | null;
  unlocked: string[];
  wins: Record<string, number>;
  items: Record<string, { name?: Named }>;
  rivals: Rival[];
};

function api(): any {
  return (window as any).wizardChess;
}

export default function RivalPanel({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: 'ko' | 'en' }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState(false);
  const L = (n?: Named | null) => (n ? (lang === 'en' ? n.en || n.ko : n.ko || n.en) || '' : '');

  useEffect(() => {
    if (!open) return;
    setCatalog(api()?.getRivalCatalog?.() || null);
  }, [open]);

  if (!open) return null;

  const start = async (id: string | null) => {
    if (busy) return;
    setBusy(true);
    try {
      await api()?.startRival?.(id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel-card rival-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">
            <span>🏆</span>
            <span>{lang === 'en' ? 'Rivals' : '라이벌'}</span>
          </div>
          <button type="button" className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          <p className="look-note">
            {lang === 'en'
              ? 'Win and take one of their trinkets. Looks only — every piece moves exactly the same.'
              : '이기면 상대 소품을 하나 얻습니다. 외형만 바뀌고 수는 같습니다.'}
          </p>
          {!catalog ? (
            <p>{lang === 'en' ? 'This pack has no rivals.' : '이 팩에는 라이벌이 없습니다.'}</p>
          ) : (
            <>
              {catalog.rivals.map((r) => (
                <div className={`rival-row${catalog.active === r.id ? ' active' : ''}`} key={r.id} data-rival={r.id}>
                  <div className="rival-text">
                    <div className="rival-name">{L(r.name)}</div>
                    <div className="rival-blurb">{L(r.blurb)}</div>
                    <div className="rival-rewards">
                      {r.rewards.map((id) => {
                        const owned = catalog.unlocked.includes(id);
                        return (
                          <span className={`rival-reward${owned ? ' owned' : ''}`} key={id}>
                            {L(catalog.items[id]?.name) || id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button type="button" className="hud-btn" disabled={busy} onClick={() => start(r.id)}>
                    {lang === 'en' ? 'Play' : '도전'}
                  </button>
                </div>
              ))}
              {catalog.active && (
                <button type="button" className="hud-btn" disabled={busy} onClick={() => start(null)}>
                  {lang === 'en' ? 'Back to free play' : '자유 대국으로'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
