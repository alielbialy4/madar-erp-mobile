#!/usr/bin/env python3
"""Generate Madar brand icons/splash/favicon from front/public/logo.png and sync native assets."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FRONT_LOGO = ROOT.parent / "front" / "public" / "logo.png"
SOURCE_LOGO = ASSETS / "logo.png"

BG = (15, 23, 42, 255)  # #0F172A — matches splash / adaptive background
NAVY_BRAND = (15, 23, 42, 255)


def load_source() -> Image.Image:
    if FRONT_LOGO.is_file():
        shutil.copy2(FRONT_LOGO, SOURCE_LOGO)
    im = Image.open(SOURCE_LOGO).convert("RGBA")
    return im


def knockout_black_bg(im: Image.Image, luma_thresh: int = 28) -> Image.Image:
    """Remove near-black background via edge flood-fill (keep dark navy logo ink)."""
    w, h = im.size
    px = im.load()
    bg_mask = [[False] * w for _ in range(h)]

    def is_bg(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        if a < 8:
            return True
        # Pure/near black only — Madar ink is ~#101028 and must be kept.
        return r <= luma_thresh and g <= luma_thresh and b <= luma_thresh + 6

    stack: list[tuple[int, int]] = []
    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if is_bg(x, y):
            stack.append((x, y))
    # Also seed along borders
    for x in range(w):
        if is_bg(x, 0):
            stack.append((x, 0))
        if is_bg(x, h - 1):
            stack.append((x, h - 1))
    for y in range(h):
        if is_bg(0, y):
            stack.append((0, y))
        if is_bg(w - 1, y):
            stack.append((w - 1, y))

    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or bg_mask[y][x]:
            continue
        if not is_bg(x, y):
            continue
        bg_mask[y][x] = True
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out_px = out.load()
    for y in range(h):
        for x in range(w):
            if bg_mask[y][x]:
                continue
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            out_px[x, y] = (r, g, b, a)
    return out


def content_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    px = im.load()
    minx, miny, maxx, maxy = im.width, im.height, 0, 0
    found = False
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] > 16:
                found = True
                minx = min(minx, x)
                miny = min(miny, y)
                maxx = max(maxx, x)
                maxy = max(maxy, y)
    if not found:
        return (0, 0, im.width - 1, im.height - 1)
    return (minx, miny, maxx, maxy)


def crop_content(im: Image.Image, pad: int = 4) -> Image.Image:
    minx, miny, maxx, maxy = content_bbox(im)
    minx = max(0, minx - pad)
    miny = max(0, miny - pad)
    maxx = min(im.width - 1, maxx + pad)
    maxy = min(im.height - 1, maxy + pad)
    return im.crop((minx, miny, maxx + 1, maxy + 1))


def recolor_opaque(im: Image.Image, rgba: tuple[int, int, int, int]) -> Image.Image:
    """Recolor all non-transparent pixels to a solid color (preserve alpha)."""
    px = im.load()
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out_px = out.load()
    rr, gg, bb, _ = rgba
    for y in range(im.height):
        for x in range(im.width):
            a = px[x, y][3]
            if a > 0:
                out_px[x, y] = (rr, gg, bb, a)
    return out


def fit_centered(mark: Image.Image, canvas: int, fill_ratio: float) -> Image.Image:
    target = int(canvas * fill_ratio)
    w, h = mark.size
    scale = min(target / w, target / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = mark.resize((nw, nh), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.paste(resized, ((canvas - nw) // 2, (canvas - nh) // 2), resized)
    return out


def composite_bg(fg: Image.Image, bg_rgba: tuple[int, int, int, int]) -> Image.Image:
    bg = Image.new("RGBA", fg.size, bg_rgba)
    bg.alpha_composite(fg)
    return bg


def save_webp(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGBA").save(path, "WEBP", quality=90, method=6)


def main() -> None:
    raw = load_source()
    transparent = knockout_black_bg(raw)
    cropped = crop_content(transparent)

    # In-app logo: transparent bg, brand navy ink (readable on light surfaces; tint works when inverted)
    logo_app = recolor_opaque(cropped, NAVY_BRAND)
    # Keep familiar footprint close to original aspect; pad to preserve BrandLogo aspect expectations.
    # Brand aspect constant is 546/457 — store cropped natural size and update constant if needed.
    logo_app.save(ASSETS / "logo.png")
    print(f"wrote logo.png {logo_app.size}")

    white_mark = recolor_opaque(cropped, (255, 255, 255, 255))

    # Full app icon (iOS / Expo icon): white mark on navy
    icon_fg = fit_centered(white_mark, 1024, 0.72)
    icon = composite_bg(icon_fg, BG)
    icon.save(ASSETS / "icon.png")
    print("wrote icon.png")

    # Adaptive foreground: transparent + safe-zone mark (~66%)
    adaptive_fg = fit_centered(white_mark, 1024, 0.56)
    adaptive_fg.save(ASSETS / "adaptive-icon.png")
    print("wrote adaptive-icon.png")

    # Splash: tall navy with centered white logo
    splash = Image.new("RGBA", (1284, 2778), BG)
    splash_mark = fit_centered(white_mark, 900, 0.85)
    splash.paste(splash_mark, ((1284 - 900) // 2, (2778 - 900) // 2), splash_mark)
    splash.save(ASSETS / "splash.png")
    print("wrote splash.png")

    fav = icon.resize((48, 48), Image.Resampling.LANCZOS)
    fav.save(ASSETS / "favicon.png")
    print("wrote favicon.png")

    # iOS App Icon
    ios_icon = ROOT / "ios/MadarERP/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png"
    if ios_icon.parent.is_dir():
        icon.save(ios_icon)
        print(f"wrote {ios_icon.relative_to(ROOT)}")

    # Android mipmaps
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    # Adaptive foreground base is 108dp; xxxhdpi = 432, mdpi = 108
    fg_densities = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }

    res = ROOT / "android/app/src/main/res"
    for folder, size in densities.items():
        d = res / folder
        if not d.is_dir():
            continue
        full = icon.resize((size, size), Image.Resampling.LANCZOS)
        save_webp(full, d / "ic_launcher.webp")
        save_webp(full, d / "ic_launcher_round.webp")
        print(f"wrote {folder}/ic_launcher*.webp @{size}")

    for folder, size in fg_densities.items():
        d = res / folder
        if not d.is_dir():
            continue
        fg = fit_centered(white_mark, size, 0.56)
        save_webp(fg, d / "ic_launcher_foreground.webp")
        print(f"wrote {folder}/ic_launcher_foreground.webp @{size}")

    # Android splash logos
    splash_sizes = {
        "drawable-mdpi": 160,
        "drawable-hdpi": 240,
        "drawable-xhdpi": 320,
        "drawable-xxhdpi": 480,
        "drawable-xxxhdpi": 640,
    }
    for folder, size in splash_sizes.items():
        d = res / folder
        if not d.is_dir():
            continue
        mark = fit_centered(white_mark, size, 0.9)
        # splash logo usually on colored window background — keep transparent PNG
        mark.save(d / "splashscreen_logo.png")
        print(f"wrote {folder}/splashscreen_logo.png @{size}")

    # Update BrandLogo aspect constant helper print
    w, h = logo_app.size
    print(f"BRAND_LOGO_ASPECT ≈ {w / h:.6f}  ({w}×{h})")


if __name__ == "__main__":
    main()
