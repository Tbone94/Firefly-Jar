# Firefly Jar — Process Log

How this was built, in order. I directed; AI executed and verified under that
direction. The prompts below are mine, unedited.

## Tools used, and why

- **Claude (Claude Code)** — the primary tool for everything: design research, the
  style guide, all game code, and verification
- **Python / Pillow** — measured the supplied sprites (eye/mouth landmark coordinates,
  body colors) so the sleepy/surprised expression overlays anchor to real pixels, and
  cropped/enlarged the concept sheet's garden panel to art-direct the background from
  the actual reference.
- **Gemini** — my own scenery art (moon, clouds, flowers, foliage strips), generated
  against the style guide's reference-anchored prompt rules.
- **WebAudio (synthesized sound, no files)** — pentatonic chimes generated in code.
- **Astra (Codex)** — independent code review pass (bugs, structure, dead code) against
  a written brief (REVIEW-BRIEF.md)

## Key prompts, verbatim

My direction to the AI, unedited (these steered the whole build):

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

(The AI's own working prompts to sub-tools — pixel scans, flight simulations, the
review scope — are recorded in REVIEW-BRIEF.md and the repo history.)

## Rough time split (~2h 45m of the 4h cap)

- ~35% — design research, mechanic debate, style guide (before any code)
- ~30% — build + fix cycles (core loop, garden, jar, expressions, idle mode)
- ~25% — playtest-driven feel tuning (glow, flight, spawns, variety)
- ~10% — handoff: restructure to modules, README, review brief, this write-up

## Phase 1 — concept, research, and the design system (~1h)

I pulled the brief and all seven reference assets first and had the AI inventory
every image before any decisions — I wanted the concept sheet driving the design,
not anyone's memory of it.

Ideation was mine to steer, and I set two rules up front: research before
proposals (nurture's own philosophy, plus how the best preschool studios teach
through demonstration), and mechanics at the scale of the brief's own examples.
The AI's first pitch was a "shy firefly" you coax by holding still — clever, but
I questioned whether a pre-reader would ever discover it, and when the honest
answer required layers of hint systems, I cut it as over-scoped. I deferred the
final mechanic choice until I could feel the core loop in my hands.

The mechanic I ultimately designed is the **sleepy fireflies idle demo**: my
spec, down to the details — the charsheet's sleepy face, one firefly at a time,
a slow drift into the jar, the round completing on its own so the game teaches
itself to a watching child without a single word. I checked it (and every
roadmap idea) against 4–7 developmental milestones before committing.

Before allowing any game code, I required a written design contract:
`STYLE-GUIDE.md`, built from the supplied charsheet and concept sheet — exact
palette roles, shape and glow language, motion caps, a no-text pre-reader UI
contract, the sensory-safety (neurodivergent-friendly) rules I insisted on, and
a prompt template that locks any future AI-generated art to the references.

Deliberate early cut: a Gemini→Meshy 3D pipeline. Tempting (nurture's other
games are 3D), but the brief says flat — spec fidelity beat spectacle.

## Phase 2 — build (~50m)

The core loop went up to spec in plain JS + canvas — my call to skip engines;
a one-screen game doesn't need scaffolding. Then the garden, rebuilt from the
actual concept-sheet panel (cropped and enlarged, so we matched the reference,
not a memory of it); the jar's brightness states; the expression system,
anchored to pixel-measured face landmarks on the sprites; and the idle demo
built to my spec. Later I generated my own scenery set with Gemini — moon,
clouds, flowers, two foliage strips — proofed it in an isolated mockup first,
and only adopted it into the real game after I approved the look.

**Where the AI got it wrong, and how it was corrected** (the brief asks, so
honestly): fireflies once spawned bunched in a corner (a zero-size-viewport
edge case); the supplied sparkle PNG turned out to have its background baked in,
so I approved switching celebration sparkles to code-drawn particles; the jar's
inner lights once collapsed into a straight line (a trig resonance — caught by
a state dump, replaced with a cleaner placement scheme); the first jar glow was
nothing like the concept sheet's warm lantern until I pushed it through three
rounds; first-draft fronds read as "seaweed" and got rewritten; and Gemini
exported "transparent" art as JPEGs with the checkerboard baked into the pixels
— crisp foliage could be masked out, but the glowing moon and clouds couldn't,
so I regenerated them on a solid navy background that keys cleanly. Every fix
was verified before moving on.

