# Design Note — Firefly Jar

## My added mechanic: sleepy fireflies (the game demonstrates itself)

If the screen goes untouched for ~9 seconds, one firefly at a time gets sleepy —
its eyes slowly close (the charsheet's sleepy expression), its glow dims, and it
drifts gently down into the jar. Left alone, the night completes the round by
itself and starts over. Any touch wakes everything up, and tapping a dozing
firefly catches it normally, with a surprised "oh!".

**Why this one.** The hardest problem in a pre-reader game isn't a feature — it's
onboarding without words. Best practice in this space (Sago Mini, Toca Boca) is
teaching by demonstration, never instruction. Sleepy fireflies make the game its
own tutorial: a 4-year-old who doesn't know what to do watches a firefly do it.
It also fits the brief's scale — one behavior on the existing objects, no new
inputs, no new rules to learn — and it deepens the bedtime calm instead of
fighting it. As a bonus it makes the idle screen a living lullaby scene rather
than a dead menu.

I considered a bigger idea first — a "shy firefly" that must be coaxed with a
still finger — and cut it: it changed the core interaction and needed hint
systems to be discoverable, which is exactly the over-scoping the brief warns
about. The examples given (a sleepy owl, color changes) are one-object,
zero-new-input flourishes; I matched that scale.

## What I'd build next if this became a real game

The catching loop is the fun; the roadmap turns it into teaching. Every
addition below has one named learning goal anchored to an established 4–7
milestone (color sorting and counting to ten at ~4–5; prediction, pattern
memory, and empathy-in-play developing across 4–7) — and each is taught the
way the game already teaches everything: through play and demonstration,
never words or drills. Every mechanic plays fine with zero comprehension, so
the wide age range has a floor at 4 and a ceiling at 7. The three color
variants are the seed: today color is decoration, next it becomes curriculum.

1. **Color personalities** — yellow are steady drifters, pink are slow dreamy
   loopers, teal are playful zig-zaggers (all within the calm caps).
   *Learning goal: observation and prediction* — the child learns to watch
   first, notice patterns in behavior, and anticipate where a friend will go.
2. **Color-matched jars** — two or three jars, each glowing softly in the
   color it wishes for. Any firefly in any jar still counts; a match earns an
   extra sparkle. *Learning goal: sorting and classification* — matching by
   attribute is core preschool math, practiced here with zero fail state.
3. **Peek-a-boo fireflies** — a jarred firefly sometimes floats to the rim and
   peeks out; a gentle tap pats it back in with a giggle. Never loss — the
   count can't go down. *Learning goal: empathy and caretaking* — noticing a
   friend who needs attention and responding gently, the skill at the center
   of nurture's own framework.
4. **Lullaby jar** — each catch adds one pentatonic note; the celebration
   replays the child's own little melody. *Learning goal: sequencing and
   auditory memory* — early musical patterning, built from the existing chimes.

(And already in the shipped game: the ten countable lights are quiet counting
practice, one physical light per catch.)

## What I deliberately cut

- The shy-firefly patience mechanic (over-scoped; discoverability risk).
- A 3D pipeline (Gemini→Meshy) — the spec says flat, and spec fidelity beat
  spectacle.
- Additional AI-generated art — the supplied set was already coherent; adding
  to it risked style drift for zero gameplay value.
- Any score, numbers, menus, or text. Progress is physical: lights in a jar.
