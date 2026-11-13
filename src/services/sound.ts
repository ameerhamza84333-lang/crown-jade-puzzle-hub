/**
 * Lightweight, zero-asset Web Audio synth hooks gated strictly by `isSoundEnabled`.
 * Uses zero external audio files so the app stays offline-ready and lightweight.
 */

class SoundService {
  private enabled = true;
  private ctx: AudioContext | null = null;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0,
    endFreq?: number,
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    } catch {
      // Safe no-op if audio is blocked
    }
  }

  playTap() {
    this.tone(420, 0.045, 'triangle', 0.05, 0, 520);
  }

  playPickup() {
    this.tone(330, 0.05, 'sine', 0.055, 0, 440);
  }

  playPlace() {
    this.tone(240, 0.07, 'triangle', 0.075, 0, 180);
  }

  playClear(combo = 1) {
    const base = 440 + Math.min(combo, 6) * 55;
    this.tone(base, 0.11, 'triangle', 0.08, 0);
    this.tone(base * 1.25, 0.14, 'sine', 0.07, 0.05);
    if (combo > 1) {
      this.tone(base * 1.5, 0.18, 'sine', 0.07, 0.1);
    }
  }

  playTileSelect() {
    this.tone(540, 0.055, 'sine', 0.055, 0, 620);
  }

  playTileMatch() {
    this.tone(523.25, 0.09, 'sine', 0.07, 0);
    this.tone(659.25, 0.12, 'sine', 0.07, 0.055);
  }

  playInvalid() {
    this.tone(175, 0.09, 'sawtooth', 0.045, 0, 140);
  }

  playBooster() {
    this.tone(440, 0.08, 'triangle', 0.06, 0);
    this.tone(587.33, 0.11, 'triangle', 0.06, 0.06);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this.tone(n, 0.18, 'triangle', 0.075, idx * 0.085));
  }

  playGameOver() {
    this.tone(320, 0.14, 'triangle', 0.07, 0, 260);
    this.tone(240, 0.22, 'triangle', 0.07, 0.13, 170);
  }
}

export const SoundFX = new SoundService();
