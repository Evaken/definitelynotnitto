# Nitto 1320 Challenge 1.52 — garage and store behaviour map

This is a clean-room behaviour map made by static analysis of a verified copy
of the Version 1.52 Windows client. It records interaction and state semantics
only. No original scripts, artwork, sounds or binary files are included in this
repository or used by the recreation at runtime.

Archive SHA-1: `88D569607820244A7AFD9BE21EC46F2CBF3C7F94`.

## Garage

- The selected car is opened first; Vehicle Setup is a separate destination.
- Modifications uses a top-level category menu, a generated subsystem menu and
  then a component detail view.
- The component menu is built from the selected car's owned part records.
- Ownership and installation are separate states. A part can be installed,
  uninstalled into storage, and installed again later.
- Installation and uninstallation are distinct confirmed operations.
- Tune and Dyno, Paint Shop and Maintenance are sibling garage departments.

## Parts store

- The store has a category/product browser and a separate product detail and
  purchase flow.
- Purchases target the currently selected car and successful purchases install
  the component.
- Requirements distinguish hardware already owned from hardware still needing
  purchase; both must be installed before the dependent component.
- Conflicting hardware can require replacement confirmation. Conflicts can also
  cascade to fitted components that depend on the removed part.
- Price and balance are checked before completing the transaction.

## Performance effects observed in the client

The client contains paths for component effects including horsepower, boost,
tyre grip, rev limit, weight, engine damage factor, clutch wear factor and
nitrous shot size. This settles that parts affect vehicle performance, but does
not recover a complete historical catalogue or trustworthy values: much of that
data arrived from the original server. Current names, prices and effect values
therefore remain provisional until Stage 15 calibration.

## Recreation boundary

The web recreation implements these state transitions and screen relationships
in original code. Its CSS illustrations, fictional brands, catalogue data and
all gameplay code are independently created replacements.
