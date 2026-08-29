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
| race turbo | 313 | 0.0 | 6.2 | 16.0 | 3000 | 2.487 | 13.642 | 114.3 |
| race blower + grip | 268 | 7.9 | 11.9 | 11.9 | 2000 | 2.381 | 13.359 | 110.0 |
| race turbo + grip | 313 | 0.0 | 6.2 | 16.0 | 4000 | 2.359 | 14.095 | 111.7 |

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

### Factory-turbocharged cars

Four of the roster are turbocharged from the factory, and their published torque
figures already contain that boost:

| Car | Factory boost | Gauge reads |
|---|---|---|
| Lancer Evo VII | 1.00 bar | 14.5 psi |
| Neon SRT-4 | 0.95 bar | 13.8 psi |
| Supra Twin Turbo | 0.72 bar | 10.4 psi |
| Skyline GT-R | 0.72 bar | 10.4 psi |

They declare it as `factoryBoostBar`, which is **descriptive rather than
applied**: the multiplier is measured against it, so a standard car's own boost
multiplies its curve by exactly 1.000 and its dyno figures do not move. What
changes is that the gauge finally reads something on a turbo car — it used to sit
at zero — and that a kit fitted on top gains only what it adds:

    multiplier = 1 + ((total − factory) / (ATM + factory)) × 0.85

On a naturally aspirated car `factory` is zero and this collapses to the plain
ratio against atmosphere, so the Civic — the one car that is actually balanced —
does not move at all.

**Before this, a turbo kit on an Evo counted the turbo twice**: 383Nm became
784Nm, past anything the tyres or the clutch could use, and the car walked itself
into fifth gear at 20mph. It now builds to 597Nm and traps 114mph instead of 86.

### What is still wrong, and why it was not tuned away

The three highest-torque builds are past a cliff and their measurements are
**chaotic rather than merely bad**:

| Build | Torque | Result |
|---|---|---|
| Mustang Cobra | 1083Nm | 13.16 @ 86 or 16.65 @ 62, depending on launch rpm |
| Viper SRT-10 | 1388Nm | 15.07 @ 68 |
| Skyline GT-R | 786Nm | does not finish |

Sweeping the clutch multiplier over 1.00–2.05 and a torque cap over 1.45–1.75
moved these between "fine" and "broken" with no monotonic relationship. That is
the signature of a car so far past its traction limit that the outcome depends on
which gear it happens to be in when the tyres finally hook up.

**So `drive()` is not a usable instrument for these cars**, and tuning against it
would be fitting to noise. Two things follow:

- Any figure measured here for a car above roughly 700Nm should be treated as one
  sample of an unstable quantity, not as a balance point.
- A clutch upgrade was tried and reverted. Making clutch capacity scale with the
  car fixed the Evo and broke the Mustang — whose weak standard clutch had been
  quietly limiting torque the tyres could not use anyway. Fixing the clutch
  exposes the traction problem rather than causing it.

The real work is a roster-wide balance pass: bounding what the parts can add
relative to what each car can put down. That needs a stable measurement first.


### Measuring a car that has more torque than grip

`drive()` takes an opt-in `tractionControl` flag. Off by default, because every
figure above was measured without it.

Switch it on to measure anything with more torque than its tyres can use. Flat
out such a car simply spins: the tacho reports wheel speed rather than road
speed, the driver upshifts on a lie, and the result depends on which gear it
happens to be in when the tyres finally hook up. That produced measurements that
flipped between fine and broken on the same code:

> The Mustang read 13.16 @ 86 or 16.65 @ 62 depending only on which launch rpm
> was sampled. Sweeping the clutch over 1.00–2.05 and a torque cap over
> 1.45–1.75 moved cars between working and broken with no monotonic response.

With the flag on, the best-of-sweep becomes repeatable — the same figure to
within a few hundredths across two different launch-rpm grids:

| Car | grid A | grid B | drift |
|---|---|---|---|
| civic-si | 12.21 | 12.21 | 0.00 |
| evo-vii | 12.93 | 12.93 | 0.00 |
| mustang-cobra | 12.96 | 12.96 | 0.00 |
| rx8 | 11.00 | 10.96 | 0.04 |
| nsx | 13.15 | 13.11 | 0.03 |
| neon-srt4 | 12.53 | 12.54 | 0.01 |
| rsx-type-s | 12.05 | 12.07 | 0.02 |
| viper-srt10 | 11.81 | 12.01 | 0.21 |
| supra-tt | 12.34 | 13.07 | 0.73 |

