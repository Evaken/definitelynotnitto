# Layered car rendering

The Honda Civic is the production pilot for a scalable visual-customisation
pipeline. It replaces the old whole-image CSS treatment for that car. The aim
is **not** to store one complete image for every possible build. The server
saves one versioned appearance recipe against a vehicle instance, and every
screen composes that recipe over the same versioned car pack.

## Runtime contract

`apps/web/src/carRenderer/civicPack.ts` is the authored manifest. Each view has:

- a transparent, neutral-paint body master;
- a paint-zone alpha mask;
- wheel slots and physical-part anchor data;
- perspective quads for paint graphics and positioned decals.

`civicCompositor.ts` renders in a fixed order: shadow, wheels, rear attachments,
body, paint, graphics, panel replacements, decals, then foreground attachments.
The Garage, Vehicle Setup, Paint Shop, Showroom, Community showcase, selected-
car rail and race renderer all read the same `Appearance` recipe. A category is
added by adding a catalogue id plus its layer/geometry implementation; it must
not add a matrix of complete-car variants.

The Civic currently has two fixed camera views: `garage` and `race-rear`. A
physical component only appears in a view where that view has an authored
anchor or aligned layer. Do not estimate one car's geometry from another:
bonnets, roofs, wheelbases and boot lines are per-car data.

## Preparing the Civic pack

The original pilot remains in `v1`; the corrected current pack lives at:

```
apps/web/public/assets/cars/civic-si/v2/
  garage-body.webp
  garage-paint-mask.png
  race-body.webp
  race-paint-mask.png
  wheel-mesh.webp
```

Rebuild them from clean masters with:

```powershell
python tools/prepare_civic_asset_pack.py `
  --garage-master path/to/civic-garage-master.png `
  --race-master path/to/civic-race-master.png
```

The tool removes the authoring background, fits the fixed 768×512 canvas,
neutralises baked paint and derives the paint masks. The current stock Civic
keeps its photographed tyres and factory wheels. An aftermarket choice overlays
only a perspective-scaled rim face inside the existing tyre; do not cut guessed
elliptical holes through the body again. Mask polygons are calibration data for
this exact Civic and camera view. Change them only after inspecting a full-size
composite.

## Adding another car

1. Author clean, fixed-camera masters with transparent backgrounds. Keep the
   lighting and camera locked for every aligned component layer.
2. Create a new versioned pack; never silently replace geometry in an already
   published asset version.
3. Calibrate paint masks, wheel centres and surface quads for that car.
4. Route the new pack through the shared compositor seam.
5. Test one deliberately loud recipe in every consuming screen: non-stock
   paint, graphics, wheels, spoiler, panel component and decal.
6. Keep each binary near the repository's asset budget in `CLAUDE.md`.

The current wheel and attachment drawings prove the mechanics and state flow;
production art can later replace those individual layers without changing the
appearance schema, ownership records or renderer contract.
