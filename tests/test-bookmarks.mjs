import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL((name.endsWith('.patched.js') ? '.mods-lab/preview/' : 'src/') + name, root), 'utf8');
const strip = source => source.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm, '').replaceAll('export ', '');
const saved = new Map();
const handlers = new Map();
const storage = {getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value)};
const window = {localStorage: storage, addEventListener: (name, fn) => {if(!handlers.has(name)) handlers.set(name, new Set()); handlers.get(name).add(fn);}, removeEventListener: (name, fn) => handlers.get(name)?.delete(fn), dispatchEvent: event => {for(const fn of handlers.get(event.type) ?? []) fn(event);}};
const jsx = (type, props, key) => ({type, props: props ?? {}, key});
let hook = 0, contextValue = null;
const state = [];
const noop = () => {};
const React = {Fragment: 'Fragment', createContext: () => ({Provider: 'Provider'}), useEffect: noop, useContext: () => contextValue,
  useSyncExternalStore: (_, snapshot) => snapshot(),
  useState: initial => {const slot = hook++; if(!(slot in state)) state[slot] = typeof initial === 'function' ? initial() : initial; return [state[slot], value => {state[slot] = typeof value === 'function' ? value(state[slot]) : value;}];},
  useRef: initial => {const slot = hook++; if(!(slot in state)) state[slot] = {current: initial}; return state[slot];}
};
const c = vm.createContext({window, Event: class {constructor(type){this.type=type;}}, getReact: () => React, getJsx: () => ({jsx, jsxs:jsx}), initButton:noop, Button:'Button', console, Date});
vm.runInContext(strip(read('jarvis-mods-state.js')) + '\n' + strip(read('jarvis-bookmarks-state.js')) + '\n' + strip(read('jarvis-bookmarks.js')) + '\nglobalThis.api={bookmarksKey,storageKey,defaults,parsePreferences,parseBookmarks,readBookmarks,changeBookmark,bookmarkItemId,messageExcerpt,matchesBookmarkShortcut,subscribeBookmarks,Surface:JarvisBookmarksSurface,Message:JarvisBookmarkMessageButton};', c);
const a = c.api;
const first = {action:'add', conversationKey:'local:host:chat-a', unitKey:'turn-a:item-a', turnKey:'turn-a', role:'user', excerpt:'Решение\n  по задаче', createdAt:123};
a.changeBookmark(storage, first);
assert.equal(a.readBookmarks(storage)[0].title, 'Решение по задаче');
a.changeBookmark(storage, first); assert.equal(a.readBookmarks(storage).length, 1, 'Repeated adds must not duplicate a bookmark');
a.changeBookmark(storage, {...first, conversationKey:'local:host:chat-b', role:'assistant'});
a.changeBookmark(storage, {...first, action:'rename', title:'Моё решение'});
assert.equal(a.readBookmarks(storage).find(e=>e.conversationKey===first.conversationKey).title, 'Моё решение');
assert.throws(()=>a.changeBookmark(storage, {...first, action:'rename', title:'  '}));
a.changeBookmark(storage, {...first, action:'remove'});
assert.equal(a.readBookmarks(storage).length, 1);
assert.equal(a.readBookmarks(storage)[0].conversationKey, 'local:host:chat-b', 'Removing a bookmark must preserve another chat');
a.changeBookmark(storage, first);
const beforeFailure = storage.getItem(a.bookmarksKey);
storage.setItem = () => {throw new Error('blocked');};
assert.throws(()=>a.changeBookmark(storage, {...first, action:'rename', title:'fail'}));
assert.equal(storage.getItem(a.bookmarksKey), beforeFailure);
storage.setItem = (key,value)=>saved.set(key,value);
assert.throws(()=>a.parseBookmarks('{bad'));
const entry = JSON.parse(beforeFailure).entries[0];
assert.throws(()=>a.parseBookmarks(JSON.stringify({version:1,entries:[entry,entry]})));
assert.throws(()=>a.parseBookmarks(JSON.stringify({version:1,entries:[{...entry,role:'tool'}]})));
assert.equal(a.bookmarkItemId({turnKey:'turn:a',unitKey:'turn:a:item:b'}), 'item:b');
assert.throws(()=>a.bookmarkItemId({turnKey:'wrong',unitKey:'turn:item'}));
assert.equal(a.messageExcerpt({content:[{content:'ответ'}, {text:'готов'}], metadata:{token:'private'}}), 'ответ готов');
assert.equal(a.messageExcerpt({metadata:{token:'private'}}), '');
assert.equal(a.parsePreferences(JSON.stringify({modsEnabled:true,showPlannedMods:false,nextMod:'Пока не выбран'})).bookmarksEnabled, true);
assert.throws(()=>a.parsePreferences(JSON.stringify({...a.defaults,bookmarkShortcut:'Win+B'})));
const shortcut = {code:'KeyK',ctrlKey:true,altKey:true,shiftKey:false,metaKey:false,repeat:false};
assert.equal(a.matchesBookmarkShortcut(shortcut,'Ctrl+Alt+K'),true);
assert.equal(a.matchesBookmarkShortcut({...shortcut,shiftKey:true},'Ctrl+Alt+K'),false);
assert.equal(a.matchesBookmarkShortcut({...shortcut,code:'KeyB',ctrlKey:false},'Alt+B'),true);
assert.equal(a.matchesBookmarkShortcut({...shortcut,code:'KeyB'},'Ctrl+Alt+K'),false);
assert.equal(a.matchesBookmarkShortcut({...shortcut,code:'',key:'л'},'Ctrl+Alt+K'),true);
assert.equal(a.matchesBookmarkShortcut({...shortcut,code:'',keyCode:75},'Ctrl+Alt+K'),true);
assert.equal(a.parsePreferences(JSON.stringify({...a.defaults,bookmarkShortcut:'Ctrl+Alt+B'})).bookmarkShortcut,'Ctrl+Alt+K');
assert.equal(a.matchesBookmarkShortcut(shortcut,'Нет'),false);
let changes = 0;
const unsubscribe = a.subscribeBookmarks(()=>changes++);
window.dispatchEvent({type:'storage',key:'other'}); assert.equal(changes,0);
window.dispatchEvent({type:'storage',key:a.bookmarksKey}); assert.equal(changes,1);
unsubscribe(); window.dispatchEvent({type:'storage',key:a.bookmarksKey}); assert.equal(changes,1);
function flatten(value){if(!value)return[]; if(Array.isArray(value))return value.flatMap(flatten); if(typeof value!=='object')return[]; return[value,...flatten(value.props?.children)];}
function render(key=first.conversationKey){hook=0; const tree=a.Surface({conversationKey:key,getContainer:()=>null,onNavigate:noop,children:'native transcript'});contextValue=tree.props.value; return tree;}
saved.set(a.storageKey,JSON.stringify({...a.defaults,modsEnabled:true}));
let tree=render();
assert.equal(contextValue.entries.length,1);
assert.equal(contextValue.entries[0].conversationKey,first.conversationKey);
assert(flatten(tree).some(n=>n.props['data-kliment-bookmarks-launcher']));
let message=a.Message({unitKey:first.unitKey,turnKey:first.turnKey,role:'user',item:{message:'text'}});
assert.equal(flatten(message).find(n=>n.type==='Button').props['aria-pressed'],true);
tree=render('local:host:empty-chat'); assert.equal(contextValue.entries.length,0);
saved.set(a.storageKey,JSON.stringify({...a.defaults,modsEnabled:true,bookmarkShowIcons:false}));
tree=render(); assert.equal(a.Message({unitKey:first.unitKey,turnKey:first.turnKey,role:'user'}),null);
assert(flatten(tree).some(n=>n.props['data-kliment-bookmarks-launcher']), 'Hiding message icons must keep the list accessible');
saved.set(a.storageKey,JSON.stringify({...a.defaults,modsEnabled:false})); tree=render();
assert(!flatten(tree).some(n=>n.props['data-kliment-bookmarks-launcher']));
assert.equal(tree.props.children.props.children[0], 'native transcript');

