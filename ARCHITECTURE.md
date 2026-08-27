# Architecture

How the code is actually laid out, and why.

## Layout

```
packages/game-core/     Pure TypeScript. No React, no DOM, no network.
  src/
    types/              Car, Part, Tune, simulation state and results.
    data/cars/          One file per car. Currently: Civic Si.
    data/parts/         Empty registry until Stage 3.
    config/historical.ts  Every uncertain historical value, in one place.
    sim/                The simulator.
    testing/            Scripted driver, for tests only.

apps/web/               React + Vite client.
  src/
    nav/                The seven-tab shell.
    screens/            One per tab; six are placeholders.
    race/
      input/            Keyboard to RaceInput.
      renderer/         Canvas drawing. Plain functions, no React.
      useRaceSession.ts The only place the two halves meet.
```

## The one rule that shapes everything

**Gameplay logic never lives in UI code** (PROJECT_SPEC 6.1).

This is enforced physically rather than by convention: `game-core` has no React
dependency in its `package.json`, so it cannot import one. `boundary.test.ts`
additionally fails the build if anything in `game-core` reaches for React, a
browser global, `Math.random`, or the wall clock.

The payoff arrives in Stage 10. The server has to re-simulate a submitted race
to check a claimed elapsed time, and it can only do that if the simulator runs
outside a browser. Keeping the boundary clean now is what makes that possible
without a rewrite.

`useRaceSession.ts` is the only file that touches both halves. It reads the
keyboard, steps the simulator, draws the canvas, and publishes a snapshot to
React. It contains no rules about how a car behaves.

## The simulation

### Fixed timestep

1000 Hz. One tick is one millisecond, matching drag timing's resolution. The
render loop uses an accumulator, so a slow frame or a 144Hz monitor cannot
change the outcome of a pass.

### Deterministic by construction

Same car, tune, seed and inputs, same result — always (PROJECT_SPEC 6.3).

- All randomness comes from a seeded generator whose state lives on the pass.
  `Math.random` is banned inside `sim/` and the ban is tested.
- No wall-clock reads inside `sim/`.
- `TimelineRecorder` records only input *changes*, so a fifteen-second pass is a
  handful of entries rather than fifteen thousand.
- `replayPass` re-runs a recording and must produce a byte-identical slip.

The web client verifies this on every completed pass in development, against
real keyboard input — the same check the Stage 10 server will run.

### The physics

A one-dimensional model (PROJECT_SPEC 4.6), deliberately not an engineering
simulator:

```
rpm → torque curve → clutch → gearbox → final drive → wheel torque
    → tyre slip ratio → grip → tractive force
    → minus aero drag and rolling resistance → acceleration → speed → distance
```

Four decisions worth knowing about:

**A slip-ratio tyre model, not a grip clamp.** Wheel angular velocity is tracked
separately from vehicle speed, and slip ratio drives the friction coefficient
through a curve that rises to a peak and then falls away. Wheelspin and bogging
are the two sides of that one curve rather than two special cases in code, which
is what lets launch feel be tuned by editing tyre data.

**Two driveline regimes.** While the clutch slips, engine and wheels integrate
independently and the clutch passes the torque that would equalise them, clamped
to its capacity. When that torque falls within capacity, they lock into one
rigid body and the engine's inertia is referred through the gearing. Solving for
the equalising torque, rather than applying full capacity in the slip direction,
is what stops the clutch chattering and makes lock-up fall out of the arithmetic
instead of needing a guessed tolerance.

**Dynamic weight transfer.** Load moves off the front axle under acceleration,
so a front-wheel-drive car goes light on the wheels doing the work. The Civic's
launch behaviour is a consequence of its drivetrain layout, not a penalty
applied to FWD cars.

**Brakes solved the same way as the clutch.** The brake torque applied is the
one that would bring the wheel exactly to a stop this step, clamped to what the
brake can manage. Applying full capacity against the wheel's direction — the
obvious implementation — does not survive a 1 ms step: the brake is strong
enough to reverse the wheel within a single tick, so it flips sign every tick,
the tyre force averages out to nothing, and the car behaves as though it had no
brakes at all. The same formulation gives the static hold for free.

**One model, no staging mode.** The car obeys the same physics from the moment
it appears to the moment it rolls to a halt in the shut-down area. It starts in neutral, which
is why nothing happens until the driver selects a gear and opens the throttle;
there is no separate creep behaviour to keep consistent with the real thing.
Below the clutch lock-up speed the clutch follows the throttle, so closing it
opens the clutch and the car coasts — that is what makes it possible to roll to
a stop in the staging window on momentum.

### Where the numbers come from

Cars are data. There is no branch anywhere in `sim/` keyed on a car's id
(PROJECT_SPEC 6.2) — adding a car means adding a file to `data/cars/`.

Everything historically uncertain lives in `config/historical.ts`, tagged with
how much evidence stands behind it. Correcting a historical detail should never
require editing simulation logic.

## Testing

`npm test` runs everything. The suite covers:

- The architectural boundary, as described above.
- Determinism, including replay of several very different drives.
- Numerical stability — no NaN or infinity anywhere in a pass, and bounded slip
  through a redline launch.
- Tyre and weight-transfer behaviour, including drivetrain differences.
- Tree timing, reaction time arithmetic, and red-light adjudication.
- That driving well beats driving badly, and in the expected shape.

Performance assertions are comparative — "this is quicker than that" — never
absolute times. The car's figures are not yet calibrated to the original game,
so a test naming an exact ET would have to be rewritten every time the data is
tuned. Absolute bands are deliberately wide and belong to Stage 15.

## Not yet built

No backend. No persistence. Stage 1 is entirely offline and in-memory. The parts
and tune *types* exist because the simulator's signature needs them, but their
registries are empty until Stage 3.
