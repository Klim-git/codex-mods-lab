import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL('src/' + name, root), 'utf8');
const strip = source => source.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm, '').replaceAll('export ', '');
const saved = new Map();
let locale = 'en-US';
const storage = {getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value)};
const c = vm.createContext({window: {localStorage: storage}, Intl,
  getLocaleReact: () => ({useSyncExternalStore: (_, snapshot) => snapshot()}),
  useAppIntl: () => ({locale})});
vm.runInContext(strip(read('jarvis-mods-state.js')) + '\n' + strip(read('jarvis-mods-i18n.js')) + '\n' + strip(read('jarvis-bookmarks-state.js')) + '\nglobalThis.api={modMessages,modText,resolveModLanguage,useModsI18n,defaults,storageKey,parsePreferences,writePreferences,changeBookmark};', c);
const a = c.api;
assert.deepEqual(Object.keys(a.modMessages.en).sort(), Object.keys(a.modMessages.ru).sort(), 'Both languages must cover every label');
for (const key of Object.keys(a.modMessages.en)) {
  for (const language of ['ru', 'en']) assert(a.modMessages[language][key].trim(), key);
  const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  assert.deepEqual(placeholders(a.modMessages.en[key]), placeholders(a.modMessages.ru[key]), key);
}
for (const [preference, native, expected] of [
  ['auto', 'en-US', 'en'], ['auto', 'ru-RU', 'ru'], ['auto', 'RU_ru', 'ru'],
  ['auto', 'fr-FR', 'en'], ['auto', null, 'en'], ['ru', 'en', 'ru'], ['en', 'ru', 'en']
]) assert.equal(a.resolveModLanguage(preference, native), expected);
assert.equal(a.parsePreferences(null).modsLanguage, 'auto');
const old = {...a.defaults}; delete old.modsLanguage;
assert.equal(a.parsePreferences(JSON.stringify(old)).modsLanguage, 'auto');
for (const value of ['fr', null, 1, {}]) assert.throws(() => a.parsePreferences(JSON.stringify({...old, modsLanguage: value})));
a.writePreferences(storage, {modsLanguage: 'en', contextWarningThreshold: 95});
const before = saved.get(a.storageKey);
assert.throws(() => a.writePreferences(storage, {modsLanguage: 'fr'}));
assert.equal(saved.get(a.storageKey), before);
locale = 'ru-RU'; assert.equal(a.useModsI18n().language, 'en');
a.writePreferences(storage, {modsLanguage: 'auto'}); assert.equal(a.useModsI18n().language, 'ru');
locale = 'en-US'; assert.equal(a.useModsI18n().language, 'en');
assert.equal(a.useModsI18n().formatTokens(33268), '33,268');
assert.equal(a.modText('en', 'bookmarkJump', {title: '<b>$&{used}</b>'}), 'Go to bookmark: <b>$&{used}</b>', 'User titles must stay literal');
const entry = {action: 'add', conversationKey: 'demo', unitKey: 'turn:item', turnKey: 'turn', role: 'assistant', excerpt: '', defaultTitle: 'Assistant response'};
assert.equal(a.changeBookmark(storage, entry)[0].title, 'Assistant response');
assert.equal(a.changeBookmark(storage, {...entry, unitKey: 'turn:custom', title: 'Мой результат'})[1].title, 'Мой результат');
const jsx = (type, props) => ({type, props});
const rail = vm.createContext({URLSearchParams, useModsLanguage: () => a.useModsI18n().language, modText: a.modText,
  Pr: () => ({pathname: '/settings/general-settings', search: '?jarvis-mods=1'}), O2: {jsx, jsxs: jsx}, Pn: 'Tooltip', k0o: 'RailButton', Ho: {dispatchHostMessage() {}}});
vm.runInContext(read('jarvis-mods-rail.js') + '\nglobalThis.render=JarvisModsRailButton;', rail);
let button = rail.render({}); assert.equal(button.props.tooltipContent, 'Mods');
assert.equal(button.props.children.props['aria-label'], 'Mods');
assert.equal(button.props.children.props['aria-current'], 'page');
a.writePreferences(storage, {modsLanguage: 'ru'}); button = rail.render({});
assert.equal(button.props.tooltipContent, 'Моды');
console.log('PASS: locale detection, explicit override, complete translations, stable migration, language-aware token formatting, bookmark titles, and rail labels.');
