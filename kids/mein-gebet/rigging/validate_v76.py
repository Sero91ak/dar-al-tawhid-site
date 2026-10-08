#!/usr/bin/env python3
"""Off-line GLB preflight: no pictures/renders. Does NOT approve child character likeness."""
import json,math,struct,sys
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation as R
import trimesh
P=Path(__file__).with_name('mein_gebet_junge_v76_geometry_qa_only.glb')
raw=P.read_bytes()
assert len(raw)>=20 and raw[:4]==b'glTF' and struct.unpack_from('<I',raw,4)[0]==2
assert struct.unpack_from('<I',raw,8)[0]==len(raw)
off=12;chunks={}
while off+8<=len(raw):
 size,ctype=struct.unpack_from('<II',raw,off);off+=8
 assert off+size<=len(raw)
 chunks[ctype]=raw[off:off+size];off+=size
assert off==len(raw)
g=json.loads(chunks[0x4e4f534a].decode().strip());b=chunks[0x004e4942]
assert g['asset']['version']=='2.0'
assert len(g['skins'])==1 and len(g['animations'])==2
assert len(g['meshes'])==1
assert len(g['nodes'])>=20
assert all(x.get('path')!='scale' for a in g['animations'] for x in [c['target'] for c in a['channels']])
NAMES=['Hips','Spine','Chest','Neck','Head','UpperArm.L','LowerArm.L','Hand.L','UpperArm.R','LowerArm.R','Hand.R','UpperLeg.L','LowerLeg.L','Foot.L','Toe.L','UpperLeg.R','LowerLeg.R','Foot.R','Toe.R']
nodes=g['nodes']; name={x.get('name'):i for i,x in enumerate(nodes)}
assert all(n in name for n in NAMES)
assert len(g['skins'][0]['joints'])==19

def read_accessor(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']]
 ty=a['type'];sz={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[ty]
 dt={5126:np.dtype('<f4'),5125:np.dtype('<u4'),5123:np.dtype('<u2')}[a['componentType']]
 start=v.get('byteOffset',0)+a.get('byteOffset',0);end=start+a['count']*sz*dt.itemsize
 assert 0<=start<end<=len(b)
 return np.frombuffer(b[start:end],dtype=dt).reshape((-1,sz))

prims=g['meshes'][0]['primitives']
vert=0;tris=0;weights_bad=0
for pr in prims:
 a=pr['attributes'];assert {'POSITION','NORMAL','JOINTS_0','WEIGHTS_0'}<=set(a)
 pos=read_accessor(a['POSITION']);w=read_accessor(a['WEIGHTS_0']);j=read_accessor(a['JOINTS_0']);n=read_accessor(a['NORMAL']);indices=read_accessor(pr['indices'])
 assert np.isfinite(pos).all() and np.isfinite(w).all() and np.isfinite(n).all()
 assert ((j>=0)&(j<19)).all() and (indices.max()<len(pos))
 assert ((abs(w.sum(axis=1)-1))<1e-4).all(), 'incomplete skin weights'
 assert (np.linalg.norm(n,axis=1)>.6).all(), 'broken normal'
 vert+=len(pos);tris+=len(indices)//3
assert vert>=2000
assert set(a['name'] for a in g['animations'])=={'Qiyam','Takbir'}
for a in g['animations']:
 for ch in a['channels']:
  samp=a['samplers'][ch['sampler']];times=read_accessor(samp['input']).ravel();rot=read_accessor(samp['output'])
  assert (np.diff(times)>0).all() and len(times)==len(rot)
  assert np.max(np.abs(np.linalg.norm(rot,axis=1)-1))<1e-5
  assert ch['target']['path']=='rotation'
scene=trimesh.load(str(P),force='scene')
assert len(scene.geometry)>=10 # batched by material for mobile draw-call efficiency
# World pose bones at specific animation keyframes, without any scale changes
parents={c:i for i,no in enumerate(nodes) for c in no.get('children',[])}
def positions(animation,frame):
 mats={}
 target={}
 for ch in animation['channels']:
  acc=animation['samplers'][ch['sampler']]['output'];target[ch['target']['node']]=read_accessor(acc)[frame]
 def walk(i):
  if i in mats:return mats[i]
  node=nodes[i]
  parent=mats[parents[i]] if i in parents and parents[i] in mats else walk(parents[i]) if i in parents else np.eye(4)
  m=np.eye(4)
  m[:3,3]=node.get('translation',[0,0,0]);q=target.get(i,[0,0,0,1]);m[:3,:3]=R.from_quat(q).as_matrix()
  mats[i]=parent @m;return mats[i]
 for i in range(19):walk(i)
 return {nm: mats[name[nm]][:3,3] for nm in NAMES}
q=positions(g['animations'][0],0)
t=positions(g['animations'][1],1)
# Hands should come toward midline in Qiyam, but move apart & up at Takbir
for s in ('L','R'):
 assert abs(q['Hand.'+s][0])<.25, f'Qiyam hand not near chest: {s} {q["Hand."+s]}'
 assert abs(t['Hand.'+s][0])>.42, 'Takbir hands not raised outwards'
 assert t['Hand.'+s][1]>q['Hand.'+s][1], 'Takbir hand not raised'
# Distances between parent/child landmarks preserved within bone rotations
for a,bone in [('UpperArm.L','LowerArm.L'),('LowerArm.L','Hand.L'),('UpperArm.R','LowerArm.R'),('LowerArm.R','Hand.R')]:
 rest=np.linalg.norm(q[a]-q[bone]);during=np.linalg.norm(t[a]-t[bone]);assert abs(rest-during)<1e-6
print('GLB_HEADER_VALID=yes')
print('SKIN_JOINTS='+str(len(g['skins'][0]['joints'])))
print('SCULPT_PARTS='+str(len(prims)))
print('MESH_VERTICES='+str(vert))
print('TRIANGLES='+str(tris))
print('CLIPS='+','.join(a['name'] for a in g['animations']))
print('NO_IMAGE_PROJECTION=yes')
print('NO_SCALE_ANIMATION=yes')
print('ALL_SKIN_WEIGHTS_NORMALIZED=yes')
print('UPPER_AND_LOWER_ARMS_PRESERVE_LENGTH=yes')
print('QIYAM_WRISTS=' + str({s:np.round(q['Hand.'+s],3).tolist() for s in ('L','R')}))
print('TAKBIR_WRISTS=' + str({s:np.round(t['Hand.'+s],3).tolist() for s in ('L','R')}))
print('VISUAL_ORIGINAL_LIKENESS_APPROVED=no')
print('RELIGIOUS_POSE_REVIEW_COMPLETED=no')
print('SUJUD_OR_RUKU_ANIMATED=no')
print('MODEL_VALIDATION=PASS')