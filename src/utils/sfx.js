// Plays the F1 car sound on task completion.
//
// Primary source: a real audio file at /f1.mp3 (drop your download into the
// project's `public/` folder as `f1.mp3`). If that file is missing or fails to
// load, we fall back to a synthesized "car speeding past" sound so the feature
// never breaks.

const SOUND_URL = '/f1.mp3';

let ctx;
let noiseBuf;
let bufferPromise; // resolves to a decoded AudioBuffer, or null if no file

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Fetch + decode the real file once; cache the promise so repeats are instant.
function getFileBuffer(ac) {
  if (!bufferPromise) {
    bufferPromise = fetch(SOUND_URL)
      .then(res => { if (!res.ok) throw new Error('no file'); return res.arrayBuffer(); })
      .then(arr => ac.decodeAudioData(arr))
      .catch(() => null);
  }
  return bufferPromise;
}

export function playF1Rev() {
  const ac = audioCtx();
  if (!ac) return;
  getFileBuffer(ac).then(buf => {
    if (buf) {
      const now = ac.currentTime;
      const playDur = Math.min(5, buf.duration); // cap at 5 seconds
      const src = ac.createBufferSource();
      src.buffer = buf;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.85, now);
      g.gain.setValueAtTime(0.85, now + Math.max(0, playDur - 0.35));
      g.gain.linearRampToValueAtTime(0.0001, now + playDur); // fade out to avoid a click
      src.connect(g);
      g.connect(ac.destination);
      src.start(now);
      src.stop(now + playDur);
    } else {
      playSynth(ac); // file not present — use the generated fallback
    }
  });
}

// ── Synthesized fallback: a roaring car speeding past (Doppler) ──────────────
function gritCurve(amount = 24) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 0.5) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function noiseBuffer(ac) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function playSynth(ac) {
  try {
    const now = ac.currentTime;
    const dur = 1.3;
    const peak = now + dur * 0.42;

    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.42, peak);
    master.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    master.connect(ac.destination);

    const shaper = ac.createWaveShaper();
    shaper.curve = gritCurve();
    shaper.oversample = '4x';
    shaper.connect(master);

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(400, now);
    lp.frequency.exponentialRampToValueAtTime(7000, peak);
    lp.frequency.exponentialRampToValueAtTime(2200, now + dur);
    lp.connect(shaper);

    [48, 72, 96, 144].forEach((base, i) => {
      const osc = ac.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(base, now);
      osc.frequency.exponentialRampToValueAtTime(base * 4.2, peak);
      osc.frequency.exponentialRampToValueAtTime(base * 1.6, now + dur);
      const g = ac.createGain();
      g.gain.value = 0.6 / (i + 1);
      osc.connect(g);
      g.connect(lp);
      osc.start(now);
      osc.stop(now + dur);
    });

    const noise = ac.createBufferSource();
    noise.buffer = noiseBuffer(ac);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(500, now);
    bp.frequency.exponentialRampToValueAtTime(4500, peak);
    bp.frequency.exponentialRampToValueAtTime(700, now + dur);
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.exponentialRampToValueAtTime(0.3, peak);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(master);
    noise.start(now);
    noise.stop(now + dur);
  } catch (_) { /* audio not available — fail silently */ }
}
