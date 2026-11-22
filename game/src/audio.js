// WebAudio synth: no audio assets, every sound is an oscillator/noise recipe.
// Engine hum follows car speed, sirens wail when police are near, shots and hits are noise bursts.
export function createAudio() {
  let ctx = null; let master = null; let engineOsc = null; let engineGain = null; let sirenOsc = null; let sirenGain = null;
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
      engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 55;
      engineGain = ctx.createGain(); engineGain.gain.value = 0; engineOsc.connect(engineGain); engineGain.connect(master); engineOsc.start();
      sirenOsc = ctx.createOscillator(); sirenOsc.type = 'triangle'; sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain(); sirenGain.gain.value = 0; sirenOsc.connect(sirenGain); sirenGain.connect(master); sirenOsc.start();
    } catch { return false; }
    return true;
  }
  function blip(freq, dur, type, vol, slideTo) {
    if (!ensure()) return;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
  }
  function noise(dur, vol, freq) {
    if (!ensure()) return;
    const len = Math.floor(ctx.sampleRate * dur); const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1800;
    const g = ctx.createGain(); g.gain.value = vol || 0.3;
    src.connect(f); f.connect(g); g.connect(master); src.start();
  }
  return {
    unlock() { ensure(); },
    shot() { noise(0.12, 0.35, 2600); blip(160, 0.08, 'square', 0.12, 60); },
    punch() { noise(0.07, 0.25, 700); },
    hit() { blip(110, 0.16, 'sawtooth', 0.25, 55); },
    cash() { blip(880, 0.09, 'sine', 0.2); setTimeout(() => blip(1320, 0.14, 'sine', 0.2), 70); },
    mission() { blip(523, 0.12, 'sine', 0.22); setTimeout(() => blip(659, 0.12, 'sine', 0.22), 110); setTimeout(() => blip(784, 0.22, 'sine', 0.24), 220); },
    fail() { blip(300, 0.3, 'sawtooth', 0.2, 120); },
    door() { blip(220, 0.07, 'square', 0.12, 180); },
    sirenLevel(v) { if (!ctx) return; sirenGain.gain.value = Math.min(0.05, v * 0.05); if (v > 0) sirenOsc.frequency.value = 650 + Math.sin(performance.now() / 280) * 180; },
    engine(speedRatio, inCar) { if (!ctx) return; engineGain.gain.value = inCar ? 0.03 + speedRatio * 0.06 : 0; engineOsc.frequency.value = 50 + speedRatio * 130; },
  };
}
