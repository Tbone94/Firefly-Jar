# Firefly Jar — Process Log

Raw and in order. The sessions below are the honest build history; this header
summarizes the three things the brief asks for directly.

## Tools used, and why

- **Claude (Claude Code)** — the primary tool for everything: design research, the
  style guide, all game code, and (unusually) *verification*: it drove the game in a
  browser, took screenshots, pixel-sampled the canvas to prove rendering claims, and
  ran simulated 1–2 minute flights to tune speeds/loops from measurements instead of
  guesses. Working conversationally meant every feel change was a playtest note, not a
  spec rewrite.
- **Python / Pillow** — measured the supplied sprites (eye/mouth landmark coordinates,
  body colors) so the sleepy/surprised expression overlays anchor to real pixels, and
  cropped/enlarged the concept sheet's garden panel to art-direct the background from
  the actual reference.
- **WebAudio (synthesized sound, no files)** — pentatonic chimes generated in code.
  Why: zero asset pipeline, always-consonant notes, and tuning dynamics is a
  one-line change.
- **Astra (Codex)** — independent code review pass (bugs, structure, dead code) against
  a written brief (REVIEW-BRIEF.md), so the reviewer wasn't the author.
- **No image-generation tools** — a deliberate cut. The supplied art covered every
  gameplay need; generated additions risked style drift for zero gameplay value. (The
  style guide still carries a reference-anchored prompt template for future art.)

## Key prompts, verbatim

My direction to the AI, unedited (these steered the whole build):

- "do research first on what kind of mechanic would be most benefical to this this
  remmebr to keep it small they want to see my design judggemnt not scale"
- "is this a design mechanic that a child will pick up on though?"
- "i just feel like this is to big of a mechanic choice that impacts the overal game
  the examples they gave were very small"
- "we need to design strict guidlines for consistancy in design and style. using the
  character refernces we were given an establish a theme guidline"
- "make sure this is neurivegent/autistic child friedly too"
- "when untouched for a while the firflies should show the sleepy face, and slowly
  drift down into the jar… shows the kid what they are supposed to do"
- "the surprise face should be used when they are tapped, with enough time to see the
  face after you press it with your finger"
- "more of a soft, flowing glid/flutter around the screen and cn use more space on
  their flight patterns"
- "flight paths should be more intentional, dont go too close to the jar… some flight
  paths can have the flirlfies do a loop"
- "the review also needs to flag desd code and safely remove it without affecting
  anything functinal"

(The AI's own working prompts to sub-tools — pixel scans, flight simulations, the
review scope — are recorded in the sessions below and in REVIEW-BRIEF.md.)

## Rough time split (~3h30m of the 4h cap)

- ~25% — design research, mechanic debate, style guide (before any code)
- ~45% — build + fix cycles (core loop, garden, jar, expressions, idle mode)
- ~15% — playtest-driven feel tuning (glow, flight, spawns, variety)
- ~15% — handoff: restructure to modules, README, review brief, this write-up

## Session 1 — assignment intake → playable v1 core loop (~1h15m)

**1. Intake.** Pulled the brief + 7 assets from the Drive folder with Claude connected to
Drive/browser. Had Claude summarize the spec and inspect every reference image before
any decisions.

**2. Mechanic debate (design judgment on record).**
- Claude's first proposal: a "Shy Firefly" (hold still near it to coax it out — safe-friction
  patience mechanic). I pushed back twice:
  - *"is this a design mechanic that a child will pick up on though?"* → surfaced a real
    discoverability problem for pre-readers; Claude proposed self-teaching layers.
  - *"i just feel like this is too big of a mechanic choice that impacts the overall game —
    the examples they gave were very small."* → decisive. Their examples (sleepy owl,
    color-change) are one-object, zero-new-input flourishes. A mechanic needing three
    mitigation layers is over-scoped for a 2–4h build. **Cut it.**
- Decision: build the core loop first, playtest, then choose an owl-sized mechanic from
  real feel. Candidates parked: lullaby jar (pentatonic note per catch), goodnight release.

**3. Research before deciding** (my instruction: "do research first"). Looked at nurture's
own product philosophy (active choices, "safe friction", empathy/curiosity skills, no
addictive mechanics) and preschool interaction research (Sago Mini/Toca Boca school:
demonstration over instruction, generous touch targets, calm sensory pacing).

