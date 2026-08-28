# Balance Notes

ET targets, prices and progression data.

**Nothing here is calibrated to the original game yet.** Real calibration is
Stage 15, once there is a roster to calibrate and evidence to calibrate against.
This file exists to record what the current numbers actually are, so a future
change that moves them is visible.

Every figure below was regenerated after the starter car was corrected from an
EP3 K20A3 to the EK B16A2 the original actually used. The car is now plausible
*as the right car*; it is still not calibrated to the game.

## Current measured performance

Civic Si Hatchback, stock, seed 7, staged 0.27m off the line, revs held at 5,500
in neutral, shifting at 8,100:

| Measure | Value | Was, as an EP3 |
|---|---|---|
| Reaction time | 0.399 | 0.372 |
| 60 ft | 2.493 | 2.408 |
| 1/8 ET | 9.889 | ~10.1 |
| 1/4 ET | **15.272** | 15.747 |
| 1/4 MPH | **91.2** | 87.7 |

Quicker and quite a bit faster through the traps, which is the expected shape:
140kg less to move and 1,400rpm more to use, against 27Nm less torque to do it
with. A real 1999 Civic Si ran mid-15s at around 90mph, so this sits where it
should. **Still unverified against Nitto 1320 Challenge.**

## How driving affects the stock Civic

Measured, holding everything else constant.

**Launch technique.** Revs held in neutral, first selected as the tree drops:

| Revs held | 60 ft | 1/4 ET | |
|---|---|---|---|
| 1500 | 2.823 | 15.955 | bogged |
| 2500 | 2.609 | 15.689 | |
| 3500 | 2.511 | 15.515 | |
| 4500 | 2.487 | 15.425 | |
| 5500 | 2.493 | **15.272** | best |
| 6500 | 2.533 | 15.763 | wheelspin |
| 7500 | 2.579 | 16.015 | |
| *sit in gear, open throttle* | 2.915 | 16.058 | no revs to launch on |

The optimum moved from 3,500 to 5,500 with the engine, which is right — a B16
has nothing worth using below about 4,000.

**This nearly did not survive the correction.** Carried over unchanged, the
EP3's `peakGrip: 1.15` was more grip than a stock B16 can overcome: launch revs
became monotonically better all the way to the limiter and the choice
disappeared entirely. The sweep that settled it, best launch rpm by grip:

| peakGrip | Best launch | ET | Behaviour |
|---|---|---|---|
| 1.15 | 8000 | 15.091 | no optimum — more revs always better |
| **1.05** | **5500** | **15.272** | clear optimum, real penalty either side |
| 1.00 | 4500 | 15.405 | |
| 0.95 | 3500 | 15.529 | |
| 0.90 | 2500 | 15.663 | spins on almost anything |

1.05 is the value in the car. It is still above what a street tyre manages in
the real world, for the reason the comment in `civic-si.ts` gives: a prepared
strip is sticky.

**Shift point,** quarter-mile ET:

| Shift at | 1/4 ET | MPH |
|---|---|---|
| 4500 | 26.003 | 60.6 |
| 5500 | 17.815 | 79.4 |
| 6500 | 16.759 | 83.2 |
| 7500 | 15.867 | 88.2 |
| 8100 | 15.272 | 91.2 |
| 8200 (limiter) | 15.243 | 91.5 |

Short-shifting is now *savage* — 4,500 costs more than ten seconds, where the
same mistake in the EP3 cost nine. That is the difference between a flat 2.0 and
a 1.6 that makes nothing off VTEC, and it is the single biggest change in feel.

`optimalShiftRpm` still returns the limiter for all four changes. **This did not
move with the engine, contrary to what was expected**: the S4C's ratios are close
enough that the revs barely fall on a change, so the next gear never out-pulls
the one selected before the limiter arrives. The shift light therefore still
lights at 7,800. The peaky curve made short-shifting cost far more, but it did
not move where the shift belongs.

**Staging depth,** across the 1.2 m window:

| Stopped at | R/T | 1/4 ET |
|---|---|---|
| −0.87 m | 0.665 | 15.021 |
| −0.54 m | 0.537 | 15.141 |
| −0.27 m | 0.399 | 15.272 |
| −0.20 m | 0.354 | 15.316 |
| −0.06 m | 0.235 | 15.431 |

About 0.43 s of reaction time traded against 0.41 s of elapsed time across the
window — essentially unchanged by the new car, as it should be, since it is a
property of the staging geometry rather than the engine.

## Targets from the specification

PROJECT_SPEC 15 gives rough competitive ranges for *fully modified* cars, to be
validated during research:

| Car | Target |
|---|---|
| Civic | low 8s |
| RSX / Evo / Supra / Cobra / Skyline | mid-to-high 7s |
| NSX | low 7s |
| Viper | low 6s |
| Special drag cars | much faster |

Nothing is known about stock ETs, which is what Stages 1 through 6 actually need.

## Prices

**Confirmed:** applying paint in the Paint Shop costs **$1,500** flat
(`docs/reference/garage-paint-shop.webp`). The only real price the project has.
Money is called `Account Balance` in the original.

Otherwise only the Civic Si at $12,000, a placeholder with no basis.
Part prices, repair costs, prize money and progression pacing arrive in Stages 3
and 6, and want their own research pass.
