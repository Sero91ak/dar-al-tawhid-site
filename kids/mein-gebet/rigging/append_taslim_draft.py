#!/usr/bin/env python3
"""Append a draft head-only Taslim glTF animation to exact original V7.7 GLB.

STRICT RESEARCH TOOL. No image/sculpt/skin/rig edits or teaching approval.
CLI accepts only SHA-256 pinned original V7.7 model, never synthetic models.
The Head LOCAL +Y axis is not calibrated against physical visual right/left;
inspect both sides in a 3D viewer before any production usage.
"""
import argparse
import copy
import hashlib
import json
import math
import os
from pathlib import Path
import struct

ORIGINAL_SHA256 = '353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa'
CLIP = 'Salam_Head_Right_Left_DRAFT'
# Relative rotations: physically RIGHT then LEFT if the candidate Head bone's
# local +Y basis aligns to the anatomical orientation. Requires visual QA.
KEYS = ((0.,0.),(.62,-1.07),(1.14,-1.07),(1.63,0.),(2.24,1.07),(2.85,1.07))
GLB_JSON = 0x4E4F534A
GLB_BIN = 0x004E4942


def parse_glb(data):
    if len(data) < 28 or data[:4] != b'glTF' or struct.unpack_from('<II',data,4) != (2,len(data)):
        raise ValueError('Not a complete glTF 2.0 binary file')
    off = 12
    chunks = []
    while off < len(data):
        if off + 8 > len(data):
            raise ValueError('Truncated GLB chunk header')
        n, kind = struct.unpack_from('<II',data,off)
        off += 8
        if n % 4 or off+n > len(data):
            raise ValueError('Invalid GLB chunk length or alignment')
        chunks.append((kind,data[off:off+n]))
        off += n
    if len(chunks) != 2 or chunks[0][0] != GLB_JSON or chunks[1][0] != GLB_BIN:
        raise ValueError('Expected exactly one JSON + one BIN GLB chunk')
    try:
        g = json.loads(chunks[0][1].decode('utf-8').rstrip(' \t\x00'))
    except (ValueError,UnicodeError) as err:
        raise ValueError('Invalid glTF JSON') from err
    if not isinstance(g,dict) or g.get('asset',{}).get('version') != '2.0':
        raise ValueError('Not glTF 2.0')
    return g, chunks[1][1]


def quaternion_product(a,b):
    x,y,z,w=a; X,Y,Z,W=b
    q=(w*X+x*W+y*Z-z*Y,
       w*Y-x*Z+y*W+z*X,
       w*Z+x*Y-y*X+z*W,
       w*W-x*X-y*Y-z*Z)
    length=math.sqrt(sum(v*v for v in q))
    if length < .99 or length > 1.01:
        raise ValueError('Non-unit head quaternion')
    return tuple(v/length for v in q)


