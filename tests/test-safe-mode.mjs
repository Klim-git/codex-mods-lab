import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL('src/' + name, root), 'utf8');
const strip = text => text.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm, '').replaceAll('export ', '');
const values = new Map([['account', 'synthetic account'], ['kliment.mods.lab.bookmarks.v1', 'synthetic bookmarks'], ['kliment.mods.lab.preferences.v1', 'original preferences']]);
let reject = false;
const storage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => {if (reject) throw Error('full'); values.set(key, value);}, removeItem: key => values.delete(key)};
const recovery = vm.createContext({klimentModsSession: Object.freeze({safeMode: true})});
vm.runInContext(strip(read('jarvis-safe-mode.js')) + '\nglobalThis.api={isModsSafeMode,recoveryStores,inspectRecoveryStore,changeRecoveryStore,undoRecoveryChange};', recovery);
const a = recovery.api, visualKey = a.recoveryStores[0].key, functionalKey = a.recoveryStores[1].key;
assert.equal(a.isModsSafeMode(), true);
recovery.klimentModsSession = {safeMode: false}; assert.equal(a.isModsSafeMode(), true, 'Safe Mode is latched for the session');
const good = {id: 'good', name: 'Good', actions: []}, broken = {id: 'broken', name: '<img onerror="run()">', actions: [{kind: 'unknown', script: 'throw Error()'}]};
const raw = JSON.stringify({version: 1, mods: [good, broken, null], enabledIds: ['good', 'broken'], extra: 'retain'});
values.set(functionalKey, raw); values.set(visualKey, JSON.stringify({version: 1, activeId: 'paper', mods: [{id: 'paper', name: 'Paper'}]}));
let inspected = a.inspectRecoveryStore(storage, functionalKey);
assert.equal(inspected.unreadable, false); assert.equal(inspected.mods.length, 3); assert.equal(inspected.mods[1].name, broken.name);
assert.equal(a.inspectRecoveryStore(storage, visualKey).mods[0].id, 'paper');
assert.throws(() => a.inspectRecoveryStore(storage, 'account'), /safeRecoveryError/);
const retained = [...values].filter(([key]) => key !== functionalKey);
reject = true;
assert.throws(() => a.changeRecoveryStore(storage, {key: functionalKey, expectedRaw: raw, index: 1})); assert.equal(values.get(functionalKey), raw);
reject = false;
const change = a.changeRecoveryStore(storage, {key: functionalKey, expectedRaw: raw, index: 1});
assert.deepEqual(JSON.parse(values.get(functionalKey)), {version: 1, mods: [good, null], enabledIds: ['good'], extra: 'retain'});
assert.deepEqual([...values].filter(([key]) => key !== functionalKey), retained);
assert.throws(() => a.changeRecoveryStore(storage, {key: functionalKey, expectedRaw: raw, index: 0}), /safeRecoveryChanged/);
a.undoRecoveryChange(storage, change); assert.equal(values.get(functionalKey), raw, 'Undo restores exact original JSON');
const nullChange = a.changeRecoveryStore(storage, {key: functionalKey, expectedRaw: raw, index: 2});
assert.equal(JSON.parse(values.get(functionalKey)).mods.length, 2); a.undoRecoveryChange(storage, nullChange);
for (const corrupt of ['{broken', 'null', '{"mods":{}}', JSON.stringify({mods: Array(1001).fill(null)})]) {
  values.set(functionalKey, corrupt); inspected = a.inspectRecoveryStore(storage, functionalKey); assert.equal(inspected.unreadable, true);
  const reset = a.changeRecoveryStore(storage, {key: functionalKey, expectedRaw: corrupt, reset: true});
  assert.deepEqual(JSON.parse(values.get(functionalKey)), {version: 1, enabledIds: [], mods: []});
  a.undoRecoveryChange(storage, reset); assert.equal(values.get(functionalKey), corrupt);
}
values.set(functionalKey, raw);
const finalChange = a.changeRecoveryStore(storage, {key: functionalKey, expectedRaw: raw, index: 1});
values.set(functionalKey, 'another window'); assert.throws(() => a.undoRecoveryChange(storage, finalChange), /safeRecoveryChanged/);
assert.deepEqual([...values].filter(([key]) => key !== functionalKey), retained);

const jsx = (type, props) => ({type, props: props || {}});
function flatten(value) {if (!value || typeof value !== 'object') return []; if (Array.isArray(value)) return value.flatMap(flatten); return [value, ...flatten(value.props?.children)];}
let state = [], slot = 0;
const UIReact = {useState: initial => {const index = slot++; if (!(index in state)) state[index] = initial; return [state[index], value => {state[index] = typeof value === 'function' ? value(state[index]) : value;}];}, useEffect() {}};
values.set(functionalKey, raw);
const ui = vm.createContext({getHostReact: () => UIReact, getHostJsx: () => ({jsx, jsxs: jsx}), hostAdapterInfo: {appVersion: '26.1007.21434', apiVersion: 1},
  useModsI18n: () => ({language: 'en', t: (key, values = {}) => key + (values.name ? ':' + values.name : '')}),
  ...a, window: {localStorage: storage}, announceRecoveryChange() {}});
