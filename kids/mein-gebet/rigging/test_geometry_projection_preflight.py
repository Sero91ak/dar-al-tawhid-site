#!/usr/bin/env python3
"""No OpenCV, no original image, no actual GLB required to check QA fail-close."""
import copy
import unittest
from geometry_projection_preflight import assert_projection_safe


def fixture():
    return {
        "asset": {"version": "2.0"},
        "meshes": [{"primitives": [{"mode": 4, "attributes": {"POSITION": 0}}]}],
        "nodes": [{"name": "Hips", "children": [1]}, {"name": "Body", "mesh": 0}],
    }


class ProjectionPreflightTests(unittest.TestCase):
    def fails(self, change):
        g = fixture()
        change(g)
        with self.assertRaises(ValueError):
            assert_projection_safe(g)

    def test_identity_bind_mesh_allowed(self):
        self.assertTrue(assert_projection_safe(fixture()))

    def test_empty_no_mesh_rejected(self):
        self.fails(lambda g: g.update(meshes=[]))

    def test_nonidentity_mesh_position_rejected(self):
        self.fails(lambda g: g["nodes"][1].update(translation=[0, .25, 0]))

    def test_scaled_ancestor_rejected(self):
        self.fails(lambda g: g["nodes"][0].update(scale=[1, 1.2, 1]))

    def test_rotated_parent_rejected(self):
        self.fails(lambda g: g["nodes"][0].update(rotation=[0, .1, 0, .995]))

    def test_raw_matrix_transform_rejected(self):
        self.fails(lambda g: g["nodes"][1].update(matrix=[2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]))

    def test_unreferenced_mesh_rejected(self):
        self.fails(lambda g: g["nodes"][1].pop("mesh"))

    def test_instanced_mesh_rejected(self):
        self.fails(lambda g: g["nodes"].append({"mesh": 0}))

    def test_morph_target_rejected(self):
        self.fails(lambda g: g["meshes"][0]["primitives"][0].update(targets=[{"POSITION": 1}]))

    def test_nontriangular_faces_rejected(self):
        self.fails(lambda g: g["meshes"][0]["primitives"][0].update(mode=5))

    def test_multiple_parents_rejected(self):
        self.fails(lambda g: g["nodes"].append({"children": [1]}))

    def test_node_cycle_rejected(self):
        self.fails(lambda g: g["nodes"][1].update(children=[0]))

    def test_unchanged_explicit_identity_allowed(self):
        g = fixture()
        g["nodes"][1].update(translation=[0, 0, 0], rotation=[0, 0, 0, 1], scale=[1, 1, 1])
        self.assertTrue(assert_projection_safe(g))

    def test_nan_scale_rejected(self):
        self.fails(lambda g: g["nodes"][0].update(scale=[1, float("nan"), 1]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
