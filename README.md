# definitelynotnitto

A recreation of **Nitto 1320 Challenge**, the browser drag-racing game, as it was
before 2007 — side-on quarter-mile racing, manual staging, manual shifting, and
tuning that actually matters.

**Play the current build:** https://evaken.github.io/definitelynotnitto/

Stage 1 of 16 is done: one car (a stock Honda Civic Si), one lane, and a clock.
[ROADMAP.md](ROADMAP.md) lists all sixteen stages and what is next.

Viewed from behind the car looking down the strip, with the tree between the
lanes and a full instrument cluster below — matching the surviving screenshots
in [`docs/reference/`](docs/reference/).

---

## Running it

Node 22 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # 116 tests
npm run typecheck
npm run build
```

## Driving it

The car starts in **neutral** and will not move until you select a gear *and*
open the throttle. The throttle is the slider beside the strip — dragged by
hand, and sprung, so it shuts on its own when you let go.

| Control | Action |
|---|---|
| Drag the slider | Throttle, 0–100% |
| `W` | Gear up: R → N → 1 → 2 → 3 … |
| `A` | Gear down |
| `S` | Brake |
| `R` | Reset the run |

Roll up to the lines, stop with the nose inside the staging window, wait for the
tree, and go. Roll through the line and you have to reverse back in.

The gas pedal is the bar on the instrument panel, dragged with the mouse. It is
sprung, so it shuts on its own when you let go.

The quick way to launch is the real one: hold revs in neutral on the brakes and
select first as the tree drops. Nobody scripted that — it falls out of the car
having no clutch pedal.

## Layout

```
packages/game-core/    Pure TypeScript. Cars, parts, physics, race rules.
                       No React, no DOM, no randomness.
apps/web/              React + Vite client. Canvas renderer, controls, HUD.
```

## Where to read next

| Document | For |
|---|---|
| [ROADMAP.md](ROADMAP.md) | **Start here.** What is built, what is next, all sixteen stages at a glance |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the code is laid out and why |
| [HISTORICAL_NOTES.md](HISTORICAL_NOTES.md) | What is confirmed about the original vs invented |
| [BALANCE_NOTES.md](BALANCE_NOTES.md) | Measured performance and the effect of each driving lever |
| [CHANGELOG.md](CHANGELOG.md) | What changed and why |
| [PROJECT_SPEC.md](PROJECT_SPEC.md) | The full spec — build lists and completion criteria per stage (§8) |
| [docs/reference/](docs/reference/) | Surviving screenshots of the original. These outrank the spec |
| [CLAUDE.md](CLAUDE.md) | Orientation for an AI coding agent |

## Contributing

Work on a branch and open a pull request. CI typechecks, runs the tests and
builds on every branch and every PR; `main` additionally deploys to the live
site.

`main` cannot be force-pushed or deleted. Everything else in git is recoverable,
so nothing else is locked down.

**Before changing any physics, read the invariants in [CLAUDE.md](CLAUDE.md).**
The simulation has to stay deterministic and the test suite is comparative
rather than absolute — both are easy to break without noticing.
