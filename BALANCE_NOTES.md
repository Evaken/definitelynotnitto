# Balance Notes

ET targets, prices and progression data.

**Nothing here is calibrated to the original game.** Calibration is Stage 15,
once there is a roster to calibrate and evidence to calibrate against. This file
records what the numbers actually *are*, so that a change which moves them is
visible instead of silent.

---

## How these numbers are produced

Read this before trusting or adding to anything below.

Every performance figure comes from `testing/drive.ts` — a scripted driver, not
a human — running the deterministic simulator. The reference plan is
`goodDrivePlan(seed 7)` with `stageAtM: -0.27`, and each table varies exactly
one term of it.

```ts
const plan = { ...goodDrivePlan(7), stageAtM: -0.27 };
drive(car, stockTune(car), plan).slip;
```

**This means every figure here is a property of the driver as much as the car.**
That is not a caveat, it is the thing that has already bitten:

> Stage 3 found the driver chain-shifting — the clutch is open through a change,
> so a strong engine free-revs back past the shift point in about forty
> milliseconds and the driver takes another. Four shifts in 0.6 seconds, into
> fifth gear at 29mph. Every figure measured through it on a high-torque build
> was wrong, and nothing failed to warn anybody.

So: **when `testing/drive.ts` changes, regenerate every table in this file.**
Not just the ones that look related. The short-shift row moved by seven seconds
when that bug was fixed, and the stock car's headline ET did not move at all —
you cannot tell which by reading.

Figures below were last regenerated at the commit that added forced induction.

---

## Stock Civic

Civic Si Hatchback, no parts fitted, revs held at 5,500 in neutral, shifting at
8,100, staged 0.27m off the line.

| Measure | Value |
|---|---|
| Reaction time | 0.399 |
| 60 ft | 2.493 |
| 330 ft | 6.510 |
| 1/8 ET | 9.889 |
| 1/4 ET | **15.272** |
| 1/4 MPH | **91.2** |

A real 1999 Civic Si ran mid-15s at around 90mph, so this sits where it should
for the car it now models. **Still unverified against Nitto 1320 Challenge.**

---

## How driving affects the stock Civic

**Launch.** Revs held in neutral, first selected as the tree drops:

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

The optimum sits at 5,500 because a B16 has nothing worth using below about
4,000. **It nearly did not exist at all**: the EP3's `peakGrip: 1.15`, carried
over unchanged, was more grip than a stock B16 can overcome, and launch revs
became monotonically better all the way to the limiter. 1.05 restores the
choice. Grip is per-car data, so this does not touch any other car.

**Shift point,** quarter-mile:

| Shift at | 1/4 ET | MPH |
|---|---|---|
| 4500 | 18.818 | 73.5 |
| 5500 | 17.815 | 79.4 |
| 6500 | 16.759 | 83.2 |
| 7500 | 15.867 | 88.2 |
| 8100 | 15.272 | 91.2 |
| 8200 (limiter) | 15.243 | 91.5 |

`optimalShiftRpm` returns the limiter for all four changes. Not because the
curve is flat — it is not — but because the S4C's ratios are close enough that
the revs barely fall on a change, so the next gear never out-pulls the one
selected. Ratios matter more here than the shape of the curve.

**Staging depth,** across the 1.2m window:

| Stopped at | R/T | 1/4 ET |
|---|---|---|
| −0.87 m | 0.665 | 15.021 |
| −0.54 m | 0.537 | 15.141 |
| −0.27 m | 0.399 | 15.272 |
| −0.20 m | 0.354 | 15.316 |
| −0.06 m | 0.235 | 15.431 |

About 0.43s of reaction time traded against 0.41s of elapsed time — a property
of the staging geometry, so it should not move when the car does.

---

## Forced induction

Boost is modelled as pressure; torque is derived from it. Peak power, gauge
pressure at three engine speeds, and the best pass found by sweeping launch rpm:

| Build | hp | 3k | 5k | 8.2k | Launch | 60 ft | 1/4 ET | MPH |
|---|---|---|---|---|---|---|---|---|
| stock | 159 | — | — | — | 5500 | 2.493 | 15.272 | 91.2 |
| street blower | 223 | 4.6 | 7.0 | 7.0 | 2000 | 2.543 | 14.310 | 101.8 |
| street turbo | 245 | 0.0 | 8.7 | 8.7 | 3000 | 2.437 | 14.479 | 103.2 |
| race blower | 268 | 7.9 | 11.9 | 11.9 | 2000 | 2.635 | 14.648 | 106.8 |
| race turbo | 313 | 0.0 | 6.2 | 16.0 | 3000 | 2.487 | 13.642 | **114.3** |
| race blower + grip | 268 | 7.9 | 11.9 | 11.9 | 2000 | 2.289 | **13.192** | 110.2 |
| race turbo + grip | 313 | 0.0 | 6.2 | 16.0 | 4000 | 2.356 | 14.120 | 111.6 |

