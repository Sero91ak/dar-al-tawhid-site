#!/usr/bin/env python3
"""DAR AL TAWḤĪD KIDS — independent five-view geometry *regression* gate.

NO image creation, no release approval. Does not prove face likeness, 3D animation,
prayer correctness, or iPad rendering. Reports are recomputed from the ORIGINAL
approved reference and actual GLB bytes — not trusted from hand-edited JSON.

python compare_original_fiveview_v3.py before.glb after.glb original.png --json result.json
Exit 0: geometric progress, no regression in any view/head and material improvement.
Exit 1: no progress, regression, corrupted inputs or incomparable masks.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
from qa_original_fiveview_v3 import check, CUTS, SEEDS, VIEWS, ORIGINAL_SHA

EXPECTED_NAMES = tuple(name for name, _ in VIEWS)
SCORE_EPS = 0.00001  # Original report rounds scores to 5 decimal places.
MATERIAL_PROGRESS = 0.002  # Meaningful minimum gain in any full-body view.
STABLE_REFERENCE = 0.96


def _sha(value):
    return isinstance(value, str) and len(value) == 64 and all(c in '0123456789abcdef' for c in value)


def validate_report(r):
    """Fail closed on malformed reports, unknown angles or forged approvals."""
    if not isinstance(r, dict) or r.get('original_sha256') != ORIGINAL_SHA:
        raise ValueError('Original reference SHA-256 differs from pinned approved source')
    if r.get('measurement_method_id') != 'fiveview-cropped-grabcut-seeded-v3-20261008':
        raise ValueError('Changed/unseeded measurement method')
    if not isinstance(r.get('opencv_version'),str) or not r['opencv_version']:
        raise ValueError('Missing OpenCV version')
    if not _sha(r.get('model_sha256')):
        raise ValueError('Missing valid model SHA-256')
    if tuple(r.get('source_crop_boundaries_px', ())) != CUTS or tuple(r.get('source_segmentation_seed_thresholds', ())) != SEEDS:
        raise ValueError('Changed source crop boundaries or segmentation thresholds')
    if set(r.get('views', ())) != set(EXPECTED_NAMES):
        raise ValueError('All five independent perspectives required')
    for flag in ('original_character_likeness_approved', 'prayer_poses_approved', 'real_ipad_test_done', 'production_approved'):
        if r.get(flag) is not False:
            raise ValueError('Incorrect production approval marker: ' + flag)
    if r.get('all_five_90pct_pass') is not False:
        raise ValueError('Uncalibrated 3/4 reference must not be declared production-ready')
    for name, angle in VIEWS:
        v = r['views'][name]
        if v.get('camera_azimuth_used') != angle or v.get('reference_camera_physically_calibrated') is not False:
            raise ValueError('Uncalibrated camera was changed or incorrectly marked calibrated: '+name)
        if name == 'three_quarter_uncalibrated' and v.get('reference_angle_label') != '3/4 unknown angle':
            raise ValueError('3/4 camera calibration not established')
        for key in ('reference_segmentation_agreement', 'whole_body_shape_iou_worst', 'head_region_iou_worst'):
            val = v.get(key)
            if type(val) not in (float, int) or not math.isfinite(val) or not 0 <= val <= 1:
                raise ValueError('Invalid or nonfinite '+key+' for '+name)
        if v.get('reference_masks_stable') is not True or v['reference_segmentation_agreement'] < STABLE_REFERENCE:
            raise ValueError('Reference mask not stable in '+name)
        passed = (v['whole_body_shape_iou_worst'] >= .90 and v['head_region_iou_worst'] >= .85 and name != 'three_quarter_uncalibrated')
        if v.get('requested_90pct_shape_prefilter_pass') is not passed:
            raise ValueError('Forged/inconsistent 90% view flag: '+name)
    return True


def compare_reports(baseline, candidate):
    validate_report(baseline)
    validate_report(candidate)
    if baseline['model_sha256'] == candidate['model_sha256']:
        raise ValueError('No new model: baseline and candidate GLB byte hashes identical')
    if baseline['measurement_method_id'] != candidate['measurement_method_id'] or baseline['opencv_version'] != candidate['opencv_version']:
        raise ValueError('Incomparable method/OpenCV version')
    if baseline['original_sha256'] != candidate['original_sha256']:
        raise ValueError('Reference changed')
    differences = {}
    regressions = []
    improvements = []
    for name, angle in VIEWS:
        a = baseline['views'][name]
        b = candidate['views'][name]
        if a['reference_angle_label'] != b['reference_angle_label']:
            raise ValueError('Reference view interpretation changed: '+name)
        if abs(a['reference_segmentation_agreement'] - b['reference_segmentation_agreement']) > SCORE_EPS:
            raise ValueError('Reference segmentation reproducibility changed: '+name)
        dw = round(b['whole_body_shape_iou_worst'] - a['whole_body_shape_iou_worst'], 5)
        dh = round(b['head_region_iou_worst'] - a['head_region_iou_worst'], 5)
        worse = dw < -SCORE_EPS or dh < -SCORE_EPS
        material = dw >= MATERIAL_PROGRESS
        differences[name] = {'baseline_body':a['whole_body_shape_iou_worst'],
            'candidate_body':b['whole_body_shape_iou_worst'],
            'delta_body':dw,'delta_head':dh,
            'no_regression':not worse,'material_body_gain':material,
            'calibration':'UNCALIBRATED: diagnostic only' if name == 'three_quarter_uncalibrated' else 'nominal orientation'}
        if worse: regressions.append(name)
        if material: improvements.append(name)
    passed = not regressions and bool(improvements)
    return {
        'baseline_sha256':baseline['model_sha256'],
        'candidate_sha256':candidate['model_sha256'],
        'original_sha256':ORIGINAL_SHA,
        'views':differences,'regressed_views':regressions,
        'materially_improved_views':improvements,
        'geometry_progress_accepted':passed,
        'at_least_90pct_all_views':False, # Unknown 3/4 camera calibration.
        'character_identity_approved':False,
        'animations_approved':False,
        'production_approved':False,
        'reason': ('REJECT: regressions in body or head' if regressions else
                   'REJECT: no meaningful whole-body improvement' if not improvements else
                   'ACCEPT: diagnostic geometric improvement only, not original likeness or deployment')
    }


def compare_actual_files(before, after, source):
    # Read actual model and original data, not preexisting JSON reports.
    source = Path(source);before = Path(before);after = Path(after)
    if hashlib.sha256(source.read_bytes()).hexdigest() != ORIGINAL_SHA:
        raise ValueError('Wrong original image: SHA-256 mismatch')
    if hashlib.sha256(before.read_bytes()).digest() == hashlib.sha256(after.read_bytes()).digest():
        raise ValueError('GLB candidate identical to baseline')
    a, b = check(before,source), check(after,source)
    # Ensure QA results are bound to the exact bytes supplied by caller.
    if a['model_sha256'] != hashlib.sha256(before.read_bytes()).hexdigest() or b['model_sha256'] != hashlib.sha256(after.read_bytes()).hexdigest():
        raise ValueError('Model changed while measuring')
    return compare_reports(a,b)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('baseline_glb');parser.add_argument('candidate_glb');parser.add_argument('original_reference')
    parser.add_argument('--json', help='Write audit JSON, never a release approval')
    a = parser.parse_args()
    result = compare_actual_files(a.baseline_glb,a.candidate_glb,a.original_reference)
    text = json.dumps(result,indent=2,ensure_ascii=False)+'\n'
    if a.json:Path(a.json).write_text(text,encoding='utf-8')
    print(text)
    return 0 if result['geometry_progress_accepted'] else 1

if __name__ == '__main__':
    try:raise SystemExit(main())
    except (OSError,ValueError,KeyError,TypeError) as exc:
        print('QA BLOCKED: '+str(exc),file=__import__('sys').stderr)
        raise SystemExit(1)