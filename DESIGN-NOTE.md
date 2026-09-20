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

The three color variants are the seed. Today color is decoration; next it
becomes meaning:

1. **Color personalities** — each color flies differently within the same calm
   caps: yellow are steady drifters, pink are slow dreamy loopers, teal are the
   playful ones who zig and peek. Kids start recognizing *who* they're catching.
2. **Color-matched jars** — two or three small jars, each glowing softly in the
   color it wishes for (shown by light, never words). Any firefly in any jar
   still counts — a match just earns an extra sparkle — so sorting stays
   no-fail while quietly practicing a core preschool skill.
3. **Peek-a-boo fireflies** — once in a while a jarred firefly floats up to the
   rim and peeks out; a gentle tap pats it back in with a giggle. Framed
   strictly as play, never escape: the count never goes down, nothing is ever
   lost. It turns the full jar into a live toy instead of a trophy.
4. **Lullaby jar** — each catch adds one note; the celebration replays the
   child's own little melody (the chime system already supports it).

## What I deliberately cut

- The shy-firefly patience mechanic (over-scoped; discoverability risk).
- A 3D pipeline (Gemini→Meshy) — the spec says flat, and spec fidelity beat
  spectacle.
- Additional AI-generated art — the supplied set was already coherent; adding
  to it risked style drift for zero gameplay value.
- Any score, numbers, menus, or text. Progress is physical: lights in a jar.
