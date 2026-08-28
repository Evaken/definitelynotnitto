# Roadmap

Current state of the project. Read this before starting work — it, not chat
history, is the record of where things stand (PROJECT_SPEC 12).

**Current stage: Stage 6 complete. Stage 7 is next. The Offline Alpha milestone is playable.**

Stage 1 is complete, the race view has been rebuilt around a chase camera, and
the starter car has been corrected from an EP3 to the EK B16 the original
actually used. Two of Stage 2's criteria are blocked on evidence nobody has —
they are listed below, open rather than ticked.

Surviving screenshots turned up in [`docs/reference/`](docs/reference/) after
Stage 1 was finished and showed the race view was wrong -- the original used a
chase camera from behind both cars, not the side-on view the spec described.
That has been rebuilt.

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

- Chase-camera drag strip on a fixed 960×600 canvas: perspective road, timing
  boards, centre tree and a full instrument cluster.
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
- Roadside trees and light posts placed in world space, and a body that works
  on its springs as the car travels.
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

## The view rebuild (done)

`PROJECT_SPEC.md` said "side-on 2D drag racing" twice. It was wrong, and Stage 1
was built to it. `docs/reference/race-view-two-civics.webp` shows what it should
be, and the renderer now matches.

Done before Stage 2 rather than waiting for Stage 14, because Stage 2 is driving
feel — tuning launches and shifts against instruments that did not exist yet
would have been work thrown away, and every later stage adds more UI on top.

What changed:

- `apps/web/src/race/renderer/**` rewritten around a `projection.ts` that turns a
  distance into a screen position. A drag strip never turns and never climbs,
  which removes almost everything that makes a pseudo-3D road renderer hard
  — what is left is one division, and everything in the scene shares it.
- The HUD became a bottom instrument cluster: boost, tachometer, speedometer,
  gear column, gas and clutch bars.
- The tree stands between the lanes in world space, so it grows as the car rolls
  up to the line and whips past overhead on the launch.
- Timing boards flank the strip; a position bar runs down the far left.
- The gas pedal is painted by the cluster with an invisible DOM element over it
  for the drag. Pointer capture and assistive technology are things the DOM does
  properly and a canvas does not.

What did **not** change:

- `packages/game-core` — all 2,200 lines of it. Not one line. The simulation is
  one-dimensional and has no idea where the camera is.
- Every test except the six covering the old side-on body bounce, which were
  replaced by `renderer/projection.test.ts`.

The seam that made this affordable is `drawRace(ctx, state)` — one function,
called in one place. Keep it that way.

### Race-interface fidelity pass

The first clean-room Civic strip render exposed the remaining mismatch rather
than fixing it: it faced diagonally across a straight lane, rotated with body
pitch and sat inside flat alternating road bands and geometric tree shapes. The
full race interface was rebuilt against the Version 1.52 screenshot:

- straight-rear Civic art with vertical suspension travel but no raster
  rotation;
- smooth asphalt, dense transparent foliage and a distant skyline;
- shorter original-proportioned race canvas, silver oval instrument binnacle,
  period timing towers, white/red staging plates and the centre staging arrow;
- blue title bar, eight silver navigation tabs, black/gold 1320 masthead,
  Graphic Settings control and selected-car status rail.

This is sourced composition with original assets and code, not recovered client
media. Community and Graphic Settings are visual entry points only until their
scheduled functionality exists.

### The car art seam

Two angles are needed per car: three-quarter front for the showroom, garage and
status-bar thumbnail, rear three-quarter for the strip. Ten cars makes twenty
renders, each tintable in three separate zones because the paint shop is HSB
sliders rather than preset colours.

That full pipeline is not solved, and deliberately so. What exists is the seam:
`CarArtwork` in `renderer/carSprite.ts`, now backed on the strip by an original
clean-room Civic rear render. `PLACEHOLDER_CAR` remains as the loading and test
fallback. Colours still arrive as parameters, but the present single bitmap can
only take a light tint glaze; separately tintable body, graphics and number
layers remain Stage 8's work.

Still to add: `drawThreeQuarter`, once there is a screen that needs it.

## Stage 2 — Nitto Driving Feel

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

Stage 2 acceptance criteria:

- [x] Launch technique matters, with a clear optimum between bogging and
      wheelspin. Nearly lost when the car was corrected — see BALANCE_NOTES.
- [x] Shift technique matters, and now matters far more than it did.
- [x] Retry/reset flow beyond the current single-key reset. `Run Again` when a
      pass is done, `Reset Run` mid-pass, and the history survives both.
- [x] Best ET tracking across runs. Session bests for ET, MPH, 60ft and R/T,
      with the quickest pass called out in the table (`sim/records.ts`).
- [ ] Historical-style timing slip presentation refined against references.
      **Blocked, not skipped:** none of the three surviving screenshots shows a
      timing slip, so there is no reference to refine against. Reopen this if
      one turns up.
- [ ] Physics calibration tests tightened from today's wide plausibility bands.
      **Deferred to Stage 15.** Tightening them now would mean inventing a
      target, since nothing is known about the original's numbers. The bands
      exist to catch a wildly wrong change, and that is all they can honestly do
      until there is evidence.
