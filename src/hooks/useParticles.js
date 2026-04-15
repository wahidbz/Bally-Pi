// ============================================================
// PARTICLE SYSTEM HOOK — Canvas-based
// Merge explosions, sparks, confetti, floating dust
// ============================================================
import { useRef, useCallback, useEffect } from 'react';

const TAU = Math.PI * 2;

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function useParticles(canvasRef) {
  const particlesRef = useRef([]);
  const animRef      = useRef(null);
  const activeRef    = useRef(true);

  // ---- Particle types ----

  // Spark particle
  function mkSpark(x, y, color) {
    const angle = randomRange(0, TAU);
    const speed = randomRange(2, 8);
    return {
      type: 'spark', x, y, color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, decay: randomRange(0.03, 0.07),
      size: randomRange(2, 5),
    };
  }

  // Ring particle (expanding circle)
  function mkRing(x, y, color) {
    return {
      type: 'ring', x, y, color,
      radius: 5, maxRadius: randomRange(50, 120),
      life: 1, decay: 0.03,
    };
  }

  // Confetti particle
  function mkConfetti(x, y) {
    const colors = ['#ff006e','#00f5ff','#ffd700','#00ff88','#ff4500','#8b00ff'];
    return {
      type: 'confetti',
      x, y,
      color: colors[randomInt(0, colors.length - 1)],
      vx: randomRange(-6, 6),
      vy: randomRange(-12, -4),
      rotation: randomRange(0, TAU),
      rotSpeed: randomRange(-0.3, 0.3),
      width: randomRange(6, 14),
      height: randomRange(3, 7),
      life: 1, decay: randomRange(0.015, 0.03),
      gravity: 0.3,
    };
  }

  // Star burst
  function mkStar(x, y, color) {
    const angle = randomRange(0, TAU);
    const speed = randomRange(3, 10);
    return {
      type: 'star', x, y, color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, decay: randomRange(0.025, 0.05),
      size: randomRange(3, 8),
      rotation: randomRange(0, TAU),
      rotSpeed: randomRange(-0.2, 0.2),
    };
  }

  // Floating dust (background ambiance)
  function mkDust(canvasW, canvasH) {
    return {
      type: 'dust',
      x: randomRange(0, canvasW),
      y: randomRange(canvasH * 0.2, canvasH),
      vx: randomRange(-0.3, 0.3),
      vy: randomRange(-0.8, -0.2),
      size: randomRange(1, 3),
      life: randomRange(0.4, 1),
      decay: randomRange(0.002, 0.006),
      color: `hsla(${randomInt(200, 300)},80%,70%,`,
    };
  }

  // ---- Spawn functions ----

  const spawnMerge = useCallback((x, y, level, color) => {
    const count = 8 + level * 3;
    for (let i = 0; i < count; i++) particlesRef.current.push(mkSpark(x, y, color));
    particlesRef.current.push(mkRing(x, y, color));
    particlesRef.current.push(mkRing(x, y, color));
    if (level >= 4) {
      const stars = 6 + level * 2;
      for (let i = 0; i < stars; i++) particlesRef.current.push(mkStar(x, y, color));
    }
    if (level >= 6) {
      for (let i = 0; i < 25; i++) particlesRef.current.push(mkConfetti(x, y));
    }
  }, []);

  const spawnBounce = useCallback((x, y, color) => {
    for (let i = 0; i < 4; i++) particlesRef.current.push(mkSpark(x, y, color));
  }, []);

  const spawnExplosion = useCallback((x, y) => {
    for (let i = 0; i < 30; i++) {
      const color = ['#ff4500','#ffd700','#ff006e'][randomInt(0, 2)];
      particlesRef.current.push(mkSpark(x, y, color));
      particlesRef.current.push(mkStar(x, y, color));
    }
    for (let i = 0; i < 40; i++) particlesRef.current.push(mkConfetti(x, y));
    particlesRef.current.push(mkRing(x, y, '#ffd700'));
    particlesRef.current.push(mkRing(x, y, '#ff4500'));
  }, []);

  // ---- Render loop ----

  const startDust = useCallback(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    // Seed initial dust
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push(mkDust(canvas.width, canvas.height));
    }
  }, [canvasRef]);

  const drawFrame = useCallback((ctx, canvas) => {
    const w = canvas.width;
    const h = canvas.height;
    const alive = [];

    // Replenish dust
    if (particlesRef.current.filter(p => p.type === 'dust').length < 15) {
      for (let i = 0; i < 3; i++) particlesRef.current.push(mkDust(w, h));
    }

    for (const p of particlesRef.current) {
      p.life -= p.decay;
      if (p.life <= 0) continue;
      alive.push(p);

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'spark') {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.92; p.vy *= 0.92; p.vy += 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, TAU);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.fill();

      } else if (p.type === 'ring') {
        p.radius += (p.maxRadius - p.radius) * 0.12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, TAU);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 * p.life;
        ctx.shadowBlur = 12; ctx.shadowColor = p.color;
        ctx.stroke();

      } else if (p.type === 'confetti') {
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.rotation += p.rotSpeed;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

      } else if (p.type === 'star') {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.93; p.vy *= 0.93; p.vy += 0.1;
        p.rotation += p.rotSpeed;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        drawStar(ctx, 0, 0, 5, p.size * p.life, p.size * p.life * 0.4, p.color);

      } else if (p.type === 'dust') {
        p.x += p.vx; p.y += p.vy;
        if (p.y < 0) p.y = h;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fillStyle = p.color + p.life + ')';
        ctx.fill();
      }

      ctx.restore();
    }

    particlesRef.current = alive;
  }, []);

  function drawStar(ctx, x, y, spikes, outer, inner, color) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(x, y - outer);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(x + Math.cos(rot) * outer, y + Math.sin(rot) * outer);
      rot += step;
      ctx.lineTo(x + Math.cos(rot) * inner, y + Math.sin(rot) * inner);
      rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.fill();
  }

  useEffect(() => {
    return () => {
      activeRef.current = false;
      particlesRef.current = [];
    };
  }, []);

  return { spawnMerge, spawnBounce, spawnExplosion, drawFrame, startDust, particlesRef };
}
