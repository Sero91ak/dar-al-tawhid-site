#!/usr/bin/env python3
"""Read-only V7.7 archive intake. Validates authentic bytes before ANY model QA.

The archive is never committed, published, generated, or deployed. Only two
SHA-pinned files are extracted temporarily. Face, 90% shape and prayer poses
are NOT automatically approved. No arbitrary shell / archive filename launch.
"""
import argparse
import hashlib
import json
import math
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



def analysis_complete(result):
    """An authentic, *measured* model may still fail silhouette acceptance.

    Do not confuse a 90%-shape FAIL (the expected V7.7 result) with
    corrupt archive bytes or an analyzer that never ran. This only marks
    forensic QA as completed; it can NEVER grant production approval.
    """
    if result.get("modelBytesVerified") is not True or result.get("referenceBytesVerified") is not True:
        return False
    rig = result.get("binaryRig") or {}
    shape = result.get("fixedFiveViews") or {}
    angle = result.get("angleDiagnostic") or {}
    rig_report = rig.get("report")
    if rig.get("passed") is not True or not isinstance(rig_report, dict):
        return False
    required_binary_evidence = (
        "structureValid", "animationSamplerBytesVerified",
        "geometryVertexBytesVerified", "boneLengthInvariantVerified",
        "inverseBindMatchesRestPose"
    )
    if (any(rig_report.get(key) is not True for key in required_binary_evidence) or
        rig_report.get("productionApproved") is not False):
        return False
    if shape.get("completed") is not True or shape.get("commandExitCode") not in (0, 1):
        return False
    fixed = shape.get("report")
    if not isinstance(fixed, dict):
        return False
    views = fixed.get("views")
    # The exact V7.7 reference has an uncalibrated 3/4 camera, so its
    # five-view acceptance CLI must return 1 with an explicit rejection.
    if (shape.get("commandExitCode") != 1 or shape.get("passed") is not False or
        fixed.get("all_five_90pct_pass") is not False):
        return False
    expected_angles = {
        "front": 0,
        "three_quarter_uncalibrated": 45,
        "right_side": 90,
        "back": 180,
        "left_side": 270,
    }
    if not isinstance(views, dict) or set(views) != set(expected_angles):
        return False
    def valid_ratio(value):
        return type(value) in (int, float) and math.isfinite(value) and 0 <= value <= 1
    for name, azimuth in expected_angles.items():
        view = views[name]
        if not isinstance(view, dict) or view.get("camera_azimuth_used") != azimuth:
            return False
        if (view.get("reference_camera_physically_calibrated") is not False or
            type(view.get("reference_masks_stable")) is not bool or
            type(view.get("requested_90pct_shape_prefilter_pass")) is not bool or
            any(not valid_ratio(view.get(metric)) for metric in (
                "reference_segmentation_agreement", "whole_body_shape_iou_worst",
                "head_region_iou_worst"))):
            return False
    # Research output must never claim signed-off identity or prayer teaching.
    if (fixed.get("original_character_likeness_approved") is not False or
        fixed.get("prayer_poses_approved") is not False or
        fixed.get("real_ipad_test_done") is not False):
        return False
    if (fixed.get("model_sha256") != V77_SHA or
        fixed.get("original_sha256") != REFERENCE_SHA or
        fixed.get("measurement_method_id") != "fiveview-cropped-grabcut-seeded-v4-stride-scene-safe-20261009" or
        fixed.get("production_approved") is not False):
        return False
    if angle.get("passed") is not True or not isinstance(angle.get("report"), dict):
        return False
    diagnostic = angle["report"]
    if (diagnostic.get("source_glb_sha256") != V77_SHA or
        diagnostic.get("source_reference_sha256") != REFERENCE_SHA or
        diagnostic.get("method") != "v77-locked-angle-sweep-diagnostic-v2-stride-scene-safe" or
        diagnostic.get("production_approved") is not False or
        diagnostic.get("physical_camera_angle_established") is not False or
        diagnostic.get("substitutes_fixed_five_view_qa") is not False or
        diagnostic.get("three_quarter_90pct_release_gate_passed") is not False or
        diagnostic.get("boy_original_likeness_approved") is not False):
        return False
    sweep = diagnostic.get("sweep")
    if not isinstance(sweep, list) or len(sweep) != 17:
        return False
    for angle_degrees, row in zip(range(5, 90, 5), sweep):
        if (not isinstance(row, dict) or type(row.get("angle_deg")) is not int or
            row["angle_deg"] != angle_degrees or
            not valid_ratio(row.get("whole_body_iou_worst")) or
            not valid_ratio(row.get("head_region_iou_worst"))):
            return False
    # Both independent analyzers project the same SHA-pinned GLB at nominal
    # 45 degrees against the same SHA-pinned GrabCut source/masks. Their
    # rounded five-decimal IoUs MUST agree; this is NOT camera calibration.
    nominal = diagnostic.get("fixed_nominal_45_degree_result")
    if not isinstance(nominal, dict) or nominal != sweep[8]:
        return False
    fixed_45 = views["three_quarter_uncalibrated"]
    if (abs(nominal["whole_body_iou_worst"] - fixed_45["whole_body_shape_iou_worst"]) > 0.00002 or
        abs(nominal["head_region_iou_worst"] - fixed_45["head_region_iou_worst"]) > 0.00002):
        return False
    return result.get("productionApproved") is False


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
    report["qaAnalysisComplete"] = analysis_complete(report)
    # An unapproved / failed analysis cannot advertise a passing shape gate.
    report["fiveView90PctAccepted"] = False  # 3/4 view is uncalibrated in V7.7
    report["originalLikenessApproved"] = False
    report["productionApproved"] = False
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
    # Exit zero means verified original bytes AND successful diagnostic execution,
    # not that the 90% goal, character likeness or teaching approval passed.
    return 0 if analysis_complete(result) else 1


if __name__ == "__main__":
    sys.exit(main())
