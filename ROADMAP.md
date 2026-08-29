# Roadmap

Current state of the project. Read this before starting work — it, not chat
history, is the record of where things stand (PROJECT_SPEC 12).

**Current stage: Stages 13–14 and the Stage 16 release foundation are complete. Stage 15 remains evidence-limited; public API activation needs a hosting target and secrets.**

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

The pipeline now has clean-room front three-quarter portraits for all ten normal
cars plus the three special cars, and model-specific rear strip portraits for
all ten normal cars. `VehiclePortrait` maps model id to art and applies each
owned car's persisted paint, graphics, wheel and ride-height state at runtime;
the race renderer reads the same selected build and paint state. Career-special
cars still use the data-driven rear fallback until dedicated rear art exists.

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
  performance metrics. Fitted hardware is identified in the component list and
  stats; the inaccurate glowing car hotspots and component overlays were removed.
- The workshop has original replacement component art, sound feedback,
  cursor-driven carousels and screen/component transitions. Exact art, sound
  and timing remain clean-room inventions rather than historical claims.
- The garage overview now follows the surviving multi-car layout: a horizontal
  owned-car carousel, per-car Vehicle Setup and selection controls, original-
  style ET readouts and a persistent selected-car rail. Each tile uses the exact
  owned model and that car's saved appearance rather than a hard-coded Civic.
- The overview was reduced to the cars themselves: two large period-style bays
  fill the screen, while moving the pointer toward either edge continuously pans
  larger collections without exposing a browser scrollbar. The same interaction
  is shared by the Showroom, department and product strips, with arrow-key and
  touch fallbacks.
- Garage Setup and the Speedshop now form one continuous build workflow. The
  exact selected car and appearance remain visible in the shop, requirements
  link directly to the missing part or stored inventory, and a completed
  installation retains its before/after results with direct Garage, Dyno and
  Test Track actions.
- Garage Setup now reveals only the hierarchy needed for the current decision:
  single-option subsystem bars and duplicate fitted/empty panels are omitted,
  stock systems collapse into one clear Speedshop action, and owned systems show
  one compact component selector and comparison beside the car.
- Vehicle Setup uses a fixed, reference-led game composition rather than a
  responsive dashboard: the customized car dominates a restrained blue stage,
  secondary subsystem choices live inside one contextual drawer, and generated-
  looking cards, graphs, stat tiles, glow effects and explanatory copy are absent.

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

### Stage 7 — Car Showroom and Core Vehicle Roster

- The full ten-car normal roster is structured data: Civic Si, RSX Type-S,
  Lancer Evolution VII, Supra Twin Turbo, Mustang SVT Cobra, Skyline GT-R,
  Neon SRT-4, RX-8, NSX and Viper SRT-10.
- Every car declares its own mass, curve, RPM range, gearbox, final drive,
  drivetrain, grip, aero and price. Roster tests run the first four through the
  simulator and prove distinct elapsed times.
- Car Showroom is a complete browse/spec/purchase flow with horizontal roster,
  ownership state, balance validation and garage selection.
- New test profiles begin with no car and $1,000,000. The garage is a collection,
  not a single slot: the full ten-car normal roster can be owned at once and the
  active vehicle can be switched without discarding any stored build.
- Each owned car retains its own fitted build, stored parts, tune, condition and
  appearance when another car is selected. Universal clean-room parts make the
  whole normal roster upgradeable while per-car catalog data remains unknown.
- All ten normal cars have model-specific rear race portraits; no physics or
  simulation branch checks a car id.

### Stage 8 — Visual Customisation

- Paint Shop is enabled with body hue, saturation, brightness, graphics hue,
  four wheel designs and adjustable ride height.
- Appearance is persistent per owned car, visible in the garage and workshop
  and used by the strip renderer. Garage portraits are recoloured at runtime,
  with optional masked graphics and wheel treatments, without multiplying
  full-car raster assets for every saved appearance.
