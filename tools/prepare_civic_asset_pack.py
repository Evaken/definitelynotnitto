"""Prepare the first versioned layered Civic sprite pack.

The runtime never executes this file.  It is an art-pipeline helper: remove the
checkerboard from the wheel-less master created for the project, resize it to
the fixed authoring canvas, and derive paint masks from the body colour.  Pillow
is the only dependency.

Usage:
  python tools/prepare_civic_asset_pack.py --garage-master path/to/master.png
"""

from __future__ import annotations

import argparse
import colorsys
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps" / "web" / "public" / "assets" / "cars" / "civic-si" / "v2"
RACE_SOURCE = ROOT / "apps" / "web" / "public" / "assets" / "race-civic-ek-rear-v2.webp"
CANVAS = (768, 512)


def remove_connected_checkerboard(image: Image.Image) -> Image.Image:
    """Turn the light neutral checkerboard connected to the edge into alpha."""

    source = image.convert("RGBA")
    width, height = source.size
    pixels = source.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def eligible(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        return min(red, green, blue) >= 172 and max(red, green, blue) - min(red, green, blue) <= 18

    def add(x: int, y: int) -> None:
        offset = y * width + x
        if not visited[offset] and eligible(x, y):
            visited[offset] = 1
            queue.append((x, y))

    for x in range(width):
        add(x, 0)
        add(x, height - 1)
    for y in range(height):
        add(0, y)
        add(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (*pixels[x, y][:3], 0)
        if x:
            add(x - 1, y)
        if x + 1 < width:
            add(x + 1, y)
        if y:
            add(x, y - 1)
        if y + 1 < height:
            add(x, y + 1)

    # Remove the remaining pale antialias fringe without touching connected
    # chrome highlights on the vehicle itself.
    alpha = source.getchannel("A")
    alpha_pixels = alpha.load()
    for y in range(height):
        for x in range(width):
            if alpha_pixels[x, y] == 0:
                continue
            red, green, blue, _ = pixels[x, y]
            spread = max(red, green, blue) - min(red, green, blue)
            if min(red, green, blue) > 205 and spread < 22:
                touching_clear = any(
                    0 <= nx < width and 0 <= ny < height and alpha_pixels[nx, ny] == 0
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
                )
                if touching_clear:
                    alpha_pixels[x, y] = 0
    source.putalpha(alpha)
    return source


def alpha_mask(image: Image.Image) -> Image.Image:
    mask = Image.new("RGBA", image.size, (255, 255, 255, 0))
    mask.putalpha(image.getchannel("A"))
    return mask


def paint_colour_mask(image: Image.Image, base_hue: float) -> Image.Image:
    """Select the photographed blue paint without tinting glass, tyres or trim."""

    source = image.convert("RGBA")
    alpha = Image.new("L", source.size)
    output = alpha.load()
    pixels = source.load()
    for y in range(source.height):
        for x in range(source.width):
            red, green, blue, opacity = pixels[x, y]
            if opacity == 0:
                continue
            hue, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
            distance = abs((hue * 360 - base_hue + 180) % 360 - 180)
            if distance > 92 or saturation < 0.055 or value < 0.035:
                continue
            hue_weight = max(0.0, 1.0 - distance / 105)
            saturation_weight = min(1.0, saturation / 0.22)
            output[x, y] = round(opacity * max(0.72, hue_weight * saturation_weight))
    alpha = alpha.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    mask = Image.new("RGBA", source.size, (255, 255, 255, 0))
    mask.putalpha(alpha)
    return mask


def save_webp(image: Image.Image, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=92, method=6, exact=True)


def neutralise_paint(image: Image.Image, mask: Image.Image) -> Image.Image:
    """Remove baked paint hue while retaining photographic luminance/detail."""

    neutral = ImageEnhance.Color(image.convert("RGBA")).enhance(0)
    return Image.composite(neutral, image.convert("RGBA"), mask.getchannel("A"))


def tone_paint_base(image: Image.Image, mask: Image.Image, brightness: float) -> Image.Image:
    """Bring a very light master into a mid-grey range suitable for tinting."""

    toned = ImageEnhance.Brightness(image).enhance(brightness)
    return Image.composite(toned, image, mask.getchannel("A"))


def erase_mask_polygons(mask: Image.Image, polygons: list[list[tuple[int, int]]]) -> Image.Image:
    """Keep glass, lamps and exposed engine components out of the paint zone."""

    alpha = mask.getchannel("A")
    draw = ImageDraw.Draw(alpha)
    for polygon in polygons:
        draw.polygon(polygon, fill=0)
    mask.putalpha(alpha)
    return mask


def erase_mask_ellipses(mask: Image.Image, ellipses: list[tuple[int, int, int, int]]) -> Image.Image:
    """Keep complete photographed wheels out of the body-paint zone."""

    alpha = mask.getchannel("A")
    draw = ImageDraw.Draw(alpha)
    for ellipse in ellipses:
        draw.ellipse(ellipse, fill=0)
    mask.putalpha(alpha)
    return mask


def fit_canvas(image: Image.Image) -> Image.Image:
    """Contain artwork without changing the source camera's aspect ratio."""

    copy = image.copy()
    copy.thumbnail(CANVAS, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS)
    canvas.alpha_composite(copy, ((CANVAS[0] - copy.width) // 2, (CANVAS[1] - copy.height) // 2))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--garage-master", type=Path, required=True)
    parser.add_argument("--race-master", type=Path)
    args = parser.parse_args()

    OUTPUT.mkdir(parents=True, exist_ok=True)
    garage = fit_canvas(remove_connected_checkerboard(Image.open(args.garage_master)))
    garage_mask = paint_colour_mask(garage, 220)
    garage_mask = erase_mask_polygons(garage_mask, [
        [(263, 147), (392, 91), (494, 109), (469, 196), (274, 195)],
        [(500, 107), (644, 104), (707, 196), (530, 197)],
        [(100, 260), (260, 192), (468, 205), (341, 307)],
        [(48, 257), (98, 245), (102, 321), (49, 318)],
        [(235, 269), (348, 270), (353, 335), (231, 330)],
        [(96, 321), (226, 322), (221, 346), (99, 345)],
        [(58, 354), (211, 355), (211, 383), (61, 381)],
    ])
    garage_mask = erase_mask_ellipses(garage_mask, [
        (367, 293, 479, 438),
        (666, 236, 758, 359),
    ])
    save_webp(neutralise_paint(garage, garage_mask), OUTPUT / "garage-body.webp")
    garage_mask.save(OUTPUT / "garage-paint-mask.png", optimize=True)

    race_source = Image.open(args.race_master) if args.race_master else Image.open(RACE_SOURCE)
    race = fit_canvas(remove_connected_checkerboard(race_source))
    race_mask = erase_mask_polygons(alpha_mask(race), [
        [(169, 69), (593, 69), (575, 166), (191, 166)],
        [(124, 163), (196, 163), (194, 274), (126, 274)],
        [(567, 163), (642, 163), (640, 274), (568, 274)],
        [(111, 344), (195, 344), (193, 440), (112, 440)],
        [(549, 344), (641, 344), (640, 440), (550, 440)],
        [(467, 347), (527, 347), (527, 407), (467, 407)],
    ])
    race_neutral = neutralise_paint(race, race_mask)
    save_webp(tone_paint_base(race_neutral, race_mask, 0.58), OUTPUT / "race-body.webp")
    race_mask.save(OUTPUT / "race-paint-mask.png", optimize=True)

    print(f"Prepared Civic asset pack in {OUTPUT}")


if __name__ == "__main__":
    main()
