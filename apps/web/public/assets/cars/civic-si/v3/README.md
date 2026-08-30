# Civic garage pack v3

`garage-body.webp` is the clean production Garage sprite. It was created with
the built-in image-generation workflow using the v2 Civic as an edit reference:

> Preserve the exact three-quarter compact-hatchback pose and wheel positions;
> replace the X-ray bonnet with a closed opaque factory bonnet; repaint every
> body panel coherent saturated red; keep glass, headlights, grille, tyres and
> wheels neutral; return a crisp pixel-art sprite on true transparency with no
> decals, background, shadow or accessories.

`garage-paint-mask.png` is generated from the saturated-red panels by
`scripts/build_civic_sprite.py`. It is a true alpha mask, not an opaque
black-and-white rectangle. Runtime colour is applied only through that mask.
