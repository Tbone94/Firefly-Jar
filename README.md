# Firefly Jar

A gentle one-screen browser game for children aged 4–7, built for the nurture
take-home assignment. At night in a garden, fireflies drift around; the child
taps them to guide them into a glass jar. At 10 fireflies the jar glows and a
small celebration plays, then the night begins again. No fail states, no
reading, no timers.

Plain JavaScript + canvas. **No build step, no dependencies** — the `site/`
folder is the complete, deployable game.

## Run it

- Open `site/index.html` in a browser, or serve the folder:

  ```
  python3 -m http.server 8000 --directory site
  ```

- Deploy: drag a zip of `site/` onto Netlify Drop (or any static host).

Works with touch on tablets and mouse on desktop (pointer events; identical
behavior). Sound is synthesized in-code — no audio files — and starts on the
first touch (browser autoplay rules).

## Project map

```
site/                  the deployable game (this folder IS the source)
  index.html           markup + script load order
  css/style.css        page chrome (fullscreen canvas, night background)
  js/
    config.js          ALL tuning constants, palette, sprite metrics — start here
    core.js            canvas, resize, shared helpers (glow cache, easing, RNG)
    assets.js          sprite loading
    audio.js           WebAudio pentatonic chimes
    sparkles.js        celebration + tap-twinkle particles
    garden.js          night-garden background (custom art over a prerendered base)
    jar.js             jar layout, lights inside, lantern glow, round lifecycle
    fireflies.js       spawning, flight model, expressions, idle attract mode
    ui.js              sound toggle + pointer input
    main.js            game loop (loads last, boots everything)
  assets/              supplied art (fireflies ×3, jar) + custom/ scenery
assets/                full supplied reference set (charsheet, concept, sparkle)
STYLE-GUIDE.md         the design contract every visual/motion/audio choice obeys
DESIGN-NOTE.md         the added mechanic, the roadmap, the deliberate cuts
PROCESS-LOG.md         honest build log: prompts, Claude's mistakes, corrections, time
REVIEW-BRIEF.md        scope + rules for the independent code review
REVIEW-REPORT.md       what the review found, fixed, and flagged
tests/review.cjs       15-test regression suite (node --test tests/review.cjs)
```

Scripts are classic (non-module) and share one global scope; `index.html`
loads them in dependency order, and each file's header comment says what state
it owns. `js/config.js` is the tuning surface — game-feel changes start there.

## How it works (60-second tour)

- **Flight** (`fireflies.js`): heading-based steering — each firefly has a
  direction that turns smoothly (no jitter), with edge steering, a keep-out
  bubble around the jar, gentle pairwise separation, and occasional
  loop-de-loops. Most fireflies drift locally; one or two travel the full width
  of the sky in long, mostly-horizontal passes (swooping around at the edges,
  within the same speed cap) so a child can track a friend crossing the screen.
  Three spawn entries: side drift, top drop-in, and a "from the distance"
  approach that grows from small to full size.
- **Population**: only drifting fireflies count toward a floor (4) and ceiling
  (6), so tapping them all never leaves the sky empty and it never becomes a
  swarm; refills are staggered — quick when the sky is nearly bare, an unhurried
  trickle otherwise.
- **Catching**: tap → surprised "oh!" face → one gentle twirl through the
  character-sheet turnaround (side/back views) as it eased-arcs to the jar → a
  soft pentatonic chime → the firefly becomes a countable colored light inside
  the glass.
- **Jar** (`jar.js`): brightness ramps sub-linearly across all 10 catches,
  capped so the full jar is a cozy lantern, never a floodlight
  (neurodivergent-friendly). One gentle pulse marks the halfway point.
- **Idle attract mode**: untouched for ~9 s, fireflies doze off one at a time
  (charsheet's sleepy face) and drift into the jar — demonstrating the game to
  a watching child without a single word of instruction.
- **Expressions**: sleepy and surprised faces are code overlays anchored to
  pixel-measured landmarks on the supplied sprites (`config.js`).

## Design contract

`STYLE-GUIDE.md` is normative: exact palette roles, shape language, glow and
motion caps, the pre-reader UI contract (no text anywhere, ≥110 px hit
circles, every touch gets an answer), sensory-safety rules, and the prompt
template for generating any new art against the supplied references.
