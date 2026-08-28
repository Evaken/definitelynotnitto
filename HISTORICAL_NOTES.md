# Historical Notes

## Stage 3 parts and prices are assumptions

The surviving gameplay video and static analysis of the verified Version 1.52
client confirm the Speedshop layout, Garage state model and presence of branded
parts and prices, but not a complete catalogue or performance model. Stage 3
therefore uses 30 neutral part names with
provisional prices and conservative effects. They are not claims about the
original and are tagged for Stage 15 calibration. No product photographs were
copied.

The Stage 3.3 garage car and component renders are also new replacement art,
not recovered client media. Their early-2000s pre-rendered presentation follows
the source's broad visual language, while the specific vehicle render, parts,
lighting and animation are independently created. They must not be treated as
historical evidence for exact artwork or motion timing.

Stage 3.4 extends those inventions with fitted-part overlays, synthetic Web
Audio feedback, product descriptions, tier marks and before/after graphs. These
are interface improvements, not recovered historical facts. Local browser
persistence was brought forward as a usability measure; Stage 9 still owns
accounts and authoritative server persistence.

What is actually known about the original pre-2007 Nitto 1320 Challenge, and
what has been invented to get the game running.

PROJECT_SPEC 11.12 and 11.13: document uncertain behaviour rather than inventing
certainty, and isolate unknown rules behind configuration.

**Primary references are catalogued in [`docs/reference/`](docs/reference/).**
They include three surviving screenshots and a clean-room behaviour map from a
verified Version 1.52 client. Everything else is still real-world drag racing
practice or an outright assumption.

This document should get longer and more confident, not shorter. Add sources to
`docs/reference/` as you find them and record what they settle here.

## Confidence levels

Values in `packages/game-core/src/config/historical.ts` carry one of these tags:

| Tag | Meaning |
|---|---|
| `sourced` | Confirmed from period documentation, screenshots or code. |
| `real-world` | Correct for real drag racing, unverified for the game. |
| `assumed` | A plausible guess. Suspect it. |

A `sourced` entry must say *which* screenshot settles it, so the claim can be
re-checked.

---

## Confirmed — `sourced`

### The race view is from behind the cars, not side-on

Source: `race-view-two-civics.webp`.

A chase camera down the strip, both lanes in shot, cars in rear three-quarter
view. The tree stands in the centre between the lanes with a bulb column each,
and `PRE-STAGED` / `STAGED` boxes above it. Timing boards flank the strip
carrying a sponsor logo and a red LED elapsed time.

**`PROJECT_SPEC.md` said "side-on 2D drag racing" and Stage 1 was built that
way.** Both the spec and the renderer have since been corrected.

### The instrument cluster

Source: `race-view-two-civics.webp`.

Along the bottom: a `BOOST PRESS` dial, a large `RPM x1000` tachometer with a
red zone, and an `MPH` dial reading to 160. To their right, `GAS PEDAL` and
`CLUTCH FEATHER` as vertical sliders. On the far right a gear column reading
`6 5 4 3 2 1 N R` top to bottom with the current gear highlighted.

The boost dial is present and idle on a naturally aspirated car rather than
hidden, so the cluster is fixed and gauges simply read zero when nothing is
fitted.

### Eight navigation tabs, not seven

Source: all three screenshots.

`MAIN | CHALLENGE INFO | GARAGE | RACE TRACK | PARTS SHOP | CAR SHOWROOM | TEAM | COMMUNITY`

The spec lists seven and omits `COMMUNITY`.

### The Garage has four sub-sections

Source: `garage-paint-shop.webp`.

`◀ BACK | MODIFICATIONS | TUNE AND DYNO | PAINT SHOP | MAINTENANCE`

Which maps onto the stage plan almost exactly: Modifications is Stage 3, Tune
and Dyno is Stage 4, Maintenance is Stage 5, Paint Shop is Stage 8.

### Paint is HSB sliders over three zones, and costs $1,500

Source: `garage-paint-shop.webp`.

Hue, saturation and brightness sliders applied to `BODY COLOR`,
`GRAPHICS COLOR` and `NUMBER COLOR` independently, plus a named graphics preset
from a dropdown (`Lightning`), a typed car number and a drop-shadow toggle.

