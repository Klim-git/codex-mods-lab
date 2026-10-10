// Functional packages declare user-triggered chat actions. Package strings are never code.
export const functionalFormat = 'codex-mods-lab/functional';
export const functionalStorageKey = 'kliment.mods.lab.functional-library.v1';
export const functionalChangeEvent = 'kliment-functional-library-changed';
export const functionalShortcuts = [null, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(key => `Ctrl+Alt+Shift+${key}`)];
function functionalInvalid(code = 'visualInvalidPackage') { throw Error(code); }
function functionalKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== keys.slice().sort().join()) functionalInvalid();
}
function functionalText(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || required && !value.trim() || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) functionalInvalid();
  return value;
}
export function validateFunctionalMod(mod) {
  functionalKeys(mod, ['id', 'version', 'name', 'author', 'description', 'actions']);
  if (typeof mod.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(mod.id) || typeof mod.version !== 'string' || !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(mod.version) || !Array.isArray(mod.actions) || mod.actions.length < 1 || mod.actions.length > 8) functionalInvalid();
  const ids = new Set(), shortcuts = new Set();
  const actions = mod.actions.map(action => {
    const extra = action?.kind === 'insert-text' ? ['text'] : action?.kind === 'scroll-chat' ? ['target'] : [];
    functionalKeys(action, ['id', 'label', 'kind', 'shortcut', ...extra]);
    if (typeof action.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,39}$/i.test(action.id) || ids.has(action.id) || !['copy-last-response', 'insert-text', 'scroll-chat', 'focus-input'].includes(action.kind) || !functionalShortcuts.includes(action.shortcut) || action.shortcut !== null && shortcuts.has(action.shortcut)) functionalInvalid();
    ids.add(action.id); if (action.shortcut) shortcuts.add(action.shortcut);
    const safe = {id: action.id, label: functionalText(action.label, 60, true).trim(), kind: action.kind, shortcut: action.shortcut};
    if (action.kind === 'insert-text') safe.text = functionalText(action.text, 8000, true);
    if (action.kind === 'scroll-chat') {if (!['first', 'last'].includes(action.target)) functionalInvalid(); safe.target = action.target;}
    return safe;
  });
  const safe = {id: mod.id, version: mod.version, name: functionalText(mod.name, 80, true).trim(), description: functionalText(mod.description, 200).trim(), author: functionalText(mod.author, 60).trim(), actions};
  if (new TextEncoder().encode(JSON.stringify({format: functionalFormat, formatVersion: 1, mod: safe})).length > 65536) functionalInvalid();
  return safe;
}
export function parseFunctionalPackage(raw) {
  try {
    if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 65536) functionalInvalid();
    const value = JSON.parse(raw); functionalKeys(value, ['format', 'formatVersion', 'mod']);
    if (value.format !== functionalFormat || value.formatVersion !== 1) functionalInvalid();
    return validateFunctionalMod(value.mod);
  } catch { functionalInvalid(); }
}
export function exportFunctionalPackage(mod) {
  const value = {format: functionalFormat, formatVersion: 1, mod: validateFunctionalMod(mod)};
  const pretty = JSON.stringify(value, null, 2) + '\n';
  // A valid compact package near the limit must remain importable after export.
  return new TextEncoder().encode(pretty).length <= 65536 ? pretty : JSON.stringify(value);
}
export function parseFunctionalLibrary(raw) {
  if (raw === null) return {version: 1, enabledIds: [], mods: []};
  try {
    const value = JSON.parse(raw); functionalKeys(value, ['version', 'enabledIds', 'mods']);
    if (value.version !== 1 || !Array.isArray(value.mods) || value.mods.length > 50 || !Array.isArray(value.enabledIds)) functionalInvalid();
    const mods = value.mods.map(validateFunctionalMod);
    if (new Set(mods.map(mod => mod.id)).size !== mods.length || new Set(value.enabledIds).size !== value.enabledIds.length || !value.enabledIds.every(id => mods.some(mod => mod.id === id))) functionalInvalid();
    return {version: 1, enabledIds: [...value.enabledIds], mods};
  } catch {functionalInvalid('visualReadError');}
}
export function updateFunctionalLibrary(storage, action) {
  const next = parseFunctionalLibrary(storage.getItem(functionalStorageKey));
  if (['save', 'import'].includes(action.type)) {
    const mod = validateFunctionalMod(action.mod), index = next.mods.findIndex(item => item.id === mod.id);
    if (action.type === 'import' && index !== -1) functionalInvalid('visualDuplicate');
    if (index === -1) {if (next.mods.length >= 50) functionalInvalid('visualLimit'); next.mods.push(mod);} else next.mods[index] = mod;
    if (action.apply && !next.enabledIds.includes(mod.id)) next.enabledIds.push(mod.id);
  } else if (action.type === 'activate') {
    if (!next.mods.some(mod => mod.id === action.id)) functionalInvalid();
    next.enabledIds = next.enabledIds.filter(id => id !== action.id);
    if (action.enabled) next.enabledIds.push(action.id);
  } else if (action.type === 'remove') {
    if (!next.mods.some(mod => mod.id === action.id)) functionalInvalid();
    next.mods = next.mods.filter(mod => mod.id !== action.id); next.enabledIds = next.enabledIds.filter(id => id !== action.id);
  } else functionalInvalid();
  const safe = parseFunctionalLibrary(JSON.stringify(next));
  try {storage.setItem(functionalStorageKey, JSON.stringify(safe));} catch {functionalInvalid('visualSaveError');}
  return safe;
}
export function functionalSnapshot() {try {return window.localStorage.getItem(functionalStorageKey);} catch {return '{';}}
export function announceFunctionalChange() {window.dispatchEvent(new Event(functionalChangeEvent));}
export function subscribeFunctionalLibrary(listener) {
  const onStorage = event => {if (event.key === functionalStorageKey || event.key === null) listener();};
  window.addEventListener(functionalChangeEvent, listener); window.addEventListener('storage', onStorage);
  return () => {window.removeEventListener(functionalChangeEvent, listener); window.removeEventListener('storage', onStorage);};
}
export function functionalCapabilities(mod) {
  return [...new Set(mod.actions.map(action => action.kind === 'copy-last-response' ? 'functionalReadClipboard' : action.kind === 'insert-text' ? 'functionalDraftCapability' : 'functionalNavigationCapability'))];
}
export function functionalShortcutMatches(event, shortcut) {
  let code = event.code;
  // Windows text-input/accessibility tools may omit the physical code. Keep a
  // bounded Latin/Russian key fallback; a supplied physical code takes priority.
  if (!code || code === 'Unidentified') {
    const key = String(event.key ?? '').toLowerCase(), russian = 'фисвуапршолдьтщзйкыегмцчня';
    const index = russian.indexOf(key);
    const letter = /^[a-z]$/.test(key) ? key : key.length === 1 && index >= 0 ? 'abcdefghijklmnopqrstuvwxyz'[index] : '';
    code = letter ? 'Key' + letter.toUpperCase() : '';
  }
  return !!shortcut && !event.repeat && !event.isComposing && !event.defaultPrevented && event.ctrlKey && event.altKey && event.shiftKey && !event.metaKey && !event.getModifierState?.('AltGraph') && code === 'Key' + shortcut.slice(-1);
}
