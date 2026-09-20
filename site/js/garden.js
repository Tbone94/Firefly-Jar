'use strict';

/* ============================================================
   garden.js — the night-garden background, matching the concept
   sheet's scene panel: dark treeline → dark side bushes dipping
   to a center clearing → bright grass mound → blade tufts →
   framing leaf fronds → breathing glow motes.

   All detail lives at the edges and bottom; the upper sky (where
   the gameplay happens) stays clean so nothing competes with the
   fireflies. Static layers are prerendered once per resize into
   bgCanvas; only stars and motes animate, gently.

   Owns: bgCanvas, stars, motes.
   ============================================================ */

let stars = [], motes = [];
let bgCanvas = null;   // core.js sets this null on resize to force a re-render

/* ---------- little shape helpers ---------- */

function blob(g, cx, cy, rx, ry) {
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
}

/* A simple pointed grass blade, gently curved. */
function blade(g, x, y, h, lean, color) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - h * 0.09, y);
  g.quadraticCurveTo(x - h * 0.06 + lean * 0.4, y - h * 0.6, x + lean, y - h);
  g.quadraticCurveTo(x + h * 0.06 + lean * 0.6, y - h * 0.5, x + h * 0.09, y);
  g.closePath(); g.fill();
}

/* A stylized frond: a thin curved stem with well-separated oval leaves
   (concept sheet's framing plants — leaves must read individually,
   never merge into a lumpy stalk). */
