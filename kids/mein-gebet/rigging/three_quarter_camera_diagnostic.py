#!/usr/bin/env python3
"""Reproducible, non-release angle sweep for the fixed V7.7 boy GLB.

This cannot determine the physical camera angle of a flat illustration.
It must NOT replace the existing five-view, fixed-45-degree baseline or
approve a face, hair, kufi, clothing, rig, prayer motion, or release.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

PINNED_V77_SHA256 = '353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa'
PINNED_REFERENCE_SHA256 = '062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9'
ANGLE_GRID = tuple(range(5, 90, 5))  # Incl. nominal uncalibrated 45 degrees.


def best_fit_diagnostic(rows, metric):
    """Deterministic tie-break: higher primary, higher secondary, lower angle."""
    if not rows or metric not in ('whole_body_iou_worst', 'head_region_iou_worst'):
        raise ValueError('Invalid diagnostic input')
    second = 'head_region_iou_worst' if metric == 'whole_body_iou_worst' else 'whole_body_iou_worst'
    for row in rows:
        if not isinstance(row.get('angle_deg'), int) or not 0 < row['angle_deg'] < 90:
            raise ValueError('Invalid angle in diagnostic')
        if any(type(row.get(k)) not in (int, float) or not math.isfinite(row[k]) or not 0 <= row[k] <= 1 for k in (metric, second)):
            raise ValueError('Invalid/nonfinite IoU in diagnostic')
    return min(rows, key=lambda row: (-row[metric], -row[second], row['angle_deg']))


def sweep(model_path, reference_path):
    import cv2
    from qa_original_fiveview_v3 import glb_mesh, mask_original, normalized, projected, iou, SEEDS, TOP, CHAR_HEIGHT

    model = Path(model_path)
    reference = Path(reference_path)
    if hashlib.sha256(model.read_bytes()).hexdigest() != PINNED_V77_SHA256:
        raise ValueError('Expected frozen V7.7 GLB SHA-256 mismatch')
    if hashlib.sha256(reference.read_bytes()).hexdigest() != PINNED_REFERENCE_SHA256:
        raise ValueError('Original five-view reference SHA-256 mismatch')
    img = cv2.imread(str(reference), cv2.IMREAD_COLOR)
    if img is None or img.shape[:2] != (1086, 1448):
        raise ValueError('Reference cannot be read at pinned original size')
    ref_masks = [normalized(mask_original(img, 1, seed)) for seed in SEEDS]
    reference_stability = min(iou(ref_masks[i], ref_masks[j]) for i, j in ((0, 1), (0, 2), (1, 2)))
    if reference_stability < .96:
        raise ValueError('Three-quarter source mask instability; sweep invalid')
    vertices, faces = glb_mesh(model)
    rows = []
    for angle in ANGLE_GRID:
        rendered = projected(vertices, faces, angle)
        top_end = TOP + round(.36 * CHAR_HEIGHT)
        rows.append({
            'angle_deg': angle,
            'whole_body_iou_worst': round(min(iou(rendered, ref) for ref in ref_masks), 5),
            'head_region_iou_worst': round(min(iou(rendered[TOP:top_end], ref[TOP:top_end]) for ref in ref_masks), 5),
        })
    body = best_fit_diagnostic(rows, 'whole_body_iou_worst')
    head = best_fit_diagnostic(rows, 'head_region_iou_worst')
    return {
        'method': 'v77-locked-angle-sweep-diagnostic-v1',
        'source_glb_sha256': PINNED_V77_SHA256,
        'source_reference_sha256': PINNED_REFERENCE_SHA256,
        'reference_segmentation_stability': round(reference_stability, 5),
        'fixed_nominal_45_degree_result': next(r for r in rows if r['angle_deg'] == 45),
        'diagnostic_body_best_angle': body['angle_deg'],
        'diagnostic_head_best_angle': head['angle_deg'],
        'sweep': rows,
        'physical_camera_angle_established': False,
        'reference_is_consistent_3d_photographic_turnaround': False,
        'substitutes_fixed_five_view_qa': False,
        'three_quarter_90pct_release_gate_passed': False,
        'boy_original_likeness_approved': False,
        'production_approved': False,
        'interpretation': 'Max-IoU angles indicate mismatch/sensitivity, NOT calibrated camera pose or restored original facial identity. Keep fixed 45-degree QA comparison unchanged.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('v77_glb')
    parser.add_argument('original_turnaround_png')
    parser.add_argument('--json', help='Optional JSON diagnostic output, not release evidence')
    args = parser.parse_args()
    result = sweep(args.v77_glb, args.original_turnaround_png)
    s = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.json:
        Path(args.json).write_text(s, encoding='utf-8')
    print(s)
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, ImportError, KeyError, IndexError) as exc:
        print('DIAGNOSTIC BLOCKED: ' + str(exc), file=__import__('sys').stderr)
        raise SystemExit(1)
