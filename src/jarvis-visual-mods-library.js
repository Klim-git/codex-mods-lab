import {PCn as getLibraryReact, Agn as getLibraryJsx, Ck as LibraryButton, Tk as initLibraryButton, $T as LibraryToggle, QT as initLibraryToggle} from './app-shared-737655e1fb23.js';
import {visualPresets, visualFileLimit, visualMessageStyle} from './jarvis-visual-mods-state.js';
import {modKind, modLibrarySnapshot, subscribeModLibrary, parseModLibrary, parseModPackage, updateModLibrary, announceModChange, exportModPackage, modFilename} from './jarvis-mod-packages.js';
import {functionalCapabilities, functionalShortcuts} from './jarvis-functional-mods-state.js';
import {CommunityLibrary, CommunityPublishDialog} from './jarvis-community-library.js';
initLibraryButton(); initLibraryToggle();
const LibraryReact = getLibraryReact();
const {jsx: libraryJsx, jsxs: libraryJsxs} = getLibraryJsx();
const fieldStyle = {width: '100%', background: 'var(--color-background-primary-soft-alpha, #242424)', color: 'inherit', border: '1px solid var(--color-border, #454545)', borderRadius: 8, padding: '8px 10px', fontSize: 14, boxSizing: 'border-box'};
const cardStyle = {border: '1px solid var(--color-border, #383838)', background: 'var(--color-background-primary-soft-alpha)', borderRadius: 12, padding: 16};

function libraryButton(label, onClick, extra = {}) {
  return libraryJsx(LibraryButton, {color: 'secondary', size: 'actionSm', onClick, children: label, ...extra});
}
function VisualPackageDialog({title, onClose, children, t}) {
  const ref = LibraryReact.useRef(null);
  LibraryReact.useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
  return libraryJsxs('dialog', {ref, 'aria-label': title, onCancel: onClose,
    style: {margin: 'auto', width: 'min(620px, calc(100vw - 40px))', maxHeight: '85vh', overflow: 'auto', borderRadius: 16, padding: 24, background: 'var(--color-background-primary, #202020)', color: 'var(--color-text-primary, #eeeeee)', border: '1px solid var(--color-border, #454545)'}, children: [
      libraryJsx('style', {children: 'dialog[data-kliment-package-dialog]::backdrop{background:rgba(0,0,0,.55)}'}),
      libraryJsxs('div', {style: {display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 18}, children: [libraryJsx('h2', {style: {fontSize: 18, fontWeight: 600}, children: title}), libraryButton(t('visualClose'), onClose)]}), children
    ], 'data-kliment-package-dialog': '1'});
}
export function VisualModPreview({appearance, t}) {
  return libraryJsxs('section', {'aria-label': t('visualPreview'), 'data-kliment-visual-preview': '1', style: {...cardStyle, padding: 14, minWidth: 0}, children: [
    libraryJsx('h3', {style: {fontSize: 14, fontWeight: 600, marginBottom: 12}, children: t('visualPreview')}),
    libraryJsx('div', {style: {...visualMessageStyle(appearance, 'user'), marginBottom: 10}, children: t('visualPreviewUser')}),
    libraryJsx('div', {style: visualMessageStyle(appearance), children: t('visualPreviewAssistant')}),
    libraryJsxs('div', {style: {marginTop: 16, borderLeft: `3px solid ${appearance.accent}`, paddingLeft: 10}, children: [
      libraryJsx('span', {style: {fontSize: 12}, children: t('contextLabel', {used: 24, remaining: 76})}),
      libraryJsx('div', {style: {height: 5, borderRadius: 3, background: 'var(--color-background-primary-soft-alpha, #444)', marginTop: 6}, children: libraryJsx('div', {style: {height: '100%', width: '24%', borderRadius: 3, background: '#45b982'}})})
    ]}),
    libraryJsx('p', {style: {fontSize: 12, opacity: .65, marginTop: 14}, children: t('visualPreviewHint')})
  ]});
}

