# Changelog

## Stage 6 — CPU Racing and Economy

- Replaced the Main placeholder with an offline race lobby, member summary and
  account activity ledger.
- Added easy, medium and hard CPU opponents with seeded reaction variance,
  different launch/shift behavior, progressive builds and hard-tier nitrous.
- Added on-track opponent state, hidden CPU results until finish, red-light and
  total-time adjudication, difficulty-scaled prizes and persistent W/L record.
- Logged prize winnings, part purchases and repairs in the saved garage state,
  with backward-compatible migration of older saves.
- Added tests for CPU determinism, difficulty progression, reaction variation,
  foul handling, payouts and record keeping.


## Stage 5 — Nitrous and Mechanical Damage

- Added street and race nitrous systems to the Speedshop, with distinct power
  and bottle duration plus an on-track hold control and replayable N binding.
- Routed nitrous torque through the existing clutch, gearing and tyre physics,
  making spray timing matter instead of applying a result-screen bonus.
- Added deterministic stress from nitrous, boost and over-rev operation, a
  persistent condition percentage and a performance penalty from damage.
- Enabled the Maintenance department with inspection state, retained-power
  readout, repair estimate and an atomic paid repair action.
- Added regression tests for nitrous ET, spray timing, unsafe-use stress,
  damaged performance and repairs.


## Stage 4 — Tuning and Dyno

- Enabled the workshop Tune & Dyno department with editable ratios for the
  selected car's real gear count, final drive, factory reset and calculated
  redline speed for every gear.
- Saved and validated tuning in the garage state, migrated older browser saves,
  and threaded the saved setup into every Race Track session.
- Added a chassis-dyno graph with horsepower and torque curves, peak output and
  RPM readouts, plus a previous-run comparison.
- Made the dyno consume the exact resolved engine curve used by racing, so
  fitted parts affect both systems without duplicated performance rules.
- Added completion tests proving gearing changes ET, a poor tune can erase a
  modified car's advantage, parts change dyno results and invalid saves recover.


## Race sprite transparency fix

- Removed the scene-canvas tint blend that coloured the full rectangular sprite
  bounds against the road. The Civic now renders with clean transparent edges.
- Left the paint parameters at the `CarArtwork` seam; later recolouring requires
  isolated body masks or an offscreen layer rather than scene compositing.

## Full race-interface fidelity rebuild

- Re-proportioned the race canvas so the title bar, eight-tab navigation,
  masthead, race view, instrument binnacle and selected-car rail fit as one
  bounded game interface.
- Replaced the angled Civic with an original straight-rear sprite and removed
  raster rotation, eliminating the sideways stance and frame-to-frame twitch.
- Replaced alternating asphalt blocks and geometric trees with smooth road
  shading plus an original transparent foliage and skyline plate.
- Restyled the timing towers, staging plates, centre prompt, dashboard, gauges,
  sliders and gear rail against the surviving Version 1.52 race screenshot.
- Restored the visible Community tab and Graphic Settings control; their future
  functionality remains explicitly deferred.
- All replacement raster assets are clean-room creations. No original client
  artwork, logos, binaries or extracted media were added.

## Race artwork fidelity pass

- Replaced the strip's geometric placeholder hatchback with an original 43KB
  transparent rear three-quarter Civic render.
- Matched the surviving Version 1.52 screenshot's low chase-camera composition
  while retaining live suspension movement, tyre smoke and brake lights.
- Kept a path-drawn fallback for loading and tests, and preserved the existing
  `CarArtwork` seam for the later multi-car and paint pipeline.
- No artwork, logos, brands or binaries from the original client are included.

## Stage 3.4 — Complete workshop experience pass

- Synced Evan's boost-pressure, clutch-capacity and conflict-replacement work
  before changing the workshop, so every preview uses the current simulation.
- Added versioned local persistence for cash, ownership and fitted hardware,
  with malformed and unknown saved parts safely discarded.
- Added live before/after power curves plus horsepower, torque, weight and grip
  comparisons to store and garage part details.
- Added factory-equipment diagrams, direct Speedshop navigation, product copy,
  tiered per-product visual variants and cursor-driven horizontal browsing.
- Fitted exhaust, forced-induction, wheel, suspension and weight-reduction
  hardware now changes the workshop car rather than only changing numbers.
