#!/usr/bin/env python3
"""Generate DAR AL TAWḤĪD app icons with exact Arabic/Latin lettering."""
from __future__ import annotations

import json
import os
import random
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AR = get_display(arabic_reshaper.reshape("التوحيد"))
LA = "DĀR AL-TAWḤĪD"

ROOT = Path(__file__).resolve().parents[1]
WEB_DIR = ROOT / "test" / "app-icons"
IOS_ASSETS = ROOT / "ios" / "DarAlTawhid" / "DarAlTawhid" / "Assets.xcassets"
IOS_LOOSE = ROOT / "ios" / "DarAlTawhid" / "DarAlTawhid" / "AppIcons"

WEB_SIZES = (1024, 512, 192, 180, 64, 32)
IOS_LOOSE_SIZES = {
    "@2x.png": 120,
    "@3x.png": 180,
    "@2x~ipad.png": 152,
    "-83.5@2x~ipad.png": 167,
}

AR_FONTS = [
    "/System/Library/Fonts/SFArabic.ttf",
    "/System/Library/Fonts/GeezaPro.ttc",
]
LA_FONTS = [
    "/System/Library/Fonts/NewYork.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman.ttf",
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
]


def load_font(paths, size: int) -> ImageFont.FreeTypeFont:
    for path in paths:
        if not os.path.exists(path):
            continue
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            try:
                return ImageFont.truetype(path, size=size, index=0)
            except OSError:
                continue
    raise FileNotFoundError(paths)


VARIANTS = [
    {
        "id": "creme-navy",
        "label": "Creme & Navy",
        "ios": "AppIcon",
        "primary": True,
        "bg": (245, 236, 220),
        "fg": (18, 42, 74),
        "accent": (18, 42, 74),
        "texture": None,
    },
    {
        "id": "minimal-creme",
        "label": "Minimal Creme",
        "ios": "AppIconMinimalCreme",
        "primary": False,
        "bg": (250, 245, 235),
        "fg": (36, 48, 62),
        "accent": (196, 176, 148),
        "texture": None,
    },
    {
        "id": "graphit-silber",
        "label": "Graphit Silber",
        "ios": "AppIconGraphitSilber",
        "primary": False,
        "bg": (42, 46, 51),
        "fg": (214, 220, 226),
        "accent": (168, 176, 184),
        "texture": "fine",
    },
    {
        "id": "schwarz-gold",
        "label": "Schwarz & Gold",
        "ios": "AppIconSchwarzGold",
        "primary": False,
        "bg": (10, 10, 10),
        "fg": (212, 175, 55),
        "accent": (184, 148, 48),
        "texture": None,
    },
    {
        "id": "stein-optik",
        "label": "Stein Optik",
        "ios": "AppIconSteinOptik",
        "primary": False,
        "bg": (132, 124, 112),
        "fg": (245, 240, 230),
        "accent": (92, 86, 76),
        "texture": "stone",
    },
    {
        "id": "tiefes-gruen",
        "label": "Tiefes Grün",
        "ios": "AppIconTiefesGruen",
        "primary": False,
        "bg": (12, 48, 38),
        "fg": (236, 226, 198),
        "accent": (176, 150, 82),
        "texture": None,
    },
    {
        "id": "bordeaux",
        "label": "Bordeaux",
        "ios": "AppIconBordeaux",
        "primary": False,
        "bg": (74, 18, 28),
        "fg": (242, 228, 204),
        "accent": (196, 154, 86),
        "texture": None,
    },
    {
        "id": "elfenbein",
        "label": "Elfenbein",
        "ios": "AppIconElfenbein",
        "primary": False,
        "bg": (255, 251, 240),
        "fg": (62, 48, 32),
        "accent": (176, 148, 98),
        "texture": None,
    },
    {
        "id": "mitternacht-blau",
        "label": "Mitternacht Blau",
        "ios": "AppIconMitternachtBlau",
        "primary": False,
        "bg": (8, 18, 42),
        "fg": (230, 214, 168),
        "accent": (168, 188, 220),
        "texture": None,
    },
]


def hex_tuple(c):
    return tuple(int(x) for x in c)


