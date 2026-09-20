# Firefly Jar — review and cleanup

Reviewed 2026-09-20 against `REVIEW-BRIEF.md`, after reading `README.md` and
`STYLE-GUIDE.md`. References below use final file lines unless explicitly
marked **original**. P1 = high-impact defect; P2 = ordinary defect or contract
mismatch; P3 = minor issue or maintainability concern.

Changes preserve the supplied art, palette values, ten-catch capacity, classic
script loading, note pitches/envelopes, and existing motion/timing tuning.
No framework, ES modules, dependencies, or build step were introduced. The
optional regression suite runs with `node --test tests/review.cjs`; the deployed
`site/` still runs by opening `index.html` directly.

## Findings, ranked by severity

### 1. P1 — extra arrivals overfill the jar and repeatedly restart celebration — fixed

**Location:** `site/js/jar.js:32` (`arriveAtJar`; originally line 34 incremented
unconditionally), `site/js/jar.js:67` (`startCelebration`).

At nine catches, tap two fireflies, or let a sleepy traveler arrive after the
tenth catch. Previously every arrival incremented `caughtCount`, appended a
light, raised `targetGlow` above 1, and restarted the five-second celebration
with another 70 particles and arpeggio. Repeated input could keep restarting
celebration. This violates the ten-light count and defeats the glow ceiling.

Added a completed-arrival guard and a full/celebrating-jar guard. Extra travelers
finish their existing paths and leave the ambient array, while the full jar
remains at ten lights and celebrates once. The duplicate-object guard is
idempotency protection; ordinary input did not independently reproduce a
same-object double arrival.

**Verification:** direct 11th arrival leaves count/lights at 10, glow target at
1, remaining celebration at 4 seconds after a one-second update, and particle
count unchanged. Duplicate arrivals do not count twice, including after reset.

**Reset policy preserved:** an unfinished traveler that reaches the mouth
*after* reset counts once toward the newly empty jar. A long sleepy descent was
explicitly tested across reset. No round-ID cancellation, travel restart, or
input lock was added; choosing another policy would change play behavior.

### 2. P2 — optional audio failures can interrupt input or the animation loop — fixed

**Location:** `site/js/audio.js:18`, `site/js/audio.js:45`;
`site/js/ui.js:35`, `site/js/main.js:25`.

Only AudioContext construction was guarded. A rejected `resume()` was unhandled;
a synchronous resume error could abort pointer feedback; a note-creation error
from a sleepy arrival could escape `frame()` before it schedules the next frame.
Only `suspended` was retried, and an existing closed context was never replaced.

Resume errors are now contained, both suspended and interrupted contexts are
retried on gestures, and a closed context is recreated. Note scheduling failures
cannot escape into gameplay. Successful note envelopes and sequencing are unchanged.

**Verification:** injected constructor, resume, and oscillator failures; rejected
resume promise; interrupted-state retry; closed-context replacement. These are
controlled mocks, not a claim of physical iOS Safari certification.

### 3. P2 — sound-off leaves already-scheduled notes audible — fixed

**Location:** `site/js/audio.js:37`, `site/js/audio.js:56`, `site/js/ui.js:40`.

The old toggle only changed a Boolean checked when creating a note. Muting a
celebration could leave its already-scheduled arpeggio and decay playing for
almost three seconds despite the crossed-out icon.

All notes now pass through a shared output gain. `toggleSound()` owns both the
Boolean and that gain, so muting also silences existing voices. Normal output
gain is 1. Rapid on/off toggles do not create extra contexts or change pitches.

**Verification:** scheduled six celebration voices, checked their shared output
routing, then checked the muted/unmuted gain through four pointer toggles.
Browser interaction also verified the icon changes. No subjective listening
assessment or physical-device sound-level measurement was performed.

### 4. P2 — resize listener runs before dependent scripts initialize — fixed

**Location:** `site/js/core.js:15`, `site/js/main.js:38`;
**original** registration: `site/js/core.js:24`.

The core module registered `resize` before `jar.js` and `garden.js` loaded.
A resize between script loads could throw `ReferenceError: layoutScene is not
defined` (observed in the browser during a reload), or encounter uninitialized
scene state. Main startup ordinarily recovers, but the early event is invalid.

Moved listener registration to `main.js`, immediately before the existing
initial resize, when all scene modules are initialized.

