#!/usr/bin/env python3
"""Independent research-only face-occlusion QA on the real, SHA-pinned V20 GLB.

Orthographic front rays intersect actual face triangles. This is NOT a render,
an anatomical sign-off, a religious approval, or an original-identity check.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
import trimesh
import vtk

EXPECTED_SHA = "c86e958bca638ca4e1d602994fec905c6c7fcf311769d0a16610357960bbf16a"
LIDS = [f"v18_3d_{side}_{lid}_lid" for side in (-1, 1) for lid in ("upper", "lower")]

def face_locator(mesh):
    points = vtk.vtkPoints()
    points.SetDataTypeToDouble()
    for vertex in mesh.vertices:
        points.InsertNextPoint(*map(float, vertex))
    triangles = vtk.vtkCellArray()
    for face in mesh.faces:
        cell = vtk.vtkTriangle()
        for j, index in enumerate(face):
            cell.GetPointIds().SetId(j, int(index))
        triangles.InsertNextCell(cell)
    poly = vtk.vtkPolyData()
    poly.SetPoints(points)
    poly.SetPolys(triangles)
    locator = vtk.vtkOBBTree()
    locator.SetDataSet(poly)
    locator.BuildLocator()
    return locator

def frontmost_face_z(locator, vertex):
    x, y = map(float, vertex[:2])
    hits, cell_ids = vtk.vtkPoints(), vtk.vtkIdList()
    locator.IntersectWithLine((x, y, 1.0), (x, y, -1.0), hits, cell_ids)
    return max((hits.GetPoint(i)[2] for i in range(hits.GetNumberOfPoints())), default=None)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("glb", type=Path)
    parser.add_argument("report", type=Path)
    args = parser.parse_args()
    raw = args.glb.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    assert sha == EXPECTED_SHA, "Unrecognized V20 GLB SHA"
    scene = trimesh.load(args.glb, force="scene", process=False)
    assert len(scene.geometry) == 223
    face_name = "face_original_front_only_surface"
    assert all(np.allclose(scene.graph.get(scene.graph.geometry_nodes[n][0])[0], np.eye(4)) for n in LIDS + [face_name])
    face = scene.geometry[face_name]
    locator = face_locator(face)
    report = {
        "schemaVersion": 1,
        "date": "2026-10-13",
        "type": "independent front-view face depth QA",
        "sha256": sha,
        "modelSizeBytes": len(raw),
        "geometryCount": len(scene.geometry),
        "faceTriangleCount": len(face.faces),
        "projection": "orthographic +Z to -Z",
        "thresholdMm": 0.5,
        "lids": [],
        "limitations": [
            "Front orthographic projection only, not a calibrated camera render",
            "Only face triangles tested; no sclera, hijab or eyelash occlusion",
            "Vertex samples are not area-weighted",
            "No original-identity, rig, animation, device or religious sign-off"
        ],
        "humanVisualApproved": False,
        "religiousApproved": False,
        "releaseGatesApproved": 0,
        "productionReady": False
    }
    for name in LIDS:
        vertices = scene.geometry[name].vertices
        depths = []
        for vertex in vertices:
            face_z = frontmost_face_z(locator, vertex)
            if face_z is not None:
                depths.append((float(vertex[2]) - float(face_z)) * 1000)
        values = np.asarray(depths, dtype=float)
        assert len(values) == len(vertices) and np.isfinite(values).all()
        occluded = int(np.count_nonzero(values < -0.5))
        report["lids"].append({
            "mesh": name, "vertexCount": len(vertices), "faceRayHits": len(values),
            "faceInFrontOfLidMoreThan0_5mmCount": occluded,
            "faceInFrontOfLidMoreThan0_5mmPctOfHits": round(occluded / len(values) * 100, 3),
            "minimumLidMinusFaceDepthMm": round(float(values.min()), 4),
            "medianLidMinusFaceDepthMm": round(float(np.median(values)), 4),
            "maximumLidMinusFaceDepthMm": round(float(values.max()), 4)
        })
    assert not args.report.exists(), "Refuse to overwrite existing evidence"
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
