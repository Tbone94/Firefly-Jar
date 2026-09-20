'use strict';

/* ============================================================
   jar.js — the jar: layout, the lights living inside it, the
   lantern glow, the halfway pulse, and the celebration round
   lifecycle.
   Owns: jar, jarFlies, caughtCount, celebrating, halfPulse.
   ============================================================ */

const jar = { x: 0, y: 0, w: 0, h: 0, mouthX: 0, mouthY: 0, glow: 0, targetGlow: 0 };

let jarFlies = [];      // little lights living inside the jar
let caughtCount = 0;    // fireflies caught this round (0..JAR_CAPACITY)
let celebrating = 0;    // countdown timer (s), 0 = not celebrating
let halfPulse = 0;      // halfway-milestone glow swell timer (s)

/* Position the jar center-bottom on the grass (concept sheet layout).
   Called by core.js resize(). */
function layoutScene() {
  // The jar is the biggest object on screen — but capped in absolute size:
  // fireflies are fixed-size creatures, so on a large fullscreen the jar
  // must stay proportional to them instead of growing with the window.
  const jarH = Math.min(H * 0.45, W * 0.62, 330);
  jar.h = jarH; jar.w = jarH;
  jar.x = W / 2;
  jar.y = H - jarH * 0.62;          // vertical center of jar body
  jar.mouthX = jar.x - jarH * 0.02; // mouth is slightly left (lid is tilted open)
  jar.mouthY = jar.y - jarH * 0.30;
}

/* A firefly has reached the jar mouth (tapped or sleepy-drifted). */
function arriveAtJar(f) {
  if (f.done) return;
  f.done = true;
  // Travelers may still settle during the celebration; the full jar must
  // stay at ten lights and its one celebration must finish on schedule.
  if (celebrating || caughtCount >= JAR_CAPACITY) return;
  caughtCount++;
  // a sleepy firefly settling in gets its own extra-soft note
  if (f.sleepy > 0) chime(PENTA[2], 0, 0.07, 1.8);
  jar.targetGlow = caughtCount / JAR_CAPACITY;
  // Each caught firefly stays visible as its own small colored light, so a
  // child can see and count exactly who is in the jar (playtest feedback:
  // individual > one merged glow; countability is also calmer for
  // neurodivergent kids than a shifting blob of light).
  // Low-discrepancy slots spread the lights evenly through the glass
  // (random placement overlapped them; a first golden-angle attempt hit a
  // sine resonance and put them all in one line).
  const idx = jarFlies.length;
  jarFlies.push({
    u: (idx * 0.6180339) % 1,             // horizontal slot fraction
    v: (idx * 0.7548777) % 1,             // vertical slot fraction
    pulse: Math.random() * Math.PI * 2,
    tint: GLOW_TINT[f.variant] || GLOW_TINT.yellow,
  });
  // Halfway milestone: one gentle light pulse + a soft two-note nod, so the
  // child feels "something is happening" in the middle of the round.
  if (caughtCount === JAR_CAPACITY / 2) {
    halfPulse = HALF_PULSE_DUR;
    chime(PENTA[0], 0.1, 0.1, 1.4); chime(PENTA[2], 0.28, 0.1, 1.6);
  }
  if (caughtCount >= JAR_CAPACITY) startCelebration();
}

/* ---------- round lifecycle ---------- */

function startCelebration() {
  celebrating = 5;               // seconds; a warm swell, not an explosion (§5)
  celebrateSound();
  // Rounded stars + dots rising from the jar (sparkle sheet shapes, §8).
  for (let i = 0; i < 70; i++) {
    const ang = -Math.PI/2 + (Math.random() - 0.5) * 2.4;
    const spd = 50 + Math.random() * 130;
    sparkles.push({
      x: jar.x + (Math.random() - 0.5) * jar.w * 0.6,
      y: jar.mouthY + Math.random() * 30,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 2.4 + Math.random() * 2.2, age: 0,
      size: 8 + Math.random() * 16,
      shape: Math.random() < 0.55 ? 'star' : 'dot',
      color: [PALETTE.cream, PALETTE.accent, PALETTE.glow][Math.floor(Math.random()*3)],
      spin: Math.random() * Math.PI * 2, spinV: (Math.random()-0.5) * 1.5,
      delay: Math.random() * 0.8,
    });
  }
}

