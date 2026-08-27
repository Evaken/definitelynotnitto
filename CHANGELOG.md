# Changelog

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
