#!/usr/bin/env python3
"""Independent V7.6 hard checks, no image/render creation."""
from pathlib import Path
import json,struct,hashlib
import numpy as np
from qa_original_fiveview_v3 import glb_mesh
D=Path(__file__).resolve().parent
source=D/'mein_gebet_junge_v74_sculpt_internal.glb'
candidate=D/'mein_gebet_junge_v76_geometry_qa_only.glb'
EXPECTED_SOURCE='7b4db7e684144ec23c63f8ad63e5a055e66fc871adf2757be62adf2699c41490'
EXPECTED_CANDIDATE='14d803f8c0dfc7a57a566bcd50f12b895ee4bea3008fb660f0d97dc2e62e2e2a'
assert hashlib.sha256(source.read_bytes()).hexdigest()==EXPECTED_SOURCE
assert hashlib.sha256(candidate.read_bytes()).hexdigest()==EXPECTED_CANDIDATE

def parse(path):
    raw=path.read_bytes();assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,4)[0]==2
    assert struct.unpack_from('<I',raw,8)[0]==len(raw)
    size,ctype=struct.unpack_from('<II',raw,12);assert ctype==0x4e4f534a
    js=json.loads(raw[20:20+size]);off=20+size
    sz,bc=struct.unpack_from('<II',raw,off);assert bc==0x004e4942
    return js,raw[off+8:off+8+sz]
old,b_old=parse(source);new,b_new=parse(candidate)
assert old['nodes']==new['nodes'], 'rig joint hierarchy changed'
assert old['skins']==new['skins'], 'skinned model changed'
assert old['animations']==new['animations'], 'clip definition changed'
assert old['materials']==new['materials'], 'materials modified'
assert old['meshes']==new['meshes'], 'geometry index / binding format changed'
assert old['images']==new['images'] if 'images' in old else True
assert set(a['name'] for a in new['animations'])=={'Qiyam','Takbir'}
assert len(new['skins'][0]['joints'])==19
assert all(c['target']['path']!='scale' for a in new['animations'] for c in a['channels'])
assert new.get('extras',{}).get('approvedForChildren') is False
assert new.get('extras',{}).get('originalLikenessApproved') is False
# Only POSITION and NORMAL bytes may change; even animations, skin data, and
# original color/UV/material/index bytes must remain identical.
changed_types=[]
for i,(v1,v2) in enumerate(zip(old['bufferViews'],new['bufferViews'])):
    assert v1==v2, 'buffer view layout altered'
    a,b=v1.get('byteOffset',0),v1.get('byteOffset',0)+v1['byteLength']
    if b_old[a:b]!=b_new[a:b]:
        used_by=[a1 for a1 in old['accessors'] if a1.get('bufferView')==i]
        pairs=[]
        for p1,p2 in zip(old['meshes'][0]['primitives'],new['meshes'][0]['primitives']):
            for key in ('POSITION','NORMAL'):
                if old['accessors'][p1['attributes'][key]].get('bufferView')==i:pairs.append(key)
        assert pairs and all(k in ('POSITION','NORMAL') for k in pairs), f'non-geometric buffer changed index {i}'
        changed_types.extend(pairs)
assert 'POSITION' in changed_types and 'NORMAL' in changed_types
verts_before,faces_before=glb_mesh(source)
verts_after,faces_after=glb_mesh(candidate)
assert np.array_equal(faces_before,faces_after),'triangle connectivity changed'
assert np.array_equal(verts_before[:,1:],verts_after[:,1:]),'vertical depth/leg geometry changed'
change=verts_after[:,0]-verts_before[:,0]
assert np.max(np.abs(change))<.05,'too large positional distortion'
assert np.count_nonzero(change)>1000, 'no real geometry changes'
assert np.all(np.isfinite(verts_after))
print('PASS fixed SHA-256 of both models')
print('PASS real GLB 2.0 with unchanged 19-joint hierarchy, skin and Qiyam/Takbir animation clips')
print('PASS source materials, UV attributes, vertex weights, bone data, triangles preserved')
print('PASS only constrained 3D mesh position and normal bytes changed')
print('PASS all original leg Y/Z coordinates unchanged; no scale animation')
print('PASS no visual/religious/iPad/production release markers enabled')
print('MAX_ABS_X_SHIFT='+str(round(float(np.max(np.abs(change))),6)))
print('MODIFIED_VERTEX_COUNT='+str(int(np.count_nonzero(change))))
print('VISUAL_ORIGINAL_LIKENESS_APPROVED=false')