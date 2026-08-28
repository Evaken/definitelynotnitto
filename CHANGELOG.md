# Changelog

## The dashboard

The race view was rectangles: a slab of cluster along the bottom, boards either
side, a box for the road. The original is a moulded casting, and it now looks
like one.

- **An oval cowl** sweeps across the bottom with the gauges set into it, drawn
  as the top of a large ellipse most of which is off-canvas. Being an ellipse
  rather than a hand-drawn bezier is what makes it queryable: `dashTopY(x)` is
  how the tests check that every instrument is actually sitting on the dash and
  that the cowl never rises into the road.
- **Curved side panels** frame the view — not a border inside the viewport but
  two blocks of dashboard the road is a hole in, running the full height and
  finishing against the cowl. Their inner edge starts 62px inside the picture at
  the top, sweeps outward fast, and flattens out past the view's own edge as it
  runs into the dash. Arched, the way a windscreen header is.
- **The timing boards** are inset panels with raised bezels, sitting on the side
  panels rather than floating beside them.

All of it is overlay: the chrome is painted over the finished scene rather than
the scene being fitted around it. **`projection.ts` is untouched and so is
`game-core`** — the cowl can move without the road moving with it, which is the
same seam that made swapping the camera cost nothing in the simulator.

The panel curve was drawn wrong three times — convex, then pinched at the waist
instead of at the top, then bowing the wrong way while being deepened — before it
was right. The offsets in `chrome.ts` are measured off a marked-up screenshot,
and `chrome.test.ts` now asserts both the sweep direction *and* the bow: the edge
has to sit at least 20px outside the straight line between its own endpoints,
which is the check that would have caught all three.

The road view also grew, from 332 to 376 pixels tall, and the dashboard dropped
36 to meet it, so the picture fills the space that used to be black above the
dash. Nothing in the projection needed touching for that either — the view's
bottom edge is its only input, and `Z_NEAR` falls out of it.

This is the shape, not the finish. The original's casting is rendered metal with
photographic gauge faces; canvas paths get the silhouette and approximate the
material. Matching it wants a background image asset, which belongs with Stage
14 and the art pipeline Stage 8 needs regardless.

## Run history

A drag strip is a place you go again, and a single time on its own says almost
nothing. Every completed pass now collects in a table under the strip, newest
first, with the session's best ET, MPH, 60ft and reaction time called out above
it and the quickest run highlighted in the list.

Reset no longer throws that away. `Reset Run` mid-pass and `Run Again` once a
pass is done both keep the history; only changing car or tune clears it, because
those times belong to the car that set them.

Which run is the best is decided in `sim/records.ts` rather than in the
component, because it is gameplay logic rather than presentation — Stage 10 has
the server deciding whether a submitted run beats a standing record, and it will
need to agree with what the player was shown. Two rules there are worth knowing:

- **A red-lit run still counts for ET, MPH and 60ft.** The clock starts on the
  stage beam whether the driver left early or not, so the elapsed time is honest
  and was really achieved. It does not count for reaction time, where leaving
  early is the thing being measured and a negative light would win every time.
- **A run that never reached the finish is ignored outright**, rather than
  competing with a meaningless ET.

Times last as long as the tab does. Persisting them means deciding where they
live, which is Stage 9's question.

## The right Civic

The starter car was an EP3 with a K20A3. The original's is a sixth-generation EK
hatchback with a B16 — a different engine family, 1,400rpm more redline and far
less torque, made much higher up. `data/cars/civic-si.ts` now describes a B16A2:
160hp at 7,600, 111 lb-ft at 7,000, an 8,200 fuel cut, the S4C five-speed behind
a 4.266 final drive, in a car 140kg lighter.

Brought forward from Stage 15 for the reason the chase camera was brought
forward from Stage 14: Stage 2 is driving feel, and tuning feel against the wrong
engine family is work thrown away.

The car got quicker and considerably faster — **15.272 at 91.2mph**, against
15.747 at 87.7 — which is the shape you would expect from less weight and more
revs against less torque.

Two things the correction turned up, both of which are the interesting part:

**The tyre grip had to move with the engine.** `peakGrip: 1.15` was chosen for a
car 140kg heavier making 27Nm more. Against a stock B16 it is simply more grip
than the engine can overcome, and launch revs stopped mattering at all — more was
monotonically better right up to the limiter, with the 60ft flat to three decimal
places from 5,500 upward. The choice between bogging and wheelspin, which is one
of Stage 2's stated criteria, had quietly disappeared. At 1.05 there is a real
optimum at 5,500 with a genuine penalty either side.

