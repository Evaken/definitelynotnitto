# Changelog

## Stage 1a — Manual control rework

Reworked the car from a keyboard toy into something that has to be driven.

**Controls**

- Throttle is a drag slider beside the strip, 0–100%, and the only way to open
  it. It is not on the keyboard: how far and how fast it is pushed is the launch.
- Gear selector R / N / 1 / 2 … on W and A, with the car starting in **N**.
  Shifting alone moves nothing — a gear *and* throttle are both required.
- Reverse works, so a driver who rolls through the stage line can back up.
- Brake on S / Space.

**Staging is now a driving problem.** There is no auto-hold: the car has to be
brought to a stop with its nose inside a 1.2 m window, on a timed coast or on
the brakes. Rolling through starts the clock, which before the green is a red
light. Where in the window the car stops trades reaction time against elapsed
time — about 0.44 s against 0.42 s across the window.

**Simulation**

- Unified physics. There is no separate staging mode; the car obeys the same
  model from spawn to finish line and is simply in neutral to begin with.
- Clutch follows the throttle below the lock-up speed and stays clamped above
  it, so closing the throttle opens the clutch and lets the car coast — which is
  what makes momentum staging possible — while a lift mid-run gives engine
  braking.
- Brake torque is solved for the value that would bring the wheel exactly to a
  stop, then clamped to capacity. Applying full capacity against the wheel's
  direction does not survive a 1 ms step: the brake is strong enough to reverse
  the wheel within a single tick, so it flipped sign every tick, the tyre force
  averaged to nothing, and the car sailed through the staging window as though
  it had no brakes at all.
- Bidirectional motion: losses now oppose travel in either direction and cannot
  drag a stationary car backwards.
- Longer, more variable pause before the tree arms (2.5–4.5 s).

**Presentation**

- Camera zoomed from 26 to 58 px/m; the car reads as a car and the staging
  window is a target that can be judged by eye.
- Staging window drawn as a shaded band between two lines, lit green once the
  car has settled inside it, with a prompt to back up after rolling through.

**Notes**

- The best launch is to hold revs in neutral on the brakes and select first as
  the tree drops — roughly 0.7 s a quarter quicker than opening the throttle in
  gear. That was not scripted; it falls out of having no clutch pedal.

## Stage 1 — Basic Drag Race Simulator

A stock Civic Si can be staged, launched and driven through a complete quarter
mile, producing a correct timing slip.

**Simulation**

- 1kHz fixed-step deterministic pass simulator.
- Engine torque curve with interpolation and a rev limiter with hysteresis.
- Two-regime clutch: slipping bodies that lock by solving for the equalising
  torque, avoiding both chatter and a guessed lock tolerance.
- Slip-ratio tyre model producing wheelspin and bogging from one curve.
- Dynamic weight transfer, so drivetrain layout has mechanical consequences.
- Pre-stage and stage beams with modelled rollout; staging depth trades elapsed
  time against reaction time.
- Christmas tree, both Pro and Sportsman, selected by configuration.
- Reaction time, 60ft, 330ft, 1/8 ET+MPH, 1000ft, 1/4 ET+MPH, red-light
  adjudication. Trap speeds averaged across 66ft, as a real timing system does.
- Input recording and replay: a pass is reproducible from its inputs alone.

**Client**

- Canvas drag strip: scrolling surface, distance markers, beams, finish line,
  side-on car with visible wheel rotation and tyre smoke.
- HUD with elapsed time, speed, gear, distance and rev counter.
- Christmas tree overlay and a filling split-time strip.
- Timing slip laid out like a printed one.
- Development-only debug telemetry, including a live determinism check that
  replays each completed pass and confirms it reproduces exactly.

**Tests** — 77 covering determinism, numerical stability, tyre and weight
transfer behaviour, tree and red-light adjudication, and that driving well beats
driving badly in the expected shape.

**Notes**

- The Civic's figures approximate a real 2003 Civic Si and are *not* calibrated
  to the original game. It runs about 15.7s at 87mph.
- Controls, tree style and shift timing are assumptions. See HISTORICAL_NOTES.md.

## Stage 0 — Project Foundation

- npm workspaces: `packages/game-core` (pure TypeScript) and `apps/web` (React).
- TypeScript strict mode, project references, Vitest.
- Seven-tab navigation shell in period style; six screens are placeholders.
- Structured `Car`, `Part` and `Tune` models; Civic Si defined as data.
- `boundary.test.ts` enforces the gameplay/UI separation and the determinism
  rules as build failures rather than conventions.
