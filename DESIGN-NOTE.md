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

1. **Lullaby jar** — each caught firefly adds one pentatonic note; the full-jar
   celebration replays the child's own little melody. (The chime scaffolding is
   already in.)
2. **Gentle collection goals, shown pictorially** — the jar "wishes" for three
   pink fireflies via a small picture, never text or numbers.
3. **A goodnight release ritual** — at bedtime the jar tips open and the
   fireflies fly home; designed with parents as a wind-down cue.
4. **Sensory settings for grown-ups** — glow intensity, motion, and sound
   sliders, because "calm" isn't one-size-fits-all for neurodivergent kids.

## What I deliberately cut

- The shy-firefly patience mechanic (over-scoped; discoverability risk).
- A 3D pipeline (Gemini→Meshy) — the spec says flat, and spec fidelity beat
  spectacle.
- Additional AI-generated art — the supplied set was already coherent; adding
  to it risked style drift for zero gameplay value.
- Any score, numbers, menus, or text. Progress is physical: lights in a jar.
