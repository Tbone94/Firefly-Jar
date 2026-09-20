'use strict';

/* ============================================================
   fireflies.js — the fireflies themselves: spawning and entry
   modes, heading-based flight, loop-de-loops, tap response,
   travel-to-jar, expression overlays (sleepy / surprised), and
   the idle "attract mode" that demonstrates the game.
   Owns: fireflies, idleTime/nextSleepAt, variant history.

   Firefly state machine:
     'drift'  — ambient gliding (tappable)
     'sleepy' — dozing off during idle mode (still tappable)
     'travel' — flying to the jar mouth (tapped or sleep-drifted)
   ============================================================ */

let fireflies = [];

/* ---------- variant choice ---------- */

let lastVariants = [];
function pickVariant() {
  // Yellow stays the slight default, but pink and teal appear often enough
  // that the night feels varied (40/30/30) — and never three alike in a row.
  const r = Math.random();
  let v = r < 0.4 ? 'yellow' : (r < 0.7 ? 'pink' : 'teal');
  if (lastVariants.length >= 2 && lastVariants.every(x => x === v)) {
    const others = ['yellow', 'pink', 'teal'].filter(x => x !== v);
    v = others[Math.floor(Math.random() * others.length)];
  }
  lastVariants = [lastVariants[lastVariants.length - 1], v].filter(Boolean).slice(-2);
  return v;
}

/* ---------- spawning ---------- */

