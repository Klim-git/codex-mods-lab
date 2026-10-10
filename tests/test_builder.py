"""Tests use synthetic archives, never redistributed application bundles."""
import hashlib
import json
import pathlib
import struct
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
import build_copy as builder
from asar_util import Asar


def make_archive(path):
    tree = {'files': {'webview': {'files': {'assets': {'files': {
        'unchanged.js': {'size': 3, 'offset': '0'},
        'changed.js': {'size': 3, 'offset': '3'}}}}}}}
    header = json.dumps(tree, separators=(',', ':')).encode()
    padding = -len(header) % 4
    path.write_bytes(struct.pack('<4I', 4, 8 + len(header) + padding,
                                4 + len(header) + padding, len(header)) +
                     header + b'\0' * padding + b'oldABC')


class BuilderTests(unittest.TestCase):
    def test_preserves_original_payload_and_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            source, target = pathlib.Path(directory) / 'source.asar', pathlib.Path(directory) / 'copy.asar'
            make_archive(source)
            original_bytes = source.read_bytes()
            changes = {'webview/assets/changed.js': b'replacement', 'webview/assets/new.js': b'added'}
            builder.write_archive(source, target, changes)
            before, after = Asar(source), Asar(target)
            self.assertEqual(source.read_bytes(), original_bytes)
            self.assertEqual(after.entry('webview/assets/unchanged.js'), before.entry('webview/assets/unchanged.js'))
            self.assertEqual(after.read('webview/assets/unchanged.js'), b'old')
            self.assertEqual(target.read_bytes()[after.base:after.base + 6], b'oldABC')
            for name, data in changes.items():
                self.assertEqual(after.read(name), data)
                self.assertEqual(after.entry(name)['integrity']['hash'], hashlib.sha256(data).hexdigest())
            self.assertNotEqual(builder.header_hash(source), builder.header_hash(target))

    def test_refuses_original_and_arbitrary_output_folders(self):
        with tempfile.TemporaryDirectory() as directory:
            base = pathlib.Path(directory)
            source = base / 'installed-app'
            source.mkdir()
            for output in (source, source / 'mods', base):
                with self.assertRaises(RuntimeError):
                    builder.validate_paths(source, output)
            output = base / 'my-files'
            output.mkdir()
            (output / 'keep.txt').write_text('personal file')
            with self.assertRaises(RuntimeError):
                builder.validate_paths(source, output)
            self.assertEqual((output / 'keep.txt').read_text(), 'personal file')
            fresh = base / 'new-copy'
            self.assertEqual(builder.validate_paths(source, fresh)[1], fresh.resolve())
            self.assertFalse(fresh.exists())

    def test_refuses_redirected_app_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            base = pathlib.Path(directory)
            source, output = base / 'installed-app', base / 'mods'
            source.mkdir()
            output.mkdir()
            (output / '.build-owner.json').write_text(json.dumps({
                'project': builder.PROJECT, 'sourceSha256': builder.SUPPORTED_ASAR_SHA256}))
            try:
                (output / 'app').symlink_to(source, target_is_directory=True)
            except OSError:
                self.skipTest('Directory symlinks require permission on this system.')
            with self.assertRaises(RuntimeError):
                builder.validate_paths(source, output)

    def test_replacements_fail_when_bundle_has_changed(self):
        for source in ('needle needle', 'something else'):
            with self.assertRaises(RuntimeError):
                builder.replace_once(source, 'needle', 'patched')

    def test_unknown_archive_does_not_create_output(self):
        with tempfile.TemporaryDirectory() as directory:
            base = pathlib.Path(directory)
            source, output = base / 'installed-app', base / 'new-copy'
            (source / 'resources').mkdir(parents=True)
            archive = source / 'resources/app.asar'
            make_archive(archive)
            original = archive.read_bytes()
            result = subprocess.run([sys.executable, str(builder.ROOT / 'scripts/build_copy.py'),
                                     '--source-app', str(source), '--output', str(output), '--patch-only'],
                                    capture_output=True, text=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn('Unsupported app archive', result.stderr)
            self.assertFalse(output.exists())
            self.assertEqual(archive.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
