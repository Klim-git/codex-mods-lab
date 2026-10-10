import {PCn as getFunctionalReact, Agn as getFunctionalJsx, Ck as FunctionalButton, Tk as initFunctionalButton} from './app-shared-737655e1fb23.js';
import {parsePreferences, preferenceSnapshot, subscribePreferences} from './jarvis-mods-state.js';
import {parseFunctionalLibrary, functionalSnapshot, subscribeFunctionalLibrary, functionalShortcutMatches, validateFunctionalMod} from './jarvis-functional-mods-state.js';
import {useModsI18n} from './jarvis-mods-i18n.js';
initFunctionalButton();
const FunctionalReact = getFunctionalReact(), {jsx: functionalJsx, jsxs: functionalJsxs} = getFunctionalJsx();
const functionalEditorSelector = '.ProseMirror[contenteditable="true"],[contenteditable="true"][role="textbox"],textarea';
// Stay inside this composer's chat. Never search another panel or a hidden conversation.
export function functionalChatSurface(root) {
  let fallback = null;
  for (let node = root?.parentElement; node && node !== document.body; node = node.parentElement) {
    const editors = [...node.querySelectorAll(functionalEditorSelector)].filter(editor => editor.getClientRects().length && !editor.disabled && editor.getAttribute('contenteditable') !== 'false');
    if (editors.length > 1) break;
    if (editors.length !== 1) continue;
    fallback ??= {container: node, editor: editors[0]};
    if (node.querySelector('[data-kliment-message-role]')) return {container: node, editor: editors[0]};
    if (node.getAttribute('role') === 'main') break;
  }
  return fallback;
}
export function functionalResponseText(target) {
  const copy = target.cloneNode(true);
  copy.querySelectorAll('button,[role="button"],[data-kliment-bookmark-message]').forEach(node => node.remove());
  copy.querySelectorAll('p,pre,li,blockquote,h1,h2,h3,h4,br').forEach(node => node.appendChild(document.createTextNode('\n')));
  return copy.textContent.replace(/\n{3,}/g, '\n\n').trim();
}
export async function runFunctionalAction(action, surface, clipboard = navigator.clipboard) {
  // Revalidate the bounded action immediately before executing our own fixed implementation.
  const safe = validateFunctionalMod({id: 'runtime', version: '1.0.0', name: 'runtime', description: '', author: '', actions: [action]}).actions[0];
  if (!surface?.editor?.isConnected) throw Error('functionalNoChat');
  const {container, editor} = surface;
  if (safe.kind === 'focus-input') {editor.focus(); return 'functionalFocused';}
  if (safe.kind === 'insert-text') {
    editor.focus();
    if (editor.tagName === 'TEXTAREA') {
      const text = (editor.value ? editor.value + '\n' : '') + safe.text;
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(editor, text);
      editor.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'insertText', data: safe.text}));
      editor.setSelectionRange(text.length, text.length);
    } else {
      const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      if (!document.execCommand('insertText', false, (editor.innerText.trim() ? '\n' : '') + safe.text)) throw Error('functionalActionFailed');
    }
    return 'functionalInserted';
  }
  const selector = safe.kind === 'copy-last-response' ? '[data-kliment-message-role="assistant"]' : '[data-kliment-message-role]';
  const messages = [...container.querySelectorAll(selector)].filter(node => node.getClientRects().length);
  const target = safe.target === 'first' ? messages[0] : messages.at(-1);
  if (!target) throw Error('functionalNoResponse');
  if (safe.kind === 'copy-last-response') {
    const text = functionalResponseText(target);
    if (!text || text.length > 500000) throw Error('functionalNoResponse');
    try {await clipboard.writeText(text);} catch {throw Error('functionalCopyFailed');}
    return 'functionalCopied';
  }
  target.scrollIntoView({block: safe.target === 'first' ? 'start' : 'end', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  return 'functionalScrolled';
}
export function functionalActionBindings(library) {
  const bindings = library.mods.filter(mod => library.enabledIds.includes(mod.id)).flatMap(mod => mod.actions.map(action => ({mod, action})));
  const counts = new Map(); bindings.forEach(({action}) => {if (action.shortcut) counts.set(action.shortcut, (counts.get(action.shortcut) ?? 0) + 1);});
  return bindings.map(binding => ({...binding, conflict: !!binding.action.shortcut && counts.get(binding.action.shortcut) > 1}));
}
export function JarvisFunctionalActionsRoot({isDocument}) {
  const {t, language} = useModsI18n();
  const preferences = FunctionalReact.useSyncExternalStore(subscribePreferences, preferenceSnapshot, () => null);
  const raw = FunctionalReact.useSyncExternalStore(subscribeFunctionalLibrary, functionalSnapshot, () => null);
  const root = FunctionalReact.useRef(null), busy = FunctionalReact.useRef(false), alive = FunctionalReact.useRef(true);
  const [status, setStatus] = FunctionalReact.useState(''), [error, setError] = FunctionalReact.useState(false);
  let bindings = [];
  try {if (!isDocument && parsePreferences(preferences).modsEnabled) bindings = functionalActionBindings(parseFunctionalLibrary(raw));} catch {}
  async function run(binding) {
    if (busy.current) return;
    busy.current = true; setStatus(''); setError(false);
    try {const result = await runFunctionalAction(binding.action, functionalChatSurface(root.current)); if (alive.current) setStatus(result);}
    catch (cause) {if (alive.current) {setError(true); setStatus(['functionalNoChat', 'functionalNoResponse', 'functionalCopyFailed'].includes(cause.message) ? cause.message : 'functionalActionFailed');}}
    finally {busy.current = false;}
  }
  FunctionalReact.useEffect(() => {alive.current = true; return () => {alive.current = false;};}, []);
  FunctionalReact.useEffect(() => {
    if (!bindings.length) return;
    const keydown = event => {
      if (document.querySelector('dialog[open]')) return;
      const surface = functionalChatSurface(root.current);
      if (!surface?.container.contains(document.activeElement)) return;
      const binding = bindings.find(item => !item.conflict && functionalShortcutMatches(event, item.action.shortcut));
      if (binding) {event.preventDefault(); event.stopPropagation(); run(binding);}
    };
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [raw, preferences, isDocument]);
  if (!bindings.length) return null;
  return functionalJsxs('div', {ref: root, lang: language, 'data-kliment-functional-toolbar': '1', style: {margin: '8px 12px 4px', display: 'grid', gap: 6}, children: [
    functionalJsxs('div', {role: 'toolbar', 'aria-label': t('functionalActions'), style: {display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 128, overflowY: 'auto'}, children: bindings.map(binding => functionalJsx(FunctionalButton, {color: 'secondary', size: 'actionSm', title: `${binding.mod.name}${binding.action.shortcut ? ' · ' + (binding.conflict ? t('functionalShortcutConflict') : binding.action.shortcut) : ''}`, 'aria-label': binding.action.label, onClick: () => run(binding), children: binding.action.label}, binding.mod.id + ':' + binding.action.id))}),
    status ? functionalJsx('span', {role: error ? 'alert' : 'status', 'aria-live': 'polite', style: {fontSize: 12, color: error ? '#ef8c87' : 'var(--color-text-secondary)'}, children: t(status)}) : null
  ]});
}
