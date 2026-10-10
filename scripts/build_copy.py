"""Build an isolated, version-pinned Codex app copy from a user's own installation."""
import argparse, copy, hashlib, json, os, pathlib, shutil, struct, subprocess, sys
from asar_util import Asar

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROJECT = 'codex-mods-lab'
from adapters import select_adapter, current_adapter, ADAPTERS
from adapters.codex_26_1007_21434 import patch_community_csp, replace_once
SUPPORTED_VERSION = current_adapter.SUPPORTED_VERSION
SUPPORTED_ASAR_SHA256 = current_adapter.SUPPORTED_ASAR_SHA256
MODULE = 'webview/assets/jarvis-mods-native.js'
MODULES = [MODULE, 'webview/assets/jarvis-mods-state.js', 'webview/assets/jarvis-context-bar.js', 'webview/assets/jarvis-bookmarks-state.js', 'webview/assets/jarvis-bookmarks.js', 'webview/assets/jarvis-mods-i18n.js', 'webview/assets/jarvis-visual-mods-state.js', 'webview/assets/jarvis-visual-mods-library.js', 'webview/assets/jarvis-visual-mods-runtime.js', 'webview/assets/jarvis-community-state.js', 'webview/assets/jarvis-community-library.js']
MODULES += ['webview/assets/jarvis-functional-mods-state.js', 'webview/assets/jarvis-mod-packages.js', 'webview/assets/jarvis-functional-mods-runtime.js', 'webview/assets/jarvis-host-adapter.js', 'webview/assets/jarvis-mods-core.js', 'webview/assets/jarvis-safe-mode.js', 'webview/assets/jarvis-recovery-manager.js', '.vite/build/jarvis-safe-mode-preload.cjs']
MODULES += ['webview/assets/jarvis-mods-rail.js']

def write_archive(original, target, changes):
    arc = Asar(original); tree = copy.deepcopy(arc.tree)
    data_size = original.stat().st_size-arc.base
    additions = []
    for name,data in changes.items():
        node=tree
        parts=name.split('/')
        for part in parts[:-1]: node=node['files'][part]
        block_size=4*1024*1024
        node['files'][parts[-1]] = {'size':len(data),'offset':str(data_size),'integrity':{'algorithm':'SHA256','hash':hashlib.sha256(data).hexdigest(),'blockSize':block_size,'blocks':[hashlib.sha256(data[i:i+block_size]).hexdigest() for i in range(0,len(data),block_size)]}}
        additions.append(data); data_size+=len(data)
    raw=json.dumps(tree, ensure_ascii=False, separators=(',',':')).encode('utf-8')
    padding=(-len(raw))%4
    tmp=target.with_suffix('.new')
    with original.open('rb') as src, tmp.open('wb') as dst:
        dst.write(struct.pack('<4I',4,8+len(raw)+padding,4+len(raw)+padding,len(raw)))
        dst.write(raw); dst.write(b'\0'*padding)
        src.seek(arc.base); shutil.copyfileobj(src,dst,1024*1024)
        for data in additions: dst.write(data)
    tmp.replace(target)

def header_hash(path):
    arc=Asar(path)
    with path.open('rb') as f:
        f.seek(16)
        return hashlib.sha256(f.read(arc.header[3])).hexdigest()

def file_hash(path):
    digest = hashlib.sha256()
    with pathlib.Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()

def copy_path(path):
    """Use Windows extended paths for the application's deeply nested dependencies."""
    value = str(pathlib.Path(path).resolve())
    if os.name != 'nt' or value.startswith('\\\\?\\'):
        return value
    if value.startswith('\\\\'):
        return '\\\\?\\UNC\\' + value[2:]
    return '\\\\?\\' + value

def detect_source():
    if os.name != 'nt':
        raise RuntimeError('Auto-detection requires Windows. Specify --source-app for an offline preview.')
    command = ('Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | '
               'Select-Object -First 1 -ExpandProperty InstallLocation')
    result = subprocess.run(['powershell.exe', '-NoProfile', '-Command', command],
                            check=True, capture_output=True, text=True)
    location = result.stdout.strip()
    if not location:
        raise RuntimeError('Codex installation was not found. Specify --source-app <app directory>.')
    return pathlib.Path(location) / 'app'

