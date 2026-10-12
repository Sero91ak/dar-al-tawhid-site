#!/usr/bin/env python3
"""Read-only skin-weight audit of the SHA-pinned ORIGINAL boy V7.7 GLB.
Run: python qa_v77_skin_weight_distribution.py /path/to/original-v77.glb
No model writes, no external dependencies, and NO production approval.
"""
import hashlib
import json
import math
import struct
import sys
from pathlib import Path

PIN = "353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa"
FORMATS = {5121: "B", 5123: "H", 5125: "I", 5126: "f"}
DIMENSIONS = {"SCALAR": 1, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def inspect(path):
    raw = Path(path).read_bytes()
    sha = hashlib.sha256(raw).hexdigest()
    if sha != PIN:
        raise ValueError("Not the protected original V7.7 GLB (SHA mismatch)")
    magic, version, total = struct.unpack_from("<4sII", raw)
    if (magic, version, total) != (b"glTF", 2, len(raw)):
        raise ValueError("Bad glTF 2.0 header")
    json_length, json_tag = struct.unpack_from("<I4s", raw, 12)
    if json_tag != b"JSON":
        raise ValueError("Missing JSON chunk")
    gltf = json.loads(raw[20:20 + json_length])
    binary_offset = 20 + json_length
    binary_length, binary_tag = struct.unpack_from("<I4s", raw, binary_offset)
    if binary_tag != b"BIN\0" or binary_offset + 8 + binary_length > len(raw):
        raise ValueError("Bad BIN chunk")
    binary_offset += 8

    def accessor(index):
        a = gltf["accessors"][index]
        v = gltf["bufferViews"][a["bufferView"]]
        fmt = FORMATS[a["componentType"]]
        n = DIMENSIONS[a["type"]]
        size = struct.calcsize("<" + fmt * n)
        stride = v.get("byteStride", size)
        start = binary_offset + v.get("byteOffset", 0) + a.get("byteOffset", 0)
        if stride < size or start + (a["count"] - 1) * stride + size > len(raw):
            raise ValueError("Accessor outside GLB")
        return [struct.unpack_from("<" + fmt * n, raw, start + i * stride)
                for i in range(a["count"])]

    skin = gltf["skins"][0]
    joints_total = len(skin["joints"])
    if joints_total != 19:
        raise ValueError("Unexpected joint count")
    total = invalid = blended = 0
    parts = []
    for i, p in enumerate(gltf["meshes"][0]["primitives"]):
        a = p["attributes"]
        joint_ids, weights = accessor(a["JOINTS_0"]), accessor(a["WEIGHTS_0"])
        if len(joint_ids) != len(weights):
            raise ValueError("Joint/weight count mismatch")
        bad = mixed = 0
        for js, ws in zip(joint_ids, weights):
            if (any(not (0 <= x < joints_total) for x in js)
                or any(not math.isfinite(x) or x < 0 for x in ws)
                or abs(sum(ws) - 1) > 1e-3):
                bad += 1
            if sum(x > 1e-3 for x in ws) > 1:
                mixed += 1
        total += len(weights)
        invalid += bad
        blended += mixed
        parts.append({"material": gltf["materials"][p["material"]].get("name", str(i)),
                      "vertices": len(weights), "invalid": bad, "blended": mixed})
    if invalid or not total:
        raise ValueError(f"Invalid weight vertices: {invalid}")
    return {"sourceSha256": sha, "bytes": len(raw), "joints": joints_total,
            "primitives": len(parts), "weightedVertices": total,
            "invalidWeightVertices": invalid, "multiJointWeightVertices": blended,
            "multiJointWeightFraction": round(blended / total, 6),
            "parts": parts, "productionApproved": False,
            "note": "Blend distribution only; no anatomical, cloth, visual, fiqh or release approval."}


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: qa_v77_skin_weight_distribution.py original-v77.glb")
    print(json.dumps(inspect(sys.argv[1]), ensure_ascii=False, indent=2))