**4. Style guide before code** (my instruction). Wrote `STYLE-GUIDE.md` from the supplied
charsheet + concept sheet: exact palette roles, shape language, glow rules, motion caps,
pre-reader UI contract, audio rules, and a prompt template so any future AI-generated
asset is anchored to the supplied references.

**5. Built v1** (single-file canvas, plain JS, no engine — right size for a one-screen game;
an engine would be scaffolding overhead inside a 4h cap). Core loop per spec: 5 drifting
fireflies (sine-noise wander, phase-offset glow pulses), tap → arcing eased float into the
jar, jar brightens per catch, celebration at 10, reset. WebAudio pentatonic chimes.

**Where the AI got it wrong (and how it was caught):**
- **Zero-viewport spawn bug.** All 5 fireflies spawned in a 60px corner: the script seeded
  positions at load, when an embedded tab reported 0×0. Caught by screenshot + state dump;
  fixed by seeding on the first frame with a real viewport.
- **Sparkle asset misread.** The supplied `celebration_sparkle_burst.png` has a dark
  background baked in despite RGBA. Decision: use it as a shape/color reference only and
  draw celebration sparkles as code particles (also makes them animatable).
- **Jar glow too timid.** First implementation of the 9/10 jar was a faint smear, and mixing
  the colored firefly tints inside the jar went greenish — nothing like the concept sheet's
  warm lantern. Corrected to three stacked warm glow layers + warm-only jar lights.

**Verification:** driven in-browser by Claude (screenshots, console, state inspection,
simulated frame-pumping to preview the 9/10 state and celebration without playing 10 taps).

**Time so far:** ≈ 30m of actual working time (intake + research + mechanic debate +
style guide + v1 build/fix ran largely hands-off while I reviewed at checkpoints).

**6. Deliberate cut: 3D.** Considered a Gemini→Meshy image-to-3D pipeline (nurture's other
games are 3D). Re-read the brief: "Flat, rounded shapes… no photorealism," and the supplied
PNGs are described as *the* visual assets for the game. Staying 2D is spec fidelity, not a
shortcut; 3D would spend the time budget fighting the stated style.

## Session 2 — playtest round 1 → feel fixes (~20m)

**My playtest feedback (verbatim):** flight to jar too uniform — wants "a slight flutter
or loop, not every time, occasional"; jar brightness "kind of peaks at one point"; wants
to "see the individual fireflies' colors as dots floating around" the jar; full glow
"feels a little much"; and "make sure this is neurodivergent/autistic child friendly."

**Changes:**
- Flight flourishes: ~1/3 of catches do one lazy loop-de-loop, ~1/5 a soft flutter, the
  rest a plain arc — occasional delight without breaking predictability. Offsets envelope
  to zero at both ends so every flight still lands exactly on the jar mouth.
- Jar rework: each caught firefly is now its own small colored light + pip (countable),
  brightness ramps sub-linearly across all 10 catches, peak luminance capped (lantern,
  not floodlight), celebration swell slowed and localized. Sensory-safety rules added to
  the style guide §4.

**Where the AI got it wrong this round:**
- First "even spread" used golden-angle trig that resonated with a ×1.3 frequency
  (2.4 × 1.3 ≈ π) — all nine lights collapsed into one straight line. Caught via a state
  dump; replaced with low-discrepancy slot fractions.
- Lights anchored at the jar image's center — but the glass body sits lower in the PNG
  (the tilted lid takes the top of the frame), so lights floated at the neck. Fixed with
  a glass-body anchor.
- The transparent glass let the green bushes tint the warm glow → added a night-sky
  backing ellipse inside the glass; first placed it over the glow (killing it), then
  reordered backing → glow → lights → jar art.
- First luminance cut overshot (9/10 barely glowed); re-tuned to a middle level.

## Session 3 — garden background pass + jar scale (~15m)

**My feedback:** background should match the concept sheet's detailed garden "without
being distracting for the child"; and (mid-build) the firefly-to-jar size ratio felt off —
make the jar bigger.

**Approach:** cropped and enlarged the garden panel from `concept_container.png` to work
from the actual reference, not memory. Rebuilt the background procedurally (seeded RNG, so
the garden is the identical calm place every launch): dark treeline → dark bushes rising
at the sides and dipping to a center clearing → lit grass mound → blade tufts → framing
leaf fronds → 7 tiny warm glow motes breathing in the greenery. All detail sits at the
edges and bottom; the upper sky stays clean because that's where the fireflies fly —
richness without competition for attention. Static layers prerender once per resize.
Jar scaled up to the biggest object on screen; fireflies slightly down.

