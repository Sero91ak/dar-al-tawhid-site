#!/usr/bin/env python3
"""Strict app-icon rebuild: 12.5% safe inset, smaller Arabic, larger Latin, no edge hug."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

WEB_ROOT = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/assets/app-icons")
IOS_ASSETS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/Assets.xcassets")
IOS_PNGS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/AppIcons")
MASTERS = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/scripts/icon-masters")
FONT = "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf"
WEB_SIZES = (1024, 512, 192, 180, 64, 32)
IOS_EXPORTS = {
    "@2x.png": 120,
    "@3x.png": 180,
    "@2x~ipad.png": 152,
    "-83.5@2x~ipad.png": 167,
    ".png": 60,
}

CANVAS = 1024
INSET = 136
MAX_W = 640
MAX_W_MODERN = 600
DAR = "DĀR AL"
TAWHID = "TAWḤĪD"
FULL = "DĀR AL TAWḤĪD"

CLASSICS = {
    "creme-navy": ("AppIcon", (246, 240, 228), (18, 32, 56), (18, 32, 56), None),
    "minimal-creme": ("AppIconMinimalCreme", (255, 255, 255), (18, 32, 56), (18, 32, 56), None),
    "graphit-silber": ("AppIconGraphitSilber", (38, 42, 48), (236, 232, 224), (196, 164, 92), None),
    "schwarz-gold": ("AppIconSchwarzGold", (10, 10, 12), (212, 175, 55), (212, 175, 55), None),
    "stein-optik": ("AppIconSteinOptik", None, (22, 18, 14), (22, 18, 14), "stein-optik.png"),
    "tiefes-gruen": ("AppIconTiefesGruen", (18, 48, 36), (246, 240, 228), (212, 175, 55), None),
    "bordeaux": ("AppIconBordeaux", (88, 22, 32), (246, 240, 228), (212, 175, 55), None),
    "elfenbein": ("AppIconElfenbein", (250, 246, 236), (22, 20, 16), (22, 20, 16), None),
    "mitternacht-blau": ("AppIconMitternachtBlau", (12, 22, 48), (246, 240, 228), (212, 175, 55), None),
}

MODERN = {
    "modern-name-focus-dark": ("AppIconModernNameFocusDark", (16, 16, 18), (248, 246, 240), (248, 246, 240)),
    "modern-name-focus-light": ("AppIconModernNameFocusLight", (255, 255, 255), (18, 18, 20), (18, 18, 20)),
    "modern-elegant-neutral": ("AppIconModernElegantNeutral", (232, 220, 204), (22, 18, 14), (22, 18, 14)),
    "modern-premium-gold-dark": ("AppIconModernPremiumGoldDark", (12, 12, 14), (212, 175, 55), (212, 175, 55)),
}

CONTENTS = """{
  "images": [
    {"filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"},
    {"appearances": [{"appearance": "luminosity", "value": "dark"}], "filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}
  ],
  "info": {"author": "xcode", "version": 1}
}
"""


def tracked_width(font, text, tracking):
    w = 0.0
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        w += bbox[2] - bbox[0]
        if i < len(text) - 1:
            w += tracking * font.size
    return w


def fit_font(text, start, tracking, max_w):
    size = start
    while size >= 28:
        fnt = ImageFont.truetype(FONT, size)
        if tracked_width(fnt, text, tracking) <= max_w:
            return fnt
        size -= 2
    return ImageFont.truetype(FONT, 28)


def draw_tracked(draw, text, font, fill, cx, baseline, tracking):
    x = cx - tracked_width(font, text, tracking) / 2
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        draw.text((x - bbox[0], baseline), ch, font=font, fill=fill, anchor="ls")
        x += (bbox[2] - bbox[0]) + (tracking * font.size if i < len(text) - 1 else 0)


def save_all(master: Image.Image, web_id: str, ios_name: str):
    dest = WEB_ROOT / web_id
    dest.mkdir(parents=True, exist_ok=True)
    master = master.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    for side in WEB_SIZES:
        master.resize((side, side), Image.Resampling.LANCZOS).save(dest / f"icon-{side}.png", "PNG")
    catalog = IOS_ASSETS / f"{ios_name}.appiconset"
    catalog.mkdir(parents=True, exist_ok=True)
    master.save(catalog / "AppIcon-1024.png", "PNG")
    (catalog / "Contents.json").write_text(CONTENTS, encoding="utf-8")
    IOS_PNGS.mkdir(parents=True, exist_ok=True)
    for suffix, side in IOS_EXPORTS.items():
        master.resize((side, side), Image.Resampling.LANCZOS).save(IOS_PNGS / f"{ios_name}{suffix}", "PNG")


def extract_arabic(src: Image.Image) -> tuple[Image.Image, Image.Image]:
    arr = np.array(src.convert("RGB"))
    bg = np.median(np.concatenate([
        arr[0:20, 0:20].reshape(-1, 3),
        arr[0:20, -20:].reshape(-1, 3),
        arr[-20:, 0:20].reshape(-1, 3),
        arr[-20:, -20:].reshape(-1, 3),
    ]), axis=0)
    dist = np.linalg.norm(arr.astype(np.float32) - bg, axis=2)
    ink = dist > 28
    rows = np.where(ink.any(axis=1))[0]
    cols = np.where(ink.any(axis=0))[0]
    y0, y1 = max(0, int(rows[0]) - 8), min(arr.shape[0], int(rows[-1]) + 8)
    x0, x1 = max(0, int(cols[0]) - 12), min(arr.shape[1], int(cols[-1]) + 12)
    cut = y0 + int((y1 - y0) * 0.64)
    crop = arr[y0:cut, x0:x1].copy()
    cdist = np.linalg.norm(crop.astype(np.float32) - bg, axis=2)
    mask = (cdist > 22).astype(np.uint8) * 255
    rgb = Image.fromarray(crop.astype(np.uint8))
    alpha = Image.fromarray(mask).filter(ImageFilter.MaxFilter(3))
    return rgb, alpha


def fit_pair(rgb: Image.Image, alpha: Image.Image, max_w: int, max_h: int) -> tuple[Image.Image, Image.Image]:
    w, h = rgb.size
    scale = min(max_w / w, max_h / h, 1.0)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    return (
        rgb.resize((nw, nh), Image.Resampling.LANCZOS),
        alpha.resize((nw, nh), Image.Resampling.LANCZOS),
    )


def colorize(rgb: Image.Image, alpha: Image.Image, color: tuple[int, int, int]) -> Image.Image:
    layer = Image.new("RGBA", rgb.size, (*color, 0))
    layer.putalpha(alpha)
    return layer


def stone_background() -> Image.Image:
    rng = np.random.default_rng(11)
    n = rng.integers(-9, 10, (CANVAS, CANVAS), dtype=np.int16)
    r = np.clip(142 + n, 0, 255).astype(np.uint8)
    g = np.clip(132 + n, 0, 255).astype(np.uint8)
    b = np.clip(118 + n, 0, 255).astype(np.uint8)
    arr = np.dstack([r, g, b])
    return Image.fromarray(arr).filter(ImageFilter.GaussianBlur(0.6))


def render_classic(bg, ar_c, la_c, tex_name, arabic_rgb, arabic_a) -> Image.Image:
    if tex_name:
        canvas = stone_background().convert("RGBA")
    else:
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (*bg, 255))
    glyph_rgb, glyph_a = fit_pair(arabic_rgb, arabic_a, MAX_W, 250)
    arabic = colorize(glyph_rgb, glyph_a, ar_c)
    ax = (CANVAS - arabic.size[0]) // 2
    band_top = INSET + 8
    band_h = int((CANVAS - 2 * INSET) * 0.50)
    ay = band_top + max(0, (band_h - arabic.size[1]) // 2)
    canvas.alpha_composite(arabic, (ax, ay))
    draw = ImageDraw.Draw(canvas)
    l1 = fit_font(DAR, 64, 0.08, MAX_W)
    l2 = fit_font(TAWHID, 100, 0.03, MAX_W)
    latin_base = INSET + int((CANVAS - 2 * INSET) * 0.66)
    draw_tracked(draw, DAR, l1, la_c, 512, latin_base, 0.08)
    draw_tracked(draw, TAWHID, l2, la_c, 512, latin_base + 86, 0.03)
    return canvas.convert("RGB")


def render_modern(bg, top, main) -> Image.Image:
    img = Image.new("RGB", (CANVAS, CANVAS), bg)
    draw = ImageDraw.Draw(img)
    l1 = fit_font(DAR, 72, 0.08, MAX_W_MODERN)
    l2 = fit_font(TAWHID, 108, 0.02, MAX_W_MODERN)
    draw_tracked(draw, DAR, l1, top, 512, 455, 0.08)
    draw_tracked(draw, TAWHID, l2, main, 512, 605, 0.02)
    return img


def classic_arabic_source() -> Image.Image:
    import io
    import subprocess
    repo = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site")
    blob = subprocess.check_output(
        ["git", "-C", str(repo), "show", "0b0692125:assets/app-icons/creme-navy/icon-1024.png"]
    )
    return Image.open(io.BytesIO(blob)).convert("RGB")


def main():
    if "Ā" not in FULL or "Ḥ" not in FULL or "Ī" not in FULL:
        raise SystemExit("spelling")
    src = classic_arabic_source()
    arabic_rgb, arabic_a = extract_arabic(src)
    for folder, (ios_name, bg, ar, la, tex) in CLASSICS.items():
        master = render_classic(bg, ar, la, tex, arabic_rgb, arabic_a)
        save_all(master, folder, ios_name)
        master.resize((180, 180), Image.Resampling.LANCZOS).save(f"/tmp/qa-classic-{folder}-180.png")
    for folder, (ios_name, bg, top, main) in MODERN.items():
        master = render_modern(bg, top, main)
        save_all(master, folder, ios_name)
        master.resize((180, 180), Image.Resampling.LANCZOS).save(f"/tmp/qa-modern-{folder}-180.png")
    print("icons rebuilt")


if __name__ == "__main__":
    main()
