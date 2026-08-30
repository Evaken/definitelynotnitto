"""Build a transparent, colour-maskable Civic garage sprite.

The art source is authored on a light checkerboard so its silhouette can be
recovered deterministically without an opaque rectangle or hand-cut mask.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


def is_checker_pixel(pixel: tuple[int, int, int]) -> bool:
    red, green, blue = pixel
    return max(pixel) - min(pixel) <= 24 and (red + green + blue) / 3 >= 170


def extract_sprite(source: Image.Image) -> Image.Image:
    if "A" in source.getbands() and source.getchannel("A").getextrema()[0] == 0:
        result = source.convert("RGBA")
        # Authored pixel sprites need a hard silhouette. Image-generation
        # outputs can contain an almost-invisible antialiased halo even when
        # they have a transparent background, so normalise that edge here.
        result.putalpha(result.getchannel("A").point(lambda value: 255 if value >= 128 else 0))
        return result
    rgb = source.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    outside = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if outside[index] or not is_checker_pixel(pixels[x, y]):
            return
        outside[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    alpha = Image.new("L", (width, height), 255)
    alpha.putdata([0 if value else 255 for value in outside])
    result = rgb.convert("RGBA")
    result.putalpha(alpha)
    return result


def body_mask(sprite: Image.Image) -> Image.Image:
    pixels = sprite.convert("RGBA")
    mask = Image.new("L", pixels.size, 0)
    mask.putdata([
        255
        if alpha > 40
        and red > 50
        and red > green * 1.24
        and red > blue * 1.18
        and red - min(green, blue) > 28
        else 0
        for red, green, blue, alpha in pixels.getdata()
    ])
    return mask.point(lambda value: 255 if value >= 128 else 0)


def clip_to_silhouette(sprite: Image.Image, silhouette_source: Image.Image) -> Image.Image:
    """Remove generated backdrop glow using a known clean car silhouette."""
    silhouette = extract_sprite(silhouette_source).resize(sprite.size, Image.Resampling.NEAREST)
    allowance = silhouette.getchannel("A").filter(ImageFilter.MaxFilter(11))
    result = sprite.copy()
    result.putalpha(ImageChops.multiply(sprite.getchannel("A"), allowance))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--silhouette", type=Path)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    sprite = extract_sprite(Image.open(args.source))
    if args.silhouette:
        sprite = clip_to_silhouette(sprite, Image.open(args.silhouette))
    # Author the runtime image on a genuinely small grid, then enlarge by an
    # integer factor. This makes the pixel clusters survive browser scaling;
    # merely shrinking the high-resolution source once still reads as a photo.
    low_resolution = sprite.resize((256, 170), Image.Resampling.NEAREST)
    sprite = Image.new("RGBA", (768, 512), (0, 0, 0, 0))
    sprite.paste(low_resolution.resize((768, 510), Image.Resampling.NEAREST), (0, 1))
    mask = body_mask(sprite)
    alpha_mask = Image.new("RGBA", mask.size, (255, 255, 255, 0))
    alpha_mask.putalpha(mask)
    sprite.save(args.output_dir / "garage-body.webp", "WEBP", lossless=True, method=6, exact=True)
    alpha_mask.save(args.output_dir / "garage-paint-mask.png", optimize=True)


if __name__ == "__main__":
    main()