**Verification:** a regression that dispatches resize between every script load
failed before the move and passes afterward. Later browser reloads and
mid-round viewport resizing produced no new matching errors.

### 5. P2 — replenishment rate depends on display refresh rate — flagged-only

**Location:** `site/js/fireflies.js:262`.

`Math.random() < 0.02` runs once per frame, independent of `dt`. When a slot is
vacant, the expected wait is 50 frames: about 1.67 seconds at 30 Hz, 0.83 at
60 Hz, and 0.42 at 120 Hz. The sky refills at different speeds across devices.

**Proposal:** choose an intended reference rate, then use a time-based spawn
probability or timer. Left unchanged because choosing that rate changes feel.

### 6. P2 — existing motion does not enforce the documented speed caps — flagged-only

**Location:** `site/js/fireflies.js:72`, `site/js/fireflies.js:151`,
`site/js/fireflies.js:197`; `STYLE-GUIDE.md:60`.

Ambient loops add up to 44 px/s to a 12–26 px/s base, exceeding the guide's
approximately 40 px/s drift cap. Travel duration `len / 300` describes average
straight-line displacement, not peak eased speed: `easeInOut` has derivative 2
at its midpoint, so even plain travel can approach 600 px/s, with curved paths
and flourishes adding motion. The inline claim that this enforces a 300 px/s
cap is misleading.

**Proposal:** decide whether the caps mean instantaneous or typical speed, then
adjust duration/arc-length handling and loop tuning together. No speed changed.

### 7. P3 — resize updates the endpoint but can jump an in-flight position — flagged-only

**Location:** `site/js/fireflies.js:243`, `site/js/jar.js:19`.

Travel already reads the *current* mouth coordinates each frame; stale endpoint
coordinates are not the defect suggested by the brief. However, origin and
control point remain in the old coordinate system. At fixed eased progress
`e`, moving the jar by a vector shifts the evaluated position by `e²` times
that vector; a late traveler can jump noticeably during rotation/resizing.

**Verification:** after resizing from 1280×720 to 600×900, a traveler finishes at
the new mouth with finite coordinates. Browser resizing also preserved play.
**Proposal:** rebase the remaining curve from the current position on resize.
Left unchanged because continuity, remaining duration, and speed need a design
choice, not an arbitrary new trajectory.

### 8. P3 — surprised face ignores the distance-entry opacity — flagged-only

**Location:** `site/js/fireflies.js:276`, `site/js/fireflies.js:294`,
`site/js/fireflies.js:331`.

A newly spawned distance-entry firefly may be tapped before it is fully visible.
Its sprite uses `fadeIn`, but the surprised mouth replaces `globalAlpha` with its
own timer fade. The mouth patch can therefore be opaque on a faint sprite.
This is local to the saved drawing context, not an alpha leak into another pass.

**Proposal:** multiply the expression opacity by the sprite opacity. Left for
visual review because it changes an existing visible response.

### 9. P3 — configuration is less centralized than its documentation promises — flagged-only

**Location:** `site/js/config.js:4`, `README.md:33`, and the tuning inventory below.

A reader following “ALL tuning constants” still has to search several modules.
Keep the current system boundaries; the smallest useful rearrangement is named
configuration groups in `config.js`, preserving each value exactly. See the
inventory for concrete starting points.

### 10. P3 — glow-curve terminology contradicts the implementation — comment fixed; design flagged

**Location:** `site/js/jar.js:104`, `README.md:64`, `STYLE-GUIDE.md:50`.

`Math.pow(jar.glow, 1.5)` is a convex power curve on [0,1], not a sub-linear
curve. Its early values are below linear, but its increments grow later.
Corrected the local comment to explain the intended dim early catches without
the incorrect mathematical label. The curve, README, and normative style guide
were left intact. Reconciling their terminology with the intended luminance
progression requires a design decision; changing the exponent is outside this pass.

## Structure and legibility

The README, load-order list, module headers, and section labels make each system
easy to find within a minute. No module split or merge is justified. The
cross-module surprise was early resize registration; moving it into the existing
boot module fixes that dependency without introducing tooling.

Names worth expanding in a future readability-only pass:

- `site/js/fireflies.js:67`: `th` → `heading`, `spd` → `driftSpeed`,
  `appr` → `approachProgress`, `turnP`/`turnF` → `turnPhase`/`turnFrequency`.
