// Every sound in the game is synthesised from these recipes, so there are no audio files to license or download.
// A tone is { at, dur, wave, f, gain } plus optional filter, vib (pitch wobble) and am (volume wobble).
// `f` lists frequencies swept evenly across the tone. Numbers are starting values to tune by ear.

const tone = (at, dur, wave, f, gain, extra = {}) => ({ at, dur, wave, f, gain, ...extra });
const chirp = (at, a, b, dur = 0.055, gain = 0.2) => tone(at, dur, 'triangle', [a, b], gain);
const thud = (at, a, b, dur, gain) => tone(at, dur, 'sine', [a, b], gain);
const puff = (at, dur, cutoff, gain) => tone(at, dur, 'noise', [0], gain, { filter: { type: 'lowpass', f: [cutoff], q: 0.7 } });
const notes = (list, wave, dur, gain, gap) => list.map((f, i) => tone(i * gap, dur, wave, [f, f * 1.01], gain));

// Cute voices, not real animals: a real roar does not fit these characters and frightens small children.
// Each animal has several takes because one sound repeated forty times a game wears out fast.
export const VOICES = {
  pawn: [
    [chirp(0, 1900, 2700), chirp(0.085, 2100, 2900)],
    [chirp(0, 2400, 1800, 0.075)],
    [chirp(0, 1800, 2500, 0.04), chirp(0.06, 2000, 2700, 0.04), chirp(0.12, 2300, 3000, 0.05)]
  ],
  knight: [
    [tone(0, 0.14, 'sine', [260, 780], 0.3)],
    [tone(0, 0.12, 'sine', [320, 900], 0.28), tone(0.13, 0.09, 'sine', [420, 980], 0.18)],
    [tone(0, 0.17, 'sine', [220, 640], 0.32)]
  ],
  bishop: [
    [tone(0, 0.32, 'triangle', [175, 215, 150], 0.36, { filter: { type: 'lowpass', f: [720], q: 1 }, vib: { rate: 6, depth: 7 } })],
    [tone(0, 0.26, 'triangle', [205, 165], 0.34, { filter: { type: 'lowpass', f: [680], q: 1 }, vib: { rate: 7, depth: 6 } })],
    [
      tone(0, 0.2, 'triangle', [160, 190], 0.3, { filter: { type: 'lowpass', f: [700], q: 1 } }),
      tone(0.2, 0.2, 'triangle', [190, 150], 0.3, { filter: { type: 'lowpass', f: [700], q: 1 } })
    ]
  ],
  rook: [
    [thud(0, 125, 46, 0.34, 0.55), puff(0, 0.12, 260, 0.2)],
    [thud(0, 150, 54, 0.28, 0.5), puff(0, 0.1, 320, 0.2)],
    [thud(0, 110, 42, 0.4, 0.55), puff(0.02, 0.14, 220, 0.22)]
  ],
  queen: [
    [tone(0, 0.24, 'sawtooth', [520, 880, 620], 0.8, { filter: { type: 'bandpass', f: [900, 1500, 1000], q: 2.2 }, vib: { rate: 8, depth: 12 } })],
    [tone(0, 0.2, 'sawtooth', [600, 960, 720], 0.75, { filter: { type: 'bandpass', f: [1000, 1650, 1150], q: 2.2 } })],
    [tone(0, 0.3, 'sawtooth', [480, 820, 540], 0.8, { filter: { type: 'bandpass', f: [850, 1400, 900], q: 2.2 }, vib: { rate: 7, depth: 14 } })]
  ],
  king: [
    [tone(0, 0.42, 'sawtooth', [210, 340, 190], 0.3, { filter: { type: 'lowpass', f: [700, 1300, 620], q: 1.4 }, am: { rate: 27, depth: 0.45 } })],
    [
      tone(0, 0.14, 'sawtooth', [240, 300], 0.22, { filter: { type: 'lowpass', f: [900], q: 1.2 } }),
      tone(0.16, 0.34, 'sawtooth', [300, 200], 0.3, { filter: { type: 'lowpass', f: [1200, 640], q: 1.4 }, am: { rate: 25, depth: 0.4 } })
    ],
    [tone(0, 0.36, 'sawtooth', [240, 370, 220], 0.28, { filter: { type: 'lowpass', f: [760, 1400, 680], q: 1.4 }, am: { rate: 30, depth: 0.5 } })]
  ]
};