- Added synthesised menu, selection, purchase, installation and engine-preview
  sounds with a persistent mute control; no sampled client audio was copied.
- Added screen wipes, component-install reveals, richer metal/carbon chrome and
  reduced-motion fallbacks.
- Replaced the 4.1MB live PNG pair with equivalent 66KB and 94KB WebP assets.

## Parts that replace instead of stacking

An audit of all thirty parts asked two questions: does each one actually change
the car, and where a part requires its predecessor, do both stay fitted?

Every part earns its place — twenty-eight change the car directly, and the two
that do not (the turbo manifold and the supercharger bracket) are mounting
hardware gating a compressor that changes it a great deal.

The second question found an exploit. Three ladders let two mutually exclusive
components stay fitted together and compound their effects:

- **intake** — a panel filter is an insert in the stock airbox and a cold-air
  replaces the airbox outright, so the filter has nothing left to sit in
- **tyres** — one set of tyres, and stacking them was worth 4% of grip on a car
  where grip is the binding constraint
- **engine management** — a standalone ECU replaces the stock one; reflashing
  the unit you just removed means nothing

Each now shares an exclusion group, so the upgrade replaces its predecessor and
leaves it owned but stored. The Speedshop already warns before a replacement, so
no new UI was needed.

`Race Turbo Kit` is now `Race Spec Turbo Upgrade Kit` — it adds boost to the
street kit rather than being a second turbocharger, and the name said otherwise.

**One is knowingly left wrong**, and recorded rather than quietly skipped: the
Race Clutch still keeps the Sports Clutch fitted. It cannot simply be given the
group, because `sports-clutch` is a prerequisite of both forced-induction kits
and the replacement cascade would uninstall the turbo along with the clutch it
sits behind. The fix is either a notion of tiers, or dropping the clutch
prerequisite and letting the physics enforce it — which it already does, since a
big turbo behind a stock clutch slips and comes out slower than standard.

Two of the Stage 3 garage tests asserted the old intake behaviour and were
rewritten rather than deleted: one now checks the swap the Speedshop offers, the
other moved to the exhaust ladder, which genuinely does stack.

## Boost is a pressure, not a percentage

The boost gauge did not move because nothing was making any boost. Forced
induction was a flat torque multiplier -- a turbo made the engine 32% stronger
everywhere -- so there was no pressure anywhere in the model for a gauge to
read, and `drawBoost` passed a hardcoded zero.

A part now declares the pressure it makes and the torque is derived from it, so
the needle and the shove come from one number and cannot disagree. The two
systems behave as differently as they should, because that difference is the
whole reason a game offers both:

| build | 1/4 ET | trap |
|---|---|---|
| stock | 15.158 | 91.2 |
| street blower | 14.188 | 102.0 |
| street turbo | 14.364 | 103.2 |
| race blower + grip | **13.087** | 110.2 |
| race turbo | 13.510 | **114.4** |

The blower is making pressure from idle and wins on elapsed time; the turbo
makes nothing below 4,300rpm and wins on trap speed. Neither was tuned to
produce that — it falls out of belt drive against exhaust drive.

Two things had to be fixed before any of it worked.

**Clutch capacity was a fixed 240Nm global**, which `config/historical.ts` had
flagged since Stage 1: *"Stage 3 will make this a property of the fitted
clutch."* It was not cosmetic. A turbo car making 317Nm could never lock a
240Nm clutch, so it slipped the whole way and was **slower than standard**. The
Sports and Race clutches now state what they hold, and the strongest fitted one
counts.

**The scripted driver chain-shifted.** The clutch is open through a change, so a
strong engine free-revs back past the shift point in about forty milliseconds
and the driver takes another shift, and another: four in 0.6 seconds, into fifth
gear at 29mph with engagement at 1%. The run was destroyed and the cause looked
like the boost model. It was not — every measurement in `BALANCE_NOTES.md` comes
through that driver, and a hand on a lever cannot shift twice in fifty
milliseconds. There is a floor on the interval now, and a regression test that
drives a deliberately over-torqued car and checks it still traps over 100mph.

Worth recording how long that took to find: the flat multiplier was replaced
first, the car got *slower*, and traction was blamed, then the clutch, then the
driver. Trap speed was the measurement that settled it — it is power-to-weight
and barely touched by grip, so a car trapping 68mph on 245hp was never a
traction problem.

