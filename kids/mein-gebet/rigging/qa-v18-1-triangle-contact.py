#!/usr/bin/env python3
"""Strict independent GLB V18.1 contact gate. RESEARCH ONLY, not approved."""
import sys, json, hashlib
import numpy as np
import trimesh
import vtk
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray

def sha(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

def fingerprint(mesh):
    return hashlib.sha256(np.asarray(mesh.vertices, dtype=np.float32).tobytes()).hexdigest()

def make_locator(meshes):
    vertices, faces, offset = [], [], 0
    for mesh in meshes:
        v = np.asarray(mesh.vertices, dtype=np.float64)
        f = np.asarray(mesh.faces, dtype=np.int64)
        vertices.append(v)
        faces.append(f + offset)
        offset += len(v)
    vertices, faces = np.concatenate(vertices), np.concatenate(faces)
    points = vtk.vtkPoints()
    points.SetData(numpy_to_vtk(vertices, deep=True))
    poly = vtk.vtkPolyData()
    poly.SetPoints(points)
    cells = vtk.vtkCellArray()
    cells.SetCells(len(faces), numpy_to_vtkIdTypeArray(np.column_stack([np.full(len(faces), 3), faces]).astype(np.int64).ravel(), deep=True))
    poly.SetPolys(cells)
    locator = vtk.vtkStaticCellLocator()
    locator.SetDataSet(poly)
    locator.BuildLocator()
    return locator

def distances(locator, vertices):
    values = []
    for v in vertices:
        closest = [0., 0., 0.]
        locator.FindClosestPoint(v.tolist(), closest, vtk.vtkGenericCell(), vtk.reference(0), vtk.reference(0), distance_sq := vtk.reference(0.))
        values.append(float(distance_sq) ** 0.5)
    return np.asarray(values)

def check(source, candidate):
    a = trimesh.load(source, force="scene", process=False)
    b = trimesh.load(candidate, force="scene", process=False)
    assert len(a.geometry) == len(b.geometry) == 223
    assert set(a.geometry) == set(b.geometry)
    changed = {f"v18_3d_{side}_{label}_lid" for side in (-1, 1) for label in ("upper", "lower")}
    for name in a.geometry:
        if name not in changed:
            assert fingerprint(a.geometry[name]) == fingerprint(b.geometry[name]), "Protected mesh changed: " + name
    result = []
    for side in (-1, 1):
        locator = make_locator([a.geometry[f"{side}_eye_{part}"] for part in ("sclera", "iris", "pupil", "glint")])
        for label in ("upper", "lower"):
            name = f"v18_3d_{side}_{label}_lid"
            old = distances(locator, np.asarray(a.geometry[name].vertices))
            new = distances(locator, np.asarray(b.geometry[name].vertices))
            assert np.median(new) < np.median(old), "Median surface contact not improved"
            result.append({"side": side, "lid": label, "beforeMedianMm": round(float(np.median(old) * 1000), 3), "afterMedianMm": round(float(np.median(new) * 1000), 3)})
    return {"sourceSha256": sha(source), "candidateSha256": sha(candidate), "protectedMeshes": 219, "contact": result, "releaseGatesApproved": 0, "visualReviewApproved": False, "collisionFreeApproved": False, "productionReady": False}

if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Usage: qa-v18-1-triangle-contact.py ORIGINAL_V18.glb RESEARCH_V18_1.glb")
    print(json.dumps(check(sys.argv[1], sys.argv[2]), indent=2))