function spawnFirefly(edge = false) {
  const margin = 80;
  let x, y, entry = 'seed';
  if (edge) {
    // three ways into the night, so an emptied sky refills from anywhere:
    // drift in from a side, float down from the top, or approach "from the
    // distance" (appearing small in the open sky and growing closer)
    const r = Math.random();
    if (r < 0.4) {        entry = 'side';
      x = Math.random() < 0.5 ? -margin : W + margin;
      y = 60 + Math.random() * (H * 0.6);
    } else if (r < 0.75) { entry = 'top';
      x = W * 0.12 + Math.random() * W * 0.76;
      y = -margin * 0.8;
    } else {               entry = 'far';
      for (let tries = 0; tries < 12; tries++) {
        x = W * 0.12 + Math.random() * W * 0.76;
        y = 70 + Math.random() * (H * 0.5);
        if (Math.hypot(x - jar.x, y - jar.y) > jar.h * 1.3 &&
            fireflies.every(o => Math.hypot(o.x - x, o.y - y) > 150)) break;
      }
    }
  } else {    // initial population: spaced out across the sky
    for (let tries = 0; tries < 12; tries++) {
      x = 60 + Math.random() * (W - 120);
      y = 60 + Math.random() * (H * 0.55);
      if (fireflies.every(o => Math.hypot(o.x - x, o.y - y) > 170)) break;
    }
  }
  fireflies.push({
    x, y,
    // heading-based glide: a direction that turns smoothly, so paths are
    // intentional winding arcs instead of jittery bounces
    th: entry === 'side' ? (x < 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.6
      : entry === 'top'  ? Math.PI / 2 + (Math.random() - 0.5) * 0.7
      : Math.random() * Math.PI * 2,
    // "from the distance": grows from small to full size as it arrives
    appr: entry === 'far' ? 0 : 1,
    spd: 12 + Math.random() * 14,              // px/s — some amble, some float
    turnP: Math.random() * Math.PI * 2,        // slow steering wave
    turnF: 0.05 + Math.random() * 0.07,
    loopT: 0,                                  // >0 while doing a loop
    nextLoopIn: 8 + Math.random() * 16,        // s until this one's next loop
    pulse: Math.random() * Math.PI * 2,        // glow phase offset
    pulseF: 2 * Math.PI / (2.5 + Math.random() * 1.5),
    variant: pickVariant(),
    size: 84 + Math.random() * 22,             // display height
    flip: Math.random() < 0.5,
    state: 'drift',                            // see state machine above
    squash: 0,                                 // tap-response squash timer
    sleepy: 0,                                 // 0 awake → 1 eyes closed
    surprise: 0,                               // "oh!" face timer after a tap
  });
}

/* ---------- idle attract mode: sleepy fireflies teach the game ----------
   If nothing is touched for a while, one firefly at a time gets sleepy
   (eyes close) and slowly drifts down into the jar — showing a watching
   child what to do, and eventually completing the round on its own.
   Any touch resets the idle clock (see ui.js). */

let idleTime = 0, nextSleepAt = IDLE_START;

function updateIdle(dt) {
  if (celebrating) return;
  idleTime += dt;
  if (idleTime >= nextSleepAt) {
    const candidates = fireflies.filter(f => f.state === 'drift' && f.appr >= 1);
    if (candidates.length) {
      beginSleep(candidates[Math.floor(Math.random() * candidates.length)]);
      nextSleepAt = idleTime + 5 + Math.random() * 4;
    } else {
      nextSleepAt = idleTime + 2;   // nobody free yet; check again soon
    }
  }
}

function beginSleep(f) {
  f.state = 'sleepy';
  f.sleepT = 0;
}

/* A dozed-off firefly floats down into the jar: same bezier travel as a
   tapped catch, but slower, with a gentle swaying descent. */
function startSleepTravel(f) {
  f.state = 'travel';
  f.t = 0;
  f.fromX = f.x; f.fromY = f.y;
  const midX = (f.x + jar.mouthX) / 2, midY = (f.y + jar.mouthY) / 2;
  const dx = jar.mouthX - f.x, dy = jar.mouthY - f.y;
  const len = Math.hypot(dx, dy) || 1;
  const arc = Math.min(90, len * 0.25) * (f.x < jar.mouthX ? -1 : 1);
  f.ctrlX = midX + (-dy / len) * arc;
  f.ctrlY = midY + (dx / len) * arc - 20;
  f.travelDur = Math.max(2.8, len / 110);
  f.loop = null; f.flutter = false;
}

/* ---------- tap response ---------- */

function tapFirefly(f) {
  f.state = 'travel';
  f.t = 0;
  f.squash = 0.25;
  f.sleepy = 0;                  // a tap wakes a dozing firefly
  // "oh!" — held long enough to still be seen after the finger lifts
  f.surprise = 1.1;
  f.fromX = f.x; f.fromY = f.y;
  // Arcing path: control point off to the side, above the direct line (§5).
  const midX = (f.x + jar.mouthX) / 2, midY = (f.y + jar.mouthY) / 2;
  const dx = jar.mouthX - f.x, dy = jar.mouthY - f.y;
  const len = Math.hypot(dx, dy) || 1;
  const arc = Math.min(140, len * 0.35) * (f.x < jar.mouthX ? -1 : 1);
  f.ctrlX = midX + (-dy / len) * arc;
  f.ctrlY = midY + (dx / len) * arc - 40;
  f.travelDur = Math.max(0.9, len / 300);      // ≤ ~300 px/s, eased
  // Occasional flight flourish (never every time — predictable-with-delight):
  // ~1 in 3 does one lazy loop-de-loop, ~1 in 5 a quick happy flutter.
  const flourish = Math.random();
  f.loop = null; f.flutter = false;
  if (flourish < 0.33) {
    f.loop = { r: Math.min(55, len * 0.18) };
    f.travelDur += 0.5;                        // loops take a moment longer
  } else if (flourish < 0.53) {
    f.flutter = true;
  }
  catchSound();
}

/* ---------- per-frame update ---------- */

function updateFireflies(dt) {
  // gentle separation: drifting fireflies ease apart instead of stacking
  const drifters = fireflies.filter(f => f.state === 'drift' || f.state === 'sleepy');
  for (let i = 0; i < drifters.length; i++) {
    for (let j = i + 1; j < drifters.length; j++) {
      const a = drifters[i], b = drifters[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 160) {
        const push = (160 - d) / 160 * 26 * dt;   // soft, capped nudge
        a.x -= dx / d * push; a.y -= dy / d * push;
        b.x += dx / d * push; b.y += dy / d * push;
      }
    }
  }
  for (const f of fireflies) {
    f.pulse += f.pulseF * dt;
    if (f.squash > 0) f.squash -= dt;
    if (f.surprise > 0) f.surprise -= dt;
    if (f.appr < 1) f.appr = Math.min(1, f.appr + dt / 4.5);   // keeps growing even if tapped mid-approach
    if (f.state === 'drift' || f.state === 'sleepy') {
      // sleepy fireflies glide slower and slowly sink while dozing off
      const calm = 1 - 0.75 * f.sleepy;
      f.turnP += f.turnF * dt * Math.PI * 2;
      let turn = Math.sin(f.turnP) * 0.3;      // rad/s — long winding arcs
      let spd = f.spd;

      // occasional playful loop-de-loop mid-flight (awake, on-screen only)
      if (f.loopT > 0) {
        f.loopT -= dt;
        const prog = 1 - f.loopT / 3.2;
        turn += (Math.PI * 2 / 3.2) * f.loopDir;
        spd += 44 * Math.sin(Math.PI * Math.min(1, Math.max(0, prog)));
      } else if (f.sleepy === 0) {
        f.nextLoopIn -= dt;
        if (f.nextLoopIn <= 0 && f.x > 100 && f.x < W - 100 && f.y < H * 0.6) {
          f.loopT = 3.2;
          f.loopDir = Math.random() < 0.5 ? 1 : -1;
          f.nextLoopIn = 22 + Math.random() * 26;
        }
      }

      // steering: ease back toward the sky when nearing edges…
      const steer = (target) => {
        let d = ((target - f.th + Math.PI) % (Math.PI * 2) + Math.PI * 2)
                % (Math.PI * 2) - Math.PI;
        f.th += d * Math.min(1, 1.6 * dt);
      };
      if (f.x < 60) steer(0);
      else if (f.x > W - 60) steer(Math.PI);
      if (f.y < 70) steer(Math.PI / 2);
      else if (f.y > H * 0.74) steer(-Math.PI / 2);
      // …and keep a respectful bubble around the jar (its space, not theirs)
      const jdx = f.x - jar.x, jdy = f.y - jar.y;
      const jd = Math.hypot(jdx, jdy), KEEP = jar.h * 1.05;
      if (jd < KEEP && f.state === 'drift') {
        steer(Math.atan2(jdy, jdx));
        const push = (1 - jd / KEEP) * 30 * dt;
        f.x += (jdx / (jd || 1)) * push; f.y += (jdy / (jd || 1)) * push;
      }

      f.th += turn * dt * calm;
      f.x += Math.cos(f.th) * spd * dt * calm;
      f.y += Math.sin(f.th) * spd * dt * calm + 9 * f.sleepy * dt;
      // face where you're going, with hysteresis so loops don't flip-flap
      if (Math.cos(f.th) < -0.2) f.flip = true;
      else if (Math.cos(f.th) > 0.2) f.flip = false;
      if (f.state === 'sleepy') {
        f.sleepT += dt;
        f.sleepy = Math.min(1, f.sleepT / 0.9);   // eyes drift closed
        if (f.sleepT > 1.8) startSleepTravel(f);   // …and float to the jar
      }
    } else if (f.state === 'travel') {
      f.t += dt / f.travelDur;
      const e = easeInOut(Math.min(f.t, 1));
      const u = 1 - e;
      f.x = u*u*f.fromX + 2*u*e*f.ctrlX + e*e*jar.mouthX;
      f.y = u*u*f.fromY + 2*u*e*f.ctrlY + e*e*jar.mouthY;
      // Flourish offsets fade in and out (zero at both ends, so the path
      // still starts at the firefly and lands exactly on the jar mouth).
      const env = Math.sin(Math.PI * Math.min(f.t, 1));
      if (f.loop) {
        const a = Math.min(f.t, 1) * Math.PI * 2 - Math.PI / 2;
        f.x += Math.cos(a) * f.loop.r * env;
        f.y += Math.sin(a) * f.loop.r * env;
      } else if (f.flutter) {
        f.x += Math.sin(f.t * 22) * 9 * env;
        f.y += Math.cos(f.t * 17) * 7 * env;
      }
      if (f.t >= 1) { arriveAtJar(f); }
    }
  }
  fireflies = fireflies.filter(f => !f.done);
  // keep the night populated (not during the celebration wind-down)
  if (!celebrating) {
    if (fireflies.length < AMBIENT_COUNT && Math.random() < 0.02) spawnFirefly(true);
  }
}

/* ---------- drawing (sprites + glow + expression overlays) ---------- */

function drawFireflies() {
  for (const f of fireflies) {
    const img = IMAGES[f.variant];
    if (!img.complete || !img.naturalWidth) continue;
    const pulse = 0.75 + 0.25 * Math.sin(f.pulse);
    const squash = f.squash > 0 ? 1 + Math.sin(f.squash * Math.PI / 0.25) * 0.12 : 1;
    // arriving "from the distance": small and faint, growing smoothly closer
    const depth = 0.3 + 0.7 * easeInOut(f.appr);
    const fadeIn = Math.min(1, f.appr * 3);
    const size = f.size * depth
               * (f.state === 'travel' ? (1 - 0.25 * easeInOut(Math.min(f.t,1))) : 1);
    // a soft hover-flutter while drifting (visual only, physics stays calm)
    const drifting = f.state === 'drift' || f.state === 'sleepy';
    const hover = drifting ? Math.sin(time * 2.1 + f.pulse * 2) * 3 * (1 - f.sleepy) : 0;
    const sway  = drifting ? Math.sin(time * 0.7 + f.pulse) * 0.055 * (1 - f.sleepy) : 0;

    // glow behind the abdomen (additive, breathing — §4); sleepy = dimmer
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gr = size * (0.9 + 0.35 * pulse) * (f.squash > 0 ? 1.25 : 1);
    ctx.globalAlpha = (0.55 + 0.3 * pulse) * (1 - 0.35 * f.sleepy) * fadeIn;
    const gx = f.x + (f.flip ? -size*0.18 : size*0.18), gy = f.y + hover + size*0.22;
    ctx.drawImage(glowDisc(GLOW_TINT[f.variant]), gx - gr, gy - gr, gr * 2, gr * 2);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = fadeIn;
    ctx.translate(f.x, f.y + hover);
    ctx.rotate(sway);
    if (f.flip) ctx.scale(-1, 1);
    ctx.scale(squash, 1);
    const w = size * (SPRITE_BOX.sw / SPRITE_BOX.sh);
    ctx.drawImage(img, SPRITE_BOX.sx, SPRITE_BOX.sy, SPRITE_BOX.sw, SPRITE_BOX.sh,
                  -w/2, -size/2, w, size);

    // sleepy face: cover the open eyes with body-navy patches and draw
    // closed-eye arcs (charsheet's "sleepy" expression), fading with f.sleepy
    if (f.sleepy > 0.02) {
      const sx2l = (EYES.lx - SPRITE_BOX.sx) / SPRITE_BOX.sw * w - w/2;
      const syl  = (EYES.ly - SPRITE_BOX.sy) / SPRITE_BOX.sh * size - size/2;
      const sx2r = (EYES.rx - SPRITE_BOX.sx) / SPRITE_BOX.sw * w - w/2;
      const syr  = (EYES.ry - SPRITE_BOX.sy) / SPRITE_BOX.sh * size - size/2;
      ctx.globalAlpha = f.sleepy;
      ctx.fillStyle = BODY_NAVY;
      for (const [ex, ey] of [[sx2l, syl], [sx2r, syr]]) {
        ctx.beginPath(); ctx.arc(ex, ey, w * 0.075, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = FACE_DARK;
      ctx.lineWidth = Math.max(2, w * 0.022);
      ctx.lineCap = 'round';
      for (const [ex, ey] of [[sx2l, syl], [sx2r, syr]]) {
        ctx.beginPath();
        ctx.arc(ex, ey - w * 0.012, w * 0.05, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // surprised face on tap: the smile becomes a little "oh!" o-mouth
    // (charsheet's "surprised" expression), fading out at the end
    if (f.surprise > 0) {
      const mx = (MOUTH.x - SPRITE_BOX.sx) / SPRITE_BOX.sw * w - w/2;
      const my = (MOUTH.y - SPRITE_BOX.sy) / SPRITE_BOX.sh * size - size/2;
      ctx.globalAlpha = Math.min(1, f.surprise / 0.3);
      // cover the smile with body color, then draw the round open mouth
      ctx.fillStyle = BODY_NAVY;
      ctx.beginPath(); ctx.ellipse(mx, my, w * 0.06, w * 0.045, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = FACE_DARK;
      ctx.beginPath(); ctx.ellipse(mx, my + w * 0.008, w * 0.026, w * 0.034, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
