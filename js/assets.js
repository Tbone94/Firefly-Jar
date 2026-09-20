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
  // custom scenery, generated against the style-guide references
  // (backgrounds keyed out; foliage night-tinted to sit in the palette)
  ['moon',        'assets/custom/moon.png'],
  ['cloudA',      'assets/custom/cloud_a.png'],
  ['cloudB',      'assets/custom/cloud_b.png'],
  ['cloudC',      'assets/custom/cloud_c.png'],
  ['flowers',     'assets/custom/flowers.png'],
  ['foliageFront','assets/custom/foliage_front.png'],
  ['bushesFar',   'assets/custom/bushes_far.png'],
];

for (const [key, src] of SPRITES) {
  const img = new Image();
  img.src = src;
  IMAGES[key] = img;
}
