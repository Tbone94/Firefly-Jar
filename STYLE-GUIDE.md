# Firefly Jar — Style & Consistency Guide

**Purpose:** Every visual, motion, UI, and audio decision in this game must pass this guide.
It is derived from the supplied reference assets (`charsheet_firefly_primary.png`,
`concept_container.png`, jar/firefly/sparkle PNGs) and the assignment's design rules.
If a new asset or effect doesn't match a rule here, it doesn't ship.

---

## 1. World & Mood

- **Setting:** a quiet garden at night, seen from a child's eye level. Bushes and leaf
  silhouettes at the bottom edge, open night sky above (per concept sheet, middle-left panel).
- **Mood words:** bedtime, hush, wonder. **Never:** urgent, busy, flashy, spooky.
- The screen is a *place*, not an interface. No panels, cards, bars, or chrome.

## 2. Color — exact values, exact roles

| Role | Hex | Usage rules |
| --- | --- | --- |
| Night sky | `#2B3A67` | The only allowed page/canvas background. May darken toward edges via radial vignette (max −12% lightness). Never pure black anywhere. |
| Firefly glow | `#FFD166` | Glows, abdomen light, jar fill light. Always applied as soft radial gradient → transparent, never as a hard fill edge. |
| Leaves & grass | `#7BC47F` | Foreground foliage silhouettes only. Darken up to −20% for depth layers. |
| Accents | `#F4A6B7` | Sparkles, blush cheeks, pink firefly variant, rare highlights. Accent = garnish; never large areas. |
| Highlights & jar | `#FFF4E0` | Jar outline, wing edges, star/dot sparkles, ALL UI icons. |

