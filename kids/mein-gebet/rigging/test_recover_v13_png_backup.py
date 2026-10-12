#!/usr/bin/env python3
"""Synthetic corruption tests only; original V13 GLB is never uploaded to CI."""
import base64
import hashlib
import json
import struct
import unittest
import zlib
from recover_v13_png_backup import recover, metadata_from_png, NAME, EXPECTED_V13_BYTES


def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)


def synthetic_glb():
    doc = json.dumps({"asset": {"version": "2.0"}, "meshes": [{} for _ in range(213)], "nodes": [{}]}).encode()
    doc += b" " * ((-len(doc)) % 4)
    size = EXPECTED_V13_BYTES - 12 - 8 - len(doc) - 8
    assert size >= 0 and size % 4 == 0
    return b"glTF" + struct.pack("<II", 2, EXPECTED_V13_BYTES) + struct.pack("<I4s", len(doc), b"JSON") + doc + struct.pack("<I4s", size, b"BIN\x00") + b"\x00" * size


def synthetic_png(glb, *, recorded_sha=None):
    sha = hashlib.sha256(glb).hexdigest() if recorded_sha is None else recorded_sha
    props = {
        "GLB_V13_CHUNKS": b"1",
        "GLB_V13_FILENAME": NAME.encode(),
        "GLB_V13_SHA256": sha.encode(),
    }
    chunks = [chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))]
    for key, value in props.items():
        chunks.append(chunk(b"tEXt", key.encode() + b"\x00" + value))
    chunks.append(chunk(b"zTXt", b"GLB_V13_BASE64_0\x00\x00" + zlib.compress(base64.b64encode(glb))))
    chunks.append(chunk(b"IEND", b""))
    return b"\x89PNG\r\n\x1a\n" + b"".join(chunks)


class V13RecoveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.glb = synthetic_glb()
        cls.sha = hashlib.sha256(cls.glb).hexdigest()
        cls.png = synthetic_png(cls.glb)

    def test_synthetic_valid_recovery_does_not_approve(self):
        raw, report = recover(self.png, expected_sha256=self.sha)
        self.assertEqual(raw, self.glb)
        self.assertEqual(report["meshes"], 213)
        self.assertEqual(report["skins"], 0)
        self.assertEqual(report["animations"], 0)
        self.assertFalse(report["productionApproved"])
        self.assertFalse(report["identityApproved"])

    def test_crc_corruption_is_rejected(self):
        damaged = bytearray(self.png)
        damaged[48] ^= 0x01
        with self.assertRaises(ValueError):
            metadata_from_png(bytes(damaged))

    def test_wrong_expected_sha_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            recover(self.png, expected_sha256="f" * 64)

    def test_wrong_embedded_sha_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            recover(synthetic_png(self.glb, recorded_sha="0" * 64), expected_sha256=self.sha)

    def test_png_trailing_bytes_rejected(self):
        with self.assertRaises(ValueError):
            metadata_from_png(self.png + b"garbage")

    def test_png_missing_metadata_rejected(self):
        empty = b"\x89PNG\r\n\x1a\n" + chunk(b"IEND", b"")
        with self.assertRaises(ValueError):
            recover(empty)


if __name__ == "__main__":
    unittest.main()
