"""Verify an already-built local copy without inspecting chat or authentication data."""
import argparse
import hashlib
import json
import pathlib
from asar_util import Asar
from build_copy import ROOT, SUPPORTED_ASAR_SHA256, file_hash, header_hash


def range_hash(path, offset, length):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        stream.seek(offset)
        while length:
            chunk = stream.read(min(length, 4 * 1024 * 1024))
            if not chunk:
                raise RuntimeError('Archive was truncated.')
            digest.update(chunk)
            length -= len(chunk)
    return digest.hexdigest()


def verify(output):
    manifest = json.loads((output / 'copy-manifest.json').read_text(encoding='utf-8'))
    source_root = pathlib.Path(manifest['source'])
    source = Asar(source_root / 'resources/app.asar')
    target = Asar(output / 'app/resources/app.asar')
    if file_hash(source.path) != SUPPORTED_ASAR_SHA256:
        raise RuntimeError('The original archive changed; the saved build no longer matches it.')
    original, modified = dict(source.files()), dict(target.files())
    new_modules = set(manifest['newModules'])
    allowed = set(manifest['changes']) | new_modules
    assert set(modified) - set(original) == new_modules
    assert set(original) - set(modified) == set()
    for name, metadata in original.items():
        if name not in allowed:
            assert metadata == modified[name], name
    for name, metadata in manifest['changes'].items():
        assert hashlib.sha256(source.read(name)).hexdigest() == metadata['beforeSha256'], name
        data = target.read(name)
        assert hashlib.sha256(data).hexdigest() == metadata['afterSha256'], name
        assert modified[name]['integrity']['hash'] == metadata['afterSha256'], name
        block_size = modified[name]['integrity']['blockSize']
        assert modified[name]['integrity']['blocks'] == [
            hashlib.sha256(data[i:i + block_size]).hexdigest() for i in range(0, len(data), block_size)], name
    for name in new_modules:
        data = target.read(name)
        assert data == (ROOT / 'src' / pathlib.PurePosixPath(name).name).read_bytes(), name
        assert modified[name]['integrity']['hash'] == hashlib.sha256(data).hexdigest(), name
    for name, metadata in manifest['binaryChanges'].items():
        before = (source_root / name).read_bytes()
        after = (output / 'app' / name).read_bytes()
        assert hashlib.sha256(before).hexdigest() == metadata['beforeSha256']
        assert hashlib.sha256(after).hexdigest() == metadata['afterSha256']
        assert header_hash(source.path) == metadata['originalAsarHeaderHash']
        assert header_hash(target.path) == metadata['copyAsarHeaderHash']
        assert before.replace(metadata['originalAsarHeaderHash'].encode(), metadata['copyAsarHeaderHash'].encode()) == after
    length = source.path.stat().st_size - source.base
    assert range_hash(source.path, source.base, length) == range_hash(target.path, target.base, length)
    assert 'Codex-Mods-Lab' in (output / 'app/resources/owl-app.ini').read_text(encoding='utf-8')
    assert manifest['isolation']['credentialsCopied'] is False
    assert manifest['isolation']['updatesEnabled'] is False
    return {'status': 'passed', 'originalEntries': len(original),
            'modifiedEntries': len(manifest['changes']), 'addedModules': len(new_modules),
            'originalPayloadPreserved': True, 'sourceArchiveSha256': file_hash(source.path),
            'copyArchiveSha256': file_hash(target.path)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=pathlib.Path, default=ROOT / '.mods-lab')
    args = parser.parse_args()
    print(json.dumps(verify(args.output.resolve()), indent=2))
