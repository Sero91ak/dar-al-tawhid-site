#!/usr/bin/env python3
"""Safe ZIP intake tests with artificially named bytes, never original character bytes."""
import hashlib
import os
import pathlib
import stat
import tempfile
import unittest
import zipfile
from qa_v77_archive import pinned_members, analysis_complete, V77_SHA, REFERENCE_SHA


def sha(x):
    return hashlib.sha256(x).hexdigest()


class FrozenArchiveIntakeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path = pathlib.Path(self.tmp.name) / "fake-v77.zip"
        self.model = b"TEST_GLTF_NOT_REAL" * 200
        self.picture = b"TEST_PNG_NOT_REAL" * 200

    def pack(self, members, compression=zipfile.ZIP_STORED):
        with zipfile.ZipFile(self.path, "w", compression=compression) as z:
            for name, data in members:
                z.writestr(name, data)

    def check(self):
        return pinned_members(self.path, sha(self.model), sha(self.picture))

    def test_pinned_fake_archive_content_passes_only_given_fake_test_digests(self):
        self.pack([("contents/foo.glb", self.model), ("original/my-photo.png", self.picture)])
        found = self.check()
        self.assertEqual(found["model"], self.model)
        self.assertEqual(found["reference"], self.picture)

    def test_actual_frozen_hashes_reject_all_fake_bytes(self):
        self.pack([("x.glb", self.model), ("x.png", self.picture)])
        with self.assertRaisesRegex(ValueError, "Frozen SHA-256"):
            pinned_members(self.path)

    def test_absent_original_png_fails_closed(self):
        self.pack([("x.glb", self.model)])
        with self.assertRaisesRegex(ValueError, "reference"):
            self.check()

    def test_absent_original_glb_fails_closed(self):
        self.pack([("x.png", self.picture)])
        with self.assertRaisesRegex(ValueError, "model"):
            self.check()

    def test_wrong_png_digest_is_not_accepted(self):
        self.pack([("x.glb", self.model), ("x.png", b"not picture")])
        with self.assertRaisesRegex(ValueError, "reference"):
            self.check()

    def test_disguised_glb_wrong_extension_fails(self):
        self.pack([("x.png", self.model), ("ref.png", self.picture)])
        with self.assertRaisesRegex(ValueError, "model"):
            self.check()

    def test_duplicate_pinned_model_is_rejected(self):
        self.pack([("x.glb", self.model), ("other.glb", self.model), ("x.png", self.picture)])
        with self.assertRaisesRegex(ValueError, "Duplicate pinned model"):
            self.check()

    def test_traversal_path_is_blocked_before_any_model_output(self):
        self.pack([("../secret.glb", self.model), ("x.png", self.picture)])
        with self.assertRaisesRegex(ValueError, "Unsafe ZIP entry"):
            self.check()

    def test_absolute_path_is_blocked(self):
        self.pack([("/tmp/secret.glb", self.model), ("x.png", self.picture)])
        with self.assertRaisesRegex(ValueError, "Unsafe ZIP entry"):
            self.check()

    def test_zip_symlink_is_blocked(self):
        link = zipfile.ZipInfo("script.glb")
        link.create_system = 3
        link.external_attr = (stat.S_IFLNK | 0o777) << 16
        with zipfile.ZipFile(self.path, "w") as z:
            z.writestr(link, "read-any-path")
            z.writestr("x.glb", self.model)
            z.writestr("x.png", self.picture)
        with self.assertRaisesRegex(ValueError, "Unsafe ZIP entry"):
            self.check()

    def test_highly_compressed_fake_payload_is_blocked(self):
        bloated = bytes(600 * 1024)
        self.pack([("repetitive.txt", bloated), ("x.glb", self.model), ("x.png", self.picture)], zipfile.ZIP_DEFLATED)
        with self.assertRaisesRegex(ValueError, "Potential ZIP bomb"):
            self.check()

    def test_empty_archive_is_blocked(self):
        self.pack([])
        with self.assertRaisesRegex(ValueError, "Unexpected ZIP member count"):
            self.check()

    def test_nonzip_input_does_not_succeed(self):
        self.path.write_bytes(b"not a ZIP archive")
        with self.assertRaises(zipfile.BadZipFile):
            self.check()

    def test_missing_zip_is_blocked(self):
        with self.assertRaisesRegex(ValueError, "ZIP missing"):
            self.check()

    def test_nested_relative_names_are_allowed(self):
        self.pack([("a/b/c.glb", self.model), ("z/y/x.png", self.picture)])
        self.assertIn("reference", self.check())



