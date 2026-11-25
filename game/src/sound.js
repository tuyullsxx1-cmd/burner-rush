// Burner Rush — all sound is synthesized in code (WebAudio oscillators), so the
// game ships no audio files and never touches the network.
let context = null;
let muted = false;

function audio() {
  if (muted) return null;
  try {
    if (!context) context = new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') void context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(frequency, duration, type, volume, when = 0) {
  const ctx = audio();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime + when);
  oscillator.stop(ctx.currentTime + when + duration + 0.02);
}

export const sound = {
  pickup() { tone(520, 0.07, 'triangle', 0.12); },
  chop() { tone(180, 0.05, 'square', 0.08); tone(240, 0.05, 'square', 0.06, 0.06); },
  chopDone() { tone(660, 0.09, 'triangle', 0.12); tone(880, 0.12, 'triangle', 0.1, 0.07); },
  cookDone() { tone(740, 0.1, 'sine', 0.14); tone(988, 0.14, 'sine', 0.12, 0.08); },
  burnt() { tone(220, 0.2, 'sawtooth', 0.1); tone(165, 0.25, 'sawtooth', 0.1, 0.12); },
  served() {
    tone(523, 0.1, 'triangle', 0.14);
    tone(659, 0.1, 'triangle', 0.14, 0.08);
    tone(784, 0.16, 'triangle', 0.14, 0.16);
  },
  failed() { tone(311, 0.18, 'sawtooth', 0.1); tone(233, 0.25, 'sawtooth', 0.1, 0.1); },
  tick() { tone(980, 0.05, 'square', 0.05); },
  toggleMute() { muted = !muted; return muted; },
};
