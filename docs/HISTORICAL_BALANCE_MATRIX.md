# Historical balance matrix

This is the Stage 15 calibration ledger. It deliberately distinguishes current
simulation output from historical evidence. The only surviving performance
targets are the rough competitive classes recorded in `PROJECT_SPEC.md`; no
official source currently establishes stock ETs, exact builds, community tunes
or final-drive ratios. Those cells remain **unrecovered**, not invented.

Stock figures below are deterministic clean-room baseline passes using the
factory tune and a consistent competent input plan. They are regression
baselines, not claims about Version 1.52.

| Vehicle | Current stock ET / MPH | Competitive modified target | Historical gearing | Known build/tune | Evidence status |
|---|---:|---:|---|---|---|
| Civic Si | 15.23 / 91.0 | low 8s | unrecovered | unrecovered | target class only |
| RSX Type-S | 14.88 / 93.7 | mid/high 7s | unrecovered | unrecovered | target class only |
| Lancer Evolution VII | 12.74 / 105.4 | mid/high 7s | unrecovered | unrecovered | target class only |
| Supra Twin Turbo | 13.72 / 106.3 | mid/high 7s | unrecovered | unrecovered | target class only |
| Mustang SVT Cobra | 13.92 / 108.7 | mid/high 7s | unrecovered | unrecovered | target class only |
| Skyline GT-R | 13.09 / 107.5 | mid/high 7s | unrecovered | unrecovered | target class only |
| Neon SRT-4 | 14.33 / 100.8 | unrecovered | unrecovered | unrecovered | roster reference only |
| RX-8 | 14.16 / 97.6 | unrecovered | unrecovered | unrecovered | roster reference only |
| NSX | 13.11 / 105.6 | low 7s | unrecovered | unrecovered | target class only |
| Viper SRT-10 | 12.53 / 120.2 | low 6s | unrecovered | unrecovered | target class only |
| Mopar Drag Car | 9.01 / 165.6 | faster than road cars | unrecovered | unrecovered | class/name only |
| F-Type Drag Special | 8.08 / 167.9 | faster than road cars | unrecovered | unrecovered | class/name uncertain |
| Funny Car | 7.00 / 215.1 | fastest class | unrecovered | unrecovered | class/name only |

## What is guarded now

- Normal cars receive factory clutch capacity proportional to their factory
  torque. This corrects the Viper, Skyline and other high-torque cars silently
  slipping an assumed Civic-strength clutch in stock form.
- Tests preserve distinct normal-car performance, career gates and the clear
  road-car → drag-car → funny-car performance hierarchy.
- Parts, prices, rewards, damage and tuning bounds remain isolated data/config.

## Evidence required before the final historical calibration

Period timing slips, forum tune posts, archived car/part tables or verified
client data are needed. When found, add the source to `docs/reference/README.md`,
replace the relevant **unrecovered** cell, and only then tighten a regression
test. Matching a remembered ET by arbitrarily multiplying engine power would
make the result look right while leaving the actual game model wrong.