Pressure in psi at the gauge. Grip builds add street tyres, drag radials and an
LSD.

**The blower wins on elapsed time and the turbo on trap speed.** Neither was
tuned to do that — it falls out of belt drive against exhaust drive, and it is
the reason a game offers both. A blower is making pressure from idle; a turbo
makes nothing below 4,300rpm and then makes more than the blower ever does.

Two things had to be right before any of this worked, both recorded because they
will look like balance problems if they recur:

- **Clutch capacity is a property of the build**, not a global. With a fixed
  240Nm clutch, an engine making more than that never locks it: the race turbo
  car was *slower than standard*. Clutch parts state what they hold.
- **Trap speed is the diagnostic.** It is power-to-weight and barely touched by
  traction, so a car trapping 68mph on 245hp is never a grip problem however
  much it looks like one. That measurement is what found the chain-shift after
  traction and the clutch had both been wrongly blamed.

---

## Parts catalogue

Thirty parts, all Civic-only. **Every price is invented** — the only confirmed
price in the project is $1,500 to apply paint. Starting balance is $10,000 and
there is no way to earn yet; prize money is Stage 6.

| Part | Category | Price | Requires |
|---|---|---|---|
| High-Flow Panel Filter | intake | $180 | — |
| Cold-Air Intake | intake | $520 | panel-filter |
| Short-Ram Intake | intake | $390 | — |
| Sports Muffler | exhaust | $360 | — |
| Cat-Back Exhaust | exhaust | $780 | sports-muffler |
| 4-2-1 Race Header | exhaust | $950 | cat-back |
| ECU Reflash | ecu | $650 | — |
| Standalone ECU | ecu | $1750 | ecu-reflash |
| Performance Camshafts | engine | $1450 | race-header |
| High-Compression Pistons | engine | $2200 | performance-cams |
| Ported Cylinder Head | engine | $2600 | performance-cams |
| Lightweight Flywheel | clutch | $680 | — |
| Sports Clutch | clutch | $900 | — |
| Race Clutch | clutch | $1650 | sports-clutch |
| Short Shifter | transmission | $420 | — |
| Limited-Slip Differential | transmission | $1800 | — |
| Performance Street Tyres | tyres | $600 | — |
| Drag Radials | tyres | $1350 | street-tyres |
| Sport Springs | suspension | $550 | — |
| Adjustable Dampers | suspension | $1150 | sport-springs |
| Rear Seat Delete | weight-reduction | $250 | — |
| Lightweight Battery | weight-reduction | $480 | — |
| Stage 1 Weight Reduction | weight-reduction | $1100 | rear-seat-delete |
| Turbo Manifold | turbo-accessory | $900 | — |
| Front-Mount Intercooler | turbo-accessory | $1250 | turbo-manifold |
| Street Turbo Kit | turbo | $3800 | turbo-manifold + intercooler + sports-clutch |
| Race Turbo Kit | turbo | $6200 | street-turbo + race-clutch |
| Supercharger Bracket Kit | supercharger | $850 | — |
| Street Supercharger | supercharger | $4200 | supercharger-bracket + sports-clutch |
| Race Supercharger | supercharger | $6500 | street-supercharger + race-clutch |

Two exclusion groups do real work: `forced-induction` keeps a turbo and a
supercharger apart, and `induction-hardware` does the same for the manifold and
the bracket that carry them. `intake-path` and `tyres` make the alternatives
within those systems mutually exclusive.

Note the shape is inconsistent, deliberately or not: **exhaust, engine and
clutch parts stack** through `requires` — fitting the Race Header keeps the
Cat-Back fitted underneath it — while **intake and tyre parts replace** each
other through an exclusion group. Fitting a lower-tier intake over a higher one
therefore removes the higher one, which the Speedshop warns about before it
happens. Whether that split is intended is worth settling before the roster
grows.

Fully built — every part that can legally be fitted together, 25 of the 30 (the
turbo path and the supercharger path exclude each other) — comes out at **376 hp,
1080 kg, grip 1.35, 12.379 at 123.3mph, $46,460 spent.** Against a $10,000 start
with no way to earn, so the top of the tree is unreachable until Stage 6 pays
out. Note the greedy fit lands on the supercharger: it is fitted before the
turbo can be, and then blocks it.

---

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

**The fully-built Civic currently runs 12.4s, not low 8s.** That gap is the
whole of Stage 15's work and is expected, not a bug — but it is the clearest
single measure of how far from calibrated the game is.

Nothing is known about stock ETs, which is what Stages 1 through 6 actually
need.

---

## Prices

**Confirmed:** applying paint in the Paint Shop costs **$1,500** flat
(`docs/reference/garage-paint-shop.webp`). The only real price the project has.
Money is called `Account Balance` in the original.

Everything else — the thirty part prices above, the Civic at $12,000, the
$10,000 starting balance — is invented. Repair costs, prize money and
progression pacing arrive in Stages 5 and 6 and want their own research pass.
