#!/usr/bin/env python3
"""Internal 3D silhouette measurement against the original boy reference.
Requires numpy. Never creates images and never grants a Kids/production release.
Usage: python qa-original-proportions.py model.glb
"""
import json
import struct
import sys
from pathlib import Path
import numpy as np

# Proportions measured approximately from the user's ORIGINAL front reference,
# including original Kufi, hair, ears and shoes. These are NOT religious norms.
BOY_FRONT_REFERENCE = {
    "head_height_to_full_height": (0.395, 0.035),
    "head_width_to_full_height": (0.375, 0.040),
}

def inspect(path):
    raw = Path(path).read_bytes()
    if raw[:4] != b"glTF" or struct.unpack_from("<I", raw, 4)[0] != 2:
        raise ValueError("Not a valid binary glTF 2.0 model")
    if struct.unpack_from("<I", raw, 8)[0] != len(raw):
        raise ValueError("Invalid GLB length")
    size,typ = struct.unpack_from("<II", raw, 12)
    if typ != 0x4E4F534A:
        raise ValueError("GLB first chunk must contain JSON")
    gltf = json.loads(raw[20:20 + size].decode("utf-8"))
    binary_offset = 20 + size
    bin_size,bin_type = struct.unpack_from("<II", raw, binary_offset)
    if bin_type != 0x004E4942:
        raise ValueError("GLB missing binary geometry")
    binary = raw[binary_offset + 8:binary_offset + 8 + bin_size]
    def accessor(index):
        a = gltf["accessors"][index]
        view = gltf["bufferViews"][a["bufferView"]]
        typ = {"SCALAR": 1, "VEC3": 3, "VEC4": 4, "MAT4": 16}[a["type"]]
        dtype = {5123: "<u2", 5125: "<u4", 5126: "<f4"}[a["componentType"]]
        offset = view.get("byteOffset", 0) + a.get("byteOffset", 0)
        return np.frombuffer(binary,dtype=dtype,count=a["count"] * typ,offset=offset).reshape(-1,typ)
    names = [n.get("name") for n in gltf.get("nodes",[])]
    if "Head" not in names:
        raise ValueError("Original child rig Head bone is missing")
    head_id = names.index("Head")
    all_vertices = []
    head_vertices = []
    for mesh in gltf.get("meshes",[]):
        for primitive in mesh.get("primitives",[]):
            a = primitive.get("attributes",{})
            for required in ("POSITION","JOINTS_0","WEIGHTS_0"):
                if required not in a: raise ValueError("Expected skinned mesh: "+required)
            vertices = accessor(a["POSITION"])
            joints = accessor(a["JOINTS_0"])
            weights = accessor(a["WEIGHTS_0"])
            all_vertices.append(vertices)
            matches = np.any((joints == head_id) & (weights >= 0.5),axis=1)
            if matches.any(): head_vertices.append(vertices[matches])
    if not all_vertices or not head_vertices:
        raise ValueError("No original character head mesh")
    allv,headv = np.vstack(all_vertices),np.vstack(head_vertices)
    total = np.ptp(allv[:,1])
    metrics = {
        "head_height_to_full_height":float(np.ptp(headv[:,1])/total),
        "head_width_to_full_height":float(np.ptp(headv[:,0])/total),
    }
    checks = {k:abs(metrics[k]-v[0]) <= v[1] for k,v in BOY_FRONT_REFERENCE.items()}
    return {
        "asset":Path(path).name,
        "approximate_reference_ratios":BOY_FRONT_REFERENCE,
        "measured_ratios":{k:round(v,4) for k,v in metrics.items()},
        "structural_proportions_in_tolerance":all(checks.values()),
        "detail_checks":checks,
        "manual_face_hair_kufi_identity_approved":False,
        "religious_posture_approved":False,
        "production_approved":False,
        "warning":"Passing body/head ratio does NOT establish original identity. Real human 0°/45°/90°/180°/270° visual check and a pinned GLB SHA-256 are required."
    }

if __name__=="__main__":
    if len(sys.argv)!=2:
        print("Usage: python qa-original-proportions.py character.glb",file=sys.stderr);sys.exit(2)
    try:
        result=inspect(sys.argv[1])
        print(json.dumps(result,indent=2,ensure_ascii=False))
        sys.exit(0 if result["structural_proportions_in_tolerance"] else 1)
    except (OSError,ValueError,KeyError,struct.error) as exc:
        print("REJECT: "+str(exc),file=sys.stderr);sys.exit(1)