export function ModPackagePreview({mod, t}) {
  if (modKind(mod) === 'visual') return libraryJsx(VisualModPreview, {appearance: mod.appearance, t});
  return libraryJsxs('section', {style: cardStyle, 'aria-label': t('functionalReview'), children: [
    libraryJsx('h3', {style: {fontWeight: 600}, children: t('functionalReview')}),
    libraryJsx('p', {style: {fontSize: 13, marginTop: 8}, children: t('functionalReviewHint')}),
    libraryJsx('ul', {style: {paddingLeft: 20, fontSize: 13, listStyle: 'disc'}, children: functionalCapabilities(mod).map(key => libraryJsx('li', {children: t(key)}, key))}),
    ...mod.actions.map(action => libraryJsxs('div', {style: {marginTop: 12}, children: [
      libraryJsx('strong', {style: {fontSize: 13}, children: action.label}),
      libraryJsx('p', {style: {fontSize: 12, opacity: .7}, children: t('functionalKind_' + action.kind) + (action.shortcut ? ' · ' + action.shortcut : '')}),
      action.text ? libraryJsx('pre', {style: {fontSize: 12, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 140, overflow: 'auto', marginTop: 6}, children: action.text}) : null,
      action.target ? libraryJsx('p', {style: {fontSize: 12}, children: t('functionalTarget_' + action.target)}) : null
    ]}, action.id))
  ]});
}

