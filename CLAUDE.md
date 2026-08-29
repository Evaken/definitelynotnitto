# Working in this repository

A recreation of the pre-2007 **Nitto 1320 Challenge** browser drag-racing game.
TypeScript throughout, React client, deterministic 1kHz physics.

Built in sixteen stages. **Start with `ROADMAP.md`** — it says which stage is
current, lists all sixteen at a glance, and records the known limitations.
`PROJECT_SPEC.md` then gives the build list and completion criteria for whichever
stage you are picking up (section 8).

**`docs/reference/` holds surviving screenshots of the original.** They outrank
everything else, the spec included. The spec has already been wrong once in a way
that cost a stage of work: it stated flatly, twice, that the race view was
"side-on", and it was built that way before a screenshot showed the original used
a chase camera. Check a claim against the screenshots before building on it, and
treat the spec's confident sentences with the same suspicion as its hedged ones.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 116 tests, ~2s
npm run typecheck
npm run build
```

Run `npm test` and `npm run typecheck` before committing. Both run in CI anyway,
but the tests are fast and catch physics regressions immediately.

## Layout

```
packages/game-core/src/
  types/            Car, Part, Tune, simulation state
  data/cars/        One file per car
  config/historical.ts   Every uncertain historical value, in one place
  sim/              The simulator
  testing/          Scripted driver, tests only

apps/web/src/
  race/renderer/    Canvas drawing. Plain functions, no React.
                    projection.ts turns a distance into a screen position;
                    everything in the scene goes through it
  race/             Input, frame pacing, the React binding
  screens/          One per navigation tab
```

## Invariants

These are enforced by tests, not convention. Breaking one fails the build.

**game-core imports no UI.** No React, no DOM globals, no `Math.random`, no
`Date.now`. It has no React dependency to import, and `boundary.test.ts` scans
the source for the rest. The reason is Stage 10: the server has to re-simulate a
submitted race to verify a claimed time, and it can only do that if the
simulator runs outside a browser.

**The simulation is deterministic.** Same car, tune, seed and inputs, same
result — always. Randomness comes from the seeded generator in `sim/rng.ts`,
whose state lives on the pass. `replayPass` re-runs a recording and must produce
a byte-identical slip.

**Cars are data.** There is no branch anywhere in `sim/` keyed on a car's id.
Adding a car means adding a file to `data/cars/`.

**Uncertain history goes in config, not code.** Anything not confirmed about the
original game lives in `config/historical.ts` with a confidence tag
(`sourced` / `real-world` / `assumed`) and a note. A `sourced` entry has to name
the screenshot that settles it. Correcting a historical detail must never require
editing simulation logic. Document what you do not know — do not invent
certainty.

**Build one stage at a time.** Read ahead as much as you like — the whole plan
is in `ROADMAP.md` and `PROJECT_SPEC.md` §8, and knowing what is coming is how
you avoid painting the project into a corner. But *implement* only the stage you
are on, plus any small prerequisite it genuinely needs. Do not scaffold
multiplayer, teams, parts or extra cars early. Each stage leaves the project in a
working state.

If the current stage is finished, the next one is fair game — check `ROADMAP.md`
first to see whether someone has already started it.

## Testing physics

**Assertions are comparative, never absolute.** "This is quicker than that" —
not "this runs 15.747". The Civic's figures approximate a real 2003 Civic Si and
are *not* calibrated to the original game; calibration is Stage 15. A test
naming an exact ET has to be rewritten every time the car data is tuned.

Absolute bands exist but are deliberately wide (13–19s for the stock quarter)
and are there to catch a change that makes the car wildly fast or slow.

`testing/drive.ts` is a scripted driver for tests only. It is not a CPU opponent
— those are Stage 6, and building one early is explicitly out of scope.

**`testing/drive.ts` is load-bearing for `BALANCE_NOTES.md`.** Every figure in
that file is produced by this driver, so a change to how it drives silently
changes what the file claims. It has already happened once: the driver
chain-shifted a high-torque car into fifth at 29mph, and the short-shift row was
seven seconds out with nothing failing. If you touch the driver, regenerate
every table in `BALANCE_NOTES.md` — all of them, not the ones that look
related. You cannot tell which moved by reading.

## Traps this codebase has already fallen into

Worth knowing before touching the simulation. All three produced behaviour that
looked plausible and was completely wrong.

**Quantising inside an accumulating loop deadlocks it.** The throttle spring
moves ~0.001 per 1ms tick. Rounding each step to hundredths put it straight back
where it started, so the throttle sat wide open forever. Keep the precise value
internally; quantise once, at the boundary where it is used.

**Applying a strong torque "against the current direction" does not survive a
1ms step.** The brakes are strong enough to reverse the wheel within one tick,
so the sign flipped every tick, the tyre force averaged to nothing, and the car
had effectively no brakes. Same class of bug bit the clutch. The fix in both
cases: solve for the torque that would bring the two sides to the target state
this step, then clamp it to capacity. Lock-up and static hold then fall out of
the arithmetic instead of needing a guessed tolerance.

**A free-rolling wheel never reaches exactly zero.** The only thing slowing it
is a tyre force proportional to the slip causing it, so it approaches rest
asymptotically. Judge "stopped" against a threshold.

## Known-wrong, deliberately not yet fixed

Recorded in `ROADMAP.md` with the reasoning. Do not "fix" it in passing — it is
its own piece of work.

- **Community is intentionally conservative.** It implements member search and
  a read-only public vehicle showcase because those are required by the online
  game, but does not invent unsupported historical forums or chat features.
- **Career-special race art is still incomplete.** The ten normal showroom cars
  have clean-room front and rear portraits shared across garage, workshop,
  showroom, status rail and strip. The three career-special cars still use the
  data-driven rear fallback. Paint remains non-destructive runtime state rather
  than separate raster variants.

The starter car being the wrong Civic *was* on this list. It is fixed —
`data/cars/civic-si.ts` is now a B16A2. Correcting it moved every figure in
`BALANCE_NOTES.md` at once, exactly as predicted, which is why the file records
both the before and after.

## Images and binary assets

Live in `apps/web/public/assets/`. Two rules, both learned the expensive way.

**Git keeps every version of a binary forever.** Text files diff; a PNG does
not. Re-exporting a 2MB sheet five times leaves 10MB in the repository
permanently, and `git clone` pays it every time even though only the last one is
ever used. There is no tidying it up later without rewriting history, which is
blocked on `main`.

So: **budget roughly 300KB per asset**, and prefer WebP — the reference
screenshots in `docs/reference/` already are. A sprite sheet built for a 960x600
canvas rarely needs more. Check what you are about to add:

```bash
du -h apps/web/public/assets/*
```

Everything here also sits on the GitHub Pages critical path, so weight is
load time on the deployed site, not just clone time.

**Current state:** the original PNG additions remain in Git history, but the
deployed files were replaced in Stage 3.4 by `speedshop-parts-sheet.webp`
(94KB) and `garage-civic-ek.webp` (66KB). Keep future workshop assets around
this scale; do not reintroduce the 4.1MB PNG pair on the live path.

**Never commit original game artwork, binaries, logos or brands.** Everything
drawn for this project is a clean-room replacement. That is a hard line, not a
preference: the project's whole claim to being a recreation rather than a copy
rests on it. Say so in the commit when you add art, as
`a86867b` did.

## Git

`main` is protected against force-push and deletion. Everything else in git is
recoverable, so nothing else is locked down.

Do not push unless asked. Commit freely; pushing to `main` deploys to the live
site.
