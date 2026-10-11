import copy
import hashlib
import json
import math
from pathlib import Path
import struct
import unittest
from append_taslim_draft import append_taslim,parse_glb,CLIP,KEYS

NAMES=['Hips','Spine','Chest','Neck','Head','UpperArm.L','LowerArm.L','Hand.L',
      'UpperArm.R','LowerArm.R','Hand.R','UpperLeg.L','LowerLeg.L','Foot.L',
      'Toe.L','UpperLeg.R','LowerLeg.R','Foot.R','Toe.R']

def fixture():
 nodes=[{'name':n,'rotation':[0,0,0,1]} for n in NAMES]
 nodes[3]['children']=[4]
 g={'asset':{'version':'2.0'},'nodes':nodes,'skins':[{'joints':list(range(19))}],
    'meshes':[{'primitives':[{'attributes':{'POSITION':0,'JOINTS_0':1,'WEIGHTS_0':2}}]}],
    'materials':[{'name':'synthetic-do-not-use'}],
    'animations':[{'name':'Qiyam','channels':[],'samplers':[]},{'name':'Takbir','channels':[],'samplers':[]}],
    'buffers':[{'byteLength':16}],
    'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':16}],
    'accessors':[{'bufferView':0,'type':'VEC3','componentType':5126,'count':1}]}
 return repack(g,b'0123456789abcdef')

def repack(g,bin):
 raw=json.dumps(g,separators=(',',':')).encode();raw+=b' '*(-len(raw)%4)
 bin+=b'\x00'*(-len(bin)%4)
 return struct.pack('<III',0x46546c67,2,12+8+len(raw)+8+len(bin))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(bin),0x004e4942)+bin

class TaslimExporterTest(unittest.TestCase):
 def setUp(self):
  self.src=fixture();self.sha=hashlib.sha256(self.src).hexdigest()

 def patch(self,data=None):
  return append_taslim(data if data is not None else self.src,self.sha)

 def test_original_model_sha_is_required(self):
  with self.assertRaisesRegex(ValueError,'pinned original'):
   append_taslim(self.src)

 def test_export_has_one_head_rotation_animation_and_keeps_body(self):
  src,bin0=parse_glb(self.src); result,report=self.patch();final,bin1=parse_glb(result)
  self.assertEqual(final['animations'][:2],src['animations'])
  self.assertEqual(final['nodes'],src['nodes'])
  self.assertEqual(final['skins'],src['skins'])
  self.assertEqual(final['meshes'],src['meshes'])
  self.assertEqual(final['materials'],src['materials'])
  self.assertTrue(bin1.startswith(bin0))
  self.assertEqual(len(final['animations']),3)
  a=final['animations'][2]
  self.assertEqual(a['name'],CLIP)
  self.assertEqual(a['channels'],[{'sampler':0,'target':{'node':4,'path':'rotation'}}])
  self.assertIs(report['productionApproved'],False)
  self.assertIs(report['physicalHeadAxisReviewed'],False)

 def test_sampling_right_then_center_then_left_with_quaternions(self):
  output,_=self.patch()
  g,b=parse_glb(output);a=g['accessors'][-1];v=g['bufferViews'][a['bufferView']]
  rotations=[struct.unpack_from('<4f',b,v['byteOffset']+16*i) for i in range(a['count'])]
  self.assertEqual(len(rotations),len(KEYS))
  self.assertAlmostEqual(rotations[0][1],0,places=6)
  self.assertLess(rotations[1][1],-.45)
  self.assertAlmostEqual(rotations[3][1],0,places=6)
  self.assertGreater(rotations[4][1],.45)
  for q in rotations:self.assertAlmostEqual(sum(x*x for x in q),1,places=5)

 def test_nonzero_valid_rest_rotation_is_composed(self):
  g,b=parse_glb(self.src)
  g['nodes'][4]['rotation']=[0,0,math.sin(.2),math.cos(.2)]
  src=repack(g,b)
  output,_=append_taslim(src,hashlib.sha256(src).hexdigest())
  patched,buf=parse_glb(output);a=patched['accessors'][-1];v=patched['bufferViews'][a['bufferView']]
  rotation=struct.unpack_from('<4f',buf,v['byteOffset'])
  self.assertAlmostEqual(rotation[2],math.sin(.2),places=5)
  self.assertAlmostEqual(rotation[3],math.cos(.2),places=5)

 def test_reject_wrong_head_chain(self):
  g,b=parse_glb(self.src)
  g['nodes'][3].pop('children')
  bad=repack(g,b)
  with self.assertRaisesRegex(ValueError,'Head must be'):
   append_taslim(bad,hashlib.sha256(bad).hexdigest())

 def test_reject_duplicate_salam_clip(self):
  g,b=parse_glb(self.src)
  g['animations'].append({'name':'Salam','channels':[],'samplers':[]})
  bad=repack(g,b)
  with self.assertRaisesRegex(ValueError,'already exists'):
   append_taslim(bad,hashlib.sha256(bad).hexdigest())

 def test_reject_unexpected_skin_size(self):
  g,b=parse_glb(self.src)
  g['skins'][0]['joints']=[4]
  bad=repack(g,b)
  with self.assertRaisesRegex(ValueError,'19-joint'):
   append_taslim(bad,hashlib.sha256(bad).hexdigest())

 def test_reject_invalid_malformed_header(self):
  with self.assertRaisesRegex(ValueError,'glTF 2.0'):
   append_taslim(b'not a binary file',hashlib.sha256(b'not a binary file').hexdigest())

 def test_original_input_unchanged(self):
  before=bytes(self.src)
  self.patch()
  self.assertEqual(self.src,before)

if __name__=='__main__':unittest.main(verbosity=2)
