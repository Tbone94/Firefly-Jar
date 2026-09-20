'use strict';

/* ============================================================
   assets.js — sprite loading.
   Owns: IMAGES (keyed by name). Draw code checks .complete
   before use, so the game starts immediately and sprites pop
   in as they load (in practice: instantly, they're local).
   ============================================================ */

const IMAGES = {};
const SPRITES = [
  ['yellow', 'assets/firefly_yellow.png'],
  ['pink',   'assets/firefly_pink.png'],
  ['teal',   'assets/firefly_green_teal.png'],
  ['jar',    'assets/firefly_jar_empty.png'],
];

for (const [key, src] of SPRITES) {
  const img = new Image();
  img.src = src;
  IMAGES[key] = img;
}
