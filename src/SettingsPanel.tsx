import { useState } from 'react';
import { sfx } from './audio/sfx.js';
import { fxSettings, writeFxSettings } from './fx/settings.js';
import { loadCollection } from './cards/store';
import { UNLOCK_GAMES } from './cards/economy.js';
import { STEP_COUNT, freePlayOf, loadSkill, pickStep, saveSkill, setAuto, stepLabel } from './rules/strength.js';

// One place for the show-versus-speed choices, so the top bar does not grow a button for each.
export default function SettingsPanel({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: 'ko' | 'en' }) {
  const [fx, setFx] = useState(fxSettings());
  const [soundOn, setSoundOn] = useState(!sfx.isMuted());
  const [skill, setSkill] = useState(() => loadSkill(typeof window === 'undefined' ? null : window.localStorage));
  if (!open) return null;
  // DR-M1: AI 세기 — 자동 맞춤(기본) 또는 직접 고르기. 다음 판부터(판 중에는 바뀌지 않는다).
  const saveStrength = (next: any) => {
    setSkill(next);
    saveSkill(window.localStorage, next);
    (window as any).wizardChess?.setFreePlay?.(freePlayOf(next.step));
  };

  const en = lang === 'en';
  const setOption = (key: 'shake' | 'quick' | 'cards' | 'dive' | 'quests' | 'blitz', value: boolean) => {
    const next = { ...fx, [key]: value };
    setFx(next);
    writeFxSettings(window.localStorage, next);
  };
  const rows = [
    { id: 'sound', icon: soundOn ? '🔊' : '🔇', label: en ? 'Sound' : '소리', hint: en ? 'Animal voices and effects' : '동물 목소리와 효과음', on: soundOn, toggle: () => { sfx.setMuted(soundOn); setSoundOn(!soundOn); } },
    { id: 'shake', icon: '📳', label: en ? 'Screen shake' : '화면 흔들림', hint: en ? 'Shake on big captures' : '큰 잡기 때 화면이 흔들립니다', on: fx.shake, toggle: () => setOption('shake', !fx.shake) },
    { id: 'cards', icon: '🃏', label: en ? 'Capture cards' : '잡기 카드', hint: en ? 'Captures drop cards' : '말을 잡으면 카드가 나옵니다', on: fx.cards, toggle: () => setOption('cards', !fx.cards) },
    { id: 'quick', icon: '⚡', label: en ? 'Quick games' : '빠른 대국', hint: en ? 'Skips the capture close-up' : '잡을 때 카메라가 다가가지 않습니다', on: fx.quick, toggle: () => setOption('quick', !fx.quick) },
    { id: 'dive', icon: '🫧', label: en ? 'Dive to the village' : '마을로 잠수', hint: en ? 'The camera plunges under the board on the way to the island' : '마을로 갈 때 카메라가 판 아래 물속으로 내려갑니다', on: fx.dive, toggle: () => setOption('dive', !fx.dive) },
    { id: 'quests', icon: '📋', label: en ? "Today's quests" : '오늘의 퀘스트', hint: en ? 'Three small goals a day, filled over any games. Nothing is lost for a missed day' : '하루 세 가지 작은 목표, 여러 판에 걸쳐 채워요. 못 해도 잃는 건 없어요', on: fx.quests, toggle: () => setOption('quests', !fx.quests) }
  ];
  // The lightning board is a choice for players past the first games (dynamic-chess DY-3).
  if (loadCollection().games >= UNLOCK_GAMES) rows.push({ id: 'blitz', icon: '⚡', label: en ? 'Lightning board' : '번개 판', hint: en ? 'An hourglass on your turn: move within 10 s for an acorn (10 a game). Running out costs nothing' : '내 차례에 모래시계. 10초 안에 두면 도토리 1개(판당 10개). 시간이 다 돼도 잃는 건 없어요. 다음 판부터', on: fx.blitz, toggle: () => setOption('blitz', !fx.blitz) });

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
          <div className="settings-row settings-strength" id="setting-strength">
            <span className="settings-icon">🎚️</span>
            <span className="settings-text">
              <b>{en ? 'AI strength' : 'AI 세기'}</b>
              <span className="strength-step" id="strength-step">{stepLabel(skill.step, en)}</span>
              <small>{skill.mode === 'auto'
                ? (en ? 'Auto: matched to you after each game (you win a bit more than half). Next game on' : '자동: 판이 끝날 때마다 나에게 맞춰요(절반 조금 넘게 이기도록). 다음 판부터')
                : (en ? 'Fixed at this step. Next game on' : '이 단계로 고정. 다음 판부터')}</small>
            </span>
            <span className="strength-controls">
              <button type="button" id="strength-down" aria-label={en ? 'Easier' : '더 쉽게'} disabled={skill.step <= 1} onClick={() => saveStrength(pickStep(skill, skill.step - 1))}>−</button>
              <button type="button" id="strength-up" aria-label={en ? 'Harder' : '더 어렵게'} disabled={skill.step >= STEP_COUNT} onClick={() => saveStrength(pickStep(skill, skill.step + 1))}>+</button>
              <button type="button" id="strength-auto" className={`settings-switch${skill.mode === 'auto' ? ' on' : ''}`} aria-pressed={skill.mode === 'auto'} onClick={() => saveStrength(setAuto(skill, skill.mode !== 'auto'))}>{en ? 'Auto' : '자동'}</button>
            </span>
          </div>
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
