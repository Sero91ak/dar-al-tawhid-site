#!/usr/bin/env python3
"""Strict regression checks, independent from any generated images or new model."""
import copy
import json
import math
import os
from pathlib import Path
from compare_original_fiveview_v3 import validate_report,compare_reports,compare_actual_files
BASE=Path(__file__).resolve().parent
old=json.loads((BASE/'v74_report_seeded_v3.json').read_text())
new=json.loads((BASE/'v75_report_seeded_v3.json').read_text())
total=0

def ok(name, predicate):
    global total
    if not predicate:raise AssertionError(name)
    total+=1
    print(f'PASS {total:02} {name}',flush=True)

def rejects(name, f):
    try:f()
    except (ValueError,KeyError,TypeError):ok(name,True)
    else:raise AssertionError('Expected FAIL: '+name)

ok('genuine V7.4 report validates',validate_report(old))
ok('genuine V7.5 report validates',validate_report(new))
r=compare_reports(old,new)
ok('V7.5 rejected as regression',r['geometry_progress_accepted'] is False)
ok('V7.5 detected 3/4 body regression', 'three_quarter_uncalibrated' in r['regressed_views'])
ok('V7.5 head regions also protected',all('delta_head' in v for v in r['views'].values()))
ok('V7.5 cannot be published by comparator',r['production_approved'] is False and r['character_identity_approved'] is False)

improve=copy.deepcopy(new)
improve['model_sha256']='a'*64
for name, view in improve['views'].items():
    view['whole_body_shape_iou_worst']=old['views'][name]['whole_body_shape_iou_worst']
    view['head_region_iou_worst']=old['views'][name]['head_region_iou_worst']
improve['views']['front']['whole_body_shape_iou_worst']+=.004
res=compare_reports(old,improve)
ok('strict progress can pass only geometry, not deployment',res['geometry_progress_accepted'] and res['production_approved'] is False)

unchanged=copy.deepcopy(improve)
for name, v in unchanged['views'].items():v['whole_body_shape_iou_worst']=old['views'][name]['whole_body_shape_iou_worst']
reject_result=compare_reports(old,unchanged)
ok('no real improvement is rejected',reject_result['geometry_progress_accepted'] is False)

headworse=copy.deepcopy(improve)
headworse['views']['back']['head_region_iou_worst']-=.003
ok('head regression vetoes a better body score', not compare_reports(old,headworse)['geometry_progress_accepted'])

bodyworse=copy.deepcopy(improve)
bodyworse['views']['left_side']['whole_body_shape_iou_worst']-=.003
ok('left body regression vetoes a better front', not compare_reports(old,bodyworse)['geometry_progress_accepted'])

same=copy.deepcopy(improve);same['model_sha256']=old['model_sha256']
rejects('identical GLB digest is rejected',lambda:compare_reports(old,same))
for field,value in [('original_sha256','b'*64),('source_crop_boundaries_px',[0,1,2,3,4,1448]),('source_segmentation_seed_thresholds',[1,2,3])]:
    bad=copy.deepcopy(improve);bad[field]=value
    rejects('tampered '+field,lambda bad=bad:compare_reports(old,bad))
for field,val in [('reference_segmentation_agreement',float('nan')),('head_region_iou_worst',1.01),('whole_body_shape_iou_worst',-1)]:
    bad=copy.deepcopy(improve);bad['views']['front'][field]=val
    rejects('reject invalid '+field,lambda bad=bad:compare_reports(old,bad))
bad=copy.deepcopy(improve);bad['views']['front']['reference_masks_stable']=False
rejects('unstable reference masks rejected',lambda:compare_reports(old,bad))
bad=copy.deepcopy(improve);bad['views']['back']['reference_segmentation_agreement']-=.001
rejects('shifted source segmentation rejected',lambda:compare_reports(old,bad))
bad=copy.deepcopy(improve);bad['views']['left_side']['camera_azimuth_used']=90
rejects('swapped left/right GLB camera rejected',lambda:compare_reports(old,bad))
bad=copy.deepcopy(improve);bad['views'].pop('back')
rejects('missing independent back view rejected',lambda:compare_reports(old,bad))
bad=copy.deepcopy(improve);bad['views']['three_quarter_uncalibrated']['reference_camera_physically_calibrated']=True
rejects('false 3/4 camera calibration rejected',lambda:compare_reports(old,bad))
bad=copy.deepcopy(improve);bad['production_approved']=True
rejects('report cannot pretend to be production-approved',lambda:compare_reports(old,bad))
bad=copy.deepcopy(improve);bad['views']['front']['requested_90pct_shape_prefilter_pass']=True
rejects('forged view 90 percent approval rejected',lambda:compare_reports(old,bad))

source=Path(os.environ.get('KIDS_QA_INPUT_DIR',BASE/'mein_gebet_v75_paket'))
if all((source/p).is_file() for p in ('mein_gebet_junge_v74_sculpt_internal.glb','mein_gebet_junge_v75_geometry_qa_only.glb','3d_charakterturnaround_eines_jungen_im_thawb.png')):
    actual=compare_actual_files(source/'mein_gebet_junge_v74_sculpt_internal.glb',source/'mein_gebet_junge_v75_geometry_qa_only.glb',source/'3d_charakterturnaround_eines_jungen_im_thawb.png')
    ok('actual GLB binary geometry rejects V7.5 regression',not actual['geometry_progress_accepted'] and 'three_quarter_uncalibrated' in actual['regressed_views'])
else:
    raise SystemExit('Missing actual GLB + source files: cannot run rigorous suite')
print(f'{total} PASS. No original face, animation, iPad or production approval.')