**Where the AI got it wrong this round:**
- First frond attempt: leaflets overlapped the stem and merged into lumpy "seaweed"
  stalks that intruded into the play space. Rewrote with thin stems, smaller separated
  leaves, shorter lengths.
- Clearing blades were tall and dark — read as spiky teeth around the jar. Shortened
  and lightened.
- Glow motes had near-white cores. Warmed and dimmed.
- Chased a "missing jar dots" ghost after the background change — pixel-sampled the
  canvas and proved all five dots were rendering at exact palette values; they were just
  illegible at the tiny embedded-preview scale. Lesson: verify with data before "fixing"
  something that isn't broken.

## Session 4 — jar life pass (~10m)

**My feedback:** jar fireflies should glow slightly more and move around more; add a
little light pulse at half-full; jar needs a bit more glow overall (post-resize).

**Changes:** jar lights got bigger glows (+ alpha) and a two-sine slow meander around
their slots instead of a small bob; a one-time 1.8 s halfway swell (plus a soft two-note
chime) marks 5/10; all three lantern layers brightened one step.

**Verification note (AI environment quirk, not a game bug):** the embedded preview tab
reloads itself between automation steps, which faked a "the dots disappeared!" regression.
Proved the code was fine by seeding state, drawing, and pixel-sampling in one atomic step:
all nine dots at exact palette values, glass interior (200,190,169) vs sky (79,87,115).

## Session 5 — idle attract mode + expressions + proportions (~25m)

**My feedback:** untouched for a while → fireflies show the sleepy face and drift down
into the jar one at a time, "shows the kid what they are supposed to do", eventually
completing the round on its own; resize the jar to stay proportional on fullscreen;
space the fireflies out, add a bit of flutter, stop them stacking on each other. Then:
use the charsheet's surprised face on tap, held long enough to see after the finger lifts.

**Changes:**
- Idle attract mode: after ~9 s untouched, one random firefly dozes off (eyes close over
  ~1 s, wander slows, it sinks a little) then floats down into the jar on a slow swaying
  descent; another follows every 5–9 s while the screen stays untouched, so the game
  demonstrates itself and even completes the round. Any touch resets the idle clock, and
  tapping a dozing firefly wakes it into a normal catch. Classic pre-reader onboarding:
  demonstration, not instruction.
- Expressions from the charsheet as code overlays: measured the sprite's face landmarks
  with a pixel scan (eyes at ~(324,528)/(418,515), mouth at (368,550), body navy
  rgb(84,98,132)), then draw closed-eye arcs (sleepy) or an o-mouth (surprised, 1.1 s
  with a fade so it survives the finger occlusion moment).
- Jar capped at 330 px so it stays proportional to the fixed-size fireflies on big
  fullscreens instead of growing with the window.
- Firefly spacing: initial spawns keep ≥170 px apart; drifting fireflies gently push
  apart under 160 px so they stop stacking; added a soft visual hover-flutter and sway.

**Verified:** doze → closed-eye face → slow descent → jar arrival (+1 light, soft note)
confirmed by state dump and screenshots; surprised o-mouth confirmed visually.

## Session 6 — color variety (~5m)

**My feedback:** distribution felt weighted toward yellow. Rebalanced spawns from
70/15/15 to 40/30/30 (yellow stays the gentle default) with a never-three-alike-in-a-row
guard. Verified with a 3 000-draw simulation: 37% / 31% / 31.5%, max streak 2.

## Session 7 — flight feel (~10m)

**My feedback:** floating speed a bit much; vary speeds between fireflies (nothing
faster than current, slightly less overall); softer flowing glide; use more of the
screen in flight patterns.

**Changes:** base speeds lowered and widened (7–23 px/s), wave frequencies made lazier,
a per-firefly "energy" factor so some amble while others barely float, and a new
very-slow vertical roaming wave so each firefly wanders the whole sky over time instead
of holding one altitude. Verified with a 60-second simulated flight: average speeds
20–27 px/s (down from ~30–44) and vertical coverage 206–334 px per firefly (previously
±~15 px around spawn height).

## Session 8 — intentional flight (~15m)

**My feedback:** flight paths should be more intentional; keep a limit around the jar;
some ambient loop-de-loops for fun; movement "almost feels too bouncy and not smooth
enough, but still need a slight flutter."

