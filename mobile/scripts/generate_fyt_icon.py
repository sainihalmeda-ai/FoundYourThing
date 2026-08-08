"""Generate FYT app icons: white letters on brand navy blue."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "assets"
BLUE = (16, 42, 86, 255)  # #102A56
WHITE = (255, 255, 255, 255)

FONT_CANDIDATES = [
    Path(r"C:\Windows\Fonts\arialbd.ttf"),
    Path(r"C:\Windows\Fonts\segoeuib.ttf"),
    Path(r"C:\Windows\Fonts\calibrib.ttf"),
    Path(r"C:\Windows\Fonts\verdanab.ttf"),
    Path(r"C:\Windows\Fonts\arial.ttf"),
]


def font_path() -> Path | None:
    for path in FONT_CANDIDATES:
        if path.exists():
            return path
    return None


FONT_FILE = font_path()


def load_font(size: int) -> ImageFont.ImageFont:
    if FONT_FILE:
        return ImageFont.truetype(str(FONT_FILE), size=size)
    return ImageFont.load_default()


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_w: int, max_h: int) -> ImageFont.ImageFont:
    size = 520
    while size > 40:
        font = load_font(size)
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        if w <= max_w and h <= max_h:
            return font
        size -= 8
    return load_font(40)


def draw_fyt(img: Image.Image, text: str = "FYT", fill=WHITE, max_frac: float = 0.72) -> None:
    draw = ImageDraw.Draw(img)
    max_w = int(img.width * max_frac)
    max_h = int(img.height * max_frac)
    font = fit_font(draw, text, max_w, max_h)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (img.width - tw) / 2 - bbox[0]
    y = (img.height - th) / 2 - bbox[1] - img.height * 0.02
    draw.text((x, y), text, font=font, fill=fill)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    print("font:", FONT_FILE)

    icon = Image.new("RGBA", (1024, 1024), BLUE)
    draw_fyt(icon)
    icon.save(OUT / "icon.png", optimize=True)

    splash = Image.new("RGBA", (512, 512), BLUE)
    draw_fyt(splash)
    splash.save(OUT / "splash-icon.png", optimize=True)

    fav = Image.new("RGBA", (192, 192), BLUE)
    draw_fyt(fav)
    fav.save(OUT / "favicon.png", optimize=True)

    bg = Image.new("RGBA", (1024, 1024), BLUE)
    bg.save(OUT / "android-icon-background.png", optimize=True)

    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_fyt(fg, max_frac=0.55)
    fg.save(OUT / "android-icon-foreground.png", optimize=True)

    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw_fyt(mono, max_frac=0.55)
    mono.save(OUT / "android-icon-monochrome.png", optimize=True)

    for path in sorted(OUT.glob("*.png")):
        print(f"{path.name}: {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