vm.runInContext(strip(read('jarvis-recovery-manager.js')) + '\nglobalThis.render=JarvisRecoveryManager;', ui);
function renderRecovery() {slot = 0; return ui.render();}
let tree = renderRecovery();
const remove = flatten(tree).find(node => node.type === 'button' && node.props.children === 'safeRemovePackage:' + broken.name);
assert(remove); assert.equal(flatten(tree).filter(node => node.type === 'img').length, 0, 'Metadata stays literal text');
remove.props.onClick(); tree = renderRecovery(); assert(!flatten(tree).some(node => node.props.children === broken.name));
flatten(tree).find(node => node.type === 'button' && node.props.children === 'safeUndo').props.onClick();
assert.equal(values.get(functionalKey), raw);

function coreSession(safe, rejectImport = false) {
  const hookState = []; let hook = 0, effects = [], imports = 0;
  class Component {constructor(props) {this.props = props;}}
  const React = {Component, useState: initial => {const i = hook++; if (!(i in hookState)) hookState[i] = initial; return [hookState[i], value => {hookState[i] = value;}];}, useEffect: callback => effects.push(callback)};
  const names = ['JarvisModsPanel', 'JarvisContextBarRoot', 'JarvisFunctionalActionsRoot', 'JarvisVisualStylesRoot', 'JarvisBookmarksSurface', 'JarvisBookmarkMessageButton'];
  const module = Object.fromEntries(names.map(name => [name, function LoadedSurface() {}]));
  const c = vm.createContext({getHostReact: () => React, getHostJsx: () => ({jsx}), isModsSafeMode: () => safe, JarvisRecoveryManager: 'Recovery',
    testImport: () => {imports++; return rejectImport ? Promise.reject(Error('module failure')) : Promise.resolve(module);}, console});
  vm.runInContext(strip(read('jarvis-mods-core.js')).replace(/import\('([^']+)'\)/g, "testImport('$1')") + '\nglobalThis.api={JarvisModsPanel,JarvisContextBarRoot,JarvisFunctionalActionsRoot,JarvisVisualStylesRoot,JarvisBookmarksSurface,JarvisBookmarkMessageButton,ModsSurfaceBoundary};', c);
  return {api: c.api, get imports() {return imports;}, render: (name, props = {}) => {hook = 0; return c.api[name](props);}, effects: () => {const pending = effects; effects = []; pending.forEach(fn => fn());}};
}
const safe = coreSession(true);
for (const name of ['JarvisContextBarRoot', 'JarvisFunctionalActionsRoot', 'JarvisVisualStylesRoot', 'JarvisBookmarkMessageButton']) assert.equal(safe.render(name), null);
assert.equal(safe.render('JarvisBookmarksSurface', {children: 'native chat'}), 'native chat');
assert.equal(safe.render('JarvisModsPanel').type, 'Recovery'); safe.effects(); assert.equal(safe.imports, 0, 'No extension imports or initializers in Safe Mode');
const normal = coreSession(false);
assert.equal(normal.render('JarvisFunctionalActionsRoot'), null); normal.effects(); await Promise.resolve();
assert.equal(normal.render('JarvisFunctionalActionsRoot').props.children.type.name, 'LoadedSurface');
normal.effects(); assert.equal(normal.imports, 1, 'Imports are shared rather than repeated');
const failed = coreSession(false, true); failed.render('JarvisModsPanel'); failed.effects(); await Promise.resolve(); await Promise.resolve();
assert.equal(failed.render('JarvisModsPanel').type, 'Recovery');
const boundary = new normal.api.ModsSurfaceBoundary({fallback: 'native content', children: 'bad mod'});
boundary.state = normal.api.ModsSurfaceBoundary.getDerivedStateFromError(Error('render failure')); assert.equal(boundary.render(), 'native content');

// Execute the actual startup hook and preload with synthetic Electron surfaces.
const handlers = new Map(), regs = [];
const electron = {app: {on: (name, callback) => handlers.set(name, callback), exit: code => regs.push({exit: code})}};
const copyRoot = path.resolve('synthetic-test-copy');
const env = {KLIMENT_MODS_LAB_ROOT: copyRoot, CODEX_ELECTRON_USER_DATA_PATH: path.join(copyRoot, 'app-data'), CODEX_HOME: path.join(copyRoot, 'codex-home'), KLIMENT_MODS_LAB_SAFE_MODE: '1'};
vm.runInNewContext(read('jarvis-launch-guard.cjs'), {require: name => name === 'node:path' ? path : electron, process: {resourcesPath: path.join(copyRoot, 'app/resources'), env, stderr: {write() {}}, exit() {throw Error('unexpected exit');}}});
const session = {registerPreloadScript: options => regs.push(options)}, events = new Map(), window = {webContents: {session, on: (name, callback) => events.set(name, callback)}, on() {}, setTitle() {}};
handlers.get('browser-window-created')({}, window); handlers.get('browser-window-created')({}, window);
assert.equal(regs.length, 1); assert.equal(regs[0].type, 'frame'); assert(regs[0].filePath.endsWith('jarvis-safe-mode-preload.cjs'));
events.get('preload-error')({}, regs[0].filePath); assert.equal(regs.at(-1).exit, 79);
let exposed;
vm.runInNewContext(read('jarvis-safe-mode-preload.cjs'), {require: name => {assert.equal(name, 'electron'); return {contextBridge: {exposeInMainWorld: (key, value) => {exposed = {key, value};}}};}});
assert.equal(exposed.key, 'klimentModsSession'); assert.equal(Object.isFrozen(exposed.value), true); assert.deepEqual(Object.keys(exposed.value), ['safeMode']); assert.equal(exposed.value.safeMode, true);
console.log('PASS Safe Mode: no extension loading, retained native content/preferences, literal recovery metadata, corrupt-package removal/reset/undo, stale-write protection, atomic failure and pre-render immutable flag.');