- Ownership now uses immutable vehicle-instance ids rather than model ids. A
  player can own multiple copies of the same model, each retaining an
  independent performance build and versioned visual recipe.
- The recipe is catalogue-driven and server-validated: paint finish, graphic
  style, wheels, spoiler, exhaust tip, hood, roof/sunroof, lights and up to 24
  positioned decals. Adding a category grows the catalogue and renderer layers,
  not a matrix of pre-rendered combinations.
- Community member results can open a public garage showcase built from the
  same authoritative recipes; private inventory and tune data are not exposed.
- Cosmetics are isolated from build and vehicle performance and cost no money
  until historical pricing evidence exists.
- The Civic is the first calibrated layered-car pack: neutral body and paint
  masks, wheel slots, perspective decal surfaces and physical-part anchors are
  composed from the same saved recipe in garage-facing views and on the strip.
  This is the mechanical production pilot; its generated wheel/attachment art
  remains replaceable per layer. See `docs/CAR_RENDERING_PIPELINE.md`.

Completion criteria met:

- [x] Ten normal cars can be bought, selected, upgraded, tuned and raced.
- [x] The first four cars produce measurably distinct passes.
- [x] Simulator logic contains no Civic-specific performance branch.
- [x] Each owned model retains an independent visual setup without separate
      paint-specific renders.
- [x] Multiple copies of one model have distinct ids and independent recipes.
- [x] The server rejects unknown components and invalid decal placement.

### Stages 9–12 — Online Beta

- A separate Node API owns accounts, PBKDF2 password hashes, expiring sessions,
  garages, wallets, owned cars, inventory, saved tunes and a fifty-pass history.
  Versioned JSON persistence is atomic and intentionally replaceable by a
  production database without moving gameplay rules into the web client.
- Online garage actions and CPU-race payouts are server-authoritative. The web
  app can request a transaction but cannot submit a replacement cash balance,
  car list, part inventory or result slip.
- Player search and asynchronous challenges support heads-up and bracket modes.
  The server replays the stored input stream against an immutable build/tune
  snapshot; the defender sees neither the first slip nor its inputs beforehand.
- Heads-up fouls, bracket dial-ins, breakouts, double breakouts and ties are
  decided by pure shared rules. Cash is escrowed before either challenge can be
  committed and settlement is idempotent.
- Teams support creation, applications, invitations, leader/member roles,
  deposits, leader-only withdrawals, team-bank wagers, asynchronous team races
  and persistent team records.

Completion criteria met in automated service tests:

- [x] A session restores the same server-owned garage and race history.
- [x] Two racers can complete a challenge without overlapping online sessions.
- [x] Locked runs remain hidden and immutable until adjudication.
- [x] Heads-up, bracket and escrow edge cases have deterministic tests.
- [x] Teams can hold funds and resolve asynchronous races exactly once.

Deployment note: GitHub Pages serves only the web client. Cross-device accounts
become publicly usable when the API is deployed and `VITE_API_URL` is set in
Stage 16; this is an infrastructure activation dependency, not client storage.

### Stage 13 — Special Cars and Endgame

- Three purpose-built competition cars extend the showroom to a thirteen-car
  roster: Mopar Drag Car, F-Type Drag Special and Funny Car.
- Career wins gate the specials at 25, 60 and 100 victories, followed by large
  purchase prices. These are explicit clean-room progression assumptions; the
  historical membership/event gates have not been recovered.
- All three remain ordinary structured `Car` data. They use the same clutch,
  tyres, gearing, damage, appearance, ownership and server economy systems.
- Original transparent showroom renders give each class a recognisable period
  pre-rendered look without reusing client bitmaps, logos or liveries.
- Regression tests preserve the road car → drag car → funny car performance gap.

### Stage 14 — Historical UI Recreation

- Every top-level tab now has a functioning screen. Community is an online
  member directory rather than the last placeholder.
