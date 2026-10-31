// Player choices for how much show a game puts on. None of them touch the chess.
const FX_SETTINGS_KEY = 'wildcrown.fx.v1';
const DEFAULTS = { shake: true, quick: false };

export function readFxSettings(storage) {
  try {
    const saved = JSON.parse(storage.getItem(FX_SETTINGS_KEY) || '{}');
    return { shake: saved.shake !== false, quick: saved.quick === true };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function writeFxSettings(storage, settings) {
  try {
    storage.setItem(FX_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

export function fxSettings() {
  return typeof window === 'undefined' ? { ...DEFAULTS } : readFxSettings(window.localStorage);
}
