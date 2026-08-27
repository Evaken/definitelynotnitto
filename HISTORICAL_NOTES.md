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

The original's key layout is unknown. The current scheme gives one key both the
launch and the upshift job:

| Key | Action |
|---|---|
| ↑ / W | Throttle |
| Space / → / D | Launch, then upshift |
| ← / A | Downshift |
| R | Reset run |

This was chosen because it was common in period browser drag games and because
it makes the launch press double as the reaction: the moment you hit it is your
reaction time. **It is a guess.** Bindings live in `DEFAULT_BINDINGS`.

Specific things to find out:

- Was there a separate clutch key?
- Was staging done by creeping, or by a button?
- Was the throttle analogue in any sense, or purely a held key?

### Christmas tree — `assumed`

Pro tree assumed: three ambers together, green 0.400s later. The Sportsman tree
(sequential ambers, 0.500s apart) is fully implemented and selected by changing
`TREE.type`. Which the original used is unknown.

The random pause before the ambers (600–1400ms) is invented.

### Staging and rollout — `real-world`, likely not in the original

The simulation models the beams at NHRA spacing (7in apart), and starts the ET
clock when the tyre rolls clear of the stage beam rather than when the clutch
drops. This makes staging depth a real trade-off: stage deep for a quicker light
and a slower run, stage shallow for the reverse.

**Whether the original modelled any of this is completely unknown.** It may have
had a single "staged" state and started the clock at the launch. If research
shows that, the rollout can be removed by setting `beamBlockLengthM` to zero —
no simulation code needs changing.

### Shift dead time — `assumed`

150ms with no torque to the wheels, and the driver assumed to lift through the
change. Both invented. The original's shift penalty is unknown and is a large
part of how the game felt.

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
