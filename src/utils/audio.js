// Web Audio API Synthesizer for Hand Cricket Game Engine

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playUiClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }

  // Play distinctly DIFFERENT sounds for each number 0 through 6!
  playNumberSound(num) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    try {
      switch (num) {
        case 0: {
          // Dot ball: Low muted thud
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }

        case 1: {
          // Single run: Crisp wooden tick (400 Hz)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        }

        case 2: {
          // Two runs: Double rapid wooden click
          [0, 0.07].forEach((delay) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now + delay);
            osc.frequency.exponentialRampToValueAtTime(260, now + delay + 0.07);

            gain.gain.setValueAtTime(0.28, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.07);
          });
          break;
        }

        case 3: {
          // Three runs: Triple ascending wood tap (450 -> 600 -> 750 Hz)
          [0, 0.06, 0.12].forEach((delay, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450 + idx * 150, now + delay);
            osc.frequency.exponentialRampToValueAtTime(300, now + delay + 0.06);

            gain.gain.setValueAtTime(0.25, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.06);
          });
          break;
        }

        case 4: {
          // Four runs: FOUR BOUNDARY CRACK! Bright square burst + rising sweep
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'square';
          osc1.frequency.setValueAtTime(600, now);
          osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.18);

          gain1.gain.setValueAtTime(0.3, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

          osc1.connect(gain1);
          gain1.connect(this.ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.18);

          setTimeout(() => this.playCrowdCheer(false), 50);
          break;
        }

        case 5: {
          // Five runs: Bright ascending chord (C5 - E5 - G5)
          [523.25, 659.25, 783.99].forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.22);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
          });
          break;
        }

        case 6: {
          // SIX RUNS MAXIMUM: Massive stadium explosion + high triumph chord!
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C major chord with high C6
          notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.03);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + idx * 0.03 + 0.35);

            gain.gain.setValueAtTime(0.35, now + idx * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.03);
            osc.stop(now + idx * 0.03 + 0.35);
          });

          setTimeout(() => this.playCrowdCheer(true), 60);
          break;
        }

        default:
          this.playUiClick();
      }
    } catch {}
  }

  playWicketSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Stumps shattered sound - noise burst + sharp metal clang
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(220, now);
      bass.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      bassGain.gain.setValueAtTime(0.45, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      bass.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      noise.start(now);
      bass.start(now);
      bass.stop(now + 0.3);
    } catch {}
  }

  // GRAND MATCH VICTORY FANFARE!
  playMatchVictorySound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Triad Victory fanfare: C5 -> E5 -> G5 -> C6 (high triumphant fanfare)
      const sequence = [
        { freq: 523.25, time: 0, duration: 0.18 }, // C5
        { freq: 659.25, time: 0.16, duration: 0.18 }, // E5
        { freq: 783.99, time: 0.32, duration: 0.22 }, // G5
        { freq: 1046.5, time: 0.52, duration: 0.6 }, // C6 high hold!
      ];

      sequence.forEach(({ freq, time, duration }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.35, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });

      // Crowd cheer layer
      setTimeout(() => this.playCrowdCheer(true), 250);
    } catch {}
  }

  // MATCH DEFEAT SOUND DROP!
  playMatchDefeatSound() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Descending sad tones: F4 -> Eb4 -> D4 -> C4
      const sequence = [
        { freq: 349.23, time: 0, duration: 0.25 },
        { freq: 311.13, time: 0.22, duration: 0.25 },
        { freq: 293.66, time: 0.44, duration: 0.25 },
        { freq: 261.63, time: 0.66, duration: 0.5 },
      ];

      sequence.forEach(({ freq, time, duration }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + time + duration);

        gain.gain.setValueAtTime(0.25, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    } catch {}
  }

  playCrowdCheer(isBig = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = isBig ? 0.7 : 0.45;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const crowd = this.ctx.createBufferSource();
      crowd.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + duration * 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(isBig ? 0.3 : 0.18, now + duration * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      crowd.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      crowd.start(now);
    } catch {}
  }

  playCoinFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(2800, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
