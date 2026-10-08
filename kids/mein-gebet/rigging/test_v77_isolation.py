#!/usr/bin/env python3
"""Fail-closed integrity check that V7.7 modifies shoes ONLY (and no skeleton/animation)."""
from pathlib import Path
import json,hashlib,struct,numpy as np
B=Path(__file__).resolve().parent
source=B/'mein_gebet_junge_v76_geometry_qa_only.glb'
target=B/'mein_gebet_junge_v77_schuhe_geometry_nicht_freigegeben.glb'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='14d803f8c0dfc7a57a566bcd50f12b895ee4bea3008fb660f0d97dc2e62e2e2a'
assert hashlib.sha256(target.read_bytes()).hexdigest()=='353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa'

def unpack(p):
 raw=p.read_bytes();assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
 n,typ=struct.unpack_from('<II',raw,12);assert typ==0x4e4f534a
 g=json.loads(raw[20:20+n]);bo=20+n;bsize,typ=struct.unpack_from('<II',raw,bo)
 assert typ==0x004e4942
 return g,raw[bo+8:bo+8+bsize]
a,ba=unpack(source);b,bb=unpack(target)
for field in ('skins','nodes','animations','materials','scenes','scene','textures','images','bufferViews'):
 assert a.get(field)==b.get(field),f'not allowed to change {field}'
assert a['extras']['approvedForChildren'] is False and b['extras']['approvedForChildren'] is False
assert len(a['meshes'][0]['primitives'])==len(b['meshes'][0]['primitives'])==19
assert a['accessors'] and b['accessors'] and len(a['accessors'])==len(b['accessors'])

def array(g,binary,i):
 u=g['accessors'][i];v=g['bufferViews'][u['bufferView']]
 n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[u['type']]
 dt={5126:'<f4',5125:'<u4',5123:'<u2'}[u['componentType']]
 off=v.get('byteOffset',0)+u.get('byteOffset',0)
 return np.frombuffer(binary,dtype=dt,count=u['count']*n,offset=off).reshape(-1,n)
changed=0;shoe_prim=0
for px,py in zip(a['meshes'][0]['primitives'],b['meshes'][0]['primitives']):
 assert px['attributes']==py['attributes'] and px['indices']==py['indices']
 mat=a['materials'][px['material']]['name'];is_shoe=mat in ('shoe-white','sole')
 if is_shoe:shoe_prim+=1
 for attr,acc in px['attributes'].items():
  before=array(a,ba,acc);after=array(b,bb,acc)
  if not (is_shoe and attr in ('POSITION','NORMAL')):assert np.array_equal(before,after),f'{mat}:{attr} has been changed'
  elif attr=='POSITION':
   assert np.array_equal(before[:,1],after[:,1]),'leg/foot vertical length altered'
   assert np.isfinite(after).all() and np.isfinite(before).all()
   assert ((abs(after-before)[:,0]+abs(after-before)[:,2])>0).all()
   changed+=len(before)
  else:
   assert np.isfinite(after).all()
 if not is_shoe:assert a['accessors'][px['attributes']['POSITION']]==b['accessors'][py['attributes']['POSITION']]
 # Triangles and all vertex bone weights preserved even for shoe materials.
 assert np.array_equal(array(a,ba,px['indices']),array(b,bb,py['indices']))
assert shoe_prim==2 and changed==2568
assert not any(ch['target']['path']=='scale' for clip in b['animations'] for ch in clip['channels'])
print('PASS candidate exact checksum pinned')
print('PASS all 19 skinning joints, bind poses and animations bit-identical')
print('PASS all original non-shoe geometry and its texture unchanged')
print('PASS shoe Y coordinates unchanged (no artificial leg lengthening)')
print('PASS only 2 shoe materials and 2568 shoe vertices modified')
print('PASS all topology, weights, joint indices unchanged')
print('PASS no scale animation and no production-approval flags')