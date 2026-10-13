#!/usr/bin/env python3
"""Non-destructive glTF floor contact draft for an SHA-pinned GIRL V20 source.

Research only. No rig/skin/animation or visual/fiqh approval is implied.
All mesh geometry and the GLB BIN chunk remain byte-for-byte unchanged.
"""
import argparse
import copy
import hashlib
import json
import struct
from pathlib import Path

EXPECTED_SHA = "c86e958bca638ca4e1d602994fec905c6c7fcf311769d0a16610357960bbf16a"
GLB_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def unpack_glb(data):
    assert len(data) >= 28, "truncated GLB"
    magic, version, size = struct.unpack_from("<III", data, 0)
    assert (magic, version, size) == (GLB_MAGIC, 2, len(data)), "invalid GLB header"
    chunks = []
    off = 12
    while off < len(data):
        length, kind = struct.unpack_from("<II", data, off)
        start = off + 8
        end = start + length
        assert end <= len(data) and length % 4 == 0, "invalid GLB chunk"
        chunks.append((kind, data[start:end]))
        off = end
    assert off == len(data) and len(chunks) == 2, "expected JSON+BIN GLB"
    assert chunks[0][0] == JSON_CHUNK and chunks[1][0] == BIN_CHUNK
    return json.loads(chunks[0][1]), chunks[1][1]


def pack_glb(gltf, binary):
    jb = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    jb += b" " * ((-len(jb)) % 4)
    assert len(binary) % 4 == 0
    total = 12 + 8 + len(jb) + 8 + len(binary)
    return (struct.pack("<III", GLB_MAGIC, 2, total)
            + struct.pack("<II", len(jb), JSON_CHUNK) + jb
            + struct.pack("<II", len(binary), BIN_CHUNK) + binary)


def align(source, output):
    raw = Path(source).read_bytes()
    assert sha256(raw) == EXPECTED_SHA, "wrong source binary; fail closed"
    gltf, binary = unpack_glb(raw)
    assert len(gltf.get("meshes", [])) == 223 and len(gltf.get("nodes", [])) == 224
    assert not gltf.get("skins") and not gltf.get("animations")
    assert gltf["nodes"][0]["name"] == "world"
    assert sorted(gltf["nodes"][0]["children"]) == list(range(1, 224))
    assert all("mesh" in n and not any(k in n for k in ("matrix", "rotation", "scale", "translation"))
               for n in gltf["nodes"][1:]), "unexpected transform; do not alter"
    assert {n["name"] for n in gltf["nodes"][1:]}.issuperset({"left_shoe_sole", "right_shoe_sole"})
    changed = copy.deepcopy(gltf)
    for node in changed["nodes"][1:]:
        node["translation"] = [0, -0.024, 0]
    new = pack_glb(changed, binary)
    parsed, bin2 = unpack_glb(new)
    assert bin2 == binary, "mesh BIN changed"
    assert parsed["meshes"] == gltf["meshes"]
    assert parsed["accessors"] == gltf["accessors"]
    assert parsed["bufferViews"] == gltf["bufferViews"]
    assert all(n["translation"] == [0, -0.024, 0] for n in parsed["nodes"][1:])
    Path(output).write_bytes(new)
    import trimesh
    src = trimesh.load(str(source), force="scene", process=False)
    dst = trimesh.load(str(output), force="scene", process=False)
    shoes = {}
    for name in ("left_shoe_sole", "right_shoe_sole"):
        assert name in src.geometry and name in dst.geometry
        src_mesh = src.geometry[name].copy()
        src_mesh.apply_transform(src.graph[name][0])
        dst_mesh = dst.geometry[name].copy()
        dst_mesh.apply_transform(dst.graph[name][0])
        src_bounds = src_mesh.bounds
        dst_bounds = dst_mesh.bounds
        assert abs((src_bounds[0, 1] - dst_bounds[0, 1]) - 0.024) < 1e-6
        assert abs(dst_bounds[0, 1]) < 1e-6
        shoes[name] = {"sourceMinY": float(src_bounds[0, 1]), "draftMinY": float(dst_bounds[0, 1])}
    assert len(src.geometry) == len(dst.geometry) == 223
    assert abs((src.bounds[0, 1] - dst.bounds[0, 1]) - 0.024) < 1e-6
    assert abs((src.bounds[1, 1] - dst.bounds[1, 1]) - 0.024) < 1e-6
    return {
        "sourceSha256": sha256(raw), "draftSha256": sha256(new),
        "sourceBytes": len(raw), "draftBytes": len(new),
        "binChunkSha256": sha256(binary), "meshCount": len(src.geometry),
        "nodeTranslationsApplied": 223, "shoes": shoes,
        "skins": 0, "animations": 0, "originalIdentityApproved": False,
        "productionReady": False, "humanVisualApproval": False, "fiqhApproval": False,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("output")
    ap.add_argument("--report")
    args = ap.parse_args()
    report = align(args.source, args.output)
    if args.report:
        Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
