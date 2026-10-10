import {getHostReact, getHostJsx, hostAdapterInfo} from './jarvis-host-adapter.js';
import {useModsI18n} from './jarvis-mods-i18n.js';
import {isModsSafeMode, recoveryStores, inspectRecoveryStore, changeRecoveryStore, undoRecoveryChange, announceRecoveryChange} from './jarvis-safe-mode.js';
const RecoveryReact = getHostReact(), {jsx: recoveryJsx, jsxs: recoveryJsxs} = getHostJsx();
const recoveryButtonStyle = {border: '1px solid var(--color-border, #555)', borderRadius: 10, padding: '7px 12px', background: 'var(--color-background-secondary, #292929)', color: 'inherit', fontSize: 13};
const recoveryCardStyle = {padding: 16, border: '1px solid var(--color-border, #444)', borderRadius: 16, display: 'grid', gap: 10};
function recoveryButton(label, onClick, disabled = false) {return recoveryJsx('button', {type: 'button', style: recoveryButtonStyle, disabled, onClick, children: label});}
export function JarvisRecoveryManager() {
  const {t, language} = useModsI18n();
  const [_revision, refresh] = RecoveryReact.useState(0), [undo, setUndo] = RecoveryReact.useState(null), [error, setError] = RecoveryReact.useState(''), [status, setStatus] = RecoveryReact.useState('');
  let stores = [], readFailed = false;
  try {stores = recoveryStores.map(store => inspectRecoveryStore(window.localStorage, store.key));} catch {readFailed = true;}
  RecoveryReact.useEffect(() => {
    const onChange = event => {if (event.key === null || recoveryStores.some(store => store.key === event.key)) refresh(value => value + 1);};
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  }, []);
  function mutate(store, index, reset = false) {
    try {
      setUndo(changeRecoveryStore(window.localStorage, {key: store.key, expectedRaw: store.raw, index, reset}));
      setError(''); setStatus(reset ? 'safeLibraryReset' : 'safePackageRemoved');
      announceRecoveryChange(); refresh(value => value + 1);
    } catch (cause) {setError(cause.message === 'safeRecoveryChanged' ? cause.message : 'safeRecoveryError'); refresh(value => value + 1);}
  }
  function restore() {
    try {undoRecoveryChange(window.localStorage, undo); setUndo(null); setError(''); setStatus('safePackageRestored'); announceRecoveryChange(); refresh(value => value + 1);}
    catch (cause) {setError(cause.message === 'safeRecoveryChanged' ? cause.message : 'safeRecoveryError');}
  }
  function exportStore(store) {
    let url;
    try {
      url = URL.createObjectURL(new Blob([store.raw], {type: 'application/json'}));
      const link = document.createElement('a'); link.href = url; link.download = `mods-lab-${store.kind}-recovery.json`; document.body.appendChild(link); link.click(); link.remove();
      setError('');
    } catch {setError('safeRecoveryError');}
    finally {if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);}
  }
  return recoveryJsxs('section', {lang: language, 'data-kliment-recovery-manager': '1', 'aria-label': t('safeManager'), style: {display: 'grid', gap: 16, paddingBottom: 24}, children: [
    recoveryJsxs('div', {role: 'status', style: {...recoveryCardStyle, background: 'rgba(217,164,65,.09)'}, children: [
      recoveryJsx('h2', {style: {fontSize: 20, fontWeight: 600}, children: t(isModsSafeMode() ? 'safeModeTitle' : 'safeLoadFailure')}),
      recoveryJsx('p', {children: t(isModsSafeMode() ? 'safeModeHint' : 'safeLoadFailureHint')}),
      recoveryJsx('p', {style: {fontSize: 13, opacity: .7}, children: t('safeExitHint')}),
      recoveryJsx('p', {style: {fontSize: 12, opacity: .65}, children: t('safeAdapter', {version: hostAdapterInfo.appVersion, api: hostAdapterInfo.apiVersion})})
    ]}),
    recoveryJsx('h3', {style: {fontSize: 16, fontWeight: 600}, children: t('safeManager')}),
    recoveryJsx('p', {style: {fontSize: 13, opacity: .7}, children: t('safeBuiltinsPaused')}),
    readFailed ? recoveryJsx('p', {role: 'alert', children: t('safeRecoveryError')}) : null,
    ...stores.flatMap(store => store.unreadable ? [recoveryJsxs('article', {style: recoveryCardStyle, children: [
      recoveryJsx('h4', {children: t(store.kind === 'visual' ? 'safeVisualLibrary' : 'safeFunctionalLibrary')}),
      recoveryJsx('p', {children: t('safeUnreadable')}),
      recoveryJsx('p', {style: {fontSize: 12, opacity: .7}, children: t('safeResetHint')}),
      recoveryJsxs('div', {style: {display: 'flex', gap: 8, flexWrap: 'wrap'}, children: [recoveryButton(t('safeExportLibrary'), () => exportStore(store)), recoveryButton(t('safeResetLibrary'), () => mutate(store, null, true))]})
    ]}, store.key)] : store.mods.map(mod => recoveryJsxs('article', {style: recoveryCardStyle, children: [
      recoveryJsx('h4', {style: {fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere'}, children: mod.name || t('safeUnnamed', {index: mod.index + 1})}),
      recoveryJsx('p', {style: {fontSize: 12, opacity: .7, overflowWrap: 'anywhere'}, children: [t(store.kind === 'visual' ? 'visualType' : 'functionalType'), mod.id, t('safeNotLoaded')].filter(Boolean).join(' · ')}),
      recoveryButton(t('safeRemovePackage', {name: mod.name || t('safeUnnamed', {index: mod.index + 1})}), () => mutate(store, mod.index))
    ]}, store.key + ':' + mod.index))),
    !readFailed && stores.every(store => !store.unreadable && !store.mods.length) ? recoveryJsx('p', {children: t('safeEmpty')}) : null,
    ...stores.filter(store => !store.unreadable && store.raw !== null).map(store => recoveryButton(t('safeExportTypedLibrary', {kind: t(store.kind === 'visual' ? 'safeVisualLibrary' : 'safeFunctionalLibrary')}), () => exportStore(store))),
    status ? recoveryJsx('p', {role: 'status', children: t(status)}) : null,
    error ? recoveryJsx('p', {role: 'alert', children: t(error)}) : null,
    undo ? recoveryJsxs('div', {style: {display: 'grid', gap: 8}, children: [recoveryButton(t('safeUndo'), restore), recoveryJsx('p', {style: {fontSize: 12, opacity: .7}, children: t('safeUndoHint')})]}) : null
  ]});
}