- `site/js/fireflies.js:75`: `loopT` means seconds remaining, while `t` at
  line 122 means normalized travel progress. `loopRemaining` and
  `travelProgress` would make that distinction explicit.
- `site/js/fireflies.js:306`: `sx2l`, `syl`, `sx2r`, `syr` are local eye
  positions; `leftEyeX/Y` and `rightEyeX/Y` would avoid decoding abbreviations.
- `site/js/jar.js:14`: `celebrating` is a countdown, not a Boolean. The existing
  comment explains it; `celebrationRemaining` would communicate it at call sites.

Preserve comments explaining deterministic scenery, stable countable light
slots, generous touch targets, and compositing choices. Comments such as
“rounded speaker body” (`site/js/ui.js:19`) and “soft cream heart”
(`site/js/jar.js:144`) are useful visual section labels, not harmful syntax
narration. The misleading curve comment was the worthwhile correction.

### Inline tuning inventory (flagged-only; values unchanged)

| Location | Values that belong on the configuration surface |
| --- | --- |
| `site/js/fireflies.js:23` | variant weights 0.4/0.7 and anti-repeat count 2 |
| `site/js/fireflies.js:37` | spawn margin, entry weights, placement retries, spacing distances |
| `site/js/fireflies.js:67` | heading jitter, speed range, turn frequencies, loop interval, glow period, size range |
| `site/js/fireflies.js:106` | idle interval 5–9 s and retry 2 s |
| `site/js/fireflies.js:127` | sleepy arc cap/curvature and travel minimum/speed |
| `site/js/fireflies.js:139` | squash/surprise duration, tapped arc, travel speed/minimum, flourish probabilities/size/duration |
| `site/js/fireflies.js:169` | separation radius/strength, approach growth duration, loop duration/boost, steering, margins, jar avoidance, sleepy sink/transition |
| `site/js/fireflies.js:262` | spawn chance, draw pulse/depth/hover/sway, glow radii/alphas, expression fade and landmark patch scales |
| `site/js/jar.js:23` | jar size/layout ratios and maximum height |
| `site/js/jar.js:60` | milestone notes, celebration duration/particle budget, particle speed/lifetime/size/delay |
| `site/js/jar.js:103` | glow interpolation, exponent, pulse strengths, halo caps and sizes, interior-light wander/radius |
| `site/js/sparkles.js:15` | tap particle count, lifetime/size/speed; acceleration, star inner radius, fade multiplier |
| `site/js/audio.js:14` | note table; line 45 note defaults; lines 54–55 envelope; lines 64–67 chord/arpeggio scheduling |
| `site/js/ui.js:10` | button radius/position and icon styling |
| `site/js/core.js:16` | DPR cap; line 34 glow-cache resolution and gradient profile |
| `site/js/main.js:13` | maximum simulation step |
| `site/js/garden.js:72` | scene seed, layout/density ranges, star/mote counts and animation strengths |
| `site/js/garden.js:135` | inline derived foliage hex `#5da162`; preserve its exact value if centralized |

Use a few groups such as `FLIGHT`, `ENTRY`, `TRAVEL`, `JAR_LIGHT`, `AUDIO`, and
`SCENERY`. Mathematical identities such as 2π and Bézier coefficients are not
tuning and should remain beside their formulas. Geometry landmarks already
belong in `config.js`. This review flags the inventory instead of mechanically
renaming every number and obscuring the small correctness patch.

## Dead-code removals — individually verified

Search scope was all of `site/`, including script loading and cross-module
reads/writes. No whole module or function was found unused. Removals were made
one at a time, with the full regression suite and a browser reload/render check
after each.

1. **Removed unused initial `t: 0`** — **original**
   `site/js/fireflies.js:85`; final travel initialization is at lines 122 and
   138. All `.t` reads occur in travel update/drawing. Both legal entries into
   travel overwrite `t` with 0 first; no drift or sleepy read consumes the spawn
   value. The field itself remains live. **Verification:** 14/14 checks passed,
   including tap, sleep transition, arrival, complete idle round/reset, and
   drawing; browser reloaded and rendered without errors.

