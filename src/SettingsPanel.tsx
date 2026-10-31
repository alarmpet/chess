import { useState } from 'react';
import { sfx } from './audio/sfx.js';
import { fxSettings, writeFxSettings } from './fx/settings.js';

// One place for the show-versus-speed choices, so the top bar does not grow a button for each.
export default function SettingsPanel({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: 'ko' | 'en' }) {
  const [fx, setFx] = useState(fxSettings());
  const [soundOn, setSoundOn] = useState(!sfx.isMuted());
  if (!open) return null;

  const en = lang === 'en';
  const setOption = (key: 'shake' | 'quick' | 'cards', value: boolean) => {
    const next = { ...fx, [key]: value };
    setFx(next);
    writeFxSettings(window.localStorage, next);
  };
  const rows = [
    { id: 'sound', icon: soundOn ? '🔊' : '🔇', label: en ? 'Sound' : '소리', hint: en ? 'Animal voices and effects' : '동물 목소리와 효과음', on: soundOn, toggle: () => { sfx.setMuted(soundOn); setSoundOn(!soundOn); } },
    { id: 'shake', icon: '📳', label: en ? 'Screen shake' : '화면 흔들림', hint: en ? 'Shake on big captures' : '큰 잡기 때 화면이 흔들립니다', on: fx.shake, toggle: () => setOption('shake', !fx.shake) },
    { id: 'cards', icon: '🃏', label: en ? 'Capture cards' : '잡기 카드', hint: en ? 'Captures drop cards' : '말을 잡으면 카드가 나옵니다', on: fx.cards, toggle: () => setOption('cards', !fx.cards) },
    { id: 'quick', icon: '⚡', label: en ? 'Quick games' : '빠른 대국', hint: en ? 'Skips the capture close-up' : '잡을 때 카메라가 다가가지 않습니다', on: fx.quick, toggle: () => setOption('quick', !fx.quick) }
  ];

  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="panel-card settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="panel-title">
            <span>⚙️</span>
            <span>{en ? 'Settings' : '설정'}</span>
          </div>
          <button type="button" className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          {rows.map((r) => (
            <button key={r.id} type="button" className="settings-row" id={`setting-${r.id}`} aria-pressed={r.on} onClick={r.toggle}>
              <span className="settings-icon">{r.icon}</span>
              <span className="settings-text">
                <b>{r.label}</b>
                <small>{r.hint}</small>
              </span>
              <span className={`settings-switch${r.on ? ' on' : ''}`}>{r.on ? (en ? 'On' : '켜짐') : (en ? 'Off' : '꺼짐')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