This rules out flat pre-coloured car art: the artwork has to be tintable in
separate zones. The spec's layered approach in section 4.14 is right.

$1,500 to apply is the only confirmed price in the project. Money is called
`Account Balance`.

### Car art is needed at two angles

Source: `car-showroom.png` and `garage-paint-shop.webp`.

Three-quarter front for the showroom, garage and the status-bar thumbnail;
rear three-quarter for the strip. The status-bar thumbnail carries the player's
actual paint — yellow in the paint shop, dark in the showroom.


### The race view sits in a moulded dashboard, `sourced`

Source: `race-view-two-civics.webp`, marked up by someone who played it.

Not rectangular panels. An oval cowl sweeps across the bottom with the gauges
set into it, and a curved surround frames the road view: one continuous sweep
that starts well inside the picture at the top, sweeps outward fast, and
flattens out past the view's own edge as it runs into the top of the dash --
arched, the way a windscreen header is. The timing boards are inset panels
sitting on that surround.


The surround is **mustard**, not the blue-grey the rest of the interface uses,
and the dashboard is silver falling to black. That warm/cool split is the
original's, and it is doing work: the surround being the one warm thing on
screen is part of why the road view reads as lit from outside rather than as a
panel among panels.

The offsets in `renderer/chrome.ts` were measured off the marked-up screenshot
rather than chosen. **The curve was drawn wrong three times before it was
right** -- convex when it should be concave, then pinched in the middle when it
should be pinched at the top, then bowing the wrong way while being deepened --
which is why `chrome.test.ts` asserts the direction *and* the bow explicitly
rather than trusting four control points to stay put.

What is *not* reproduced is the finish. The original's dash is a rendered
metallic casting with photographic gauge faces; ours is canvas paths and
gradients, which gets the silhouette and only approximates the material.
Matching it properly wants a background image asset, and that belongs with
Stage 14 and the art pipeline Stage 8 needs anyway.

Two details visible in the screenshot and still not built: a `GRAPHIC SETTINGS`
button in the bottom-left corner, and a header band above the view carrying the
Nitto logo, a `1320 CHALLENGE` wordmark and `Version 1.52`. The `PRE-STAGED` /
`STAGED` plates are also **per lane** -- two sets, not one -- which matters when
Stage 6 fills the second lane.


### The three dials are a cluster, not a row, `sourced`

Source: `race-view-two-civics.webp`, with the dial circles marked over it.

They overlap. The tachometer is much the largest, sits slightly higher than its
neighbours, and laps over both of them; boost and speed do not touch each other.
Measured off the markup at the original's own scale and carried across: 66, 96
and 84 pixel radii on our canvas, overlapping by 16 and 9.

Painted outside-in so the tacho is in front of both, which is the only ordering
that reads as one binnacle rather than as discs stacked wrong.

The **prompt text** (`ROLL UP`, `STAGED`, `RED LIGHT`) sits at the top of the
view between the two stage plates. The original puts `STAGING` low and centred
over the road; ours cannot, because the dashboard now reaches up into that space
and cut the text in half. This is a departure, and a small one, but it is a
departure.

### The left-hand bar is a staging gauge

Source: `race-view-two-civics.webp`, read by someone who played the original.

Not whole-track progress — it shows how far the car still has to roll to reach
the line. That is the one thing a chase camera makes genuinely hard to judge,
which is presumably why it got its own instrument.

How it is drawn is ours: the window sits in the middle of the bar rather than at
the top, so there is scale above it as well as below. A driver who rolls through
the line can then read off how far to reverse. Where the original put the window
is unknown.

### A persistent bottom status bar

Source: all three screenshots.

`SELECTED CAR:` with thumbnail and name, `EDIT MY ACCOUNT`, and a live incoming
challenge count.

---

## Open questions

### Controls — partly `sourced`

`race-view-two-civics.webp` settles three of these:

- **The throttle really was a slider** (`GAS PEDAL`), not a key. What we
  arrived at independently turns out to be right.
- **There really was a gear selector** with reverse and neutral, reading
  `6 5 4 3 2 1 N R`. Ours matches.
- **There really was a clutch control** (`CLUTCH FEATHER`), a second slider
  beside the throttle.