**It is not a free win.** On the stock Civic it is 0.5s *slower*, because that
car's best launch deliberately uses some slip. It measures a driver who refuses
to spin the tyres, which is the right reference for a car that cannot help it and
the wrong one for a car that can.

### The clutch holds what you have built

A clutch part promises a share of the **built engine's** peak torque, not a
figure in newton-metres and not a multiple of the car's standard clutch. Both of
those were tried and neither survives a thirteen-car roster:

- **Absolute (340 / 560Nm).** A large upgrade on a Civic, none at all on an Evo
  whose standard clutch already holds 517. The Skyline could never lock: 560
  against 786Nm, so the engine ran free — 8002rpm in sixth while the car did
  81mph — and the pass never finished.
- **A multiple of the standard clutch.** Starves the Civic, whose fallback is a
  flat 240Nm default rather than a share of its torque, so the hard CPU opponent
  — a turbocharged Civic — became slower than the medium one.

Against the engine, one number means the same thing everywhere. Sports holds
1.08x peak, Race 1.35x, and neither is ever worse than the clutch the car came
with.

| Build | Grip | Stock pass | Flat out | Managed | Gap |
|---|---|---|---|---|---|
| skyline-gtr | 1.81 | 12.90 @ 107 | **9.56 @ 143** | 10.03 @ 142 | −0.47 |
| nsx | 1.78 | 13.20 @ 106 | **9.58 @ 149** | 9.68 @ 149 | −0.09 |
| viper-srt10 | 1.75 | 12.60 @ 120 | 10.27 @ 155 | 9.33 @ 157 | 0.94 |
| rx8 | 1.73 | 14.27 @ 98 | **10.30 @ 140** | 10.34 @ 139 | −0.04 |
| evo-vii | 1.80 | 12.81 @ 105 | **10.55 @ 128** | 10.66 @ 128 | −0.11 |
| supra-tt | 1.72 | 13.83 @ 106 | 11.02 @ 133 | 10.68 @ 133 | 0.35 |
| rsx-type-s | 1.68 | 14.99 @ 94 | 11.52 @ 134 | 11.39 @ 133 | 0.13 |
| civic-si | 1.67 | 15.29 @ 91 | **11.61 @ 129** | 11.67 @ 128 | −0.06 |
| mustang-cobra | 1.68 | 14.06 @ 109 | 12.50 @ 138 | 10.23 @ 143 | 2.27 |
| neon-srt4 | 1.65 | 14.46 @ 101 | 13.33 @ 118 | 11.88 @ 121 | 1.45 |
| mopar-drag | 2.62 | 9.10 @ 166 | 7.52 @ 168 | 7.01 @ 168 | 0.51 |
| f-type-drag | 2.94 | 8.17 @ 168 | **6.54 @ 168** | 6.48 @ 168 | 0.06 |
| funny-car | 3.42 | 7.09 @ 215 | **5.24 @ 219** | 5.16 @ 219 | 0.09 |

A negative gap means **flooring it is the quickest way down the track**, which is
how the game should feel: the driver sees green and pins it. Eleven of the
thirteen are at or inside half a second either way.

Getting there took three separate fixes, and only one of them was about grip.

**The driver could not shift off the limiter.** The guard added to stop
chain-shifting waited for the revs to fall 500rpm below the shift point, but the
limiter's own hysteresis is 250rpm — so an engine pinned against it oscillates in
a band half as wide as the re-arm needs, and the shift can never fire. The built
Mustang sat in second gear at 62mph, on the limiter, for the entire run. It
looked exactly like a traction problem and was not one: it was a bug, and it cost
that car four seconds and 67mph of trap speed. The re-arm now waits for the
clutch to take up instead, which is the physical difference between revs falling
because the drive re-engaged and revs dipping because the throttle was cut for
the change.

**The clutch could not hold a built engine** — see above.

**The grip parts were not scaled for what the engine parts do.** Drag radials
gave 13% more grip against a torque increase of up to 170%, so a fully built car
simply could not put its power down and a driver who lifted was three seconds
quicker. Street tyres now give 15% and drag radials 45%. These are invented
figures chosen for feel, which is what this file is for.

**The Mustang and the Neon still reward a lift**, by 2.25s and 1.45s. They are
the two cars whose torque is furthest ahead of what their tyres and drivetrain
can use — 1083Nm through the back wheels, and 533Nm through the front of a car
that unloads its drive wheels as it accelerates. Both still run well flat out
(12.47 @ 138 and 13.33 @ 118); they are simply not at their best. Closing that
too would mean either more grip for everyone, which makes the other eight a
grip-fest, or cutting their torque specifically.

