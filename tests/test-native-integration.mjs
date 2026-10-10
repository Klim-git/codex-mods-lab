import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const source = fs.readFileSync(new URL('.mods-lab/preview/settings-page.patched.js', root), 'utf8');
const route = '/settings/general-settings?jarvis-mods=1';
const bootstrap = fs.readFileSync(new URL('.mods-lab/preview/bootstrap.patched.js', root), 'utf8');
const deepLinkFunction = bootstrap.slice(bootstrap.indexOf('function VE('), bootstrap.indexOf('function HE('));
const deepLinkContext = vm.createContext({X: url => url.pathname.split('/').filter(Boolean), DE: ['general-settings'], TE: 'connections/ssh'});
vm.runInContext(deepLinkFunction, deepLinkContext);
assert.equal(JSON.stringify(deepLinkContext.VE(new URL('codex://settings/mods'))), JSON.stringify({kind: 'settings', section: 'general-settings', search: '?jarvis-mods=1'}));
assert.equal(deepLinkContext.VE(new URL('codex://settings/general-settings')).section, 'general-settings');
const jsx = (type, props, key) => ({type, props: props || {}, key});
function flatten(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value !== 'object') return [];
  const rowControl = value.type === 'Row' && typeof value.props.control === 'function' ? value.props.control({}) : null;
  return [value, ...flatten(value.props?.children), ...flatten(rowControl)];
}

// Execute the actual patched navigation function, including its compiled memo cache.
const cache = Array(149).fill(Symbol.for('react.memo_cache_sentinel'));
let query = '', hooks = 0, selected = null;
const noop = () => {};
const nav = {
  console, URLSearchParams, Symbol, Element: class {},
  Jr: {c: () => cache},
  Xr: {useState: () => [hooks++ === 0 ? false : query, noop]},
  Q: {jsx, jsxs: jsx, Fragment: 'Fragment'},
  ee: () => ({}), ye: () => ({formatMessage: m => typeof m === 'string' ? m : m.defaultMessage || m.id}),
  c: () => false, Ae: () => ({platform: 'win32'}), ie: () => [], Ee: () => ({}),
  Te: () => ({authMethod: 'chatgpt'}), yr: () => [], Qn: () => [],
  It: (a, b) => b.trim() && String(a).toLowerCase().includes(b.toLowerCase()) ? 1 : 0,
  Yr: {default: array => array},
  hn: {securitySettings: {message: {defaultMessage: 'Security'}, icon: {}}},
  et: slug => ({defaultMessage: slug}), lr: slug => ({sectionSlug: slug}),
  $t: () => ({highlightedIndex: -1, listRef: null, getInputProps: () => ({onKeyDown: noop}), setHighlightedIndex: noop}),
  Ve: (...values) => values.filter(Boolean).join(' '),
  ei: [{key: 'personal', heading: null, slugs: ['general-settings']}, {key: 'integrations', heading: null, slugs: ['plugins-settings', 'browser-use']}],
  ti: {collapsed: {message: {}}, expanded: {message: {}}},
  $r: ['general-settings', 'plugins-settings', 'browser-use'],
  Zr: {back: {}}, gn: () => ({component: {16: 'icon', 20: 'icon'}, navigation: null})
};
for (const n of ['te', 'se', 're', 'mt', 'B', 's', 'Ne', 'Pe', 'De', 'vt', 'Ur', 'Ze', 'qe', 'lt', 'tt', 'ut', 'ct', 'zn', 'Gn', 'Hn', 'Wr', 'Vr', 'In', 'u']) nav[n] = n;
const context = vm.createContext(nav);
const end = source.indexOf('function kr(){}', source.indexOf('function Or('));
vm.runInContext(source.slice(source.indexOf('function Or('), end), context);
const helpers = source.slice(source.indexOf('function kr(){}'), source.indexOf('function Vr('));
vm.runInContext(helpers, context);
vm.runInContext(source.slice(source.indexOf('function Kr('), source.indexOf('var Jr,')), context);
const sections = ['general-settings', 'plugins-settings', 'browser-use'].map(slug => ({slug}));
function renderNav(active = 'general-settings') {
  hooks = 0;
  return context.Or({settingsSections: sections, activeSection: active, groupSettingsSections: true, onSelect: noop, onSelectPlugin: path => {selected = path;}});
}
let tree = renderNav();
let mods = flatten(tree).find(node => node.props?.['data-settings-panel-slug'] === 'kliment-mods');
assert(mods, 'Permanent Mods item must be present with empty search');
assert.equal(mods.props.isActive, false);
mods.props.onClick(); assert.equal(selected, route);
tree = renderNav('kliment-mods');
mods = flatten(tree).find(node => node.props?.['data-settings-panel-slug'] === 'kliment-mods');
assert.equal(mods.props.isActive, true, 'Active state must update through the memo cache');
query = 'моды'; tree = renderNav('kliment-mods');
const results = flatten(tree).find(node => node.type === 'Wr').props.searchResults;
assert(results.some(row => row.label === 'Моды' && row.path === route), 'Settings search must find Mods');

// Execute the real selection callback: General must be able to leave the Mods page.
const callbackStart = source.indexOf('Ne=(e,r,i,a)=>{') + 3;
const callbackEnd = source.indexOf('},e[40]=x', callbackStart) + 1;
let navigated = null;
const routeContext = vm.createContext({jarvisModsActive: true, x: 'general-settings', h: null,
  C: sections, u: {pathname: '/settings/general-settings', search: '?jarvis-mods=1', hash: '', state: null},
  lr: slug => ({path: '/settings/' + slug}), pe: noop, n: {current: null},
  s: path => {navigated = path;}, F: action => action(), Oe: noop, t: {}, je: {}, Qe: noop, URL, URLSearchParams});
const select = vm.runInContext('(' + source.slice(callbackStart, callbackEnd) + ')', routeContext);
select('general-settings'); assert.equal(navigated, '/settings/general-settings');

console.log('PASS: installed native settings navigation, search, and deep links.');