def apply_texture(img: Image.Image, kind: str | None) -> Image.Image:
    if not kind:
        return img
    px = img.load()
    w, h = img.size
    rng = random.Random(7 if kind == "stone" else 3)
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y][:3]
            if kind == "stone":
                n = rng.randint(-18, 18)
                grain = int(6 * ((x * 13 + y * 7) % 5 - 2))
                n = n + grain
            else:
                n = rng.randint(-8, 8)
            px[x, y] = (
                max(0, min(255, r + n)),
                max(0, min(255, g + n)),
                max(0, min(255, b + n)),
                255,
            )
    if kind == "stone":
        img = img.filter(ImageFilter.SMOOTH)
    return img


def fit_text(draw, text, fonts, start, min_size, max_width):
    size = start
    while size >= min_size:
        font = load_font(fonts, size)
        bbox = draw.textbbox((0, 0), text, font=font, anchor="lt")
        if bbox[2] - bbox[0] <= max_width:
            return font, bbox
        size -= 4
    font = load_font(fonts, min_size)
    return font, draw.textbbox((0, 0), text, font=font, anchor="lt")


def render_master(variant: dict, size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), (*variant["bg"], 255))
    img = apply_texture(img, variant.get("texture"))
    draw = ImageDraw.Draw(img)
    pad = int(size * 0.09)
    stroke = max(2, int(size * 0.008))
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=int(size * 0.06),
        outline=(*variant["accent"], 255),
        width=stroke,
    )
    max_w = size - int(size * 0.22)
    ar_font, ar_bb = fit_text(draw, AR, AR_FONTS, int(size * 0.195), int(size * 0.11), max_w)
    la_font, la_bb = fit_text(draw, LA, LA_FONTS, int(size * 0.062), int(size * 0.034), max_w)
    ar_h = ar_bb[3] - ar_bb[1]
    la_h = la_bb[3] - la_bb[1]
    gap = int(size * 0.045)
    total = ar_h + gap + la_h
    top = (size - total) // 2 - int(size * 0.01)
    cx = size / 2
    draw.text((cx, top + ar_h * 0.52), AR, font=ar_font, fill=(*variant["fg"], 255), anchor="mm")
    draw.text((cx, top + ar_h + gap + la_h * 0.45), LA, font=la_font, fill=(*variant["fg"], 255), anchor="mm")
    return img.convert("RGB")


def write_png(img: Image.Image, path: Path, size: int):
    path.parent.mkdir(parents=True, exist_ok=True)
    out = img.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, format="PNG", optimize=True)


def write_appiconset(name: str, src: Image.Image):
    folder = IOS_ASSETS / f"{name}.appiconset"
    folder.mkdir(parents=True, exist_ok=True)
    write_png(src, folder / "AppIcon-1024.png", 1024)
    (folder / "Contents.json").write_text(
        json.dumps(
            {
                "images": [
                    {
                        "filename": "AppIcon-1024.png",
                        "idiom": "universal",
                        "platform": "ios",
                        "size": "1024x1024",
                    }
                ],
                "info": {"author": "xcode", "version": 1},
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def main():
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    IOS_LOOSE.mkdir(parents=True, exist_ok=True)
    # Remove previous alternate loose icons.
    for old in IOS_LOOSE.glob("AppIcon*.png"):
        old.unlink()

    catalog = []
    for variant in VARIANTS:
        master = render_master(variant)
        dest = WEB_DIR / variant["id"]
        dest.mkdir(parents=True, exist_ok=True)
        for size in WEB_SIZES:
            write_png(master, dest / f"icon-{size}.png", size)
        write_appiconset(variant["ios"], master)
        if not variant["primary"]:
            for suffix, px in IOS_LOOSE_SIZES.items():
                write_png(master, IOS_LOOSE / f"{variant['ios']}{suffix}", px)
        catalog.append(
            {
                "id": variant["id"],
                "label": variant["label"],
                "ios": None if variant["primary"] else variant["ios"],
                "primary": variant["primary"],
                "preview": f"/test/app-icons/{variant['id']}/icon-192.png",
            }
        )
        print("wrote", variant["id"], variant["ios"])

    (WEB_DIR / "catalog.json").write_text(
        json.dumps({"key": "darAppIconV1", "default": "creme-navy", "icons": catalog}, indent=2, ensure_ascii=False)
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
