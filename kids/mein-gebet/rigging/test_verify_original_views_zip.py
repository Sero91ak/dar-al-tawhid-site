#!/usr/bin/env python3
"""Synthetic security tests; never mistake these bytes for children's images."""
import hashlib
import json
import pathlib
import tempfile
import unittest
import zipfile
import importlib.util

SOURCE = pathlib.Path(__file__).with_name('verify_original_views_zip.py')
spec = importlib.util.spec_from_file_location('views_validator', SOURCE)
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)
PREFIX = validator.PREFIX


def fake_png():
    # Deliberately synthetic header-only data; tests SHA/pin/dimension logic.
    return validator.PNG_SIGNATURE + (13).to_bytes(4, 'big') + b'IHDR' + (1254).to_bytes(4, 'big') * 2 + b'\x08\x06\x00\x00\x00' + b'\x00' * 4


def fake_jpeg():
    return b'\xff\xd8\xff\xc0\x00\x0b\x08' + (1254).to_bytes(2, 'big') * 2 + b'\x03\x01\x11\x00\xff\xd9'


class OriginalViewVerification(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = pathlib.Path(self.tmp.name)
        self.zip_path = self.home / 'source.zip'
        self.registry_path = self.home / 'registry.json'
        self.records = {}
        self.registry = {'sourceLibraryArchive': PREFIX + 'Originale_10_Ansichten_20261011.zip',
                         'original2DViews': {'boy': [], 'girl': []}}
        for character, folder in [('boy', 'junge'), ('girl', 'maedchen')]:
            for n in range(1, 6):
                ext = '.png' if n % 2 == 0 else '.jpeg'
                name = f'{folder}/{n:02d}_test{ext}'
                data = fake_png() if ext == '.png' else fake_jpeg()
                self.records[name] = data
                self.registry['original2DViews'][character].append({
                    'libraryPath': PREFIX + name, 'sha256': hashlib.sha256(data).hexdigest(),
                    'original2D': True, 'approved3D': False})
        # Fixture JPEGs/PNGs can have equal hashes: add differing padding bytes
        # in a deterministic way, with JPEG EOI still at the end.
        for i, (name, data) in enumerate(list(self.records.items())):
            self.records[name] = (data[:-2] + bytes([i + 1]) + data[-2:]
                                  if name.endswith('.jpeg') else data + bytes([i + 1]))
            pin = self.registry['original2DViews']['boy' if name.startswith('junge') else 'girl'][i % 5]
            pin['sha256'] = hashlib.sha256(self.records[name]).hexdigest()
        self.write()

    def write(self, *, extra=None, remove=None, manifest_edit=None):
        self.registry_path.write_text(json.dumps(self.registry), encoding='utf-8')
        entries = []
        for name, data in self.records.items():
            if name == remove:
                continue
            entries.append({'archive_path': name, 'sha256': hashlib.sha256(data).hexdigest(),
                            'bytes': len(data), 'dimensions': [1254, 1254],
                            'character': name.split('/')[0]})
        if manifest_edit:
            manifest_edit(entries)
        with zipfile.ZipFile(self.zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            for name, data in self.records.items():
                if name != remove:
                    z.writestr(name, data)
            z.writestr('original-reference-manifest.json', json.dumps({'assets': entries}))
            if extra:
                z.writestr(extra[0], extra[1])

    def test_ten_exact_pinned_views(self):
        r = validator.verify(self.zip_path, self.registry_path)
        self.assertTrue(r['original2DSourcePackVerified'])
        self.assertEqual(r['sourceCount'], 10)
        self.assertFalse(r['productionReady'])
        self.assertFalse(r['realOriginal3DGLBVerified'])

    def test_reject_file_corruption_even_if_manifest_changed(self):
        name = next(iter(self.records))
        data = self.records[name]
        self.records[name] = data[:-2] + b'\x30' + data[-1:]
        self.write()
        with self.assertRaisesRegex(ValueError, 'SHA-256 mismatch'):
            validator.verify(self.zip_path, self.registry_path)

    def test_reject_missing_view(self):
        self.write(remove=next(iter(self.records)))
        with self.assertRaisesRegex(ValueError, 'Missing original views'):
            validator.verify(self.zip_path, self.registry_path)

    def test_reject_zip_traversal(self):
        self.write(extra=('../escape.png', b'x'))
        with self.assertRaisesRegex(ValueError, 'Unsafe archive entry'):
            validator.verify(self.zip_path, self.registry_path)

    def test_reject_wrong_original_3d_approval(self):
        self.registry['original2DViews']['boy'][0]['approved3D'] = True
        self.write()
        with self.assertRaisesRegex(ValueError, 'source-vs-3D'):
            validator.verify(self.zip_path, self.registry_path)

    def test_reject_archive_manifest_change(self):
        self.write(manifest_edit=lambda rows: rows[0].update(dimensions=[1000, 1000]))
        with self.assertRaisesRegex(ValueError, 'manifest disagrees'):
            validator.verify(self.zip_path, self.registry_path)

    def test_reject_unapproved_extra(self):
        self.write(extra=('3d_fake.glb', b'fake'))
        with self.assertRaisesRegex(ValueError, 'unapproved ZIP member'):
            validator.verify(self.zip_path, self.registry_path)

    def test_reject_bad_dimensions(self):
        key = next(name for name in self.records if name.endswith('.png'))
        data = self.records[key]
        self.records[key] = data[:16] + (1350).to_bytes(4, 'big') + data[20:]
        # New correct pin, but physical image wrong; dimensional gate still fails.
        for entry in self.registry['original2DViews']['boy'] + self.registry['original2DViews']['girl']:
            if entry['libraryPath'] == PREFIX + key:
                entry['sha256'] = hashlib.sha256(self.records[key]).hexdigest()
        self.write()
        with self.assertRaisesRegex(ValueError, 'Unexpected source dimensions'):
            validator.verify(self.zip_path, self.registry_path)


if __name__ == '__main__':
    unittest.main()
