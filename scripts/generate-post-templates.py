#!/usr/bin/env python3
"""Generate DAR AL TAWHID Bild-Beitrag template backgrounds (1080 x 1350)."""
from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1350
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "post-templates")


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def gradient(img: Image.Image, top: tuple, bottom: tuple) -> None:
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        row = tuple(lerp(top[i], bottom[i], t) for i in range(3))
        for x in range(W):
            px[x, y] = row


def radial_glow(base: Image.Image, cx: int, cy: int, radius: int, color: tuple, alpha: int) -> None:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for r in range(radius, 0, -8):
        a = int(alpha * (1 - r / radius) ** 1.6)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*color, max(0, a)))
    base.alpha_composite(layer)


def gold_frame(d: ImageDraw.ImageDraw, inset: int = 42, width: int = 3) -> None:
    gold = (212, 181, 106)
    pale = (239, 215, 142)
    for i, col in enumerate((gold, pale, gold)):
        off = inset + i * 5
        d.rounded_rectangle((off, off, W - off, H - off), radius=28, outline=col, width=width)


def corner_ornaments(d: ImageDraw.ImageDraw, color: tuple) -> None:
    m = 56
    s = 88
    corners = (
        (m, m, m + s, m + s),
        (W - m - s, m, W - m, m + s),
        (m, H - m - s, m + s, H - m),
        (W - m - s, H - m - s, W - m, H - m),
    )
    for x1, y1, x2, y2 in corners:
        d.arc((x1, y1, x2, y2), 0, 90, fill=color, width=4)
    for x0, y0, sx, sy in ((m, m, 1, 1), (W - m, m, -1, 1), (m, H - m, 1, -1), (W - m, H - m, -1, -1)):
        d.line((x0, y0 + sy * 18, x0 + sx * 52, y0 + sy * 18), fill=color, width=3)
        d.line((x0 + sx * 18, y0, x0 + sx * 18, y0 + sy * 52), fill=color, width=3)


