/**
 * ballstormAudio.ts — Dopamine WebAudio Synthesizer
 *
 * Implements:
 *  - Pentatonic arpeggio pitch ladder for consecutive combo merges (Peggle/Breakout REA)
 *  - Sub-bass boom on high-tier merges and Cue Ball synthesis
 *  - Laser drop whoosh & bounce tick
 *  - Slot machine jackpot chime for Roguelike Card upgrades
 *  - Urgent pulse alarm on Danger line breach
 */

class BallStormAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.35;

  // C Major Pentatonic Scale (Hz): C4 -> C6
  private pentatonicScale: number[] = [
    261.63, 293.66, 329.63, 392.00, 440.00,
    523.25, 587.33, 659.25, 783.99, 880.00,
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00
  ];

  constructor() {
    // Lazy init audio context on first user gesture
  }

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Sound played when ball is dropped from launcher
   */
  public playDrop(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Sound played on standard ball bounce
   */
  public playBounce(speedRatio: number = 0.5): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 160 + Math.min(speedRatio, 1.5) * 120;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, t + 0.05);

    const vol = Math.min(this.volume * 0.4, this.volume * speedRatio * 0.5);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Dopamine crescendo merge sound!
   * Pitch climbs up the pentatonic ladder with combo count
   */
  public playMerge(tier: number, comboCount: number = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const scaleIdx = Math.min(this.pentatonicScale.length - 1, (tier - 1) + comboCount);
    const freq = this.pentatonicScale[scaleIdx];

    // 1. Bright melodic chime (Square / Triangle blend)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = tier >= 8 ? 'sine' : 'triangle';
    osc1.frequency.setValueAtTime(freq, t);
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.22);

    gain1.gain.setValueAtTime(this.volume * 0.7, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.28);

    // 2. Sub-bass thump for satisfying tactile punch
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFreq = Math.max(45, 120 - tier * 4);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(subFreq, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.18);

    subGain.gain.setValueAtTime(this.volume * 0.85, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.18);

    // 3. For Tier 16 Supreme Cue Ball: majestic celebratory chord
    if (tier === 16) {
      [1.0, 1.25, 1.5, 2.0].forEach((ratio, i) => {
        const chordOsc = ctx.createOscillator();
        const chordGain = ctx.createGain();
        chordOsc.type = 'triangle';
        chordOsc.frequency.setValueAtTime(523.25 * ratio, t + i * 0.06);
        chordGain.gain.setValueAtTime(this.volume * 0.5, t + i * 0.06);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        chordOsc.connect(chordGain);
        chordGain.connect(ctx.destination);
        chordOsc.start(t + i * 0.06);
        chordOsc.stop(t + 1.2);
      });
    }
  }

  /**
   * Slot machine style arpeggio fanfare for Roguelike Card Selection
   */
  public playSlotFanfare(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t + idx * 0.08;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(this.volume * 0.35, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });
  }

  /**
   * Sound when card is chosen
   */
  public playCardSelect(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Danger warning alarm beep
   */
  public playDangerWarning(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(480, t + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Game Over Sound
   */
  public playGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.6);

    gain.gain.setValueAtTime(this.volume * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }
}

export const ballStormAudio = new BallStormAudio();