- **Derived tints are allowed, new hues are not.** (Firefly body navy, wing grey-cream,
  teal variant come from the supplied sprites — use the sprites, don't repaint them.)
- No pure white `#FFFFFF`, no pure black `#000000`, ever.

## 3. Shape language

- Everything is **round**: blob bodies, capsule limbs, rounded-star sparkles. Zero sharp
  corners; minimum corner radius on any drawn shape ≈ 25% of its short side.
- **No outlines on characters** (fireflies are flat shapes + soft shading). The **jar is the
  one outlined object** — thick cream `#FFF4E0` stroke, like the supplied PNG.
- No photorealism, no textures, no gradients steeper than a gentle two-stop fade.

## 4. Glow rules (the signature of the game)

- Glow = stacked radial gradients (`#FFD166` core → transparent), drawn additively
  (`lighter` composite). Never a hard-edged circle, never a CSS box-shadow look.
- Firefly glow radius ≈ 1.6–2.2× the abdomen size. It **breathes**: sinusoidal pulse,
  period 2.5–4 s per firefly, phase-offset so they never pulse in sync.
- Jar brightness is the game's progress bar: 4 reference states from the concept sheet
  (empty → half → glowing full → glowing + sparkles). Brightness increases smoothly with
  each catch; it never jumps or flickers.
- **Nothing ever strobes or flashes.** Max luminance change: full range over ≥ 600 ms.
- **Sensory safety (neurodivergent-friendly, non-negotiable):** the full jar is a cozy
  lantern, never a floodlight — peak glow alphas are capped and ramp sub-linearly so no
  single catch causes a large luminance jump. Caught fireflies stay **individual,
  countable colored lights** (predictable, tally-able) rather than merging into one
  shifting blob. Celebration light swells slowly and stays localized to the jar; the
  screen never flashes as a whole.

## 5. Motion rules

- All movement is **eased, drifting, floaty**. Ambient flight follows **designed
  constant-curvature segments** — gentle glides, big rounded arcs, U-turns,
  occasional S-curves and loop-de-loops. Constant turn = perfect circle pieces:
  paths a young child's eye can track and predict. Turn rate eases between
  segments; no jitter, no sudden direction changes.
- Speed caps: ambient drift ≤ ~40 px/s (on a 1280-wide field); travel-to-jar ≤ ~300 px/s
  with ease-in-out, arcing path (never a beeline).
- Response to touch is **immediate but soft**: the tapped firefly reacts within 1 frame
  (glow bloom + tiny squash) so cause-and-effect is obvious, then floats jar-ward.
- Celebration lasts 3–5 s, then settles. It's a warm swell, not an explosion.
- Idle screen must still be alive (drift, pulse, twinkle) — but calm enough to fall asleep to.

## 6. UI / UX rules (pre-reader contract)

- **Zero text in the play experience.** No numbers, no labels, no "Score". Progress is
  physical: fireflies visibly inside the jar + jar brightness.
- **Touch targets ≥ 120 CSS px** on the shortest side. The firefly hit area is a generous
  invisible circle around the sprite (~1.8× visual size) — a chubby 4-year-old finger that
  lands *near* a firefly hits it. Misses do nothing bad; taps on empty sky produce a tiny
  harmless twinkle so every touch gets an answer.
- Any button (e.g. sound toggle) is icon-only, `#FFF4E0`, tucked in a corner, ≥ 88 px,
  and does nothing destructive. There is no pause, no menu, no settings screen for the child.
- Works identically with mouse and touch (pointer events). No hover-dependent behavior.
- **Teach by demonstration, never instruction:** if the screen is untouched for a while,
  one firefly at a time gets sleepy (closed-eye face from the charsheet) and slowly drifts
  into the jar — the game quietly shows a watching child what to do, and will even finish
  the round by itself. Any touch wakes the night back up.
- **Faces carry the feedback:** expressions come from the charsheet — happy (default),
  surprised "oh!" on tap (held ~1 s so it's visible after the finger lifts), sleepy while
  dozing. Expressions are code overlays on the base sprites, anchored to measured face
  landmarks.
- No modal states: the game is always playable, always resumable, never blocked.

## 7. Audio rules

- Palette: soft chimes / music-box / kalimba tones. **Pentatonic only** (C–D–E–G–A) so any
  sequence of notes is consonant. Tempo feel: lullaby (~60–70 BPM equivalents).
- Catch feedback: one soft note, short attack, long gentle decay. Celebration: a small
  rising arpeggio of the same voice — a musical smile, not a fanfare.
- No percussion, no harsh transients, no looped background music louder than a whisper.
  Default volume low; sound never *required* to play (all information also exists visually).

## 8. Asset usage map

| Supplied file | Use |
| --- | --- |
| `firefly_yellow.png` | Default firefly (most spawns) |
| `firefly_pink.png` / `firefly_green_teal.png` | Occasional variants for variety (and available for the added mechanic) |
| `firefly_jar_empty.png` | The jar, center-bottom on grass. Glow + caught fireflies rendered behind/inside it in code |
| `celebration_sparkle_burst.png` | **Shape/color reference only** (dark bg baked in). Celebration = code particles: rounded 4-point stars, 5-point stars, dots in `#FFF4E0` / `#F4A6B7` / `#FFD166` |
| `charsheet_firefly_primary.png` | Canon for poses, expressions, materials. Expressions available: happy, surprised, sleepy |
| `concept_container.png` | Canon for scene layout, jar fill states, glow treatment |

## 9. Generating any NEW asset (AI pipeline rule)

New art must be generated **with the supplied references attached** as style anchors, using
this prompt template (Gemini / any image model):

> Using the attached character sheet and concept art as the exact style reference: flat,
> rounded kawaii shapes, no hard edges, no outlines except cream `#FFF4E0` on glass objects,
> soft radial glows, palette strictly limited to `#2B3A67` night sky, `#FFD166` glow,
> `#7BC47F` foliage, `#F4A6B7` accents, `#FFF4E0` highlights. Subject: [ASSET].
> Isolated on transparent background, no labels, no panels, single object, soft top-left key
> light consistent with a glowing jar below.

Then verify against sections 2–3 before use (palette-pick the output; off-palette = regenerate).

## 10. The five laws (tape this to the monitor)

1. Nothing is fast. 2. Nothing is sharp. 3. Nothing punishes. 4. Nothing needs words.
5. Everything glows softly or not at all.