def book_spines(d: ImageDraw.ImageDraw, y0: int, palette: list[tuple]) -> None:
    x = 70
    while x < W - 70:
        bw = 34 + (x // 17) % 22
        bh = 220 + (x // 23) % 90
        col = palette[(x // 41) % len(palette)]
        d.rounded_rectangle((x, y0 - bh, x + bw, y0), radius=6, fill=col, outline=(212, 181, 106), width=2)
        d.line((x + bw * 0.55, y0 - bh + 16, x + bw * 0.55, y0 - 18), fill=(255, 255, 255, 40), width=2)
        x += bw + 10


def leaf_motif(d: ImageDraw.ImageDraw, cx: int, cy: int, scale: float, color: tuple) -> None:
    for angle in (-35, 0, 35):
        rad = math.radians(angle)
        lx = cx + math.cos(rad) * 80 * scale
        ly = cy + math.sin(rad) * 40 * scale
        d.ellipse((lx - 55 * scale, ly - 22 * scale, lx + 55 * scale, ly + 22 * scale), fill=color)
    d.ellipse((cx - 12 * scale, cy - 18 * scale, cx + 12 * scale, cy + 18 * scale), fill=color)


def arch_motif(d: ImageDraw.ImageDraw, color: tuple) -> None:
    d.pieslice((240, -120, 840, 420), 20, 160, fill=color)
    d.rectangle((240, 180, 840, 320), fill=color)


def center_panel(base: Image.Image, fill: tuple, alpha: int = 38) -> None:
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((118, 210, 962, 1080), radius=36, fill=(*fill, alpha))
    base.alpha_composite(layer)


def brand_mark(d: ImageDraw.ImageDraw) -> None:
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 28)
        small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
        small = font
    d.text((W // 2, 118), "DAR AL TAWḤID", fill=(212, 181, 106), font=font, anchor="mm")
    d.text((W // 2, 152), "Beitrag teilen", fill=(239, 215, 142), font=small, anchor="mm")


def save_template(name: str, img: Image.Image) -> None:
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f"{name}.jpg")
    rgb = img.convert("RGB")
    rgb.save(path, "JPEG", quality=92, optimize=True)
    print("wrote", path, rgb.size)


def build_bibliothek_braun() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (92, 58, 34), (48, 30, 18))
    radial_glow(img, W // 2, 520, 520, (180, 130, 70), 70)
    center_panel(img, (255, 236, 205), 34)
    d = ImageDraw.Draw(img)
    gold_frame(d)
    corner_ornaments(d, (212, 181, 106))
    book_spines(d, H - 110, [(120, 74, 44), (88, 54, 32), (150, 96, 58), (102, 66, 38)])
    brand_mark(d)
    return img


def build_gruen_moschee() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (28, 68, 52), (12, 36, 28))
    radial_glow(img, W // 2, 280, 360, (80, 150, 110), 55)
    center_panel(img, (220, 245, 230), 30)
    d = ImageDraw.Draw(img)
    arch_motif(d, (22, 58, 44))
    gold_frame(d)
    corner_ornaments(d, (212, 181, 106))
    brand_mark(d)
    return img


def build_nachtblau_buecher() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (16, 36, 62), (6, 14, 28))
    radial_glow(img, W // 2, 500, 480, (60, 110, 170), 65)
    center_panel(img, (210, 228, 248), 28)
    d = ImageDraw.Draw(img)
    gold_frame(d)
    corner_ornaments(d, (180, 200, 230))
    book_spines(d, H - 96, [(24, 48, 82), (18, 36, 64), (32, 58, 92), (20, 40, 70)])
    brand_mark(d)
    return img


def build_sanft_rose() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (168, 112, 108), (118, 72, 74))
    radial_glow(img, W // 2, 460, 420, (230, 180, 176), 60)
    center_panel(img, (255, 236, 232), 36)
    d = ImageDraw.Draw(img)
    gold_frame(d)
    corner_ornaments(d, (212, 181, 106))
    brand_mark(d)
    return img


def build_schwarz_buecher() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (28, 24, 20), (8, 7, 6))
    radial_glow(img, W // 2, 520, 500, (90, 78, 58), 45)
    center_panel(img, (240, 228, 205), 26)
    d = ImageDraw.Draw(img)
    gold_frame(d, inset=36, width=4)
    corner_ornaments(d, (212, 181, 106))
    book_spines(d, H - 100, [(36, 32, 28), (52, 44, 36), (28, 24, 20), (44, 38, 30)])
    brand_mark(d)
    return img


def build_bordeaux() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (96, 24, 28), (52, 10, 14))
    radial_glow(img, W // 2, 480, 460, (160, 60, 68), 58)
    center_panel(img, (255, 228, 220), 32)
    d = ImageDraw.Draw(img)
    gold_frame(d)
    corner_ornaments(d, (212, 181, 106))
    brand_mark(d)
    return img


def build_petrol_pflanze() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (18, 68, 66), (8, 38, 40))
    radial_glow(img, W // 2, 500, 440, (70, 150, 140), 55)
    center_panel(img, (220, 245, 240), 30)
    d = ImageDraw.Draw(img)
    leaf_motif(d, 180, H - 180, 1.1, (28, 92, 88))
    leaf_motif(d, W - 180, H - 210, 1.0, (24, 82, 78))
    gold_frame(d)
    corner_ornaments(d, (212, 181, 106))
    brand_mark(d)
    return img


def build_olive_pflanze() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (74, 82, 44), (42, 48, 24))
    radial_glow(img, W // 2, 500, 430, (130, 150, 80), 52)
    center_panel(img, (236, 242, 214), 32)
    d = ImageDraw.Draw(img)
    leaf_motif(d, 200, H - 190, 1.0, (88, 102, 52))
    leaf_motif(d, W - 200, H - 200, 0.95, (78, 92, 46))
    gold_frame(d)
    corner_ornaments(d, (212, 181, 106))
    brand_mark(d)
    return img


def build_royal_blau() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (18, 44, 88), (8, 20, 46))
    radial_glow(img, W // 2, 420, 400, (70, 120, 200), 62)
    center_panel(img, (220, 232, 252), 30)
    d = ImageDraw.Draw(img)
    d.ellipse((W // 2 - 90, 190, W // 2 + 90, 370), outline=(212, 181, 106), width=4)
    d.ellipse((W // 2 - 58, 228, W // 2 + 58, 344), outline=(239, 215, 142), width=2)
    gold_frame(d)
    corner_ornaments(d, (180, 210, 245))
    brand_mark(d)
    return img


def build_sand_buecher() -> Image.Image:
    img = Image.new("RGBA", (W, H))
    gradient(img, (214, 188, 148), (176, 146, 108))
    radial_glow(img, W // 2, 500, 460, (240, 220, 180), 50)
    center_panel(img, (255, 248, 232), 40)
    d = ImageDraw.Draw(img)
    gold_frame(d)
    corner_ornaments(d, (30, 90, 86))
    book_spines(d, H - 104, [(36, 92, 88), (52, 108, 102), (28, 78, 74), (44, 98, 92)])
    brand_mark(d)
    return img


TEMPLATES = [
    ("bibliothek-braun", build_bibliothek_braun),
    ("gruen-moschee", build_gruen_moschee),
    ("nachtblau-buecher", build_nachtblau_buecher),
    ("sanft-rose", build_sanft_rose),
    ("schwarz-buecher", build_schwarz_buecher),
    ("bordeaux", build_bordeaux),
    ("petrol-pflanze", build_petrol_pflanze),
    ("olive-pflanze", build_olive_pflanze),
    ("royal-blau", build_royal_blau),
    ("sand-buecher", build_sand_buecher),
]


def main() -> None:
    for name, builder in TEMPLATES:
        img = builder()
        img = img.filter(ImageFilter.GaussianBlur(radius=0.4))
        save_template(name, img)


if __name__ == "__main__":
    main()
