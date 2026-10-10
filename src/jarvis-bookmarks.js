import {PCn as getReact, Agn as getJsx, Ck as Button, Tk as initButton} from './app-shared-737655e1fb23.js';
import {defaults, parsePreferences, preferenceSnapshot, subscribePreferences} from './jarvis-mods-state.js';
import {parseBookmarks, bookmarkSnapshot, subscribeBookmarks, changeBookmark, announceBookmarks, messageExcerpt, matchesBookmarkShortcut} from './jarvis-bookmarks-state.js';

import {useModsI18n} from './jarvis-mods-i18n.js';

initButton();
const React = getReact();
const {jsx, jsxs} = getJsx();
const BookmarkContext = React.createContext(null);

function bookmarkIcon(filled = false) {
  return jsx('svg', {width: 16, height: 16, viewBox: '0 0 20 20', 'aria-hidden': true, fill: filled ? 'currentColor' : 'none', children: jsx('path', {d: 'M5 3.5A1.5 1.5 0 0 1 6.5 2h7A1.5 1.5 0 0 1 15 3.5V18l-5-3-5 3V3.5Z', stroke: 'currentColor', strokeWidth: 1.4, strokeLinejoin: 'round'})});
}

export function findBookmarkTarget(container, unitKey) {
  if (!container) return null;
  for (const element of container.querySelectorAll('[data-content-search-unit-key]')) {
    if (element.dataset.contentSearchUnitKey === unitKey) return element;
  }
  return null;
}

export function JarvisBookmarkMessageButton({unitKey, turnKey, role, item}) {
  const context = React.useContext(BookmarkContext);
  if (!context?.enabled || !context.preferences.bookmarkShowIcons || !unitKey || !turnKey || !['user', 'assistant'].includes(role)) return null;
  const {t} = context.i18n;
  const saved = context.entries.some(entry => entry.unitKey === unitKey);
  const label = saved ? t('bookmarkRemoveMessage') : t('bookmarkAdd');
  return jsx('div', {'data-kliment-bookmark-message': unitKey, style: {display: 'flex', justifyContent: 'flex-end', marginTop: 2}, children: jsx(Button, {
    color: saved ? 'ghostActive' : 'ghostTertiary', size: 'compact', uniform: true, radius: 'small',
    'aria-label': label, 'aria-pressed': saved, title: label,
    onClick: event => { event.stopPropagation(); context.change({action: saved ? 'remove' : 'add', unitKey, turnKey, role, excerpt: messageExcerpt(item)}); },
    children: bookmarkIcon(saved)
  })});
}

function BookmarksDialog({entries, open, onClose, onNavigate, onChange, error, busy, i18n}) {
  const {language, t} = i18n;
  const dialog = React.useRef(null);
  const [editing, setEditing] = React.useState(null);
  const [draft, setDraft] = React.useState('');
  React.useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    if (!open) setEditing(null);
  }, [open]);
  return jsxs('dialog', {ref: dialog, 'data-kliment-bookmarks-dialog': '1', lang: language, 'aria-labelledby': 'kliment-bookmarks-dialog-title', onClose, onCancel: onClose,
    style: {position: 'fixed', inset: 0, margin: 'auto', height: 'fit-content', width: 'min(440px, calc(100vw - 48px))', maxHeight: '72vh', padding: 0, borderRadius: 18, border: '1px solid var(--color-border, #444)', background: 'var(--color-background-primary, #202020)', color: 'var(--color-text, #eee)'},
    children: [
      jsxs('div', {className: 'flex items-center justify-between gap-3 px-5 py-4', children: [
        jsx('h2', {id: 'kliment-bookmarks-dialog-title', className: 'text-base font-medium', children: t('bookmarksDialog', {count: entries.length})}),
        jsx(Button, {color: 'ghost', size: 'compact', 'aria-label': t('bookmarksClose'), onClick: onClose, children: '✕'})
      ]}),
      jsx('div', {style: {overflowY: 'auto', maxHeight: '50vh', padding: '0 20px 16px'}, children: entries.length ? entries.map(entry => jsxs('div', {className: 'border-t border-default py-3', children: [
        jsx('span', {className: 'text-xs text-secondary', children: entry.role === 'user' ? t('userMessage') : t('assistantResponse')}),
        editing === entry.unitKey ? jsxs('form', {className: 'mt-2 flex flex-wrap items-center gap-2', onSubmit: event => {event.preventDefault(); if(onChange({action: 'rename', unitKey: entry.unitKey, title: draft})) setEditing(null);}, children: [
          jsx('input', {autoFocus: true, 'aria-label': t('bookmarkTitle'), maxLength: 120, value: draft, onChange: event => setDraft(event.target.value), className: 'min-w-0 flex-1 rounded-lg border border-default px-3 py-2 text-sm', style: {background: 'transparent', color: 'inherit'}}),
          jsx(Button, {type: 'submit', color: 'secondary', size: 'actionSm', disabled: !draft.trim(), children: t('save')}),
          jsx(Button, {color: 'ghost', size: 'actionSm', onClick: () => setEditing(null), children: t('cancel')})
        ]}) : jsx('button', {type: 'button', disabled: busy, 'aria-label': t('bookmarkJump', {title: entry.title}), className: 'mt-1 block w-full text-left text-sm font-medium', style: {overflowWrap: 'anywhere'}, onClick: () => onNavigate(entry), children: entry.title}),
        entry.excerpt && entry.excerpt !== entry.title ? jsx('p', {className: 'mt-1 line-clamp-2 text-xs text-secondary', children: entry.excerpt}) : null,
        jsxs('div', {className: 'mt-2 flex items-center gap-2', children: [
          jsx(Button, {color: 'ghost', size: 'actionSm', disabled: busy, 'aria-label': t('bookmarkRename', {title: entry.title}), onClick: () => {setDraft(entry.title); setEditing(entry.unitKey);}, children: t('rename')}),
          jsx(Button, {color: 'ghost', size: 'actionSm', disabled: busy, 'aria-label': t('bookmarkRemove', {title: entry.title}), onClick: () => onChange({action: 'remove', unitKey: entry.unitKey}), children: t('remove')})
        ]})
      ]}, entry.unitKey)) : jsx('p', {className: 'py-3 text-sm text-secondary', children: t('bookmarksEmpty')})}),
      busy || error ? jsx('p', {role: error ? 'alert' : 'status', className: 'px-5 pb-4 text-sm text-secondary', children: error ? t(error) : t('openingMessage')}) : null
    ]});
}

