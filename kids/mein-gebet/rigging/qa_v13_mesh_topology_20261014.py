#!/usr/bin/env python3
"""Read-only glTF 2.0 triangle topology audit; does not alter GLB files."""
import collections
import hashlib
import json
import struct
import sys
from pathlib import Path

COMPONENTS = {5121: "B", 5123: "H", 5125: "I"}

def audit(path):
    blob = Path(path).read_bytes()
    magic, version, declared_size = struct.unpack_from("<4sII", blob)
    if (magic, version, declared_size) != (b"glTF", 2, len(blob)):
        raise ValueError("Invalid GLB header or byte length")
    chunks, offset = [], 12
    while offset < len(blob):
        length, kind = struct.unpack_from("<I4s", blob, offset)
        offset += 8
        if offset + length > len(blob):
            raise ValueError("GLB chunk exceeds file")
        chunks.append((kind, offset, length))
        offset += length
    gltf = next(json.loads(blob[pos:pos+size]) for kind, pos, size in chunks if kind == b"JSON")
    bin_chunks = [(pos, size) for kind, pos, size in chunks if kind == b"BIN\x00"]
    if len(bin_chunks) != 1:
        raise ValueError("Expected one binary chunk")
    bin_pos, bin_size = bin_chunks[0]
    total = collections.Counter()
    affected = []
    for mesh_index, mesh in enumerate(gltf.get("meshes", [])):
        for prim_index, primitive in enumerate(mesh.get("primitives", [])):
            if primitive.get("mode", 4) != 4:
                continue
            position = gltf["accessors"][primitive["attributes"]["POSITION"]]
            if position.get("type") != "VEC3":
                raise ValueError("POSITION must be VEC3")
            vertex_count = position["count"]
            if "indices" in primitive:
                accessor = gltf["accessors"][primitive["indices"]]
                if accessor.get("type") != "SCALAR":
                    raise ValueError("Indices must be SCALAR")
                fmt = COMPONENTS[accessor["componentType"]]
                view = gltf["bufferViews"][accessor["bufferView"]]
                size = struct.calcsize("<" + fmt)
                stride = view.get("byteStride", size)
                start = bin_pos + view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
                count = accessor["count"]
                if count % 3 or (count and start + (count-1)*stride + size > bin_pos + bin_size):
                    raise ValueError("Invalid triangle index accessor")
                indices = [struct.unpack_from("<" + fmt, blob, start + i*stride)[0] for i in range(count)]
                if indices and max(indices) >= vertex_count:
                    raise ValueError("Triangle index exceeds POSITION accessor")
            else:
                # glTF triangle primitives without an index accessor use consecutive vertices.
                count = vertex_count
                if count % 3:
                    raise ValueError("Invalid non-indexed triangle vertex count")
                indices = range(count)
            edges = collections.Counter()
            winding = collections.Counter()
            repeated = 0
            for i in range(0, count, 3):
                a, b, c = indices[i:i+3]
                repeated += len({a, b, c}) != 3
                for u, v in ((a, b), (b, c), (c, a)):
                    edge = (min(u, v), max(u, v))
                    edges[edge] += 1
                    winding[edge] += 1 if u < v else -1
            boundary = sum(v == 1 for v in edges.values())
            nonmanifold = sum(v > 2 for v in edges.values())
            inconsistent = sum(v == 2 and winding[k] != 0 for k, v in edges.items())
            total.update(triangles=count//3, boundary_edges=boundary,
                         nonmanifold_edges=nonmanifold,
                         inconsistent_shared_edges=inconsistent,
                         repeated_index_triangles=repeated)
            if boundary or nonmanifold or inconsistent or repeated:
                affected.append(dict(mesh=mesh.get("name", str(mesh_index)),
                                     primitive=prim_index, boundaryEdges=boundary,
                                     nonManifoldEdges=nonmanifold,
                                     inconsistentSharedEdgeOrientation=inconsistent,
                                     repeatedIndexTriangles=repeated))
    return dict(sourceSha256=hashlib.sha256(blob).hexdigest(),
                meshCount=len(gltf.get("meshes", [])),
                skins=len(gltf.get("skins", [])),
                animations=len(gltf.get("animations", [])),
                totals=dict(total), affectedPrimitives=affected,
                approved=False,
                caveat="Open cloth surfaces may intentionally have boundary edges; this does not certify visual or religious fidelity.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python qa_v13_mesh_topology_20261014.py ORIGINAL.glb")
    print(json.dumps(audit(sys.argv[1]), ensure_ascii=False, indent=2))
