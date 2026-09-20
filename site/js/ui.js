'use strict';

/* ============================================================
   ui.js — the one button (icon-only sound toggle) and pointer
   input. Touch and mouse are identical via pointer events;
   there are no menus, no text, no modal states (STYLE-GUIDE §6).
   Owns: soundBtn.
   ============================================================ */

const soundBtn = { x: 0, y: 0, r: 44 };

function drawSoundButton() {
  soundBtn.x = W - 64; soundBtn.y = 64;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = PALETTE.cream; ctx.fillStyle = PALETTE.cream;
  ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const { x, y } = soundBtn;
  // rounded speaker body
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 6); ctx.lineTo(x - 8, y - 6); ctx.lineTo(x + 2, y - 14);
  ctx.lineTo(x + 2, y + 14); ctx.lineTo(x - 8, y + 6); ctx.lineTo(x - 16, y + 6);
  ctx.closePath(); ctx.fill();
  if (soundOn) {
    ctx.beginPath(); ctx.arc(x + 8, y, 8, -Math.PI/3, Math.PI/3); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 8, y, 14, -Math.PI/3, Math.PI/3); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x + 20, y + 8);
    ctx.moveTo(x + 20, y - 8); ctx.lineTo(x + 8, y + 8); ctx.stroke();
  }
  ctx.restore();
}

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();                            // audio needs a user gesture
  idleTime = 0; nextSleepAt = IDLE_START;   // any touch wakes the night up
  const x = e.clientX, y = e.clientY;

  if (Math.hypot(x - soundBtn.x, y - soundBtn.y) < soundBtn.r) {
    soundOn = !soundOn;
    if (soundOn) chime(PENTA[4], 0, 0.1, 0.8);
    return;
  }

  // nearest tappable firefly within the generous hit circle
  let best = null, bestD = HIT_RADIUS;
  for (const f of fireflies) {
    if (f.state !== 'drift' && f.state !== 'sleepy') continue;
    const d = Math.hypot(f.x - x, f.y - y);
    if (d < bestD) { best = f; bestD = d; }
  }
  if (best) tapFirefly(best);
  else tapTwinkle(x, y);          // every touch gets a gentle answer
});