The clutch is **deliberately not implemented** — a project decision, not an
unknown. Nobody who played the original used it, and leaving it out is what
makes the current launch work the way it does. Reinstating it would change the
launch model; see the note below.

The key bindings are still ours:

| Control | Action |
|---|---|
| Drag the slider | Throttle, 0–100% |
| W | Gear up: R → N → 1 → 2 → 3 … |
| A | Gear down |
| S / Space | Brake |
| R | Reset run |

The throttle is **not** on the keyboard. How far and how fast the slider is
pushed is the launch, and a key can only express on or off. The car starts in
neutral and needs both a gear and throttle before it moves.

The throttle is sprung: letting go of the slider closes it over about a second,
the way a pedal returns. `THROTTLE_RELEASE_MS` sets how long.

Because the clutch is omitted, the clutch follows the throttle instead. The
consequence worth knowing: the way to launch properly is to hold revs in neutral
on the brakes and select first as the tree drops, which is what a real drag racer
does. That was not scripted — it falls out of the physics, and it is about
0.7 seconds a quarter quicker than simply opening the throttle in gear.

**That technique only exists because there is no clutch control.** If the clutch
is ever added, expect the launch model and every launch-related test to change.

Still unknown:

- Was staging done by creeping, or by a button?
- What did the two round buttons under the sliders do?

### Christmas tree — `assumed`

A Sportsman tree, slowed down: the three ambers light one at a time a second
apart and stay lit, then the green a second after the last. NHRA runs the full
tree at half-second steps; a full second is used here so the countdown is
something the driver can read and time against.

The Pro tree (all three ambers together, green 0.400s later) is fully
implemented and one config value away — set `TREE.type` back to `'pro'`. Which
the original used is unknown.

The random pause before the ambers (1.8–3.2s) is invented. With three seconds of
countdown after it, the wait from settling on the line to the green is about
five to six seconds.


### Shift light — invented

Not visible in `race-view-two-civics.webp`, which shows only the three dials,
the two sliders and the gear column. **Whether the original had one at all is
unknown**, and if it did, where it sat and what it was keyed to are unknown too.

Ours is a green lamp between the tachometer and the speedometer that lights when
the next gear would put more force at the wheels than the one selected. That
point is computed from the torque curve and the two ratios either side of the
change (`sim/shift.ts`), not hardcoded: hardcoding a rev figure would be wrong
for the second car added, and wrong again the moment Stage 4 lets the player
change ratios.

On the stock Civic it works out at the limiter in every gear. **This was expected
to change when the car was corrected to the EK B16, and it did not.** The
reasoning was that a peaky engine wants an earlier shift, which is true as far as
it goes -- but where the shift belongs depends on the ratios as much as the
curve, and the S4C's are close enough that the revs barely fall on a change. The
next gear therefore never out-pulls the one selected before the limiter arrives.

What the correction *did* change is the cost of getting it wrong: short-shifting
at 4,500 now costs more than ten seconds over the quarter, against nine before.
The lever got much heavier without moving.

The lamp comes on 400rpm before the crossover so a driver who reacts to it is
not already past. That lead is invented.

### Staging — `assumed`, deliberately not realistic

The pre-stage and stage lines are **1.2 metres apart**, far wider than the 7
inches NHRA runs its beams at. At any playable zoom level a 7-inch window is
too fine a target to hit by feathering a throttle, so it is widened on purpose.

The driver has to bring the car to a stop with its nose inside that window,
either by timing a coast or by braking. Rolling through the stage line on the
way in does not stage the car and does not foul it — the clock only starts once
the car has staged — so overshooting simply means selecting reverse, backing up
into the window, and letting the tree arm again.

Once the tree *is* armed, crossing the stage line before the green is a red
light, as it should be.

Where in the window the car stops is a real trade-off: stopping close to the
stage line leaves less ground to cover before the clock starts, so the light is
quicker, but also less run-up to build speed in, so the run is slower.

**Whether the original modelled any of this is completely unknown.** It may have
had a single "staged" state and started the clock at the launch. Both the window
width and the whole behaviour are config-driven.

### Shut-down area — `assumed`

The car keeps its speed through the traps and coasts down an unbounded shut-down
area with the throttle cut, until it stops or is braked. A free coast from
around 88mph runs about 84 seconds and 3,900 feet.

