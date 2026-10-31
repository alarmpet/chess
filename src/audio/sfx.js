// Plays the recipes through Web Audio. Browsers keep audio locked until the first tap or key, and sounds asked for
// before that are dropped rather than queued, so nothing bursts out at once when the player first touches the page.
import { IMPACT_SOUNDS, SOUNDS, STEPS, VOICES, pickTake, readMuted, stepTimes, writeMuted } from './recipes.js';

const MASTER_GAIN = 0.55;
const PITCH_SPREAD = 0.06;
const MOVE_VOICE_CHANCE = 0.22;

function noiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function sweep(param, values, start, dur) {
  param.setValueAtTime(values[0], start);
  values.slice(1).forEach((v, i) => param.exponentialRampToValueAtTime(v, start + (dur * (i + 1)) / (values.length - 1)));
}

/** Schedules one recipe on any audio context, so a recipe can also be rendered offline and measured. */
export function renderRecipe(ctx, dest, tones, start, pitch = 1, noise = noiseBuffer(ctx)) {
  for (const t of tones) {
    const at = start + t.at;
    const end = at + t.dur;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, at);
    amp.gain.exponentialRampToValueAtTime(t.gain, at + Math.min(0.006, t.dur / 3));
    amp.gain.exponentialRampToValueAtTime(0.0008, end);

    let src;
    if (t.wave === 'noise') {
      src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
    } else {
      src = ctx.createOscillator();
      src.type = t.wave;
      sweep(src.frequency, t.f.map((f) => f * pitch), at, t.dur);
    }

    let tail = src;
    if (t.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = t.filter.type;
      filter.Q.value = t.filter.q;
      sweep(filter.frequency, t.filter.f, at, t.dur);
      tail.connect(filter);
      tail = filter;
    }
    tail.connect(amp);

    const lfos = [];
    if (t.vib && src.frequency) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = t.vib.rate;
      depth.gain.value = t.vib.depth;
      lfo.connect(depth).connect(src.frequency);
      lfos.push(lfo);
    }
    if (t.am) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      const wobble = ctx.createGain();
      lfo.frequency.value = t.am.rate;
      depth.gain.value = t.am.depth / 2;
      wobble.gain.value = 1 - t.am.depth / 2;
      amp.connect(wobble).connect(dest);
      lfo.connect(depth).connect(wobble.gain);
      lfos.push(lfo);
    } else {
      amp.connect(dest);
    }
    for (const n of [src, ...lfos]) {
      n.start(at);
      n.stop(end + 0.02);
    }
  }
}

function createSfx() {
  const storage = typeof window === 'undefined' ? null : window.localStorage;
  let muted = storage ? readMuted(storage) : false;
  let ctx = null;
  let master = null;
  let noise = null;
  let played = 0;
  const lastTake = {};
  const recent = [];
  const note = (name) => {
    recent.push(name);
    if (recent.length > 24) recent.shift();
  };

  function unlock() {
    if (!ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      ctx = new Ctx();
      noise = noiseBuffer(ctx);
      master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      // Several sounds land together on a capture; the limiter keeps them from clipping.
      const limiter = ctx.createDynamicsCompressor();
      master.connect(limiter).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function schedule(tones, delay = 0, pitch = 1) {
    if (muted || !ctx || ctx.state !== 'running') return false;
    renderRecipe(ctx, master, tones, ctx.currentTime + delay, pitch, noise);
    played += 1;
    return true;
  }

  const wobble = () => 1 + (Math.random() * 2 - 1) * PITCH_SPREAD;

  function voice(type, delay = 0) {
    const takes = VOICES[type];
    if (!takes) return false;
    const take = pickTake(takes.length, lastTake[type] ?? -1);
    lastTake[type] = take;
    return schedule(takes[take], delay, wobble());
  }

  function move(type, seconds) {
    const step = STEPS[type];
    if (!step) return;
    const pitch = wobble();
    for (const at of stepTimes(type, seconds)) schedule(step.tones, at, pitch);
    if (Math.random() < MOVE_VOICE_CHANCE) voice(type, seconds * 0.5);
  }

  function impact(tierId, attackerType) {
    note(`impact.${tierId}`);
    schedule(IMPACT_SOUNDS[tierId] || IMPACT_SOUNDS.small, 0, wobble());
    voice(attackerType, 0.03);
  }

  function play(name, delay = 0) {
    note(name);
    return schedule(SOUNDS[name] || [], delay);
  }

  function setMuted(next) {
    muted = next;
    if (storage) writeMuted(storage, next);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    document.addEventListener('click', (e) => {
      if (e.target?.closest?.('.hud-btn, .checkmate-btn')) play('button');
    }, { capture: true });
  }

  return { voice, move, impact, play, setMuted, isMuted: () => muted, playedCount: () => played, recent: () => [...recent], state: () => ctx?.state || 'locked' };
}

export const sfx = createSfx();