def append_taslim(data, expected_sha256=ORIGINAL_SHA256):
    """Return (draft GLB bytes, report). Alternative SHA only for synthetic tests."""
    source_sha=hashlib.sha256(data).hexdigest()
    if source_sha != expected_sha256:
        raise ValueError('Expected pinned original V7.7 GLB SHA-256 mismatch')
    g,old_bin=parse_glb(data)
    nodes=g.get('nodes') or []
    names={n.get('name'):i for i,n in enumerate(nodes) if isinstance(n,dict)}
    expected=['Hips','Spine','Chest','Neck','Head','UpperArm.L','LowerArm.L','Hand.L',
              'UpperArm.R','LowerArm.R','Hand.R','UpperLeg.L','LowerLeg.L','Foot.L',
              'Toe.L','UpperLeg.R','LowerLeg.R','Foot.R','Toe.R']
    if any(n not in names for n in expected) or len(set(names[n] for n in expected)) != 19:
        raise ValueError('19 expected original joints not present')
    head=names['Head']; neck=names['Neck']
    skins=g.get('skins') or []
    if len(skins)!=1 or len(skins[0].get('joints',[]))!=19 or head not in skins[0]['joints']:
        raise ValueError('Original single-skin 19-joint chain not present')
    if head not in nodes[neck].get('children',[]):
        raise ValueError('Head must be a child of Neck; no reparenting permitted')
    clips=g.get('animations') or []
    clip_names=[a.get('name') for a in clips]
    if not {'Qiyam','Takbir'}.issubset(clip_names):
        raise ValueError('Frozen Qiyam/Takbir clips not present')
    if CLIP in clip_names or any(name in clip_names for name in ('Salam','Taslim')):
        raise ValueError('Taslim animation already exists; refuse overwrite')
    if len(g.get('buffers',[]))!=1:
        raise ValueError('Expected one GLB BIN buffer')
    old_declared=int(g['buffers'][0]['byteLength'])
    if old_declared > len(old_bin) or old_declared < len(old_bin)-3:
        raise ValueError('Original BIN byteLength inconsistent')
    if not isinstance(g.get('bufferViews'),list) or not isinstance(g.get('accessors'),list):
        raise ValueError('Original bufferViews/accessors missing')
    rotation=nodes[head].get('rotation',[0.,0.,0.,1.])
    if len(rotation)!=4 or any(not isinstance(x,(float,int)) or not math.isfinite(x) for x in rotation):
        raise ValueError('Head local rest rotation malformed')
    length=math.sqrt(sum(x*x for x in rotation))
    if abs(length-1.) > 1e-4:
        raise ValueError('Head rest rotation is not a normalized quaternion')
    base=tuple(x/length for x in rotation)
    # Always append after the full existing BIN including its valid 0-3 pad bytes.
    start=len(old_bin)
    time_bytes=b''.join(struct.pack('<f',t) for t,_ in KEYS)
    rot_bytes=b''.join(struct.pack('<4f',*quaternion_product(base,(0,math.sin(yaw/2),0,math.cos(yaw/2)))) for _,yaw in KEYS)
    time_pad=(4-(len(time_bytes)%4))%4
    new_bin=old_bin+time_bytes+b'\x00'*time_pad+rot_bytes
    g=copy.deepcopy(g)
    times_view=len(g['bufferViews'])
    g['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(time_bytes)})
    quat_view=len(g['bufferViews'])
    g['bufferViews'].append({'buffer':0,'byteOffset':start+len(time_bytes)+time_pad,'byteLength':len(rot_bytes)})
    time_accessor=len(g['accessors'])
    g['accessors'].append({'bufferView':times_view,'componentType':5126,'count':len(KEYS),
                           'type':'SCALAR','min':[KEYS[0][0]],'max':[KEYS[-1][0]]})
    quat_accessor=len(g['accessors'])
    g['accessors'].append({'bufferView':quat_view,'componentType':5126,'count':len(KEYS),'type':'VEC4'})
    g['animations'].append({
        'name':CLIP,
        'samplers':[{'input':time_accessor,'output':quat_accessor,'interpolation':'LINEAR'}],
        'channels':[{'sampler':0,'target':{'node':head,'path':'rotation'}}],
        'extras':{'researchOnly':True,'productionApproved':False,'requiresHeadAxisVisualCalibration':True,
                  'sequence':'first own right, through centre, then own left',
                  'doesNotMoveTorsoOrShoulders':True}
    })
    g['buffers'][0]['byteLength']=len(new_bin)
    json_chunk=json.dumps(g,ensure_ascii=False,separators=(',',':')).encode('utf8')
    json_chunk+=b' ' * (-len(json_chunk)%4)
    new_bin+=b'\x00' * (-len(new_bin)%4)
    packed=struct.pack('<III',0x46546c67,2,12+8+len(json_chunk)+8+len(new_bin))
    packed+=struct.pack('<II',len(json_chunk),GLB_JSON)+json_chunk
    packed+=struct.pack('<II',len(new_bin),GLB_BIN)+new_bin
    parsed,after_bin=parse_glb(packed)
    if after_bin[:len(old_bin)]!=old_bin or parsed['animations'][:-1] != clips:
        raise AssertionError('Existing BIN payload or original animations unexpectedly changed')
    for key in ('nodes','skins','meshes','materials'):
        if parsed.get(key)!=parse_glb(data)[0].get(key):
            raise AssertionError('Original rig, geometry or material metadata changed: '+key)
    return packed, {'sourceSha256':source_sha,'candidateSha256':hashlib.sha256(packed).hexdigest(),
                    'clipName':CLIP,'animationHeadNode':head,'keyframes':len(KEYS),
                    'originalBinaryPreserved':True,'originalAnimationsPreserved':True,
                    'onlyNewAnimationChannel':'Head.rotation',
                    'physicalHeadAxisReviewed':False,'userApproved':False,'productionApproved':False}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('v77_original_glb',type=Path)
    parser.add_argument('draft_output_glb',type=Path)
    args=parser.parse_args()
    source=args.v77_original_glb.resolve(); dest=args.draft_output_glb.resolve()
    if source==dest or dest.suffix.lower()!='.glb' or dest.exists():
        parser.error('Output must be a NEW .glb path, never overwrite any existing file')
    try:
        result,report=append_taslim(source.read_bytes())
        # No write until all baseline and invariant checks are complete.
        dest.write_bytes(result)
    except (OSError,ValueError,AssertionError) as exc:
        parser.error('DRAFT GLB REFUSED: '+str(exc))
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