## Phase 3 — playtest-driven feel (~40m)

I playtested every build and dictated the changes from feel:

- Caught fireflies became **individual, countable colored lights** instead of a
  merged glow — clearer for kids, calmer for neurodivergent kids.
- Jar brightness re-curved so every catch adds a visible step, with a hard
  luminance ceiling — a cozy lantern, never a floodlight — plus a gentle
  halfway pulse.
- Flight went through three rounds under my direction: slower and more varied,
  then smoother, and finally a full redesign into **constant-curvature figures**
  — wide arcs, U-turns, occasional S-curves and loops, separated by straight
  glides — because I wanted paths a 4-year-old's eye can track and predict.
- Three spawn entries (sides, top, "from the distance," growing closer) so a
  fast tapper never empties the sky and waits.
- The catch chime re-voiced to a soft, rounded sine with slight per-tap
  variation — deliberately parent-proof under rapid tapping.
- Keep-out bubbles around the jar and the sound button so no tap is ever
  ambiguous, and scenery (moon, scattered clouds) kept static and unglowing so
  nothing reads as tappable.

Tuning was measured, not guessed: simulated multi-minute flights, canvas pixel
sampling, and a 3,000-draw color-distribution check back every number above.

## Phase 4 — independent review and handoff (~15m)

I had the code restructured to handoff standard (researched first: modules
split by concern, every tuning constant on one config surface, a README that
maps the architecture in a minute), put the project under git, and then
commissioned an independent AI review — Astra (Codex) — against my written
brief: bugs, human legibility, and dead code flagged then safely removed. It
fixed four real bugs (including a jar-overfill edge case), removed dead code
with per-removal verification, flagged six feel-affecting items for my decision
rather than changing them, and left a 15-test regression suite — which I re-ran
independently before shipping to GitHub Pages.

## Phase 5 — a second playtest pass (~30m, later)

After living with the first cut and playtesting more, two things bothered me,
and I dictated them to the AI in my own words:

- "theres should never be a moment where the screen is empty, at somepoints you
  can click all the firflies and it takes a bit too long for any of them to
  appear again so potentially a fixed number of min/max firflies on scene to
  make a better playing experience, ensure it is not chaotic and follow the
  guidlines of being calm."
- "the firflies more or less sit in the same spot, i thing a few firflies should
  move across the length of the sreen in a sort of swooping, sometimes large
  loops pattern so the child can track them across the screen, still calmy and
  smooth."

I had the AI diagnose the emptiness before changing anything. The real cause
wasn't a slow spawn rate — it was that the refill counter included fireflies
already *flying to the jar*, so after I tapped a handful the sky read as "still
full" until they landed, then dropped to almost nothing. The fix: only fireflies
actually drifting count toward a **population floor (min 4) and ceiling (max 6)**,
so a replacement begins the instant a child taps, and new arrivals are spaced by
a short cooldown so several never pop in on the same beat — never empty, never a
swarm.

For the second note, I was firm that "a few travel across the screen" must not
mean "faster," because the style guide caps drift speed. So the AI built a
**voyager** role: one or two fireflies at a time bank smoothly toward a waypoint
on the far side of the sky — a long sweeping arc a child can track across the
whole width — with an occasional big, slow loop, all within the existing speed
cap. The rest keep their local drift.

**Where the AI got it wrong, and how it was corrected (again).** The AI's first
population fix looked right but I didn't trust it by eye, so I had it write a
headless simulation that plays the game for 90 seconds under different tapping
speeds and measures the longest stretch the sky sits empty. That caught two real
misses: the floor still emptied *during the end-of-round celebration* (spawning
was paused through it), and under fast tapping the refill lagged. We held the
floor through the celebration and made the refill scale with how empty the sky
is (quick when nearly bare, unhurried when just topping up). Re-measured: normal
play never empties; even relentless spam leaves gaps under a second. The
simulation also proved the voyagers sweep ~60% of the screen width per crossing.
All 15 regression tests still pass.