def validate_paths(source, output):
    source, output = source.resolve(), output.resolve()
    if source == output or source in output.parents or output in source.parents:
        raise RuntimeError('Output must not overlap the original installation.')
    if output == ROOT or output in ROOT.parents:
        raise RuntimeError('Output must not replace the source repository.')
    if output == pathlib.Path(output.anchor):
        raise RuntimeError('Output must not be a filesystem root.')
    # Never reuse a folder of arbitrary user files, even when it has an app subfolder.
    if output.exists() and any(output.iterdir()):
        marker = output / '.build-owner.json'
        if not marker.is_file():
            raise RuntimeError('Existing output is not a Mods Lab build. Choose a new empty directory.')
        owner = json.loads(marker.read_text(encoding='utf-8'))
        if owner.get('project') != PROJECT or owner.get('sourceSha256') not in {adapter.SUPPORTED_ASAR_SHA256 for adapter in ADAPTERS}:
            raise RuntimeError('Existing output belongs to another project or app version.')
    target = output / 'app'
    # Resolve junctions and symlinks before writing; the app must live inside this output.
    if target.resolve() != target or (output / 'preview').resolve() != output / 'preview':
        raise RuntimeError('Output app/preview must not be a symlink or junction.')
    for relative in ('app/resources', 'app/resources/app.asar', 'app/ChatGPT.exe',
                     'app/resources/owl-app.ini', 'app-data', 'codex-home',
                     'codex-home/config.toml', 'logs', 'copy-manifest.json',
                     'patch-preview.json', '.build-owner.json', 'Launch-Mods.ps1', 'Launch-Mods.cmd', 'Launch-Safe-Mode.cmd'):
        path = output / relative
        if path.resolve() != path:
            raise RuntimeError('Output paths must not be symlinks or junctions: ' + relative)
    return source, output