// `pace` is seconds between footsteps; null means one sound for the whole move (a leap, a roll).
export const STEPS = {
  pawn: { pace: 0.13, tones: [tone(0, 0.03, 'triangle', [1400, 900], 0.07)] },
  knight: { pace: null, tones: [tone(0, 0.22, 'sine', [180, 540, 250], 0.18, { vib: { rate: 18, depth: 26 } })] },
  bishop: { pace: null, tones: [tone(0, 0.48, 'noise', [0], 0.45, { filter: { type: 'lowpass', f: [320, 540, 300], q: 1 }, am: { rate: 9, depth: 0.7 } })] },
  rook: { pace: 0.26, tones: [thud(0, 92, 50, 0.11, 0.3), puff(0, 0.05, 240, 0.1)] },
  queen: { pace: 0.22, tones: [tone(0, 0.05, 'sine', [430, 300], 0.07)] },
  king: { pace: 0.34, tones: [tone(0, 0.09, 'triangle', [150, 92], 0.2)] }
};

export const IMPACT_SOUNDS = {
  small: [thud(0, 920, 300, 0.09, 0.42), puff(0, 0.03, 3200, 0.2)],
  medium: [thud(0, 520, 150, 0.15, 0.55), puff(0, 0.06, 2200, 0.3), chirp(0.03, 1400, 1900, 0.07, 0.1)],
  big: [
    thud(0, 150, 40, 0.5, 0.8),
    puff(0, 0.32, 1500, 0.42),
    ...notes([1320, 1760, 2349], 'triangle', 0.16, 0.1, 0.07).map((t) => ({ ...t, at: t.at + 0.08 }))
  ]
};

export const SOUNDS = {
  place: [tone(0, 0.055, 'triangle', [640, 300], 0.16), puff(0, 0.02, 1800, 0.07)],
  check: notes([988, 1319], 'triangle', 0.14, 0.2, 0.1),
  promote: notes([659, 880, 1109, 1319, 1760], 'triangle', 0.17, 0.17, 0.065),
  mate: notes([523, 659, 784, 1047, 1319, 1568], 'triangle', 0.3, 0.2, 0.1),
  lose: notes([659, 554, 440, 370], 'triangle', 0.28, 0.14, 0.16),
  draw: notes([587, 587, 659], 'triangle', 0.22, 0.13, 0.15),
  button: [tone(0, 0.03, 'sine', [1250, 900], 0.07)],
  clap: [puff(0, 0.03, 3800, 0.42), puff(0.06, 0.04, 3200, 0.36), chirp(0.1, 1500, 2100, 0.08, 0.1)]
};

/** The latest moment any tone in a recipe is still ringing. */
export function recipeLength(tones) {
  return Math.max(0, ...tones.map((t) => t.at + t.dur));
}

/** A random take, never the one just played. `last` is the index used last time, or -1. */
export function pickTake(count, last, rng = Math.random) {
  if (count <= 1) return 0;
  if (last < 0) return Math.floor(rng() * count);
  const i = Math.floor(rng() * (count - 1));
  return i >= last ? i + 1 : i;
}

/** Footstep start times for a move lasting `seconds`. */
export function stepTimes(type, seconds) {
  const pace = STEPS[type]?.pace;
  if (!pace) return [0];
  const times = [];
  for (let t = 0; t < seconds - 0.04 && times.length < 10; t += pace) times.push(Number(t.toFixed(3)));
  return times;
}

const SOUND_SETTINGS_KEY = 'wildcrown.sound.v1';

export function readMuted(storage) {
  try {
    return JSON.parse(storage.getItem(SOUND_SETTINGS_KEY) || '{}').muted === true;
  } catch (e) {
    return false;
  }
}

export function writeMuted(storage, muted) {
  try {
    storage.setItem(SOUND_SETTINGS_KEY, JSON.stringify({ muted }));
  } catch (e) {}
}
