#!/usr/bin/env python3
"""V13.1 draft: add geometry-derived vertex normals to the *same* girl mesh.

Only additive glTF NORMAL accessors: POSITION, COLOR_0, indices, nodes and
all original BIN bytes are preserved. No identity/pose/religious approval.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

import numpy as np

EXPECTED = '3447a84a522c1a007bea3e09b59dfc0830576a198e740629070f096f95ec5547'
NAME = 'MAEDCHEN_ORIGINALGEOMETRIE_V13_1_NORMALEN_DRAFT_NICHT_FREIGEGEBEN.glb'
DTYPE = {5121: np.dtype('<u1'), 5123: np.dtype('<u2'), 5125: np.dtype('<u4'), 5126: np.dtype('<f4')}
COMPONENTS = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def load_glb(data):
    if len(data) < 28 or data[:4] != b'glTF' or struct.unpack_from('<II', data, 4) != (2, len(data)):
        raise ValueError('Invalid GLB header')
    n, kind = struct.unpack_from('<I4s', data, 12)
    if kind != b'JSON' or n > len(data) - 28 or n % 4:
        raise ValueError('Invalid JSON chunk')
    j = json.loads(data[20:20+n])
    at = 20 + n
    size, kind = struct.unpack_from('<I4s', data, at)
    if kind != b'BIN\0' or at + 8 + size != len(data):
        raise ValueError('Invalid BIN chunk')
    b = data[at+8:]
    if len(j.get('buffers', [])) != 1 or j['buffers'][0]['byteLength'] > len(b):
        raise ValueError('Unsupported GLB buffer layout')
    return j, b


def read_accessor(j, b, ai):
    a = j['accessors'][ai]
    if a.get('sparse') or a.get('normalized') or a['componentType'] not in DTYPE:
        raise ValueError('Unsupported sparse/normalized accessor')
    v = j['bufferViews'][a['bufferView']]
    if v.get('buffer', 0) != 0:
        raise ValueError('Unexpected buffer')
    dtype = DTYPE[a['componentType']]
    cols = COMPONENTS[a['type']]
    size = dtype.itemsize * cols
    stride = v.get('byteStride', size)
    offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    count = a['count']
    if stride < size or offset < 0 or offset + (count-1)*stride + size > len(b):
        raise ValueError('Accessor out of range')
    return np.ndarray((count, cols), dtype=dtype, buffer=b, offset=offset, strides=(stride, dtype.itemsize)).copy()


def build(data):
    if hashlib.sha256(data).hexdigest() != EXPECTED:
        raise ValueError('Source V13 SHA-256 mismatch')
    j, original = load_glb(data)
    if len(j.get('meshes', [])) != 213 or j.get('skins') or j.get('animations'):
        raise ValueError('Unexpected V13 mesh/rig structure')
    appended = bytearray(original)
    counts = {'meshes': 0, 'normals': 0, 'doubleSidedFacesIgnored': 0, 'unresolvedNormals': 0}
    for mesh in j['meshes']:
        for prim in mesh['primitives']:
            if 'NORMAL' in prim['attributes'] or 'POSITION' not in prim['attributes'] or 'indices' not in prim:
                raise ValueError('Unexpected mesh attributes')
            points = read_accessor(j, original, prim['attributes']['POSITION']).astype(np.float64)
            indices = read_accessor(j, original, prim['indices']).reshape(-1)
            if len(indices) % 3 or len(indices) == 0 or int(indices.max()) >= len(points):
                raise ValueError('Invalid triangle indices')
            tris = indices.reshape(-1, 3).astype(np.int64)
            faces = tris
            if len(tris) % 2 == 0:
                n = len(tris) // 2
                if np.array_equal(tris[n:], tris[:n][:, [0, 2, 1]]):
                    faces = tris[:n]
                    counts['doubleSidedFacesIgnored'] += n
            edges1 = points[faces[:, 1]] - points[faces[:, 0]]
            edges2 = points[faces[:, 2]] - points[faces[:, 0]]
            cross = np.cross(edges1, edges2)
            normals = np.zeros_like(points)
            for k in range(3):
                np.add.at(normals, faces[:, k], cross)
            lengths = np.linalg.norm(normals, axis=1)
            good = lengths > 1e-12
            if not np.any(good):
                raise ValueError('Mesh has no valid face normals')
            referenced = np.zeros(len(points), dtype=bool)
            referenced[faces.ravel()] = True
            if np.any(~good & referenced):
                valid = np.flatnonzero(good)
                for idx in np.flatnonzero(~good & referenced):
                    near = valid[np.argmin(np.sum((points[valid] - points[idx])**2, axis=1))]
                    normals[idx] = normals[near]
                lengths = np.linalg.norm(normals, axis=1)
                good = lengths > 1e-12
            normals[good] /= lengths[good, None]
            normals[~good] = [0, 1, 0]
            if not np.isfinite(normals).all():
                raise ValueError('Nonfinite normal')
            offset = len(appended)
            payload = normals.astype('<f4').tobytes()
            appended.extend(payload)
            vi = len(j['bufferViews'])
            j['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(payload), 'target': 34962})
            ai = len(j['accessors'])
            j['accessors'].append({'bufferView': vi, 'componentType': 5126, 'count': len(points), 'type': 'VEC3'})
            prim['attributes']['NORMAL'] = ai
            counts['meshes'] += 1
            counts['normals'] += len(points)
            counts['unresolvedNormals'] += int(np.count_nonzero(~good & referenced))
    j['buffers'][0]['byteLength'] = len(appended)
    encoded = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode('utf8')
    encoded += b' ' * (-len(encoded) % 4)
    appended.extend(b'\0' * (-len(appended) % 4))
    out = (struct.pack('<4sII', b'glTF', 2, 12+8+len(encoded)+8+len(appended)) +
           struct.pack('<I4s', len(encoded), b'JSON') + encoded +
           struct.pack('<I4s', len(appended), b'BIN\0') + appended)
    return out, counts


def main():
    p = argparse.ArgumentParser()
    p.add_argument('source', type=Path)
    p.add_argument('--output-dir', type=Path, required=True)
    args = p.parse_args()
    out, counts = build(args.source.read_bytes())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    target = args.output_dir / NAME
    with target.open('xb') as f:
        f.write(out)
    print(json.dumps({'sourceSHA256': EXPECTED, 'candidateSHA256': hashlib.sha256(out).hexdigest(),
                      'bytes': len(out), 'path': str(target), 'status': 'DRAFT_NOT_APPROVED',
                      'checks': counts}, indent=2))


if __name__ == '__main__':
    main()
