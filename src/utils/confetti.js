// Confetti celebration — two corner poppers (bottom-left + bottom-right) that
// fire a burst of paper ribbons and dots up and inward, then flutter down under
// gravity. Tuned to the site's editorial palette (emerald with a warm accent).
// No dependencies; one shared full-screen canvas reused across bursts.

const COLORS = ['#157A57', '#0F8A5F', '#5FD3A3', '#19a06a', '#A7E8C8', '#C2740E'];
const PER_CORNER = 80;
const TERMINAL_VY = 7;

let canvas = null;
let ctx = null;
let particles = [];
let raf = null;

function resize() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function spawn() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const popper = (originX, dir) => {
    for (let i = 0; i < PER_CORNER; i++) {
      const r = Math.random();
      // Aim up (-90°) with a wide inward spread toward screen centre.
      const angle = -Math.PI / 2 + dir * (Math.random() * 0.7 + 0.1);
      const speed = 11 + Math.random() * 11;
      const ribbon = r < 0.7;
      particles.push({
        x: originX + dir * Math.random() * 12,
        y: H + 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: ribbon ? 4 + Math.random() * 4 : 5 + Math.random() * 5,
        h: ribbon ? 9 + Math.random() * 7 : 0, // 0 → drawn as a dot
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.06,
        drift: 0.4 + Math.random() * 0.9,
        gravity: 0.16 + Math.random() * 0.08,
        life: 1,
        decay: 0.005 + Math.random() * 0.004,
      });
    }
  };
  popper(0, 1);   // bottom-left → fling right
  popper(W, -1);  // bottom-right → fling left
}

function tick() {
  const H = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.vy = Math.min(TERMINAL_VY, p.vy + p.gravity);
    p.vx *= 0.985;
    p.wobble += p.wobbleSpeed;
    p.x += p.vx + Math.sin(p.wobble) * p.drift;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= p.decay;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    if (p.h === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.rotate(p.rot);
      // Sine on wobble fakes the ribbon tumbling edge-on.
      ctx.scale(1, Math.abs(Math.cos(p.wobble)) * 0.7 + 0.3);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }
  particles = particles.filter(p => p.life > 0 && p.y < H + 40);
  if (particles.length) {
    raf = requestAnimationFrame(tick);
  } else {
    cancelAnimationFrame(raf);
    raf = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

export function fireConfetti() {
  ensureCanvas();
  spawn();
  if (!raf) raf = requestAnimationFrame(tick);
}
