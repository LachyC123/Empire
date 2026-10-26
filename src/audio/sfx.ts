// Small synthesized sound set (original, generated at runtime with Web Audio). Unlocked on the
// first Start/Continue gesture; suspended when the game pauses or the tab hides.

type Sfx = 'pickup' | 'place' | 'formBeat' | 'packBeat' | 'press' | 'complete' | 'coin' | 'hire' | 'upgrade' | 'build' | 'error' | 'door' | 'tap' | 'unlock' | 'deliver';

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private amb: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private recent = new Map<string, number>();
  volume = 0.7;
  ambience = 0.4;

  unlock() {
    if (this.ctx) { this.ctx.resume().catch(() => undefined); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let seed = 7;
    for (let i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 2147483647) * 2 - 1; }
    this.startRain();
  }

  setVolumes(volume: number, ambience: number) {
    this.volume = volume;
    this.ambience = ambience;
    if (this.master) this.master.gain.value = volume;
    if (this.amb) this.amb.gain.value = ambience * 0.12;
  }

  suspend() { this.ctx?.suspend().catch(() => undefined); }
  resume() { this.ctx?.resume().catch(() => undefined); }

  private startRain() {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 250;
    this.amb = c.createGain();
    this.amb.gain.value = this.ambience * 0.12;
    src.connect(lp).connect(hp).connect(this.amb).connect(this.master!);
    src.start();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slide?: number) {
    const c = this.ctx!;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private hiss(dur: number, freq: number, gain: number, when = 0, q = 1) {
    const c = this.ctx!;
    const t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  play(name: Sfx) {
    if (!this.ctx || this.ctx.state !== 'running' || this.volume <= 0) return;
    // Concurrency limit: identical sounds within 60ms collapse into one.
    const now = performance.now();
    if ((this.recent.get(name) ?? 0) > now - 60) return;
    this.recent.set(name, now);
    switch (name) {
      case 'pickup': this.tone(520, 0.07, 'triangle', 0.12, 0, 760); break;
      case 'place': this.tone(220, 0.09, 'triangle', 0.15, 0, 140); this.hiss(0.05, 1200, 0.05); break;
      case 'formBeat': this.tone(150, 0.06, 'sine', 0.12, 0, 110); this.hiss(0.03, 2400, 0.03); break;
      case 'packBeat': this.hiss(0.09, 3200, 0.07, 0, 0.7); break;
      case 'press': this.tone(95, 0.08, 'square', 0.06, 0, 70); this.hiss(0.04, 900, 0.05); break;
      case 'complete': this.tone(660, 0.09, 'triangle', 0.09); this.tone(990, 0.12, 'triangle', 0.07, 0.07); break;
      case 'coin': [784, 988, 1319].forEach((f, i) => this.tone(f, 0.12, 'square', 0.045, i * 0.06)); break;
      case 'hire': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.08, i * 0.08)); break;
      case 'upgrade': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.04, i * 0.05)); this.hiss(0.2, 5000, 0.03, 0.15); break;
      case 'build': this.tone(110, 0.18, 'sine', 0.2, 0, 60); this.hiss(0.25, 600, 0.08); [659, 880].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.06, 0.2 + i * 0.07)); break;
      case 'unlock': [262, 330, 392, 523, 659].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.08, i * 0.1)); this.hiss(0.6, 500, 0.08); break;
      case 'error': this.tone(140, 0.14, 'sawtooth', 0.05, 0, 110); break;
      case 'door': this.hiss(0.18, 700, 0.05, 0, 3); break;
      case 'deliver': this.tone(180, 0.1, 'sine', 0.16, 0, 120); this.hiss(0.12, 800, 0.06); break;
      case 'tap': this.tone(880, 0.03, 'triangle', 0.05); break;
    }
  }
}
