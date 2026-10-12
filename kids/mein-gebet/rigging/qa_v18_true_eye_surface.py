#!/usr/bin/env python3
"""Independent V18 real-GLB eyelid-to-eye TRIANGLE-surface QA (never a release approval).

Requires: trimesh, numpy, vtk. Run with exact original V15 and V18 GLB bytes.
Unlike nearest-VERTEX metrics, this computes unsigned closest actual triangle
surface distance to sclera, iris, pupil and glint. This is NOT collision or
human visual identity certification. Never run on substituted synthetic models.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

import numpy as np
import trimesh
import vtk

SOURCE_SHA = "44e75d268426d36a5f6e040437c5874bfc81d9ff5e07adf15def49f845f20321"
CANDIDATE_SHA = "a8e9cea28945c60e1b6d6416d36bc73988694070b73340096797db81a907d54b"


def glb_json(blob):
    assert blob[:4] == b"glTF" and struct.unpack_from("<I", blob, 4)[0] == 2
    assert struct.unpack_from("<I", blob, 8)[0] == len(blob)
    size, chunk = struct.unpack_from("<I4s", blob, 12)
    assert chunk == b"JSON"
    return json.loads(blob[20:20 + size])


def locator(mesh):
    points = vtk.vtkPoints()
    for v in mesh.vertices:
        points.InsertNextPoint(*map(float, v))
    cells = vtk.vtkCellArray()
    for tri in mesh.faces:
        cells.InsertNextCell(3)
        for idx in tri:
            cells.InsertCellPoint(int(idx))
    poly = vtk.vtkPolyData()
    poly.SetPoints(points)
    poly.SetPolys(cells)
    loc = vtk.vtkStaticCellLocator()
    loc.SetDataSet(poly)
    loc.BuildLocator()
    return loc


def surface_distances(loc, vertices):
    closest = [0., 0., 0.]
    cell = vtk.vtkGenericCell()
    cell_id, sub_id, d2 = vtk.mutable(0), vtk.mutable(0), vtk.mutable(0.)
    distances = []
    for vertex in vertices:
        loc.FindClosestPoint([float(v) for v in vertex], closest, cell, cell_id, sub_id, d2)
        distances.append(float(d2) ** .5)
    return np.asarray(distances)


def audit(source_path, candidate_path):
    source_bytes, candidate_bytes = Path(source_path).read_bytes(), Path(candidate_path).read_bytes()
    source_sha, candidate_sha = hashlib.sha256(source_bytes).hexdigest(), hashlib.sha256(candidate_bytes).hexdigest()
    assert source_sha == SOURCE_SHA, "Unexpected source binary SHA"
    assert candidate_sha == CANDIDATE_SHA, "Unexpected candidate binary SHA"
    gltf = glb_json(candidate_bytes)
    assert not gltf.get("skins") and not gltf.get("animations")
    src = trimesh.load(source_path, force="scene", process=False)
    dst = trimesh.load(candidate_path, force="scene", process=False)
    assert len(src.geometry) == 213 and len(dst.geometry) == 223
    assert set(src.geometry).issubset(dst.geometry)
    allowed = {f"{side}_eye_{part}" for side in (-1, 1) for part in ("sclera", "iris", "pupil", "glint")}
    changed = set()
    for name, old in src.geometry.items():
        new = dst.geometry[name]
        assert np.array_equal(old.faces, new.faces), f"Unexpected topology: {name}"
        if name in allowed:
            assert old.vertices.shape == new.vertices.shape
            assert not np.array_equal(old.vertices, new.vertices)
            changed.add(name)
        else:
            assert np.array_equal(old.vertices, new.vertices), f"Protected geometry modified: {name}"
            assert np.array_equal(np.asarray(old.visual.vertex_colors), np.asarray(new.visual.vertex_colors)), f"Protected colors modified: {name}"
    assert changed == allowed
    assert len(set(dst.geometry) - set(src.geometry)) == 10

    results = []
    for side in (-1, 1):
        eye_surfaces = [locator(dst.geometry[f"{side}_eye_{part}"]) for part in ("sclera", "iris", "pupil", "glint")]
        for mode in ("upper", "lower"):
            vertices = dst.geometry[f"v18_3d_{side}_{mode}_lid"].vertices
            d = np.min(np.stack([surface_distances(loc, vertices) for loc in eye_surfaces]), axis=0)
            results.append({
                "side": side, "lid": mode, "sampledVertices": len(vertices),
                "triangleSurfaceMedianMm": round(float(np.median(d) * 1000), 4),
                "triangleSurfaceP95Mm": round(float(np.percentile(d, 95) * 1000), 4),
                "triangleSurfaceMinMm": round(float(np.min(d) * 1000), 4),
                "within1mmPercent": round(float(np.mean(d <= .001) * 100), 2),
                "within2mmPercent": round(float(np.mean(d <= .002) * 100), 2),
            })
    assert all(r["within2mmPercent"] == 0.0 for r in results if r["lid"] == "lower")
    return {
        "schemaVersion": 1, "asOf": "2026-10-12", "sourceSha256": source_sha,
        "candidateSha256": candidate_sha, "candidateBytes": len(candidate_bytes),
        "sourceMeshes": len(src.geometry), "candidateMeshes": len(dst.geometry),
        "unchangedProtectedMeshes": 205, "addedReal3DMeshes": 10,
        "method": "VTK StaticCellLocator closest TRIANGLE surface, union of sclera/iris/pupil/glint",
        "results": results,
        "finding": "Both lower eyelids have 0% vertices within 2mm of any eye surface; upper eyelids have only 25.66%. Nearest-VERTEX improvements do not prove physical surface contact.",
        "physicalContactApproved": False, "collisionFreeApproved": False,
        "originalLikenessApproved": False, "humanReviewApproved": False,
        "rigged": False, "animationCount": 0, "releaseGatesApproved": 0,
        "productionReady": False, "mergeMain": False, "liveDeploy": False,
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--source", required=True)
    p.add_argument("--candidate", required=True)
    p.add_argument("--output", required=True)
    a = p.parse_args()
    result = audit(a.source, a.candidate)
    Path(a.output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"sha": result["candidateSha256"], "results": result["results"], "approved": False}, ensure_ascii=False))
