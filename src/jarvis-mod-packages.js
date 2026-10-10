import {parseVisualPackage, exportVisualPackage, parseVisualLibrary, updateVisualLibrary, visualSnapshot, subscribeVisualLibrary, announceVisualChange} from './jarvis-visual-mods-state.js';
import {parseFunctionalPackage, exportFunctionalPackage, parseFunctionalLibrary, updateFunctionalLibrary, functionalSnapshot, subscribeFunctionalLibrary, announceFunctionalChange, functionalStorageKey} from './jarvis-functional-mods-state.js';
export function modKind(mod) {return Object.hasOwn(mod, 'actions') ? 'functional' : 'visual';}
export function parseModPackage(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > 65536) throw Error('visualInvalidPackage');
  let value; try {value = JSON.parse(raw);} catch {throw Error('visualInvalidPackage');}
  return value?.format === 'codex-mods-lab/functional' ? parseFunctionalPackage(raw) : parseVisualPackage(raw);
}
export function exportModPackage(mod) {return modKind(mod) === 'functional' ? exportFunctionalPackage(mod) : exportVisualPackage(mod);}
export function modFilename(mod) {return parseModPackage(exportModPackage(mod)).id + '.codexmod.json';}
export function parseModLibrary(raw) {
  try {
    const values = JSON.parse(raw);
    if (!Array.isArray(values) || values.length !== 2 || !values.every(value => value === null || typeof value === 'string')) throw Error();
    const visual = parseVisualLibrary(values[0]), functional = parseFunctionalLibrary(values[1]);
    const mods = [...visual.mods, ...functional.mods];
    if (mods.length > 50 || new Set(mods.map(mod => mod.id)).size !== mods.length) throw Error();
    return {mods, activeId: visual.activeId, enabledIds: functional.enabledIds};
  } catch {throw Error('visualReadError');}
}
export function readModLibrary(storage) {return parseModLibrary(JSON.stringify([storage.getItem('kliment.mods.lab.visual-library.v1'), storage.getItem(functionalStorageKey)]));}
export function modLibrarySnapshot() {return JSON.stringify([visualSnapshot(), functionalSnapshot()]);}
export function subscribeModLibrary(listener) {const visual = subscribeVisualLibrary(listener), functional = subscribeFunctionalLibrary(listener); return () => {visual(); functional();};}
export function announceModChange() {announceVisualChange(); announceFunctionalChange();}
export function updateModLibrary(storage, action) {
  const library = readModLibrary(storage);
  const mod = action.mod ? parseModPackage(exportModPackage(action.mod)) : library.mods.find(item => item.id === action.id);
  if (action.mod && !library.mods.some(item => item.id === mod.id) && library.mods.length >= 50) throw Error('visualLimit');
  if (action.type === 'import' && library.mods.some(item => item.id === mod?.id)) throw Error('visualDuplicate');
  if (action.type === 'save' && library.mods.some(item => item.id === mod?.id && modKind(item) !== modKind(mod))) throw Error('visualDuplicate');
  if (mod && modKind(mod) === 'functional') updateFunctionalLibrary(storage, {...action, ...(action.mod ? {mod} : {})});
  else updateVisualLibrary(storage, action);
  return readModLibrary(storage);
}
