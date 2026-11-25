// Ember & Oak — Rush Hour Kitchen: all sound is synthesized with WebAudio.
// No audio files are shipped; every effect is a short oscillator burst.

export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, gain = 0.1) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const amp = ctx.createGain();
    amp.gain.value = gain;
    src.buffer = buffer;
    src.connect(amp).connect(ctx.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    pickup() { tone(520, 0.07, 'triangle', 0.08); },
    place() { tone(340, 0.08, 'triangle', 0.08); },
    chop() { noise(0.09, 0.16); tone(180, 0.05, 'square', 0.05); },
    chopDone() { tone(660, 0.1, 'triangle', 0.1); tone(880, 0.12, 'triangle', 0.08, 0.08); },
    sizzle() { noise(0.25, 0.05); },
    cookDone() { tone(740, 0.12, 'sine', 0.1); tone(988, 0.16, 'sine', 0.1, 0.1); },
    burn() { tone(220, 0.25, 'sawtooth', 0.08); tone(160, 0.3, 'sawtooth', 0.08, 0.12); },
    plate() { tone(440, 0.08, 'triangle', 0.09); tone(587, 0.1, 'triangle', 0.09, 0.06); },
    serve() {
      tone(523, 0.1, 'sine', 0.12); tone(659, 0.1, 'sine', 0.12, 0.08);
      tone(784, 0.14, 'sine', 0.12, 0.16); tone(1047, 0.2, 'sine', 0.12, 0.24);
    },
    coin() { tone(988, 0.09, 'square', 0.06); tone(1319, 0.16, 'square', 0.06, 0.07); },
    fail() { tone(311, 0.2, 'triangle', 0.1); tone(233, 0.32, 'triangle', 0.1, 0.14); },
    tick() { tone(880, 0.05, 'square', 0.05); },
    win() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.12));
    },
  };
}
