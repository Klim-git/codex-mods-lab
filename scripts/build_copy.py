"""Build an isolated, version-pinned Codex app copy from a user's own installation."""
import argparse, copy, hashlib, json, os, pathlib, shutil, struct, subprocess, sys
from asar_util import Asar

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROJECT = 'codex-mods-lab'
SUPPORTED_VERSION = '26.1007.21434'
SUPPORTED_ASAR_SHA256 = 'c5fdef328cfa2ad9095786f9c3a7aaa447e68834d31299d6ef2592da02029038'
LAUNCH_GUARD = "// Kliment Mods Lab: refuse a launch that could use the primary profile.\n{const modsPath=require('node:path');const modsRoot=modsPath.resolve(process.resourcesPath,'../..');\nconst modsExpectedUserData=modsPath.join(modsRoot,'app-data');const modsExpectedHome=modsPath.join(modsRoot,'codex-home');\nif(!process.env.KLIMENT_MODS_LAB_ROOT||modsPath.resolve(process.env.KLIMENT_MODS_LAB_ROOT)!==modsRoot||\n!process.env.CODEX_ELECTRON_USER_DATA_PATH||modsPath.resolve(process.env.CODEX_ELECTRON_USER_DATA_PATH)!==modsExpectedUserData||\n!process.env.CODEX_HOME||modsPath.resolve(process.env.CODEX_HOME)!==modsExpectedHome){\nprocess.stderr.write('Use Launch-Mods.ps1 to start the isolated Mods Lab copy.\\n');process.exit(78);}}\n// Label windows of this experiment so they are distinguishable from the installed app.\nrequire('electron').app.on('browser-window-created',(_modsEvent,modsWindow)=>{\nmodsWindow.on('page-title-updated',(modsEvent,modsTitle)=>{const modsSuffix=' · Моды (тест)';\nif(!modsTitle.endsWith(modsSuffix)){modsEvent.preventDefault();modsWindow.setTitle(modsTitle+modsSuffix);}});\nmodsWindow.setTitle('Моды · тестовая копия');});\n"
SETTINGS = 'webview/assets/settings-page-6c4c55bd9144.js'
BOOTSTRAP = '.vite/build/bootstrap-487kJHw_.js'
ENTRY = '.vite/build/early-bootstrap.js'
INITIAL = 'webview/assets/app-initial-b8e1c8014bb4.js'
LOCAL_THREAD = 'webview/assets/local-conversation-thread-70abb87ab9c8.js'
LOCAL_TURN = 'webview/assets/local-conversation-turn-dd4feee2fc9e.js'
CHATGPT_PAGE = 'webview/assets/chatgpt-conversation-page-d6ceb517cb3b.js'
CHATGPT_TURN = 'webview/assets/chatgpt-conversation-turn-content-dc8fb988ef91.js'
MODULE = 'webview/assets/jarvis-mods-native.js'
MODULES = [MODULE, 'webview/assets/jarvis-mods-state.js', 'webview/assets/jarvis-context-bar.js', 'webview/assets/jarvis-bookmarks-state.js', 'webview/assets/jarvis-bookmarks.js']

def replace_once(source, old, new):
    if source.count(old) != 1: raise RuntimeError('Patch does not match this version: '+old[:100])
    return source.replace(old, new)