function frond(g, x, y, len, ang, color, leaflets = 5) {
  g.save();
  g.translate(x, y); g.rotate(ang);
  g.strokeStyle = color; g.lineWidth = Math.max(2, len * 0.018);
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.12, -len * 0.55, len * 0.06, -len);
  g.stroke();
  g.fillStyle = color;
  for (let i = 1; i <= leaflets; i++) {
    const t = i / leaflets;
    const sx = (t * 0.12 - t * t * 0.05) * len, sy = -t * len * 0.94;
    const s = len * 0.11 * (1.1 - t * 0.4);   // small enough to stay separate
    for (const side of [-1, 1]) {
      if (i === leaflets && side === 1) continue; // tip gets one leaf
      g.save();
      g.translate(sx, sy);
      g.rotate(side * 1.05 - t * side * 0.25);
      // leaf sits a little away from the stem so the gap shows
      g.beginPath(); g.ellipse(s * 1.5, 0, s, s * 0.52, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }
  g.restore();
}

/* ---------- the static scene, rendered once per viewport size ---------- */

function renderGarden() {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = W * DPR; bgCanvas.height = H * DPR;
  const g = bgCanvas.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  const rnd = mulberry32(7);   // fixed seed: the same calm garden every launch

  // sky + soft vignette (≤ −12% lightness, STYLE-GUIDE §2)
  g.fillStyle = PALETTE.sky;
  g.fillRect(0, 0, W, H);
  const v = g.createRadialGradient(W/2, H*0.45, Math.min(W,H)*0.3, W/2, H*0.5, Math.max(W,H)*0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(16,24,52,0.35)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);

  // dark treeline silhouettes along the horizon, taller at the sides
  g.fillStyle = GARDEN.treeline;
  const hor = H * 0.76;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const side = Math.abs(t - 0.5) * 2;              // 0 center → 1 edges
    const r = W * (0.09 + rnd() * 0.05);
    blob(g, t * W, hor + H * 0.06 - side * H * 0.05 - rnd() * H * 0.02, r, r * (0.8 + rnd() * 0.3));
  }
  g.fillRect(0, hor + H * 0.05, W, H);

  // dark bushes, dipping toward the center clearing
  g.fillStyle = GARDEN.bushDark;
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const side = Math.abs(t - 0.5) * 2;
    const lift = side * H * 0.085;                   // rise at the edges
    const r = W * (0.07 + rnd() * 0.05);
    blob(g, t * W, H * 0.88 - lift + rnd() * H * 0.015, r, r * (0.75 + rnd() * 0.3));
  }
  g.fillStyle = GARDEN.bushMid;
  for (let i = 0; i <= 7; i++) {
    const t = i / 7;
    const side = Math.abs(t - 0.5) * 2;
    const lift = side * H * 0.06;
    const r = W * (0.065 + rnd() * 0.045);
    blob(g, t * W + W * 0.03, H * 0.92 - lift, r, r * (0.7 + rnd() * 0.3));
  }

  // blade tufts along the bush tops (lighter against dark bushes)
  for (let i = 0; i < 14; i++) {
    const x = rnd() * W;
    const side = Math.abs(x / W - 0.5) * 2;
    const y = H * (0.9 - side * 0.055) + rnd() * H * 0.02;
    const h = H * (0.03 + rnd() * 0.045);
    blade(g, x, y, h, (rnd() - 0.5) * h * 0.5, GARDEN.frond);
  }

  // bright grass mound with a gentle center clearing for the jar
  g.fillStyle = GARDEN.grass;
  blob(g, W * 0.5, H * 1.06, W * 0.75, H * 0.16);
  blob(g, W * 0.12, H * 1.02, W * 0.3, H * 0.13);
  blob(g, W * 0.88, H * 1.02, W * 0.3, H * 0.13);
  g.fillStyle = GARDEN.grassLit;
  blob(g, W * 0.5, H * 1.09, W * 0.55, H * 0.12);

  // soft blades framing the clearing (a gentle tone down from the mound,
  // never dark spikes)
  for (let i = 0; i < 10; i++) {
    const t = rnd();
    const x = W * (t < 0.5 ? 0.12 + t * 0.44 : 0.63 + (t - 0.5) * 0.5);
    const y = H * (0.965 + rnd() * 0.03);
    const h = H * (0.028 + rnd() * 0.028);
    blade(g, x, y, h, (rnd() - 0.5) * h * 0.6, '#5da162');
  }

  // framing fronds: mid-green from the side edges, dark at bottom corners
  frond(g, W * 0.015, H * 0.92, H * 0.15, 0.5, GARDEN.frond);
  frond(g, W * 0.005, H * 0.99, H * 0.11, 0.85, GARDEN.frond, 4);
  frond(g, W * 0.985, H * 0.92, H * 0.16, -0.5, GARDEN.frond);
  frond(g, W * 0.995, H * 0.99, H * 0.1, -0.9, GARDEN.frond, 4);
  frond(g, W * 0.07, H * 1.03, H * 0.1, 0.25, GARDEN.frondDark, 4);
  frond(g, W * 0.93, H * 1.03, H * 0.1, -0.25, GARDEN.frondDark, 4);

  // faint stars — few and dim (the reference sky is nearly clean)
  stars = [];
  for (let i = 0; i < 22; i++) {
    stars.push({ x: rnd(), y: rnd() * 0.6, r: 0.8 + rnd() * 1.4,
                 p: rnd() * Math.PI * 2, f: 0.25 + rnd() * 0.4 });
  }
  // ambient glow motes nestled in the greenery (decor, not catchable)
  motes = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 7 + rnd() * 0.08;
    const side = Math.abs(t - 0.5) * 2;
    motes.push({
      x: t, y: 0.87 - side * 0.06 - rnd() * 0.05,
      r: 2 + rnd() * 2.5,
      tint: rnd() < 0.6 ? GLOW_TINT.yellow : GLOW_TINT.pink,
      p: rnd() * Math.PI * 2, f: 0.2 + rnd() * 0.35,
    });
  }
}

/* ---------- per-frame draw: static scene + gentle animated bits ---------- */

function drawBackground() {
  if (!bgCanvas) renderGarden();
  ctx.drawImage(bgCanvas, 0, 0, W, H);
  // faint twinkling stars (slow, dim — never a light show)
  for (const s of stars) {
    const a = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(time * s.f + s.p));
    ctx.fillStyle = `rgba(255,244,224,${a})`;
    ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
  }
  // glow motes breathing in the bushes
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const m of motes) {
    const a = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(time * m.f + m.p));
    const s = m.r * 5;
    ctx.globalAlpha = a;
    ctx.drawImage(glowDisc(m.tint), m.x * W - s, m.y * H - s, s * 2, s * 2);
    ctx.globalAlpha = a * 1.8;
    ctx.fillStyle = `rgba(${m.tint[0]},${m.tint[1]},${m.tint[2]},1)`;
    ctx.beginPath(); ctx.arc(m.x * W, m.y * H, m.r * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
