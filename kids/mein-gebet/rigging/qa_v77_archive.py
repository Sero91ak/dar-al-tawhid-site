#!/usr/bin/env python3
"""Read-only V7.7 archive intake. Validates authentic bytes before ANY model QA.

The archive is never committed, published, generated, or deployed. Only two
SHA-pinned files are extracted temporarily. Face, 90% shape and prayer poses
are NOT automatically approved. No arbitrary shell / archive filename launch.
"""
import argparse
import hashlib
import json
import pathlib
import stat
import subprocess
import sys
import tempfile
import zipfile

V77_SHA = "353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa"
REFERENCE_SHA = "062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9"
MAX_ENTRIES = 300
MAX_ARCHIVE_BYTES = 35 * 1024 * 1024
MAX_UNCOMPRESSED = 85 * 1024 * 1024
MAX_ENTRY = 28 * 1024 * 1024


def pinned_members(archive, model_digest=V77_SHA, reference_digest=REFERENCE_SHA):
    """Return in-memory authentic model+reference without extracting arbitrary ZIP paths."""
    archive = pathlib.Path(archive)
    if not archive.is_file() or archive.stat().st_size > MAX_ARCHIVE_BYTES:
        raise ValueError("ZIP missing or exceeds configured size cap")
    found = {}
    with zipfile.ZipFile(archive, "r") as z:
        members = z.infolist()
        if not members or len(members) > MAX_ENTRIES:
            raise ValueError("Unexpected ZIP member count")
        total = 0
        for m in members:
            name = m.filename.replace("\\", "/")
            pure = pathlib.PurePosixPath(name)
            if (pure.is_absolute() or ".." in pure.parts or
                any(part in ("", ".") for part in pure.parts) or
                "\x00" in name or name.startswith("/") or
                stat.S_IFMT(m.external_attr >> 16) == stat.S_IFLNK):
                raise ValueError("Unsafe ZIP entry name or symlink")
            if m.is_dir():
                continue
            if m.file_size > MAX_ENTRY or m.file_size < 0:
                raise ValueError("Unreasonable ZIP member size")
            total += m.file_size
            if total > MAX_UNCOMPRESSED:
                raise ValueError("Archive expands beyond safe uncompressed bound")
            if m.file_size > 2048 and m.file_size > max(m.compress_size, 1) * 200:
                raise ValueError("Potential ZIP bomb: compressed/uncompressed ratio")
            suffix = pure.suffix.lower()
            if suffix not in (".glb", ".png"):
                continue
            # ZIP central directory size can lie. Strictly limit streamed bytes.
            digest = hashlib.sha256()
            data = bytearray()
            with z.open(m, "r") as fp:
                while True:
                    chunk = fp.read(1024 * 1024)
                    if not chunk:
                        break
                    data.extend(chunk)
                    if len(data) > min(m.file_size, MAX_ENTRY):
                        raise ValueError("ZIP file exceeded declared safe size")
                    digest.update(chunk)
            if len(data) != m.file_size:
                raise ValueError("ZIP entry length mismatch")
            h = digest.hexdigest()
            if suffix == ".glb" and h == model_digest:
                if "model" in found:
                    raise ValueError("Duplicate pinned model entry")
                found["model"] = bytes(data)
            elif suffix == ".png" and h == reference_digest:
                if "reference" in found:
                    raise ValueError("Duplicate pinned reference entry")
                found["reference"] = bytes(data)
    missing = sorted({"model", "reference"} - set(found))
    if missing:
        raise ValueError("Frozen SHA-256 original bytes missing: " + ", ".join(missing))
    return found


def probe(command, timeout):
    try:
        p = subprocess.run(command, text=True, capture_output=True,
                           timeout=timeout, check=False)
        try:
            structured = json.loads(p.stdout)
        except json.JSONDecodeError:
            structured = None
        return {"completed": True, "commandExitCode": p.returncode,
                "report": structured, "stderrSummary": p.stderr.strip()[:350],
                "passed": p.returncode == 0 and structured is not None}
    except (OSError, subprocess.TimeoutExpired) as e:
        return {"completed": False, "passed": False, "error": str(e)[:350]}


def run(archive):
    root = pathlib.Path(__file__).resolve().parent
    files = pinned_members(archive)  # fails BEFORE executing any model analysis
    report = {"evidence": "exact SHA-256-locked V7.7 archive file bytes",
              "v77ModelSha256": V77_SHA, "originalImageSha256": REFERENCE_SHA,
              "modelBytesVerified": True, "referenceBytesVerified": True,
              "originalLikenessApproved": False, "cameraPhysicallyCalibrated": False,
              "prayerPoseApproved": False, "productionApproved": False}
    with tempfile.TemporaryDirectory(prefix="kids-v77-verified-") as temp:
        d = pathlib.Path(temp)
        model = d / "verified-v77.glb"
        reference = d / "verified-original.png"
        model.write_bytes(files["model"])
        reference.write_bytes(files["reference"])
        report["binaryRig"] = probe(["node", str(root / "validate-glb.cjs"), str(model), "boy"], 90)
        report["fixedFiveViews"] = probe([
            sys.executable, str(root / "qa_original_fiveview_v3.py"),
            str(model), str(reference)], 180)
        report["angleDiagnostic"] = probe([
            sys.executable, str(root / "three_quarter_camera_diagnostic.py"),
            str(model), str(reference)], 180)
        # IoU research is not a human image, girl-clothing, or fiqh approval.
    return report


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("v77_zip", help="Original V7.7 ZIP; never substitute models or references")
    ap.add_argument("--json", help="Optional output path for non-release QA report")
    args = ap.parse_args()
    try:
        result = run(args.v77_zip)
    except (ValueError, OSError, zipfile.BadZipFile, RuntimeError) as e:
        result = {"evidence": "BLOCKED", "error": str(e),
                  "modelBytesVerified": False, "referenceBytesVerified": False,
                  "productionApproved": False}
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.json:
        pathlib.Path(args.json).write_text(output, encoding="utf-8")
    print(output, end="")
    return 0 if (result.get("modelBytesVerified") and result.get("referenceBytesVerified")
                 and result.get("binaryRig", {}).get("passed")
                 and result.get("fixedFiveViews", {}).get("passed")
                 and result.get("angleDiagnostic", {}).get("completed")) else 1


if __name__ == "__main__":
    sys.exit(main())
