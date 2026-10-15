#!/usr/bin/env python3
"""Check exact original 10 vetted WebP resources, never package partial artwork.

Safe staging: zero installed images is allowed (native fallback stays active).
Production release: --require aborts until *all* 10 SHA-256 hashes match.
"""
import argparse
import hashlib
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--require", action="store_true",
                        help="Fail unless all original Apple TV resources are installed")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[4],
                        help="Root of dar-al-tawhid-site repo")
    args = parser.parse_args()
    root = args.root.resolve()
    tools = root / "android/tv/tools"
    lock = json.loads((tools / "original_asset_lock.json").read_text())
    base = root / lock["build_resource_dir"]
    entries = lock["resource_files"]
    actual = [item for item in entries if (base / item["name"]).is_file()]
    if not actual and not args.require:
        print("TV_ASSETS_STAGED: 0/10 originals; old fallback active; NOT RELEASE READY")
        return

    failures = []
    for item in entries:
        name = item["name"]
        path = base / name
        if not path.is_file():
            failures.append(f"missing: {name}")
            continue
        data = path.read_bytes()
        if len(data) != item["bytes"]:
            failures.append(f"size mismatch: {name}")
            continue
        if hashlib.sha256(data).hexdigest() != item["sha256"]:
            failures.append(f"SHA-256 mismatch: {name}")
            continue
        if data[0:4] != b"RIFF" or data[8:12] != b"WEBP":
            failures.append(f"not a WebP image: {name}")
    if failures:
        raise SystemExit("TV_ORIGINAL_ASSET_CHECK FAILED:\n" + "\n".join(failures))
    if len(entries) != 10:
        raise SystemExit("TV_ORIGINAL_ASSET_CHECK FAILED: expected exact 10 resources")
    print("TV_ASSETS_VERIFIED: all 10 source-approved original resources installed")


if __name__ == "__main__":
    main()
