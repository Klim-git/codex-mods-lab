import {PCn as getVisualReact, Agn as getVisualJsx} from './app-shared-737655e1fb23.js';
import {parsePreferences, preferenceSnapshot, subscribePreferences} from './jarvis-mods-state.js';
import {parseVisualLibrary, visualSnapshot, subscribeVisualLibrary, visualStylesheet} from './jarvis-visual-mods-state.js';

export function JarvisVisualStylesRoot() {
  const React = getVisualReact();
  const preferences = React.useSyncExternalStore(subscribePreferences, preferenceSnapshot, () => null);
  const raw = React.useSyncExternalStore(subscribeVisualLibrary, visualSnapshot, () => null);
  let mod;
  try {
    if (!parsePreferences(preferences).modsEnabled) return null;
    const library = parseVisualLibrary(raw);
    mod = library.mods.find(item => item.id === library.activeId);
  } catch { return null; }
  if (!mod) return null;
  return getVisualJsx().jsx('style', {'data-kliment-visual-active': mod.id, children: visualStylesheet(mod.appearance)});
}
