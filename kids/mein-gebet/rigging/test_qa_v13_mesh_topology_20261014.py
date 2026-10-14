#!/usr/bin/env python3
"""Synthetic GLB regression tests for the read-only 3D mesh topology audit.

Run from kids/mein-gebet/rigging/: python test_qa_v13_mesh_topology_20261014.py
These synthetic fixtures DO NOT replace original-image, actual-GLB, or prayer QA.
"""
import json
import struct
import tempfile
from pathlib import Path
from qa_v13_mesh_topology_20261014 import audit


def _chunk(kind, payload, pad=b"\x00"):
    payload += pad * ((-len(payload)) % 4)
    return struct.pack("<I4s", len(payload), kind) + payload


def _glb(indices, vertex_count=5, indexed=True):
    positions = b"".join(struct.pack("<fff", float(i), 0.0, 0.0) for i in range(vertex_count))
    index_bytes = struct.pack("<" + "H" * len(indices), *indices)
    binary = positions + index_bytes
    prim = {"attributes": {"POSITION": 0}, "mode": 4}
    if indexed:
        prim["indices"] = 1
    doc = {"asset": {"version": "2.0"}, "buffers": [{"byteLength": len(binary)}],
           "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": len(positions)},
                           {"buffer": 0, "byteOffset": len(positions), "byteLength": len(index_bytes)}],
           "accessors": [{"bufferView": 0, "componentType": 5126, "count": vertex_count, "type": "VEC3"},
                         {"bufferView": 1, "componentType": 5123, "count": len(indices), "type": "SCALAR"}],
           "meshes": [{"name": "synthetic", "primitives": [prim]}],
           "nodes": [{"mesh": 0}], "scenes": [{"nodes": [0]}], "scene": 0}
    chunks = _chunk(b"JSON", json.dumps(doc, separators=(",", ":")).encode(), b" ") + _chunk(b"BIN\x00", binary)
    return struct.pack("<4sII", b"glTF", 2, 12 + len(chunks)) + chunks


def _run(blob):
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / "fixture.glb"
        p.write_bytes(blob)
        return audit(p)


def test_topology():
    one = _run(_glb([0, 1, 2]))["totals"]
    assert (one["triangles"], one["boundary_edges"], one["nonmanifold_edges"]) == (1, 3, 0), one

    # Closed, consistently oriented tetrahedron (no boundary or inconsistent shared edge).
    tetra = _run(_glb([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3], 4))["totals"]
    assert (tetra["boundary_edges"], tetra["nonmanifold_edges"], tetra["inconsistent_shared_edges"]) == (0, 0, 0), tetra

    # Two triangles with the same directed shared edge: a winding inconsistency.
    wrong = _run(_glb([0, 1, 2, 0, 1, 3]))["totals"]
    assert wrong["inconsistent_shared_edges"] == 1, wrong

    # Three triangles sharing one edge: non-manifold geometry.
    nonmanifold = _run(_glb([0, 1, 2, 1, 0, 3, 0, 1, 4]))["totals"]
    assert nonmanifold["nonmanifold_edges"] == 1, nonmanifold

    repeated = _run(_glb([0, 0, 1]))["totals"]
    assert repeated["repeated_index_triangles"] == 1, repeated

    try:
        _run(_glb([0, 1, 9]))
    except ValueError as exc:
        assert "exceeds POSITION" in str(exc), exc
    else:
        raise AssertionError("Out-of-range indices were not rejected")

    # Known coverage gap in current audit: unindexed triangles are silently skipped.
    unindexed = _run(_glb([0, 1, 2], 3, indexed=False))
    assert unindexed["totals"].get("triangles", 0) == 0, unindexed
    assert unindexed["approved"] is False
    print("PASS: 7 synthetic topology cases; WARNING: unindexed primitives are not audited.")


if __name__ == "__main__":
    test_topology()