## Stage 3.3 — Workshop graphics and motion pass

- Replaced the schematic garage-car outline with an original transparent
  three-quarter EK-style vehicle render and exposed engine hardware.
- Replaced symbolic Speedshop category art with original rendered intake,
  exhaust, ECU, turbo, clutch, wheel, suspension and weight-reduction artwork.
- Added client-like car arrival, scanning beam, selected-system hotspot,
  cascading submenu, product-card and detail-panel transitions.
- All new graphics are clean-room generated replacements with no original game
  binaries, artwork, logos or brands included.

## Stage 3.2 — Recovered 1.52 garage/store behaviour

- Added a clean-room behaviour map from a verified Version 1.52 client; no
  original scripts, artwork or binaries enter the public repository.
- Rebuilt Vehicle Setup around category, subsystem and owned-component detail
  screens instead of showing only currently fitted parts.
- Separated owned inventory from fitted hardware in the interface, with
  original-style Install Part and Uninstall Part actions.
- Added a required-hardware dialog that distinguishes installed,
  owned-but-stored and not-yet-owned prerequisites.
- Retained atomic purchase/install and conflict replacement behaviour, while
  documenting which historical facts are now sourced and which catalogue data
  remains provisional.

## Stage 3.1 — Workshop fidelity pass

- Rebuilt the Garage as a two-step flow: car overview first, then Vehicle Setup.
- Added session average ET, best ET and completed-pass count to the selected car.
- Rebuilt the Speedshop around an illustrated horizontal department carousel and
  a separate product-card screen with fictional period brands and effect readouts.
- Combined purchase and installation into one confirmed transaction. Conflicting
  hardware and anything that depends on it are listed and replaced atomically.
- Added the original-style Back hierarchy, locked future departments, schematic
  component highlighting and a persistent selected-car/account/challenge rail.
- Based the interaction hierarchy on the Version 1.53 overview footage recorded
  in `HISTORICAL_NOTES.md`; later-stage mechanics remain locked rather than faked.

## Stage 3 workshop presentation pass

- Rebuilt Garage and Parts Shop as a period game interface with two levels of
  clickable menus, a persistent vehicle bay and category-specific inventories.
- Added selectable product rows, a dedicated part detail panel, purchase and
  installation feedback, fitted-part management and live build statistics.
- Exposed later workshop departments as clearly locked roadmap features rather
  than pretending they are already implemented.
- Kept the existing deterministic garage and parts logic unchanged beneath the
  new presentation.

## Stage 3 — Garage and Speedshop

The first upgrade loop is playable. A session starts with $10,000; the
Speedshop offers 30 Civic parts, and purchased parts can be installed or
removed in the Garage. Requirements, funds, compatibility and mutually
exclusive intake and forced-induction paths are enforced in game-core.

Parts resolve into an effective car whose torque, mass, grip and driveline
changes feed the deterministic simulator. Prices and effects are provisional
assumptions until Stage 15. Persistence remains Stage 9, CPU winnings Stage 6,
gear tuning and dyno Stage 4, and nitrous and damage Stage 5.

## Two artefacts down the left edge, and square tyres

A dark stripe between the timing panel and the grass, and a thin grey line just
inside it. Both were mine, and they had different causes.

**The stripe was bare canvas.** I first blamed the panel's drop shadow, changed
it, and the stripe was still there — the fix that mattered came from sampling a
row of pixels instead of reasoning about the code:

    x=205: 69,76,89   board bezel
    x=208: 61,56,48   panel edge
    x=211: 11,13,17   <- nothing had drawn here
    x=214: 64,94,64   grass

A three-pixel gutter between the board's bezel and the road view, painted by
nothing at all. The side panels used to cover it; once their curve swept
outward past the view's own edge — below about y=130 — they stopped reaching,
and the background showed through. The boards are three pixels wider now so
their bezels meet the view, and `chrome.test.ts` asserts that they do.

The shadow change stands on its own merits — a 4px stroke has a hard edge on
*both* sides, so it read as a band painted on the grass rather than as the panel
standing proud of it, and it comes off the fill with `shadowBlur` now. But it
was not the bug.

