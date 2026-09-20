# Code Review Brief — Firefly Jar

For: **Astra** (Codex). Read `README.md` first for the project map, then
`STYLE-GUIDE.md` for the design contract. The game must behave identically
after your pass — this is a review + cleanup, not a redesign.

## Scope (three passes)

### 1. Bugs and issues
Hunt for real defects, ranked by severity. Areas of interest:
- State machine edges in `fireflies.js` (`drift` / `sleepy` / `travel`):
  tapping a firefly at the exact moment it starts sleep-travel; a round
  completing while a sleepy firefly is mid-descent; celebration reset while
  fireflies are still traveling (they will still `arriveAtJar` after the
  reset — is `caughtCount` handled sanely?).
- Resize mid-round (jar moves; traveling fireflies target stale mouth coords).
- The `dt` clamp and tab-throttling (background tabs get big real gaps).
- Audio: `audioCtx` failure paths, rapid toggling, iOS Safari quirks.
- Touch: multi-touch (two fingers at once — pointerdown fires twice),
  `clientX/Y` vs canvas offset assumptions.
- Rendering: `globalAlpha`/composite leaks between draw passes (a save/restore
  audit), NaN vectors when distances are zero.

### 2. Structure and legibility (for a human)
The code was organized for handoff: one module per system, each with a header
stating what it owns; all tuning in `js/config.js`; load order in
`index.html`. Judge it as a stranger:
- Can you find where any given behavior lives in under a minute? If not, say
  what defeated you and propose the smallest re-arrangement that fixes it.
- Flag names that don't say what they mean, comments that restate code
  instead of explaining constraints, and any constant still buried inline
  that belongs in `config.js`.
- Do NOT introduce a build step, framework, or ES modules — the no-tooling
  simplicity (open index.html and it runs; zip → Netlify Drop) is a feature.

### 3. Dead code — flag, then remove safely
Flag anything unreachable, unused, or written-but-never-read (fields on the
firefly/sparkle objects included). For each: name it, say how you verified
it's dead (searched all call/read sites), remove it, and re-verify the game.
Known prior example (already removed): a `loaded` counter in `assets.js`
that was incremented but never read.
- "Safely" means: one removal at a time, game verified after each; if you're
  not certain something is dead (e.g. it looks unused but is part of a
  drawing contract), flag it in the report instead of removing it.

## Hard rules
- Palette hexes, the five design laws in `STYLE-GUIDE.md` §10, and the spec
  constants (`JAR_CAPACITY = 10`, no fail states, no text) are untouchable.
- No behavior changes. If a bug fix would change feel (timings, speeds),
  propose it in the report; only apply clearly-correct fixes.
- Keep the comment voice: comments explain constraints and decisions, not
  syntax.

## Verification
`python3 -m http.server 8000 --directory site`, then in the browser console
you can drive the game deterministically:
- fill the jar: `for (let i=0;i<10;i++) arriveAtJar({variant:'yellow'})`
- force idle mode: `idleTime = 999`
- inspect state: `fireflies`, `jarFlies`, `caughtCount`, `celebrating`
Check the console for errors, play a full round by hand (tap catches, wait
for a sleepy drift, complete a round, watch the reset), and resize the window
mid-round.

## Report format
`REVIEW-REPORT.md` at repo root: findings ranked by severity, each with
file:line, what's wrong, how it fails, and what you did (fixed / removed /
flagged-only). List every dead-code removal separately with its verification
note.
