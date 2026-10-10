// Latch at module initialization. Navigation and preferences cannot exit Safe Mode.
const sessionSafeMode = globalThis.klimentModsSession?.safeMode === true;
export function isModsSafeMode() {return sessionSafeMode;}
export const recoveryStores = Object.freeze([
  {key: 'kliment.mods.lab.visual-library.v1', kind: 'visual'},
  {key: 'kliment.mods.lab.functional-library.v1', kind: 'functional'}
]);
function requireRecoveryStore(key) {
  const store = recoveryStores.find(item => item.key === key);
  if (!store) throw Error('safeRecoveryError');
  return store;
}
export function inspectRecoveryStore(storage, key) {
  const store = requireRecoveryStore(key), raw = storage.getItem(key);
  if (raw === null) return {...store, raw, mods: [], unreadable: false};
  try {
    if (raw.length > 4 * 1024 * 1024) throw Error();
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.mods) || data.mods.length > 1000) throw Error();
    return {...store, raw, mods: data.mods.map((entry, index) => ({index,
      name: typeof entry?.name === 'string' ? entry.name.slice(0, 80) : '',
      id: typeof entry?.id === 'string' ? entry.id.slice(0, 80) : '', entry})), unreadable: false};
  } catch {return {...store, raw, mods: [], unreadable: true};}
}
export function changeRecoveryStore(storage, {key, expectedRaw, index, reset = false}) {
  const store = requireRecoveryStore(key), current = inspectRecoveryStore(storage, key);
  if (current.raw !== expectedRaw) throw Error('safeRecoveryChanged');
  let data;
  if (reset) {
    if (!current.unreadable) throw Error('safeRecoveryError');
    data = store.kind === 'visual' ? {version: 1, activeId: null, mods: []} : {version: 1, enabledIds: [], mods: []};
  } else {
    if (current.unreadable || !Number.isInteger(index) || index < 0 || index >= current.mods.length) throw Error('safeRecoveryError');
    data = JSON.parse(current.raw);
    const removed = data.mods.splice(index, 1)[0];
    if (typeof removed?.id === 'string') {
      if (data.activeId === removed.id) data.activeId = null;
      if (Array.isArray(data.enabledIds)) data.enabledIds = data.enabledIds.filter(id => id !== removed.id);
    }
  }
  const after = JSON.stringify(data);
  storage.setItem(key, after);
  return {key, before: current.raw, after};
}
export function undoRecoveryChange(storage, change) {
  requireRecoveryStore(change.key);
  if (storage.getItem(change.key) !== change.after) throw Error('safeRecoveryChanged');
  if (change.before === null) storage.removeItem(change.key);
  else storage.setItem(change.key, change.before);
}
export function announceRecoveryChange() {
  for (const name of ['kliment-visual-library-changed', 'kliment-functional-library-changed', 'kliment-mods-recovery-changed']) window.dispatchEvent(new Event(name));
}
