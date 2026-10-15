#!/usr/bin/env python3
"""Import ONLY approved tvOS Kaaba backgrounds + brand into Android TV.

Usage:
  python3 -m pip install Pillow
  python3 android/tv/tools/import_original_apple_tv_assets.py \
      /path/to/DAR_AL_TAWHID_TV_AKTUELL_20261015-1135.zip

No Xcode code, environment files, signing keys or other-app resources are
copied. Never commit the owner's full ZIP to the public GitHub repository.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
from zipfile import ZipFile

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow fehlt. Einmal ausführen: python3 -m pip install Pillow") from exc

ASSET_PREFIX = "DarAlTawhid/DarAlTawhidTV/Assets.xcassets/"
# Original TVKaabaBackground(.png) is 1672x941; 8K originals are downsampled
# to 4K so GPU memory usage on constrained TVs remains manageable.
IMAGES: dict[str, tuple[str, str]] = {
    "tv_kaaba_night": ("TVKaabaBackground", "TVKaabaBackground.png"),
    "tv_kaaba_day": ("TVKaabaDay", "TVKaabaDay.png"),
    "tv_kaaba_sunrise": ("TVKaabaSunrise", "TVKaabaSunrise.png"),
    "tv_kaaba_sunset": ("TVKaabaSunset", "TVKaabaSunset.png"),
    "tv_kaaba_rain": ("TVKaabaRain", "TVKaabaRain.png"),
    "tv_kaaba_thunderstorm": ("TVKaabaThunderstorm", "TVKaabaThunderstorm.png"),
    "tv_kaaba_autumn": ("TVKaabaAutumn", "TVKaabaAutumn.png"),
    "tv_kaaba_mekka_new1": ("TVKaabaMekkaNeu1", "mekka_neu_1.png"),
    "tv_kaaba_mekka_new2": ("TVKaabaMekkaNeu2", "mekka_neu_2.png"),
    "tv_brand_mark": ("TVBrandMark", "TVBrandMark.png"),
}

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="Current Xcode project ZIP")
    parser.add_argument("--replace", action="store_true",
                        help="Overwrite earlier generated Android TV-only WebP images")
    parser.add_argument("--destination", type=Path,
                        default=Path(__file__).resolve().parents[1] /
                        "src/main/res/drawable-nodpi")
    args = parser.parse_args()
    if not args.archive.is_file():
        raise SystemExit(f"Original ZIP nicht gefunden: {args.archive}")
    destination = args.destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    report: list[dict[str, object]] = []

    with ZipFile(args.archive) as source:
        for name, (folder, filename) in IMAGES.items():
            exact = f"{ASSET_PREFIX}{folder}.imageset/{filename}"
            if exact not in source.namelist():
                raise SystemExit(f"Apple-TV-Originalressource fehlt: {exact}")
            meta = source.getinfo(exact)
            if not (0 < meta.file_size < 40_000_000):
                raise SystemExit(f"Ungültige Bildgröße: {exact}")
            out = destination / f"{name}.webp"
            if out.exists() and not args.replace:
                raise SystemExit(
                    f"Zieldatei existiert: {out}. Zum gezielten Ersetzen --replace angeben."
                )
            with Image.open(io.BytesIO(source.read(exact))) as picture:
                picture.load()
                if picture.mode not in ("RGB", "RGBA"):
                    picture = picture.convert("RGBA" if "A" in picture.getbands() else "RGB")
                bound = (384, 384) if name == "tv_brand_mark" else (3840, 2160)
                picture.thumbnail(bound, Image.Resampling.LANCZOS)
                output = io.BytesIO()
                picture.save(output, format="WEBP", quality=78, method=6)
                encoded = output.getvalue()
                pixels = list(picture.size)
            if len(encoded) > 2_000_000:
                raise SystemExit(f"Bild noch zu groß (max. 2 MB): {name}")
            # Write only after validation.
            out.write_bytes(encoded)
            report.append({
                "original": exact,
                "android": str(out),
                "size": len(encoded),
                "pixels": pixels,
                "sha256": hashlib.sha256(encoded).hexdigest(),
            })
            print(f"OK {name:<25} {pixels[0]}×{pixels[1]} · {len(encoded)//1024} KiB")

    print(json.dumps({"count": len(report), "files": report},
                     ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
