#!/usr/bin/env python3
"""Fail closed: don't publish/declare improvement if any frozen 5-view silhouette regresses."""
import argparse, hashlib, json
from pathlib import Path
VIEWS=('front','three_quarter_uncalibrated','right_side','back','left_side')

def compare(base,next_,eps=0.0002):
    if base['original_sha256']!=next_['original_sha256'] or base['source_crop_boundaries_px']!=next_['source_crop_boundaries_px'] or base['source_segmentation_seed_thresholds']!=next_['source_segmentation_seed_thresholds']:
        raise ValueError('original source, crop boundaries or segmentation seeds changed: comparison invalid')
    a=base['views'];b=next_['views']
    if set(a)!=set(VIEWS) or set(b)!=set(VIEWS):raise ValueError('all 5 original perspectives required')
    checked={};regressed=[]
    for name in VIEWS:
        v1,v2=a[name],b[name]
        for key in ('camera_azimuth_used','reference_camera_physically_calibrated','reference_angle_label'):
            if v1[key]!=v2[key]: raise ValueError('changed camera/reference interpretation: '+name+' / '+key)
        if not v1['reference_masks_stable'] or not v2['reference_masks_stable']:
            raise ValueError('unstable reference mask, refuse to compare: '+name)
        before=v1['whole_body_shape_iou_worst'];after=v2['whole_body_shape_iou_worst']
        delta=round(after-before,5)
        head_delta=round(v2['head_region_iou_worst']-v1['head_region_iou_worst'],5)
        checked[name]={'baseline':before,'candidate':after,'delta':delta,'head_delta':head_delta,'not_worse':delta>=-eps and head_delta>=-eps}
        if delta<-eps or head_delta<-eps:regressed.append(name)
    return {'baseline_model':base['model'],'candidate_model':next_['model'],'views':checked,'regressions':regressed,
            'strict_five_view_no_regression':not regressed,
            'all_five_90pct_shape_gate':next_['all_five_90pct_pass'],
            'production_approved':False,
            'note':'No-regression is necessary but never sufficient for original-character/pose/iPad approval.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('baseline_json');p.add_argument('candidate_json');p.add_argument('--out');args=p.parse_args()
    result=compare(json.loads(Path(args.baseline_json).read_text()),json.loads(Path(args.candidate_json).read_text()))
    if args.out:Path(args.out).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
    return 0 if result['strict_five_view_no_regression'] else 1
if __name__=='__main__':raise SystemExit(main())