- The top navigation, masthead, Main, Challenge Info, Garage, Race Track,
  Speedshop, Showroom and Team flows share the fixed 960px, beveled silver,
  cyan-panel and black/gold visual hierarchy derived from the references.
- The painted Graphic Settings control is now interactive and provides a saved
  reduced-motion option without changing deterministic simulation timing.
- UI remains a clean-room composition using original code and assets.

### Stage 15 — Historical Calibration (evidence-limited)

- `docs/HISTORICAL_BALANCE_MATRIX.md` records current deterministic baselines,
  every planned historical field, the rough target classes from the spec and
  the evidence status for all thirteen cars.
- Factory clutch capacity now scales with factory torque. This fixes high-output
  road cars silently slipping a Civic-strength assumed clutch.
- Exact historical builds, gear ratios, stock ETs, prices and community tunes
  remain unrecovered. They are deliberately not fabricated or marked complete.

### Stage 16 — Administration, Security and Deployment

- Production API hardening includes request/body limits, strict replay-stream
  validation, security headers, expiring/revocable sessions, rate limiting,
  stderr error records and health reporting.
- Key-protected admin endpoints expose aggregate status, economy ledger, race
  inspection, account moderation/session revocation and on-demand backups.
- A production Docker image, persistent `/data` boundary, environment template
  and HTTPS/backup deployment guide are included.
- Actual public deployment remains pending a Node hosting provider, durable
  volume, domain/TLS termination and secrets. GitHub Pages cannot run the API.

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
| ✅ | 7 — Car Showroom and Roster | The other nine cars, proving the sim is truly data-driven |
| ✅ | 8 — Visual Customisation | Paint, wheels, ride height, layered 2D rendering |
| ✅ | 9 — Accounts and Persistent Profiles | Login, persistent garage, server-authoritative economy |
| ✅ | 10 — Asynchronous Challenges | The defining feature: race someone who is not online |
| ✅ | 11 — Heads-Up, Bracket, Wagers | Dial-ins, breakouts, escrowed cash |
| ✅ | 12 — Teams | Create, join, team funds, team races |
| ✅ | 13 — Special Cars and Endgame | Special drag cars and late-game progression |
| ✅ | 14 — Historical UI Recreation | Making it look like the original |
| ⚠️ | 15 — Historical Calibration | Matrix and regression framework done; primary evidence still missing |
| ⚠️ | 16 — Admin, Security, Deployment | Release foundation done; public hosting not activated |

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
- **Offline run history lasts as long as the tab does.** Signed-in profiles keep
  their last fifty verified passes on the server and restore them next session.
- **The canvas renders at device resolution now**, sized to the displayed box
  times `devicePixelRatio`. If a future change reintroduces a fixed `width`
  attribute on the canvas element, or `image-rendering: pixelated` in the CSS,
  the whole scene goes soft again — both were the original cause.
- **The dashboard now matches the composition, not the original pixels.** Its
  oval silver casting, overlapping dial hierarchy, sliders and gear rail follow
  the screenshot, but remain clean-room canvas and CSS rendering.
- **Graphic Settings is intentionally small.** It currently saves reduced
  motion; the canvas already follows device resolution and simulation timing is
  never coupled to rendering preferences.
- **The clutch is deliberately omitted.** The original had a `CLUTCH FEATHER`
  slider. Leaving it out is a project decision, not an oversight — but the
  neutral-rev launch technique exists *because* of that choice.
- **Community is a conservative member directory.** No reliable source shows
  the complete original Community feature set, so unsupported forums/chat have
  not been invented.
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
- **Career-special strip art remains generic.** All ten normal showroom cars now
  have model-specific clean-room rear portraits during a pass. The three
  career-unlocked specials still use the data-driven path fallback.
- **No opponent.** Single car against the clock until Stage 6, so the right lane
  and the right-hand timing board stay empty. That is a solo pass, which is a
  real thing on a real strip — not a bug.

## Deferred

Nothing has been deferred from Stage 0 or Stage 1.