def patch_settings(source):
    source = replace_once(source, 'import{n as e,o as t,t as n}', "import{JarvisModsPanel}from'./jarvis-mods-native.js';\nimport{n as e,o as t,t as n}")
    source = replace_once(source, 'let y=v,b=ne(f).kind===`local`', 'let jarvisModsActive=u.pathname===`/settings/general-settings`&&new URLSearchParams(u.search).get(`jarvis-mods`)===`1`;let y=v,b=ne(f).kind===`local`')
    source = replace_once(source, 'let Fe;e[72]', 'if(jarvisModsActive)Pe=(0,$.jsx)(At,{title:`Моды`,children:(0,$.jsx)(JarvisModsPanel,{})});let Fe;e[72]')
    source = replace_once(source, 'let Ke=h==null?We:`plugins-settings`', 'let Ke=jarvisModsActive?`kliment-mods`:h==null?We:`plugins-settings`')
    # Use the existing plugin navigation callback so the normal pending-save guard stays active.
    anchor = '}),null]},e.key)),t[65]=Ke'
    button = '}),e.key===`integrations`&&C?(0,Q.jsx)(vt,{"aria-label":`Моды`,label:`Моды`,icon:(0,Q.jsx)(In,{}),isActive:a===`kliment-mods`,"data-settings-panel-slug":`kliment-mods`,onClick:()=>R({kind:`plugin`,path:`/settings/general-settings?jarvis-mods=1`}),weightClassName:`font-normal`}):null]},e.key)),t[65]=Ke'
    source = replace_once(source, anchor, button)
    source = replace_once(source, '...(n==null?void 0:F)?.map(Ir)??[],...b&&It(i,A)>0?', '...(n==null?void 0:F)?.map(Ir)??[],...n!=null&&N&&[`Моды`,`mods`].some(e=>It(e,A)>0)?[{id:`kliment-mods-native`,kind:`plugin`,label:`Моды`,panelLabel:`Моды`,path:`/settings/general-settings?jarvis-mods=1`,sectionSlug:`plugins-settings`}]:[],...b&&It(i,A)>0?')
    source = replace_once(source, 'if(e===x&&!l&&h==null', 'if(!jarvisModsActive&&e===x&&!l&&h==null')
    return source

def patch_composer(source):
    start = source.index('function cLt(')
    end = source.index('function ', start + len('function cLt('))
    composer = source[start:end]
    composer = replace_once(composer, 'onDrop:_,children:n}),t[20]=n', 'onDrop:_,children:[(0,ZS.jsx)(JarvisContextBarRoot,{isDocument:V},`kliment-context-bar`),n]}),t[20]=n')
    return "import{JarvisContextBarRoot}from'./jarvis-context-bar.js';\n" + source[:start] + composer + source[end:]

def patch_mods_rail(source):
    source = replace_once(source, 'children:[z,B,V,H,k,A]}),t[90]', 'children:[z,B,V,H,k,A,(0,O2.jsx)(JarvisModsRailButton,{onOpenSidebarPopover:u},`kliment-mods-rail`)]}),t[90]')
    return source + '\n\n' + (ROOT/'src/jarvis-mods-rail.js').read_text(encoding='utf-8')

def patch_local_thread(source):
    source = replace_once(source, '"data-content-search-turn-key":s,"data-content-search-unit-key":g,children:y}', '"data-content-search-turn-key":s,"data-content-search-unit-key":g,children:[y,(0,Dk.jsx)(JarvisBookmarkMessageButton,{unitKey:g,turnKey:s,role:`assistant`,item:v},`kliment-bookmark`)]}')
    source = replace_once(source, '"data-content-search-unit-key":d,children:f}', '"data-content-search-unit-key":d,children:[f,(0,Mk.jsx)(JarvisBookmarkMessageButton,{unitKey:d,turnKey:s,role:a.role,item:{text:u}},`kliment-bookmark`)]}')
    start = source.index('function UA(')
    end = source.index('function ', start + len('function UA('))
    thread = source[start:end]
    thread = replace_once(thread, 'return M!=null&&E(w.value.clientThreadId)', 'return(0,ej.jsx)(JarvisBookmarksSurface,{conversationKey:`local:${i}:${t}`,showLauncher:d!==!1,getContainer:()=>Mt.current,onNavigate:async bookmark=>{let turnKey=bookmark.turnKey,itemId=bookmarkItemId(bookmark);if(!fn.current.has(turnKey)){let preview=await Cn(turnKey);if(preview==null||!await hn.prepareMatchForNavigation({contextId:qt,domain:`conversation`,matchIndex:0,turnCursor:preview.turnCursor,turnKey,unitId:itemId}))throw Error(`Bookmark history unavailable`);}Gk(w,{conversationId:t,turnSearchKey:turnKey},!1);await lg();let api=Y.current;if(api==null)throw Error(`Bookmark navigation unavailable`);await api.scrollToKey(fn.current.get(turnKey)??turnKey,element=>findBookmarkTarget(element,bookmark.unitKey),{align:`top`});await lg();},children:M!=null&&E(w.value.clientThreadId)')
    if not thread.endswith(']})}'):
        raise RuntimeError('Unexpected local thread return')
    thread = thread[:-1] + '},`local:${i}:${t}`)}'
    source = source[:start] + thread + source[end:]
    return "import{bookmarkItemId}from'./jarvis-bookmarks-state.js';\nimport{JarvisBookmarksSurface,JarvisBookmarkMessageButton,findBookmarkTarget}from'./jarvis-bookmarks.js';\n" + source

