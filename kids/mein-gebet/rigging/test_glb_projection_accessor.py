#!/usr/bin/env python3
"""Pure stdlib regression tests for accurate original-illustration silhouette inputs."""
import math
import struct
import unittest

from glb_projection_accessor import decode_triangle_primitive, read_projection_accessor


def synthetic(interleaved=False):
    # 4 nonplanar points, 2 triangles. If interleaved, POSITION occupies 12
    # of every 20 bytes; stale contiguous np.frombuffer produced wrong shapes.
    positions = [(0., 0., 0.), (1., 0., 0.), (0., 1., 0.), (0., 0., 1.)]
    step = 20 if interleaved else 12
    raw = bytearray(4 * step)
    for i, xyz in enumerate(positions):
        struct.pack_into("<fff", raw, i * step, *xyz)
        if interleaved:
            struct.pack_into("<ff", raw, i * step + 12, 91., -92.)
    tris = (0, 1, 2, 0, 2, 3)
    positions_end = len(raw)
    raw.extend(struct.pack("<6H", *tris))
    g = {
        "buffers": [{"byteLength": len(raw)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": positions_end,
             **({"byteStride": 20} if interleaved else {})},
            {"buffer": 0, "byteOffset": positions_end, "byteLength": 12}
        ],
        "accessors": [
            {"bufferView": 0, "type": "VEC3", "componentType": 5126, "count": 4},
            {"bufferView": 1, "type": "SCALAR", "componentType": 5123, "count": 6}
        ]
    }
    return g, raw, {"attributes": {"POSITION": 0}, "indices": 1, "mode": 4}


class IndexedProjectionTests(unittest.TestCase):
    def assert_rejects(self, edit, matches):
        g, b, p = synthetic()
        edit(g, b, p)
        with self.assertRaisesRegex(ValueError, matches):
            decode_triangle_primitive(g, b, p)

    def test_contiguous_real_vertices_and_faces(self):
        g, b, p = synthetic()
        verts, faces = decode_triangle_primitive(g, b, p)
        self.assertEqual(faces, [[0, 1, 2], [0, 2, 3]])
        self.assertEqual(verts[3], (0., 0., 1.))

    def test_interleaved_vertex_stride_is_respected(self):
        g, b, p = synthetic(interleaved=True)
        verts, faces = decode_triangle_primitive(g, b, p)
        self.assertEqual(verts[1], (1., 0., 0.))
        self.assertEqual(verts[3], (0., 0., 1.))
        self.assertEqual(faces[1], [0, 2, 3])

    def test_nonzero_accessor_offset(self):
        g, b, p = synthetic(interleaved=True)
        raw = bytearray(4 * 24)
        for i in range(4):
            raw[i*24:i*24+4] = b"ABCD"
            raw[i*24+4:i*24+24] = b[i*20:i*20+20]
        raw.extend(b[80:])
        g["bufferViews"][0]["byteLength"] = 96
        g["bufferViews"][0]["byteStride"] = 24
        g["bufferViews"][1]["byteOffset"] = 96
        g["accessors"][0]["byteOffset"] = 4
        self.assertEqual(decode_triangle_primitive(g, raw, p)[0][1], (1., 0., 0.))

    def test_uint32_triangle_indices(self):
        g, b, p = synthetic()
        g["accessors"][1]["componentType"] = 5125
        g["bufferViews"][1]["byteLength"] = 24
        raw = b[:48] + bytearray(struct.pack("<6I", 0, 1, 2, 0, 2, 3))
        self.assertEqual(decode_triangle_primitive(g, raw, p)[1][1], [0, 2, 3])

    def test_out_of_range_triangle(self):
        self.assert_rejects(lambda g, b, p: struct.pack_into("<H", b, 48, 7),
                            "outside POSITION")

    def test_nan_position(self):
        self.assert_rejects(lambda g, b, p: struct.pack_into("<f", b, 0, math.nan),
                            "Nonfinite")

    def test_infinity_position(self):
        self.assert_rejects(lambda g, b, p: struct.pack_into("<f", b, 0, math.inf),
                            "Nonfinite")

    def test_sparse_positions_fail(self):
        self.assert_rejects(lambda g, b, p: g["accessors"][0].update(sparse={"count": 1}),
                            "sparse/normalized")

    def test_normalized_positions_fail(self):
        self.assert_rejects(lambda g, b, p: g["accessors"][0].update(normalized=True),
                            "sparse/normalized")

    def test_wrong_position_format(self):
        self.assert_rejects(lambda g, b, p: g["accessors"][0].update(componentType=5123),
                            "Unsupported projection accessor type")

    def test_bad_vertex_stride(self):
        self.assert_rejects(lambda g, b, p: g["bufferViews"][0].update(byteStride=8),
                            "outside BIN view bounds")

    def test_undersized_view(self):
        self.assert_rejects(lambda g, b, p: g["bufferViews"][0].update(byteLength=16),
                            "outside BIN view bounds")

    def test_nonzero_buffer_index(self):
        self.assert_rejects(lambda g, b, p: g["bufferViews"][0].update(buffer=1),
                            "primary embedded")

    def test_invalid_triangle_count(self):
        self.assert_rejects(lambda g, b, p: g["accessors"][1].update(count=5),
                            "multiple of 3")

    def test_unindexed_geometry_not_assumed(self):
        self.assert_rejects(lambda g, b, p: p.pop("indices"), "Indexed triangle")

    def test_triangle_strip_rejected(self):
        self.assert_rejects(lambda g, b, p: p.update(mode=5),
                            "Only triangle")

    def test_tiny_degenerate_projection_rejected(self):
        def corrupt(g, b, p):
            for i in range(4):
                struct.pack_into("<fff", b, i*12, 0., 0., 0.)
        self.assert_rejects(corrupt, "no meaningful geometric")

    def test_misaligned_position_accessor(self):
        self.assert_rejects(lambda g, b, p: g["accessors"][0].update(byteOffset=1),
                            "misaligned")

    def test_oversized_accessor_rejected(self):
        self.assert_rejects(lambda g, b, p: g["accessors"][0].update(count=900000),
                            "oversized")

    def test_bool_accessor_id_is_not_integer(self):
        g, b, _ = synthetic()
        with self.assertRaisesRegex(ValueError, "Invalid projection accessor"):
            read_projection_accessor(g, b, True, "VEC3", {5126})


if __name__ == "__main__":
    unittest.main(verbosity=2)
