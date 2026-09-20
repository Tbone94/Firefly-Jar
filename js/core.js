'use strict';

/* ============================================================
   core.js — canvas plumbing and shared helpers.
   Owns: the canvas/context, viewport size (W, H, DPR), the
   shared clock (time), the glow-disc cache, easing, seeded RNG.
   ============================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W = 0, H = 0, DPR = 1;   // CSS-pixel viewport + device pixel ratio
let time = 0;                // shared animation clock (s), advanced by main.js

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  layoutScene();               // jar.js — reposition the jar
  bgCanvas = null;             // garden.js — re-render at the new size
}
window.addEventListener('resize', resize);

/* Standard smooth ease for all travel animation (STYLE-GUIDE §5). */
function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2; }

/* Pre-rendered soft radial glow discs, one per tint (perf: gradients are
   built once, then stamped with drawImage). */
const glowCache = {};
function glowDisc(tint) {
  const key = tint.join(',');
  if (glowCache[key]) return glowCache[key];
  const size = 256, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0,   `rgba(${tint[0]},${tint[1]},${tint[2]},0.9)`);
  grad.addColorStop(0.4, `rgba(${tint[0]},${tint[1]},${tint[2]},0.35)`);
  grad.addColorStop(1,   `rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  glowCache[key] = c;
  return c;
}

/* Seeded RNG (mulberry32) so procedural scenery is identical every
   launch — predictability is part of the calm contract. */
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