if (process.env.CODEX_MODS_INTEGRATION === '1') {
// Execute the actual native local-message wrapper with its original unit-key format.
const localTurn=read('local-conversation-turn-dd4feee2fc9e.patched.js');
const start=localTurn.indexOf('function fl('), end=localTurn.indexOf('function pl(',start);
const wrapperContext=vm.createContext({$: {jsx,jsxs:jsx},sr:(turn,item)=>`${turn}:${item}`,JarvisBookmarkMessageButton:'BookmarkButton'});
vm.runInContext(localTurn.slice(start,end),wrapperContext);
const item={type:'assistant-message',content:'ответ'}, native={type:'native'};
const wrapped=wrapperContext.fl(new Map([[item,'item-a']]),'turn-a')({item,content:native});
assert.equal(wrapped.props.children[0],native);
assert.equal(wrapped.props.children[1].props.unitKey,'turn-a:item-a');
assert.equal(wrapped.props.children[1].props.role,'assistant');

function callback(source){const start=source.indexOf('onNavigate:async bookmark=>')+'onNavigate:'.length;const end=source.indexOf(',children:',start);return source.slice(start,end);}
let hydrated=null,scrolled=null;
const localContext=vm.createContext({bookmarkItemId:a.bookmarkItemId,fn:{current:new Map()},Cn:async()=>({turnCursor:'cursor'}),hn:{prepareMatchForNavigation:async record=>{hydrated=record;return true;}},qt:'local:context',t:'chat-a',w:{},Gk:noop,lg:async()=>{},Y:{current:{scrollToKey:async(key,selector)=>{scrolled=key;assert.equal(selector('container'),'target');}}},findBookmarkTarget:()=> 'target',Error});
const goLocal=vm.runInContext('('+callback(read('local-conversation-thread-70abb87ab9c8.patched.js'))+')',localContext);
await goLocal(first);
assert.equal(hydrated.unitId,'item-a');assert.equal(hydrated.turnCursor,'cursor');assert.equal(scrolled,'turn-a');
let ensured=false;
const chatContext=vm.createContext({Qe:async()=>{ensured=true;},Ne:()=>ensured?[{id:'turn-a',turnKey:'virtual-a'}]:[],U:{scrollToKey:async key=>{scrolled=key;}},findBookmarkTarget:()=>null,Eu:async()=>{},Error});
const goChat=vm.runInContext('('+callback(read('chatgpt-conversation-page-d6ceb517cb3b.patched.js'))+')',chatContext);
await goChat(first);assert.equal(scrolled,'virtual-a','ChatGPT adapter must read the current turns after history hydration');
}
console.log('PASS: bookmark CRUD, isolation, renaming, atomic storage failure, migration, shortcut, disabled states, and disabled states (native integration optional).');