- [ ] Confirm the stock Civic's pass is plausible *for the original game*,
      rather than merely plausible for a real Civic Si. **Deferred to Stage 15**,
      same reason. The car is now at least the right car.

Two of the five remaining items are blocked on evidence nobody has, rather than
on work nobody has done. They are left open rather than ticked, and Stage 3 is
fair game.

---

## Stage 3 — Garage and Parts Shop

- The garage follows the Version 1.53 visual hierarchy and the recovered 1.52
  state flow: selected-car overview, Vehicle Setup, department tabs, top-level
  modification category, subsystem and component detail over a rendered car.
- Owned inventory is separate from fitted hardware. Stored parts can be
  installed again and installed parts can be returned to storage.
- Session average ET, best ET and completed runs appear on the selected car and
  survive navigation away from the Race Track until the build changes.
- The Speedshop opens on illustrated department cards, then drills into branded
  product cards with price, effect information and an original-style required
  hardware dialog distinguishing installed, stored and missing components.
- Purchase and installation are one confirmed transaction. A conflicting part
  opens a replacement dialog listing every component that will be removed; the
  entire change succeeds or fails atomically in game-core.
- Tune and Dyno, Paint Shop and Maintenance are visible as locked departments so
  the workshop feels like a larger game without implementing later stages early.
- Nitrous is visible as a locked Speedshop department until Stage 5.
- A persistent bottom rail carries the selected car, cash and challenge status
  across the Garage and Speedshop flows.
- Cash, owned parts and the fitted build persist locally between visits. This is
  browser-only; Stage 9 still owns account and authoritative server saves.
- Part detail screens show simulation-derived before/after power curves and
  performance metrics, while visible workshop overlays reflect fitted systems.
- The workshop has original replacement component art, sound feedback,
  cursor-driven carousels and screen/component transitions. Exact art, sound
  and timing remain clean-room inventions rather than historical claims.

### Stage 4 — Tuning and Dyno

- Tune & Dyno is now a working garage department with one control per actual
  forward gear, a final-drive control, factory reset, per-gear redline speed
  projections and persistent saved setups.
- Tune validation belongs to game-core: gear count follows the selected car,
  ratios must descend, and all values stay inside documented assumed ranges.
- The Race Track consumes the saved tune rather than silently recreating stock
  gearing. Tune changes clear incompatible run history just like build changes.
- The chassis dyno samples the resolved engine torque curve used by the race
  simulation and reports horsepower, torque, their peak RPM and a previous-run
  overlay. Gearing correctly has no effect on engine-only dyno output.
- Old Stage 3 browser saves migrate to stock gearing; malformed persisted tunes
  are repaired without discarding cash or owned parts.

Completion criteria met:

- [x] Gear ratios and final drive materially affect quarter-mile performance.
- [x] A deliberately poor tune can make a modified car slower than stock.
- [x] Installed performance parts change dyno power and torque.
- [x] Dyno and race use the same resolved vehicle and engine model.

### Stage 5 — Nitrous and Mechanical Damage

- Street and race nitrous systems are real purchasable parts with different
  output and bottle duration. A fitted system adds a hold-to-spray N₂O control
  on the strip and a keyboard binding, and its state is recorded in replays.
- Nitrous adds power at the crank through the same driveline and tyre model as
  ordinary engine torque, so an early hit can overwhelm available traction.
- Each pass accumulates deterministic mechanical stress from nitrous, boost and
  operation near the limiter. Completed-pass wear becomes persistent vehicle
  condition when the player leaves the track.
- Condition directly derates the resolved engine curve, affecting both racing
  and dyno output. Maintenance shows retained power and repair cost, then
  restores condition through a validated cash transaction.
- All thresholds, wear rates and repair prices are isolated in historical
  configuration and labelled assumed pending Stage 15 calibration.

Completion criteria met:

- [x] Nitrous materially improves elapsed time.
- [x] Spraying in different gears produces different results.
- [x] Aggressive use produces more mechanical stress than a dry pass.
- [x] Damaged cars lose performance and require a paid repair.

### Stage 6 — CPU Racing and Economy

- Main is now the offline race lobby and player overview, with cash, win/loss
  record, condition, fitted-upgrade count and a persistent account ledger.
- Easy, medium and hard CPU opponents use deterministic reaction, staging,
  launch, shift and (on hard) nitrous profiles. Their builds and behavior make
  each tier measurably faster without result-screen cheating.
- Starting a challenge prepares the opponent's verified pass and moves to the
  Race Track. The opponent is staged in the other lane's presentation; its slip
  stays hidden until the player's run is adjudicated.
- Red lights and incomplete passes lose. Otherwise reaction time plus elapsed
  time decides the winner. Wins pay difficulty-scaled prize money; losses still
  update the persistent record.
- Part purchases, repair bills and prize winnings feed a bounded transaction
  log in the same saved garage profile.

Completion criteria met:

- [x] A new player can race three levels of CPU opponent.
- [x] Wins earn money that can buy upgrades and repairs.
- [x] Parts, tuning, dyno, nitrous, damage and repair form one progression loop.
- [x] Race record and account activity persist with the offline profile.

