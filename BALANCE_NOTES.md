# Balance Notes

ET targets, prices and progression data.

**Nothing here is calibrated to the original game yet.** Real calibration is
Stage 15, once there is a roster to calibrate and evidence to calibrate against.
This file exists to record what the current numbers actually are, so a future
change that moves them is visible.

## Current measured performance

Honda Civic Si, stock, as of Stage 1. Well-driven pass, seed 7, staged mid-window
with revs held at 3500 in neutral:

| Measure | Value |
|---|---|
| Reaction time | 0.372 |
| 60 ft | 2.408 |
| 1/8 ET | ~10.1 |
| 1/4 ET | 15.747 |
| 1/4 MPH | 87.7 |

Reasonable for a real 2003 Civic Si. **Unverified against Nitto 1320
Challenge** — see HISTORICAL_NOTES.md.

## How driving affects the stock Civic

Measured, holding everything else constant. These are the levers Stage 2 will
sharpen.

**Launch technique.** Revs held in neutral, first selected as the tree drops:

| Revs held | 60 ft | 1/4 ET | |
|---|---|---|---|
| 1500 | 2.721 | 16.242 | bogged |
| 2500 | 2.462 | 15.903 | |
| 3500 | 2.408 | 15.747 | best |
| 4500 | 2.494 | 16.007 | |
| 5500 | 2.579 | 16.251 | |
| 6500 | 2.694 | 16.492 | wheelspin |
| *sit in gear, open throttle* | 2.918 | 16.460 | no revs to launch on |

Note the last row: simply opening the throttle from a standstill in gear is
worse than every neutral-rev launch except a redline one. The clutch comes home
while the engine is still near idle.

**Shift point,** quarter-mile ET: 4500 rpm gives 24.554, 5500 gives 21.416,
6500 gives 15.747, and shifting at the limiter gives 15.652. This gearbox
rewards shifting late; whether that should remain true is a Stage 2 question.

**Staging depth,** across the 1.2 m window:

| Stopped at | R/T | 1/4 ET |
|---|---|---|
| −0.87 m | 0.638 | 15.496 |
| −0.54 m | 0.509 | 15.616 |
| −0.27 m | 0.372 | 15.747 |
| −0.20 m | 0.328 | 15.789 |
| −0.06 m | 0.197 | 15.916 |

Roughly 0.44 s of reaction time traded against 0.42 s of elapsed time across the
window — a much larger and more legible decision than the few hundredths the
earlier NHRA-width beams allowed.

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
