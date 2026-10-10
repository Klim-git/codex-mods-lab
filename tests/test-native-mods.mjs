import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const jsx = (type, props, key) => ({type, props: props || {}, key});
function flatten(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value !== 'object') return [];
  const rowControl = value.type === 'Row' && typeof value.props.control === 'function' ? value.props.control({}) : null;
  return [value, ...flatten(value.props?.children), ...flatten(rowControl)];
}

const noop = () => {};
let tree;
// Execute the actual new panel with deterministic React/JSX adapters and isolated storage.
let moduleSource = fs.readFileSync(new URL('src/jarvis-mods-native.js', root), 'utf8');
moduleSource = moduleSource.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];\s*/gm, '').replaceAll('export ', '');
moduleSource = fs.readFileSync(new URL('src/jarvis-mods-state.js', root), 'utf8').replaceAll('export ', '') + '\n' + moduleSource;
const saved = new Map();
const storage = {getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value)};
function makePanel() {
  const state = []; let currentHook = 0;
  const React = {useEffect: noop, useState: initial => {
    const slot = currentHook++;
    if (!(slot in state)) state[slot] = typeof initial === 'function' ? initial() : initial;
    return [state[slot], value => {state[slot] = value;}];
  }};
  const Group = Object.assign(() => {}, {Header: 'GroupHeader'});
  const c = vm.createContext({window: {localStorage: storage, dispatchEvent: noop}, Event: class {}, getReact: () => React, getJsx: () => ({jsx, jsxs: jsx}),
    initToggle: noop, initRow: noop, initRows: noop, initButton: noop, initGroup: noop,
    Toggle: 'Toggle', SettingsRow: 'Row', SettingsRows: 'Rows', SettingsGroup: Group, Button: 'Button', console});
  vm.runInContext(moduleSource + '\nglobalThis.panel = JarvisModsPanel;globalThis.key = storageKey;', c);
  return {render: () => {currentHook = 0; return c.panel();}, key: c.key};
}
function control(tree, label) {
  const row = flatten(tree).find(n => n.type === 'Row' && (n.props.label === label || flatten(n.props.label).some(child => child.props.children === label)));
  assert(row, 'Missing setting: ' + label);
  const rendered = typeof row.props.control === 'function' ? row.props.control({}) : row.props.control;
  return flatten(rendered).find(n => n.type === 'Toggle') || rendered;
}
function button(tree, label) {
  const found = flatten(tree).find(n => n.type === 'Button' && (n.props['aria-label'] === label || n.props.children === label));
  assert(found, 'Missing button: ' + label);
  return found;
}
function card(tree, id = 'context-bar') {
  const cards = flatten(tree).filter(n => n.props['data-kliment-mod-card']);
  assert.equal(cards.length, 2, 'Each installed mod must have its own card');
  const selected = cards.find(n => n.props['data-kliment-mod-card'] === id);
  assert(selected, 'Missing mod card: ' + id);
  return selected;
}
function cardStatus(tree) {
  return flatten(card(tree)).flatMap(n => flatten(n.props.label)).find(n => n.props['data-kliment-mod-status']).props.children;
}
let panel = makePanel(); tree = panel.render();
assert.equal(control(tree, 'Включать установленные моды').props.checked, false);
assert.equal(cardStatus(tree), 'Приостановлен');
assert(!JSON.stringify(tree).includes('План доработок'));
assert(!JSON.stringify(tree).includes('Следующая доработка'));
assert(!flatten(card(tree, 'bookmarks')).some(n => n.props['data-kliment-mod-settings']), 'Bookmarks settings must be hidden by default');
button(card(tree, 'bookmarks'), 'Настроить закладки').props.onClick(); tree = panel.render();
assert.equal(control(card(tree, 'bookmarks'), 'Горячая клавиша закладок').props.value, 'Ctrl+Alt+K');
control(card(tree, 'bookmarks'), 'Показывать значки у сообщений').props.onChange(false); tree = panel.render();
control(card(tree, 'bookmarks'), 'Горячая клавиша закладок').props.onChange({target: {value: 'Alt+B'}}); tree = panel.render();
assert.equal(control(card(tree, 'bookmarks'), 'Горячая клавиша закладок').props.value, 'Alt+B');
button(card(tree, 'bookmarks'), 'Сбросить настройки закладок').props.onClick(); tree = panel.render();
assert.equal(control(card(tree, 'bookmarks'), 'Показывать значки у сообщений').props.checked, true);
assert.equal(control(tree, 'Включать установленные моды').props.checked, false, 'Bookmarks reset preserves the master switch');
button(card(tree, 'bookmarks'), 'Свернуть настройки закладок').props.onClick(); tree = panel.render();
assert(!flatten(card(tree)).some(n => n.props['data-kliment-mod-settings']), 'Mod settings must be hidden by default');
assert(!flatten(card(tree)).some(n => n.type === 'Row' && n.props.label === 'Порог предупреждения'));
assert.equal(button(card(tree), 'Настроить полосу контекста').props['aria-expanded'], false);
const beforeExpansion = saved.get(panel.key);
button(card(tree), 'Настроить полосу контекста').props.onClick(); tree = panel.render();
assert.equal(saved.get(panel.key), beforeExpansion, 'Opening settings must not change preferences');
assert.equal(button(card(tree), 'Свернуть настройки полосы контекста').props['aria-expanded'], true);
assert.equal(control(card(tree), 'Порог предупреждения').props.value, 80, 'Settings belong to the mod card');
control(tree, 'Включать установленные моды').props.onChange(true); tree = panel.render();
assert.equal(cardStatus(tree), 'Включён');
control(card(tree), 'Предупреждать о заполнении').props.onChange(false);
control(card(tree), 'Порог предупреждения').props.onChange({target: {value: '90'}});
tree = panel.render();
button(card(tree), 'Свернуть настройки полосы контекста').props.onClick(); tree = panel.render();
assert(!flatten(card(tree)).some(n => n.props['data-kliment-mod-settings']));
button(card(tree), 'Настроить полосу контекста').props.onClick(); tree = panel.render();
assert.equal(control(card(tree), 'Порог предупреждения').props.value, 90, 'Closing settings must preserve their values');
panel = makePanel(); tree = panel.render();
assert(!flatten(card(tree)).some(n => n.props['data-kliment-mod-settings']), 'Reopening the Mods page must show compact cards');
button(card(tree), 'Настроить полосу контекста').props.onClick(); tree = panel.render();
assert.equal(control(tree, 'Включать установленные моды').props.checked, true, 'Master setting must persist');
assert.equal(control(card(tree), 'Предупреждать о заполнении').props.checked, false);
assert.equal(control(card(tree), 'Порог предупреждения').props.value, 90, 'Mod settings must persist across remounts');
control(card(tree), 'Полоса контекста').props.onChange(false); tree = panel.render();
assert.equal(cardStatus(tree), 'Выключен');
button(card(tree), 'Сбросить настройки полосы контекста').props.onClick(); tree = panel.render();
assert.equal(control(tree, 'Включать установленные моды').props.checked, true, 'Resetting a mod must preserve the master switch');
assert.equal(control(card(tree), 'Полоса контекста').props.checked, true);
assert.equal(control(card(tree), 'Предупреждать о заполнении').props.checked, true);
assert.equal(control(card(tree), 'Порог предупреждения').props.value, 80);
const old = saved.get(panel.key);
storage.setItem = () => {throw new Error('Blocked storage');};
control(tree, 'Включать установленные моды').props.onChange(false); tree = panel.render();
assert.equal(control(tree, 'Включать установленные моды').props.checked, true);
assert(flatten(tree).some(n => n.props.role === 'alert'));
assert.equal(saved.get(panel.key), old);
storage.setItem = (key, value) => saved.set(key, value);
saved.set(panel.key, '{bad json'); panel = makePanel(); tree = panel.render();
assert(flatten(tree).some(n => n.props.role === 'alert'));
button(tree, 'Восстановить настройки').props.onClick(); tree = panel.render();
assert.equal(control(tree, 'Включать установленные моды').props.checked, false);
button(card(tree), 'Настроить полосу контекста').props.onClick(); tree = panel.render();
assert.equal(control(card(tree), 'Порог предупреждения').props.value, 80);
assert(!flatten(tree).some(n => n.props.role === 'alert'));
// The UI redesign must retain existing preferences from earlier copies.
saved.set(panel.key, JSON.stringify({modsEnabled: true, showPlannedMods: false, nextMod: 'Паспорт чата', contextBarEnabled: false, contextWarningEnabled: false, contextWarningThreshold: 95}));
panel = makePanel(); tree = panel.render();
assert.equal(control(tree, 'Включать установленные моды').props.checked, true);
assert.equal(cardStatus(tree), 'Выключен');
button(card(tree), 'Настроить полосу контекста').props.onClick(); tree = panel.render();
assert.equal(control(card(tree), 'Порог предупреждения').props.value, 95);
button(card(tree), 'Сбросить настройки полосы контекста').props.onClick(); tree = panel.render();
assert.equal(JSON.parse(saved.get(panel.key)).nextMod, 'Паспорт чата', 'Mod reset must not overwrite other stored preferences');
assert.equal(JSON.parse(saved.get(panel.key)).showPlannedMods, false);
assert(!JSON.stringify(tree).includes('Паспорт чата'));
console.log('PASS: compact cards, settings hidden by default, disclosure without preference changes, persistence, scoped reset, and storage failure recovery.');
