# Reference screenshots

Surviving screenshots of the original **Nitto 1320 Challenge**. These are the
only primary sources this project has. Everything tagged `sourced` in
`config/historical.ts` traces back to one of them.

Add more here as you find them, and record what each one settles in
`HISTORICAL_NOTES.md`.

---

## `race-view-two-civics.webp` — the race screen (v1.52)

**The single most important source.** The project was built side-on for its first
stage because `PROJECT_SPEC.md` says "side-on 2D drag racing" twice. This shows
that is wrong.

Settles:

- **The camera is behind the cars**, looking down the strip. Both lanes visible,
  cars in rear three-quarter view.
- **The tree stands in the centre of the view**, between the lanes, with a bulb
  column per lane. `PRE-STAGED` and `STAGED` indicator boxes sit above it, one
  per lane.
- **Timing boards flank the strip** — left and right panels carrying a sponsor
  logo (Mopar, Chrysler) and a red LED readout. The right reads `16.200`.
- **The instrument cluster is along the bottom**: a `BOOST PRESS` dial, a large
  `RPM x1000` tachometer with a red zone, and an `MPH` dial reading to 160.
- **`GAS PEDAL` and `CLUTCH FEATHER` are vertical sliders** to the right of the
  dials. The throttle really was a slider; there really was a clutch control.
- **Gear indicator column** on the far right reading `6 5 4 3 2 1 N R` top to
  bottom, current gear highlighted. Confirms reverse and neutral are selectable.
- **The boost dial stays visible on a naturally aspirated car**, needle at rest,
  rather than being hidden.
- Scenery is dense roadside foliage with a city skyline behind.
- A `STAGING` prompt in green sits under the tree with a large arrow, so the
  game told the driver what to do next.
- A tall thin vertical bar runs down the far left edge. It is a **staging**
  gauge, not whole-track progress: it shows how much further the car has to roll
  to reach the line. Judging a metre or so of roll-in from behind the car is the
  one thing this camera makes genuinely hard, which is presumably why the
  original gave it its own instrument.

## `car-showroom.png` — Car Showroom (v1.51)

- Cars shown as **large three-quarter front renders**, one per panel, in a
  horizontal carousel that scrolls (the outer two are cut off by the frame).
- Model wordmark above each car, a cyan `DETAIL` button below.
- Roster visible: Skyline GT-R, Acura NSX, Dodge Viper — all three are in the
  spec's roster, so that list is sound.
- Showroom cars are rendered in plain silver, except the Viper in red with white
  stripes.

## `garage-paint-shop.webp` — Garage → Paint Shop (v1.52)

- **The Garage is not one screen.** Its sub-navigation reads
  `◀ BACK | MODIFICATIONS | TUNE AND DYNO | PAINT SHOP | MAINTENANCE`.
- Paint is **HUE / SATURATION / BRIGHTNESS sliders**, not a palette of preset
  colours, applied to three separately coloured zones: `BODY COLOR`,
  `GRAPHICS COLOR`, `NUMBER COLOR`.
- Graphics are named presets from a dropdown; the one shown is `Lightning`.
- A car number can be typed in, with a `DROP SHADOW` toggle.
- **Applying paint costs $1,500** — the first confirmed price anywhere in this
  project. Money is called `Account Balance`.
- The player's car is shown in **three-quarter front view**, the same angle as
  the showroom.
- The car is a **sixth-generation (EK) Civic hatchback**, not the EP3. See
  `HISTORICAL_NOTES.md`.

## Present in all three

- **Eight** navigation tabs:
  `MAIN | CHALLENGE INFO | GARAGE | RACE TRACK | PARTS SHOP | CAR SHOWROOM | TEAM | COMMUNITY`.
  The spec lists only seven — `COMMUNITY` is missing from it.
- A persistent bottom status bar: `SELECTED CAR:` with a thumbnail and name,
  `EDIT MY ACCOUNT`, and a live incoming-challenge count.
- The status-bar thumbnail reflects the car's actual paint — yellow in the paint
  shop, dark in the showroom.
- A fixed, bounded window of roughly 830x580, never a fluid page.