Every car finishes, standard and fully built. Before this the Skyline finished
neither.

### Two things the driver was getting wrong

Both silently, and both looked like broken cars.

**Rolling up to the line at a fixed throttle fraction.** 14% of a stock Civic is
a gentle creep; 14% of a built Skyline is a launch through the beams, and the
pass was recorded as "did not finish". Aiming at a fixed *torque* instead only
moved the problem: it ignores gearing and weight, and the standard Skyline —
heavy and tall-geared — then crept for 285 of its 300 available seconds before
it even staged. The driver now asks for an acceleration and works back through
the car's own first gear, final drive and mass, with the plan's figure as a
ceiling and a floor beneath it, because the clutch follows the throttle and too
small a number opens it entirely.

**Driving flat out regardless of grip.** Covered above under the instrument. The
CPU opponents now use it too: without it, a clutch strong enough to hold a built
engine made the quick opponents slower than the slow ones.

## Parts catalogue

Thirty-two parts. **Every one currently fits every car** — `compatibleCarIds` is
empty on all of them, so a Civic panel filter is purchasable for a Funny Car. The
compatibility system exists and is inert; the practical exploit is closed by part
ownership living on the vehicle rather than the account, so each car pays for its
own.

**Every price is invented** — the only confirmed price in the project is $1,500
to apply paint. The starting balance is a development figure of $1,000,000 so
every car and part can be reached for testing; the intended economy is Stage 6's
prize money.

| Part | Category | Price | Requires | Exclusion group |
|---|---|---|---|---|
| High-Flow Panel Filter | intake | $180 | — | intake-path |
| Cold-Air Intake | intake | $520 | panel-filter | intake-path |
| Short-Ram Intake | intake | $390 | — | intake-path |
| Sports Muffler | exhaust | $360 | — | — |
| Cat-Back Exhaust | exhaust | $780 | sports-muffler | — |
| 4-2-1 Race Header | exhaust | $950 | cat-back | — |
| ECU Reflash | ecu | $650 | — | engine-management |
| Standalone ECU | ecu | $1750 | ecu-reflash | engine-management |
| Performance Camshafts | engine | $1450 | race-header | — |
| High-Compression Pistons | engine | $2200 | performance-cams | — |
| Ported Cylinder Head | engine | $2600 | performance-cams | — |
| Lightweight Flywheel | clutch | $680 | — | — |
| Sports Clutch | clutch | $900 | — | clutch |
| Race Clutch | clutch | $1650 | sports-clutch | — |
| Short Shifter | transmission | $420 | — | — |
| Limited-Slip Differential | transmission | $1800 | — | — |
| Performance Street Tyres | tyres | $600 | — | tyres |
| Drag Radials | tyres | $1350 | street-tyres | tyres |
| Sport Springs | suspension | $550 | — | — |
| Adjustable Dampers | suspension | $1150 | sport-springs | — |
| Rear Seat Delete | weight-reduction | $250 | — | — |
| Lightweight Battery | weight-reduction | $480 | — | — |
| Stage 1 Weight Reduction | weight-reduction | $1100 | rear-seat-delete | — |
| Turbo Manifold | turbo-accessory | $900 | — | induction-hardware |
| Front-Mount Intercooler | turbo-accessory | $1250 | turbo-manifold | — |
| Street Turbo Kit | turbo | $3800 | turbo-manifold + intercooler + sports-clutch | forced-induction |
| Race Spec Turbo Upgrade Kit | turbo | $6200 | street-turbo + race-clutch | forced-induction-upgrade |
| Supercharger Bracket Kit | supercharger | $850 | — | induction-hardware |
| Street Supercharger | supercharger | $4200 | supercharger-bracket + sports-clutch | forced-induction |
| Race Supercharger | supercharger | $6500 | street-supercharger + race-clutch | forced-induction-upgrade |

### Stacking versus replacing

Two shapes, and the difference is physical rather than stylistic. A part
**stacks** when it declares its predecessor in `requires` and shares no exclusion
group with it — both stay fitted and their effects compound. A part **replaces**
when the two share a group.

Stacking is right where the parts are genuinely different components that
coexist on the car:

- exhaust — a muffler, a cat-back and a header are three separate things
- engine internals — cams, pistons and a head
- suspension — springs and dampers
- weight reduction — cumulative by definition
- forced-induction hardware — a manifold, an intercooler and the kit that uses them

Replacing is right where you can only have one:

