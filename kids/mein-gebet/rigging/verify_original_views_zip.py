#!/usr/bin/env python3
"""Verify the ten user-supplied 2D originals against the PINNED GitHub registry.

This is an input-integrity gate for KIDS Mein Gebet, NOT a mesh, rig, camera,
likeness, prayer-pose, teaching, or release approval. The ZIP is never extracted.
Usage: python verify_original_views_zip.py <sources.zip> <REFERENCE-ASSET-REGISTRY-V1.json>
"""
import argparse
import hashlib
import json
import pathlib
import re
import stat
import sys
import zipfile

MAX_ZIP = 20 * 1024 * 1024
MAX_UNCOMPRESSED = 20 * 1024 * 1024
MAX_MEMBER = 3 * 1024 * 1024
PREFIX = "/Kinder App/Mein_Gebet_Originale_20261011/"
ALLOWED_META = {"README.txt", "original-reference-manifest.json"}
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
JPEG_SOF = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}


def dimensions(data, name):
    if name.endswith(".png"):
        if len(data) < 33 or data[:8] != PNG_SIGNATURE or data[12:16] != b"IHDR":
            raise ValueError(f"Invalid PNG header: {name}")
        return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
    if name.endswith((".jpg", ".jpeg")):
        if data[:2] != b"\xff\xd8" or data[-2:] != b"\xff\xd9":
            raise ValueError(f"Invalid JPEG framing: {name}")
        pos = 2
        while pos < len(data):
            if data[pos] != 255:
                raise ValueError(f"Invalid JPEG marker: {name}")
            while pos < len(data) and data[pos] == 255:
                pos += 1
            if pos >= len(data):
                break
            marker = data[pos]
            pos += 1
            if marker in (0xD8, 0xD9, 0x01) or 0xD0 <= marker <= 0xD7:
                continue
            if pos + 2 > len(data):
                break
            length = int.from_bytes(data[pos:pos + 2], "big")
            if length < 2 or pos + length > len(data):
                raise ValueError(f"Invalid JPEG segment: {name}")
            if marker in JPEG_SOF:
                if length < 7:
                    break
                return int.from_bytes(data[pos + 3:pos + 5], "big"), int.from_bytes(data[pos + 5:pos + 7], "big")
            if marker == 0xDA:
                break
            pos += length
        raise ValueError(f"No JPEG SOF dimensions: {name}")
    raise ValueError(f"Wrong image extension: {name}")


def expected_sources(registry):
    views = registry.get("original2DViews")
    if not isinstance(views, dict) or set(views) != {"boy", "girl"}:
        raise ValueError("Registry must contain boy and girl original 2D views")
    expected = {}
    for character, folder in (("boy", "junge"), ("girl", "maedchen")):
        items = views[character]
        if not isinstance(items, list) or len(items) != 5:
            raise ValueError(f"Exactly five original views required for {character}")
        for item in items:
            path = item.get("libraryPath")
            sha = item.get("sha256")
            if not isinstance(path, str) or not path.startswith(PREFIX + folder + "/"):
                raise ValueError("Registry path outside frozen original folder")
            member = path[len(PREFIX):]
            if not re.fullmatch(r"(?:junge|maedchen)/[a-z0-9_]+\.(?:png|jpe?g)", member):
                raise ValueError("Unrecognized frozen original filename")
            if not isinstance(sha, str) or not re.fullmatch(r"[a-f0-9]{64}", sha):
                raise ValueError("Invalid SHA-256 pin")
            if item.get("original2D") is not True or item.get("approved3D") is not False:
                raise ValueError("Incorrect source-vs-3D approval marking")
            if member in expected:
                raise ValueError("Duplicate original view")
            expected[member] = {"sha256": sha, "character": character}
    if len({item["sha256"] for item in expected.values()}) != 10:
        raise ValueError("Original view hashes must be distinct")
    return expected


