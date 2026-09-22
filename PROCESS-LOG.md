# Firefly Jar — Process Log

I directed; Claude executed and verified under that direction. Raw and in order,
organized by the four things you asked for.

## Which tools I used, and why

- **Claude (Claude Code)** — the primary tool for everything: design research,
  the style guide, all game code, and verification. Claude Fable for the build,
  Claude Opus 4.8 for the final polish pass.
- **Python / Pillow** — measured the supplied sprites (eye/mouth landmarks, body
  colors) so the expression overlays anchor to real pixels; cropped and enlarged
  the concept sheet's garden panel to art-direct the background from the actual
  reference; extracted the charsheet turnaround for the tap-twirl frames.
- **Gemini** — my own scenery art (moon, clouds, flowers, foliage strips),
  generated under the style guide's reference-anchored prompt rules.
- **WebAudio** — pentatonic chimes synthesized in code; no audio files.
- **Astra (Codex)** — independent code review against a written scope
  (REVIEW-BRIEF.md).

## Key prompts, verbatim

My direction to Claude, unedited — these steered the whole build:

- "do research first on what kind of mechanic would be most beneficial to this this
  remember to keep the example mechanics small"
- "does this fit the established guidelines for children ages 4-7?"
- "we need to design strict guidelines for consistency in design and style. using the
  character references given and establish a theme guideline"
- "make sure this is neurodivergent/autistic child friendly too based on prior research"
- "when untouched for a while the fireflies should show the sleepy face, and slowly
  drift down into the jar… shows the kid what they are supposed to do"
- "the surprise face should be used when they are tapped, with enough time to see the
  face after you press it with your finger"
- "more of a soft, flowing glide/flutter around the screen and can use more space on
  their flight patterns"
- "flight paths should be more intentional, don't go too close to the jar… some flight
  paths can have the fireflies do a loop"
- "the review also needs to flag dead code and safely remove it without affecting
  anything functional"
- "theres should never be a moment where the screen is empty… ensure it is not
  chaotic and follow the guidlines of being calm"
- "it still just looks more like they are bouncing/floating on screen instead of
  gently passing across screen does that make sense?"
- "id like to add a little animation to the fireflies when you tap them… the
  reference drawings show full body side and back, can we add a cohesive little
  spin? would that still fit the guidelines as well as not be too chaotic/frantic
  or overwhelming for children 4-7?"

## Where the AI got it wrong, and how I corrected it

- Fireflies once spawned bunched in a corner — a zero-size-viewport edge case;
  fixed and verified.
- The supplied sparkle PNG turned out to have its background baked in — I
  approved switching celebration sparkles to code-drawn particles.
- The jar's inner lights collapsed into a straight line (a trig resonance) —
  caught with a state dump, replaced with a cleaner placement scheme.
- The first jar glow was nothing like the concept sheet's warm lantern — I
  pushed it through three rounds until it matched.
- First-draft fronds read as "seaweed" — rewritten.
- Gemini exported "transparent" art with the checkerboard baked into the pixels
  — I had the moon and clouds regenerated on solid navy that keys cleanly.
- The "sky sometimes empties" bug: Claude's first fix looked right, so I made it
  prove it — a headless simulation playing 90 seconds at different tapping
  speeds caught two real misses (the floor still emptied during the celebration,
  and refills lagged under fast tapping). Both fixed, re-measured: normal play
  never empties.
- Claude's first cross-screen fliers still read as "floating." I said so in
  plain words; the fix was making them commit to a direction — full-width
  passes with one wide swoop-turn at each edge, inside the calm speed cap.

Every fix was verified before moving on: canvas pixel sampling, simulated
multi-minute flights, a 3,000-draw color-distribution check, and a 15-test
regression suite (`node --test tests/review.cjs`).

## Rough time split (~3h 15m of the 4h cap)

- ~35% — design research, mechanic debate, style guide (before any code)
- ~30% — build + fix cycles (core loop, garden, jar, expressions, idle mode)
- ~25% — playtest-driven feel tuning (glow, flight, spawns, variety)
- ~10% — handoff: modules, README, review brief, this write-up
- plus one later ~30m playtest-polish pass (below)

## How the build went, briefly

**Design first (~1h).** Pulled the brief and all seven reference assets and had
Claude inventory every image before any decisions. Two rules up front: research
before proposals, and mechanics at the scale of the brief's own examples —
Claude's "shy firefly" pitch was clever but over-scoped for a pre-reader, so I
cut it. I designed the sleepy-firefly idle demo to my own spec and checked it
(and every roadmap idea) against 4–7 developmental milestones. Before any game
code I required a written design contract — STYLE-GUIDE.md, built from the
supplied charsheet and concept sheet: palette roles, motion caps, a no-text
pre-reader UI contract, and the sensory-safety (neurodivergent-friendly) rules
I insisted on. Early cut: a 3D pipeline — the brief says flat.

**Build (~50m).** Plain JS + canvas, my call — a one-screen game doesn't need
an engine. Garden rebuilt from the actual concept-sheet panel; expressions
anchored to pixel-measured sprite landmarks; the idle demo to my spec; my own
Gemini scenery proofed in an isolated mockup and only adopted after I approved
the look.

**Playtest tuning (~40m).** I playtested every build and dictated changes from
feel: caught fireflies became individual countable lights (clearer for kids,
calmer for neurodivergent kids); jar brightness re-curved with a hard luminance
ceiling — a cozy lantern, never a floodlight; flight redesigned into
constant-curvature figures a 4-year-old's eye can track; three spawn entries so
a fast tapper never waits; a parent-proof chime; keep-out bubbles around the
jar and sound button so no tap is ambiguous.

**Independent review (~15m).** Restructured to handoff standard (modules by
concern, one config surface, a README architecture tour), then commissioned
Astra (Codex) to review against my written scope: four real bugs fixed
(including a jar-overfill edge case), dead code removed with per-removal
verification, six judgment calls flagged to me instead of changed, and a
15-test regression suite left behind — which I re-ran before shipping.

**Polish pass (~30m, later).** Two rounds of my own playtest notes: the
never-empty sky (the real bug was the refill counter including fireflies
already flying to the jar — fixed with a drifting-only floor and ceiling),
full-width traveler passes, and a tap-twirl built from the charsheet's own
turnaround — surprised pose, then one slow eased turn front → ¾ → side → back →
front on the way to the jar. Only tapped fireflies spin; sleepy ones never do,
so the bedtime demo stays still. I checked the twirl against the calm rules
before letting it be built.
