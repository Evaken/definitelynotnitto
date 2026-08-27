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

- Side-view drag strip on a fixed 960×440 canvas at 58 px/m.
- Drag-slider throttle, 0–100%, sprung shut on release, and the only way to open
  the throttle.
- Gear selector R / N / 1…n; the car starts in neutral and needs a gear *and*
  throttle to move. Reverse works.
- Manual braking.
- Staging as a driving problem: stop the nose inside a 1.2 m window on momentum
  or on the brakes, or roll through and reverse back in without penalty.
- Timing slip copyable to the clipboard as an image.
- Christmas tree counting down one amber a second, then the green (Pro and
  Sportsman both implemented, Sportsman selected).
- Roadside scenery in three parallax layers, and a body that works on its
  springs as the car travels.
- An open shut-down area past the finish: throttle cut at the line, car
  coasting on until it stops or is braked.
- Rev limiter, shift dead time.
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

- Launch technique matters, with a clear optimum between bogging and wheelspin.
  Holding revs in neutral and selecting first on the green is the quick way, and
  it emerges from the physics rather than being scripted.
- Shift timing matters; short-shifting costs both ET and trap speed.
- Staging depth trades elapsed time against reaction time, by about 0.4 s each
  way across the window.
- Throttle is analogue, so how sharply it is opened changes the launch.
- Shift dead time is modelled.

Stage 2 acceptance criteria still to meet:

- [ ] Retry/reset flow beyond the current single-key reset.
- [ ] Best ET tracking across runs.
- [ ] Historical-style timing slip presentation refined against references.
- [ ] Physics calibration tests tightened from today's wide plausibility bands.
- [ ] Confirm the stock Civic's pass is plausible *for the original game*,
      rather than merely plausible for a real Civic Si.

---

## Known limitations

- **The Civic's figures are real-world approximations, not values recovered
  from Nitto 1320 Challenge.** It currently runs about 15.7s at 87mph. That is
  reasonable for a real 2003 Civic Si; whether it matches the original game is
  unknown. Calibration is Stage 15.
- **The control scheme is a design decision, not a reconstruction.** The
  original's is unknown. See HISTORICAL_NOTES.md.
- **The staging window is deliberately unrealistic** at 1.2 m, against the 7
  inches NHRA runs. A realistic window is not a playable target.
- **The tree style is a guess.** A Sportsman tree at one second a step is
  assumed, and slowed from the half-second NHRA runs it at; the Pro tree is
  implemented and one config value away.
- **The engine cannot stall,** and is clamped at idle instead. Dropping the
  clutch at walking pace bogs rather than cutting out.
- **The throttle slider is pointer-only.** It carries ARIA roles for screen
  readers but no key bindings, because the obvious keys are taken by the gear
  selector and brake.
- **No opponent.** Single car against the clock until Stage 6.

## Deferred

Nothing has been deferred from Stage 0 or Stage 1.
