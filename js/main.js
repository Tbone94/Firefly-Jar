'use strict';

/* ============================================================
   main.js — the game loop. Loads last; everything it calls is
   defined by the modules before it (see index.html for order).
   Owns: seeded, the frame clock.
   ============================================================ */

let last = performance.now();
let seeded = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);   // clamp: tab-throttle safe
  last = now;
  time += dt;

  // Seed the initial population on the first frame with a real viewport
  // (a hidden/embedded tab can report 0×0 at script-eval time).
  if (!seeded && W > 100 && H > 100) {
    seeded = true;
    for (let i = 0; i < FIREFLY_MAX; i++) spawnFirefly(false);
  }

  if (seeded) updateIdle(dt);    // sleepy attract mode (fireflies.js)
  updateFireflies(dt);
  updateSparkles(dt);
  updateCelebration(dt);

  drawBackground();
  drawJar(dt);
  drawFireflies();
  drawSparkles();
  drawSoundButton();

  requestAnimationFrame(frame);
}

// Register only after jar.js and garden.js have initialized their state.
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
