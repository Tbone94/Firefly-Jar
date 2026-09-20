'use strict';

/* ============================================================
   config.js — every tuning constant and color in one place.
   Change game feel here first; the other modules only read
   these values. Palette hexes are the assignment's spec and
   must not drift (STYLE-GUIDE §2).
   ============================================================ */

/* ---------- palette (assignment spec — exact values) ---------- */

const PALETTE = {
  sky:   '#2B3A67',   // night sky — the only allowed background
  glow:  '#FFD166',   // firefly glow
  leaf:  '#7BC47F',   // leaves and grass
  accent:'#F4A6B7',   // sparkles, blush, pink variant
  cream: '#FFF4E0',   // highlights, jar outline, UI icons
};

// Garden depth layers — derived tints of the palette (STYLE-GUIDE §2
// allows derived tints, never new hues).
const GARDEN = {
  treeline: '#22304f',    // sky-tinted near-dark silhouettes
  bushDark: '#33523f',
  bushMid:  '#456e4d',
  grass:    '#6fb774',    // leaves-and-grass, slightly muted for night
  grassLit: '#7BC47F',
  frond:    '#5f9d64',
  frondDark:'#2a4536',
};

// Glow tint per firefly variant (abdomen colors from the sprites),
// as [r, g, b] for building radial gradients.
const GLOW_TINT = {
  yellow: [255, 209, 102],   // #FFD166
  pink:   [244, 166, 183],   // #F4A6B7
  teal:   [123, 196, 127],   // #7BC47F
};

/* ---------- gameplay tuning ---------- */

const JAR_CAPACITY   = 10;    // catches per round (assignment spec)
const AMBIENT_COUNT  = 5;     // fireflies drifting at once
const HIT_RADIUS     = 110;   // generous child-finger hit circle (CSS px)
const IDLE_START     = 9;     // seconds untouched before the first sleepy doze
const HALF_PULSE_DUR = 1.8;   // halfway-milestone glow swell (s); slow, no flash

/* ---------- sprite metrics (measured, in source-PNG pixels) ---------- */

// The character occupies the middle of each source PNG.
const SPRITE_BOX = { sx: 150, sy: 280, sw: 600, sh: 620 };
// Face landmarks — all variants share the pose, so one set serves all.
// Used to draw the sleepy / surprised expression overlays.
const EYES  = { lx: 324, ly: 528, rx: 418, ry: 515 };
const MOUTH = { x: 368, y: 550 };
const BODY_NAVY = 'rgb(84,98,132)';   // sampled body color (patches over features)
const FACE_DARK = 'rgb(43,53,84)';    // eye/mouth line color