export function VisualModsLibrary({preferences, i18n, children, onActivity}) {
  const {t} = i18n;
  const raw = LibraryReact.useSyncExternalStore(subscribeModLibrary, modLibrarySnapshot, () => '[null,null]');
  let library, readError = '';
  try { library = parseModLibrary(raw); } catch { library = {mods: [], activeId: null, enabledIds: []}; readError = 'visualReadError'; }
  const [tab, setTab] = LibraryReact.useState('installed');
  const [draft, setDraft] = LibraryReact.useState(null);
  const [error, setError] = LibraryReact.useState('');
  const [status, setStatus] = LibraryReact.useState('');
  const [importOpen, setImportOpen] = LibraryReact.useState(false);
  const [packageText, setPackageText] = LibraryReact.useState('');
  const [incoming, setIncoming] = LibraryReact.useState(null);
  const [exportMod, setExportMod] = LibraryReact.useState(null);
  const [busy, setBusy] = LibraryReact.useState(false);
  const [removed, setRemoved] = LibraryReact.useState(null);
  const [publishMod, setPublishMod] = LibraryReact.useState(null);
  const fileRef = LibraryReact.useRef(null), readSequence = LibraryReact.useRef(0);
  function fail(cause) {
    setError(['visualInvalidPackage', 'visualDuplicate', 'visualLimit', 'visualReadError', 'visualSaveError', 'visualFileError', 'visualCopyError', 'visualNameRequired'].includes(cause.message) ? cause.message : 'visualSaveError'); setStatus('');
  }
  function mutate(action, message) {
    try { updateModLibrary(window.localStorage, action); announceModChange(); setError(''); setStatus(message); return true; }
    catch (cause) { fail(cause); return false; }
  }
  function edit(mod) { setDraft(modKind(mod) === 'functional' ? {...mod, actions: mod.actions.map(action => ({...action}))} : {...mod, appearance: {...mod.appearance}}); setTab('editor'); setError(''); setStatus(''); }
  function change(patch) { setDraft({...draft, ...patch}); setError(''); }
  function appearance(patch) { change({appearance: {...draft.appearance, ...patch}}); }
  function saveDraft(apply) {
    if (!draft.name.trim()) { fail(new Error('visualNameRequired')); return; }
    if (mutate({type: 'save', mod: draft, apply}, apply ? 'visualApplied' : 'visualSaved')) { setDraft(null); setTab('installed'); }
  }
  function closeImport() { ++readSequence.current; setBusy(false); setImportOpen(false); setIncoming(null); setPackageText(''); setError(''); }
  function review(text) {
    setIncoming(null);
    try { setIncoming(parseModPackage(text)); setError(''); } catch (cause) { fail(cause); }
  }
  async function readFile(file) {
    const sequence = ++readSequence.current;
    setIncoming(null); setError(''); setBusy(true);
    try {
      if (!file || file.size > visualFileLimit) throw new Error('visualInvalidPackage');
      const text = await file.text();
      if (sequence !== readSequence.current) return;
      setPackageText(text); review(text);
    } catch (cause) { if (sequence === readSequence.current) fail(cause.message === 'visualInvalidPackage' ? cause : new Error('visualFileError')); }
    finally { if (sequence === readSequence.current) setBusy(false); }
  }
  function install() {
    const duplicate = library.mods.some(mod => mod.id === incoming.id);
    const mod = duplicate ? {...incoming, id: crypto.randomUUID(), name: (incoming.name.slice(0, 60) + ' ' + t('visualCopySuffix')).slice(0, 80)} : incoming;
    if (mutate({type: 'import', mod, apply: false}, 'visualImported')) { closeImport(); setTab('installed'); }
  }
  async function copyPackage() {
    try { await navigator.clipboard.writeText(exportModPackage(exportMod)); setError(''); setStatus('visualCopied'); }
    catch { fail(new Error('visualCopyError')); }
  }
  function downloadPackage() {
    try {
      const url = URL.createObjectURL(new Blob([exportModPackage(exportMod)], {type: 'application/json'}));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = modFilename(exportMod);
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setError(''); setStatus('visualDownloadStarted');
    } catch { fail(new Error('visualFileError')); }
  }
  function textField(key, value, onChange, max, multiline = false) {
    return libraryJsxs('label', {style: {display: 'grid', gap: 6}, children: [libraryJsx('span', {style: {fontSize: 13}, children: t(key)}), libraryJsx(multiline ? 'textarea' : 'input', {'aria-label': t(key), value, maxLength: max, rows: multiline ? 2 : undefined, onChange: event => onChange(event.target.value), style: fieldStyle})]});
  }
  function numberField(key, name, options) {
    const choices = [...new Set([...options, draft.appearance[name]])].sort((a, b) => a - b);
    return libraryJsxs('label', {style: {display: 'grid', gap: 6}, children: [libraryJsx('span', {style: {fontSize: 13}, children: t(key)}), libraryJsx('select', {'aria-label': t(key), value: draft.appearance[name], onChange: event => appearance({[name]: Number(event.target.value)}), style: fieldStyle, children: choices.map(value => libraryJsx('option', {value, style: {background: 'Canvas', color: 'CanvasText'}, children: `${value} px`}, value))})]});
  }
  function colorField(key, name) {
    return libraryJsxs('label', {style: {display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13}, children: [t(key), libraryJsx('input', {type: 'color', value: draft.appearance[name], 'aria-label': t(key), onChange: event => appearance({[name]: event.target.value}), style: {width: 48, height: 30, padding: 2, borderRadius: 6, background: 'transparent', border: '1px solid #555'}})]});
  }
  const feedback = libraryJsx('p', {role: error || readError ? 'alert' : 'status', 'aria-live': 'polite', style: {fontSize: 13, marginTop: 10, color: error || readError ? '#ef8c87' : 'var(--color-text-secondary)'}, children: error || readError ? t(error || readError) : status ? t(status) : ''});
  return libraryJsxs('div', {'data-kliment-visual-library': '1', onFocusCapture: onActivity, onClickCapture: onActivity, style: {display: 'grid', gap: 14}, children: [
    libraryJsxs('div', {role: 'tablist', 'aria-label': t('mods'), style: {display: 'flex', gap: 8, flexWrap: 'wrap'}, children: [
      libraryButton(`${t('visualInstalled')} · ${library.mods.length + 2}`, () => setTab('installed'), {role: 'tab', 'aria-selected': tab === 'installed', style: tab === 'installed' ? {boxShadow: 'inset 0 -2px 0 #66c4a7'} : undefined}),
      libraryButton(t('communityLibrary'), () => setTab('community'), {role: 'tab', 'aria-selected': tab === 'community', style: tab === 'community' ? {boxShadow: 'inset 0 -2px 0 #66c4a7'} : undefined})
    ]}),
    tab === 'installed' ? libraryJsxs('div', {role: 'tabpanel', 'aria-label': t('visualInstalled'), style: {display: 'grid', gap: 12}, children: [
      libraryJsxs('div', {style: {display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}, children: [libraryButton(t('visualImport'), () => {setImportOpen(true); setError(''); setStatus('');}, {disabled: !!readError})]}),
      children,
      ...library.mods.map(mod => {
        const functional = modKind(mod) === 'functional';
        const selected = functional ? library.enabledIds.includes(mod.id) : library.activeId === mod.id;
        return libraryJsxs('section', {'data-kliment-visual-card': mod.id, style: cardStyle, children: [
          libraryJsxs('div', {style: {display: 'flex', alignItems: 'center', gap: 12}, children: [
            libraryJsx('div', {'aria-hidden': true, style: {width: 36, height: 36, flexShrink: 0, background: mod.appearance?.surface ?? '#25342e', border: `3px solid ${mod.appearance?.accent ?? '#66c4a7'}`, borderRadius: 10, display: 'grid', placeItems: 'center'}, children: functional ? '⚡' : null}),
            libraryJsxs('div', {style: {flex: 1, minWidth: 0}, children: [libraryJsx('h3', {style: {fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere'}, children: mod.name}), libraryJsx('p', {style: {fontSize: 12, opacity: .65}, children: [t(functional ? 'functionalType' : 'visualType'), mod.author, `v${mod.version}`].filter(Boolean).join(' · ')})]}),
            libraryJsx('span', {style: {fontSize: 12, color: selected && preferences.modsEnabled ? '#66c4a7' : 'var(--color-text-secondary)'}, children: t(!selected ? 'off' : preferences.modsEnabled ? 'on' : 'paused')}),
            libraryJsx(LibraryToggle, {'aria-label': t('visualToggle', {name: mod.name}), checked: selected, onChange: value => mutate(functional ? {type: 'activate', id: mod.id, enabled: value} : {type: 'activate', id: value ? mod.id : null}, 'visualSaved')})
          ]}),
          mod.description ? libraryJsx('p', {style: {fontSize: 13, opacity: .75, marginTop: 10, overflowWrap: 'anywhere'}, children: mod.description}) : null,
          libraryJsxs('div', {style: {display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12}, children: [libraryButton(t('visualEdit'), () => edit(mod), {'aria-label': t('visualEditNamed', {name: mod.name})}), libraryButton(t('visualExport'), () => {setExportMod(mod); setError(''); setStatus('');}, {'aria-label': t('visualExportNamed', {name: mod.name})}), libraryButton(t('communityPublish'), () => {setPublishMod(mod); setStatus('');}, {'aria-label': t('communityPublishNamed', {name: mod.name})}), libraryButton(t('remove'), () => {if (mutate({type: 'remove', id: mod.id}, 'visualRemoved')) setRemoved({mod, active: selected});}, {'aria-label': t('visualRemoveNamed', {name: mod.name})})]})
        ]}, mod.id);
      }),
      libraryJsx('p', {style: {fontSize: 12, opacity: .65}, children: t(library.mods.length ? 'visualSingleActive' : 'visualEmpty')}),
      removed ? libraryButton(t('visualUndo'), () => {if (mutate({type: 'import', mod: removed.mod, apply: removed.active}, 'visualSaved')) setRemoved(null);}) : null
    ]}) : tab === 'community' ? libraryJsx(CommunityLibrary, {library, readError, i18n, Dialog: VisualPackageDialog, Preview: ModPackagePreview}) : draft && modKind(draft) === 'functional' ? libraryJsxs('div', {role: 'tabpanel', 'aria-label': t('functionalSettings'), style: {display: 'grid', gap: 14}, children: [
      libraryJsx('h3', {style: {fontWeight: 600}, children: t('visualEditNamed', {name: draft.name})}),
      textField('visualName', draft.name, value => change({name: value}), 80),
      textField('visualAuthor', draft.author, value => change({author: value}), 60),
      textField('visualDescription', draft.description, value => change({description: value}), 200, true),
      ...draft.actions.map((action, index) => {
        const update = patch => change({actions: draft.actions.map((item, i) => i === index ? {...item, ...patch} : item)});
        return libraryJsxs('section', {style: cardStyle, children: [
          textField('functionalButtonLabel', action.label, value => update({label: value}), 60),
          libraryJsx('p', {style: {fontSize: 12, margin: '8px 0', opacity: .7}, children: t('functionalKind_' + action.kind)}),
          action.kind === 'insert-text' ? textField('functionalTemplate', action.text, value => update({text: value}), 8000, true) : null,
          libraryJsxs('label', {style: {display: 'grid', gap: 6, fontSize: 13}, children: [t('functionalShortcut'), libraryJsx('select', {'aria-label': t('functionalShortcut') + ': ' + action.label, value: action.shortcut ?? '', onChange: event => update({shortcut: event.target.value || null}), style: fieldStyle, children: functionalShortcuts.map(value => libraryJsx('option', {value: value ?? '', style: {background: 'Canvas', color: 'CanvasText'}, children: value ?? t('none')}, value ?? 'none'))})]})
        ]}, action.id);
      }),
      libraryJsx(ModPackagePreview, {mod: draft, t}),
      libraryJsxs('div', {style: {display: 'flex', flexWrap: 'wrap', gap: 8}, children: [libraryButton(t('visualSaveApply'), () => saveDraft(true), {color: 'primary'}), libraryButton(t('save'), () => saveDraft(false)), libraryButton(t('cancel'), () => {setDraft(null); setTab('installed'); setError('');})]})
    ]}) : draft ? libraryJsxs('div', {role: 'tabpanel', 'aria-label': t('visualEditor'), style: {display: 'grid', gap: 14}, children: [
      libraryJsx('h3', {style: {fontSize: 16, fontWeight: 600}, children: t('visualEditNamed', {name: draft.name})}),
      libraryJsxs('div', {style: {display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 18, alignItems: 'start'}, children: [
        libraryJsxs('div', {style: {display: 'grid', gap: 12}, children: [
          textField('visualName', draft.name, value => change({name: value}), 80),
          textField('visualAuthor', draft.author, value => change({author: value}), 60),
          textField('visualDescription', draft.description, value => change({description: value}), 200, true),
          libraryJsxs('div', {style: {display: 'flex', flexWrap: 'wrap', gap: 6}, children: Object.keys(visualPresets).map(key => libraryButton(t('visualPreset_' + key), () => change({appearance: {...visualPresets[key]}}), {key}))}),
          colorField('visualAccent', 'accent'), colorField('visualSurface', 'surface'),
          libraryJsxs('div', {style: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}, children: [numberField('visualFontSize', 'fontSize', [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]), numberField('visualCorners', 'cornerRadius', [0, 4, 8, 12, 16, 20, 24, 28])]}),
          numberField('visualWidth', 'contentWidth', [600, 640, 720, 800, 880, 960, 1040, 1120, 1200])
        ]}),
        libraryJsx(VisualModPreview, {appearance: draft.appearance, t})
      ]}),
      libraryJsxs('div', {style: {display: 'flex', gap: 8, flexWrap: 'wrap'}, children: [libraryButton(t('visualSaveApply'), () => saveDraft(true), {color: 'primary'}), libraryButton(t('save'), () => saveDraft(false)), libraryButton(t('cancel'), () => {setDraft(null); setTab('installed'); setError('');})]}),
      !preferences.modsEnabled ? libraryJsx('p', {style: {fontSize: 12, opacity: .65}, children: t('visualMasterHint')}) : null
    ]}) : null,
    !importOpen && !exportMod && tab !== 'community' ? feedback : null,
    publishMod ? libraryJsx(CommunityPublishDialog, {mod: publishMod, i18n, Dialog: VisualPackageDialog, Preview: ModPackagePreview, onClose: () => setPublishMod(null)}) : null,
    importOpen ? libraryJsx(VisualPackageDialog, {title: t('visualImport'), onClose: closeImport, t, children: libraryJsxs('div', {style: {display: 'grid', gap: 14}, children: [
      libraryJsx('p', {style: {fontSize: 13, opacity: .75}, children: t('visualImportHint')}),
      libraryJsx('input', {ref: fileRef, type: 'file', accept: '.codexmod.json,.json,application/json', style: {display: 'none'}, onChange: event => {const file = event.target.files?.[0]; if (file) readFile(file); event.target.value = '';}}),
      libraryButton(t('visualChooseFile'), () => fileRef.current.click(), {disabled: busy}),
      libraryJsxs('details', {children: [libraryJsx('summary', {style: {fontSize: 13, cursor: 'pointer'}, children: t('visualPaste')}), libraryJsx('textarea', {'aria-label': t('visualPackageText'), value: packageText, maxLength: visualFileLimit, rows: 5, onChange: event => {++readSequence.current; setBusy(false); setIncoming(null); setPackageText(event.target.value); setError('');}, style: {...fieldStyle, fontFamily: 'monospace', margin: '10px 0'}}), libraryButton(t('visualReview'), () => review(packageText), {disabled: busy})]}),
      incoming ? libraryJsxs('div', {style: {display: 'grid', gap: 12}, children: [libraryJsx('h3', {style: {fontWeight: 600}, children: incoming.name}), libraryJsx('p', {style: {fontSize: 12, opacity: .7}, children: [incoming.author, `v${incoming.version}`, t(modKind(incoming) === 'functional' ? 'functionalType' : 'visualType')].filter(Boolean).join(' · ')}), incoming.description ? libraryJsx('p', {children: incoming.description}) : null, libraryJsx(ModPackagePreview, {mod: incoming, t}), library.mods.some(mod => mod.id === incoming.id) ? libraryJsx('p', {style: {fontSize: 13}, children: t('visualDuplicateHint')}) : null, libraryButton(t(library.mods.some(mod => mod.id === incoming.id) ? 'visualInstallCopy' : 'visualInstall'), install, {disabled: busy || !!readError, color: 'primary'})]}) : null,
      feedback
    ]})}) : null,
    exportMod ? libraryJsx(VisualPackageDialog, {title: t('visualExport'), onClose: () => {setExportMod(null); setError('');}, t, children: libraryJsxs('div', {style: {display: 'grid', gap: 14}, children: [
      libraryJsx('h3', {style: {fontWeight: 600}, children: exportMod.name}), libraryJsx('p', {style: {fontSize: 13, opacity: .7}, children: t('visualExportHint')}), libraryJsx('code', {style: {fontSize: 12, overflowWrap: 'anywhere'}, children: modFilename(exportMod)}), libraryJsxs('div', {style: {display: 'flex', gap: 8, flexWrap: 'wrap'}, children: [libraryButton(t('visualSaveFile'), downloadPackage, {color: 'primary'}), libraryButton(t('visualCopyPackage'), copyPackage)]}), feedback
    ]})}) : null
  ]});
}