class ArchiveAnalysisSeparationTests(unittest.TestCase):
    """No authentic V7.7 bytes in tests: synthetic reports validate the audit boundary."""

    @staticmethod
    def synthetic_result():
        return {
            "modelBytesVerified": True,
            "referenceBytesVerified": True,
            "productionApproved": False,
            "binaryRig": {"passed": True, "report": {"structureValid": True, "productionApproved": False}},
            # The V7.7 3/4 view is uncalibrated, so the five-view CLI EXITS 1
            # even when it has produced authentic measurement JSON.
            "fixedFiveViews": {"completed": True, "passed": False, "commandExitCode": 1, "report": {
                "model_sha256": V77_SHA,
                "original_sha256": REFERENCE_SHA,
                "measurement_method_id": "fiveview-cropped-grabcut-seeded-v4-stride-scene-safe-20261009",
                "production_approved": False,
                "all_five_90pct_pass": False,
                "views": {x: {"whole_body_shape_iou_worst": .83} for x in
                          ("front", "three_quarter_uncalibrated", "right_side", "back", "left_side")},
            }},
            "angleDiagnostic": {"completed": True, "passed": True, "commandExitCode": 0, "report": {
                "source_glb_sha256": V77_SHA,
                "source_reference_sha256": REFERENCE_SHA,
                "physical_camera_angle_established": False,
                "production_approved": False,
            }},
        }

    def test_verified_archive_qa_completes_despite_90pct_silhouette_failure(self):
        x = self.synthetic_result()
        self.assertFalse(x["fixedFiveViews"]["passed"])
        self.assertFalse(x["fixedFiveViews"]["report"]["all_five_90pct_pass"])
        self.assertFalse(x["productionApproved"])
        self.assertTrue(analysis_complete(x))

    def test_corrupt_or_unavailable_original_bytes_block(self):
        for field in ("modelBytesVerified", "referenceBytesVerified"):
            with self.subTest(field=field):
                x = self.synthetic_result()
                x[field] = False
                self.assertFalse(analysis_complete(x))

    def test_failed_rig_validator_is_not_a_successful_intake(self):
        x = self.synthetic_result()
        x["binaryRig"]["passed"] = False
        self.assertFalse(analysis_complete(x))

    def test_five_view_process_error_not_mistaken_for_shape_failure(self):
        x = self.synthetic_result()
        x["fixedFiveViews"]["commandExitCode"] = 2
        self.assertFalse(analysis_complete(x))

    def test_malformed_five_view_json_fails_closed(self):
        for value in (None, [], {}, "bad data"):
            with self.subTest(value=value):
                x = self.synthetic_result()
                x["fixedFiveViews"]["report"] = value
                self.assertFalse(analysis_complete(x))

    def test_wrong_original_or_model_sha_blocks(self):
        for part, key in (("fixedFiveViews", "model_sha256"),
                          ("fixedFiveViews", "original_sha256"),
                          ("angleDiagnostic", "source_glb_sha256"),
                          ("angleDiagnostic", "source_reference_sha256")):
            with self.subTest(part=part, key=key):
                x = self.synthetic_result()
                x[part]["report"][key] = "bad-sha"
                self.assertFalse(analysis_complete(x))

    def test_camera_diagnostic_must_have_run_successfully(self):
        x = self.synthetic_result()
        x["angleDiagnostic"]["passed"] = False
        self.assertFalse(analysis_complete(x))

    def test_five_views_must_be_real_v4_method(self):
        x = self.synthetic_result()
        x["fixedFiveViews"]["report"]["measurement_method_id"] = "historical-incomplete"
        self.assertFalse(analysis_complete(x))

    def test_no_automatic_production_approval(self):
        for part, key in (("", "productionApproved"), ("fixedFiveViews", "production_approved"),
                          ("angleDiagnostic", "production_approved")):
            with self.subTest(part=part, key=key):
                x = self.synthetic_result()
                (x[part]["report"] if part else x)[key] = True
                self.assertFalse(analysis_complete(x))

    def test_no_fabricated_physical_camera_calibration(self):
        x = self.synthetic_result()
        x["angleDiagnostic"]["report"]["physical_camera_angle_established"] = True
        self.assertFalse(analysis_complete(x))


if __name__ == "__main__":
    unittest.main(verbosity=2)
