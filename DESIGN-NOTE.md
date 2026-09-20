# Design Note — Firefly Jar

## My added mechanic: sleepy fireflies (the game demonstrates itself)

If the screen goes untouched for ~9 seconds, one firefly at a time gets sleepy and
its eyes slowly close (the charsheet's sleepy expression), its glow dims, and it
drifts gently down into the jar. Left alone, the night completes the round by
itself and starts over. Any touch wakes everything up, and tapping a dozing
firefly catches it normally, with a surprised "oh!".

**Why this one.**  Sleepy fireflies make the game its
own tutorial: a 4-year-old who doesn't know what to do watches a firefly do it.
It also fits the brief's scale, one behavior on the existing objects, no new
inputs, no new rules to learn and it deepens the bedtime calm instead of
fighting it.


## What I'd build next if this became a real game

1. **Color personalities** — yellow are steady drifters, pink are slow dreamy
   loopers, teal are playful zig-zaggers (all within the calm caps).
   *Learning goal: observation and prediction*  the child learns to watch
   first, notice patterns in behavior, and anticipate where a friend will go.
2. **Color-matched jars** — two or three jars, each glowing softly in the
   color it wishes for. Any firefly in any jar still counts; a match earns an
   extra sparkle. *Learning goal: sorting and classification* — matching by
   attribute is core preschool math, practiced here with zero fail state.

## What I deliberately cut

A "shy firefly" coaxing mechanic (changed the core interaction and needed hint
systems a pre-reader wouldn't discover — over-scoped); a 3D art pipeline (the
brief says flat, and spec fidelity beat spectacle); and any score, numbers,
menus, or text — progress stays physical: lights in a jar.
