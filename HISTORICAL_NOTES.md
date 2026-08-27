# Historical Notes

What is actually known about the original pre-2007 Nitto 1320 Challenge, and
what has been invented to get the game running.

PROJECT_SPEC 11.12 and 11.13: document uncertain behaviour rather than inventing
certainty, and isolate unknown rules behind configuration.

**Three surviving screenshots are now in [`docs/reference/`](docs/reference/).**
They are the only primary sources this project has, and everything tagged
`sourced` traces back to one of them. Everything else is still real-world drag
racing practice or an outright assumption.

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
way.** The spec has since been corrected. The renderer has not been yet — see
`ROADMAP.md`.

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
- What is the tall vertical bar down the far left edge of the race screen?

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

### Civic Si — wrong generation, `sourced`

Source: `garage-paint-shop.webp` and `race-view-two-civics.webp`.

The starter car is called `Civic SI Hatchback`, and the render is unmistakably
a **sixth-generation EK hatchback** (1996–2000) — the low, wide shape with
sixth-gen headlights. **Not** the EP3 this project modelled.

That is not a cosmetic difference. Our car data is a K20A3: 160hp, peak torque
around 5,000rpm, 6,800rpm redline. The EK-era Si is a B16 — similar peak power
but far less torque, made much higher up, with a redline north of 8,000rpm. A
peakier, more gear-sensitive car that would want shifting differently.

**`data/cars/civic-si.ts` still describes the EP3 and is now known to be the
wrong car.** Correcting it means a new torque curve, redline, gearing and mass.
It is deliberately not done yet: it changes every measured figure in
`BALANCE_NOTES.md` at once, so it belongs with the calibration work rather than
being slipped in alongside a renderer rewrite.

**The original game's stock Civic performance is still unknown.** PROJECT_SPEC 15
notes a *fully modified* Civic should reach the low 8s, which says nothing about
the stock car. Until a figure is found, Stage 1's tests assert only wide
plausibility bands (13–19s).

### Economy — not yet implemented

No prices beyond a placeholder showroom figure on the Civic. Stage 3 onwards.

---

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
