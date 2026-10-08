#!/usr/bin/env python3
"""Fail-closed invariants on actual approved original and existing V7.5 GLB."""
import sys, pathlib, tempfile, json, os
import cv2,numpy as np
from qa_original_fiveview_v2 import CUTS,VIEWS,SEEDS,mask_original,normalized,iou,check,glb_mesh,projected
D=pathlib.Path(os.environ.get('KIDS_QA_INPUT_DIR',pathlib.Path(__file__).resolve().parent/'mein_gebet_v75_paket'))
SRC=D/'3d_charakterturnaround_eines_jungen_im_thawb.png'
GLB=D/'mein_gebet_junge_v75_geometry_qa_only.glb'
if not SRC.is_file() or not GLB.is_file():raise SystemExit('Missing original/GLB: set KIDS_QA_INPUT_DIR to the extracted V7.5 package directory before running tests')
passed=0

def test(name,pred):
    global passed
    if not pred:raise AssertionError(name)
    passed+=1;print(f'PASS {passed}: {name}')

test('reference source immutable five independent crop gaps', CUTS==(0,318,611,874,1173,1448))
test('five physically distinct model rotations', [x[1] for x in VIEWS]==[0,45,90,180,270])
test('precommitted three segmentation seeds', SEEDS==(10,12,15))
image=cv2.imread(str(SRC))
for i,(name,_) in enumerate(VIEWS):
    refs=[normalized(mask_original(image,i,t)) for t in SEEDS]
    stability=min(iou(refs[a],refs[b]) for a,b in ((0,1),(0,2),(1,2)))
    test(name+' robust reference segmentation agreement >= .96',stability>=.96)
    test(name+' distinct non-empty reference',all(np.count_nonzero(r)>20000 for r in refs))
vertex,faces=glb_mesh(GLB)
test('real 3D source triangle geometry',len(vertex)>40000 and len(faces)>50000)
rotated=[projected(vertex,faces,angle) for _,angle in VIEWS]
test('actual 3D back is not a mirrored front mask',iou(rotated[3],cv2.flip(rotated[0],1))<.999)
test('independent left and right 3D projected silhouettes',iou(rotated[2],rotated[4])<.99)
report=check(GLB,SRC)
test('five distinct input views evaluated',len(report['views'])==5)
test('all five static silhouette reports explicitly not production approval',report['production_approved'] is False)
test('3/4 camera never declared physically calibrated',report['views']['three_quarter_uncalibrated']['reference_camera_physically_calibrated'] is False)
test('90 percent silhouette target not falsely claimed',report['all_five_90pct_pass'] is False)
test('no geometric 90 percent view falsely claimed',not any(x['requested_90pct_shape_prefilter_pass'] for x in report['views'].values()))
with tempfile.TemporaryDirectory() as tmp:
    wrong=pathlib.Path(tmp)/'changed_source.png';wrong.write_bytes(SRC.read_bytes()+b'modified')
    try:check(GLB,wrong)
    except ValueError as exc:
        test('changed input source SHA fails closed', 'SHA-256' in str(exc))
    else:raise AssertionError('input source was substituted')
    bad=pathlib.Path(tmp)/'fake.glb';bad.write_bytes(b'not a glb')
    try:glb_mesh(bad)
    except ValueError: test('non GLB fake is rejected',True)
    else:raise AssertionError('fake GLB accepted')
print(f'{passed} checks passed; actual V7.5 original-character approval remains BLOCKED')