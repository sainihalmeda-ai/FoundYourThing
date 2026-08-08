"""Build Expo icon set from the Figma FYT lettermark export."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets"
SRC = ROOT / "_figma" / "fyt-icon.png"
# Fallback solid if export missing — brand navy from Figma gradient end
FALLBACK_BLUE = (9, 18, 44, 255)


def cover(im: Image.Image, size: int) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    scale = max(size / w, size / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - size) // 2
    top = (nh - size) // 2
    return im.crop((left, top, left + size, top + size))


def main() -> None:
    if SRC.exists():
        base = Image.open(SRC)
    else:
        raise SystemExit(f"Missing Figma export: {SRC}")

    icon = cover(base, 1024)
    icon.save(ROOT / "icon.png", optimize=True)

    splash = cover(base, 512)
    splash.save(ROOT / "splash-icon.png", optimize=True)

    fav = cover(base, 192)
    fav.save(ROOT / "favicon.png", optimize=True)

    # Adaptive: solid navy background + FYT artwork (safe-zone padded)
    bg = Image.new("RGBA", (1024, 1024), FALLBACK_BLUE)
    # Sample corner of source for closer bg match
    sample = cover(base, 64).resize((1, 1), Image.Resampling.BOX).getpixel((0, 0))
    bg = Image.new("RGBA", (1024, 1024), sample)
    bg.save(ROOT / "android-icon-background.png", optimize=True)

    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    artwork = cover(base, 720)
    ox = (1024 - 720) // 2
    oy = (1024 - 720) // 2
    fg.paste(artwork, (ox, oy), artwork)
    fg.save(ROOT / "android-icon-foreground.png", optimize=True)

    # Monochrome: luminance of white letters
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    gray = artwork.convert("L")
    alpha = gray.point(lambda p: 255 if p > 180 else 0)
    white = Image.new("RGBA", artwork.size, (255, 255, 255, 255))
    white.putalpha(alpha)
    mono.paste(white, (ox, oy), white)
    mono.save(ROOT / "android-icon-monochrome.png", optimize=True)

    for path in sorted(ROOT.glob("*.png")):
        print(f"{path.name}: {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