def patch_local_turn(source):
    source = replace_once(source, '"data-content-search-unit-key":sr(u,r),"data-local-conversation-user-anchor":i?!0:void 0,children:n}', '"data-content-search-unit-key":sr(u,r),"data-local-conversation-user-anchor":i?!0:void 0,children:[n,(0,Z.jsx)(JarvisBookmarkMessageButton,{unitKey:sr(u,r),turnKey:u,role:t.type===`user-message`?`user`:t.type===`assistant-message`?`assistant`:null,item:t},`kliment-bookmark`)]}')
    source = replace_once(source, '"data-content-search-unit-key":i==null?void 0:sr(t,i),"data-local-conversation-user-anchor":a?!0:void 0,children:r}', '"data-content-search-unit-key":i==null?void 0:sr(t,i),"data-local-conversation-user-anchor":a?!0:void 0,children:[r,(0,$.jsx)(JarvisBookmarkMessageButton,{unitKey:i==null?null:sr(t,i),turnKey:t,role:n.type===`user-message`?`user`:n.type===`assistant-message`?`assistant`:null,item:n},`kliment-bookmark`)]}')
    return "import{JarvisBookmarkMessageButton}from'./jarvis-bookmarks.js';\n" + source

def patch_chatgpt_page(source):
    source = replace_once(source, ':Et=t[185],Et}', ':Et=t[185],(0,$.jsx)(JarvisBookmarksSurface,{conversationKey:`chatgpt:${s}`,showLauncher:!h&&!m&&!xt,getContainer:()=>Ee.current,onNavigate:async bookmark=>{await Qe(bookmark.turnKey);let turn=Ne().find(entry=>entry.id===bookmark.turnKey);if(turn==null||U==null)throw Error(`Bookmark history unavailable`);await U.scrollToKey(turn.turnKey,element=>findBookmarkTarget(element,bookmark.unitKey),{align:`top`});await Eu();},children:Et},`chatgpt:${s}`)}')
    return "import{JarvisBookmarksSurface,findBookmarkTarget}from'./jarvis-bookmarks.js';\n" + source

def patch_chatgpt_turn(source):
    source = replace_once(source, 'children:[null,(0,$.jsx)($.Fragment,{children:(0,$.jsx)(Dv,{...le})})]', 'children:[null,(0,$.jsx)($.Fragment,{children:(0,$.jsx)(Dv,{...le})}),(0,$.jsx)(JarvisBookmarkMessageButton,{unitKey:F,turnKey:U,role:`user`,item:E},`kliment-bookmark`)]')
    source = replace_once(source, '"data-chatgpt-search-message-ids":i,children:[o,s,p,m,S]', '"data-chatgpt-search-message-ids":i,children:[o,s,p,m,S,(0,$.jsx)(JarvisBookmarkMessageButton,{unitKey:F,turnKey:U,role:`assistant`,item:E},`kliment-bookmark`)]')
    return "import{JarvisBookmarkMessageButton}from'./jarvis-bookmarks.js';\n" + source

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
        if owner.get('project') != PROJECT or owner.get('sourceSha256') != SUPPORTED_ASAR_SHA256:
            raise RuntimeError('Existing output belongs to another project or app version.')
    target = output / 'app'
    # Resolve junctions and symlinks before writing; the app must live inside this output.
    if target.resolve() != target or (output / 'preview').resolve() != output / 'preview':
        raise RuntimeError('Output app/preview must not be a symlink or junction.')
    for relative in ('app/resources', 'app/resources/app.asar', 'app/ChatGPT.exe',
                     'app/resources/owl-app.ini', 'app-data', 'codex-home',
                     'codex-home/config.toml', 'logs', 'copy-manifest.json',
                     'patch-preview.json', '.build-owner.json', 'Launch-Mods.ps1', 'Launch-Mods.cmd'):
        path = output / relative
        if path.resolve() != path:
            raise RuntimeError('Output paths must not be symlinks or junctions: ' + relative)
    return source, output