2. **Removed unused initial `sleepT: 0`** — **original**
   `site/js/fireflies.js:88`; final initialization is at line 115.
   Searched every `sleepT` read/write and every assignment to `state`.
   `beginSleep()` is the sole normal entry into sleepy state and initializes
   its timer before update reads it. The field remains live while dozing.
   **Verification:** 14/14 checks passed and browser rendered. This reload
   exposed the independent early-resize error described in finding 4; it was
   reproduced in a separate regression and fixed before proceeding.

3. **Removed unreachable vertical-scale ternary arm** — **original**
   `site/js/fireflies.js:300`; final `ctx.scale(squash, 1)` at line 298.
   Searched all squash reads/writes: the timer starts at 0.25 and counts down;
   the derived scale is 1–1.12 while active and 1 otherwise. Thus
   `2 - squash > 1` is false throughout normal play, so the `1/squash` arm
   never runs. Replaced the ternary with its existing result 1, preserving the
   horizontal stretch. **Verification:** 15/15 checks passed and browser
   reloaded/rendered; a subsequent full interactive round also reset correctly.
   Implementing an actual vertical squash would change the visual response and
   was deliberately not folded into this deletion.

### Retained despite apparently unused fields

- **`PALETTE.leaf`**, `site/js/config.js:15`: no direct `PALETTE.leaf` read exists
  in `site/`. Retained because it is one of the five explicit design palette
  roles, and the brief forbids altering that contract. `GARDEN.grassLit` uses
  the same hex; consolidation can be considered without deleting the role.
- **Dot particle `spin`/`spinV`**, `site/js/sparkles.js:21`,
  `site/js/jar.js:82`: dots do not render rotation, but these fields are read by
  the shared particle update and stars use them for drawing. Removing them
  selectively would require changing that schema/update contract. Their random
  initialization also consumes RNG values, so deleting it can change later
  random behavior. Kept intact.
- **Travel fields** (`loop`, `flutter`, `fromX/Y`, `ctrlX/Y`, `travelDur`),
  `loopDir`, `done`, and `appr` all have update/render/removal reads. Explicit
  false/null resets are not dead merely because some objects initially omit them.

## Verification and practical limits

- `node --test tests/review.cjs`: **15 passed, 0 failed**. Uses Node built-ins
  with small canvas/audio mocks; it adds no runtime dependency. Regression
  coverage includes overfill/restart, duplicate arrival, reset-spanning sleep
  travel, tap at both sides of sleep transition, two pointer events, relocated
  mouth, zero-distance vectors, tab gap, idle round/reset, draw-state balance,
  unavailable audio, mute routing/rapid toggles, resume errors, closed context,
  and resize during script loading.
- Browser served using `python3 -m http.server 8000 --bind 127.0.0.1 --directory
  site`. Played via canvas clicks: catches, empty-sky twinkles, sleepy face and
  descent, full jar/celebration glow, reset and subsequent catches. Resized
  mid-round between landscape and portrait, then restored the default viewport.
  Toggled the sound icon during play. No new console errors after the resize fix;
  the earlier error was retained in the browser's history and identified by its
  pre-fix timestamp.
- Deterministic console-style state scenarios were executed in the regression
  harness, not injected into the interactive browser: that browser interface
  exposes read-only DOM evaluation rather than a writable game console.
- The frame clamp intentionally discards excess wall time. A ten-minute gap
  advances game time by 0.05 s, preventing jumps but also delaying idle/round
  timers relative to real time. Retained as the current behavior; no catch-up
  simulation or wall-clock timers added.
- Pointer coordinates are correct for the present unscrolled, marginless,
  viewport-sized canvas at (0,0), including DPR scaling. Embedding or applying
  an offset/transform would require conversion through its bounding rectangle;
  that unsupported layout was not introduced or patched speculatively.
- Pointer handlers run serially: once a fly is traveling, the next pointer
  cannot select it. Two pointers can catch two flies; a second tap on a traveler
  produces a twinkle (or selects another nearby eligible fly). A dozing fly is
  tappable up to the travel transition; afterward it is already being caught.
- Save/restore audit and mock draw-state checks found no alpha/composite leak
  between passes. Coincident firefly/obstacle vectors and zero-length travel
  remained finite. This is not a pixel-identical rendering proof.
- No physical multi-touch device, iOS Safari background/foreground session,
  rejected real audio-device session, or subjective audio test was available.
  Mocked pointer/audio cases and desktop browser checks are reported separately.
- Existing edits to `PROCESS-LOG.md` and the independently added
  `DESIGN-NOTE.md` were left untouched.