Whether the original showed anything past the finish line is unknown. It may
well have cut straight to a results screen.

### Shift dead time — `assumed`

150ms with no torque to the wheels, and the driver assumed to lift through the
change. Both invented. The original's shift penalty is unknown and is a large
part of how the game felt.

### Reverse ratio — `real-world`

The Civic's reverse ratio is a real-world figure. Reverse exists so a driver who
rolls through the stage line can back up; whether the original allowed that is
unknown.

### Civic Si — corrected to the EK B16, `sourced`

Source: `garage-paint-shop.webp` and `race-view-two-civics.webp`.

The starter car is called `Civic SI Hatchback`, and the render is unmistakably a
**sixth-generation EK hatchback** (1996-2000). The project modelled an EP3 with a
K20A3 until this was noticed, which was the wrong car and the wrong engine family
entirely.

**`data/cars/civic-si.ts` now describes a B16A2** -- the 1.6 VTEC of the
1999-2000 Civic Si, 160hp at 7,600rpm, 111 lb-ft at 7,000rpm, 8,200rpm fuel cut,
the S4C five-speed behind a 4.266 final drive, in a car around 140kg lighter.
Those are real-world figures, tagged accordingly: they make the car right *as a
Civic*, not right *as the original game's Civic*, which nobody has evidence for.
Calibrating to the game is still Stage 15.

Corrected before Stage 2's driving-feel work rather than at Stage 15, for the
same reason the chase camera was rebuilt early: tuning how a car feels to drive
against the wrong engine family is work thrown away. Every figure in
`BALANCE_NOTES.md` was regenerated.

Two things the correction taught us, both recorded there in full:

- **The tyre grip had to move with it.** `peakGrip: 1.15` was chosen for a
  heavier, torquier car, and against a B16 it was simply more grip than the
  engine can overcome -- launch revs stopped mattering at all. 1.05 restores a
  real optimum. Grip is per-car data, so this does not touch any other car.
- **The shift point did not move.** It was expected to drop well below the
  limiter on a peaky engine; it did not, because the S4C's ratios are close
  enough that the revs barely fall on a change. Short-shifting now costs far
  more, but where to shift is unchanged.

### Garage and Speedshop hierarchy — `sourced`

