"use client";

type SoundName = "paper-rustle" | "guitar-pluck" | "soft-click" | "page-turn";

class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<SoundName, AudioBuffer>();
  private muted = false;
  private initialized = false;
  private volume = 0.12;
  private lastPlayedAt: Record<string, number> = {};

  private async getContext(): Promise<AudioContext | null> {
    if (typeof window === "undefined") return null;

    // Respect reduced motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return null;
    }

    if (!this.ctx) {
      this.ctx = new AudioContext();
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  /** Generate synthetic sounds — no external files needed */
  private async generateSound(name: SoundName): Promise<AudioBuffer | null> {
    const ctx = await this.getContext();
    if (!ctx) return null;

    const sampleRate = ctx.sampleRate;

    switch (name) {
      case "paper-rustle": {
        const duration = 0.15;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          // Filtered noise with fade
          const noise = (Math.random() * 2 - 1) * 0.3;
          const env = Math.sin(Math.PI * t / duration);
          // Simple low-pass via averaging
          data[i] = noise * env * 0.5;
          if (i > 0) data[i] = data[i] * 0.3 + data[i - 1] * 0.7;
        }
        return buffer;
      }

      case "guitar-pluck": {
        const duration = 0.3;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        const freq = 330; // E4
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 8);
          // Plucked string: fundamental + harmonics with decay
          data[i] =
            (Math.sin(2 * Math.PI * freq * t) * 0.5 +
              Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
              Math.sin(2 * Math.PI * freq * 3 * t) * 0.12) *
            env *
            0.4;
        }
        return buffer;
      }

      case "soft-click": {
        const duration = 0.05;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const env = Math.exp(-t * 60);
          data[i] = Math.sin(2 * Math.PI * 800 * t) * env * 0.3;
        }
        return buffer;
      }

      case "page-turn": {
        const duration = 0.25;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * 0.2;
          // Swoosh envelope
          const env = Math.sin(Math.PI * t / duration) * Math.exp(-t * 4);
          data[i] = noise * env * 0.6;
          if (i > 0) data[i] = data[i] * 0.4 + data[i - 1] * 0.6;
        }
        return buffer;
      }

      default:
        return null;
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const sounds: SoundName[] = ["paper-rustle", "guitar-pluck", "soft-click", "page-turn"];

    for (const name of sounds) {
      const buffer = await this.generateSound(name);
      if (buffer) {
        this.buffers.set(name, buffer);
      }
    }

    this.initialized = true;
  }

  async play(name: SoundName): Promise<void> {
    if (this.muted) return;

    try {
      const ctx = await this.getContext();
      if (!ctx) return;

      if (!this.initialized) {
        await this.init();
      }

      const buffer = this.buffers.get(name);
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = this.volume;

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {
      // Audio is a "nice to have" — swallow failures (no audio context,
      // mute toggled mid-play, autoplay policy blocks, etc).
    }
  }

  /**
   * Like `play`, but skips the call if the same sound played within the
   * last `minIntervalMs` (default 4s). Use this for high-frequency
   * triggers like polaroid hovers so the page doesn't become a maraca.
   */
  playThrottled(name: SoundName, minIntervalMs: number = 4000): void {
    const now = performance.now();
    if (now - (this.lastPlayedAt[name] ?? 0) < minIntervalMs) return;
    this.lastPlayedAt[name] = now;
    void this.play(name);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }
}

// Singleton
export const audioManager = new AudioManager();
