#!/usr/bin/env python3
"""DAR Kids original boy: honest, strict, reproducible 3D shape QA.

NO new/generated illustrations. The 5-frame turnaround is the user's own approved
SOURCE IMAGE, which must match ORIGINAL_SHA. This is a geometric RESEARCH filter,
NOT a claim of original face likeness, 3D rig correctness, prayer correctness,
or iPad functionality.

Supports only regular GLB v2 triangle mesh positions; no morph/skin pose evaluation.
Uses fixed independent reference crops based on actual non-overlapping character
separators, not equal-width slicing. The labeled 3/4 view has NO calibrated camera.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path
import cv2
import numpy as np
from geometry_projection_preflight import assert_projection_safe
from glb_projection_accessor import decode_triangle_primitive

ORIGINAL_SHA='062b8555e861c680b1049ab6a3bee0212caa51cda5168a6b33a76be01aa987b9'
# Five characters are NOT equal-width. Gaps sampled from original y=140..880:
# x=318 (clear), 611 (clear), 874 (narrow pass), 1173 (clear).
CUTS=(0,318,611,874,1173,1448)
VIEWS=(('front',0),('three_quarter_uncalibrated',45),('right_side',90),('back',180),('left_side',270))
SEEDS=(10,12,15)
SIZE=512
CHAR_HEIGHT=440
TOP=24

def glb_mesh(path):
    raw=Path(path).read_bytes()
    if len(raw)<32 or raw[:4]!=b'glTF' or struct.unpack_from('<I',raw,4)[0]!=2 or struct.unpack_from('<I',raw,8)[0]!=len(raw):
        raise ValueError('invalid GLB 2.0 header')
    jsize,jtype=struct.unpack_from('<II',raw,12)
    if jtype!=0x4e4f534a:raise ValueError('GLB JSON chunk not first')
    gltf=json.loads(raw[20:20+jsize]);bo=20+jsize
    assert_projection_safe(gltf)  # Never score unprojected transforms/morphs as genuine silhouettes.
    bsize,btype=struct.unpack_from('<II',raw,bo)
    if btype!=0x004e4942 or bo+8+bsize>len(raw):raise ValueError('GLB binary data missing')
    blob=raw[bo+8:bo+8+bsize]
    vertices=[]; faces=[]; offset=0
    for mesh in gltf.get('meshes',[]):
        for prim in mesh.get('primitives',[]):
            # BufferView.byteStride, accessor byteOffset and element bounds
            # must be respected. Raw frombuffer() produced fake silhouettes
            # for GLBs using interleaved POSITION/index attributes.
            xyz,local_faces=decode_triangle_primitive(gltf,blob,prim)
            xyz=np.asarray(xyz,dtype=np.float64)
            idx=np.asarray(local_faces,dtype=np.int64)
            vertices.append(xyz)
            faces.append(idx+offset)
            offset+=len(xyz)
    if not vertices:raise ValueError('missing 3D triangle meshes')
    combined=np.concatenate(vertices)
    if not np.isfinite(combined).all() or np.ptp(combined[:,1])<0.02:
        raise ValueError('Nonfinite/flat model geometry invalidates original silhouette comparison')
    return combined,np.concatenate(faces)

def only_largest(mask):
    n,labels,stats,_=cv2.connectedComponentsWithStats(np.uint8(mask>0),8)
    if n<2:raise ValueError('character foreground missing')
    return np.uint8(labels==(1+np.argmax(stats[1:,cv2.CC_STAT_AREA])))

def mask_original(frame,index,seed):
    height,width=frame.shape[:2]
    if (height,width)!=(1086,1448):raise ValueError('unexpected source image shape')
    crop=frame[round(height*.068):round(height*.90), CUTS[index]:CUTS[index+1]]
    crop=cv2.resize(crop,None,fx=.65,fy=.65,interpolation=cv2.INTER_AREA)
    bg_pixels=np.concatenate((crop[:10,:13].reshape(-1,3),crop[:10,-13:].reshape(-1,3),crop[-30:,:10].reshape(-1,3)))
    bg=np.median(bg_pixels,axis=0)
    contrast=np.max(np.abs(crop.astype('float32')-bg),axis=2)
    first=np.uint8(contrast>seed)
    first=cv2.morphologyEx(first,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    first=only_largest(first)
    maybe=cv2.dilate(first,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)))
    sure=cv2.erode(first,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
    trimap=np.full(first.shape,cv2.GC_PR_BGD,np.uint8)
    trimap[maybe>0]=cv2.GC_PR_FGD
    trimap[sure>0]=cv2.GC_FGD
    trimap[maybe==0]=cv2.GC_BGD
    trimap[:4,:]=cv2.GC_BGD;trimap[-8:,:]=cv2.GC_BGD
    trimap[:,:4]=cv2.GC_BGD;trimap[:,-4:]=cv2.GC_BGD
    cv2.setRNGSeed(26008 + index*137 + seed)  # Deterministic OpenCV GMM/K-Means initialization.
    cv2.grabCut(crop,trimap,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),3,cv2.GC_INIT_WITH_MASK)
    return only_largest(np.uint8((trimap==cv2.GC_FGD)|(trimap==cv2.GC_PR_FGD)))

def normalized(original_mask):
    y,x=np.where(original_mask)
    if len(x)<2000:raise ValueError('implausibly small reference silhouette')
    mnx,mxx=x.min(),x.max();mny,mxy=y.min(),y.max()
    projected_width=round((mxx-mnx+1)*CHAR_HEIGHT/(mxy-mny+1))
    if projected_width>=SIZE:raise ValueError('outlier original crop too wide')
    region=cv2.resize(original_mask[mny:mxy+1,mnx:mxx+1],(projected_width,CHAR_HEIGHT),interpolation=cv2.INTER_NEAREST)
    canvas=np.zeros((SIZE,SIZE),np.uint8)
    left=(SIZE-projected_width)//2
    canvas[TOP:TOP+CHAR_HEIGHT,left:left+projected_width]=region
    return canvas

def projected(vertices,faces,angle):
    rad=np.deg2rad(angle)
    xp=np.cos(rad)*vertices[:,0]+np.sin(rad)*vertices[:,2]
    yy=vertices[:,1]
    scale=CHAR_HEIGHT/(yy.max()-yy.min())
    midpoint=(xp.max()+xp.min())/2
    pixels=np.column_stack((SIZE/2+(xp-midpoint)*scale, TOP+(yy.max()-yy)*scale)).astype(np.int32)
    dst=np.zeros((SIZE,SIZE),np.uint8)
    for face in faces:cv2.fillConvexPoly(dst,pixels[face],1)
    return dst

def iou(a,b):
    union=np.count_nonzero((a>0)|(b>0))
    return float(np.count_nonzero((a>0)&(b>0))/union) if union else 0.

def check(model,source):
    if hashlib.sha256(Path(source).read_bytes()).hexdigest()!=ORIGINAL_SHA:
        raise ValueError('Original reference SHA-256 mismatch; refusing to silently alter acceptance target')
    img=cv2.imread(str(source),cv2.IMREAD_COLOR)
    if img is None:raise ValueError('unreadable original image')
    xyz,tri=glb_mesh(model)
    result={}
    for index,(name,angle) in enumerate(VIEWS):
        ref_masks=[normalized(mask_original(img,index,seed)) for seed in SEEDS]
        min_consistency=min(iou(ref_masks[a],ref_masks[b]) for a,b in ((0,1),(0,2),(1,2)))
        model_mask=projected(xyz,tri,angle)
        vals=[iou(model_mask,x) for x in ref_masks]
        head=[iou(model_mask[TOP:TOP+round(.36*CHAR_HEIGHT)],x[TOP:TOP+round(.36*CHAR_HEIGHT)]) for x in ref_masks]
        result[name]={
            'camera_azimuth_used':angle,
            'reference_camera_physically_calibrated':False,
            'reference_angle_label':'3/4 unknown angle' if index==1 else f'{angle} degree nominal cardinal view',
            'reference_segmentation_agreement':round(min_consistency,5),
            'reference_masks_stable':min_consistency>=.96,
            'whole_body_shape_iou_worst':round(min(vals),5),
            'head_region_iou_worst':round(min(head),5),
            'requested_90pct_shape_prefilter_pass':min(vals)>=.90 and min(head)>=.85 and min_consistency>=.96 and index!=1
        }
    return {'measurement_method_id':'fiveview-cropped-grabcut-seeded-v3-20261008',
            'opencv_version':cv2.__version__,
            'model':Path(model).name,'model_sha256':hashlib.sha256(Path(model).read_bytes()).hexdigest(),
            'original_sha256':ORIGINAL_SHA,'source_crop_boundaries_px':list(CUTS),'source_segmentation_seed_thresholds':list(SEEDS),
            'views':result,'all_five_90pct_pass':all(v['requested_90pct_shape_prefilter_pass'] for v in result.values()),
            'original_character_likeness_approved':False,'prayer_poses_approved':False,'real_ipad_test_done':False,'production_approved':False,
            'warnings':['An uncalibrated 3/4 camera cannot grant a 90% geometry pass even when a pixel score exceeds 90.',
                        'IoU is a SILHOUETTE overlap metric, not facial identity or religious correctness.',
                        'The reference shows neutral resting arms; GLB evaluated in bind/static mesh geometry.',
                        'No new images are generated or written by this program.']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('glb');p.add_argument('original');p.add_argument('--json')
    a=p.parse_args();report=check(a.glb,a.original)
    if a.json:Path(a.json).write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
    print(json.dumps(report,indent=2,ensure_ascii=False))
    raise SystemExit(0 if report['all_five_90pct_pass'] else 1)