function updateCelebration(dt) {
  if (!celebrating) return;
  celebrating -= dt;
  if (celebrating <= 0) {
    celebrating = 0;
    caughtCount = 0;
    jar.targetGlow = 0;
    jarFlies = [];               // the jar dims and the night begins again
  }
}

/* ---------- drawing ---------- */

function drawJar(dt) {
  // brightness eases toward target — never jumps (§4)
  jar.glow += (jar.targetGlow - jar.glow) * Math.min(1, dt * 2.5);
  // Keep early catches dim so later arrivals still add a visible step
  // (playtest: "it peaks too early"). The power curve reserves light for later.
  const g = Math.pow(jar.glow, 1.5);
  // Celebration swell is gentle and slow — no strobing, sensory-safe.
  let burst = celebrating ? (0.5 + 0.5 * Math.sin(time * 1.2)) * 0.15 : 0;
  // halfway pulse: one smooth swell up and back down
  if (halfPulse > 0) {
    halfPulse = Math.max(0, halfPulse - dt);
    burst += Math.sin(Math.PI * (1 - halfPulse / HALF_PULSE_DUR)) * 0.22;
  }

  // Anchor for everything inside the glass: the jar PNG's glass body is
  // centered LOWER than the image center (the tilted lid takes the top of
  // the frame).
  const glassX = jar.x, glassY = jar.y + jar.h * 0.15;

  // Night-sky backing inside the glass, drawn FIRST so the warm glow and
  // lights paint over it: without it the green bushes show through the
  // transparent jar and tint the glow. Sized to hide behind the outline.
  ctx.save();
  ctx.fillStyle = 'rgba(43,58,103,0.55)';
  ctx.beginPath();
  ctx.ellipse(glassX, glassY, jar.w * 0.20, jar.h * 0.21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // warm lantern light — soft, capped luminance. The full jar is a cozy
  // lantern, never a floodlight (neurodivergent-friendly ceiling, §4).
  if (g > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const bodyY = glassY;
    // wide halo spilling onto the grass
    let R = jar.w * (0.55 + 0.8 * g + burst * 0.3);
    ctx.globalAlpha = 0.34 * g + burst * 0.5;
    ctx.drawImage(glowDisc(GLOW_TINT.yellow), jar.x - R, bodyY - R, R * 2, R * 2);
    // mid warm body
    R = jar.w * (0.3 + 0.28 * g);
    ctx.globalAlpha = 0.7 * g + burst * 0.4;
    ctx.drawImage(glowDisc(GLOW_TINT.yellow), jar.x - R, bodyY - R, R * 2, R * 2);
    // soft cream heart
    R = jar.w * (0.12 + 0.15 * g);
    ctx.globalAlpha = 0.55 * g + burst * 0.3;
    ctx.drawImage(glowDisc([255, 244, 224]), jar.x - R, bodyY - R, R * 2, R * 2);
    ctx.restore();
  }

  // the little lights living inside (drawn before the jar so the cream
  // outline reads as glass in front of them)
  for (const jf of jarFlies) {
    // slot position in the glass body + a lively-but-slow personal wander:
    // two incommensurate sines per axis so each light meanders around its
    // slot instead of ticking back and forth
    const wx = Math.sin(time * 0.5 + jf.pulse) * jar.w * 0.045
             + Math.sin(time * 0.23 + jf.pulse * 2.1) * jar.w * 0.03;
    const wy = Math.cos(time * 0.41 + jf.pulse) * jar.h * 0.035
             + Math.sin(time * 0.19 + jf.pulse * 1.7) * jar.h * 0.022;
    const px = glassX + (jf.u - 0.5) * jar.w * 0.30 + wx;
    const py = glassY + (jf.v - 0.5) * jar.h * 0.24 + wy;
    // small individual glow: each firefly stays a distinct, countable light
    const s = 18 + 4 * Math.sin(time * 1.2 + jf.pulse);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.68;
    ctx.drawImage(glowDisc(jf.tint), px - s, py - s, s * 2, s * 2);
    ctx.restore();
    // colored pip at the heart, drawn normally so its color stays true —
    // this is the "who's in the jar" dot
    ctx.fillStyle = `rgba(${jf.tint[0]},${jf.tint[1]},${jf.tint[2]},0.95)`;
    ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
  }

  const img = IMAGES.jar;
  if (img.complete && img.naturalWidth) {
    ctx.drawImage(img, jar.x - jar.w/2, jar.y - jar.h/2, jar.w, jar.h);
  }
}
