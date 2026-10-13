#!/usr/bin/env python3
"""Draft-only, SHA-pinned repair of ONE hijab-shawl index buffer; no approvals."""
import argparse, hashlib, json, struct
from pathlib import Path
import numpy as np
import trimesh

PIN = 'c86e958bca638ca4e1d602994fec905c6c7fcf311769d0a16610357960bbf16a'
NAME = 'hijab_shoulder_shawl'
def sha(b): return hashlib.sha256(b).hexdigest()
def repair(src, dst):
    src, dst = Path(src), Path(dst)
    raw = src.read_bytes()
    assert sha(raw) == PIN and not dst.exists()
    assert struct.unpack_from('<4sII', raw) == (b'glTF', 2, len(raw))
    n, kind = struct.unpack_from('<I4s', raw, 12)
    assert kind == b'JSON'
    d = json.loads(raw[20:20+n]); bin_head = 20+n
    size, kind = struct.unpack_from('<I4s', raw, bin_head)
    assert kind == b'BIN\x00' and bin_head+8+size == len(raw)
    assert not d.get('skins') and not d.get('animations')
    matches = [m for m in d['meshes'] if m.get('name') == NAME]
    assert len(matches) == 1 and len(matches[0]['primitives']) == 1
    a = d['accessors'][matches[0]['primitives'][0]['indices']]
    v = d['bufferViews'][a['bufferView']]
    assert a['componentType'] == 5125 and a['type'] == 'SCALAR'
    assert a.get('byteOffset',0) == 0 and not v.get('byteStride')
    assert a['count'] == 21600 and v['byteLength'] == 86400
    start = bin_head+8+v['byteOffset']; end = start+v['byteLength']
    faces = np.frombuffer(raw[start:end],dtype='<u4').reshape(-1,3).copy()
    scene = trimesh.load(src,force='scene',process=False)
    mesh = scene.geometry[NAME]
    assert len(scene.geometry)==223 and np.array_equal(faces,mesh.faces)
    assert mesh.is_watertight and not mesh.is_winding_consistent
    fixed = mesh.copy(); trimesh.repair.fix_winding(fixed)
    assert fixed.is_watertight and fixed.is_winding_consistent
    changed = np.where(np.any(faces != fixed.faces,axis=1))[0]
    assert len(changed)==200
    assert all(sorted(faces[i].tolist())==sorted(fixed.faces[i].tolist()) for i in changed)
    out = bytearray(raw); out[start:end] = fixed.faces.astype('<u4').tobytes()
    assert out[:start] == raw[:start] and out[end:] == raw[end:]
    dst.write_bytes(out)
    assert dst.read_bytes() == bytes(out)
    after = trimesh.load(dst,force='scene',process=False)
    assert after.geometry[NAME].is_winding_consistent
    assert np.array_equal(mesh.vertices,after.geometry[NAME].vertices)
    assert all(np.array_equal(m.faces,after.geometry[k].faces) and np.array_equal(m.vertices,after.geometry[k].vertices)
               for k,m in scene.geometry.items() if k != NAME)
    return {'status':'DRAFT_NOT_APPROVED','sourceSha256':sha(raw),'outputSha256':sha(out),
            'bytes':len(out),'meshes':223,'target':NAME,'trianglesFlipped':len(changed),
            'verticesChanged':0,'otherMeshesChanged':0,'windingConsistentBefore':False,
            'windingConsistentAfter':True,'skins':0,'animations':0,'releaseGatesApproved':0}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args()
    print(json.dumps(repair(a.source,a.output),indent=2))
