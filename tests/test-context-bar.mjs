import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const stateSource = fs.readFileSync(new URL('src/jarvis-mods-state.js', root), 'utf8').replaceAll('export ', '');
const localeSource = fs.readFileSync(new URL('src/jarvis-mods-i18n.js', root), 'utf8').replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm, '').replaceAll('export ', '');
const barSource = fs.readFileSync(new URL('src/jarvis-context-bar.js', root), 'utf8')
  .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm, '').replaceAll('export ', '');
const jsx = (type, props, key) => ({type, props: props || {}, key});
const events = new Map();
const values = new Map();
const storage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
const window = {
  localStorage: storage,
  addEventListener: (name, listener) => {if (!events.has(name)) events.set(name, new Set()); events.get(name).add(listener);},
  removeEventListener: (name, listener) => events.get(name)?.delete(listener),
  dispatchEvent: event => {for (const listener of events.get(event.type) || []) listener(event);}
};
let scope = {value: {kind: 'local', conversationId: 'chat-a'}};
const tokenByChat = new Map([
  ['chat-a', {modelContextWindow: 100000, last: {totalTokens: 62000}, total: {totalTokens: 999999}}],
  ['chat-b', {modelContextWindow: 200000, last: {totalTokens: 190000}}]
]);
const queries = [];
const noop = () => {};
const selector = {};
const React = {
  Component: class {constructor(props) {this.props = props;}},
  useSyncExternalStore: (_subscribe, snapshot) => snapshot()
};
const ctx = vm.createContext({
  window, Intl, console, Event: class {constructor(type) {this.type = type;}},
  getReact: () => React, getJsx: () => ({jsx, jsxs: jsx}),
  getLocaleReact: () => React, useAppIntl: () => ({locale: 'ru-RU'}),
  useScope: () => scope,
  useQuery: (actualSelector, id) => {assert.equal(actualSelector, selector); queries.push(id); return tokenByChat.get(id) ?? null;},
  ComposerScope: {}, tokenUsageInfo: selector,
  localConversationId: s => s.value.kind === 'local' ? s.value.conversationId : null,
  initComposerScope: noop, initQuery: noop, initScope: noop, initTokenUsage: noop
});
vm.runInContext(stateSource + '\n' + localeSource + '\n' + barSource + '\nglobalThis.api = {defaults, storageKey, parsePreferences, readPreferences, writePreferences, announcePreferenceChange, subscribePreferences, computeContextUsage, contextPresentation, JarvisContextBarRoot};', ctx);
const api = ctx.api;

// Real v1 preferences migrate without enabling mods behind the user's back.
storage.setItem(api.storageKey, JSON.stringify({modsEnabled: false, showPlannedMods: false, nextMod: 'Паспорт чата'}));
let prefs = api.readPreferences(storage);
assert.equal(prefs.modsEnabled, false); assert.equal(prefs.showPlannedMods, false);
assert.equal(prefs.nextMod, 'Паспорт чата'); assert.equal(prefs.contextWarningThreshold, 80);
assert.equal(prefs.contextBarEnabled, true);
prefs = api.writePreferences(storage, {modsEnabled: true, contextWarningThreshold: 90});
assert.equal(prefs.nextMod, 'Паспорт чата');
assert.throws(() => api.writePreferences(storage, {contextWarningThreshold: 101}));
assert.throws(() => api.parsePreferences(JSON.stringify({...prefs, contextBarEnabled: 'true'})));

let changes = 0;
const unsubscribe = api.subscribePreferences(() => changes++);
api.announcePreferenceChange(); assert.equal(changes, 1);
window.dispatchEvent({type: 'storage', key: 'unrelated'}); assert.equal(changes, 1);
window.dispatchEvent({type: 'storage', key: api.storageKey}); assert.equal(changes, 2);
unsubscribe(); api.announcePreferenceChange(); assert.equal(changes, 2);

// Use last usage, not the sum of all turns; reject invalid/unknown data.
let usage = api.computeContextUsage(tokenByChat.get('chat-a'));
assert.equal(usage.percent, 62); assert.equal(usage.remainingTokens, 38000);
assert.equal(api.computeContextUsage({modelContextWindow: 100, last: {totalTokens: 150}}).remainingTokens, 0);
for (const info of [null, {}, {modelContextWindow: 0, last: {totalTokens: 1}},
  {modelContextWindow: Infinity, last: {totalTokens: 1}}, {modelContextWindow: 10, last: {totalTokens: NaN}},
  {modelContextWindow: 10, last: {totalTokens: -1}}, {modelContextWindow: '100', last: {totalTokens: 1}}]) {
  assert.equal(api.computeContextUsage(info), null);
}
assert.equal(api.contextPresentation(usage, prefs).warning, false);
assert.equal(api.contextPresentation(api.computeContextUsage(tokenByChat.get('chat-b')), prefs).warning, true);
assert.equal(api.contextPresentation(api.computeContextUsage(tokenByChat.get('chat-b')), {...prefs, contextWarningEnabled: false}).warning, false);
assert.equal(api.contextPresentation(null, prefs).known, false);
const exactThreshold = api.computeContextUsage({modelContextWindow: 100000, last: {totalTokens: 80000}});
assert.equal(api.contextPresentation(exactThreshold, {...prefs, contextWarningThreshold: 80}).warning, true);
assert.equal(api.contextPresentation({...exactThreshold, percent: 79.99}, {...prefs, contextWarningThreshold: 80}).warning, false);
assert.equal(api.contextPresentation({...exactThreshold, percent: 65}, prefs).color, '#45b982');
assert.equal(api.contextPresentation(exactThreshold, prefs).color, '#d9a441');
assert.equal(api.contextPresentation({...exactThreshold, percent: 95}, prefs).color, '#ef6461');