| Group | Members | Why |
|---|---|---|
| `intake-path` | panel filter, short-ram, cold-air | A car has one intake. A panel filter is an insert in the stock airbox; a cold-air replaces the airbox outright, so the filter has nothing left to sit in. |
| `tyres` | street tyres, drag radials | One set of tyres. |
| `engine-management` | reflash, standalone ECU | A standalone replaces the stock ECU; reflashing the one you removed means nothing. |
| `forced-induction` | street turbo, street blower | Not both. |
| `forced-induction-upgrade` | race turbo, race blower | Not both. |
| `induction-hardware` | turbo manifold, blower bracket | Not both. |
| `clutch` | sports clutch | See below. |

Three of these were added after an audit found them stacking when they should
not: the intake, tyre and ECU ladders each handed out free performance for
fitting two mutually exclusive parts. The tyre one was worth 4% of grip on a car
where grip is the binding constraint.

**One is knowingly still wrong.** The Race Clutch keeps the Sports Clutch fitted
and their efficiencies compound (0.9230 against 0.9150). It cannot simply be
given the `clutch` group, because `sports-clutch` is also a prerequisite of both
forced-induction kits: `previewPurchaseAndFit` cascades a replacement to
everything that requires it, so upgrading your clutch would uninstall your
turbo. Fixing it properly means either a notion of *tiers* — "requires a clutch
of at least this rating" — or dropping the clutch prerequisite from the kits and
letting the physics enforce it, which it already does: fit a big turbo behind a
stock clutch and it slips, and the car is slower than standard. The second is
the smaller change and the better game. Neither is done.

Fully built — every part that can legally be fitted together, 23 of the 32 —
the Civic comes out at **365 hp, 350Nm, 1080 kg, grip 1.30, clutch 473, and
12.35 at 121mph, $51,860 spent.** The greedy fit lands on the supercharger: it
can be fitted before the turbo, and then blocks it.

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

**The fully-built Civic currently runs 12.35s, not low 8s.** That gap is the
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

## Stopping a built car

Staging a fully built Evo or Skyline was impossible: the car would not come to a
stop at any throttle setting, and the SLIP lamp stayed lit with the throttle
shut, which read as the brakes having no effect. It was not the brakes.

Traced tick by tick, a built Evo creeping at 0.5m/s on the brakes looked like
this:

| tick | speed | wheel omega | slip |
|---|---|---|---|
| 900ms | 0.517 | +2.19 | −0.36 |
| 901ms | 0.532 | −0.06 | +0.09 |
| 902ms | 0.515 | +2.81 | −0.28 |
| 903ms | 0.532 | −0.19 | +0.19 |

The wheel reversed relative to the road **every millisecond**. Slip changed sign
with it, so the tyre force alternated between hard braking and hard driving and
averaged out to 0.13m/s2 of deceleration. Half of those ticks read as locked,
which is why the lamp stayed on.

This is the third instance of the trap `CLAUDE.md` records for the clutch and the
brakes, one level further down. A tyre at 1.8g acting on a 1.55kgm2 wheel swings
that wheel by more than road speed inside a single 1ms step, so an explicit step
shoots past the rolling condition instead of settling on it. Grip is the term
that decides it, which is why the cars it broke were the well built ones and why
raising the grip parts for throttle feel is what pushed them over the line. Every
car chattered to some degree; most were just far enough under the threshold to
still stop.

The fix is the one the clutch already uses: detect the crossing, then solve for
the tyre force that lands exactly on the rolling condition at the end of the
step, and clamp it to what the contact patch can transmit. Below the grip limit
the wheel rolls; above it, it slides and the slip model carries on untouched.
Nothing changes on either side of the crossing, and the measured effect on the
quarter mile is at most 0.03s on any car in the roster -- it only ever bites at
low speed, which is where the step was invalid.

`sim/braking.test.ts` holds it: every car, fully built, has to stop inside the
staging window from walking pace without its contact patch crossing on more than
5% of ticks. With the fix removed, 14 of its 41 assertions fail.

### What staging feels like now

Stopping distance from a creep, fully built, and whether the car can be brought
to rest inside the 1.2m window:

| Build | 1% throttle | 6% | 12% | 25% |
|---|---|---|---|---|
| mopar-drag | 0.35m | 0.89m | 1.16m | 1.81m |
| f-type-drag | 0.44m | 1.16m | 1.48m | 2.24m |
| funny-car | 1.50m | 1.83m | 2.30m | 3.35m |

The ten showroom cars all stage comfortably at anything up to about 20% throttle.
The three career specials demand a deliberate blip and an early lift -- the Funny
Car cannot simply be driven into the window at all, and has to be braked well
before it. That is left as it is: it is the fastest thing in the game by three
seconds and asking for precision on the line is a fair price.
