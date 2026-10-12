#!/usr/bin/env python3
"""Reproduce a REAL GLB geometry study: V13.2 back-hijab V hem.
Only one mesh POSITION accessor is modified. All other mesh positions,
indices, colors and identity features are preserved. NO visual/fiqh release.
Use only the pinned V13 native GLB from the protected Drive folder.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

import numpy as np

SOURCE_SHA = "ad9368c3a1e939964cc18f8c8aff770fcc348e8ae6b1aa3d787e3be84a905e12"
CANDIDATE_SHA = "fcc26af8e45c98376aec5048c224d2813e5c610542183a65c748318519265aac"
MESH = "hijab_shoulder_shawl"


def sculpt(vertices):
    out = vertices.astype(np.float64).copy()
    x, y, z = out.T
    rear = np.clip((-z - .035) / .245, 0, 1) ** 2
    middle = np.clip(1 - np.abs(x) / .32, 0, 1) ** 1.7
    low = np.clip((1.92 - y) / .42, 0, 1) ** 2
    out[:, 1] += (-.205 * middle + .060 * (1 - middle)) * rear * low
    out[:, 2] -= .020 * middle * rear * low
    return out.astype("<f4")


def make_candidate(source, destination):
    raw = source.read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA:
        raise ValueError("Wrong V13 source SHA; refusing to sculpt")
    magic, version, total = struct.unpack_from("<4sII", raw, 0)
    if (magic, version, total) != (b"glTF", 2, len(raw)):
        raise ValueError("Not a valid GLB 2.0 header")
    jlen, jtype = struct.unpack_from("<I4s", raw, 12)
    if jtype != b"JSON":
        raise ValueError("No GLB JSON chunk")
    doc = json.loads(raw[20:20 + jlen])
    bo = 20 + jlen
    blen, btype = struct.unpack_from("<I4s", raw, bo)
    if btype != b"BIN\x00":
        raise ValueError("No GLB BIN chunk")
    binary = bytearray(raw[bo + 8:bo + 8 + blen])
    meshes = [m for m in doc["meshes"] if m.get("name") == MESH]
    if len(meshes) != 1:
        raise ValueError("Expected exactly one shawl mesh")
    pos_index = meshes[0]["primitives"][0]["attributes"]["POSITION"]
    accessor = doc["accessors"][pos_index]
    bv = doc["bufferViews"][accessor["bufferView"]]
    if accessor["componentType"] != 5126 or accessor["type"] != "VEC3" or bv.get("byteStride", 12) != 12:
        raise ValueError("Unexpected vertex accessor")
    off = bv.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    xyz = np.frombuffer(binary, dtype="<f4", count=accessor["count"] * 3, offset=off).reshape((-1, 3)).copy()
    result = sculpt(xyz)
    if not np.isfinite(result).all() or np.count_nonzero(np.linalg.norm(result - xyz, axis=1) > 1e-6) != 104:
        raise ValueError("Unexpected geometry change")
    np.copyto(np.frombuffer(binary, dtype="<f4", count=result.size, offset=off).reshape(result.shape), result)
    accessor["min"] = result.min(axis=0).astype(float).tolist()
    accessor["max"] = result.max(axis=0).astype(float).tolist()
    js = json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    js += b" " * ((-len(js)) % 4)
    if len(binary) % 4:
        raise ValueError("BIN alignment invalid")
    glb = struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(binary))
    glb += struct.pack("<I4s", len(js), b"JSON") + js
    glb += struct.pack("<I4s", len(binary), b"BIN\x00") + binary
    if hashlib.sha256(glb).hexdigest() != CANDIDATE_SHA:
        raise ValueError("Candidate GLB differs from independently checked binary")
    if destination.exists():
        raise FileExistsError("Refusing overwrite: " + str(destination))
    destination.write_bytes(glb)
    return {"sha256": CANDIDATE_SHA, "bytes": len(glb), "changedMesh": MESH,
            "changedVertices": 104, "skins": 0, "animations": 0,
            "sourceIdentityApproved": False, "productionReady": False}


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("source", type=Path)
    p.add_argument("output", type=Path)
    a = p.parse_args()
    print(json.dumps(make_candidate(a.source, a.output), indent=2))