function render(node) {
  if (node == null || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map(render);
  if (typeof node.type === 'function') {
    const result = node.type.prototype?.render ? new node.type(node.props).render() : node.type(node.props);
    return render(result);
  }
  return {...node, props: {...node.props, children: render(node.props.children)}};
}
function flatten(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(flatten);
  return [node, ...flatten(node.props.children)];
}
function text(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(text).join(' ');
  return node && typeof node === 'object' ? text(node.props.children) : '';
}
function bar() {return render(api.JarvisContextBarRoot({isDocument: false}));}
let tree = bar();
assert(text(tree).includes('62% · осталось 38%'));
assert.equal(queries.at(-1), 'chat-a');
assert.equal(flatten(tree).find(n => n.props.role === 'progressbar').props['aria-valuenow'], 62);
assert(tree.props.title.includes('38')); // Remaining tokens are available in the tooltip.
scope = {value: {kind: 'local', conversationId: 'chat-b'}}; tree = bar();
assert(text(tree).includes('95% · осталось 5%'));
assert(text(tree).includes('История может быть автоматически сжата.'));
assert.equal(queries.at(-1), 'chat-b');
scope = {value: {kind: 'chatgpt', conversationId: 'cloud-conversation'}}; tree = bar();
assert(text(tree).includes('нет данных'));
assert.equal(queries.at(-1), null);
assert(!flatten(tree).some(n => n.props.role === 'progressbar'), 'Unknown data must not claim 0% usage');
assert(!text(tree).includes('сжата'));
api.writePreferences(storage, {contextBarEnabled: false}); assert.equal(bar(), null);
api.writePreferences(storage, {contextBarEnabled: true, modsEnabled: false}); assert.equal(bar(), null);
api.writePreferences(storage, {modsEnabled: true}); assert.equal(api.JarvisContextBarRoot({isDocument: true}), null);
api.writePreferences(storage, {modsLanguage: 'en'});
scope = {value: {kind: 'local', conversationId: 'chat-b'}}; tree = bar();
assert(text(tree).includes('Context: 95% · 5% remaining'));
assert(text(tree).includes('Conversation history may be automatically compacted.'));
assert(tree.props.title.includes('190,000 of 200,000 tokens used. 10,000 remaining.'));
assert.equal(flatten(tree).find(n => n.props.role === 'progressbar').props['aria-label'], 'Chat context usage');
scope = {value: {kind: 'chatgpt'}}; tree = bar();
assert(text(tree).includes('Context: no data'));
assert(tree.props.title.includes('does not report context usage'));
api.writePreferences(storage, {modsLanguage: 'ru'}); tree = bar();
assert(text(tree).includes('Контекст: нет данных'), 'An existing context bar must follow language changes');

if (process.env.CODEX_MODS_INTEGRATION === '1') {
// Execute the actual patched common composer with its existing memo cache.
const composerSource = fs.readFileSync(new URL('.mods-lab/preview/app-initial.patched.js', root), 'utf8');
const start = composerSource.indexOf('function cLt(');
const end = composerSource.indexOf('function ', start + 9);
const composerCtx = vm.createContext({
  Symbol, YS: {c: () => Array(45).fill(Symbol.for('react.memo_cache_sentinel'))},
  XS: {useContext: c => c === 'theme' ? 'default' : c === 'surface' ? {hasComposerSurface: false} : {}, useRef: () => ({current: null}), useLayoutEffect: noop},
  ZS: {jsx}, FIt: 'theme', KS: 'surface', QS: 'layout',
  Lm: () => ({}), Vd: () => false, ng: (...v) => v.filter(Boolean).join(' '),
  JS: {ComposerLayoutRoot: 'composer'}, Kl: {div: 'composer-div'}, IIt: noop,
  JarvisContextBarRoot: 'ContextBar', JarvisFunctionalActionsRoot: 'FunctionalActions'
});
vm.runInContext(composerSource.slice(start, end), composerCtx);
const originalChild = jsx('textarea', {'data-existing': 'preserved'});
tree = composerCtx.cLt({children: originalChild});
const composer = flatten(tree).find(n => n.type === 'composer-div');
assert.equal(composer.props.children[0].type, 'ContextBar');
assert.equal(composer.props.children[0].props.isDocument, false);
assert.equal(composer.props.children[1].type, 'FunctionalActions');
assert.equal(composer.props.children[1].props.isDocument, false);
assert.equal(composer.props.children[2], originalChild, 'Original composer content must remain intact');
tree = composerCtx.cLt({children: originalChild, surfaceVariant: 'document'});
assert.equal(flatten(tree).find(n => n.type === 'ContextBar').props.isDocument, true);
assert.equal(flatten(tree).find(n => n.type === 'FunctionalActions').props.isDocument, true);

}
console.log('PASS: v1 migration, settings events, token math, thresholds, missing data, per-chat selection, disable controls, and disabled states (native integration optional).');
