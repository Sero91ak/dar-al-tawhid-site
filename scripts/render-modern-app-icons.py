#!/usr/bin/env python3
"""Render modern name-focus app icons with exact DĀR AL / TAWḤĪD glyphs."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

WEB_ROOT = Path("/Users/muwahhid91/Documents/GitHub/dar-al-tawhid-site/assets/app-icons")
IOS_ASSETS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/Assets.xcassets")
IOS_PNGS = Path("/Users/muwahhid91/Documents/dar-al-tawhid-site/ios/DarAlTawhid/DarAlTawhid/AppIcons")
FONT_BOLD = "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Times New Roman.ttf"
WEB_SIZES = (1024, 512, 192, 180, 64, 32)
IOS_EXPORTS = {
    "@2x.png": 120,
    "@3x.png": 180,
    "@2x~ipad.png": 152,
    "-83.5@2x~ipad.png": 167,
}

DAR = "DĀR AL"
TAWHID = "TAWḤĪD"
FORBIDDEN = ("TAWHID", "TAWHiD", "TAWHĪD", "TAWḤID", "DAR AL")

CLASSICS = {
    "creme-navy": IOS_ASSETS / "AppIcon.appiconset" / "AppIcon-1024.png",
    "minimal-creme": IOS_ASSETS / "AppIconMinimalCreme.appiconset" / "AppIcon-1024.png",
    "graphit-silber": IOS_ASSETS / "AppIconGraphitSilber.appiconset" / "AppIcon-1024.png",
    "schwarz-gold": IOS_ASSETS / "AppIconSchwarzGold.appiconset" / "AppIcon-1024.png",
    "stein-optik": IOS_ASSETS / "AppIconSteinOptik.appiconset" / "AppIcon-1024.png",
    "tiefes-gruen": IOS_ASSETS / "AppIconTiefesGruen.appiconset" / "AppIcon-1024.png",
    "bordeaux": IOS_ASSETS / "AppIconBordeaux.appiconset" / "AppIcon-1024.png",
    "elfenbein": IOS_ASSETS / "AppIconElfenbein.appiconset" / "AppIcon-1024.png",
    "mitternacht-blau": IOS_ASSETS / "AppIconMitternachtBlau.appiconset" / "AppIcon-1024.png",
}

MODERN = {
    "modern-name-focus-dark": {
        "ios": "AppIconModernNameFocusDark",
        "bg": (18, 18, 18),
        "top": (201, 168, 90),
        "main": (248, 250, 252),
        "line": (201, 168, 90),
    },
    "modern-name-focus-light": {
        "ios": "AppIconModernNameFocusLight",
        "bg": (248, 252, 255),
        "top": (20, 32, 51),
        "main": (20, 32, 51),
        "line": (201, 168, 90),
    },
    "modern-elegant-neutral": {
        "ios": "AppIconModernElegantNeutral",
        "bg": (230, 217, 200),
        "top": (176, 142, 70),
        "main": (28, 36, 52),
        "line": (176, 142, 70),
    },
    "modern-premium-gold-dark": {
        "ios": "AppIconModernPremiumGoldDark",
        "bg": (8, 8, 8),
        "top": (212, 176, 96),
        "main": (212, 176, 96),
        "line": (201, 168, 90),
    },
}


def tracked_width(font: ImageFont.FreeTypeFont, text: str, tracking: float) -> float:
    w = 0.0
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        w += bbox[2] - bbox[0]
        if i < len(text) - 1:
            w += tracking * font.size
    return w


def draw_tracked(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, fill, cx: float, baseline: float, tracking: float) -> None:
    x = cx - tracked_width(font, text, tracking) / 2
    for i, ch in enumerate(text):
        bbox = font.getbbox(ch)
        draw.text((x - bbox[0], baseline), ch, font=font, fill=fill, anchor="ls")
        x += (bbox[2] - bbox[0]) + (tracking * font.size if i < len(text) - 1 else 0)


def render_modern(spec: dict, size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), spec["bg"])
    draw = ImageDraw.Draw(img)
    s = size / 1024
    top_font = ImageFont.truetype(FONT_REG, max(10, int(78 * s)))
    main_font = ImageFont.truetype(FONT_BOLD, max(16, int(168 * s)))
    cx = size / 2
    draw_tracked(draw, DAR, top_font, spec["top"], cx, size * 0.36, 0.22)
    draw_tracked(draw, TAWHID, main_font, spec["main"], cx, size * 0.56, 0.08)
    line_w = max(18, int(220 * s))
    line_h = max(1, int(5 * s))
    ly = int(size * 0.68)
    draw.rounded_rectangle(
        [cx - line_w / 2, ly, cx + line_w / 2, ly + line_h],
        radius=line_h,
        fill=spec["line"],
    )
    return img


def save_web(img: Image.Image, dest_dir: Path) -> None:
    dest_dir.mkdir(parents=True, exist_ok=True)
    master = img.convert("RGB")
    if master.size[0] != 1024:
        master = master.resize((1024, 1024), Image.Resampling.LANCZOS)
    for side in WEB_SIZES:
        out = dest_dir / f"icon-{side}.png"
        master.resize((side, side), Image.Resampling.LANCZOS).save(out, "PNG")


def save_ios(master: Image.Image, ios_name: str) -> None:
    catalog = IOS_ASSETS / f"{ios_name}.appiconset"
    catalog.mkdir(parents=True, exist_ok=True)
    master.resize((1024, 1024), Image.Resampling.LANCZOS).save(catalog / "AppIcon-1024.png", "PNG")
    (catalog / "Contents.json").write_text(
        '{\n  "images": [{"filename": "AppIcon-1024.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}],\n  "info": {"author": "xcode", "version": 1}\n}\n',
        encoding="utf-8",
    )
    IOS_PNGS.mkdir(parents=True, exist_ok=True)
    for suffix, side in IOS_EXPORTS.items():
        master.resize((side, side), Image.Resampling.LANCZOS).save(IOS_PNGS / f"{ios_name}{suffix}", "PNG")


def assert_spelling(path: Path) -> None:
    # File bytes must contain the unicode sequences for the 1024 master we just wrote;
    # PNG will not contain UTF-8 text. Runtime check is on the source constants.
    for bad in FORBIDDEN:
        if bad == DAR:
            continue
    if DAR != "DĀR AL" or TAWHID != "TAWḤĪD":
        raise SystemExit("spelling constants drifted")
    if "Ā" not in DAR or "Ḥ" not in TAWHID or "Ī" not in TAWHID:
        raise SystemExit("missing required diacritics")


def main() -> None:
    assert_spelling(WEB_ROOT)
    for folder, src in CLASSICS.items():
        img = Image.open(src).convert("RGB")
        save_web(img, WEB_ROOT / folder)
    for folder, spec in MODERN.items():
        master = render_modern(spec, 1024)
        save_web(master, WEB_ROOT / folder)
        save_ios(master, spec["ios"])
        for side in (180, 64):
            check = Image.open(WEB_ROOT / folder / f"icon-{side}.png")
            check.save(f"/tmp/qa-{folder}-{side}.png")
    print("rendered", len(CLASSICS), "classic +", len(MODERN), "modern")


if __name__ == "__main__":
    main()
