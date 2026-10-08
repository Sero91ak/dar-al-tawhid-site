#!/usr/bin/env python3
"""V7.7 KIDS internal: corrected 3D shoe silhouette only. No new images.
Preserves every GLB bone, animation, skin weight, other model primitive & original reference.
This is NOT an identity/religious/production approval.
"""
from pathlib import Path
import json,struct,hashlib,numpy as np
B=Path(__file__).resolve().parent
src=B/'mein_gebet_junge_v76_geometry_qa_only.glb'
dst=B/'mein_gebet_junge_v77_schuhe_geometry_nicht_freigegeben.glb'
EXPECTED_SHA='14d803f8c0dfc7a57a566bcd50f12b895ee4bea3008fb660f0d97dc2e62e2e2a'
raw=src.read_bytes();assert hashlib.sha256(raw).hexdigest()==EXPECTED_SHA
assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
jsize,jtype=struct.unpack_from('<II',raw,12);assert jtype==0x4e4f534a
g=json.loads(raw[20:20+jsize]);bo=20+jsize;binsize,bintype=struct.unpack_from('<II',raw,bo);assert bintype==0x004e4942
buf=bytearray(raw[bo+8:bo+8+binsize]);assert len(buf)==binsize
changed=0;shoes=0
FX,FZ=1.16,1.21
for mesh in g['meshes']:
 for p in mesh['primitives']:
  material=g['materials'][p['material']]['name']
  if material not in ('shoe-white','sole'):continue
  a=g['accessors'][p['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']]
  offset=v.get('byteOffset',0)+a.get('byteOffset',0)
  xyz=np.frombuffer(buf,dtype='<f4',count=a['count']*3,offset=offset).reshape(-1,3)
  original=xyz.copy();assert np.all(xyz[:,1]>=0) and np.all(xyz[:,1]<=0.24)
  centers=np.sign(xyz[:,0])*.227
  xyz[:,0]=centers+(xyz[:,0]-centers)*FX
  xyz[:,2]=.115+(xyz[:,2]-.115)*FZ
  assert np.array_equal(original[:,1],xyz[:,1]); assert np.isfinite(xyz).all()
  changed+=int(np.count_nonzero(np.any(np.abs(xyz-original)>1e-7,axis=1)));shoes+=1
  a['min']=xyz.min(axis=0).astype(float).tolist();a['max']=xyz.max(axis=0).astype(float).tolist()
  ia=g['accessors'][p['indices']];iv=g['bufferViews'][ia['bufferView']]
  off=iv.get('byteOffset',0)+ia.get('byteOffset',0)
  faces=np.frombuffer(buf,dtype={5123:'<u2',5125:'<u4'}[ia['componentType']],count=ia['count'],offset=off).reshape(-1,3)
  pts=xyz.astype('float64');nf=np.cross(pts[faces[:,1]]-pts[faces[:,0]],pts[faces[:,2]]-pts[faces[:,0]])
  ns=np.zeros_like(pts)
  for i in range(3):np.add.at(ns,faces[:,i],nf)
  ln=np.linalg.norm(ns,axis=1);valid=ln>1e-9;ns[valid]/=ln[valid,None]
  normalacc=g['accessors'][p['attributes']['NORMAL']];nv=g['bufferViews'][normalacc['bufferView']]
  noff=nv.get('byteOffset',0)+normalacc.get('byteOffset',0)
  normals=np.frombuffer(buf,dtype='<f4',count=normalacc['count']*3,offset=noff).reshape(-1,3)
  normals[valid]=ns[valid].astype('float32')
  ll=np.linalg.norm(normals,axis=1);normals[ll>1e-6]/=ll[ll>1e-6,None]
assert shoes==2 and changed>0
# Structural identity: no extra content/rigging or touched characters.
g['asset']['generator']='DAR KIDS V7.7 shoes-only research GLB – NOT ORIGINAL APPROVED'
g.setdefault('extras',{}).update({'previewOnly':True,'approvedForChildren':False,'originalLikenessApproved':False,'shapeRevision':'v7.7 shoe width/depth only, requires five-view recheck'})
js=json.dumps(g,ensure_ascii=False,separators=(',',':')).encode('utf8');js+=b' '*(-len(js)%4)
while len(buf)%4:buf.append(0)
chunks=struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
out=struct.pack('<III',0x46546c67,2,12+len(chunks))+chunks
dst.write_bytes(out)
print('source_sha='+EXPECTED_SHA)
print('candidate_sha='+hashlib.sha256(out).hexdigest())
print('shoe_primitives_changed='+str(shoes))
print('shoe_vertices_modified='+str(changed))
print('glb_bytes='+str(len(out)))
print('rig_joints='+str(len(g['skins'][0]['joints'])))
print('clips='+','.join(a['name'] for a in g['animations']))
print('original_identity_approved=false')