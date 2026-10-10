"""Reviewed patch points and host bindings for one exact Windows build."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
ADAPTER_ID = "codex-windows-26.1007.21434"
API_VERSION = 1
SUPPORTED_VERSION = '26.1007.21434'
SUPPORTED_ASAR_SHA256 = 'c5fdef328cfa2ad9095786f9c3a7aaa447e68834d31299d6ef2592da02029038'
SETTINGS = 'webview/assets/settings-page-6c4c55bd9144.js'
BOOTSTRAP = '.vite/build/bootstrap-487kJHw_.js'
ENTRY = '.vite/build/early-bootstrap.js'
INITIAL = 'webview/assets/app-initial-b8e1c8014bb4.js'
LOCAL_THREAD = 'webview/assets/local-conversation-thread-70abb87ab9c8.js'
LOCAL_TURN = 'webview/assets/local-conversation-turn-dd4feee2fc9e.js'
CHATGPT_PAGE = 'webview/assets/chatgpt-conversation-page-d6ceb517cb3b.js'
CHATGPT_TURN = 'webview/assets/chatgpt-conversation-turn-content-dc8fb988ef91.js'

def patch_community_csp(source):
    # Allow only the two fixed community endpoints in the isolated copy.
    return replace_once(source, 'connect-src &#39;self&#39; blob:',
        'connect-src &#39;self&#39; blob: https://raw.githubusercontent.com https://api.github.com')

def replace_once(source, old, new):
    if source.count(old) != 1: raise RuntimeError('Patch does not match this version: '+old[:100])
    return source.replace(old, new)

def patch_settings(source):
    source = replace_once(source, 'import{n as e,o as t,t as n}', "import{JarvisModsPanel}from'./jarvis-mods-core.js';\nimport{useModsLanguage,modText}from'./jarvis-mods-i18n.js';\nimport{n as e,o as t,t as n}")
    source = replace_once(source, 'let y=v,b=ne(f).kind===`local`', 'let jarvisPanelLanguage=useModsLanguage();let jarvisModsActive=u.pathname===`/settings/general-settings`&&new URLSearchParams(u.search).get(`jarvis-mods`)===`1`;let y=v,b=ne(f).kind===`local`')
    source = replace_once(source, 'let Fe;e[72]', 'if(jarvisModsActive)Pe=(0,$.jsx)(At,{title:modText(jarvisPanelLanguage,`mods`),children:(0,$.jsx)(JarvisModsPanel,{})});let Fe;e[72]')
    source = replace_once(source, 'let Ke=h==null?We:`plugins-settings`', 'let Ke=jarvisModsActive?`kliment-mods`:h==null?We:`plugins-settings`')
    # Use the existing plugin navigation callback so the normal pending-save guard stays active.
    anchor = '}),null]},e.key)),t[65]=Ke'
    button = '}),e.key===`integrations`&&C?(0,Q.jsx)(vt,{"aria-label":modText(jarvisLanguage,`mods`),label:modText(jarvisLanguage,`mods`),icon:(0,Q.jsx)(In,{}),isActive:a===`kliment-mods`,"data-settings-panel-slug":`kliment-mods`,onClick:()=>R({kind:`plugin`,path:`/settings/general-settings?jarvis-mods=1`}),weightClassName:`font-normal`}):null]},e.key)),t[65]=Ke'
    source = replace_once(source, anchor, button)
    source = replace_once(source, '...(n==null?void 0:F)?.map(Ir)??[],...b&&It(i,A)>0?', '...(n==null?void 0:F)?.map(Ir)??[],...n!=null&&N&&[`Моды`,`mods`].some(e=>It(e,A)>0)?[{id:`kliment-mods-native`,kind:`plugin`,label:modText(jarvisLanguage,`mods`),panelLabel:modText(jarvisLanguage,`mods`),path:`/settings/general-settings?jarvis-mods=1`,sectionSlug:`plugins-settings`}]:[],...b&&It(i,A)>0?')
    # The compiled sidebar cache has no dependency on mod preferences. Reserve one
    # slot to invalidate it when the resolved mod language changes.
    source = replace_once(source, 'function Or(e){let t=(0,Jr.c)(149),{onSelectPlugin:n',
        'function Or(e){let t=(0,Jr.c)(150),jarvisLanguage=useModsLanguage();if(t[149]!==jarvisLanguage){t.fill(Symbol.for(`react.memo_cache_sentinel`));t[149]=jarvisLanguage}let{onSelectPlugin:n')
    source = replace_once(source, 'if(e===x&&!l&&h==null', 'if(!jarvisModsActive&&e===x&&!l&&h==null')
    return source

def patch_composer(source):
    start = source.index('function cLt(')
    end = source.index('function ', start + len('function cLt('))
    composer = source[start:end]
    composer = replace_once(composer, 'onDrop:_,children:n}),t[20]=n', 'onDrop:_,children:[(0,ZS.jsx)(JarvisContextBarRoot,{isDocument:V},`kliment-context-bar`),(0,ZS.jsx)(JarvisFunctionalActionsRoot,{isDocument:V},`kliment-functional-actions`),n]}),t[20]=n')
    return "import{JarvisFunctionalActionsRoot}from'./jarvis-mods-core.js';\nimport{JarvisContextBarRoot}from'./jarvis-mods-core.js';\n" + source[:start] + composer + source[end:]

def patch_mods_rail(source):
    source = replace_once(source, 'children:[z,B,V,H,k,A]}),t[90]', 'children:[z,B,V,H,k,A,(0,O2.jsx)(JarvisModsRailButton,{onOpenSidebarPopover:u},`kliment-mods-rail`),(0,O2.jsx)(JarvisVisualStylesRoot,{},`kliment-visual-styles`)]}),t[90]')
    return "import{renderModsRail}from'./jarvis-mods-rail.js';\nimport{JarvisVisualStylesRoot}from'./jarvis-mods-core.js';\nimport{useModsLanguage,modText}from'./jarvis-mods-i18n.js';\n" + source + '\n\n' + (ROOT/'scripts/adapters/codex_26_1007_21434_rail.js').read_text(encoding='utf-8')

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
    source = replace_once(source, '"data-content-search-unit-key":g,children:[y', '"data-content-search-unit-key":g,"data-kliment-message-role":`assistant`,children:[y')
    source = replace_once(source, '"data-content-search-unit-key":d,children:[f', '"data-content-search-unit-key":d,"data-kliment-message-role":a.role,children:[f')
    return "import{bookmarkItemId}from'./jarvis-bookmarks-state.js';\nimport{JarvisBookmarksSurface,JarvisBookmarkMessageButton,findBookmarkTarget}from'./jarvis-mods-core.js';\n" + source

def patch_local_turn(source):
    source = replace_once(source, '"data-content-search-unit-key":sr(u,r),"data-local-conversation-user-anchor":i?!0:void 0,children:n}', '"data-content-search-unit-key":sr(u,r),"data-local-conversation-user-anchor":i?!0:void 0,children:[n,(0,Z.jsx)(JarvisBookmarkMessageButton,{unitKey:sr(u,r),turnKey:u,role:t.type===`user-message`?`user`:t.type===`assistant-message`?`assistant`:null,item:t},`kliment-bookmark`)]}')
    source = replace_once(source, '"data-content-search-unit-key":i==null?void 0:sr(t,i),"data-local-conversation-user-anchor":a?!0:void 0,children:r}', '"data-content-search-unit-key":i==null?void 0:sr(t,i),"data-local-conversation-user-anchor":a?!0:void 0,children:[r,(0,$.jsx)(JarvisBookmarkMessageButton,{unitKey:i==null?null:sr(t,i),turnKey:t,role:n.type===`user-message`?`user`:n.type===`assistant-message`?`assistant`:null,item:n},`kliment-bookmark`)]}')
    source = replace_once(source, '"data-content-search-unit-key":sr(u,r),', '"data-content-search-unit-key":sr(u,r),"data-kliment-message-role":t.type===`user-message`?`user`:t.type===`assistant-message`?`assistant`:void 0,')
    source = replace_once(source, '"data-content-search-unit-key":i==null?void 0:sr(t,i),', '"data-content-search-unit-key":i==null?void 0:sr(t,i),"data-kliment-message-role":n.type===`user-message`?`user`:n.type===`assistant-message`?`assistant`:void 0,')
    return "import{JarvisBookmarkMessageButton}from'./jarvis-mods-core.js';\n" + source

def patch_chatgpt_page(source):
    source = replace_once(source, ':Et=t[185],Et}', ':Et=t[185],(0,$.jsx)(JarvisBookmarksSurface,{conversationKey:`chatgpt:${s}`,showLauncher:!h&&!m&&!xt,getContainer:()=>Ee.current,onNavigate:async bookmark=>{await Qe(bookmark.turnKey);let turn=Ne().find(entry=>entry.id===bookmark.turnKey);if(turn==null||U==null)throw Error(`Bookmark history unavailable`);await U.scrollToKey(turn.turnKey,element=>findBookmarkTarget(element,bookmark.unitKey),{align:`top`});await Eu();},children:Et},`chatgpt:${s}`)}')
    return "import{JarvisBookmarksSurface,findBookmarkTarget}from'./jarvis-mods-core.js';\n" + source

def patch_chatgpt_turn(source):
    source = replace_once(source, 'children:[null,(0,$.jsx)($.Fragment,{children:(0,$.jsx)(Dv,{...le})})]', 'children:[null,(0,$.jsx)($.Fragment,{children:(0,$.jsx)(Dv,{...le})}),(0,$.jsx)(JarvisBookmarkMessageButton,{unitKey:F,turnKey:U,role:`user`,item:E},`kliment-bookmark`)]')
    source = replace_once(source, '"data-chatgpt-search-message-ids":i,children:[o,s,p,m,S]', '"data-chatgpt-search-message-ids":i,children:[o,s,p,m,S,(0,$.jsx)(JarvisBookmarkMessageButton,{unitKey:F,turnKey:U,role:`assistant`,item:E},`kliment-bookmark`)]')
    source = replace_once(source, '"data-content-search-unit-key":F,children:(0,$.jsxs)(Ql.Provider', '"data-content-search-unit-key":F,"data-kliment-message-role":`user`,children:(0,$.jsxs)(Ql.Provider')
    source = replace_once(source, '"data-chatgpt-search-message-ids":i,children:', '"data-chatgpt-search-message-ids":i,"data-kliment-message-role":`assistant`,children:')
    return "import{JarvisBookmarkMessageButton}from'./jarvis-mods-core.js';\n" + source


def prepare_patches(arc, launch_guard):
    patches = {
        'webview/index.html': patch_community_csp,
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
    changes[ENTRY] = (before, launch_guard.encode('utf-8') + before)
    return changes

def host_module_source():
    return (ROOT / 'src/jarvis-host-adapter.js').read_bytes()
