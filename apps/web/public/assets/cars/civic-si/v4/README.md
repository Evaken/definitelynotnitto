# Civic garage pack v4

`garage-body.webp` is an intentionally authored low-resolution Civic sprite,
not a photographic render with a post-process pixel filter. The built-in
image-generation workflow used the v3 Civic for vehicle identity and the
user-supplied green Civic illustration for pixel-art language:

> Preserve the red 1999 Civic hatchback silhouette and front three-quarter
> pose. Re-render it with hard stepped contours, hand-placed pixel clusters, a
> limited palette, checkerboard dithering and no photographic gradients. Keep
> the background genuinely transparent and do not include a floor or shadow.

`art-source/cars/civic-si/v4/source-pixel-art.png` is the generated transparent
source and is kept outside `public/` so it is not shipped to players. The
lossless WebP and hard-edged body-colour mask are rebuilt with
`scripts/build_civic_sprite.py`; nearest-neighbour sampling preserves the
authored clusters. The v3 sprite can be supplied through `--silhouette` to
remove any generated background glow while retaining the clean car outline.