def prepare_changes(arc):
    patches = {
        SETTINGS: patch_settings,
        INITIAL: lambda text: patch_mods_rail(patch_composer(text)),
        LOCAL_THREAD: patch_local_thread, LOCAL_TURN: patch_local_turn,
        CHATGPT_PAGE: patch_chatgpt_page, CHATGPT_TURN: patch_chatgpt_turn,
    }
    changes = {}
    for name, patch in patches.items():
        before = arc.read(name)
        changes[name] = (before, patch(before.decode('utf-8')).encode('utf-8'))
    before = arc.read(BOOTSTRAP)
    text = replace_once(before.decode('utf-8'),
        'appUpdates:new Kn({enableUpdater:l.t.shouldIncludeUpdater(m,process.platform,process.env)',
        'appUpdates:new Kn({enableUpdater:!1')
    text = replace_once(text, 'function VE(e){let t=X(e),n=t.join(`/`);',
        'function VE(e){let t=X(e),n=t.join(`/`);if(n===`mods`)return{kind:`settings`,section:`general-settings`,search:`?jarvis-mods=1`};')
    changes[BOOTSTRAP] = (before, text.encode('utf-8'))
    before = arc.read(ENTRY)
    changes[ENTRY] = (before, LAUNCH_GUARD.encode('utf-8') + before)
    modules = {name: (ROOT / 'src' / pathlib.PurePosixPath(name).name).read_bytes() for name in MODULES}
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
    if file_hash(archive) != SUPPORTED_ASAR_SHA256:
        raise RuntimeError('Unsupported app archive. This patch supports only version ' + SUPPORTED_VERSION + ' with the SHA-256 recorded in README.md. No files were changed.')
    arc = Asar(archive)
    package = json.loads(arc.read('package.json'))
    if package['version'] != SUPPORTED_VERSION:
        raise RuntimeError('Unsupported app version. No files were changed.')
    changes, modules = prepare_changes(arc)
    old_header = header_hash(archive)
    original_exe = (source / 'ChatGPT.exe').read_bytes() if not args.patch_only else None
    if original_exe is not None and original_exe.count(old_header.encode()) != 1:
        raise RuntimeError('Unexpected executable integrity record. No files were changed.')

    # All version checks and replacement matches succeeded before any output is written.
    output.mkdir(parents=True, exist_ok=True)
    (output / '.build-owner.json').write_text(json.dumps({
        'project': PROJECT, 'sourceSha256': SUPPORTED_ASAR_SHA256,
        'version': SUPPORTED_VERSION}, indent=2) + '\n', encoding='utf-8')
    preview = output / 'preview'
    preview.mkdir(exist_ok=True)
    labels = {SETTINGS: 'settings-page', INITIAL: 'app-initial', BOOTSTRAP: 'bootstrap', ENTRY: 'early-bootstrap'}
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
            '[Owl]\nUserDataDirectoryName=Codex-Mods-Lab\nAppVersion=' + SUPPORTED_VERSION + '\n', encoding='utf-8')
        for name in ('app-data', 'codex-home', 'logs'):
            (output / name).mkdir(exist_ok=True)
        config = output / 'codex-home/config.toml'
        if not config.exists():
            config.write_text('# Isolated Mods Lab profile. No original configuration copied.\n', encoding='utf-8')
        for name in ('Launch-Mods.ps1', 'Launch-Mods.cmd'):
            shutil.copyfile(ROOT / 'scripts' / name, output / name)
    manifest = {
        'project': PROJECT, 'source': str(source), 'sourceVersion': package['version'],
        'sourceSha256': SUPPORTED_ASAR_SHA256, 'copy': str(target),
        'changes': {name: {'beforeSha256': hashlib.sha256(before).hexdigest(),
                           'afterSha256': hashlib.sha256(after).hexdigest()}
                    for name, (before, after) in changes.items()},
        'newModule': MODULE, 'newModules': MODULES,
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