**Changes:** replaced the summed-sine wander (the source of the bounce) with a
heading-based steering model — each firefly flies a direction that turns smoothly, giving
long winding glides; kept the small visual hover-flutter on top. Added a soft keep-out
bubble around the jar (steer away + gentle push), smooth edge steering instead of hard
turnarounds, wing-facing hysteresis so loops don't flip-flap the sprite, and occasional
ambient loop-de-loops (~every 20–50 s per firefly, with an eased speed swell so the loop
draws a visible circle).

**Tuning from simulation, not guesswork:** a 2-minute simulated flight showed loops
firing every ~5 s somewhere on screen (too circus-y → spaced to ~8.5 s) and turn rate
tight enough to linger in small circles (→ loosened; fireflies now traverse ~70% of
screen width). Jar bubble verified: closest drift approach 203 px against a 227 px soft
radius.

## Session 9 — spawn variety (~10m)

**My feedback:** fireflies should also drop in from the top, and occasionally appear
"from the distance" (small, growing closer) — because they fly slowly, a fast tapper can
empty the sky and get stuck waiting on side entries. Smooth, not distracting, consistent
with the rules.

**Changes:** three entry modes for replacements — side drift (40%), float down from the
top (35%), and a "from the distance" approach (25%): the firefly fades in small (30%
scale) in the open sky and grows smoothly to full size over ~4.5 s, spawning clear of
the jar bubble and other fireflies. Approaching fireflies are still tappable (and keep
growing mid-flight if caught early); the idle sleepy-picker ignores them until they've
fully arrived.

## Session 10 — handoff restructure + review prep (~25m)

**My ask:** a code review by Astra (Codex) — bugs/issues, structure/legibility for a
human, and dead code flagged + safely removed. Research the industry standard for code
organization for handing off a project.

**Research:** modern JS handoff standards converge on separation of concerns into
modules, a predictable folder layout, consistent naming, comments that explain
constraints, and a README that maps the architecture at a glance.

**Changes:**
- Renamed `build/` → `site/` (there is no build step — the folder is the source, and
  "build" tells a reviewer "generated, don't edit").
- Split the single ~1,000-line file into 10 per-system modules (`config` / `core` /
  `assets` / `audio` / `sparkles` / `garden` / `jar` / `fireflies` / `ui` / `main`),
  each with a header stating its purpose and what state it owns; classic scripts in
  dependency order, no tooling added on purpose (open-and-run + Netlify Drop stay).
- All tuning constants and palette values consolidated into `js/config.js`.
- `README.md` with run instructions, project map, and a 60-second systems tour.
- `REVIEW-BRIEF.md` scoping Astra's three passes: bugs (with specific suspect areas),
  structure judged as a stranger, and dead-code flag-then-remove-safely rules.
- First dead code removed during the split: the `loaded` counter in `assets.js`
  (incremented, never read).
- Project put under git (initial commit) so Astra's review lands as a diff.
- Verified the restructured game behaves identically (console clean, catch → jar →
  lights, state dump correct).

## Session 11 — independent review lands + packaging (~15m)

Astra (Codex) completed the review against REVIEW-BRIEF.md. Results (full detail in
REVIEW-REPORT.md): **4 bugs fixed** — a P1 where extra arrivals could overfill the jar
and restart the celebration repeatedly; audio failures that could interrupt input or
the frame loop; mute leaving already-scheduled notes audible; a resize listener that
registered before dependent modules loaded. **3 dead-code removals**, each verified
individually. **6 items correctly flagged instead of changed** because they'd alter
feel (spawn-rate frame dependence, speed-cap semantics, mid-resize travel rebasing,
naming improvements, config centralization inventory). It also left a 15-test
regression suite (`node --test tests/review.cjs`) with zero dependencies — which I
re-ran independently: 15/15.

Delivery decision: zip instead of hosting (the brief explicitly allows it; no
hosting spend). Final artifacts: `firefly-jar-GAME.zip` (open index.html and play)
and `firefly-jar-SOURCE.zip` (full project: code, tests, all write-ups).

## Open items
- Playtest v1 on tablet → choose the added mechanic (lullaby jar vs goodnight release vs
  something the playtest reveals).
- Possible extra art (background foliage pass) via the style-guide §9 prompt template.
- Hosting + final write-up (design note).
