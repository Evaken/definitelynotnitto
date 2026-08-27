# Balance Notes

ET targets, prices and progression data.

**Nothing here is calibrated to the original game yet.** Real calibration is
Stage 15, once there is a roster to calibrate and evidence to calibrate against.
This file exists to record what the current numbers actually are, so a future
change that moves them is visible.

## Current measured performance

Honda Civic Si, stock, as of Stage 1. Well-driven pass, seed 7:

| Measure | Value |
|---|---|
| Reaction time | 0.351 |
| 60 ft | 2.401 |
| 330 ft | 6.601 |
| 1/8 ET | 10.124 |
| 1/8 MPH | 69.62 |
| 1000 ft | 13.178 |
| 1/4 ET | 15.754 |
| 1/4 MPH | 87.66 |

Reasonable for a real 2003 Civic Si. **Unverified against Nitto 1320
Challenge** — see HISTORICAL_NOTES.md.

## How driving affects the stock Civic

Measured, holding everything else constant. These are the levers Stage 2 will
sharpen.

Launch rpm, quarter-mile ET:

| Launch rpm | 60 ft | 1/4 ET | |
|---|---|---|---|
| 1200 | 2.800 | 16.326 | bogged |
| 2000 | 2.507 | 15.972 | |
| 3000 | 2.401 | 15.754 | best |
| 4000 | 2.445 | 15.894 | |
| 5000 | 2.542 | 16.231 | |
| 6000 | 2.664 | 16.501 | wheelspin |
| 6700 | 2.706 | 16.579 | wheelspin |

Shift point, quarter-mile ET: 4500 rpm gives 17.730, rising steadily to 15.652
at the limiter. This gearbox rewards shifting late; whether that should remain
true is a Stage 2 question.

Staging depth: roughly 50ms of ET traded for 50ms of reaction time across the
reachable range (0 to ~7.6cm past the beam).

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

Nothing is known about stock ETs, which is what Stage 1 through 6 actually need.

## Prices

Only one price exists: the Civic Si at $12,000, a placeholder with no basis.
Part prices, repair costs, prize money and progression pacing arrive in Stages 3
and 6, and want their own research pass.
