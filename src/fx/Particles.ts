interface Particle {
  x: number; y: number;
  r: number; vx: number; vy: number;
  alpha: number;
}

export function initParticles(): void {
  const canvas = document.getElementById('bg-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W = 0, H = 0;
  let particles: Particle[] = [];

  function resize(): void {
    W = canvas!.width  = window.innerWidth;
    H = canvas!.height = window.innerHeight;
  }

  function initP(): void {
    particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
    }));
  }

  function draw(): void {
    ctx!.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(201,168,76,${p.alpha})`;
      ctx!.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
    }
    requestAnimationFrame(draw);
  }

  resize();
  initP();
  draw();
  window.addEventListener('resize', () => { resize(); initP(); });
}
