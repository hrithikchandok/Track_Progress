import { useEffect, useRef } from 'react';

const G = 46;
const rnd = (a, b) => Math.random() * (b - a) + a;
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));

// ── Hover glow: tiles near cursor light up ────
function startGlow(canvas, ctx, bus) {
  const mouse = { x: -9999, y: -9999 };
  let raf;

  const onMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
  window.addEventListener('mousemove', onMove);

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { x, y } = mouse;
    const R = 160;

    const c0 = Math.floor((x - R) / G) - 1;
    const c1 = Math.ceil((x + R) / G) + 1;
    const r0 = Math.floor((y - R) / G) - 1;
    const r1 = Math.ceil((y + R) / G) + 1;

    for (let c = c0; c <= c1; c++) {
      for (let r = r0; r <= r1; r++) {
        const d = Math.hypot(c * G + G / 2 - x, r * G + G / 2 - y);
        if (d >= R) continue;
        const t = 1 - d / R;
        ctx.fillStyle = `rgba(245,181,68,${t * t * 0.22})`;
        ctx.fillRect(c * G, r * G, G - 1, G - 1);
      }
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  bus.push(() => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); });
}

// ── Shimmer: tiles pulse softly at random ─────
function startShimmer(canvas, ctx, bus) {
  const N = 22;
  let raf, prev = 0;

  const cols = () => Math.ceil(canvas.width / G) + 1;
  const rows = () => Math.ceil(canvas.height / G) + 1;

  const cells = Array.from({ length: N }, () => ({
    c: rndInt(0, cols()),
    r: rndInt(0, rows()),
    phase: rnd(0, Math.PI * 2),
    freq: rnd(0.25, 0.7),
    amp: rnd(0.06, 0.18),
  }));

  function frame(ts) {
    const dt = prev ? (ts - prev) / 1000 : 0;
    prev = ts;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const s of cells) {
      s.phase += s.freq * dt * Math.PI * 2;
      const a = (Math.sin(s.phase) * 0.5 + 0.5) * s.amp;
      ctx.fillStyle = `rgba(245,181,68,${a})`;
      ctx.fillRect(s.c * G, s.r * G, G - 1, G - 1);
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  bus.push(() => cancelAnimationFrame(raf));
}

// ── Rain: amber drops cascade down columns ────
function startRain(canvas, ctx, bus) {
  let raf, lastDrop = 0;
  const drops = [];

  function addDrop(now) {
    const cols = Math.ceil(canvas.width / G) + 1;
    const rows = Math.ceil(canvas.height / G) + 1;
    const len = rndInt(5, 13);
    const startRow = rndInt(0, rows - len - 1);
    drops.push({
      col: rndInt(0, cols - 1),
      cells: Array.from({ length: len }, (_, i) => ({ row: startRow + i, t0: now + i * 60 })),
    });
  }

  function frame(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (ts - lastDrop > 500) {
      addDrop(ts);
      if (Math.random() < 0.4) addDrop(ts);
      lastDrop = ts;
    }

    for (let di = drops.length - 1; di >= 0; di--) {
      const drop = drops[di];
      let alive = false;

      drop.cells.forEach((cell, i) => {
        const el = ts - cell.t0;
        if (el < 0) { alive = true; return; }
        const D = 700;
        if (el >= D) return;
        alive = true;

        const t = el / D;
        let a = t < 0.2 ? t / 0.2 : t < 0.55 ? 1 : (1 - t) / 0.45;
        a *= (i === drop.cells.length - 1) ? 0.3 : 0.14;

        ctx.fillStyle = `rgba(245,181,68,${a})`;
        ctx.fillRect(drop.col * G, cell.row * G, G - 1, G - 1);
      });

      if (!alive) drops.splice(di, 1);
    }
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  bus.push(() => cancelAnimationFrame(raf));
}

// ── Ripple: click spawns expanding ring ───────
function startRipple(canvas, ctx, bus) {
  const rings = [];
  let raf;

  const onClick = e => {
    rings.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
  };
  window.addEventListener('click', onClick);

  // also shimmer passively
  const N = 10;
  let prev = 0;
  const cells = Array.from({ length: N }, () => ({
    c: rndInt(0, Math.ceil(canvas.width / G)),
    r: rndInt(0, Math.ceil(canvas.height / G)),
    phase: rnd(0, Math.PI * 2),
    freq: rnd(0.2, 0.5),
    amp: rnd(0.04, 0.1),
  }));

  function frame(ts) {
    const dt = prev ? (ts - prev) / 1000 : 0;
    prev = ts;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // passive shimmer
    for (const s of cells) {
      s.phase += s.freq * dt * Math.PI * 2;
      const a = (Math.sin(s.phase) * 0.5 + 0.5) * s.amp;
      ctx.fillStyle = `rgba(245,181,68,${a})`;
      ctx.fillRect(s.c * G, s.r * G, G - 1, G - 1);
    }

    // ripple rings
    for (let i = rings.length - 1; i >= 0; i--) {
      const ring = rings[i];
      const el = ts - ring.t0;
      const D = 1200;
      if (el > D) { rings.splice(i, 1); continue; }

      const R = (el / D) * Math.max(canvas.width, canvas.height) * 0.7;
      const fade = 1 - el / D;
      const thick = G * 1.5;

      const c0 = Math.floor((ring.x - R - thick) / G) - 1;
      const c1 = Math.ceil((ring.x + R + thick) / G) + 1;
      const r0 = Math.floor((ring.y - R - thick) / G) - 1;
      const r1 = Math.ceil((ring.y + R + thick) / G) + 1;

      for (let c = c0; c <= c1; c++) {
        for (let r = r0; r <= r1; r++) {
          const d = Math.hypot(c * G + G / 2 - ring.x, r * G + G / 2 - ring.y);
          const dist = Math.abs(d - R);
          if (dist > thick) continue;
          const t = 1 - dist / thick;
          ctx.fillStyle = `rgba(245,181,68,${t * fade * 0.25})`;
          ctx.fillRect(c * G, r * G, G - 1, G - 1);
        }
      }
    }

    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);
  bus.push(() => { window.removeEventListener('click', onClick); cancelAnimationFrame(raf); });
}

const RUNNERS = { glow: startGlow, shimmer: startShimmer, rain: startRain, ripple: startRipple };

export default function BackgroundCanvas({ mode }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || mode === 'off') return;

    const ctx = canvas.getContext('2d');
    const bus = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    bus.push(() => window.removeEventListener('resize', resize));

    RUNNERS[mode]?.(canvas, ctx, bus);

    return () => {
      bus.forEach(f => f());
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [mode]);

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: -1 }}
    />
  );
}
