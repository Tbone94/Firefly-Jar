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
let respawnCooldown = 0;   // spaces new arrivals so several never appear at once

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

function spawnFirefly(edge = false, urgent = false) {
  const margin = 80;
  let x, y, entry = 'seed';
  if (edge) {
    // three ways into the night, so an emptied sky refills from anywhere:
    // drift in from a side, float down from the top, or approach "from the
    // distance" (appearing small in the open sky and growing closer).
    // An urgent refill (below the population floor) skips the slow "from the
    // distance" entry so a near-empty sky fills at full size right away.
    const r = urgent ? Math.random() * 0.75 : Math.random();
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
  // Assign a role: most fireflies drift locally; up to VOYAGER_MAX are
  // "voyagers" that pass the full width of the sky. Bias toward keeping about
  // two present, and never exceed the cap.
  const voyagers = fireflies.filter(f => f.role === 'voyager').length;
  const pVoyager = voyagers === 0 ? 0.75 : voyagers === 1 ? 0.45 : 0.2;
  const role = (voyagers < VOYAGER_MAX && Math.random() < pVoyager) ? 'voyager' : 'wanderer';
  fireflies.push({
    x, y,
    role,                                      // 'wanderer' (local) | 'voyager' (crosses)
    voySpd: VOYAGER_SPD[0] + Math.random() * (VOYAGER_SPD[1] - VOYAGER_SPD[0]),
    dir: 0, laneY: 0, bankT: 0, bankRate: 0, loopRate: 0,  // voyager pass state
    // heading-based glide: a direction that turns smoothly, so paths are
    // intentional winding arcs instead of jittery bounces
    th: entry === 'side' ? (x < 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.6
      : entry === 'top'  ? Math.PI / 2 + (Math.random() - 0.5) * 0.7
      : Math.random() * Math.PI * 2,
    // "from the distance": grows from small to full size as it arrives
    appr: entry === 'far' ? 0 : 1,
    spd: 12 + Math.random() * 14,              // px/s — some amble, some float
    turnCur: 0, turnTarget: 0, segT: 0,        // designed flight segments
    mirrorNext: false, lastSweep: Math.PI,     // (see nextFlightSegment)
    loopT: 0,                                  // >0 while doing a loop
    nextLoopIn: 8 + Math.random() * 16,        // s until this one's next loop
    pulse: Math.random() * Math.PI * 2,        // glow phase offset
    pulseF: 2 * Math.PI / (2.5 + Math.random() * 1.5),
    variant: pickVariant(),
    size: 84 + Math.random() * 22,             // display height
    flip: Math.random() < 0.5,
    state: 'drift',                            // see state machine above
    spin: false,                               // true = twirl on the way to the jar (tapped)
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
      // each doze RESETS the clock — the next firefly takes a while to get
      // sleepy too, so the demonstration stays unhurried
      nextSleepAt = idleTime + IDLE_REPEAT + Math.random() * 6;
    } else {
      nextSleepAt = idleTime + 2;   // nobody free yet; check again soon
    }
  }
}

/* ---------- designed flight segments ----------
   Ambient flight is a chain of constant-curvature pieces — a constant turn
   rate traces a perfect circle arc, which is exactly what a 4–7-year-old's
   eye can follow and predict. The menu: gentle glides between figures, big
   rounded arcs, full U-turns, and occasional S-curves (an arc then its
   mirror). Turn rate eases between segments so joins never kink. */

function nextFlightSegment(f) {
  if (f.mirrorNext) {              // finish an S-curve: same arc, mirrored
    f.mirrorNext = false;
    f.turnTarget = -f.turnTarget;
    f.segT = f.lastSweep / Math.abs(f.turnTarget || 0.3);
    return;
  }
  // Every figure is followed by a straight glide, so shapes read one at a
  // time instead of piling into a scribble.
  if (f.lastWasTurn) {
    f.lastWasTurn = false;
    f.turnTarget = (Math.random() - 0.5) * 0.06;
    f.segT = 3 + Math.random() * 3;
    return;
  }
  const dir = Math.random() < 0.5 ? 1 : -1;
  const r = Math.random();
  f.lastWasTurn = true;
  if (r < 0.45) {                            // big rounded arc (90–150°)
    const rate = 0.16 + Math.random() * 0.12;   // low rate = wide circle
    const sweep = Math.PI * (0.5 + Math.random() * 0.33);
    f.turnTarget = dir * rate; f.segT = sweep / rate; f.lastSweep = sweep;
  } else if (r < 0.8) {                      // U-turn (a full half circle)
    const rate = 0.2 + Math.random() * 0.12;
    f.turnTarget = dir * rate; f.segT = Math.PI / rate; f.lastSweep = Math.PI;
  } else {                                   // S-curve: this arc, then mirrored
    const rate = 0.18 + Math.random() * 0.1;
    const sweep = Math.PI * (0.45 + Math.random() * 0.2);
    f.turnTarget = dir * rate; f.segT = sweep / rate; f.lastSweep = sweep;
    f.mirrorNext = true;
  }
}

/* ---------- voyager flight: the long crossings ----------
   A voyager makes clean, mostly-horizontal passes across the whole width of the
   sky — a friend a child can watch travel from one side to the other — easing
   up or down toward a slowly-shifting lane as it goes, never diving. It commits
   to a direction (that steady travel, not speed, is what reads as "passing
   across" rather than floating in place); at each edge it banks through one wide
   swoop and heads back, and once in a while draws a big slow loop mid-pass. All
   within the ambient speed cap. Returns { turn, spd } for the shared integrator. */

const VOY_TURN_AT = 150;   // px from an edge where the wide swoop-turn begins

function steerVoyager(f, dt) {
  const spd = f.voySpd;
  if (!f.dir) { f.dir = f.x < W / 2 ? 1 : -1; f.laneY = f.y; f.th = f.dir > 0 ? 0 : Math.PI; }

  // wide swoop-turn at each edge (begins before the bezel so the arc stays
  // on-screen); half a circle, then reverse direction and pick a fresh lane
  if (f.bankT > 0) {
    f.bankT -= dt;
    if (f.bankT <= 0) { f.dir = -f.dir; f.laneY = 110 + Math.random() * (H * 0.46); }
    return { turn: f.bankRate, spd };
  }
  if ((f.dir > 0 && f.x > W - VOY_TURN_AT) || (f.dir < 0 && f.x < VOY_TURN_AT)) {
    f.bankT = 5 + Math.random() * 1.5;                 // ~5–6.5 s for the half-circle
    const s = f.y > H * 0.3 ? -1 : 1;                  // swoop toward the open sky
    f.bankRate = s * f.dir * (Math.PI / f.bankT);      // sign turns it back around
    return { turn: f.bankRate, spd };
  }

  // occasional big lazy loop mid-pass (rare garnish, one slow revolution)
  if (f.loopT > 0) { f.loopT -= dt; return { turn: f.loopRate * f.loopDir, spd }; }
  f.nextLoopIn -= dt;
  if (f.nextLoopIn <= 0 && f.x > VOY_TURN_AT + 80 && f.x < W - VOY_TURN_AT - 80) {
    f.loopT = 9 + Math.random() * 3;                   // ~9–12 s full, unhurried circle
    f.loopRate = (Math.PI * 2) / f.loopT;
    f.loopDir = Math.random() < 0.5 ? 1 : -1;
    f.nextLoopIn = 26 + Math.random() * 20;            // rarer than a wanderer's loop
    return { turn: f.loopRate * f.loopDir, spd };
  }

  // the pass itself: hold a near-horizontal heading in the travel direction,
  // easing gently toward the current lane so it rises/falls but never dives
  const dy = Math.max(-120, Math.min(120, f.laneY - f.y));
  const desired = Math.atan2(dy * 0.4, f.dir);
  const d = ((desired - f.th + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return { turn: Math.max(-0.3, Math.min(0.3, d * 0.9)), spd };
}

function beginSleep(f) {
  f.state = 'sleepy';
  f.sleepT = 0;
  f.loopT = 0;             // drop any mid-flight loop so dozing is calm
}

/* A dozed-off firefly floats down into the jar: same bezier travel as a
   tapped catch, but slower, with a gentle swaying descent. */
function startSleepTravel(f) {
  f.state = 'travel';
  f.spin = false;             // dozing fireflies drift down calmly — never spin
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
  f.spin = true;                 // surprised front pose, then one gentle twirl to the jar
  f.fromX = f.x; f.fromY = f.y;
  // Arcing path: control point off to the side, above the direct line (§5).
  const midX = (f.x + jar.mouthX) / 2, midY = (f.y + jar.mouthY) / 2;
  const dx = jar.mouthX - f.x, dy = jar.mouthY - f.y;
  const len = Math.hypot(dx, dy) || 1;
  const arc = Math.min(140, len * 0.35) * (f.x < jar.mouthX ? -1 : 1);
  f.ctrlX = midX + (-dy / len) * arc;
  f.ctrlY = midY + (dx / len) * arc - 40;
  // A touch slower than a plain catch so the surprise face reads and the single
  // turn stays unhurried: hold pose (SPIN_HOLD) + one calm rotation.
  f.travelDur = Math.max(1.3, len / 280);
  f.loop = null; f.flutter = false;            // the twirl is the flourish now
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
      let turn, spd;

      if (f.role === 'voyager' && f.state === 'drift') {
        // long cross-screen glide (steerVoyager). A dozing voyager falls
        // through to the local path below, so it settles in place like the rest.
        ({ turn, spd } = steerVoyager(f, dt));
      } else {
        // follow the designed path: advance the segment chain, easing the
        // real turn rate toward the segment's curvature (no kinks at joins)
        f.segT -= dt;
        if (f.segT <= 0) nextFlightSegment(f);
        const turnStep = 0.6 * dt;
        f.turnCur += Math.max(-turnStep, Math.min(turnStep, f.turnTarget - f.turnCur));
        turn = f.turnCur;
        spd = f.spd;

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
      // …keep a respectful bubble around the jar (its space, not theirs)…
      const jdx = f.x - jar.x, jdy = f.y - jar.y;
      const jd = Math.hypot(jdx, jdy), KEEP = jar.h * 1.05;
      if (jd < KEEP && f.state === 'drift') {
        steer(Math.atan2(jdy, jdx));
        const push = (1 - jd / KEEP) * 30 * dt;
        f.x += (jdx / (jd || 1)) * push; f.y += (jdy / (jd || 1)) * push;
      }
      // …and clear of the sound button's corner, so a child reaching for
      // a firefly never accidentally hits the toggle (or vice versa)
      const bdx = f.x - (W - 64), bdy = f.y - 64;
      const bd = Math.hypot(bdx, bdy), BKEEP = 175;
      if (bd < BKEEP && f.state === 'drift') {
        steer(Math.atan2(bdy, bdx));
        const push = (1 - bd / BKEEP) * 26 * dt;
        f.x += (bdx / (bd || 1)) * push; f.y += (bdy / (bd || 1)) * push;
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
  // Keep the night gently populated. Only DRIFTING fireflies count toward the
  // floor — ones already flying to the jar are on their way out, so a
  // replacement begins the instant a child taps, not after the catch lands
  // (which used to leave the sky briefly empty). The floor is held even during
  // the celebration so the sky never empties as a round ends; the slow trickle
  // up to the ceiling only runs in calm play.
  const active = fireflies.filter(f => f.state === 'drift' || f.state === 'sleepy').length;
  const deficit = FIREFLY_MIN - active;           // >0 when below the floor
  respawnCooldown -= dt;
  const trickle = !celebrating && Math.random() < 0.012;
  if (respawnCooldown <= 0 && active < FIREFLY_MAX && (deficit > 0 || trickle)) {
    spawnFirefly(true, deficit > 0);              // urgent refill enters at full size
    // stagger arrivals so several never pop in on the same beat: fast when the
    // sky is nearly empty, brisk below the floor, an unhurried trickle above it.
    respawnCooldown = deficit >= 3 ? 0.25 + Math.random() * 0.25
                    : deficit > 0  ? 0.6  + Math.random() * 0.4
                    :                2.2  + Math.random() * 1.5;
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

    // tap twirl: after the surprised front pose (SPIN_HOLD), a tapped firefly
    // turns once through ¾ → side → back → ¾ → front on its way to the jar,
    // landing front-facing. Dozing fireflies never spin (f.spin stays false).
    if (f.spin && f.state === 'travel') {
      const elapsed = f.t * f.travelDur;
      const rotWin  = Math.max(0.001, f.travelDur - SPIN_HOLD);
      const phase   = Math.min(1, Math.max(0, (elapsed - SPIN_HOLD) / rotWin));
      if (phase > 0) {
        const a = easeInOut(phase) * 360;         // one eased, unhurried rotation
        let pose = 'front', flip = false;
        if (a >= 30 && a < 75)        pose = 'threequarter';
        else if (a >= 75 && a < 150)  pose = 'side';
        else if (a >= 150 && a < 210) pose = 'back';
        else if (a >= 210 && a < 285) { pose = 'side'; flip = true; }
        else if (a >= 285 && a < 330) { pose = 'threequarter'; flip = true; }
        const simg = IMAGES[`spin_${f.variant}_${pose}`];
        if (simg && simg.complete && simg.naturalWidth) {
          const sh = size * SPIN_SCALE, sw = sh * (simg.naturalWidth / simg.naturalHeight);
          ctx.save();
          ctx.globalAlpha = fadeIn;
          ctx.translate(f.x, f.y + hover);
          if (flip) ctx.scale(-1, 1);
          ctx.drawImage(simg, -sw / 2, -sh / 2, sw, sh);
          ctx.restore();
          continue;                                // skip the normal sprite + face overlays
        }
      }
    }

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
