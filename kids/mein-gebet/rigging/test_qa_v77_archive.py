#!/usr/bin/env python3
"""Safe ZIP intake tests with artificially named bytes, never original character bytes."""
import hashlib
import os
import pathlib
import stat
import tempfile
import unittest
import zipfile
from qa_v77_archive import pinned_members


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


if __name__ == "__main__":
    unittest.main(verbosity=2)
