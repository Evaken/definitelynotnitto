# Layered car rendering

> Current production scope: factory car plus body colour only. The layered
> schema and compositor remain dormant scaffolding for a later art-led rebuild;
> loading or saving a vehicle currently resets wheels, aero, panels, graphics,
> decals and ride height to factory values while preserving its chosen hue.

The Honda Civic was the production pilot for a scalable visual-customisation
pipeline. The experiment is retained for future art development, but the
current production renderer uses only the factory portrait plus a saved body
hue. Every screen derives that view from the same vehicle instance.

## Runtime contract

`apps/web/src/carRenderer/civicPack.ts` is the authored manifest. Each view has:

- a transparent, neutral-paint body master;
- a paint-zone alpha mask;
- wheel slots and physical-part anchor data;
- perspective quads for paint graphics and positioned decals.

`civicCompositor.ts` retains the experimental fixed layer order, but only its
factory portrait and paint stage are active in production. The Garage, Vehicle
Setup, Paint Shop, Showroom, Community showcase, selected-car rail and race
renderer all normalise the saved `Appearance` to factory specification plus
body hue before drawing it.

The display style is a final renderer stage rather than a second set of car
assets. `pixelArt.ts` downsamples the completed frame, restricts its palette and
scales it back with nearest-neighbour sampling. The garage applies this after
the factory car and paint are composed; the strip applies it once to the
complete world and car scene. Prompts, gauges and the Nitto-inspired interface
remain sharp and readable above it. Dormant layers must not be exposed again
until replacement art is calibrated and approved.

Pixel conversion is presentation only. It must never change the saved
`Appearance`, vehicle-instance ownership, installed-part ids or performance
simulation. A future hand-authored pixel master can replace any source layer
without changing the server schema or screen consumers.

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

## Pixel-art asset standard

- Author each fixed camera view at a low internal resolution with hard alpha
  edges and no baked checkerboard, scene background or drop shadow.
- Keep aligned physical components on transparent canvases with exactly the
  same dimensions and origin as that car's body master.
- Paintable areas remain masks, not extra full-car variants.
- Preview the loudest possible build before publishing an asset-pack version.
- Generated artwork is reference material until transparency, crop, alignment
  and part registration pass that inspection.