That failure was invisible from the test suite, which stayed green throughout.
`goodDrivePlan` still short-shifted at 6,500 — 1,700rpm below the new limiter —
and launching above that tripped the scripted driver's upshift the instant the
car moved. The resulting cliff looked exactly like wheelspin and kept the
"there is an optimum" test passing for entirely the wrong reason. The plan now
shifts at 8,100 and holds 5,500.

**The shift point did not move, and was expected to.** The prediction, written
into `HISTORICAL_NOTES.md` and a test comment the day before, was that a peakier
engine would want a noticeably earlier shift. It does not: the S4C's ratios are
close enough that the revs barely fall on a change, so the next gear never
out-pulls the one selected before the limiter arrives. Where to shift is
unchanged. What changed is the cost of getting it wrong — short-shifting at 4,500
now throws away more than ten seconds, against nine before. Ratios turn out to
matter more here than the shape of the curve, which is an argument for having
computed the shift point rather than picked one.

All of it is still real-world approximation, not recovered from the game. The car
is now right *as a Civic*; whether it is right *as the original's Civic* is
unknown, and Stage 15 still owns that.

## A shift light, and a staging bar you can read backwards

Two instrument changes.

**The staging window moved to the middle of the left-hand bar.** It used to sit
at the top, with the bar showing only the nine metres of run-up behind it — so a
driver who rolled through the line had the marker pinned at the top edge with no
way to tell whether they were a foot past or ten. The window now sits centred
with five metres of scale either side, and both beams are drawn, so an overshoot
is a readable distance rather than a pegged needle. The car's spawn point lands
just inside the bottom of the bar, so the marker is on the scale from the first
frame.

**A green shift light sits between the tachometer and the speedometer.** Where
it lights is computed, not chosen:

    shift when  torque(rpm x drop) x nextRatio  >=  torque(rpm) x thisRatio

Final drive and tyre radius are the same either side of a change, so they cancel
and the comparison is just torque against gear ratio. Hardcoding a rev figure
would have been wrong for the second car added and wrong again as soon as Stage
4 lets the player edit ratios; this follows both.

On the stock Civic the answer is the limiter in every gear, which is not a
special case but a consequence of close gear ratios — the revs barely fall on a
change, so the next gear never gets ahead before they run out.
`BALANCE_NOTES.md` had already measured the same thing from the other end:
shifting at 6,800 beats shifting at 6,500. (Correcting the car to the EK B16 was
expected to move these shift points down. It did not — see the entry above.)

The LIMIT tell-tale went from green to amber. Two green lamps meaning opposite
things — *shift now* and *you left it too late* — was the wrong signal.

Neither change is sourced. The original's bar may have looked nothing like this
and may have had no shift light at all; both are recorded as inventions in
`HISTORICAL_NOTES.md`.

## The chase camera

The race view now looks down the strip from behind the car, as the original did.
It was side-on because `PROJECT_SPEC.md` said so twice, and it was wrong.

- **A perspective road**, built from bands rather than one trapezoid. A flat
  trapezoid is the correct shape for a straight road but gives the eye nothing
  to measure speed against, which is the only reason this view exists.
- **An instrument cluster** along the bottom: boost, tachometer with the car's
  own red zone, speedometer, gas and clutch bars, and a gear column reading
  `6 5 4 3 2 1 N R`. The boost gauge stays on a naturally aspirated car with its
  needle at rest, as the original's did, so the panel will not reflow when a
  turbo arrives in Stage 3.
- **The tree stands between the lanes in world space**, so it grows as the car
  rolls up to the line and whips past overhead on the launch.
- **Timing boards** flank the strip with a red LED elapsed time and the splits
  filling in as each mark passes; a position bar runs down the far left.
- The gas pedal is painted by the cluster with an invisible DOM element over it
  for the drag. Pointer capture and assistive technology are things the DOM does
  properly and a canvas does not.

**Nothing in `packages/game-core` changed.** Not one line. A drag strip never
turns and never climbs, so the whole projection is one division — everything on
the ground scales as 1/z — and the simulation, which is one-dimensional, never
had any idea where the camera was. `renderer/projection.test.ts` holds that
arithmetic to its shape; the six tests covering the old side-on body bounce were
retired with it.

`CarArtwork` in `renderer/carSprite.ts` is the seam for real car artwork. Colours
arrive as parameters rather than baked in, because the paint shop is hue,
saturation and brightness sliders over three separately tinted zones.

## Primary sources found — the race view is wrong

Three surviving screenshots of the original are now in `docs/reference/`. They
are the first primary sources this project has had, and they contradict the
specification.