---

## All sixteen stages

The whole plan, so anyone can see what is coming and pick up the next piece
without reading all 1,368 lines of the spec. Each links to its own section of
`PROJECT_SPEC.md`, which gives the build list and completion criteria.

Stages are meant to be taken in order — each assumes the one before it — but
that is the only constraint. If Stage 2 is done and nobody has started Stage 3,
Stage 3 is yours.

| | Stage | What it adds |
|---|---|---|
| ✅ | 0 — Project Foundation | Skeleton, data models, navigation shell |
| ✅ | 1 — Basic Drag Race Simulator | A drivable quarter-mile pass and a timing slip |
| ✅ | *(view rebuild)* | *Chase camera and instrument cluster — the spec had the view wrong* |
| ✅ | *(chrome pass)* | *Oval dashboard, curved side panels, inset timing boards — shape only* |
| ✅ | 2 — Nitto Driving Feel | Launch and shift feel, run history and best-ET tracking |
| ✅ | 3 — Garage and Parts Shop | 30 Civic parts, install/remove, the first progression loop |
| ✅ | 4 — Tuning and Dyno | Gear ratios, final drive, horsepower and torque curves |
| ✅ | 5 — Nitrous and Mechanical Damage | Nitrous timing, mechanical stress, repair costs |
| ✅ | 6 — CPU Racing and Economy | Easy/medium/hard opponents, prize money — the first offline alpha |
| ▶️ | **7 — Car Showroom and Roster** | **The other nine cars, proving the sim is truly data-driven** |
| | 8 — Visual Customisation | Paint, wheels, ride height, layered 2D rendering |
| | 9 — Accounts and Persistent Profiles | Login, persistent garage, server-authoritative economy |
| | 10 — Asynchronous Challenges | The defining feature: race someone who is not online |
| | 11 — Heads-Up, Bracket, Wagers | Dial-ins, breakouts, escrowed cash |
| | 12 — Teams | Create, join, team funds, team races |
| | 13 — Special Cars and Endgame | Mopar drag car, funny car, late-game progression |
| | 14 — Historical UI Recreation | Making it look like the original |
| | 15 — Historical Calibration | Making the cars *perform* like the original |
| | 16 — Admin, Security, Deployment | Balance tools, moderation, monitoring |

Milestones: **Prototype** 0–2 · **Offline Alpha** 3–6 · **Garage Alpha** 7–8 ·
**Online Beta** 9–12 · **Historical Recreation** 13–16.

### Two things that will constrain later stages

Worth knowing now, because they were built for deliberately and are easy to
undo by accident.

**Stage 10 needs the simulation to run outside a browser.** The server has to
re-run a submitted race to check the claimed time. That is why `game-core` has
no UI dependency and why `replayPass` exists — it already works, and
`determinism.test.ts` keeps it working.

**Stage 15 needs today's loose tests to stay loose.** Nothing is calibrated to
the original game yet, so performance assertions are comparative. Writing a test
that asserts an exact ET now means rewriting it later.

---

## Known limitations

- **The Civic's figures are real-world approximations, not values recovered
  from Nitto 1320 Challenge.** It runs about 15.3s at 91mph, which is reasonable
  for a real 1999 Civic Si. Whether it matches the original game is still
  unknown, and calibrating to that is Stage 15. The car is at least the right
  car now: the EP3/EK mistake is fixed.
- **Run history lasts as long as the tab does.** Times are held in memory and
  go when the page is reloaded or the car changes. Persisting them means
  deciding where they live, and that is Stage 9's question — writing to local
  storage now would be a second answer thrown away when accounts arrive.
- **The canvas renders at device resolution now**, sized to the displayed box
  times `devicePixelRatio`. If a future change reintroduces a fixed `width`
  attribute on the canvas element, or `image-rendering: pixelated` in the CSS,
  the whole scene goes soft again — both were the original cause.
- **The dashboard now matches the composition, not the original pixels.** Its
  oval silver casting, overlapping dial hierarchy, sliders and gear rail follow
  the screenshot, but remain clean-room canvas and CSS rendering.
- **`GRAPHIC SETTINGS` is visual only.** The control is present where the
  original put it, but there are no adjustable rendering options yet.
- **The clutch is deliberately omitted.** The original had a `CLUTCH FEATHER`
  slider. Leaving it out is a project decision, not an oversight — but the
  neutral-rev launch technique exists *because* of that choice.
- **`COMMUNITY` is a placeholder.** Its tab is restored, but no reliable source
  shows what the original community screen contained.
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
- **Car artwork is only complete for the current Civic screens.** The strip now
  uses an original clean-room rear three-quarter render and the workshop uses a
  separate front three-quarter render. The other cars and true layered body,
  graphics and number tinting still belong to Stages 7–8.
- **No opponent.** Single car against the clock until Stage 6, so the right lane
  and the right-hand timing board stay empty. That is a solo pass, which is a
  real thing on a real strip — not a bug.

## Deferred

Nothing has been deferred from Stage 0 or Stage 1.
