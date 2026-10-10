// Portable visual mods contain data only. Never evaluate package contents as code or CSS.
export const visualStorageKey = 'kliment.mods.lab.visual-library.v1';
export const visualChangeEvent = 'kliment-visual-library-changed';
export const visualFormat = 'codex-mods-lab/visual';
export const visualFileLimit = 65536;
export const visualModLimit = 50;
export const visualDefaults = {accent: '#66c4a7', surface: '#202b27', fontSize: 15, cornerRadius: 16, contentWidth: 800};
export const visualPresets = {
  emerald: {...visualDefaults},
  ocean: {...visualDefaults, accent: '#79b8ff', surface: '#202935'},
  violet: {...visualDefaults, accent: '#bc9aff', surface: '#2b2435'},
  paper: {...visualDefaults, accent: '#486ca8', surface: '#f2f0e9'}
};

function visualError(code) { throw new Error(code); }
function exactObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) visualError('visualInvalidPackage');
}
function visualString(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) visualError('visualInvalidPackage');
  return value.trim();
}
export function validateAppearance(value) {
  exactObject(value, Object.keys(visualDefaults));
  if (![value.accent, value.surface].every(color => typeof color === 'string' && /^#[a-f0-9]{6}$/i.test(color)) ||
      !Number.isInteger(value.fontSize) || value.fontSize < 12 || value.fontSize > 22 ||
      !Number.isInteger(value.cornerRadius) || value.cornerRadius < 0 || value.cornerRadius > 28 ||
      !Number.isInteger(value.contentWidth) || value.contentWidth < 600 || value.contentWidth > 1200) visualError('visualInvalidPackage');
  return {accent: value.accent.toLowerCase(), surface: value.surface.toLowerCase(), fontSize: value.fontSize, cornerRadius: value.cornerRadius, contentWidth: value.contentWidth};
}
export function validateVisualMod(mod) {
  exactObject(mod, ['id', 'version', 'name', 'description', 'author', 'appearance']);
  if (typeof mod.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(mod.id) ||
      typeof mod.version !== 'string' || !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(mod.version)) visualError('visualInvalidPackage');
  return {id: mod.id, version: mod.version, name: visualString(mod.name, 80, true),
    description: visualString(mod.description, 200), author: visualString(mod.author, 60), appearance: validateAppearance(mod.appearance)};
}
export function parseVisualPackage(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > visualFileLimit) visualError('visualInvalidPackage');
  let data;
  try { data = JSON.parse(raw); } catch { visualError('visualInvalidPackage'); }
  exactObject(data, ['format', 'formatVersion', 'mod']);
  if (data.format !== visualFormat || data.formatVersion !== 1) visualError('visualInvalidPackage');
  return validateVisualMod(data.mod);
}
export function exportVisualPackage(mod) {
  return JSON.stringify({format: visualFormat, formatVersion: 1, mod: validateVisualMod(mod)}, null, 2) + '\n';
}
export function visualFilename(mod) {
  return validateVisualMod(mod).id + '.codexmod.json';
}
export function parseVisualLibrary(raw) {
  if (raw === null) return {version: 1, activeId: null, mods: []};
  let data;
  try { data = JSON.parse(raw); } catch { visualError('visualReadError'); }
  try {
    exactObject(data, ['version', 'activeId', 'mods']);
    if (data.version !== 1 || !Array.isArray(data.mods) || data.mods.length > visualModLimit) visualError('visualReadError');
    const mods = data.mods.map(validateVisualMod);
    if (new Set(mods.map(mod => mod.id)).size !== mods.length ||
        (data.activeId !== null && !mods.some(mod => mod.id === data.activeId))) visualError('visualReadError');
    return {version: 1, activeId: data.activeId, mods};
  } catch { visualError('visualReadError'); }
}
export function readVisualLibrary(storage) { return parseVisualLibrary(storage.getItem(visualStorageKey)); }
// Each mutation reads the latest library and writes once. A rejected import or failed write keeps previous data.
export function updateVisualLibrary(storage, action) {
  const next = readVisualLibrary(storage);
  if (action.type === 'save' || action.type === 'import') {
    const mod = validateVisualMod(action.mod);
    const index = next.mods.findIndex(item => item.id === mod.id);
    if (action.type === 'import' && index !== -1) visualError('visualDuplicate');
    if (index === -1) {
      if (next.mods.length >= visualModLimit) visualError('visualLimit');
      next.mods.push(mod);
    } else next.mods[index] = mod;
    if (action.apply) next.activeId = mod.id;
  } else if (action.type === 'activate') {
    if (action.id !== null && !next.mods.some(mod => mod.id === action.id)) visualError('visualInvalidPackage');
    next.activeId = action.id;
  } else if (action.type === 'remove') {
    if (!next.mods.some(mod => mod.id === action.id)) visualError('visualInvalidPackage');
    next.mods = next.mods.filter(mod => mod.id !== action.id);
    if (next.activeId === action.id) next.activeId = null;
  } else visualError('visualInvalidPackage');
  const validated = parseVisualLibrary(JSON.stringify(next));
  try { storage.setItem(visualStorageKey, JSON.stringify(validated)); } catch { visualError('visualSaveError'); }
  return validated;
}
export function announceVisualChange() { window.dispatchEvent(new Event(visualChangeEvent)); }
export function visualSnapshot() {
  // A storage error must disable appearance rather than erase or overwrite the user's library.
  try { return window.localStorage.getItem(visualStorageKey); } catch { return '{'; }
}
export function subscribeVisualLibrary(listener) {
  const onStorage = event => { if (event.key === visualStorageKey || event.key === null) listener(); };
  window.addEventListener(visualChangeEvent, listener); window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(visualChangeEvent, listener); window.removeEventListener('storage', onStorage); };
}
export function visualForeground(surface) {
  const color = validateAppearance({...visualDefaults, surface}).surface;
  const rgb = [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16) / 255)
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  return (luminance + .05) / .05 >= 4.5 ? '#171717' : '#f5f5f5';
}
export function visualMessageStyle(appearance, role = 'assistant') {
  const a = validateAppearance(appearance);
  return {backgroundColor: a.surface, color: visualForeground(a.surface), fontSize: a.fontSize,
    borderRadius: a.cornerRadius, padding: '14px 16px', borderLeft: role === 'user' ? `3px solid ${a.accent}` : '3px solid transparent',
    maxWidth: a.contentWidth, boxSizing: 'border-box', overflowWrap: 'anywhere'};
}
export function visualStylesheet(appearance) {
  const a = validateAppearance(appearance), fg = visualForeground(a.surface);
  // Fixed selectors and validated values only. Never interpolate names, descriptions or raw package CSS.
  return `[data-kliment-message-role="assistant"],[data-kliment-message-role="user"] [data-user-message-bubble]{background:${a.surface}!important;color:${fg}!important;--color-text:${fg};--color-text-emphasis:${fg};--color-text-primary:${fg};--color-text-secondary:${fg};--color-text-user-message:${fg};--color-token-text-primary:${fg};--color-token-text-secondary:${fg};--color-text-prose:${fg};font-size:${a.fontSize}px;border-radius:${a.cornerRadius}px!important;padding:14px 16px;border-left:3px solid transparent;max-width:min(100%,${a.contentWidth}px);box-sizing:border-box;margin:8px 0;overflow-wrap:anywhere}
[data-kliment-message-role="user"] [data-user-message-bubble]{border-left-color:${a.accent}}
[data-kliment-message-role] :is(p,li,blockquote){font-size:${a.fontSize}px;color:inherit}
[data-kliment-message-role="assistant"] button{color:${fg}!important}
[data-kliment-message-role="assistant"] button svg{color:inherit}
[data-kliment-bookmark-message] button{color:${a.accent}!important}
[data-kliment-context-bar]{border-left:3px solid ${a.accent};padding-left:10px}`;
}
