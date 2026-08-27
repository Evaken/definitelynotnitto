# Roadmap

Current state of the project. Read this before starting work — it, not chat
history, is the record of where things stand (PROJECT_SPEC 12).

**Current stage: Stage 1 complete. Stage 2 is next.**

---

## Completed

### Stage 0 — Project Foundation

- npm workspaces: `packages/game-core` (pure TypeScript) and `apps/web` (React).
- TypeScript strict throughout, project references, Vitest.
- Navigation shell with all seven period screens.
- Structured `Car`, `Part`, `Tune` models.
- Honda Civic Si defined as data.
- Simulation API in place and exercised by tests.

Completion criteria met:

- [x] Application launches consistently (`npm run dev`).
- [x] Navigation shell works — all seven tabs render.
- [x] Civic loads from structured data (`civic-si.test.ts`).
- [x] Tests instantiate a Civic and call the simulation interface.
- [x] Gameplay logic separate from React — enforced by `boundary.test.ts`,
      not merely by convention: `game-core` has no React dependency to import.

### Stage 1 — Basic Drag Race Simulator

- Side-view drag strip on a fixed 960×440 canvas.
- Pre-stage and stage beams at true spacing, with modelled rollout.
- Christmas tree (Pro and Sportsman both implemented, Pro selected).
- Throttle, manual gear selection, launch, shift, rev limiter.
- Slip-ratio tyre model with dynamic weight transfer — wheelspin and bogging
  both emerge from one curve.
- Two-body driveline: engine and wheels integrate separately while the clutch
  slips, then lock into one rigid body.
- Reaction time, 60ft, 330ft, 1/8 ET + MPH, 1000ft, 1/4 ET + MPH, red light.
- Timing slip presentation.
- Development-only debug telemetry panel.
- Input recording and replay — a pass is reproducible from its inputs alone.

Completion criteria met:

- [x] Player can manually stage the Civic.
- [x] Tree sequence works, including red lights.
- [x] Player can launch, shift and finish a quarter mile.
- [x] Timing slip generated correctly.
- [x] Different input sequences produce different outcomes — see
      `driving.test.ts`, which pins the *shape* of those differences.

---

## Next: Stage 2 — Nitto Driving Feel

Much of Stage 2's groundwork exists because building it later would have meant
rewriting the launch model. What already works:

- Launch rpm matters, with an optimum between bogging and wheelspin.
- Shift timing matters; short-shifting costs both ET and trap speed.
- Staging depth trades elapsed time against reaction time.
- Shift dead time is modelled.

Stage 2 acceptance criteria still to meet:

- [ ] Retry/reset flow beyond the current single-key reset.
- [ ] Best ET tracking across runs.
- [ ] Historical-style timing slip presentation refined against references.
- [ ] Throttle response tuned — currently a hard on/off, not a modulation.
- [ ] Physics calibration tests tightened from today's wide plausibility bands.
- [ ] Confirm the stock Civic's pass is plausible *for the original game*,
      rather than merely plausible for a real Civic Si.

---

## Known limitations

- **The Civic's figures are real-world approximations, not values recovered
  from Nitto 1320 Challenge.** It currently runs about 15.7s at 87mph. That is
  reasonable for a real 2003 Civic Si; whether it matches the original game is
  unknown. Calibration is Stage 15.
- **The control scheme is a guess.** See HISTORICAL_NOTES.md.
- **The tree style is a guess.** Pro tree assumed; Sportsman is implemented and
  one config value away.
- **Staging depth is capped** at roughly 7.6cm past the beam, because the car is
  held once staged. Deeper staging than that is not reachable.
- **Throttle is binary.** Fine for keyboard play; Stage 2 should decide whether
  the original had any modulation.
- **No opponent.** Single car against the clock until Stage 6.

## Deferred

Nothing has been deferred from Stage 0 or Stage 1.
