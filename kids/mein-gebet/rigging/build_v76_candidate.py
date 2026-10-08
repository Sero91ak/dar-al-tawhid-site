#!/usr/bin/env python3
"""Incremental REAL 3D geometry correction for Kids boy V7.6 (UNAPPROVED).
Zero image generation, no bitmap textures or face projection. Preserve mesh UV,
skin, rig and clips; only taper sleeve silhouette and tiny head attachment offset.
Values selected against stable seed-pinned v3 comparison; all five geometric silhouettes must be retested against unchanged v7.4. No manual likeness approval.
"""
from pathlib import Path
import json,struct,hashlib,numpy as np
BASE=Path(__file__).resolve().parent
SOURCE=BASE/'mein_gebet_junge_v74_sculpt_internal.glb'
OUTPUT=BASE/'mein_gebet_junge_v76_geometry_qa_only.glb'
SHOULDER_TAPER=0.20
HEAD_X_OFFSET=-0.003
raw=SOURCE.read_bytes()
assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
json_len,ct=struct.unpack_from('<II',raw,12);assert ct==0x4e4f534a
g=json.loads(raw[20:20+json_len])
bo=20+json_len;bin_len,bc=struct.unpack_from('<II',raw,bo);assert bc==0x004e4942
buffer=bytearray(raw[bo+8:bo+8+bin_len])
vertices_moved=0
changed_primitives=0
for mesh in g['meshes']:
 for p in mesh['primitives']:
  pos_acc=g['accessors'][p['attributes']['POSITION']]
  pos_view=g['bufferViews'][pos_acc['bufferView']]
  pos_offset=pos_view.get('byteOffset',0)+pos_acc.get('byteOffset',0)
  xyz=np.frombuffer(buffer,dtype='<f4',count=pos_acc['count']*3,offset=pos_offset).reshape(-1,3)
  x=xyz[:,0].copy();y=xyz[:,1].copy()
  # A smooth 3D taper on sleeve/shoulder outside the torso. The original body
  # height, cuffs, shoes and all underlying 19 rig joints remain fixed.
  shoulder=np.clip((y-1.06)/.3,0,1)*np.clip((1.76-y)/.18,0,1)
  taper=np.maximum(0,np.abs(x)-.28)*shoulder
  shift_head=HEAD_X_OFFSET*np.clip((y-1.75)/.14,0,1)
  newx=x-np.sign(x)*(SHOULDER_TAPER*taper)+shift_head
  dirty=np.abs(newx-x)>1e-7
  if not dirty.any():continue
  xyz[:,0]=newx
  vertices_moved+=int(np.count_nonzero(dirty));changed_primitives+=1
  pos_acc['min']=xyz.min(axis=0).astype(float).tolist()
  pos_acc['max']=xyz.max(axis=0).astype(float).tolist()
  # Recalculate genuine per-vertex normals from the modified triangle geometry.
  ai=g['accessors'][p['indices']];iv=g['bufferViews'][ai['bufferView']]
  io=iv.get('byteOffset',0)+ai.get('byteOffset',0)
  dtype={5123:'<u2',5125:'<u4'}[ai['componentType']]
  faces=np.frombuffer(buffer,dtype=dtype,count=ai['count'],offset=io).reshape(-1,3)
  verts=xyz.astype(np.float64)
  a,b,c=verts[faces[:,0]],verts[faces[:,1]],verts[faces[:,2]]
  normal=np.cross(b-a,c-a)
  norm=np.zeros_like(verts)
  for k in range(3):np.add.at(norm,faces[:,k],normal)
  lengths=np.linalg.norm(norm,axis=1)
  ok=lengths>1e-9
  norm[ok]/=lengths[ok,None]
  nacc=g['accessors'][p['attributes']['NORMAL']];nv=g['bufferViews'][nacc['bufferView']]
  no=nv.get('byteOffset',0)+nacc.get('byteOffset',0)
  nbuf=np.frombuffer(buffer,dtype='<f4',count=nacc['count']*3,offset=no).reshape(-1,3)
  nbuf[ok]=norm[ok].astype(np.float32)
  nlen=np.linalg.norm(nbuf,axis=1)
  nbuf[nlen>1e-6]/=nlen[nlen>1e-6,None]
  assert np.isfinite(nbuf).all()
assert vertices_moved>0
g['asset']['generator']='DAR KIDS V7.6 geometry-only shoulder refinement – QA only, not approved'
g.setdefault('extras',{})['previewOnly']=True
g['extras']['approvedForChildren']=False
g['extras']['originalLikenessApproved']=False
g['extras']['shapeRevision']='v7.6 from frozen v7.4, original five-view QA still required'
js=json.dumps(g,ensure_ascii=False,separators=(',',':')).encode('utf8');js+=b' '*(-len(js)%4)
while len(buffer)%4:buffer.append(0)
body=struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buffer),0x004e4942)+buffer
result=struct.pack('<III',0x46546c67,2,12+len(body))+body
OUTPUT.write_bytes(result)
print('SOURCE_SHA256='+hashlib.sha256(raw).hexdigest())
print('V76_SHA256='+hashlib.sha256(result).hexdigest())
print('REAL_3D_VERTICES_MODIFIED='+str(vertices_moved))
print('MATERIAL_PRIMITIVES_MODIFIED='+str(changed_primitives))
print('UNCHANGED_BONES='+str(len(g['skins'][0]['joints'])))
print('CLIPS='+','.join(a['name'] for a in g['animations']))
print('NO_IMAGE_GENERATION=true')
print('APPROVED=false')