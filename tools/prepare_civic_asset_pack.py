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
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps" / "web" / "public" / "assets" / "cars" / "civic-si" / "v1"
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


def cut_garage_wheel_wells(image: Image.Image) -> Image.Image:
    """Make the authored empty wells true slots for wheels drawn underneath."""

    result = image.convert("RGBA")
    alpha = result.getchannel("A")
    draw = ImageDraw.Draw(alpha)
    draw.ellipse((368, 275, 478, 392), fill=0)
    draw.ellipse((677, 240, 756, 331), fill=0)
    result.putalpha(alpha)
    return result


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
    garage = remove_connected_checkerboard(Image.open(args.garage_master))
    garage = cut_garage_wheel_wells(fit_canvas(garage))
    garage_mask = erase_mask_polygons(alpha_mask(garage), [
        [(205, 156), (390, 96), (513, 120), (487, 216), (226, 211)],
        [(504, 105), (651, 112), (731, 214), (529, 219)],
        [(128, 250), (331, 190), (459, 244), (263, 313)],
        [(47, 254), (91, 242), (99, 316), (48, 307)],
        [(216, 285), (349, 288), (357, 341), (214, 329)],
        [(88, 313), (211, 313), (207, 343), (91, 343)],
        [(31, 340), (196, 344), (201, 389), (31, 383)],
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