**The race view should be a chase camera from behind both cars, not side-on.**
`PROJECT_SPEC.md` stated "side-on 2D drag racing" twice and Stage 1 was built to
it. The spec is corrected and the rebuild is tracked in `ROADMAP.md`, ahead of
Stage 2 — tuning driving feel against instruments that do not exist yet would be
work thrown away, and every later stage adds more UI on top of the view.

Also settled:

- Eight navigation tabs, not seven — `COMMUNITY` was missing from the spec.
- The Garage has four sub-sections: Modifications, Tune and Dyno, Paint Shop,
  Maintenance — which matches the stage plan almost exactly.
- The instrument cluster: boost, tachometer, speedometer, gas and clutch
  sliders, and a gear column reading `6 5 4 3 2 1 N R`. The boost dial stays
  visible and idle on a naturally aspirated car.
- The throttle really was a slider and the gear selector really did include
  reverse and neutral — both arrived at independently and both correct.
- There really was a clutch control. It stays deliberately unimplemented, and
  that is now recorded as a decision rather than an unknown.
- Paint is hue/saturation/brightness sliders over three separately tinted zones,
  costing $1,500 flat — the only confirmed price in the project.
- **The starter car is the wrong Civic.** The original's is a sixth-generation
  EK hatchback; this project models an EP3. Different engine family: a B16 revs
  past 8,000rpm and makes far less torque, much higher up. Left uncorrected for
  now because it moves every figure in `BALANCE_NOTES.md` at once.

Nothing in `packages/game-core` changed. The simulation is one-dimensional and
has no idea where the camera is.

## Stage 1d — Shut-down area

The car no longer stops dead on the finish line. It crosses the traps at speed
and coasts on down an open shut-down area until it rolls to a halt, is stopped
on the brakes, or the run is reset.

- **The throttle is cut at the line**, whatever the slider says. The run is over;
  what follows is a shut-down, not more racing.
- **No distance limit past the finish.** The strip, scenery and markers are all
  generated from the car's position, so there was never a track to run out of.
- **The timing slip is final at the line**, not when the car stops — it appears
  the moment the traps are crossed, and the clock on the dash freezes at the ET
  that was earned rather than counting on through the rollout.
- A free coast from 88mph takes about 84 seconds and 3,900 feet: engine braking
  while the clutch is still clamped, then aero and rolling losses once it drops
  below the lock-up speed. Standing on the brakes stops it in under twenty.

The phase model now distinguishes the run being over from the pass being over:
`isRunComplete` means the slip is final, `isPassComplete` means nothing further
will happen and stepping can stop.

## Stage 1c — Scenery and tree timing

- **The tree counts down one amber at a time.** Switched from the Pro tree
  (three ambers together, green 0.400s later) to the Sportsman tree at a full
  second per step: amber, amber, amber, green, each staying lit as the next
  comes on. Three seconds of countdown to read and time against instead of a
  flicker. The wait before the tree arms was trimmed to 1.8–3.2s to suit,
  leaving about five to six seconds from settling to the green.
- **Roadside scenery in three parallax layers** — a distant treeline, nearer
  trees on the verge, and trackside light posts at the full speed of the ground.
  The strip on its own gave almost nothing to judge speed against; surface
  texture flickering past reads as noise rather than movement. About a third of
  the scene's pixels now change over 60ms at speed.
- **The body works on its springs while the car is moving**, not just while
  staging. Driven by distance travelled rather than by a clock, so it stays in
  step with the ground scrolling past, settles when stopped, works harder with
  speed, and shakes more when the tyres are spinning. The wheels stay planted —
  bouncing those too would look like the car hovering.

## Stage 1b — Control fixes

- **The throttle is sprung.** Let go of the slider and it closes over about a
  second, the way a pedal does, rather than staying where it was dropped. The
  spring lives in `game-core` because it changes how the car drives, and is
  stepped alongside the physics rather than on an animation of its own.
- **Rolling through the stage line no longer starts the clock or draws a red
  light.** Driving past the line on the way in is a mistake made before the race
  began, not a foul — the clock only starts once the car has actually staged.
  Reverse back into the window, settle, and the tree arms as normal.
- **Fixed reset leaving the game unresponsive.** The frame pacer's accumulator
  was only drained by running the simulation, so a finished pass left on screen
  banked every millisecond of wall time. Reset after a couple of minutes and the
  new pass was simulated to death in a single frame — often straight past its
  own timeout — which looked like the button doing nothing. It is now drained
  while a pass is finished and rebased on every reset, from either the button or
  the R key.
- **Copy the timing slip as an image.** A button on the slip paints it to a
  canvas and puts a PNG on the clipboard, ready to paste into a chat or a forum
  post. No dependency, no DOM screenshotting.

Frame pacing moved into a `FrameClock` with its own tests, since the accumulator
bug above was invisible by inspection and is now a regression test.

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
