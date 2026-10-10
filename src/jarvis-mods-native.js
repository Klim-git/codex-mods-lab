import {
  PCn as getReact, Agn as getJsx,
  $T as Toggle, QT as initToggle,
  _S as SettingsRow, bS as initRow,
  lS as SettingsRows, uS as initRows,
  Ck as Button, Tk as initButton
} from './app-shared-737655e1fb23.js';
import {defaults, warningThresholds, bookmarkShortcuts, readPreferences, writePreferences, announcePreferenceChange} from './jarvis-mods-state.js';

import {useModsI18n} from './jarvis-mods-i18n.js';
import {VisualModsLibrary} from './jarvis-visual-mods-library.js';

initToggle(); initRow(); initRows(); initButton();
const React = getReact();
const {jsx, jsxs} = getJsx();

function select(props, value, options, onChange, label) {
  return jsx('select', {...props, 'aria-label': label, value, onChange: event => onChange(event.target.value), className: 'rounded-md border px-3 py-2 text-sm', style: {background: 'transparent', color: 'inherit', maxWidth: '100%'}, children: options.map(option => jsx('option', {value: option.value, style: {backgroundColor: 'Canvas', color: 'CanvasText'}, children: option.label}, option.value))});
}

function contextIcon() {
  return jsxs('svg', {width: 28, height: 28, viewBox: '0 0 28 28', fill: 'none', 'aria-hidden': true, children: [
    jsx('rect', {x: 3, y: 5, width: 22, height: 18, rx: 5, stroke: 'currentColor', strokeWidth: 1.5}),
    jsx('rect', {x: 7, y: 13, width: 14, height: 5, rx: 2.5, fill: 'currentColor', opacity: 0.15}),
    jsx('rect', {x: 7, y: 13, width: 9, height: 5, rx: 2.5, fill: '#45b982'}),
    jsx('path', {d: 'M7 10H15', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round'})
  ]});
}

export function JarvisModsPanel() {
  const {language, t} = useModsI18n();
  React.useEffect(() => { console.info('[kliment-mods] native_settings_panel_mounted'); }, []);
  const [initial] = React.useState(() => {
    try { return {values: readPreferences(window.localStorage), error: ''}; }
    catch { return {values: {...defaults}, error: 'preferencesReadError'}; }
  });
  const [values, setValues] = React.useState(initial.values);
  const [error, setError] = React.useState(initial.error);
  const [status, setStatus] = React.useState('');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [bookmarksSettingsOpen, setBookmarksSettingsOpen] = React.useState(false);
  function save(patch, reset = false) {
    try {
      const next = writePreferences(window.localStorage, patch, reset);
      setValues(next); setError(''); setStatus(reset ? 'preferencesReset' : 'preferencesSaved');
      announcePreferenceChange();
    } catch { setError('preferencesSaveError'); setStatus(''); }
  }
  const effectiveEnabled = values.modsEnabled && values.contextBarEnabled;
  const modStatus = !values.contextBarEnabled ? t('off') : values.modsEnabled ? t('on') : t('paused');
  const hint = !values.modsEnabled ? t('contextMasterHint')
    : !values.contextBarEnabled ? t('contextDisabledHint')
    : t('contextUnknownHint');
  const contextCard = jsx('section', {'data-kliment-mod-card': 'context-bar', 'aria-labelledby': 'kliment-context-card-title', children: jsxs(SettingsRows, {children: [
    jsx(SettingsRow, {icon: contextIcon(), label: jsxs('span', {className: 'flex flex-wrap items-center gap-2', children: [
      jsx('span', {id: 'kliment-context-card-title', children: t('contextBar')}),
      jsx('span', {'data-kliment-mod-status': 'context-bar', className: 'rounded-md px-2 py-0.5 text-xs font-normal', style: {backgroundColor: effectiveEnabled ? 'rgba(69, 185, 130, 0.12)' : 'var(--color-background-primary-soft-alpha)', color: effectiveEnabled ? '#45b982' : 'var(--color-text-secondary)'}, children: modStatus})
    ]}), description: t('contextDescription'), control: props => jsxs('div', {className: 'flex items-center gap-3', children: [
      jsx(Button, {color: 'secondary', size: 'actionSm', 'aria-label': settingsOpen ? t('contextCollapse') : t('contextConfigure'), 'aria-expanded': settingsOpen, 'aria-controls': 'kliment-context-card-settings', onClick: () => setSettingsOpen(!settingsOpen), children: settingsOpen ? t('collapse') : t('configure')}),
      jsx(Toggle, {...props, checked: values.contextBarEnabled, onChange: value => save({contextBarEnabled: value})})
    ]})}),
    ...(settingsOpen ? [jsxs('div', {id: 'kliment-context-card-settings', 'data-kliment-mod-settings': 'context-bar', children: [
      jsx(SettingsRows, {variant: 'flat', children: [
        jsx(SettingsRow, {label: t('contextWarning'), description: t('contextWarningDescription'), control: props => jsx(Toggle, {...props, checked: values.contextWarningEnabled, onChange: value => save({contextWarningEnabled: value})})}),
        jsx(SettingsRow, {label: t('contextThreshold'), description: t('contextThresholdDescription'), control: props => select(props, values.contextWarningThreshold, warningThresholds.map(value => ({value, label: `${value}%`})), value => save({contextWarningThreshold: Number(value)}), t('contextThreshold'))})
      ]}),
      jsxs('div', {className: 'flex flex-wrap items-center justify-between gap-3 px-4 py-3', children: [
        jsx('p', {className: 'text-xs text-secondary', style: {flex: '1 1 260px'}, children: hint}),
        jsx(Button, {color: 'secondary', size: 'actionSm', 'aria-label': t('contextReset'), onClick: () => save({contextBarEnabled: defaults.contextBarEnabled, contextWarningEnabled: defaults.contextWarningEnabled, contextWarningThreshold: defaults.contextWarningThreshold}), children: t('reset')})
      ]})
    ]})] : [])
  ]})});
  const bookmarksActive = values.modsEnabled && values.bookmarksEnabled;
  const bookmarksStatus = !values.bookmarksEnabled ? t('off') : values.modsEnabled ? t('on') : t('paused');
  const bookmarksCard = jsx('section', {'data-kliment-mod-card': 'bookmarks', 'aria-labelledby': 'kliment-bookmarks-card-title', children: jsxs(SettingsRows, {children: [
    jsx(SettingsRow, {icon: jsx('svg', {width: 28, height: 28, viewBox: '0 0 28 28', fill: 'none', 'aria-hidden': true, children: jsx('path', {d: 'M8 5H20V24L14 20L8 24V5Z', stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round'})}), label: jsxs('span', {className: 'flex flex-wrap items-center gap-2', children: [
      jsx('span', {id: 'kliment-bookmarks-card-title', children: t('bookmarks')}),
      jsx('span', {'data-kliment-mod-status': 'bookmarks', className: 'rounded-md px-2 py-0.5 text-xs font-normal', style: {backgroundColor: bookmarksActive ? 'rgba(69, 185, 130, 0.12)' : 'var(--color-background-primary-soft-alpha)', color: bookmarksActive ? '#45b982' : 'var(--color-text-secondary)'}, children: bookmarksStatus})
    ]}), description: t('bookmarksDescription'), control: props => jsxs('div', {className: 'flex items-center gap-3', children: [
      jsx(Button, {color: 'secondary', size: 'actionSm', 'aria-label': bookmarksSettingsOpen ? t('bookmarksCollapse') : t('bookmarksConfigure'), 'aria-expanded': bookmarksSettingsOpen, 'aria-controls': 'kliment-bookmarks-card-settings', onClick: () => setBookmarksSettingsOpen(!bookmarksSettingsOpen), children: bookmarksSettingsOpen ? t('collapse') : t('configure')}),
      jsx(Toggle, {...props, checked: values.bookmarksEnabled, onChange: value => save({bookmarksEnabled: value})})
    ]})}),
    ...(bookmarksSettingsOpen ? [jsxs('div', {id: 'kliment-bookmarks-card-settings', 'data-kliment-mod-settings': 'bookmarks', children: [
      jsx(SettingsRows, {variant: 'flat', children: [
        jsx(SettingsRow, {label: t('bookmarkIcons'), description: t('bookmarkIconsDescription'), control: props => jsx(Toggle, {...props, checked: values.bookmarkShowIcons, onChange: value => save({bookmarkShowIcons: value})})}),
        jsx(SettingsRow, {label: t('bookmarkShortcut'), description: t('bookmarkShortcutDescription'), control: props => select(props, values.bookmarkShortcut, bookmarkShortcuts.map(value => ({value, label: value === 'Нет' ? t('none') : value})), value => save({bookmarkShortcut: value}), t('bookmarkShortcut'))})
      ]}),
      jsxs('div', {className: 'flex flex-wrap items-center justify-between gap-3 px-4 py-3', children: [
        jsx('p', {className: 'text-xs text-secondary', style: {flex: '1 1 260px'}, children: t('bookmarkResetHint')}),
        jsx(Button, {color: 'secondary', size: 'actionSm', 'aria-label': t('bookmarksReset'), onClick: () => save({bookmarksEnabled: defaults.bookmarksEnabled, bookmarkShowIcons: defaults.bookmarkShowIcons, bookmarkShortcut: defaults.bookmarkShortcut}), children: t('reset')})
      ]})
    ]})] : [])
  ]})});
  return jsxs('div', {className: 'flex flex-col gap-5', 'data-kliment-mods-panel': '1', lang: language, children: [
    jsxs(SettingsRows, {children: [
      jsx(SettingsRow, {label: t('language'), description: t('languageDescription'), control: props => select(props, values.modsLanguage, [{value: 'auto', label: t('languageAuto')}, {value: 'ru', label: 'Русский'}, {value: 'en', label: 'English'}], value => save({modsLanguage: value}), t('language'))}),
      jsx(SettingsRow, {label: t('enableMods'), description: t('enableModsDescription'), control: props => jsx(Toggle, {...props, checked: values.modsEnabled, onChange: value => save({modsEnabled: value})})})
    ]}),
    jsxs(VisualModsLibrary, {preferences: values, i18n: {language, t}, onActivity: () => setStatus(''), children: [contextCard, bookmarksCard]}),
    error ? jsxs('div', {className: 'flex flex-col items-start gap-3', children: [
      jsx('p', {role: 'alert', className: 'text-sm', children: t(error)}),
      jsx(Button, {color: 'secondary', size: 'actionSm', onClick: () => save({}, true), children: t('restore')})
    ]}) : jsx('p', {role: 'status', 'aria-live': 'polite', className: 'text-sm text-secondary', children: status ? t(status) : ''})
  ]});
}
