#!/usr/bin/env python3
"""Read-only independent V20 glTF QA: sclera clearance, face occlusion and eyelid continuity.
The pinned original GLB is never modified. No visual, anatomical or religious approval.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
import trimesh
import vtk

PIN = "c86e958bca638ca4e1d602994fec905c6c7fcf311769d0a16610357960bbf16a"

def locator(mesh):
    points = vtk.vtkPoints()
    points.SetDataTypeToDouble()
    for point in mesh.vertices:
        points.InsertNextPoint(*map(float, point))
    triangles = vtk.vtkCellArray()
    for face in mesh.faces:
        triangle = vtk.vtkTriangle()
        for i, vertex in enumerate(face):
            triangle.GetPointIds().SetId(i, int(vertex))
        triangles.InsertNextCell(triangle)
    poly = vtk.vtkPolyData()
    poly.SetPoints(points)
    poly.SetPolys(triangles)
    tree = vtk.vtkOBBTree()
    tree.SetDataSet(poly)
    tree.BuildLocator()
    implicit = vtk.vtkImplicitPolyDataDistance()
    implicit.SetInput(poly)
    return tree, implicit

def front_z(tree, point):
    hits, ids = vtk.vtkPoints(), vtk.vtkIdList()
    x, y = map(float, point[:2])
    tree.IntersectWithLine((x, y, 1.0), (x, y, -1.0), hits, ids)
    return max((hits.GetPoint(i)[2] for i in range(hits.GetNumberOfPoints())), default=None)

def audit(path):
    raw = path.read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != PIN:
        raise ValueError("Refuse unrecognized V20 GLB SHA: " + sha)
    scene = trimesh.load(path, force="scene", process=False)
    if len(scene.geometry) != 223:
        raise ValueError("Unexpected mesh count")
    face = scene.geometry["face_original_front_only_surface"]
    face_tree, _ = locator(face)
    report = {
        "schemaVersion": 1, "date": "2026-10-13",
        "candidate": "girl V20 unchanged, research only",
        "sourceSha256": sha, "sizeBytes": len(raw),
        "meshCount": len(scene.geometry), "skins": 0, "animations": 0,
        "faceTriangleCount": int(len(face.faces)),
        "lidResults": [], "releaseGatesApproved": 0, "productionReady": False,
        "limitations": [
            "Orthographic +Z face test, not a calibrated original-camera comparison",
            "Signed sclera distance depends on mesh winding",
            "Vertex samples do not prove triangle-level nonintersection",
            "No human visual, anatomical, religious, rig or device approval"
        ]
    }
    for side in (-1, 1):
        _, eye_implicit = locator(scene.geometry[f"{side}_eye_sclera"])
        for lid in ("upper", "lower"):
            name = f"v18_3d_{side}_{lid}_lid"
            mesh = scene.geometry[name]
            vertices = np.asarray(mesh.vertices, dtype=float)
            if vertices.shape != (495, 3):
                raise ValueError("Unexpected lid topology: " + name)
            sclera_mm = np.asarray([
                eye_implicit.EvaluateFunction(tuple(map(float, p))) * 1000
                for p in vertices
            ])
            depths = [front_z(face_tree, p) for p in vertices]
            if any(z is None for z in depths):
                raise ValueError("Unresolved front-face ray: " + name)
            face_mm = (vertices[:, 2] - np.asarray(depths)) * 1000
            ring_centers = vertices.reshape(55, 9, 3).mean(axis=1)
            jumps = np.linalg.norm(np.diff(ring_centers, axis=0), axis=1) * 1000
            report["lidResults"].append({
                "mesh": name, "vertices": 495,
                "triangles": int(len(mesh.faces)),
                "watertight": bool(mesh.is_watertight),
                "scleraMinSignedMm": round(float(sclera_mm.min()), 4),
                "scleraMedianSignedMm": round(float(np.median(sclera_mm)), 4),
                "scleraPenetrationBelowMinus0_5mm": int(np.count_nonzero(sclera_mm < -.5)),
                "scleraWithin2mmPct": round(float(np.mean(np.abs(sclera_mm) <= 2) * 100), 3),
                "faceOccludedBelowMinus0_5mm": int(np.count_nonzero(face_mm < -.5)),
                "faceOccludedPct": round(float(np.mean(face_mm < -.5) * 100), 3),
                "faceDepthMinMm": round(float(face_mm.min()), 4),
                "faceDepthMedianMm": round(float(np.median(face_mm)), 4),
                "maxAdjacentRingCenterStepMm": round(float(jumps.max()), 4)
            })
    report["allScleraClear"] = all(
        x["scleraPenetrationBelowMinus0_5mm"] == 0 for x in report["lidResults"]
    )
    report["allFaceVisible"] = all(
        x["faceOccludedBelowMinus0_5mm"] == 0 for x in report["lidResults"]
    )
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("glb", type=Path)
    parser.add_argument("report", type=Path)
    args = parser.parse_args()
    if args.report.exists():
        raise FileExistsError("Refuse overwriting previous QA")
    result = audit(args.glb)
    args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
