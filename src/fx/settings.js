// Player choices for how much show a game puts on. None of them touch the chess.
const FX_SETTINGS_KEY = 'wildcrown.fx.v1';
// dive: the short plunge from the board down to the village (atlantis plan AT-2); off skips straight to the island.
const DEFAULTS = { shake: true, quick: false, cards: true, dive: true };

export function readFxSettings(storage) {
  try {
    const saved = JSON.parse(storage.getItem(FX_SETTINGS_KEY) || '{}');
    return { shake: saved.shake !== false, quick: saved.quick === true, cards: saved.cards !== false, dive: saved.dive !== false };
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
