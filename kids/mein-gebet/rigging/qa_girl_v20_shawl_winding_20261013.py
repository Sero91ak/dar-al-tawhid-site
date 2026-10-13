#!/usr/bin/env python3
"""Read-only actual-GLB topology QA for the original V20 shoulder shawl.

Usage: python qa_girl_v20_shawl_winding_20261013.py model.glb [report.json]
Dependencies: numpy, trimesh. Never edits the model or grants release approval.
"""
import collections
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
import trimesh

MESHES = (
    "hijab_hood_continuous_sculpted_v13",
    "hijab_face_rim_connected_v13",
    "hijab_continuous_sculpted_chest_drape",
    "hijab_shoulder_shawl",
)

def check(mesh):
    edges = collections.defaultdict(list)
    faces = np.asarray(mesh.faces, dtype=np.int64)
    for face_id, (a, b, c) in enumerate(faces):
        for u, v in ((a, b), (b, c), (c, a)):
            u, v = int(u), int(v)
            edges[(min(u, v), max(u, v))].append((u, v, face_id))
    bad = [(edge, pair) for edge, pair in edges.items()
           if len(pair) == 2 and pair[0][:2] == pair[1][:2]]
    return {
        "vertices": int(len(mesh.vertices)),
        "triangles": int(len(faces)),
        "unique_edges": len(edges),
        "boundary_edges": sum(len(x) == 1 for x in edges.values()),
        "nonmanifold_edges": sum(len(x) > 2 for x in edges.values()),
        "shared_edges_same_direction": len(bad),
        "winding_consistent": bool(mesh.is_winding_consistent),
        "watertight": bool(mesh.is_watertight),
        "degenerate_triangles_area_below_1e_minus_11":
            int(np.count_nonzero(mesh.area_faces < 1e-11)),
        "example_inconsistent_edges": [
            {"edge_vertex_ids": list(e), "adjacent_face_ids": [v[2] for v in pair]}
            for e, pair in bad[:8]
        ],
    }

def main():
    path = Path(sys.argv[1])
    binary = path.read_bytes()
    scene = trimesh.load(path, force="scene", process=False)
    result = {}
    for name in MESHES:
        if name not in scene.geometry:
            raise RuntimeError("Missing protected mesh: " + name)
        result[name] = check(scene.geometry[name])
    report = {
        "date": "2026-10-13",
        "status": "NOT_APPROVED",
        "read_only": True,
        "file_name": path.name,
        "file_size_bytes": len(binary),
        "sha256": hashlib.sha256(binary).hexdigest(),
        "mesh_results": result,
        "interpretation": (
            "Same-direction shared edges prove inconsistent triangle winding, "
            "but not by themselves a visible rendering defect. Check independent "
            "calibrated real-GLB cameras before changing geometry."
        ),
        "release_gates_approved": 0,
    }
    output = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(output, encoding="utf-8")
    print(output)

if __name__ == "__main__":
    main()