def verify(archive_path, registry_path):
    archive_path, registry_path = pathlib.Path(archive_path), pathlib.Path(registry_path)
    if archive_path.stat().st_size > MAX_ZIP:
        raise ValueError("ZIP exceeds file size cap")
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    expected = expected_sources(registry)
    if registry.get("sourceLibraryArchive") != PREFIX + "Originale_10_Ansichten_20261011.zip":
        raise ValueError("Registry ZIP identity is not pinned")
    records = []
    with zipfile.ZipFile(archive_path, "r") as z:
        infos = z.infolist()
        if len(infos) > 20:
            raise ValueError("Unexpected number of ZIP members")
        members = {}
        total = 0
        for info in infos:
            name = info.filename
            if (name.startswith(("/", "\\")) or "\\" in name or "\x00" in name or
                any(part in ("", ".", "..") for part in name.split("/")) or
                stat.S_IFMT(info.external_attr >> 16) == stat.S_IFLNK or info.is_dir()):
                raise ValueError("Unsafe archive entry")
            if name in members or name not in set(expected) | ALLOWED_META:
                raise ValueError("Duplicate or unapproved ZIP member: " + name)
            if info.file_size > MAX_MEMBER or info.file_size < 0:
                raise ValueError("Oversized ZIP member")
            total += info.file_size
            if total > MAX_UNCOMPRESSED:
                raise ValueError("ZIP expanded size limit exceeded")
            if info.file_size > 2048 and info.file_size > 200 * max(info.compress_size, 1):
                raise ValueError("Suspicious ZIP compression ratio")
            members[name] = info
        if set(expected) - set(members):
            raise ValueError("Missing original views: " + ", ".join(sorted(set(expected)-set(members))))
        if "original-reference-manifest.json" not in members:
            raise ValueError("Missing independent archive manifest")
        embedded = json.loads(z.read(members["original-reference-manifest.json"]))
        manifest_entries = embedded.get("assets")
        if not isinstance(manifest_entries, list) or len(manifest_entries) != 10:
            raise ValueError("Archive manifest must contain exactly ten source images")
        mapping = {}
        for row in manifest_entries:
            name = row.get("archive_path")
            if name in mapping or name not in expected:
                raise ValueError("Unapproved or repeated manifest record")
            mapping[name] = row
        if set(mapping) != set(expected):
            raise ValueError("Missing manifest view")
        for name, pin in sorted(expected.items()):
            # ZIP member size cap checked BEFORE decompression.
            data = z.read(members[name])
            if len(data) != members[name].file_size:
                raise ValueError("Decompressed file size mismatch")
            digest = hashlib.sha256(data).hexdigest()
            if digest != pin["sha256"]:
                raise ValueError("Source image SHA-256 mismatch: " + name)
            size = dimensions(data, name)
            if size != (1254, 1254):
                raise ValueError("Unexpected source dimensions: " + name)
            row = mapping[name]
            if (row.get("sha256") != digest or row.get("bytes") != len(data) or
                row.get("dimensions") != [1254, 1254] or
                row.get("character") != name.split("/")[0]):
                raise ValueError("Archive manifest disagrees with verified original: " + name)
            records.append({"path": name, "sha256": digest, "width": size[0], "height": size[1]})
    return {"original2DSourcePackVerified": True, "sourceCount": len(records), "files": records,
            "realOriginal3DGLBVerified": False, "original3DLikenessApproved": False,
            "prayerAnimationsApproved": False, "teachingApproved": False,
            "productionReady": False, "scope": "isolated KIDS reference-only forensic check"}


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("zip")
    p.add_argument("registry")
    p.add_argument("--output", help="Optional machine-readable report path")
    args = p.parse_args(argv)
    result = verify(args.zip, args.registry)
    value = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        pathlib.Path(args.output).write_text(value, encoding="utf-8")
    print(value)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile, json.JSONDecodeError) as exc:
        print("SOURCE QA BLOCKED: " + str(exc), file=sys.stderr)
        sys.exit(1)