def prepare_changes(arc, adapter=current_adapter):
    guard = (ROOT / 'src/jarvis-launch-guard.cjs').read_text(encoding='utf-8')
    changes = adapter.prepare_patches(arc, guard)
    modules = {name: (ROOT / 'src' / pathlib.PurePosixPath(name).name).read_bytes() for name in MODULES}
    modules['webview/assets/jarvis-host-adapter.js'] = adapter.host_module_source()
    return changes, modules


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-app', type=pathlib.Path, help='Original app directory containing ChatGPT.exe and resources/app.asar')
    parser.add_argument('--output', type=pathlib.Path, default=ROOT / '.mods-lab', help='New output directory (default: .mods-lab in this repository)')
    parser.add_argument('--patch-only', action='store_true', help='Create local preview bundles without copying or launching the app')
    args = parser.parse_args()
    source, output = validate_paths(args.source_app or detect_source(), args.output)
    archive = source / 'resources/app.asar'
    source_hash = file_hash(archive)
    if source_hash not in {adapter.SUPPORTED_ASAR_SHA256 for adapter in ADAPTERS}:
        raise RuntimeError('Unsupported app archive. No reviewed adapter matches its SHA-256. No files were changed.')
    arc = Asar(archive)
    package = json.loads(arc.read('package.json'))
    adapter = select_adapter(package['version'], source_hash)
    owner_path = output / '.build-owner.json'
    if owner_path.exists() and json.loads(owner_path.read_text(encoding='utf-8'))['sourceSha256'] != source_hash:
        raise RuntimeError('Existing output belongs to another app build. Choose a fresh output directory.')
    changes, modules = prepare_changes(arc, adapter)
    old_header = header_hash(archive)
    original_exe = (source / 'ChatGPT.exe').read_bytes() if not args.patch_only else None
    if original_exe is not None and original_exe.count(old_header.encode()) != 1:
        raise RuntimeError('Unexpected executable integrity record. No files were changed.')

    # All version checks and replacement matches succeeded before any output is written.
    output.mkdir(parents=True, exist_ok=True)
    (output / '.build-owner.json').write_text(json.dumps({
        'project': PROJECT, 'sourceSha256': source_hash,
        'version': adapter.SUPPORTED_VERSION}, indent=2) + '\n', encoding='utf-8')
    preview = output / 'preview'
    preview.mkdir(exist_ok=True)
    labels = {adapter.SETTINGS: 'settings-page', adapter.INITIAL: 'app-initial', adapter.BOOTSTRAP: 'bootstrap', adapter.ENTRY: 'early-bootstrap'}
    for name, (_, data) in changes.items():
        label = labels.get(name, pathlib.PurePosixPath(name).stem)
        (preview / (label + '.patched.js')).write_bytes(data)
    target = output / 'app'
    binary_changes = {}
    if not args.patch_only:
        if not target.exists() or not (output / 'copy-manifest.json').exists():
            print('Copying the installed app (about 2.3 GB)...', flush=True)
            shutil.copytree(copy_path(source), copy_path(target), symlinks=False, dirs_exist_ok=True)
        print('Writing the patched archive...', flush=True)
        write_archive(archive, target / 'resources/app.asar',
                      {**{name: after for name, (_, after) in changes.items()}, **modules})
        new_header = header_hash(target / 'resources/app.asar')
        patched_exe = original_exe.replace(old_header.encode(), new_header.encode())
        (target / 'ChatGPT.exe').write_bytes(patched_exe)
        binary_changes['ChatGPT.exe'] = {
            'beforeSha256': hashlib.sha256(original_exe).hexdigest(),
            'afterSha256': hashlib.sha256(patched_exe).hexdigest(),
            'originalAsarHeaderHash': old_header, 'copyAsarHeaderHash': new_header,
            'signatureChanged': True}
        (target / 'resources/owl-app.ini').write_text(
            '[Owl]\nUserDataDirectoryName=Codex-Mods-Lab\nAppVersion=' + adapter.SUPPORTED_VERSION + '\n', encoding='utf-8')
        for name in ('app-data', 'codex-home', 'logs'):
            (output / name).mkdir(exist_ok=True)
        config = output / 'codex-home/config.toml'
        if not config.exists():
            config.write_text('# Isolated Mods Lab profile. No original configuration copied.\n', encoding='utf-8')
        for name in ('Launch-Mods.ps1', 'Launch-Mods.cmd', 'Launch-Safe-Mode.cmd'):
            shutil.copyfile(ROOT / 'scripts' / name, output / name)
    manifest = {
        'project': PROJECT, 'source': str(source), 'sourceVersion': package['version'],
        'sourceSha256': source_hash, 'copy': str(target),
        'changes': {name: {'beforeSha256': hashlib.sha256(before).hexdigest(),
                           'afterSha256': hashlib.sha256(after).hexdigest()}
                    for name, (before, after) in changes.items()},
        'newModule': MODULE, 'newModules': MODULES,
        'adapter': {'id': adapter.ADAPTER_ID, 'apiVersion': adapter.API_VERSION, 'appVersion': adapter.SUPPORTED_VERSION},
        'safeMode': {'launcher': 'Launch-Safe-Mode.cmd', 'preload': '.vite/build/jarvis-safe-mode-preload.cjs', 'preferencesOverwritten': False},
        'installedMods': ['context-bar', 'bookmarks'], 'binaryChanges': binary_changes,
        'isolation': {'userData': str(output / 'app-data'), 'codexHome': str(output / 'codex-home'),
                      'credentialsCopied': False, 'updatesEnabled': False}}
    (output / ('patch-preview.json' if args.patch_only else 'copy-manifest.json')).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Prepared preview.' if args.patch_only else 'Created isolated copy. Open .mods-lab/Launch-Mods.cmd (or the launcher in your custom output directory).', flush=True)

if __name__ == '__main__':
    try:
        main()
    except (OSError, RuntimeError, KeyError, ValueError, subprocess.SubprocessError) as error:
        print('Build stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)

