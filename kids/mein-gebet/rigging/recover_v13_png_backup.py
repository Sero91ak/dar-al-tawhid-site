#!/usr/bin/env python3
"""Restore an exact *unapproved* GLB from the lossless V13 PNG backup.

Only for isolated KIDS Mein Gebet research. No rig, identity or fiqh approval.
The original PNG remains unchanged; never overwrite an existing GLB.
"""
from __future__ import annotations
import argparse
import base64
import binascii
import hashlib
import json
from pathlib import Path
import re
import struct
import zlib

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
EXPECTED_V13_SHA256 = "3447a84a522c1a007bea3e09b59dfc0830576a198e740629070f096f95ec5547"
EXPECTED_V13_BYTES = 2730300
MAX_PNG_BYTES = 12 * 1024 * 1024
MAX_METADATA_CHUNK = 500_000
MAX_GLTF_BYTES = 12 * 1024 * 1024
NAME = "MAEDCHEN_ORIGINALGEOMETRIE_V13_IN_ARBEIT_NICHT_FREIGEGEBEN.glb"


def _inflate_limited(data: bytes) -> bytes:
    inflater = zlib.decompressobj()
    value = inflater.decompress(data, MAX_METADATA_CHUNK + 1)
    if len(value) > MAX_METADATA_CHUNK or inflater.unconsumed_tail or not inflater.eof or inflater.unused_data:
        raise ValueError("PNG compressed metadata is too large, incomplete or contains trailing data")
    return value


def metadata_from_png(data: bytes) -> dict[str, bytes]:
    if len(data) > MAX_PNG_BYTES or not data.startswith(PNG_MAGIC):
        raise ValueError("Invalid or oversized PNG")
    pos = len(PNG_MAGIC)
    found: dict[str, bytes] = {}
    ended = False
    while pos + 12 <= len(data):
        length = int.from_bytes(data[pos:pos+4], "big")
        if length > MAX_PNG_BYTES or pos + 12 + length > len(data):
            raise ValueError("Invalid PNG chunk size")
        typ = data[pos+4:pos+8]
        body = data[pos+8:pos+8+length]
        crc = int.from_bytes(data[pos+8+length:pos+12+length], "big")
        if zlib.crc32(typ + body) & 0xffffffff != crc:
            raise ValueError("PNG CRC mismatch")
        pos += 12 + length
        if typ in (b"tEXt", b"zTXt"):
            key, sep, value = body.partition(b"\0")
            if not sep or len(key) > 79:
                raise ValueError("Invalid PNG text keyword")
            if typ == b"zTXt":
                if not value or value[0] != 0:
                    raise ValueError("Unsupported PNG metadata compression")
                value = _inflate_limited(value[1:])
            name = key.decode("ascii")
            if name in found:
                raise ValueError("Duplicate PNG metadata key")
            found[name] = value
        if typ == b"IEND":
            ended = True
            break
    if not ended or pos != len(data):
        raise ValueError("Missing IEND or trailing bytes")
    return found


def recover(data: bytes, expected_sha256: str = EXPECTED_V13_SHA256) -> tuple[bytes, dict]:
    meta = metadata_from_png(data)
    try:
        if meta["GLB_V13_FILENAME"].decode("utf-8") != NAME:
            raise ValueError("Unexpected GLB filename")
        count = int(meta["GLB_V13_CHUNKS"])
        if not 1 <= count <= 64:
            raise ValueError("Invalid GLB base64 chunk count")
        pieces = [meta[f"GLB_V13_BASE64_{i}"] for i in range(count)]
        encoded = b"".join(pieces)
        if len(encoded) > MAX_GLTF_BYTES * 2:
            raise ValueError("Oversized base64 data")
        glb = base64.b64decode(encoded, validate=True)
        recorded_sha = meta["GLB_V13_SHA256"].decode("ascii")
    except (KeyError, ValueError, UnicodeError, binascii.Error) as exc:
        raise ValueError("Invalid or incomplete V13 backup metadata") from exc
    digest = hashlib.sha256(glb).hexdigest()
    if not re.fullmatch(r"[0-9a-f]{64}", recorded_sha) or digest != recorded_sha or digest != expected_sha256:
        raise ValueError("V13 GLB SHA-256 mismatch")
    if len(glb) != EXPECTED_V13_BYTES or glb[:4] != b"glTF":
        raise ValueError("V13 GLB length or magic mismatch")
    version, total_length = struct.unpack_from("<II", glb, 4)
    if version != 2 or total_length != len(glb):
        raise ValueError("Invalid GLB header")
    json_size, json_type = struct.unpack_from("<I4s", glb, 12)
    if json_type != b"JSON" or json_size > len(glb) - 20:
        raise ValueError("Invalid GLB JSON chunk")
    scene = json.loads(glb[20:20+json_size])
    report = {
        "sha256": digest, "bytes": len(glb), "meshes": len(scene.get("meshes", [])),
        "nodes": len(scene.get("nodes", [])), "skins": len(scene.get("skins", [])),
        "animations": len(scene.get("animations", [])),
        "productionApproved": False, "identityApproved": False,
        "fiqhApproved": False, "humanVisualApproved": False,
    }
    if report["meshes"] != 213 or report["skins"] or report["animations"]:
        raise ValueError("Unexpected V13 mesh/skin/animation structure")
    return glb, report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("png", type=Path)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    glb, report = recover(args.png.read_bytes())
    args.output_dir.mkdir(parents=True, exist_ok=True)
    target = args.output_dir / NAME
    if target.exists():
        if target.read_bytes() != glb:
            raise SystemExit("Refusing to overwrite a different existing GLB")
    else:
        with target.open("xb") as stream:
            stream.write(glb)
    print(json.dumps({"file": str(target), **report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