Source: [Nitto 1320 Challenge - Overview](https://www.youtube.com/watch?v=ujP5a1VzF7w),
showing client Version 1.53. Relevant frames occur from 3:31 through 4:43.

The footage settles several layout and interaction questions that earlier stills
could not:

- Garage opens on a selected-car overview with Vehicle Setup, average ET and
  bracket/best ET rather than directly inside an inventory.
- Vehicle Setup has Back, Modifications, Tune and Dyno, Paint Shop and
  Maintenance departments. Modifications place a translucent mechanical car
  behind category-specific installed-part rows.
- Speedshop categories are large illustrated cards in a horizontal strip.
  Selecting one opens a distinct product-card screen with brand, product image
  and price, rather than expanding a list in place.
- Purchasing conflicting hardware opens a blue-and-gold replacement dialog that
  names the old part and offers Cancel or Proceed.
- A narrow status rail showing selected car and account/challenge state remains
  visible along the bottom of these screens.

The present recreation follows that hierarchy. Category art remains schematic
until Stage 8 supplies the real car-art pipeline; Tune, Maintenance, Paint and
Nitrous functionality remain in their scheduled stages.

### Race-car artwork — sourced composition, clean-room execution

Source: [`docs/reference/race-view-two-civics.webp`](docs/reference/race-view-two-civics.webp),
client Version 1.52.

The screenshot confirms a low chase camera and rear three-quarter car renders.
The Civic strip asset follows that composition but was generated specifically
for this project from a written brief; no original pixels, logos, brands or
client binaries are present. Its exact body treatment, reflections and wheel
design are therefore artistic assumptions rather than recovered facts. The
path-drawn hatchback remains as a load-safe fallback, while multi-car and
separately tintable artwork stays scheduled for Stages 7–8.

The first replacement interpreted "rear three-quarter" too aggressively and
faced across the lane. The corrected strip asset is nearly straight rear, as the
reference cars are, and is never rotated with simulated body pitch. Pitching a
single raster changes its direction rather than its suspension attitude; only
small vertical spring travel is applied now. The dense foliage/skyline plate is
also an original transparent render, replacing geometric ellipses without
claiming its invented city or individual trees are historical facts.

### Garage and Speedshop state model — `sourced`

Source: static analysis of the verified Version 1.52 client, recorded without
original code or media in
[`docs/reference/nitto-152-garage-store-map.md`](docs/reference/nitto-152-garage-store-map.md).

- Garage modification navigation is category → generated subsystem → component
  detail, rather than a single flat installed-parts list.
- Parts are owned by the selected car independently from whether they are
  installed. Install and uninstall are separate operations, so removed hardware
  remains in storage and can be fitted again.
- A successful store purchase targets the selected car and installs the part.
- Requirement feedback distinguishes installed, owned-but-not-installed and
  not-yet-owned hardware.
- Conflicting fitted hardware triggers a replacement flow, including dependent
  components that can no longer remain fitted.
- Parts feed vehicle properties such as horsepower, boost, grip, rev limit and
  weight. The exact historical catalogue and values remain unknown because
  catalogue data was server supplied.


### Forced induction — `assumed`

Turbochargers and superchargers are modelled as pressure, not as a torque bonus.
A part declares the boost it makes; the torque follows from it. That is what
lets the boost gauge read something true -- it shows what the power is derived
from, so the needle and the shove cannot disagree.

The two behave differently, because that difference is the whole reason a game
offers both:

- A **turbo** is exhaust-driven. It makes nothing below its spool point and
  comes in over about 1,800rpm. Highest trap speed of anything fitted.
- A **supercharger** is belt-driven, so it is making pressure the moment the
  engine turns and is at full song by roughly 55% of the redline. Quicker off
  the line, lower down the straight.

Every figure is invented -- spool points, peak pressures, the 0.85 charge
efficiency that turns pressure into torque. Whether the original modelled boost
at all is unknown; it drew the gauge, which is the only evidence there is.

**Clutch capacity became a property of the build here**, which
`config/historical.ts` had predicted since Stage 1. It is not cosmetic: with a
fixed 240Nm clutch, any engine making more than that could never lock it, and a
turbo car was *slower* than the standard one. Clutch parts now state what they
hold, and the strongest fitted one counts.

### Economy — Stage 3 provisional

Stage 3 now has a $10,000 session balance and provisional Civic part prices.
The source footage confirms that the original displayed an account balance and
charged for parts, but it does not recover the historical prices used here.

---

### Nitrous, damage and repairs — `assumed`

The references and specification establish nitrous activation, multiple kit
strengths, mechanical damage and paid repair as features. No recovered table
settles shot size, bottle duration, wear thresholds or prices. The Stage 5
values are therefore progression tuning, isolated under `DAMAGE` and part data
so calibration can replace them without rewriting the simulator.

Nitrous is expressed as extra crankshaft power and converted to torque at the
current engine speed. That torque still has to pass through the clutch and tyre
contact patch. Persistent damage reduces the resolved torque curve by up to
30%; this is internally consistent clean-room behaviour, not recovered code.

### Gear tuning and dyno ranges — `assumed`

The surviving material confirms that Tune & Dyno was a garage department and
the project specification records editable individual ratios, final drive,
horsepower and torque curves. It does not recover the original editor's numeric
limits or adjustment increments. The broad limits in `historical.ts` therefore
exist for playability and validation, not as a claim about Version 1.52.

The dyno samples flywheel output from the same resolved torque curve used by the
race simulation. Gear ratios do not change that curve; they change wheel torque
and road speed in a pass. This is physically coherent clean-room behaviour, not
a recovered historical formula.

## Research leads

Not yet pursued:

- Internet Archive captures of the original site (2004–2006). The paint-shop
  screenshot was taken from `nitto1320.com/forum/showthread.php?t=16`, so the
  site ran a forum — archived threads may carry tunes, prices and ET figures.
- Period forum threads with tune guides — PROJECT_SPEC 4.3 notes these should
  become regression tests.
- Surviving screenshots for UI layout (Stage 14) and for confirming which
  screens and stats existed.
- Any surviving client code, which would settle the physics and control
  questions outright.

When a lead confirms something, update the value in `historical.ts`, change its
confidence tag, and record the source here.
