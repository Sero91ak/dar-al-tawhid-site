#!/usr/bin/env python3
"""Safe ZIP intake tests with artificially named bytes, never original character bytes."""
import hashlib
import os
import pathlib
import stat
import tempfile
import unittest
from unittest import mock
import zipfile
from qa_v77_archive import pinned_members, analysis_complete, run, V77_SHA, REFERENCE_SHA


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
            "binaryRig": {"passed": True, "report": {
                "structureValid": True,
                "animationSamplerBytesVerified": True,
                "geometryVertexBytesVerified": True,
                "boneLengthInvariantVerified": True,
                "inverseBindMatchesRestPose": True,
                "productionApproved": False,
            }},
            # The V7.7 3/4 view is uncalibrated, so the five-view CLI EXITS 1
            # even when it has produced authentic measurement JSON.
            "fixedFiveViews": {"completed": True, "passed": False, "commandExitCode": 1, "report": {
                "model_sha256": V77_SHA,
                "original_sha256": REFERENCE_SHA,
                "measurement_method_id": "fiveview-cropped-grabcut-seeded-v4-stride-scene-safe-20261009",
                "production_approved": False,
                "original_character_likeness_approved": False,
                "prayer_poses_approved": False,
                "real_ipad_test_done": False,
                "all_five_90pct_pass": False,
                "views": {
                    name: {"camera_azimuth_used": angle,
                           "reference_camera_physically_calibrated": False,
                           "reference_masks_stable": True,
                           "reference_segmentation_agreement": .98,
                           "whole_body_shape_iou_worst": .83,
                           "head_region_iou_worst": .79,
                           "requested_90pct_shape_prefilter_pass": False}
                    for name, angle in (("front", 0), ("three_quarter_uncalibrated", 45),
                                        ("right_side", 90), ("back", 180), ("left_side", 270))
                },
            }},
            "angleDiagnostic": {"completed": True, "passed": True, "commandExitCode": 0, "report": {
                "source_glb_sha256": V77_SHA,
                "source_reference_sha256": REFERENCE_SHA,
                "method": "v77-locked-angle-sweep-diagnostic-v2-stride-scene-safe",
                "physical_camera_angle_established": False,
                "substitutes_fixed_five_view_qa": False,
                "three_quarter_90pct_release_gate_passed": False,
                "boy_original_likeness_approved": False,
                "production_approved": False,
                "sweep": [{"angle_deg": degree,
                           "whole_body_iou_worst": .82,
                           "head_region_iou_worst": .79}
                          for degree in range(5, 90, 5)],
            }},
        }

    def test_verified_archive_qa_completes_despite_90pct_silhouette_failure(self):
        x = self.synthetic_result()
        self.assertFalse(x["fixedFiveViews"]["passed"])
        self.assertFalse(x["fixedFiveViews"]["report"]["all_five_90pct_pass"])
        self.assertFalse(x["productionApproved"])
        self.assertTrue(analysis_complete(x))

    def test_forged_success_exit_rejected_for_uncalibrated_v77(self):
        x = self.synthetic_result()
        x["fixedFiveViews"]["commandExitCode"] = 0
        x["fixedFiveViews"]["passed"] = True
        x["fixedFiveViews"]["report"]["all_five_90pct_pass"] = True
        self.assertFalse(analysis_complete(x))

    def test_missing_or_forged_five_view_measurement_rejected(self):
        for key, value in (("head_region_iou_worst", None),
                           ("whole_body_shape_iou_worst", float("nan")),
                           ("reference_segmentation_agreement", 1.1),
                           ("camera_azimuth_used", 135),
                           ("reference_camera_physically_calibrated", True),
                           ("reference_masks_stable", None),
                           ("requested_90pct_shape_prefilter_pass", "false")):
            with self.subTest(metric=key):
                x = self.synthetic_result()
                x["fixedFiveViews"]["report"]["views"]["front"][key] = value
                self.assertFalse(analysis_complete(x))

    def test_incomplete_view_count_rejected(self):
        x = self.synthetic_result()
        del x["fixedFiveViews"]["report"]["views"]["back"]
        self.assertFalse(analysis_complete(x))

    def test_angle_sweep_must_have_17_valid_independent_angles(self):
        for edit in ("short", "duplicate", "nan", "out_of_range"):
            with self.subTest(edit=edit):
                x = self.synthetic_result()
                sweep = x["angleDiagnostic"]["report"]["sweep"]
                if edit == "short": sweep.pop()
                elif edit == "duplicate": sweep[1]["angle_deg"] = 5
                elif edit == "nan": sweep[0]["whole_body_iou_worst"] = float("nan")
                else: sweep[0]["head_region_iou_worst"] = 2.0
                self.assertFalse(analysis_complete(x))

    def test_inaccurate_diagnostic_metadata_rejected(self):
        for key, value in (("method", "old-method"),
                           ("substitutes_fixed_five_view_qa", True),
                           ("three_quarter_90pct_release_gate_passed", True),
                           ("boy_original_likeness_approved", True)):
            with self.subTest(key=key):
                x = self.synthetic_result()
                x["angleDiagnostic"]["report"][key] = value
                self.assertFalse(analysis_complete(x))

    def test_archive_run_integrates_report_without_releasing_model(self):
        """Mock only the unavailable original asset; exercise the real orchestration."""
        expected = self.synthetic_result()
        with mock.patch("qa_v77_archive.pinned_members", return_value={
            "model": b"UNREAL_SYNTHETIC_GLB", "reference": b"UNREAL_SYNTHETIC_PNG"
        }) as archive, mock.patch("qa_v77_archive.probe", side_effect=[
            expected["binaryRig"], expected["fixedFiveViews"], expected["angleDiagnostic"]
        ]) as runner:
            result = run("synthetic-only.zip")
        archive.assert_called_once_with("synthetic-only.zip")
        self.assertEqual(runner.call_count, 3)
        self.assertTrue(result["qaAnalysisComplete"])
        self.assertFalse(result["fiveView90PctAccepted"])
        self.assertFalse(result["productionApproved"])
        self.assertFalse(result["originalLikenessApproved"])
        self.assertFalse(result["prayerPoseApproved"])

    def test_archive_run_blocks_incomplete_binary_rig_evidence(self):
        expected = self.synthetic_result()
        expected["binaryRig"]["report"]["inverseBindMatchesRestPose"] = False
        with mock.patch("qa_v77_archive.pinned_members", return_value={
            "model": b"SYNTHETIC_ONLY", "reference": b"SYNTHETIC_ONLY"
        }), mock.patch("qa_v77_archive.probe", side_effect=[
            expected["binaryRig"], expected["fixedFiveViews"], expected["angleDiagnostic"]
        ]):
            result = run("synthetic-only.zip")
        self.assertFalse(result["qaAnalysisComplete"])
        self.assertFalse(result["fiveView90PctAccepted"])
        self.assertFalse(result["productionApproved"])

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

    def test_missing_binary_evidence_fails_closed(self):
        required = ("structureValid", "animationSamplerBytesVerified",
                    "geometryVertexBytesVerified", "boneLengthInvariantVerified",
                    "inverseBindMatchesRestPose")
        for key in required:
            with self.subTest(key=key):
                x = self.synthetic_result()
                x["binaryRig"]["report"][key] = False
                self.assertFalse(analysis_complete(x))
                del x["binaryRig"]["report"][key]
                self.assertFalse(analysis_complete(x))

    def test_forged_rig_production_approval_is_rejected(self):
        x = self.synthetic_result()
        x["binaryRig"]["report"]["productionApproved"] = True
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
