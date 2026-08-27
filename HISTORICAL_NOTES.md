# Historical Notes

What is actually known about the original pre-2007 Nitto 1320 Challenge, and
what has been invented to get the game running.

PROJECT_SPEC 11.12 and 11.13: document uncertain behaviour rather than inventing
certainty, and isolate unknown rules behind configuration.

**As of Stage 1, no primary sources have been consulted.** Every entry below is
either real-world drag racing practice or an outright assumption. Nothing here
is confirmed against the original game. This document should get longer and more
confident, not shorter.

## Confidence levels

Values in `packages/game-core/src/config/historical.ts` carry one of these tags:

| Tag | Meaning |
|---|---|
| `sourced` | Confirmed from period documentation, screenshots or code. |
| `real-world` | Correct for real drag racing, unverified for the game. |
| `assumed` | A plausible guess. Suspect it. |

**Nothing is currently tagged `sourced`.**

---

## Open questions

### Controls — `assumed`

The original's control scheme is unknown. The current one is a deliberate
design decision rather than a reconstruction:

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

There is no clutch pedal, so the clutch follows the throttle. The consequence
worth knowing about: the way to launch properly is to hold revs in neutral on
the brakes and select first as the tree drops, which is what a real drag racer
does. That was not scripted — it falls out of the physics, and it is about
0.7 seconds a quarter quicker than simply opening the throttle in gear.

Specific things to find out:

- Was the throttle analogue in any sense, or a held key?
- Was there a clutch control at all?
- Did the car have a gear selector including reverse and neutral?
- Was staging done by creeping, or by a button?

### Christmas tree — `assumed`

Pro tree assumed: three ambers together, green 0.400s later. The Sportsman tree
(sequential ambers, 0.500s apart) is fully implemented and selected by changing
`TREE.type`. Which the original used is unknown.

The random pause before the ambers (2.5–4.5s) is invented.

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

### Shift dead time — `assumed`

150ms with no torque to the wheels, and the driver assumed to lift through the
change. Both invented. The original's shift penalty is unknown and is a large
part of how the game felt.

### Reverse ratio — `real-world`

The Civic's reverse ratio is a real-world figure. Reverse exists so a driver who
rolls through the stage line can back up; whether the original allowed that is
unknown.

### Civic Si specification — `real-world`, NOT calibrated

The torque curve, mass, gearing and grip figures approximate a real 2002–2005
EP3 Civic Si (K20A3, ~160hp). They produce a quarter mile of roughly 15.7s at
87mph, which is reasonable for that car in the real world.

**The original game's stock Civic performance is unknown.** PROJECT_SPEC 15
notes a *fully modified* Civic should reach the low 8s, which says nothing about
the stock car. Until a figure is found, Stage 1's tests assert only wide
plausibility bands (13–19s).

Which Civic Si the original used is also unconfirmed — the EP3 hatchback and the
earlier EM1 coupe are both plausible for the 2004–2006 window.

### Economy — not yet implemented

No prices beyond a placeholder showroom figure on the Civic. Stage 3 onwards.

---

## Research leads

Not yet pursued:

- Internet Archive captures of the original site (2004–2006).
- Period forum threads with tune guides — PROJECT_SPEC 4.3 notes these should
  become regression tests.
- Surviving screenshots for UI layout (Stage 14) and for confirming which
  screens and stats existed.
- Any surviving client code, which would settle the physics and control
  questions outright.

When a lead confirms something, update the value in `historical.ts`, change its
confidence tag, and record the source here.