export function JarvisBookmarksSurface({conversationKey, getContainer, onNavigate, showLauncher = true, children}) {
  const i18n = useModsI18n();
  const {t} = i18n;
  const rawPreferences = React.useSyncExternalStore(subscribePreferences, preferenceSnapshot, () => null);
  const rawBookmarks = React.useSyncExternalStore(subscribeBookmarks, bookmarkSnapshot, () => null);
  let preferences, allEntries, storageError = '';
  try { preferences = parsePreferences(rawPreferences); } catch { preferences = {...defaults}; }
  try { allEntries = parseBookmarks(rawBookmarks); } catch { allEntries = []; storageError = 'bookmarksReadError'; }
  const entries = allEntries.filter(entry => entry.conversationKey === conversationKey);
  const enabled = preferences.modsEnabled && preferences.bookmarksEnabled;
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [launcherPosition, setLauncherPosition] = React.useState({top: 92, right: 24});
  const adapter = React.useRef({getContainer, onNavigate});
  adapter.current = {getContainer, onNavigate};
  React.useEffect(() => { if (!enabled) setOpen(false); }, [enabled]);
  React.useEffect(() => {
    if (!enabled || !showLauncher) return;
    let viewport = null, observer = null, frame = null;
    const update = () => {
      if (!viewport) return;
      const bounds = viewport.getBoundingClientRect();
      setLauncherPosition({top: Math.max(92, bounds.top + 8), right: Math.max(16, window.innerWidth - bounds.right + 16)});
    };
    const attach = () => {
      const container = adapter.current.getContainer();
      if (!container) {frame = window.requestAnimationFrame(attach); return;}
      viewport = container;
      for (let parent = container.parentElement; parent; parent = parent.parentElement) {
        if (['auto', 'scroll'].includes(window.getComputedStyle(parent).overflowY)) {viewport = parent; break;}
      }
      update();
      observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
      observer?.observe(viewport);
    };
    attach();
    window.addEventListener('resize', update);
    return () => {if (frame !== null) window.cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('resize', update);};
  }, [enabled, showLauncher, conversationKey]);
  React.useEffect(() => {
    if (!enabled || !showLauncher) return;
    const keydown = event => { if (matchesBookmarkShortcut(event, preferences.bookmarkShortcut)) {event.preventDefault(); event.stopPropagation(); setOpen(value => !value);} };
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [enabled, showLauncher, preferences.bookmarkShortcut]);
  function change(patch) {
    try { changeBookmark(window.localStorage, {...patch, conversationKey, defaultTitle: t(patch.role === 'user' ? 'userMessage' : 'assistantResponse')}); announceBookmarks(); setError(''); return true; }
    catch { setError('bookmarksSaveError'); return false; }
  }
  async function navigate(entry) {
    setBusy(true); setError('');
    try {
      let target = findBookmarkTarget(adapter.current.getContainer(), entry.unitKey);
      if (!target) { await adapter.current.onNavigate(entry); target = findBookmarkTarget(adapter.current.getContainer(), entry.unitKey); }
      if (!target) throw new Error('Bookmark message is unavailable');
      setOpen(false);
      target.scrollIntoView({block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({preventScroll: true});
      target.animate?.([{outline: '2px solid #45b982', outlineOffset: '4px'}, {outline: '2px solid transparent', outlineOffset: '4px'}], {duration: 1400});
    } catch { setError('bookmarkUnavailable'); }
    finally { setBusy(false); }
  }
  return jsx(BookmarkContext.Provider, {value: {enabled, preferences, entries, change, i18n}, children: jsxs(React.Fragment, {children: [
    children,
    enabled && showLauncher ? jsxs(React.Fragment, {children: [
      jsx('style', {children: 'dialog[data-kliment-bookmarks-dialog]::backdrop{background:rgba(0,0,0,.45)}'}),
      jsx('div', {'data-kliment-bookmarks-launcher': '1', style: {position: 'fixed', ...launcherPosition, zIndex: 40}, children: jsx(Button, {color: 'secondary', size: 'actionSm', 'aria-label': t('bookmarksOpen', {count: entries.length}), title: preferences.bookmarkShortcut === 'Нет' ? t('bookmarksTooltip') : `${t('bookmarksTooltip')} · ${preferences.bookmarkShortcut}`, onClick: () => setOpen(true), children: jsxs('span', {className: 'flex items-center gap-1.5', children: [bookmarkIcon(), t('bookmarksCount', {count: entries.length})]})})}),
      jsx(BookmarksDialog, {entries, open, onClose: () => setOpen(false), onNavigate: navigate, onChange: change, error: error || storageError, busy, i18n})
    ]}) : null,
    error && !open ? jsx('div', {role: 'alert', style: {position: 'fixed', bottom: 20, right: 24, maxWidth: 360, zIndex: 40, padding: 12, borderRadius: 12, background: 'var(--color-background-primary, #202020)', color: 'var(--color-text, #eee)'}, children: t(error)}) : null
  ]})});
}