**The grey line was the viewport's own border.** `strokeRect` around the road
view made sense when the view was a box in a rectangular layout. Once the side
panels swept outward past the view's own edge — anywhere below about y=130 —
that border stopped being covered and showed through onto the scene as a hairline.
The panels frame the sides now, the canvas edge is the top and the cowl covers
the bottom, so the border was bounding nothing. Removed.

**The tyres are rectangles**, as wide as the gap between the track and the body
(0.22m, which is a real tyre) so their outer walls line up with the flanks
rather than standing proud of them. A wheel's axis points across the car, so
from behind you see the tread band edge-on: as wide as the section, as tall as
the diameter. The round faces are turned away and contribute nothing.
Drawing ellipses put the circle in the one plane where it cannot be seen, which
is why it looked wrong without it being obvious why. The gradient across the
width is the only curvature there is to show.

## Why the canvas looked blurry

Everything drawn on the race canvas was soft — the timing boards, the stage
plates, the prompt, the dials — while the DOM text a few pixels away was sharp.
Two causes, compounding.

The canvas had a fixed 960x600 backing store and `width: 100%` in CSS, so the
browser was stretching it to whatever the container happened to be — 972px, a
1.0125x upscale. Then `image-rendering: pixelated` forced that fractional
upscale through nearest-neighbour, which is exactly the wrong filter for smooth
vector art and is what turned 8px labels to mush. On top of that the buffer was
960 device pixels wide regardless of display density, so a 1.1x display upscaled
it again.

The backing store is now sized in JS to the displayed box times
`devicePixelRatio`, with the context scaled by the same factor — 1070x669 on
this machine instead of 960x600, and 1920x1200 on a 2x display. **Every drawing
function still works in the same 960x600 coordinates**; the scale lives entirely
in the transform, so nothing in `renderer/` had to change. A `ResizeObserver`
keeps it in step, and the render loop re-checks `devicePixelRatio` in case the
window is dragged to a different monitor.

`image-rendering: pixelated` is gone.

## The shift light moved onto the tacho

The reference puts it lapping the tachometer's rim at the upper right, not
floating in the gap beside it — and after the dials were clustered there was no
gap left to float in. It now laps the rim by a few pixels, wearing the same
brushed ring the dials do.

Its label moved onto the lens, since there is no room under it any more. The
colour is shaded off whatever the lamp is showing rather than being a fixed
grey: a shade darker than the dead glass when the lamp is out, a deeper green
when it lights. Enough to name the lamp at a glance, never enough to compete
with the thing it is naming.

## The instrument binnacle

The three dials were a row of evenly spaced discs. In the original they are a
cluster: the tachometer much the largest, riding slightly higher than its
neighbours and lapping over both, with boost and speed not touching each other
at all. Radii and spacing were measured off a marked-up reference and carried
across at scale — 66, 96 and 84 pixels, overlapping by 16 and 9.

They are painted outside-in so the tacho lands in front of both. Any other order
reads as discs stacked wrong rather than as one binnacle.

The prompt text — `ROLL UP`, `STAGED`, `RED LIGHT` — moved to the top of the
view, between the two stage plates. It used to sit low and centred over the road
as the original's `STAGING` does, but the dashboard now reaches up into that
space and was cutting it in half. Worth naming as a deliberate departure from
the reference rather than letting it look like one nobody noticed.

## Colour, and the last of the black bands

The race panel had two strips of dead black in it: a thin one above the road
view and a wider one between the view and the dashboard. Both are gone. The view
starts at the very top of the canvas now and runs down *behind* the cowl, which
overlaps its bottom edge rather than sitting below it — 412 pixels tall against
332 two commits ago.

That overlap is the first time the chrome covers any of the scene, so the test
guarding it changed rather than being deleted: it used to assert the cowl never
touched the view, and now asserts it takes less than 15% of it and stays nowhere
near the horizon. `projection.ts` still knows nothing about any of it.

**The side panels are mustard and the dashboard is silver falling to black**,
following the original. The warm/cool split is doing work rather than being
decoration: the surround being the one warm thing on screen is a large part of
why the road view reads as lit from outside instead of as another panel.

The `GAS` and `CLUTCH` labels moved under their bars. Above them they collided
with the cowl's leading edge once the dash came up to meet the view; below the
bars was where they belonged in the first place, and the earlier objection to it
— that rotated labels ran off the bottom of the canvas — only ever applied to
rotated ones.

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
