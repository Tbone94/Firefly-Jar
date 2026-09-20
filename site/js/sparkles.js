'use strict';

/* ============================================================
   sparkles.js — particle effects: the celebration burst and
   the tiny twinkle every empty-sky tap gets (every touch has
   an answer, STYLE-GUIDE §6). Shapes follow the supplied
   sparkle sheet: rounded stars + dots in palette colors.
   Owns: the sparkles array.
   ============================================================ */

let sparkles = [];

/* A tiny harmless twinkle where a tap landed on empty sky. */
function tapTwinkle(x, y) {
  for (let i = 0; i < 3; i++) {
    sparkles.push({
      x: x + (Math.random()-0.5) * 30, y: y + (Math.random()-0.5) * 30,
      vx: (Math.random()-0.5) * 30, vy: -20 - Math.random() * 20,
      life: 0.9, age: 0, size: 4 + Math.random() * 5,
      shape: Math.random() < 0.5 ? 'star' : 'dot',
      color: PALETTE.cream, spin: Math.random()*Math.PI*2, spinV: 1, delay: 0,
    });
  }
}

function updateSparkles(dt) {
  for (const s of sparkles) {
    if (s.delay > 0) { s.delay -= dt; continue; }
    s.age += dt;
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.vy -= 8 * dt;              // sparkles float gently upward
    s.spin += s.spinV * dt;
  }
  sparkles = sparkles.filter(s => s.age < s.life);
}

/* Rounded star via quadratic curves between outer tips and inner
   valleys — matches the sparkle sheet's soft star shapes (§3: no
   sharp corners anywhere, even in particles). */
function drawRoundedStar(g, x, y, r, points, spin) {
  g.save(); g.translate(x, y); g.rotate(spin);
  g.beginPath();
  const inner = r * 0.45;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
    if (i === 0) g.moveTo(px, py);
    else {
      const pa = ((i - 0.5) / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const pr = (rad + (i % 2 === 0 ? inner : r)) / 2 * 0.86;
      g.quadraticCurveTo(Math.cos(pa) * pr, Math.sin(pa) * pr, px, py);
    }
  }
  g.closePath(); g.fill(); g.restore();
}

function drawSparkles() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of sparkles) {
    if (s.delay > 0) continue;
    const fade = 1 - (s.age / s.life);
    ctx.globalAlpha = Math.min(1, fade * 1.5);
    ctx.fillStyle = s.color;
    if (s.shape === 'star') drawRoundedStar(ctx, s.x, s.y, s.size, 4, s.spin);
    else { ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI*2); ctx.fill(); }
  }
  ctx.restore();
}
