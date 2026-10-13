#!/usr/bin/env python3
"""Read-only QA for the real girl V20 GLB. Not a release approval.
Dependencies: numpy, scipy, trimesh. Never modifies the source GLB.
Usage: python qa-girl-v20-mirror.py /path/to/V20.glb
"""
import hashlib
import json
import sys
from pathlib import Path
import numpy as np
import trimesh
from scipy.spatial import cKDTree

SOURCE_SHA = "c86e958bca638ca4e1d602994fec905c6c7fcf311769d0a16610357960bbf16a"
PARTS = ("upper_lid", "lower_lid", "lash0", "lash1", "lash2")

def inspect(path):
    raw = Path(path).read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != SOURCE_SHA:
        raise ValueError("Unexpected V20 source SHA256: " + sha)
    scene = trimesh.load(path, force="scene")
    findings = []
    topology_failures = []
    for part in PARTS:
        names = ["v18_3d_%s_%s" % (sign, part) for sign in (-1, 1)]
        left, right = [scene.geometry[n] for n in names]
        for name, mesh in zip(names, (left, right)):
            transform, _ = scene.graph[name]
            if not np.allclose(transform, np.eye(4), atol=1e-8):
                raise ValueError("Nonidentity transform needs world-space handling: " + name)
            degenerate = int(np.count_nonzero(mesh.area_faces < 1e-10))
            finding = dict(mesh=name, triangles=len(mesh.faces), vertices=len(mesh.vertices),
                           degenerateFaces=degenerate, watertight=bool(mesh.is_watertight),
                           consistentWinding=bool(mesh.is_winding_consistent))
            findings.append(finding)
            if degenerate or not mesh.is_watertight or not mesh.is_winding_consistent:
                topology_failures.append(name)
        mirrored = left.vertices.copy()
        mirrored[:, 0] *= -1
        distance, _ = cKDTree(right.vertices).query(mirrored)
        mm = distance * 1000
        findings.append(dict(part=part, method="mirrored nearest vertex (not surface Hausdorff)",
                             medianMm=round(float(np.median(mm)), 5),
                             p95Mm=round(float(np.quantile(mm, .95)), 5),
                             maxMm=round(float(np.max(mm)), 5),
                             overQuarterMm=bool(np.max(mm) > 0.25)))
    return dict(sourceSha256=sha, sourceBytes=len(raw), meshCount=len(scene.geometry),
                method="Trimesh topology and x-mirror cKDTree nearest vertex",
                findings=findings, topologyFailures=topology_failures,
                eyelashMirrorMismatchRequiresVisualReview=True,
                mirrorThresholdMm=0.25,
                identityApproved=False, anatomicalApproved=False,
                religiousApproved=False, releaseGatesApproved=0, productionReady=False)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python qa-girl-v20-mirror.py /path/to/V20.glb")
    print(json.dumps(inspect(sys.argv[1]), indent=2, ensure_ascii=False))
