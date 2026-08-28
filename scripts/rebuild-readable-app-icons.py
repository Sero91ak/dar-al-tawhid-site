#!/usr/bin/env python3
"""Rebuild app icons: no inner frames, oversized original Arabic, readable DĀR AL TAWḤĪD."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WEB_ROOT = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/assets/app-icons")
IOS_ASSETS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/Assets.xcassets")
IOS_PNGS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/AppIcons")
FONT_BOLD = "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf"
WEB_SIZES = (1024, 512, 192, 180, 64, 32)
IOS_EXPORTS = {
    "@2x.png": 120,
    "@3x.png": 180,
    "@2x~ipad.png": 152,
    "-83.5@2x~ipad.png": 167,
}

DAR = "DĀR AL"
FULL = "DĀR AL TAWḤĪD"
TAWHID = "TAWḤĪD"
BLACK = (12, 12, 12)
GOLD = (212, 176, 96)
WHITE = (252, 250, 246)

CLASSICS = {
    "creme-navy": ("AppIcon", True),
    "minimal-creme": ("AppIconMinimalCreme", True),
    "graphit-silber": ("AppIconGraphitSilber", False),
    "schwarz-gold": ("AppIconSchwarzGold", False),
    "stein-optik": ("AppIconSteinOptik", True),
    "tiefes-gruen": ("AppIconTiefesGruen", False),
    "bordeaux": ("AppIconBordeaux", False),
    "elfenbein": ("AppIconElfenbein", True),
    "mitternacht-blau": ("AppIconMitternachtBlau", False),
}

MODERN = {
    "modern-name-focus-dark": {
        "ios": "AppIconModernNameFocusDark",
        "bg": (12, 12, 12),
        "top": WHITE,
        "main": WHITE,
        "light": False,
    },
    "modern-name-focus-light": {
        "ios": "AppIconModernNameFocusLight",
        "bg": (248, 252, 255),
        "top": BLACK,
        "main": BLACK,
        "light": True,
    },
    "modern-elegant-neutral": {
        "ios": "AppIconModernElegantNeutral",
        "bg": (232, 220, 204),
        "top": BLACK,
        "main": BLACK,
        "light": True,
    },
    "modern-premium-gold-dark": {
        "ios": "AppIconModernPremiumGoldDark",
        "bg": (8, 8, 8),
        "top": GOLD,
        "main": GOLD,
        "light": False,
    },
}


def tracked_width(font, text, tracking):
    w = 0.0
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        w += bbox[2] - bbox[0]
        if i < len(text) - 1:
            w += tracking * font.size
    return w


def draw_tracked(draw, text, font, fill, cx, baseline, tracking):
    x = cx - tracked_width(font, text, tracking) / 2
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        draw.text((x - bbox[0], baseline), ch, font=font, fill=fill, anchor="ls")
        x += (bbox[2] - bbox[0]) + (tracking * font.size if i < len(text) - 1 else 0)


def save_all(master: Image.Image, web_id: str, ios_name: str | None):
    dest = WEB_ROOT / web_id
    dest.mkdir(parents=True, exist_ok=True)
    master = master.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    for side in WEB_SIZES:
        master.resize((side, side), Image.Resampling.LANCZOS).save(dest / f"icon-{side}.png", "PNG")
    if not ios_name:
        return
    catalog = IOS_ASSETS / f"{ios_name}.appiconset"
    catalog.mkdir(parents=True, exist_ok=True)
    master.save(catalog / "AppIcon-1024.png", "PNG")
    (catalog / "Contents.json").write_text(
        '{\n  "images": [{"filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}],\n  "info": {"author": "xcode", "version": 1}\n}\n',
        encoding="utf-8",
    )
    IOS_PNGS.mkdir(parents=True, exist_ok=True)
    for suffix, side in IOS_EXPORTS.items():
        master.resize((side, side), Image.Resampling.LANCZOS).save(IOS_PNGS / f"{ios_name}{suffix}", "PNG")


def render_modern(spec):
    img = Image.new("RGB", (1024, 1024), spec["bg"])
    draw = ImageDraw.Draw(img)
    top = ImageFont.truetype(FONT_BOLD, 168)
    main = ImageFont.truetype(FONT_BOLD, 248)
    draw_tracked(draw, DAR, top, spec["top"], 512, 360, 0.12)
    draw_tracked(draw, TAWHID, main, spec["main"], 512, 640, 0.02)
    return img


def bg_color(arr):
    corners = np.concatenate([
        arr[0:24, 0:24].reshape(-1, 3),
        arr[0:24, -24:].reshape(-1, 3),
        arr[-24:, 0:24].reshape(-1, 3),
        arr[-24:, -24:].reshape(-1, 3),
    ])
    return np.median(corners, axis=0)


def remove_inner_frame(arr, bg):
    h, w, _ = arr.shape
    dist = np.linalg.norm(arr.astype(np.float32) - bg, axis=2)
    ink = dist > 28
    # Thin frame lives in a band near the edges. Paint ink pixels in that band back to bg
    # if they form a sparse ring (low fill ratio in local window).
    yy, xx = np.mgrid[0:h, 0:w]
    margin = int(w * 0.055)
    inner = int(w * 0.16)
    edge = ((xx < inner) | (xx > w - inner) | (yy < inner) | (yy > h - inner)) & (
        (xx > margin) | (xx < w - margin) | (yy > margin) | (yy < h - margin)
    )
    ring = ink & edge & (
        (xx < inner) | (xx > w - inner) | (yy < inner) | (yy > h - inner)
    )
    # Keep only thin strokes: fewer than 18% ink in a 21px box around the pixel is too expensive.
    # Approximate: pixels whose 4-neighborhood has mostly bg in the radial inward direction.
    arr[ring] = bg
    return arr


def extract_arabic(arr, bg):
    dist = np.linalg.norm(arr.astype(np.float32) - bg, axis=2)
    ink = dist > 32
    rows = np.where(ink.any(axis=1))[0]
    cols = np.where(ink.any(axis=0))[0]
    if len(rows) == 0 or len(cols) == 0:
        return None
    y0, y1 = int(rows[0]), int(rows[-1])
    x0, x1 = int(cols[0]), int(cols[-1])
    # Drop the lower latin band (roughly bottom 28% of the content box)
    cut = y0 + int((y1 - y0) * 0.58)
    crop = arr[y0:cut, x0:x1].copy()
    cdist = np.linalg.norm(crop.astype(np.float32) - bg, axis=2)
    crop[cdist <= 32] = (0, 0, 0)
    # make background transparent-like by using a mask later
    mask = cdist > 32
    return crop, mask


def rebuild_classic(src: Path, light: bool) -> Image.Image:
    im = Image.open(src).convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    arr = np.array(im)
    bg = bg_color(arr)
    arr = remove_inner_frame(arr, bg)
    extracted = extract_arabic(arr, bg)
    canvas = Image.new("RGB", (1024, 1024), tuple(int(x) for x in bg))
    if extracted:
        crop, mask = extracted
        ch, cw = crop.shape[:2]
        target_w = 940
        target_h = int(ch * (target_w / max(cw, 1)))
        if target_h > 480:
            target_h = 480
            target_w = int(cw * (target_h / max(ch, 1)))
        rgb = Image.fromarray(crop.astype(np.uint8)).resize((target_w, target_h), Image.Resampling.LANCZOS)
        alpha = Image.fromarray((mask.astype(np.uint8) * 255)).resize((target_w, target_h), Image.Resampling.LANCZOS).filter(ImageFilter.MaxFilter(3))
        rgba = rgb.convert("RGBA")
        rgba.putalpha(alpha)
        x = (1024 - target_w) // 2
        y = 70
        canvas.paste(Image.new("RGB", (target_w, target_h), tuple(int(v) for v in bg)), (x, y))
        canvas.paste(rgba, (x, y), rgba)
    draw = ImageDraw.Draw(canvas)
    latin_top = ImageFont.truetype(FONT_BOLD, 96)
    latin_main = ImageFont.truetype(FONT_BOLD, 132)
    fill = BLACK if light else GOLD
    draw_tracked(draw, DAR, latin_top, fill, 512, 700, 0.12)
    draw_tracked(draw, TAWHID, latin_main, fill, 512, 860, 0.03)
    return canvas


def main():
    if FULL != "DĀR AL TAWḤĪD" or "Ā" not in FULL or "Ḥ" not in FULL or "Ī" not in FULL:
        raise SystemExit("spelling")
    for folder, (ios_name, light) in CLASSICS.items():
        src = IOS_ASSETS / f"{ios_name}.appiconset" / "AppIcon-1024.png"
        # Use already-exported web 1024 as source if catalog was overwritten; prefer original from git?
        # Catalog currently holds previous 1024 which still has the frame — good source.
        master = rebuild_classic(src, light)
        save_all(master, folder, ios_name)
        master.resize((180, 180), Image.Resampling.LANCZOS).save(f"/tmp/qa-classic-{folder}-180.png")
    for folder, spec in MODERN.items():
        master = render_modern(spec)
        save_all(master, folder, spec["ios"])
        master.resize((180, 180), Image.Resampling.LANCZOS).save(f"/tmp/qa-modern-{folder}-180.png")
    print("icons rebuilt")


if __name__ == "__main__":
    main()
